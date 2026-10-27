// V3 · GAME · BOARD FLIGHT (4 bars = 240 frames at 120 BPM). Third-person hover-board game footage, built from scratch:
// a stylized rider (procedural IK mannequin with jacket, helmet visor and a trailing scarf) on a glowing board crosses a
// different place every bar: (1) a sea of clouds at sunrise, (2) low through a red-rock canyon, (3) between neon towers at
// night, (4) skimming an ocean toward a floating island. Each change is motivated and lands on the downbeat: a dive into
// a cloud bank (whiteout), a rock tunnel (darkness, then a tunnel exit into the city), a holographic ring gate (light
// burst). Carves switch edge on the beats and the rider pumps on every beat. Wow: the bar-4 burst onto the sea and the
// big carve on beat 2 that throws a sunlit rooster tail of spray toward the camera.
import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import TL from '../timeline.json';
import { CamRig, project, ThreeStage } from '../../three/stage';
import { useLayout } from '../../lib/layout';
import { clamp, easeInCubic, easeInOutSine, easeOutCubic, invLerp, keys, lerp, smoothStep } from '../../lib/anim';
import { mulberry32 } from '../../lib/rng';
import { beatAt, V3Tag, type V3Props } from '../lib';
import {
  add, CloudPuffs, cross, dot, frameQuat, madd, makeIsland, mul, norm, placeLocal, Ribbons, rotAxis, SkyDome, SkyEnv, SunFlare, sub, Trees, Waterfall,
  type P3, type Puff, type SkyLook, type Strip, type TreeInst,
} from '../three/SkyKit';
import { Body, ClothStrip, HoverBoard, solveBody, type BodyPose, type Outfit } from '../three/RiderRig';
import { canyonX, CanyonWorld, CITY_Y, CityWorld, OceanWorld } from '../three/RiderWorlds';

const LABEL = TL.shots.find((s) => s.id === 'boardRider')!.label;
const Y: P3 = [0, 1, 0];
const placeOf = (f: number) => (f < 60 ? 0 : f < 120 ? 1 : f < 180 ? 2 : 3);

// ------------------------------------------------------------------------------------------------ looks per place
const SUNS: P3[] = [norm([-0.42, 0.07, -0.9]), norm([0.45, 0.8, 0.35]), norm([-0.3, 0.45, -0.84]), norm([0.28, 0.42, -0.86])];
const LOOKS: SkyLook[] = [
  { sun: SUNS[0], zenith: '#24398A', horizon: '#FFAE6A', low: '#F0C2A0', sunColor: '#FFC27A', sunI: 1.7, sunSize: 0.9992, haze: '#F2C3A0', hazeDist: 650,
    slabs: [{ y0: -40, y1: -1.6, cov: 0.29, scale: 1 / 240, off: [0.21, 0.63], density: 0.15, lit: '#FFD3A2', litK: 1.55, shade: '#7C72B2' }] },
  { sun: SUNS[1], zenith: '#2468D4', horizon: '#CBE1F6', low: '#E2B88E', sunColor: '#FFF0D8', haze: '#EBCDA8', hazeDist: 520,
    slabs: [{ y0: 260, y1: 300, cov: 0.5, scale: 1 / 900, density: 0.08, lit: '#FFFFFF', litK: 1.4, shade: '#A9BBD8' }] },
  { sun: SUNS[2], zenith: '#08091F', horizon: '#4A2470', low: '#1A1030', sunColor: '#C8D4FF', sunI: 0.22, sunSize: 0.9996, haze: '#2A1C50', hazeDist: 300 },
  { sun: SUNS[3], zenith: '#175FD6', horizon: '#A6D6FF', low: '#4F98CC', sunColor: '#FFF0D6', haze: '#BFE0F8', hazeDist: 900,
    slabs: [{ y0: 150, y1: 200, cov: 0.46, scale: 1 / 680, off: [0.4, 0.1], density: 0.1, lit: '#FFFFFF', litK: 1.5, shade: '#9DB3D8' }] },
];
const TRAIL: [number, number, number][] = [[1.0, 0.78, 0.42], [0.35, 0.95, 1.0], [1.0, 0.3, 0.85], [0.55, 0.95, 1.0]];
const BOARD_LIGHT = ['#FFC46B', '#5CF0FF', '#FF4FD8', '#5CF0FF'];

