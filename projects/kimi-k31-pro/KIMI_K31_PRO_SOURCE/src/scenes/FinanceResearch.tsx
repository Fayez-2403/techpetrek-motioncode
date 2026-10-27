// 07 · FINANCIAL RESEARCH — B (illustrative reconstruction, fictional sample company).
// Entry: scene 06's mint knee-angle line becomes the revenue line of a light report page; the camera pulls back to a wall
// of reports (CSS 3D, gentle orbit). Three source excerpts lift out as readable panels; highlighted figures fly into a
// sample workbook (cell mapping); formula lines trace source cells to formula cells; the filing's quarters are
// cross-checked against the annual report; a zero-based chart builds from the cells; a cited finding traces back to the
// source pages. Exit: the workspace shrinks into one rounded card (scale 0.18), scene 08's first node.
// Reel: one column (document -> workbook -> chart), larger type, inside y 260-1360; the card then flattens into the mint
// bar that scene 08 would have handed to 09 (08 is not in the reel).
// Every printed figure comes from src/data/fictionalFinance.ts (sample data) or verifiedClaims.ts (the one benchmark).
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import timings from '../../SCENE_TIMINGS.json';
import { DataConnections, type Link, type Pt } from '../components/DataConnections';
import { KineticTitle } from '../components/KineticTitle';
import { NumberCounter } from '../components/NumberCounter';
import { ProvenanceLabel } from '../components/ProvenanceLabel';
import { SourceAttribution } from '../components/SourceAttribution';
import { AGENT_BG, BAR } from '../data/agentWorkflowData';
import { AR_LINES, CHART, CO, DOC_TEXT, FIG, FINDING, FORMULA, FY, QF, QTRS, SHEET, SRC, V, WALL_DOCS } from '../data/fictionalFinance';
import { CLAIMS, LABELS, N } from '../data/verifiedClaims';
import { clamp, easeInCubic, easeInOutCubic, easeInOutSine, easeOutCubic, invLerp, keys, lerp, reveal } from '../lib/anim';
import { useLayout, type Layout } from '../lib/layout';
import { hash } from '../lib/rng';
import { C, WORLD } from '../styles/theme';
import { F } from '../styles/typography';
import type { SceneProps, Variant } from './types';

const FIN = WORLD.fin;
const INK2 = '#2A3550';
const SLATE = '#8E9AB2';
const RULE2 = '#E3E8F0';
const AMBER_T = 'rgba(255,181,71,0.30)';
const DESK_Z = 430;
/** header strips narrower than this show only the company and the FICTIONAL SAMPLE tag */
const STRIP_KIND_MIN_W = 421;

