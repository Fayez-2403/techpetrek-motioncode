// CASE BOARD textures (board builder): every texture is drawn once on a canvas after the fonts load (inside a
// delayRender), cached at module level so the board's ThreeCanvas can unmount while a 2D card covers the frame and
// remount instantly. The card front reproduces the 2D CASE FILE card's hand-off state (CardLayer intro 'handoff':
// paper + grid + grain, dash, counter, numeral, kicker, headline) with the card builder's own line-breaking
// (cardText.headlineLayout / fitSize), so the 3D card that fills the frame and the DOM card match pixel for pixel.
import { useEffect, useState } from 'react';
import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';
import * as THREE from 'three';
import { CARD } from '../components/cardLayout';
import { TYPE, fitSize, headlineLayout } from '../components/cardText';
import { iconFor, ink, pad2, type IconName } from '../components/CaseCard';
import { CASE_TOTAL, SEGS, caseNo } from '../lib/timeline';
import { mulberry32 } from '../lib/rng';
import { C } from '../styles/theme';
import { F } from '../styles/typography';
import { BOARD_CARDS, STAMP, type BoardCard, type PrintSpot } from './CaseBoardLayout';

export interface PrintTex { tex: THREE.Texture; aspect: number; blank: boolean }
export interface BoardAssets {
  fronts: THREE.CanvasTexture[]; backs: THREE.CanvasTexture[];
  detail: { paper: THREE.CanvasTexture; dark: THREE.CanvasTexture };
  prints: Record<string, PrintTex>;
  fibre: THREE.CanvasTexture; felt: THREE.CanvasTexture; stamp: THREE.CanvasTexture;
  shadow: THREE.CanvasTexture; dot: THREE.CanvasTexture; glow: THREE.CanvasTexture;
}

const mk = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = Math.round(w); c.height = Math.round(h); return c; };
const ctx2d = (c: HTMLCanvasElement) => c.getContext('2d') as CanvasRenderingContext2D;
function tex(c: HTMLCanvasElement, srgb = true, repeat = false) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.needsUpdate = true;
  return t;
}

// ---------------------------------------------------------------- shared helpers
/** font ascent / descent as CSS uses them (canvas fontBoundingBox) */
function metrics(g: CanvasRenderingContext2D, font: string) {
  g.font = font;
  const m = g.measureText('Hg');
  return { A: m.fontBoundingBoxAscent, D: m.fontBoundingBoxDescent };
}
/** baseline of a CSS line box of height `lh` whose top is `top` */
function baseline(g: CanvasRenderingContext2D, font: string, top: number, lh: number) {
  const { A, D } = metrics(g, font);
  return top + (lh - (A + D)) / 2 + A;
}
function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.roundRect(x, y, w, h, r);
}

/** the card builder's paper grain tile (same seed + algorithm as CaseCard.grainTile) */
let grain: HTMLCanvasElement | null = null;
function grainTile() {
  if (grain) return grain;
  const s = 256, cv = mk(s, s), g = ctx2d(cv);
  const img = g.createImageData(s, s), r = mulberry32(4242);
  for (let i = 0; i < s * s; i++) {
    const v = 128 + (r() - 0.5) * 120 + (r() < 0.012 ? (r() - 0.5) * 160 : 0);
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = Math.max(0, Math.min(255, v));
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grain = cv;
  return cv;
}

// line icons from CaseCard.Icon (24 px viewBox)
const ICONS: Record<IconName, (string | [number, number, number])[]> = {
  cloud: ['M7 18h10.5a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.4 9.2 4.4 4.4 0 0 0 7 18z'],
  key: [[8, 12, 3.6], 'M11.6 12H20m-3 0v3m-3-3v2.2'],
  shield: ['M12 3.2 19 6v5.6c0 4.3-3 7.6-7 9.2-4-1.6-7-4.9-7-9.2V6z'],
  search: [[10.5, 10.5, 5.6], 'm15 15 5 5'],
  nodes: [[6, 7, 2.3], [18, 7, 2.3], [12, 17.5, 2.3], 'M8.2 7.6h7.6M7.2 9.1l3.6 6.4m6-6.4-3.6 6.4'],
  flask: ['M9.5 3.5h5M10.4 3.5v5.4L5.6 17.6A2 2 0 0 0 7.4 20.5h9.2a2 2 0 0 0 1.8-2.9l-4.8-8.7V3.5M8 14.5h8'],
  check: ['m5.5 12.5 4.2 4.2 8.8-9.4'],
  alert: ['M12 3.8 21 19.5H3z', 'M12 10v4.2m0 2.6v.1'],
  doc: ['M6.5 3.5h7.5l4 4v13h-11.5z', 'M9.5 12h5m-5 3.5h5'],
};
function drawIcon(g: CanvasRenderingContext2D, name: IconName, cx: number, cy: number, size: number, color: string) {
  g.save();
  g.translate(cx - size / 2, cy - size / 2); g.scale(size / 24, size / 24);
  g.strokeStyle = color; g.lineWidth = name === 'check' ? 2.6 : 2.1; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const p of ICONS[name]) {
    if (typeof p === 'string') g.stroke(new Path2D(p));
    else { g.beginPath(); g.arc(p[0], p[1], p[2], 0, Math.PI * 2); g.stroke(); }
  }
  g.restore();
}

