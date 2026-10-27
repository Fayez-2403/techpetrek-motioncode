// 06 · HUMAN SIMULATION — B ("Illustrative reconstruction" + "Moonshot internal example, recreated for this film").
// A dim scientific visualization (WORLD.lab) of Moonshot's internal walking-simulator example on human-atlas.
//   entry     05's cyan dimension arc (270°, r 194 px) shrinks onto the hip joint; the skeleton resolves around it,
//             muscle groups light up; atlas note 296 skeletal · 402 muscle components (N.atlas)
//   split     INITIAL ATTEMPT (unstable trunk, buckling knees, collapse) | diagnostic loop + counters | IMPROVED
//             CONTROLLER (alternating stride); joint arcs, centre-of-mass and support-base constraints; mission timeline
//             counts to N.missions, reviews to N.reviews
//   shoulder  (master) open-loop probe of the shoulder: moment-arm checks flagged red, corrected to mint, CLAIMS.shoulder
//             (reel) the same flash on the improved figure's shoulder inside its panel
//   hero      the retrained figure walks; stride timer to N.walkSeconds, CLAIMS.walking.display; its knee writes a trace
//   exit      the lab darkens; the knee-angle trace autoscales to a mint line across the frame at 0.55 H (07 picks it up)
// The kinematics are an illustrative model (src/data/humanSimModel.ts), not Moonshot's simulator or its data.
import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import timings from '../../SCENE_TIMINGS.json';
import { CLAIMS, N } from '../data/verifiedClaims';
import {
  COLLAPSE_T, MUSCLES, SEG, SHOULDER_IDS, STAND, attach, collapsePose, contacts, fk, gaitActivation, gaitPose, mixPose, momentArm2,
  sampleTrack, solveTrack, walkWindow, type P3, type Pose, type Side, type Skel, type Track,
} from '../data/humanSimModel';
import { Figure, LabFloor, LabLights } from '../three/HumanRig';
import { CamRig, Env, ThreeStage } from '../three/stage';
import { ProvenanceLabel } from '../components/ProvenanceLabel';
import { SourceAttribution } from '../components/SourceAttribution';
import { Vignette } from '../components/Backdrop';
import { KineticTitle } from '../components/KineticTitle';
import { clamp, easeInOutCubic, easeOutCubic, easeOutExpo, fmt, invLerp, lerp } from '../lib/anim';
import { hash } from '../lib/rng';
import { useLayout } from '../lib/layout';
import { C, WORLD } from '../styles/theme';
import { F } from '../styles/typography';
import type { SceneProps, Variant } from './types';

const FPS = 30;
const DEG = Math.PI / 180;
const FOV = 14;
const TARGET: P3 = [0, 0.9, 0];
type XY = [number, number];

const ss = (x: number) => { x = clamp(x); return x * x * (3 - 2 * x); };
const win = (t: number, a: number, b: number, d: number) => Math.min(ss((t - a) / d), 1 - ss((t - (b - d)) / d));
const rev = (t: number, a: number, d: number, e = easeOutCubic) => e(invLerp(a, a + d, t));

// ------------------------------------------------------------------ narration words (scene-local seconds)
interface VWord { w: string; t0: number }
interface VCard { words: VWord[] }
interface VScene { id: string; start: number; end: number }
function voSec(variant: Variant, re: RegExp, fallback: number): number {
  const v = (timings as unknown as { variants: Record<string, { scenes: VScene[]; captions: VCard[] }> }).variants[variant];
  const s = v?.scenes.find((x) => x.id === 'human');
  if (!s) return fallback;
  for (const c of v.captions) for (const w of c.words) if (w.t0 >= s.start - 0.05 && w.t0 < s.end && re.test(w.w)) return w.t0 - s.start;
  return fallback;
}

/** the spoken form of a verified number (so beats follow a re-voiced narration) */
const wordRe = (v: number, exact = false) => new RegExp(`^${String(v).replace('.', '\\.')}${exact ? '$' : ''}`);

// ------------------------------------------------------------------ timeline (fractions of the scene, beats on words)
interface TL {
  T: number; reel: boolean; arcEnd: number; splitAt: number; splitLen: number; shoulderAt: number; heroAt: number; exitAt: number;
  tA0: number; tB0: number; misStart: number; misLand: number; revStart: number; revLand: number;
  redAt: number; fixAt: number; fixEnd: number; probeA: number; probeB: number; walk1Stop: number; walk2Start: number; armFixAt: number;
  timerStart: number; timerLand: number; traceFrom: number; build: number;
}
function timeline(dur: number, variant: Variant): TL {
  const T = dur / FPS, reel = variant === 'reel';
  if (!reel) {
    const splitAt = 0.245 * T, shoulderAt = 0.475 * T, heroAt = 0.655 * T, exitAt = Math.min(0.94 * T, T - 1.0);
    const misLand = clamp(voSec(variant, wordRe(N.missions), 0.282 * T) + 0.4, splitAt + 1.0, shoulderAt - 2.2);
    const revLand = clamp(voSec(variant, wordRe(N.reviews), 0.4 * T) + 0.4, misLand + 1.0, shoulderAt - 0.4);
    const redAt = clamp(voSec(variant, wordRe(N.shoulderErrors, true), 0.5 * T), shoulderAt + 0.35, heroAt - 2.4);
    const fixAt = clamp(voSec(variant, /^fix/i, 0.59 * T), redAt + 1.0, heroAt - 0.9);
    const walk2Start = heroAt - 0.45;
    return {
      T, reel, arcEnd: 0.55, splitAt, splitLen: 0.55, shoulderAt, heroAt, exitAt, tA0: splitAt + 0.55, tB0: splitAt + 0.4,
      misStart: Math.max(misLand - 0.9, splitAt + 0.55), misLand, revStart: revLand - 1.0, revLand, redAt, fixAt, fixEnd: fixAt + 0.6,
      probeA: shoulderAt + 0.3, probeB: walk2Start - 0.05, walk1Stop: shoulderAt + 0.75, walk2Start, armFixAt: walk2Start,
      timerStart: heroAt + 0.35, timerLand: clamp(voSec(variant, wordRe(N.walkSeconds), 0.8 * T) + 0.35, heroAt + 1.6, exitAt - 0.9),
      traceFrom: heroAt + 0.35, build: 1,
    };
  }
  const splitAt = 0.15 * T, heroAt = 0.53 * T, exitAt = T - 0.8;
  const misLand = clamp(voSec(variant, wordRe(N.missions), 0.2 * T) + 0.3, splitAt + 0.6, heroAt - 2.2);
  const revLand = clamp(voSec(variant, wordRe(N.reviews), 0.34 * T) + 0.3, misLand + 0.75, heroAt - 1.4);
  const redAt = clamp(revLand + 0.2, misLand + 0.9, heroAt - 1.2);
  const fixAt = redAt + 0.45;
  return {
    T, reel, arcEnd: 0.45, splitAt, splitLen: 0.4, shoulderAt: heroAt, heroAt, exitAt, tA0: splitAt + 0.3, tB0: splitAt + 0.2,
    misStart: Math.max(misLand - 0.75, splitAt + 0.4), misLand, revStart: revLand - 0.75, revLand, redAt, fixAt, fixEnd: fixAt + 0.5,
    probeA: 1e9, probeB: 1e9, walk1Stop: T + 10, walk2Start: T + 10, armFixAt: fixAt + 0.55,
    timerStart: heroAt + 0.5, timerLand: clamp(voSec(variant, wordRe(N.walkSeconds), 0.65 * T) + 0.3, heroAt + 1.2, exitAt - 0.9),
    traceFrom: heroAt + 0.2, build: 0.6,
  };
}