// ------------------------------------------------------------------ helpers
type Rect = { x: number; y: number; w: number; h: number };
const mid = (r: Rect): Pt => [r.x + r.w / 2, r.y + r.h / 2];
const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => {
  const A = hexRgb(a), B = hexRgb(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(t)))).join(',')})`;
};
const rgba = (h: string, a: number) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; };
/** JetBrains Mono advances 0.6 em per glyph, so mono text widths are exact */
const monoW = (s: string, px: number) => s.length * 0.6 * px;
const decimals = (x: number) => (String(x).split('.')[1] ?? '').length;

let measureCtx: CanvasRenderingContext2D | null | undefined;
/** proportional text width (canvas measure once the font is loaded, an estimate before) */
function textW(s: string, px: number, weight = 600, family: string = F.text, em = 0.53) {
  if (typeof document !== 'undefined') {
    try {
      const font = `${weight} ${px}px ${family}`;
      if (measureCtx === undefined) measureCtx = document.createElement('canvas').getContext('2d');
      if (measureCtx && document.fonts.check(font)) { measureCtx.font = font; return measureCtx.measureText(s).width; }
    } catch { /* estimate */ }
  }
  return s.length * px * em;
}

// ------------------------------------------------------------------ narration cues (word timings in SCENE_TIMINGS.json)
interface TWord { w: string; t0: number }
interface TVariant { scenes: { id: string; start: number; end: number; durationInFrames: number }[]; captions: { words: TWord[] }[] }
const TV = (timings as unknown as { variants: Record<string, TVariant> }).variants;

/** local frame at which the nth word matching `re` is spoken inside `scene`, or `fallback` */
export function wordCue(variant: Variant, scene: string, re: RegExp, fallback: number, nth = 0, fps = 30) {
  const tv = TV[variant];
  const sc = tv?.scenes.find((s) => s.id === scene);
  if (!sc) return fallback;
  const hits: number[] = [];
  for (const c of tv.captions) for (const w of c.words) if (w.t0 >= sc.start - 0.05 && w.t0 < sc.end && re.test(w.w)) hits.push(w.t0);
  hits.sort((a, b) => a - b);
  return hits[nth] === undefined ? fallback : Math.round((hits[nth] - sc.start) * fps);
}
export const sceneFrames = (variant: Variant, scene: string) => TV[variant]?.scenes.find((s) => s.id === scene)?.durationInFrames ?? 0;

// ------------------------------------------------------------------ timeline (authored in frames of the current cut, scaled by dur)
interface TL {
  morph: [number, number]; paper: [number, number]; heroText: [number, number]; lineOut: [number, number];
  pull: [number, number]; title: [number, number];
  sep: number; sepDur: number; sepGap: number; sheetIn: number; chartIn: number; findIn: number; qIn: number;
  map0: number; mapGapA: number; mapQ0: number; mapGapQ: number; mapG: number; flyDur: number;
  sum0: number; check0: number; growth0: number; gm0: number; om0: number; model0: number; cmp0: number; chart0: number;
  chip1: [number, number]; chip2: [number, number]; ev: [number, number]; num: number;
  find0: number; camA: [number, number]; camB: [number, number]; camC: [number, number];
  orbit: [number, number][]; tilt: [number, number][]; exit0: number;
}

function timeline(variant: Variant, dur: number): TL {
  const base = variant === 'master' ? 414 : 252;
  const k = dur / base;
  const a = (x: number) => x * k;
  const cue = (re: RegExp, fb: number) => wordCue(variant, 'finance', re, a(fb));
  const exit0 = dur - 15;
  if (variant === 'master') {
    const ev0 = cue(/^OfficeQA/i, 209), num = cue(/^64\.4/, 272), find0 = cue(/^summary/i, 340) - a(22);
    return {
      morph: [a(2), a(18)], paper: [a(4), a(20)], heroText: [a(12), a(26)], lineOut: [a(17), a(22)],
      pull: [a(22), a(74)], title: [a(44), a(100)],
      sep: a(64), sepDur: a(30), sepGap: a(6), sheetIn: a(86), chartIn: a(98), findIn: find0 - a(8), qIn: a(108),
      map0: a(104), mapGapA: a(4.2), mapQ0: a(129), mapGapQ: a(2.2), mapG: a(140), flyDur: a(20),
      sum0: a(166), check0: a(190), growth0: a(206), gm0: a(214), om0: a(222), model0: a(230), cmp0: a(246), chart0: a(258),
      chip1: [a(96), a(200)], chip2: [a(202), Math.min(a(306), find0 - a(10))], ev: [ev0, find0 - a(8)], num,
      find0, camA: [a(150), a(176)], camB: [a(192), a(218)], camC: [find0 - a(16), find0 + a(20)],
      orbit: [[a(22), 0], [a(110), -6], [a(300), 3], [exit0, 0]],
      tilt: [[a(22), 0], [a(90), 4], [a(300), 1.5], [exit0, 0]],
      exit0,
    };
  }
  const ev0 = cue(/^OfficeQA/i, 153), num = cue(/^64\.4/, 217);
  return {
    morph: [a(2), a(16)], paper: [a(3), a(17)], heroText: [a(10), a(22)], lineOut: [a(15), a(19)],
    pull: [a(18), a(52)], title: [a(30), a(76)],
    sep: a(48), sepDur: a(26), sepGap: a(6), sheetIn: a(62), chartIn: a(132), findIn: a(184), qIn: a(136),
    map0: a(76), mapGapA: a(4), mapQ0: a(94), mapGapQ: a(2.5), mapG: -1, flyDur: a(16),
    sum0: a(116), check0: a(126), growth0: a(136), gm0: a(144), om0: -1, model0: -1, cmp0: -1, chart0: a(152),
    chip1: [a(70), a(130)], chip2: [a(132), ev0 - a(2)], ev: [ev0, exit0], num,
    find0: a(192), camA: [a(128), a(156)], camB: [a(196), a(226)], camC: [-1, -1],
    orbit: [[a(18), 0], [a(70), -5], [a(200), 2.5], [exit0, 0]],
    tilt: [[a(18), 0], [a(60), 4], [a(200), 1], [exit0, 0]],
    exit0,
  };
}

// ------------------------------------------------------------------ geometry (desk coordinates; desk = screen at the overview camera)
interface DocSpec {
  key: 'ar' | 'qf' | 'an'; rect: Rect; u: number; font: number;
  stripH: number; titleY: number; sectionY: number; noteY: number; headY: number; rowsY: number; rowH: number; labelX: number;
  cols: { label: string; right: number }[];
  rows: { label: string; vals: string[]; hi: boolean[] }[];
  wall: { c: number; r: number };
}
interface SheetG { rect: Rect; titleH: number; fxH: number; headH: number; rowH: number; pad: number; gutter: number; colW: number[]; font: number; nRows: number }
interface ChartG { rect: Rect; plot: Rect; titleF: number; font: number; barW: number; pairGap: number }
interface Geo {
  P: number; hero: Rect; heroScreenY: number; s0: number;
  wall: { cols: number; rows: number; pw: number; ph: number; gap: number; cx: number; cy: number };
  docs: DocSpec[]; sheet: SheetG; chart: ChartG; finding: Rect; findF: number;
  evidence: Rect; chipX: number; chipY: number; chipSize: number; chipAlign: 'left' | 'right';
  camAt: { A: [number, number, number]; B: [number, number, number]; C: [number, number, number] };
}

function geometry(L: Layout): Geo {
  const { w: W, h: H } = L;
  if (!L.tall) {
    const ar: DocSpec = {
      key: 'ar', rect: { x: 80, y: 200, w: 480, h: 296 }, u: 1, font: 15, stripH: 26, titleY: 38, sectionY: 66, noteY: 87, headY: 108,
      rowsY: 128, rowH: 30, labelX: 18, cols: [{ label: FY.cur, right: 372 }, { label: FY.prev, right: 462 }],
      rows: AR_LINES.map((l) => ({ label: l.label, vals: [l.cur, l.prev], hi: [l.hi, l.hi] })), wall: { c: 1, r: 1 },
    };
    const qf: DocSpec = {
      key: 'qf', rect: { x: 80, y: 512, w: 480, h: 186 }, u: 1, font: 15, stripH: 26, titleY: 38, sectionY: 64, noteY: -1, headY: 88,
      rowsY: 108, rowH: 32, labelX: 18, cols: QTRS.map((q, i) => ({ label: q, right: 176 + i * 94 })),
      rows: [{ label: FY.prev, vals: [...V.q.FY24], hi: [true, true, true, true] }, { label: FY.cur, vals: [...V.q.FY25], hi: [true, true, true, true] }],
      wall: { c: 5, r: 1 },
    };
    const an: DocSpec = {
      key: 'an', rect: { x: 80, y: 714, w: 480, h: 166 }, u: 1, font: 15, stripH: 26, titleY: 38, sectionY: 64, noteY: 142, headY: 90,
      rowsY: 114, rowH: 24, labelX: 18, cols: [], rows: [], wall: { c: 1, r: 2 },
    };
    return {
      P: 2400, hero: { x: 640, y: 340, w: 640, h: 360 }, heroScreenY: H / 2, s0: W / 640,
      wall: { cols: 7, rows: 4, pw: 236, ph: 316, gap: 34, cx: W / 2, cy: H / 2 },
      docs: [ar, qf, an],
      sheet: { rect: { x: 590, y: 200, w: 800, h: 450 }, titleH: 34, fxH: 40, headH: 24, rowH: 30, pad: 10, gutter: 34,
        colW: [226, 104, 104, 104, 104, 104], font: 15, nRows: 11 },
      chart: { rect: { x: 1420, y: 200, w: 420, h: 450 }, plot: { x: 58, y: 104, w: 336, h: 270 }, titleF: 16, font: 12, barW: 30, pairGap: 4 },
      finding: { x: 590, y: 670, w: 1250, h: 210 }, findF: 46,
      evidence: { x: 590, y: 790, w: 1080, h: 100 }, chipX: W - L.safe.side, chipY: L.safe.top + 4, chipSize: 38, chipAlign: 'right',
      camAt: { A: [1150, 452, 1.22], B: [W / 2, H / 2, 1], C: [W / 2, H / 2, 0.955] },
    };
  }
  const ar: DocSpec = {
    key: 'ar', rect: { x: 64, y: 500, w: 560, h: 330 }, u: 1.3, font: 19, stripH: 32, titleY: 48, sectionY: 84, noteY: 290, headY: 118,
    rowsY: 144, rowH: 44, labelX: 22, cols: [{ label: FY.cur, right: 420 }, { label: FY.prev, right: 536 }],
    rows: AR_LINES.slice(0, 3).map((l) => ({ label: l.label, vals: [l.cur, l.prev], hi: [l.hi, l.hi] })), wall: { c: 0, r: 1 },
  };
  const qf: DocSpec = {
    key: 'qf', rect: { x: 644, y: 500, w: 372, h: 330 }, u: 1.3, font: 19, stripH: 32, titleY: 48, sectionY: 84, noteY: -1, headY: 118,
    rowsY: 144, rowH: 42, labelX: 22, cols: [{ label: FY.prev, right: 232 }, { label: FY.cur, right: 350 }],
    rows: QTRS.map((q, i) => ({ label: q, vals: [V.q.FY24[i], V.q.FY25[i]], hi: [false, true] })), wall: { c: 3, r: 4 },
  };
  return {
    P: 2600, hero: { x: 220, y: 800, w: 640, h: 360 }, heroScreenY: 1000, s0: W / 640,
    wall: { cols: 4, rows: 6, pw: 236, ph: 316, gap: 30, cx: W / 2, cy: H / 2 },
    docs: [ar, qf],
    sheet: { rect: { x: 64, y: 860, w: 952, h: 400 }, titleH: 40, fxH: 46, headH: 28, rowH: 44, pad: 14, gutter: 40,
      colW: [274, 122, 122, 122, 122, 122], font: 21, nRows: 6 },
    chart: { rect: { x: 64, y: 1290, w: 952, h: 262 }, plot: { x: 76, y: 86, w: 840, h: 128 }, titleF: 22, font: 17, barW: 60, pairGap: 6 },
    finding: { x: 64, y: 1566, w: 952, h: 128 }, findF: 34,
    evidence: { x: 64, y: 374, w: 952, h: 128 }, chipX: L.safe.side, chipY: 388, chipSize: 34, chipAlign: 'left',
    camAt: { A: [W / 2, 1300, 1], B: [W / 2, 1132, 0.712], C: [W / 2, 1132, 0.712] },
  };
}

// sheet addressing (col 0 = A, rows from 1)
const colX = (S: SheetG, c: number) => S.rect.x + S.pad + S.gutter + S.colW.slice(0, c).reduce((s, x) => s + x, 0);
const rowY = (S: SheetG, r: number) => S.rect.y + S.titleH + S.fxH + S.headH + (r - 1) * S.rowH;
const cellR = (S: SheetG, c: number, r: number): Rect => ({ x: colX(S, c), y: rowY(S, r), w: S.colW[c], h: S.rowH });
const ref = (c: number, r: number) => `${'ABCDEF'[c]}${r}`;
const CELL_PAD = 10;
/** rect of right-aligned text in a cell */
const cellText = (S: SheetG, c: number, r: number, s: string): Rect => {
  const k = cellR(S, c, r), w = monoW(s, S.font);
  return { x: k.x + k.w - CELL_PAD - w, y: k.y + (k.h - S.font * 1.2) / 2, w, h: S.font * 1.2 };
};
/** rect of a highlighted value in a document panel (desk coords) */
const docVal = (D: DocSpec, row: number, col: number): Rect => {
  const s = D.rows[row].vals[col], w = monoW(s, D.font);
  return { x: D.rect.x + D.cols[col].right - w, y: D.rect.y + D.rowsY + row * D.rowH + (D.rowH - D.font * 1.2) / 2, w, h: D.font * 1.2 };
};
const anToken = (D: DocSpec): Rect => ({ x: D.rect.x + D.labelX, y: D.rect.y + D.rowsY, w: monoW(V.growth, D.font), h: D.font * 1.2 });

// chart bars
const barRect = (G: ChartG, q: number, year: 0 | 1, v: number): Rect => {
  const gw = G.plot.w / 4, cx = G.rect.x + G.plot.x + gw * (q + 0.5);
  const x = year === 0 ? cx - G.pairGap / 2 - G.barW : cx + G.pairGap / 2;
  const h = (v / CHART.max) * G.plot.h, base = G.rect.y + G.plot.y + G.plot.h;
  return { x, y: base - h, w: G.barW, h };
};

// ------------------------------------------------------------------ the choreography plan (all positions in desk coords)
interface Token { from: Rect; to: Rect; at: number; dur: number; text: string; fromPx: number; toPx: number; key: string }
interface CellSpec { c: number; r: number; text: string; kind: 'head' | 'colhead' | 'label' | 'src' | 'calc' | 'check'; at: number; ok?: number; chip?: string; tint?: 0 | 1 }
interface Act { at: number; c: number; r: number; text: string }
interface Range { r: Rect; at: number; out: number; color: string }
interface Plan { tokens: Token[]; cells: CellSpec[]; acts: Act[]; flow: Link[]; ranges: Range[]; data: Link[]; bars: { q: number; y: 0 | 1; v: number; at: number }[]; trails: Link[]; cites: Rect[]; findValue: Rect; findX: number }

function plan(variant: Variant, T: TL, G: Geo): Plan {
  const S = G.sheet, master = variant === 'master';
  const [AR, QD, AN] = [G.docs[0], G.docs[1], G.docs[2]];
  const tokens: Token[] = [];
  const tok = (from: Rect, c: number, r: number, at: number, text: string, key: string, fromPx: number) =>
    tokens.push({ from, to: cellText(S, c, r, text), at, dur: T.flyDur, text, fromPx, toPx: S.font, key });
  const land = (key: string) => { const t = tokens.find((x) => x.key === key); return t ? t.at + t.dur : 0; };
  // ---- cell mapping
  const A = (i: number) => T.map0 + i * T.mapGapA;
  tok(docVal(AR, 0, 0), 2, 2, A(0), V.revFY25, 'ar-0-0', AR.font);
  tok(docVal(AR, 0, 1), 1, 2, A(1), V.revFY24, 'ar-0-1', AR.font);
  tok(docVal(AR, 2, 0), 2, 3, A(2), V.gpFY25, 'ar-2-0', AR.font);
  tok(docVal(AR, 2, 1), 1, 3, A(3), V.gpFY24, 'ar-2-1', AR.font);
  if (master) {
    tok(docVal(AR, 4, 0), 2, 5, A(4), V.oiFY25, 'ar-4-0', AR.font);
    tok(docVal(AR, 4, 1), 1, 5, A(5), V.oiFY24, 'ar-4-1', AR.font);
    QTRS.forEach((_, j) => tok(docVal(QD, 0, j), 1 + j, 9, T.mapQ0 + j * T.mapGapQ, V.q.FY24[j], `qf-0-${j}`, QD.font));
    QTRS.forEach((_, j) => tok(docVal(QD, 1, j), 1 + j, 10, T.mapQ0 + (4 + j) * T.mapGapQ, V.q.FY25[j], `qf-1-${j}`, QD.font));
    tok(anToken(AN), 2, 7, T.mapG, V.growth, 'an', AN.font);
  } else {
    QTRS.forEach((_, j) => tok(docVal(QD, j, 1), 1 + j, 6, T.mapQ0 + j * T.mapGapQ, V.q.FY25[j], `qf-${j}-1`, QD.font));
  }

  const cells: CellSpec[] = [];
  const acts: Act[] = [];
  const flow: Link[] = [];
  const ranges: Range[] = [];
  const hd = T.sheetIn + 8;
  const blue = FIN.accent, ok = FIN.ok;
  const np = (c: number, r: number, s: string): Pt => mid(cellText(S, c, r, s));
  const link = (from: Pt, to: Pt, at: number, o: Partial<Link> = {}): Link =>
    ({ from, to, at, dur: 12, color: blue, width: 1.7, bend: -0.3, dots: 2, speed: 7, out: at + 34, outDur: 14, rest: 0, ...o });
  const srcChip = `${SRC.ar.cite} ${SRC.ar.page}`;
  const actFor = (key: string, c: number, r: number, text: string, src: string) => acts.push({ at: land(key) - 1, c, r, text: `${text}    ← ${src}` });

  // headers & labels
  cells.push({ c: 0, r: 1, text: SHEET.headIS, kind: 'head', at: hd }, { c: 1, r: 1, text: FY.prev, kind: 'colhead', at: hd, tint: 0 },
    { c: 2, r: 1, text: FY.cur, kind: 'colhead', at: hd, tint: 1 }, { c: 3, r: 1, text: SHEET.yoy, kind: 'colhead', at: hd });
  const R = SHEET.rows;
  const rev = 2, gp = 3, gm = 4;
  cells.push({ c: 0, r: rev, text: R.rev, kind: 'label', at: hd + 2 }, { c: 0, r: gp, text: R.gp, kind: 'label', at: hd + 3 },
    { c: 0, r: gm, text: R.gm, kind: 'label', at: hd + 4 });
  // revenue / gross profit inputs
  cells.push({ c: 1, r: rev, text: V.revFY24, kind: 'src', at: land('ar-0-1') }, { c: 2, r: rev, text: V.revFY25, kind: 'src', at: land('ar-0-0'), chip: undefined },
    { c: 1, r: gp, text: V.gpFY24, kind: 'src', at: land('ar-2-1') }, { c: 2, r: gp, text: V.gpFY25, kind: 'src', at: land('ar-2-0') });
  cells.push({ c: 5, r: rev, text: srcChip, kind: 'label', at: land('ar-0-0'), chip: srcChip }, { c: 5, r: gp, text: srcChip, kind: 'label', at: land('ar-2-0'), chip: srcChip });
  actFor('ar-0-0', 2, rev, V.revFY25, `${SRC.ar.cite} ${SRC.ar.doc} · ${SRC.ar.page}`);
  actFor('ar-2-0', 2, gp, V.gpFY25, `${SRC.ar.cite} ${SRC.ar.doc} · ${SRC.ar.page}`);

  // quarterly block
  const qh = master ? 8 : 5, q24 = 9, q25 = master ? 10 : 6;
  cells.push({ c: 0, r: qh, text: master ? SHEET.headQ : `${SHEET.headQ.split(' · ')[0]} · ${FY.cur}`, kind: 'head', at: hd + 6 },
    ...QTRS.map((q, j) => ({ c: 1 + j, r: qh, text: q, kind: 'colhead' as const, at: hd + 6 })),
    { c: 5, r: qh, text: SHEET.sigma, kind: 'colhead', at: hd + 6 });
  if (master) {
    cells.push({ c: 0, r: q24, text: R.qPrev, kind: 'label', at: hd + 7, chip: SRC.qf.cite, tint: 0 });
    QTRS.forEach((_, j) => cells.push({ c: 1 + j, r: q24, text: V.q.FY24[j], kind: 'src', at: land(`qf-0-${j}`), tint: 0 }));
  }
  cells.push({ c: 0, r: q25, text: R.qCur, kind: 'label', at: hd + 8, chip: SRC.qf.cite, tint: 1 });
  QTRS.forEach((_, j) => cells.push({ c: 1 + j, r: q25, text: V.q.FY25[j], kind: 'src', at: land(master ? `qf-1-${j}` : `qf-${j}-1`), tint: 1 }));
  actFor(master ? 'qf-1-3' : 'qf-3-1', 4, q25, V.q.FY25[3], `${SRC.qf.cite} ${SRC.qf.doc} · ${SRC.qf.page}`);

  // Σ quarters and the cross-document check (filing [2] vs annual report [1])
  const rangeR = (r: number): Rect => { const a = cellR(S, 1, r), b = cellR(S, 4, r); return { x: a.x + 3, y: a.y + 3, w: b.x + b.w - a.x - 6, h: a.h - 6 }; };
  const sumRows = master ? [q25, q24] : [q25];
  sumRows.forEach((r, i) => {
    const t0 = T.sum0 + i * 8, rr = rangeR(r), val = r === q25 ? V.qSum.FY25 : V.qSum.FY24;
    ranges.push({ r: rr, at: t0, out: T.check0 + 30, color: blue });
    flow.push(link([rr.x + rr.w, rr.y + rr.h / 2], np(5, r, val), t0 + 6, { bend: -0.6, dur: 10, dots: 3, out: T.check0 + 26 }));
    cells.push({ c: 5, r, text: val, kind: 'check', at: t0 + 16, ok: T.check0 + 18 + i * 6, tint: r === q25 ? 1 : 0 });
    acts.push({ at: t0, c: 5, r, text: FORMULA.sum(ref(1, r), ref(4, r)) });
  });
  flow.push(link(np(5, q25, V.qSum.FY25), np(2, rev, V.revFY25), T.check0, { color: ok, width: 2.2, bend: master ? 0.28 : 0.32, dur: 16, dots: 3, speed: 8, out: T.check0 + 40 }));
  acts.push({ at: T.check0, c: 5, r: q25, text: `${FORMULA.check(ref(5, q25), ref(2, rev))}    ✓ ${SRC.qf.cite} = ${SRC.ar.cite}` });

  // modelling: growth, margins, the model line
  cells.push({ c: 3, r: rev, text: V.revGrowth, kind: 'calc', at: T.growth0 + 13 }, { c: 3, r: gp, text: V.gpGrowth, kind: 'calc', at: T.growth0 + 19 });
  flow.push(link(np(1, rev, V.revFY24), np(3, rev, V.revGrowth), T.growth0, { bend: -0.17 }), link(np(2, rev, V.revFY25), np(3, rev, V.revGrowth), T.growth0 + 2, { bend: -0.3 }));
  acts.push({ at: T.growth0, c: 3, r: rev, text: FORMULA.growth(ref(2, rev), ref(1, rev)) });
  cells.push({ c: 1, r: gm, text: V.gmFY24, kind: 'calc', at: T.gm0 + 10 }, { c: 2, r: gm, text: V.gmFY25, kind: 'calc', at: T.gm0 + 13 },
    { c: 3, r: gm, text: V.gmDelta, kind: 'calc', at: T.gm0 + 17 });
  flow.push(link(np(2, gp, V.gpFY25), np(2, gm, V.gmFY25), T.gm0, { bend: -0.55 }), link(np(2, rev, V.revFY25), np(2, gm, V.gmFY25), T.gm0 + 2, { bend: -0.42 }));
  acts.push({ at: T.gm0, c: 2, r: gm, text: FORMULA.ratio(ref(2, gp), ref(2, rev)) });
  if (master) {
    const oi = 5, om = 6, md = 7;
    cells.push({ c: 0, r: oi, text: R.oi, kind: 'label', at: hd + 5 }, { c: 0, r: om, text: R.om, kind: 'label', at: hd + 5 },
      { c: 0, r: md, text: R.model, kind: 'label', at: hd + 6 },
      { c: 1, r: oi, text: V.oiFY24, kind: 'src', at: land('ar-4-1') }, { c: 2, r: oi, text: V.oiFY25, kind: 'src', at: land('ar-4-0') },
      { c: 5, r: oi, text: srcChip, kind: 'label', at: land('ar-4-0'), chip: srcChip },
      { c: 2, r: md, text: V.growth, kind: 'src', at: land('an') }, { c: 5, r: md, text: `${SRC.an.cite} ${SRC.an.page}`, kind: 'label', at: land('an'), chip: `${SRC.an.cite} ${SRC.an.page}` },
      { c: 3, r: oi, text: V.oiGrowth, kind: 'calc', at: T.growth0 + 24 },
      { c: 1, r: om, text: V.omFY24, kind: 'calc', at: T.om0 + 10 }, { c: 2, r: om, text: V.omFY25, kind: 'calc', at: T.om0 + 13 },
      { c: 3, r: om, text: V.omDelta, kind: 'calc', at: T.om0 + 17 },
      { c: 3, r: md, text: V.fy26e, kind: 'calc', at: T.model0 + 13 });
    actFor('an', 2, md, V.growth, `${SRC.an.cite} ${SRC.an.doc} · ${SRC.an.page}`);
    flow.push(link(np(2, oi, V.oiFY25), np(2, om, V.omFY25), T.om0, { bend: -0.55 }), link(np(2, rev, V.revFY25), np(2, om, V.omFY25), T.om0 + 2, { bend: -0.28 }));
    acts.push({ at: T.om0, c: 2, r: om, text: FORMULA.ratio(ref(2, oi), ref(2, rev)) });
    flow.push(link(np(2, rev, V.revFY25), np(3, md, V.fy26e), T.model0, { bend: 0.22 }), link(np(2, md, V.growth), np(3, md, V.fy26e), T.model0 + 2, { bend: -0.5 }));
    acts.push({ at: T.model0, c: 3, r: md, text: FORMULA.model(ref(2, rev), ref(2, md)) });
    // period comparison: quarter-by-quarter YoY
    const yy = 11;
    cells.push({ c: 0, r: yy, text: R.qYoY, kind: 'label', at: T.cmp0 - 4 });
    V.qYoY.forEach((s, j) => cells.push({ c: 1 + j, r: yy, text: s, kind: 'calc', at: T.cmp0 + j * 5 }));
    cells.push({ c: 5, r: yy, text: V.revGrowth, kind: 'calc', at: T.cmp0 + 22 });
    acts.push({ at: T.cmp0, c: 1, r: yy, text: FORMULA.growth(ref(1, q25), ref(1, q24)) });
    acts.push({ at: T.cmp0 + 22, c: 5, r: yy, text: FORMULA.growth(ref(5, q25), ref(5, q24)) });
  }
  acts.sort((a, b) => a.at - b.at);

  // data points travel from the quarter cells into the chart
  const data: Link[] = [];
  const bars: Plan['bars'] = [];
  QTRS.forEach((_, j) => {
    ([0, 1] as const).forEach((y) => {
      const v = (y === 0 ? QF.FY24 : QF.FY25)[j], s = (y === 0 ? V.q.FY24 : V.q.FY25)[j];
      const b = barRect(G.chart, j, y, v);
      const at = T.chart0 + (j * 2 + y) * 3;
      if (y === 0 && !master) { bars.push({ q: j, y, v, at: T.chart0 - 4 + j * 2 }); return; }
      const from = np(1 + j, y === 0 ? q24 : q25, s);
      data.push({ from, to: [b.x + b.w / 2, b.y], at, dur: 16, color: y === 0 ? SLATE : blue, width: 1.4, bend: master ? 0.3 : 0.2, dots: 1, dotR: 5, speed: 18,
        out: at + 20, outDur: 10, rest: 0, arrow: false, opacity: 0.75 });
      bars.push({ q: j, y, v, at: at + 16 });
    });
  });

  // the finding: cite markers trace back to their source pages
  const FR = G.finding, fx = FR.x + (master ? 34 : 26), fy = FR.y + (master ? 52 : 40), fs = G.findF;
  const wPre = textW(FINDING.pre, fs), wVal = textW(FINDING.value, fs), wAll = textW(FINDING.pre + FINDING.value + FINDING.post, fs);
  const cw = master ? fs * 1.06 : fs * 1.3, ch = master ? fs * 0.62 : fs * 0.78;
  const cites: Rect[] = FINDING.cites.map((_, i) => ({ x: fx + wAll + 16 + i * (cw + fs * 0.14), y: fy - fs * 0.12, w: cw, h: ch }));
  const findValue: Rect = { x: fx + wPre - 4, y: fy + fs * 0.08, w: wVal + 8, h: fs * 0.98 };
  const tgt1 = docVal(AR, 0, 0);
  const tgt2 = master ? docVal(QD, 1, 3) : docVal(QD, 3, 1);
  const amber = C.amber;
  // trails run through the gutters between panels, never across the workbook
  const trail = (from: Pt, to: Pt, via: Pt[], at: number): Link => ({ from, to, via, at, dur: master ? 24 : 20,
    color: amber, width: 2, dash: [7, 6], march: 0.5, dots: 2, dotR: 3.6, speed: 6, reverse: true, glow: true, pulse: true });
  const top = (r: Rect): Pt => [r.x + r.w / 2, r.y - 3], bottom = (r: Rect): Pt => [r.x + r.w / 2, r.y + r.h + 3];
  const c0 = top(cites[0]), c1 = top(cites[1]);
  const S2 = G.sheet.rect, gapY = (S2.y + S2.h + G.finding.y) / 2, gutX = (AR.rect.x + AR.rect.w + S2.x) / 2;
  const trails = master ? [
    trail(c0, top(tgt1), [[c0[0] - 8, gapY - 3], [S2.x + 40, gapY - 3], [gutX + 1, gapY - 30], [gutX + 1, tgt1.y + 40], [gutX - 8, tgt1.y - 14], [tgt1.x + tgt1.w + 10, tgt1.y - 12]], T.find0 + 28),
    trail(c1, [tgt2.x + tgt2.w + 6, tgt2.y + tgt2.h / 2], [[c1[0] - 8, gapY + 4], [S2.x + 40, gapY + 4], [gutX + 6, gapY + 4]], T.find0 + 34),
  ] : (() => {
    const mx = G.sheet.rect.x + G.sheet.rect.w + 26, gy = (AR.rect.y + AR.rect.h + G.sheet.rect.y) / 2;
    return [
      trail(c0, bottom(tgt1), [[c0[0] + 30, c0[1] - 20], [mx - 4, G.finding.y - 30], [mx - 4, gy + 40], [mx - 30, gy - 2], [tgt1.x + tgt1.w + 30, gy - 2]], T.find0 + 16),
      trail(c1, bottom(tgt2), [[c1[0] + 30, c1[1] - 20], [mx + 6, G.finding.y - 40], [mx + 6, gy + 60], [tgt2.x + tgt2.w / 2 + 10, gy + 6]], T.find0 + 22),
    ];
  })();
  return { tokens, cells, acts, flow, ranges, data, bars, trails, cites, findValue, findX: fx };
}

// ------------------------------------------------------------------ camera
interface Cam { s: number; cx: number; cy: number; rx: number; ry: number }
function camera(f: number, T: TL, G: Geo, L: Layout, variant: Variant): Cam {
  const pull = easeInOutCubic(invLerp(T.pull[0], T.pull[1], f));
  const s0 = G.s0;
  const hx = G.hero.x + G.hero.w / 2, hy = G.hero.y + G.hero.h / 2 - (G.heroScreenY - L.h / 2) / s0;
  let s = Math.pow(s0, 1 - pull), cx = lerp(hx, L.w / 2, pull), cy = lerp(hy, L.h / 2, pull);
  const mv = (span: [number, number], from: [number, number, number], to: [number, number, number]) => {
    if (span[0] < 0) return;
    const u = easeInOutCubic(invLerp(span[0], span[1], f));
    if (u <= 0) return;
    s = lerp(from[2], to[2], u); cx = lerp(from[0], to[0], u); cy = lerp(from[1], to[1], u);
  };
  const O: [number, number, number] = [L.w / 2, L.h / 2, 1];
  if (variant === 'master') {
    mv(T.camA, O, G.camAt.A);
    if (f >= T.camB[0]) mv(T.camB, G.camAt.A, O);
    if (f >= T.camC[0]) mv(T.camC, O, G.camAt.C);
  } else {
    mv(T.camA, O, G.camAt.A);
    if (f >= T.camB[0]) mv(T.camB, G.camAt.A, G.camAt.B);
  }
  const ry = keys(f, T.orbit, easeInOutSine), rx = keys(f, T.tilt, easeInOutSine);
  return { s, cx, cy, rx, ry };
}
const camTransform = (c: Cam, L: Layout, P: number) => {
  const zc = c.s > 1 ? P * (1 - 1 / c.s) : 0, zoom = c.s > 1 ? 1 : c.s;
  return `translate3d(${L.w / 2}px, ${L.h / 2}px, ${zc.toFixed(2)}px) rotateX(${c.rx.toFixed(3)}deg) rotateY(${c.ry.toFixed(3)}deg) scale(${zoom.toFixed(5)}) translate3d(${(-c.cx).toFixed(2)}px, ${(-c.cy).toFixed(2)}px, 0px)`;
};

// ------------------------------------------------------------------ building blocks
const PAPER_BG = `linear-gradient(180deg, ${FIN.paper} 0%, #EDF1F7 100%)`;
const SHADOW = '0 40px 80px -34px rgba(0,0,0,0.8), 0 12px 26px rgba(0,0,0,0.30), inset 0 0 0 1px rgba(255,255,255,0.7)';

const Abs: React.FC<{ x: number; y: number; w?: number; h?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, style, children }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, ...style }}>{children}</div>
);
/** one line of text whose box starts at (x, y); align right puts its right edge at x */
const Txt: React.FC<{ x: number; y: number; px: number; font?: string; weight?: number; color?: string; align?: 'left' | 'right' | 'center'; ls?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ x, y, px, font = F.text, weight = 500, color = FIN.ink, align = 'left', ls = 0, style, children }) => {
  const box = 900;
  const left = align === 'right' ? x - box : align === 'center' ? x - box / 2 : x;
  return (
    <div style={{ position: 'absolute', left, top: y, width: box, textAlign: align, fontFamily: font, fontSize: px, fontWeight: weight, color, lineHeight: 1.2,
      letterSpacing: `${ls}em`, whiteSpace: 'pre', fontVariantNumeric: font === F.mono ? 'tabular-nums' : undefined, ...style }}>{children}</div>
  );
};

