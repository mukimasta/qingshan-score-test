// ================= geometry (measured from 硫酸纸.pdf, 153 mm → 1000 units) =================
const STAFF_C=[211.9,329.4,446.9,564.4,682.2,799.4],SLOPE=-0.0313,X0=63,X1=936,GAP=8.1,PU=11.5;
const staffY=(i,x)=>STAFF_C[i]+SLOPE*(x-500);
const HEX={circle:'#ed163c',dash:'#e67a22',spiral:'#eee207',wave:'#33b540',tri:'#3ca5d7',scallop:'#5e268a'};
const EXT={circle:{L:39,S:20},spiral:{L:30,S:15},tri:{L:49,S:19},dash:{L:68,S:33},scallop:{L:73,S:36},wave:{L:84,S:39}};
const DASH={L:{n:13,p:10.6},S:{n:6,p:11}};
const WAVE={L:{len:167,gap:19,amp:7,wl:37,w:5.5},S:{len:78,gap:8.5,amp:3.2,wl:17,w:2.8}};

// every sticker as a list of path parts, shared by the SVG view and the poster canvas
function parts(t,s){
  const c=HEX[t],P=[];
  if(t==='circle'){const r=EXT.circle[s];P.push({d:`M${-r},0a${r},${r} 0 1,0 ${2*r},0a${r},${r} 0 1,0 ${-2*r},0Z`,fill:c})}
  if(t==='spiral'){const R=EXT.spiral[s]-(s==='L'?3:1.6),n=90,turns=2.6;let d='';for(let i=0;i<=n;i++){const th=i/n*turns*2*Math.PI,r=R*i/n;d+=(i?'L':'M')+(r*Math.cos(th)).toFixed(1)+','+(r*Math.sin(th)).toFixed(1)}P.push({d,stroke:c,w:s==='L'?5.5:2.8})}
  if(t==='tri'){const b=s==='L'?48.5:18.5,h=s==='L'?13.5:5.5;P.push({d:`M${-b},${h}L${b},${h}L0,${-h}Z`,fill:c})}
  if(t==='dash'){const{n,p}=DASH[s],span=(n-1)*p;P.push({d:`M${-span/2-8},-8h${span+16}v16h${-(span+16)}Z`,fill:'rgba(255,255,255,.42)'});for(let i=0;i<n;i++){const x=-span/2+i*p-3.25;P.push({d:`M${x.toFixed(1)},-3.25h6.5v6.5h-6.5Z`,fill:c})}}
  if(t==='scallop'){const r=s==='L'?18.25:9,base=s==='L'?2.5:1.3;P.push({d:`M${-4*r},${r/2-base}h${8*r}v${base}h${-8*r}Z`,fill:c});for(let i=0;i<4;i++){const cx=-3*r+i*2*r;P.push({d:`M${cx-r},${r/2}A${r},${r} 0 0 1 ${cx+r},${r/2}Z`,fill:c})}}
  if(t==='wave'){const W=WAVE[s];for(const k of [-1,0,1]){let d='';const n=60;for(let i=0;i<=n;i++){const x=-W.len/2+W.len*i/n,y=k*W.gap+Math.sin((x+W.len/2)/W.wl*2*Math.PI)*W.amp;d+=(i?'L':'M')+x.toFixed(1)+','+y.toFixed(1)}P.push({d,stroke:c,w:W.w})}}
  return P;
}
function soundPoints(st){
  const{t,s}=st;
  if(t==='dash'){const{n,p}=DASH[s],span=(n-1)*p;return[[-span/2,0],[span/2,0]]}
  if(t==='wave'){const l=WAVE[s].len/2;return[[-l,0],[l,0]]}
  if(t==='scallop'){const r=s==='L'?18.25:9;return[0,1,2,3].map(i=>[-3*r+i*2*r,0])}
  return[[0,0]];
}
const toWorld=(st,[px,py])=>{const a=st.r*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return[st.x+px*c-py*s,st.y+px*s+py*c]};
const nearestStaff=(x,y)=>{let b=0;for(let i=1;i<6;i++)if(Math.abs(y-staffY(i,x))<Math.abs(y-staffY(b,x)))b=i;return b};

// ================= example data (laid out from the sample photo) =================
const RAW=[['dash','S',800,198,0],['spiral','L',300,265,0],['wave','L',395,385,-78],['tri','S',455,342,60],['circle','S',585,338,0],['scallop','L',820,332,-12],['circle','S',200,470,0],['scallop','L',345,500,40],['spiral','S',505,460,0],['tri','L',780,452,-8],['dash','S',895,500,-55],['dash','S',445,530,60],['dash','S',125,585,20],['wave','S',250,592,-25],['spiral','L',565,575,0],['dash','L',525,622,55],['dash','L',765,580,-75],['dash','S',235,650,15],['circle','L',330,690,0],['scallop','S',405,720,-35],['circle','S',880,690,0],['dash','L',712,760,-75],['wave','L',275,808,0],['circle','L',570,825,0]];
const OLD=[205,330,455,575,700,820];
let uid=1;
const SAMPLE_STICKERS=RAW.map(([t,s,x,y,r])=>{let i=0;for(let k=1;k<6;k++)if(Math.abs(y-OLD[k])<Math.abs(y-OLD[i]))i=k;const nx=X0+(x-110)*(X1-X0)/790;return{id:'k'+(uid++),t,s,x:nx,y:staffY(i,nx)+(y-OLD[i]),r}});
const PREFIX='今天印象最深刻的声音是';
const EXAMPLE={stickers:SAMPLE_STICKERS,route:'A 线',name:'雨后的竹林路',date:'2026-10-08',weather:'阴',thought:'今天印象最深刻的声音是竹林里有人在锯木头，和溪水的声音混在一起，忽远忽近。',author:'一位路过的人',public:true,example:true};
// the record being made in this session (same shape as what the server will store)
let record={stickers:SAMPLE_STICKERS,route:'',name:'',date:new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10),weather:'',thought:'',author:'',public:false};
const readingOrder=st=>{const i=nearestStaff(st.x,st.y);return i*10000+st.x};