// ------------------------------------------------------------------ camera views
interface View { ppm: number; yaw: number; elev: number; A: XY; B: XY }
function viewKeys(tl: TL): [number, View][] {
  if (!tl.reel) {
    const atlas: View = { ppm: 372, yaw: 21, elev: 6, A: [1250, 560], B: [1250, 560] };
    const split: View = { ppm: 252, yaw: 16, elev: 8, A: [400, 468], B: [1500, 468] };
    const shoulder: View = { ppm: 760, yaw: 30, elev: 3, A: [-600, 468], B: [1150, 880] };
    const hero: View = { ppm: 392, yaw: 15, elev: 7, A: [-600, 468], B: [1440, 500] };
    return [
      [0, { ppm: 194 / 0.24, yaw: 25, elev: 5, A: [960, 540], B: [960, 540] }],
      [2.9, atlas], [tl.splitAt, { ...atlas, ppm: 384 }], [tl.splitAt + tl.splitLen, split], [tl.shoulderAt, split],
      [tl.shoulderAt + 0.75, shoulder], [tl.heroAt - 0.35, { ...shoulder, ppm: 800 }], [tl.heroAt + 0.55, hero],
      [tl.exitAt, { ...hero, ppm: 404 }], [tl.T, { ...hero, ppm: 408 }],
    ];
  }
  const atlas: View = { ppm: 455, yaw: 21, elev: 6, A: [540, 880], B: [540, 880] };
  const split: View = { ppm: 176, yaw: 16, elev: 8, A: [330, 552], B: [330, 1100] };
  const hero: View = { ppm: 352, yaw: 14, elev: 7, A: [330, 552], B: [655, 942] };
  return [
    [0, { ppm: 194 / 0.24, yaw: 25, elev: 5, A: [540, 800], B: [540, 800] }],
    [1.15, atlas], [tl.splitAt, atlas], [tl.splitAt + tl.splitLen, split], [tl.heroAt, split], [tl.heroAt + 0.6, hero], [tl.T, { ...hero, ppm: 362 }],
  ];
}
function viewAt(t: number, keys: [number, View][]): View {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i], [t1, b] = keys[i + 1];
    if (t <= t1) {
      const e = easeInOutCubic(invLerp(t0, t1, t));
      const l2 = (p: XY, q: XY): XY => [lerp(p[0], q[0], e), lerp(p[1], q[1], e)];
      return { ppm: Math.exp(lerp(Math.log(a.ppm), Math.log(b.ppm), e)), yaw: lerp(a.yaw, b.yaw, e), elev: lerp(a.elev, b.elev, e), A: l2(a.A, b.A), B: l2(a.B, b.B) };
    }
  }
  return keys[keys.length - 1][1];
}
function makeCam(v: View, W: number, H: number) {
  const D = H / (2 * Math.tan((FOV * Math.PI) / 360) * v.ppm);
  const y = v.yaw * DEG, e = v.elev * DEG;
  const pos: P3 = [TARGET[0] + D * Math.sin(y) * Math.cos(e), TARGET[1] + D * Math.sin(e), TARGET[2] + D * Math.cos(y) * Math.cos(e)];
  const c = new THREE.PerspectiveCamera(FOV, W / H, 0.05, 2000);
  c.position.set(...pos); c.up.set(0, 1, 0); c.lookAt(...TARGET); c.updateMatrixWorld(); c.updateProjectionMatrix();
  const v3 = new THREE.Vector3();
  const proj = (p: P3): XY => { v3.set(p[0], p[1], p[2]).project(c); return [(v3.x * 0.5 + 0.5) * W, (-v3.y * 0.5 + 0.5) * H]; };
  // the focal plane through the target: a point there at pixel (px, py) projects exactly to (px, py), at the nominal scale
  const Fw = new THREE.Vector3(TARGET[0] - pos[0], TARGET[1] - pos[1], TARGET[2] - pos[2]).normalize();
  const Rw = new THREE.Vector3().crossVectors(Fw, new THREE.Vector3(0, 1, 0)).normalize();
  const Uw = new THREE.Vector3().crossVectors(Rw, Fw);
  const plane = (px: number, py: number): P3 => {
    const sx = (px - W / 2) / v.ppm, sy = (H / 2 - py) / v.ppm;
    return [TARGET[0] + Rw.x * sx + Uw.x * sy, TARGET[1] + Rw.y * sx + Uw.y * sy, TARGET[2] + Rw.z * sx + Uw.z * sy];
  };
  return { pos, proj, plane, ppm: v.ppm };
}
type Cam = ReturnType<typeof makeCam>;

// ------------------------------------------------------------------ the two controllers
function poseFns(tl: TL) {
  const poseA = (t: number): Pose => {
    if (t < tl.tA0) { const b = Math.sin(t * 1.9) * 0.35 * DEG; return { ...STAND, pitch: STAND.pitch + b }; }
    return collapsePose(t - tl.tA0);
  };
  const walk = (t: number): [number, number] => {
    const w1 = walkWindow(t, tl.tB0, tl.walk1Stop, tl.reel ? 0.45 : 0.55);
    const w2 = walkWindow(t, tl.walk2Start, tl.T + 30, 0.6);
    return [0.55 + w1[0] + w2[0], Math.max(w1[1], w2[1])];
  };
  const armMode = (t: number) => ss((t - tl.armFixAt) / 0.6);
  const probe = (t: number) => {
    const u = invLerp(tl.probeA, tl.probeB, t);
    const env = ss(u / 0.12) * (1 - ss((u - 0.86) / 0.14));
    return { env: u > 0 && u < 1 ? env : 0, sh: (78 * 0.5 * (1 - Math.cos(4 * Math.PI * u)) - 6) * DEG };
  };
  const poseB = (t: number): Pose => {
    const [ph, amp] = walk(t);
    const p = mixPose(STAND, gaitPose(ph, armMode(t)), amp);
    const pr = probe(t);
    if (pr.env > 0) p.R = { ...p.R, sh: lerp(p.R.sh, pr.sh, pr.env), el: lerp(p.R.el, 10 * DEG, pr.env) };
    return p;
  };
  return { poseA, poseB, walk, armMode, probe };
}

// ------------------------------------------------------------------ svg helpers
const arcD = (c: XY, r: number, a0: number, a1: number) => {
  // clockwise (screen) from a0 to a1, degrees
  const p0 = [c[0] + r * Math.cos(a0 * DEG), c[1] + r * Math.sin(a0 * DEG)], p1 = [c[0] + r * Math.cos(a1 * DEG), c[1] + r * Math.sin(a1 * DEG)];
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0, sweep = a1 >= a0 ? 1 : 0;
  return `M${p0[0].toFixed(2)},${p0[1].toFixed(2)} A${r.toFixed(2)},${r.toFixed(2)} 0 ${large} ${sweep} ${p1[0].toFixed(2)},${p1[1].toFixed(2)}`;
};
const angOf = (a: XY, b: XY) => Math.atan2(b[1] - a[1], b[0] - a[0]) / DEG;
const pts = (p: XY[]) => p.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');
const sub2 = (a: XY, b: XY): XY => [a[0] - b[0], a[1] - b[1]];

/** a joint arc from a reference direction to a segment direction (screen space) */
const JointArc: React.FC<{ c: XY; ref: XY; seg: XY; r: number; color: string; o: number; w?: number; label?: string; fs?: number }> = ({ c, ref, seg, r, color, o, w = 1.6, label, fs = 14 }) => {
  let a0 = angOf(c, ref), a1 = angOf(c, seg);
  let d = a1 - a0;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  if (d < 0) { [a0, a1] = [a1, a0]; d = -d; }
  a1 = a0 + d;
  const mid = (a0 + a1) / 2;
  return (
    <g opacity={o}>
      <path d={arcD(c, r, a0, a1)} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" />
      <line x1={c[0]} y1={c[1]} x2={c[0] + Math.cos(angOf(c, ref) * DEG) * r * 1.25} y2={c[1] + Math.sin(angOf(c, ref) * DEG) * r * 1.25}
        stroke={color} strokeWidth={1} strokeDasharray="2 3" opacity={0.7} />
      {label ? <text x={c[0] + Math.cos(mid * DEG) * (r + fs * 0.9)} y={c[1] + Math.sin(mid * DEG) * (r + fs * 0.9)} fill={color} fontFamily={F.mono} fontSize={fs}
        textAnchor="middle" dominantBaseline="central" style={{ letterSpacing: '0.06em' }}>{label}</text> : null}
    </g>
  );
};

/** centre-of-mass symbol: a ring with two filled quadrants */
const ComMark: React.FC<{ p: XY; r: number; color: string; o: number }> = ({ p, r, color, o }) => (
  <g opacity={o}>
    <circle cx={p[0]} cy={p[1]} r={r} fill="rgba(7,11,18,0.6)" stroke={color} strokeWidth={1.6} />
    <path d={`M${p[0]},${p[1]} L${p[0] + r},${p[1]} A${r},${r} 0 0 1 ${p[0]},${p[1] + r} Z M${p[0]},${p[1]} L${p[0] - r},${p[1]} A${r},${r} 0 0 1 ${p[0]},${p[1] - r} Z`} fill={color} />
  </g>
);

const STEPS = ['ANALYZE', 'IDENTIFY ERRORS', 'CORRECT', 'TEST', 'REPEAT'];

