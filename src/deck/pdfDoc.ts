import { jsPDF } from "jspdf";
import { ALL_LESSONS, BLOCKS, CJM_STAGES, COURSE, MARKET_FORECAST, PRODUCT_SPECS, YEAR_PLAN } from "../data/course";
import type { Slide } from "./slides";

const K = {
  bg: [10, 15, 22],      // тёмный фон (как ink)
  ink: [10, 15, 22],
  panel: [17, 26, 38],
  panel2: [22, 33, 47],
  edge: [34, 48, 64],
  steel: [140, 160, 179],
  fog: [199, 211, 223],
  snow: [238, 244, 250],  // светлый текст
  blue: [47, 134, 230],
  ice: [125, 184, 245],
  deep: [11, 62, 125],
  amber: [255, 122, 31],
  amber2: [255, 161, 78],
  mint: [55, 201, 139],
  alarm: [232, 80, 58],
} as const;

type RGB = readonly [number, number, number];

const mirrors = (gh: string) => [
  `https://cdn.jsdelivr.net/gh/${gh}`,
  `https://fastly.jsdelivr.net/gh/${gh}`,
  `https://raw.githubusercontent.com/${gh}`,
];

const FONT_CANDIDATES = {
  pt: (f: "Regular" | "Bold") => [...mirrors(`googlefonts/pt-sans@master/fonts/ttf/PTSans-${f}.ttf`), ...mirrors(`googlefonts/pt-sans@main/fonts/ttf/PTSans-${f}.ttf`)],
  jbm: (f: "Regular" | "Bold") => [...mirrors(`JetBrains/JetBrainsMono@master/fonts/ttf/JetBrainsMono-${f}.ttf`), ...mirrors(`JetBrains/JetBrainsMono@main/fonts/ttf/JetBrainsMono-${f}.ttf`)],
  russo: () => [...mirrors(`googlefonts/russo-one@master/fonts/ttf/RussoOne-Regular.ttf`), ...mirrors(`googlefonts/russo-one@main/fonts/ttf/RussoOne-Regular.ttf`)],
};

async function fetchFirst(urls: string[]): Promise<ArrayBuffer> {
  const errors: Error[] = [];
  for (const u of urls) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 12000);
    try {
      const r = await fetch(u, { signal: ctl.signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const buf = await r.arrayBuffer();
      if (buf.byteLength < 10000) throw new Error("empty");
      return buf;
    } catch (e) {
      errors.push(e as Error);
    } finally {
      clearTimeout(t);
    }
  }
  throw new Error("all fonts failed");
}

const TR: Record<string, string> = {
  "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo", "ж": "zh", "з": "z",
  "и": "i", "й": "y", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r",
  "с": "s", "т": "t", "у": "u", "ф": "f", "х": "h", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch",
  "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
  "«": '"', "»": '"', "₽": " rub.", "✓": "+", "→": "->", "·": "-", "—": "-", "…": "...", "×": "x", "−": "-", "№": "No",
};

function translit(s: string): string {
  return s.split("").map((ch) => {
    const low = ch.toLowerCase();
    const m = TR[low];
    if (m === undefined) return ch.charCodeAt(0) < 128 ? ch : "?";
    return ch === low ? m : m.charAt(0).toUpperCase() + m.slice(1);
  }).join("");
}

let USE_TR = false;
const X = (s: string) => USE_TR ? translit(s) : s;

function toB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(bin);
}

type FontPlan = { d: string; b: string; m: string; translit: boolean };
let cached: { doc: jsPDF; plan: FontPlan } | null = null;

async function prepareFonts() {
  if (cached) return cached;
  const [ptR, ptB, jmR, jmB, ru] = await Promise.all([
    fetchFirst(FONT_CANDIDATES.pt("Regular")).catch(() => null),
    fetchFirst(FONT_CANDIDATES.pt("Bold")).catch(() => null),
    fetchFirst(FONT_CANDIDATES.jbm("Regular")).catch(() => null),
    fetchFirst(FONT_CANDIDATES.jbm("Bold")).catch(() => null),
    fetchFirst(FONT_CANDIDATES.russo()).catch(() => null),
  ]);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  const mount = (buf: ArrayBuffer | null, file: string, fam: string, st: "normal" | "bold") => {
    if (!buf) return;
    doc.addFileToVFS(file, toB64(buf));
    doc.addFont(file, fam, st);
  };
  mount(ptR, "PTSans-Regular.ttf", "PTSans", "normal");
  mount(ptB, "PTSans-Bold.ttf", "PTSans", "bold");
  mount(jmR, "JetBrainsMono-Regular.ttf", "JBMono", "normal");
  mount(jmB, "JetBrainsMono-Bold.ttf", "JBMono", "bold");
  mount(ru, "RussoOne-Regular.ttf", "RussoOne", "normal");

  const cyBody = Boolean(ptR);
  const cyMono = Boolean(jmR);
  const plan: FontPlan = {
    d: ru ? "RussoOne" : ptB ? "PTSans" : cyMono ? "JBMono" : "helvetica",
    b: cyBody ? "PTSans" : cyMono ? "JBMono" : "helvetica",
    m: cyMono ? "JBMono" : "courier",
    translit: !cyBody && !cyMono,
  };
  cached = { doc, plan };
  return cached;
}

const W = 297, H = 210, M = 14;