// ================= score rendering =================
const NS='http://www.w3.org/2000/svg';
function el(tag,a,p){const e=document.createElementNS(NS,tag);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function drawScore(svg,stickers){
  svg.innerHTML='';
  const g=el('g',{},svg);
  STAFF_C.forEach((_,s)=>{for(let i=-2;i<=2;i++)el('line',{x1:X0,x2:X1,y1:staffY(s,X0)+i*GAP,y2:staffY(s,X1)+i*GAP,stroke:'#8f8e89','stroke-width':1.2},g)});
  el('image',{href:'assets/sheet-head.png',x:HEAD.x,y:HEAD.y,width:HEAD.w,height:HEAD.h},g);   // printed logo + title, cut from 硫酸纸.pdf
  el('image',{href:'assets/sheet-foot.png',x:FOOT.x,y:FOOT.y,width:FOOT.w,height:FOOT.h},g);
  const gs=el('g',{},svg),nodes=new Map();
  for(const st of stickers){
    const o=el('g',{class:'sticker',transform:`translate(${st.x.toFixed(1)} ${st.y.toFixed(1)}) rotate(${st.r.toFixed(1)})`},gs);
    const b=el('g',{class:'body'},o);
    for(const p of parts(st.t,st.s))el('path',p.fill?{d:p.d,fill:p.fill}:{d:p.d,fill:'none',stroke:p.stroke,'stroke-width':p.w,'stroke-linecap':'round','stroke-linejoin':'round'},b);
    nodes.set(st.id,b);
  }
  const ph=el('line',{x1:X0,x2:X0,y1:0,y2:0,stroke:'#ed163c','stroke-width':3.5,'stroke-linecap':'round',opacity:0},svg);
  return{nodes,ph};
}
// where the printed header and footer sit on the 153 mm sheet (1000 units)
const HEAD={x:328.2,y:51.7,w:343.6,h:78.2},FOOT={x:299.4,y:912.1,w:401.1,h:30.2};
const loadImg=src=>new Promise(ok=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>ok(null);i.src=src});
const IMGS=Promise.all(['assets/sheet-head.png','assets/sheet-foot.png','assets/logo.png'].map(loadImg));
// (old drawn logo kept unused)
function logoPath(x,y){const d=[];for(let i=0;i<4;i++)d.push(`M${x},${y+12+i*9}h120`);d.push(`M${x+18},${y}v60M${x+45},${y+6}v54M${x+78},${y}v62M${x+104},${y+18}v26M${x+122},${y+10}v20`);return d.join('')}
function logo(g,x,y){el('path',{d:logoPath(x,y),stroke:'#3a3a37','stroke-width':1.6,fill:'none'},g)}

// kit marks behind each translucent sheet, so the paper reads as see-through
const lines=(n,x1,y1,x2,y2,dy,c,o)=>`<g stroke="${c}" stroke-width="1.2" opacity="${o}">${Array.from({length:n},(_,i)=>`<line x1="${x1}" y1="${y1+i*dy}" x2="${x2}" y2="${y2+i*dy}"/>`).join('')}</g>`;
const MARKS={
  intro:`<circle cx="345" cy="62" r="42" fill="#ed163c"/><path d="M28 330 L118 248 L150 340 Z" fill="#33b540"/>${lines(7,-20,150,420,70,7,'#33b540',.75)}${lines(5,150,352,420,282,6,'#ed163c',.7)}<path d="M300 336 l12 -12 l12 12 l12 -12 l12 12 l12 -12" fill="none" stroke="#ed163c" stroke-width="3"/><circle cx="34" cy="40" r="14" fill="none" stroke="#ed163c" stroke-width="3"/>`,
  result:`<circle cx="352" cy="300" r="56" fill="#ed163c"/>${lines(6,-10,120,330,40,7,'#33b540',.7)}<path d="M20 372 l12 -12 l12 12 l12 -12 l12 12 l12 -12 l12 12" fill="none" stroke="#ed163c" stroke-width="3"/><path d="M330 44 L372 12 L384 52 Z" fill="#33b540"/>`,
  save:`<circle cx="300" cy="120" r="96" fill="#33b540" opacity=".9"/>${lines(6,-30,300,330,210,8,'#ed163c',.6)}<path d="M20 70 l12 -12 l12 12 l12 -12 l12 12" fill="none" stroke="#ed163c" stroke-width="3"/>`,
  listen:`<circle cx="62" cy="70" r="50" fill="#33b540"/><circle cx="104" cy="92" r="30" fill="#ed163c" style="mix-blend-mode:multiply"/>${lines(5,200,330,420,360,6,'#ed163c',.65)}<path d="M300 40 l12 -12 l12 12 l12 -12 l12 12" fill="none" stroke="#33b540" stroke-width="3"/>`
};
document.querySelectorAll('.marks').forEach(m=>m.innerHTML=MARKS[m.dataset.v]||'');

// ================= sound: row by row, instrument mode (from the sound lab) =================
let STICKERS=[];
// ================= music model =================
// pitch: half a line-gap per scale step, measured from the middle line of the sticker's staff
const PENT=[0,2,4,7,9];                    // C major pentatonic (宫商角徵羽)
const midiOf=(k,oct)=>{const i=k+3,o=Math.floor(i/5);return 60+12*o+PENT[((i%5)+5)%5]+(oct||0)}; // k=0 → G4
const kAt=(x,y,staff)=>Math.max(-10,Math.min(10,Math.round((staffY(staff,x)-y)/(GAP/2))));
const stepAt=x=>Math.max(0,Math.min(15.99,(x-X0)/(X1-X0)*16));
const hash=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))|0;return Math.abs(h)};
const GROUP={circleS:'木琴',circleL:'钢琴',wave:'竖琴',dash:'贝斯',scallop:'鼓',spiral:'钟',tri:'8-bit'};