const OUTFIT: Outfit = { skin: '#E2A986', top: '#F3F1EA', accent: '#FF5A24', bottom: '#1F2A44', boots: '#FF5A24', gloves: '#1F2A44', helmet: '#F7F7F4', visor: '#36E6FF', bulk: 1.3 };
const SCARF = '#FF2E57';

// ------------------------------------------------------------------------------------------------ rider motion
const V = [26, 31, 34, 30];
const LAT: [number, number][][] = [
  [[0, 0], [15, 2.4], [30, -2.2], [45, 0.8], [60, 0.4]],
  [[60, 0], [75, 3.0], [90, -3.2], [105, 0], [120, 0]],
  [[120, 0], [135, -3.4], [150, 3.6], [165, -1.2], [180, 0]],
  [[180, 0], [195, 4.2], [210, -2.6], [225, 1.2], [240, 0]],
];
function posAt(f: number, pl = placeOf(f)): P3 {
  const f0 = pl * 60, ff = clamp(f, f0 - 6, f0 + 66), lt = (ff - f0) / 30;
  const lat = keys(ff, LAT[pl], easeInOutSine);
  if (pl === 0) return [lat, 1.3 + 0.18 * Math.sin(lt * 6) - 12 * easeInCubic(invLerp(46, 60, ff)), -V[0] * lt];
  if (pl === 1) { const z = 2 - V[1] * lt; return [canyonX(z) + lat, 1.7 + 0.22 * Math.sin(lt * 5), z]; }
  if (pl === 2) return [lat, CITY_Y + 0.35 * Math.sin(lt * 4), 8 - V[2] * lt];
  const hop = Math.max(0, Math.sin(Math.PI * invLerp(222, 246, ff))) * 3.2;
  return [lat, 0.72 + 0.05 * Math.sin(lt * 9) + hop, -V[3] * lt];
}
function riderAt(f: number) {
  const pl = placeOf(f);
  const P = posAt(f, pl), fwd = norm(sub(posAt(f + 0.5, pl), posAt(f - 0.5, pl)));
  const R = norm(cross(fwd, Y));
  let acc = 0;
  for (let k = -3; k <= 3; k++) { const a = add(sub(posAt(f + k + 1, pl), mul(posAt(f + k, pl), 2)), posAt(f + k - 1, pl)); acc += dot(a, R) * 900; }
  acc /= 7;
  const bank = clamp(-acc * 0.011, -0.62, 0.62);
  const b = beatAt(f);
  const crouch = clamp(0.3 + 0.45 * b.pulse + Math.abs(bank) * 0.45, 0, 1);
  return { pl, P, fwd, R, bank, crouch, lt: (f - pl * 60) / 30 };
}

/** the rider's pose in board space (board long axis -Z, rider faces +X, regular stance, surfer arms) */
function riderPose(crouch: number, bank: number, reach: number, t: number): BodyPose {
  const c = crouch, lean = clamp(-bank * 1.1, -1, 1);
  const pelvis: P3 = [0.06 + 0.05 * c + lean * 0.1, 0.1 + 0.8 - 0.2 * c - Math.abs(lean) * 0.04, 0.0];
  const pf = norm([1, 0, -0.35]), pu = norm([0.1 + 0.12 * c + 0.18 * lean, 1, 0]);
  const cf = norm([1, -0.08, -0.95]), cu = norm([0.22 + 0.2 * c + 0.16 * lean, 1, 0.04]);
  const cr = norm(cross(cf, cu));
  const waist = madd(pelvis, pu, 0.1), sh = madd(waist, cu, 0.36);
  const shR = madd(sh, cr, 0.185), shL = madd(sh, cr, -0.185);
  const sway = 0.04 * Math.sin(t * 7);
  return {
    pelvis, pf, pu, cf, cu, look: norm([0.25, -0.1 - 0.08 * c, -1]),
    handL: add(shL, [0.14 + sway, 0.0 + 0.12 * lean, -0.5]), poleL: norm([0.2, -1, -0.4]),
    handR: add(shR, [lerp(0.12, 0.4, reach), lerp(-0.06, -0.76, reach) - 0.12 * lean, lerp(0.48, 0.14, reach)]), poleR: norm([0.2, -1, 0.6]),
    footL: [0.0, 0.1, -0.36], footR: [0.0, 0.1, 0.37], kneeL: norm([1, 0.15, -0.15]), kneeR: norm([1, 0.15, 0.2]),
    toeL: norm([1, 0, -0.28]), toeR: norm([1, 0, 0.12]),
  };
}

