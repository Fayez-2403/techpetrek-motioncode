// The CASE FILE media window: plays a case's mediaPlan items in order, cutting between them on beats with a clean wipe.
//   receipt item -> the real PNG from the case's `receipts`, never edited (highlights are overlays), tagged with the
//                   receipt's own `source` ("SOURCE: Railway blog · Oct 22, 2026"). Three presentations, by shape:
//                   print  - a short crop as an evidence print on the window's lightbox plate; the highlighter sweeps
//                            each detected text line in reading order
//                   strip  - a wide strip (CERT-In, ~2000 px): shown whole, then zooms to the first quoted line and pans
//                            slowly along it, so it is legible instead of shrunk
//                   scroll - a tall crop: fit to width, slow vertical drift, highlighter on the lines as they pass
//   anim item    -> MEDIA[id] (original animation) with an "ILLUSTRATIVE" tag.
//   missing      -> a neutral "pending" plate (no file, file not found, or animation not registered yet).
// Text lines are found once per receipt from its pixels (dark-on-light row profile), deterministic, cached.
// Receipt refs: { file: "receipts/x.png", source?: "Publisher · date", hl?: [x, y, w, h] (fractions or px) } or a string.
import React, { useEffect, useState } from 'react';
import { Img, continueRender, delayRender, staticFile } from 'remotion';
import plan from '../data/mediaPlan.json';
import { MEDIA } from '../media';
import { clamp, easeInOutCubic, easeInOutSine, easeOutCubic, easeOutQuint, invLerp, lerp } from '../lib/anim';
import { C } from '../styles/theme';
import { F } from '../styles/typography';
import type { Variant } from './TypeTag';

export interface PlanItem { receipt?: number; anim?: string; beats?: number; /** start this item just before the narration says this word (reel only) */ word?: string }
/** card-local frame at which a word is first spoken in the card's segment, or null */
export type CueAt = (word: string) => number | null;
export interface Slot { item: PlanItem; i: number; from: number; to: number }
export type ReceiptRef = string | { file?: string; src?: string; path?: string; hl?: number[] | { x: number; y: number; w: number; h: number }; source?: string; publisher?: string; date?: string };
interface Geo { x: number; y: number; w: number; h: number; r: number }

const PLAN = plan as unknown as Record<string, PlanItem[] | string>;
/** the case's media plan; with no plan entry, its first receipts in order */
export function planFor(key: string, receipts: ReceiptRef[] = []): PlanItem[] {
  const p = PLAN[key];
  if (Array.isArray(p) && p.length) return p;
  return receipts.slice(0, 3).map((_, i) => ({ receipt: i }));
}

/** split [start, end) between the items (even, unless an item gives `beats`), cuts snapped to the film's beat grid */
export function mediaSchedule(items: PlanItem[], start: number, end: number, phase: number, beat = 30, cueAt?: CueAt): Slot[] {
  if (!items.length) return [];
  const total = Math.max(beat, end - start);
  const fixed = items.reduce((a, it) => a + (it.beats ? it.beats * beat : 0), 0);
  const nFree = items.filter((it) => !it.beats).length;
  const per = nFree ? Math.max(beat, (total - fixed) / nFree) : 0;
  const b = [start];
  items.forEach((it) => b.push(b[b.length - 1] + (it.beats ? it.beats * beat : per)));
  for (let k = 1; k < items.length; k++) {
    const cue = items[k].word && cueAt ? cueAt(items[k].word!) : null;
    const snapped = cue !== null ? cue - 6 : Math.round((b[k] + phase) / beat) * beat - phase;
    b[k] = Math.max(snapped, b[k - 1] + beat);
  }
  b[items.length] = Math.max(end, b[items.length - 1] + beat);
  return items.map((item, i) => ({ item, i, from: b[i], to: b[i + 1] }));
}
export const slotAt = (s: Slot[], f: number) => {
  let k = 0;
  for (let i = 0; i < s.length; i++) { if (f >= s[i].from) k = i; }
  return k;
};

