/** Eight tools in a divided tray. The pointer lifts the selected tool slot. */
const { Cam, clamp, facing, fit, hull, poly, proj, prism, rings, tdone, tset, tval, tween, rrect, ringAt, unproj, disposer, mk, pointer, put, register, solid } = HL;
const N = 8, COLS = 4, PX = 48, PY = 43, W = 38, D = 33, H = 5, LIFT = 12;
const NAMES = ["dates", "numbers", "currency", "land", "words", "sorting", "phone", "admin"];
const REST = [-9, -16, -7, -14, -5, -12, -18, -4];
function mount({ stage, svg, read }, value) {
  const bag = disposer(), C = Cam(45, .5, 1.5), x0 = -W, y0 = -D;
  let liftAmount = value;
  const x1 = (COLS - 1) * PX + W, y1 = PY + D;
  fit(C, [[x0 - 7, y0 - 7, -5], [x1 + 7, y1 + 7, -5], [x1 + 7, y0 - 7, 0], [x0 - 7, y1 + 7, 0], [x0, y0, H + 56 + 8]], 200, 166);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const [br, bi] = rings(x0 - 7, y0 - 7, x1 + 7, y1 + 7, 7, 2);
  put(solid(g), prism(P, front, br, bi, -5, 0));
  const slots = [];
  for (let i = 0; i < N; i++) {
    const col = i % COLS, row = Math.floor(i / COLS), x = col * PX, y = row * PY;
    const [r, ri] = rings(x, y, x + W, y + D, 4, 1.2), el = solid(g);
    put(el, prism(P, front, r, ri, 0, H));
    const tool = mk("g", {}, g), count = (i % 4) + 1;
    for (let k = 0; k < count; k++) {
      const bx = x + 9 + k * 6.5, by = y + 14 + ((k + i) % 2) * 4;
      const [tr, ti] = rings(bx, by, bx + 4, by + 4, 1.8, .7);
      put(solid(tool), prism(P, front, tr, ti, H, H + 3 + (k === 0 ? 1.5 : 0)));
    }
    const line = mk("path", { class: "nf lo" }, tool);
    line.setAttribute("d", poly([P(x + 8, y + 7, H + 1), P(x + W - 8, y + 7, H + 1), P(x + W - 8, y + 8, H + 1), P(x + 8, y + 8, H + 1)]));
    slots.push({ x, y, r, ri, el, tool, a: tween(REST[i]), z: tween(0), drawn: "" });
  }
  const centers = slots.map((s) => P(s.x + W / 2, s.y + D / 2, H));
  const hit = ([x, y]) => {
    let best = -1, dist = Infinity;
    centers.forEach((p, i) => { const d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (d < dist) { dist = d; best = i; } });
    return dist < 1800 ? best : -1;
  };
  const B = register(stage, (_dt, now) => {
    let moving = false;
    slots.forEach((s) => {
        const angle = tval(s.a, now), lift = tval(s.z, now), key = `${angle}/${lift}`;
      if (key !== s.drawn) {
        s.drawn = key;
        const c = [s.x + W / 2, s.y + D / 2], ca = Math.cos(angle * Math.PI / 180), sa = Math.sin(angle * Math.PI / 180);
        const ring = s.r.map((q) => ({ ...q, u: c[0] + (q.u - c[0]) * ca, v: c[1] + (q.v - c[1]) * sa }));
        const inner = s.ri.map((q) => ({ ...q, u: c[0] + (q.u - c[0]) * ca, v: c[1] + (q.v - c[1]) * sa }));
        put(s.el, prism(P, front, ring, inner, lift, H + lift));
        const base = P(c[0], c[1], H), raised = P(c[0], c[1], H + lift);
        s.tool.setAttribute("transform", `translate(${raised[0] - base[0]} ${raised[1] - base[1]})`);
      }
      if (!tdone(s.a, now) || !tdone(s.z, now)) moving = true;
    });
    return moving;
  });
  bag.add(B.unregister); let active = -1;
  function choose(a) {
    if (a === active) return; const now = performance.now(); active = a;
    slots.forEach((s, i) => { tset(s.a, a < 0 ? REST[i] : i === a ? 10 : REST[i], now, Math.abs(i - Math.max(0, a)) * 24); tset(s.z, i === a ? liftAmount : 0, now, Math.abs(i - Math.max(0, a)) * 24); s.el.sil.classList.toggle("hi", i === a || (a < 0 && i === 3)); });
    read.textContent = a < 0 ? "rest" : NAMES[a]; B.wake();
  }
  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { liftAmount = v; if (active >= 0) { const a = active; active = -1; choose(a); } }, destroy: bag.dispose };
}
  hairline({ name: "tool-tray", means: "Eight tool slots sit in a tray; the pointer lifts a slot and names its utility.", rules: [1, 4, 5, 8], range: [28, 42, 56], mount });
