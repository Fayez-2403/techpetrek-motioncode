// Keyframed poses for the procedural humanoid (ActionHumanoid): a sprint cycle, a lurching shamble (with per-figure
// variation), the survivor's cautious stance, and the runner's speed vault, gap leap and landing roll. Poses are flat
// joint-angle records; tracks interpolate them with time-aware Catmull-Rom tangents. All pure functions of their inputs.
import { STAND_H, type A3, type Pose } from './ActionHumanoid';

export const TAU = Math.PI * 2;
const sin = Math.sin, max = Math.max;

export function basePose(): Pose {
  return {
    root: [0, STAND_H, 0], rot: [0, 0, 0], spine: [0, 0, 0], chest: [0, 0, 0], neck: [0, 0, 0], head: [0, 0, 0],
    lSh: [0.05, 0.1, 0], rSh: [0.05, 0.1, 0], lEl: 0.15, rEl: 0.15, lWr: 0, rWr: 0,
    lHip: [0, 0.03, 0], rHip: [0, 0.03, 0], lKn: 0.02, rKn: 0.02, lAn: 0, rAn: 0,
  };
}
export const P = (o: Partial<Pose>): Pose => ({ ...basePose(), ...o });

const ARR: (keyof Pose)[] = ['root', 'rot', 'spine', 'chest', 'neck', 'head', 'lSh', 'rSh', 'lHip', 'rHip'];
const NUM: (keyof Pose)[] = ['lEl', 'rEl', 'lWr', 'rWr', 'lKn', 'rKn', 'lAn', 'rAn'];
export function flat(p: Pose): number[] {
  const a: number[] = [];
  for (const k of ARR) a.push(...(p[k] as A3));
  for (const k of NUM) a.push(p[k] as number);
  return a;
}
export function unflat(a: number[]): Pose {
  const o = {} as Record<string, unknown>;
  let i = 0;
  for (const k of ARR) { o[k] = [a[i], a[i + 1], a[i + 2]]; i += 3; }
  for (const k of NUM) o[k] = a[i++];
  return o as unknown as Pose;
}
export function mixPose(a: Pose, b: Pose, t: number): Pose {
  if (t <= 0) return a; if (t >= 1) return b;
  const x = flat(a), y = flat(b);
  return unflat(x.map((v, i) => v + (y[i] - v) * t));
}
/** a + (b - base) : layer an offset pose on top */
export function addPose(a: Pose, d: Partial<Pose>): Pose {
  const o = { ...a } as Record<string, unknown>;
  for (const [k, v] of Object.entries(d)) {
    const cur = o[k];
    o[k] = Array.isArray(v) ? (cur as number[]).map((c, i) => c + (v as number[])[i]) : (cur as number) + (v as number);
  }
  return o as unknown as Pose;
}

/** time-aware Catmull-Rom through keyed poses [[t, pose], ...] */
export function poseTrack(k: [number, Pose][], t: number): Pose {
  const n = k.length;
  if (t <= k[0][0]) return k[0][1];
  if (t >= k[n - 1][0]) return k[n - 1][1];
  let i = 0;
  while (i < n - 2 && t > k[i + 1][0]) i++;
  const [t0, a0] = k[Math.max(0, i - 1)], [t1, a1] = k[i], [t2, a2] = k[i + 1], [t3, a3] = k[Math.min(n - 1, i + 2)];
  const p0 = flat(a0), p1 = flat(a1), p2 = flat(a2), p3 = flat(a3);
  const h = t2 - t1, u = (t - t1) / h, u2 = u * u, u3 = u2 * u;
  const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
  const d0 = Math.max(1e-6, t2 - t0), d1 = Math.max(1e-6, t3 - t1);
  return unflat(p1.map((v, j) => {
    const m1 = i === 0 ? (p2[j] - p1[j]) : ((p2[j] - p0[j]) / d0) * h;
    const m2 = i + 2 >= n ? (p2[j] - p1[j]) : ((p3[j] - p1[j]) / d1) * h;
    return h00 * v + h10 * m1 + h01 * p2[j] + h11 * m2;
  }));
}

/** periodic smooth curve through n equally spaced samples (phase in [0,1)) */
function periodic(v: number[], ph: number) {
  const n = v.length, x = (((ph % 1) + 1) % 1) * n, i = Math.floor(x), t = x - i;
  const a = v[(i - 1 + n) % n], b = v[i % n], c = v[(i + 1) % n], d = v[(i + 2) % n];
  return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
}

