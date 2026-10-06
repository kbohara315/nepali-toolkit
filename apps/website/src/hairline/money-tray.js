/** A divided money tray: the broad rupee well and the small paisa well answer separately. */
const { Cam, facing, fit, prism, proj, rings, tween, tset, tval, tdone, register, disposer, mk, pointer, put, solid } = HL;

const REST = -7;

function mount({ stage, svg, read }, liftAmount) {
  const bag = disposer();
  const C = Cam(45, 0.5, 2.2);
  fit(C, [[0, 0, -3], [120, 68, 30], [0, 68, 0], [120, 0, 0]], 200, 166);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const outer = rings(0, 0, 120, 68, 8, 2.2), inner = rings(3, 3, 117, 65, 6, 1.4);
  put(solid(g), prism(P, front, outer[0], inner[0], -3, 0));

  // The two compartments have different proportions; the small end well is for paisa.
  const wells = [
    { name: "rupees", x0: 5, x1: 83, y0: 6, y1: 62, h: 8, count: 5 },
    { name: "paisa", x0: 88, x1: 115, y0: 6, y1: 62, h: 5, count: 3 },
  ];
  const parts = wells.map((well, index) => {
    const [r, ri] = rings(well.x0, well.y0, well.x1, well.y1, 5, 1.4);
    const base = solid(g);
    put(base, prism(P, front, r, ri, 0, 3));
    const coins = [];
    for (let i = 0; i < well.count; i++) {
      const cx = well.x0 + (well.x1 - well.x0) * (0.3 + (i % 2) * 0.4);
      const cy = well.y0 + (well.y1 - well.y0) * (0.28 + Math.floor(i / 2) * 0.22);
      const [cr, ci] = rings(cx - 4.3, cy - 4.3, cx + 4.3, cy + 4.3, 4.1, 0.8);
      const coin = solid(g);
      put(coin, prism(P, front, cr, ci, 3, 3 + well.h - i * 0.6));
      coins.push({ coin, ring: cr, inner: ci, height: well.h - i * 0.6, drawn: NaN });
    }
    return { ...well, base, coins, z: tween(0), index };
  });
  // A short divider makes the smaller well read as part of the same tray.
  const divider = rings(84, 5, 87, 63, 1.4, 0.8);
  put(solid(g), prism(P, front, divider[0], divider[1], 0, 9));

  const hitAt = wells.map((w) => ({
    center: P((w.x0 + w.x1) / 2, (w.y0 + w.y1) / 2, 2),
    bounds: [P(w.x0, w.y0, 2), P(w.x1, w.y1, 2)],
  }));
  function hit(point) {
    let chosen = -1, nearest = Infinity;
    for (let i = 0; i < hitAt.length; i++) {
      const [a, b] = hitAt[i].bounds;
      const x0 = Math.min(a[0], b[0]) - 8, x1 = Math.max(a[0], b[0]) + 8;
      const y0 = Math.min(a[1], b[1]) - 8, y1 = Math.max(a[1], b[1]) + 8;
      if (point[0] >= x0 && point[0] <= x1 && point[1] >= y0 && point[1] <= y1) {
        const d = Math.hypot(point[0] - hitAt[i].center[0], point[1] - hitAt[i].center[1]);
        if (d < nearest) { chosen = i; nearest = d; }
      }
    }
    return chosen;
  }
  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const part of parts) {
      const lift = tval(part.z, now);
      if (!tdone(part.z, now)) moving = true;
      // The compartment walls remain fixed; the coins lift as one selected amount.
      part.coins.forEach(({ coin, ring, inner, height }, i) => {
        const h = height + lift;
        if (h === part.coins[i].drawn) return;
        part.coins[i].drawn = h;
        put(coin, prism(P, front, ring, inner, 3, h));
      });
    }
    return moving;
  });
  bag.add(B.unregister);
  let active = -1;
  function select(index) {
    if (active === index) return;
    active = index;
    const now = performance.now();
    parts.forEach((part, i) => {
      const chosen = i === index;
      tset(part.z, chosen ? liftAmount : 0, now, 0);
      part.base.sil.classList.toggle("hi", chosen);
      part.coins.forEach(({ coin }) => coin.sil.classList.toggle("hi", chosen));
    });
    read.textContent = index < 0 ? "rest" : wells[index].name;
    B.wake();
  }
  // Start mark: one rupee coin is bright; the pointer moves the accent to one well.
  parts[0].coins[0].coin.sil.classList.add("hi");
  bag.add(pointer(stage, { move: (p) => select(hit(p)), leave: () => select(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (value) => {
    liftAmount = value;
    if (active >= 0) {
      const now = performance.now();
      tset(parts[active].z, liftAmount, now, 0);
      B.wake();
    }
  }, destroy: bag.dispose };
}

hairline({ name: "money-tray", means: "A divided tray keeps rupees and paisa in separate wells; the pointer selects one amount.", rules: [1, 4, 5, 9, 10], range: [8, 14, 20], mount });
