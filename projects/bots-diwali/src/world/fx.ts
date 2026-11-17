// Every cracker in the reel, as a pure function of time t (no randomness: hash() of particle ids and time slots).
// fillFx() writes all live particles into flat arrays (position, colour, size, alpha) for one THREE.Points draw.
// Types: phuljhari (sparkler at a moving tip), rocket (rising trail -> peony | willow | crackle | ring burst),
// anaar (fountain), chakri (spinning ground wheel), ladi (a string of pops), bomb (flash + smoke, drawn elsewhere).
export const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const h2 = (a: number, b: number) => hash(a * 17.31 + b * 113.7);
export type V3 = [number, number, number];
export type RGB = [number, number, number];

export type Shell = { t: number; x: number; z: number; apex: number; kind: 'peony' | 'willow' | 'crackle' | 'ring'; color: RGB; n: number; rise?: number };
export type Fountain = { t0: number; t1: number; x: number; z: number; color: RGB };
export type Wheel = { t0: number; t1: number; x: number; z: number; color: RGB };
export type Ladi = { t0: number; t1: number; a: V3; b: V3; n: number };
export type Bomb = { t: number; x: number; z: number };

const G = -4.2;                  // gravity (m/s^2), a little soft so bursts hang in the frame
export const RISE = 1.05;        // rocket rise time (s)

export class FxBuf {
  pos: Float32Array; col: Float32Array; size: Float32Array; n = 0;
  constructor(public max: number) { this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 3); this.size = new Float32Array(max); }
  reset() { this.n = 0; }
  push(p: V3, c: RGB, s: number, a: number) {
    if (this.n >= this.max || a <= 0.003) return; const i = this.n++;
    this.pos[i * 3] = p[0]; this.pos[i * 3 + 1] = p[1]; this.pos[i * 3 + 2] = p[2];
    this.col[i * 3] = c[0] * a; this.col[i * 3 + 1] = c[1] * a; this.col[i * 3 + 2] = c[2] * a; this.size[i] = s;
  }
}
const mix = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const HOT: RGB = [1.6, 1.45, 1.1], GOLD: RGB = [1.4, 0.85, 0.3], WHITE: RGB = [1.6, 1.6, 1.6];

// ---- phuljhari: sparks spit from the tip every frame, short bright streaks that arc down and fade ----
export function sparkler(b: FxBuf, t: number, tip: V3, on: number, seed: number) {
  if (on <= 0) return;
  const N = 260, P = 0.5;
  for (let i = 0; i < N; i++) {
    const ph = hash(seed * 31 + i) * P, cyc = Math.floor((t + ph) / P), age = ((t + ph) % P);
    const r1 = h2(seed * 7 + i, cyc), r2 = h2(seed * 11 + i, cyc + 0.5), r3 = h2(seed * 13 + i, cyc + 0.25);
    const th = r1 * Math.PI * 2, el = (r2 - 0.35) * Math.PI * 0.95, sp = (1.3 + 2.2 * r3) * on;
    const d: V3 = [Math.cos(el) * Math.cos(th), Math.sin(el), Math.cos(el) * Math.sin(th)];
    const life = 0.24 + 0.3 * r3, k = age / life; if (k > 1) continue;
    for (let e = 0; e < 3; e++) {                       // the streak: the head + two echoes behind it
      const a = Math.max(0, age - e * 0.012);
      const p: V3 = [tip[0] + d[0] * sp * a, tip[1] + d[1] * sp * a + 0.5 * G * 0.6 * a * a, tip[2] + d[2] * sp * a];
      // the classic star-burst crackle: some sparks fork into a tiny flash at the end of their life
      const fork = r2 > 0.82 && k > 0.75 ? 2.2 : 1;
      b.push(p, mix(HOT, GOLD, k), (0.03 - e * 0.006) * fork, (1 - k) * (1 - e * 0.3) * on);
    }
  }
  b.push(tip, WHITE, 0.09 * on, on);                     // the burning head
}

// ---- rockets ----
export function rocket(b: FxBuf, t: number, s: Shell, seed: number) {
  const rise = s.rise ?? RISE, tb = s.t + rise;
  if (t < s.t || t > tb + 3.4) return;
  if (t < tb) {                                          // the climb: a hot head and a fading gold trail
    const k = (t - s.t) / rise, y = s.apex * (1 - (1 - k) ** 2);
    for (let e = 0; e < 14; e++) {
      const ke = Math.max(0, k - e * 0.018), ye = s.apex * (1 - (1 - ke) ** 2);
      b.push([s.x + Math.sin(e + seed) * 0.01, ye, s.z], mix(WHITE, GOLD, e / 14), 0.05 - e * 0.0025, 1 - e / 14);
    }
    b.push([s.x, y, s.z], WHITE, 0.08, 1);
    return;
  }
  const tau = t - tb, n = s.n;
  const life = s.kind === 'willow' ? 3.2 : 2.0, drag = s.kind === 'willow' ? 1.6 : 2.4, v0 = s.kind === 'willow' ? 7 : s.kind === 'ring' ? 9 : 10;
  const flash = Math.max(0, 1 - tau / 0.12);
  if (flash > 0) b.push([s.x, s.apex, s.z], WHITE, 3.2 * flash, flash);
  for (let i = 0; i < n; i++) {
    // directions: a Fibonacci sphere (even burst) or a flat ring, with a little per-star jitter
    let d: V3;
    if (s.kind === 'ring') { const a = (i / n) * Math.PI * 2; d = [Math.cos(a), Math.sin(a) * 0.9, Math.sin(a) * 0.35]; }
    else { const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), a = i * 2.39996 + seed; d = [Math.cos(a) * r, y, Math.sin(a) * r]; }
    const jit = 0.85 + 0.3 * h2(seed, i);
    const echoes = s.kind === 'willow' ? 7 : 4;
    for (let e = 0; e < echoes; e++) {
      const a = Math.max(0, tau - e * (s.kind === 'willow' ? 0.06 : 0.03)), k = a / life; if (k > 1) continue;
      const f = (1 - Math.exp(-drag * a)) / drag;
      const p: V3 = [s.x + d[0] * v0 * jit * f, s.apex + d[1] * v0 * jit * f + 0.5 * G * a * a * (s.kind === 'willow' ? 0.9 : 0.6), s.z + d[2] * v0 * jit * f];
      let c = s.kind === 'willow' ? mix(HOT, GOLD, Math.min(1, k * 1.5)) : mix(WHITE, s.color, Math.min(1, k * 4));
      let al = (1 - k) ** 1.4 * (1 - e / echoes);
      if (s.kind === 'crackle' && k > 0.45) { const on = h2(i * 3 + e, Math.floor(t * 30)) > 0.5 ? 1 : 0; c = WHITE; al *= on * 1.4; }
      b.push(p, c, (s.kind === 'willow' ? 0.11 : 0.15) * (1 - e * 0.15), al * 1.3);
    }
  }
}

