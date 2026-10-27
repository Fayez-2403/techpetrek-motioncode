// Scene 06 (HumanSimulation): the kinematic model behind the stylized musculoskeletal figure.
// Pure functions only: gait angle curves vs phase, a scripted unstable attempt, forward kinematics in the sagittal plane,
// a muscle table (attachment points on bones), activation curves, and a ground-contact solver that is a deterministic
// precompute from constants (no physics engine, no state between frames).
//
// Conventions: x forward (walking direction), y up, z lateral (+z = the figure's right side, nearer the camera).
// A segment's angle th is measured counter-clockwise from straight down; its axis a = (sin th, -cos th) and its anterior
// normal n = (cos th, sin th). Joint angles are anatomical (hip/shoulder flexion +, knee/elbow flexion +, ankle dorsiflexion +).
// All the angles and lengths here are an illustrative educational model, not data from Moonshot's simulator.

export type P3 = [number, number, number];
export type Side = 'R' | 'L';
export interface SidePose { hip: number; knee: number; ankle: number; sh: number; el: number }
export interface Pose { pitch: number; lumbar: number; neck: number; R: SidePose; L: SidePose }

const D = Math.PI / 180;
export const SEG = { thigh: 0.43, shank: 0.43, arm: 0.3, fore: 0.255, hand: 0.17, lumbar: 0.19, thor: 0.29, neck: 0.11, hipW: 0.09, shW: 0.18, ankleH: 0.068 } as const;
/** standing hip height (m) */
export const HIP_H = SEG.thigh + SEG.shank + SEG.ankleH;
/** stride period of the improved controller (s) */
export const STRIDE_T = 1.08;

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ss = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
const eio = (t: number) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2; };

// ------------------------------------------------------------------ curves
/** periodic Catmull-Rom through [phase, value] keys (phase in [0,1)) */
export function periodic(keys: [number, number][]) {
  const k = keys.slice().sort((a, b) => a[0] - b[0]);
  const n = k.length;
  return (phi: number) => {
    const p = ((phi % 1) + 1) % 1;
    let i = n - 1;
    for (let j = 0; j < n; j++) if (k[j][0] <= p) i = j;
    const a = k[i], b = k[(i + 1) % n], a0 = k[(i - 1 + n) % n], b1 = k[(i + 2) % n];
    const ta = a[0];
    let tb = b[0];
    if (tb <= ta) tb += 1;
    let pp = p;
    if (pp < ta) pp += 1;
    const t = (pp - ta) / (tb - ta);
    const p0 = a0[1], p1 = a[1], p2 = b[1], p3 = b1[1];
    return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  };
}

/** keyed track over time: [[t, value], ...], eased per segment, held at both ends */
export function track(k: [number, number][], ease: (t: number) => number = eio) {
  return (t: number) => {
    if (t <= k[0][0]) return k[0][1];
    for (let i = 0; i < k.length - 1; i++) {
      const [t0, v0] = k[i], [t1, v1] = k[i + 1];
      if (t <= t1) return lerp(v0, v1, ease((t - t0) / (t1 - t0 || 1e-9)));
    }
    return k[k.length - 1][1];
  };
}

// sagittal joint angles of a healthy-looking gait (degrees), phase 0 = heel strike of that leg
const HIP = periodic([[0, 24], [0.12, 21], [0.3, 6], [0.5, -11], [0.62, -3], [0.75, 17], [0.88, 28]]);
const KNEE = periodic([[0, 4], [0.14, 17], [0.3, 7], [0.42, 5], [0.55, 20], [0.66, 52], [0.73, 61], [0.82, 44], [0.92, 13]]);
const ANKLE = periodic([[0, -1], [0.08, -6], [0.25, 4], [0.45, 10], [0.55, 1], [0.62, -15], [0.7, -9], [0.8, -1], [0.92, 1]]);