// ------------------------------------------------------------------------------------------------ camera
const CAMS = [
  { right: 1.9, up: 0.95, back: 3.4, ahead: 3, lookUp: 0.75, fov: 56, roll: 0.2 },
  { right: 0.9, up: 1.15, back: 4.0, ahead: 9, lookUp: 1.7, fov: 64, roll: 0.18 },
  { right: 1.6, up: 1.5, back: 4.6, ahead: 6, lookUp: 0.6, fov: 66, roll: 0.22 },
  { right: 2.2, up: 0.8, back: 4.2, ahead: 4, lookUp: 0.6, fov: 60, roll: 0.15 },
];
function cameraAt(f: number) {
  const r = riderAt(f), rl = riderAt(Math.max(r.pl * 60, f - 3));
  const F = norm([rl.fwd[0], rl.pl === 0 ? rl.fwd[1] * 0.6 : 0, rl.fwd[2]]), R = norm(cross(F, Y));
  let c = CAMS[r.pl];
  if (r.pl === 3) {
    const s = smoothStep(invLerp(188, 200, f)), e = smoothStep(invLerp(214, 236, f));
    c = { ...c, right: lerp(lerp(2.2, 3.2, s), 1.6, e), up: lerp(lerp(0.8, 0.6, s), 1.5, e), back: lerp(lerp(4.2, 3.4, s), 5.4, e), ahead: lerp(4, 7, e) };
  }
  const kick = (at: number, amt: number) => (f < at ? 0 : amt * Math.exp(-(f - at) / 9) * (1 - Math.exp(-(f - at) / 1.5)));
  let pos = add(madd(madd(r.P, R, c.right), F, -c.back), [0, c.up, 0]);
  let target = add(madd(r.P, F, c.ahead), [0, c.lookUp, 0]);
  if (r.pl === 3) {
    // the wow: swing round to the rider's front-right for the beat-2 carve so the rooster tail arcs out behind him
    const w = smoothStep(invLerp(186, 197, f)) * (1 - smoothStep(invLerp(211, 224, f)));
    const psi = lerp(0.5, 2.45, w), rad = lerp(4.6, 5.6, w);
    const orb = add(add(madd(mul(F, -Math.cos(psi) * rad), R, Math.sin(psi) * rad), r.P), [0, lerp(0.8, 1.1, w), 0]);
    pos = add(mul(pos, 1 - w), mul(orb, w));
    target = add(mul(target, 1 - w), mul(add(r.P, [0, 0.9, 0]), w));
  }
  const up = rotAxis(Y, F, -r.bank * c.roll);
  const fov = c.fov + kick(r.pl * 60, 10) + kick(195, 6);
  return { pos, target, up, fov, r };
}