/** "Railway · “Title” · Oct 22, 2026 · blog.railway.com" -> "Railway · “Title”" (fallback when a receipt has no source) */
export const sourceLine = (footnote: string) => footnote.split('·').map((s) => s.trim()).filter(Boolean).slice(0, 2).join(' · ');

function resolveSrc(ref: ReceiptRef | undefined): string | null {
  if (!ref) return null;
  const p = typeof ref === 'string' ? ref : ref.file ?? ref.src ?? ref.path;
  if (!p) return null;
  if (/^(data:|https?:|blob:)/.test(p)) return p;
  const clean = p.replace(/^\/+/, '').replace(/^public\//, '');
  return staticFile(clean.includes('/') ? clean : `receipts/${clean}`);
}

// ---------------------------------------------------------------- receipt analysis (size + text lines), cached
interface Line { y0: number; y1: number; x0: number; x1: number }   // fractions of the image
interface Info { w: number; h: number; lines: Line[]; bg: string }
const infos = new Map<string, Info | 'error'>();

function analyse(img: HTMLImageElement): Info {
  const W = img.naturalWidth, H = img.naturalHeight;
  const out: Info = { w: W, h: H, lines: [], bg: '#F7F6F2' };
  try {
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d', { willReadFrequently: true });
    if (!g) return out;
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, W, H).data;
    const lum = (x: number, y: number) => { const i = (y * W + x) * 4; return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; };
    // background = brightest common value along the border
    const border: number[] = [];
    for (let x = 0; x < W; x += Math.max(1, Math.floor(W / 64))) { border.push(lum(x, 0), lum(x, H - 1)); }
    for (let y = 0; y < H; y += Math.max(1, Math.floor(H / 32))) { border.push(lum(0, y), lum(W - 1, y)); }
    border.sort((a, b) => a - b);
    const bg = border[Math.floor(border.length * 0.6)];
    { const i = 0; out.bg = `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`; }
    const light = bg > 128, thr = 70;
    const step = Math.max(1, Math.floor(W / 900));
    const rows: { n: number; x0: number; x1: number }[] = [];
    for (let y = 0; y < H; y++) {
      let n = 0, x0 = W, x1 = -1;
      for (let x = 0; x < W; x += step) {
        const l = lum(x, y);
        if (light ? l < bg - thr : l > bg + thr) { n++; if (x < x0) x0 = x; x1 = x; }
      }
      rows.push({ n, x0, x1 });
    }
    // runs of inked rows -> lines; thin runs (underlines) merge into the line above
    const runs: { y0: number; y1: number; x0: number; x1: number }[] = [];
    let cur: { y0: number; y1: number; x0: number; x1: number } | null = null;
    rows.forEach((r, y) => {
      if (r.n >= 2) {
        if (cur && y - cur.y1 <= 2) { cur.y1 = y; cur.x0 = Math.min(cur.x0, r.x0); cur.x1 = Math.max(cur.x1, r.x1); }
        else { if (cur) runs.push(cur); cur = { y0: y, y1: y, x0: r.x0, x1: r.x1 }; }
      }
    });
    if (cur) runs.push(cur);
    const merged: typeof runs = [];
    for (const r of runs) {
      const last = merged[merged.length - 1];
      const h = r.y1 - r.y0 + 1;
      if (last && h <= 4 && r.y0 - last.y1 <= 8) { last.y1 = r.y1; last.x0 = Math.min(last.x0, r.x0); last.x1 = Math.max(last.x1, r.x1); }
      else if (h >= 5) merged.push({ ...r });
    }
    out.lines = merged.slice(0, 24).map((r) => ({ y0: r.y0 / H, y1: (r.y1 + 1) / H, x0: r.x0 / W, x1: (r.x1 + step) / W }));
  } catch { /* tainted canvas etc.: no lines */ }
  return out;
}

/** size + text lines of a receipt (holds the render until known) */
function useReceiptInfo(src: string | null) {
  const [, bump] = useState(0);
  const [handle] = useState(() => (src && !infos.has(src) ? delayRender(`receipt ${src.slice(-60)}`) : null));
  useEffect(() => {
    if (!src || handle === null) return;
    let done = false;
    const finish = () => { if (!done) { done = true; continueRender(handle); } };
    if (infos.has(src)) { finish(); return; }
    const img = new Image();
    img.onload = () => { infos.set(src, analyse(img)); bump((x) => x + 1); finish(); };
    img.onerror = () => { infos.set(src, 'error'); bump((x) => x + 1); finish(); };
    img.src = src;
    return finish;
  }, [src]);
  return src ? infos.get(src) : 'error';
}

