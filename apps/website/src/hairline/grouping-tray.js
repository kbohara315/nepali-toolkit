/** Eight counters sit in four groups, split 1 · 2 · 2 · 3; the chosen group rises together. */
const { Cam, clamp, facing, fit, prism, proj, rings, tween, tset, tval, tdone, register, disposer, mk, pointer, put, solid } = HL;

const COUNTS = [1, 2, 2, 3], LIFT = 18;

function mount({ stage, svg, read }, stagger) {
  const bag = disposer();
  const C = Cam(45, 0.5, 2.25);
  fit(C, [[0, 0, -3], [132, 48, 24], [0, 48, 0], [132, 0, 0]], 200, 166);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const [tray, trayInner] = rings(0, 0, 132, 48, 7, 2);
  put(solid(g), prism(P, front, tray, trayInner, -3, 0));

  const groups = [];
  let cursorX = 8;
  for (let group = 0; group < COUNTS.length; group++) {
    const count = COUNTS[group], width = count * 12 + 5;
    const [cr, ci] = rings(cursorX, 5, cursorX + width, 43, 4, 1.2);
    const compartment = solid(g);
    put(compartment, prism(P, front, cr, ci, 0, 2));
    const counters = [];
    for (let i = 0; i < count; i++) {
      const cx = cursorX + 6.5 + i * 12, cy = 24;
      const [r, ri] = rings(cx - 4.1, cy - 4.1, cx + 4.1, cy + 4.1, 4, 0.9);
      const coin = solid(g);
      const rest = 2.5 + ((i + group) % 2) * 1.4;
      put(coin, prism(P, front, r, ri, 2, rest));
      counters.push({ r, ri, rest, z: tween(0), group, index: i, coin, drawn: NaN });
    }
    const center = P(cursorX + width / 2, 24, 2);
    groups.push({ group, count, compartment, counters, center });
    cursorX += width + 5;
  }

  const hit = (point) => {
    let selected = -1, distance = Infinity;
    for (const item of groups) {
      const d = Math.hypot(point[0] - item.center[0], point[1] - item.center[1]);
      if (d < distance) { selected = item.group; distance = d; }
    }
    return distance < 44 ? selected : -1;
  };
  const B = register(stage, (_dt, now) => {
    let moving = false;
    groups.forEach((item) => {
      item.counters.forEach((counter) => {
        const z = tval(counter.z, now);
        if (!tdone(counter.z, now)) moving = true;
        const height = counter.rest + z;
        if (height !== counter.drawn) {
          counter.drawn = height;
          put(counter.coin, prism(P, front, counter.r, counter.ri, 2, height));
        }
      });
    });
    return moving;
  });
  bag.add(B.unregister);
  let active = -1;
  function select(group) {
    if (active === group) return;
    const previous = active; active = group;
    const now = performance.now();
    groups.forEach((item) => {
      const chosen = item.group === group;
      const distance = Math.abs(item.group - (group < 0 ? previous : group));
      item.compartment.sil.classList.toggle("hi", chosen);
      item.counters.forEach((counter, i) => {
        tset(counter.z, chosen ? LIFT + (i % 2) * 1.5 : 0, now, (distance + i * 0.08) * stagger);
        counter.coin.sil.classList.toggle("hi", chosen);
      });
    });
    read.textContent = group < 0 ? "rest" : `${COUNTS[group]} ${COUNTS[group] === 1 ? "counter" : "counters"}`;
    B.wake();
  }
  groups[2].counters[0].coin.sil.classList.add("hi");
  bag.add(pointer(stage, { move: (p) => select(hit(p)), leave: () => select(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (value) => { stagger = value; }, destroy: bag.dispose };
}

hairline({ name: "grouping-tray", means: "Eight counters sit in groups of one, two, two and three; the pointer lifts a group.", rules: [1, 2, 4, 5, 9, 10], range: [20, 45, 80], mount });