export const STAND: Pose = {
  pitch: 2 * D, lumbar: 0, neck: 0,
  R: { hip: 1 * D, knee: 3 * D, ankle: 0, sh: 1 * D, el: 9 * D },
  L: { hip: 1 * D, knee: 3 * D, ankle: 0, sh: 1 * D, el: 9 * D },
};

/** gait pose at phase phi (right leg). arm: 0 = stiff arms (before the shoulder fix), 1 = natural counter-swing */
export function gaitPose(phi: number, arm: number): Pose {
  const side = (ph: number): SidePose => {
    const c = Math.cos(2 * Math.PI * ph), cl = Math.cos(2 * Math.PI * (ph - 0.53));
    const shN = 5 - 22 * c, elN = 14 + 18 * (0.5 + 0.5 * cl);
    const shS = 2 - 3 * c, elS = 7;
    return { hip: HIP(ph) * D, knee: KNEE(ph) * D, ankle: ANKLE(ph) * D, sh: lerp(shS, shN, arm) * D, el: lerp(elS, elN, arm) * D };
  };
  return { pitch: (5 + 1.4 * Math.cos(4 * Math.PI * phi)) * D, lumbar: 0, neck: -4 * D, R: side(phi), L: side(phi + 0.5) };
}

export function mixPose(a: Pose, b: Pose, t: number): Pose {
  const s = (x: SidePose, y: SidePose): SidePose => ({ hip: lerp(x.hip, y.hip, t), knee: lerp(x.knee, y.knee, t), ankle: lerp(x.ankle, y.ankle, t), sh: lerp(x.sh, y.sh, t), el: lerp(x.el, y.el, t) });
  return { pitch: lerp(a.pitch, b.pitch, t), lumbar: lerp(a.lumbar, b.lumbar, t), neck: lerp(a.neck, b.neck, t), R: s(a.R, b.R), L: s(a.L, b.L) };
}

// ------------------------------------------------------------------ the initial attempt
// A controller that pitches the trunk forward too far, lands a short step, lets both knees buckle and folds onto the floor.
// s = seconds since the attempt started. Degrees in the keys.
const CK = {
  pitch: track([[0, 2], [0.4, 7], [0.7, 13], [0.95, 21], [1.3, 33], [1.6, 52], [1.95, 76], [2.3, 91], [2.6, 93]]),
  lumbar: track([[0, 0], [1.3, 4], [1.95, 8], [2.6, 6]]),
  neck: track([[0, 0], [0.95, -12], [1.3, -6], [1.95, 14], [2.3, 20], [2.6, 22]]),
  hipR: track([[0, 1], [0.4, 22], [0.7, 26], [0.95, 36], [1.3, 70], [1.6, 74], [1.95, 52], [2.3, 16], [2.6, 9]]),
  kneeR: track([[0, 3], [0.4, 38], [0.7, 12], [0.95, 34], [1.3, 96], [1.6, 112], [1.95, 84], [2.3, 36], [2.6, 27]]),
  ankR: track([[0, 0], [0.4, 4], [0.7, 2], [0.95, 8], [1.3, 22], [1.6, 12], [1.95, -12], [2.3, -26], [2.6, -28]]),
  hipL: track([[0, 1], [0.4, -6], [0.7, -14], [0.95, -6], [1.3, 50], [1.6, 70], [1.95, 48], [2.3, 19], [2.6, 13]]),
  kneeL: track([[0, 3], [0.4, 6], [0.7, 14], [0.95, 30], [1.3, 100], [1.6, 114], [1.95, 88], [2.3, 42], [2.6, 33]]),
  ankL: track([[0, 0], [0.4, 4], [0.7, 6], [0.95, 10], [1.3, 18], [1.6, 10], [1.95, -14], [2.3, -28], [2.6, -30]]),
  shR: track([[0, 1], [0.4, -6], [0.7, 12], [0.95, 42], [1.3, 72], [1.6, 82], [1.95, 128], [2.3, 158], [2.6, 162]]),
  elR: track([[0, 9], [0.4, 12], [0.7, 16], [0.95, 30], [1.3, 14], [1.6, 12], [1.95, 40], [2.3, 26], [2.6, 22]]),
  shL: track([[0, 1], [0.4, 9], [0.7, -14], [0.95, -32], [1.3, 58], [1.6, 74], [1.95, 118], [2.3, 152], [2.6, 157]]),
  elL: track([[0, 9], [0.4, 12], [0.7, 22], [0.95, 44], [1.3, 22], [1.6, 14], [1.95, 48], [2.3, 34], [2.6, 30]]),
};
/** total length of the collapse (s); afterwards the figure lies still */
export const COLLAPSE_T = 2.6;

