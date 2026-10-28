// The world of the film: a GPU's KV-cache pool seen as a lit floor of memory pages, drawn on a canvas through a pinhole
// camera. One page = one tile. Diagram of the mechanism in FACTS.md (F5-F9), not Cloudflare's UI.
//   violet tiles  = pages left by other users' earlier requests (stale data)
//   blue tiles    = User A's very long prompt filling the pool, then spilling past its edge (rows above the pool)
//   coral tiles   = stale pages the decode head reads after the rejected request (the leak)
//   mint sweep    = the fix: pool made 3x bigger (681,280 -> ~2.04M tokens), stale pages retired
// Pure function of the frame: camera and tile states are computed from the scene timings and word cues only.
import React, { useLayoutEffect, useRef } from 'react';
import { useCurrentFrame } from 'remotion';
import { clamp, invLerp, lerp } from '../lib/anim';
import { hash } from '../lib/rng';
import { wf } from '../lib/words';
import { C, FONT, FPS, H, SEGS, W, inout, land } from './kit';

// ---------------------------------------------------------------- floor geometry (world units)
const COLS = [-10, 9], ROWS = 70, PX = 1.15, PZ = 0.75, TW = 1.0, TD = 0.58;
const POOL_C0 = -6, POOL_C1 = 5, POOL_R0 = 4, POOL_TOP = 23, CTX_TOP = 34, FIX_TOP = 63;   // 12 x 20 = 240 pages = 681,280 tokens
/** film times of the main events, for the cover */
export const EVENTS = () => T;
export const POOL = { cols: 12, rows: POOL_TOP - POOL_R0 + 1, ctxRows: CTX_TOP - POOL_R0 + 1, fixRows: FIX_TOP - POOL_R0 + 1 };
const inPoolCols = (c: number) => c >= POOL_C0 && c <= POOL_C1;
const pageIdx = (c: number, r: number) => (r - POOL_R0) * 12 + (c - POOL_C0);

/** owners of the stale pages: runs of 6-26 pages per earlier request, all "other users" (violet family) */
const RUNS: number[] = (() => {
  const out: number[] = []; let i = 0, req = 0;
  while (i < 900) { const n = 6 + Math.floor(hash(req, 7) * 21); for (let k = 0; k < n; k++) out.push(req); i += n; req++; }
  return out;
})();
const VIOLETS = ['#8057F5', '#9B7BF7', '#6D47E0', '#A98DF8', '#7E5CEB'];
const TOKS = ['tok', 'kv', 'pg', 'ctx', 'att', 'seq', 'pos', 'hd', 'lyr', 'req', 'id', 'blk'];

// ---------------------------------------------------------------- time anchors (seconds), all from the voice
const S = (id: string) => SEGS.find((s) => s.id === id)!;
const w = (line: string, word: string, nth = 0) => wf(line, word, nth) / FPS;
const T = {
  tokens0: S('tokens').start, tokens1: S('tokens').end,
  fill681: w('l04', '6'), pool0: S('pool').start, small: w('l05', 'chhota'),
  reject: w('l06', 'reject'), read0: w('l06', 'phir'), read1: w('l06', 'rahi,') + 0.45,
  bada: w('l07', 'bada'), patch: w('l07', 'patch'), fix: w('l07', 'fix'), fixed0: S('fixed').start,
  noex: S('noexploit').start,
};