// ------------------------------------------------------------------------------------------------ sprint
const KNEE = [1.95, 1.35, 0.7, 0.3, 0.52, 0.24, 0.9, 1.65];
const ANKLE = [0.35, 0.12, -0.15, -0.05, -0.22, 0.45, 0.75, 0.55];
/** sprint cycle; ph in strides (0..1 = right foot strike to right foot strike, roughly), k = intensity */
export function runPose(ph: number, k = 1): Pose {
  const leg = (q: number) => ({ hip: 0.3 + 0.82 * sin(TAU * q) * k, kn: periodic(KNEE, q) * (0.55 + 0.45 * k), an: periodic(ANKLE, q) });
  const R = leg(ph), L = leg(ph + 0.5), s = sin(TAU * ph);
  return P({
    root: [0, STAND_H - 0.07 + 0.035 * Math.cos(2 * TAU * (ph - 0.12)), 0],
    rot: [0.2 * k, 0.1 * s * k, 0.035 * s],
    spine: [0.08 * k, 0, 0], chest: [0.08 * k, -0.24 * s * k, 0], neck: [-0.22 * k, 0.1 * s * k, 0], head: [0, 0.04 * s, 0],
    rSh: [0.15 - 0.95 * s * k, 0.14, 0], lSh: [0.15 + 0.95 * s * k, 0.14, 0],
    rEl: 1.5 + 0.35 * s * k * -1, lEl: 1.5 + 0.35 * s * k, rWr: 0.12, lWr: 0.12,
    rHip: [R.hip, 0.03, 0], lHip: [L.hip, 0.03, 0], rKn: R.kn, lKn: L.kn, rAn: R.an, lAn: L.an,
  });
}

// ------------------------------------------------------------------------------------------------ shamble
export interface ShambleVar { reach: 0 | 1 | 2; drag: 1 | -1; hunch: number; tilt: number; jerk: number }
/** a lurching shamble: one leg steps, the other drags with the toe down; hunched, head lolling, arm(s) reaching */
export function shamblePose(ph: number, v: ShambleVar): Pose {
  const s = sin(TAU * ph), s2 = sin(2 * TAU * ph + 1);
  const jerk = v.jerk * max(0, sin(TAU * (ph * 2 + 0.1))) ** 6;    // a twitch every step
  const step = { hip: 0.28 + 0.42 * s, kn: 0.32 + 0.7 * max(0, sin(TAU * (ph + 0.12))) ** 1.3, an: 0.05 - 0.15 * s };
  const dq = sin(TAU * (ph + 0.5));
  const drag = { hip: 0.12 + 0.18 * dq, kn: 0.26 + 0.12 * max(0, dq), an: 0.5 };
  const L = v.drag === 1 ? drag : step, R = v.drag === 1 ? step : drag;
  const reachL = v.reach !== 1, reachR = v.reach !== 0;
  // reaching: forward, up and a little out (reads from the front); limp: hanging, swinging, elbow loose
  const reach = (q: number): [A3, number, number] => [[1.35 + 0.14 * sin(TAU * ph + q), 0.42 + 0.08 * sin(TAU * ph * 2 + q), 0], 0.38 + 0.12 * sin(TAU * ph + q), 0.75];
  const limp = (q: number): [A3, number, number] => [[0.12 + 0.32 * sin(TAU * (ph + 0.25) + q), 0.22, 0.35], 0.35 + 0.18 * sin(TAU * ph + q), 0.45];
  const [lSh, lEl, lWr] = reachL ? reach(0) : limp(0);
  const [rSh, rEl, rWr] = reachR ? reach(1.3) : limp(1.7);
  const lean = 0.12 * v.tilt;                                        // a permanent list to one side
  const tiltSign = v.tilt < 0 ? -1 : 1;
  return P({
    root: [0, STAND_H - 0.12 - 0.035 * Math.abs(s), 0],
    rot: [0.14 * v.hunch, 0.12 * s, (0.17 + 0.04 * Math.abs(v.tilt)) * s + lean],
    spine: [0.22 * v.hunch + 0.05 * s2, 0.05 * s, 0.1 * v.tilt], chest: [0.2 * v.hunch + jerk * 0.15, -0.1 * s, 0.14 * v.tilt + 0.06 * s2],
    neck: [0.18 + 0.06 * s2, 0.08 * v.tilt, 0.25 * v.tilt], head: [0.2 - jerk * 0.45, 0.14 * v.tilt, 0.55 * tiltSign * (0.6 + 0.4 * Math.abs(v.tilt)) + 0.08 * s + jerk * 0.25],
    lSh, rSh, lEl, rEl, lWr, rWr,
    lHip: [L.hip, 0.12, v.drag === 1 ? 0.4 : 0.08], rHip: [R.hip, 0.12, v.drag === -1 ? 0.4 : 0.08],
    lKn: L.kn, rKn: R.kn, lAn: L.an, rAn: R.an,
  });
}

