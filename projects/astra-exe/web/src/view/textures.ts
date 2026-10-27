// Procedural textures, drawn once on canvases with a fixed seed (no image files, no third-party art).
// The ornament is original: vine scrolls, lotus petals, beads and an abstract script-like band (strokes under a
// headline bar, inspired by the look of Indic scripts). It is not real lettering and spells nothing.
import * as THREE from 'three';
import { mulberry32 } from '../core/noise';

const canvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')!] as const; };
const tex = (c: HTMLCanvasElement, srgb: boolean, repeat = false) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; else { t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.RepeatWrapping; }
  t.needsUpdate = true;
  return t;
};

/** One abstract "glyph": a few strokes hanging from a headline bar. */
function glyph(c: CanvasRenderingContext2D, x: number, top: number, s: number, r: () => number) {
  const k = Math.floor(r() * 6);
  c.beginPath();
  // a stem on the right (most glyphs), then one of a few bowl / hook / loop shapes on its left
  if (k !== 5) { c.moveTo(x + s * 0.8, top); c.lineTo(x + s * 0.8, top + s * 1.25); }
  if (k === 0 || k === 3) { c.moveTo(x + s * 0.8, top + s * 0.55); c.bezierCurveTo(x - s * 0.15, top + s * 0.2, x - s * 0.2, top + s * 1.1, x + s * 0.55, top + s * 0.95); }
  if (k === 1) { c.moveTo(x + s * 0.15, top); c.bezierCurveTo(x - s * 0.2, top + s * 0.5, x + s * 0.3, top + s * 0.9, x + s * 0.8, top + s * 0.7); }
  if (k === 2) { c.moveTo(x + s * 0.45, top + s * 0.62); c.arc(x + s * 0.35, top + s * 0.62, s * 0.22, 0, Math.PI * 2); }
  if (k === 4) { c.moveTo(x + s * 0.1, top + s * 0.25); c.quadraticCurveTo(x + s * 0.5, top + s * 0.55, x + s * 0.1, top + s * 0.95); c.lineTo(x + s * 0.8, top + s * 0.95); }
  if (k === 5) { c.moveTo(x + s * 0.4, top); c.bezierCurveTo(x + s * 1.1, top + s * 0.4, x - s * 0.3, top + s * 0.8, x + s * 0.5, top + s * 1.2); }
  if (r() < 0.35) { c.moveTo(x + s * 0.8, top); c.quadraticCurveTo(x + s * 1.0, top - s * 0.45, x + s * 0.45, top - s * 0.4); }
  c.stroke();
}

/** A band of glyphs under a continuous headline bar, from x0 to x1 (canvas units). */
function glyphBand(c: CanvasRenderingContext2D, x0: number, x1: number, top: number, s: number, seed: number) {
  const r = mulberry32(seed);
  c.beginPath(); c.moveTo(x0, top); c.lineTo(x1, top); c.stroke();
  for (let x = x0 + s * 0.2; x < x1 - s; x += s * (1.05 + r() * 0.3)) glyph(c, x, top, s, r);
}

function lotus(c: CanvasRenderingContext2D, x: number, y: number, s: number, fill: string, line: string) {
  c.save(); c.translate(x, y);
  for (const [a, k] of [[0, 1], [-0.55, 0.78], [0.55, 0.78], [-1.05, 0.56], [1.05, 0.56]] as const) {
    c.save(); c.rotate(a); c.beginPath();
    c.moveTo(0, 0); c.bezierCurveTo(-s * 0.32 * k, -s * 0.35 * k, -s * 0.2 * k, -s * 0.85 * k, 0, -s * k);
    c.bezierCurveTo(s * 0.2 * k, -s * 0.85 * k, s * 0.32 * k, -s * 0.35 * k, 0, 0);
    c.fillStyle = fill; c.fill(); c.strokeStyle = line; c.stroke(); c.restore();
  }
  c.restore();
}

export interface GoldMaps { map: THREE.Texture; emissive: THREE.Texture; rough: THREE.Texture; bump: THREE.Texture }