// ------------------------------------------------------------------ scene
export const HumanSimulation: React.FC<SceneProps> = ({ dur, variant }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const W = L.w, H = L.h;
  const tl = useMemo(() => timeline(dur, variant), [dur, variant]);
  const reel = tl.reel;
  const t = f / FPS;
  const P = useMemo(() => poseFns(tl), [tl]);
  const keys = useMemo(() => viewKeys(tl), [tl]);
  const trA = useMemo<Track>(() => solveTrack(P.poseA, 0, tl.T + 0.5), [P, tl.T]);
  const trB = useMemo<Track>(() => solveTrack(P.poseB, 0, tl.T + 0.5), [P, tl.T]);

  const view = viewAt(t, keys);
  const cam = makeCam(view, W, H);
  const ppm = cam.ppm;

  // ---- global phases
  const splitP = easeInOutCubic(invLerp(tl.splitAt, tl.splitAt + tl.splitLen, t));
  const shoulderP = reel ? 0 : easeInOutCubic(invLerp(tl.shoulderAt, tl.shoulderAt + 0.45, t));
  const heroP = easeInOutCubic(invLerp(tl.heroAt - (reel ? 0 : 0.3), tl.heroAt + (reel ? 0.6 : 0.5), t));
  const exitLen = reel ? 0.42 : 0.55;
  const dark = easeInOutCubic(invLerp(tl.exitAt, tl.exitAt + exitLen, t));
  const live = 1 - dark;

  // ---- figures
  const place = (anchor: XY, tr: Track, poseAt: (x: number) => Pose, at: number) => {
    // the standing right hip sits on the anchor pixel; each figure stands on its own floor patch at base[1]
    const ys = tr.y[0];
    const q = cam.plane(anchor[0], anchor[1]);
    const base: P3 = [q[0], q[1] - ys, q[2] - SEG.hipW];
    const s = sampleTrack(tr, at);
    const k = fk(poseAt(at), [base[0] + s.x - s.follow, base[1] + s.y, base[2]]);
    return { k, base, s };
  };
  const A = place(view.A, trA, P.poseA, t);
  const B = place(view.B, trB, P.poseB, t);
  // reel: the split UI clears quickly at the hero cut, before the hero type comes in
  const outR = reel ? 1 - ss((t - tl.heroAt) / 0.3) : 1;
  const opA = reel ? outR : 1 - ss((t - tl.shoulderAt) / 0.45);
  const opB = ss((t - tl.splitAt - 0.1) / 0.45) * live;
  const projA = (p: P3) => cam.proj(p);

  // atlas build-in (figure A is the atlas figure)
  const kb = tl.build;
  const build = {
    pelvis: invLerp(0.3 * kb, 0.8 * kb, t), legs: invLerp(0.06 * kb, 0.85 * kb, t), feet: invLerp(0.55 * kb, 1.05 * kb, t),
    spine: invLerp(0.32 * kb, 1.15 * kb, t), ribs: invLerp(0.6 * kb, 1.4 * kb, t), skull: invLerp(0.85 * kb, 1.45 * kb, t),
    arms: invLerp(0.8 * kb, 1.6 * kb, t), muscles: invLerp(1.25 * kb, 2.5 * kb, t),
  };
  const mIndex = (id: string) => MUSCLES.findIndex((m) => m.id === id);
  const actA = (id: string, sd: Side) => {
    const mi = mIndex(id);
    if (t < tl.tA0) {
      const at = (1.25 + (mi / MUSCLES.length) * 0.75 + (sd === 'L' ? 0.08 : 0)) * kb + 0.3;
      const flash = Math.exp(-(((t - at) / 0.28) ** 2));
      return 0.28 + 0.72 * flash + 0.06 * Math.sin(t * 2.1 + mi);
    }
    const s = t - tl.tA0;
    const chaos = 0.5 + 0.45 * Math.sin(2 * Math.PI * (2.1 + hash(mi, sd === 'R' ? 1 : 2) * 1.8) * s + hash(mi, 7) * 6);
    return 0.1 + ss(s / 0.3) * (1 - ss((s - (COLLAPSE_T - 0.6)) / 0.5)) * chaos;
  };
  // shoulder check state per muscle (B's shoulder muscles: red when flagged, mint when corrected)
  const shoulderState = (id: string) => {
    const i = SHOULDER_IDS.indexOf(id);
    if (i < 0) return 0;
    const flagged = ss((t - tl.redAt - i * 0.06) / 0.15);
    const fixed = ss((t - tl.fixAt - i * 0.07) / 0.18);
    const after = 1 - ss((t - (reel ? tl.heroAt + 0.4 : tl.heroAt + 0.2)) / 0.5);
    return flagged * after * (fixed > 0 ? 1 + fixed : 1); // 0 none, ~1 red, ~2 mint
  };
  const actB = (id: string, sd: Side) => {
    const [ph, amp] = P.walk(t);
    const phs = sd === 'R' ? ph : ph + 0.5;
    const m = MUSCLES[mIndex(id)];
    let a = 0.08 + amp * 0.95 * gaitActivation(id, phs);
    if (m.shoulder) {
      const stiff = 0.1 + amp * 0.34;
      a = lerp(stiff, a, P.armMode(t));
      const pr = P.probe(t);
      if (pr.env > 0 && sd === 'R') a = lerp(a, 0.35 + 0.5 * Math.abs(Math.sin(4 * Math.PI * invLerp(tl.probeA, tl.probeB, t))), pr.env);
      const st = shoulderState(id);
      if (st > 0 && sd === 'R') a = Math.max(a, 0.55 + 0.35 * Math.abs(Math.sin(t * 9)) * (st < 1.5 ? 1 : 0));
    }
    return a;
  };
  const colB = (id: string, sd: Side) => {
    if (sd !== 'R') return undefined;
    const st = shoulderState(id);
    if (st <= 0.01) return undefined;
    const red = new THREE.Color(WORLD.lab.muscle).lerp(new THREE.Color(C.red), clamp(st));
    return '#' + red.lerp(new THREE.Color(C.mint), clamp(st - 1)).getHexString();
  };

  // ---- the entry arc (05's dimension arc → the hip-joint rotation arc)
  const arcE = easeInOutCubic(invLerp(0, tl.arcEnd, t));
  const hipS = cam.proj(A.k.R.hip);
  const arcC: XY = [hipS[0], hipS[1]];
  const arcR = lerp(194, 0.15 * ppm, arcE);
  const a0 = lerp(-90, 60, arcE), a1 = lerp(180, 105, arcE);
  const arcO = 1 - ss((t - (reel ? 0.95 : 2.0)) / (reel ? 0.25 : 0.45));
  const femurA = angOf(hipS, cam.proj(A.k.R.knee));

  // ---- counters
  const mis = Math.round(N.missions * easeOutCubic(invLerp(tl.misStart, tl.misLand, t)));
  const revs = Math.round(N.reviews * easeOutCubic(invLerp(tl.revStart, tl.revLand, t)));
  const timer = N.walkSeconds * (0.82 * invLerp(tl.timerStart, tl.timerLand, t) + 0.18 * easeOutCubic(invLerp(tl.timerStart, tl.timerLand, t)));
  const timerDone = t >= tl.timerLand;
  const walkWords = CLAIMS.walking.display.split(' ');
  const walkNumOk = walkWords[0] === fmt(N.walkSeconds, 1);
  const walkUnit = walkNumOk ? walkWords[1] : '';
  const walkRest = walkNumOk ? walkWords.slice(2).join(' ') : CLAIMS.walking.display;
  const shWords = CLAIMS.shoulder.display.split(' ');
  const shRest = shWords.slice(1).join(' ');
  const shRestFound = shWords.slice(1, -1).join(' ');

  // shoulder captures: N.shoulderErrors moment-arm checks taken during the probe (6 muscles per capture)
  const nErr = N.shoulderErrors;
  const nCap = Math.ceil(nErr / SHOULDER_IDS.length);
  const capT = (c: number) => lerp(tl.redAt - 0.05, tl.redAt + (reel ? 0.35 : 0.85), nCap > 1 ? c / (nCap - 1) : 0);
  const flaggedAt = (i: number) => capT(Math.floor(i / SHOULDER_IDS.length)) + (i % SHOULDER_IDS.length) * 0.02;
  const fixedAt = (i: number) => tl.fixAt + (i / Math.max(1, nErr - 1)) * (tl.fixEnd - tl.fixAt);
  let nFlag = 0, nFixed = 0;
  // a check counts as corrected when its colour flips (midpoint of its 0.15 s change), so counter and cells agree
  for (let i = 0; i < nErr; i++) { if (t >= flaggedAt(i)) nFlag++; if (t >= fixedAt(i) + 0.075) nFixed++; }
  const fixedAll = nFixed >= nErr;

  // loop step
  let step = -1;
  if (t >= tl.splitAt + 0.3 && t < tl.shoulderAt) {
    const per = reel ? 0.42 : 0.62;
    const k = Math.floor((t - tl.splitAt - 0.3) / per);
    step = reel ? (k < STEPS.length ? k : -2) : k % STEPS.length;
  }
  if (!reel && t >= tl.shoulderAt) step = t < tl.redAt ? 0 : t < tl.fixAt ? 1 : t < tl.fixEnd ? 2 : t < tl.heroAt - 0.2 ? 3 : 4;
  if (reel && step === -2) step = t < tl.fixAt ? 1 : t < tl.fixEnd ? 2 : 3;

  // ---- type sizes
  const lab = L.t.label, ev = L.t.evidence;
  const mono: React.CSSProperties = { fontFamily: F.mono, letterSpacing: '0.1em', color: WORLD.lab.text, whiteSpace: 'nowrap' };

  // ---- layout boxes
  const panA = reel ? { x0: 64, y0: 386, x1: 1016, y1: 742 } : { x0: 80, y0: 150, x1: 760, y1: 740 };
  const panB = reel ? { x0: 64, y0: 930, x1: 1016, y1: 1286 } : { x0: 1160, y0: 150, x1: 1840, y1: 740 };
  // the improved panel grows into the hero frame
  const heroBox = reel ? { x0: 64, y0: 386, x1: 1016, y1: 1286 } : { x0: 80, y0: 150, x1: 1840, y1: 740 };
  const pB = {
    x0: lerp(panB.x0, heroBox.x0, heroP), y0: lerp(panB.y0, heroBox.y0, heroP), x1: lerp(panB.x1, heroBox.x1, heroP), y1: lerp(panB.y1, heroBox.y1, heroP),
  };
  const panelO = splitP * (reel ? 1 : 1 - shoulderP);
  const panelBO = reel ? splitP * (1 - heroP) : panelO;

  // ---- knee trace (hero → exit)
  const yC = 0.55 * H, amp = (reel ? 0.036 : 0.055) * H, kMid = 32;
  const kScale = amp / kMid;
  const heroView = keys[keys.length - 2][1];
  const penOff = 0.5;
  const penXExit = heroView.B[0] - penOff * heroView.ppm;
  const xLeft = 0.08 * W, xRight = 0.92 * W;
  const tFreeze = Math.min(t, tl.exitAt);
  const speed = (penXExit - xLeft) / Math.max(0.5, tl.exitAt - tl.traceFrom);
  const penX = cam.proj(B.k.P)[0] - penOff * ppm;
  const trace: XY[] = [];
  if (t > tl.traceFrom) {
    const fit = easeInOutCubic(invLerp(tl.exitAt, tl.exitAt + exitLen, t));
    const penNow = lerp(penX, penXExit, dark > 0 ? 1 : 0);
    for (let tau = tl.traceFrom; tau <= tFreeze + 1e-6; tau += 1 / 60) {
      const knee = P.poseB(tau).R.knee / DEG;
      const x = penNow - (tFreeze - tau) * speed;
      const y = yC + (kMid - knee) * kScale;
      const xFit = xLeft + ((tau - tl.traceFrom) / Math.max(1e-3, tl.exitAt - tl.traceFrom)) * (xRight - xLeft);
      trace.push([lerp(x, xFit, fit), y]);
    }
  }
  const traceO = clamp(invLerp(tl.traceFrom, tl.traceFrom + 0.4, t));

  // ---- COM trail + support for a figure
  const comTrail = (fig: typeof A, tr: Track, poseAt: (x: number) => Pose, span: number, n: number): XY[] => {
    const out: XY[] = [];
    for (let i = n; i >= 0; i--) {
      const tau = Math.max(0, t - (i / n) * span);
      const s = sampleTrack(tr, tau);
      const k = fk(poseAt(tau), [fig.base[0] + s.x - fig.s.follow, fig.base[1] + s.y, fig.base[2]]);
      out.push(cam.proj([k.com[0], k.com[1], k.com[2]]));
    }
    return out;
  };
  const support = (k: Skel, fy: number) => {
    const cs = contacts(k).filter((c) => c.p[1] - fy < 0.02);
    if (!cs.length) return null;
    let lo = Infinity, hi = -Infinity;
    for (const c of cs) { lo = Math.min(lo, c.p[0]); hi = Math.max(hi, c.p[0]); }
    return { lo, hi, inside: k.com[0] >= lo - 0.02 && k.com[0] <= hi + 0.02 };
  };

  // ---- figure overlays (joint arcs, COM, support, footprints)
  const figOverlay = (fig: typeof A, kind: 'A' | 'B', o: number, scale: number) => {
    if (o <= 0.01) return null;
    const k = fig.k, l = k.R;
    const hp = cam.proj(l.hip), kn = cam.proj(l.knee), an = cam.proj(l.ankle);
    const down = cam.proj([l.hip[0], l.hip[1] - 0.3, l.hip[2]]);
    const thighExt: XY = [kn[0] + (kn[0] - hp[0]), kn[1] + (kn[1] - hp[1])];
    const sup = support(k, fig.base[1]);
    const failing = kind === 'A' && t > tl.tA0 + 0.75;
    const bad = kind === 'A' && (!sup?.inside || failing);
    const col = kind === 'A' ? (bad ? C.red : C.amber) : C.mint;
    const arcCol = kind === 'A' && failing ? C.red : C.cyan;
    const com = cam.proj(k.com);
    const comFloor = cam.proj([k.com[0], fig.base[1], fig.base[2] + SEG.hipW]);
    const trail = comTrail(fig, kind === 'A' ? trA : trB, kind === 'A' ? P.poseA : P.poseB, 1.1, 22);
    const fs = Math.max(12, (reel ? 15 : 14) * scale);
    const els: React.ReactNode[] = [];
    // footprints (B): step markers on the floor that scroll with the grid
    if (kind === 'B') {
      for (const st of trB.steps) {
        const age = t - st.t;
        if (age < 0 || age > 2.4 || st.t < tl.tB0) continue;
        const z = fig.base[2] + SEG.hipW + (st.side === 'R' ? SEG.hipW : -SEG.hipW);
        const x = fig.base[0] + st.x - fig.s.follow;
        const p0 = cam.proj([x - 0.02, fig.base[1], z]), p1 = cam.proj([x + 0.2, fig.base[1], z]);
        els.push(<line key={`fp${st.t}`} x1={p0[0]} y1={p0[1]} x2={p1[0]} y2={p1[1]} stroke={st.side === 'R' ? C.mint : C.cyan} strokeWidth={3 * scale}
          strokeLinecap="round" opacity={0.75 * (1 - age / 2.4)} />);
      }
    }
    if (sup) {
      const s0 = cam.proj([sup.lo, fig.base[1], fig.base[2] + SEG.hipW]), s1 = cam.proj([sup.hi, fig.base[1], fig.base[2] + SEG.hipW]);
      els.push(<line key="sup" x1={s0[0] - 2} y1={s0[1]} x2={s1[0] + 2} y2={s1[1]} stroke={col} strokeWidth={4 * scale} strokeLinecap="round" opacity={0.9} />);
    }
    els.push(<polyline key="trail" points={pts(trail)} fill="none" stroke={kind === 'A' ? (failing ? C.red : C.amber) : C.mint} strokeWidth={1.6 * scale} opacity={0.55} strokeDasharray={`${4 * scale} ${3 * scale}`} />);
    els.push(<line key="plumb" x1={com[0]} y1={com[1]} x2={comFloor[0]} y2={comFloor[1]} stroke={col} strokeWidth={1.2} strokeDasharray="3 4" opacity={0.75} />);
    els.push(<ComMark key="com" p={com} r={7 * scale} color={col} o={1} />);
    if (!(kind === 'A' && t > tl.tA0 + 1.2)) {
      els.push(<JointArc key="ah" c={hp} ref={down} seg={kn} r={0.14 * ppm} color={arcCol} o={0.9} fs={fs} />);
      els.push(<JointArc key="ak" c={kn} ref={thighExt} seg={an} r={0.1 * ppm} color={kind === 'A' && failing ? C.red : C.cyan} o={0.9} fs={fs} />);
    }
    return <g opacity={o}>{els}</g>;
  };

  // ---- atlas callouts (master)
  const callouts = () => {
    if (reel) return null;
    const o = (1 - ss((t - tl.splitAt + 0.2) / 0.35)) * live;
    if (o <= 0.01) return null;
    const k = A.k;
    const mid = (a: P3, b: P3): P3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    const mm = (id: string) => { const m = MUSCLES[mIndex(id)]; return mid(attach(k, 'R', m.a), attach(k, 'R', m.b)); };
    const hx = cam.proj(k.P)[0];
    const bones: [string, P3][] = [['SKULL', k.head], ['RIBCAGE', [k.L1[0] + 0.1, k.L1[1] + 0.14, k.L1[2] + 0.12]], ['PELVIS', [k.P[0] - 0.05, k.P[1] + 0.05, k.P[2] + 0.1]],
      ['FEMUR', mid(k.R.hip, k.R.knee)], ['TIBIA', mid(k.R.knee, k.R.ankle)]];
    const musc: [string, P3][] = [['DELTOID', mm('deltAnt')], ['GLUTEUS MAXIMUS', mm('gluteus')], ['HAMSTRINGS', mm('hamstring')], ['QUADRICEPS', mm('vastus')], ['GASTROCNEMIUS', mm('gastroc')]];
    const items: React.ReactNode[] = [];
    const lay = (list: [string, P3][], side: 1 | -1, at: number, color: string) => {
      const xs = hx + side * 0.44 * ppm;
      let lastY = -1e9;
      list.forEach(([name, p], i) => {
        const q = cam.proj(p);
        const y = Math.max(q[1], lastY + 30);
        lastY = y;
        const a = rev(t, at + i * 0.09, 0.35);
        if (a <= 0) return;
        const x1 = lerp(q[0], xs, a);
        items.push(
          <g key={`${name}`} opacity={a}>
            <circle cx={q[0]} cy={q[1]} r={3} fill={color} />
            <polyline points={pts([q, [q[0] + side * 14, y], [x1, y]])} fill="none" stroke={color} strokeWidth={1} opacity={0.55} />
            <text x={xs + side * 8} y={y} fill={WORLD.lab.text} fontFamily={F.mono} fontSize={15} dominantBaseline="central" textAnchor={side > 0 ? 'start' : 'end'}
              style={{ letterSpacing: '0.12em' }} opacity={0.85}>{name}</text>
          </g>,
        );
      });
    };
    lay(bones, 1, 1.55, WORLD.lab.bone);
    lay(musc, -1, 2.55, WORLD.lab.muscle);
    return <g opacity={o}>{items}</g>;
  };

  // ---- the shoulder loupe (master): moment arms magnified around the shoulder joint
  const loupe = () => {
    if (reel) return null;
    const o = win(t, tl.shoulderAt + 0.55, tl.heroAt + 0.1, 0.35) * live;
    if (o <= 0.01) return null;
    const J = cam.proj(B.k.R.sh);
    const LC: XY = [1590, 300], LR = 150, mag = 3.4;
    const toL = (p: XY): XY => [LC[0] + (p[0] - J[0]) * mag, LC[1] + (p[1] - J[1]) * mag];
    const lines: React.ReactNode[] = [];
    // live lines of action + moment arms
    SHOULDER_IDS.forEach((id, i) => {
      const m = MUSCLES[mIndex(id)];
      const a = cam.proj(attach(B.k, 'R', m.a)), b = cam.proj(attach(B.k, 'R', m.b));
      const ma = momentArm2(J, a, b);
      const A2 = toL(a), B2 = toL(b), Pm = toL(ma.p);
      lines.push(<line key={`la${i}`} x1={A2[0]} y1={A2[1]} x2={B2[0]} y2={B2[1]} stroke={WORLD.lab.muscle} strokeWidth={1.4} opacity={0.5} />);
      lines.push(<line key={`ma${i}`} x1={LC[0]} y1={LC[1]} x2={Pm[0]} y2={Pm[1]} stroke={C.cyan} strokeWidth={1.2} opacity={0.6} />);
    });
    // captured checks (the flagged / corrected moment arms)
    for (let i = 0; i < nErr; i++) {
      const fa = flaggedAt(i);
      if (t < fa) continue;
      const c = Math.floor(i / SHOULDER_IDS.length), id = SHOULDER_IDS[i % SHOULDER_IDS.length];
      const m = MUSCLES[mIndex(id)];
      const tau = capT(c);
      const s = sampleTrack(trB, tau);
      const kc = fk(P.poseB(tau), [B.base[0] + s.x - B.s.follow, B.base[1] + s.y, B.base[2]]);
      const Jc = cam.proj(kc.R.sh);
      const a = sub2(cam.proj(attach(kc, 'R', m.a)), sub2(Jc, J)), b = sub2(cam.proj(attach(kc, 'R', m.b)), sub2(Jc, J));
      const ma = momentArm2(J, a, b);
      const v = sub2(ma.p, J);
      const dA = (hash(i, 11) - 0.5) * 70 * DEG, sc = 0.45 + hash(i, 12) * 1.2;
      const ve: XY = [(v[0] * Math.cos(dA) - v[1] * Math.sin(dA)) * sc, (v[0] * Math.sin(dA) + v[1] * Math.cos(dA)) * sc];
      const fx = ss((t - fixedAt(i)) / 0.15);
      const vv: XY = [lerp(ve[0], v[0], fx), lerp(ve[1], v[1], fx)];
      const end = toL([J[0] + vv[0], J[1] + vv[1]]);
      const col = fx > 0.5 ? C.mint : C.red;
      const pop = Math.exp(-(((t - fa) / 0.12) ** 2));
      lines.push(<line key={`c${i}`} x1={LC[0]} y1={LC[1]} x2={end[0]} y2={end[1]} stroke={col} strokeWidth={1.8 + pop * 2} opacity={0.85} strokeLinecap="round" />);
      if (fx < 0.5) {
        const s2 = 4;
        lines.push(<path key={`x${i}`} d={`M${end[0] - s2},${end[1] - s2} L${end[0] + s2},${end[1] + s2} M${end[0] - s2},${end[1] + s2} L${end[0] + s2},${end[1] - s2}`} stroke={C.red} strokeWidth={1.5} />);
      } else {
        // right-angle tick where the corrected moment arm meets the line of action
        const u = Math.hypot(v[0], v[1]) || 1, ux = v[0] / u, uy = v[1] / u, s2 = 6;
        const pa: XY = [end[0] - ux * s2, end[1] - uy * s2];
        lines.push(<polyline key={`r${i}`} points={pts([pa, [pa[0] - uy * s2, pa[1] + ux * s2], [end[0] - uy * s2, end[1] + ux * s2]])} fill="none" stroke={C.mint} strokeWidth={1.2} opacity={0.9} />);
      }
    }
    const hum = toL(cam.proj(B.k.R.elbow));
    return (
      <g opacity={o}>
        <defs><clipPath id="hs-loupe"><circle cx={LC[0]} cy={LC[1]} r={LR} /></clipPath></defs>
        <line x1={J[0]} y1={J[1]} x2={LC[0] - LR * 0.72} y2={LC[1] + LR * 0.7} stroke={C.cyan} strokeWidth={1} opacity={0.5} strokeDasharray="3 4" />
        <circle cx={J[0]} cy={J[1]} r={18} fill="none" stroke={C.cyan} strokeWidth={1.2} opacity={0.8} />
        <circle cx={LC[0]} cy={LC[1]} r={LR} fill="rgba(6,10,20,0.82)" stroke="rgba(150,190,230,0.35)" strokeWidth={1.2} />
        <g clipPath="url(#hs-loupe)">
          {Array.from({ length: 9 }, (_, i) => <line key={`g${i}`} x1={LC[0] - LR} x2={LC[0] + LR} y1={LC[1] - LR + (i + 1) * (LR / 5)} y2={LC[1] - LR + (i + 1) * (LR / 5)} stroke="rgba(120,160,200,0.08)" />)}
          {Array.from({ length: 9 }, (_, i) => <line key={`h${i}`} y1={LC[1] - LR} y2={LC[1] + LR} x1={LC[0] - LR + (i + 1) * (LR / 5)} x2={LC[0] - LR + (i + 1) * (LR / 5)} stroke="rgba(120,160,200,0.08)" />)}
          <line x1={LC[0]} y1={LC[1]} x2={hum[0]} y2={hum[1]} stroke={WORLD.lab.bone} strokeWidth={5} opacity={0.35} strokeLinecap="round" />
          {lines}
          <circle cx={LC[0]} cy={LC[1]} r={6} fill="none" stroke={WORLD.lab.bone} strokeWidth={1.5} />
          {[0, 1, 2].map((i) => {
            const ph = ((t - tl.redAt) * 1.6 + i / 3) % 1;
            return t > tl.redAt && t < tl.fixEnd + 0.4 ? <circle key={`p${i}`} cx={LC[0]} cy={LC[1]} r={8 + ph * LR * 0.9} fill="none" stroke={fixedAll ? C.mint : C.cyan} strokeWidth={1} opacity={(1 - ph) * 0.35} /> : null;
          })}
        </g>
        <text x={LC[0]} y={LC[1] + LR + 24} textAnchor="middle" fill={WORLD.lab.text} fontFamily={F.mono} fontSize={15} style={{ letterSpacing: '0.14em' }} opacity={0.8}>SHOULDER · MOMENT ARMS</text>
      </g>
    );
  };

  // ---- the 36-cell check matrix
  const Matrix: React.FC<{ x: number; y: number; cell: number; gap: number; cols: number }> = ({ x, y, cell, gap, cols }) => (
    <svg width={cols * (cell + gap)} height={Math.ceil(nErr / cols) * (cell + gap)} style={{ position: 'absolute', left: x, top: y, overflow: 'visible' }}>
      {Array.from({ length: nErr }, (_, i) => {
        const cx = (i % cols) * (cell + gap), cy = Math.floor(i / cols) * (cell + gap);
        const fl = t >= flaggedAt(i), fx = ss((t - fixedAt(i)) / 0.15);
        const fill = fx > 0.5 ? C.mint : fl ? C.red : 'none';
        const pop = fl ? Math.exp(-(((t - flaggedAt(i)) / 0.1) ** 2)) + Math.exp(-(((t - fixedAt(i)) / 0.1) ** 2)) : 0;
        return <rect key={i} x={cx - pop} y={cy - pop} width={cell + 2 * pop} height={cell + 2 * pop} rx={3} fill={fill} fillOpacity={fl ? 0.85 : 0}
          stroke={fl ? fill : 'rgba(170,190,220,0.28)'} strokeWidth={1} />;
      })}
    </svg>
  );

  // ---- loop chain (vertical in the master split; horizontal elsewhere)
  const Loop: React.FC<{ x: number; y: number; dir: 'v' | 'h'; size: number; gapPx: number; o: number }> = ({ x, y, dir, size, gapPx, o }) => {
    if (o <= 0.01) return null;
    const colFor = (i: number) => (i === 1 && step === 1 ? C.red : i === 2 && step === 2 ? C.mint : C.cyan);
    if (dir === 'v') {
      const n = STEPS.length, x0 = x, y0 = y;
      const yy = (i: number) => y0 + i * gapPx;
      return (
        <svg width={420} height={n * gapPx + 40} style={{ position: 'absolute', left: x0 - 40, top: y0 - 20, overflow: 'visible', opacity: o }}>
          <g transform="translate(40,20)">
            <line x1={0} x2={0} y1={0} y2={(n - 1) * gapPx} stroke="rgba(160,190,230,0.25)" strokeWidth={1.5} />
            <path d={`M0,${(n - 1) * gapPx} C-34,${(n - 1) * gapPx} -34,0 0,0`} fill="none" stroke="rgba(92,225,255,0.35)" strokeWidth={1.2} strokeDasharray="3 4" />
            <path d="M-7,-4 L0,0 L-7,4" fill="none" stroke="rgba(92,225,255,0.6)" strokeWidth={1.2} transform="translate(-1,0)" />
            {STEPS.map((s, i) => {
              const on = step === i;
              const cy = yy(i) - y0;
              return (
                <g key={s}>
                  <circle cx={0} cy={cy} r={on ? 7 : 4.5} fill={on ? colFor(i) : '#0B1220'} stroke={on ? colFor(i) : 'rgba(170,190,220,0.5)'} strokeWidth={1.4} />
                  {on ? <circle cx={0} cy={cy} r={13} fill="none" stroke={colFor(i)} strokeWidth={1} opacity={0.5} /> : null}
                  <text x={22} y={cy} dominantBaseline="central" fontFamily={F.mono} fontSize={size} fill={on ? '#FFFFFF' : WORLD.lab.text} opacity={on ? 1 : 0.5}
                    style={{ letterSpacing: '0.1em' }}>{s}</text>
                </g>
              );
            })}
          </g>
        </svg>
      );
    }
    // horizontal chain: words with › separators
    return (
      <div style={{ position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: size * 0.5, opacity: o, ...mono, fontSize: size, letterSpacing: '0.06em' }}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <span style={{ color: step === i ? colFor(i) : WORLD.lab.text, opacity: step === i ? 1 : 0.42, fontWeight: step === i ? 700 : 500,
              textShadow: step === i ? `0 0 ${size * 0.6}px ${colFor(i)}` : 'none' }}>{s}</span>
            {i < STEPS.length - 1 ? <span style={{ opacity: 0.3 }}>›</span> : <span style={{ opacity: 0.45, color: C.cyan }}>↺</span>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // ---- panel frame (border, corner ticks)
  const Frame: React.FC<{ b: { x0: number; y0: number; x1: number; y1: number }; o: number; accent: string }> = ({ b, o, accent }) => {
    if (o <= 0.01) return null;
    const c = 16;
    const corners = [[b.x0, b.y0, 1, 1], [b.x1, b.y0, -1, 1], [b.x0, b.y1, 1, -1], [b.x1, b.y1, -1, -1]];
    return (
      <g opacity={o}>
        <rect x={b.x0} y={b.y0} width={b.x1 - b.x0} height={b.y1 - b.y0} rx={6} fill="none" stroke="rgba(150,180,215,0.16)" strokeWidth={1} />
        {corners.map(([x, y, sx, sy], i) => <path key={i} d={`M${x},${y + sy * c} L${x},${y} L${x + sx * c},${y}`} fill="none" stroke={accent} strokeWidth={1.6} opacity={0.75} />)}
      </g>
    );
  };

  // ---- mission timeline (master split)
  const timelineBar = () => {
    if (reel) return null;
    const o = panelO * live;
    if (o <= 0.01) return null;
    const x0 = 80, x1 = 1840, y = 776, M = N.missions;
    const ticks: React.ReactNode[] = [];
    for (let i = 0; i < M; i++) {
      const x = x0 + ((i + 0.5) / M) * (x1 - x0);
      const done = i < mis;
      ticks.push(<line key={`t${i}`} x1={x} x2={x} y1={y - (done ? 7 : 4)} y2={y + (done ? 7 : 4)} stroke={done ? C.cyan : 'rgba(170,190,220,0.25)'} strokeWidth={done ? 1.6 : 1} />);
      // reviews: N.reviews spread over the missions (2-3 each), stacked above the tick as they are filed
      const r0 = Math.floor((i * N.reviews) / M), r1 = Math.floor(((i + 1) * N.reviews) / M);
      for (let r = r0; r < r1; r++) {
        if (r >= revs) break;
        ticks.push(<circle key={`r${r}`} cx={x} cy={y - 13 - (r - r0) * 5} r={1.6} fill={C.mint} opacity={0.9} />);
      }
    }
    const head = x0 + (mis / M) * (x1 - x0);
    return (
      <g opacity={o}>
        <line x1={x0} x2={x1} y1={y} y2={y} stroke="rgba(170,190,220,0.18)" strokeWidth={1} />
        <text x={x0} y={y + 28} fill={WORLD.lab.text} fontFamily={F.mono} fontSize={14} opacity={0.6} style={{ letterSpacing: '0.14em' }}>MISSION LOG</text>
        <text x={x1} y={y + 28} fill={C.mint} fontFamily={F.mono} fontSize={14} opacity={0.75 * rev(t, tl.revStart, 0.3)} textAnchor="end" style={{ letterSpacing: '0.14em' }}>• REVIEW</text>
        {ticks}
        {mis > 0 && mis < M ? <line x1={head} x2={head} y1={y - 22} y2={y + 12} stroke={C.lunar} strokeWidth={1.5} /> : null}
      </g>
    );
  };

  // =================================================================== render
  const bg = `radial-gradient(110% 95% at 55% 42%, ${WORLD.lab.bg1} 0%, ${WORLD.lab.bg0} 62%, ${C.void} 100%)`;
  const showA = opA > 0.01;
  const floorOpA = opA * live * clamp(invLerp(0.3, 1.2, t));
  const muscleScaleSplit = lerp(1, reel ? 1.45 : 1.25, splitP * (1 - heroP));
  const inSplit = splitP * (1 - Math.max(heroP, shoulderP));
  const floorR: [number, number] = [lerp(2.4, reel ? 1.9 : 1.45, inSplit), lerp(1.2, 0.8, inSplit)];

  return (
    <AbsoluteFill style={{ background: bg }}>
      {/* darkening of the lab at the exit */}
      <AbsoluteFill style={{ background: C.void, opacity: dark * 0.85 }} />

      {/* ---- under the 3D: panel fills and the knee trace (the figure occludes it) */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <rect x={panA.x0} y={panA.y0} width={panA.x1 - panA.x0} height={panA.y1 - panA.y0} rx={6} fill="rgba(12,20,36,0.55)" opacity={panelO * opA} />
        <rect x={pB.x0} y={pB.y0} width={pB.x1 - pB.x0} height={pB.y1 - pB.y0} rx={6} fill="rgba(12,20,36,0.55)" opacity={panelBO} />
        {trace.length > 1 && (
          <g opacity={traceO}>
            <line x1={xLeft} x2={lerp(penX, xRight, dark)} y1={yC + kMid * kScale} y2={yC + kMid * kScale} stroke="rgba(126,227,182,0.16)" strokeWidth={1} opacity={1 - dark} />
            <polyline points={pts(trace)} fill="none" stroke={C.mint} strokeWidth={10} strokeOpacity={0.08 + 0.06 * dark} strokeLinejoin="round" strokeLinecap="round" />
            <polyline points={pts(trace)} fill="none" stroke={C.mint} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
            {dark < 1 && <circle cx={trace[trace.length - 1][0]} cy={trace[trace.length - 1][1]} r={5} fill={C.mint} opacity={1 - dark} />}
            {dark < 1 && <line x1={trace[trace.length - 1][0]} x2={trace[trace.length - 1][0]} y1={yC - amp - 14} y2={yC + amp + 14} stroke={C.mint} strokeWidth={1} opacity={0.35 * (1 - dark)} />}
          </g>
        )}
      </svg>

      {/* ---- the lab */}
      <ThreeStage exposure={1.05}>
        <Env intensity={0.32} />
        <CamRig pos={cam.pos} target={TARGET} fov={FOV} />
        <LabLights />
        {showA && <LabFloor center={[A.base[0], A.base[1], A.base[2] + SEG.hipW]} offset={A.s.follow} opacity={floorOpA} radius={floorR} />}
        {opB > 0.01 && <LabFloor center={[B.base[0], B.base[1], B.base[2] + SEG.hipW]} offset={B.s.follow} opacity={opB * (1 - shoulderP * (1 - heroP))} radius={floorR} />}
        {showA && <Figure k={A.k} act={actA} opacity={opA * live} build={build} muscleScale={muscleScaleSplit} />}
        {opB > 0.01 && <Figure k={B.k} act={actB} muscleColor={colB} opacity={opB} muscleScale={muscleScaleSplit} />}
      </ThreeStage>

      {/* ---- instruments over the 3D */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {/* entry: 05's dimension arc becomes the hip rotation arc */}
        {arcO > 0.01 && (
          <g opacity={arcO * live}>
            <path d={arcD(arcC, arcR * 1.0, lerp(-90, 60, arcE), lerp(180, 105, arcE))} fill="none" stroke={C.cyan} strokeWidth={lerp(3, 2, arcE)} strokeLinecap="round"
              opacity={lerp(1, 0.4, arcE)} />
            {arcE > 0.6 && <path d={arcD(arcC, arcR, Math.min(90, femurA), Math.max(90, femurA) + 0.01)} fill="none" stroke={C.cyan} strokeWidth={3} strokeLinecap="round" />}
            <circle cx={arcC[0] + arcR * Math.cos(a1 * DEG)} cy={arcC[1] + arcR * Math.sin(a1 * DEG)} r={lerp(6, 4, arcE)} fill={C.cyan} />
            <circle cx={arcC[0]} cy={arcC[1]} r={lerp(0, 4, arcE)} fill="none" stroke={C.cyan} strokeWidth={1.5} />
            <text x={arcC[0] + (arcR + 26) * Math.cos(lerp(a1, a0 - 22, arcE) * DEG)} y={arcC[1] + (arcR + 26) * Math.sin(lerp(a1, a0 - 22, arcE) * DEG)} fill={C.lunar}
              fontFamily={F.mono} fontSize={lerp(26, 18, arcE)} textAnchor="middle" dominantBaseline="central">θ</text>
            <text x={arcC[0] + (arcR + 26) * Math.cos(lerp(a1, a0 - 22, arcE) * DEG) + 14} y={arcC[1] + (arcR + 26) * Math.sin(lerp(a1, a0 - 22, arcE) * DEG)} fill={C.cyan}
              fontFamily={F.mono} fontSize={16} dominantBaseline="central" opacity={rev(t, tl.arcEnd * 0.6, 0.3)} style={{ letterSpacing: '0.12em' }}>HIP</text>
          </g>
        )}
        {callouts()}
        <Frame b={panA} o={panelO * opA * live} accent={C.red} />
        <Frame b={pB} o={(reel ? splitP : panelO + heroP * (1 - shoulderP)) * live * (1 - heroP)} accent={C.mint} />
        {figOverlay(A, 'A', splitP * opA * live, reel ? 0.85 : 1)}
        {figOverlay(B, 'B', splitP * live * (1 - shoulderP * (1 - heroP)), reel ? lerp(0.85, 1.05, heroP) : 1)}
        {timelineBar()}
        {loupe()}
      </svg>

      {/* ---- type */}
      {/* atlas */}
      {(() => {
        const o = (1 - ss((t - tl.splitAt + 0.25) / 0.35)) * live;
        if (o <= 0.01) return null;
        const numAt = (reel ? 0.55 : 1.9) * 1;
        const sk = Math.round(N.atlas.skeletal * easeOutExpo(invLerp(numAt, numAt + (reel ? 0.6 : 1.1), t)));
        const mu = Math.round(N.atlas.muscle * easeOutExpo(invLerp(numAt + 0.25, numAt + (reel ? 0.85 : 1.35), t)));
        const no = rev(t, numAt - 0.15, 0.3);
        if (!reel) {
          return (
            <div style={{ position: 'absolute', left: 80, top: 232, width: 680, opacity: o }}>
              <div style={{ ...mono, fontSize: lab, color: C.cyan, opacity: rev(t, 0.9, 0.4) }}>HUMAN-ATLAS · OPEN-SOURCE ANATOMICAL MODEL</div>
              <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <KineticTitle text="HUMAN WALKING" fx="build" at={Math.round(1.0 * FPS)} size={54} weight={650} />
                <KineticTitle text="SIMULATOR" fx="build" at={Math.round(1.3 * FPS)} size={54} weight={650} />
              </div>
              <div style={{ marginTop: 44, display: 'flex', flexDirection: 'column', gap: 18, opacity: no }}>
                {[[sk, 'SKELETAL COMPONENTS', 'INCL. CARTILAGE', WORLD.lab.bone], [mu, 'MUSCLE COMPONENTS', '', WORLD.lab.muscle]].map(([v, a, b, col], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
                    <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 76, color: col as string, fontVariantNumeric: 'tabular-nums', width: 200, letterSpacing: '-0.02em' }}>{v}</span>
                    <span style={{ ...mono, fontSize: lab, lineHeight: 1.4 }}>{a}{b ? <><br /><span style={{ opacity: 0.6 }}>{b}</span></> : null}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return (
          <>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 392, textAlign: 'center', opacity: o * rev(t, 0.25, 0.3) }}>
              <div style={{ ...mono, fontSize: lab, color: C.cyan }}>HUMAN-ATLAS MODEL</div>
            </div>
            {[[sk, 'SKELETAL', 64, 'left', WORLD.lab.bone], [mu, 'MUSCLE', 64, 'right', WORLD.lab.muscle]].map(([v, a, x, al, col], i) => (
              <div key={i} style={{ position: 'absolute', top: 1010, [al as string]: x as number, textAlign: al as 'left' | 'right', opacity: o * no }}>
                <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 72, color: col as string, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{v}</div>
                <div style={{ ...mono, fontSize: lab, marginTop: 8 }}>{a}<br /><span style={{ opacity: 0.6 }}>COMPONENTS</span></div>
              </div>
            ))}
          </>
        );
      })()}

      {/* split: panel headers + status */}
      {(() => {
        const o = panelO * live;
        if (o <= 0.01) return null;
        const fallen = t > tl.tA0 + COLLAPSE_T * 0.75;
        const unstable = t > tl.tA0 + 0.35;
        // master: name left, status right; reel: both stacked at the top right, clear of the figure's head
        const hdr = (b: typeof panA, tag: string, name: string, status: string, scol: string, oo: number) => (
          <div style={{ position: 'absolute', left: b.x0 + 22, top: b.y0 + 16, width: b.x1 - b.x0 - 44, display: 'flex', opacity: oo,
            flexDirection: reel ? 'column' : 'row', justifyContent: 'space-between', alignItems: reel ? 'flex-end' : 'flex-start', gap: reel ? 10 : 0 }}>
            <div style={{ ...mono, fontSize: lab, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: lab * 0.55, height: lab * 0.55, background: scol, borderRadius: 2, display: 'inline-block' }} />
              <span style={{ opacity: 0.6 }}>{tag}</span><span style={{ color: '#FFFFFF', fontWeight: 600 }}>{name}</span>
            </div>
            <div style={{ ...mono, fontSize: lab * 0.92, color: scol, border: `1px solid ${scol}`, padding: '3px 8px', borderRadius: 3 }}>{status}</div>
          </div>
        );
        return (
          <>
            {hdr(panA, 'A', 'INITIAL ATTEMPT', fallen ? 'COLLAPSED' : unstable ? 'UNSTABLE' : 'START', fallen ? C.red : C.amber, o * opA)}
            {hdr(reel ? { x0: pB.x0, y0: pB.y0, x1: pB.x1, y1: pB.y1 } : panB, 'B', 'IMPROVED CONTROLLER', 'ALTERNATING STRIDE', C.mint, (reel ? splitP * outR : o) * live)}
            {/* panel captions */}
            <div style={{ position: 'absolute', [reel ? 'right' : 'left']: reel ? L.w - panA.x1 + 22 : panA.x0 + 22, top: reel ? panA.y0 + 108 : panA.y1 - 40, ...mono, fontSize: lab,
              color: fallen ? C.red : WORLD.lab.text, opacity: o * opA * rev(t, tl.tA0 + 1.2, 0.4) }}>
              COLLAPSES WITHIN SECONDS
            </div>
          </>
        );
      })()}

      {/* split: loop + counters */}
      {(() => {
        const o = (reel ? splitP * outR : panelO) * live;
        if (o <= 0.01) return null;
        if (!reel) {
          return (
            <>
              <Loop x={850} y={196} dir="v" size={17} gapPx={50} o={o * rev(t, tl.splitAt + 0.25, 0.4)} />
              <div style={{ position: 'absolute', left: 760, width: 400, top: 470, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, opacity: o * rev(t, tl.misStart - 0.2, 0.3) }}>
                {[[mis, 'MISSIONS', tl.misLand], [revs, 'REVIEWS', tl.revLand]].map(([v, label, land]) => {
                  const flash = Math.exp(-(((t - (land as number)) / 0.18) ** 2));
                  return (
                    <div key={label as string} style={{ textAlign: 'center', opacity: label === 'REVIEWS' ? rev(t, tl.revStart - 0.2, 0.3) : 1 }}>
                      <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 82, lineHeight: 1, color: C.lunar, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
                        textShadow: `0 0 ${24 * flash}px rgba(255,181,71,${0.8 * flash})` }}>{v}</div>
                      <div style={{ ...mono, fontSize: lab, marginTop: 8, opacity: 0.8 }}>{label}</div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        }
        return (
          <>
            <Loop x={64} y={754} dir="h" size={22} gapPx={0} o={o * rev(t, tl.splitAt + 0.2, 0.3)} />
            {[[mis, 'MISSIONS', 64, 'left', tl.misStart], [revs, 'REVIEWS', 64, 'right', tl.revStart]].map(([v, label, x, al, st]) => (
              <div key={label as string} style={{ position: 'absolute', top: 790, [al as string]: x as number, textAlign: al as 'left' | 'right', opacity: o * rev(t, (st as number) - 0.15, 0.25) }}>
                <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 100, lineHeight: 1, color: C.lunar, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{v}</div>
                <div style={{ ...mono, fontSize: lab, marginTop: 6 }}>{label}</div>
              </div>
            ))}
          </>
        );
      })()}

      {/* reel: the shoulder check inside the improved panel */}
      {reel && (() => {
        const o = win(t, tl.redAt - 0.15, tl.heroAt + 0.15, 0.2) * live;
        if (o <= 0.01) return null;
        const fixedNow = t >= tl.fixAt;
        return (
          <div style={{ position: 'absolute', left: 600, top: 1052, width: 400, opacity: o }}>
            <Matrix x={0} y={0} cell={18} gap={6} cols={12} />
            <div style={{ position: 'absolute', top: 92, left: 0, display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontFamily: F.display, fontWeight: 650, fontSize: 64, color: fixedNow ? C.mint : C.red, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{fixedNow ? nFixed : nFlag}</span>
            </div>
            <div style={{ position: 'absolute', top: 164, left: 0, ...mono, fontSize: lab, whiteSpace: 'normal', width: 400, lineHeight: 1.3, color: fixedNow ? C.mint : C.red }}>
              {fixedNow ? shRest : `${shRestFound} IDENTIFIED`}
            </div>
          </div>
        );
      })()}

      {/* master: the shoulder beat */}
      {!reel && (() => {
        const o = win(t, tl.shoulderAt + 0.5, tl.heroAt + 0.05, 0.35) * live;
        if (o <= 0.01) return null;
        const fixedNow = t >= tl.fixAt;
        const numO = rev(t, tl.redAt - 0.05, 0.25);
        const retrain = invLerp(tl.fixEnd + 0.05, tl.heroAt - 0.1, t);
        return (
          <div style={{ position: 'absolute', left: 80, top: 214, width: 760, opacity: o }}>
            <div style={{ ...mono, fontSize: lab, color: C.cyan }}>SHOULDER · OPEN-LOOP PROBE</div>
            <div style={{ position: 'relative', height: 40, marginTop: 18 }}><Loop x={0} y={0} dir="h" size={16} gapPx={0} o={1} /></div>
            <div style={{ position: 'relative', marginTop: 26, height: 110 }}><Matrix x={0} y={0} cell={26} gap={8} cols={12} /></div>
            <div style={{ marginTop: 34, display: 'flex', alignItems: 'flex-end', gap: 24, opacity: numO }}>
              <span style={{ fontFamily: F.display, fontWeight: 650, fontSize: 132, lineHeight: 0.9, color: fixedNow ? C.mint : C.red, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em',
                minWidth: 190 }}>{fixedNow ? nFixed : nFlag}</span>
              <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 34, lineHeight: 1.12, color: C.lunar, paddingBottom: 6, whiteSpace: 'pre-line' }}>
                {(fixedNow ? shRest : `${shRestFound} IDENTIFIED`).replace(' ERRORS ', ' ERRORS\n')}
              </span>
            </div>
            <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', gap: 14, opacity: rev(t, tl.fixEnd, 0.3) }}>
              <span style={{ ...mono, fontSize: lab, color: C.mint }}>RETRAIN</span>
              <span style={{ width: 260, height: 3, background: 'rgba(170,190,220,0.2)', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${clamp(retrain) * 100}%`, background: C.mint }} />
              </span>
            </div>
          </div>
        );
      })()}

      {/* hero: stride timer + the claim */}
      {(() => {
        const o = rev(t, tl.timerStart - (reel ? 0.2 : 0.25), 0.3) * live;
        if (o <= 0.01) return null;
        const land = Math.exp(-(((t - tl.timerLand) / 0.22) ** 2));
        const restO = rev(t, tl.timerLand - 0.55, 0.45);
        const big = reel ? 150 : 168;
        return (
          <div style={{ position: 'absolute', left: reel ? 64 : 80, top: reel ? 392 : 196, width: reel ? 952 : 900, opacity: o, textAlign: 'left' }}>
            <div style={{ ...mono, fontSize: lab, color: C.mint, display: 'flex', gap: 14, alignItems: 'center' }}>
              <span style={{ width: lab * 0.55, height: lab * 0.55, background: C.mint, borderRadius: 2, display: 'inline-block' }} />
              {reel ? 'IMPROVED CONTROLLER' : 'IMPROVED CONTROLLER · RETRAINED'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: big * 0.12, marginTop: reel ? 10 : 14 }}>
              <span style={{ fontFamily: F.display, fontWeight: 650, fontSize: big, lineHeight: 1, color: timerDone ? C.mint : C.lunar, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em',
                textShadow: `0 0 ${40 * land}px rgba(126,227,182,${0.7 * land})`, width: big * 2.5, display: 'inline-block', textAlign: 'right' }}>{fmt(timer, 1)}</span>
              <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: big * 0.36, color: C.lunar }}>{walkUnit}</span>
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: reel ? 50 : 50, color: C.lunar, letterSpacing: '-0.005em', marginTop: reel ? 8 : 10, opacity: restO,
              transform: `translateY(${(1 - restO) * 14}px)` }}>{walkRest}</div>
            <div style={{ ...mono, fontSize: lab, marginTop: 14, opacity: restO * 0.8 }}>ALTERNATING STRIDES</div>
          </div>
        );
      })()}

      {/* attribution near the numbers (all four claims share the qualifier) */}
      {(() => {
        const id = t < tl.splitAt ? 'atlas' : t < (reel ? tl.redAt : tl.shoulderAt) ? 'missions' : t < tl.heroAt ? 'shoulder' : 'walking';
        const at = Math.round((reel ? 0.5 : 1.8) * FPS);
        const top = reel ? 1292 : 822;
        return (
          <div style={{ position: 'absolute', left: reel ? 64 : 80, top, width: reel ? 952 : 760, opacity: live }}>
            <SourceAttribution id={id as 'atlas'} at={at} size={L.t.attribution} />
          </div>
        );
      })()}

      <ProvenanceLabel kind="B" note="Moonshot internal example, recreated for this film · not independent scientific validation" />
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};