// ------------------------------------------------------------------------------------------------ survivor
/** cautious stance / slow creep (walk 0..1 sets the step size); arms are aimed by the scene */
export function survivorPose(ph: number, walk: number): Pose {
  const s = sin(TAU * ph);
  const leg = (q: number) => ({ hip: 0.2 + 0.32 * walk * sin(TAU * q), kn: 0.24 + 0.55 * walk * max(0, sin(TAU * (q + 0.18))) ** 1.2, an: -0.05 + 0.1 * walk * sin(TAU * q) });
  const R = leg(ph), L = leg(ph + 0.5);
  return P({
    root: [0, STAND_H - 0.06, 0], rot: [0.06, 0.05 * s * walk, 0.03 * s * walk],
    spine: [0.07, 0, 0], chest: [0.05, -0.05 * s * walk, 0], neck: [-0.02, 0, 0], head: [0.05, 0, 0],
    lSh: [0.3, 0.12, 0], rSh: [1.3, 0.05, 0], lEl: 0.9, rEl: 0.18, lWr: 0.1, rWr: -0.05,
    rHip: [R.hip, 0.08, 0.1], lHip: [L.hip, 0.08, 0.1], rKn: R.kn, lKn: L.kn, rAn: R.an, lAn: L.an,
  });
}

// ------------------------------------------------------------------------------------------------ parkour keys
/** speed vault over a waist-high box; t in frames from the plant (0) to back-in-stride (14). Root y is absolute. */
export const VAULT: [number, Pose][] = [
  [0, P({ root: [0, 0.95, 0], rot: [0.12, 0.22, 0.02], spine: [0.15, 0, 0], chest: [0.08, 0.12, 0], neck: [-0.15, 0, 0],
    lHip: [-0.2, 0.05, 0], lKn: 0.25, lAn: 0.55, rHip: [1.25, 0.18, 0.2], rKn: 1.55, rAn: -0.1,
    lSh: [1.25, 0.22, 0], lEl: 0.3, rSh: [0.7, 0.55, 0], rEl: 0.7 })],
  [5, P({ root: [0, 1.32, 0], rot: [-0.05, 0.9, -0.48], spine: [0.1, 0, -0.12], chest: [0.05, 0.12, 0], neck: [-0.1, -0.3, 0.2],
    lHip: [1.45, -0.05, 0], lKn: 1.25, lAn: 0.3, rHip: [1.5, 0.35, 0], rKn: 1.35, rAn: 0.3,
    lSh: [0.3, 0.15, 0], lEl: 0.05, rSh: [0.85, 1.3, 0], rEl: 0.4 })],
  [9, P({ root: [0, 1.12, 0], rot: [0.12, 0.45, -0.16], spine: [0.12, 0, 0], chest: [0.06, 0.05, 0], neck: [-0.15, -0.15, 0],
    rHip: [0.95, 0.15, 0], rKn: 0.45, rAn: 0.0, lHip: [0.65, 0.1, 0], lKn: 1.35, lAn: 0.3,
    lSh: [0.6, 0.3, 0], lEl: 0.4, rSh: [0.5, 0.7, 0], rEl: 0.6 })],
  [12, P({ root: [0, 0.86, 0], rot: [0.3, 0.1, 0], spine: [0.14, 0, 0], chest: [0.08, 0, 0], neck: [-0.22, 0, 0],
    rHip: [0.6, 0.05, 0], rKn: 0.95, rAn: -0.15, lHip: [0.2, 0.05, 0], lKn: 1.45, lAn: 0.4,
    lSh: [0.7, 0.15, 0], lEl: 1.4, rSh: [-0.5, 0.15, 0], rEl: 1.2 })],
];

