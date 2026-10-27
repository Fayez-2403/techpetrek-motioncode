// Text measuring for the CASE FILE card (owned by the card builder). Canvas measureText after the fonts are loaded, so the
// DOM card and any canvas texture (the 3D board's flying card) can break lines identically: call headlineLayout() /
// wrapLines() with the same layout constants and you get the same lines.
import { useEffect, useState } from 'react';
import { continueRender, delayRender } from 'remotion';
import { F } from '../styles/typography';

/** CSS / canvas font settings used by the card */
export const TYPE = {
  head: { family: F.head, weight: 860, tracking: -0.035, ws: 0.07 },
  body: { family: F.head, weight: 420, tracking: -0.004 },
  value: { family: F.head, weight: 800, tracking: -0.012 },
  mono: { family: F.mono, weight: 500, tracking: 0.02 },
  monoBold: { family: F.mono, weight: 700, tracking: 0.08 },
  serif: { family: F.serif, weight: 400, tracking: -0.02 },
} as const;
/** tracking = CSS letter-spacing (em, after every character); ws = extra CSS word-spacing (em) */
export type TypeSpec = { family: string; weight: number; tracking: number; ws?: number };

const SPECS = [`${TYPE.head.weight} 40px Archivo`, `${TYPE.body.weight} 40px Archivo`, `${TYPE.value.weight} 40px Archivo`,
  `400 40px "Instrument Serif"`, `500 20px "JetBrains Mono"`, `700 20px "JetBrains Mono"`];
let fontsOk = false;
const fontsLoaded = () => typeof document !== 'undefined' && SPECS.every((s) => document.fonts.check(s));

/** true once the card fonts are loaded; holds the render (delayRender) until then */
export function useFontsReady() {
  const [ok, setOk] = useState(() => fontsOk || (fontsOk = fontsLoaded()));
  const [handle] = useState(() => (ok ? null : delayRender('card fonts')));
  useEffect(() => {
    if (ok || handle === null) return;
    let done = false;
    const finish = () => { if (done) return; done = true; continueRender(handle); };
    Promise.all(SPECS.map((s) => document.fonts.load(s))).then(() => document.fonts.ready).then(() => {
      fontsOk = true; setOk(true); finish();
    }).catch(() => { fontsOk = true; setOk(true); finish(); });
    return finish;
  }, []);
  return ok;
}

