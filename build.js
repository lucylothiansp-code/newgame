// Builds THE LONG GRACE.docx from the marked-up chapter files in ./book
// Usage: node build.js [pagemap.json]
// Two-pass: build once, render to PDF, run pagemap.py to find heading pages, build again.
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, HeadingLevel, BorderStyle, LevelFormat, PageBreak, Footer, Header, PageNumber,
  Bookmark, SimpleField, PositionalTab, PositionalTabAlignment, PositionalTabLeader,
  PositionalTabRelativeTo, SectionType, InternalHyperlink, TabStopType, VerticalAlign,
} = require("docx");

const BOOK_DIR = path.join(__dirname, "book");
const OUT = path.join(__dirname, "The_Long_Grace.docx");
const pageMap = process.argv[2] && fs.existsSync(process.argv[2]) ? JSON.parse(fs.readFileSync(process.argv[2], "utf8")) : {};

// ---------- palette & type ----------
const FONT = "Georgia";
const DISPLAY = "Georgia";
const RED = "7A1712";
const DARK = "2A1E1A";
const INK = "1F1A17";
const MUTED = "5E4B43";
const BOX_FILL = "F3EADF";
const STAT_FILL = "EFE4D6";
const ROW_ALT = "FAF5EF";
const CONTENT_W = 9360; // 6.5in at 1in margins

const border = (color = "B8A493", size = 4) => ({ style: BorderStyle.SINGLE, size, color });
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

// ---------- inline markup ----------
function runs(text, base = {}) {
  const out = [];
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g);
  for (const p of parts) {
    if (!p) continue;
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) out.push(new TextRun({ ...base, text: p.slice(2, -2), bold: true }));
    else if (p.startsWith("*") && p.endsWith("*") && p.length > 2) out.push(new TextRun({ ...base, text: p.slice(1, -1), italics: !base.italics }));
    else out.push(new TextRun({ ...base, text: p }));
  }
  return out;
}
const plain = (t) => t.replace(/\*\*/g, "").replace(/\*/g, "");

// ---------- index / toc bookkeeping ----------
let bmCounter = 0;
const tocEntries = []; // {level, text, bm}
const indexEntries = []; // {text, bm, chapter}
const headingOrder = []; // for page mapping: {bm, text}
let currentChapter = "";

function newBm() { return "bm" + (++bmCounter); }
function pageOf(bm) { return pageMap[bm] ? String(pageMap[bm]) : "0"; }

function heading(level, text) {
  const bm = newBm();
  const t = plain(text);
  headingOrder.push({ bm, text: t, level });
  if (level === 1) { currentChapter = t; tocEntries.push({ level, text: t, bm }); }
  if (level === 2) tocEntries.push({ level, text: t, bm });
  if (level === 2 || level === 3) indexEntries.push({ text: t, bm, chapter: currentChapter });
  const levels = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3, 4: HeadingLevel.HEADING_4 };
  return new Paragraph({
    heading: levels[level],
    pageBreakBefore: level === 1,
    keepNext: true,
    children: [new Bookmark({ id: bm, children: [new TextRun(t)] })],
  });
}

// ---------- block builders ----------
const body = (text, opts = {}) => new Paragraph({ style: "Body", children: runs(text), ...opts });

function epigraph(lines) {
  return lines.map((l) => {
    if (l.attrib) return new Paragraph({ style: "EpigraphAttrib", children: runs(l.text) });
    return new Paragraph({ style: "Epigraph", children: runs(l.text) });
  });
}

function fiction(lines) {
  return lines.map((l, i) => {
    if (l.startsWith("- ")) return new Paragraph({ style: "Fiction", numbering: { reference: "bullets", level: 1 }, children: runs(l.slice(2)) });
    if (/^#{2,4} /.test(l)) return new Paragraph({ style: "Fiction", children: [new TextRun({ text: plain(l.replace(/^#+ /, "")), bold: true, italics: false })] });
    if (l.startsWith("|")) return new Paragraph({ style: "Fiction", children: runs(l.replace(/\|/g, "  ").trim()) });
    return new Paragraph({ style: "Fiction", children: runs(l.replace(/^>+\s?/, "")) });
  });
}

function boxCell(children, fill, leftColor) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      shading: { fill, type: ShadingType.CLEAR, color: "auto" },
      margins: { top: 140, bottom: 140, left: 220, right: 220 },
      borders: { top: border("C9B39F"), bottom: border("C9B39F"), right: border("C9B39F"), left: { style: BorderStyle.SINGLE, size: 24, color: leftColor } },
      children,
    })] })],
  });
}

