// Small helpers for the reel: easing, piecewise time maps, aim solving against the real ballistic model.
import * as THREE from 'three';
import { BOW, GRAVITY, PHYS_DT, launchSpeed, type GravityPreset } from '../core/config';
import { BowRig, BOW_HOME, BRACE, ARROW_LEN } from '../core/bowrig';
import { ballistic } from '../core/projectile';
import type { SimCore } from '../core/simcore';
import { GROUP } from '../core/config';

export type V3 = [number, number, number];
export const sat = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const smooth = (x: number) => { const t = sat(x); return t * t * (3 - 2 * t); };
export const smoother = (x: number) => { const t = sat(x); return t * t * t * (t * (t * 6 - 15) + 10); };
export const outCubic = (x: number) => 1 - (1 - sat(x)) ** 3;
export const outExpo = (x: number) => (x >= 1 ? 1 : 1 - 2 ** (-10 * sat(x)));
export const inOutCubic = (x: number) => { const t = sat(x); return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2; };
export const span = (t: number, a: number, b: number) => sat((t - a) / (b - a));
export const v3 = (a: V3 | THREE.Vector3) => (a instanceof THREE.Vector3 ? a.clone() : new THREE.Vector3(a[0], a[1], a[2]));

/** A piecewise-linear map through (x, y) points (sorted by x), extended by the end slopes. */
export function pw(pts: [number, number][]) {
  return (x: number) => {
    if (x <= pts[0]![0]) { const [a, b] = pts; const k = b ? (b[1] - a![1]) / (b[0] - a![0]) : 1; return a![1] + (x - a![0]) * k; }
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]!, b = pts[i]!;
      if (x <= b[0]) return a[1] + ((x - a[0]) / (b[0] - a[0])) * (b[1] - a[1]);
    }
    const a = pts[pts.length - 2]!, b = pts[pts.length - 1]!, k = (b[1] - a[1]) / (b[0] - a[0] || 1);
    return b[1] + (x - b[0]) * k;
  };
}

/** A time map given as segments of constant rate: [reel t at which a rate starts, rate], starting at (t0, s0). */
export function rateMap(t0: number, s0: number, segs: [number, number][]) {
  const pts: [number, number][] = [[t0, s0]];
  let t = t0, s = s0;
  for (let i = 0; i < segs.length; i++) {
    const [ts, r] = segs[i]!, tn = segs[i + 1]?.[0] ?? ts + 1000;
    if (ts > t) { s += (ts - t) * (segs[i - 1]?.[1] ?? 1); t = ts; pts.push([t, s]); }
    s += (tn - t) * r; t = tn; pts.push([t, s]);
  }
  return pw(pts);
}

/** First surface point of the active targets along a straight ray. */
export function surfacePoint(sim: SimCore, from: V3, toward: V3): V3 | null {
  const d = new THREE.Vector3(toward[0] - from[0], toward[1] - from[1], toward[2] - from[2]), L = d.length(); d.normalize();
  const h = sim.phys.ray(from[0], from[1], from[2], d.x, d.y, d.z, L * 3, GROUP.RAY);
  return h ? h.p : null;
}

/** The tip of the nocked arrow at full draw d for an aim. */
export function tipAt(yaw: number, pitch: number, draw: number): V3 {
  const f = BowRig.dir(yaw, pitch), back = BRACE + draw;
  return [BOW_HOME[0] - f[0] * back + f[0] * ARROW_LEN, BOW_HOME[1] - f[1] * back + f[1] * ARROW_LEN, BOW_HOME[2] - f[2] * back + f[2] * ARROW_LEN];
}

/** Yaw and pitch so this bow's real trajectory (gravity, drag) passes through P; also the flight time to it. */
export function solveAim(P: V3, drawFrac: number, gravity: GravityPreset, drag = true) {
  const draw = BOW.MAX_DRAW * drawFrac, v = launchSpeed(draw), g = GRAVITY[gravity].g;
  const yaw = Math.atan2(-(P[0] - BOW_HOME[0]), -(P[2] - BOW_HOME[2]));
  const miss = (pitch: number) => {
    const f = BowRig.dir(yaw, pitch), path = ballistic(tipAt(yaw, pitch, draw), [f[0] * v, f[1] * v, f[2] * v], g, drag, PHYS_DT, 4000, -400);
    const hd = Math.hypot(P[0] - BOW_HOME[0], P[2] - BOW_HOME[2]);
    for (let i = 3; i < path.length; i += 3) {
      const d = Math.hypot(path[i]! - BOW_HOME[0], path[i + 2]! - BOW_HOME[2]);
      if (d >= hd) return { dy: path[i + 1]! - P[1], t: (i / 3) * PHYS_DT };
    }
    return { dy: -1e3, t: 99 };
  };
  let a = -0.2, b = 0.7;
  for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (miss(m).dy > 0) b = m; else a = m; }
  const pitch = (a + b) / 2;
  return { yaw, pitch, flight: miss(pitch).t, speed: v };
}