// one sticker → notes, with times in 16th-note steps relative to its row start
function stickerNotes(st,staff){
  const big=st.s==='L',half=EXT[st.t][st.s],out=[];
  const [a,b]=[toWorld(st,[-half,0]),toWorld(st,[half,0])].sort((p,q)=>p[0]-q[0]);
  const sA=stepAt(a[0]),sB=stepAt(b[0]),kA=kAt(a[0],a[1],staff),kB=kAt(b[0],b[1],staff);
  const s0=stepAt(st.x),k0=kAt(st.x,st.y,staff);
  const add=(o)=>out.push({id:st.id,...o});
  switch(st.t){
    case 'circle':
      if(big){[0,2,4].forEach((d,i)=>add({inst:'piano',s:s0,dt:i*.012,m:midiOf(k0+d,-12),v:.75,dur:2.6,g:'circleL'}))}
      else{add({inst:'marimba',s:s0,m:midiOf(k0,12),v:.7,g:'circleS'});if(hash(st.id)%2)add({inst:'marimba',s:s0+1,m:midiOf(k0+1,12),v:.55,g:'circleS'})}
      break;
    case 'wave':{ // harp run in one direction: rising/falling with the slope, flat goes up; steeper = wider steps
      const n=big?8:5,dk=kB-kA,flat=Math.abs(dk)<2,dir=flat?1:Math.sign(dk),stp=flat?1:Math.max(1,Math.min(3,Math.round(Math.abs(dk)/(n-1))));
      const k1=flat?k0-2:kA,span=sB-sA,gap=span<1?.25:Math.max(span/(n-1),.5);
      for(let i=0;i<n;i++)add({inst:'harp',s:sA+i*gap,m:midiOf(k1+dir*stp*i,big?0:12),v:(big?.8:.55)*(1-i*.03),g:'wave'});
      break}
    case 'dash':{ // bass: flat dash = one held note; tilted dash = a quick walk from its left end's height to its right end's, repeats merged
      const fold=m=>{while(m>50)m-=12;while(m<31)m+=12;return m},v=big?.85:.6;
      const D=Math.max(-5,Math.min(5,Math.round((kB-kA)*.35)));
      if(!D){add({inst:'bass',s:sA,m:fold(midiOf(k0,-24)),v,dur:big?6:4,g:'dash'});break}
      const hitsAt=big?[0,2,4,6,8,10]:[0,2,4],end=hitsAt[hitsAt.length-1]+2,seq=[];
      hitsAt.forEach((o,i)=>{const m=fold(midiOf(Math.round(k0-D/2+D*i/(hitsAt.length-1)),-24));
        if(seq.length&&seq[seq.length-1].m===m)return;seq.push({o,m})});
      seq.forEach((n,i)=>add({inst:'bass',s:sA+n.o,m:n.m,v:v*(i?.85:1),dur:((seq[i+1]?seq[i+1].o:end)-n.o)+.25,g:'dash'}));
      break}
    case 'scallop':{ // drum phrase; height picks the kit, a steep slope turns it into a tom fill
      const len=big?8:4,v=big?.9:.6,steep=Math.abs(kB-kA)>=3;
      if(steep){for(let i=0;i<len;i++)add({inst:'tom',s:sA+i,m:midiOf(Math.round(kA+(kB-kA)*i/(len-1)),-12),v:v*(i%2?.75:1),g:'scallop'});break}
      const P=k0>=2?(big?'TtSttSSt':'StTS'):k0<=-2?(big?'KK.KS.KK':'K.KS'):(big?'K.HKS.KS':'KHSH');
      [...P].forEach((c,i)=>{if(c!=='.')add({inst:{K:'kick',S:'snare',H:'hat',T:'tom',t:'tom'}[c],s:sA+i,m:midiOf(k0+(c==='T'?4:2),-12),v:v*(c==='H'?.5:1),g:'scallop'})});
      break}
    case 'spiral':
      add({inst:'bell',s:s0,m:midiOf(k0,12),v:big?.8:.55,dur:big?3.4:1.6,g:'spiral'});
      (big?[[3,.5],[6,.3],[9,.17]]:[[3,.42],[6,.2]]).forEach(([d,g])=>add({inst:'bell',s:s0+d,m:midiOf(k0,12),v:(big?.8:.55)*g,dur:big?2.2:1.2,g:'spiral'}));
      break;
    case 'tri':{ // 8-bit motif; apex pointing down plays it falling
      const down=Math.cos(st.r*Math.PI/180)<0,seq=big?[0,2,4,5]:[0,5];
      seq.forEach((d,i)=>add({inst:'chip',s:s0+i,m:midiOf(k0+(down?-d:d),12),v:big?.75:.55,g:'tri'}));
      break}
  }
  return out;
}
// which other staves a sticker physically reaches (for the echo)
function touched(st,primary){
  const half=EXT[st.t][st.s],pts=[];for(let i=-4;i<=4;i++)pts.push(toWorld(st,[half*i/4,0]));
  if(st.t==='circle'||st.t==='spiral')pts.push([st.x,st.y-half],[st.x,st.y+half]);
  const set=new Set();for(const[x,y]of pts)for(let s=0;s<6;s++)if(s!==primary&&Math.abs(y-staffY(s,x))<=GAP*2+4)set.add(s);
  return[...set];
}
const opts={scan:'row',mode:'inst',quant:'on',beat:'on',bpm:84,style:'qs',amb:'off',bass:'synth',blue:'xylo'};
const applyMode=()=>{opts.amb=opts.mode==='nature'?'on':'off'};
const PASS_ALL=64; // "all rows" sweeps the page over 4 bars
function buildEvents(){
  const ev=[];
  for(const st of STICKERS){
    const staff=nearestStaff(st.x,st.y),notes=stickerNotes(st,staff);
    // quantise only where a sticker starts; notes inside it (harp runs, drum phrases) keep their own spacing
    const head0=Math.min(...notes.map(n=>n.s)),headPos=opts.scan==='all'?stepAt(st.x)*PASS_ALL/16+(head0-stepAt(st.x)):head0,shift=opts.quant==='on'?Math.round(headPos)-headPos:(Math.random()-.5)*.12;
    const place=(n,row,gain)=>{let s=headPos+(n.s-head0)+shift;if(n.inst==='bass')s=Math.round(s/2)*2; // bass sits on the eighth-note grid
      const at=(opts.scan==='row'?row*16:0)+s;
      ev.push({...n,at,v:n.v*gain*(.9+Math.random()*.2)})};
    for(const n of notes)place(n,staff,1);
    if(opts.scan==='row')for(const r of touched(st,staff))for(const n of notes)place(n,r,.42);
  }
  const last=STICKERS.length?Math.max(...STICKERS.map(st=>nearestStaff(st.x,st.y))):0;
  const bars=opts.scan==='row'?last+1:PASS_ALL/16;
  if(opts.scan==='row'){const end=bars*16+2;for(let i=ev.length-1;i>=0;i--)if(ev[i].at>=end)ev.splice(i,1)}
  if(opts.beat==='on'&&opts.style==='qs')for(let b=0;b<bars;b++){const o=b*16;
    [[0,'bkick',.5],[10,'bkick',.3]].forEach(([s,i,v])=>ev.push({inst:i,at:o+s,v,g:'beat'}));
    for(let s=0;s<16;s+=2)ev.push({inst:'bhat',at:o+s+(s%4?.08:0),v:s%4?.14:.22,g:'beat'})}
  else if(opts.beat==='on')for(let b=0;b<bars;b++){const o=b*16;
    [[0,'bkick',.55],[6,'bkick',.35],[8,'bkick',.5],[4,'brim',.35],[12,'brim',.35]].forEach(([s,i,v])=>ev.push({inst:i,at:o+s,v,g:'beat'}));
    for(let s=0;s<16;s+=2)ev.push({inst:'bhat',at:o+s,v:s%4?.16:.24,g:'beat'})}
  return{ev:ev.sort((a,b)=>a.at-b.at),total:bars*16};
}

