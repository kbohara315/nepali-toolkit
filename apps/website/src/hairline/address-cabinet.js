/** Nested trays rise in order to show a province-to-ward address path. */
const { Cam, facing, fit, proj, rings, prism, put, solid, mk, pointer, disposer, register, tween, tset, tval, tdone, unproj } = HL;

const LEVELS = ["province", "district", "palika", "ward"];
const SIZES = [78, 62, 46, 30], ZS = [0, 6, 12, 18];
function mount({ stage, svg, read }, value) {
  const bag = disposer(), C = Cam(45, 0.5, 2.2), cx = 40, cy = 40;
  fit(C, [[-4, -4, -5], [84, 84, 37], [84, -4, 0], [-4, 84, 0]], 200, 166);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg), trays = [];
  for (let i = 0; i < 4; i++) {
    const half = SIZES[i] / 2, [outer, inner] = rings(cx - half, cy - half, cx + half, cy + half, 5, 1.7);
    trays.push({ i, outer, inner, base: ZS[i], rise: tween(0), el: solid(g), drawn: NaN });
  }
  let selected = -1, stagger = value;
  const draw = (t, now) => {
    const lift = tval(t.rise, now);
    if (lift === t.drawn) return;
    t.drawn = lift;
    put(t.el, prism(P, front, t.outer, t.inner, t.base + lift - 4, t.base + lift));
    t.el.sil.classList.toggle("hi", t.i === selected);
  };
  const loop = register(stage, (_dt, now) => { let moving = false; for (const t of trays) { draw(t, now); if (!tdone(t.rise, now)) moving = true; } return moving; });
  bag.add(loop.unregister);
  const choose = i => {
    if (i === selected) return;
    const from = selected < 0 ? i : selected;
    selected = i;
    const now = performance.now();
    trays.forEach(t => tset(t.rise, t.i === i ? 8 : 0, now, Math.abs(t.i - from) * stagger));
    read.textContent = i < 0 ? "rest" : LEVELS[i];
    loop.wake();
  };
  bag.add(pointer(stage, { move: p => {
    let hit = -1;
    for (let i = 3; i >= 0; i--) {
      const atHeight = z => {
        const q = unproj(C, p[0], p[1], z);
        return Math.abs(q[0] - cx) < SIZES[i] / 2 && Math.abs(q[1] - cy) < SIZES[i] / 2;
      };
      if (atHeight(ZS[i]) || atHeight(ZS[i] + 8)) { hit = i; break; }
    }
    choose(hit);
  }, leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: v => { stagger = v; }, destroy: bag.dispose };
}

hairline({ name: "address-cabinet", means: "Nested address trays open from province down to ward.", rules: [1, 2, 5, 8], range: [0, 40, 90], mount });