// ---------------------------------------------------------------- window chrome
/** small window tag: SOURCE / ILLUSTRATIVE / PENDING */
export const WindowTag: React.FC<{ text: string; kind: 'source' | 'illustrative' | 'pending'; size?: number; maxW?: number }> = ({ text, kind, size = 17, maxW }) => (
  <div style={{ position: 'absolute', left: 16, bottom: 16, height: size * 1.75, maxWidth: maxW, display: 'inline-flex', alignItems: 'center', gap: size * 0.5,
    padding: `0 ${size * 0.7}px`, borderRadius: 8, background: 'rgba(16,16,18,0.86)', border: '1px solid rgba(255,255,255,0.16)', boxSizing: 'border-box',
    color: '#F6F3EC', fontFamily: F.mono, fontSize: size, fontWeight: 600, letterSpacing: '0.05em', whiteSpace: 'nowrap', lineHeight: 1, zIndex: 5, overflow: 'hidden' }}>
    <span style={{ width: size * 0.5, height: size * 0.5, flex: 'none', background: kind === 'source' ? C.alert : 'transparent',
      border: kind === 'source' ? 'none' : `1.5px solid ${kind === 'pending' ? C.steel : '#F6F3EC'}`, boxSizing: 'border-box' }} />
    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</span>
  </div>
);