// ------------------------------------------------------------------------------------------------ static content
function buildStatic() {
  const rnd = mulberry32(606);
  const streaks = [0, 1, 2, 3].map((pl) => Array.from({ length: 90 }, () => ({ f: pl * 60 - 4 + rnd() * 72, a: rnd() * Math.PI * 2, rad: 1.4 + rnd() * 5, w: 0.012 + rnd() * 0.02 })));
  // ocean islands
  const isl = makeIsland({ seed: 901, r: 34, depth: 46, hill: 1.1 }), isl2 = makeIsland({ seed: 903, r: 18, depth: 30 });
  const at: P3 = [46, 40, -262], at2: P3 = [-70, 62, -380];
  const trees: TreeInst[] = [...isl.trees.map((t) => ({ ...t, p: placeLocal(t.p, at, 0.4) })), ...isl2.trees.map((t) => ({ ...t, p: placeLocal(t.p, at2, 1.2) }))];
  const falls = [2.0, 2.5].map((th) => { const top = placeLocal(isl.rim(th - 0.4), at, 0.4); return { top, out: norm([top[0] - at[0], 0, top[2] - at[2]]) }; });
  const mists: Puff[] = falls.flatMap((w, i) => Array.from({ length: 6 }, (_, k) => ({ p: [w.top[0] + w.out[0] * 9 + (rnd() - 0.5) * 10, 3 + rnd() * 6, w.top[2] + w.out[2] * 9 + (rnd() - 0.5) * 10] as P3, s: 7 + rnd() * 6, seed: rnd() + i, a: 0.5 })));
  const cloudsFar: Puff[] = Array.from({ length: 16 }, (_, k) => ({ p: [-260 + k * 36 + rnd() * 20, 14 + rnd() * 26, -520 - rnd() * 120] as P3, s: 26 + rnd() * 26, seed: rnd(), a: 0.85 }));
  const burst = Array.from({ length: 18 }, () => ({ d: norm([rnd() - 0.5, rnd() - 0.4, rnd() - 0.5]), s: 1.5 + rnd() * 2.5, seed: rnd() }));
  const sprayS = Array.from({ length: 240 }, () => [rnd(), rnd(), rnd(), rnd()]);
  return { streaks, isl, isl2, at, at2, trees, falls, mists, cloudsFar, burst, sprayS };
}