// ---------------------------------------------------------------- card front (= 2D card at the hand-off)
function cardBackground(g: CanvasRenderingContext2D, dark: boolean) {
  const W = CARD.w, H = CARD.h, p = ink(dark ? 'dark' : 'paper');
  // radial-gradient(115% 72% at 50% 20%, #FAF7F0, paper 50%, #E9E1D1)  /  (110% 70% at 50% 22%, #23252C, graphite 58%, #0E0F12)
  const rx = (dark ? 1.1 : 1.15) * W, ry = (dark ? 0.7 : 0.72) * H, cy = (dark ? 0.22 : 0.2) * H;
  g.fillStyle = dark ? '#0E0F12' : '#E9E1D1'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, cy); g.scale(1, ry / rx);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
  if (dark) { gr.addColorStop(0, '#23252C'); gr.addColorStop(0.58, C.graphite); gr.addColorStop(1, '#0E0F12'); }
  else { gr.addColorStop(0, '#FAF7F0'); gr.addColorStop(0.5, C.paper); gr.addColorStop(1, '#E9E1D1'); }
  g.fillStyle = gr; g.fillRect(-W, -H * 2, W * 3, H * 4);
  g.restore();
  // 40 px grid (lines at 40k - 1)
  g.fillStyle = p.grid;
  for (let x = 39; x < W; x += 40) g.fillRect(x, 0, 1, H);
  for (let y = 39; y < H; y += 40) g.fillRect(0, y, W, 1);
  // grain
  g.save(); g.globalAlpha = dark ? 0.05 : 0.13; g.globalCompositeOperation = dark ? 'screen' : 'multiply';
  g.fillStyle = g.createPattern(grainTile(), 'repeat') as CanvasPattern; g.fillRect(0, 0, W, H);
  g.restore();
}

