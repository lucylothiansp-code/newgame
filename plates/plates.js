// THE LONG GRACE — header plate generator.
// Renders 3:1 cinematic header plates (2400x800) with one shared frame and title treatment,
// over procedural ink-and-fog scenes. Usage: node plates.js [key ...]
const fs = require("fs");
const path = require("path");
const sigils = require("../pdfbuild/sigils");

const W = 2400, H = 800;
const OUT = path.join(__dirname, "png");
const FONTS = path.join(__dirname, "../pdfbuild/node_modules/@fontsource");

// ---------- seeded random ----------
function rng(seed) { let a = 0; for (const c of seed) a = (a * 31 + c.charCodeAt(0)) >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- palettes ----------
const LAND = {
  sallowreach: { name: "Sallowreach", base: "#0b0d0a", fog: [0.42, 0.45, 0.36], accent: "#6f8a4a", glow: "#9fae7c" },
  fatlands: { name: "The Fatlands", base: "#0e0807", fog: [0.46, 0.38, 0.32], accent: "#8e1d16", glow: "#d9b45a" },
  brinehollow: { name: "Brinehollow", base: "#060b0c", fog: [0.33, 0.43, 0.45], accent: "#3f8c8a", glow: "#c9dad6" },
  vigil: { name: "The Vigil", base: "#0c0906", fog: [0.45, 0.38, 0.29], accent: "#d98b2b", glow: "#f2b45a" },
  cradlewrack: { name: "Cradlewrack", base: "#0d0706", fog: [0.44, 0.33, 0.29], accent: "#8f2a1c", glow: "#c66a48" },
  oathen: { name: "Oathen", base: "#0d0806", fog: [0.5, 0.38, 0.27], accent: "#a5582a", glow: "#e0a768" },
  fast: { name: "The Fast", base: "#0b0906", fog: [0.46, 0.41, 0.31], accent: "#d8a64a", glow: "#f6d58e" },
  rim: { name: "The Rim Road", base: "#09090a", fog: [0.4, 0.4, 0.4], accent: "#b79c63", glow: "#d8c9a8" },
  eighth: { name: "The Table", base: "#050505", fog: [0.4, 0.4, 0.4], accent: "#e8e2d6", glow: "#f2eee6" },
};

// ---------- drawing helpers (all return SVG strings) ----------
const INK = "#060505";
const f = (n) => n.toFixed(1);
function poly(pts, fill = INK, extra = "") { return `<path d="M${pts.map((p) => f(p[0]) + " " + f(p[1])).join(" L")} Z" fill="${fill}" ${extra}/>`; }
function line(x1, y1, x2, y2, w, c = INK, extra = "") { return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" ${extra}/>`; }
function rect(x, y, w, h, c = INK, extra = "") { return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${c}" ${extra}/>`; }
function circ(x, y, r, c = INK, extra = "") { return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${c}" ${extra}/>`; }
function glow(x, y, r, c, o = 0.8) { return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${c}" opacity="${o}" filter="url(#blurBig)"/>`; }
function ground(R, y, rough = 18, c = INK) { const pts = [[0, H]]; for (let x = 0; x <= W; x += 40) pts.push([x, y + (R() - 0.5) * rough]); pts.push([W, H]); return poly(pts, c); }
function hillLine(R, y, amp, freq, c = INK, phase = 0) { const pts = [[0, H]]; for (let x = 0; x <= W; x += 20) pts.push([x, y - amp * Math.sin(x * freq + phase) * 0.6 - amp * 0.4 * Math.sin(x * freq * 2.3 + phase * 2) + (R() - 0.5) * 6]); pts.push([W, H]); return poly(pts, c); }
function figure(x, y, h, c = INK, opts = {}) { // standing hooded figure, feet at y
  const w = h * 0.28, hd = h * 0.14;
  const stoop = opts.stoop || 0;
  let s = poly([[x - w * 0.55, y], [x - w * 0.42, y - h * 0.55], [x - w * 0.5 + stoop, y - h * 0.82], [x + stoop, y - h], [x + w * 0.5 + stoop, y - h * 0.82], [x + w * 0.42, y - h * 0.55], [x + w * 0.6, y]], c);
  s += circ(x + stoop, y - h * 0.9, hd * 0.55, c);
  if (opts.rags) for (let i = 0; i < 9; i++) s += line(x - w * 0.6 + i * w * 0.15, y, x - w * 0.7 + i * w * 0.16 + (i % 2 ? 8 : -6), y + h * 0.06 + (i % 3) * 6, 3, c);
  if (opts.eyes) { s += circ(x + stoop - hd * 0.18, y - h * 0.9, hd * 0.12, opts.eyes) + circ(x + stoop + hd * 0.18, y - h * 0.9, hd * 0.12, opts.eyes); }
  return s;
}
function chair(x, y, s, c = INK) { // front-facing chair, seat at y - 0.5s
  let o = rect(x - s * 0.34, y - s * 0.52, s * 0.68, s * 0.07, c) + rect(x - s * 0.32, y - s * 0.46, s * 0.06, s * 0.46, c) + rect(x + s * 0.26, y - s * 0.46, s * 0.06, s * 0.46, c);
  o += rect(x - s * 0.32, y - s * 1.3, s * 0.06, s * 0.8, c) + rect(x + s * 0.26, y - s * 1.3, s * 0.06, s * 0.8, c) + rect(x - s * 0.36, y - s * 1.34, s * 0.72, s * 0.08, c) + rect(x - s * 0.3, y - s * 1.0, s * 0.6, s * 0.05, c);
  for (let i = 0; i < 3; i++) o += rect(x - s * 0.15 + i * s * 0.12, y - s * 1.28, s * 0.04, s * 0.3, c);
  return o; }
function candle(x, y, h, flame) { return rect(x - 4, y - h, 8, h, "#1a1410") + glow(x, y - h - 10, 26, flame, 0.9) + `<ellipse cx="${x}" cy="${y - h - 9}" rx="4" ry="9" fill="#fff2cf"/>`; }
function splatter(R, n, x0, x1, y0, y1, c, maxr = 6) { let s = ""; for (let i = 0; i < n; i++) s += circ(x0 + R() * (x1 - x0), y0 + R() * (y1 - y0), 0.5 + R() * maxr, c, `opacity="${(0.3 + R() * 0.6).toFixed(2)}"`); return s; }
function drips(R, n, x0, x1, y, c, len = 60) { let s = ""; for (let i = 0; i < n; i++) { const x = x0 + R() * (x1 - x0), l = len * (0.3 + R()); s += line(x, y, x, y + l, 2 + R() * 3, c, `opacity="0.85"`) + circ(x, y + l, 3 + R() * 2, c, `opacity="0.85"`); } return s; }
function flies(R, n, x0, x1, y0, y1) { let s = ""; for (let i = 0; i < n; i++) s += circ(x0 + R() * (x1 - x0), y0 + R() * (y1 - y0), 0.8 + R() * 1.8, INK, `opacity="${(0.5 + R() * 0.5).toFixed(2)}"`); return s; }
function persp(vx, vy, x, y, t) { return [x + (vx - x) * t, y + (vy - y) * t]; }

// ---------- motif library ----------
const M = {
  // establishing: the round Table under a dark sky, Rim lights around a black centre
  world(R, P) {
    let s = glow(1200, 330, 520, P.glow, 0.25);
    s += `<ellipse cx="1200" cy="560" rx="1150" ry="190" fill="#121110"/>`;
    s += `<ellipse cx="1200" cy="555" rx="980" ry="150" fill="#0a0909"/>`;
    s += `<ellipse cx="1200" cy="550" rx="330" ry="55" fill="#000"/>`;
    for (let i = 0; i < 70; i++) { const a = (i / 70) * Math.PI * 2; s += circ(1200 + Math.cos(a) * 760, 552 + Math.sin(a) * 118, 2 + R() * 2.5, P.glow, `opacity="${(0.5 + R() * 0.5).toFixed(2)}"`); }
    for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2 - Math.PI / 2; const x = 1200 + Math.cos(a) * 560, y = 552 + Math.sin(a) * 88; s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="70" ry="13" fill="#1b1814" stroke="#3a3127" stroke-width="2"/>`; }
    s += `<ellipse cx="1200" cy="552" rx="60" ry="11" fill="none" stroke="#e8e2d6" stroke-width="1.5" stroke-dasharray="6 7" opacity="0.6"/>`;
    for (let i = 0; i < 9; i++) s += figure(260 + i * 240 + R() * 40, 760, 90 + R() * 40, INK);
    return s;
  },
  hand(R, P) { // Ossel: a grey hand with too many joints rising from the fen
    let s = glow(1700, 260, 420, P.glow, 0.35) + ground(R, 640, 10, "#080a08");
    const bx = 1650, by = 690; s += poly([[bx - 120, by], [bx - 95, 420], [bx + 105, 400], [bx + 140, by]], "#4a4f45");
    const fingers = [[-90, 7], [-40, 9], [10, 9], [60, 8], [120, 5]];
    fingers.forEach(([dx, n], k) => { let x = bx + dx, y = 420; for (let j = 0; j < n; j++) { const nx = x + (k - 2) * 6 + (R() - 0.5) * 10, ny = y - 34 - j * 1.5; s += line(x, y, nx, ny, 26 - j * 1.4, "#4a4f45") + circ(nx, ny, 13 - j * 0.6, "#5a6052"); x = nx; y = ny; } });
    s += flies(R, 600, 900, 2350, 80, 640) + ground(R, 700, 14);
    for (let i = 0; i < 14; i++) s += line(120 + i * 60, 700, 110 + i * 60 + R() * 20, 560 - R() * 80, 3);
    s += figure(520, 705, 150, INK, { rags: true });
    return s;
  },
  hill(R, P, opts = {}) { // Ummer / Dowager: warm hills that are bodies
    let s = glow(1200, 300, 600, P.glow, 0.22);
    s += hillLine(R, 470, 90, 0.0032, "#2a1712", 1) + hillLine(R, 560, 70, 0.005, "#1a0e0b", 3);
    if (opts.mouths) for (let i = 0; i < 6; i++) { const x = 300 + i * 360, y = 560 - 40 * Math.sin(x * 0.005 + 3); s += `<ellipse cx="${x}" cy="${y + 18}" rx="${30 + R() * 25}" ry="${7 + R() * 5}" fill="${P.accent}" opacity="0.85"/>` + drips(R, 3, x - 20, x + 20, y + 22, P.accent, 40); }
    if (opts.giant) { s += `<ellipse cx="1200" cy="640" rx="760" ry="250" fill="#2e1913"/>`; for (let i = 0; i < 40; i++) s += line(500 + R() * 1400, 480 + R() * 120, 500 + R() * 1400, 410 + R() * 40, 3, "#d9b45a", `opacity="0.35"`); s += `<ellipse cx="1200" cy="560" rx="120" ry="26" fill="${P.accent}"/>` + drips(R, 8, 1100, 1300, 575, P.accent, 90); }
    s += ground(R, 720, 12);
    for (let i = 0; i < 26; i++) s += line(R() * W, 720, R() * W, 650 - R() * 60, 3, INK);
    return s;
  },
  waves(R, P, opts = {}) { // the sea or its absence
    let s = glow(opts.lx || 1200, 330, 480, P.glow, 0.3);
    for (let r = 0; r < 14; r++) { const y = 480 + r * 22; let d = `M0 ${y}`; for (let x = 0; x <= W; x += 30) d += ` L${x} ${f(y + Math.sin(x * 0.01 + r) * (6 + r))}`; s += `<path d="${d} L${W} ${H} L0 ${H} Z" fill="#05090a" opacity="${(0.25 + r * 0.05).toFixed(2)}"/>`; }
    if (opts.leviathan) { s += `<path d="M300 620 Q 1200 260 2100 620 L2100 800 L300 800 Z" fill="#0b1416"/>`; for (let i = 0; i < 22; i++) { const x = 420 + i * 75; s += `<path d="M${x} ${f(640 - 260 * Math.sin((i / 21) * Math.PI))} Q ${x + 20} 700 ${x + 6} 790" stroke="#c9dad6" stroke-opacity="0.45" stroke-width="7" fill="none"/>`; } }
    return s;
  },
  pilings(R, P) { // Lastgate on stilts over the fen
    let s = glow(1500, 300, 500, P.glow, 0.3);
    s += rect(0, 560, W, 240, "#070807");
    for (let i = 0; i < 26; i++) { const x = 60 + i * 92 + R() * 30, top = 260 + R() * 160, w = 70 + R() * 70; s += rect(x, top, w, 560 - top - 60, "#0a0b0a") + poly([[x - 8, top], [x + w / 2, top - 40 - R() * 50], [x + w + 8, top]], "#0a0b0a"); for (let k = 0; k < 4; k++) s += line(x + 8 + k * (w / 4), 500, x + 4 + k * (w / 4), 620, 6, "#090a09"); if (R() < 0.5) s += rect(x + w * 0.4, top + 40, 10, 16, P.glow, `opacity="0.8"`); }
    for (let i = 0; i < 40; i++) s += line(R() * W, 600 + R() * 180, R() * W, 600 + R() * 180, 1, "#9fae7c", `opacity="0.12"`);
    s += flies(R, 500, 0, W, 60, 420);
    return s;
  },
  shelves(R, P, opts = {}) { // the Lofts / Jar Room: perspective shelving into the dark
    const vx = 1200, vy = 360; let s = glow(vx, vy, 260, P.glow, 0.45);
    for (let side of [-1, 1]) for (let r = 0; r < 7; r++) { const y0 = 120 + r * 100; const x0 = side < 0 ? 40 : W - 40; s += poly([[x0, y0], persp(vx, vy, x0, y0, 0.92), persp(vx, vy, x0, y0 + 14, 0.92), [x0, y0 + 14]], "#0b0a09");
      for (let k = 0; k < 14; k++) { const t = k / 15, p = persp(vx, vy, x0, y0, t), sz = (1 - t) * 62; if (opts.jars) s += `<rect x="${f(p[0] - sz * 0.35)}" y="${f(p[1] - sz)}" width="${f(sz * 0.7)}" height="${f(sz)}" rx="${f(sz * 0.15)}" fill="#151a14" stroke="${P.glow}" stroke-opacity="0.25"/>` + circ(p[0], p[1] - sz * 0.55, sz * 0.18, "#2a2a22"); else s += `<ellipse cx="${f(p[0])}" cy="${f(p[1] - sz * 0.25)}" rx="${f(sz * 0.55)}" ry="${f(sz * 0.25)}" fill="#1a1915"/>` + line(p[0] - sz * 0.5, p[1] - sz * 0.25, p[0] + sz * 0.5, p[1] - sz * 0.25, 2, "#2e2a22"); } }
    s += figure(1200, 760, 210, INK, { rags: true }) + candle(1260, 690, 40, P.glow);
    return s;
  },
  fenwater(R, P) { // the Sump: black water, bubbles, sacks
    let s = glow(900, 280, 460, P.glow, 0.25) + rect(0, 470, W, 330, "#050605");
    for (let i = 0; i < 70; i++) s += `<ellipse cx="${f(R() * W)}" cy="${f(490 + R() * 300)}" rx="${f(4 + R() * 16)}" ry="${f(2 + R() * 4)}" fill="none" stroke="#9fae7c" stroke-opacity="${(0.15 + R() * 0.3).toFixed(2)}"/>`;
    for (let i = 0; i < 9; i++) { const x = 200 + i * 240 + R() * 60; s += `<path d="M${x} 560 q 30 -60 60 0 q 10 40 -30 50 q -40 -10 -30 -50z" fill="#1c1e17"/>` + line(x + 30, 500, x + 30, 560, 3, "#2a2c22"); }
    for (let i = 0; i < 30; i++) s += line(R() * W, 470, R() * W, 300 + R() * 120, 3);
    s += figure(1900, 520, 170, INK) + line(1960, 360, 2060, 600, 6);
    return s;
  },
  hush(R, P) { // Dunmere Hush: a dead flat circle where everything ended; birds falling at the edge
    let s = `<rect x="0" y="0" width="${W}" height="${H}" fill="#bfc1b6" opacity="0.10"/>` + glow(1200, 360, 620, "#e9eadf", 0.22);
    s += ground(R, 560, 4, "#0b0c0a") + `<ellipse cx="1200" cy="600" rx="900" ry="60" fill="#1e201b"/>`;
    for (let i = 0; i < 18; i++) { const x = 200 + R() * 2000; s += line(x, 560, x + (R() - 0.5) * 20, 380 + R() * 60, 4) + line(x - 30, 470, x + 30, 460, 3); }
    for (let i = 0; i < 22; i++) { const x = 250 + R() * 1900, y = 120 + R() * 360; s += `<path d="M${x} ${y} l -12 -6 l 12 4 l 12 -4 z" fill="${INK}" transform="rotate(${f(70 + R() * 40)} ${x} ${y})"/>`; }
    s += figure(1200, 610, 120, INK);
    return s;
  },
  graves(R, P) { // crooked grave crosses in long grass
    let s = glow(1200, 260, 700, "#e9e6dc", 0.28);
    for (let i = 0; i < 34; i++) { const x = R() * W, h = 120 + R() * 320, y = 760 - R() * 80, a = (R() - 0.5) * 18; s += `<g transform="rotate(${f(a)} ${f(x)} ${f(y)})">${rect(x - 7, y - h, 14, h)}${rect(x - h * 0.22, y - h * 0.75, h * 0.44, 12)}</g>`; }
    for (let i = 0; i < 300; i++) { const x = R() * W; s += line(x, 800, x + (R() - 0.5) * 30, 640 + R() * 120, 2); }
    return s;
  },
  wheat(R, P, opts = {}) { // toothed wheat and a scarecrow
    let s = glow(1700, 300, 460, P.glow, 0.35) + ground(R, 520, 6, "#1b0e0b");
    for (let i = 0; i < 900; i++) { const x = R() * W, y = 520 + R() * 280, h = 40 + R() * 70 * (y / 520); s += line(x, y, x + (R() - 0.5) * 12, y - h, 2.2, "#2b1a12"); if (R() < 0.35) s += line(x - 3, y - h, x + 3, y - h - 8, 3, "#e8dcc0", `opacity="0.75"`); }
    if (opts.scarecrow) s += line(1500, 760, 1500, 330, 10) + line(1400, 420, 1610, 410, 8) + circ(1500, 320, 28) + poly([[1430, 420], [1570, 420], [1555, 560], [1445, 560]]);
    s += figure(400, 780, 190, INK) + figure(560, 790, 170, INK);
    return s;
  },
  orchard(R, P) { // bleeding orchards
    let s = glow(1200, 260, 560, P.glow, 0.2) + ground(R, 640, 10, "#130908");
    for (let i = 0; i < 9; i++) { const x = 150 + i * 270 + R() * 40; let d = ""; for (let b = 0; b < 7; b++) { const a = -Math.PI / 2 + (R() - 0.5) * 2.2, l = 140 + R() * 180; d += line(x, 470, x + Math.cos(a) * l, 470 + Math.sin(a) * l, 10 - b, INK); s += `<ellipse cx="${f(x + Math.cos(a) * l)}" cy="${f(470 + Math.sin(a) * l + 14)}" rx="14" ry="18" fill="${P.accent}"/>`; } s += rect(x - 16, 470, 32, 190) + d + drips(R, 4, x - 14, x + 14, 520, P.accent, 120); }
    s += figure(1250, 690, 160, INK) + line(1290, 560, 1360, 500, 6);
    return s;
  },
  domes(R, P) { // Sated: wide low domes, ramps, steam
    let s = glow(1200, 300, 560, P.glow, 0.3);
    for (let i = 0; i < 14; i++) { const x = 80 + i * 170 + R() * 40, r = 90 + R() * 120, y = 600; s += `<path d="M${x - r} ${y} A ${r} ${r * 0.7} 0 0 1 ${x + r} ${y} Z" fill="#120a08"/>`; if (R() < 0.6) s += rect(x - 18, y - 40, 36, 40, P.glow, `opacity="0.55"`); }
    s += poly([[0, 800], [700, 600], [760, 610], [80, 800]], "#0a0605") + poly([[2400, 800], [1700, 600], [1640, 610], [2320, 800]], "#0a0605") + rect(0, 600, W, 200, "#080504");
    for (let i = 0; i < 10; i++) s += `<path d="M${200 + i * 220} 560 q 30 -120 -20 -240 q -40 -120 10 -220" stroke="#c9b9a0" stroke-opacity="0.08" stroke-width="40" fill="none" filter="url(#blurSm)"/>`;
    s += `<ellipse cx="1200" cy="660" rx="140" ry="40" fill="#1b0f0b"/>`;
    for (let i = 0; i < 8; i++) s += circ(1080 + i * 34, 665, 14, INK);
    return s;
  },
  barrels(R, P) { // the Chute
    let s = glow(1700, 280, 420, P.glow, 0.3) + rect(0, 620, W, 180, "#070404");
    s += poly([[200, 220], [2300, 560], [2300, 600], [200, 270]], "#120a08");
    for (let i = 0; i < 26; i++) { const t = i / 26, x = 260 + t * 1950, y = 230 + t * 340 - 60; s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="34" ry="44" fill="#1a110c" stroke="#3a2618" stroke-width="3"/>` + line(x - 34, y, x + 34, y, 3, "#3a2618"); }
    for (let r = 0; r < 4; r++) for (let i = 0; i < 18; i++) { const x = 60 + i * 130 + (r % 2) * 60, y = 760 - r * 70; s += `<ellipse cx="${x}" cy="${y}" rx="52" ry="36" fill="#140c08" stroke="#3a2618" stroke-width="3"/>`; if (R() < 0.2) s += drips(R, 2, x - 20, x + 20, y + 20, P.accent, 30); }
    s += `<text x="1450" y="745" fill="${P.accent}" font-family="Cinzel" font-size="34" opacity="0.7" transform="rotate(-4 1450 745)">LOW TILTH · SATED · LOW TILTH</text>`;
    return s;
  },
  pier(R, P, opts = {}) { // a road or pier receding to a vanishing point
    const vx = opts.vx || 1250, vy = opts.vy || 430; let s = glow(vx, vy - 40, 360, P.glow, 0.45);
    if (opts.sea !== false) s += rect(0, vy, W, H - vy, "#05090a");
    s += poly([[vx - 6, vy], [vx + 6, vy], [1700, 800], [800, 800]], opts.road || "#0d1212");
    for (let i = 0; i < 30; i++) { const t = Math.pow(i / 30, 1.7); const yl = vy + (800 - vy) * t, xl = vx + (800 - vx) * t, xr = vx + (1700 - vx) * t; s += line(xl, yl, xr, yl, 1 + t * 3, "#1d2424"); if (opts.lamps) { s += line(xl - 10, yl, xl - 10, yl - 160 * t - 10, 2 + 4 * t) + glow(xl - 10, yl - 160 * t - 10, 8 + 30 * t, P.glow, 0.85); } if (opts.posts) s += line(xr + 6, yl, xr + 6, yl - 90 * t - 5, 2 + 5 * t); }
    if (opts.walkers) for (let i = 0; i < 5; i++) { const t = 0.25 + i * 0.12; s += figure(vx + (1200 - vx) * t + (i - 2) * 30 * t, vy + (800 - vy) * t, 260 * t, INK); }
    return s;
  },
  slab(R, P) { // Longslab: a wet beach that never dries, hooks
    let s = glow(1300, 300, 520, P.glow, 0.3) + rect(0, 520, W, 280, "#0b1112");
    for (let i = 0; i < 60; i++) s += line(R() * W, 540 + R() * 250, R() * W, 540 + R() * 250, 1.5, "#c9dad6", `opacity="0.15"`);
    for (let i = 0; i < 40; i++) { const x = 100 + R() * 2200, y = 560 + R() * 200; s += `<path d="M${x} ${y} q -18 30 0 50 q 14 8 22 -6" stroke="#2a3536" stroke-width="7" fill="none"/>`; }
    s += `<path d="M0 600 Q 900 470 2400 560 L2400 520 Q 900 440 0 560 Z" fill="#1a2223"/>`;
    s += figure(1700, 640, 170, INK) + figure(1780, 650, 150, INK);
    return s;
  },
  ribs(R, P) { // the Uncovered: wrecks and too many ribs on the seabed
    let s = glow(1600, 250, 500, P.glow, 0.28) + ground(R, 600, 30, "#0b1213");
    for (let i = 0; i < 24; i++) { const x = 300 + i * 70; const h = 260 * Math.sin((i / 23) * Math.PI) + 60; s += `<path d="M${x} 640 Q ${x + 30} ${640 - h} ${x + 80} ${640 - h * 0.6}" stroke="#c9dad6" stroke-opacity="0.35" stroke-width="12" fill="none"/>`; }
    s += poly([[1750, 640], [1830, 330], [1850, 330], [1880, 640]], "#0a1112") + poly([[1700, 460], [2000, 470], [2010, 500], [1690, 490]], "#0a1112");
    for (let i = 0; i < 40; i++) s += line(R() * W, 640, R() * W + 10, 560 + R() * 40, 3, "#0f1819");
    s += figure(900, 690, 130, INK, { eyes: "#3f8c8a" });
    return s;
  },
  cliffchains(R, P) { // the Hanging Abbey
    let s = glow(700, 260, 500, P.glow, 0.3) + rect(0, 650, W, 150, "#05090a");
    s += poly([[1100, 0], [2400, 0], [2400, 800], [1150, 800], [1180, 600], [1120, 400], [1170, 200]], "#0b1011");
    for (let i = 0; i < 70; i++) { const x = 1200 + R() * 1150, y = 80 + R() * 520; s += line(x, y - 60, x, y, 1.5, "#4a5a5a") + poly([[x - 8, y], [x + 8, y], [x + 6, y + 40], [x - 6, y + 40]], "#141c1d") + circ(x, y - 4, 6, "#141c1d"); }
    for (let i = 0; i < 8; i++) s += `<path d="M0 ${560 + i * 14} Q 600 ${520 + i * 12} 1150 ${600 + i * 6}" stroke="#c9dad6" stroke-opacity="0.08" stroke-width="3" fill="none"/>`;
    return s;
  },
  trench(R, P) { // the Trench: the edge where the water is going
    let s = glow(1200, 600, 600, P.glow, 0.12) + ground(R, 380, 20, "#0b1213");
    s += `<path d="M0 520 Q 1200 420 2400 520 L2400 800 L0 800 Z" fill="#000"/>`;
    for (let i = 0; i < 18; i++) { const x = 100 + i * 130; s += `<path d="M${x} 470 q 20 120 -10 330" stroke="#3f8c8a" stroke-opacity="0.35" stroke-width="${3 + R() * 6}" fill="none"/>`; }
    s += figure(1200, 470, 120, INK) + line(1200, 470, 1200, 800, 2, "#3f8c8a", `opacity="0.4"`);
    return s;
  },
  lamps(R, P) { // the Vigil: a city never dark, mirrors, smoke
    let s = glow(1200, 360, 700, P.glow, 0.2);
    for (let i = 0; i < 40; i++) { const x = R() * W, w = 50 + R() * 120, h = 200 + R() * 360; s += rect(x, 800 - h, w, h, "#0c0907"); for (let k = 0; k < 6; k++) if (R() < 0.7) s += rect(x + 8 + R() * (w - 20), 800 - h + 20 + R() * (h - 40), 8, 12, P.glow, `opacity="0.9"`); }
    for (let i = 0; i < 160; i++) s += glow(R() * W, 200 + R() * 500, 4 + R() * 10, P.glow, 0.7);
    for (let i = 0; i < 12; i++) s += `<path d="M${R() * W} 800 q 60 -300 -40 -560 q -60 -200 20 -260" stroke="#3a2a1a" stroke-opacity="0.25" stroke-width="80" fill="none" filter="url(#blurSm)"/>`;
    return s;
  },
  beds(R, P) { // the Dormitory: rows of beds to the vanishing point
    const vx = 1200, vy = 330; let s = glow(vx, vy, 300, P.glow, 0.35) + rect(0, vy, W, H - vy, "#0b0806");
    for (let side of [-1, 1]) for (let r = 0; r < 3; r++) for (let k = 0; k < 18; k++) { const t = 1 - k / 18; const x0 = 1200 + side * (300 + r * 360), y0 = 800; const p = persp(vx, vy, x0, y0, 1 - t); const w = 170 * t, h = 40 * t; s += rect(p[0] - w / 2, p[1] - h, w, h, "#1e1711") + `<ellipse cx="${f(p[0])}" cy="${f(p[1] - h)}" rx="${f(w * 0.42)}" ry="${f(h * 0.5)}" fill="#3a2f22"/>` + circ(p[0] - w * 0.36, p[1] - h * 1.05, 9 * t, "#5a4a36"); }
    s += figure(1200, 640, 200, INK) + candle(1240, 560, 30, P.glow);
    return s;
  },
  stair(R, P) { // the Nodding Stair: an endless staircase of standing councillors
    let s = glow(1500, 200, 520, P.glow, 0.3);
    for (let i = 0; i < 26; i++) { const x = 100 + i * 90, y = 760 - i * 26; s += rect(x, y, 2400 - x, 26, i % 2 ? "#120d09" : "#0e0a07"); if (i % 2 === 0) s += figure(x + 40, y, 120 - i * 2, INK); }
    for (let i = 0; i < 6; i++) s += candle(300 + i * 360, 720 - i * 104, 30, P.glow);
    return s;
  },
  slum(R, P, opts = {}) { // the Slope / the Breakdowns: stacked shacks down a slope or canyon floor
    let s = glow(opts.lx || 1800, 260, 520, P.glow, 0.28);
    for (let i = 0; i < 70; i++) { const x = R() * W, y = (opts.flat ? 520 : 260 + x * 0.17) + R() * 200, w = 60 + R() * 90, h = 40 + R() * 70; s += poly([[x, y], [x + w, y - 10 + R() * 20], [x + w, y + h], [x, y + h]], "#0f0a08") + (R() < 0.3 ? rect(x + w * 0.4, y + h * 0.4, 10, 12, P.glow, `opacity="0.7"`) : ""); }
    s += rect(0, 720, W, 80, "#070505");
    if (opts.figures) for (let i = 0; i < 6; i++) s += figure(300 + i * 330, 790, 150 + R() * 40, INK, { rags: true });
    if (opts.walls) { s += poly([[0, 0], [380, 0], [300, 800], [0, 800]], "#140b07") + poly([[2400, 0], [2020, 0], [2100, 800], [2400, 800]], "#140b07"); }
    return s;
  },
  glassbox(R, P) { // the Glass House
    let s = glow(1200, 400, 500, P.glow, 0.25) + ground(R, 680, 8);
    s += rect(820, 200, 760, 480, "#1a1510", `stroke="#d98b2b" stroke-opacity="0.45" stroke-width="4"`);
    for (let i = 1; i < 6; i++) s += line(820 + i * 127, 200, 820 + i * 127, 680, 3, "#2a2016");
    for (let i = 1; i < 4; i++) s += line(820, 200 + i * 120, 1580, 200 + i * 120, 3, "#2a2016");
    s += glow(1200, 460, 160, P.glow, 0.5) + figure(1200, 680, 300, INK) + `<ellipse cx="1200" cy="420" rx="22" ry="16" fill="${P.glow}" opacity="0.8"/>`;
    s += figure(500, 760, 180, INK) + figure(1900, 770, 170, INK);
    return s;
  },
  eye(R, P) { // Iss: the closed, then lidless eye at the end of the long room
    let s = rect(0, 0, W, H, "#070503") + glow(1200, 380, 520, P.glow, 0.18);
    s += `<path d="M560 380 Q 1200 60 1840 380 Q 1200 700 560 380 Z" fill="#1d150e" stroke="#d98b2b" stroke-opacity="0.35" stroke-width="5"/>`;
    s += circ(1200, 380, 190, "#2a1c10") + circ(1200, 380, 120, "#0a0603") + circ(1200, 380, 54, "#000") + glow(1160, 340, 30, "#fff3d9", 0.6);
    for (let i = 0; i < 40; i++) { const a = Math.PI + (i / 39) * Math.PI; s += line(1200 + Math.cos(a) * 640, 380 + Math.sin(a) * 320 * 0.5 - 0, 1200 + Math.cos(a) * 700, 380 + Math.sin(a) * 360 * 0.5 - 20, 3, "#3a2a1a"); }
    for (let r = 0; r < 4; r++) for (let k = 0; k < 10; k++) s += rect(80 + k * 230, 720 - r * 4, 160, 18, "#0e0a07");
    return s;
  },
  roundhouses(R, P) { // Kest
    let s = glow(1200, 260, 560, P.glow, 0.28);
    for (let i = 0; i < 22; i++) { const x = R() * W, y = 520 + R() * 200, r = 60 + R() * 90; s += `<path d="M${x - r} ${y} A ${r} ${r} 0 0 1 ${x + r} ${y} L${x + r} ${y + 120} L${x - r} ${y + 120} Z" fill="#170a08"/>` + `<path d="M${x - 14} ${y + 120} L${x - 14} ${y + 70} A 14 14 0 0 1 ${x + 14} ${y + 70} L${x + 14} ${y + 120}" fill="${P.glow}" opacity="${(0.25 + R() * 0.4).toFixed(2)}"/>`; }
    s += ground(R, 740, 6);
    return s;
  },
  crater(R, P) { // the Dilation: a perfect round opening in red clay, watchers at the rim
    let s = glow(1200, 300, 600, P.glow, 0.2) + rect(0, 380, W, 420, "#1a0b08");
    s += `<ellipse cx="1200" cy="560" rx="760" ry="150" fill="#050202"/>` + `<ellipse cx="1200" cy="560" rx="760" ry="150" fill="none" stroke="${P.accent}" stroke-width="10" opacity="0.55"/>`;
    for (let i = 0; i < 30; i++) { const a = (i / 30) * Math.PI * 2; s += figure(1200 + Math.cos(a) * 800, 560 + Math.sin(a) * 175, 50 + 20 * (Math.sin(a) + 1), INK); }
    for (let i = 0; i < 12; i++) s += `<path d="M${500 + i * 120} 560 q ${f((R() - 0.5) * 60)} 120 ${f((R() - 0.5) * 80)} 240" stroke="${P.accent}" stroke-opacity="0.3" stroke-width="6" fill="none"/>`;
    return s;
  },
  door(R, P, opts = {}) { // the Sill / Vey: a door standing alone on a hill, ajar, light behind
    let s = glow(1200, 360, 600, P.glow, 0.15) + hillLine(R, 560, 120, 0.0016, "#120807", 1.6);
    s += rect(1120, 220, 180, 330, "none", `stroke="${INK}" stroke-width="22"`) + rect(1131, 231, 158, 309, "#000");
    s += rect(1131, 231, 22, 309, "#fff4dd", `opacity="0.9"`) + glow(1142, 385, 120, "#fff2d0", 0.55);
    s += poly([[1153, 231], [1289, 220], [1289, 560], [1153, 540]], "#120a08");
    if (opts.caul) s += `<ellipse cx="1210" cy="385" rx="300" ry="240" fill="none" stroke="#c66a48" stroke-opacity="0.25" stroke-width="40" filter="url(#blurSm)"/>`;
    s += figure(820, 640, 130, INK) + line(860, 520, 880, 640, 4);
    return s;
  },
  barn(R, P) { // the Assemblers' Barn
    let s = glow(1200, 300, 500, P.glow, 0.2) + ground(R, 680, 10);
    s += poly([[600, 680], [600, 330], [1200, 130], [1800, 330], [1800, 680]], "#130908") + rect(1050, 420, 300, 260, P.glow, `opacity="0.6"`) + glow(1200, 560, 180, P.glow, 0.5);
    s += `<path d="M1080 650 q 60 -40 120 -30 q 80 10 120 -10 q 40 20 20 40 z" fill="${INK}"/>`;
    for (let i = 0; i < 6; i++) s += line(1090 + i * 45, 640, 1095 + i * 45, 600 - R() * 30, 4);
    s += figure(400, 760, 170, INK);
    return s;
  },
  fortress(R, P, opts = {}) { // the Lying-In / the Pantry: a squat fortified building
    let s = glow(opts.lx || 1600, 280, 500, P.glow, 0.25) + ground(R, 700, 8);
    s += rect(700, 300, 1000, 400, "#120a08") + rect(650, 250, 140, 450, "#0f0806") + rect(1610, 250, 140, 450, "#0f0806");
    for (let i = 0; i < 9; i++) s += rect(760 + i * 100, 400, 22, 60, opts.dark ? "#050302" : P.glow, `opacity="${opts.dark ? 1 : 0.6}"`);
    for (let i = 0; i < 12; i++) s += rect(650 + i * 92, 230, 50, 24, "#0f0806");
    if (opts.line) for (let i = 0; i < 9; i++) s += figure(300 + i * 70, 780, 120, INK);
    return s;
  },
  canyon(R, P, opts = {}) { // Oathen canyons with carved windows; gorge; ledger
    let s = glow(1200, 120, 520, P.glow, 0.35);
    const l = [[0, 0], [opts.narrow ? 980 : 760, 0], [opts.narrow ? 1080 : 900, 300], [opts.narrow ? 1020 : 820, 800], [0, 800]];
    const r = [[2400, 0], [opts.narrow ? 1420 : 1640, 0], [opts.narrow ? 1320 : 1500, 320], [opts.narrow ? 1380 : 1580, 800], [2400, 800]];
    s += poly(l, "#1a0d07") + poly(r, "#170b06");
    if (!opts.narrow) for (let i = 0; i < 90; i++) { const left = R() < 0.5, x = left ? 60 + R() * 680 : 1660 + R() * 700, y = 60 + R() * 680; s += rect(x, y, 18, 26, R() < 0.25 ? P.glow : "#060302", `opacity="${R() < 0.25 ? 0.7 : 1}"`); }
    if (opts.ledger) for (let r2 = 0; r2 < 34; r2++) s += line(1700, 40 + r2 * 22, 2350, 40 + r2 * 22 + (R() - 0.5) * 6, 2, P.accent, `opacity="0.45"`);
    if (opts.rings) for (let i = 0; i < 6; i++) s += `<ellipse cx="1200" cy="420" rx="${80 + i * 70}" ry="${30 + i * 26}" fill="none" stroke="${P.glow}" stroke-opacity="${(0.35 - i * 0.05).toFixed(2)}" stroke-width="3"/>`;
    s += rect(0, 760, W, 40, "#0a0503");
    if (opts.figure !== false) s += figure(1200, 780, 140, INK, { rags: true });
    return s;
  },
  mouth(R, P) { // Tolm: a great mouth in the canyon wall, bitted
    let s = rect(0, 0, W, H, "#140a06") + glow(1200, 400, 500, P.glow, 0.15);
    s += `<path d="M640 400 Q 1200 160 1760 400 Q 1200 640 640 400 Z" fill="#000"/>`;
    for (let i = 0; i < 26; i++) { const x = 700 + i * 40; s += poly([[x, 330 + Math.abs(i - 13) * 6], [x + 16, 330 + Math.abs(i - 13) * 6], [x + 8, 400]], "#d9c7a5") + poly([[x, 470 - Math.abs(i - 13) * 6], [x + 16, 470 - Math.abs(i - 13) * 6], [x + 8, 405]], "#d9c7a5"); }
    s += rect(300, 392, 1800, 18, "#c79b3e") + circ(300, 401, 30, "#c79b3e") + circ(2100, 401, 30, "#c79b3e");
    s += `<path d="M1150 470 q 50 60 100 0" stroke="${P.accent}" stroke-width="12" fill="none"/>` + drips(R, 6, 1150, 1250, 480, P.accent, 120);
    return s;
  },
  cells(R, P) { // the Gilded Cells
    let s = rect(0, 0, W, H, "#0c0705") + glow(1200, 400, 380, "#e3b456", 0.25);
    for (let i = 0; i < 3; i++) { const x = 380 + i * 620; s += rect(x, 160, 420, 520, "#120a06"); for (let b = 0; b < 9; b++) s += rect(x + 20 + b * 46, 160, 8, 520, "#c79b3e", `opacity="0.75"`); s += figure(x + 210, 640, 260, INK) + rect(x + 185, 470, 50, 10, "#e3b456"); }
    return s;
  },
  table(R, P, opts = {}) { // laid tables: Long Table, Hallowboard, Empty Chair, Orrum, Thimble Cross
    let s = glow(opts.lx || 1200, opts.ly || 340, 500, P.glow, 0.4);
    if (opts.long) { const vx = 1200, vy = 330; s += rect(0, vy, W, H - vy, "#0d0a06") + poly([[vx - 8, vy], [vx + 8, vy], [1650, 800], [750, 800]], "#2a2014") + poly([[vx - 8, vy], [vx + 8, vy], [1650, 800], [750, 800]], "none", `stroke="#d8a64a" stroke-opacity="0.3"`);
      for (let k = 1; k < 26; k++) { const t = Math.pow(k / 26, 1.6); const y = vy + (800 - vy) * t, xl = vx + (750 - vx) * t, xr = vx + (1650 - vx) * t; s += figure(xl - 70 * t, y + 40 * t, 430 * t, INK) + figure(xr + 70 * t, y + 40 * t, 430 * t, INK); if (k % 3 === 0) s += candle(vx, y, 30 * t, P.glow); s += `<ellipse cx="${f(xl + 30 * t)}" cy="${f(y)}" rx="${f(26 * t)}" ry="${f(8 * t)}" fill="#e8dcc0" opacity="0.5"/>` + `<ellipse cx="${f(xr - 30 * t)}" cy="${f(y)}" rx="${f(26 * t)}" ry="${f(8 * t)}" fill="#e8dcc0" opacity="0.5"/>`; } }
    if (opts.octagon) { s += hillLine(R, 600, 140, 0.0013, "#0f0c08", 1.5); const cx = 1200, cy = 470; let pts = []; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; pts.push([cx + Math.cos(a) * 300, cy + Math.sin(a) * 70]); } s += poly(pts, "#2a2219", `stroke="#d8c9a8" stroke-opacity="0.4" stroke-width="3"`) + rect(cx - 300, cy, 600, 70, "#120e09"); for (let i = 0; i < 7; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8 + Math.PI / 8; s += chair(cx + Math.cos(a) * 360, cy + Math.sin(a) * 100 + 60, 70); } }
    if (opts.single) { s += rect(0, 600, W, 200, "#080605") + rect(950, 500, 500, 22, "#2a2014") + rect(970, 522, 18, 120, "#1a140c") + rect(1412, 522, 18, 120, "#1a140c") + `<ellipse cx="1200" cy="498" rx="90" ry="16" fill="#e8dcc0" opacity="0.8"/>` + candle(1050, 500, 50, P.glow) + candle(1350, 500, 50, P.glow) + chair(1200 + (opts.pulled ? 160 : 0), 650, 150, "#120d08"); }
    if (opts.host) s += figure(1700, 780, 640, "#0a0806", { stoop: -60 }) + glow(1640, 260, 80, P.glow, 0.25);
    if (opts.void) { s = rect(0, 0, W, H, "#000") + glow(1200, 420, 300, "#f2eee6", 0.12) + chair(1240, 640, 220, "#d8d2c6") + rect(0, 640, W, 2, "#2a2a2a"); }
    return s;
  },
  houses(R, P, opts = {}) { // Wanting / Thimble Cross: plain houses, cold plain, snow
    let s = glow(opts.lx || 1700, 280, 520, P.glow, 0.25) + ground(R, 660, 6, "#0d0c0a");
    for (let i = 0; i < (opts.n || 16); i++) { const x = 100 + i * (2200 / (opts.n || 16)) + R() * 40, w = 90 + R() * 60, h = 70 + R() * 50, y = 660; s += rect(x, y - h, w, h, "#0d0b08") + poly([[x - 10, y - h], [x + w / 2, y - h - 60], [x + w + 10, y - h]], "#0d0b08"); if (opts.chimney) s += rect(x + w * 0.7, y - h - 50, 14, 40, "#0d0b08"); if (R() < (opts.lit || 0.15)) s += rect(x + w * 0.35, y - h * 0.6, 14, 18, P.glow, `opacity="0.75"`); }
    if (opts.inn) { s += rect(950, 300, 520, 360, "#120e0a") + poly([[920, 300], [1210, 160], [1500, 300]], "#120e0a"); for (let i = 0; i < 5; i++) s += rect(990 + i * 96, 420, 30, 46, P.glow, `opacity="0.8"`) + glow(1005 + i * 96, 440, 40, P.glow, 0.3); }
    if (opts.snow) for (let i = 0; i < 500; i++) s += circ(R() * W, R() * H, 0.8 + R() * 2, "#ece6d8", `opacity="${(0.3 + R() * 0.5).toFixed(2)}"`);
    if (opts.standing) for (let i = 0; i < 14; i++) s += figure(150 + i * 160, 780, 120 + R() * 30, INK);
    return s;
  },
};

// ---------- plate definitions ----------
const PLATES = [
  ["world", "The Long Grace", "The Table, six hundred and forty-one years after the meal", "eighth", (R, P) => M.world(R, P)],
  ["ossel", "Ossel, the Closing Hand", "God of death and endings", "sallowreach", (R, P) => M.hand(R, P)],
  ["ummer", "Ummer, the Laden", "God of harvest and plenty", "fatlands", (R, P) => M.hill(R, P, { giant: true })],
  ["dromm", "Dromm, the Fathom", "God of the deep and what is kept under", "brinehollow", (R, P) => M.waves(R, P, { leviathan: true })],
  ["iss", "Iss, the Lidded", "God of sleep", "vigil", (R, P) => M.eye(R, P)],
  ["vey", "Vey, the Opening", "God of birth, beginnings and doors", "cradlewrack", (R, P) => M.door(R, P, { caul: true })],
  ["tolm", "Tolm, the Witness", "God of oaths and true speech", "oathen", (R, P) => M.mouth(R, P)],
  ["orrum", "Orrum, the Host", "The god who was not eaten", "fast", (R, P) => M.table(R, P, { single: true, host: true, lx: 1300 })],
  ["eighth", "The Eighth", "The chair that is still pulled out", "eighth", (R, P) => M.table(R, P, { void: true })],
  ["lastgate", "Lastgate", "The city on pilings where nothing ends", "sallowreach", (R, P) => M.pilings(R, P)],
  ["lofts", "The Lofts", "Nine storeys of the Set-Aside", "sallowreach", (R, P) => M.shelves(R, P)],
  ["sump", "The Sump", "Where the unstitchable are sunk", "sallowreach", (R, P) => M.fenwater(R, P)],
  ["dunmere", "Dunmere Hush", "The first and largest silence", "sallowreach", (R, P) => M.hush(R, P)],
  ["jarroom", "The Jar Room", "One shelf, very long", "sallowreach", (R, P) => M.shelves(R, P, { jars: true })],
  ["sated", "Sated", "The capital with ramps instead of stairs", "fatlands", (R, P) => M.domes(R, P)],
  ["orchards", "The Bleeding Orchards", "Ten thousand acres that scream at pruning", "fatlands", (R, P) => M.orchard(R, P)],
  ["lowtilth", "Low Tilth", "The richest soil, the highest Reaping", "fatlands", (R, P) => M.wheat(R, P, { scarecrow: true })],
  ["dowager", "The Dowager Hills", "Nine generations of matriarchs, Seated", "fatlands", (R, P) => M.hill(R, P, { mouths: true })],
  ["chute", "The Chute", "Origin stamped over twice", "fatlands", (R, P) => M.barrels(R, P)],
  ["lowmark", "Lowmark", "Nineteen miles of pier after a leaving sea", "brinehollow", (R, P) => M.pier(R, P, { lamps: true, posts: true })],
  ["longslab", "Longslab", "The beach that has never dried", "brinehollow", (R, P) => M.slab(R, P)],
  ["uncovered", "The Uncovered", "A new mile of seabed every year", "brinehollow", (R, P) => M.ribs(R, P)],
  ["abbey", "The Hanging Abbey", "A cliff hung with a thousand living monks", "brinehollow", (R, P) => M.cliffchains(R, P)],
  ["trench", "The Trench", "Where the water is going", "brinehollow", (R, P) => M.trench(R, P)],
  ["vigilcity", "The Vigil", "The city that has not slept in three centuries", "vigil", (R, P) => M.lamps(R, P)],
  ["dormitory", "The Dormitory", "Sixty thousand beds, breathing in time", "vigil", (R, P) => M.beds(R, P)],
  ["noddingstair", "The Nodding Stair", "A council that may never sit", "vigil", (R, P) => M.stair(R, P)],
  ["slope", "The Slope", "Where whole families go down in an afternoon", "vigil", (R, P) => M.slum(R, P, { lx: 600 })],
  ["glasshouse", "The Glass House", "Quarantine for those whose yawns are catching", "vigil", (R, P) => M.glassbox(R, P)],
  ["kest", "Kest", "A city of round red houses and no door that locks", "cradlewrack", (R, P) => M.roundhouses(R, P)],
  ["dilation", "The Dilation", "A mile across and widening", "cradlewrack", (R, P) => M.crater(R, P)],
  ["sill", "The Sill", "A door standing in its frame on a hill", "cradlewrack", (R, P) => M.door(R, P)],
  ["barn", "The Assemblers' Barn", "Visitors are not shown the far end", "cradlewrack", (R, P) => M.barn(R, P)],
  ["lyingin", "The Lying-In", "Where the births nobody speaks of are taken", "cradlewrack", (R, P) => M.fortress(R, P, { dark: true })],
  ["tacit", "Tacit", "Half a million people and you can hear a sandal drop", "oathen", (R, P) => M.canyon(R, P)],
  ["breakdowns", "The Breakdowns", "Slum of the Forsworn", "oathen", (R, P) => M.slum(R, P, { flat: true, figures: true, walls: true, lx: 1200 })],
  ["sworngorge", "Sworn Gorge", "An oath shouted in 419 that has never stopped", "oathen", (R, P) => M.canyon(R, P, { narrow: true, rings: true })],
  ["ledger", "The Ledger", "Four miles of carved vows", "oathen", (R, P) => M.canyon(R, P, { ledger: true })],
  ["gildedcells", "The Gilded Cells", "Where the Sayers are kept", "oathen", (R, P) => M.cells(R, P)],
  ["hallowboard", "Hallowboard", "The eight-sided table at the centre of the world", "fast", (R, P) => M.table(R, P, { octagon: true })],
  ["wanting", "Wanting", "The town with no hearths", "fast", (R, P) => M.houses(R, P, { standing: true, lit: 0.05 })],
  ["longtable", "The Long Table", "Nine miles of the Seated, eating nothing in good cheer", "fast", (R, P) => M.table(R, P, { long: true })],
  ["emptychair", "The Empty Chair", "The last temple of the Host", "fast", (R, P) => M.table(R, P, { single: true, pulled: true })],
  ["pantry", "The Pantry", "Four months of grain for six months of winter", "fast", (R, P) => M.fortress(R, P, { line: true, lx: 900 })],
  ["rimroad", "The Rim Road", "Two thousand four hundred miles around a hole", "rim", (R, P) => M.pier(R, P, { sea: false, road: "#14120f", lamps: true, walkers: true, vy: 400 })],
  ["thimblecross", "Thimble Cross", "A waystation, the week before Tablenight", "rim", (R, P) => M.houses(R, P, { inn: true, snow: true, n: 6, chimney: true, lit: 0.4, lx: 1200 })],
];

// ---------- frame + composition ----------
const font = (fam, file, w, s = "normal") => `@font-face{font-family:'${fam}';src:url(data:font/woff2;base64,${fs.readFileSync(path.join(FONTS, file)).toString("base64")}) format('woff2');font-weight:${w};font-style:${s};}`;
const FONT_CSS = [
  font("Josefin", "josefin-sans/files/josefin-sans-latin-300-normal.woff2", 300),
  font("Josefin", "josefin-sans/files/josefin-sans-latin-400-normal.woff2", 400),
  font("Cormorant", "cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2", 400, "italic"),
  font("Cinzel", "cinzel/files/cinzel-latin-400-normal.woff2", 400),
].join("");

const GOLD = "#b79c63", GOLD_HI = "#d8bf86", GOLD_DIM = "#7d6a45";

function frameSVG(land, title, sub, { frameOnly = false } = {}) {
  const P = LAND[land];
  const sig = sigils[land === "eighth" ? "eighth" : land] || sigils.eighth;
  const sigInner = sig.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "").replace(/currentColor/g, GOLD_HI);
  const d = (x, y, r = 9) => `<path d="M${x} ${y - r} L${x + r} ${y} L${x} ${y + r} L${x - r} ${y} Z" fill="${GOLD}"/>`;
  const kicker = `THE LONG GRACE  ·  ${P.name.toUpperCase()}`;
  return `
  ${frameOnly ? "" : `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#vignette)"/>
  <ellipse cx="1200" cy="640" rx="880" ry="150" fill="#000" opacity="0.72" filter="url(#blurBig)"/>`}
  <rect x="26" y="26" width="${W - 52}" height="${H - 52}" fill="none" stroke="${GOLD}" stroke-width="2.2"/>
  <rect x="44" y="44" width="${W - 88}" height="${H - 88}" fill="none" stroke="${GOLD_DIM}" stroke-width="1.2"/>
  ${d(44, 44)}${d(W - 44, 44)}${d(44, H - 44)}${d(W - 44, H - 44)}
  ${[0, 1].map((k) => `<line x1="${k ? W - 120 : 80}" y1="44" x2="${k ? W - 80 : 120}" y2="44" stroke="${GOLD}" stroke-width="5"/><line x1="${k ? W - 120 : 80}" y1="${H - 44}" x2="${k ? W - 80 : 120}" y2="${H - 44}" stroke="${GOLD}" stroke-width="5"/>`).join("")}
  <rect x="1130" y="0" width="140" height="64" fill="${frameOnly ? "#000" : P.base}"/>
  <line x1="1130" y1="26" x2="1130" y2="44" stroke="${GOLD}" stroke-width="2"/><line x1="1270" y1="26" x2="1270" y2="44" stroke="${GOLD}" stroke-width="2"/>
  <g transform="translate(1166 6) scale(0.68)" fill="none" stroke="${GOLD_HI}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${sigInner}</g>
  <text x="1200" y="566" text-anchor="middle" font-family="Josefin" font-weight="400" font-size="17" letter-spacing="9" fill="${GOLD}">${kicker}</text>
  <text x="1200" y="652" text-anchor="middle" font-family="Josefin" font-weight="300" font-size="70" letter-spacing="22" fill="${GOLD_HI}">${title.toUpperCase()}</text>
  <line x1="${1200 - 520}" y1="684" x2="${1200 - 70}" y2="684" stroke="${GOLD_DIM}" stroke-width="1.4"/><line x1="${1200 + 70}" y1="684" x2="${1200 + 520}" y2="684" stroke="${GOLD_DIM}" stroke-width="1.4"/>
  ${d(1200 - 520, 684, 5)}${d(1200 + 520, 684, 5)}${d(1200, 684, 6)}
  <text x="1200" y="726" text-anchor="middle" font-family="Cormorant" font-style="italic" font-size="34" fill="#cfc4ad">${sub}</text>`;
}

function defs(P, R) {
  const fogTint = P.fog.join(" ");
  return `<defs>
  <filter id="ink" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="${Math.floor(R() * 99)}"/><feDisplacementMap in="SourceGraphic" scale="9"/></filter>
  <filter id="fog" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.0016 0.006" numOctaves="4" seed="${Math.floor(R() * 99)}"/><feColorMatrix type="matrix" values="0 0 0 0 ${P.fog[0]}  0 0 0 0 ${P.fog[1]}  0 0 0 0 ${P.fog[2]}  0.9 0 0 0 -0.25"/></filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/><feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.48  0 0 0 0 0.45  0 0 0 0.55 0"/></filter>
  <filter id="scratch" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.002 0.35" numOctaves="1" seed="${Math.floor(R() * 99)}"/><feColorMatrix type="matrix" values="0 0 0 0 0.85  0 0 0 0 0.82  0 0 0 0 0.78  0 0 0 -2.2 1.05"/></filter>
  <filter id="blurBig"><feGaussianBlur stdDeviation="60"/></filter>
  <filter id="blurSm"><feGaussianBlur stdDeviation="14"/></filter>
  <radialGradient id="vignette" cx="50%" cy="45%" r="75%"><stop offset="45%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.92"/></radialGradient>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.base}"/><stop offset="0.55" stop-color="${shade(P.fog, 0.22)}"/><stop offset="1" stop-color="${P.base}"/></linearGradient>
  </defs>`;
}
function shade(rgb, k) { return "#" + rgb.map((v) => Math.round(v * k * 255).toString(16).padStart(2, "0")).join(""); }

function plateSVG([key, title, sub, land, draw]) {
  const R = rng(key), P = LAND[land];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs(P, R)}
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <rect width="${W}" height="${H}" filter="url(#fog)" opacity="0.7"/>
  <g filter="url(#ink)">${draw(R, P)}</g>
  <rect width="${W}" height="${H}" filter="url(#fog)" opacity="0.2"/>
  ${splatter(R, 140, 60, W - 60, 60, H - 60, INK, 5)}
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.35" style="mix-blend-mode:overlay"/>
  <rect width="${W}" height="${H}" filter="url(#scratch)" opacity="0.07"/>
  ${frameSVG(land, title, sub)}
  </svg>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const want = process.argv.slice(2);
  const list = PLATES.filter((p) => !want.length || want.includes(p[0]));
  const { chromium } = require("../pdfbuild/node_modules/playwright-core");
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const shot = async (svg, file, transparent = false) => {
    await page.setContent(`<!doctype html><html><head><style>${FONT_CSS} html,body{margin:0;background:${transparent ? "transparent" : "#000"}}</style></head><body>${svg}</body></html>`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: file, omitBackground: transparent, type: file.endsWith(".jpg") ? "jpeg" : "png", ...(file.endsWith(".jpg") ? { quality: 88 } : {}) });
  };
  for (const p of list) { await shot(plateSVG(p), path.join(OUT, `${p[0]}.jpg`)); process.stdout.write(p[0] + " "); }
  if (!want.length) {
    await shot(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${frameSVG("eighth", "Title Here", "Subtitle here", { frameOnly: true })}</svg>`, path.join(OUT, "_frame_overlay_example.png"), true);
    await shot(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${frameSVG("eighth", "", "", { frameOnly: true }).replace(/<text[\s\S]*?<\/text>/g, "")}</svg>`, path.join(OUT, "_frame_overlay_blank.png"), true);
  }
  await browser.close();
  fs.writeFileSync(path.join(__dirname, "plates.json"), JSON.stringify(PLATES.map(([k, t, s, l]) => ({ key: k, title: t, subtitle: s, land: l }))));
  console.log("\ndone", list.length);
})();