class Deck {
  doc: jsPDF;
  constructor() { this.doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true }); }
  bg(color: RGB = K.bg) { const d = this.doc; d.setFillColor(color[0], color[1], color[2]); d.rect(0, 0, W, H, "F"); }
  footer(n: number, total: number) {
    const d = this.doc;
    d.setFont("JBM", "normal"); d.setFontSize(6.5);
    d.setTextColor(K.steel[0], K.steel[1], K.steel[2]);
    d.text(X(`${COURSE.title} · ${COURSE.org}`), M, 199.5);
    d.text(`${String(n).padStart(3, "0")} / ${total}`, W - M, 199.5, { align: "right" });
  }
  kicker(text: string, color: RGB = K.amber2, y = 20) {
    const d = this.doc;
    d.setFillColor(color[0], color[1], color[2]);
    d.rect(M, y - 2.4, 2.4, 2.4, "F");
    d.setFont("JBM", "normal"); d.setFontSize(7.5);
    d.setTextColor(color[0], color[1], color[2]);
    d.text(X(text).toUpperCase(), M + 4.6, y, { baseline: "middle" });
  }
  title(text: string, y = 32, size = 19, color: RGB = K.snow) {
    const d = this.doc;
    d.setFont("Russo", "normal"); d.setFontSize(size);
    d.setTextColor(color[0], color[1], color[2]);
    const lines = d.splitTextToSize(X(text), W - M * 2);
    d.text(lines, M, y);
    return y + lines.length * size * 0.42;
  }
  rect(x: number, y: number, w: number, h: number, fill?: RGB, border?: RGB) {
    const d = this.doc;
    if (fill) { d.setFillColor(fill[0], fill[1], fill[2]); d.rect(x, y, w, h, "F"); }
    if (border) { d.setDrawColor(border[0], border[1], border[2]); d.setLineWidth(0.3); d.rect(x, y, w, h, "S"); }
  }
  accentBox(x: number, y: number, w: number, h: number, accent: RGB) {
    this.rect(x, y, w, h, K.panel, K.edge);
    const d = this.doc;
    d.setFillColor(accent[0], accent[1], accent[2]);
    d.rect(x, y, 1.4, h, "F");
  }
  para(text: string, x: number, y: number, w: number, opts: { size?: number; color?: RGB; font?: "PT" | "JBM"; bold?: boolean; lh?: number } = {}): number {
    const d = this.doc;
    const { size = 9.5, color = K.snow, font = "PT", bold = false, lh = 1.45 } = opts;
    d.setFont(font, bold ? "bold" : "normal"); d.setFontSize(size);
    d.setTextColor(color[0], color[1], color[2]);
    const lines = d.splitTextToSize(X(text), w);
    const step = size * 0.3528 * lh;
    lines.forEach((ln: string, i: number) => d.text(ln, x, y + i * step, { baseline: "top" }));
    return y + lines.length * step;
  }
  label(text: string, x: number, y: number, color: RGB = K.steel, size = 6.8) {
    const d = this.doc;
    d.setFont("JBM", "normal"); d.setFontSize(size);
    d.setTextColor(color[0], color[1], color[2]);
    d.text(X(text).toUpperCase(), x, y, { baseline: "middle" });
  }
  chips(items: string[], x: number, y: number, color: RGB = K.ice): number {
    const d = this.doc;
    let cx = x;
    d.setFont("JBM", "normal"); d.setFontSize(6.8);
    for (const it of items) {
      const w = d.getTextWidth(X(it).toUpperCase()) + 5;
      if (cx + w > W - M) break;
      d.setDrawColor(color[0], color[1], color[2]); d.setLineWidth(0.25);
      d.roundedRect(cx, y, w, 5.4, 1, 1, "S");
      d.setTextColor(color[0], color[1], color[2]);
      d.text(X(it).toUpperCase(), cx + 2.5, y + 2.7, { baseline: "middle" });
      cx += w + 2.2;
    }
    return y + 5.4;
  }
  bars(rows: { name: string; value: number; label?: string; hot?: boolean }[], x: number, y: number, w: number, max: number) {
    const d = this.doc;
    const rh = 6.4;
    rows.forEach((r, i) => {
      const yy = y + i * rh;
      d.setFont("JBM", "normal"); d.setFontSize(7);
      d.setTextColor(K.steel[0], K.steel[1], K.steel[2]);
      d.text(X(r.name), x, yy + 2.4, { baseline: "middle" });
      const bx = x + 34, bw = w - 34 - 18;
      this.rect(bx, yy + 0.6, bw, 3.6, K.edge);
      const fill: RGB = r.hot ? K.amber : K.blue;
      d.setFillColor(fill[0], fill[1], fill[2]);
      d.rect(bx, yy + 0.6, Math.max(1, (r.value / max) * bw), 3.6, "F");
      d.setFont("JBM", "bold");
      d.setTextColor(K.ink[0], K.ink[1], K.ink[2]);
      d.text(`${r.label ?? r.value}`, bx + bw + 3, yy + 2.4, { baseline: "middle" });
    });
    return y + rows.length * rh;
  }
}

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function chrome(deck: Deck, kickerText: string, titleText: string, n: number, total: number, accent: RGB = K.amber2): number {
  deck.bg();
  deck.kicker(kickerText, accent);
  const yEnd = deck.title(titleText, 33, 18);
  return Math.max(yEnd + 7, 46);
}

function logLines(deck: Deck, steps: { t: string; text: string }[], x: number, y: number, w: number): number {
  const d = deck.doc;
  let yy = y;
  for (const s of steps) {
    if (s.t === "out") {
      const lines = d.splitTextToSize(X(s.text), w - 10);
      const h = 6 + lines.length * 4.4;
      deck.rect(x, yy, w, h, [255, 237, 213], K.amber);
      d.setFont("JBM", "bold"); d.setFontSize(8);
      d.setTextColor(K.amber2[0], K.amber2[1], K.amber2[2]);
      lines.forEach((ln: string, i: number) => d.text(ln, x + 4, yy + 3 + i * 4.4, { baseline: "top" }));
      yy += h + 3;
      continue;
    }
    const prefix = s.t === "ai" ? "AI > " : "... ";
    const color: RGB = s.t === "ai" ? K.ice : K.steel;
    d.setFont("JBM", s.t === "ai" ? "bold" : "normal"); d.setFontSize(7.6);
    const lines = d.splitTextToSize(prefix + X(s.text), w - 4);
    lines.forEach((ln: string, i: number) => {
      d.setTextColor(i === 0 ? color[0] : K.fog[0], i === 0 ? color[1] : K.fog[1], i === 0 ? color[2] : K.fog[2]);
      d.text(ln, x + 2, yy, { baseline: "top" });
      yy += 4.3;
    });
    yy += 1.2;
  }
  return yy;
}

const PARTS = ["Постановка", "Технология", "Промт", "Ход", "Итог"];

function lessonHeader(deck: Deck, lessonNum: string, title: string, part: number, accent: RGB, blockLine: string) {
  const d = deck.doc;
    d.setFont("Russo", "normal"); d.setFontSize(25);
    d.setTextColor(accent[0], accent[1], accent[2]);
    d.text(lessonNum, M, 31);
    deck.label(blockLine, M + 30, 20, K.steel, 6.8);
    d.setFont("Russo", "normal"); d.setFontSize(14.5);
    d.setTextColor(K.snow[0], K.snow[1], K.snow[2]);
    const lines = d.splitTextToSize(X(title), 190);  d.text(lines, M + 30, 25, { baseline: "top" });

  const sx = W - M - 5 * 13.5 + 2.5;
  PARTS.forEach((p, i) => {
    const x = sx + i * 13.5;
    if (i < part) deck.rect(x, 19, 11, 6, undefined, accent);
    else if (i === part) deck.rect(x, 19, 11, 6, accent);
    else deck.rect(x, 19, 11, 6, undefined, K.edge);
    d.setFont("JBM", "bold"); d.setFontSize(7.5);
    const numColor: RGB = i === part ? K.bg : i < part ? accent : K.steel;
    d.setTextColor(numColor[0], numColor[1], numColor[2]);
    d.text(i < part ? "+" : String(i + 1), x + 5.5, 22, { align: "center", baseline: "middle" });
    deck.label(p, x + 5.5, 28.4, i === part ? accent : K.steel, 5.4);
  });
  deck.label("часть " + (part + 1) + " / 5", sx, 33, K.steel, 5.4);
  d.setDrawColor(K.edge[0], K.edge[1], K.edge[2]); d.setLineWidth(0.3);
  d.line(M, 38, W - M, 38);
}

