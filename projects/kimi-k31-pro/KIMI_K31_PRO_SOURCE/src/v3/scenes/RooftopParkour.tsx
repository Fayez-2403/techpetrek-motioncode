// V3 · GAME · ROOFTOP PARKOUR (2 bars = 120 frames). Golden hour over an original city. A runner (procedural humanoid,
// keyframed sprint) crosses a rooftop in a low side-tracking shot, speed-vaults an AC unit on beat 3, and on beat 5 (the
// bar, the wow) leaps the 5 m gap between two buildings: the action clock slows (slight slow motion) while the camera arcs
// down into the gap and looks up at him crossing the sun, the alley dropping 46 m below. He lands on beat 7 and rolls,
// pops up on beat 8 and the camera cranes up into an aerial over the rooftops. Pure function of the frame.
import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { clamp, easeInOutSine, invLerp, keys, lerp, smoothStep } from '../../lib/anim';
import { mulberry32 } from '../../lib/rng';
import { CamRig, ThreeStage, project } from '../../three/stage';
import { beatAt, V3Tag, type V3Props } from '../lib';
import {
  BoxField, Glow, Grade, LensFlare, Particles, ShadowSetup, Shadows, SkyDome, SkyEnv, glowTex, puffTex, rayHitsBox, rgb, windowMaterial,
  type Box, type P3, type Particle, type SkyLook,
} from '../three/ActionKit';
import { Figure, OUTFITS, bodyMin, footMin, useOutfitMaterials, type Pose } from '../three/ActionHumanoid';
import { LEAP, LEAP_AIR, VAULT, afterRoll, mixPose, poseTrack, runPose } from '../three/ActionPoses';

const FPS = 30;
const STREET = -46;           // street level (roof A is y = 0)
const GAP0 = 0, GAP1 = 5.0;   // the gap between roof A (x < 0) and roof B (x > 5)
const ROOF_B = -0.6;

// ------------------------------------------------------------------------------------------------ action clock
const AIR = LEAP_AIR;
const rateAt = (f: number, r0: number) => keys(f, [[-10, 1], [55, 1], [62, r0], [83, r0], [92, 1], [200, 1]], easeInOutSine);
function tauTable(r0: number) {
  const n = 130 * 8, T = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++) T[i] = T[i - 1] + rateAt((i - 0.5) / 8 - 5, r0) / 8;
  return (f: number) => { const x = clamp((f + 5) * 8, 0, n - 1), i = Math.floor(x); return T[i] + (T[i + 1] - T[i]) * (x - i) - T[40]; };
}
/** slow-motion amount chosen so the airtime (24 action frames) spans exactly f60 -> f90 */
const R0 = (() => { let lo = 0.3, hi = 1; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2, t = tauTable(m); if (t(90) - t(60) > AIR) hi = m; else lo = m; } return (lo + hi) / 2; })();
const TAU_F = tauTable(R0);
const TT = TAU_F(60);                 // take-off (action frames)
const TV = TAU_F(30) - 2;             // vault plant (hips over the unit ~ on beat 3)
const STRIDE = 20.5;                  // action frames per stride

// forward speed (m/s) over action time
const SPEED: [number, number][] = [[-20, 7.6], [TV - 2, 7.6], [TV + 4, 6.3], [TV + 14, 7.2], [TT - 2, 7.7], [TT + 1, 7.9], [TT + AIR, 7.6], [TT + AIR + 3, 5.4], [TT + AIR + 15, 4.8], [TT + AIR + 22, 6.8], [300, 7.2]];
const XT = (() => {
  const n = 260 * 4, X = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++) X[i] = X[i - 1] + keys((i - 0.5) / 4 - 20, SPEED, easeInOutSine) / 30 / 4;
  return (t: number) => { const x = clamp((t + 20) * 4, 0, n - 1), i = Math.floor(x); return X[i] + (X[i + 1] - X[i]) * (x - i); };
})();
const X_TAKEOFF = -0.45;
const xAt = (t: number) => X_TAKEOFF + XT(t) - XT(TT);
const VAULT_X = xAt(TV + 5.5) - 0.25;   // the AC unit sits under the hips at the top of the vault

// ballistic offset during the leap: 0 at take-off, ROOF_B at landing
const VY = (ROOF_B + 4.9 * (AIR / 30) ** 2) / (AIR / 30);