function box(title, lines) {
  const kids = [];
  if (title) kids.push(new Paragraph({ style: "BoxTitle", children: [new TextRun(plain(title).toUpperCase())] }));
  for (const l of lines) {
    if (l.startsWith("- ")) kids.push(new Paragraph({ style: "BoxBody", numbering: { reference: "bullets", level: 0 }, children: runs(l.slice(2)) }));
    else if (/^#{2,4} /.test(l)) kids.push(new Paragraph({ style: "BoxBody", children: [new TextRun({ text: plain(l.replace(/^#+ /, "")), bold: true })] }));
    else if (l.startsWith("[quick]")) kids.push(new Paragraph({ style: "BoxBody", children: quickRuns(l.slice(7).trim()) }));
    else if (l.startsWith("|")) kids.push(new Paragraph({ style: "BoxBody", children: runs(l.split("|").map((s) => s.trim()).filter(Boolean).join("  ·  ")) }));
    else kids.push(new Paragraph({ style: "BoxBody", children: runs(l.replace(/^>+\s?/, "")) }));
  }
  if (!kids.length) kids.push(new Paragraph(""));
  return [boxCell(kids, BOX_FILL, RED), spacer()];
}

function spacer(after = 120) { return new Paragraph({ spacing: { before: 0, after }, children: [] }); }

function statBlock(title, lines) {
  const bm = newBm();
  const name = plain(title.split(/\s+[—–-]\s+/)[0]);
  indexEntries.push({ text: name, bm, chapter: currentChapter, stat: true });
  headingOrder.push({ bm, text: plain(title), level: 9 });
  const labelW = 1900, valW = CONTENT_W - labelW;
  const rows = [new TableRow({ cantSplit: true, children: [new TableCell({
    columnSpan: 2, width: { size: CONTENT_W, type: WidthType.DXA },
    shading: { fill: RED, type: ShadingType.CLEAR, color: "auto" },
    margins: { top: 80, bottom: 80, left: 160, right: 160 },
    borders: { top: border(RED), bottom: border(RED), left: border(RED), right: border(RED) },
    children: [new Paragraph({ children: [new Bookmark({ id: bm, children: [new TextRun({ text: plain(title), bold: true, color: "FFFFFF", font: DISPLAY, size: 22 })] })] })],
  })] })];
  for (const l of lines) {
    const m = l.match(/^([^:]{1,40}):\s*(.*)$/);
    const label = m ? m[1].trim() : (/^flesh/i.test(l) ? "Body" : /^threat/i.test(l) ? "Threat" : "Notes");
    const val = m ? m[2] : l;
    rows.push(new TableRow({ cantSplit: true, children: [
      new TableCell({ width: { size: labelW, type: WidthType.DXA }, shading: { fill: STAT_FILL, type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 50, bottom: 50, left: 140, right: 100 }, borders: { top: border("D5C3B1"), bottom: border("D5C3B1"), left: border("D5C3B1"), right: border("D5C3B1") },
        children: [new Paragraph({ style: "StatText", children: [new TextRun({ text: label, bold: true, color: RED })] })] }),
      new TableCell({ width: { size: valW, type: WidthType.DXA }, shading: { fill: "FFFDFA", type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 50, bottom: 50, left: 140, right: 140 }, borders: { top: border("D5C3B1"), bottom: border("D5C3B1"), left: border("D5C3B1"), right: border("D5C3B1") },
        children: [new Paragraph({ style: "StatText", children: runs(val) })] }),
    ] }));
  }
  return [new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [labelW, valW], rows }), spacer(160)];
}

function quickRuns(text) {
  const m = text.match(/^(.+?)\s+[—–]\s+(.*)$/);
  if (m) return [new TextRun({ text: plain(m[1]) + "  ", bold: true, color: RED }), ...runs(m[2])];
  return runs(text);
}
function quick(text) {
  return new Paragraph({ style: "Quick", shading: { fill: STAT_FILL, type: ShadingType.CLEAR, color: "auto" },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: RED, space: 6 } }, children: quickRuns(text) });
}

