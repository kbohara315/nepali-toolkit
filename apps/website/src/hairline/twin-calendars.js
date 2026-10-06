/** Two desk calendars share a day; the chosen leaf rises on both calendars. */
const { Cam, facing, fit, proj, rings, prism, put, solid, mk, flatDot, place, open, pointer, disposer, register, spring, stepS, unproj } = HL;

const COLS = 5, ROWS = 4, CELL = 12, W = 75, H = 78, GAP = 18;

function mount({ stage, svg, read }, value) {
  const bag = disposer(), C = Cam(45, 0.5, 1.78);
  const x0 = -3, x1 = W * 2 + GAP + 3, y0 = -5, y1 = H + 5;
  fit(C, [[x0, y0, -12], [x1, y1, 0], [x1, y0, 0], [x0, y1, 0], [x0, y0, 32], [x1, y1, 32]], 200, 166);
  const P = proj(C), front = facing(C), group = mk("g", {}, svg), cells = [], sheets = [];
  const calendars = [0, 1];
  for (const side of calendars) {
    const x = side * (W + GAP), [base, crease] = rings(x, 0, x + W, H, 4, 1.5);
    put(solid(group), prism(P, front, base, crease, -8, -4));
    const [pageRing, pageIn] = rings(x + 4, 14, x + W - 4, H - 6, 3, 1.2);
    const sheet = { side, pageRing, pageIn, page: solid(group), sp: spring(0.7, { eps: 0.04 }), drawn: NaN, lines: [], dots: [] };
    sheets.push(sheet);
    put(sheet.page, prism(P, front, pageRing, pageIn, -4, -2));
    // A raised binding ridge and four arched loops make each page read as a desk calendar.
    const [ridge, ridgeIn] = rings(x + 7, 4, x + W - 7, 12, 3, 1);
    put(solid(group), prism(P, front, ridge, ridgeIn, -4, -1));
    for (let k = 0; k < 4; k++) {
      const bx = x + 13 + k * 15;
      const arc = Array.from({ length: 7 }, (_, n) => {
        const a = Math.PI - n * Math.PI / 6;
        return P(bx + Math.cos(a) * 2, 8, -1 + Math.sin(a) * 4);
      });
      mk("path", { d: open(arc), class: "nf sil" }, group);
    }
    for (let r = 0; r <= ROWS; r++) sheet.lines.push({ el: mk("path", { class: "nf lo" }, group), a: [x + 9, 19 + r * 13], b: [x + W - 8, 19 + r * 13] });
    for (let c = 0; c <= COLS; c++) sheet.lines.push({ el: mk("path", { class: "nf lo" }, group), a: [x + 8 + c * 13, 19], b: [x + 8 + c * 13, 19 + ROWS * 13] });
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const ix = r * COLS + c, cx = x + 11 + c * 13, cy = 22 + r * 13;
      const h0 = 0.5 + ((ix * 7 + side * 3) % 5) * 0.12;
      const dot = flatDot(group, C, 2.1, side === 0 && ix === 0 ? "dot" : "dot off");
      const cell = { side, ix, cx, cy, dot, h0, sheet };
      sheet.dots.push(cell);
      cells.push(cell);
    }
    // An easel foot gives the horizontal page a stable, tilted desk-calendar rest.
    const [foot, footIn] = rings(x + 18, H - 3, x + W - 18, H + 4, 2, 0.8);
    put(solid(group), prism(P, front, foot, footIn, -12, -8));
  }
  const draw = sheet => {
    const h = sheet.sp.x;
    if (h !== sheet.drawn) {
      sheet.drawn = h;
      put(sheet.page, prism(P, front, sheet.pageRing, sheet.pageIn, -4 + h, -2 + h));
      sheet.lines.forEach(line => line.el.setAttribute("d", open([P(line.a[0], line.a[1], -1.5 + h), P(line.b[0], line.b[1], -1.5 + h)])));
    }
    sheet.dots.forEach(c => place(c.dot, P(c.cx, c.cy, -1.5 + h + c.h0)));
  };
  let active = -1, lift = value;
  const loop = register(stage, dt => { let moving = false; for (const s of sheets) { if (stepS(s.sp, dt)) moving = true; draw(s); } return moving; });
  bag.add(loop.unregister);
  const choose = ix => {
    if (ix === active) return;
    active = ix;
    sheets.forEach(s => { s.sp.t = ix < 0 ? 0.7 : lift; });
    for (const c of cells) {
      const marked = ix >= 0 ? c.ix === ix : c.side === 0 && c.ix === 0;
      c.dot.classList.toggle("dot", marked);
      c.dot.classList.toggle("off", !marked);
    }
    read.textContent = ix < 0 ? "rest" : "BS 2082 / AD 2025";
    loop.wake();
  };
  bag.add(pointer(stage, { move: p => {
    let hit = -1;
    for (const c of cells) {
      const atHeight = z => {
        const q = unproj(C, p[0], p[1], z);
        return Math.abs(q[0] - c.cx) < 5 && Math.abs(q[1] - c.cy) < 5;
      };
      if (atHeight(-1.5 + c.h0) || atHeight(-1.5 + c.h0 + lift)) hit = c.ix;
    }
    choose(hit);
  }, leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: v => { lift = v; if (active >= 0) { sheets.forEach(s => s.sp.t = lift); loop.wake(); } }, destroy: bag.dispose };
}

hairline({ name: "twin-calendars", means: "Two desk calendars lift the same day in both systems.", rules: [1, 5, 9, 10], range: [5, 9, 13], mount });
