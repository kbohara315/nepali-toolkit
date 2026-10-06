/** A rack of name cards: the chosen card rises and the read-out gives its name. */
const { Cam, clamp, facing, fillet, fit, hull, open, poly, proj, rad, ringAt, rrect, run, seg, tdone, tset, tval, tween, disposer, mk, pointer, reflect, register } = HL;
const NAMES = ["कमल", "किरण", "खगेन्द्र", "क१०", "क२", "ख१"], N = NAMES.length;
const W = 78, H = 52, G = 15, REST = -11, BACK = -22, FWD = 18, LIFT = 15;
const LR = (p) => p[0][0] <= p[p.length - 1][0] ? p : p.slice().reverse();
function mount({ stage, svg, read }, value) {
  const bag = disposer(), C = Cam(45, .5, 1.67), X0 = -4, X1 = W + 4, Y0 = -8, Y1 = (N - 1) * G + 8, WH = 18;
  fit(C, [[X0, Y0, 0], [X1, Y1, 0], [X1, Y0, 0], [X0, Y1, 0], [X0, Y0, H + LIFT + 8]], 200, 166);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg), outer = rrect(X0, Y0, X1, Y1, 6, 6), inner = rrect(X0 + 2, Y0 + 2, X1 - 2, Y1 - 2, 4, 6);
  const paths = [[poly(hull(ringAt(P, outer, 0).concat(ringAt(P, outer, WH)))), "sil"], [poly(ringAt(P, inner, WH)), "nf"], [open(ringAt(P, run(inner, q => !front(q)), 2)), "nf lo"]];
  paths.forEach(([d, cls]) => mk("path", { d, class: cls }, g));
  const cards = [];
  for (let i = 0; i < N; i++) {
    const tab = [7, 28, 49][i % 3], shape = fillet([[0,0],[W,0],[W,H],[tab+19,H],[tab+19,H+6],[tab,H+6],[tab,H],[0,H]],[1,1,3,1,2,2,1,3]);
    const grp = mk("g", {}, g), face = mk("path", { class: "sil" }, grp), back = mk("path", { class: "lo" }, grp), marks = [];
    for (let k = 0; k < 4; k++) marks.push(mk("circle", { r: 1.1, class: `dot ${i === 2 && k === 2 ? "" : k === (i % 4) ? "m" : "off"}`.trim() }, grp));
    cards.push({ i, tab, shape, face, back, marks, a: tween(REST + (i % 2) * -2), z: tween(0) });
    face.classList.toggle("hi", i === 2);
  }
  const top = i => P(W / 2, i * G + H * Math.sin(rad(REST)), H * Math.cos(rad(REST))), c0 = top(0), c1 = top(1), d = [c1[0]-c0[0], c1[1]-c0[1]], p0 = P(0,0,0), p1 = P(1,0,0), ex = [p1[0]-p0[0], p1[1]-p0[1]], det = d[0]*ex[1]-d[1]*ex[0];
  function hit([x,y]) { const qx=x-c0[0], qy=y-c0[1], s=(qx*ex[1]-qy*ex[0])/det, r=(d[0]*qy-d[1]*qx)/det; return Math.abs(r)>W/2+6||s<-.5||s>N ? -1 : clamp(Math.round(s),0,N-1); }
  function draw(c, angle, lift) { const s=Math.sin(rad(angle)), co=Math.cos(rad(angle)), w=(u,v)=>P(u,c.i*G+v*s,v*co+lift), wb=(u,v)=>P(u,c.i*G+v*s-3*co,v*co+3*s+lift); c.face.setAttribute("d",poly(c.shape.map(p=>w(...p)))); c.back.setAttribute("d",poly(c.shape.map(p=>wb(...p)))); c.marks.forEach((el,k)=>{ const q=w(c.tab+9+(k%2)*5,H+3+Math.floor(k/2)*2); el.setAttribute("cx",q[0]); el.setAttribute("cy",q[1]); }); }
  const B=register(stage,(_dt,now)=>{ let moving=false; cards.forEach(c=>{draw(c,tval(c.a,now),tval(c.z,now)); if(!tdone(c.a,now)||!tdone(c.z,now))moving=true;}); return moving; }); bag.add(B.unregister);
  let active=-1; function choose(a){if(a===active)return; const now=performance.now(), from=a>=0?a:active; active=a; cards.forEach((c,i)=>{const delay=Math.abs(i-Math.max(0,from))*value, angle=a<0?REST+(i%2)*-2:i<a?BACK:i>a?FWD:0; tset(c.a,angle,now,delay); tset(c.z,a===i?LIFT:0,now,delay); c.face.classList.toggle("hi",i===a||(a<0&&i===2)); c.marks.forEach((el,k)=>{const bright=a<0?i===2&&k===2:i===a&&k===i%4; el.setAttribute("class",bright?"dot":`dot ${k===i%4?"m":"off"}`);});}); read.textContent=a<0?"rest":NAMES[a]; B.wake(); }
  bag.add(pointer(stage,{move:p=>choose(hit(p)),leave:()=>choose(-1)})); bag.add(()=>svg.replaceChildren());
  return { set:v=>{value=v;}, destroy:bag.dispose };
}
hairline({ name:"name-rack", means:"Six name cards rest in a rack; the pointer lifts one and shows its Nepali label.", rules:[1,2,4,8,10], range:[0,32,72], mount });