function table(rowsText) {
  const rows = rowsText.map((r) => r.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim()))
    .filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c) || c === ""));
  const ncol = Math.max(...rows.map((r) => r.length));
  rows.forEach((r) => { while (r.length < ncol) r.push(""); });
  // column widths weighted by content length (sqrt to soften)
  const weights = [];
  for (let c = 0; c < ncol; c++) {
    const maxLen = Math.max(...rows.map((r) => plain(r[c]).length), 3);
    const avgLen = rows.reduce((a, r) => a + plain(r[c]).length, 0) / rows.length;
    weights.push(Math.max(Math.sqrt(maxLen) * 0.6 + Math.sqrt(avgLen + 1), 2.2));
  }
  const tot = weights.reduce((a, b) => a + b, 0);
  const widths = weights.map((w) => Math.floor((w / tot) * CONTENT_W));
  widths[widths.length - 1] += CONTENT_W - widths.reduce((a, b) => a + b, 0);
  const fontSize = ncol >= 5 ? 16 : 17;
  const trs = rows.map((r, ri) => new TableRow({
    tableHeader: ri === 0, cantSplit: true,
    children: r.map((c, ci) => new TableCell({
      width: { size: widths[ci], type: WidthType.DXA },
      shading: { fill: ri === 0 ? "5C120E" : ri % 2 ? "FFFFFF" : ROW_ALT, type: ShadingType.CLEAR, color: "auto" },
      margins: { top: 50, bottom: 50, left: 100, right: 100 },
      borders: { top: border("CDBBA9"), bottom: border("CDBBA9"), left: border("CDBBA9"), right: border("CDBBA9") },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ spacing: { before: 0, after: 0, line: 240 }, children: ri === 0
        ? [new TextRun({ text: plain(c), bold: true, color: "FFFFFF", size: fontSize, font: FONT })]
        : runs(c, { size: fontSize, font: FONT }) })],
    })),
  }));
  return [new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: widths, rows: trs }), spacer(160)];
}

function partPage(spec) {
  const [label, title, sub] = spec.split("|").map((s) => s.trim());
  const bm = newBm();
  headingOrder.push({ bm, text: title, level: 0 });
  tocEntries.push({ level: 0, text: `${label}: ${title}`, bm });
  return [
    new Paragraph({ pageBreakBefore: true, spacing: { before: 3600 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: label.toUpperCase(), font: DISPLAY, size: 28, color: MUTED, characterSpacing: 120 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 240 }, children: [new Bookmark({ id: bm, children: [new TextRun({ text: title, font: DISPLAY, size: 64, bold: true, color: RED })] })] }),
    ornament(),
    ...(sub ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240 }, indent: { left: 1440, right: 1440 }, children: [new TextRun({ text: sub, italics: true, font: FONT, size: 22, color: MUTED })] })] : []),
  ];
}
function ornament() {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "❦  ❦  ❦", color: RED, size: 22 })] });
}