function lessonPage(deck: Deck, lessonId: string, part: number, n: number, total: number) {
  const lesson = ALL_LESSONS.find((l) => l.id === lessonId)!;
  const block = BLOCKS.find((b) => b.lessons.some((l) => l.id === lessonId))!;
  const accent = hexToRgb(block.accent);
  deck.bg();
  lessonHeader(deck, lesson.num, lesson.title, part, accent, `${block.code} · ${block.title} · урок ${lesson.num}`);

  const x = M, w = W - M * 2;
  let y = 43;

  if (part === 0) {
    deck.accentBox(x, y, w, 30, accent);
    deck.label("Задача урока", x + 5, y + 6, accent);
    deck.para(lesson.goal, x + 5, y + 10, w - 10, { size: 11.5, color: K.snow });
    y += 36;
    deck.accentBox(x, y, w, 34, K.steel);
    deck.label("Что происходит в кейсе на этом шаге", x + 5, y + 6, K.steel);
    deck.para(lesson.context, x + 5, y + 10, w - 10, { size: 10 });
    y += 40;
    deck.chips([`${block.hours} ак. часа на блок`, "формат: технология – промт – решение", "часть 2 – технология"], x, y, accent);
  }

  if (part === 1) {
    const d = deck.doc;
    d.setFillColor(accent[0], accent[1], accent[2]);
    const kw = d.getTextWidth(lesson.tech.kind.toUpperCase()) + 8;
    d.setFont("JBM", "bold"); d.setFontSize(8);
    deck.rect(x, y, kw, 7, accent);
    d.setTextColor(K.bg[0], K.bg[1], K.bg[2]);
    d.text(lesson.tech.kind.toUpperCase(), x + 4, y + 3.5, { baseline: "middle" });
    deck.para(lesson.tech.name, x + kw + 5, y, w - kw - 5, { size: 11.5, color: K.ink, bold: true });
    y += 12;
    y = deck.para(lesson.tech.note, x, y, w * 0.72, { size: 9.5 }) + 4;
    deck.accentBox(x, y, w, 46, accent);
    deck.label("Как это работает", x + 5, y + 6, K.steel);
    lesson.how.forEach((h, i) => {
      const yy = y + 11 + i * 11;
      d.setFont("JBM", "bold"); d.setFontSize(8.5);
      d.setTextColor(accent[0], accent[1], accent[2]);
      d.text(String(i + 1), x + 7, yy + 1, { baseline: "top" });
      deck.para(h, x + 13, yy, w - 20, { size: 9.5 });
    });
    y += 52;
    deck.chips(lesson.tools, x, y, accent);
  }

  if (part === 2) {
    const d = deck.doc;
    const lines = d.splitTextToSize(X(lesson.prompt), w - 10);
    const h = 12 + lines.length * 4.6;
    deck.rect(x, y, w, h, K.panel, K.edge);
    deck.label(`промт урока ${lesson.num}`, x + 5, y + 6, K.steel);
    d.setFont("JBM", "normal"); d.setFontSize(8.6);
    d.setTextColor(K.amber2[0], K.amber2[1], K.amber2[2]);
    lines.forEach((ln: string, i: number) => d.text(ln, x + 5, y + 10 + i * 4.6, { baseline: "top" }));
    y += h + 6;
    deck.accentBox(x, y, w, 12 + lesson.promptNotes.length * 10, accent);
    deck.label("Разбор структуры промта", x + 5, y + 6, K.steel);
    lesson.promptNotes.forEach((pn, i) => {
      const yy = y + 11 + i * 10;
      const dd = deck.doc;
      dd.setFillColor(accent[0], accent[1], accent[2]);
      dd.rect(x + 6, yy + 1.6, 1.6, 1.6, "F");
      deck.para(pn, x + 11, yy, w - 18, { size: 9.5 });
    });
  }

  if (part === 3) {
    deck.accentBox(x, y, w * 0.52, 118, accent);
    deck.label(`лог агента · урок ${lesson.num}`, x + 5, y + 6, K.steel);
    logLines(deck, lesson.process, x + 4, y + 11, w * 0.52 - 10);

    const dx = x + w * 0.52 + 6, dw = w - w * 0.52 - 6;
    if (lesson.demo === "market") {
      deck.accentBox(dx, y, dw, 118, K.ice);
      deck.label("рынок пожарной техники РФ, млрд руб.", dx + 5, y + 6, K.steel);
      deck.bars(MARKET_FORECAST.map((m) => ({ name: String(m.year), value: m.value, hot: m.year === 2024 || m.year === 2032 })), dx + 4, y + 11, dw - 8, 80);
    } else if (lesson.demo === "rice" && lesson.rice) {
      deck.accentBox(dx, y, dw, 118, K.amber2);
      deck.label("RICE-скоринг гипотез", dx + 5, y + 6, K.steel);
      deck.bars(lesson.rice.map((r, i) => ({ name: r.name, value: r.score, hot: i === 0 })), dx + 4, y + 11, dw - 8, 850);
    } else if (lesson.demo === "budget" && lesson.channels) {
      deck.accentBox(dx, y, dw, 118, K.ice);
      deck.label("распределение бюджета 2025", dx + 5, y + 6, K.steel);
      deck.bars(lesson.channels.map((c) => ({ name: c.name, value: c.pct, label: `${c.pct}%` })), dx + 4, y + 11, dw - 8, 45);
    } else if (lesson.demo === "cjm") {
      deck.accentBox(dx, y, dw, 118, K.ice);
      deck.label("кривая эмоций ЛПР по этапам закупки", dx + 5, y + 6, K.steel);
      const d = deck.doc;
      const cx0 = dx + 10, cw = dw - 20, cy0 = y + 16, ch = 42;
      const pt = (i: number, e: number) => [cx0 + (i / (CJM_STAGES.length - 1)) * cw, cy0 + ch - ((e - 1) / 4) * ch];
      d.setDrawColor(K.edge[0], K.edge[1], K.edge[2]); d.setLineWidth(0.25);
      [1, 2, 3, 4, 5].forEach((e) => { const [, yy] = pt(0, e); d.line(cx0, yy, cx0 + cw, yy); });
      d.setDrawColor(K.ice[0], K.ice[1], K.ice[2]); d.setLineWidth(0.6);
      for (let i = 1; i < CJM_STAGES.length; i++) {
        const [x1, y1] = pt(i - 1, CJM_STAGES[i - 1].emotion);
        const [x2, y2] = pt(i, CJM_STAGES[i].emotion);
        d.line(x1, y1, x2, y2);
      }
      CJM_STAGES.forEach((s, i) => {
        const [px, py] = pt(i, s.emotion);
        d.setFillColor(K.amber[0], K.amber[1], K.amber[2]);
        d.circle(px, py, 1.7, "F");
        d.setFont("JBM", "normal"); d.setFontSize(6.2);
        d.setTextColor(K.steel[0], K.steel[1], K.steel[2]);
        d.text(X(s.short), px, cy0 + ch + 5, { align: "center", baseline: "top" });
      });
      deck.label("главный барьер", dx + 5, y + 78, K.mint);
      deck.para(CJM_STAGES[3].barrier, dx + 5, y + 82, dw - 10, { size: 8.4 });
      deck.label("решение в продукте", dx + 5, y + 99, K.mint);
      deck.para(CJM_STAGES[3].solution, dx + 5, y + 103, dw - 10, { size: 8.4 });
    }
    y += 124;
    deck.label("ход решения собирается агентом на глазах — от сырых данных к выводу", x, y, K.steel, 6.4);
  }

  if (part === 4) {
    deck.accentBox(x, y, w, 36, K.mint);
    deck.label("Решение кейса", x + 5, y + 6, K.mint);
    deck.para(lesson.solution, x + 5, y + 10.5, w - 10, { size: 10, color: K.snow });
    y += 42;
    const mw = (w - 12) / 3;
    lesson.metrics.forEach((m, i) => {
      const mx = x + i * (mw + 6);
      deck.rect(mx, y, mw, 20, K.panel, K.edge);
      deck.label(m.k, mx + 4, y + 5.5, K.steel, 6.4);
      const d = deck.doc;
      d.setFont("Russo", "normal"); d.setFontSize(11);
      d.setTextColor(accent[0], accent[1], accent[2]);
      d.text(X(m.v), mx + 4, y + 10, { baseline: "top" });
    });
    y += 26;
    deck.accentBox(x, y, w * 0.5 - 3, 34, K.amber2);
    deck.label("Артефакты урока", x + 5, y + 6, K.steel);
    lesson.artifacts.forEach((a, i) => {
      const d = deck.doc;
      d.setFillColor(K.amber[0], K.amber[1], K.amber[2]);
      d.rect(x + 6, y + 12 + i * 7.4, 1.6, 1.6, "F");
      deck.para(a, x + 11, y + 10.4 + i * 7.4, w * 0.5 - 22, { size: 8.8 });
    });
    deck.accentBox(x + w * 0.5 + 3, y, w * 0.5 - 3, 34, accent);
    deck.label("Заберите с собой", x + w * 0.5 + 8, y + 6, K.steel);
    deck.chips(lesson.takeaways, x + w * 0.5 + 8, y + 11, accent);
    const nxt = ALL_LESSONS[ALL_LESSONS.findIndex((l) => l.id === lessonId) + 1];
    if (nxt) deck.label(`следующий урок: ${nxt.num} ${nxt.title}`, x, y + 41, K.ice, 6.6);
  }

  deck.footer(n, total);
}