// ------------------------------------------------------------------------------------------------ the 3D scene
const World: React.FC<{ f: number }> = ({ f }) => {
  const S = useMemo(buildStatic, []);
  const islandMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true }), []);
  const cam = cameraAt(f);
  const r = cam.r, pl = r.pl, look = LOOKS[pl], sun = SUNS[pl];
  const b = beatAt(f);
  const reach = pl === 3 ? smoothStep(invLerp(188, 195, f)) * (1 - smoothStep(invLerp(204, 212, f))) : 0;
  const pose = riderPose(r.crouch, r.bank, reach, f / 30);
  const J = solveBody(pose);
  const boardUp = rotAxis(Y, r.fwd, -r.bank);
  const q = frameQuat(r.fwd, boardUp);
  // scarf, in board space, streaming back (+Z) with a flutter
  const anchor = madd(madd(J.neck, pose.cf, -0.07), pose.cu, 0.02);
  const scarf: P3[] = [], side: P3[] = [], wid: number[] = [];
  for (let i = 0; i < 14; i++) {
    const u = i / 13, ph = f * 0.55 - i * 0.75;
    scarf.push(add(anchor, [0.08 * Math.sin(ph) * u ** 1.2 + 0.1 * u, 0.014 * i + 0.05 * Math.sin(ph * 0.8 + 1) * u, 0.1 * i]));
    side.push(norm([0.45 * Math.sin(ph * 0.9), 1, 0.1]));
    wid.push(0.13 - 0.05 * u);
  }
  // board light trail (world), within the current place
  const trail: P3[] = [], ta: number[] = [], tw: number[] = [];
  for (let k = 0; k < 34; k++) {
    const fk = f - k * 0.6;
    if (fk < pl * 60) break;
    const rk = riderAt(fk), uk = rotAxis(Y, rk.fwd, -rk.bank);
    trail.push(madd(madd(rk.P, rk.fwd, -0.72), uk, -0.06));
    ta.push(0.55 * (1 - k / 33) ** 1.5); tw.push(0.07 + 0.16 * (k / 33));
  }
  // speed streaks
  const camF = norm(sub(cam.target, cam.pos));
  const streaks: Strip[] = [];
  for (const s of S.streaks[pl]) {
    if (s.f < f - 4 || s.f > f + 24) continue;
    const rp = posAt(s.f, pl), rf = norm(sub(posAt(s.f + 0.5, pl), posAt(s.f - 0.5, pl))), rr = norm(cross(rf, Y)), ru = cross(rr, rf);
    const p = madd(madd(rp, rr, Math.cos(s.a) * s.rad), ru, Math.sin(s.a) * s.rad * 0.7 + 0.8);
    const d = dot(sub(p, cam.pos), camF);
    if (d < 0.4 || d > 30) continue;
    const a = 0.4 * smoothStep(invLerp(0.4, 3, d)) * (1 - smoothStep(invLerp(16, 30, d)));
    streaks.push({ pts: [p, madd(p, rf, -V[pl] * 0.07)], w: s.w, a, col: pl === 2 ? [0.8, 0.85, 1] : [1, 1, 1] });
  }
  // puffs: cloud wake (sunrise), cloud-bank remnants + dust (canyon), spray (ocean)
  const puffs: Puff[] = [];
  let puffLook = { sun, lit: '#FFD6A8', litK: 1.5, shade: '#8C80BE', haze: look.haze, hazeDist: look.hazeDist, near: [0.5, 2.2] as [number, number] };
  if (pl === 0) {
    for (let k = 0; k < 24; k++) {
      const fe = f - k * 1.4; if (fe < 0) break;
      const age = (f - fe) / 30, e = posAt(fe, 0), rk = mulberry32(Math.floor(fe * 7) + 3);
      puffs.push({ p: [e[0] + (rk() - 0.5) * 1.5 * age * 3, Math.min(e[1] - 1.3, -1.2) + age * 0.8, e[2] + 0.9 + age * 2], s: 0.5 + age * 2.6, seed: rk(), a: 0.6 * (1 - age / 1.0) * smoothStep(invLerp(0, 0.05, age)) });
    }
  } else if (pl === 1) {
    puffLook = { sun, lit: '#F7D3AC', litK: 1.25, shade: '#B98563', haze: look.haze, hazeDist: look.hazeDist, near: [0.5, 2.5] };
    for (let k = 0; k < 22; k++) {
      const fe = f - k * 1.5; if (fe < 60) break;
      const age = (f - fe) / 30, e = posAt(fe, 1), rk = mulberry32(Math.floor(fe * 5) + 11);
      puffs.push({ p: [e[0] + (rk() - 0.5) * 2.5 * age * 2, 0.4 + age * 1.6, e[2] + 0.6 + age * 1.5], s: 0.6 + age * 3.2, seed: rk(), a: 0.5 * (1 - age / 0.95) });
    }
    const bt = invLerp(60, 74, f);
    if (bt < 1) {
      const c0 = posAt(60, 1);
      S.burst.forEach((q2) => puffs.push({ p: add(madd(c0, q2.d, 3 + 16 * easeOutCubic(bt)), [0, 0.5, 2]), s: q2.s * (1 + bt * 1.5), seed: q2.seed, a: 0.65 * (1 - bt) ** 1.5 }));
    }
  } else if (pl === 3) {
    puffLook = { sun, lit: '#FFFFFF', litK: 1.6, shade: '#A7C2DD', haze: look.haze, hazeDist: look.hazeDist, near: [0.4, 1.8] };
    S.mists.forEach((m) => puffs.push(m));
    S.cloudsFar.forEach((m) => puffs.push(m));
  }
  // ocean spray: droplets and mist thrown from the board's tail; a rooster tail on the beat-2 carve, a burst on touchdown
  const spray: Strip[] = [];
  let sprayAmt = 0;
  if (pl === 3) {
    S.sprayS.forEach(([a, bb, c, d], i) => {
      const fe = f - (i % 120) * 0.3 - a * 0.3; if (fe < 180) return;
      const age = (f - fe) / 30;
      if (age > 1.1) return;
      const re = riderAt(fe), carve = Math.abs(re.bank), touch = Math.exp(-Math.max(0, fe - 181) / 6);
      const outSide = re.bank > 0 ? -1 : 1;
      const k = 0.35 + 1.4 * carve + 1.2 * touch;
      // the water is at rest: spray keeps a little of the board's push and is thrown out and up, so it trails as a rooster tail
      const v: P3 = add(add(mul(re.fwd, 1.5 + 3.5 * bb), mul(re.R, outSide * (1.5 + 6 * c) * carve * 1.6 + (d - 0.5) * 4 * touch)), [0, (2 + 5 * c) * k, 0]);
      const o = madd(madd(re.P, re.fwd, -0.6), re.R, (a - 0.5) * 0.4);
      const p: P3 = [o[0] + v[0] * age, Math.max(0.05, 0.1 + v[1] * age - 4.9 * age * age), o[2] + v[2] * age];
      const al = (1 - age / 1.1) * clamp(k, 0, 1.2) * 0.8;
      if (i % 2) puffs.push({ p, s: 0.4 + age * 2.6 * (0.6 + c), seed: a, a: al * 0.8 });
      else { const vv: P3 = [v[0], v[1] - 9.8 * age, v[2]]; spray.push({ pts: [p, madd(p, norm(vv), -0.25 - 0.2 * k)], w: 0.025 + 0.02 * c, a: al, col: [1, 1, 1] }); }
    });
    sprayAmt = clamp(Math.abs(r.bank) * 1.2, 0, 1);
  }
  const lightCol = BOARD_LIGHT[pl];
  const glow = 0.5 + 0.5 * b.pulse;
  return (
    <>
      <CamRig pos={cam.pos} target={cam.target} fov={cam.fov} up={cam.up} />
      <SkyEnv key={'env' + pl} look={look} intensity={pl === 2 ? 0.35 : 0.6} />
      <fogExp2 attach="fog" args={[look.haze, pl === 2 ? 0.0042 : pl === 1 ? 0.0024 : 0.0012]} />
      <SkyDome look={look} cam={cam.pos} />
      {pl === 0 && <>
        <hemisphereLight args={['#9AA6E6', '#F2B48C', 0.55]} />
        <directionalLight position={mul(sun, 100)} intensity={3.2} color="#FFC48A" />
      </>}
      {pl === 1 && <>
        <hemisphereLight args={['#9CC6FF', '#D8925A', 0.5]} />
        <directionalLight position={mul(sun, 100)} intensity={3.6} color="#FFF0DC" />
        <CanyonWorld t={r.lt} />
      </>}
      {pl === 2 && <>
        <hemisphereLight args={['#4A3A8E', '#140C24', 0.7]} />
        <directionalLight position={mul(sun, 100)} intensity={0.5} color="#9FB4FF" />
        <pointLight position={add(r.P, [-2.2, 1.4, -0.5])} color="#FF3FD0" intensity={14} distance={9} decay={2} />
        <pointLight position={add(r.P, [2.2, 1.2, 1.0])} color="#3FF2FF" intensity={12} distance={9} decay={2} />
        <CityWorld t={r.lt} cam={cam.pos} gate={smoothStep(invLerp(168, 180, f))} />
      </>}
      {pl === 3 && <>
        <hemisphereLight args={['#A9D3FF', '#2B6A9A', 0.55]} />
        <directionalLight position={mul(sun, 100)} intensity={3.4} color="#FFF1DE" />
        <OceanWorld t={r.lt + 3} cam={cam.pos} sun={sun} rider={r.P} dir={[r.fwd[0] / Math.hypot(r.fwd[0], r.fwd[2]), r.fwd[2] / Math.hypot(r.fwd[0], r.fwd[2])]} spray={sprayAmt} look={look} />
        <mesh geometry={S.isl.geo} material={islandMat} position={S.at} rotation={[0, 0.4, 0]} />
        <mesh geometry={S.isl2.geo} material={islandMat} position={S.at2} rotation={[0, 1.2, 0]} />
        <Trees items={S.trees} />
        {S.falls.map((w, i) => <Waterfall key={i} top={w.top} out={w.out} width={4.2} drop={w.top[1] + 2} time={f / 30} haze={look.haze} hazeDist={look.hazeDist} />)}
      </>}
      <pointLight position={add(r.P, [0, -0.3, 0])} color={lightCol} intensity={pl === 2 ? 6 : 2.5} distance={4} decay={2} />
      <CloudPuffs puffs={puffs} cam={cam.pos} look={puffLook} />
      <group position={r.P} quaternion={q}>
        <HoverBoard glow={glow} light={lightCol} />
        <Body pose={pose} outfit={OUTFIT} />
        <ClothStrip pts={scarf} side={side} width={wid} color={SCARF} emissive={pl === 2 ? '#FF2E57' : undefined} />
      </group>
      <Ribbons strips={[{ pts: trail, w: tw, a: ta, col: TRAIL[pl] }, ...streaks]} cam={cam.pos} mode="add" soft={2.2} renderOrder={22} nearFade={[0.8, 3]} />
      {spray.length > 0 && <Ribbons strips={spray} cam={cam.pos} mode="alpha" soft={1.4} renderOrder={23} nearFade={[0.4, 1.5]} />}
    </>
  );
};

