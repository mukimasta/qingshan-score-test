// ===== 青山乐谱 recognizer: photo -> stickers in sheet units (0..1000) =====
// 1) find the 30 printed staff lines (thin dark, unsaturated) with a Hough transform
// 2) group them into 6 staves, find where the staves start/end -> 12 point pairs -> homography
// 3) sample the photo back onto the flat sheet, white-balance on the paper, segment sticker colours
// 4) each colour blob -> type by colour, size by length, angle by principal axis; ignore blobs outside the staff area
const QS=(()=>{
const STAFF_C=[211.9,329.4,446.9,564.4,682.2,799.4],SLOPE=-0.0313,X0=63,X1=936,GAP=8.1;
const staffY=(i,x)=>STAFF_C[i]+SLOPE*(x-500);
// expected full length (sheet units) of each sticker along its long axis, L and S
const LEN={circle:[78,40],spiral:[60,30],tri:[97,37],dash:[134,62],scallop:[146,72],wave:[168,79]};

function toCanvas(src,maxSide){
  const w=src.videoWidth||src.naturalWidth||src.width,h=src.videoHeight||src.naturalHeight||src.height;
  const k=Math.min(1,maxSide/Math.max(w,h)),c=document.createElement('canvas');
  c.width=Math.round(w*k);c.height=Math.round(h*k);c.getContext('2d',{willReadFrequently:true}).drawImage(src,0,0,c.width,c.height);return c}

// ---------- staff lines ----------
function lineMask(d,W,H){
  const g=new Float32Array(W*H),m=new Uint8Array(W*H);
  for(let i=0,p=0;i<W*H;i++,p+=4){const r=d[p],gg=d[p+1],b=d[p+2],mx=Math.max(r,gg,b),mn=Math.min(r,gg,b);g[i]=(mx-mn)/(mx+1)>0.45?255:(r+gg+b)/3}
  const R=Math.max(2,Math.round(W/600));
  for(let y=R;y<H-R;y++)for(let x=0;x<W;x++){const i=y*W+x,v=g[i];
    const a=g[i-R*W],b=g[i+R*W];if(Math.min(a,b)-v<3)continue;
    if(v>g[i-W]||v>g[i+W])continue; // thin: local minimum across the line
    // contrast relative to brightness, so shadows still work
    if((Math.min(a,b)-v)/(Math.min(a,b)+20)<0.025)continue;m[i]=1}
  // keep only horizontal-ish streaks (kills asphalt / grain speckle)
  const o=new Uint8Array(W*H),Rx=Math.max(3,Math.round(W/300));
  for(let y=1;y<H-1;y++)for(let x=Rx;x<W-Rx;x++){const i=y*W+x;if(!m[i])continue;let c=0;
    for(let dx=-Rx;dx<=Rx;dx++)if(m[i+dx]||m[i+dx-W]||m[i+dx+W])c++;if(c>=Rx*2*0.8)o[i]=1}
  return o}

function hough(m,W,H){
  const T0=-30,T1=30,TS=0.2,NT=Math.round((T1-T0)/TS)+1,diag=Math.ceil(Math.hypot(W,H)),NR=2*diag+1;
  const sn=new Float32Array(NT),cs=new Float32Array(NT);for(let t=0;t<NT;t++){const a=(T0+t*TS)*Math.PI/180;sn[t]=Math.sin(a);cs[t]=Math.cos(a)}
  const acc=new Uint32Array(NT*NR);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(m[y*W+x])for(let t=0;t<NT;t++){const r=Math.round(-x*sn[t]+y*cs[t])+diag;acc[t*NR+r]++}
  // dominant angle first, then peaks close to it (staff lines are nearly parallel)
  let best=0,bt=0;for(let t=0;t<NT;t++){let s=0;for(let r=0;r<NR;r++){const v=acc[t*NR+r];s+=v*v}if(s>best){best=s;bt=t}}
  const tw=Math.round(4/TS),cand=[];
  for(let t=Math.max(0,bt-tw);t<=Math.min(NT-1,bt+tw);t++)for(let r=1;r<NR-1;r++){const v=acc[t*NR+r];if(v<W*0.12)continue;cand.push([v,t,r])}
  cand.sort((a,b)=>b[0]-a[0]);
  const peaks=[];
  for(const[v,t,r]of cand){if(peaks.some(p=>Math.abs(p.t-t)<=2&&Math.abs(p.r-r)<=1))continue;peaks.push({v,t,r});if(peaks.length>160)break}
  return peaks.map(p=>({v:p.v,s:sn[p.t],c:cs[p.t],rho:p.r-diag,ang:T0+p.t*TS}))}

// walk along a line, return the longest run of support (gaps up to maxGap)
function support(L,m,W,H){
  const maxGap=Math.round(W*0.06);let best=null,start=-1,last=-1,cnt=0;
  for(let x=0;x<W;x++){const y=(L.rho+x*L.s)/L.c,yi=Math.round(y);if(yi<1||yi>=H-1)continue;
    const on=m[yi*W+x]||m[(yi-1)*W+x]||m[(yi+1)*W+x];
    if(on){if(start<0||x-last>maxGap){if(start>=0&&(!best||last-start>best.b-best.a))best={a:start,b:last,n:cnt};start=x;cnt=0}last=x;cnt++}}
  if(start>=0&&(!best||last-start>best.b-best.a))best={a:start,b:last,n:cnt};
  if(!best)return best;
  // trim loose ends: the end is where the line is solid over a short window
  const on=x=>{const yi=Math.round((L.rho+x*L.s)/L.c);return yi>0&&yi<H-1&&(m[yi*W+x]||m[(yi-1)*W+x]||m[(yi+1)*W+x])?1:0};
  const win=Math.max(8,Math.round(W*0.015));
  const solid=x=>{let c=0;for(let k=0;k<win;k++)c+=on(x+k);return c>=win*0.7};
  while(best.a<best.b-win&&!solid(best.a))best.a++;
  const solidL=x=>{let c=0;for(let k=0;k<win;k++)c+=on(x-k);return c>=win*0.7};
  while(best.b>best.a+win&&!solidL(best.b))best.b--;
  return best}

function solve(A,b){const n=b.length;for(let i=0;i<n;i++){let p=i;for(let r=i+1;r<n;r++)if(Math.abs(A[r][i])>Math.abs(A[p][i]))p=r;[A[i],A[p]]=[A[p],A[i]];[b[i],b[p]]=[b[p],b[i]];
    if(Math.abs(A[i][i])<1e-12)return null;for(let r=i+1;r<n;r++){const f=A[r][i]/A[i][i];for(let c=i;c<n;c++)A[r][c]-=f*A[i][c];b[r]-=f*b[i]}}
  const x=new Array(n);for(let i=n-1;i>=0;i--){let s=b[i];for(let c=i+1;c<n;c++)s-=A[i][c]*x[c];x[i]=s/A[i][i]}return x}
// homography sheet(u,v) -> image(x,y), least squares on point pairs
function homography(P){
  const A=[],b=[];for(const[u,v,x,y]of P){A.push([u,v,1,0,0,0,-u*x,-v*x]);b.push(x);A.push([0,0,0,u,v,1,-u*y,-v*y]);b.push(y)}
  const N=Array.from({length:8},()=>new Array(8).fill(0)),r=new Array(8).fill(0);
  for(let k=0;k<A.length;k++)for(let i=0;i<8;i++){r[i]+=A[k][i]*b[k];for(let j=0;j<8;j++)N[i][j]+=A[k][i]*A[k][j]}
  const h=solve(N,r);return h&&[...h,1]}
const apply=(h,u,v)=>{const w=h[6]*u+h[7]*v+1;return[(h[0]*u+h[1]*v+h[2])/w,(h[3]*u+h[4]*v+h[5])/w]};

// robust straight line through points (x as a function of y): RANSAC + least squares
function robustXofY(pts,tol){
  if(pts.length<2)return null;let best=null;
  for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const[a,b]=[pts[i],pts[j]];if(Math.abs(b[1]-a[1])<1)continue;
    const k=(b[0]-a[0])/(b[1]-a[1]),inl=pts.filter(p=>Math.abs(a[0]+k*(p[1]-a[1])-p[0])<tol);
    if(!best||inl.length>best.length)best=inl}
  if(!best||best.length<2)return null;
  const n=best.length,my=best.reduce((s,p)=>s+p[1],0)/n,mx=best.reduce((s,p)=>s+p[0],0)/n;
  let sxy=0,syy=0;for(const p of best){sxy+=(p[1]-my)*(p[0]-mx);syy+=(p[1]-my)**2}
  const k=syy?sxy/syy:0;return{f:y=>mx+k*(y-my),n}}

function findSheet(c){
  const W=c.width,H=c.height,d=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,W,H).data;
  const m=lineMask(d,W,H),peaks=hough(m,W,H);
  // greedy by votes; a real staff line never crosses or touches another accepted line
  const yA=(p,x)=>(p.rho+x*p.s)/p.c;let L=[];
  for(const p of peaks){const sp=support(p,m,W,H);if(!sp||sp.b-sp.a<W*0.3||sp.n<(sp.b-sp.a)*0.45)continue;p.a=sp.a;p.b=sp.b;p.q=sp.n;
    if(L.some(q=>{const xa=Math.max(p.a,q.a),xb=Math.min(p.b,q.b);if(xb<=xa)return false;const d1=yA(p,xa)-yA(q,xa),d2=yA(p,xb)-yA(q,xb);return d1*d2<=0||Math.min(Math.abs(d1),Math.abs(d2))<2.2}))continue;
    L.push(p)}
  if(L.length<12)return{ok:false,why:'lines',L};
  const xm=W/2,yAt=yA;
  L.forEach(p=>p.ym=yAt(p,xm));L.sort((a,b)=>a.ym-b.ym);
  L=L.filter((p,i)=>i===0||p.ym-L[i-1].ym>1.2); // duplicates
  const diffs=L.slice(1).map((p,i)=>p.ym-L[i].ym).sort((a,b)=>a-b);
  const g=diffs[Math.floor(diffs.length*0.3)];
  // clusters = staves
  let cl=[[L[0]]];for(let i=1;i<L.length;i++){if(L[i].ym-L[i-1].ym>2.6*g)cl.push([]);cl[cl.length-1].push(L[i])}
  cl=cl.filter(s=>s.length>=3);
  if(cl.length<5)return{ok:false,why:'staves '+cl.length,L,cl,g};
  if(cl.length>6){ // keep the 6 consecutive staves with the most regular spacing
    let bi=0,bs=1e9;for(let i=0;i+6<=cl.length;i++){const cs=cl.slice(i,i+6).map(s=>s.reduce((a,p)=>a+p.ym,0)/s.length),dd=cs.slice(1).map((v,j)=>v-cs[j]),mu=dd.reduce((a,b)=>a+b)/5,sd=Math.sqrt(dd.reduce((a,b)=>a+(b-mu)**2,0)/5)/mu;if(sd<bs){bs=sd;bi=i}}
    cl=cl.slice(bi,bi+6)}
  // centre line of each staff: give each member line its index k (-2..2)
  const staves=cl.map(s=>{const gs=s.length>1?(s[s.length-1].ym-s[0].ym)/Math.max(1,Math.round((s[s.length-1].ym-s[0].ym)/g)):g;
    const ks=s.map(p=>Math.round((p.ym-s[0].ym)/gs)),span=ks[ks.length-1],off=-Math.round(span/2);
    const cen={rho:0,s:0,c:0};
    s.forEach((p,j)=>{const k=ks[j]+off;cen.s+=p.s;cen.c+=p.c;cen.rho+=p.rho-k*gs*p.c});
    cen.s/=s.length;cen.c/=s.length;cen.rho/=s.length;
    if(span%2===1)cen.rho-=0.5*gs*cen.c;
    return{cen,a:Math.min(...s.map(p=>p.a)),b:Math.max(...s.map(p=>p.b)),n:s.length,lines:s,gs,ym:yAt(cen,xm)}});
  // which printed staff is each cluster? 6 found: in order. 5 found: a doubled gap marks the missing one, else try both ends.
  const hyps=[];
  if(staves.length===6)hyps.push([0,1,2,3,4,5]);
  else{const gaps=staves.slice(1).map((st,i)=>st.ym-staves[i].ym),mg=[...gaps].sort((a,b)=>a-b)[1];const big=gaps.findIndex(v=>v>1.6*mg);
    if(big>=0)hyps.push([0,1,2,3,4,5].filter(v=>v!==big+1));else{hyps.push([0,1,2,3,4]);hyps.push([1,2,3,4,5])}}
  let best=null;
  for(const idx of hyps){const r=solveSheet(staves.map((st,j)=>({...st,idx:idx[j]})),m,W,H,yAt);if(r&&(!best||r.cover>best.cover))best=r}
  if(!best)return{ok:false,why:'edges',L,staves};
  const ok=best.err<2&&best.cover>0.3&&best.area>W*H*0.06;
  return{ok,why:ok?'':`quality ${best.err.toFixed(2)} / ${best.cover.toFixed(2)}`,...best,L,W,H}}