/** Limb ornament, u along the limb (riser -> tip), v around it (belly at 0.25, back at 0.75, edges at 0 and 0.5). */
export function limbMaps(): GoldMaps {
  const W = 2048, H = 256;
  const [cm, m] = canvas(W, H), [ce, e] = canvas(W, H), [cr, r] = canvas(W, H), [cb, b] = canvas(W, H);
  // base: warm gold with soft lengthwise sheen bands
  const g = m.createLinearGradient(0, 0, 0, H);
  for (const [s, col] of [[0, '#b37a24'], [0.12, '#e8b550'], [0.25, '#f4cd6c'], [0.38, '#e2ab47'], [0.5, '#a8711f'], [0.62, '#dda245'], [0.75, '#efc25e'], [0.88, '#d9a043'], [1, '#b37a24']] as const) g.addColorStop(s, col);
  m.fillStyle = g; m.fillRect(0, 0, W, H);
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  r.fillStyle = '#383838'; r.fillRect(0, 0, W, H);      // polished: roughness ~0.22
  b.fillStyle = '#808080'; b.fillRect(0, 0, W, H);
  const line = (ctx: CanvasRenderingContext2D, col: string, w: number) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; };
  const both = (fn: (ctx: CanvasRenderingContext2D, which: 'm' | 'r' | 'b') => void) => { fn(m, 'm'); fn(r, 'r'); fn(b, 'b'); };
  const ink = { m: '#4a2d0c', r: '#a0a0a0', b: '#303030' } as const;
  for (const band of [0.25, 0.75]) {
    const cy = band * H, hw = 0.11 * H;
    both((ctx, w) => {
      // borders and a running vine scroll with spiral curls
      line(ctx, ink[w], 3); ctx.beginPath(); ctx.moveTo(0, cy - hw); ctx.lineTo(W, cy - hw); ctx.moveTo(0, cy + hw); ctx.lineTo(W, cy + hw); ctx.stroke();
      line(ctx, ink[w], 2.4); ctx.beginPath();
      for (let x = 0; x <= W; x += 4) { const y = cy + Math.sin((x / W) * Math.PI * 2 * 9) * hw * 0.55; if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
      for (let k = 0; k < 18; k++) {
        const x = ((k + 0.25) / 18) * W, up = k % 2 === 0 ? -1 : 1, y = cy + up * hw * 0.55;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 3.2; a += 0.15) { const rr = 2 + a * 3.1, px = x + Math.cos(a) * rr * 1.2, py = y - up * (hw * 0.1) + Math.sin(a) * rr * up; if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
        ctx.stroke();
      }
    });
    // the energy channel: a glowing line down the band's centre, with diamond nodes
    e.strokeStyle = '#ffe9b0'; e.lineWidth = 3.2; e.beginPath(); e.moveTo(20, cy); e.lineTo(W - 20, cy); e.stroke();
    e.fillStyle = '#fff4d4';
    for (let k = 1; k < 16; k++) { const x = (k / 16) * W; e.beginPath(); e.moveTo(x - 9, cy); e.lineTo(x, cy - 7); e.lineTo(x + 9, cy); e.lineTo(x, cy + 7); e.closePath(); e.fill(); }
  }
  // lotus medallions at mid-limb on both faces
  for (const band of [0.25, 0.75]) for (const u of [0.48]) {
    lotus(m, u * W, band * H + 18, 30, '#f7d27a', '#4a2d0c');
    lotus(e, u * W, band * H + 18, 30, '#7a5520', '#ffe6a0');
  }
  // edges: beads
  for (const ev of [0, 0.5, 1]) {
    for (let x = 6; x < W; x += 14) {
      m.fillStyle = '#ffe08a'; m.beginPath(); m.arc(x, ev * H, 4, 0, Math.PI * 2); m.fill();
      b.fillStyle = '#d0d0d0'; b.beginPath(); b.arc(x, ev * H, 4, 0, Math.PI * 2); b.fill();
    }
  }
  // abstract script band near the riser on the belly, glowing
  for (const ctx of [m, e] as const) {
    ctx.strokeStyle = ctx === m ? '#4a2d0c' : '#ffd98a'; ctx.lineWidth = ctx === m ? 2.6 : 2.2; ctx.lineCap = 'round';
    glyphBand(ctx, 0.05 * W, 0.34 * W, 0.25 * H - 13, 16, 41);
    glyphBand(ctx, 0.62 * W, 0.9 * W, 0.75 * H - 13, 16, 43);
  }
  return { map: tex(cm, true), emissive: tex(ce, true), rough: tex(cr, false), bump: tex(cb, false) };
}

