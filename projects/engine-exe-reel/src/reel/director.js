// ENGINE.EXE reel director: the whole picture at reel time t, as a pure function of t, keyed on the measured voice
// (SCENE_TIMINGS.json). No three.js here, so node can dump the same events for the sound (scripts/dump_events.mjs).
//
// The crank angle: integrated from the picture speed before the lesson (1/4 in the hook, 1/20 once "slow" is said),
// then pinned to the spoken words through the four strokes (0° on "Ek", 180° on "Do", 350° on "Spark", 540° on
// "Chaar", 720° as the exhaust line ends), then running again. The engine speed the model reads is always 1400 rpm.
import TIMING from '../../SCENE_TIMINGS.json' with {type: 'json'};
import {CONFIG} from '../../../engine-exe/sim/engine-shared/config.js';
import {mod} from '../../../engine-exe/sim/engine-shared/kin.js';

export const T = TIMING;
export const K = TIMING.keys;
export const DURATION = TIMING.duration;
const SEC = Object.fromEntries(TIMING.sections.map((s) => [s.id, s]));
export const sec = (id) => SEC[id];
const RPM = CONFIG.rpm.default;
const DEG_S = RPM * 6; // crank degrees per second of engine time
const smoother = (x) => {
  const u = Math.min(1, Math.max(0, x));
  return u * u * u * (u * (u * 6 - 15) + 10);
};
export const ss = (a, b, t) => smoother((t - a) / (b - a));

// ------------------------------------------------------------ the crank angle
// stroke keyframes on the spoken words
const KF = [
  [K.s1, 0],
  [K.s2, 180],
  [K.s3, 330],
  [K.spark, 350],
  [K.sparkEnd + 0.12, 362],
  [K.s4, 540],
  [K.s4end, 720],
];
// monotone cubic (Fritsch-Carlson) through the keyframes: no overshoot, smooth speed
const pchip = (() => {
  const n = KF.length;
  const h = [];
  const dl = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(KF[i + 1][0] - KF[i][0]);
    dl.push((KF[i + 1][1] - KF[i][1]) / h[i]);
  }
  const m = new Array(n);
  m[0] = dl[0];
  m[n - 1] = dl[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = dl[i - 1] * dl[i] <= 0 ? 0 : (3 * (h[i - 1] + h[i])) / ((2 * h[i] + h[i - 1]) / dl[i - 1] + (h[i] + 2 * h[i - 1]) / dl[i]);
  return {
    at(t) {
      let i = 0;
      while (i < n - 2 && t > KF[i + 1][0]) i++;
      const u = Math.min(1, Math.max(0, (t - KF[i][0]) / h[i]));
      const h00 = 2 * u ** 3 - 3 * u ** 2 + 1;
      const h10 = u ** 3 - 2 * u ** 2 + u;
      const h01 = -2 * u ** 3 + 3 * u ** 2;
      const h11 = u ** 3 - u ** 2;
      return h00 * KF[i][1] + h10 * h[i] * m[i] + h01 * KF[i + 1][1] + h11 * h[i] * m[i + 1];
    },
    v0: m[0],
    v1: m[n - 1],
  };
})();
// the picture speed before and after the lesson (fraction of real time)
const P_HOOK = 1 / 4;
const P_SLOW = CONFIG.playback.normal; // 1/20
const P_IN = pchip.v0 / DEG_S; // the speed the lesson starts at, so the hand-over is smooth
const P_OUT = pchip.v1 / DEG_S;
const playBefore = (t) => {
  const a = P_HOOK + (P_SLOW - P_HOOK) * ss(K.slow - 0.1, K.slow + 1.1, t);
  return a + (P_IN - a) * ss(sec('cam').t0 + 2.2, K.s1, t);
};
const playAfter = (t) => P_OUT + (P_SLOW - P_OUT) * ss(K.s4end, K.s4end + 1.6, t);
const DT = 1 / 600;
const before = [];
{
  let th = 0;
  for (let t = 0; t <= K.s1 + DT; t += DT) {
    before.push(th);
    th += DEG_S * playBefore(t + DT / 2) * DT;
  }
}
const after = [];
{
  let th = 0;
  for (let t = K.s4end; t <= DURATION + 1; t += DT) {
    after.push(th);
    th += DEG_S * playAfter(t + DT / 2) * DT;
  }
}
const sample = (arr, u) => {
  const x = Math.max(0, Math.min(arr.length - 2, u / DT));
  const i = Math.floor(x);
  return arr[i] + (arr[i + 1] - arr[i]) * (x - i);
};
const TH0 = -sample(before, K.s1); // so θ is exactly 0° (a cycle start) when "Ek" is said
void mod;
export const thetaAt = (t) => {
  if (t < K.s1) return TH0 + sample(before, t);
  if (t <= K.s4end) return pchip.at(t);
  return 720 + sample(after, t - K.s4end);
};
/** the picture speed shown on screen: θ's real rate over the engine's own rate */
export const playbackAt = (t) => Math.max(1e-4, (thetaAt(t + 0.01) - thetaAt(t - 0.01)) / 0.02 / DEG_S);