// ---------------------------------------------------------------- camera per scene (eased from the previous scene's end)
interface Cam { x: number; y: number; z: number; pitch: number; yaw: number; drift: number; wash: number }
const CAM: Record<string, Cam> = {
  hook:      { x: 0.0, y: 7.5, z: -9, pitch: 26, yaw: -6, drift: 1.6, wash: 0.45 },
  hook2:     { x: 0.6, y: 8.0, z: -8, pitch: 28, yaw: 3, drift: 0.67, wash: 0.55 },
  hook3:     { x: -0.6, y: 8.5, z: -7, pitch: 30, yaw: -4, drift: 0.67, wash: 0.55 },
  source:    { x: 1.0, y: 8.5, z: -8, pitch: 30, yaw: 4, drift: 0.67, wash: 0.62 },
  model:     { x: -1.0, y: 9.0, z: -7, pitch: 32, yaw: -4, drift: 0.67, wash: 0.62 },
  window:    { x: 0.5, y: 10, z: -6, pitch: 34, yaw: 3, drift: 0.6, wash: 0.62 },
  count:     { x: -0.4, y: 11, z: -6, pitch: 38, yaw: 0, drift: 0.6, wash: 0.6 },
  tokens:    { x: -0.4, y: 9, z: -8.5, pitch: 34, yaw: 0, drift: 1.5, wash: 0.0 },
  pool:      { x: -0.4, y: 30, z: -6, pitch: 58, yaw: 0, drift: 0.15, wash: 0.0 },
  bug:       { x: -0.4, y: 26, z: -5, pitch: 56, yaw: 0, drift: 0.15, wash: 0.82 },
  stale:     { x: -0.4, y: 16, z: -2, pitch: 54, yaw: 0, drift: 0.53, wash: 0.0 },
  recon:     { x: -0.4, y: 14, z: -1, pitch: 50, yaw: 0, drift: 0.45, wash: 0.55 },
  patch:     { x: -0.4, y: 38, z: -21, pitch: 47, yaw: 0, drift: 0.15, wash: 0.0 },
  fixed:     { x: -0.4, y: 36, z: -20, pitch: 47, yaw: 0, drift: 0.45, wash: 0.25 },
  noexploit: { x: 0.0, y: 12, z: -8, pitch: 32, yaw: -3, drift: 0.6, wash: 0.55 },
  devs:      { x: 0.0, y: 10, z: -7, pitch: 30, yaw: 3, drift: 0.6, wash: 0.6 },
  cta:       { x: 0.0, y: 9, z: -6, pitch: 28, yaw: 0, drift: 1.2, wash: 0.55 },
};
/** the patch scene holds close on the exposed pages through the breath, then pulls out on "bada" to show the pool grow */
const PATCH_NEAR: Cam = { x: -0.4, y: 15, z: -2, pitch: 52, yaw: 0, drift: 0.3, wash: 0.0 };
const mix = (a: Cam, b: Cam, u: number): Cam => {
  const o = { ...a }; (Object.keys(a) as (keyof Cam)[]).forEach((k) => { o[k] = lerp(a[k], b[k], u); }); return o;
};
/** camera at time t: each scene eases from where the previous one ended (0.8 s), then drifts forward */
function camAt(t: number): Cam {
  let prev = { ...CAM.hook, z: CAM.hook.z };
  for (const s of SEGS) {
    const far = CAM[s.id], d = s.end - s.start;
    const at = (tt: number) => {
      const target = s.id === 'patch' ? mix(PATCH_NEAR, far, inout(clamp((s.start + tt - T.bada + 0.3) / 1.4))) : far;
      const u = inout(clamp(tt / 0.8)); const c = mix(prev, target, u);
      c.z += target.drift * tt; return c;
    };
    if (t < s.end) return at(Math.max(0, t - s.start));
    prev = at(d);
  }
  return prev;
}

// ---------------------------------------------------------------- tile states
interface Look { fill: string; a: number; edge?: string; ew?: number; glow?: number; tok?: boolean }
const poolTop = (t: number) => (t < T.bada ? POOL_TOP : Math.round(lerp(POOL_TOP, FIX_TOP, inout(invLerp(T.bada, T.bada + 1.3, t)))));
/** User A's prompt fill (pages) during the tokens scene: reaches 240 (the pool) on "6 lakh", keeps going to 372 */
const fillAt = (t: number) => {
  if (t < T.tokens0 + 0.3) return 0;
  const k1 = 240 * clamp((t - T.tokens0 - 0.3) / (T.fill681 - T.tokens0 - 0.3));
  const k2 = t > T.fill681 ? (372 - 240) * land(invLerp(T.fill681, T.fill681 + 1.6, t)) : 0;
  return k1 + k2;
};

