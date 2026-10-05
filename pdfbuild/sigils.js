// Gold line sigils for each land (stroke-only SVG, 100x100 viewBox)
const S = (inner) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const diamond = (x, y, r = 3) => `<path d="M${x} ${y - r} L${x + r} ${y} L${x} ${y + r} L${x - r} ${y} Z"/>`;

module.exports = {
  // Sallowreach — the closing hand: a hand with an extra joint, over a shut eye
  sallowreach: S(`<circle cx="50" cy="50" r="44"/><path d="M28 62 Q50 76 72 62"/><path d="M28 62 Q50 70 72 62"/>
    <path d="M38 58 L38 30 L41 24 M44 58 L44 22 L46 17 L45 12 M50 58 L50 20 L52 14 L51 9 M56 58 L56 24 L58 18 M62 58 L62 32 L64 27"/>
    <path d="M36 58 L64 58"/>${diamond(50, 88)}${diamond(50, 12)}`),
  // Fatlands — a bowl with a toothed ear of wheat rising from it
  fatlands: S(`<circle cx="50" cy="50" r="44"/><path d="M24 58 Q50 86 76 58 Z"/><path d="M50 58 L50 16"/>
    <path d="M50 24 L42 18 M50 32 L42 26 M50 40 L42 34 M50 24 L58 18 M50 32 L58 26 M50 40 L58 34"/>
    <path d="M44 66 l2 4 l2 -4 l2 4 l2 -4 l2 4"/>${diamond(14, 50)}${diamond(86, 50)}`),
  // Brinehollow — descending waves inside a falling triangle
  brinehollow: S(`<circle cx="50" cy="50" r="44"/><path d="M22 30 L78 30 L50 82 Z"/>
    <path d="M30 42 q5 -5 10 0 t10 0 t10 0 t10 0"/><path d="M35 52 q5 -5 10 0 t10 0 t10 0"/><path d="M41 62 q4 -4 9 0 t9 0"/>${diamond(50, 18)}`),
  // The Vigil — a lidless eye with rays, never closing
  vigil: S(`<circle cx="50" cy="50" r="44"/><path d="M18 50 Q50 20 82 50 Q50 80 18 50 Z"/><circle cx="50" cy="50" r="11"/><circle cx="50" cy="50" r="3"/>
    <path d="M50 8 L50 20 M50 80 L50 92 M20 20 L28 28 M80 20 L72 28 M20 80 L28 72 M80 80 L72 72"/>`),
  // Cradlewrack — an arched door standing ajar, a ring of birth beneath
  cradlewrack: S(`<circle cx="50" cy="50" r="44"/><path d="M34 76 L34 40 Q50 20 66 40 L66 76 Z"/><path d="M50 76 L50 26"/><path d="M50 30 L60 36 L60 74 L50 76"/>
    <circle cx="50" cy="84" r="4"/>${diamond(22, 50)}${diamond(78, 50)}`),
  // Oathen — a bitted mouth: tongue crossed by a bar
  oathen: S(`<circle cx="50" cy="50" r="44"/><path d="M24 50 Q50 30 76 50 Q50 70 24 50 Z"/><path d="M42 50 Q50 64 58 50"/>
    <path d="M14 50 L86 50"/><circle cx="14" cy="50" r="3"/><circle cx="86" cy="50" r="3"/><path d="M50 14 L50 24 M50 76 L50 86"/>`),
  // The Fast — the empty plate with fork and knife laid, untouched
  fast: S(`<circle cx="50" cy="50" r="44"/><circle cx="50" cy="50" r="24"/><circle cx="50" cy="50" r="16"/>
    <path d="M14 30 L14 70 M10 30 L10 42 Q14 46 18 42 L18 30"/><path d="M86 30 Q92 44 86 52 L86 70"/>${diamond(50, 12)}`),
  // The Rim — a ring road of seven stations around an empty centre
  rim: S(`<circle cx="50" cy="50" r="44"/><circle cx="50" cy="50" r="28"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => { const a = (i / 7) * Math.PI * 2 - Math.PI / 2; return `<circle cx="${(50 + 28 * Math.cos(a)).toFixed(1)}" cy="${(50 + 28 * Math.sin(a)).toFixed(1)}" r="4"/>`; }).join("")}${diamond(50, 50, 4)}`),
  // The Eighth — an octagon with one side chiselled away
  eighth: S(`<path d="${(() => { const pts = []; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 - Math.PI / 2 + Math.PI / 8; pts.push([50 + 40 * Math.cos(a), 50 + 40 * Math.sin(a)]); } return "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L"); })()}"/>
    <path d="M50 30 L50 70 M38 42 L62 58 M62 42 L38 58" stroke-dasharray="3 4"/>`),
};