// ------------------------------------------------------------ modes, isolation, the lesson, the camera
const lerpMode = (t, list) => {
  // list: [time, {cut, xray, explode}] targets, each eased over 0.9 s
  let cur = {cut: 0, xray: 0, explode: 0};
  for (const [t0, m, dur = 0.9] of list) {
    if (t < t0) break;
    const k = ss(t0, t0 + dur, t);
    cur = {cut: cur.cut + (m.cut - cur.cut) * k, xray: cur.xray + (m.xray - cur.xray) * k, explode: cur.explode + (m.explode - cur.explode) * k};
  }
  return cur;
};
const SOLID = {cut: 0, xray: 0, explode: 0};
const CUT = {cut: 1, xray: 0, explode: 0};
const XRAY = {cut: 0, xray: 1, explode: 0};
const EXPL = {cut: 0, xray: 0, explode: 1};
const MODES = [
  [0, XRAY, 0.001],
  [sec('slow').t0 + 0.2, SOLID, 1.0],
  [sec('angle').t0, CUT, 0.9],
  [sec('cam').t0, XRAY, 0.9],
  [sec('s1').t0, CUT, 0.7],
  [sec('live').t0, EXPL, 1.6],
  [sec('cta').t0, SOLID, 1.3],
];
const modeName = (m) => (m.explode > 0.5 ? 'exploded' : m.xray > 0.5 ? 'xray' : m.cut > 0.5 ? 'cutaway' : 'solid');
const SOLO = [
  [sec('rod').t0, 'piston'],
  [K.rod, 'rod'],
  [K.cam, 'cam'],
  [sec('cam').t0 + (sec('cam').t1 - sec('cam').t0) * 0.62, null],
];
const soloAt = (t) => {
  let s = null;
  let at = -9;
  let prev = null;
  for (const [t0, k] of SOLO) {
    if (t < t0) break;
    prev = s;
    s = k;
    at = t0;
  }
  if (s) return {solo: s, fade: prev ? 1 : ss(at, at + 0.5, t)};
  if (prev) return {solo: prev, fade: 1 - ss(at, at + 0.5, t)};
  return {solo: null, fade: 0};
};
export const HL = {INTAKE: ['intake', 'piston'], COMPRESSION: ['piston'], POWER: ['piston', 'plug', 'crank'], EXHAUST: ['exhaust', 'piston']};