interface RunnerState { pose: Pose; pos: P3; tau: number; air: number }
function runnerAt(f: number): RunnerState {
  const t = TAU_F(f);
  const ph1 = (t - TV) / STRIDE + 0.2;                 // left foot planted at the vault
  const ph2 = (t - TT) / STRIDE + 0.73;                // right foot pushing at take-off
  const ph3 = (t - (TT + AIR + 15)) / STRIDE + 0.05;
  const blend = (a: Pose, b: Pose, t0: number, t1: number) => mixPose(a, b, smoothStep(invLerp(t0, t1, t)));
  let pose: Pose, mode: 'run' | 'vault' | 'leap' | 'land';
  if (t < TV - 3) { pose = runPose(ph1); mode = 'run'; }
  else if (t < TV) { pose = blend(runPose(ph1), VAULT[0][1], TV - 3, TV); mode = 'vault'; }
  else if (t < TV + 12) { pose = poseTrack(VAULT, t - TV); mode = 'vault'; }
  else if (t < TV + 16) { pose = blend(VAULT[3][1], runPose(ph2), TV + 12, TV + 16); mode = 'vault'; }
  else if (t < TT - 3) { pose = runPose(ph2); mode = 'run'; }
  else if (t < TT) { pose = blend(runPose(ph2), LEAP[0][1], TT - 3, TT); mode = 'leap'; }
  else if (t < TT + AIR) { pose = poseTrack(LEAP, t - TT); mode = 'leap'; }
  else if (t < TT + AIR + 15) { pose = poseTrack(LEAP, t - TT); mode = 'land'; }
  else if (t < TT + AIR + 21) { pose = blend(LEAP[LEAP.length - 1][1], afterRoll(runPose(ph3)), TT + AIR + 15, TT + AIR + 21); mode = 'land'; }
  else { pose = runPose(ph3); mode = 'run'; }
  const x = xAt(t);
  let y: number;
  const yaw = Math.PI / 2;
  const ground = x < GAP0 + 0.2 ? 0 : x > GAP1 - 0.2 ? ROOF_B : -100;
  if (mode === 'run' || (mode === 'vault' && (t < TV || t > TV + 12))) {
    const fm = footMin(pose, [x, 0, 0], yaw);
    const g = x < GAP1 - 0.2 ? 0 : ROOF_B;
    y = g - fm + 0.035 * Math.max(0, Math.sin(2 * Math.PI * (2 * (mode === 'run' && t > TT ? ph3 : t > TV ? ph2 : ph1) + 0.35)));
    if (mode === 'vault') { const vk = poseTrack(VAULT, clamp(t - TV, 0, 12)).root[1]; const w = t < TV ? smoothStep(invLerp(TV - 3, TV, t)) : 1 - smoothStep(invLerp(TV + 12, TV + 16, t)); y = lerp(y, vk, w); }
  } else if (mode === 'vault') {
    y = pose.root[1];
  } else if (mode === 'leap') {
    const s = Math.max(0, t - TT) / 30;
    const pre = t < TT ? smoothStep(invLerp(TT - 3, TT, t)) : 1;
    const runY = 0 - footMin(runPose(ph2), [x, 0, 0], yaw) + runPose(ph2).root[1];
    y = lerp(runY, pose.root[1], pre) + (t >= TT ? VY * s - 4.9 * s * s : 0);
  } else {
    y = ROOF_B + pose.root[1];
    if (mode === 'land' && t > TT + AIR + 15) {
      const runY = ROOF_B - footMin(runPose(ph3), [x, 0, 0], yaw) + runPose(ph3).root[1];
      y = lerp(y, runY, smoothStep(invLerp(TT + AIR + 15, TT + AIR + 21, t)));
    }
  }
  pose = { ...pose, root: [0, y, 0] };
  if (ground > -50) {
    const bm = bodyMin(pose, [x, 0, 0], yaw);
    if (bm < ground) pose = { ...pose, root: [0, y + (ground - bm), 0] };
  }
  return { pose, pos: [x, 0, 0], tau: t, air: mode === 'leap' && t > TT ? 1 : 0 };
}

