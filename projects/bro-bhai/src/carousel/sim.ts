// The four carousel mini-games as data: every position is a pure function of t (seconds), and every sound moment is
// listed by soundEvents() so the mixer places the same beats (scripts/carousel_events.ts writes them to JSON).
// All four are original: our own sprites, levels and rules in four classic genres, nothing from an existing game.
// No React here, so the events script can import this file.
import { mulberry32, noise1 } from '../animation/rng';

export const GW = 536, GH = 506;               // one game's logical box (a grid cell); the punch-in scales it ~2x
export const DUR = 12;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- A. platformer
export const PF = { speed: 250, hx: 150, gy: 420, jump: 0.7, height: 120 };
export type Obstacle = { n: number; t: number; kind: 'pipe' | 'pit' | 'bug' | 'block'; wx: number };
/** the hero clears obstacle n at t = 0.55 + n (one jump every two beats) */
export const OBST: Obstacle[] = Array.from({ length: 14 }, (_, n) => {
  const t = 0.55 + n, kind = (['block', 'pipe', 'bug', 'pit'] as const)[n % 4];
  return { n, t, kind, wx: PF.speed * t + PF.hx + 24 };
});
export const pfCam = (t: number) => PF.speed * t;
/** hero height above the ground (px, up) */
export const pfHeroUp = (t: number) => {
  for (const o of OBST) {
    const u = (t - (o.t - PF.jump / 2)) / PF.jump;
    if (u > 0 && u < 1) return Math.sin(u * Math.PI) * PF.height;
  }
  return 0;
};

// ---------------------------------------------------------------- B. arcade shooter
export const SH = { cols: 4, rows: 3, dx: 74, dy: 54, shipY: 430, bullet: 1150, wave: 3.4, gap: 0.22 };
const waveStart = (w: number) => -0.5 + w * SH.wave;
export const shWave = (t: number) => Math.floor((t + 0.5) / SH.wave);
export const shSway = (t: number) => 34 * Math.sin(2 * t);
/** enemy (c, r) of wave w: its position at t (flies in from the top, sways, sinks slowly) */
export const shEnemy = (w: number, c: number, r: number, t: number) => {
  const ws = waveStart(w), fly = 1 - (1 - clamp((t - ws) / 0.45)) ** 3;
  return { x: GW / 2 - 1.5 * SH.dx + c * SH.dx + shSway(t), y: 64 + r * SH.dy + 10 * (t - ws) - (1 - fly) * 260 };
};
export type Kill = { w: number; c: number; r: number; tk: number; tf: number; x: number; y: number };
/** kill order per wave: bottom row left->right, middle right->left, top left->right (the ship sweeps) */
export const KILLS: Kill[] = (() => {
  const out: Kill[] = [];
  for (let w = 0; w < 5; w++) {
    let k = 0;
    for (let r = SH.rows - 1; r >= 0; r--) {
      const order = (SH.rows - 1 - r) % 2 === 0 ? [0, 1, 2, 3] : [3, 2, 1, 0];
      for (const c of order) {
        const tk = waveStart(w) + 0.55 + k++ * SH.gap, p = shEnemy(w, c, r, tk);
        out.push({ w, c, r, tk, tf: tk - (SH.shipY - 24 - p.y) / SH.bullet, x: p.x, y: p.y });
      }
    }
  }
  return out.sort((a, b) => a.tf - b.tf);
})();
export const shShipX = (t: number) => {
  const K = KILLS;
  if (t <= K[0].tf) return K[0].x;
  for (let i = 0; i < K.length - 1; i++) {
    if (t < K[i + 1].tf) return lerp(K[i].x, K[i + 1].x, smooth((t - K[i].tf - 0.02) / (K[i + 1].tf - K[i].tf - 0.05)));
  }
  return K[K.length - 1].x;
};