// ---------- parse a chapter file ----------
function parseFile(file) {
  const lines = fs.readFileSync(file, "utf8").replace(/\r/g, "").split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    let l = lines[i].trimEnd();
    const t = l.trim();
    if (!t) { i++; continue; }
    if (t === "---" || t === "***") { i++; continue; }
    if (t === "[pagebreak]") { out.push(new Paragraph({ children: [new PageBreak()] })); i++; continue; }
    if (t.startsWith("[part:")) { out.push(...partPage(t.slice(6, -1))); i++; continue; }
    const h = t.match(/^(#{1,4})\s+(.*)$/);
    if (h) { out.push(heading(h[1].length, h[2])); i++; continue; }
    if (t.startsWith(">")) {
      const ep = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        const s = lines[i].trim();
        if (s.startsWith(">>")) ep.push({ attrib: true, text: s.replace(/^>>\s*/, "") });
        else ep.push({ text: s.replace(/^>\s*/, "") });
        i++;
      }
      out.push(...epigraph(ep));
      continue;
    }
    const bx = t.match(/^\[box(?::\s*(.*))?\]$/i);
    if (bx) {
      const buf = []; i++;
      while (i < lines.length && !/^\[\/box\]/i.test(lines[i].trim())) { if (lines[i].trim()) buf.push(lines[i].trim()); i++; }
      i++;
      // tables inside boxes: split out
      const pre = [], tbl = [];
      for (const b of buf) (b.startsWith("|") ? tbl : pre).push(b);
      if (tbl.length >= 2 && pre.length <= 2) { out.push(...box(bx[1] || "", pre)); out.push(...table(tbl)); }
      else out.push(...box(bx[1] || "", buf));
      continue;
    }
    if (/^\[fiction\]$/i.test(t)) {
      const buf = []; i++;
      while (i < lines.length && !/^\[\/fiction\]/i.test(lines[i].trim())) { if (lines[i].trim()) buf.push(lines[i].trim()); i++; }
      i++;
      out.push(...fiction(buf), spacer(80));
      continue;
    }
    const st = t.match(/^\[stat:\s*(.*)\]$/i);
    if (st) {
      const buf = []; i++;
      while (i < lines.length && !/^\[\/stat\]/i.test(lines[i].trim())) { if (lines[i].trim()) buf.push(lines[i].trim()); i++; }
      i++;
      out.push(...statBlock(st[1], buf));
      continue;
    }
    if (t.startsWith("[quick]")) { out.push(quick(t.slice(7).trim())); i++; continue; }
    if (t.startsWith("|")) {
      const buf = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { buf.push(lines[i].trim()); i++; }
      out.push(...table(buf));
      continue;
    }
    if (/^[-*] /.test(t)) { out.push(new Paragraph({ style: "Body", numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: runs(t.slice(2)) })); i++; continue; }
    if (/^\d+\.\s/.test(t)) { out.push(new Paragraph({ style: "Body", numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 }, children: runs(t.replace(/^\d+\.\s/, "")) })); i++; continue; }
    if (/^\[\/?\w+.*\]$/.test(t)) { i++; continue; } // stray tag
    out.push(body(t));
    i++;
  }
  return out;
}

// ---------- front matter ----------
function titlePage() {
  return [
    new Paragraph({ spacing: { before: 2400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "A ROLEPLAYING GAME OF EATEN GODS", font: DISPLAY, size: 22, color: MUTED, characterSpacing: 100 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 480, after: 120 }, children: [new TextRun({ text: "THE", font: DISPLAY, size: 40, color: RED, characterSpacing: 300 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: "LONG GRACE", font: DISPLAY, size: 96, bold: true, color: RED, characterSpacing: 60 })] }),
    ornament(),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 360 }, children: [new TextRun({ text: "Seven lands. Six eaten gods. One that is still hungry.", italics: true, font: FONT, size: 26, color: DARK })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2400 }, children: [new TextRun({ text: "Core Book", font: DISPLAY, size: 24, color: MUTED, characterSpacing: 80 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120 }, children: [new TextRun({ text: "The Table  ·  The Lands  ·  The Rules  ·  The Market  ·  The Things That Eat  ·  The Ninth Chair", font: FONT, size: 18, color: MUTED })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1800 }, children: [new TextRun({ text: "Formerly: The Gorging World", font: FONT, size: 16, italics: true, color: "8A7A70" })] }),
  ];
}

function tocBlock() {
  const out = [new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun("Contents")] })];
  for (const e of tocEntries) {
    if (e.level === 0) {
      out.push(new Paragraph({ spacing: { before: 280, after: 80 }, keepNext: true, children: [new TextRun({ text: e.text.toUpperCase(), bold: true, color: RED, font: DISPLAY, size: 21, characterSpacing: 40 })] }));
      continue;
    }
    const isCh = e.level === 1;
    out.push(new Paragraph({
      spacing: { before: isCh ? 100 : 0, after: isCh ? 30 : 0 },
      indent: { left: isCh ? 0 : 400 },
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W, leader: "dot" }],
      children: [
        new InternalHyperlink({ anchor: e.bm, children: [new TextRun({ text: e.text, bold: isCh, size: isCh ? 21 : 18, color: isCh ? DARK : MUTED, font: FONT })] }),
        new TextRun({ text: "\t", size: isCh ? 21 : 18 }),
        new SimpleField(`PAGEREF ${e.bm} \\h`, pageOf(e.bm)),
      ],
    }));
  }
  return out;
}