const FictionTag: React.FC<{ px: number }> = ({ px }) => (
  <span style={{ fontFamily: F.mono, fontSize: px, fontWeight: 700, letterSpacing: '0.12em', color: C.amber, border: `1px solid ${rgba(C.amber, 0.7)}`,
    borderRadius: px * 0.3, padding: `${px * 0.12}px ${px * 0.45}px`, lineHeight: 1, whiteSpace: 'nowrap' }}>{CO.tag}</span>
);

const Strip: React.FC<{ w: number; h: number; px: number; kind: string; long?: boolean }> = ({ w, h, px, kind, long }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, background: FIN.ink, display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', padding: `0 ${h * 0.5}px`, boxSizing: 'border-box' }}>
    <span style={{ fontFamily: F.mono, fontSize: px, letterSpacing: '0.14em', color: C.lunar, fontWeight: 600, whiteSpace: 'nowrap' }}>{long ? CO.caps : CO.short}{w >= STRIP_KIND_MIN_W ? <span style={{ color: C.steel }}>{`  ·  ${kind}`}</span> : null}</span>
    <FictionTag px={px * 0.86} />
  </div>
);

/** highlighter: an amber marker sweep behind a figure */
const Marker: React.FC<{ r: Rect; p: number; rest?: number; ox?: number; oy?: number }> = ({ r, p, rest = 1, ox = 0, oy = 0 }) =>
  p <= 0 ? null : (
    <div style={{ position: 'absolute', left: r.x - ox - 4, top: r.y - oy - 1, width: (r.w + 8) * p, height: r.h + 2, background: AMBER_T, opacity: rest,
      borderRadius: 3, transform: 'skewX(-8deg)' }} />
  );