let ctx: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();
/** rendered width (px) of `text` at `size` px with tracking (em) applied after every character, like CSS letter-spacing */
export function textWidth(text: string, size: number, t: TypeSpec) {
  const key = `${t.family}|${t.weight}|${size}|${t.tracking}|${t.ws ?? 0}|${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  if (!ctx) ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
  let w: number;
  if (ctx) {
    ctx.font = `${t.weight} ${size}px ${t.family}`;
    w = ctx.measureText(text).width + t.tracking * size * [...text].length + (t.ws ?? 0) * size * (text.split(' ').length - 1);
  } else w = text.length * size * 0.55;
  if (fontsOk) cache.set(key, w);
  return w;
}

/** greedy word wrap at width `w` */
function greedy(words: string[], w: number, size: number, t: TypeSpec) {
  const lines: string[][] = [];
  let cur: string[] = [];
  for (const word of words) {
    const tryLine = [...cur, word].join(' ');
    if (cur.length && textWidth(tryLine, size, t) > w) { lines.push(cur); cur = [word]; } else cur.push(word);
  }
  if (cur.length) lines.push(cur);
  return lines;
}

/** word wrap; `balance` keeps the same line count but evens the line lengths (no lonely last word) */
export function wrapLines(text: string, w: number, size: number, t: TypeSpec, balance = false): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const base = greedy(words, w, size, t);
  if (!balance || base.length < 2) return base.map((l) => l.join(' '));
  let lo = w * 0.4, hi = w;
  for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (greedy(words, mid, size, t).length > base.length) lo = mid; else hi = mid; }
  return greedy(words, hi, size, t).map((l) => l.join(' '));
}

/** headline lines + size: the layout size, shrunk (to 72%) only if the text needs more than maxLines or one word is
 *  wider than the box */
export function headlineLayout(text: string, L: { w: number; size: number; maxLines: number }) {
  const fits = (lines: string[], s: number) => lines.length <= L.maxLines && lines.every((l) => textWidth(l, s, TYPE.head) <= L.w + 1);
  for (let s = L.size; s >= L.size * 0.72; s -= 2) {
    const lines = wrapLines(text, L.w, s, TYPE.head, true);
    if (fits(lines, s)) return { size: s, lines };
  }
  const s = Math.round(L.size * 0.72);
  return { size: s, lines: wrapLines(text, L.w, s, TYPE.head, true) };
}

/** body paragraphs -> visual lines (each paragraph starts a new line); shrinks to fit maxLines (min 85%) */
export function bodyLayout(paras: string[], L: { w: number; size: number; maxLines: number }) {
  const run = (s: number) => paras.map((p) => wrapLines(p, L.w, s, TYPE.body, false));
  for (let s = L.size; s >= L.size * 0.85; s -= 1) {
    const ls = run(s);
    if (ls.flat().length <= L.maxLines) return { size: s, paras: ls };
  }
  const s = Math.round(L.size * 0.85);
  return { size: s, paras: run(s) };
}

/** body paragraphs grouped into pages of at most `maxLines` lines at `size` (a paragraph longer than a page is shrunk
 *  to fit, down to 85%). One page = static body; more pages = the body turns pages on beats. */
export function bodyPages(paras: string[], w: number, size: number, maxLines: number) {
  // balanced: fewest pages, then the most even split of whole paragraphs (no lonely one-line last page)
  const wrapped = paras.map((p) => wrapLines(p, w, size, TYPE.body, false));
  if (wrapped.length && wrapped.length <= 6 && wrapped.every((l) => l.length <= maxLines)) {
    const n = wrapped.length;
    for (let P = 1; P <= n; P++) {
      let best: number[] | null = null, bestScore = Infinity;
      const rec = (start: number, cuts: number[]) => {
        if (cuts.length === P - 1) {
          const bounds = [0, ...cuts, n];
          const sizes = bounds.slice(1).map((e, i) => wrapped.slice(bounds[i], e).reduce((a, l) => a + l.length, 0));
          if (Math.max(...sizes) > maxLines) return;
          const score = Math.max(...sizes) * 10 - Math.min(...sizes);
          if (score < bestScore) { bestScore = score; best = [...cuts]; }
          return;
        }
        for (let c = start + 1; c < n; c++) rec(c, [...cuts, c]);
      };
      rec(0, []);
      if (best) {
        const bounds = [0, ...(best as number[]), n];
        return bounds.slice(1).map((e, i) => ({ size, lines: wrapped.slice(bounds[i], e).flat() }));
      }
    }
  }
  const pages: { size: number; lines: string[] }[] = [];
  let cur: string[] = [];
  const flush = () => { if (cur.length) pages.push({ size, lines: cur }); cur = []; };
  for (const p of paras) {
    let ls = wrapLines(p, w, size, TYPE.body, false);
    if (ls.length > maxLines) {
      flush();
      let s = size;
      while (ls.length > maxLines && s > size * 0.85) { s -= 1; ls = wrapLines(p, w, s, TYPE.body, false); }
      pages.push({ size: s, lines: ls });
      continue;
    }
    if (cur.length + ls.length > maxLines) flush();
    cur.push(...ls);
  }
  flush();
  return pages;
}

/** largest size <= `size` (down to `min`) at which a single line fits `w` */
export function fitSize(text: string, w: number, size: number, t: TypeSpec, min = size * 0.6) {
  let s = size;
  while (s > min && textWidth(text, s, t) > w) s -= 1;
  return s;
}

export const trackingCss = (t: TypeSpec) => `${t.tracking}em`;