export const BoardRider: React.FC<V3Props> = ({ dur }) => {
  const f = useCurrentFrame();
  const { w, h } = useLayout();
  const cam = cameraAt(f);
  const pl = cam.r.pl;
  const camF = norm(sub(cam.target, cam.pos));
  const [sx, sy, vis] = project(madd(cam.pos, SUNS[pl], 1000), { pos: cam.pos, target: cam.target, fov: cam.fov, up: cam.up }, w, h);
  const facing = dot(camF, SUNS[pl]);
  const flareK = vis && pl !== 2 ? smoothStep(invLerp(0.6, 0.97, facing)) * (pl === 0 ? 1.0 : 0.6) * (pl === 0 ? 1 - smoothStep(invLerp(48, 56, f)) : 1) : 0;
  // transitions: cloud bank whiteout (bar 1 -> 2), tunnel darkness (2 -> 3), ring-gate light burst (3 -> 4)
  // overlays peak one frame before the downbeat; the downbeat itself already shows the new place through the fade
  const white = f < 60 ? 0.95 * smoothStep(invLerp(52, 59, f)) : 0.5 * (1 - smoothStep(invLerp(60, 68, f)));
  const dark = smoothStep(invLerp(108, 117, f)) * (f < 120 ? 1 : 0) * 0.85;
  const neonFlash = f >= 120 ? 0.32 * Math.exp(-(f - 120) / 4) : 0;
  const burst = f < 180 ? 0.95 * smoothStep(invLerp(172, 179, f)) : 0.7 * (1 - smoothStep(invLerp(180, 190, f)));
  return (
    <AbsoluteFill style={{ background: '#0A0A18', overflow: 'hidden' }}>
      <ThreeStage exposure={1.0}>
        <World f={f} />
      </ThreeStage>
      <SunFlare x={sx} y={sy} k={flareK} w={w} h={h} color={pl === 0 ? '255,214,160' : '255,240,214'} ghost={pl === 0 ? '255,170,120' : '160,220,255'} />
      <AbsoluteFill style={{ pointerEvents: 'none', background: `radial-gradient(80% 80% at 50% 50%, rgba(255,247,236,${white}) 0%, rgba(250,236,226,${white}) 100%)` }} />
      <AbsoluteFill style={{ pointerEvents: 'none', background: `radial-gradient(60% 60% at 50% 50%, rgba(6,4,10,${dark * 0.6}) 0%, rgba(6,4,10,${dark}) 100%)` }} />
      <AbsoluteFill style={{ pointerEvents: 'none', background: `radial-gradient(50% 50% at 50% 50%, rgba(255,120,230,${neonFlash}) 0%, rgba(80,240,255,${neonFlash * 0.6}) 100%)`, mixBlendMode: 'screen' }} />
      <AbsoluteFill style={{ pointerEvents: 'none', background: `radial-gradient(55% 55% at 50% 50%, rgba(255,255,255,${burst}) 0%, rgba(200,250,255,${burst * 0.95}) 60%, rgba(255,160,240,${burst * 0.85}) 100%)` }} />
      <AbsoluteFill style={{ pointerEvents: 'none', background: 'radial-gradient(120% 95% at 50% 50%, rgba(0,0,0,0) 62%, rgba(8,10,30,0.3) 100%)' }} />
      <V3Tag label={LABEL} />
      {void dur}
    </AbsoluteFill>
  );
};