// camera shots: [start, view fn(u)] with a hard cut at each start unless blend > 0. Portrait framing: fit 1.
const V = (tx, ty, tz, az, el, d, sy = 60) => ({tx, ty, tz, az, el, d, sx: 0, sy, fit: 1});
export const SHOTS = [
  {t: 0, cut: true, f: (u) => V(0, 0.15, 0, 34 - 6 * u, 10 + u, 1.25 + 0.05 * u, -10)},
  {t: sec('slow').t0, cut: true, f: (u) => V(0, 0.125, 0, 52 - 4.5 * u, 16 + 0.8 * u, 1.95 - 0.03 * u, -10)},
  {t: sec('angle').t0, cut: true, f: (u) => V(0, 0.11, 0, 16 + 2.2 * u, 7, 1.62 - 0.04 * u, 18)},
  {t: sec('rod').t0, cut: true, f: (u) => V(0, 0.12, 0, 22 + 1.2 * u, 8, 1.08, -15)},
  {t: K.rod, cut: true, f: (u) => V(0, 0.06, 0, 8 + 2 * u, 4, 1.02, -15)},
  {t: sec('cam').t0, cut: true, f: (u) => V(0, 0.22, 0, 30 + 2 * u, 14, 1.05, -10)},
  {t: K.cam, cut: true, f: (u) => V(0, 0.258, 0, 40 + 3 * u, 20, 0.74, -10)},
  {t: K.s1, cut: true, f: (u) => V(0, 0.14, 0, 12 + 0.7 * u, 5, 1.66 - 0.015 * u, -20)},
  {t: K.s2, cut: true, f: (u) => V(0, 0.15, 0, -14 - 0.8 * u, 7, 1.58, -20)},
  {t: K.s3, cut: true, f: (u) => V(0, 0.16, 0, 8 + 0.6 * u, 3, 1.44 - 0.02 * u, -20)},
  {t: K.s4, cut: true, f: (u) => V(0, 0.15, 0, 24 - 0.8 * u, 9, 1.62, -20)},
  {t: sec('live').t0, cut: true, f: (u) => V(0, 0.2, 0, 40 + 2.5 * u, 16, 2.55 + 0.06 * u, 10)},
  {t: sec('cta').t0, cut: false, blend: 1.4, f: (u) => V(0, 0.13, 0, 36 + 1.2 * u, 18, 1.98, -5)},
];
const blend = (a, b, k) => {
  const o = {};
  for (const key in b) o[key] = key === 'az' ? a.az + ((((b.az - a.az + 540) % 360) - 180) * k) : a[key] + (b[key] - a[key]) * k;
  return o;
};
export const shotAt = (t) => {
  let i = 0;
  while (i < SHOTS.length - 1 && SHOTS[i + 1].t <= t) i++;
  const s = SHOTS[i];
  const cur = s.f(t - s.t);
  if (!s.cut && i > 0) {
    const k = ss(s.t, s.t + s.blend, t);
    if (k < 1) return {cam: blend(SHOTS[i - 1].f(t - SHOTS[i - 1].t), cur, k), i, since: t - s.t};
  }
  return {cam: cur, i, since: t - s.t};
};
export const CUTS = SHOTS.filter((s) => s.cut && s.t > 0).map((s) => s.t);

/** everything the frame needs at t */
export function director(t) {
  const m = lerpMode(t, MODES);
  const so = soloAt(t);
  const learnK = ss(sec('s1').t0, sec('s1').t0 + 0.6, t) * (1 - ss(sec('live').t0, sec('live').t0 + 0.6, t));
  const sh = shotAt(t);
  const section = TIMING.sections.filter((s) => s.t0 <= t).pop().id;
  return {t, theta: thetaAt(t), rpm: RPM, playback: playbackAt(t), ...m, mode: modeName(m), ...so, learnK, learn: learnK > 0.5, camera: sh.cam, shot: sh.i, since: sh.since, section};
}

// ------------------------------------------------------------ events for the sound, from the same clock
export function events() {
  const ev = [];
  const step = 1 / 240;
  let prev = thetaAt(0);
  const cross = (a, b, at) => Math.floor((b - at) / 720) > Math.floor((a - at) / 720);
  for (let t = step; t <= DURATION; t += step) {
    const th = thetaAt(t);
    if (cross(prev, th, 350)) ev.push({t, kind: 'spark'});
    if (cross(prev, th, 364)) ev.push({t, kind: 'burn', k: Math.min(1, 0.4 + 2.2 / Math.max(0.5, 1 / Math.max(1e-3, playbackAt(t) * 20)))});
    if (cross(prev, th, CONFIG.valves.intake.close)) ev.push({t, kind: 'valve', which: 'intake'});
    if (cross(prev, th, CONFIG.valves.exhaust.close)) ev.push({t, kind: 'valve', which: 'exhaust'});
    prev = th;
  }
  for (const c of CUTS) ev.push({t: c, kind: 'cut'});
  ev.push({t: K.slow, kind: 'slow'});
  ev.push({t: sec('live').t0, kind: 'explode'});
  ev.push({t: sec('cta').t0, kind: 'assemble'});
  ev.push({t: K.engine, kind: 'cta'});
  return ev.sort((a, b) => a.t - b.t);
}