export function collapsePose(s: number): Pose {
  // the controller's instability: a growing trunk wobble before the fall
  const wob = 4.5 * Math.sin(2 * Math.PI * 3.1 * s) * ss((s - 0.25) / 0.3) * (1 - ss((s - 1.05) / 0.25));
  return {
    pitch: (CK.pitch(s) + wob) * D, lumbar: CK.lumbar(s) * D, neck: CK.neck(s) * D,
    R: { hip: CK.hipR(s) * D, knee: CK.kneeR(s) * D, ankle: CK.ankR(s) * D, sh: CK.shR(s) * D, el: CK.elR(s) * D },
    L: { hip: CK.hipL(s) * D, knee: CK.kneeL(s) * D, ankle: CK.ankL(s) * D, sh: (CK.shL(s) - wob * 2) * D, el: CK.elL(s) * D },
  };
}

// ------------------------------------------------------------------ forward kinematics
const ax = (th: number): [number, number] => [Math.sin(th), -Math.cos(th)];
/** point in a segment frame: origin o, angle th, u along the axis, v anterior, z lateral offset */
export const loc = (o: P3, th: number, u: number, v: number, z = 0): P3 => [o[0] + u * Math.sin(th) + v * Math.cos(th), o[1] - u * Math.cos(th) + v * Math.sin(th), o[2] + z];
const add = (o: P3, d: [number, number], k: number): P3 => [o[0] + d[0] * k, o[1] + d[1] * k, o[2]];
const mid = (a: P3, b: P3, t = 0.5): P3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export interface Limb {
  s: number; // +1 right, -1 left
  hip: P3; knee: P3; ankle: P3; heel: P3; mtp: P3; toe: P3; heelC: P3; ballC: P3; toeC: P3;
  sh: P3; elbow: P3; wrist: P3; hand: P3;
  thTh: number; thSh: number; fa: number; ta: number; thArm: number; thFore: number; thHand: number;
}
export interface Skel { P: P3; S0: P3; L1: P3; T1: P3; C7: P3; head: P3; thP: number; thL: number; thT: number; thC: number; thH: number; R: Limb; L: Limb; com: P3 }