// ---------------------------------------------------------------- C. team battle (3 v 3, top-down)
export type Unit = { id: string; team: 'blue' | 'red'; i: number; home: [number, number]; front: [number, number] };
export const UNITS: Unit[] = [0, 1, 2].flatMap((i) => [
  { id: `B${i}`, team: 'blue' as const, i, home: [62, 150 + i * 110] as [number, number], front: [212 + (i === 1 ? 22 : 0), 168 + i * 92] as [number, number] },
  { id: `R${i}`, team: 'red' as const, i, home: [GW - 62, 150 + i * 110] as [number, number], front: [GW - 212 - (i === 1 ? 22 : 0), 168 + i * 92] as [number, number] },
]);
/** knock-outs (who goes down, when) and the ability blast that causes one; respawn 2.2 s later at home */
export const KOS = [{ t: 1.4, id: 'R1' }, { t: 3.3, id: 'B2' }, { t: 5.75, id: 'R0' }, { t: 7.6, id: 'R2' }, { t: 10.2, id: 'B0' }];
export const BLAST = { t: 5.35, from: 'B1', to: 'R0' };
const RESPAWN = 2.2;
/** is the unit down at t; when it last (re)spawned */
export const btState = (id: string, t: number) => {
  let spawn = -9, down = false, koAt = Infinity;
  for (const k of KOS) if (k.id === id) {
    if (t >= k.t && t < k.t + RESPAWN) { down = true; koAt = k.t; }
    if (t >= k.t + RESPAWN) spawn = k.t + RESPAWN;
    if (k.t > t && koAt === Infinity) koAt = k.t;
  }
  const next = KOS.find((k) => k.id === id && k.t > t);
  return { down, spawn, nextKo: next ? next.t : Infinity, koAt };
};
export const btPos = (u: Unit, t: number): [number, number] => {
  const s = btState(u.id, t);
  if (s.down) return u.front;
  const adv = smooth((t - s.spawn) / 1.2), seed = (u.team === 'blue' ? 10 : 20) + u.i;
  return [lerp(u.home[0], u.front[0], adv) + 16 * noise1(t * 0.9, seed), lerp(u.home[1], u.front[1], adv) + 20 * noise1(t * 0.7, seed + 50)];
};
export const btHp = (u: Unit, t: number) => {
  const s = btState(u.id, t);
  if (s.down) return 0;
  if (s.nextKo < Infinity && s.nextKo - t < 3) return clamp(0.15 + 0.85 * (s.nextKo - t) / 3);
  return 0.82 + 0.18 * (0.5 + 0.5 * noise1(t * 0.5, u.i + (u.team === 'blue' ? 0 : 9)));
};
export type Shot = { t: number; from: string; to: string };
/** every unit fires every 0.45 s at a living enemy (its lane first) */
export const SHOTS: Shot[] = (() => {
  const out: Shot[] = [];
  for (const u of UNITS) for (let k = 0; k * 0.45 < DUR + 1; k++) {
    const t = 0.1 + u.i * 0.15 + (u.team === 'red' ? 0.22 : 0) + k * 0.45;
    if (btState(u.id, t).down) continue;
    const foes = UNITS.filter((v) => v.team !== u.team && !btState(v.id, t).down);
    if (!foes.length) continue;
    const pick = foes.find((v) => v.i === (u.i + Math.floor(k / 3)) % 3) ?? foes[0];
    out.push({ t, from: u.id, to: pick.id });
  }
  return out.sort((a, b) => a.t - b.t);
})();
export const btScore = (t: number) => ({
  blue: KOS.filter((k) => k.t <= t && k.id.startsWith('R')).length + 4,
  red: KOS.filter((k) => k.t <= t && k.id.startsWith('B')).length + 2,
});