// ------------------------------------------------------------------------------------------------ camera
function camAt(f: number) {
  const R = runnerAt(f);
  const c: P3 = [R.pos[0] + 0.25, R.pose.root[1] - 0.05, 0];
  // polar rig around the runner: azimuth from his right side (+z) toward his front (+x), elevation, distance
  const az = keys(f, [[0, -0.18], [28, -0.05], [50, 0.02], [100, 0.1], [106, 0.0], [120, -0.75]], easeInOutSine);
  const el = keys(f, [[0, 0.1], [28, 0.02], [50, 0.07], [100, 0.12], [106, 0.22], [120, 0.7]], easeInOutSine);
  const r = keys(f, [[0, 6.6], [28, 6.2], [55, 6.0], [100, 6.2], [120, 11.0]], easeInOutSine);
  let pos: P3 = [c[0] + r * Math.cos(el) * Math.sin(az), c[1] + r * Math.sin(el), c[2] + r * Math.cos(el) * Math.cos(az)];
  const lead = keys(f, [[0, 0.9], [55, 0.6], [75, 0.5], [100, 0.6], [120, 3.4]], easeInOutSine);
  let target: P3 = [c[0] + lead, c[1] + keys(f, [[0, 0.0], [95, -0.1], [120, -1.6]], easeInOutSine), c[2]];
  let fov = keys(f, [[0, 44], [55, 46], [100, 48], [120, 52]], easeInOutSine);
  // the wow (f54-100): the camera sinks into the alley slot looking down its length toward the low sun, he crosses
  // overhead in slow motion, then it rises with him onto roof B
  const K = (k: [number, number][]) => keys(f, k, easeInOutSine);
  const gx = K([[54, R.pos[0] - 1.1], [60, 0.55], [67, 1.35], [76, 2.25], [84, 3.05], [91, 4.15], [100, R.pos[0] - 0.4]]);
  const gy = K([[54, 1.25], [60, 0.75], [67, -0.7], [76, -1.75], [84, -1.0], [91, 0.35], [100, 0.9]]);
  const gz = K([[54, 6.2], [62, 5.4], [76, 4.3], [88, 4.8], [100, 5.9]]);
  const w = Math.min(smoothStep(invLerp(52, 58, f)), 1 - smoothStep(invLerp(94, 102, f)));
  if (w > 0) {
    const gp: P3 = [gx, gy, gz];
    const gt: P3 = [R.pos[0] + K([[54, 0.6], [70, 0.4], [80, 0.2], [100, 0.6]]), R.pose.root[1] + K([[54, 0], [68, -0.25], [76, -0.15], [92, 0.0]]), K([[54, 0], [66, -0.6], [80, -0.8], [100, 0]])];
    pos = [lerp(pos[0], gp[0], w), lerp(pos[1], gp[1], w), lerp(pos[2], gp[2], w)];
    target = [lerp(target[0], gt[0], w), lerp(target[1], gt[1], w), lerp(target[2], gt[2], w)];
    fov = lerp(fov, K([[54, 46], [66, 54], [78, 57], [92, 52]]), w);
  }
  return { pos, target, fov, roll: keys(f, [[0, 0], [60, 0], [76, -0.06], [92, 0.0], [120, 0]], easeInOutSine) };
}

// ------------------------------------------------------------------------------------------------ look
const SUN: P3 = (() => { const el = (9 * Math.PI) / 180, az = (-9 * Math.PI) / 180; return [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)]; })();
const LOOK: SkyLook = {
  sunDir: SUN, zenith: '#3d6db4', horizon: '#ffcf98', glow: '#ffb055', ground: '#6b5240', sun: '#fff3d4', sunPower: 6, sunSize: 0.032, glowPow: 4,
  cloud: 0.75, cloudScale: 1.1, cloudLit: '#ffd9a8', cloudDark: '#c58d7c', cloudSeed: 21,
};
const FOG: [string, number, number] = ['#ebba8a', 35, 620];