export function fk(pose: Pose, root: P3 = [0, 0, 0]): Skel {
  const P = root;
  const thP = -pose.pitch;
  const S0 = loc(P, thP, -0.06, -0.075);
  const thL = thP - 0.5 * pose.lumbar + 0.12; // lumbar lordosis: the top tilts back a little
  const L1 = add(S0, ax(thL), -SEG.lumbar);
  const thT = thP - pose.lumbar - 0.1; // thoracic kyphosis
  const T1 = add(L1, ax(thT), -SEG.thor);
  const thH = thP - pose.lumbar - pose.neck;
  const thC = (thT + thH) / 2 + 0.1;
  const C7 = add(T1, ax(thC), -SEG.neck);
  const head = loc(C7, thH, -0.075, 0.03);
  const limb = (sp: SidePose, s: number): Limb => {
    const hip: P3 = [P[0], P[1], P[2] + s * SEG.hipW];
    const thTh = sp.hip + thP;
    const knee = add(hip, ax(thTh), SEG.thigh);
    const thSh = thTh - sp.knee;
    const ankle = add(knee, ax(thSh), SEG.shank);
    const fa = thSh + sp.ankle; // foot angle, CCW from forward
    const thF = fa + Math.PI / 2;
    const heel = loc(ankle, thF, -0.05, -0.048);
    const heelC = loc(ankle, thF, -0.05, -0.068);
    const mtp = loc(ankle, thF, 0.145, -0.048);
    const ballC = loc(ankle, thF, 0.145, -0.068);
    const ta = fa + Math.max(0, -fa) * 0.85; // toes stay near flat while the heel rises
    const thToe = ta + Math.PI / 2;
    const toe = loc(mtp, thToe, 0.06, 0);
    const toeC = loc(mtp, thToe, 0.06, -0.014);
    const sh = loc(L1, thT, -0.245, 0.035, s * SEG.shW);
    const thArm = sp.sh + thP - pose.lumbar;
    const elbow = add(sh, ax(thArm), SEG.arm);
    const thFore = thArm + sp.el;
    const wrist = add(elbow, ax(thFore), SEG.fore);
    const thHand = thFore + 0.08;
    const hand = add(wrist, ax(thHand), SEG.hand);
    return { s, hip, knee, ankle, heel, mtp, toe, heelC, ballC, toeC, sh, elbow, wrist, hand, thTh, thSh, fa, ta, thArm, thFore, thHand };
  };
  const R = limb(pose.R, 1), Lm = limb(pose.L, -1);
  // centre of mass from segment masses (fractions of body mass)
  const parts: [P3, number][] = [[head, 0.081], [mid(S0, T1), 0.497]];
  for (const l of [R, Lm]) {
    parts.push([mid(l.sh, l.elbow), 0.028], [mid(l.elbow, l.wrist), 0.022], [mid(l.hip, l.knee, 0.43), 0.1], [mid(l.knee, l.ankle, 0.43), 0.0465], [mid(l.heel, l.mtp), 0.0145]);
  }
  const com: P3 = [0, 0, 0];
  for (const [p, m] of parts) { com[0] += p[0] * m; com[1] += p[1] * m; com[2] += p[2] * m; }
  return { P, S0, L1, T1, C7, head, thP, thL, thT, thC, thH, R, L: Lm, com };
}

/** shift a skeleton (used to move a body-frame solution into the world) */
export function fkAt(pose: Pose, x: number, y: number, z: number) { return fk(pose, [x, y, z]); }

// contact points (bone + a little soft tissue) the ground solver may rest the body on
export interface Contact { p: P3; foot?: Side }
export function contacts(k: Skel): Contact[] {
  const out: Contact[] = [];
  for (const [l, sd] of [[k.R, 'R'], [k.L, 'L']] as [Limb, Side][]) {
    out.push({ p: l.heelC, foot: sd }, { p: l.ballC, foot: sd }, { p: l.toeC, foot: sd });
    out.push({ p: loc(l.knee, l.thSh, 0.0, 0.05) }, { p: loc(l.knee, l.thSh, 0.07, 0.035) }, { p: loc(l.knee, l.thSh, 0.2, 0.03) });
    out.push({ p: loc(l.hip, l.thTh, 0.2, 0.075) }, { p: loc(l.hip, l.thTh, 0.34, 0.06) });
    out.push({ p: loc(l.elbow, l.thFore, 0.0, -0.03) }, { p: loc(l.wrist, l.thFore, 0, -0.02) }, { p: l.hand }, { p: loc(l.wrist, l.thHand, 0.08, 0.02) });
  }
  out.push({ p: loc(k.head, k.thH, 0, 0.11) }, { p: loc(k.head, k.thH, -0.06, 0.09) }, { p: loc(k.head, k.thH, 0.06, 0.08) }, { p: loc(k.head, k.thH, -0.11, 0) });
  out.push({ p: loc(k.L1, k.thT, -0.12, 0.16) }, { p: loc(k.L1, k.thT, -0.03, 0.15) }, { p: loc(k.L1, k.thT, -0.2, 0.14) });
  out.push({ p: loc(k.P, k.thP, 0.02, 0.09) }, { p: loc(k.P, k.thP, -0.06, 0.1) }, { p: loc(k.P, k.thP, 0.03, -0.12) });
  return out;
}