// ================= synth =================
let ctx,master,verb,delay,noise;const ksCache=new Map();
function audio(){
  if(ctx){if(ctx.state!=='running')ctx.resume();return}
  ctx=new(window.AudioContext||window.webkitAudioContext)();
  try{const a=document.createElement('audio');a.loop=true;a.src=silentWav();a.play().catch(()=>{})}catch(e){}
  const comp=ctx.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=3;comp.attack.value=.005;comp.release.value=.2;comp.connect(ctx.destination);
  master=ctx.createGain();master.gain.value=.85;const shelf=ctx.createBiquadFilter();shelf.type='highshelf';shelf.frequency.value=4500;shelf.gain.value=-5;const top=ctx.createBiquadFilter();top.type='lowpass';top.frequency.value=9000;master.connect(shelf);shelf.connect(top);top.connect(comp); // take the edge off everything
  verb=ctx.createConvolver();const L=ctx.sampleRate*2.6,ir=ctx.createBuffer(2,L,ctx.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<L;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/L,3.2)}verb.buffer=ir;const vg=ctx.createGain();vg.gain.value=.32;verb.connect(vg);vg.connect(comp);
  delay=ctx.createDelay(1);const fb=ctx.createGain(),dg=ctx.createGain(),dl=ctx.createBiquadFilter();dl.type='lowpass';dl.frequency.value=3200;fb.gain.value=.32;dg.gain.value=.22;delay.connect(dl);dl.connect(fb);fb.connect(delay);dl.connect(dg);dg.connect(comp);setDelay();
  noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const nd=noise.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
}
const setDelay=()=>{if(delay)delay.delayTime.value=Math.min(.95,60/opts.bpm*.75)};
function silentWav(){const n=800,b=new ArrayBuffer(44+n),v=new DataView(b),w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};w(0,'RIFF');v.setUint32(4,36+n,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,8000,true);v.setUint16(32,1,true);v.setUint16(34,8,true);w(36,'data');v.setUint32(40,n,true);for(let i=0;i<n;i++)v.setUint8(44+i,128);return URL.createObjectURL(new Blob([b],{type:'audio/wav'}))}
const hz=m=>440*Math.pow(2,(m-69)/12);
function bus(t,v,{wet=.0,echo=0}={}){const g=ctx.createGain();g.gain.value=v;g.connect(master);if(wet){const w=ctx.createGain();w.gain.value=wet;g.connect(w);w.connect(verb)}if(echo){const e=ctx.createGain();e.gain.value=echo;g.connect(e);e.connect(delay)}return g}
function env(g,t,peak,a,d){g.gain.setValueAtTime(1e-4,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(1e-4,t+a+d)}
function osc(type,f,t,stop,dest){const o=ctx.createOscillator();o.type=type;o.frequency.value=f;o.connect(dest);o.start(t);o.stop(stop);return o}
// plucked string: Karplus–Strong rendered once per pitch, then cached
function ksBuffer(m){if(ksCache.has(m))return ksCache.get(m);const sr=ctx.sampleRate,f=hz(m),N=Math.max(2,Math.round(sr/f)),len=Math.floor(sr*2.2),buf=ctx.createBuffer(1,len,sr),d=buf.getChannelData(0);
  for(let i=0;i<N;i++)d[i]=(Math.random()*2-1)*.8;for(let i=1;i<N;i++)d[i]=(d[i]+d[i-1])*.5;
  const damp=m<55?.997:.995;for(let i=N;i<len;i++)d[i]=damp*.5*(d[i-N]+d[Math.max(0,i-N-1)]);
  ksCache.set(m,buf);return buf}
const V={
  marimba(e,t){const out=bus(t,e.v*.5,{wet:.35});const g=ctx.createGain();env(g,t,1,.002,.55);g.connect(out);
    const g2=ctx.createGain();env(g2,t,.35,.001,.12);g2.connect(out);osc('sine',hz(e.m),t,t+.7,g);osc('sine',hz(e.m)*4,t,t+.2,g2)},
  piano(e,t){const out=bus(t,e.v*.32,{wet:.45}),f=hz(e.m),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(4200,t);lp.frequency.exponentialRampToValueAtTime(900,t+1.2);lp.connect(out);
    const g=ctx.createGain();g.gain.setValueAtTime(1e-4,t);g.gain.linearRampToValueAtTime(1,t+.006);g.gain.exponentialRampToValueAtTime(.35,t+.35);g.gain.exponentialRampToValueAtTime(1e-4,t+e.dur);g.connect(lp);
    [['triangle',1,0],['triangle',1,7],['sine',2,0],['sine',3,0]].forEach(([ty,mul,det],i)=>{const o=osc(ty,f*mul,t,t+e.dur+.1,g);o.detune.value=det;if(i>1){const og=ctx.createGain();og.gain.value=i===2?.25:.08;o.disconnect();o.connect(og);og.connect(g)}})},
  harp(e,t){const s=ctx.createBufferSource();s.buffer=ksBuffer(e.m);const out=bus(t,e.v*.7,{wet:.4});const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=5000;s.connect(lp);lp.connect(out);s.start(t);s.stop(t+2.2)},
  bass(e,t){const f=hz(e.m),out=bus(t,e.v*.55,{wet:.06}),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.Q.value=3;lp.frequency.setValueAtTime(1400,t);lp.frequency.exponentialRampToValueAtTime(260,t+.25);lp.connect(out);
    const dur=e.dur*step(),g=ctx.createGain();g.gain.setValueAtTime(1e-4,t);g.gain.linearRampToValueAtTime(1,t+.008);g.gain.setValueAtTime(.8,t+Math.max(.05,dur-.06));g.gain.exponentialRampToValueAtTime(1e-4,t+dur+.08);g.connect(lp);
    osc('sawtooth',f,t,t+dur+.1,g);const sub=ctx.createGain();sub.gain.value=.8;sub.connect(g);osc('sine',f/2,t,t+dur+.1,sub)},
  kick(e,t,amt=1){const out=bus(t,e.v*amt*.95),g=ctx.createGain();env(g,t,1,.002,.32);g.connect(out);const o=osc('sine',120,t,t+.4,g);o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(42,t+.13)},
  snare(e,t,amt=1){const out=bus(t,e.v*amt*.55,{wet:.2});const n=ctx.createBufferSource();n.buffer=noise;const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=2200;bp.Q.value=.8;const g=ctx.createGain();env(g,t,1,.001,.16);n.connect(bp);bp.connect(g);g.connect(out);n.start(t,Math.random()*.5);n.stop(t+.2);
    const tg=ctx.createGain();env(tg,t,.5,.001,.08);tg.connect(out);osc('triangle',190,t,t+.12,tg)},
  hat(e,t,amt=1){const out=bus(t,e.v*amt*.35);const n=ctx.createBufferSource();n.buffer=noise;const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=7500;const g=ctx.createGain();env(g,t,1,.001,.045);n.connect(hp);hp.connect(g);g.connect(out);n.start(t,Math.random()*.5);n.stop(t+.07)},
  tom(e,t){const f=hz(e.m),out=bus(t,e.v*.7,{wet:.18}),g=ctx.createGain();env(g,t,1,.002,.34);g.connect(out);const o=osc('sine',f,t,t+.4,g);o.frequency.setValueAtTime(f*1.6,t);o.frequency.exponentialRampToValueAtTime(f,t+.06)},
  bell(e,t){const f=hz(e.m),out=bus(t,e.v*.24,{wet:.5,echo:.5}),g=ctx.createGain();env(g,t,1,.002,e.dur);g.connect(out);
    const c=osc('sine',f,t,t+e.dur+.1,g),m=ctx.createOscillator(),mg=ctx.createGain();m.frequency.value=f*3.5;mg.gain.setValueAtTime(f*1.6,t);mg.gain.exponentialRampToValueAtTime(f*.02,t+e.dur*.6);m.connect(mg);mg.connect(c.frequency);m.start(t);m.stop(t+e.dur+.1);
    const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=5.6;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(f*.012,t+.5);lfo.connect(lg);lg.connect(c.frequency);lfo.start(t);lfo.stop(t+e.dur+.1);
    const p=ctx.createGain();env(p,t,.22,.001,e.dur*.5);p.connect(out);osc('sine',f*2.76,t,t+e.dur,p)},
  chip(e,t){const f=hz(e.m),out=bus(t,e.v*.13,{wet:.15,echo:.35}),g=ctx.createGain(),d=Math.min(.16,step()*.9);g.gain.setValueAtTime(1e-4,t);g.gain.linearRampToValueAtTime(1,t+.004);g.gain.setValueAtTime(.8,t+d);g.gain.exponentialRampToValueAtTime(1e-4,t+d+.06);g.connect(out);
    const o=osc('square',f,t,t+d+.1,g),l=ctx.createOscillator(),lg=ctx.createGain();l.frequency.value=7;lg.gain.value=f*.006;l.connect(lg);lg.connect(o.frequency);l.start(t);l.stop(t+d+.1)},
  bkick(e,t){V.kick(e,t,.7)},brim(e,t){const out=bus(t,e.v*.5,{wet:.15}),g=ctx.createGain();env(g,t,1,.001,.05);g.connect(out);osc('triangle',820,t,t+.07,g);const g2=ctx.createGain();env(g2,t,.6,.001,.03);g2.connect(out);osc('square',1650,t,t+.05,g2)},
  bhat(e,t){V.hat(e,t,1)}
};
const step=()=>60/opts.bpm/4;
// ---- 青山 palette: wood, bamboo, strings, skin and bronze, all synthesised ----
function ks(m,kind){const key=kind+m;if(ksCache.has(key))return ksCache.get(key);const sr=ctx.sampleRate,f=hz(m),N=Math.max(2,Math.round(sr/f)),len=Math.floor(sr*(kind==='bass'?1.5:2.6)),buf=ctx.createBuffer(1,len,sr),d=buf.getChannelData(0);
  for(let i=0;i<N;i++)d[i]=Math.random()*2-1;
  const passes=kind==='bass'?3:kind==='zheng'?0:1;for(let p=0;p<passes;p++)for(let i=1;i<N;i++)d[i]=(d[i]+d[i-1])*.5;
  const damp=kind==='bass'?.9955:kind==='zheng'?.9968:.995;for(let i=N;i<len;i++)d[i]=damp*.5*(d[i-N]+d[Math.max(0,i-N-1)]);
  ksCache.set(key,buf);return buf}
function noiseHit(t,{type='bandpass',f=1000,q=1,peak=1,a=.001,dec=.05,dest}){const n=ctx.createBufferSource();n.buffer=noise;const fl=ctx.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=ctx.createGain();env(g,t,peak,a,dec);n.connect(fl);fl.connect(g);g.connect(dest);n.start(t,Math.random()*.5);n.stop(t+a+dec+.05)}
const Q={
  marimba(e,t){const f=hz(e.m),out=bus(t,e.v*.55,{wet:.3}),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3600;lp.connect(out);
    [[1,1,.85],[3.93,.2,.16],[9.6,.05,.05]].forEach(([r,a,d])=>{const g=ctx.createGain();env(g,t,a,.002,d);g.connect(lp);osc('sine',f*r,t,t+d+.1,g)});
    noiseHit(t,{f:Math.min(f*6,9000),q:4,peak:.25,dec:.015,dest:lp})},
  piano(e,t){const f=hz(e.m),out=bus(t,e.v*.3,{wet:.5}),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1700;lp.Q.value=.5;lp.connect(out);
    const g=ctx.createGain();g.gain.setValueAtTime(1e-4,t);g.gain.linearRampToValueAtTime(1,t+.018);g.gain.exponentialRampToValueAtTime(.4,t+.5);g.gain.exponentialRampToValueAtTime(1e-4,t+e.dur+.6);g.connect(lp);
    osc('triangle',f,t,t+e.dur+.7,g).detune.value=-4;osc('triangle',f,t,t+e.dur+.7,g).detune.value=4;const h=ctx.createGain();h.gain.value=.18;h.connect(g);osc('sine',f*2,t,t+e.dur+.7,h);
    noiseHit(t,{type:'lowpass',f:400,q:.7,peak:.3,dec:.05,dest:out})},
  harp(e,t){const f=hz(e.m),out=bus(t,e.v*.42,{wet:.45}),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2600;lp.connect(out);
    [[1,1,1.8],[2,.28,1],[3,.08,.6],[4,.03,.35]].forEach(([r,a,d])=>{const g=ctx.createGain();env(g,t,a,.004,d);g.connect(lp);osc('sine',f*r,t,t+d+.1,g)});
    noiseHit(t,{type:'lowpass',f:1200,peak:.12,dec:.02,dest:lp})},
  bass(e,t){const f=hz(e.m),dur=Math.max(.6,e.dur*step()),kind=opts.bass;
    const out=bus(t,e.v*(kind==='cello'?.32:kind==='keys'?.42:.38),{wet:kind==='cello'?.35:.2}),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.Q.value=.6;lp.connect(out);
    const g=ctx.createGain(),atk=kind==='cello'?.28:kind==='keys'?.01:.08;g.gain.setValueAtTime(1e-4,t);g.gain.linearRampToValueAtTime(1,t+atk);
    if(kind==='keys'){g.gain.exponentialRampToValueAtTime(.45,t+.6);g.gain.setValueAtTime(.45,t+dur)}else g.gain.setValueAtTime(1,t+dur);
    g.gain.exponentialRampToValueAtTime(1e-4,t+dur+.6);g.connect(lp);const end=t+dur+.7;
    if(kind==='synth'){lp.frequency.value=750;[['sawtooth',-6,.5],['sawtooth',6,.5],['sine',0,.7]].forEach(([ty,det,a])=>{const og=ctx.createGain();og.gain.value=a;og.connect(g);osc(ty,f,t,end,og).detune.value=det})}
    if(kind==='cello'){lp.frequency.value=1300;const o=osc('sawtooth',f,t,end,g),l=ctx.createOscillator(),lg=ctx.createGain();l.frequency.value=5;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(f*.007,t+.5);l.connect(lg);lg.connect(o.frequency);l.start(t);l.stop(end)}
    if(kind==='keys'){lp.frequency.value=2200;const c=osc('sine',f,t,end,g),m=ctx.createOscillator(),mg=ctx.createGain();m.frequency.value=f;mg.gain.setValueAtTime(f*1.2,t);mg.gain.exponentialRampToValueAtTime(f*.15,t+.8);m.connect(mg);mg.connect(c.frequency);m.start(t);m.stop(end);const h=ctx.createGain();h.gain.value=.25;h.connect(g);osc('sine',f*2,t,end,h)}},
  kick(e,t,amt=1){const out=bus(t,e.v*amt*.85,{wet:.12}),g=ctx.createGain();env(g,t,1,.003,.45);g.connect(out);const o=osc('sine',95,t,t+.5,g);o.frequency.setValueAtTime(95,t);o.frequency.exponentialRampToValueAtTime(60,t+.09);noiseHit(t,{type:'lowpass',f:600,peak:.3,dec:.03,dest:out})},
  snare(e,t,amt=1){const out=bus(t,e.v*amt*.5,{wet:.22});noiseHit(t,{f:1100,q:1.2,peak:1,dec:.09,dest:out});const g=ctx.createGain();env(g,t,.3,.001,.05);g.connect(out);osc('sine',360,t,t+.08,g)},
  hat(e,t,amt=1){const out=bus(t,e.v*amt*.32,{wet:.1});noiseHit(t,{type:'highpass',f:3500,peak:1,a:.012,dec:.07,dest:out})},
  tom(e,t){const f=Math.max(500,Math.min(2200,hz(e.m)*4)),out=bus(t,e.v*.6,{wet:.25}),g=ctx.createGain();env(g,t,1,.001,.07);g.connect(out);osc('sine',f,t,t+.1,g);noiseHit(t,{f,q:12,peak:.4,dec:.02,dest:out})},
  bell(e,t){const big=e.dur>2,out=bus(t,e.v*.22,{wet:.6,echo:.45});
    if(big){const f=hz(e.m)/2;[[1,1,e.dur*1.6],[2.71,.45,e.dur],[5.15,.2,e.dur*.5]].forEach(([r,a,d],i)=>{for(const beat of[-1,1]){const g=ctx.createGain();env(g,t,a*.6,.006,d);g.connect(out);osc('sine',f*r+beat*(.8+i*.6),t,t+d+.1,g)}})}
    else{const f=hz(e.m)*2;[[1,1,1.2],[2.76,.35,.6]].forEach(([r,a,d])=>{const g=ctx.createGain();env(g,t,a,.002,d);g.connect(out);osc('sine',f*r,t,t+d+.1,g)})}},
  chip(e,t){const f=hz(e.m),d=Math.min(1.6*step(),.5)+.1,out=bus(t,e.v*.3,{wet:.45}),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3000;lp.connect(out);
    const g=ctx.createGain();g.gain.setValueAtTime(1e-4,t);g.gain.linearRampToValueAtTime(1,t+.05);g.gain.setValueAtTime(.85,t+d);g.gain.exponentialRampToValueAtTime(1e-4,t+d+.18);g.connect(lp);
    const a=osc('triangle',f,t,t+d+.25,g),b=osc('sine',f,t,t+d+.25,g),l=ctx.createOscillator(),lg=ctx.createGain();l.frequency.value=5.2;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(f*.006,t+.15);l.connect(lg);lg.connect(a.frequency);lg.connect(b.frequency);l.start(t);l.stop(t+d+.25);
    noiseHit(t,{f:f*2,q:2,peak:.08,a:.05,dec:d,dest:lp})},
  bkick(e,t){Q.kick(e,t,.6)},brim(e,t){Q.tom({...e,m:84},t)},bhat(e,t){Q.hat(e,t,1)}
};
const VOICE=()=>opts.style==='qs'?Q:V;
// ---- real-instrument samples (CC BY 3.0, see the credits at the bottom) ----
const SBASE=window.SAMPLE_BASE||'samples/';let MAN=null,loading=null;const BUF={};
function loadSamples(){if(loading)return loading;loading=(async()=>{MAN=await(await fetch(SBASE+'manifest.json')).json();const jobs=[];
  for(const k in MAN)for(const m of MAN[k])jobs.push(fetch(`${SBASE}${k}/${m}.mp3`).then(r=>r.arrayBuffer()).then(b=>new Promise((ok,no)=>ctx.decodeAudioData(b,ok,no))).then(buf=>{(BUF[k]||(BUF[k]={}))[m]=buf}));
  await Promise.all(jobs)})();return loading}
function samp(k,m,t,{v=1,dest,dur=null,rel=.25,atk=0}={}){if(!MAN||!MAN[k])return;let best=MAN[k][0];for(const x of MAN[k])if(Math.abs(x-m)<Math.abs(best-m))best=x;const b=BUF[k]&&BUF[k][best];if(!b)return;
  const s=ctx.createBufferSource();s.buffer=b;const rate=Math.pow(2,(m-best)/12);s.playbackRate.value=rate;const g=ctx.createGain();if(atk){g.gain.setValueAtTime(1e-4,t);g.gain.linearRampToValueAtTime(v,t+atk)}else g.gain.setValueAtTime(v,t);
  let end=t+b.duration/rate;if(dur!=null&&t+dur<end){g.gain.setValueAtTime(v,t+dur);g.gain.exponentialRampToValueAtTime(1e-4,t+dur+rel);end=t+dur+rel}
  s.connect(g);g.connect(dest);s.start(t);s.stop(end+.05)}
const lowpass=(f,dest)=>{const l=ctx.createBiquadFilter();l.type='lowpass';l.frequency.value=f;l.connect(dest);return l};
Object.assign(Q,{
  marimba(e,t){samp('piano',e.m,t,{v:1,dest:lowpass(5200,bus(t,e.v*.85,{wet:.3}))})},           // small dot: a clear piano note
  piano(e,t){samp('piano',e.m,t,{v:1,dur:e.dur,rel:.8,dest:lowpass(4200,bus(t,e.v*.75,{wet:.4}))})}, // big dot: rolled chord
  harp(e,t){samp('harp',e.m,t,{v:1,atk:.03,dest:lowpass(1800,bus(t,e.v*.8,{wet:.5}))})},
  bass(e,t){samp('bass',e.m,t,{v:1,atk:.06,dur:e.dur*step(),rel:.45,dest:lowpass(420,bus(t,e.v*1.7,{wet:.1}))})},
  chip(e,t){if(opts.blue==='xylo')samp('xylo',e.m,t,{v:1,dest:bus(t,e.v*.72,{wet:.3})});else samp('pizz',e.m,t,{v:1,dest:bus(t,e.v*2.0,{wet:.3})})},
  hat(e,t){const out=bus(t,e.v*.55,{wet:.2}),g=ctx.createGain();env(g,t,1,.001,.05);g.connect(out);osc('sine',1900,t,t+.08,g);noiseHit(t,{f:1900,q:14,peak:.5,dec:.015,dest:out})},
  bkick(e,t){const out=bus(t,e.v*.5,{wet:.12}),g=ctx.createGain();env(g,t,1,.003,.4);g.connect(out);const o=osc('sine',90,t,t+.5,g);o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(58,t+.09)},
  bhat(e,t){const out=bus(t,e.v*.3,{wet:.1});noiseHit(t,{type:'highpass',f:3500,peak:1,a:.012,dec:.07,dest:out})}
});
let wind=null;
function startWind(t){if(wind||opts.amb!=='on')return;const L=ctx.sampleRate*4,b=ctx.createBuffer(1,L,ctx.sampleRate),d=b.getChannelData(0);let p=0;for(let i=0;i<L;i++){p=.97*p+.03*(Math.random()*2-1);d[i]=p*6}
  const n=ctx.createBufferSource();n.buffer=b;n.loop=true;const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=520;bp.Q.value=.7;const g=ctx.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.09,t+1.5);
  const l1=ctx.createOscillator(),l1g=ctx.createGain();l1.frequency.value=.07;l1g.gain.value=260;l1.connect(l1g);l1g.connect(bp.frequency);const l2=ctx.createOscillator(),l2g=ctx.createGain();l2.frequency.value=.13;l2g.gain.value=.035;l2.connect(l2g);l2g.connect(g.gain);
  n.connect(bp);bp.connect(g);g.connect(master);[n,l1,l2].forEach(x=>x.start(t));wind={n,l1,l2,g}}
