// Two-page character sheet for The Long Grace, in the black-and-gold style.
module.exports = (sigils) => {
  const dots = '<span class="dots">○○○○○</span>';
  const box = (label, h = 1, extra = "") => `<div class="sh-box" style="${extra}"><div class="sh-label">${label}</div>${'<div class="sh-line"></div>'.repeat(h)}</div>`;
  const attrs = [
    ["Hand", ["Blades", "Brawl", "Shooting", "Stitching"]],
    ["Gut", ["Endure", "Labor", "Feast", "Intimidate"]],
    ["Lung", ["Athletics", "Stealth", "Wayfaring", "Filch"]],
    ["Eye", ["Search", "Lore", "Craft", "Reckoning"]],
    ["Tongue", ["Persuade", "Deceive", "Haggle", "Clause"]],
    ["Caul", ["Resolve", "Rites", "Instinct", "Godsign"]],
  ];
  const attrBox = ([a, sk]) => `<div class="sh-box"><div class="sh-attr head"><span>${a}</span>${dots}</div>${sk.map((s) => `<div class="sh-attr"><span>${s}</span>${dots}</div>`).join("")}</div>`;
  const track = (label, n, note = "") => `<div class="sh-box"><div class="sh-label">${label}</div><div class="track">${"□".repeat(n)}</div>${note ? `<div class="sh-label" style="color:var(--ink-dim);letter-spacing:.08em;text-transform:none;font-size:6.6pt">${note}</div>` : ""}</div>`;
  return `<section class="sheet" id="sheet1">
  <div style="width:.6in;height:.6in;margin:0 auto;color:var(--gold)">${sigils.eighth}</div>
  <h1>The Guest</h1><div class="sh-sub">Character Sheet · Page One · Write in pencil</div>
  <div class="sh-grid" style="grid-template-columns:repeat(4,1fr)">${["Name", "Player", "Land", "Cut (0–5)", "Calling", "Standing", "Age", "Station"].map((l) => box(l)).join("")}</div>
  <div class="sh-grid" style="grid-template-columns:repeat(3,1fr);margin-top:6pt">${attrs.map(attrBox).join("")}</div>
  <div class="sh-grid" style="grid-template-columns:1fr 1fr;margin-top:6pt">
    ${track("Flesh (8 + Gut + Endure)", 20)}
    <div class="sh-grid" style="grid-template-columns:1fr 1fr 1fr">${box("Guard")}${box("Ranged Guard")}${box("Armor")}</div>
    ${track("Hunger (0–10)", 10, "At 10: Regrowth +1, empty Hunger")}
    ${track("Fray (0–10)", 10, "5 Rattled · 8 Fraying · 10 Break: Derangement, Fray to 3")}
    <div class="sh-box"><div class="sh-label">Regrowth (0–12)</div><div class="track">Taste □□□ Appetite □□□ Course □□□ Brink □□ Seating □</div></div>
    ${track("Want (Unfed only) · Pangs", 10)}
  </div>
  <div class="sh-grid" style="grid-template-columns:1fr 1fr;margin-top:6pt">${box("Gifts of the God", 4)}${box("Wants · Triggers · the Sop", 4)}${box("Injuries", 3)}${box("Derangements", 3)}</div>
</section>
<section class="sheet" id="sheet2">
  <h1>What You Carry</h1><div class="sh-sub">Character Sheet · Page Two</div>
  <div class="sh-grid" style="grid-template-columns:2fr 1fr 1fr 2fr">${["Weapon", "Attack", "Damage", "Qualities"].map((l) => box(l, 4)).join("")}</div>
  <div class="sh-grid" style="grid-template-columns:1fr 1fr;margin-top:6pt">${box("Gear", 9)}${box("Leavings & Relics (Taint)", 9)}</div>
  <div class="sh-grid" style="grid-template-columns:1fr 1fr 1fr;margin-top:6pt">${box("Lacks · Crumbs · Notes", 3)}${box("Debts & Sworn Notes", 3)}${box("Knacks", 3)}</div>
  <div class="sh-grid" style="grid-template-columns:1fr 1fr;margin-top:6pt">${box("The Last Meal", 3)}${box("The Oath on the Dead", 3)}${box("Who Waits at Home", 3)}${box("What You Will Not Do", 3)}</div>
  <div class="sh-grid" style="grid-template-columns:1fr 1fr;margin-top:6pt">${box("Portions Earned · Spent", 2)}${box("The Names of Your Dead", 2)}</div>
</section>`;
};