function solveSheet(staves,m,W,H,yAt){
  const lp=staves.map(st=>[st.a,yAt(st.cen,st.a)]),rp=staves.map(st=>[st.b,yAt(st.cen,st.b)]);
  const tol=Math.max(4,W*0.008),le=robustXofY(lp,tol),re=robustXofY(rp,tol);
  if(!le||!re||le.n<3||re.n<3)return null;
  const P=[];staves.forEach((st,j)=>{const i=st.idx;
    let x=lp[j][0];for(let k=0;k<5;k++)x=le.f(yAt(st.cen,x));P.push([X0,staffY(i,X0),x,yAt(st.cen,x)]);
    x=rp[j][0];for(let k=0;k<5;k++)x=re.f(yAt(st.cen,x));P.push([X1,staffY(i,X1),x,yAt(st.cen,x)])});
  let h=homography(P);if(!h)return null;
  h=refine(h,staves,P,W,yAt);if(!h)return null;
  const inv=invert(h);let err=0,cnt=0;
  staves.forEach(st=>st.lines.forEach(p=>{for(const x of [p.a+(p.b-p.a)*0.25,(p.a+p.b)/2,p.a+(p.b-p.a)*0.75]){const[u,v]=apply(inv,x,yAt(p,x));const dy=v-staffY(st.idx,u),k=Math.round(dy/GAP);err+=Math.abs(dy-k*GAP);cnt++}}));
  err/=cnt;
  // coverage: how much of all 30 printed lines finds ink where the map says it should be
  let hit=0,tot=0;for(let i=0;i<6;i++)for(let k=-2;k<=2;k++)for(let u=X0+5;u<=X1-5;u+=6){const[x,y]=apply(h,u,staffY(i,u)+k*GAP),xi=Math.round(x),yi=Math.round(y);tot++;
    if(xi<1||yi<1||xi>=W-1||yi>=H-1)continue;if(m[yi*W+xi]||m[(yi-1)*W+xi]||m[(yi+1)*W+xi])hit++}
  const corners=[[X0,staffY(0,X0)],[X1,staffY(0,X1)],[X1,staffY(5,X1)],[X0,staffY(5,X0)]].map(([u,v])=>apply(h,u,v));
  const area=Math.abs(corners.reduce((s,p,i)=>{const q=corners[(i+1)%4];return s+p[0]*q[1]-q[0]*p[1]},0))/2;
  return{h,inv,err,cover:hit/tot,area,staves,P,le,re}}

