/** A small field of removable plots; the selected plot lifts from its neighbours. */
const { Cam, clamp, facing, fit, proj, rings, prism, put, solid, mk, pointer, disposer, register, spring, stepS } = HL;

const N = 3, CELL = 25, FOOT = 21, HMAX = 17;
function mount({ stage, svg, read }, value) {
  const bag = disposer(), C = Cam(45, 0.5, 2.12), extent = N * CELL;
  fit(C, [[-8, -8, -7], [extent + 8, extent + 8, HMAX], [extent + 8, -8, 0], [-8, extent + 8, 0]], 200, 166);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg), cells = [], [fr, fi] = rings(-7, -7, extent + 7, extent + 7, 7, 2);
  put(solid(g), prism(P, front, fr, fi, -7, -3));
  // Plot edges are narrow furrows between four independently removable land pieces.
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = i * CELL + 2, y = j * CELL + 2, base = ((i * 3 + j * 5) % 4) * 0.7 + 1.7;
    const [ring, inner] = rings(x, y, x + FOOT, y + FOOT, 3.5, 1.1);
    cells.push({ i, j, x: x + FOOT / 2, y: y + FOOT / 2, ring, inner, sp: spring(base, { eps: 0.04 }), el: solid(g), drawn: NaN, base });
  }
  let selected = null;
  const loop = register(stage, dt => {
    let moving = false;
    for (const c of cells) {
      if (stepS(c.sp, dt)) moving = true;
      if (c.drawn !== c.sp.x) {
        c.drawn = c.sp.x;
        put(c.el, prism(P, front, c.ring, c.inner, 0, c.sp.x));
        c.el.sil.classList.toggle("hi", selected === c);
      }
    }
    return moving;
  });
  bag.add(loop.unregister);
  const pick = p => {
    const c = cells.filter(v => {
      const center = P(v.x, v.y, v.base);
      const target = P(v.x, v.y, v.sp.t);
      return Math.min(Math.hypot(p[0] - center[0], p[1] - center[1]), Math.hypot(p[0] - target[0], p[1] - target[1])) < CELL * 0.72;
    }).sort((a, b) => Math.hypot(p[0] - P(a.x, a.y, a.base)[0], p[1] - P(a.x, a.y, a.base)[1]) - Math.hypot(p[0] - P(b.x, b.y, b.base)[0], p[1] - P(b.x, b.y, b.base)[1]))[0];
    if (c === selected) return;
    selected = c ?? null;
    cells.forEach(v => { v.sp.t = v === selected ? clamp(HMAX * (value / 13), 6, HMAX) : v.base; });
    read.textContent = selected ? `plot ${selected.i + 1}·${selected.j + 1}` : "rest";
    loop.wake();
  };
  bag.add(pointer(stage, { move: pick, leave: () => { selected = null; cells.forEach(v => v.sp.t = v.base); read.textContent = "rest"; loop.wake(); } }));
  bag.add(() => svg.replaceChildren());
  return { set: v => { value = v; if (selected) selected.sp.t = clamp(HMAX * (value / 13), 6, HMAX); loop.wake(); }, destroy: bag.dispose };
}

hairline({ name: "divided-field", means: "A divided field lifts the plot beneath the pointer.", rules: [1, 3, 5, 9], range: [6, 10, 13], mount });