function indexBlock() {
  // qualify duplicate names by chapter
  const counts = {};
  indexEntries.forEach((e) => (counts[e.text.toLowerCase()] = (counts[e.text.toLowerCase()] || 0) + 1));
  const seen = new Set();
  const items = [];
  for (const e of indexEntries) {
    let label = e.text;
    if (counts[e.text.toLowerCase()] > 1) label = `${e.text} (${e.chapter})`;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const sortKey = label.replace(/^(the|a|an)\s+/i, "").replace(/^[^A-Za-z0-9]+/, "").toLowerCase();
    items.push({ label, sortKey, bm: e.bm });
  }
  items.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  const out = [];
  let letter = "";
  for (const it of items) {
    const L = (it.sortKey[0] || "#").toUpperCase();
    if (L !== letter) {
      letter = L;
      out.push(new Paragraph({ spacing: { before: 160, after: 40 }, keepNext: true, children: [new TextRun({ text: L, bold: true, color: RED, size: 24, font: DISPLAY })] }));
    }
    out.push(new Paragraph({ spacing: { before: 0, after: 0, line: 228 }, indent: { left: 200, hanging: 200 }, tabStops: [{ type: TabStopType.RIGHT, position: 4500, leader: "dot" }], children: [
      new TextRun({ text: it.label, size: 15, font: FONT }),
      new TextRun({ text: "\t", size: 15 }),
      new SimpleField(`PAGEREF ${it.bm} \\h`, pageOf(it.bm)),
    ] }));
  }
  return out;
}