// Gauss-Newton on the image->sheet map: every sampled point of a detected line must sit on its printed line,
// and the staff ends on X0 / X1. Line indices k are re-assigned between rounds, so a missing outer line can't shift a staff.
function refine(h0,staves,P,W,yAt){
  const S=W; // normalise image coords
  let g=invert(h0);
  // conjugate so parameters act on normalised coords: sheet = G(x*S)
  let q=[g[0]*S,g[1]*S,g[2],g[3]*S,g[4]*S,g[5],g[6]*S,g[7]*S,g[8]].map(v=>v/g[8]);
  const pts=[];staves.forEach(st=>st.lines.forEach(p=>{const n=12;for(let j=0;j<=n;j++){const x=p.a+(p.b-p.a)*j/n;pts.push({i:st.idx,x:x/S,y:yAt(p,x)/S,line:p})}}));
  const ends=P.map(([u,v,x,y])=>({u,x:x/S,y:y/S}));
  const map=(q,x,y)=>{const w=q[6]*x+q[7]*y+1;return[(q[0]*x+q[1]*y+q[2])/w,(q[3]*x+q[4]*y+q[5])/w]};
  // per-line k from the current map (median over the line's points)
  const assign=q=>{const ks=new Map();for(const p of pts){const[u,v]=map(q,p.x,p.y);(ks.get(p.line)||ks.set(p.line,[]).get(p.line)).push((v-staffY(p.i,u))/GAP)}
    for(const[l,a]of ks){a.sort((x,y)=>x-y);l.k=Math.max(-2,Math.min(2,Math.round(a[a.length>>1])))}};
  let wts=pts.map(()=>1);
  const res=(q)=>{const r=[];pts.forEach((p,j)=>{const[u,v]=map(q,p.x,p.y);r.push(wts[j]*(v-staffY(p.i,u)-p.line.k*GAP))});ends.forEach(e=>{const[u]=map(q,e.x,e.y);r.push(0.35*(u-e.u))});return r};
  for(let round=0;round<4;round++){assign(q);
    for(let it=0;it<6;it++){const r0=res(q),J=[];for(let k=0;k<8;k++){const e=Math.abs(q[k])*1e-5+1e-6,qq=q.slice();qq[k]+=e;const r1=res(qq);J.push(r1.map((v,j)=>(v-r0[j])/e))}
      const N=Array.from({length:8},()=>new Array(8).fill(0)),b=new Array(8).fill(0);
      for(let j=0;j<r0.length;j++)for(let a=0;a<8;a++){b[a]-=J[a][j]*r0[j];for(let c=a;c<8;c++)N[a][c]+=J[a][j]*J[c][j]}
      for(let a=0;a<8;a++){for(let c=0;c<a;c++)N[a][c]=N[c][a];N[a][a]*=1.0001}
      const dq=solve(N,b);if(!dq)break;q=q.map((v,k)=>k<8?v+dq[k]:v)}
    // down-weight points far from their line (sticker edges, bends)
    const r=res(q).slice(0,pts.length).map((v,j)=>Math.abs(v)/(wts[j]||1));const md=[...r].sort((a,b)=>a-b)[r.length>>1]||1;wts=r.map(v=>v>Math.max(1.2,3*md)?0:1)}
  const G=[q[0]/S,q[1]/S,q[2],q[3]/S,q[4]/S,q[5],q[6]/S,q[7]/S,1];
  return invert(G)}
