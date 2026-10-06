/** Paper advances through a small press as the pointer moves along the feed bed. */
const { Cam, clamp, facing, fit, prism, proj, rings, spring, stepS, disposer, mk, pointer, put, register, solid } = HL;

const X0 = 0, X1 = 108, Y0 = 0, Y1 = 60, PAPER_W = 24;

function mount({ stage, svg, read }, distance) {
  const bag = disposer();
  const C = Cam(45, 0.5, 2);
  fit(C, [[-8, -8, 0], [130, 68, 49], [-8, 68, 0], [130, -8, 0]], 200, 166);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);

  // A bed, two upright cheeks and one crossbar make a press with a clear opening.
  const [br, bi] = rings(-8, -8, 116, 68, 6, 1.8);
  put(solid(g), prism(P, front, br, bi, -2, 0));
  for (const x of [8, 92]) {
    const [r, ri] = rings(x, 15, x + 8, 50, 3, 1);
    put(solid(g), prism(P, front, r, ri, 0, 34));
  }
  const [beam, beamInner] = rings(4, 12, 104, 22, 4, 1.4);
  put(solid(g), prism(P, front, beam, beamInner, 28, 36));
  const [roller, rollerInner] = rings(24, 19, 84, 27, 3.5, 1);
  put(solid(g), prism(P, front, roller, rollerInner, 24, 29));
  const [handle, handleInner] = rings(51, 18, 57, 31, 2.3, 0.8);
  put(solid(g), prism(P, front, handle, handleInner, 35, 46));
  const [knob, knobInner] = rings(47, 14, 61, 20, 3.5, 0.9);
  put(solid(g), prism(P, front, knob, knobInner, 45, 49));

  // The paper has a folded leading edge and quiet press grooves, never printed characters.
  const sheet = solid(g), grooves = [solid(g), solid(g), solid(g)];
  const speed = spring(0, { eps: 0.04 });
  let drawn = NaN, over = null;
  function drawPaper() {
    const travel = speed.x * distance;
    if (travel === drawn) return;
    drawn = travel;
    const x = X0 + 35 + travel;
    const [r, ri] = rings(x, 26, x + PAPER_W, 56, 1.5, 0.5);
    put(sheet, prism(P, front, r, ri, 1, 1.3));
    // three shallow press grooves are physical marks on the paper, with no glyphs.
    const [a, b] = rings(x + 5, 32, x + 19, 34, 0.7, 0.3);
    const [c, d] = rings(x + 5, 38, x + 16, 40, 0.7, 0.3);
    const [e, f] = rings(x + 5, 44, x + 18, 46, 0.7, 0.3);
    [[a, b], [c, d], [e, f]].forEach(([rr, ii], index) => {
      put(grooves[index], prism(P, front, rr, ii, 1.3, 1.45));
      grooves[index].sil.classList.add("lo");
    });
  }
  const B = register(stage, (dt) => {
    const moving = stepS(speed, dt);
    drawPaper();
    return moving;
  });
  bag.add(B.unregister);
  const left = P(X0 + 20, Y0 + 25, 0), right = P(X1 - 10, Y0 + 25, 0);
  const minX = Math.min(left[0], right[0]), maxX = Math.max(left[0], right[0]);
  function update() {
    if (!over) { speed.t = 0; read.textContent = "rest"; }
    else {
      speed.t = clamp((over[0] - minX) / (maxX - minX), 0, 1);
      read.textContent = speed.t > 0.5 ? "words" : "12345";
    }
    B.wake();
  }
  bag.add(pointer(stage, {
    move: (point) => { over = point; update(); },
    leave: () => { over = null; update(); },
  }));
  bag.add(() => svg.replaceChildren());
  drawPaper();
  return { set: (value) => { distance = value; drawn = NaN; B.wake(); }, destroy: bag.dispose };
}

hairline({ name: "printing-press", means: "A paper strip advances through a press as the pointer moves along its bed.", rules: [1, 3, 4, 5, 7, 8, 9, 10], range: [20, 38, 54], mount });