function look(c: number, r: number, t: number): Look {
  const base: Look = { fill: '#FFFFFF', a: 0.9 };
  if (!inPoolCols(c) || r < POOL_R0) return base;
  const top = poolTop(t), i = pageIdx(c, r), inside = r <= top, h = hash(c, r);
  const owner = RUNS[i], vio = VIOLETS[owner % VIOLETS.length];
  // the fix: stale pages retired by a mint sweep (rows wiped from the bottom), then a mint wash on "fix"
  const sweepRow = POOL_R0 + (T.patch < t ? (t - T.patch) / 1.1 * (FIX_TOP - POOL_R0 + 4) : -1);
  if (t >= T.patch && r <= sweepRow) {
    const wash = t >= T.fix ? Math.exp(-(t - T.fix) / 0.6) : 0;
    const edgeRow = Math.abs(r - sweepRow) < 1.6;
    return { fill: edgeRow ? C.mint : wash > 0.02 ? C.mint : '#FFFFFF', a: edgeRow ? 0.95 : wash > 0.02 ? 0.25 + 0.6 * wash : 0.95, edge: C.mint, ew: inside ? 1.4 : 0, tok: false };
  }
  if (!inside) {
    // above the pool: only User A's overflow (rows beyond 681,280 tokens), rejected
    const n = fillAt(t);
    if (i < n && t < T.reject + 0.4) {
      const gone = clamp((t - T.reject) / 0.4);
      return { fill: C.blue, a: 0.55 * (1 - gone), edge: C.mango, ew: 2.5, tok: true };
    }
    return base;
  }
  // inside the pool
  let fill = vio, a = 0.30 + 0.18 * h, tok = true, edge: string | undefined, ew = 0, glow = 0;
  const n = fillAt(t);
  if (t >= T.tokens0 && i < n && t < T.reject + 0.5) {          // User A's prompt pages
    const gone = clamp((t - T.reject) / 0.5);
    fill = C.blue; a = lerp(0.85, 0.30 + 0.18 * h, gone); if (gone > 0.5) fill = vio;
  }
  if (t >= T.read0 && t < T.patch + 3) {                         // the decode head reads stale pages -> exposed
    const head = POOL_R0 + (t - T.read0) / (T.read1 - T.read0) * (POOL_TOP - POOL_R0 + 1);
    const read = r < head && hash(c, r, 3) < 0.42;
    if (read) { fill = C.coral; a = 0.9; glow = Math.max(0, 1 - (head - r) / 3); }
    if (Math.abs(r - head) < 0.8) { edge = C.cyan; ew = 3; }
  }
  return { fill, a, edge, ew, glow, tok };
}

// ---------------------------------------------------------------- projection
function project(cam: Cam, X: number, Z: number) {
  const yaw = (cam.yaw * Math.PI) / 180, p = (cam.pitch * Math.PI) / 180;
  let dx = X - cam.x, dz = Z - cam.z; const dy = -cam.y;
  const rx = dx * Math.cos(yaw) - dz * Math.sin(yaw), rz = dx * Math.sin(yaw) + dz * Math.cos(yaw); dx = rx; dz = rz;
  const zc = dy * -Math.sin(p) + dz * Math.cos(p), yc = dy * Math.cos(p) + dz * Math.sin(p);
  const F = 1500;
  return { x: W / 2 + (F * dx) / zc, y: H * 0.46 - (F * yc) / zc, zc };
}