function titlePage(deck: Deck, n: number, total: number) {
  deck.bg();
  const d = deck.doc;
  deck.kicker(`обучающая платформа · B2B · ${COURSE.hours} академических часов`);
    d.setFont("Russo", "normal"); d.setFontSize(30);
    d.setTextColor(K.snow[0], K.snow[1], K.snow[2]);
    d.text("ИИ в маркетинге:", M, 46);
    d.setTextColor(K.ice[0], K.ice[1], K.ice[2]);
    d.text("от стратегии", M, 62);
    d.setTextColor(K.amber[0], K.amber[1], K.amber[2]);
    d.text("до тактики", M + d.getTextWidth("от стратегии  "), 62);  deck.para("Курс-презентация для маркетологов B2B, продуктовых менеджеров и стратегов. 16 уроков, каждый разбит на 5 слайдов-частей: постановка – технология – промт – ход решения – результат.", M, 74, 150, { size: 10 });
  deck.accentBox(M, 98, 150, 40, K.amber);
  deck.label("сквозной кейс // «Ремдизель» × КАМАЗ", M + 5, 105, K.steel);
  deck.para("Продуктовая и маркетинговая стратегия пожарной техники на шасси КАМАЗ (включая робототехнику) – 20% рынка РФ к 2032 году.", M + 5, 110, 140, { size: 10.5, color: K.ink });
    deck.para("Рынок 2024: ~45 млрд руб. · рост 7% в год · план 450–500 машин в год", M + 5, 126, 140, { size: 8.6, font: "JBM", color: K.snow });  const cx = M + 162;
  deck.rect(cx, 40, 107, 98, K.panel, K.edge);
  deck.label("паспорт курса", cx + 6, 50, K.amber2);
  const facts: [string, string][] = [
    ["Формат", "16 ак. часов · 99 слайдов"],
    ["Уроков", "16 (по 5 слайдов-частей)"],
    ["Блоков", "4: стратегия – продукт – тактика – защита"],
    ["Кейс", "«Ремдизель», дочерняя структура КАМАЗ"],
    ["Цель кейса", "20% рынка пожарной техники РФ к 2032"],
    ["Итог", "экзамен у ИИ-экзаменатора + сертификат"],
  ];
  facts.forEach((f, i) => {
    const yy = 58 + i * 12.5;
    deck.label(f[0], cx + 6, yy, K.steel);
    deck.para(f[1], cx + 6, yy + 3.4, 95, { size: 9, color: K.fog });
  });
  deck.chips(["16 уроков", "4 блока", "сквозной кейс КАМАЗ", "PDF с текстовым слоем"], M, 148, K.ice);
  deck.footer(n, total);
}

function methodPage(deck: Deck, n: number, total: number) {
  const y = chrome(deck, "навигация по презентации", "Каждый урок — 5 слайдов, которые дополняют основной", n, total, K.amber2);
  const steps: [string, string][] = [
    ["01 · Постановка", "Задача урока и место шага в сквозном кейсе «Ремдизель»."],
    ["02 · Технология", "Какой ИИ-инструмент применяется: агент, RAG, Multi-Agent, Structured Output."],
    ["03 · Промт", "Готовый промт с разбором структуры — копируйте и адаптируйте."],
    ["04 · Ход решения", "Лог агента и живые демонстрации: CJM, RICE, фокус-группа, тендерная воронка."],
    ["05 · Результат", "Решение кейса в цифрах, артефакты урока и выводы — доска кейса заполнена."],
  ];
  const bw = (W - M * 2 - 4 * 5) / 5;
  steps.forEach((s, i) => {
    const x = M + i * (bw + 5);
    deck.accentBox(x, y, bw, 52, i === 4 ? K.mint : K.amber);
    deck.para(s[0], x + 5, y + 6, bw - 10, { size: 9.5, font: "JBM", bold: true, color: K.ink });
    deck.para(s[1], x + 5, y + 15, bw - 10, { size: 8.4 });
  });
    deck.para("Справа на слайдах урока живёт доска кейса — каркас основного слайда. Каждая следующая часть заполняет один слот: к пятому слайду урок собран целиком.", M, y + 62, W - M * 2, { size: 9.5, color: K.snow });  deck.label("← → или свайп — смена слайдов · пробел — вперёд · PDF — экспорт с текстовым слоем", M, y + 80, K.ice, 7);
  deck.footer(n, total);
}