// ------------------------------------------------------------------ document wall
interface WallItem { i: number; c: number; r: number; x: number; y: number; w: number; h: number; z: number; rot: number; d: number }
function wallItems(G: Geo): WallItem[] {
  const W = G.wall, out: WallItem[] = [];
  const tw = W.cols * W.pw + (W.cols - 1) * W.gap, th = W.rows * W.ph + (W.rows - 1) * W.gap;
  const x0 = W.cx - tw / 2, y0 = W.cy - th / 2;
  const src = G.docs.map((d) => `${d.wall.c},${d.wall.r}`);
  let i = 0;
  for (let r = 0; r < W.rows; r++) for (let c = 0; c < W.cols; c++) {
    const x = x0 + c * (W.pw + W.gap), y = y0 + r * (W.ph + W.gap);
    const isSrc = src.includes(`${c},${r}`);
    const d = Math.hypot((x + W.pw / 2 - W.cx) / tw, (y + W.ph / 2 - W.cy) / th) * 1.6;
    out.push({ i, c, r, x, y, w: W.pw, h: W.ph, z: isSrc ? -70 : -60 - 230 * hash(c, r, 5), rot: isSrc ? 0 : (hash(c, r, 9) - 0.5) * 2.4, d: clamp(d) });
    i++;
  }
  return out;
}

const WallPage: React.FC<{ it: WallItem }> = ({ it }) => {
  const h = (k: number) => hash(it.i, k, 31);
  const kind = WALL_DOCS[it.i % WALL_DOCS.length];
  const layout = Math.floor(h(1) * 3);
  const lines = (y0: number, n: number, seed: number) => Array.from({ length: n }, (_, k) => (
    <div key={`${seed}-${k}`} style={{ position: 'absolute', left: 16, top: y0 + k * 9, height: 3.4, borderRadius: 2, background: '#CBD3E0',
      width: (k === n - 1 ? 0.45 : 0.78 + 0.2 * hash(it.i, k, seed)) * (it.w - 32) }} />
  ));
  return (
    <div style={{ position: 'absolute', inset: 0, background: PAPER_BG }}>
      <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: 18, background: FIN.ink, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
        <span style={{ fontFamily: F.mono, fontSize: 5.6, letterSpacing: '0.12em', color: C.lunar, whiteSpace: 'nowrap' }}>{CO.short}</span>
        <span style={{ fontFamily: F.mono, fontSize: 5, letterSpacing: '0.1em', color: C.amber, whiteSpace: 'nowrap' }}>{CO.tag}</span>
      </div>
      <div style={{ position: 'absolute', left: 16, top: 28, fontFamily: F.mono, fontSize: 7, letterSpacing: '0.12em', color: FIN.mute, whiteSpace: 'nowrap' }}>{kind}</div>
      <div style={{ position: 'absolute', left: 16, top: 42, height: 8, width: (0.45 + 0.3 * h(2)) * (it.w - 32), background: INK2, borderRadius: 2 }} />
      {lines(62, 4 + Math.floor(h(3) * 3), 1)}
      {layout === 0 && Array.from({ length: 7 }, (_, k) => (
        <div key={k} style={{ position: 'absolute', left: 16, right: 16, top: 128 + k * 17, height: 17, borderBottom: `1px solid ${FIN.rule}` }}>
          <div style={{ position: 'absolute', left: 0, top: 6, height: 3.4, width: 50 + 40 * hash(it.i, k, 4), background: '#B8C2D2', borderRadius: 2 }} />
          <div style={{ position: 'absolute', right: 52, top: 6, height: 3.4, width: 28, background: '#9BA7BC', borderRadius: 2 }} />
          <div style={{ position: 'absolute', right: 0, top: 6, height: 3.4, width: 28, background: '#9BA7BC', borderRadius: 2 }} />
        </div>
      ))}
      {layout === 1 && (
        <div style={{ position: 'absolute', left: 16, right: 16, top: 128, height: 110, borderBottom: `1px solid ${FIN.rule}` }}>
          {Array.from({ length: 8 }, (_, k) => {
            const v = 0.35 + 0.6 * ((k + 1) / 8) * (0.8 + 0.4 * hash(it.i, k, 6));
            return <div key={k} style={{ position: 'absolute', bottom: 0, left: `${4 + k * 12}%`, width: '7%', height: `${clamp(v) * 100}%`, background: k > 3 ? FIN.accent : '#AFBACC', borderRadius: '2px 2px 0 0' }} />;
          })}
        </div>
      )}
      {layout === 2 && lines(128, 9, 7)}
      {lines(it.h - 64, 3, 8)}
    </div>
  );
};

// ------------------------------------------------------------------ the hero chart page (scene entry)
const FIG_PLOT = { x: 56, w: 556, y: 104, h: 200 };
const figPt = (i: number, R: Rect): Pt => {
  const { x: px, w: pw, y: py, h: ph } = FIG_PLOT;
  const v = FIG.series[i];
  return [R.x + px + (pw * (i + 0.5)) / FIG.series.length, R.y + py + ph - (v / FIG.max) * ph];
};

const HeroPage: React.FC<{ f: number; T: TL; R: Rect }> = ({ f, T, R }) => {
  const open = easeInOutCubic(invLerp(T.paper[0], T.paper[1], f));
  const txt = easeOutCubic(invLerp(T.heroText[0], T.heroText[1], f));
  const lineOn = invLerp(T.lineOut[0] - 2, T.lineOut[0] + 1, f);
  const pts = FIG.series.map((_, i) => figPt(i, { x: 0, y: 0, w: 0, h: 0 }));
  const avgY = pts.reduce((s, p) => s + p[1], 0) / pts.length / R.h;
  const top = avgY * (1 - open) * 100, bot = (1 - avgY) * (1 - open) * 100;
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return (
    <div style={{ position: 'absolute', inset: 0, clipPath: `inset(${top.toFixed(3)}% 0% ${bot.toFixed(3)}% 0%)`, background: PAPER_BG }}>
      <div style={{ opacity: txt }}>
        <Strip w={R.w} h={16} px={5.6} kind={SRC.fig.doc.toUpperCase()} long />
        <Txt x={26} y={50} px={14} weight={600}>{FIG.title}</Txt>
        <Txt x={26} y={70} px={8.2} font={F.mono} color={FIN.mute}>{`${SRC.fig.doc} · ${SRC.fig.page} · ${SRC.fig.section}`}</Txt>
      </div>
      <svg width={R.w} height={R.h} style={{ position: 'absolute', left: 0, top: 0 }}>
        {FIG.ticks.map((t) => {
          const y = FIG_PLOT.y + FIG_PLOT.h - (t / FIG.max) * FIG_PLOT.h;
          return (
            <g key={t} opacity={txt}>
              <line x1={56} x2={612} y1={y} y2={y} stroke={t === 0 ? '#BAC3D2' : RULE2} strokeWidth={0.8} />
              <text x={50} y={y + 2.6} fontFamily={F.mono} fontSize={7.4} fill={FIN.mute} textAnchor="end">{t}</text>
            </g>
          );
        })}
        <line x1={56 + 556 / 2} x2={56 + 556 / 2} y1={FIG_PLOT.y} y2={FIG_PLOT.y + FIG_PLOT.h} stroke={RULE2} strokeWidth={0.8} opacity={txt} />
        {FIG.labels.map((l, i) => (
          <text key={l} x={pts[i][0]} y={318} fontFamily={F.mono} fontSize={6.6} fill={FIN.mute} textAnchor="middle" opacity={txt}>{l}</text>
        ))}
        <path d={d} fill="none" stroke={FIN.accent} strokeWidth={1.5} strokeLinejoin="round" opacity={lineOn} />
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={2.6} fill={FIN.accent} stroke="#fff" strokeWidth={1} opacity={lineOn * txt} />)}
      </svg>
      <Txt x={26} y={336} px={6.8} font={F.mono} color={FIN.mute} style={{ opacity: txt }}>{`${CO.tag.toLowerCase()} · ${CO.name}`}</Txt>
    </div>
  );
};

