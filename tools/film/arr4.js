// 青山乐谱 · the film's demo score, arranged for flow and groove (sounds = the website's own rules).
// Bars: C · Am · D · G · Em→Am · D→G, then the end card lands on C (the bass walk in the last row arrives on it).
// Odd rows: chord on 1, bass pushed to the "and" of 1, a melody note, a 16th-note run, a bass fill into the next bar.
// Even rows: root + fifth in the bass, harp ripple, a backbeat drum phrase in the second half.
// [type, size, row, step, k, rotation, x-jitter, y-jitter]   step = centre (dots/spirals/triangles) or left end (dashes/waves/drums)
const FLAT=-1.8;
const ARR=[
  // 1 · C — starts on the downbeat
  ['circle','L',0, 0,  -3,   0, 16,  .5],     // C E A
  ['dash',  'L',0, 2,   2, FLAT+.4, 6, -.4],  // C3, held
  ['circle','S',0, 6,  -1,   0, -8,  .6],     // E5
  ['tri',   'L',0, 8,  -3, -14,  4,  .3],     // C5 E5 A5 C6
  ['dash',  'S',0,10.2, 0, FLAT-20, 0,  0],   // fill E2 G2 A2
  ['spiral','S',0,12.7, 0,   0,  0, -.5],     // bell on 13
  // 2 · Am
  ['dash',  'S',1, 0,   1, FLAT+.5,10,  .3],  // A2
  ['wave',  'S',1, 2,   1, FLAT+1.5,0, -.4],  // harp ripple
  ['circle','S',1, 5.7, 1,   0,  0,  .3],     // A5
  ['dash',  'S',1, 6.6,-1, FLAT-.4, 0,  .4],  // E2 (on 8)
  ['scallop','L',1, 8.4, 0, FLAT+.6, 0, -.3], // K.HKS.KS
  ['tri',   'S',1,14.3,-3,   9,  0,  .4],     // C5 / C6 pickup
  // 3 · D — chord pushed to beat 2
  ['dash',  'L',2, 0,   3, FLAT-.3,10,  .3],  // D3
  ['circle','L',2, 4,  -2,   0,  0, -.4],     // D G C
  ['tri',   'L',2, 7.2,-2,  10,  0,  .4],     // D5 G5 C6 D6
  ['dash',  'S',2,10.2, 1, FLAT+20, 0,  0],   // fill C3 A2 G2
  ['scallop','S',2,12.4, 0, FLAT+.7, 0, -.3], // KHSH
  ['circle','S',2,15,  -2,   0, -4, -.5],     // D5 pickup
  // 4 · G
  ['dash',  'L',3, 0.3, 1, -14,  0,  .3],     // walk G2 A2 C3
  ['wave',  'S',3, 2.6, 0, FLAT-1.5,0, -.5],  // harp ripple
  ['circle','S',3, 6.4, 0,   0,  0,  .5],     // G5
  ['scallop','L',3, 8, 2, FLAT-.6,-6, -.4],   // toms + snare
  ['wave',  'L',3,11.6, 0, -23,  0,   0],     // harp sweep up into row 5
  // 5 · Em → Am — the peak
  ['circle','L',4, 0,  -1,   0, -2,  .4],     // E A D
  ['dash',  'S',4, 2,   4, FLAT+.4, 0, -.3],  // E2
  ['spiral','L',4, 4.2, 1,   0,  0,  .4],     // bell + echoes
  ['tri',   'L',4, 6.6,-1, -20,  0,  .3],     // E5 A5 D6 E6
  ['dash',  'S',4, 8,   1, FLAT-.4, 2, -.3],  // A2
  ['scallop','S',4,11.6, 0, FLAT+.8, 0, -.3], // fill
  // 6 · D → G → (C on the end card) — densest, a cadence
  ['dash',  'S',5, 0,   3, FLAT+.3,10, -.2],  // D3
  ['tri',   'L',5, 2.4, 1, 165,  0,  .3],     // A5 E5 C5 A4, falling
  ['circle','L',5, 6,  -2,   0,  0,  .3],     // D G C, pushed
  ['dash',  'L',5, 8,   1, -14,  4,  .3],     // walk G2 A2 → C3 on the next downbeat
  ['spiral','S',5,10.4,-4,   0,  0, -.4],     // bell
  ['scallop','S',5,12.2, 0, -32,  0,   0],    // tom run up
  ['circle','S',5,14.6, 2,   0,  0,  .3],     // C6 → home
];
const W16=(X1-X0)/16;
function buildArrangement(){
  return ARR.map(([t,s,row,step,k,r,jx,jy],i)=>{
    const half=EXT[t][s],head=t==='dash'||t==='wave'||t==='scallop';
    let x=X0+step*W16+jx;
    if(head)x+=half*Math.cos(r*Math.PI/180);
    const y=staffY(row,x)-k*GAP/2+jy;
    return{id:'a'+(i+1),t,s,x:+x.toFixed(1),y:+y.toFixed(1),r}});
}