/** Polished dark wood for the grip, with gold inlay lines. */
export function woodMaps() {
  const W = 512, H = 512;
  const [c, x] = canvas(W, H);
  x.fillStyle = '#24130c'; x.fillRect(0, 0, W, H);
  const r = mulberry32(5);
  for (let i = 0; i < 160; i++) {
    const y0 = r() * H, a = 3 + r() * 10, f = 1 + r() * 3, ph = r() * 6;
    x.strokeStyle = `rgba(${70 + r() * 50},${36 + r() * 20},${18 + r() * 10},${0.25 + r() * 0.35})`; x.lineWidth = 0.6 + r() * 2;
    x.beginPath(); for (let xx = 0; xx <= W; xx += 8) { const y = y0 + Math.sin((xx / W) * Math.PI * 2 * f + ph) * a; if (xx === 0) x.moveTo(xx, y); else x.lineTo(xx, y); } x.stroke();
  }
  x.strokeStyle = '#e7b552'; x.lineWidth = 5;
  for (const y of [0.08, 0.92]) { x.beginPath(); x.moveTo(0, y * H); x.lineTo(W, y * H); x.stroke(); }
  x.lineWidth = 2;
  for (let k = 0; k < 8; k++) { const y = (0.2 + k * 0.085) * H; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(W * 0.3, y - 14, W * 0.7, y + 14, W, y); x.stroke(); }
  const t = tex(c, true, true);
  return t;
}

/** The halo's glyph ring (alpha + emissive in one: white strokes on black). */
export function haloMap() {
  const W = 2048, H = 96;
  const [c, x] = canvas(W, H);
  x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
  x.strokeStyle = '#fff'; x.lineWidth = 3.2; x.lineCap = 'round';
  glyphBand(x, 10, W - 10, 26, 34, 77);
  x.lineWidth = 2; x.beginPath(); x.moveTo(0, 6); x.lineTo(W, 6); x.moveTo(0, H - 6); x.lineTo(W, H - 6); x.stroke();
  for (let k = 0; k < 64; k++) { x.beginPath(); x.arc((k + 0.5) * (W / 64), H - 14, 2.6, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill(); }
  const t = tex(c, true);
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

/** The altar's top: stone with a gold lotus inlay; emissive map separately. */
export function altarMaps() {
  const S = 1024;
  const [cm, m] = canvas(S, S), [ce, e] = canvas(S, S);
  const r = mulberry32(9);
  m.fillStyle = '#2b2a31'; m.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) { m.fillStyle = `rgba(${90 + r() * 60},${86 + r() * 50},${96 + r() * 50},${r() * 0.12})`; m.fillRect(r() * S, r() * S, 2 + r() * 10, 2 + r() * 10); }
  e.fillStyle = '#000'; e.fillRect(0, 0, S, S);
  const C = S / 2;
  for (const ctx of [m, e]) {
    ctx.save(); ctx.translate(C, C);
    ctx.strokeStyle = ctx === m ? '#c89436' : '#ffcf70'; ctx.lineWidth = ctx === m ? 7 : 5;
    for (const rr of [0.46, 0.43, 0.2]) { ctx.beginPath(); ctx.arc(0, 0, rr * S, 0, Math.PI * 2); ctx.stroke(); }
    for (let k = 0; k < 16; k++) {
      ctx.save(); ctx.rotate((k / 16) * Math.PI * 2);
      ctx.beginPath(); ctx.moveTo(0, -0.2 * S); ctx.bezierCurveTo(-0.07 * S, -0.27 * S, -0.05 * S, -0.39 * S, 0, -0.42 * S); ctx.bezierCurveTo(0.05 * S, -0.39 * S, 0.07 * S, -0.27 * S, 0, -0.2 * S); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
  lotus(m, C, C + 60, 110, '#d9a443', '#5a3a12');
  lotus(e, C, C + 60, 110, '#5a3a12', '#ffd27a');
  return { map: tex(cm, true, true), emissive: tex(ce, true, true) };
}