function drawCardFront(card: BoardCard, scale: number) {
  const W = CARD.w, H = CARD.h, L = CARD;
  const cv = mk(W * scale, H * scale), g = ctx2d(cv);
  g.scale(scale, scale);
  const dark = card.dark, variant = dark ? 'dark' : 'paper', p = ink(variant), d = card.data;
  cardBackground(g, dark);
  // dash
  g.fillStyle = p.accent; g.fillRect(L.dash.x, L.dash.y, L.dash.w, L.dash.h);
  // counter: the 2D card shows the previous number until it ticks over on its first beat
  {
    const size = L.counter.size, n = caseNo(card.id), total = CASE_TOTAL;
    const text = `${pad2(n > 1 ? n - 1 : n)} / ${pad2(total)}`;
    const font = `600 ${size}px ${F.mono}`;
    g.font = font; g.fillStyle = p.accent; g.textBaseline = 'alphabetic';
    const adv = g.measureText('0').width + size * 0.2;
    const right = L.counter.right + size * 0.2;
    const by = baseline(g, font, L.counter.y, size);
    [...text].forEach((ch, i) => { if (ch !== ' ') g.fillText(ch, right - adv * (text.length - i), by); });
  }
  // numeral (cases) or the drawn check (checklist)
  if (d.rows?.length) {
    const s = L.numeral.size, w = s * 0.92, h = s * 0.8, k = Math.min(w / 100, h / 86);
    g.save(); g.translate(L.numeral.x + 4 + (w - 100 * k) / 2, L.numeral.y + s * 0.1 + (h - 86 * k) / 2); g.scale(k, k);
    g.strokeStyle = dark ? C.mintSoft : C.mint; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
    g.stroke(new Path2D('M8 46 L38 74 L94 10')); g.restore();
  } else {
    const s = L.numeral.size, text = d.numeral ?? pad2(d.n ?? card.segIdx + 1), font = `400 ${s}px ${F.serif}`;
    g.save(); g.beginPath(); g.rect(L.numeral.x - 20, L.numeral.y, 400, s * 0.92); g.clip();
    g.font = font; g.letterSpacing = `${-0.02 * s}px`; g.fillStyle = C.alert;
    g.fillText(text, L.numeral.x, baseline(g, font, L.numeral.y, s * 0.92));
    g.restore(); g.letterSpacing = '0px';
  }
  // kicker: icon disc + mono line
  {
    const K = L.kicker, r = K.icon / 2;
    g.fillStyle = dark ? C.alert : C.ink; g.beginPath(); g.arc(K.x + r, K.y + r, r, 0, Math.PI * 2); g.fill();
    drawIcon(g, iconFor(d), K.x + r, K.y + r, K.icon * 0.62, dark ? C.graphite : C.paper);
    const tx = K.x + K.icon + Math.round(K.icon * 0.42);
    const fs = fitSize(d.kicker, L.counter.right - tx, K.size, TYPE.mono, K.size * 0.7);
    const font = `${TYPE.mono.weight} ${fs}px ${F.mono}`;
    g.font = font; g.letterSpacing = `${TYPE.mono.tracking * fs}px`; g.fillStyle = dark ? '#B5BAC5' : C.ink2;
    g.fillText(d.kicker, tx, baseline(g, font, K.y + K.icon / 2 - fs / 2, fs));
    g.letterSpacing = '0px';
  }
  // headline (card builder's balanced line breaks)
  {
    const Hd = L.headline, { size, lines } = headlineLayout(d.headline, Hd);
    const font = `${TYPE.head.weight} ${size}px ${F.head}`;
    g.font = font; g.letterSpacing = `${TYPE.head.tracking * size}px`; g.wordSpacing = `${TYPE.head.ws * size}px`; g.fillStyle = p.text;
    lines.forEach((line, i) => g.fillText(line, Hd.x, baseline(g, font, Hd.y + i * size * Hd.lh, size * Hd.lh)));
    g.letterSpacing = '0px'; g.wordSpacing = '0px';
  }
  return cv;
}

/** media-window placeholder + chip outlines: a separate overlay that fades out before the hand-off (the 2D card builds those in later) */
function drawDetail(dark: boolean) {
  const L = CARD, cv = mk(L.w / 2, L.h / 2), g = ctx2d(cv);
  g.scale(0.5, 0.5);
  const m = L.media;
  g.save(); roundRect(g, m.x, m.y, m.w, m.h, m.r); g.clip();
  g.fillStyle = dark ? C.graphite2 : '#E6DFD1'; g.fillRect(m.x, m.y, m.w, m.h);
  g.strokeStyle = dark ? 'rgba(236,239,244,0.045)' : 'rgba(18,18,18,0.05)'; g.lineWidth = 2.5;
  for (let x = m.x - m.h; x < m.x + m.w; x += 18) { g.beginPath(); g.moveTo(x, m.y + m.h); g.lineTo(x + m.h, m.y); g.stroke(); }
  g.restore();
  roundRect(g, m.x + 0.75, m.y + 0.75, m.w - 1.5, m.h - 1.5, m.r); g.lineWidth = 2;
  g.strokeStyle = dark ? 'rgba(236,239,244,0.18)' : 'rgba(18,18,18,0.42)'; g.stroke();
  const Cp = L.chips, tw = (L.w - L.body.x * 2 - Cp.gap) / 2;
  for (let i = 0; i < 2; i++) {
    const x = Cp.x + i * (tw + Cp.gap);
    roundRect(g, x, Cp.y, tw, Cp.h, 14);
    g.fillStyle = dark ? 'rgba(236,239,244,0.05)' : 'rgba(255,253,247,0.55)'; g.fill();
    g.lineWidth = 1.5; g.strokeStyle = dark ? 'rgba(236,239,244,0.14)' : 'rgba(18,18,18,0.16)'; g.stroke();
    g.fillStyle = C.alert; g.fillRect(x, Cp.y + 8, 4, Cp.h - 16);
  }
  return cv;
}