// ---------------------------------------------------------------- D. match-3 puzzle
export const PZ = { cols: 7, rows: 7, cell: 58, types: 6 };
export type GemKey = { c: number; r: number; type: number; s: number };
export type PzKey = { t: number; ease: 'swap' | 'clear' | 'fall'; gems: Record<number, GemKey>; pops: { c: number; r: number; n: number; combo: number }[]; swap?: [number, number, number, number] };
export const PZ_KEYS: PzKey[] = (() => {
  const rnd = mulberry32(2026_11_02);
  let nextId = 0;
  const type = new Map<number, number>();
  const newGem = (avoid: number[] = []) => { let ty = Math.floor(rnd() * PZ.types); while (avoid.includes(ty)) ty = (ty + 1) % PZ.types; const id = nextId++; type.set(id, ty); return id; };
  // grid[c][r], r = 0 at the top
  const g: number[][] = Array.from({ length: PZ.cols }, () => Array(PZ.rows).fill(-1));
  for (let r = 0; r < PZ.rows; r++) for (let c = 0; c < PZ.cols; c++) {
    const avoid: number[] = [];
    if (c >= 2 && type.get(g[c - 1][r]) === type.get(g[c - 2][r])) avoid.push(type.get(g[c - 1][r])!);
    if (r >= 2 && type.get(g[c][r - 1]) === type.get(g[c][r - 2])) avoid.push(type.get(g[c][r - 1])!);
    g[c][r] = newGem(avoid);
  }
  const ty = (c: number, r: number) => type.get(g[c][r])!;
  const matches = () => {
    const hit = new Set<string>();
    for (let r = 0; r < PZ.rows; r++) for (let c = 0; c < PZ.cols - 2; c++) if (ty(c, r) === ty(c + 1, r) && ty(c, r) === ty(c + 2, r)) [0, 1, 2].forEach((k) => hit.add(`${c + k},${r}`));
    for (let c = 0; c < PZ.cols; c++) for (let r = 0; r < PZ.rows - 2; r++) if (ty(c, r) === ty(c, r + 1) && ty(c, r) === ty(c, r + 2)) [0, 1, 2].forEach((k) => hit.add(`${c},${r + k}`));
    return [...hit].map((s) => s.split(',').map(Number) as [number, number]);
  };
  const snap = (extra: Record<number, GemKey> = {}, dying = new Set<number>()): Record<number, GemKey> => {
    const o: Record<number, GemKey> = {};
    for (let c = 0; c < PZ.cols; c++) for (let r = 0; r < PZ.rows; r++) { const id = g[c][r]; o[id] = { c, r, type: type.get(id)!, s: dying.has(id) ? 0 : 1 }; }
    return { ...o, ...extra };
  };
  const swapCells = (a: [number, number], b: [number, number]) => { const x = g[a[0]][a[1]]; g[a[0]][a[1]] = g[b[0]][b[1]]; g[b[0]][b[1]] = x; };
  const keys: PzKey[] = [];
  let t = -0.4;
  keys.push({ t, ease: 'fall', gems: snap(), pops: [] });
  for (let move = 0; move < 16 && t < DUR + 1; move++) {
    // all swaps that make a match; prefer the lower half of the board (cascades show better), then pick by rnd
    const opts: [number, number, number, number][] = [];
    for (let c = 0; c < PZ.cols; c++) for (let r = 0; r < PZ.rows; r++) for (const [dc, dr] of [[1, 0], [0, 1]]) {
      const c2 = c + dc, r2 = r + dr; if (c2 >= PZ.cols || r2 >= PZ.rows) continue;
      swapCells([c, r], [c2, r2]); if (matches().length) opts.push([c, r, c2, r2]); swapCells([c, r], [c2, r2]);
    }
    if (!opts.length) break;
    opts.sort((a, b) => b[1] - a[1]);
    const pick = opts[Math.floor(rnd() * Math.min(opts.length, 4))];
    const t0 = Math.max(0.35 + move * 1.0, t + 0.25);
    keys.push({ t: t0, ease: 'fall', gems: snap(), pops: [], swap: pick });           // hold until the move
    swapCells([pick[0], pick[1]], [pick[2], pick[3]]);
    t = t0 + 0.18; keys.push({ t, ease: 'swap', gems: snap(), pops: [], swap: pick });
    for (let combo = 1; combo < 6; combo++) {
      const m = matches(); if (!m.length) break;
      const dying = new Set(m.map(([c, r]) => g[c][r]));
      const cx = m.reduce((a, [c]) => a + c, 0) / m.length, cy = m.reduce((a, [, r]) => a + r, 0) / m.length;
      t += 0.2; keys.push({ t, ease: 'clear', gems: snap({}, dying), pops: [{ c: cx, r: cy, n: m.length, combo }] });
      // gravity: each column drops its survivors; new gems enter from above (negative rows, hidden by the mask)
      const spawned: Record<number, GemKey> = {};
      for (let c = 0; c < PZ.cols; c++) {
        const keep = g[c].filter((id) => !dying.has(id)), nNew = PZ.rows - keep.length;
        const fresh = Array.from({ length: nNew }, () => newGem());
        fresh.forEach((id, k) => { spawned[id] = { c, r: k - nNew, type: type.get(id)!, s: 1 }; });
        g[c] = [...fresh, ...keep];
      }
      keys[keys.length - 1].gems = { ...keys[keys.length - 1].gems, ...spawned };
      t += 0.26; keys.push({ t, ease: 'fall', gems: snap(), pops: [] });
    }
  }
  return keys;
})();
export const PZ_SCORE = (t: number) => PZ_KEYS.filter((k) => k.t <= t).reduce((a, k) => a + k.pops.reduce((b, p) => b + p.n * 10 * p.combo, 0), 0);

// ---------------------------------------------------------------- sounds (absolute game time; the mixer keeps the ones in each game's punch-in)
export type Snd = { t: number; game: 'pf' | 'sh' | 'bt' | 'pz'; kind: string };
export function soundEvents(): Snd[] {
  const s: Snd[] = [];
  for (const o of OBST) { s.push({ t: o.t - PF.jump / 2, game: 'pf', kind: 'jump' }); if (o.kind === 'block') s.push({ t: o.t, game: 'pf', kind: 'coin' }); s.push({ t: o.t + PF.jump / 2, game: 'pf', kind: 'land' }); }
  for (const k of KILLS) { s.push({ t: k.tf - 0.07, game: 'sh', kind: 'pew' }, { t: k.tf, game: 'sh', kind: 'pew' }, { t: k.tk, game: 'sh', kind: 'boom' }); }
  for (const sh of SHOTS) s.push({ t: sh.t, game: 'bt', kind: sh.from.startsWith('B') ? 'zap' : 'zap2' });
  for (const k of KOS) s.push({ t: k.t, game: 'bt', kind: 'ko' });
  s.push({ t: BLAST.t, game: 'bt', kind: 'blast' });
  for (const k of PZ_KEYS) {
    if (k.ease === 'swap') s.push({ t: k.t - 0.18, game: 'pz', kind: 'swap' });
    for (const p of k.pops) s.push({ t: k.t - 0.2, game: 'pz', kind: `pop${Math.min(p.combo, 4)}` });
  }
  return s.filter((e) => e.t >= 0 && e.t < DUR).sort((a, b) => a.t - b.t);
}