// ------------------------------------------------------------------ ground solver
export interface Step { t: number; x: number; side: Side }
export interface Track { t0: number; hz: number; x: Float64Array; y: Float64Array; follow: Float64Array; steps: Step[] }

/**
 * Rests the body on its lowest contact point and keeps whichever point carries it fixed on the floor (feet roll heel → ball →
 * toe without sliding; a falling body pivots on knees, then hands). A deterministic precompute: the same pose function
 * always gives the same table. `followWin` (s) smooths the root x into a camera/treadmill follow.
 */
export function solveTrack(poseAt: (t: number) => Pose, t0: number, t1: number, hz = 120, followWin = STRIDE_T): Track {
  const n = Math.max(2, Math.ceil((t1 - t0) * hz) + 1);
  const x = new Float64Array(n), y = new Float64Array(n);
  const steps: Step[] = [];
  let anchor = -1, anchorX = 0, lastFoot: Side | null = null, prevRoot = 0;
  for (let i = 0; i < n; i++) {
    const t = t0 + i / hz;
    const k = fk(poseAt(t));
    const cs = contacts(k);
    let lo = 0;
    for (let j = 1; j < cs.length; j++) if (cs[j].p[1] < cs[lo].p[1]) lo = j;
    const minY = cs[lo].p[1];
    if (anchor < 0) { anchor = lo; anchorX = cs[lo].p[0]; }
    else if (lo !== anchor && cs[lo].p[1] < cs[anchor].p[1] - 0.002) {
      anchor = lo;
      anchorX = prevRoot + cs[lo].p[0];
    }
    const rx = anchorX - cs[anchor].p[0];
    x[i] = rx; y[i] = -minY; prevRoot = rx;
    const ft = cs[anchor].foot;
    if (ft && ft !== lastFoot) { steps.push({ t, x: rx + k[ft].heelC[0], side: ft }); lastFoot = ft; }
  }
  // centred moving average for the follow
  const pre = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + x[i];
  const hw = Math.max(1, Math.round((followWin * hz) / 2));
  const follow = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - hw), b = Math.min(n - 1, i + hw);
    follow[i] = (pre[b + 1] - pre[a]) / (b - a + 1);
  }
  return { t0, hz, x, y, follow, steps };
}

export function sampleTrack(tr: Track, t: number) {
  const n = tr.x.length;
  const u = clamp((t - tr.t0) * tr.hz, 0, n - 1);
  const i = Math.min(n - 2, Math.floor(u)), f = u - i;
  return { x: lerp(tr.x[i], tr.x[i + 1], f), y: lerp(tr.y[i], tr.y[i + 1], f), follow: lerp(tr.follow[i], tr.follow[i + 1], f) };
}

// ------------------------------------------------------------------ walking schedule
/** integral of a smoothstep ramp that starts at a and is fully on after r seconds */
const rampInt = (t: number, a: number, r: number) => {
  if (t <= a) return 0;
  if (t >= a + r) return r / 2 + (t - a - r);
  const u = (t - a) / r;
  return r * (u * u * u - (u * u * u * u) / 2);
};
/** a walk that ramps on at `start` and off by `stop` (ramp r): returns [phase advance in cycles, amplitude 0..1] */
export function walkWindow(t: number, start: number, stop: number, r: number): [number, number] {
  const on = rampInt(t, start, r) - rampInt(t, stop - r, r);
  const amp = ss((t - start) / r) * (1 - ss((t - (stop - r)) / r));
  return [on / STRIDE_T, amp];
}