// ---------- character sheet ----------
function sheetCell(text, w, opts = {}) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    columnSpan: opts.span,
    shading: { fill: opts.fill || "FFFFFF", type: ShadingType.CLEAR, color: "auto" },
    margins: { top: 40, bottom: 40, left: 100, right: 100 },
    borders: { top: border("7A6A60"), bottom: border("7A6A60"), left: border("7A6A60"), right: border("7A6A60") },
    children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text, size: opts.size || 16, bold: !!opts.bold, color: opts.color || INK, font: FONT })] })],
  });
}
function sheetTable(widths, rows) {
  return new Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths,
    rows: rows.map((r) => new TableRow({ height: { value: r.h || 340, rule: "atLeast" }, children: r.cells })) });
}
function characterSheet() {
  const out = [heading(1, "Character Sheet")];
  out.push(new Paragraph({ style: "Body", children: runs("*Photocopy or print freely. Write in pencil: everything on this page is going to change, and most of it for the worse.*") }));
  const W = CONTENT_W;
  const hdr = (t) => sheetCell(t, 0, { fill: RED, bold: true, color: "FFFFFF", size: 17 });
  // identity
  const q = W / 4;
  out.push(sheetTable([q, q, q, q], [
    { cells: [sheetCell("Name", q, { bold: true }), sheetCell("", q), sheetCell("Player", q, { bold: true }), sheetCell("", q)] },
    { cells: [sheetCell("Land", q, { bold: true }), sheetCell("", q), sheetCell("Cut (0–5)", q, { bold: true }), sheetCell("", q)] },
    { cells: [sheetCell("Calling", q, { bold: true }), sheetCell("", q), sheetCell("Standing", q, { bold: true }), sheetCell("", q)] },
    { cells: [sheetCell("Last Meal", q, { bold: true }), sheetCell("", q * 3, { span: 3 })] },
    { cells: [sheetCell("Oath on the Dead", q, { bold: true }), sheetCell("", q * 3, { span: 3 })] },
  ]));
  out.push(spacer(120));
  // attributes & skills
  const attrs = [
    ["HAND", ["Blades", "Brawl", "Shooting", "Stitching"]],
    ["GUT", ["Endure", "Labor", "Feast", "Intimidate"]],
    ["LUNG", ["Athletics", "Stealth", "Wayfaring", "Filch"]],
    ["EYE", ["Search", "Lore", "Craft", "Reckoning"]],
    ["TONGUE", ["Persuade", "Deceive", "Haggle", "Clause"]],
    ["CAUL", ["Resolve", "Rites", "Instinct", "Godsign"]],
  ];
  const cw = [1960, 1160, 1960, 1160, 1960, 1160];
  const rows = [];
  for (let r = 0; r < 2; r++) {
    const trio = attrs.slice(r * 3, r * 3 + 3);
    rows.push({ cells: trio.flatMap(([a]) => [sheetCell(a, 1960, { fill: RED, bold: true, color: "FFFFFF", size: 18 }), sheetCell("○ ○ ○ ○ ○", 1160, { size: 15 })]) });
    for (let s = 0; s < 4; s++) rows.push({ cells: trio.flatMap(([, sk]) => [sheetCell(sk[s], 1960), sheetCell("○ ○ ○ ○ ○", 1160, { size: 15 })]) });
  }
  out.push(sheetTable(cw, rows));
  out.push(spacer(120));
  // tracks
  const boxes = (n) => Array(n).fill("□").join(" ");
  const t1 = 2200, t2 = W - 2200;
  out.push(sheetTable([t1, t2], [
    { cells: [sheetCell("Flesh (8 + Gut + Endure)", t1, { bold: true }), sheetCell(boxes(20), t2, { size: 18 })] },
    { cells: [sheetCell("Guard / Armor", t1, { bold: true }), sheetCell("Guard ______   Armor ______   Ranged Guard ______", t2)] },
    { cells: [sheetCell("Hunger (0–10)", t1, { bold: true }), sheetCell(boxes(10) + "     at 10: Regrowth +1, clear Hunger", t2, { size: 18 })] },
    { cells: [sheetCell("Regrowth (0–12)", t1, { bold: true }), sheetCell("Taste □□□  Appetite □□□  Course □□□  Brink □□  Seating □", t2, { size: 17 })] },
    { cells: [sheetCell("Fray (0–10)", t1, { bold: true }), sheetCell(boxes(10) + "     at 10: Break, gain a Derangement, Fray to 3", t2, { size: 18 })] },
    { cells: [sheetCell("Want (Unfed only)", t1, { bold: true }), sheetCell(boxes(10), t2, { size: 18 })] },
    { cells: [sheetCell("Injuries", t1, { bold: true }), sheetCell("", t2)], h: 700 },
    { cells: [sheetCell("Derangements", t1, { bold: true }), sheetCell("", t2)], h: 700 },
    { cells: [sheetCell("Gifts of the God", t1, { bold: true }), sheetCell("", t2)], h: 800 },
    { cells: [sheetCell("Wants & Sop", t1, { bold: true }), sheetCell("", t2)], h: 600 },
    { cells: [sheetCell("Knacks", t1, { bold: true }), sheetCell("", t2)], h: 700 },
  ]));
  out.push(spacer(120));
  const g = [3400, 1300, 1300, 3360];
  out.push(sheetTable(g, [
    { cells: [sheetCell("Weapon", g[0], { fill: RED, bold: true, color: "FFFFFF" }), sheetCell("Attack", g[1], { fill: RED, bold: true, color: "FFFFFF" }), sheetCell("Damage", g[2], { fill: RED, bold: true, color: "FFFFFF" }), sheetCell("Qualities", g[3], { fill: RED, bold: true, color: "FFFFFF" })] },
    ...[1, 2, 3].map(() => ({ cells: g.map((w) => sheetCell("", w)) })),
  ]));
  out.push(spacer(120));
  out.push(sheetTable([W / 2, W / 2], [
    { cells: [sheetCell("Gear & Relics", W / 2, { fill: RED, bold: true, color: "FFFFFF" }), sheetCell("Lacks · Crumbs · Notes · Debts", W / 2, { fill: RED, bold: true, color: "FFFFFF" })] },
    { cells: [sheetCell("", W / 2), sheetCell("", W / 2)], h: 2000 },
    { cells: [sheetCell("Portions earned / spent", W / 2, { bold: true }), sheetCell("Who is waiting for you at home", W / 2, { bold: true })] },
    { cells: [sheetCell("", W / 2), sheetCell("", W / 2)], h: 700 },
  ]));
  return out;
}

// ---------- assemble ----------
const files = fs.readdirSync(BOOK_DIR).filter((f) => /^\d\d.*\.md$/.test(f)).sort();
const bodyChildren = [];
for (const f of files) {
  if (f.startsWith("99")) continue;
  bodyChildren.push(...parseFile(path.join(BOOK_DIR, f)));
}
bodyChildren.push(...characterSheet());
const idxHeading = heading(1, "Index");
const idx = indexBlock();
const toc = tocBlock();

fs.writeFileSync(path.join(__dirname, "build_headings.json"), JSON.stringify(headingOrder));