/** exhibit ticks (top-right): one bar per media item, the current one filling */
const Ticks: React.FC<{ slots: Slot[]; f: number; k: number }> = ({ slots, f, k }) => {
  if (slots.length < 2) return null;
  return (
    <div style={{ position: 'absolute', right: 16, top: 16, height: 26, padding: '0 10px', borderRadius: 13, display: 'flex', alignItems: 'center', gap: 5,
      background: 'rgba(16,16,18,0.72)', border: '1px solid rgba(255,255,255,0.14)', zIndex: 6 }}>
      {slots.map((s, i) => {
        const fill = i < k ? 1 : i > k ? 0 : clamp((f - s.from) / Math.max(1, s.to - s.from));
        return (
          <div key={i} style={{ width: 20, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.22)', overflow: 'hidden' }}>
            <div style={{ width: `${fill * 100}%`, height: '100%', background: i === k ? C.alert : 'rgba(255,255,255,0.75)' }} />
          </div>
        );
      })}
    </div>
  );
};

const Pending: React.FC<{ w: number; h: number; title: string; note: string; variant: Variant; tag?: number }> = ({ w, h, title, note, variant, tag = 17 }) => {
  const dark = variant === 'dark';
  return (
    <div style={{ position: 'absolute', inset: 0, width: w, height: h, background: dark ? C.graphite2 : '#E9E3D6',
      backgroundImage: `repeating-linear-gradient(135deg, ${dark ? 'rgba(236,239,244,0.04)' : 'rgba(18,18,18,0.045)'} 0 2px, transparent 2px 16px)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <div style={{ padding: '18px 30px', border: `2px dashed ${dark ? 'rgba(236,239,244,0.25)' : 'rgba(18,18,18,0.22)'}`, borderRadius: 12,
        fontFamily: F.mono, fontSize: 24, fontWeight: 600, letterSpacing: '0.14em', color: dark ? C.steel : C.mute }}>{title}</div>
      <div style={{ fontFamily: F.mono, fontSize: 18, color: dark ? C.steel : C.mute, letterSpacing: '0.04em', opacity: 0.85 }}>{note}</div>
      <WindowTag text="PENDING" kind="pending" size={tag} />
    </div>
  );
};

/** lightbox plate behind prints */
const Plate: React.FC<{ variant: Variant }> = ({ variant }) => {
  const dark = variant === 'dark';
  return (
    <div style={{ position: 'absolute', inset: 0,
      background: dark ? 'radial-gradient(120% 120% at 50% 30%, #2A2D34, #1A1C21)' : 'radial-gradient(120% 120% at 50% 30%, #ECE6DA, #DDD5C6)' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${dark ? 'rgba(236,239,244,0.04)' : 'rgba(18,18,18,0.05)'} 1px, transparent 1px), linear-gradient(90deg, ${dark ? 'rgba(236,239,244,0.04)' : 'rgba(18,18,18,0.05)'} 1px, transparent 1px)`,
        backgroundSize: '24px 24px', backgroundPosition: '-1px -1px' }} />
    </div>
  );
};

// ---------------------------------------------------------------- receipt
const MARK = 'rgba(255,98,30,0.34)';

const Receipt: React.FC<{ r: ReceiptRef | undefined; w: number; h: number; f: number; dur: number; footnote: string; variant: Variant; tag: number; still?: boolean }> = ({ r, w, h, f: fIn, dur, footnote, variant, tag, still }) => {
  // still: zoom finished, no pan yet, highlighter complete
  const f = still ? 62 : fIn;
  const src = resolveSrc(r);
  const info = useReceiptInfo(src);
  const obj = typeof r === 'object' && r ? r : undefined;
  const source = obj?.source ?? (obj?.publisher ? [obj.publisher, obj.date].filter(Boolean).join(' · ') : sourceLine(footnote));
  if (!src || info === 'error' || !info) {
    return <Pending w={w} h={h} title="RECEIPT PENDING" note={info === 'error' ? 'file not found' : `SOURCE: ${source}`} variant={variant} tag={tag} />;
  }
  // passage lines: explicit hl box, else the detected lines, else the whole image
  let lines = info.lines;
  const raw = obj?.hl;
  if (raw) {
    const a = Array.isArray(raw) ? { x: raw[0], y: raw[1], w: raw[2], h: raw[3] } : raw;
    const px = a.x > 1 || a.y > 1 || a.w > 1 || a.h > 1;
    const b = px ? { x: a.x / info.w, y: a.y / info.h, w: a.w / info.w, h: a.h / info.h } : a;
    const inBox = lines.filter((l) => (l.y0 + l.y1) / 2 >= b.y && (l.y0 + l.y1) / 2 <= b.y + b.h);
    lines = inBox.length ? inBox : [{ x0: b.x, x1: b.x + b.w, y0: b.y, y1: b.y + b.h }];
  }
  if (!lines.length) lines = [{ x0: 0, x1: 1, y0: 0, y1: 1 }];

  const pad = 34, tagRoom = tag * 1.75 + 22;
  const ratio = info.h / info.w;
  const mode: 'print' | 'strip' | 'scroll' = info.w >= 1300 && ratio < 0.3 ? 'strip' : ratio * (w - 2 * pad) > h - pad - tagRoom ? 'scroll' : 'print';
  const u = clamp(f / Math.max(1, dur));

  // geometry of the print in window px: scale s, top-left (px, py)
  let s = (w - 2 * pad) / info.w, px = pad, py = 0, kb = 1;
  const usableH = h - pad - tagRoom;
  if (mode === 'print') {
    py = pad * 0.8 + Math.max(0, (usableH - info.h * s) / 2);
    kb = lerp(1, 1.03, easeInOutSine(u));
  } else if (mode === 'scroll') {
    const ih = info.h * s, maxT = ih - usableH;
    const travel = Math.min(maxT, 40 + (dur / 60) * 34);
    const cy = ((lines[0].y0 + lines[Math.min(lines.length - 1, 2)].y1) / 2) * ih;
    const y0 = clamp(clamp(cy - usableH / 2, 0, maxT) - travel * 0.3, 0, Math.max(0, maxT - travel));
    py = pad * 0.8 - lerp(y0, y0 + travel, easeInOutSine(u));
  } else {
    // strip: whole -> zoom to the first quoted line (left aligned) -> slow pan along it
    const s0 = s, ih0 = info.h * s0;
    const blk = lines.slice(0, 3);
    const blkH = (blk[blk.length - 1].y1 - blk[0].y0) * ih0;
    // zoom only as far as the pan can still reach the end of the quote at a readable pace (~300 px/s) within the slot
    const blkW = (Math.max(...blk.map((l) => l.x1)) - blk[0].x0) * info.w * s0;
    const zFit = (w - 2 * pad + 300 * (Math.max(0, dur - 80) / 60)) / Math.max(1, blkW);
    const z = clamp(Math.min((usableH * 0.5) / Math.max(1, blkH), zFit), 1, 2.6);
    const zp = easeInOutCubic(invLerp(20, 62, f));
    s = s0 * lerp(1, z, zp);
    const L0 = lines[0], block = lines.slice(0, 3);
    const by0 = block[0].y0 * info.h, by1 = block[block.length - 1].y1 * info.h;
    const lineCx = ((by0 + by1) / 2) * s;            // block centre in print px
    const fullY = pad * 0.8 + Math.max(0, (usableH - ih0) / 2);
    const zoomY = pad * 0.8 + usableH / 2 - lineCx;
    const ihZ = info.h * s;   // a strip shorter than the window is centred; a taller one keeps the quote centred without gaps
    py = lerp(fullY, ihZ <= usableH ? pad * 0.8 + (usableH - ihZ) / 2 : clamp(zoomY, pad * 0.8 + usableH - ihZ, pad * 0.8), zp);
    const textX0 = L0.x0 * info.w * s;
    const panMax = Math.max(0, Math.max(...block.map((l) => l.x1)) * info.w * s - Math.max(0, textX0 - 16) - (w - 2 * pad) + 16);
    const pan = panMax * easeInOutSine(invLerp(66, Math.max(96, dur - 12), f));
    px = lerp(pad, pad - Math.max(0, textX0 - 16) - pan, zp);
  }
  const pw = info.w * s, ph = info.h * s;
  // highlighter: lines in reading order
  const t0 = mode === 'strip' ? 58 : 12, per = mode === 'strip' ? 26 : 11, sweepDur = mode === 'strip' ? 40 : 18;
  const shown = lines.slice(0, mode === 'scroll' ? 14 : 8);
  const marginBar = still ? 1 : easeOutCubic(invLerp(6, 24, f));
  const ly0 = shown[0].y0 * ph, ly1 = shown[shown.length - 1].y1 * ph;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Plate variant={variant} />
      <div style={{ position: 'absolute', left: px, top: py, width: pw, height: ph, transform: `scale(${kb})`, transformOrigin: '50% 50%' }}>
        <div style={{ position: 'absolute', inset: -14, background: info.bg, borderRadius: 6,
          boxShadow: '0 1px 2px rgba(30,20,5,0.14), 0 16px 34px -14px rgba(30,20,5,0.42)' }} />
        <Img src={src} style={{ position: 'absolute', left: 0, top: 0, width: pw, height: ph, display: 'block' }} onError={() => undefined} />
        {shown.map((l, i) => {
          const q = still ? 1 : easeInOutCubic(invLerp(t0 + i * per, t0 + i * per + sweepDur, f));
          if (q <= 0) return null;
          const lh = (l.y1 - l.y0) * ph;
          return <div key={i} style={{ position: 'absolute', left: l.x0 * pw - 3, top: l.y0 * ph + lh * 0.36, height: lh * 0.7, width: ((l.x1 - l.x0) * pw + 6) * q,
            background: MARK, mixBlendMode: 'multiply', borderRadius: 2 }} />;
        })}
        <div style={{ position: 'absolute', left: -22 / Math.max(0.6, kb), top: ly0, width: 5, height: (ly1 - ly0) * marginBar, background: C.alert, borderRadius: 3 }} />
      </div>
      <WindowTag text={`SOURCE: ${source}`} kind="source" size={tag} maxW={w - 32} />
    </div>
  );
};