// ------------------------------------------------------------------ muscles
export type SegName = 'pelvis' | 'thorax' | 'thigh' | 'shank' | 'foot' | 'arm' | 'fore';
export interface Attach { seg: SegName; u: number; v: number; z?: number }
export type MGroup = 'hip' | 'knee' | 'calf' | 'shin' | 'shoulder' | 'elbow' | 'trunk';
export interface MuscleDef { id: string; a: Attach; b: Attach; r: number; group: MGroup; peak?: number; shoulder?: boolean }

/** one side's muscle groups (lines of action between attachment points); trunk muscles are mirrored too */
export const MUSCLES: MuscleDef[] = [
  { id: 'gluteus', a: { seg: 'pelvis', u: -0.07, v: -0.115, z: -0.02 }, b: { seg: 'thigh', u: 0.12, v: -0.035, z: 0.015 }, r: 0.03, group: 'hip' },
  { id: 'iliopsoas', a: { seg: 'pelvis', u: -0.12, v: 0.0, z: -0.04 }, b: { seg: 'thigh', u: 0.07, v: 0.0, z: -0.015 }, r: 0.016, group: 'hip' },
  { id: 'rectusFem', a: { seg: 'pelvis', u: -0.04, v: 0.055 }, b: { seg: 'thigh', u: 0.405, v: 0.05 }, r: 0.022, group: 'knee' },
  { id: 'vastus', a: { seg: 'thigh', u: 0.07, v: 0.005, z: 0.03 }, b: { seg: 'thigh', u: 0.4, v: 0.045, z: 0.012 }, r: 0.027, group: 'knee' },
  { id: 'hamstring', a: { seg: 'pelvis', u: 0.045, v: -0.07 }, b: { seg: 'shank', u: 0.05, v: -0.03 }, r: 0.023, group: 'hip', peak: 0.45 },
  { id: 'gastroc', a: { seg: 'thigh', u: 0.4, v: -0.035 }, b: { seg: 'foot', u: -0.055, v: -0.02 }, r: 0.027, group: 'calf', peak: 0.3 },
  { id: 'soleus', a: { seg: 'shank', u: 0.12, v: -0.025, z: -0.01 }, b: { seg: 'foot', u: -0.05, v: -0.025 }, r: 0.019, group: 'calf', peak: 0.55 },
  { id: 'tibAnt', a: { seg: 'shank', u: 0.08, v: 0.03, z: 0.01 }, b: { seg: 'foot', u: 0.075, v: -0.005 }, r: 0.014, group: 'shin', peak: 0.35 },
  { id: 'deltAnt', a: { seg: 'thorax', u: -0.27, v: 0.06, z: 0.15 }, b: { seg: 'arm', u: 0.13, v: 0.012, z: 0.02 }, r: 0.022, group: 'shoulder', shoulder: true },
  { id: 'deltPost', a: { seg: 'thorax', u: -0.27, v: -0.045, z: 0.15 }, b: { seg: 'arm', u: 0.13, v: -0.01, z: 0.02 }, r: 0.022, group: 'shoulder', shoulder: true },
  { id: 'pectoral', a: { seg: 'thorax', u: -0.16, v: 0.13, z: 0.04 }, b: { seg: 'arm', u: 0.06, v: 0.02, z: -0.01 }, r: 0.02, group: 'shoulder', shoulder: true },
  { id: 'latissimus', a: { seg: 'thorax', u: 0.02, v: -0.07, z: 0.06 }, b: { seg: 'arm', u: 0.07, v: -0.005, z: -0.01 }, r: 0.022, group: 'shoulder', shoulder: true },
  { id: 'biceps', a: { seg: 'thorax', u: -0.245, v: 0.065, z: 0.15 }, b: { seg: 'fore', u: 0.04, v: 0.022 }, r: 0.018, group: 'elbow', shoulder: true, peak: 0.6 },
  { id: 'triceps', a: { seg: 'thorax', u: -0.215, v: -0.02, z: 0.16 }, b: { seg: 'fore', u: -0.025, v: -0.02 }, r: 0.02, group: 'elbow', shoulder: true, peak: 0.55 },
  { id: 'abdominis', a: { seg: 'thorax', u: -0.08, v: 0.125, z: 0.035 }, b: { seg: 'pelvis', u: 0.0, v: 0.075, z: 0.025 }, r: 0.018, group: 'trunk' },
  { id: 'erector', a: { seg: 'pelvis', u: -0.09, v: -0.11, z: 0.03 }, b: { seg: 'thorax', u: -0.2, v: -0.075, z: 0.035 }, r: 0.021, group: 'trunk' },
];
/** the shoulder muscles whose moment arms the probe beat measures */
export const SHOULDER_IDS = MUSCLES.filter((m) => m.shoulder).map((m) => m.id);