// ------------------------------------------------------------------------------------------------ world data
interface RoofProp { kind: 'ac' | 'vent' | 'tank' | 'box' | 'sky' | 'mast' | 'dish' | 'panel' | 'pipe'; p: P3; s: P3; rot?: number }
function useWorld() {
  return useMemo(() => {
    const r = mulberry32(777);
    const facade = ['#b8664a', '#c98b62', '#9a5a44', '#d7b48c', '#8a7c72', '#c4a183', '#a86e55', '#ded0bc'];
    const city: Box[] = [];
    // our two buildings
    const A = { x0: -42, x1: GAP0, z0: -10, z1: 10, top: 0 }, B = { x0: GAP1, x1: 38, z0: -11, z1: 9, top: ROOF_B };
    city.push({ p: [(A.x0 + A.x1) / 2, STREET, 0], s: [A.x1 - A.x0, A.top - STREET, A.z1 - A.z0], color: '#b9694c' });
    city.push({ p: [(B.x0 + B.x1) / 2, STREET, (B.z0 + B.z1) / 2], s: [B.x1 - B.x0, B.top - STREET, B.z1 - B.z0], color: '#c7a07c' });
    // the rest of the city on a street grid (streets every 46 m, 12 m wide)
    for (let gx = -8; gx <= 8; gx++) for (let gz = -9; gz <= 4; gz++) {
      const cx = gx * 46, cz = gz * 46;
      for (let k = 0; k < 4; k++) {
        const ox = (k % 2) * 17 - 8.5, oz = Math.floor(k / 2) * 17 - 8.5;
        const bx = cx + ox, bz = cz + oz;
        if (bx > A.x0 - 12 && bx < B.x1 + 12 && bz > -26 && bz < 24) continue;
        if (r() < 0.1) continue;
        const dist = Math.hypot(bx, bz);
        const sunLine = Math.abs(Math.atan2(bx, -bz) - Math.atan2(SUN[0], -SUN[2])) < 0.1 && bz < 0;
        const tall = !sunLine && dist > 110 && r() < 0.1 + (dist > 220 ? 0.22 : 0);
        const h = tall ? 64 + r() * 80 : 14 + r() * r() * 34 + (dist > 150 ? r() * 14 : 0);
        const w = 9 + r() * 7, d = 9 + r() * 7;
        const cx2 = bx + (r() - 0.5) * 3, cz2 = bz + (r() - 0.5) * 3, col = facade[Math.floor(r() * facade.length)];
        city.push({ p: [cx2, STREET, cz2], s: [w, h, d], color: col });
        if (tall) city.push({ p: [cx2, STREET + h, cz2], s: [w * 0.66, 8 + r() * 16, d * 0.66], color: col });
      }
    }
    // neighbours of A and B in the same block (lower, so we see over them)
    for (const [x, z, w, d, h] of [[-60, 0, 14, 22, 38], [-21, -22, 42, 16, 40], [-21, 22, 42, 14, 36], [21, -23, 34, 16, 41], [21, 21, 34, 14, 33], [52, 0, 18, 22, 39]]) {
      city.push({ p: [x, STREET, z], s: [w, h, d], color: facade[Math.floor(r() * facade.length)] });
    }
    // rooftop clutter on other buildings (water tanks + boxes), only for roofs below ~ +20
    const clutter: Box[] = [];
    for (const b of city.slice(2)) {
      const top = b.p[1] + b.s[1];
      if (top > 25 || r() < 0.4) continue;
      clutter.push({ p: [b.p[0] + (r() - 0.5) * b.s[0] * 0.5, top, b.p[2] + (r() - 0.5) * b.s[2] * 0.5], s: [2 + r() * 3, 1 + r() * 2.2, 2 + r() * 3], color: '#8d8a86' });
    }
    // roof A props (runner path z = 0 stays clear except the AC unit)
    const props: RoofProp[] = [
      { kind: 'ac', p: [VAULT_X, 0, 0], s: [1.1, 0.95, 1.7] },
      { kind: 'ac', p: [VAULT_X - 1.6, 0, -2.6], s: [1.1, 0.95, 1.7] },
      { kind: 'tank', p: [-24, 0, -5.5], s: [2.8, 3.2, 2.8] },
      { kind: 'box', p: [-12, 0, -6.6], s: [3.4, 2.7, 3.0] },
      { kind: 'vent', p: [-6, 0, 3.4], s: [0.5, 0.9, 0.5] }, { kind: 'vent', p: [-17, 0, 4.2], s: [0.5, 0.8, 0.5] }, { kind: 'vent', p: [-3, 0, -4.4], s: [0.45, 0.8, 0.45] },
      { kind: 'sky', p: [-30, 0, 3.5], s: [3, 0.9, 2] }, { kind: 'mast', p: [-9, 2.7, -7.6], s: [0.08, 5.5, 0.08] }, { kind: 'dish', p: [-35, 0, -6], s: [1.1, 1.2, 1.1] },
      { kind: 'pipe', p: [-20, 0.25, -9.2], s: [40, 0.18, 0.18] },
      // roof B
      { kind: 'tank', p: [20, ROOF_B, -6.5], s: [3.2, 3.6, 3.2] },
      { kind: 'panel', p: [14, ROOF_B, 4.6], s: [6, 0.6, 2.4] }, { kind: 'panel', p: [22, ROOF_B, 4.6], s: [6, 0.6, 2.4] },
      { kind: 'ac', p: [10, ROOF_B, -4.2], s: [1.1, 0.95, 1.7] }, { kind: 'vent', p: [16, ROOF_B, -2.6], s: [0.5, 0.9, 0.5] }, { kind: 'box', p: [30, ROOF_B, -3], s: [3.2, 2.6, 3.2] },
    ];
    // fire escapes on the alley walls (A faces +x at x = 0, B faces -x at x = 5)
    const esc: Box[] = [];
    for (let fl = 0; fl < 12; fl++) {
      const y = -3.2 - fl * 3.5;
      for (const [x, z0] of [[GAP0 + 0.6, -4.5], [GAP1 - 0.6, 1.5]] as [number, number][]) {
        esc.push({ p: [x, y, z0], s: [1.2, 0.08, 3.4], color: '#2b2a2c' });
        esc.push({ p: [x + (x < 2 ? 0.58 : -0.58), y + 0.04, z0], s: [0.04, 0.95, 3.4], color: '#2b2a2c' });
        esc.push({ p: [x, y - 1.75, z0 + (fl % 2 ? 1 : -1) * 0.2], s: [0.7, 0.05, 3.6], rotY: 0, color: '#252426' });
      }
    }
    const birds = Array.from({ length: 11 }, (_, i) => ({ p: [8 + i * 0.9 + r() * 0.5, ROOF_B + 0.7, -11 + r() * 0.2] as P3, v: [1.5 + r() * 3, 2.6 + r() * 2.4, -2.5 - r() * 3] as P3, ph: r(), seed: i }));
    const cars = Array.from({ length: 26 }, (_, i) => ({ axis: i % 2, lane: (i % 4 < 2 ? 1 : -1) * 2.8, line: (Math.floor(r() * 7) - 3) * 46 + 23, off: r() * 600, v: (i % 4 < 2 ? 1 : -1) * (6 + r() * 5), color: ['#d9d4c9', '#2b2f38', '#b2321f', '#e8b23a', '#3a5f8f'][i % 5] }));
    return { city, clutter, props, esc, birds, cars, A, B };
  }, []);
}