/** gap leap: t in frames from take-off (0) to landing (24), absorb (27), roll (27..39), up and running (44).
 *  Root y here is the airborne / crouch body offset; the scene adds the ballistic arc and clamps to the ground. */
const CURL = { spine: [0.62, 0, 0] as A3, chest: [0.46, 0, 0] as A3, neck: [0.7, 0, 0] as A3, lHip: [2.3, 0.15, 0] as A3, rHip: [2.25, 0.2, 0] as A3, lKn: 2.35, rKn: 2.3, lAn: 0.35, rAn: 0.35, lSh: [1.25, 0.25, 0] as A3, rSh: [1.15, 0.3, 0] as A3, lEl: 1.85, rEl: 1.8 };
export const LEAP_AIR = 24;
export const LEAP: [number, Pose][] = [
  [0, P({ root: [0, 1.0, 0], rot: [0.28, 0, 0], spine: [0.1, 0, 0], chest: [0.05, 0, 0], neck: [-0.25, 0, 0],
    rHip: [-0.45, 0.05, 0], rKn: 0.12, rAn: 0.85, lHip: [1.45, 0.05, 0], lKn: 1.7, lAn: -0.1,
    rSh: [1.6, 0.25, 0], rEl: 0.8, lSh: [-0.8, 0.2, 0], lEl: 0.9 })],
  [8, P({ root: [0, 1.0, 0], rot: [0.12, 0, 0.04], spine: [0.05, 0, 0], chest: [0.0, 0.1, 0], neck: [-0.15, 0, 0],
    lHip: [1.05, 0.06, 0], lKn: 0.6, lAn: 0.15, rHip: [0.25, 0.05, 0], rKn: 1.85, rAn: 0.45,
    rSh: [1.95, 0.55, 0], rEl: 0.45, lSh: [1.3, 0.65, 0], lEl: 0.45 })],
  [16, P({ root: [0, 1.0, 0], rot: [0.02, 0, -0.03], spine: [0.0, 0, 0], chest: [0.0, -0.06, 0], neck: [-0.1, 0, 0],
    lHip: [1.35, 0.08, 0], lKn: 0.75, lAn: -0.1, rHip: [1.05, 0.08, 0], rKn: 1.05, rAn: -0.05,
    rSh: [1.45, 0.4, 0], rEl: 0.35, lSh: [1.45, 0.4, 0], lEl: 0.35 })],
  [24, P({ root: [0, 0.86, 0], rot: [0.38, 0, 0], spine: [0.2, 0, 0], chest: [0.1, 0, 0], neck: [-0.2, 0, 0],
    lHip: [1.05, 0.12, 0], lKn: 1.0, lAn: -0.25, rHip: [0.95, 0.12, 0], rKn: 0.95, rAn: -0.25,
    rSh: [1.05, 0.3, 0], rEl: 0.55, lSh: [1.05, 0.3, 0], lEl: 0.55 })],
  [27, P({ root: [0, 0.55, 0], rot: [0.95, 0, 0], spine: [0.35, 0, 0], chest: [0.25, 0, 0], neck: [0.3, 0, 0],
    lHip: [2.0, 0.15, 0], lKn: 2.1, lAn: -0.45, rHip: [2.0, 0.15, 0], rKn: 2.1, rAn: -0.45,
    rSh: [1.4, 0.2, 0], rEl: 1.1, lSh: [1.4, 0.2, 0], lEl: 1.1 })],
  [31, P({ root: [0, 0.48, 0], rot: [3.0, 0, 0.18], ...CURL })],
  [35, P({ root: [0, 0.48, 0], rot: [5.0, 0, 0.12], ...CURL })],
  [39, P({ root: [0, 0.62, 0], rot: [TAU + 0.6, 0, 0.03], spine: [0.3, 0, 0], chest: [0.15, 0, 0], neck: [0.05, 0, 0],
    lHip: [1.8, 0.1, 0], lKn: 1.95, lAn: -0.3, rHip: [1.6, 0.1, 0], rKn: 1.7, rAn: -0.25,
    rSh: [0.7, 0.2, 0], rEl: 1.25, lSh: [0.3, 0.2, 0], lEl: 1.2 })],
];
/** add 2π to the pitch of a pose (so a pose after the roll interpolates without spinning back) */
export const afterRoll = (p: Pose): Pose => ({ ...p, rot: [p.rot[0] + TAU, p.rot[1], p.rot[2]] });