function draw(ctx: CanvasRenderingContext2D, t: number, labels = true) {
  const cam = camAt(t);
  // sky + floor ground: cool light, key from top-left
  const g = ctx.createLinearGradient(0, 0, W * 0.3, H);
  g.addColorStop(0, '#FDFEFF'); g.addColorStop(0.55, C.bg); g.addColorStop(1, C.bg2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const hz = project(cam, 0, 400).y;
  const fl = ctx.createLinearGradient(0, hz, 0, H);
  fl.addColorStop(0, 'rgba(234,240,255,0)'); fl.addColorStop(1, 'rgba(214,224,248,0.85)');
  ctx.fillStyle = fl; ctx.fillRect(0, hz, W, H - hz);
  const top = poolTop(t);
  // tiles, far to near
  for (let r = ROWS - 1; r >= 0; r--) {
    for (let c = COLS[0]; c <= COLS[1]; c++) {
      const x0 = c * PX, z0 = r * PZ, q = [project(cam, x0, z0), project(cam, x0 + TW, z0), project(cam, x0 + TW, z0 + TD), project(cam, x0, z0 + TD)];
      if (q.some((v) => v.zc < 0.6)) continue;
      const minx = Math.min(...q.map((v) => v.x)), maxx = Math.max(...q.map((v) => v.x)), miny = Math.min(...q.map((v) => v.y)), maxy = Math.max(...q.map((v) => v.y));
      if (maxx < -40 || minx > W + 40 || maxy < -40 || miny > H + 40) continue;
      const L = look(c, r, t), fog = clamp((q[0].zc - 14) / 46), key = 0.1 * clamp(1 - (minx + miny * 0.4) / (W * 1.2));
      // contact shadow
      const s = [project(cam, x0 + 0.06, z0 - 0.08), project(cam, x0 + TW + 0.06, z0 - 0.08), project(cam, x0 + TW + 0.06, z0 + TD - 0.08), project(cam, x0 + 0.06, z0 + TD - 0.08)];
      ctx.globalAlpha = 0.07 * (1 - fog); ctx.fillStyle = C.ink; poly(ctx, s); ctx.fill();
      // page
      ctx.globalAlpha = L.a * (1 - fog * 0.85); ctx.fillStyle = L.fill; poly(ctx, q); ctx.fill();
      if (key > 0 && L.fill !== '#FFFFFF') { ctx.globalAlpha = key * (1 - fog); ctx.fillStyle = '#FFFFFF'; poly(ctx, q); ctx.fill(); }
      ctx.globalAlpha = (1 - fog) * 0.55; ctx.strokeStyle = 'rgba(20,33,61,0.16)'; ctx.lineWidth = 1; poly(ctx, q); ctx.stroke();
      if (L.edge && L.ew) { ctx.globalAlpha = 1 - fog * 0.7; ctx.strokeStyle = L.edge; ctx.lineWidth = L.ew; poly(ctx, q); ctx.stroke(); }
      if (L.glow) { ctx.globalAlpha = 0.35 * L.glow * (1 - fog); ctx.fillStyle = C.coral; ctx.shadowColor = C.coral; ctx.shadowBlur = 24; poly(ctx, q); ctx.fill(); ctx.shadowBlur = 0; }
      // token text on near pages
      const tw = maxx - minx;
      if (L.tok && tw > 52 && fog < 0.3 && L.fill !== '#FFFFFF') {
        ctx.globalAlpha = 0.55 * (1 - fog); ctx.fillStyle = C.ink; ctx.font = `600 ${Math.min(22, tw * 0.2)}px ${FONT.mono}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(TOKS[Math.floor(hash(c, r, 5) * TOKS.length)], (minx + maxx) / 2, (miny + maxy) / 2);
      }
    }
  }
  ctx.globalAlpha = 1;
  // pool outline + context-window outline with labels (from the pool scene until the fix)
  const showPool = clamp((t - T.pool0 - 0.2) / 0.3) * (1 - clamp((t - T.noex) / 0.4));
  if (showPool > 0 && labels) {
    const ctxA = clamp((t - T.small) / 0.25) * (1 - clamp((t - T.reject) / 0.4));
    if (ctxA > 0) outline(ctx, cam, CTX_TOP, C.mangoInk, ctxA * showPool, [14, 10], 4, 'context window · 1,048,576', 'right');
    const fixed = t >= T.bada;
    outline(ctx, cam, top, fixed ? C.mintInk : C.cyanInk, showPool, [], 6, fixed ? `pool · ~2.04M tokens` : 'KV cache pool · 681,280', 'left');
  }
  // wash: pushes the floor back when a foreground diagram is the hero
  const wash = cam.wash;
  if (wash > 0) { ctx.globalAlpha = wash; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}

function poly(ctx: CanvasRenderingContext2D, q: { x: number; y: number }[]) {
  ctx.beginPath(); ctx.moveTo(q[0].x, q[0].y); for (let i = 1; i < q.length; i++) ctx.lineTo(q[i].x, q[i].y); ctx.closePath();
}
function outline(ctx: CanvasRenderingContext2D, cam: Cam, topRow: number, color: string, a: number, dash: number[], lw: number, label: string, side: 'left' | 'right') {
  const x0 = POOL_C0 * PX - 0.12, x1 = POOL_C1 * PX + TW + 0.12, z0 = POOL_R0 * PZ - 0.12, z1 = topRow * PZ + TD + 0.12;
  const q = [project(cam, x0, z0), project(cam, x1, z0), project(cam, x1, z1), project(cam, x0, z1)];
  ctx.save(); ctx.globalAlpha = a; ctx.setLineDash(dash); ctx.strokeStyle = color; ctx.lineWidth = lw; poly(ctx, q); ctx.stroke(); ctx.setLineDash([]);
  const p = side === 'left' ? q[3] : q[2];
  ctx.font = `800 34px ${FONT.ui}`; ctx.textBaseline = 'bottom'; ctx.textAlign = side === 'left' ? 'left' : 'right';
  const tx = side === 'left' ? Math.max(70, p.x) : Math.min(W - 70, p.x), ty = p.y - 12, m = ctx.measureText(label).width;
  ctx.fillStyle = 'rgba(255,255,255,0.92)'; const bx = side === 'left' ? tx - 12 : tx - m - 12;
  ctx.beginPath(); ctx.roundRect(bx, ty - 46, m + 24, 52, 10); ctx.fill();
  ctx.fillStyle = color; ctx.fillText(label, tx, ty); ctx.restore();
}

/** `at` freezes the world at a film time (the cover); otherwise it follows the playhead */
export const World: React.FC<{ at?: number }> = ({ at }) => {
  const f = useCurrentFrame(), ref = useRef<HTMLCanvasElement>(null), t = at ?? f / FPS;
  useLayoutEffect(() => { const ctx = ref.current?.getContext('2d'); if (ctx) draw(ctx, t, at === undefined); }, [t, at]);
  return <canvas ref={ref} width={W} height={H} style={{ position: 'absolute', inset: 0 }} />;
};