function agendaPage(deck: Deck, n: number, total: number) {
  const y = chrome(deck, "программа · 16 академических часов", "Маршрут курса", n, total, K.amber2);
  BLOCKS.forEach((b, i) => {
    const yy = y + i * 24;
    const accent = hexToRgb(b.accent);
    deck.rect(M, yy, W - M * 2, 20, K.panel, K.edge);
    const d = deck.doc;
    d.setFillColor(accent[0], accent[1], accent[2]);
    d.rect(M, yy, 1.6, 20, "F");
    d.setFont("Russo", "normal"); d.setFontSize(16);
    d.setTextColor(accent[0], accent[1], accent[2]);
    d.text(`0${b.id}`, M + 7, yy + 10, { baseline: "middle" });
    d.setFont("Russo", "normal"); d.setFontSize(12);
    d.setTextColor(K.ink[0], K.ink[1], K.ink[2]);
    d.text(X(b.title), M + 26, yy + 6.4, { baseline: "middle" });
    deck.para(b.task, M + 26, yy + 11.4, 170, { size: 8.4 });
    d.setFont("JBM", "normal"); d.setFontSize(7.5);
    d.setTextColor(K.steel[0], K.steel[1], K.steel[2]);
    d.text(b.lessons.length > 0 ? `${b.hours} ак. ч · ${b.lessons.length} уроков × 5 слайдов` : `${b.hours} ак. ч · экзамен + сертификат`, W - M - 6, yy + 10, { align: "right", baseline: "middle" });
  });
  deck.footer(n, total);
}

function casePage(deck: Deck, n: number, total: number) {
  const y = chrome(deck, "сквозной кейс · 16 часов практики", "«Ремдизель» × КАМАЗ: пожарная робототехника", n, total, K.amber);
  const d = deck.doc;
  deck.rect(M, y, W - M * 2, 26, K.panel, K.edge);
  d.setFillColor(K.amber[0], K.amber[1], K.amber[2]);
  d.rect(M, y, 1.6, 26, "F");
  deck.label("цель кейса", M + 6, y + 7, K.amber2);
    deck.para("Разработать продуктовую и маркетинговую стратегию пожарной техники на шасси КАМАЗ (включая робототехнику) для захвата 20% рынка РФ к 2032 году.", M + 6, y + 11, W - M * 2 - 14, { size: 11, color: K.snow });  const cells: [string, string, string][] = [
    ["Компания", "«Ремдизель» — дочерняя структура КАМАЗ; компетенции в ремонте и модернизации армейских машин.", "Компетенции"],
    ["Продукт", "Автоцистерна на шасси КАМАЗ-43118 с роботизированным лафетным стволом РТ-80: оператор — в 100 м от кромки пожара.", "Роботика"],
    ["Рынок", "~45 млрд руб. в 2024 году, рост 7% в год на госпрограммах перевооружения МЧС и роботизации ТЭК.", "45 млрд"],
    ["Математика цели", "20% рынка к 2032 году – это 450–500 машин в год; 2025 год – выход на 50 единиц и 5% доли.", "20% / 2032"],
  ];
  const cw = (W - M * 2 - 6) / 2;
  cells.forEach((c, i) => {
    const x = M + (i % 2) * (cw + 6);
    const yy = y + 32 + Math.floor(i / 2) * 44;
    deck.accentBox(x, yy, cw, 38, i % 2 === 0 ? K.ice : K.amber2);
    deck.label(c[0], x + 5, yy + 7, K.steel);
    const dd = deck.doc;
    dd.setFont("Russo", "normal"); dd.setFontSize(10);
    dd.setTextColor(K.ink[0], K.ink[1], K.ink[2]);
    dd.text(X(c[2]), x + cw - 6, yy + 7, { align: "right", baseline: "middle" });
    deck.para(c[1], x + 5, yy + 12, cw - 12, { size: 9 });
  });
  deck.footer(n, total);
}

function productPage(deck: Deck, n: number, total: number) {
  const y = chrome(deck, "продукт сквозного кейса", "«КАМАЗ-Щит» РТ-80: робот там, где людям нельзя", n, total, K.ice);
  PRODUCT_SPECS.forEach((s, i) => {
    const yy = y + i * 13.5;
    deck.rect(M, yy, W - M * 2, 11, i % 2 ? K.panel : K.bg, K.edge);
    const d = deck.doc;
    d.setFont("JBM", "normal"); d.setFontSize(8);
    d.setTextColor(K.steel[0], K.steel[1], K.steel[2]);
    d.text(X(s.k).toUpperCase(), M + 6, yy + 5.5, { baseline: "middle" });
    d.setFont("PT", "bold"); d.setFontSize(10.5);
    d.setTextColor(K.ink[0], K.ink[1], K.ink[2]);
    d.text(X(s.v), M + 62, yy + 5.5, { baseline: "middle" });
  });
  deck.accentBox(M, y + PRODUCT_SPECS.length * 13.5 + 8, W - M * 2, 24, K.amber);
  deck.label("гипотеза-ядро (RICE 850)", M + 6, y + PRODUCT_SPECS.length * 13.5 + 15, K.amber2);
    deck.para("Интеграция беспилотного роботизированного модуля тушения на базе КАМАЗ, управляемого оператором из безопасной зоны (до 100 м) — отстройка от конкурентов.", M + 6, y + PRODUCT_SPECS.length * 13.5 + 19, W - M * 2 - 14, { size: 9.5, color: K.snow });  deck.footer(n, total);
}

function mathPage(deck: Deck, n: number, total: number) {
  const y = chrome(deck, "математика цели", "45 млрд – 77 млрд: цена 20% рынка", n, total, K.amber2);
  deck.accentBox(M, y, 158, 120, K.ice);
  deck.label("рынок пожарной техники РФ, млрд руб.", M + 5, y + 6, K.steel);
  deck.bars(MARKET_FORECAST.map((m) => ({ name: String(m.year), value: m.value, hot: m.year === 2024 || m.year === 2032 })), M + 4, y + 11, 150, 80);
  const fx = M + 164;
  const facts: [string, string, RGB][] = [
    ["45 млрд руб.", "объём рынка пожарной техники в 2024 году", K.ice],
    ["7% CAGR", "ежегодный рост на госпрограммах перевооружения МЧС и ТЭК", K.amber2],
    ["450–500 ед./год", "столько машин должен продавать «Ремдизель» для 20% доли к 2032", K.mint],
  ];
  facts.forEach((f, i) => {
    const yy = y + i * 38;
    deck.rect(fx, yy, W - M - fx, 32, K.panel, K.edge);
    const d = deck.doc;
    d.setFillColor(f[2][0], f[2][1], f[2][2]);
    d.rect(fx, yy, 1.4, 32, "F");
    d.setFont("Russo", "normal"); d.setFontSize(12);
    d.setTextColor(f[2][0], f[2][1], f[2][2]);
    d.text(X(f[0]), fx + 5, yy + 7, { baseline: "top" });
    deck.para(f[1], fx + 5, yy + 14, W - M - fx - 10, { size: 8.4 });
  });
  deck.footer(n, total);
}

