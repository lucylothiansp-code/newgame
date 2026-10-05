// Builds "The Long Grace — Table Scraps" as a black-and-gold PDF via Chromium.
// Usage: node build2.js [pagemap.json]   -> writes book2.html and Seven_Tables.pdf
const fs = require("fs");
const path = require("path");
const sigils = require("./sigils");

const ROOT = path.join(__dirname, "..");
const SRC = process.env.SRC_DIR || path.join(ROOT, "book4");
const FONTS = path.join(__dirname, "node_modules/@fontsource");
const pageMap = process.argv[2] && fs.existsSync(process.argv[2]) ? JSON.parse(fs.readFileSync(process.argv[2], "utf8")) : {};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s) => esc(s)
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  .replace(/\*([^*\s][^*]*)\*/g, "<em>$1</em>")
  .replace(/"([^"]*)"/g, "“$1”")
  .replace(/(\w)'(\w)/g, "$1’$2").replace(/'/g, "’")
  .replace(/ -- /g, " — ");
const plain = (s) => s.replace(/\*\*/g, "").replace(/\*/g, "");

let idn = 0;
const heads = []; // {id, text, level, kind}
const persons = []; // {id, name, land}
const leavings = []; // {id, name, land}
const statIndex = [];
let curLand = null;
let chapterNo = 0;

const LANDS = { sallowreach: "Sallowreach", fatlands: "The Fatlands", brinehollow: "Brinehollow", vigil: "The Vigil", cradlewrack: "Cradlewrack", oathen: "Oathen", fast: "The Fast" };
function landOf(file, title = "") {
  for (const k of Object.keys(LANDS)) if (file.includes(k) || title.toLowerCase().includes(k)) return k;
  if (/rim|empty chair/i.test(title)) return "rim";
  return null;
}

function sigil(name, cls = "sigil") {
  return sigils[name] ? `<div class="${cls}">${sigils[name]}</div>` : "";
}