function drawCardBack(dark: boolean) {
  const cv = mk(540, 960), g = ctx2d(cv);
  g.fillStyle = dark ? '#1C1E23' : '#E6DDCB'; g.fillRect(0, 0, 540, 960);
  g.save(); g.globalAlpha = dark ? 0.06 : 0.16; g.globalCompositeOperation = dark ? 'screen' : 'multiply';
  g.fillStyle = g.createPattern(grainTile(), 'repeat') as CanvasPattern; g.fillRect(0, 0, 540, 960); g.restore();
  g.strokeStyle = dark ? 'rgba(236,239,244,0.08)' : 'rgba(60,45,20,0.10)'; g.lineWidth = 2; g.strokeRect(22, 22, 496, 916);
  return cv;
}

// ---------------------------------------------------------------- materials' detail maps
/** tileable paper fibre height map (bump) */
function drawFibre() {
  const s = 512, cv = mk(s, s), g = ctx2d(cv), r = mulberry32(77);
  const img = g.createImageData(s, s);
  for (let i = 0; i < s * s; i++) { const v = 128 + (r() - 0.5) * 34; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0);
  g.lineCap = 'round';
  for (let i = 0; i < 3400; i++) {
    const x = r() * s, y = r() * s, a = r() * Math.PI, len = 4 + r() * 22, bend = (r() - 0.5) * 8;
    const light = r() < 0.55;
    g.strokeStyle = light ? `rgba(255,255,255,${0.1 + r() * 0.25})` : `rgba(0,0,0,${0.08 + r() * 0.18})`;
    g.lineWidth = 0.6 + r() * 1.3;
    const dx = Math.cos(a) * len, dy = Math.sin(a) * len;
    for (const ox of [-s, 0, s]) for (const oy of [-s, 0, s]) {
      const X = x + ox, Y = y + oy;
      if (X + Math.abs(dx) < -2 || X - Math.abs(dx) > s + 2 || Y + Math.abs(dy) < -2 || Y - Math.abs(dy) > s + 2) continue;
      g.beginPath(); g.moveTo(X - dx / 2, Y - dy / 2); g.quadraticCurveTo(X + bend, Y - bend, X + dx / 2, Y + dy / 2); g.stroke();
    }
  }
  return cv;
}