// ---- anaar: a fountain of gold-white sparks from a clay pot ----
export function anaar(b: FxBuf, t: number, f: Fountain, seed: number) {
  if (t < f.t0 || t > f.t1 + 1.2) return;
  const ramp = Math.min(1, (t - f.t0) / 0.4) * (1 - Math.max(0, (t - f.t1) / 1.2));
  const rate = 260, life = 1.1;
  const k0 = Math.floor((t - life - f.t0) * rate), k1 = Math.floor((Math.min(t, f.t1) - f.t0) * rate);
  for (let k = Math.max(0, k0); k <= k1; k++) {
    const tb = f.t0 + k / rate, age = t - tb; if (age < 0 || age > life) continue;
    const r1 = h2(seed, k), r2 = h2(seed + 9, k), r3 = h2(seed + 4, k);
    const spread = 0.28, th = r1 * Math.PI * 2, up = 5.2 + 2.6 * r2;
    const v: V3 = [Math.cos(th) * spread * up * r3, up, Math.sin(th) * spread * up * r3];
    const p: V3 = [f.x + v[0] * age, 0.15 + v[1] * age + 0.5 * G * 1.6 * age * age, f.z + v[2] * age];
    if (p[1] < 0) continue;
    b.push(p, mix(WHITE, mix(GOLD, f.color, 0.3), age / life), 0.035, (1 - age / life) * ramp);
  }
}

// ---- chakri: a ground wheel spinning on the spot, spraying tangential sparks ----
export function chakri(b: FxBuf, t: number, w: Wheel, seed: number) {
  if (t < w.t0 || t > w.t1) return;
  const ramp = Math.min(1, (t - w.t0) / 0.3) * Math.min(1, (w.t1 - t) / 0.3), om = 26, rate = 320, life = 0.45;
  const k0 = Math.floor((t - life - w.t0) * rate), k1 = Math.floor((t - w.t0) * rate);
  for (let k = Math.max(0, k0); k <= k1; k++) {
    const tb = w.t0 + k / rate, age = t - tb; if (age < 0 || age > life) continue;
    const ang = tb * om + (k % 2) * Math.PI, sp = 2.4 + 1.2 * h2(seed, k);
    const ex: V3 = [w.x + Math.cos(ang) * 0.12, 0.06, w.z + Math.sin(ang) * 0.12];
    const tg: V3 = [-Math.sin(ang), 0.25 + 0.3 * h2(seed + 3, k), Math.cos(ang)];
    const p: V3 = [ex[0] + tg[0] * sp * age, Math.max(0.01, ex[1] + tg[1] * sp * age + 0.5 * G * age * age), ex[2] + tg[2] * sp * age];
    b.push(p, mix(WHITE, w.color, age / life), 0.03, (1 - age / life) * ramp);
  }
  b.push([w.x, 0.08, w.z], mix(WHITE, w.color, 0.3), 0.22 * ramp, ramp);
}

// ---- ladi: a string of small crackers popping one after another (flash + a few sparks each) ----
export function ladi(b: FxBuf, t: number, l: Ladi, seed: number) {
  if (t < l.t0 || t > l.t1 + 0.3) return;
  for (let i = 0; i < l.n; i++) {
    const tp = l.t0 + (i / l.n) * (l.t1 - l.t0) + (h2(seed, i) - 0.5) * 0.03, age = t - tp; if (age < 0 || age > 0.22) continue;
    const u = i / (l.n - 1), p: V3 = [l.a[0] + (l.b[0] - l.a[0]) * u, l.a[1] + (l.b[1] - l.a[1]) * u, l.a[2] + (l.b[2] - l.a[2]) * u];
    const k = age / 0.22; b.push(p, WHITE, 0.35 * (1 - k), 1 - k);
    for (let j = 0; j < 8; j++) { const a = j * 0.785 + i, q: V3 = [p[0] + Math.cos(a) * age * 3, p[1] + Math.sin(a) * age * 3, p[2]]; b.push(q, GOLD, 0.03, 1 - k); }
  }
}