function invert(h){const[a,b,c,d,e,f,g,k,i]=h;const A=e*i-f*k,B=-(d*i-f*g),C=d*k-e*g,D=-(b*i-c*k),E=a*i-c*g,F=-(a*k-b*g),G=b*f-c*e,Hh=-(a*f-c*d),I=a*e-b*d;return[A,D,G,B,E,Hh,C,F,I].map(v=>v/I)}

// ---------- stickers ----------
const BAND=30; // how far beyond the outer staff lines a sticker may sit // valid band (half a staff spacing beyond the outer staves)
function hsv(r,g,b){const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;if(d){if(mx===r)h=((g-b)/d)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;if(h<0)h+=360}return[h,mx?d/mx:0,mx/255]}
const CLASSES=[['circle',[[335,360],[0,19]]],['dash',[[20,72]]],['wave',[[73,165]]],['tri',[[166,225]]],['scallop',[[226,339]]]];
function classOf(h){for(let i=0;i<CLASSES.length;i++)for(const[a,b]of CLASSES[i][1])if(h>=a&&h<=b)return i;return -1}

function stickers(img,sheet){
  const c=toCanvas(img,2000),W=c.width,H=c.height,k=W/sheet.W,d=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,W,H).data;
  const h=sheet.h,U0=X0-40,U1=X1+40,V0=Math.floor(staffY(0,X0)-2*GAP-110),V1=Math.ceil(staffY(5,X0)+2*GAP+110),SW=U1-U0,SH=V1-V0;
  const rgb=new Float32Array(SW*SH*3),inside=new Uint8Array(SW*SH);
  for(let v=0;v<SH;v++)for(let u=0;u<SW;u++){let[x,y]=apply(h,u+U0,v+V0);x*=k;y*=k;const xi=Math.floor(x),yi=Math.floor(y);if(xi<0||yi<0||xi>=W-1||yi>=H-1)continue;
    const fx=x-xi,fy=y-yi,o=(yi*W+xi)*4,j=(v*SW+u)*3;inside[v*SW+u]=1;
    for(let ch=0;ch<3;ch++)rgb[j+ch]=d[o+ch]*(1-fx)*(1-fy)+d[o+4+ch]*fx*(1-fy)+d[o+W*4+ch]*(1-fx)*fy+d[o+W*4+4+ch]*fx*fy}
  // local white balance: paper colour per 24-unit cell (median), so sun/shade/tinted light all become neutral
  const CS=32,GX=Math.ceil(SW/CS),GY=Math.ceil(SH/CS),bg=new Float32Array(GX*GY*3);
  for(let gy=0;gy<GY;gy++)for(let gx=0;gx<GX;gx++){const R=[],G=[],B=[];
    for(let v=gy*CS;v<Math.min(SH,gy*CS+CS);v+=2)for(let u=gx*CS;u<Math.min(SW,gx*CS+CS);u+=2){const q=v*SW+u;if(!inside[q])continue;{const r=rgb[q*3],g=rgb[q*3+1],b=rgb[q*3+2],mx=Math.max(r,g,b);if(mx-Math.min(r,g,b)>0.25*mx)continue}R.push(rgb[q*3]);G.push(rgb[q*3+1]);B.push(rgb[q*3+2])}
    const md=a=>{if(a.length<8)return NaN;a.sort((x,y)=>x-y);return a[Math.floor(a.length*0.6)]};const o=(gy*GX+gx)*3;bg[o]=md(R);bg[o+1]=md(G);bg[o+2]=md(B)}
  // fill holes + 3x3 median smoothing per channel
  const bg2=new Float32Array(bg.length);
  for(let gy=0;gy<GY;gy++)for(let gx=0;gx<GX;gx++)for(let ch=0;ch<3;ch++){const a=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=gx+dx,y=gy+dy;if(x<0||y<0||x>=GX||y>=GY)continue;const v=bg[(y*GX+x)*3+ch];if(!isNaN(v))a.push(v)}
    a.sort((p,q)=>p-q);bg2[(gy*GX+gx)*3+ch]=a.length?a[a.length>>1]:200}
  const bgAt=(u,v,ch)=>{const fx=Math.min(GX-1.001,Math.max(0,u/CS-0.5)),fy=Math.min(GY-1.001,Math.max(0,v/CS-0.5)),x=Math.floor(fx),y=Math.floor(fy),ax=fx-x,ay=fy-y,x1=Math.min(GX-1,x+1),y1=Math.min(GY-1,y+1);
    return bg2[(y*GX+x)*3+ch]*(1-ax)*(1-ay)+bg2[(y*GX+x1)*3+ch]*ax*(1-ay)+bg2[(y1*GX+x)*3+ch]*(1-ax)*ay+bg2[(y1*GX+x1)*3+ch]*ax*ay};
  const cls=new Int8Array(SW*SH).fill(-1),hue=new Float32Array(SW*SH);
  for(let v=0;v<SH;v++)for(let u=0;u<SW;u++){const i=v*SW+u;if(!inside[i])continue;
    const r=Math.min(255,rgb[i*3]/bgAt(u,v,0)*225),g=Math.min(255,rgb[i*3+1]/bgAt(u,v,1)*225),b=Math.min(255,rgb[i*3+2]/bgAt(u,v,2)*225);
    const[hh,s,vv]=hsv(r,g,b);hue[i]=hh;if(s<0.2||vv<0.22)continue;if(s<0.42&&vv<0.45)continue;cls[i]=classOf(hh)}
  // components per class after closing small gaps (dashes are rows of squares, waves are 3 strokes)
  const out=[],seen=new Uint8Array(SW*SH);
  for(let ci=0;ci<CLASSES.length;ci++){const t=CLASSES[ci][0];
    const R=t==='dash'?6:t==='wave'?9:t==='spiral'?4:t==='scallop'?3:2;
    const raw=new Uint8Array(SW*SH);for(let i=0;i<SW*SH;i++)if(cls[i]===ci)raw[i]=1;
    const dil=dilate(raw,SW,SH,R),lab=new Int32Array(SW*SH);let nl=0;
    for(let i=0;i<SW*SH;i++){if(!dil[i]||lab[i])continue;nl++;const st=[i];lab[i]=nl;const pts=[];
      while(st.length){const p=st.pop();if(raw[p])pts.push(p);const x=p%SW,y=(p/SW)|0;
        for(const q of [p-1,p+1,p-SW,p+SW]){if(q<0||q>=SW*SH)continue;const qx=q%SW;if(Math.abs(qx-x)>1)continue;if(dil[q]&&!lab[q]){lab[q]=nl;st.push(q)}}}
      let s=blob(pts,SW,U0,V0,t);
      // a dash with a spiral stuck on it: pull the yellow part out
      if(s&&s.t==='dash'&&s.wid>28){const core=thick(pts,SW,SH,dil,14),Y=pts.filter(p=>core[p]),O=pts.filter(p=>!core[p]),sp=blob(Y,SW,U0,V0,'dash'),da=blob(O,SW,U0,V0,'dash');
        if(sp&&sp.t==='spiral'&&da&&da.t==='dash'){
          // the dash runs on under the spiral: give it back the core pixels on its axis
          const a=da.r*Math.PI/180,ux=Math.cos(a),uy=Math.sin(a),cx=da.x-U0,cy=da.y-V0;
          const da2=blob(O.concat(Y.filter(p=>Math.abs(-(p%SW-cx)*uy+(((p/SW)|0)-cy)*ux)<5)),SW,U0,V0,'dash');
          out.push(sp,da2&&da2.t==='dash'?da2:da);continue}}
      if(s){if(t==='dash'){const hs=pts.map(p=>hue[p]).sort((a,b)=>a-b);s.hq=[hs[hs.length>>2]|0,hs[hs.length>>1]|0,hs[(hs.length*3)>>2]|0]}out.push(s)}else if(t==='dash'&&pts.length>150)splitDashes(pts,SW,U0,V0).forEach(d=>out.push(d))}}
  return{bgAt,stickers:out.filter(s=>s.x>=X0&&s.x<=X1&&s.y>=staffY(0,s.x)-2*GAP-BAND&&s.y<=staffY(5,s.x)+2*GAP+BAND),all:out,U0,V0,SW,SH,cls}}