/** periodic value noise for the board */
function vnoise(x: number, y: number, p: number, seed: number) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const h = (i: number, j: number) => { let n = (((i % p) + p) % p) * 374761393 + (((j % p) + p) % p) * 668265263 + seed * 2246822519; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v;
}
/** dark cork-and-felt board tile (colour; also its own bump map): soft mottling, fine cork granules, felt fibres */
function drawFelt() {
  const s = 1024, cv = mk(s, s), g = ctx2d(cv), r = mulberry32(9), img = g.createImageData(s, s);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const lo = vnoise((x * 5) / s, (y * 5) / s, 5, 1) * 0.6 + vnoise((x * 14) / s, (y * 14) / s, 14, 2) * 0.4;
    const v = 0.84 + 0.3 * (lo - 0.5) + 0.07 * (r() - 0.5);
    const i = (y * s + x) * 4;
    img.data[i] = 31 * v; img.data[i + 1] = 27.5 * v; img.data[i + 2] = 25 * v; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < 52000; i++) {                            // cork granules
    const x = r() * s, y = r() * s, rad = 0.5 + Math.pow(r(), 2.2) * 2.2, light = r() < 0.5;
    g.fillStyle = light ? `rgba(78,64,50,${0.18 + r() * 0.32})` : `rgba(6,5,4,${0.25 + r() * 0.4})`;
    g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
  }
  g.lineCap = 'round';
  for (let i = 0; i < 9000; i++) {                             // felt fibres
    const x = r() * s, y = r() * s, a = r() * Math.PI * 2, len = 2 + r() * 7;
    g.strokeStyle = r() < 0.5 ? `rgba(96,86,78,${0.05 + r() * 0.07})` : `rgba(0,0,0,${0.07 + r() * 0.08})`;
    g.lineWidth = 0.5 + r() * 0.7;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
  }
  return cv;
}

/** SECRETS · ROTATE rubber-stamp impression: orange ink, double border, uneven pressure, knocked-out specks */
function drawStamp() {
  const W = 1400, H = Math.round(1400 * STAMP.h / STAMP.w), cv = mk(W, H), g = ctx2d(cv), r = mulberry32(31);
  const ink = '#E8501A';
  g.strokeStyle = ink; g.fillStyle = ink;
  g.lineWidth = 16; roundRect(g, 14, 14, W - 28, H - 28, 26); g.stroke();
  g.lineWidth = 5; roundRect(g, 40, 40, W - 80, H - 80, 14); g.stroke();
  let fs = H * 0.5;
  g.font = `900 ${fs}px ${F.head}`; (g as CanvasRenderingContext2D & { fontStretch: string }).fontStretch = 'condensed';
  g.letterSpacing = `${fs * 0.04}px`;
  while (g.measureText(STAMP.text).width > W - 170 && fs > 40) { fs -= 4; g.font = `900 ${fs}px ${F.head}`; g.letterSpacing = `${fs * 0.04}px`; }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(STAMP.text, W / 2, H / 2 + fs * 0.04);
  g.letterSpacing = '0px';
  // uneven pressure (more ink at the lower-left, starved at the upper-right) + knocked-out specks
  g.globalCompositeOperation = 'destination-out';
  const pr = g.createLinearGradient(0, H, W, 0); pr.addColorStop(0, 'rgba(0,0,0,0.02)'); pr.addColorStop(0.6, 'rgba(0,0,0,0.12)'); pr.addColorStop(1, 'rgba(0,0,0,0.34)');
  g.fillStyle = pr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) {
    const x = r() * W, y = r() * H, rad = r() < 0.92 ? 0.6 + r() * 2.2 : 3 + r() * 6;
    g.fillStyle = `rgba(0,0,0,${0.35 + r() * 0.65})`;
    g.beginPath(); g.ellipse(x, y, rad * (0.6 + r()), rad, r() * Math.PI, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 26; i++) {                                // dry streaks
    const y = r() * H, x = r() * W, len = 40 + r() * 220;
    g.fillStyle = `rgba(0,0,0,${0.18 + r() * 0.3})`; g.fillRect(x, y, len, 1 + r() * 2.5);
  }
  g.globalCompositeOperation = 'source-over';
  return cv;
}

function drawShadow() {
  const s = 256, cv = mk(s, s), g = ctx2d(cv);
  g.filter = 'blur(20px)'; g.fillStyle = '#000'; g.fillRect(44, 44, s - 88, s - 88);
  return cv;
}
function drawRadial(stops: [number, string][], s = 128) {
  const cv = mk(s, s), g = ctx2d(cv), gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
  return cv;
}

