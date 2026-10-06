/** A numbered strip slides into a sizing gauge; the read-out describes shape only. */
const { Cam, clamp, facing, fit, hull, poly, proj, prism, rings, tween, tset, tval, tdone, unproj, disposer, mk, pointer, put, register, solid } = HL;
const W=122, H=14, GATE=54, DEPTH=30;
function mount({stage,svg,read},value){
  let travel=value, active=false;
  const bag=disposer(), C=Cam(45,.5,1.8), x0=-W/2, x1=W/2, y0=-DEPTH/2, y1=DEPTH/2;
  fit(C,[[x0-12,y0-12,-7],[x1+12,y1+12,-7],[x1+12,y0-12,0],[x0-12,y1+12,0],[x0,y0,H+8]],200,166);
  const P=proj(C),front=facing(C),g=mk("g",{},svg),[base,bi]=rings(x0-13,y0-15,x1+13,y1+15,8,2.2);
  put(solid(g),prism(P,front,base,bi,-7,0));
  const [frame,fi]=rings(-GATE/2-8,y0-10,GATE/2+8,y1+10,5,1.5);
  put(solid(g),prism(P,front,frame,fi,0,14));
  const [mouth,mi]=rings(-GATE/2,y0-2,GATE/2,y1+2,3,1);
  put(solid(g),prism(P,front,mouth,mi,14,17));
  const strip=mk("g",{},g), segments=[];
  for(let i=0;i<10;i++){
    const sx=x0+4+i*(W-8)/10, sw=(W-8)/10-1;
    const [r,ri]=rings(sx,y0+8,sx+sw,y0+8+H,2,.7),el=solid(strip);
    put(el,prism(P,front,r,ri,4,8)); segments.push(el);
  }
  const slide=tween(-W/2+8);let drawn=null;
  const B=register(stage,(_dt,now)=>{const x=tval(slide,now);if(drawn===null||Math.abs(x-drawn)>.01){drawn=x;strip.setAttribute("transform",`translate(${P(x,0,0)[0]-P(0,0,0)[0]} ${P(x,0,0)[1]-P(0,0,0)[1]})`);}return !tdone(slide,now);}); bag.add(B.unregister);
  function choose(on){if(on===active)return;active=on;const target=on?Math.min(GATE/2-4,-W/2+8+travel):-W/2+8;tset(slide,target,performance.now(),0);read.textContent=on?"possible shape":"rest";B.wake();}
  function move(p){const [x,y]=unproj(C,p[0],p[1],0);choose(Math.abs(y)<DEPTH*.8&&x>x0-25&&x<x1+25);}
  bag.add(pointer(stage,{move,leave:()=>choose(false)}));
  bag.add(()=>svg.replaceChildren());
  return {set:v=>{travel=v;if(active){active=false;choose(true);}},destroy:bag.dispose};
}
hairline({name:"phone-gauge",means:"A phone-shaped strip slides into a gauge; the read-out names a possible format only.",rules:[1,3,5,8,9],range:[24,58,80],mount});
