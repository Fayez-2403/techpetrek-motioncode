// V3 · GAME · DUEL (2 bars = 120 frames at 120 BPM). Stylized game duel, built from scratch: two original armoured
// fighters (procedural IK figures, pearl/cyan vs graphite/amber, capes) trade energy-blade strikes on a floating stone
// arena above a golden cloud sea. Every clash lands on a beat (beats 2, 3, the "and" of 3, 4, 5, 7, 8) with sparks, a
// flash and a ring. Beat 5 is the wow: the blades lock in bullet time while the camera whips round them, a shock wave
// races out across the arena and parts the clouds below, pebbles lift off the stones. No gore, no blood.
import React, { useLayoutEffect, useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import TL from '../timeline.json';
import { CamRig, project, ThreeStage } from '../../three/stage';
import { useLayout } from '../../lib/layout';
import { clamp, easeInOutCubic, easeOutCubic, invLerp, lerp, smoothStep } from '../../lib/anim';
import { hash, mulberry32 } from '../../lib/rng';
import { beatAt, V3Tag, type V3Props } from '../lib';
import {
  add, CloudPuffs, cross, dot, madd, makeIsland, mul, norm, placeLocal, Ribbons, rotAxis, SkyDome, SkyEnv, SunFlare, sub, Trees, vlen, vlerp,
  type P3, type Puff, type SkyLook, type Strip, type TreeInst,
} from '../three/SkyKit';
import { Body, ClothStrip, solveBody, type BodyPose, type Outfit } from '../three/RiderRig';
import { Arena, bladeStrips, BladeHilt, ShockRing } from '../three/SkyFx';
import { Glow } from '../three/SkyGlider';

const LABEL = TL.shots.find((s) => s.id === 'skyDuel')!.label;
const Y: P3 = [0, 1, 0];

// ------------------------------------------------------------------------------------------------ game time
// bullet time on beat 5: the game clock runs at 12 % between frames 62 and 78
const rate = (f: number) => (f < 58 || f > 86 ? 1 : f < 62 ? lerp(1, 0.12, smoothStep((f - 58) / 4)) : f < 78 ? 0.12 : lerp(0.12, 1, smoothStep((f - 78) / 8)));
const TT = (() => { const n = 130 * 4, t = new Float64Array(n + 1); for (let i = 1; i <= n; i++) t[i] = t[i - 1] + 0.125 * (rate((i - 1) / 4) + rate(i / 4)); return t; })();
const tauOf = (f: number) => { if (f <= 0) return f; const x = Math.min(f, 129) * 4, i = Math.floor(x), fr = x - i; return TT[i] * (1 - fr) + TT[i + 1] * fr; };

// ------------------------------------------------------------------------------------------------ choreography
const BL = 1.05; // blade length
interface Clash { f: number; C: P3; dA: P3; dB: P3; k: number; lockTo?: number }
const CLASH: Clash[] = [
  { f: 15, C: [0.0, 1.7, 0.05], dA: norm([0.5, 0.42, -0.76]), dB: norm([-0.45, 0.45, 0.77]), k: 0.8 },
  { f: 30, C: [0.0, 1.05, -0.12], dA: norm([0.35, -0.8, -0.48]), dB: norm([-0.75, 0.05, 0.66]), k: 0.8 },
  { f: 37.5, C: [0.22, 1.32, 0.1], dA: norm([1, 0.06, -0.15]), dB: norm([-0.3, 0.75, 0.6]), k: 0.5 },
  { f: 45, C: [0.0, 1.5, 0.15], dA: norm([0.5, -0.3, -0.81]), dB: norm([-0.4, 0.82, 0.42]), k: 0.9 },
  { f: 60, C: [0.0, 1.58, 0.0], dA: norm([0.3, 0.9, -0.32]), dB: norm([-0.3, 0.9, 0.32]), k: 2.0, lockTo: 78 },
  { f: 90, C: [0.12, 1.36, 0.0], dA: norm([0.7, 0.12, -0.7]), dB: norm([-0.25, 0.95, 0.15]), k: 1.2 },
  { f: 105, C: [0.0, 1.62, 0.0], dA: norm([0.3, 0.72, 0.62]), dB: norm([-0.3, 0.72, -0.62]), k: 1.4, lockTo: 120 },
];
type Loc = [number, number, number];
interface Key { f: number; px: number; hop?: number; crouch: number; lean: number; twist: number; ev?: number; hilt?: P3; dir?: P3; off: Loc }
const KA: Key[] = [
  { f: 0, px: -1.75, crouch: 0.45, lean: 0.1, twist: 0, hilt: [-1.4, 1.05, 0.38], dir: norm([0.55, 0.8, -0.1]), off: [-0.26, 0.95, 0.18] },
  { f: 9, px: -1.1, crouch: 0.6, lean: 0.15, twist: -0.5, hilt: [-1.25, 1.9, 0.5], dir: norm([-0.35, 0.8, -0.45]), off: [-0.35, 1.2, 0.35] },
  { f: 15, px: -0.78, crouch: 0.55, lean: 0.45, twist: 0.35, ev: 0, off: [-0.45, 1.0, -0.05] },
  { f: 22, px: -0.98, crouch: 0.5, lean: 0.1, twist: 0, hilt: [-0.7, 1.3, 0.4], dir: norm([0.55, 0.8, 0.1]), off: [-0.26, 0.95, 0.18] },
  { f: 30, px: -0.9, crouch: 0.65, lean: 0.25, twist: 0.4, ev: 1, off: [-0.45, 1.15, -0.1] },
  { f: 34, px: -1.02, crouch: 0.55, lean: 0.05, twist: -0.3, hilt: [-1.05, 1.25, 0.32], dir: norm([1, 0.1, -0.05]), off: [-0.45, 1.1, 0.1] },
  { f: 37.5, px: -0.55, crouch: 0.72, lean: 0.5, twist: 0.1, ev: 2, off: [-0.55, 1.0, -0.25] },
  { f: 41, px: -0.8, crouch: 0.55, lean: 0.2, twist: 0, hilt: [-0.72, 1.75, 0.3], dir: norm([0.4, 0.5, -0.75]), off: [-0.28, 1.0, 0.16] },
  { f: 45, px: -0.82, crouch: 0.55, lean: 0.25, twist: 0.3, ev: 3, off: [-0.3, 1.0, 0.1] },
  { f: 52, px: -1.75, hop: 0.12, crouch: 0.75, lean: 0.05, twist: -0.4, hilt: [-1.72, 1.85, 0.35], dir: norm([-0.25, 0.95, -0.15]), off: [-0.4, 1.0, 0.35] },
  { f: 60, px: -0.7, crouch: 0.85, lean: 0.5, twist: 0.1, ev: 4, off: [-0.55, 1.0, -0.3] },
  { f: 78, px: -0.68, crouch: 0.88, lean: 0.55, twist: 0.1, ev: 4, off: [-0.55, 1.0, -0.3] },
  { f: 84, px: -1.15, crouch: 0.5, lean: 0.0, twist: -0.2, hilt: [-0.95, 1.4, 0.5], dir: norm([0.2, 0.9, 0.35]), off: [-0.4, 1.0, 0.3] },
  { f: 87, px: -1.2, hop: 0.38, crouch: 0.2, lean: -0.05, twist: -0.3, hilt: [-1.2, 2.3, 0.3], dir: norm([-0.5, 0.85, -0.1]), off: [-0.45, 1.2, 0.2] },
  { f: 90, px: -0.78, crouch: 0.78, lean: 0.5, twist: 0.25, ev: 5, off: [-0.55, 0.95, -0.2] },
  { f: 97, px: -1.02, crouch: 0.5, lean: 0.1, twist: 0, hilt: [-0.85, 1.35, 0.42], dir: norm([0.45, 0.85, -0.1]), off: [-0.26, 0.95, 0.18] },
  { f: 101, px: -1.0, crouch: 0.6, lean: 0.15, twist: -0.4, hilt: [-1.0, 1.7, -0.15], dir: norm([-0.2, 0.8, -0.55]), off: [-0.4, 1.15, 0.3] },
  { f: 105, px: -0.74, crouch: 0.72, lean: 0.45, twist: 0.15, ev: 6, off: [-0.55, 1.0, -0.25] },
  { f: 120, px: -0.7, crouch: 0.76, lean: 0.5, twist: 0.15, ev: 6, off: [-0.55, 1.0, -0.25] },
];
const KB: Key[] = [
  { f: 0, px: 1.7, crouch: 0.5, lean: 0.1, twist: 0, hilt: [1.4, 1.1, -0.35], dir: norm([-0.5, 0.82, 0.1]), off: [-0.26, 0.95, 0.18] },
  { f: 9, px: 1.15, crouch: 0.6, lean: 0.1, twist: 0.2, hilt: [1.1, 1.6, -0.3], dir: norm([-0.3, 0.6, 0.7]), off: [-0.4, 1.1, 0.25] },
  { f: 15, px: 0.92, crouch: 0.62, lean: 0.15, twist: 0.2, ev: 0, off: [-0.45, 1.05, 0.15] },
  { f: 22, px: 1.02, crouch: 0.55, lean: 0.1, twist: -0.6, hilt: [1.2, 1.2, -0.62], dir: norm([0.2, 0.2, -0.95]), off: [-0.4, 1.1, 0.3] },
  { f: 30, px: 0.82, crouch: 0.6, lean: 0.35, twist: 0.45, ev: 1, off: [-0.5, 1.0, -0.1] },
  { f: 37.5, px: 0.98, crouch: 0.55, lean: 0.1, twist: 0.2, ev: 2, off: [-0.45, 1.1, 0.1] },
  { f: 41, px: 1.05, crouch: 0.75, lean: 0.2, twist: -0.4, hilt: [1.15, 0.75, -0.4], dir: norm([0.2, -0.6, -0.75]), off: [-0.4, 1.0, 0.3] },
  { f: 45, px: 0.86, crouch: 0.6, lean: 0.3, twist: 0.3, ev: 3, off: [-0.5, 1.05, -0.05] },
  { f: 52, px: 1.75, hop: 0.12, crouch: 0.75, lean: 0.05, twist: -0.4, hilt: [1.6, 0.9, -0.45], dir: norm([0.3, -0.5, -0.8]), off: [-0.4, 1.0, 0.3] },
  { f: 60, px: 0.7, crouch: 0.85, lean: 0.5, twist: 0.1, ev: 4, off: [-0.55, 1.0, -0.3] },
  { f: 78, px: 0.72, crouch: 0.86, lean: 0.52, twist: 0.1, ev: 4, off: [-0.55, 1.0, -0.3] },
  { f: 85, px: 1.55, crouch: 0.6, lean: -0.25, twist: 0.3, hilt: [1.4, 1.5, -0.3], dir: norm([-0.3, 0.9, 0.2]), off: [-0.5, 1.25, -0.1] },
  { f: 90, px: 1.0, crouch: 0.7, lean: 0.15, twist: 0.2, ev: 5, off: [-0.45, 1.1, 0.1] },
  { f: 97, px: 1.08, crouch: 0.55, lean: 0.1, twist: 0, hilt: [0.95, 1.3, -0.4], dir: norm([-0.45, 0.85, 0.1]), off: [-0.26, 0.95, 0.18] },
  { f: 101, px: 1.0, crouch: 0.6, lean: 0.15, twist: -0.4, hilt: [1.1, 1.7, 0.2], dir: norm([0.2, 0.8, 0.55]), off: [-0.4, 1.15, 0.3] },
  { f: 105, px: 0.75, crouch: 0.72, lean: 0.45, twist: 0.15, ev: 6, off: [-0.55, 1.0, -0.25] },
  { f: 120, px: 0.72, crouch: 0.76, lean: 0.5, twist: 0.15, ev: 6, off: [-0.55, 1.0, -0.25] },
];
// keys and clashes run in game time
const kt = (k: Key) => tauOf(k.f);

const nlerp = (a: P3, b: P3, t: number): P3 => norm(vlerp(a, b, t));
function fighterAt(keys: Key[], side: 0 | 1, t: number) {
  let i = 0;
  while (i < keys.length - 2 && kt(keys[i + 1]) <= t) i++;
  const a = keys[i], b = keys[i + 1], ta = kt(a), tb = kt(b);
  const u = clamp((t - ta) / Math.max(1e-6, tb - ta));
  const e = b.ev !== undefined && a.ev !== b.ev ? u * u : a.ev !== undefined && a.ev !== b.ev ? easeOutCubic(u) : easeInOutCubic(u);
  const hiltOf = (k: Key): [P3, P3] => {
    if (k.ev === undefined) return [k.hilt!, k.dir!];
    const c = CLASH[k.ev], d = side === 0 ? c.dA : c.dB;
    const push = c.lockTo && k.f > c.f ? 0.03 * Math.sin(k.f) : 0;
    return [madd(c.C, d, -0.62 + push), d];
  };
  const [h0, d0] = hiltOf(a), [h1, d1] = hiltOf(b);
  const L = (x: number, y: number) => x + (y - x) * e;
  const dx = Math.abs(b.px - a.px);
  return {
    px: L(a.px, b.px), hop: L(a.hop ?? 0, b.hop ?? 0) + (dx > 0.3 ? 0.08 * Math.sin(Math.PI * u) : 0), crouch: L(a.crouch, b.crouch), lean: L(a.lean, b.lean), twist: L(a.twist, b.twist),
    hilt: vlerp(h0, h1, e), dir: nlerp(d0, d1, e), off: vlerp(a.off, b.off, e) as Loc, step: dx > 0.3 ? u : -1,
  };
}

function poseOf(side: 0 | 1, t: number) {
  const s = fighterAt(side === 0 ? KA : KB, side, t);
  const d: P3 = side === 0 ? [1, 0, 0] : [-1, 0, 0];
  const r = norm(cross(d, Y));
  const g: P3 = [s.px, 0, 0];
  const pelvis: P3 = [s.px + d[0] * s.lean * 0.12, 0.98 - s.crouch * 0.3 + s.hop, 0];
  const cfH = rotAxis(d, Y, s.twist), pfH = rotAxis(d, Y, s.twist * 0.4);
  const pose: BodyPose = {
    pelvis, pf: pfH, pu: norm(add(Y, mul(pfH, s.lean * 0.25))),
    cf: norm(add(cfH, mul(Y, -s.lean * 0.3))), cu: norm(add(Y, mul(cfH, s.lean * 0.7))),
    look: norm(sub([side === 0 ? 0.9 : -0.9, 1.7, 0], [pelvis[0], 1.6, 0])),
    handR: madd(s.hilt, s.dir, -0.04), poleR: norm(add(add(mul(r, 0.6), [0, -0.8, 0]), mul(d, -0.2))),
    handL: add(add(add(g, mul(r, s.off[0])), [0, s.off[1], 0]), mul(d, s.off[2])), poleL: norm(add(mul(r, -0.5), [0, -1, 0])),
    footR: [0, 0, 0], footL: [0, 0, 0], kneeR: norm(add(d, mul(r, 0.25))), kneeL: norm(add(d, mul(r, -0.1))),
    toeR: norm(add(d, mul(r, 0.15))), toeL: norm(add(mul(d, 0.35), mul(r, -0.95))), gripR: s.dir,
  };
  // fencer's stance: sword-side foot forward; feet lift in an arc while travelling
  const liftF = s.step >= 0 ? 0.14 * Math.max(0, Math.sin(Math.PI * Math.min(1, s.step * 1.6))) : 0;
  const liftB = s.step >= 0 ? 0.14 * Math.max(0, Math.sin(Math.PI * Math.max(0, s.step * 1.6 - 0.6))) : 0;
  const w = 0.3 + 0.1 * s.crouch;
  pose.footR = add(add(add(g, mul(d, w)), mul(r, 0.1)), [0, 0.1 + liftF + Math.max(0, s.hop - 0.08), 0]);
  pose.footL = add(add(add(g, mul(d, -w - 0.04)), mul(r, -0.16)), [0, 0.1 + liftB + Math.max(0, s.hop - 0.08), 0]);
  return { pose, hilt: s.hilt, dir: s.dir };
}

// ------------------------------------------------------------------------------------------------ looks
const SUN: P3 = norm([-0.85, 0.3, -0.42]);
const LOOK: SkyLook = {
  sun: SUN, zenith: '#1648B8', horizon: '#FFB070', low: '#E9B98E', sunColor: '#FFC07A', sunI: 1.5, sunSize: 0.9993, haze: '#E2AE84', hazeDist: 950,
  slabs: [{ y0: -62, y1: -24, cov: 0.3, scale: 1 / 300, off: [0.32, 0.77], density: 0.13, lit: '#FFD9A6', litK: 1.5, shade: '#7C78B0', hole: [0, 0, 0] }],
};
const OUT_A: Outfit = { skin: '#D9A07E', top: '#2A4C9C', accent: '#5CE8FF', bottom: '#253252', boots: '#E8ECF2', gloves: '#E8ECF2', helmet: '#F1F3F7', visor: '#5CE8FF', armor: true, metal: '#E6EAF1', trim: '#5CE8FF' };
const OUT_B: Outfit = { skin: '#C98D6A', top: '#7A2E1E', accent: '#FFB547', bottom: '#2B2A30', boots: '#3A3A42', gloves: '#3A3A42', helmet: '#40414A', visor: '#FFB547', armor: true, metal: '#4A4C55', trim: '#FFB547' };
const CYAN: [number, number, number] = [0.25, 0.9, 1.0], AMBER: [number, number, number] = [1.0, 0.62, 0.18];

// ------------------------------------------------------------------------------------------------ camera
function cameraAt(f: number) {
  const w = smoothStep(invLerp(57, 63, f)) * (1 - smoothStep(invLerp(80, 88, f)));
  const yaw = 1.2 + 0.0075 * f + 2.6 * smoothStep(invLerp(58, 86, f));
  const hits = CLASH.reduce((s, c) => s + (f >= c.f ? Math.exp(-(f - c.f) / 5) * (1 - Math.exp(-(f - c.f) / 1.2)) * c.k : 0), 0);
  const rad = lerp(5.7, 3.9, w) - 0.22 * hits;
  const h = lerp(1.75, 1.0, w);
  const target: P3 = [0, lerp(1.3, 1.5, w), 0];
  const pos: P3 = [Math.cos(yaw) * rad, h, Math.sin(yaw) * rad];
  const fov = lerp(42, 50, w) + 2.2 * hits;
  return { pos, target, fov, w };
}

// ------------------------------------------------------------------------------------------------ static world
function buildStatic() {
  const rnd = mulberry32(1234);
  const isl = [
    { o: makeIsland({ seed: 71, r: 18, depth: 26 }), at: [-46, -9, -70] as P3, yaw: 0.3 },
    { o: makeIsland({ seed: 72, r: 30, depth: 40 }), at: [80, -18, -130] as P3, yaw: 1.4 },
    { o: makeIsland({ seed: 73, r: 12, depth: 18 }), at: [36, 9, 58] as P3, yaw: 2.1 },
    { o: makeIsland({ seed: 74, r: 24, depth: 34 }), at: [-110, 4, 60] as P3, yaw: 0.8 },
    { o: makeIsland({ seed: 75, r: 9, depth: 14 }), at: [-20, -3, 30] as P3, yaw: 2.8 },
  ];
  const trees: TreeInst[] = isl.flatMap((q) => q.o.trees.map((t) => ({ ...t, p: placeLocal(t.p, q.at, q.yaw) })));
  const rocks = Array.from({ length: 16 }, () => { const a = rnd() * Math.PI * 2, r = 11 + rnd() * 14; return { p: [Math.cos(a) * r, -3 + rnd() * 6, Math.sin(a) * r] as P3, s: 0.2 + rnd() * 0.55, rot: rnd() * 6 }; });
  const puffs: Puff[] = Array.from({ length: 24 }, () => { const a = rnd() * Math.PI * 2, r = 9 + rnd() * 26; return { p: [Math.cos(a) * r, -9 - rnd() * 12, Math.sin(a) * r] as P3, s: 4 + rnd() * 6, seed: rnd(), a: 0.8 }; });
  const pebbles = Array.from({ length: 28 }, () => { const a = rnd() * Math.PI * 2, r = 0.8 + rnd() * 3.6; return { p: [Math.cos(a) * r, 0.03, Math.sin(a) * r] as P3, h: 0.3 + rnd() * 1.4, s: 0.03 + rnd() * 0.06, rot: rnd() * 6 }; });
  const sparkSeeds = CLASH.map((c, ci) => { const r = mulberry32(500 + ci); return Array.from({ length: 70 }, () => [r(), r(), r(), r(), r()]); });
  return { isl, trees, rocks, puffs, pebbles, sparkSeeds };
}

/** enable shadow maps before the first draw (ThreeStage does not) */
const ShadowsOn: React.FC = () => {
  const { gl } = useThree();
  useLayoutEffect(() => { gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; }, [gl]);
  return null;
};

const Duel: React.FC<{ f: number }> = ({ f }) => {
  const S = useMemo(buildStatic, []);
  const mats = useMemo(() => ({
    island: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true }),
    rock: new THREE.MeshStandardMaterial({ color: '#B89A78', roughness: 0.9, flatShading: true }),
    rockGeo: new THREE.IcosahedronGeometry(1, 0), pebbleGeo: new THREE.DodecahedronGeometry(1, 0),
  }), []);
  const cam = cameraAt(f);
  const t = tauOf(f);
  const A = poseOf(0, t), Bf = poseOf(1, t);
  const JA = solveBody(A.pose), JB = solveBody(Bf.pose);
  const bladeA = { hilt: madd(JA.wristR, A.dir, 0.03), dir: A.dir }, bladeB = { hilt: madd(JB.wristR, Bf.dir, 0.03), dir: Bf.dir };
  const strips: Strip[] = [];
  const glowK = 1 + 0.25 * beatAt(f).pulse;
  strips.push(...bladeStrips(bladeA.hilt, bladeA.dir, BL, CYAN, glowK), ...bladeStrips(bladeB.hilt, bladeB.dir, BL, AMBER, glowK));
  // swing arcs: the tip's recent path, bright only while the blade moves fast
  for (const side of [0, 1] as const) {
    const pts: P3[] = [], a: number[] = [], wd: number[] = [];
    let speed = 0;
    const NK = 16, dk = 0.4;
    for (let k = 0; k < NK; k++) {
      const tk = t - k * dk, P = poseOf(side, tk), J = solveBody(P.pose);
      const tip = madd(madd(J.wristR, P.dir, 0.03), P.dir, BL * 0.92);
      if (k === 1) speed = vlen(sub(tip, pts[0])) / dk;
      pts.push(tip); wd.push(0.12 * (1 - k / NK) + 0.02);
    }
    const sk = clamp((speed - 0.05) * 5, 0, 1);
    for (let k = 0; k < NK; k++) a.push(0.55 * sk * (1 - k / (NK - 1)) ** 1.5);
    if (sk > 0.02) strips.push({ pts, w: wd, a, col: side === 0 ? CYAN : AMBER });
  }
  // sparks, flashes and rings on every clash (game-time physics, so they hang in the air during the lock)
  const sparks: Strip[] = [];
  const glows: { p: P3; s: number; a: number; c: string }[] = [];
  const rings: { c: P3; n: P3; r: number; a: number; col: string; w: number }[] = [];
  const toCam = norm(sub(cam.pos, cam.target));
  CLASH.forEach((c, ci) => {
    const te = tauOf(c.f);
    if (t < te) return;
    const emitEnd = c.lockTo ? tauOf(c.lockTo) : te;
    const seeds = S.sparkSeeds[ci];
    const spark = (ts: number, r1: number, r2: number, r3: number, r4: number, r5: number, kk: number) => {
      const age = (t - ts) / 30;
      if (age < 0 || age > 0.5) return;
      const dir = norm([r1 - 0.5, r2 * 0.9 - 0.25, r3 - 0.5]);
      const v = mul(dir, (2.5 + 6 * r4) * kk);
      const p = add(add(c.C, mul(v, age)), [0, -4.9 * age * age, 0]);
      const a0 = Math.max(0, age - 0.022), q = add(add(c.C, mul(v, a0)), [0, -4.9 * a0 * a0, 0]);
      const fade = (1 - age / 0.5) ** 1.2;
      const col: [number, number, number] = r5 < 0.33 ? [1, 0.95, 0.8] : r5 < 0.66 ? [0.55, 0.95, 1] : [1, 0.7, 0.3];
      sparks.push({ pts: [q, p], w: 0.018 + 0.012 * r4, a: 0.95 * fade, col });
    };
    // the burst on contact
    seeds.forEach(([r1, r2, r3, r4, r5], i) => { if (i < 26 + 24 * Math.min(1, c.k - 0.4)) spark(te, r1, r2, r3, r4, r5, 0.6 + 0.4 * c.k); });
    // during a lock, sparks keep streaming from the contact point
    if (c.lockTo) {
      const n = Math.floor((Math.min(t, emitEnd) - te) / 0.1);
      for (let j = 1; j <= n; j++) for (let m = 0; m < 2; m++) {
        spark(te + j * 0.1, hash(ci, j, m, 1), hash(ci, j, m, 2), hash(ci, j, m, 3), hash(ci, j, m, 4) * 0.7, hash(ci, j, m, 5), 0.8);
      }
    }
    const dt = (t - te) / 30, dReal = (f - c.f) / 30;
    glows.push({ p: c.C, s: (0.6 + 0.8 * c.k) * Math.exp(-dt * 10) + (c.lockTo && t < emitEnd ? 0.45 + 0.15 * Math.sin(f * 2.3) : 0), a: Math.exp(-dt * 8) + (c.lockTo && t < emitEnd ? 0.55 : 0), c: '#FFF6E6' });
    rings.push({ c: c.C, n: toCam, r: 0.12 + dt * 6 * (0.6 + 0.4 * c.k), a: 0.9 * Math.max(0, 1 - dt / 0.32), col: '#FFF4E0', w: 0.05 });
    if (ci === 4) {
      // the beat-5 shock wave runs in real time across the arena and out over the clouds
      rings.push({ c: [0, 1.2, 0], n: [0, 1, 0], r: 0.5 + dReal * 44, a: 0.95 * Math.max(0, 1 - dReal / 1.0), col: '#FFE2B0', w: 0.05 });
      rings.push({ c: [0, 0.05, 0], n: [0, 1, 0], r: 0.4 + dReal * 22, a: 0.7 * Math.max(0, 1 - dReal / 0.6), col: '#BFF6FF', w: 0.05 });
    }
  });
  // crackling arcs between the locked blades
  [4, 6].forEach((ci) => {
    const c = CLASH[ci];
    if (f < c.f || f > (c.lockTo ?? c.f)) return;
    for (let k = 0; k < 3; k++) {
      const pts: P3[] = [];
      const a0 = madd(c.C, k % 2 ? c.dA : c.dB, 0.05 + 0.2 * hash(f, k, 1)), a1 = madd(c.C, k % 2 ? c.dB : c.dA, 0.15 + 0.35 * hash(f, k, 2));
      for (let s = 0; s <= 6; s++) { const u = s / 6, j = s === 0 || s === 6 ? 0 : 0.09; pts.push(add(vlerp(a0, a1, u), [(hash(f, k, s, 3) - 0.5) * j, (hash(f, k, s, 4) - 0.5) * j, (hash(f, k, s, 5) - 0.5) * j])); }
      sparks.push({ pts, w: 0.014, a: 0.9, col: k % 2 ? [0.6, 0.95, 1] : [1, 0.8, 0.45] });
    }
  });
  // capes from the shoulders
  const cape = (J: ReturnType<typeof solveBody>, pose: BodyPose, side: 0 | 1) => {
    const anchor = madd(madd(vlerp(J.shR, J.shL, 0.5), pose.cf, -0.13), pose.cu, -0.02);
    const back = mul(pose.cf, -1), pts: P3[] = [], sd: P3[] = [], wd: number[] = [];
    const gust = 0.2 + 0.5 * smoothStep(invLerp(60, 70, f)) * (1 - smoothStep(invLerp(90, 110, f)));
    for (let i = 0; i < 11; i++) {
      const u = i / 10, ph = f * 0.35 - i * 0.7 + side * 2;
      pts.push(add(add(anchor, mul(Y, -0.1 * i * (1 - gust * 0.6))), add(mul(back, (0.03 + gust * 0.08) * i + 0.05 * Math.sin(ph) * u), mul(J.cr, 0.04 * Math.sin(ph * 0.7) * u))));
      sd.push(norm(add(J.cr, mul(back, 0.2 * Math.sin(ph)))));
      wd.push(0.34 + 0.22 * u);
    }
    return { pts, sd, wd };
  };
  const capeA = cape(JA, A.pose, 0), capeB = cape(JB, Bf.pose, 1);
  const lockGlow = (f >= 60 && f < 80) || f >= 105 ? 1 : 0;
  const flashLight = CLASH.reduce((s, c) => s + (f >= c.f ? 30 * c.k * Math.exp(-(f - c.f) / 3) : 0), 0) + lockGlow * 12;
  // the clouds drift; the beat-5 shock wave blows a widening clearing into the cloud sea below
  const look = { ...LOOK, slabs: [{ ...LOOK.slabs![0], off: [0.32 + f * 0.00035, 0.77 + f * 0.0001] as [number, number], hole: [0, 0, f < 60 ? 0 : 4 + 85 * easeOutCubic(invLerp(60, 112, f))] as [number, number, number] }] };
  const peb = smoothStep(invLerp(60, 76, f)) * (1 - smoothStep(invLerp(84, 94, f)));
  return (
    <>
      <ShadowsOn />
      <CamRig pos={cam.pos} target={cam.target} fov={cam.fov} />
      <SkyEnv look={LOOK} intensity={0.45} />
      <fogExp2 attach="fog" args={['#E2AE84', 0.0016]} />
      <SkyDome look={look} cam={cam.pos} />
      <hemisphereLight args={['#88AEEA', '#A07850', 0.38]} />
      <directionalLight position={mul(SUN, 30)} intensity={3.6} color="#FFCE96" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004}
        shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-camera-near={1} shadow-camera-far={70} />
      <directionalLight position={[6, 4, 8]} intensity={0.6} color="#CFE0FF" />
      <pointLight position={madd(bladeA.hilt, bladeA.dir, 0.5)} color="#5CE8FF" intensity={3 * glowK} distance={4} decay={2} />
      <pointLight position={madd(bladeB.hilt, bladeB.dir, 0.5)} color="#FFB547" intensity={3 * glowK} distance={4} decay={2} />
      {flashLight > 0.05 && <pointLight position={CLASH.reduce((p, c) => (f >= c.f ? c.C : p), CLASH[0].C)} color="#FFF4E0" intensity={flashLight} distance={7} decay={2} />}
      <Arena />
      {S.isl.map((q, i) => <mesh key={i} geometry={q.o.geo} material={mats.island} position={q.at} rotation={[0, q.yaw, 0]} />)}
      <Trees items={S.trees} />
      {S.rocks.map((r, i) => <mesh key={'r' + i} geometry={mats.rockGeo} material={mats.rock} position={[r.p[0], r.p[1] + 0.15 * Math.sin(f / 20 + i), r.p[2]]} rotation={[r.rot, r.rot * 1.3 + f / 90, 0]} scale={r.s} />)}
      {S.pebbles.map((p, i) => <mesh key={'p' + i} geometry={mats.pebbleGeo} material={mats.rock} position={[p.p[0] * (1 + 0.15 * peb), p.p[1] + p.h * peb, p.p[2] * (1 + 0.15 * peb)]} rotation={[p.rot + peb * 2, p.rot, peb]} scale={p.s} castShadow />)}
      <group>
        <Body pose={A.pose} outfit={OUT_A} shadows />
        <Body pose={Bf.pose} outfit={OUT_B} shadows />
        <ClothStrip pts={capeA.pts} side={capeA.sd} width={capeA.wd} color="#2A4C9C" />
        <ClothStrip pts={capeB.pts} side={capeB.sd} width={capeB.wd} color="#9A3A22" />
        <BladeHilt hilt={bladeA.hilt} dir={bladeA.dir} color="#5CE8FF" core="#7CF2FF" len={BL} />
        <BladeHilt hilt={bladeB.hilt} dir={bladeB.dir} color="#FFB547" core="#FFC45E" len={BL} />
      </group>
      <CloudPuffs puffs={S.puffs} cam={cam.pos} look={{ sun: SUN, lit: '#FFE3BC', litK: 1.5, shade: '#9A97C4', haze: '#F2D3B2', hazeDist: 700 }} />
      <Ribbons strips={strips} cam={cam.pos} mode="add" soft={2.6} renderOrder={24} />
      <Ribbons strips={sparks} cam={cam.pos} mode="add" soft={1.6} renderOrder={25} />
      {glows.map((g, i) => <Glow key={'g' + i} p={g.p} s={g.s} color={g.c} a={g.a} />)}
      {rings.map((r, i) => <ShockRing key={'s' + i} c={r.c} n={r.n} r={r.r} a={r.a} color={r.col} w={r.w} />)}
      {void dot}
    </>
  );
};