/** world position of an attachment on side s of skeleton k */
export function attach(k: Skel, side: Side, a: Attach): P3 {
  const l = k[side], s = l.s, z = (a.z ?? 0) * s;
  switch (a.seg) {
    case 'pelvis': return loc(k.P, k.thP, a.u, a.v, s * SEG.hipW * 0.55 + z);
    case 'thorax': return loc(k.L1, k.thT, a.u, a.v, z);
    case 'thigh': return loc(l.hip, l.thTh, a.u, a.v, z);
    case 'shank': return loc(l.knee, l.thSh, a.u, a.v, z);
    case 'foot': return loc(l.ankle, l.fa + Math.PI / 2, a.u, a.v, z);
    case 'arm': return loc(l.sh, l.thArm, a.u, a.v, z);
    case 'fore': return loc(l.elbow, l.thFore, a.u, a.v, z);
  }
}

const bump = (ph: number, c: number, w: number) => {
  const d = Math.abs((((ph - c) % 1) + 1.5) % 1 - 0.5);
  return Math.exp(-((d / w) ** 2));
};
/** activation 0..1 of a muscle group during gait (phase of that side's leg; arm swing uses the same phase) */
export function gaitActivation(id: string, ph: number): number {
  switch (id) {
    case 'gluteus': return bump(ph, 0.04, 0.09);
    case 'iliopsoas': return bump(ph, 0.62, 0.09);
    case 'rectusFem': return Math.max(bump(ph, 0.56, 0.06), 0.6 * bump(ph, 0.05, 0.06));
    case 'vastus': return bump(ph, 0.07, 0.08);
    case 'hamstring': return bump(ph, 0.93, 0.08);
    case 'gastroc': return bump(ph, 0.44, 0.08);
    case 'soleus': return bump(ph, 0.4, 0.1);
    case 'tibAnt': return Math.max(bump(ph, 0.02, 0.06), 0.7 * bump(ph, 0.68, 0.08));
    case 'deltAnt': return 0.8 * bump(ph, 0.45, 0.12);
    case 'deltPost': return 0.8 * bump(ph, 0.95, 0.12);
    case 'pectoral': return 0.45 * bump(ph, 0.5, 0.1);
    case 'latissimus': return 0.55 * bump(ph, 0.0, 0.1);
    case 'biceps': return 0.4 * bump(ph, 0.5, 0.12);
    case 'triceps': return 0.4 * bump(ph, 0.0, 0.12);
    case 'abdominis': return 0.3 * Math.max(bump(ph, 0.02, 0.06), bump(ph, 0.52, 0.06));
    case 'erector': return 0.65 * Math.max(bump(ph, 0.02, 0.07), bump(ph, 0.52, 0.07));
  }
  return 0;
}

/** perpendicular foot of point j on the line a→b (2D, screen space), and the moment-arm length */
export function momentArm2(j: [number, number], a: [number, number], b: [number, number]) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1e-9;
  const t = ((j[0] - a[0]) * dx + (j[1] - a[1]) * dy) / L2;
  const p: [number, number] = [a[0] + dx * t, a[1] + dy * t];
  return { p, t, len: Math.hypot(p[0] - j[0], p[1] - j[1]) };
}