const Anim: React.FC<{ id: string; w: number; h: number; f: number; dur: number; variant: Variant; tag: number }> = ({ id, w, h, f, dur, variant, tag }) => {
  const M = MEDIA[id];
  if (!M) return <Pending w={w} h={h} title="ANIMATION PENDING" note={id} variant={variant} tag={tag} />;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: C.graphite }}>
      <M w={w} h={h} f={Math.max(0, f)} dur={dur} />
      <WindowTag text="ILLUSTRATIVE" kind="illustrative" size={tag} />
    </div>
  );
};

interface Props {
  receipts: ReceiptRef[]; footnote: string; geo: Geo;
  f: number; at: number; slots: Slot[]; variant?: Variant; still?: boolean; tagSize?: number;
}
const WIPE = 12;

/** `f` card-local frame; the window scales in at `at`; `slots` from mediaSchedule() */
export const MediaWindow: React.FC<Props> = ({ receipts, footnote, geo, f, at, slots, variant = 'paper', still, tagSize = 17 }) => {
  const t = still ? 999 : f - at;
  const inP = easeOutQuint(invLerp(0, 36, t));
  const sh = easeOutCubic(invLerp(4, 54, t));
  const dark = variant === 'dark';
  const k = slotAt(slots, f);
  const show = (s: Slot) => {
    const local = f - s.from, dur = (s.i === slots.length - 1 ? s.to + 60 : s.to) - s.from;
    return s.item.anim !== undefined
      ? <Anim id={s.item.anim} w={geo.w} h={geo.h} f={local} dur={dur} variant={variant} tag={tagSize} />
      : <Receipt key={`r${s.item.receipt}`} r={receipts[s.item.receipt ?? -1]} w={geo.w} h={geo.h} f={local} dur={dur} footnote={footnote} variant={variant} tag={tagSize} still={still} />;
  };
  const cur = slots[k], prev = k > 0 ? slots[k - 1] : null;
  const wp = prev && !still ? easeInOutCubic(invLerp(0, WIPE, f - cur.from)) : 1;
  const settle = prev && !still ? easeOutCubic(invLerp(0, 30, f - cur.from)) : 1;
  const shadow = dark
    ? `0 ${3 * sh}px ${8 * sh}px rgba(0,0,0,${0.35 * sh}), 0 ${30 * sh}px ${70 * sh}px -${18 * sh}px rgba(0,0,0,${0.75 * sh})`
    : `0 ${2 * sh}px ${5 * sh}px rgba(48,32,10,${0.12 * sh}), 0 ${22 * sh}px ${46 * sh}px -${14 * sh}px rgba(48,32,10,${0.4 * sh}), 0 ${60 * sh}px ${96 * sh}px -${36 * sh}px rgba(48,32,10,${0.36 * sh})`;
  return (
    <div style={{ position: 'absolute', left: geo.x, top: geo.y, width: geo.w, height: geo.h, borderRadius: geo.r, boxShadow: shadow,
      transform: `scale(${0.96 + 0.04 * inP})`, opacity: t < 0 ? 0 : clamp(inP * 1.6), transformOrigin: '50% 40%' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: geo.r, overflow: 'hidden', background: dark ? C.graphite2 : '#EFEBE2', isolation: 'isolate' }}>
        {[prev && wp < 1 ? prev : null, cur ?? null].map((s) => s && (
          <div key={`slot${s.i}`} style={s === cur
            ? { position: 'absolute', inset: 0, zIndex: 2, clipPath: wp < 1 ? `inset(0 ${(1 - wp) * 100}% 0 0)` : undefined,
              transform: `scale(${1.045 - 0.045 * settle})`, transformOrigin: '50% 50%' }
            : { position: 'absolute', inset: 0, zIndex: 1 }}>{show(s)}</div>
        ))}
        {cur && prev && wp > 0 && wp < 1 && (
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: wp * geo.w - 2, width: 4, zIndex: 3, background: C.alert, boxShadow: `0 0 18px 2px ${C.alert}` }} />
        )}
        {!slots.length && <Pending w={geo.w} h={geo.h} title="MEDIA PENDING" note="no media plan" variant={variant} tag={tagSize} />}
        <Ticks slots={slots} f={f} k={k} />
      </div>
      {/* crisp frame line */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: geo.r, pointerEvents: 'none',
        boxShadow: dark ? 'inset 0 0 0 1px rgba(236,239,244,0.16)' : 'inset 0 0 0 1.5px rgba(18,18,18,0.86)' }} />
    </div>
  );
};