// pixels of a blob that lie in a region at least ~2R wide (a spiral's disc survives, a dash's thin row does not)
function thick(pts,W,H,dil,R){let x0=1e9,x1=0,y0=1e9,y1=0;for(const p of pts){const x=p%W,y=(p/W)|0;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}
  x0=Math.max(0,x0-R-2);y0=Math.max(0,y0-R-2);x1=Math.min(W-1,x1+R+2);y1=Math.min(H-1,y1+R+2);const bw=x1-x0+1,bh=y1-y0+1,inv=new Uint8Array(bw*bh);
  for(let y=0;y<bh;y++)for(let x=0;x<bw;x++)inv[y*bw+x]=dil[(y+y0)*W+x+x0]?0:1;
  const er=dilate(inv,bw,bh,R),core=new Uint8Array(bw*bh);for(let i=0;i<bw*bh;i++)core[i]=er[i]?0:1;
  const grown=dilate(core,bw,bh,R+3),out=new Uint8Array(W*H);for(const p of pts){const x=p%W-x0,y=((p/W)|0)-y0;if(grown[y*bw+x])out[p]=1}return out}
function dilate(a,W,H,R){if(!R)return a;const t=new Uint8Array(W*H),o=new Uint8Array(W*H);
  for(let y=0;y<H;y++){let last=-1e9;for(let x=0;x<W;x++){if(a[y*W+x])last=x;if(x-last<=R)t[y*W+x]=1}last=1e9;for(let x=W-1;x>=0;x--){if(a[y*W+x])last=x;if(last-x<=R)t[y*W+x]=1}}
  for(let x=0;x<W;x++){let last=-1e9;for(let y=0;y<H;y++){if(t[y*W+x])last=y;if(y-last<=R)o[y*W+x]=1}last=1e9;for(let y=H-1;y>=0;y--){if(t[y*W+x])last=y;if(last-y<=R)o[y*W+x]=1}}
  return o}