/** knee-angle-like gait curve (0..1): loading-response bump and the big swing-phase peak */
const knee = (ph: number) => 0.32 * Math.exp(-(((ph - 0.13) / 0.07) ** 2)) + Math.exp(-(((ph - 0.72) / 0.11) ** 2));

const EntryLine: React.FC<{ f: number; T: TL; G: Geo; L: Layout }> = ({ f, T, G, L }) => {
  if (f > T.lineOut[1] + 1) return null;
  const m = easeInOutCubic(invLerp(T.morph[0], T.morph[1], f));
  const fade = 1 - invLerp(T.lineOut[0], T.lineOut[1], f);
  const s0 = G.s0, cx = G.hero.x + G.hero.w / 2, cy = G.hero.y + G.hero.h / 2;
  const toScreen = (p: Pt): Pt => [L.w / 2 + (p[0] - cx) * s0, G.heroScreenY + (p[1] - cy) * s0];
  const tgt = FIG.series.map((_, i) => toScreen(figPt(i, G.hero)));
  const yLine = 0.55 * L.h, A = 0.065 * L.h, cycles = L.tall ? 2 : 3;
  const n = 160;
  const yAt = (x: number) => {
    if (x <= tgt[0][0]) return tgt[0][1];
    for (let i = 0; i < tgt.length - 1; i++) if (x <= tgt[i + 1][0]) return lerp(tgt[i][1], tgt[i + 1][1], (x - tgt[i][0]) / (tgt[i + 1][0] - tgt[i][0]));
    return tgt[tgt.length - 1][1];
  };
  const pts: Pt[] = Array.from({ length: n }, (_, j) => {
    const u = j / (n - 1);
    const xs = u * L.w, ys = yLine - A * knee((u * cycles) % 1);
    const xt = lerp(tgt[0][0], tgt[tgt.length - 1][0], u), yt = yAt(xt);
    return [lerp(xs, xt, m), lerp(ys, yt, m)];
  });
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const col = mix(C.mint, FIN.accent, invLerp(0.35, 1, m));
  const sw = lerp(3, 1.5 * s0, m);
  return (
    <svg width={L.w} height={L.h} style={{ position: 'absolute', inset: 0, opacity: fade, zIndex: 5 }}>
      <path d={d} fill="none" stroke={col} strokeWidth={sw * 3.2} strokeLinecap="round" strokeLinejoin="round" opacity={0.16 * (1 - m)} />
      <path d={d} fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      {tgt.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={2.6 * s0 * reveal(f, T.morph[1] - 4 + i * 0.6, 5)} fill={FIN.accent} stroke="#fff" strokeWidth={s0} />)}
    </svg>
  );
};