function bigquote(t) {
  const [q, a] = t.split("|").map((s) => s.trim());
  const words = q.replace(/^"|"$/g, "").split(/\s+/);
  const html = words.map((w) => {
    const bare = w.replace(/[^A-Za-z']/g, "");
    return bare.length >= 5 ? `<span class="bq-big">${esc(w)}</span>` : `<span class="bq-small">${esc(w)}</span>`;
  }).join(" ");
  return `<div class="bigquote full"><div class="bq-text">${html}</div>${a ? `<div class="bq-attr">[ ${esc(a.replace(/^[—–-]\s*/, ""))} ]</div>` : ""}</div>`;
}

function statBlock(title, lines) {
  const id = "p" + (++idn);
  statIndex.push({ id, name: plain(title).split(/\s+[—–]\s+/)[0], land: curLand });
  const rows = lines.map((l) => {
    const m = l.match(/^([^:]{1,32}):\s*(.*)$/);
    const label = m ? m[1] : (/^flesh/i.test(l) ? "Body" : "Notes");
    return `<tr><th>${esc(label)}</th><td>${inline(m ? m[2] : l)}</td></tr>`;
  }).join("");
  return `<div class="stat full" id="${id}"><div class="stat-title">${inline(title)}</div><table>${rows}</table></div>`;
}

function table(rows) {
  const cells = rows.map((r) => r.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim()))
    .filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c) || c === ""));
  const [h, ...b] = cells;
  return `<table class="data full"><thead><tr>${h.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${b.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function listBlock(items) { return `<ul>${items.map((i) => `<li>${inline(i)}</li>`).join("")}</ul>`; }

// Parse one markup file into an array of {full:boolean, html}
function parse(file, opts) {
  const lines = fs.readFileSync(file, "utf8").replace(/\r/g, "").split("\n");
  const out = [];
  const push = (html, full = false) => out.push({ html, full });
  let land = landOf(path.basename(file));
  curLand = land;
  let inPeople = /b_/.test(path.basename(file));
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (!t || t === "---") { i++; continue; }
    if (t === "[pagebreak]") { push(`<div class="pb"></div>`, true); i++; continue; }
    let m;
    if ((m = t.match(/^\[part:\s*(.*)\]$/))) {
      const [label, title, sub] = m[1].split("|").map((s) => s.trim());
      const id = "h" + (++idn); heads.push({ id, text: `${label}: ${title}`, level: 0 });
      push(`<section class="part" id="${id}">${sigil(opts.partSigil || "rim", "part-sigil")}<div class="part-label">${esc(label)}</div><div class="part-title">${esc(title)}</div>${sub ? `<div class="part-sub">${inline(sub)}</div>` : ""}</section>`, true);
      i++; continue;
    }
    if ((m = t.match(/^(#{1,4})\s+(.*)$/))) {
      const lvl = m[1].length, text = plain(m[2]);
      const id = "h" + (++idn);
      if (lvl === 1) {
        chapterNo++;
        const l2 = landOf(path.basename(file), text) || land;
        land = l2; curLand = l2;
        heads.push({ id, text, land: curLand, level: 1 });
        const parts = text.split(/:\s+/);
        push(`<section class="opener" id="${id}">${l2 ? sigil(l2, "opener-sigil") : ""}<div class="opener-lines"></div><div class="opener-text"><div class="ch-num">Chapter ${chapterNo}</div><h1>${esc(parts[0])}</h1>${parts[1] ? `<div class="ch-sub">${esc(parts.slice(1).join(": "))}</div>` : ""}</div></section>`, true);
      } else if (lvl === 2) {
        inPeople = /^The People of|^New Faces/.test(text);
        heads.push({ id, text, land: curLand, level: 2 });
        const big = /^The People of|^New Faces|^Webs of|^Using /.test(text);
        push(`<h2 id="${id}" class="${big ? "h2-break" : ""}">${esc(text)}</h2>`, true);
      } else if (lvl === 3) {
        heads.push({ id, text, land: curLand, level: 3 });
        if (opts.kind === "people" && inPeople) {
          persons.push({ id, name: text, land });
          const [nm, ep] = text.split(/\s+[—–]\s+/);
          push(`<div class="dossier-head full" id="${id}"><div class="dh-rule"></div><h3>${esc(nm)}</h3>${ep ? `<div class="dh-epithet">${esc(ep)}</div>` : ""}</div>`, true);
        } else if (opts.kind === "leavings") {
          leavings.push({ id, name: text, land });
          push(`<h3 class="artifact" id="${id}">${esc(text)}</h3>`);
        } else push(`<h3 id="${id}">${esc(text)}</h3>`);
      } else push(`<h4>${esc(text)}</h4>`);
      i++; continue;
    }
    if (t.startsWith(">")) {
      const ep = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) { ep.push(lines[i].trim()); i++; }
      push(`<div class="epigraph full">${ep.map((l) => l.startsWith(">>") ? `<div class="ep-attr">${inline(l.replace(/^>>\s*/, ""))}</div>` : `<div class="ep-line">${inline(l.replace(/^>\s*/, ""))}</div>`).join("")}</div>`, true);
      continue;
    }
    if ((m = t.match(/^\[card:\s*(.*)\]$/i))) {
      const [ct, deck, ...rest] = m[1].split("|").map((x) => x.trim());
      out.push({ full: true, card: true, html: `<div class="card"><div class="card-deck">${inline(deck || "")}</div><div class="card-sig">${(() => { const cl = landOf("", deck || "") || land; return cl && sigils[cl] ? sigils[cl] : sigils.eighth; })()}</div><div class="card-title">${inline(ct)}</div><div class="card-text">${inline(rest.join(" | "))}</div></div>` });
      i++; continue;
    }
    if ((m = t.match(/^\[entry:\s*(.*)\]$/i))) {
      const [w, pos, ...rest] = m[1].split("|").map((x) => x.trim());
      push(`<p class="entry"><span class="e-word">${inline(w)}</span> <span class="e-pos">${inline(pos || "")}</span> ${inline(rest.join(" | "))}</p>`);
      i++; continue;
    }
    if ((m = t.match(/^\[pull\]\s*(.*)$/i))) {
      const [q, a] = m[1].split("|").map((x) => x.trim());
      push(`<div class="pull"><div class="pull-q">${inline(q)}</div>${a ? `<div class="pull-a">${inline(a.replace(/^[—–-]\s*/, ""))}</div>` : ""}</div>`); i++; continue;
    }
    if ((m = t.match(/^\[bigquote\]\s*(.*)$/i))) { push(bigquote(m[1]), true); i++; continue; }
    if ((m = t.match(/^\[sigil:\s*(\w+)\]$/i))) { push(sigil(m[1].toLowerCase(), "inline-sigil"), true); i++; continue; }
    if ((m = t.match(/^\[box(?::\s*(.*))?\]$/i))) {
      const buf = []; i++;
      while (i < lines.length && !/^\[\/box\]/i.test(lines[i].trim())) { if (lines[i].trim()) buf.push(lines[i].trim()); i++; }
      i++;
      let inner = "", li = [];
      const flush = () => { if (li.length) { inner += listBlock(li); li = []; } };
      for (const b of buf) {
        if (/^[-*] /.test(b)) li.push(b.slice(2));
        else { flush(); inner += b.startsWith("|") ? `<p>${inline(b.split("|").map((s) => s.trim()).filter(Boolean).join(" · "))}</p>` : b.startsWith("[quick]") ? `<p class="quick">${inline(b.slice(7).trim())}</p>` : `<p>${inline(b.replace(/^#+\s*/, ""))}</p>`; }
      }
      flush();
      push(`<div class="box">${m[1] ? `<div class="box-title">${inline(m[1])}</div>` : ""}${inner}</div>`);
      continue;
    }
    if (/^\[fiction\]$/i.test(t)) {
      const buf = []; i++;
      while (i < lines.length && !/^\[\/fiction\]/i.test(lines[i].trim())) { if (lines[i].trim()) buf.push(lines[i].trim()); i++; }
      i++;
      push(`<div class="fiction">${buf.map((b) => /^[-*] /.test(b) ? `<p class="fl">— ${inline(b.slice(2))}</p>` : `<p>${inline(b.replace(/^#+\s*/, "").replace(/^\|/, "").replace(/\|/g, " · "))}</p>`).join("")}</div>`);
      continue;
    }
    if ((m = t.match(/^\[stat:\s*(.*)\]$/i))) {
      const buf = []; i++;
      while (i < lines.length && !/^\[\/stat\]/i.test(lines[i].trim())) { if (lines[i].trim()) buf.push(lines[i].trim()); i++; }
      i++;
      push(statBlock(m[1], buf), true);
      continue;
    }
    if (t.startsWith("[quick]")) {
      const q = t.slice(7).trim(); const mm = q.match(/^(.+?)\s+[—–]\s+(.*)$/);
      push(`<p class="quick">${mm ? `<span class="q-name">${inline(mm[1])}</span> ${inline(mm[2])}` : inline(q)}</p>`); i++; continue;
    }
    if (t.startsWith("|")) {
      const buf = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { buf.push(lines[i].trim()); i++; }
      push(table(buf), true); continue;
    }
    if (/^([-*]|\d+\.) /.test(t)) {
      const buf = [];
      while (i < lines.length && /^([-*]|\d+\.) /.test(lines[i].trim())) { buf.push(lines[i].trim().replace(/^([-*]|\d+\.) /, "")); i++; }
      push(listBlock(buf)); continue;
    }
    if (/^\[\/?\w+.*\]$/.test(t)) { i++; continue; }
    if ((m = t.match(/^\*\*(WHISPERED|SPOILAGE|CARVING|TAINT|EFFECT|WORTH):\*\*\s*(.*)$/i))) {
      push(`<p class="field"><span class="f-label">${m[1].toUpperCase()}</span> ${inline(m[2])}</p>`); i++; continue;
    }
    push(`<p>${inline(t)}</p>`);
    i++;
  }
  return out;
}

function group(blocks) {
  let html = "", col = [];
  const flush = () => { if (col.length) { html += `<div class="cols">${col.join("\n")}</div>`; col = []; } };
  let cards = [];
  const flushCards = () => { if (cards.length) { html += `<div class="card-grid">${cards.join("")}</div>`; cards = []; } };
  for (const b of blocks) {
    if (b.card) { flush(); cards.push(b.html); continue; }
    flushCards();
    if (b.full) { flush(); html += b.html; } else col.push(b.html);
  }
  flushCards();
  flush();
  return html;
}

// ---------- book order ----------
const order = [
  { f: "00_intro.md", kind: "core" },
  { f: "09_part1.md", kind: "core", partSigil: "sallowreach" },
  { f: "10_documents_a.md", kind: "core" }, { f: "11_documents_b.md", kind: "core" },
  { f: "19_part2.md", kind: "core", partSigil: "vigil" },
  { f: "20_machinery.md", kind: "core" }, { f: "30_songs.md", kind: "core" },
  { f: "39_part3.md", kind: "core", partSigil: "fatlands" },
  { f: "40_cookbook.md", kind: "core" }, { f: "50_trinkets_games.md", kind: "core" },
  { f: "59_part4.md", kind: "core", partSigil: "oathen" },
  { f: "60_decks_a.md", kind: "core" }, { f: "61_decks_b.md", kind: "core" },
  { f: "69_part5.md", kind: "core", partSigil: "eighth" },
  { f: "70_lexicon_a.md", kind: "core" }, { f: "71_lexicon_b.md", kind: "core" },
];

let body = "";
for (const o of order) {
  const p = path.join(SRC, o.f);
  if (!fs.existsSync(p)) { console.warn("missing", o.f); continue; }
  body += group(parse(p, o));
}

const pg = (id) => (pageMap[id] ? pageMap[id] : "");
// contents
const toc = `<section class="toc"><h1 class="toc-title">Contents</h1><div class="toc-sub">The Long Grace · Table Scraps</div>${heads.filter((h) => h.level <= 2).map((h) =>
  h.level === 0 ? `<div class="toc-part">${esc(h.text)}</div>` :
  `<div class="toc-row lvl${h.level}"><a href="#${h.id}">${esc(h.text)}</a><span class="toc-pg">${pg(h.id)}</span></div>`).join("")}</section>`;

const indexList = (arr, title, id) => {
  const sorted = [...arr].sort((a, b) => a.name.replace(/^(the|lady|lord|sister|brother|dr\.|old|captain|elder|mother|father|justice|judge|envoy|marshal|master|mistress|madam|general|duchess|queen|prince|high|harbormistress|warden-prime|matron|inspector|reeve|lieutenant|provost|chairman|dame|bailiff|quartermaster|cullmaster|midwife-paramount|reckoner-captain|verger|granny|grandam|little|commodore|factor|registrar|sergeant|sgt\.)\s+/i, "").localeCompare(b.name.replace(/^(the|lady|lord|sister|brother|dr\.|old|captain|elder|mother|father|justice|judge|envoy|marshal|master|mistress|madam|general|duchess|queen|prince|high|harbormistress|warden-prime|matron|inspector|reeve|lieutenant|provost|chairman|dame|bailiff|quartermaster|cullmaster|midwife-paramount|reckoner-captain|verger|granny|grandam|little|commodore|factor|registrar|sergeant|sgt\.)\s+/i, "")));
  return `<section class="index" id="${id}"><h1 class="toc-title">${title}</h1><div class="index-cols">${sorted.map((p) => `<div class="ix-row"><a href="#${p.id}">${esc(p.name)}</a><span class="ix-land">${esc(LANDS[p.land] || (p.land === "rim" ? "The Rim" : ""))}</span><span class="toc-pg">${pg(p.id)}</span></div>`).join("")}</div></section>`;
};

const font = (fam, file, w, s = "normal") => `@font-face{font-family:'${fam}';src:url('file://${FONTS}/${file}') format('woff2');font-weight:${w};font-style:${s};}`;
const fontsCss = [
  font("Garamond", "eb-garamond/files/eb-garamond-latin-400-normal.woff2", 400),
  font("Garamond", "eb-garamond/files/eb-garamond-latin-400-italic.woff2", 400, "italic"),
  font("Garamond", "eb-garamond/files/eb-garamond-latin-600-normal.woff2", 600),
  font("Garamond", "eb-garamond/files/eb-garamond-latin-600-italic.woff2", 600, "italic"),
  font("Cormorant", "cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff2", 400),
  font("Cormorant", "cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2", 400, "italic"),
  font("Cormorant", "cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2", 600),
  font("Josefin", "josefin-sans/files/josefin-sans-latin-300-normal.woff2", 300),
  font("Josefin", "josefin-sans/files/josefin-sans-latin-400-normal.woff2", 400),
  font("Josefin", "josefin-sans/files/josefin-sans-latin-600-normal.woff2", 600),
  font("Cinzel", "cinzel/files/cinzel-latin-400-normal.woff2", 400),
  font("Cinzel", "cinzel/files/cinzel-latin-700-normal.woff2", 700),
].join("\n");

const css = fs.readFileSync(path.join(__dirname, "book4.css"), "utf8").replace("TEXTURE_URL", `file://${path.join(__dirname, "texture.jpg")}`);

const cover = `<section class="cover">
  <div class="cover-ring">${["sallowreach", "fatlands", "brinehollow", "vigil", "cradlewrack", "oathen", "fast"].map((s, k) => { const a = (k / 7) * Math.PI * 2 - Math.PI / 2; const x = 2.2 + 1.75 * Math.cos(a) - 0.425, y = 2.2 + 1.75 * Math.sin(a) - 0.425; return `<div class="cr" style="left:${x.toFixed(3)}in;top:${y.toFixed(3)}in">${sigils[s]}</div>`; }).join("")}<div class="cr-center">${sigils.eighth}</div></div>
  <div class="cover-kicker">The Long Grace</div>
  <div class="cover-title">TABLE SCRAPS</div>
  <div class="cover-sub">Lore · Engines · Songs · Games · Cards · Lexicon</div>
  <div class="cover-foot">Everything left on the plate</div>
</section>
<section class="frontis">
  <div class="fq">${bigquote("Nothing was wasted. Not the hooves, not the hide, not the eyes. | Carved over the Weighhouse door, Sated").replace("full", "")}</div>
</section>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><title>The Long Grace — Table Scraps</title><style>${fontsCss}\n${css}</style></head><body>
${cover}
${toc}
${body}
${indexList(heads.filter((h) => h.level === 2 || h.level === 3).map((h) => ({ id: h.id, name: h.text, land: h.land })), "Index", "ixh")}
<section class="colophon">${sigils.eighth}<p>Set a place. Pull out the chair. Someone is coming.</p></section>
</body></html>`;

fs.writeFileSync(path.join(__dirname, "book4.html"), html);
fs.writeFileSync(path.join(__dirname, "heads4.json"), JSON.stringify(heads.map((h) => ({ id: h.id, level: h.level, text: h.text.split(/\s+[—–]\s+/)[0].split(/:\s+/)[h.level === 1 ? 0 : 0] }))));
console.log("html written; heads", heads.length, "persons", persons.length, "leavings", leavings.length);

(async () => {
  const { chromium } = require("playwright-core");
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await browser.newPage();
  await page.goto("file://" + path.join(__dirname, "book4.html"), { waitUntil: "load", timeout: 600000 });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: path.join(ROOT, "Table_Scraps.pdf"), format: "Letter", printBackground: true, preferCSSPageSize: true, timeout: 0 });
  await browser.close();
  console.log("pdf written");
})();