// ------------------------------------------------------------------------------------------------ textures
function gravelTex() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 512;
  const g = cv.getContext('2d')!, r = mulberry32(5);
  g.fillStyle = '#8b8075'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '70,64,58' : '150,140,128'},${0.03 + 0.04 * r()})`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 60, 15 + r() * 40, r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 26000; i++) { const v = r(); g.fillStyle = v < 0.5 ? `rgba(40,36,32,${0.4 * r()})` : `rgba(200,190,175,${0.35 * r()})`; g.fillRect(r() * 512, r() * 512, 1 + r() * 2.5, 1 + r() * 2.5); }
  g.strokeStyle = 'rgba(40,36,32,0.25)'; g.lineWidth = 3;
  for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(0, k * 128 + 4); g.lineTo(512, k * 128 + 4); g.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function streetTex() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 512;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#7d756c'; g.fillRect(0, 0, 512, 512);
  g.fillStyle = '#3c3b3e'; g.fillRect(0, 0, 512, 67); g.fillRect(0, 0, 67, 512);
  g.fillStyle = 'rgba(240,220,160,0.7)'; for (let k = 0; k < 8; k++) { g.fillRect(k * 64 + 8, 32, 30, 3); g.fillRect(32, k * 64 + 8, 3, 30); }
  g.fillStyle = 'rgba(240,240,240,0.6)'; for (let k = 0; k < 6; k++) { g.fillRect(70 + k * 6, 4, 3, 59); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// ------------------------------------------------------------------------------------------------ world
const WING = (() => { const sh = new THREE.Shape(); sh.moveTo(0, 0.05); sh.lineTo(0.34, 0.0); sh.lineTo(0.3, -0.06); sh.lineTo(0, -0.08); sh.closePath(); const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); return g; })();
const World: React.FC<{ f: number; cam: ReturnType<typeof camAt>; R: RunnerState }> = ({ f, cam, R }) => {
  const W = useWorld();
  const outfit = OUTFITS.runner, mats = useOutfitMaterials(outfit);
  const M = useMemo(() => {
    const gravel = gravelTex(); gravel.repeat.set(10, 5);
    const gravelB = gravelTex().clone(); gravelB.repeat.set(8, 5); gravelB.needsUpdate = true;
    const street = streetTex(); street.repeat.set(40, 40);
    return {
      roofA: new THREE.MeshStandardMaterial({ map: gravel, roughness: 0.95 }),
      roofB: new THREE.MeshStandardMaterial({ map: gravelB, color: '#d8cfc4', roughness: 0.95 }),
      city: windowMaterial({ color: '#ffffff', roughness: 0.85 }, { glass: '#3c4a5c', lit: '#ffcf8f', litFrac: 0.03, litPower: 0.35, floorH: 3.4, winW: 2.0, glassRough: 0.1, glassMetal: 0.85, seed: 4, ground: STREET }),
      clutter: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8 }),
      parapet: new THREE.MeshStandardMaterial({ color: '#a7978a', roughness: 0.85 }),
      coping: new THREE.MeshStandardMaterial({ color: '#d9d0c4', roughness: 0.6 }),
      metal: new THREE.MeshStandardMaterial({ color: '#b8bcc0', roughness: 0.35, metalness: 0.8 }),
      dark: new THREE.MeshStandardMaterial({ color: '#2a2b2e', roughness: 0.6, metalness: 0.4 }),
      wood: new THREE.MeshStandardMaterial({ color: '#7a5a3c', roughness: 0.85 }),
      glass: new THREE.MeshPhysicalMaterial({ color: '#8fb7d0', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.55 }),
      panel: new THREE.MeshStandardMaterial({ color: '#2c3d63', roughness: 0.2, metalness: 0.6 }),
      esc: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6, metalness: 0.5 }),
      street: new THREE.MeshStandardMaterial({ map: street, roughness: 0.9 }),
      car: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4, metalness: 0.3 }),
      bird: new THREE.MeshStandardMaterial({ color: '#6d6866', roughness: 0.8, side: THREE.DoubleSide }),
      shadow: new THREE.MeshBasicMaterial({ map: glowTex(), color: '#000', transparent: true, opacity: 0.0, depthWrite: false }),
    };
  }, []);
  const sun = useMemo(() => { const l = new THREE.DirectionalLight('#ffbb73', 4.2); l.castShadow = true; l.shadow.mapSize.set(2048, 2048); l.shadow.bias = -0.0004; l.shadow.normalBias = 0.03; const c = l.shadow.camera; c.left = -24; c.right = 24; c.top = 24; c.bottom = -24; c.near = 1; c.far = 160; return l; }, []);
  const focus: P3 = [R.pos[0] + 4, 0, 0];
  sun.position.set(focus[0] + SUN[0] * 80, SUN[1] * 80, focus[2] + SUN[2] * 80);
  sun.target.position.set(focus[0], 0, focus[2]);
  sun.target.updateMatrixWorld();

  const t = f / FPS;
  // dust: vault plant, take-off, landing
  const dust: Particle[] = [];
  const burst = (f0: number, at: P3, n: number, spread: number, seed: number, k = 1) => {
    for (let i = 0; i < n; i++) {
      const h = mulberry32(seed + i), age = (f - f0) / FPS;
      if (age < 0 || age > 1.4) continue;
      const v: P3 = [(h() - 0.3) * spread * 1.6, 0.4 + h() * 0.9, (h() - 0.5) * spread];
      const g = 1 - Math.exp(-age * 3);
      dust.push({ p: [at[0] + v[0] * g, at[1] + 0.1 + v[1] * g * 0.7, at[2] + v[2] * g], size: 0.35 + age * 1.4 + h() * 0.2, c: rgb('#e2c7a4', 1.05), a: k * 0.55 * (1 - age / 1.4) ** 1.5, rot: h() * 6 });
    }
  };
  burst(29, [VAULT_X - 0.9, 0, 0.1], 10, 0.8, 100, 0.6);
  burst(59, [X_TAKEOFF, 0, 0], 12, 1.2, 200, 0.8);
  burst(90, [xAt(TT + AIR), ROOF_B, 0], 26, 2.2, 300, 1);
  burst(96, [xAt(TT + AIR + 6), ROOF_B, 0], 14, 1.6, 400, 0.7);

  // startled birds lift off roof B as he lands
  const birds = W.birds.map((b) => {
    const age = Math.max(0, (f - 90 - b.seed * 0.9) / FPS);
    const p: P3 = [b.p[0] + b.v[0] * age, b.p[1] + b.v[1] * age + 0.6 * age * age, b.p[2] + b.v[2] * age];
    const flap = age > 0 ? Math.sin((f / FPS) * 28 + b.ph * 6) * 0.85 : -0.15;
    return { p, flap, yaw: Math.atan2(b.v[0], b.v[2]) };
  });

  const shadowK = R.air ? 0 : 0.5;
  return (
    <>
      <ShadowSetup />
      <SkyDome look={LOOK} at={cam.pos} drift={t * 0.01} />
      <SkyEnv look={LOOK} intensity={0.85} />
      <hemisphereLight args={['#87a9e6', '#8a5f45', 0.62]} />
      <primitive object={sun} />
      <primitive object={sun.target} />
      <directionalLight position={[focus[0] - SUN[0] * 60, 30, focus[2] - SUN[2] * 60]} intensity={0.45} color="#a9c6ff" />

      {/* the city and the street grid far below */}
      <BoxField boxes={W.city} material={M.city} />
      <BoxField boxes={W.clutter} material={M.clutter} />
      <mesh material={M.street} rotation={[-Math.PI / 2, 0, 0]} position={[0, STREET + 0.02, 0]}><planeGeometry args={[900, 900]} /></mesh>
      {W.cars.map((c, i) => {
        const s = ((((c.off + c.v * t * 3) % 600) + 600) % 600) - 300;
        const p: P3 = c.axis ? [c.line + c.lane, STREET + 0.7, s] : [s, STREET + 0.7, c.line + c.lane];
        return (
          <group key={i} position={p} rotation={[0, c.axis ? 0 : Math.PI / 2, 0]}>
            <mesh material={M.car} scale={[1.8, 1.3, 4.2]}><boxGeometry /></mesh>
            <Glow pos={[0, 0, 2.2 * Math.sign(c.v)]} size={2.2} color="#fff0c8" opacity={0.6} />
          </group>
        );
      })}

      {/* roofs: gravel, parapets with coping, the A/B edges */}
      <Shadows cast={false} receive>
        <mesh material={M.roofA} rotation={[-Math.PI / 2, 0, 0]} position={[(W.A.x0 + W.A.x1) / 2, 0.01, 0]}><planeGeometry args={[W.A.x1 - W.A.x0, W.A.z1 - W.A.z0]} /></mesh>
        <mesh material={M.roofB} rotation={[-Math.PI / 2, 0, 0]} position={[(W.B.x0 + W.B.x1) / 2, ROOF_B + 0.01, (W.B.z0 + W.B.z1) / 2]}><planeGeometry args={[W.B.x1 - W.B.x0, W.B.z1 - W.B.z0]} /></mesh>
      </Shadows>
      <Shadows>
        {[[W.A, 0], [W.B, ROOF_B]].flatMap(([b, y], k) => {
          const B = b as typeof W.A, Y = y as number;
          const segs: [number, number, number, number][] = [[B.x0, B.z0, B.x1, B.z0], [B.x0, B.z1, B.x1, B.z1], [B.x0, B.z0, B.x0, B.z1], [B.x1, B.z0, B.x1, B.z1]];
          return segs.filter((_, j) => !(k === 0 && j === 3) && !(k === 1 && j === 2)).map(([x0, z0, x1, z1], j) => (
            <group key={`${k}-${j}`}>
              <mesh material={M.parapet} position={[(x0 + x1) / 2, Y + 0.32, (z0 + z1) / 2]}><boxGeometry args={[Math.abs(x1 - x0) + 0.3, 0.64, Math.abs(z1 - z0) + 0.3]} /></mesh>
              <mesh material={M.coping} position={[(x0 + x1) / 2, Y + 0.66, (z0 + z1) / 2]}><boxGeometry args={[Math.abs(x1 - x0) + 0.42, 0.06, Math.abs(z1 - z0) + 0.42]} /></mesh>
            </group>
          ));
        })}
        <mesh material={M.coping} position={[GAP0 - 0.05, 0.02, 0]}><boxGeometry args={[0.16, 0.06, 20.2]} /></mesh>
        <mesh material={M.coping} position={[GAP1 + 0.05, ROOF_B + 0.02, -1]}><boxGeometry args={[0.16, 0.06, 20.2]} /></mesh>
        {W.props.map((p, i) => <RoofThing key={i} p={p} M={M} f={f} />)}
        <Figure pose={R.pose} outfit={outfit} mats={mats} pos={R.pos} yaw={Math.PI / 2} />
      </Shadows>
      <BoxField boxes={W.esc} material={M.esc} />
      {birds.map((b, i) => (
        <group key={i} position={b.p} rotation={[0, b.yaw, 0]}>
          {[1, -1].map((s) => <group key={s} rotation={[0, 0, s * b.flap]}><mesh geometry={WING} material={M.bird} scale={[s, 1, 1]} /></group>)}
          <mesh material={M.bird} scale={[0.08, 0.075, 0.17]}><sphereGeometry args={[1, 10, 8]} /></mesh>
          <mesh material={M.bird} position={[0, 0.06, 0.14]} scale={0.05}><sphereGeometry args={[1, 8, 6]} /></mesh>
        </group>
      ))}
      <mesh material={M.shadow} position={[R.pos[0], 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.2, 0.8, 1]} visible={shadowK > 0}><planeGeometry /></mesh>
      <Particles items={dust} max={80} map={puffTex(9)} order={26} />
    </>
  );
};

const RoofThing: React.FC<{ p: RoofProp; M: Record<string, THREE.Material>; f: number }> = ({ p, M, f }) => {
  const [x, y, z] = p.p, [sx, sy, sz] = p.s;
  switch (p.kind) {
    case 'ac': return (
      <group position={[x, y, z]}>
        <mesh material={M.metal} position={[0, sy / 2, 0]}><boxGeometry args={[sx, sy, sz]} /></mesh>
        {[-0.4, 0.4].map((dz) => (
          <group key={dz} position={[0, sy + 0.005, dz * sz * 0.6]}>
            <mesh material={M.dark} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.34, 24]} /></mesh>
            {[0, 1, 2].map((k) => <mesh key={k} material={M.metal} position={[0, 0.02, 0]} rotation={[0, (f * 0.6 + k * 2.09) + dz, 0]}><boxGeometry args={[0.6, 0.015, 0.08]} /></mesh>)}
          </group>
        ))}
        {[0, 1, 2, 3, 4].map((k) => <mesh key={k} material={M.dark} position={[sx / 2 + 0.005, 0.2 + k * 0.13, 0]}><boxGeometry args={[0.01, 0.04, sz * 0.8]} /></mesh>)}
      </group>
    );
    case 'tank': return (
      <group position={[x, y, z]}>
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], k) => <mesh key={k} material={M.dark} position={[a * sx * 0.32, 1.1, b * sz * 0.32]}><boxGeometry args={[0.14, 2.2, 0.14]} /></mesh>)}
        <mesh material={M.wood} position={[0, 2.2 + sy / 2, 0]}><cylinderGeometry args={[sx / 2, sx / 2 * 1.04, sy, 20]} /></mesh>
        <mesh material={M.dark} position={[0, 2.2 + sy + 0.45, 0]}><coneGeometry args={[sx / 2 * 1.08, 0.9, 20]} /></mesh>
        {[0.25, 0.6, 0.9].map((k) => <mesh key={k} material={M.dark} position={[0, 2.2 + sy * k, 0]}><torusGeometry args={[sx / 2 * 1.03, 0.025, 6, 28]} /></mesh>)}
      </group>
    );
    case 'box': return (
      <group position={[x, y, z]}>
        <mesh material={M.parapet} position={[0, sy / 2, 0]}><boxGeometry args={[sx, sy, sz]} /></mesh>
        <mesh material={M.coping} position={[0, sy + 0.05, 0]}><boxGeometry args={[sx + 0.2, 0.1, sz + 0.2]} /></mesh>
        <mesh material={M.dark} position={[sx / 2 + 0.01, 1.05, 0.4]}><boxGeometry args={[0.02, 2.1, 0.95]} /></mesh>
      </group>
    );
    case 'vent': return (
      <group position={[x, y, z]}>
        <mesh material={M.metal} position={[0, sy / 2, 0]}><cylinderGeometry args={[sx * 0.4, sx * 0.4, sy, 14]} /></mesh>
        <mesh material={M.metal} position={[0, sy + 0.08, 0]}><cylinderGeometry args={[sx * 0.15, sx * 0.75, 0.2, 14]} /></mesh>
      </group>
    );
    case 'sky': return (
      <group position={[x, y, z]}>
        <mesh material={M.coping} position={[0, 0.2, 0]}><boxGeometry args={[sx, 0.4, sz]} /></mesh>
        <mesh material={M.glass} position={[0, 0.55, 0]} rotation={[0, Math.PI / 4, 0]} scale={[sx * 0.7, 0.35, sz * 0.7]}><coneGeometry args={[1, 1, 4]} /></mesh>
      </group>
    );
    case 'mast': return (
      <group position={[x, y, z]}>
        <mesh material={M.metal}><cylinderGeometry args={[0.05, 0.07, sy, 6]} /></mesh>
        <Glow pos={[0, sy / 2 + 0.1, 0]} size={0.9} color="#ff3a2a" opacity={0.5 + 0.5 * (Math.sin(f * 0.21) > 0 ? 1 : 0.1)} />
      </group>
    );
    case 'dish': return (
      <group position={[x, y, z]}>
        <mesh material={M.dark} position={[0, 0.5, 0]}><cylinderGeometry args={[0.04, 0.06, 1.0, 6]} /></mesh>
        <mesh material={M.coping} position={[0, 1.0, 0]} rotation={[0.9, 0.6, 0]}><sphereGeometry args={[0.55, 18, 8, 0, Math.PI * 2, 0, 0.9]} /></mesh>
      </group>
    );
    case 'panel': return (
      <group position={[x, y, z]}>
        <mesh material={M.dark} position={[0, 0.25, 0]}><boxGeometry args={[sx, 0.08, 0.1]} /></mesh>
        <mesh material={M.panel} position={[0, 0.45, 0]} rotation={[-0.5, 0, 0]}><boxGeometry args={[sx, 0.05, sz]} /></mesh>
      </group>
    );
    case 'pipe': return <mesh material={M.metal} position={[x, y, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[sy / 2, sy / 2, sx, 10]} /></mesh>;
  }
  return null;
};

// ------------------------------------------------------------------------------------------------ shot
export const RooftopParkour: React.FC<V3Props> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const R = runnerAt(f);
  const b = beatAt(f);
  const W = useWorld();
  const camP = { pos: cam.pos, target: cam.target, fov: cam.fov };
  const sp = project([cam.pos[0] + SUN[0] * 1000, cam.pos[1] + SUN[1] * 1000, cam.pos[2] + SUN[2] * 1000], camP, 1920, 1080);
  const blocked = W.city.some((bx) => rayHitsBox(cam.pos, SUN, [bx.p[0] - bx.s[0] / 2, bx.p[1], bx.p[2] - bx.s[2] / 2], [bx.p[0] + bx.s[0] / 2, bx.p[1] + bx.s[1], bx.p[2] + bx.s[2] / 2]));
  // the runner crossing the sun dims it a little (his silhouette eclipses the flare)
  const rp = project([R.pos[0], R.pose.root[1] + 0.3, 0], camP, 1920, 1080);
  const ecl = smoothStep(invLerp(60, 220, Math.hypot(rp[0] - sp[0], rp[1] - sp[1])));
  const inFrame = sp[2] ? smoothStep(invLerp(-250, 100, Math.min(sp[0], 1920 - sp[0]))) * smoothStep(invLerp(-250, 80, Math.min(sp[1], 1080 - sp[1]))) : 0;
  const flare = blocked ? 0 : inFrame * (0.55 + 0.45 * ecl) * (0.85 + 0.15 * b.pulse);
  const slow = 1 - clamp((TAU_F(f + 0.5) - TAU_F(f - 0.5)));
  return (
    <AbsoluteFill style={{ background: '#e0b080', overflow: 'hidden' }}>
      <ThreeStage exposure={1.02} fog={FOG}>
        <CamRig pos={cam.pos} target={cam.target} fov={cam.fov} roll={cam.roll} />
        <World f={f} cam={cam} R={R} />
      </ThreeStage>
      <LensFlare x={sp[0]} y={sp[1]} w={1920} h={1080} k={flare} warm="255,200,130" size={1.1} />
      <Grade vignette={0.42 + 0.25 * slow} tint="#ffb46a" tintOpacity={0.12 + 0.1 * slow} />
      <V3Tag label="GAME · ROOFTOP PARKOUR" />
    </AbsoluteFill>
  );
};