const footer = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
  new TextRun({ text: "—  ", color: RED, size: 16 }), new TextRun({ children: [PageNumber.CURRENT], size: 17, font: FONT, color: DARK }), new TextRun({ text: "  —", color: RED, size: 16 }),
] })] });
const header = new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "C9B39F", space: 4 } }, children: [new TextRun({ text: "THE LONG GRACE", size: 14, color: MUTED, font: DISPLAY, characterSpacing: 120 })] })] });

const pageProps = { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1300, left: 1440, header: 600, footer: 600 } } };

const doc = new Document({
  creator: "The Long Grace",
  title: "The Long Grace — Core Book",
  description: "A roleplaying game of eaten gods.",
  styles: {
    default: { document: { run: { font: FONT, size: 21, color: INK } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Body", quickFormat: true,
        run: { font: DISPLAY, size: 52, bold: true, color: RED },
        paragraph: { spacing: { before: 600, after: 240 }, outlineLevel: 0, alignment: AlignmentType.LEFT, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: RED, space: 8 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Body", quickFormat: true,
        run: { font: DISPLAY, size: 32, bold: true, color: RED },
        paragraph: { spacing: { before: 400, after: 140 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Body", quickFormat: true,
        run: { font: DISPLAY, size: 25, bold: true, color: DARK },
        paragraph: { spacing: { before: 280, after: 100 }, outlineLevel: 2 } },
      { id: "Heading4", name: "Heading 4", basedOn: "Normal", next: "Body", quickFormat: true,
        run: { font: DISPLAY, size: 22, bold: true, italics: true, color: RED },
        paragraph: { spacing: { before: 200, after: 60 }, outlineLevel: 3 } },
      { id: "Body", name: "Body", basedOn: "Normal", quickFormat: true,
        run: { font: FONT, size: 21 }, paragraph: { spacing: { after: 130, line: 288 }, alignment: AlignmentType.JUSTIFIED } },
      { id: "Epigraph", name: "Epigraph", basedOn: "Normal",
        run: { font: FONT, size: 22, italics: true, color: MUTED }, paragraph: { indent: { left: 1440, right: 1080 }, spacing: { before: 60, after: 40, line: 300 } } },
      { id: "EpigraphAttrib", name: "Epigraph Attribution", basedOn: "Normal",
        run: { font: FONT, size: 18, color: RED, smallCaps: true }, paragraph: { alignment: AlignmentType.RIGHT, indent: { right: 1080 }, spacing: { after: 280 } } },
      { id: "Fiction", name: "Fiction", basedOn: "Normal",
        run: { font: FONT, size: 21, italics: true, color: "33261F" },
        paragraph: { indent: { left: 600, right: 600 }, spacing: { after: 110, line: 290 }, alignment: AlignmentType.JUSTIFIED,
          border: { left: { style: BorderStyle.SINGLE, size: 8, color: "B79C86", space: 12 } } } },
      { id: "BoxTitle", name: "Box Title", basedOn: "Normal",
        run: { font: DISPLAY, size: 20, bold: true, color: RED, characterSpacing: 40 }, paragraph: { spacing: { after: 100 }, keepNext: true } },
      { id: "BoxBody", name: "Box Body", basedOn: "Normal",
        run: { font: FONT, size: 19 }, paragraph: { spacing: { after: 90, line: 270 } } },
      { id: "StatText", name: "Stat Text", basedOn: "Normal",
        run: { font: FONT, size: 18 }, paragraph: { spacing: { before: 0, after: 0, line: 250 } } },
      { id: "Quick", name: "Quick Stat", basedOn: "Normal",
        run: { font: FONT, size: 18 }, paragraph: { spacing: { before: 60, after: 140, line: 250 }, indent: { left: 120, right: 120 } } },
    ],
  },
  numbering: { config: [{ reference: "bullets", levels: [
    { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } }, run: { color: RED } } },
    { level: 1, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1000, hanging: 280 } } } },
  ] }] },
  sections: [
    { properties: { ...pageProps }, children: titlePage() },
    { properties: { ...pageProps, type: SectionType.NEXT_PAGE }, headers: { default: header }, footers: { default: footer }, children: [...toc, ...bodyChildren, idxHeading] },
    { properties: { ...pageProps, type: SectionType.CONTINUOUS, column: { count: 2, space: 500 } }, headers: { default: header }, footers: { default: footer }, children: idx },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("wrote", OUT, (buf.length / 1024).toFixed(0) + "KB", "headings:", headingOrder.length, "index:", indexEntries.length);
});