function stackPage(deck: Deck, n: number, total: number) {
  const y = chrome(deck, "архитектура платформы", "Технологический стек продакшн-версии", n, total, K.ice);
  const rows: [string, string, string][] = [
    ["Frontend", "React + TypeScript, TailwindCSS, анимации Framer Motion", "UI"],
    ["AI-контур", "LangChain / LlamaIndex: RAG по патентам и сервисной базе", "RAG · агенты"],
    ["Модели", "OpenAI API или YandexGPT / GigaChat — импортозамещение для контура КАМАЗ", "LLM"],
    ["Данные", "PostgreSQL: прогресс слушателей, логи промтов, история экзаменов", "БД"],
    ["Интеграции", "Jira / Notion API (бэклог), zakupki.gov.ru (скрейпер), Telegram (алерты)", "API"],
    ["Деплой", "Docker + Kubernetes либо Vercel/Cloudflare для фронтенда", "Ops"],
  ];
  rows.forEach((r, i) => {
    const yy = y + i * 18.5;
    deck.rect(M, yy, W - M * 2, 16, i % 2 ? K.panel : K.bg, K.edge);
    const d = deck.doc;
    d.setFont("JBM", "bold"); d.setFontSize(8);
    d.setTextColor(K.amber2[0], K.amber2[1], K.amber2[2]);
    d.text(r[0].toUpperCase(), M + 6, yy + 8, { baseline: "middle" });
    deck.para(r[1], M + 44, yy + 4.6, 168, { size: 9 });
    d.setFont("JBM", "normal"); d.setFontSize(7);
    d.setTextColor(K.ice[0], K.ice[1], K.ice[2]);
    d.text(r[2].toUpperCase(), W - M - 6, yy + 8, { align: "right", baseline: "middle" });
  });
  deck.label("в учебной версии ответы агентов воспроизводятся локально — без внешних API", M, y + 6 * 18.5 + 6, K.steel, 7);
  deck.footer(n, total);
}

function blockPage(deck: Deck, blockId: number, n: number, total: number) {
  const b = BLOCKS.find((x) => x.id === blockId)!;
  const accent = hexToRgb(b.accent);
  deck.bg();
  const d = deck.doc;
  deck.kicker(`${b.code} · ${b.hours} академических часа`, accent);
    d.setFont("Russo", "normal"); d.setFontSize(30);
    d.setTextColor(K.snow[0], K.snow[1], K.snow[2]);
    d.text(X(b.title), M, 48);  deck.para(`Задача: ${b.task.toLowerCase()}.`, M, 58, 200, { size: 11, color: K.fog });
  b.lessons.forEach((l, i) => {
    const yy = 74 + i * 17;
    deck.rect(M, yy, W - M * 2, 14, K.panel, K.edge);
    d.setFillColor(accent[0], accent[1], accent[2]);
    d.rect(M, yy, 1.2, 14, "F");
    d.setFont("Russo", "normal"); d.setFontSize(10);
    d.setTextColor(accent[0], accent[1], accent[2]);
    d.text(l.num, M + 6, yy + 7, { baseline: "middle" });
    d.setFont("PT", "bold"); d.setFontSize(10);
    d.setTextColor(K.ink[0], K.ink[1], K.ink[2]);
    d.text(X(l.title), M + 22, yy + 7, { baseline: "middle" });
    d.setFont("JBM", "normal"); d.setFontSize(7);
    d.setTextColor(K.steel[0], K.steel[1], K.steel[2]);
    d.text(`${l.tech.kind.toUpperCase()} · 5 слайдов`, W - M - 6, yy + 7, { align: "right", baseline: "middle" });
  });
  if (b.lessons.length === 0) {
    deck.para("Финальное задание: слушатель пишет собственный промт для «виртуального тестирования» и получает оценку ИИ-экзаменатора по 5 критериям. Порог зачёта — 70 баллов; после зачёта генерируется именной PDF-сертификат.", M, 78, W - M * 2, { size: 10.5, color: K.snow });
  }
  deck.footer(n, total);
}

const BLOCK_RESUME: Record<number, { kpi: [string, string][]; line: string }> = {
  1: { kpi: [["Рынок 2024", "45 млрд руб."], ["Сегментов ЦА", "3"], ["RICE топ-гипотезы", "850"], ["Патентные заявки", "2"]], line: "Рынок обоснован, сегменты выбраны, гипотеза защищена патентом, бренд «КАМАЗ-Щит» утверждён." },
  2: { kpi: [["JTBD-инсайт", "обзор + термо-защита"], ["ТТХ ствола", "80 м · 360°"], ["User Stories", "24"], ["Уязвимость № 1", "ЭМИ / перегрев"]], line: "Продукт спроектирован от болей ЦА: PRD, бэклог и стресс-тест виртуальной комиссией." },
  3: { kpi: [["Бюджет 2025", "40 / 30 / 30"], ["Алерт по тендеру", "< 30 мин"], ["Постов в месяц", "12"], ["KPI года", "5% рынка"]], line: "Упаковка, каналы, автоворонка и сервис собраны в годовой план вывода на рынок." },
};

function blockSummaryPage(deck: Deck, blockId: number, n: number, total: number) {
  const b = BLOCKS.find((x) => x.id === blockId)!;
  const r = BLOCK_RESUME[blockId];
  const accent = hexToRgb(b.accent);
  const y = chrome(deck, `${b.code} · контрольная точка`, `Итоги: ${b.title.toLowerCase()}`, n, total, accent);
  const kw = (W - M * 2 - 18) / 4;
  r.kpi.forEach((kv, i) => {
    const x = M + i * (kw + 6);
    deck.rect(x, y, kw, 26, K.panel, K.edge);
    const d = deck.doc;
    d.setFillColor(accent[0], accent[1], accent[2]);
    d.rect(x, y, kw, 1.2, "F");
    deck.label(kv[0], x + 4, y + 7, K.steel);
    d.setFont("Russo", "normal"); d.setFontSize(11);
    d.setTextColor(accent[0], accent[1], accent[2]);
    d.text(X(kv[1]), x + 4, y + 12, { baseline: "top" });
  });
  deck.accentBox(M, y + 34, W - M * 2, 22, accent);
  deck.label("вывод блока", M + 6, y + 41, accent);
    deck.para(r.line, M + 6, y + 45, W - M * 2 - 14, { size: 10.5, color: K.snow });  deck.footer(n, total);
}