// ------------------------------------------------------------------ document panels
const DocPanel: React.FC<{ D: DocSpec; f: number; P: Plan; dim: number }> = ({ D, f, P, dim }) => {
  const { w, h } = D.rect, u = D.u, px = D.font;
  const meta = D.key === 'ar' ? SRC.ar : D.key === 'qf' ? SRC.qf : SRC.an;
  const hiP = (row: number, col: number) => {
    const t = P.tokens.find((x) => x.key === `${D.key}-${row}-${col}` || (D.key === 'an' && x.key === 'an'));
    if (!t) return { p: 0, rest: 1 };
    return { p: easeOutCubic(invLerp(t.at - 10, t.at - 2, f)), rest: 1 };
  };
  // trail landing pulse on the cited figure
  const cited = (r: Rect) => {
    const tr = P.trails.find((t) => t.to[0] >= r.x - 12 && t.to[0] <= r.x + r.w + 12 && t.to[1] >= r.y - 8 && t.to[1] <= r.y + r.h + 8);
    return tr ? invLerp(tr.at + (tr.dur ?? 14) - 2, tr.at + (tr.dur ?? 14) + 6, f) : 0;
  };
  return (
    <>
      <Strip w={w} h={D.stripH} px={10.5 * u} kind={meta.kind} />
      <Txt x={D.labelX} y={D.titleY} px={16.5 * u} weight={650}>{meta.doc}</Txt>
      <Txt x={w - D.labelX} y={D.titleY + 2 * u} px={12.5 * u} font={F.mono} color={FIN.mute} align="right">{meta.page}</Txt>
      <Txt x={D.labelX} y={D.sectionY} px={13.5 * u} weight={600} color={INK2}>{meta.section}</Txt>
      {D.key === 'ar' && D.noteY > 0 && <Txt x={D.labelX} y={D.noteY} px={11 * u} font={F.mono} color={FIN.mute}>{DOC_TEXT.arNote}</Txt>}
      {D.key !== 'an' && (
        <>
          <Abs x={D.labelX} y={D.headY + 20 * u} w={w - 2 * D.labelX} h={1} style={{ background: FIN.rule }} />
          {D.cols.map((c) => <Txt key={c.label} x={c.right} y={D.headY} px={11.5 * u} font={F.mono} color={FIN.mute} align="right" weight={600}>{c.label}</Txt>)}
          {D.rows.map((row, i) => {
            const y = D.rowsY + i * D.rowH;
            return (
              <React.Fragment key={row.label}>
                <Abs x={D.labelX} y={y + D.rowH - 1} w={w - 2 * D.labelX} h={1} style={{ background: RULE2 }} />
                <Txt x={D.labelX} y={y + (D.rowH - px * 1.2) / 2} px={px} weight={row.hi.some(Boolean) && D.key === 'ar' ? 600 : 500} color={D.key === 'ar' && !row.hi[0] ? FIN.mute : FIN.ink}>{row.label}</Txt>
                {row.vals.map((v, j) => {
                  const r = docVal(D, i, j);
                  const { p } = row.hi[j] ? hiP(i, j) : { p: 0 };
                  const c = cited(r);
                  return (
                    <React.Fragment key={j}>
                      <Marker r={r} p={p} ox={D.rect.x} oy={D.rect.y} />
                      {c > 0 && c < 1 && <div style={{ position: 'absolute', left: r.x - D.rect.x - 8, top: r.y - D.rect.y - 5, width: r.w + 16, height: r.h + 10, borderRadius: 6,
                        border: `2px solid ${C.amber}`, opacity: 1 - c, transform: `scale(${1 + c * 0.25})` }} />}
                      <Txt x={D.cols[j].right} y={r.y - D.rect.y} px={px} font={F.mono} weight={row.hi[j] ? 600 : 500} align="right" color={row.hi[j] ? FIN.ink : FIN.mute}>{v}</Txt>
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
          {D.key === 'qf' && D.noteY > 0 && <Txt x={D.labelX} y={D.noteY} px={10.5 * u} font={F.mono} color={FIN.mute}>{DOC_TEXT.filingNote}</Txt>}
        </>
      )}
      {D.key === 'an' && (() => {
        const tr = anToken(D), p = hiP(0, 0).p, gw = monoW(V.growth, px);
        return (
          <>
            <Txt x={D.labelX} y={D.headY} px={px} weight={500} color={INK2}>{DOC_TEXT.analyst.lead}</Txt>
            <Marker r={tr} p={p} ox={D.rect.x} oy={D.rect.y} />
            <Txt x={D.labelX} y={D.rowsY} px={px} font={F.mono} weight={700}>{V.growth}</Txt>
            <Txt x={D.labelX + gw + 8} y={D.rowsY} px={px} weight={500} color={INK2}>{DOC_TEXT.analyst.tail}</Txt>
            <Txt x={D.labelX} y={D.noteY} px={10.5 * u} font={F.mono} color={FIN.mute}>{`${CO.analyst} · ${DOC_TEXT.analyst.note}`}</Txt>
          </>
        );
      })()}
      {dim > 0 && <div style={{ position: 'absolute', inset: 0, background: '#0A1024', opacity: dim }} />}
    </>
  );
};

// ------------------------------------------------------------------ the sample workbook
const SheetPanel: React.FC<{ S: SheetG; f: number; P: Plan; tall: boolean }> = ({ S, f, P, tall }) => {
  const { x: X, y: Y, w } = S.rect;
  const lx = (x: number) => x - X, ly = (y: number) => y - Y;
  const act = [...P.acts].reverse().find((a) => f >= a.at);
  const actP = act ? easeOutCubic(invLerp(act.at, act.at + 6, f)) : 0;
  const u = tall ? 1.35 : 1;
  const gridTop = S.titleH + S.fxH, rowsTop = gridTop + S.headH;
  const gridW = S.gutter + S.colW.reduce((s, x) => s + x, 0);
  const visibleRows = Array.from({ length: S.nRows }, (_, i) => i + 1);
  const headRows = P.cells.filter((c) => c.kind === 'head').map((c) => c.r);
  const flash = (at: number, d = 16) => (f >= at ? 1 - easeOutCubic(invLerp(at, at + d, f)) : 0);
  const fxText = act?.text ?? '';
  const refColors = [FIN.accent, C.violet, '#C47A12'];
  let refN = 0;
  const fxParts = fxText.split(/([A-F]\d+)/g).map((part, i) => /^[A-F]\d+$/.test(part)
    ? <span key={i} style={{ color: refColors[refN++ % 3], fontWeight: 700 }}>{part}</span>
    : <span key={i} style={{ color: part.includes('←') ? FIN.mute : FIN.ink }}>{part}</span>);
  return (
    <>
      {/* title bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: S.titleH, background: FIN.paper2, borderBottom: `1px solid ${FIN.rule}`,
        display: 'flex', alignItems: 'center', gap: 10 * u, padding: `0 ${14 * u}px`, boxSizing: 'border-box' }}>
        <svg width={14 * u} height={14 * u} viewBox="0 0 14 14">{[0, 1, 2].flatMap((i) => [0, 1, 2].map((j) => <rect key={`${i}${j}`} x={i * 5} y={j * 5} width={4} height={4} rx={0.8} fill={i === 0 || j === 0 ? FIN.accent : '#9DB6E3'} />))}</svg>
        <span style={{ fontFamily: F.mono, fontSize: 12.5 * u, color: FIN.ink, fontWeight: 600 }}>{CO.workbook}</span>
        <span style={{ fontFamily: F.mono, fontSize: 10 * u, color: '#B7791F', border: `1px solid ${rgba(C.amber, 0.8)}`, borderRadius: 4, padding: `${1 * u}px ${6 * u}px`, letterSpacing: '0.06em' }}>{CO.workbookNote}</span>
        <div style={{ flex: 1 }} />
        {SHEET.tabs.map((t, i) => (
          <span key={t} style={{ fontFamily: F.text, fontSize: 12.5 * u, fontWeight: 600, color: i === 0 ? FIN.ink : FIN.mute, padding: `${3 * u}px ${8 * u}px`,
            borderBottom: i === 0 ? `2px solid ${FIN.accent}` : '2px solid transparent' }}>{t}</span>
        ))}
      </div>
      {/* formula bar */}
      <div style={{ position: 'absolute', left: 0, top: S.titleH, width: w, height: S.fxH, borderBottom: `1px solid ${FIN.rule}`, display: 'flex', alignItems: 'center',
        gap: 12 * u, padding: `0 ${12 * u}px`, boxSizing: 'border-box', background: '#FBFCFE' }}>
        <div style={{ width: 56 * u, height: S.fxH - 14 * u, border: `1px solid ${FIN.rule}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: F.mono, fontSize: 13 * u, fontWeight: 700, color: FIN.ink, background: '#fff' }}>{act ? ref(act.c, act.r) : ''}</div>
        <span style={{ fontFamily: F.text, fontStyle: 'italic', fontSize: 14 * u, color: FIN.mute, fontWeight: 600 }}>fx</span>
        <div style={{ fontFamily: F.mono, fontSize: 14.5 * u, whiteSpace: 'pre', opacity: actP, transform: `translateY(${(1 - actP) * 4}px)` }}>{fxParts}</div>
      </div>
      {/* column header */}
      <div style={{ position: 'absolute', left: S.pad, top: gridTop, width: gridW, height: S.headH, background: FIN.paper2, borderBottom: `1px solid ${FIN.rule}` }} />
      {S.colW.map((cw, c) => (
        <Txt key={c} x={lx(colX(S, c)) + cw / 2} y={gridTop + (S.headH - 11 * u * 1.2) / 2} px={11 * u} font={F.mono} color={FIN.mute} align="center" weight={600}>{'ABCDEF'[c]}</Txt>
      ))}
      {/* grid */}
      {visibleRows.map((r) => {
        const y = rowsTop + (r - 1) * S.rowH;
        const isHead = headRows.includes(r);
        return (
          <React.Fragment key={r}>
            {isHead && <Abs x={S.pad + S.gutter} y={y} w={gridW - S.gutter} h={S.rowH} style={{ background: '#F1F4F9' }} />}
            <Abs x={S.pad} y={y + S.rowH - 1} w={gridW} h={1} style={{ background: RULE2 }} />
            <Txt x={S.pad + S.gutter / 2} y={y + (S.rowH - 11 * u * 1.2) / 2} px={11 * u} font={F.mono} color={'#9AA4B6'} align="center">{String(r)}</Txt>
          </React.Fragment>
        );
      })}
      {S.colW.map((_, c) => <Abs key={c} x={lx(colX(S, c))} y={gridTop} w={1} h={S.headH + S.nRows * S.rowH} style={{ background: RULE2 }} />)}
      <Abs x={S.pad + S.gutter} y={gridTop} w={1} h={S.headH + S.nRows * S.rowH} style={{ background: FIN.rule }} />
      {/* cells */}
      {P.cells.map((c, i) => {
        if (f < c.at) return null;
        const k = cellR(S, c.c, c.r);
        const app = easeOutCubic(invLerp(c.at, c.at + 6, f));
        const fl = flash(c.at);
        const kx = lx(k.x), ky = ly(k.y);
        const ty = ky + (S.rowH - S.font * 1.2) / 2;
        if (c.kind === 'head') return <Txt key={i} x={kx + CELL_PAD} y={ky + (S.rowH - 12.5 * u * 1.2) / 2} px={12.5 * u} weight={700} color={INK2} style={{ opacity: app }}>{c.text}</Txt>;
        if (c.kind === 'colhead') {
          const col = c.tint === 0 ? '#5E6B85' : c.tint === 1 ? FIN.accent : FIN.mute;
          return <Txt key={i} x={kx + k.w - CELL_PAD} y={ky + (S.rowH - 12 * u * 1.2) / 2} px={12 * u} font={F.mono} weight={700} color={col} align="right" style={{ opacity: app }}>{c.text}</Txt>;
        }
        if (c.kind === 'label') {
          if (c.chip && c.c === 5) {
            return (
              <div key={i} style={{ position: 'absolute', left: kx + 6, top: ky + 5 * u, height: S.rowH - 10 * u, display: 'flex', alignItems: 'center', gap: 4, opacity: app,
                fontFamily: F.mono, fontSize: 10.5 * u, fontWeight: 600, color: '#9A5B00', background: rgba(C.amber, 0.16 + 0.5 * fl), borderRadius: 4, padding: `0 ${6 * u}px`, whiteSpace: 'nowrap' }}>{c.chip}</div>
            );
          }
          return (
            <div key={i} style={{ position: 'absolute', left: kx + CELL_PAD, top: ty, display: 'flex', alignItems: 'center', gap: 8 * u, opacity: app, whiteSpace: 'nowrap' }}>
              <span style={{ fontFamily: F.text, fontSize: S.font, fontWeight: 600, color: FIN.ink, lineHeight: 1.2 }}>{c.text}</span>
              {c.chip && <span style={{ fontFamily: F.mono, fontSize: 10.5 * u, fontWeight: 600, color: '#9A5B00', background: rgba(C.amber, 0.16), borderRadius: 4, padding: `${1 * u}px ${5 * u}px` }}>{c.chip}</span>}
            </div>
          );
        }
        const bg = c.kind === 'src' ? rgba(C.amber, 0.13 + 0.55 * fl) : c.kind === 'check' ? rgba(FIN.ok, 0.1 + 0.4 * fl) : rgba(FIN.accent, 0.22 * fl);
        const okP = c.ok !== undefined ? easeOutCubic(invLerp(c.ok, c.ok + 8, f)) : 0;
        const tint = c.tint === 0 ? 'rgba(94,107,133,0.06)' : c.tint === 1 ? 'rgba(31,111,224,0.05)' : 'transparent';
        return (
          <React.Fragment key={i}>
            <Abs x={kx + 1} y={ky} w={k.w - 1} h={S.rowH - 1} style={{ background: tint }} />
            <Abs x={kx + 1} y={ky} w={k.w - 1} h={S.rowH - 1} style={{ background: okP > 0 ? rgba(FIN.ok, 0.12 + 0.3 * (1 - okP)) : bg }} />
            {okP > 0 && (
              <svg width={S.font} height={S.font} viewBox="0 0 16 16" style={{ position: 'absolute', left: kx + 7, top: ky + (S.rowH - S.font) / 2, transform: `scale(${0.6 + 0.4 * okP})` }}>
                <circle cx={8} cy={8} r={7.5} fill={FIN.ok} />
                <path d="M4.4 8.3 L7 10.8 L11.8 5.6" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={12} strokeDashoffset={12 * (1 - okP)} />
              </svg>
            )}
            <Txt x={kx + k.w - CELL_PAD} y={ty} px={S.font} font={F.mono} weight={c.kind === 'calc' ? 600 : 500} align="right"
              color={c.kind === 'check' && okP > 0 ? '#1E7A57' : FIN.ink} style={{ opacity: app }}>{c.text}</Txt>
          </React.Fragment>
        );
      })}
      {/* active cell */}
      {act && (() => {
        const k = cellR(S, act.c, act.r);
        return <Abs x={lx(k.x) - 1} y={ly(k.y) - 1} w={k.w + 1} h={S.rowH + 1} style={{ border: `2px solid ${FIN.accent}`, borderRadius: 2, boxSizing: 'border-box', opacity: actP,
          boxShadow: `0 0 0 ${4 * (1 - actP)}px ${rgba(FIN.accent, 0.25)}` }} />;
      })()}
    </>
  );
};

/** formula ranges (Excel-style precedent boxes), drawn on */
const RangeBoxes: React.FC<{ f: number; ranges: Range[] }> = ({ f, ranges }) => (
  <svg width={10} height={10} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
    {ranges.map((g, i) => {
      const p = easeInOutCubic(invLerp(g.at, g.at + 9, f));
      const o = 1 - easeInOutCubic(invLerp(g.out, g.out + 12, f));
      if (p <= 0 || o <= 0) return null;
      const per = 2 * (g.r.w + g.r.h);
      return <rect key={i} x={g.r.x} y={g.r.y} width={g.r.w} height={g.r.h} rx={3} fill={rgba(g.color, 0.06 * p)} stroke={g.color} strokeWidth={1.8}
        strokeDasharray={per} strokeDashoffset={per * (1 - p)} opacity={o} />;
    })}
  </svg>
);

// ------------------------------------------------------------------ chart
const ChartPanel: React.FC<{ G: ChartG; f: number; P: Plan; tall: boolean; at: number }> = ({ G, f, P, tall, at }) => {
  const { w } = G.rect, pl = G.plot;
  const base = pl.y + pl.h;
  const axisP = easeOutCubic(invLerp(at + 8, at + 24, f));
  const u = tall ? 1.4 : 1;
  const lastLand = Math.max(...P.bars.map((b) => b.at));
  const lab = easeOutCubic(invLerp(lastLand, lastLand + 10, f));
  return (
    <>
      <Txt x={tall ? 26 : 22} y={tall ? 18 : 18} px={G.titleF} weight={650}>{CHART.title}</Txt>
      <Txt x={tall ? 26 : 22} y={tall ? 46 : 42} px={G.font * 0.92} font={F.mono} color={FIN.mute}>{`${SRC.qf.cite} ${SRC.qf.doc} · ${CO.tag.toLowerCase()}`}</Txt>
      <div style={{ position: 'absolute', right: tall ? 26 : 22, top: tall ? 22 : 66, display: 'flex', gap: 14 * u, fontFamily: F.mono, fontSize: G.font, color: INK2, alignItems: 'center' }}>
        {[FY.prev, FY.cur].map((l, i) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 * u }}>
            <span style={{ width: 10 * u, height: 10 * u, borderRadius: 2, background: i ? FIN.accent : SLATE }} />{l}
          </span>
        ))}
      </div>
      <svg width={w} height={G.rect.h} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        {CHART.ticks.map((t) => {
          const y = base - (t / CHART.max) * pl.h;
          return (
            <g key={t} opacity={axisP}>
              <line x1={pl.x} x2={pl.x + pl.w} y1={y} y2={y} stroke={t === 0 ? '#AEB8C8' : RULE2} strokeWidth={t === 0 ? 1.4 : 1} />
              <text x={pl.x - 8} y={y + G.font * 0.36} fontFamily={F.mono} fontSize={G.font * 0.92} fill={FIN.mute} textAnchor="end">{t}</text>
            </g>
          );
        })}
        {QTRS.map((q, j) => (
          <text key={q} x={pl.x + (pl.w / 4) * (j + 0.5)} y={base + G.font * 1.5} fontFamily={F.mono} fontSize={G.font} fill={INK2} textAnchor="middle" opacity={axisP}>{q}</text>
        ))}
        {P.bars.map((b) => {
          const r = barRect(G, b.q, b.y, b.v);
          const g = easeOutCubic(invLerp(b.at - 1, b.at + 12, f));
          if (g <= 0) return null;
          const hh = r.h * g, x = r.x - G.rect.x, y = base - hh;
          const isQ4 = b.q === 3;
          return (
            <g key={`${b.q}-${b.y}`}>
              <path d={`M${x},${base} L${x},${y + 4} Q${x},${y} ${x + 4},${y} L${x + r.w - 4},${y} Q${x + r.w},${y} ${x + r.w},${y + 4} L${x + r.w},${base} Z`}
                fill={b.y ? FIN.accent : SLATE} />
              {isQ4 && <text x={x + r.w / 2} y={y - 7} fontFamily={F.mono} fontSize={G.font * 0.95} fill={FIN.ink} fontWeight={700} textAnchor="middle" opacity={lab}>{(b.y ? V.q.FY25 : V.q.FY24)[3]}</text>}
            </g>
          );
        })}
      </svg>
    </>
  );
};

// ------------------------------------------------------------------ finding
const FindingPanel: React.FC<{ R: Rect; f: number; T: TL; P: Plan; fs: number; tall: boolean }> = ({ R, f, T, P, fs, tall }) => {
  const u = tall ? 1.3 : 1;
  const lx = P.findX - R.x;
  const st = easeOutCubic(invLerp(T.find0 + 2, T.find0 + 16, f));
  const hv = easeOutCubic(invLerp(T.find0 + 16, T.find0 + 26, f));
  const chk = easeOutCubic(invLerp(T.find0 + (tall ? 22 : 40), T.find0 + (tall ? 32 : 50), f));
  const srcs = easeOutCubic(invLerp(T.find0 + 44, T.find0 + 56, f));
  const fy = P.cites[0].y + fs * 0.12 - R.y;
  return (
    <>
      <Abs x={0} y={0} w={5} h={R.h} style={{ background: C.amber }} />
      <Txt x={lx} y={tall ? 12 : 20} px={12 * u} font={F.mono} weight={700} color={FIN.mute} ls={0.16}>{FINDING.label}</Txt>
      <div style={{ position: 'absolute', left: lx, top: fy, overflow: 'hidden', height: fs * 1.3 }}>
        <div style={{ transform: `translateY(${(1 - st) * fs * 1.2}px)`, fontFamily: F.text, fontSize: fs, fontWeight: 600, color: FIN.ink, lineHeight: 1.2, whiteSpace: 'pre', letterSpacing: '-0.01em' }}>
          {FINDING.pre}<span style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: -4, right: -4, top: '8%', bottom: '4%', background: AMBER_T.replace('0.30', '0.55'), transformOrigin: 'left', transform: `scaleX(${hv}) skewX(-8deg)`, borderRadius: 4 }} />
            <span style={{ position: 'relative' }}>{FINDING.value}</span>
          </span>{FINDING.post}
        </div>
      </div>
      {P.cites.map((c, i) => {
        const a = T.find0 + (tall ? 12 : 22) + i * 5;
        const p = easeOutCubic(invLerp(a, a + 8, f));
        return (
          <div key={i} style={{ position: 'absolute', left: c.x - R.x, top: c.y - R.y, width: c.w, height: c.h, borderRadius: 6, background: '#E2EBFA', color: FIN.accent,
            fontFamily: F.mono, fontWeight: 700, fontSize: c.h * 0.66, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: p,
            transform: `translateY(${(1 - p) * 8}px) scale(${0.8 + 0.2 * p})`, boxShadow: `0 0 0 ${2 * p}px ${rgba(C.amber, 0.0 + 0.7 * invLerp(a + 8, a + 30, f) * (1 - invLerp(a + 30, a + 50, f)))}` }}>{FINDING.cites[i]}</div>
        );
      })}
      <div style={{ position: 'absolute', left: lx, top: fy + fs * 1.42, display: 'flex', alignItems: 'center', gap: 10 * u, opacity: chk, transform: `translateY(${(1 - chk) * 6}px)` }}>
        <svg width={16 * u} height={16 * u} viewBox="0 0 16 16"><circle cx={8} cy={8} r={7.5} fill={FIN.ok} /><path d="M4.4 8.3 L7 10.8 L11.8 5.6" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span style={{ fontFamily: F.mono, fontSize: 12.5 * u, fontWeight: 700, color: '#1E7A57', letterSpacing: '0.12em' }}>{FINDING.checkWord}</span>
        <span style={{ fontFamily: F.mono, fontSize: 13.5 * u, color: INK2 }}>{FINDING.check}</span>
      </div>
      {!tall && (
        <div style={{ position: 'absolute', right: 30, top: 26, width: 380, display: 'flex', flexDirection: 'column', gap: 10, opacity: srcs }}>
          <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: FIN.mute, letterSpacing: '0.16em' }}>SOURCES</span>
          {FINDING.sources.map((s) => (
            <div key={s} style={{ display: 'flex', gap: 10, alignItems: 'center', fontFamily: F.mono, fontSize: 14, color: FIN.ink }}>
              <svg width={14} height={17} viewBox="0 0 14 17"><path d="M1 1 H9 L13 5 V16 H1 Z" fill="#fff" stroke={FIN.mute} strokeWidth={1.2} /><path d="M9 1 V5 H13" fill="none" stroke={FIN.mute} strokeWidth={1.2} /></svg>
              {s}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

const QuestionCard: React.FC<{ f: number; T: TL; tall: boolean; o: number }> = ({ f, T, tall, o }) => {
  const u = tall ? 1.3 : 1;
  const p = easeOutCubic(invLerp(T.qIn + 6, T.qIn + 20, f));
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <Abs x={0} y={0} w={5} h={400} style={{ background: FIN.accent }} />
      <Txt x={tall ? 26 : 34} y={tall ? 18 : 18} px={12 * u} font={F.mono} weight={700} color={FIN.mute} ls={0.16}>{FINDING.questionLabel}</Txt>
      <div style={{ position: 'absolute', left: tall ? 26 : 34, top: tall ? 44 : 42, overflow: 'hidden', height: 34 * u }}>
        <div style={{ transform: `translateY(${(1 - p) * 36 * u}px)`, fontFamily: F.text, fontSize: 26 * u * (tall ? 0.86 : 1), fontWeight: 600, color: FIN.ink, whiteSpace: 'pre', letterSpacing: '-0.005em', lineHeight: 1.2 }}>{FINDING.question}</div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ flying figures (cell mapping)
const FlyingFigure: React.FC<{ t: Token; f: number }> = ({ t, f }) => {
  const u = invLerp(t.at, t.at + t.dur, f);
  if (u <= 0 || u >= 1) return null;
  const tr = easeInOutCubic(invLerp(0.1, 0.94, u));
  const [x0, y0] = mid(t.from), [x1, y1] = mid(t.to);
  const lift = Math.sin(Math.PI * tr);
  const cxp = lerp(x0, x1, 0.5), cyp = Math.min(y0, y1) - 90 - Math.abs(x1 - x0) * 0.08;
  const x = (1 - tr) ** 2 * x0 + 2 * (1 - tr) * tr * cxp + tr * tr * x1;
  const y = (1 - tr) ** 2 * y0 + 2 * (1 - tr) * tr * cyp + tr * tr * y1;
  const px = lerp(t.fromPx, t.toPx, tr);
  const pop = easeOutCubic(invLerp(0, 0.12, u));
  const z = 110 * lift + 6 * pop;
  const w = monoW(t.text, px) + px * 0.8, h = px * 1.5;
  return (
    <div style={{ position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, transform: `translateZ(${z.toFixed(1)}px) scale(${1 + 0.12 * lift})`,
      background: C.amber, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: px,
      color: FIN.ink, boxShadow: `0 ${8 + 26 * lift}px ${14 + 30 * lift}px rgba(0,0,0,${0.18 + 0.22 * lift}), 0 0 ${18 * lift}px ${rgba(C.amber, 0.55)}`, whiteSpace: 'nowrap',
      opacity: 1 - invLerp(0.93, 1, u) }}>{t.text}</div>
  );
};

// ------------------------------------------------------------------ the desk (also rendered as scene 08's first node)
export const FinanceDesk: React.FC<{ f: number; dur: number; variant: Variant }> = ({ f, dur, variant }) => {
  const L = useLayout();
  const T = timeline(variant, dur);
  const G = geometry(L);
  const P = plan(variant, T, G);
  const cam = camera(f, T, G, L, variant);
  const tall = L.tall;
  const titleWin = clamp(Math.min(invLerp(T.title[0] - 10, T.title[0] + 8, f), 1 - invLerp(T.title[1] - 14, T.title[1], f)));
  const wallDim = 0.12 + 0.5 * titleWin;
  // the lab is dark when the scene opens: everything but the opening page stays dark until the pullback
  const lit = easeInOutCubic(invLerp(T.pull[0] - 2, T.pull[0] + 26, f));
  const items = wallItems(G);
  const heroRecede = easeInCubic(invLerp(T.sep - 8, T.sep + 16, f));
  const panelIn = (at: number) => easeOutCubic(invLerp(at, at + 22, f));
  const showWall = f < T.sep + T.sepDur + 30;
  const pr = (key: string, r: Rect, extra: React.CSSProperties = {}, children?: React.ReactNode) => (
    <div key={key} style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 10, overflow: 'hidden', background: PAPER_BG, boxShadow: SHADOW, ...extra }}>{children}</div>
  );
  const sheetP = panelIn(T.sheetIn), chartP = panelIn(T.chartIn), findP = panelIn(T.qIn);
  const grow = easeInOutCubic(invLerp(T.find0 - 6, T.find0 + 8, f));
  const qH = tall ? 104 : 92;
  const findR = { ...G.finding, h: lerp(qH, G.finding.h, grow) };
  const desk = { w: L.w, h: L.h };
  const scrim = tall ? clamp(invLerp(T.sep, T.sep + 20, f)) : 0;
  const scrimH = tall ? 480 + 46 * easeInOutCubic(invLerp(T.camA[0], T.camA[1], f)) * (1 - easeInOutCubic(invLerp(T.camB[0], T.camB[1], f))) : 0;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 95% at 50% 38%, #131D45 0%, ${FIN.bg} 52%, #04071A 100%)`, overflow: 'hidden' }}>
      <AbsoluteFill style={{ background: WORLD.lab.bg0, opacity: 1 - easeInOutCubic(invLerp(0, T.paper[1] + 6, f)) }} />
      <div style={{ position: 'absolute', inset: 0, perspective: G.P, perspectiveOrigin: '50% 50%', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 1, transformStyle: 'preserve-3d', transformOrigin: '0 0', transform: camTransform(cam, L, G.P) }}>
          {/* desk surface: a faint dot grid far below the panels */}
          <svg width={desk.w * 2.6} height={desk.h * 2.6} style={{ position: 'absolute', left: -desk.w * 0.8, top: -desk.h * 0.8, transform: `translateZ(${-DESK_Z}px)`, opacity: 0.55 * lit }}>
            <defs><pattern id={`fin-dots-${variant}`} width={34} height={34} patternUnits="userSpaceOnUse"><circle cx={1.5} cy={1.5} r={1.3} fill="rgba(168,179,199,0.16)" /></pattern></defs>
            <rect width="100%" height="100%" fill={`url(#fin-dots-${variant})`} />
          </svg>
          {/* the wall of reports */}
          {showWall && items.map((it) => {
            const e = easeInCubic(invLerp(T.sep + it.d * 14, T.sep + 22 + it.d * 14, f));
            if (e >= 1) return null;
            return (
              <div key={it.i} style={{ position: 'absolute', left: it.x, top: it.y, width: it.w, height: it.h, borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.45)',
                transform: `translateZ(${(it.z - 900 * e).toFixed(1)}px) rotateZ(${it.rot.toFixed(2)}deg)`, opacity: (1 - e) * lit }}>
                <WallPage it={it} />
                <div style={{ position: 'absolute', inset: 0, background: '#070B18', opacity: wallDim + 0.25 * e }} />
              </div>
            );
          })}
          {showWall && heroRecede < 1 && (
            <div style={{ position: 'absolute', left: G.hero.x, top: G.hero.y, width: G.hero.w, height: G.hero.h, borderRadius: 6 * (f > T.paper[1] ? 1 : 0), overflow: 'hidden',
              transform: `translateZ(${(-900 * heroRecede).toFixed(1)}px)`, opacity: 1 - heroRecede, boxShadow: f > T.paper[1] ? '0 30px 60px rgba(0,0,0,0.5)' : 'none' }}>
              <HeroPage f={f} T={T} R={G.hero} />
              <div style={{ position: 'absolute', inset: 0, background: '#070B18', opacity: wallDim * invLerp(T.pull[0], T.pull[0] + 20, f) }} />
            </div>
          )}
          {/* source excerpts lift out of their pages and become readable panels */}
          {G.docs.map((D, k) => {
            const pg = items.find((it) => it.c === D.wall.c && it.r === D.wall.r)!;
            const p = easeInOutCubic(invLerp(T.sep + k * T.sepGap, T.sep + k * T.sepGap + T.sepDur, f));
            const sw = (pg.w - 20) / D.rect.w;
            const wx = pg.x + 10, wy = pg.y + 58;
            const x = lerp(wx, D.rect.x, p), y = lerp(wy, D.rect.y, p), s = lerp(sw, 1, p), z = lerp(pg.z + 3, 0, p) + 160 * Math.sin(Math.PI * p);
            const dim = (1 - p) * wallDim;
            return pr(D.key, D.rect, { opacity: lit, transform: `translate3d(${(x - D.rect.x).toFixed(2)}px, ${(y - D.rect.y).toFixed(2)}px, ${z.toFixed(1)}px) scale(${s.toFixed(4)})`, transformOrigin: '0 0',
              boxShadow: p > 0 ? SHADOW : 'none', borderRadius: lerp(3, 10, p) }, <DocPanel D={D} f={f} P={P} dim={dim} />);
          })}
          {/* workbook, chart, finding */}
          {sheetP > 0 && pr('sheet', G.sheet.rect, { opacity: sheetP, transform: `translate3d(0px, ${(1 - sheetP) * 40}px, ${(-260 * (1 - sheetP)).toFixed(1)}px)` },
            <SheetPanel S={G.sheet} f={f} P={P} tall={tall} />)}
          {chartP > 0 && pr('chart', G.chart.rect, { opacity: chartP, transform: `translate3d(0px, ${(1 - chartP) * 40}px, ${(-260 * (1 - chartP)).toFixed(1)}px)` },
            <ChartPanel G={G.chart} f={f} P={P} tall={tall} at={T.chartIn} />)}
          {findP > 0 && pr('finding', findR, { opacity: findP, transform: `translate3d(0px, ${(1 - findP) * 30}px, ${(-200 * (1 - findP)).toFixed(1)}px)` },
            <>
              {grow < 1 && <QuestionCard f={f} T={T} tall={tall} o={1 - grow} />}
              {grow > 0 && <div style={{ position: 'absolute', inset: 0, opacity: grow }}><FindingPanel R={G.finding} f={f} T={T} P={P} fs={G.findF} tall={tall} /></div>}
            </>)}
          {/* connectors: formula flow, data points into the chart, citation trails */}
          <div style={{ position: 'absolute', left: 0, top: 0, transform: 'translateZ(2px)' }}>
            <RangeBoxes f={f} ranges={P.ranges} />
            <DataConnections f={f} links={[...P.flow, ...P.data]} width={desk.w} height={desk.h} />
          </div>
          <div style={{ position: 'absolute', left: 0, top: 0, transform: 'translateZ(4px)' }}>
            <DataConnections f={f} links={P.trails} width={desk.w} height={desk.h} />
          </div>
          {P.tokens.map((t) => <FlyingFigure key={t.key} t={t} f={f} />)}
        </div>
      </div>
      <EntryLine f={f} T={T} G={G} L={L} />
      {tall && scrim > 0 && (
        <>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: scrimH, opacity: scrim, background: `linear-gradient(180deg, ${FIN.bg} 0%, ${FIN.bg} 86%, rgba(10,16,36,0) 100%)` }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 1362, bottom: 0, opacity: scrim, background: `linear-gradient(0deg, ${FIN.bg} 0%, ${FIN.bg} 82%, rgba(10,16,36,0) 100%)` }} />
        </>
      )}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ screen-space type
const TitleBlock: React.FC<{ f: number; T: TL; L: Layout }> = ({ f, T, L }) => {
  const [t0, t1] = T.title;
  const win = clamp(Math.min(invLerp(t0 - 6, t0 + 10, f), 1 - invLerp(t1 - 12, t1, f)));
  if (win <= 0) return null;
  const size = L.t.title;
  const words = L.tall ? ['FINANCIAL', 'RESEARCH'] : ['FINANCIAL RESEARCH'];
  const cy = L.tall ? 790 : L.h * 0.45;
  const capP = reveal(f, t0 + 14, 12) * (1 - invLerp(t1 - 12, t1, f));
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: '50%', top: cy, width: L.tall ? 1700 : 2600, height: L.tall ? 760 : 520, transform: 'translate(-50%, -50%)', opacity: win * 0.9,
        background: 'radial-gradient(closest-side, rgba(4,7,20,0.78), rgba(4,7,20,0.5) 60%, rgba(4,7,20,0) 100%)' }} />
      <div style={{ position: 'absolute', left: L.safe.side, right: L.safe.side, top: cy - (L.tall ? size * 1.15 : size * 0.7), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: L.tall ? 10 : 0 }}>
        {words.map((w, i) => (
          <KineticTitle key={w} text={w} fx="rise" at={t0 + i * 5} size={size} weight={700} tracking={0.01} out={t1 - 12} />
        ))}
        <div style={{ marginTop: L.tall ? 34 : 30, fontFamily: F.mono, fontSize: L.tall ? 20 : 22, letterSpacing: L.tall ? '0.05em' : '0.1em', color: C.lunar, opacity: capP, textAlign: 'center', maxWidth: L.w - 2 * L.safe.side, whiteSpace: 'nowrap' }}>
          {CLAIMS.financeTasks.display}
        </div>
        <div style={{ marginTop: 12, opacity: 1 - invLerp(t1 - 12, t1, f) }}>
          <SourceAttribution id="financeTasks" at={t0 + 20} style={{ textAlign: 'center' }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Chips: React.FC<{ f: number; T: TL; G: Geo; L: Layout }> = ({ f, T, G, L }) => {
  const items: { text: string; fx: 'decode' | 'build'; span: [number, number] }[] = [
    { text: 'CROSS-DOCUMENT ANALYSIS', fx: 'decode', span: T.chip1 },
    { text: 'MODELING', fx: 'build', span: T.chip2 },
  ];
  return (
    <>
      {items.map((it) => {
        const [a, b] = it.span;
        if (f < a - 2 || f > b + 2 || b <= a) return null;
        const rule = easeOutCubic(invLerp(a + 4, a + 22, f)) * (1 - easeInOutCubic(invLerp(b - 12, b, f)));
        return (
          <div key={it.text} style={{ position: 'absolute', top: G.chipY, left: G.chipAlign === 'left' ? G.chipX : undefined, right: G.chipAlign === 'right' ? L.w - G.chipX : undefined,
            display: 'flex', flexDirection: 'column',
            alignItems: G.chipAlign === 'right' ? 'flex-end' : 'flex-start', gap: 12 }}>
            <KineticTitle text={it.text} fx={it.fx} at={a} size={G.chipSize} weight={650} tracking={0.02} out={b - 12} accent={C.amber} />
            <div style={{ height: 3, width: 140 * rule, background: C.amber, borderRadius: 2, boxShadow: `0 0 12px ${rgba(C.amber, 0.6)}` }} />
          </div>
        );
      })}
    </>
  );
};

const Evidence: React.FC<{ f: number; T: TL; G: Geo; L: Layout }> = ({ f, T, G, L }) => {
  const [a, b] = T.ev;
  const p = easeOutCubic(invLerp(a, a + 14, f)) * (1 - easeInOutCubic(invLerp(b - 12, b, f)));
  if (p <= 0) return null;
  const R = G.evidence, tall = L.tall;
  const numAt = T.num - 30;
  const card: React.CSSProperties = { position: 'absolute', left: R.x, top: R.y, width: R.w, height: R.h, opacity: p, transform: `translateY(${(1 - p) * 18}px)`, borderRadius: 14,
    background: 'linear-gradient(90deg, #050918, #0A112C)', border: `1px solid ${rgba(C.cyan, 0.28)}`, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', boxSizing: 'border-box' };
  if (tall) {
    return (
      <div style={{ ...card, padding: '16px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: F.mono, fontSize: 26, letterSpacing: '0.1em', color: C.lunar, fontWeight: 600 }}>{CLAIMS.officeQa.display}</span>
            <span style={{ height: 2, width: 64, background: C.cyan, opacity: 0.8 }} />
          </div>
          <NumberCounter value={N.officeQa} decimals={decimals(N.officeQa)} at={numAt} dur={30} size={70} color={C.lunar} font={F.display} weight={600}
            style={{ fontVariantNumeric: 'normal', letterSpacing: '-0.01em' }} />
        </div>
        <SourceAttribution id="officeQa" at={a + 8} />
      </div>
    );
  }
  return (
    <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 34, padding: '0 34px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontFamily: F.mono, fontSize: tall ? 24 : 22, letterSpacing: '0.1em', color: C.lunar, fontWeight: 600 }}>{CLAIMS.officeQa.display}</span>
        <span style={{ height: 2, width: 64, background: C.cyan, opacity: 0.8 }} />
      </div>
      <NumberCounter value={N.officeQa} decimals={decimals(N.officeQa)} at={numAt} dur={30} size={tall ? 72 : 74} color={C.lunar} font={F.display} weight={600}
        style={{ fontVariantNumeric: 'normal', letterSpacing: '-0.01em' }} />
      <div style={{ width: 1, alignSelf: 'stretch', margin: '22px 0', background: 'rgba(232,237,246,0.18)' }} />
      <SourceAttribution id="officeQa" at={a + 8} style={{ maxWidth: tall ? 300 : 420 }} />
    </div>
  );
};

// ------------------------------------------------------------------ scene
export const FinanceResearch: React.FC<SceneProps> = ({ dur, variant }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const T = timeline(variant, dur);
  // exit: the workspace shrinks into one rounded card at screen centre (scale 0.18)
  const tall = L.tall;
  const shrinkEnd = tall ? T.exit0 + 10 : dur - 1;
  const e = easeInOutCubic(invLerp(T.exit0, shrinkEnd, f));
  const s = lerp(1, 0.18, e);
  // reel only: the card then flattens into a mint bar across the centre (the hand-off 08 gives 09 in the master)
  const flat = tall ? easeInOutCubic(invLerp(T.exit0 + 8, dur - 1, f)) : 0;
  const labelSwap = tall ? 1 : clamp(invLerp(T.pull[0] + 10, T.pull[0] + 22, f));
  const corner = clamp(invLerp(T.pull[0] + 4, T.pull[0] + 20, f)) * (1 - clamp(invLerp(T.sep + 20, T.sep + 40, f)));
  const labelAt = tall ? T.pull[0] + 8 : 8;
  // same bar scene 08 hands to 09 in the master: mint, 960 x 8, fully rounded, centred
  const barW = lerp(L.w * 0.18, BAR.w, flat), barH = lerp(L.h * 0.18, BAR.h, flat);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(110% 90% at 50% 50%, ${AGENT_BG.inner} 0%, ${AGENT_BG.outer} 75%)` }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: L.w, height: L.h, transform: `scale(${s.toFixed(5)})`, transformOrigin: '50% 50%',
        borderRadius: (16 * e) / s, overflow: 'hidden', opacity: 1 - (tall ? invLerp(0.5, 0.8, flat) : 0),
        boxShadow: e > 0 ? `0 ${(30 * e) / s}px ${(80 * e) / s}px rgba(0,0,0,0.55), 0 0 0 ${1.5 / s}px rgba(232,237,246,${0.4 * e})` : 'none' }}>
        <FinanceDesk f={f} dur={dur} variant={variant} />
        <TitleBlock f={f} T={T} L={L} />
        <Chips f={f} T={T} G={geometry(L)} L={L} />
        <Evidence f={f} T={T} G={geometry(L)} L={L} />
      </div>
      {tall && flat > 0 && (
        <div style={{ position: 'absolute', left: (L.w - barW) / 2, top: (L.h - barH) / 2, width: barW, height: barH, borderRadius: lerp(16, BAR.h / 2, flat),
          background: BAR.color, opacity: invLerp(0.2, 0.6, flat), boxShadow: `0 0 ${36 * Math.sin(Math.PI * flat)}px ${rgba(C.mint, 0.6)}` }} />
      )}
      {corner > 0 && (L.tall
        ? <div style={{ position: 'absolute', left: 0, right: 0, top: 220, height: 180, opacity: corner * (1 - e),
            background: 'linear-gradient(180deg, rgba(4,7,20,0) 0%, rgba(4,7,20,0.86) 28%, rgba(4,7,20,0.86) 72%, rgba(4,7,20,0) 100%)' }} />
        : <div style={{ position: 'absolute', left: 0, top: 0, width: 1100, height: 360, opacity: corner * (1 - e),
            background: 'radial-gradient(70% 60% at 0% 0%, rgba(4,7,20,0.9), rgba(4,7,20,0.6) 45%, rgba(4,7,20,0) 100%)' }} />)}
      {!tall && labelSwap < 1 && <AbsoluteFill style={{ opacity: 1 - labelSwap }}><ProvenanceLabel kind="B" light note={LABELS.fictional} at={labelAt} /></AbsoluteFill>}
      <AbsoluteFill style={{ opacity: labelSwap * (1 - invLerp(0.3, 0.9, flat)) }}><ProvenanceLabel kind="B" note={LABELS.fictional} at={labelAt} /></AbsoluteFill>
    </AbsoluteFill>
  );
};