// ---------------------------------------------------------------- receipt prints
/** a real receipt PNG mounted on a photo print with a white border and its SOURCE line (image itself unedited) */
function drawPrint(img: CanvasImageSource & { width: number; height: number }, source: string) {
  const maxW = 1500, sc = Math.min(1, maxW / img.width), iw = Math.round(img.width * sc), ih = Math.round(img.height * sc);
  const b = 24, strip = 46, W = iw + b * 2, H = ih + b + strip;
  const cv = mk(W, H), g = ctx2d(cv);
  g.fillStyle = '#F4F1EA'; g.fillRect(0, 0, W, H);
  g.drawImage(img, b, b, iw, ih);
  g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 1; g.strokeRect(b - 0.5, b - 0.5, iw + 1, ih + 1);
  g.font = `600 22px ${F.mono}`; g.letterSpacing = '1px'; g.fillStyle = '#4A463E'; g.textBaseline = 'middle';
  g.fillText(`SOURCE: ${source}`, b, ih + b + strip / 2);
  return cv;
}
function drawBlankPrint() {
  const W = 900, H = 300, cv = mk(W, H), g = ctx2d(cv);
  g.fillStyle = '#F2EFE8'; g.fillRect(0, 0, W, H);
  const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#E4E0D8'); gr.addColorStop(1, '#D9D4CA');
  g.fillStyle = gr; g.fillRect(22, 22, W - 44, H - 66);
  return cv;
}

// ---------------------------------------------------------------- loading
let cache: BoardAssets | null = null;
let pending: Promise<BoardAssets> | null = null;
const FONT_SPECS = [`${TYPE.head.weight} 40px Archivo`, `400 40px "Instrument Serif"`, `500 20px "JetBrains Mono"`, `600 20px "JetBrains Mono"`, `900 40px Archivo`];

async function build(): Promise<BoardAssets> {
  await Promise.all(FONT_SPECS.map((s) => document.fonts.load(s).catch(() => [])));
  await document.fonts.ready;
  const fronts = BOARD_CARDS.map((c) => tex(drawCardFront(c, c.k === 0 ? 1.5 : 1)));
  const backs = BOARD_CARDS.map((c) => tex(drawCardBack(c.dark)));
  const loader = new THREE.TextureLoader();
  const spots: PrintSpot[] = BOARD_CARDS.flatMap((c) => c.prints);
  const prints: Record<string, PrintTex> = {};
  const blank = drawBlankPrint();
  await Promise.all(spots.map(async (s) => {
    if (s.file) {
      try {
        const t = await loader.loadAsync(staticFile(s.file));
        const img = t.image as HTMLImageElement;
        const cv = drawPrint(img, s.source);
        t.dispose();
        prints[s.key] = { tex: tex(cv), aspect: cv.width / cv.height, blank: false };
        return;
      } catch (e) { console.warn('receipt failed', s.file, e); }
    }
    prints[s.key] = { tex: tex(blank), aspect: blank.width / blank.height, blank: true };
  }));
  const fibre = tex(drawFibre(), false, true);
  const felt = tex(drawFelt(), true, true);
  return {
    fronts, backs, detail: { paper: tex(drawDetail(false)), dark: tex(drawDetail(true)) }, prints, fibre, felt,
    stamp: tex(drawStamp()), shadow: tex(drawShadow()),
    dot: tex(drawRadial([[0, 'rgba(0,0,0,1)'], [0.45, 'rgba(0,0,0,0.55)'], [1, 'rgba(0,0,0,0)']], 64)),
    glow: tex(drawRadial([[0, 'rgba(255,255,255,1)'], [0.18, 'rgba(255,255,255,0.55)'], [0.5, 'rgba(255,255,255,0.12)'], [1, 'rgba(255,255,255,0)']])),
  };
}

/** board textures; holds the render until they exist (first mount only) */
export function useBoardAssets() {
  const [a, setA] = useState<BoardAssets | null>(cache);
  const [handle] = useState(() => (cache ? null : delayRender('case board textures', { timeoutInMilliseconds: 110000 })));
  useEffect(() => {
    if (cache) { setA(cache); if (handle !== null) continueRender(handle); return; }
    (pending ??= build()).then((x) => { cache = x; setA(x); if (handle !== null) continueRender(handle); })
      .catch((e) => cancelRender(e));
  }, [handle]);
  return a;
}