function examPage(deck: Deck, n: number, total: number) {
  const y = chrome(deck, "блок 04 · защита проекта", "Финальное задание у ИИ-экзаменатора", n, total, K.ice);
  deck.accentBox(M, y, W - M * 2, 30, K.amber);
  deck.label("задание", M + 6, y + 7, K.amber2);
    deck.para("Напишите собственный промт для «виртуального тестирования» роботизированного КАМАЗа (Multi-Agent Simulation, урок 2.5). Экзаменатор разберёт его по 5 критериям промт-инжиниринга. Порог зачёта — 70 баллов.", M + 6, y + 11, W - M * 2 - 14, { size: 9.5, color: K.snow });  const crit: [string, string][] = [
    ["Роль и субъект", "агентам заданы роли и мотивации"],
    ["Контекст кейса", "продукт «Ремдизель», шасси КАМАЗ, сценарий резервуарного пожара"],
    ["Задача и действия", "глаголы: «задайте вопросы», «найдите уязвимости», «протестируйте возражения»"],
    ["Критерии и ограничения", "числа: -40°C, зона 100 м, бюджет, срок окупаемости"],
    ["Формат результата", "структура вывода: таблица «вопрос – риск – доработка», ранжирование"],
  ];
  crit.forEach((c, i) => {
    const yy = y + 38 + i * 14.5;
    deck.rect(M, yy, W - M * 2, 12, i % 2 ? K.panel : K.bg, K.edge);
    const d = deck.doc;
    d.setFont("JBM", "bold"); d.setFontSize(8.5);
    d.setTextColor(K.ice[0], K.ice[1], K.ice[2]);
    d.text(`${i + 1}. ${c[0].toUpperCase()}`, M + 6, yy + 6, { baseline: "middle" });
    deck.para(c[1], M + 74, yy + 3.4, 140, { size: 8.6 });
    d.setFont("JBM", "bold"); d.setFontSize(8);
    d.setTextColor(K.amber2[0], K.amber2[1], K.amber2[2]);
    d.text("20 Б.", W - M - 6, yy + 6, { align: "right", baseline: "middle" });
  });
  deck.footer(n, total);
}

function certPage(deck: Deck, n: number, total: number) {
  const y = chrome(deck, "блок 04 · итог обучения", "Именной PDF-сертификат", n, total, K.mint);
  const steps: [string, string][] = [
    ["01 · Зачёт", "Сдайте финальное задание у ИИ-экзаменатора на 70+ баллов — результат сохранится в профиле."],
    ["02 · ФИО", "Укажите фамилию, имя и отчество на слайде сертификата в интерактивной презентации."],
    ["03 · PDF", "Нажмите «Скачать PDF-сертификат»: генерируется именной документ с номером, баллом и печатью."],
  ];
  steps.forEach((s, i) => {
    const yy = y + i * 26;
    deck.accentBox(M, yy, W - M * 2, 21, i === 2 ? K.mint : K.ice);
    const d = deck.doc;
    d.setFont("JBM", "bold"); d.setFontSize(9);
    d.setTextColor(K.ink[0], K.ink[1], K.ink[2]);
    d.text(s[0], M + 6, yy + 10.5, { baseline: "middle" });
    deck.para(s[1], M + 52, yy + 6.6, W - M * 2 - 62, { size: 9 });
  });
    deck.para("Сертификат подтверждает 16 академических часов курса «ИИ в маркетинге: от стратегии до тактики» и сдачу финального задания на материалах кейса «Ремдизель».", M, y + 86, W - M * 2, { size: 9.5, color: K.snow });  deck.footer(n, total);
}

function planPage(deck: Deck, n: number, total: number) {
  const y = chrome(deck, "урок 3.6 · синтез", "Годовой план вывода на рынок — 2025", n, total, K.amber2);
  const qw = (W - M * 2 - 18) / 4;
  YEAR_PLAN.forEach((q, i) => {
    const x = M + i * (qw + 6);
    deck.rect(x, y, qw, 78, K.panel, K.edge);
    const d = deck.doc;
    d.setFillColor(K.amber[0], K.amber[1], K.amber[2]);
    d.rect(x, y, qw, 1.4, "F");
    d.setFont("Russo", "normal"); d.setFontSize(16);
    d.setTextColor(K.amber2[0], K.amber2[1], K.amber2[2]);
    d.text(q.q, x + 5, y + 10, { baseline: "top" });
    deck.para(q.text, x + 5, y + 20, qw - 10, { size: 9 });
    deck.label("KPI", x + 5, y + 58, K.steel);
    deck.para(q.kpi, x + 5, y + 62, qw - 10, { size: 8.6, color: K.ice, font: "JBM", bold: true });
  });
  deck.accentBox(M, y + 86, W - M * 2, 22, K.amber);
  deck.label("слоган линейки", M + 6, y + 93, K.amber2);
    deck.para("«Технологии, которые спасают. Интеллект, который защищает». KPI 2025 года — 5% доли рынка: первый шаг к 20% к 2032-му.", M + 6, y + 97, W - M * 2 - 14, { size: 10, color: K.snow });  deck.footer(n, total);
}

function takeawaysPage(deck: Deck, n: number, total: number) {
  const y = chrome(deck, "резюме курса", "Что вы уносите с 16 часов", n, total, K.ice);
  const items: [string, string][] = [
    ["Рыночная модель", "45 млрд – 77 млрд руб., CAGR 7%, план 450–500 машин в год под 20% доли"],
    ["3 сегмента ЦА", "МЧС РФ, промышленные гиганты, аэропорты и порты — с ЛПР, болями и критериями"],
    ["Гипотеза-ядро", "роботизированный модуль тушения, оператор в 100 м; RICE 850"],
    ["Патентная стратегия", "2 заявки: быстросъёмный узел крепления + алгоритм автонаведения"],
    ["JTBD-инсайт", "обзор с высоты и защита от теплового удара — в основе PRD"],
    ["PRD и бэклог", "ТТХ 80 м / 360° / < 2 мин; 4 Epic, 24 User Stories, спринт-план на 3 месяца"],
    ["Реестр рисков", "уязвимость № 1 — ЭМИ и перегрев электроники; экранирование + телеметрия"],
    ["Медиамix 2025", "40% закрытые показы МЧС · 30% TenChat и СМИ · 30% SEO и кейсы"],
    ["Автоворонка", "скрейпер zakupki.gov.ru – LLM-анализ ТЗ – черновик заявки – Telegram"],
    ["Сервисная модель", "RAG-бот поддержки, VR-тренажёр, телеметрия 24/7 против главного барьера CJM"],
  ];
  items.forEach((it, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + col * ((W - M * 2) / 2 + 3);
    const yy = y + row * 21.5;
    deck.rect(x, yy, (W - M * 2) / 2 - 3, 18.5, K.panel, K.edge);
    const d = deck.doc;
    d.setFillColor(col ? K.ice[0] : K.amber[0], col ? K.ice[1] : K.amber[1], col ? K.ice[2] : K.amber[2]);
    d.rect(x, yy, 1.2, 18.5, "F");
    deck.para(it[0], x + 5, yy + 2.6, (W - M * 2) / 2 - 14, { size: 8.6, font: "JBM", bold: true, color: K.ink });
    deck.para(it[1], x + 5, yy + 8, (W - M * 2) / 2 - 14, { size: 8 });
  });
  deck.footer(n, total);
}