export const SkyDuel: React.FC<V3Props> = ({ dur }) => {
  const f = useCurrentFrame();
  const { w, h } = useLayout();
  const cam = cameraAt(f);
  const camF = norm(sub(cam.target, cam.pos));
  const [sx, sy, vis] = project(madd(cam.pos, SUN, 1000), { pos: cam.pos, target: cam.target, fov: cam.fov }, w, h);
  const flareK = vis ? smoothStep(invLerp(0.55, 0.95, dot(camF, SUN))) * 0.8 : 0;
  const hit = CLASH.reduce((s, c) => s + (f >= c.f ? Math.exp(-(f - c.f) / 2.5) * Math.min(1, c.k) : 0), 0);
  const big = f >= 60 ? 0.5 * Math.exp(-(f - 60) / 2.5) : 0;
  return (
    <AbsoluteFill style={{ background: '#E9C7A2', overflow: 'hidden' }}>
      <ThreeStage exposure={0.95}>
        <Duel f={f} />
      </ThreeStage>
      <SunFlare x={sx} y={sy} k={flareK} w={w} h={h} color="255,214,160" ghost="255,190,140" />
      <AbsoluteFill style={{ pointerEvents: 'none', background: `rgba(255,246,232,${0.16 * hit + 0.45 * big})` }} />
      <AbsoluteFill style={{ pointerEvents: 'none', background: `radial-gradient(120% 95% at 50% 50%, rgba(0,0,0,0) 58%, rgba(30,14,10,${0.3 + 0.25 * cam.w}) 100%)` }} />
      <V3Tag label={LABEL} />
      {void dur}
    </AbsoluteFill>
  );
};
