// 青山乐谱 · a composed demo score for the film.
// Each row is one bar. Bass dashes give the roots (C · A · D · G · E→A · D→G), so the six rows walk a
// gentle progression and the last row hangs on G, resolving to C on the end card.
// [type, size, row, step, k (pitch: half-gaps above the staff's middle line), rotation, x-jitter, y-jitter]
// step = where the sticker starts (its centre for dots/spirals/triangles, its left end for dashes/waves/drums).
const FLAT=-1.8; // staves are printed at a slight slope; "flat" means parallel to them
const ARR=[
  // row 1 · C
  ['circle','L',0, 0, -3,   0, 16,  .5],
  ['dash',  'L',0, 2,  2, FLAT+.5, 6, -.4],
  ['circle','S',0, 6, -1,   0, -8,  .6],
  ['spiral','S',0,10,  0,   0, 10, -.5],
  ['tri',   'S',0,13, -1,   5,  4,  .3],
  // row 2 · Am
  ['dash',  'L',1, 0,  1, FLAT-.4,12,  .4],
  ['wave',  'S',1, 4,  0, FLAT+2,-4, -.6],
  ['circle','S',1, 8,  1,   0,  6,  .2],
  ['spiral','S',1,10, -1,   0, -6, -.4],
  ['scallop','S',1,12, 0, FLAT+1, 5,  .5],
  // row 3 · D (sus)
  ['dash',  'S',2, 0,  3, FLAT+.6,10, -.3],
  ['tri',   'L',2, 4, -2,  -8, -6,  .4],
  ['circle','L',2, 8, -2,   0,  8, -.5],
  ['wave',  'L',2,11.4,0, -24,  0,   0],
  // row 4 · G
  ['dash',  'L',3, 0,  1, -14,  8,  .3],
  ['circle','S',3, 6,  0,   0, -10, .5],
  ['scallop','L',3, 8, 2, FLAT-.6,6, -.4],
  ['tri',   'S',3,13, -1,   7, -4,  .6],
  // row 5 · Em → Am
  ['dash',  'S',4, 0, -1, FLAT+.4,12, .2],
  ['wave',  'S',4, 2.6,-1,FLAT-2, 0, -.5],
  ['spiral','L',4, 6, -1,   0,  -6, .4],
  ['dash',  'S',4, 8,  1, FLAT-.5, 6, -.3],
  ['tri',   'S',4,12, -3,  -6,   8, .5],
  // row 6 · D → G
  ['dash',  'S',5, 0,  3, FLAT+.3,10, -.2],
  ['tri',   'L',5, 2,  1, 172,  12, .3],
  ['dash',  'S',5, 8,  0, FLAT-.4, 4,  .4],
  ['spiral','S',5, 9.6,-3,  0,   0, -.4],
  ['scallop','S',5,12, 0, FLAT+.8, 6, -.3],
  ['circle','L',5,14.2,-2,  0,   0,  .3],
];
const W16=(X1-X0)/16;
function buildArrangement(){
  return ARR.map(([t,s,row,step,k,r,jx,jy],i)=>{
    const half=EXT[t][s],head=t==='dash'||t==='wave'||t==='scallop';
    let x=X0+step*W16+jx;                                   // centre (dots) or left end (lines)
    if(head)x+=half*Math.cos(r*Math.PI/180);                 // → centre of the line
    const y=staffY(row,x)-k*GAP/2+jy;
    return{id:'a'+(i+1),t,s,x:+x.toFixed(1),y:+y.toFixed(1),r}});
}