function finalPage(deck: Deck, n: number, total: number) {
  deck.bg();
  const d = deck.doc;
  deck.kicker("финал · защита проекта");
  d.setFont("Russo", "normal"); d.setFontSize(26);
  d.setTextColor(K.ink[0], K.ink[1], K.ink[2]);
  d.text("Технологии, которые спасают.", M, 62);
  d.setTextColor(K.amber[0], K.amber[1], K.amber[2]);
  d.text("Интеллект, который защищает.", M, 78);
    deck.para("Сквозной кейс «Ремдизель» собран: рынок, продукт, каналы и сервис сведены в годовой план. Дальше — защита перед советом директоров и первые 50 машин.", M, 92, 190, { size: 10.5, color: K.snow });  deck.chips(["16 ак. часов", "99 слайдов", "45+ артефактов", "цель: 20% рынка к 2032"], M, 112, K.ice);
  deck.label("ремдизель AI-академия · дочерняя структура КАМАЗ · 2025", M, 130, K.snow, 7);
  deck.footer(n, total);
}

function renderSlide(deck: Deck, s: Slide, n: number, total: number) {
  switch (s.kind) {
    case "title": return titlePage(deck, n, total);
    case "method": return methodPage(deck, n, total);
    case "agenda": return agendaPage(deck, n, total);
    case "case": return casePage(deck, n, total);
    case "product": return productPage(deck, n, total);
    case "math": return mathPage(deck, n, total);
    case "stack": return stackPage(deck, n, total);
    case "block": return blockPage(deck, s.blockId, n, total);
    case "blockSummary": return blockSummaryPage(deck, s.blockId, n, total);
    case "lesson": return lessonPage(deck, s.lessonId, s.part, n, total);
    case "exam": return examPage(deck, n, total);
    case "cert": return certPage(deck, n, total);
    case "plan": return planPage(deck, n, total);
    case "takeaways": return takeawaysPage(deck, n, total);
    case "final": return finalPage(deck, n, total);
  }
}

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

export async function exportDeckPdf(slides: Slide[], onProgress?: (done: number, total: number) => void, isCancelled?: () => boolean): Promise<boolean> {
  const { doc, plan } = await prepareFonts();
  USE_TR = plan.translit;
  doc.setProperties({ title: COURSE.title, author: COURSE.org, subject: "Сквозной кейс «Ремдизель»: пожарная робототехника на шасси КАМАЗ", creator: "Ремдизель AI-Академия" });
  const total = slides.length;
  for (let i = 0; i < total; i++) {
    if (isCancelled?.()) return false;
    if (i > 0) doc.addPage("a4", "landscape");
    renderSlide(new Deck(), slides[i], i + 1, total);
    onProgress?.(i + 1, total);
    if (i % 6 === 5) await tick();
  }
  if (isCancelled?.()) return false;
  doc.save("remdiesel-ii-v-marketinge-slaidy.pdf");
  return true;
}

export async function exportCertPdf(name: string, score: number, onProgress?: (done: number) => void, isCancelled?: () => boolean): Promise<boolean> {
  const { doc, plan } = await prepareFonts();
  USE_TR = plan.translit;
  doc.setProperties({ title: `Сертификат ${name}`, author: COURSE.org, creator: "Ремдизель AI-Академия" });
  onProgress?.(0);
  if (isCancelled?.()) return false;

  const L: RGB = [30, 64, 175], A: RGB = [249, 115, 22], T: RGB = [51, 70, 90];
  doc.setFillColor(243, 246, 250); doc.rect(0, 0, W, H, "F");
  doc.setDrawColor(L[0], L[1], L[2]); doc.setLineWidth(1); doc.rect(10, 10, W - 20, H - 20, "S");
  doc.setDrawColor(A[0], A[1], A[2]); doc.setLineWidth(0.4); doc.rect(13, 13, W - 26, H - 26, "S");
  doc.setFont("JBM", "normal"); doc.setFontSize(8); doc.setTextColor(74, 91, 109);
  doc.text("РЕМДИЗЕЛЬ AI-АКАДЕМИЯ · КАМАЗ", W / 2, 26, { align: "center" });
  doc.setFont("Russo", "normal"); doc.setFontSize(34); doc.setTextColor(L[0], L[1], L[2]);
  doc.text("СЕРТИФИКАТ", W / 2, 46, { align: "center" });
  let h = 0;
  for (const ch of name.trim() || "anon") h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const num = `RDA-2025-${1000 + (h % 9000)}`;
  doc.setFont("JBM", "normal"); doc.setFontSize(8);
  doc.text(`№ ${num} · ПОДТВЕРЖДАЕТ, ЧТО`, W / 2, 56, { align: "center" });
  doc.setFont("Russo", "normal"); doc.setFontSize(21); doc.setTextColor(21, 34, 48);
  doc.text(X(name.trim() || "Фамилия Имя Отчество"), W / 2, 72, { align: "center" });
  doc.setDrawColor(A[0], A[1], A[2]); doc.setLineWidth(0.8); doc.line(W / 2 - 70, 76, W / 2 + 70, 76);
  doc.setFont("PT", "normal"); doc.setFontSize(11); doc.setTextColor(T[0], T[1], T[2]);
  const body = doc.splitTextToSize(X("успешно завершил(а) курс «ИИ в маркетинге: от стратегии до тактики» — 16 академических часов, сквозной кейс «Ремдизель» (дочерняя структура КАМАЗ): продуктовая и маркетинговая стратегия пожарной техники на шасси КАМАЗ, включая робототехнику, — и сдал(а) финальное задание у ИИ-экзаменатора."), 200);
  doc.text(body, W / 2, 88, { align: "center" });
  const date = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  doc.setDrawColor(T[0], T[1], T[2]); doc.setLineWidth(0.3);
  doc.line(30, 165, 95, 165); doc.line(W - 95, 165, W - 30, 165);
  doc.setFont("PT", "normal"); doc.setFontSize(8.5); doc.text("Директор академии", 30, 169); doc.text("ИИ-экзаменатор RDA", W - 30, 169, { align: "right" });
  doc.setFont("JBM", "normal"); doc.setFontSize(7.5); doc.text(`Дата: ${date}`, 30, 175);
  doc.setFont("JBM", "bold"); doc.setFontSize(9); doc.setTextColor(L[0], L[1], L[2]);
  doc.text(`ЭКЗАМЕН: ${score}/100`, W / 2, 168, { align: "center" });

  if (isCancelled?.()) return false;
  doc.save(`sertifikat-${name.trim().replace(/\s+/g, "-").toLowerCase()}.pdf`);
  onProgress?.(1);
  return true;
}