function stopWind(){if(!wind)return;const t=ctx.currentTime;wind.g.gain.cancelScheduledValues(t);wind.g.gain.setValueAtTime(wind.g.gain.value,t);wind.g.gain.linearRampToValueAtTime(0,t+.8);const w=wind;setTimeout(()=>{[w.n,w.l1,w.l2].forEach(x=>{try{x.stop()}catch(e){}})},900);wind=null}


// one player per score view: scanning line + stickers pulse as they sound
const PLAY_ICO='<path d="M33 26 L56 40 L33 54 Z" fill="#33b540" transform="translate(3.5 3)" style="mix-blend-mode:multiply"/><path d="M33 26 L56 40 L33 54 Z" fill="#fff"/>';
const STOP_ICO='<g fill="#33b540" transform="translate(3 3)" style="mix-blend-mode:multiply"><rect x="29" y="27" width="8" height="26"/><rect x="43" y="27" width="8" height="26"/></g><g fill="#fff"><rect x="29" y="27" width="8" height="26"/><rect x="43" y="27" width="8" height="26"/></g>';
const fmt=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const rowsOf=sts=>sts&&sts.length?Math.max(...sts.map(st=>nearestStaff(st.x,st.y)))+1:1;
function makePlayer(host,view,getStickers){
  host.innerHTML=`<button class="play" aria-label="播放"><svg class="pv" viewBox="0 0 80 80"><g class="disc"><circle cx="40" cy="40" r="35" fill="#ed163c" filter="url(#rough)"/><circle cx="40" cy="40" r="26" fill="none" stroke="rgba(255,255,255,.28)"/><circle cx="40" cy="40" r="18" fill="none" stroke="rgba(255,255,255,.2)"/><circle cx="63" cy="25" r="2.6" fill="#fff"/></g><g class="ico">${PLAY_ICO}</g></svg></button><div class="ptrack"><div class="line"><i></i></div><div class="meta"><span><b>第 1 行</b> / <span class="nr">${rowsOf(getStickers())}</span></span><span class="tm">0:00 / ${fmt(rowsOf(getStickers())*16*step())}</span></div></div>`;
  const btn=host.querySelector('.play'),ico=btn.querySelector('.ico'),bar=host.querySelector('.line i'),rowL=host.querySelector('.meta b'),tm=host.querySelector('.tm');
  let playing=false,start=0,timer=null,plan=null,idx=0,raf=0;
  function stop(){playing=false;clearInterval(timer);cancelAnimationFrame(raf);view.ph.setAttribute('opacity',0);ico.innerHTML=PLAY_ICO;btn.classList.remove('on');btn.setAttribute('aria-label','播放')}
  async function play(){audio();playing=true;ico.innerHTML=STOP_ICO;btn.classList.add('on');btn.setAttribute('aria-label','停止');
    if(!MAN){rowL.textContent='加载乐器…';try{await loadSamples()}catch(err){rowL.textContent='乐器没加载出来';stop();return}if(!playing)return}
    STICKERS=getStickers();plan=buildEvents();idx=0;start=ctx.currentTime+.12;const sd=step();
    clearInterval(timer);timer=setInterval(()=>{const until=ctx.currentTime+.2;while(idx<plan.ev.length&&start+plan.ev[idx].at*sd+(plan.ev[idx].dt||0)<until){const e=plan.ev[idx++],at=start+e.at*sd+(e.dt||0);Q[e.inst](e,at);if(e.id)setTimeout(()=>pulse(e.id),Math.max(0,(at-ctx.currentTime)*1000))}},40);
    frame()}
  function pulse(id){const n=view.nodes.get(id);if(n&&n.animate&&playing)n.animate([{transform:'scale(1)'},{transform:'scale(1.25)'},{transform:'scale(1)'}],{duration:260,easing:'ease-out'})}
  function frame(){if(!playing)return;const sd=step(),p=(ctx.currentTime-start)/sd,total=plan.total;
    if(p>total+8){stop();bar.style.width='100%';return}
    if(p>=0&&p<=total){const row=Math.min(5,Math.floor(p/16)),x=X0+(X1-X0)*((p-row*16)/16);
      view.ph.setAttribute('x1',x);view.ph.setAttribute('x2',x);view.ph.setAttribute('y1',staffY(row,x)-50);view.ph.setAttribute('y2',staffY(row,x)+50);view.ph.setAttribute('opacity',.9);rowL.textContent=`第 ${row+1} 行`}
    else view.ph.setAttribute('opacity',0);
    tm.textContent=`${fmt(Math.max(0,Math.min(p,total))*sd)} / ${fmt(total*sd)}`;bar.style.width=Math.min(100,Math.max(0,p/total*100))+'%';
    raf=requestAnimationFrame(frame)}
  btn.onclick=()=>playing?stop():play();
  return{stop};
}