// several dashes touching (an X, a T): peel off straight rows of squares one at a time
function splitDashes(pts,SW,U0,V0){
  let rest=pts.map(p=>[p%SW,(p/SW)|0,p]);const found=[];
  for(let round=0;round<4&&rest.length>80;round++){let best=null;
    for(let it=0;it<220;it++){const a=rest[(Math.random()*rest.length)|0],b=rest[(Math.random()*rest.length)|0],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy);if(l<20)continue;
      const nx=-dy/l,ny=dx/l;let c=0;for(const p of rest)if(Math.abs((p[0]-a[0])*nx+(p[1]-a[1])*ny)<5)c++;if(!best||c>best.c)best={c,a,nx,ny}}
    if(!best||best.c<60)break;
    const inl=[],out=[];for(const p of rest)(Math.abs((p[0]-best.a[0])*best.nx+(p[1]-best.a[1])*best.ny)<6?inl:out).push(p);
    const d=blob(inl.map(p=>p[2]),SW,U0,V0,'dash');if(d&&d.t==='dash')found.push(d);rest=out}
  return found}
function blob(pts,SW,U0,V0,t0){let t=t0;
  const n=pts.length;if(n<25)return null;
  let mx=0,my=0;for(const p of pts){mx+=p%SW;my+=(p/SW)|0}mx/=n;my/=n;
  let sxx=0,syy=0,sxy=0;for(const p of pts){const x=p%SW-mx,y=((p/SW)|0)-my;sxx+=x*x;syy+=y*y;sxy+=x*y}
  const ang=0.5*Math.atan2(2*sxy,sxx-syy),ca=Math.cos(ang),sa=Math.sin(ang);
  let a0=1e9,a1=-1e9,b0=1e9,b1=-1e9;const proj=[];
  for(const p of pts){const x=p%SW-mx,y=((p/SW)|0)-my,a=x*ca+y*sa,b=-x*sa+y*ca;proj.push([a,b]);if(a<a0)a0=a;if(a>a1)a1=a;if(b<b0)b0=b;if(b>b1)b1=b}
  const len=a1-a0+1,wid=b1-b0+1,[Lx,Sx]=LEN[t],cut=Math.sqrt(Lx*Sx);
  if(len<(t==='dash'?LEN.spiral[1]:Sx)*0.55||len>Lx*1.45)return null; // too small = specks, too big = hand / background / merged mess
  const asp=len/Math.max(1,wid);
  if(t==='dash'&&asp<2.2){t='spiral';if(len>LEN.spiral[0]*1.5)return null}
  if(t==='dash'&&n>len*wid*0.8)return null; // solid warm blob = skin / wood, not a row of squares
  if(t==='tri'&&(asp<1.8||asp>7||n<len*wid*0.25))return null;
  if(t==='scallop'&&asp<2.5)return null;
  if(t==='circle'&&asp>1.6)return null;
  const[Lx2,Sx2]=LEN[t],cut2=Math.sqrt(Lx2*Sx2);
  const s=len>cut2?'L':'S';
  let r=0;
  if(t==='dash'||t==='wave'){r=ang*180/Math.PI;if(t==='wave'&&wid>len*0.8)return null}
  if(t==='tri'||t==='scallop'){
    // the flat base side carries more ink in its outer quarter than the apex / bumps side
    const q=wid*0.25;let lo=0,hi=0;for(const[,b]of proj){if(b<b0+q)lo++;if(b>b1-q)hi++}
    r=ang*180/Math.PI+(hi>=lo?0:180)}
  if(t==='circle'||t==='spiral')r=0;
  // centre of the shape's extent (not the ink centroid) — matches how stickers are drawn
  const ca2=(a0+a1)/2,cb=(b0+b1)/2;let cx=mx+ca2*ca-cb*sa,cy=my+ca2*sa+cb*ca;
  if(t==='tri'||t==='scallop'){cx=mx+ca2*ca-cb*sa;cy=my+ca2*sa+cb*ca}
  r=((r%360)+540)%360-180;
  return{t,s,x:+(cx+U0).toFixed(1),y:+(cy+V0).toFixed(1),r:Math.round(r),len:Math.round(len),wid:Math.round(wid),n}}

function recognize(img,{maxSide=1600}={}){
  const c=toCanvas(img,maxSide),sheet=findSheet(c);sheet.W=c.width;sheet.H=c.height;if(!sheet.ok)return{ok:false,sheet};
  const st=stickers(img,sheet);return{ok:true,sheet,...st}}
function quickFind(img,maxSide=720){const c=toCanvas(img,maxSide),s=findSheet(c);s.W=c.width;s.H=c.height;return s}
return{_mask:(img,ms=1200)=>{const c=toCanvas(img,ms),d=c.getContext("2d").getImageData(0,0,c.width,c.height);const m=lineMask(d.data,c.width,c.height);for(let i=0;i<m.length;i++){const v=m[i]?0:255;d.data[i*4]=d.data[i*4+1]=d.data[i*4+2]=v}c.getContext("2d").putImageData(d,0,0);return c.toDataURL()},recognize,quickFind,apply,staffY,X0,X1,GAP,STAFF_C}})();
