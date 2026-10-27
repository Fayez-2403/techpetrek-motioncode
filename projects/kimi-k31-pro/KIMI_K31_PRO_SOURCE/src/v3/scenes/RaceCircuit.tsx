// V3 · GAME · RACING (2 bars = 120 frames). Two original GT prototypes on a sunset seafront street circuit.
// Bar 1: low chase cam behind the blue hero car, slipstreaming the black/yellow rival down a street canyon toward the sea;
// footbridges whoosh overhead on beats 2 and 3, the rival brakes on beat 3, the hero dives inside and brakes late on beat 4.
// Beat 5 (the bar, the wow): the hero completes the overtake at the apex in a burst of underbody sparks while the camera
// whips 90° to a long-lens side tracking shot; bar 2 tracks alongside through the exit with tyre smoke, light trails and the
// sun flaring behind the cars; exhaust pops on beats 6-8 and the hero pulls away on the last beat.
// Car paths: arc-length positions integrated from speed keys, lateral offsets keyed along the centreline (all pure functions).
import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { clamp, easeInOutCubic, easeInOutSine, invLerp, keys, lerp, smoothStep } from '../../lib/anim';
import { mulberry32, noise1 } from '../../lib/rng';
import { CamRig, ThreeStage, project } from '../../three/stage';
import { beatAt, V3Tag, type V3Props } from '../lib';
import {
  BoxField, Glow, Grade, LensFlare, Particles, SkyDome, SkyEnv, WhipBlur, glowTex, puffTex, rayHitsBox, rgb, streakTex, windowMaterial,
  type Box, type P3, type Particle, type SkyLook,
} from '../three/ActionKit';
import { CAR, CarLights, LIVERIES, RaceCar, carLightPoints, useCarGeo, type CarState } from '../three/ActionCars';

const FPS = 30;
// ------------------------------------------------------------------------------------------------ track
const L1 = 260, RC = 28, ARC = (Math.PI * RC) / 2, SC = L1, SX = L1 + ARC;
const HALF = 7;

interface Frame { p: P3; h: P3; r: P3; yaw: number }
/** centreline at arc length s: straight north (-z), a 90° right-hander, then the seafront straight east (+x) */
function center(s: number): Frame {
  if (s <= SC) return { p: [0, 0, L1 - s], h: [0, 0, -1], r: [1, 0, 0], yaw: Math.PI };
  if (s <= SX) {
    const ph = (s - SC) / RC;
    const h: P3 = [Math.sin(ph), 0, -Math.cos(ph)];
    return { p: [RC - RC * Math.cos(ph), 0, -RC * Math.sin(ph)], h, r: [-h[2], 0, h[0]], yaw: Math.PI - ph };
  }
  return { p: [RC + (s - SX), 0, -RC], h: [1, 0, 0], r: [0, 0, 1], yaw: Math.PI / 2 };
}
const onTrack = (s: number, d: number, y = 0): P3 => { const c = center(s); return [c.p[0] + c.r[0] * d, y, c.p[2] + c.r[2] * d]; };

// ------------------------------------------------------------------------------------------------ car motion
const HERO_V: [number, number][] = [[-1, 68], [0, 68], [1.48, 71], [1.85, 42], [2.1, 38], [2.45, 40], [3.0, 52], [4.2, 64]];
const RIVAL_V: [number, number][] = [[-1, 63], [0, 63], [0.98, 64], [1.5, 37], [2.0, 33], [2.5, 36], [3.0, 44], [4.2, 52]];
const T0 = -1, DT = 1 / 240;
function integrate(v: [number, number][]) {
  const n = Math.ceil((4.5 - T0) / DT) + 1, D = new Float64Array(n);
  for (let i = 1; i < n; i++) { const t = T0 + (i - 0.5) * DT; D[i] = D[i - 1] + keys(t, v, easeInOutSine) * DT; }
  return (t: number) => { const x = (clamp(t, T0, 4.49) - T0) / DT, i = Math.floor(x); return D[i] + (D[i + 1] - D[i]) * (x - i); };
}
const DH = integrate(HERO_V), DR = integrate(RIVAL_V);
const S_APEX_HERO = SC + 0.42 * ARC;                       // hero position on beat 5 (frame 60)
const H0 = S_APEX_HERO - (DH(2) - DH(0));
const R0 = H0 + (DH(2) - DH(0)) - (DR(2) - DR(0)) - 2.6;  // so the hero leads by 2.6 m on beat 5
const sHero = (t: number) => H0 + DH(t) - DH(0);
const sRival = (t: number) => R0 + DR(t) - DR(0);

const RIVAL_LINE: [number, number][] = [[-1e4, -1.2], [SC - 85, -1.2], [SC - 22, -4.3], [SC + 0.18 * ARC, -1.2], [SC + 0.6 * ARC, 0.6], [SX + 10, -2.6], [SX + 42, -3.6], [SX + 120, -1.2], [1e4, -1.2]];
const HERO_IN: [number, number][] = [[-1e4, 2.2], [SC - 60, 2.4], [SC - 14, 3.5], [SC + 0.45 * ARC, 4.7], [SX + 16, 2.8], [SX + 80, 0.6], [1e4, 0.6]];
const dRival = (s: number) => keys(s, RIVAL_LINE, easeInOutSine);
const dHero = (t: number) => lerp(dRival(sHero(t)), keys(sHero(t), HERO_IN, easeInOutSine), smoothStep(invLerp(0.72, 1.28, t)));

const BRIDGES = [0.5, 1.0].map((tb) => sHero(tb) - 4.2);
const heroPos = (t: number) => onTrack(sHero(t), dHero(t));
const rivalPos = (t: number) => onTrack(sRival(t), dRival(sRival(t)));
const win = (t: number, a: number, b: number, e = 0.15) => Math.min(smoothStep(invLerp(a, a + e, t)), 1 - smoothStep(invLerp(b - e, b, t)));

function carState(hero: boolean, t: number): CarState {
  const P = hero ? heroPos : rivalPos;
  const a = P(t - 1 / 120), b = P(t + 1 / 120), p = P(t);
  const yawPath = Math.atan2(b[0] - a[0], b[2] - a[2]);
  const slip = hero ? 0.1 * win(t, 1.8, 2.95, 0.3) : 0.06 * win(t, 1.6, 2.75, 0.3);
  const brake = hero ? win(t, 1.48, 1.92, 0.04) : win(t, 0.98, 1.62, 0.04);
  const pA = P(t - 0.05), pB = P(t + 0.05);
  const yawRate = (Math.atan2(pB[0] - p[0], pB[2] - p[2]) - Math.atan2(p[0] - pA[0], p[2] - pA[2])) / 0.05;
  const s = hero ? sHero(t) : sRival(t);
  const kerb = hero ? win(t, 1.93, 2.12, 0.03) : 0;
  return {
    pos: [p[0], 0.012 * noise1(t * 40, hero ? 1 : 2) + 0.05 * kerb * Math.sin(t * 90), p[2]],
    yaw: yawPath - slip,
    pitch: 0.022 * brake - 0.006,
    roll: clamp(-yawRate * 0.02, -0.05, 0.05) + 0.02 * kerb * Math.sin(t * 70),
    spin: s * 0.06,
    steer: clamp(-yawRate * 0.18 + slip * 1.2, -0.35, 0.35),
    brake, head: 1, blur: 0.85,
  };
}

// ------------------------------------------------------------------------------------------------ camera
const SIDE_D = 10.5;
function camAt(f: number) {
  const t = f / FPS;
  const hp = heroPos(t), sh = sHero(t);
  // chase cam in the hero's frame: heading lags the car's (path heading a few metres back), lateral moves lag too
  const hc = center(sh - 5).h, hcar = carState(true, t);
  const lagD = dHero(t - 0.16) - dHero(t);
  const rc = center(sh).r;
  const dist = 6.5;
  const cc: P3 = [hp[0] - hc[0] * dist + rc[0] * lagD * 0.8, 1.32 + 0.05 * Math.sin(t * 2.1), hp[2] - hc[2] * dist + rc[2] * lagD * 0.8];
  const ah: P3 = [Math.sin(hcar.yaw), 0, Math.cos(hcar.yaw)];
  const chase = { pos: cc, target: [hp[0] + ah[0] * 9, 0.62, hp[2] + ah[2] * 9] as P3 };
  const lag = dHero(t - 0.16);
  const fr = center(sh);
  const side = { pos: [hp[0] + fr.r[0] * SIDE_D, 0.74 + 0.03 * Math.sin(t * 3.1), hp[2] + fr.r[2] * SIDE_D] as P3 };
  const whip = easeInOutCubic(invLerp(54, 64, f));
  // along-track drift in bar 2: ahead a touch, then the hero pulls away on beat 8
  const along = keys(f, [[64, 0.9], [100, 0.2], [120, -3.4]], easeInOutSine);
  const sideTarget: P3 = [hp[0] + fr.h[0] * (0.6 + 0.12 * along), 0.86, hp[2] + fr.h[2] * (0.6 + 0.12 * along)];
  side.pos = [side.pos[0] + fr.h[0] * along, side.pos[1], side.pos[2] + fr.h[2] * along];
  if (whip <= 0) return { pos: chase.pos, target: chase.target, fov: lerp(55, 49, smoothStep(invLerp(40, 54, f))), roll: -0.035 * Math.sin((dHero(t) - lag) * 1.4), blur: 0 };
  if (whip >= 1) return { pos: side.pos, target: sideTarget, fov: keys(f, [[64, 30], [100, 30], [120, 32.5]], easeInOutSine), roll: 0, blur: 0 };
  // orbit about the hero from behind to its right side: interpolate angle, radius and height
  const rel = (q: P3) => [q[0] - hp[0], q[2] - hp[2]] as [number, number];
  const [ax, az] = rel(chase.pos), [bx, bz] = rel(side.pos);
  let a0 = Math.atan2(ax, az), a1 = Math.atan2(bx, bz);
  while (a1 - a0 > Math.PI) a1 -= 2 * Math.PI;
  while (a1 - a0 < -Math.PI) a1 += 2 * Math.PI;
  const a = lerp(a0, a1, whip), r = lerp(Math.hypot(ax, az), Math.hypot(bx, bz), whip);
  const pos: P3 = [hp[0] + Math.sin(a) * r, lerp(chase.pos[1], side.pos[1], whip), hp[2] + Math.cos(a) * r];
  const target: P3 = [lerp(chase.target[0], sideTarget[0], whip), lerp(chase.target[1], sideTarget[1], whip), lerp(chase.target[2], sideTarget[2], whip)];
  return { pos, target, fov: lerp(49, 30, whip), roll: 0, blur: 52 * Math.sin(Math.PI * whip) ** 1.4 };
}

// ------------------------------------------------------------------------------------------------ look
const SUN_EL = (3.2 * Math.PI) / 180, SUN_AZ = (-3.5 * Math.PI) / 180;
const SUN: P3 = [-Math.sin(SUN_AZ) * Math.cos(SUN_EL), Math.sin(SUN_EL), -Math.cos(SUN_AZ) * Math.cos(SUN_EL)];
const LOOK: SkyLook = {
  sunDir: SUN, zenith: '#28306e', horizon: '#e7896c', glow: '#ffb466', ground: '#2c2230', sun: '#fff0cf', sunPower: 5, sunSize: 0.03, glowPow: 5,
  cloud: 0.9, cloudScale: 0.9, cloudLit: '#ffc690', cloudDark: '#7b5277', cloudSeed: 7,
};
const FOG: [string, number, number] = ['#d4876f', 60, 1250];

// ------------------------------------------------------------------------------------------------ textures
function roadTexture() {
  const W = 512, H = 2048, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!, r = mulberry32(41);
  g.fillStyle = '#3a393d'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '20,20,24' : '70,68,70'},${0.18 + 0.2 * r()})`; g.fillRect(r() * W, r() * H, 40 + r() * 180, 60 + r() * 300); }
  for (let i = 0; i < 60000; i++) { const v = r(); g.fillStyle = v < 0.5 ? `rgba(15,15,18,${0.35 * r()})` : `rgba(150,145,140,${0.25 * r()})`; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
  // rubber laid down in the middle of the road
  const rub = g.createLinearGradient(0, 0, W, 0);
  rub.addColorStop(0.2, 'rgba(10,10,12,0)'); rub.addColorStop(0.42, 'rgba(10,10,12,0.32)'); rub.addColorStop(0.58, 'rgba(10,10,12,0.32)'); rub.addColorStop(0.8, 'rgba(10,10,12,0)');
  g.fillStyle = rub; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(8,8,10,${0.15 + 0.15 * r()})`; g.lineWidth = 3 + r() * 4; const x = W * (0.3 + 0.4 * r()); g.beginPath(); g.moveTo(x, r() * H); g.lineTo(x + (r() - 0.5) * 30, r() * H); g.stroke(); }
  // edge lines and faded street dashes
  g.fillStyle = 'rgba(236,236,230,0.92)'; g.fillRect(W * 0.03, 0, W * 0.014, H); g.fillRect(W * 0.956, 0, W * 0.014, H);
  g.fillStyle = 'rgba(230,226,210,0.2)';
  for (let k = 0; k < 6; k++) g.fillRect(W * 0.494, (k / 6) * H, W * 0.012, H / 18);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function stripeTexture(a: string, b: string) {
  const cv = document.createElement('canvas'); cv.width = 16; cv.height = 64;
  const g = cv.getContext('2d')!; g.fillStyle = a; g.fillRect(0, 0, 16, 32); g.fillStyle = b; g.fillRect(0, 32, 16, 32);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function fenceTexture() {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
  const g = cv.getContext('2d')!; g.strokeStyle = 'rgba(40,44,50,0.9)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(64, 64); g.moveTo(64, 0); g.lineTo(0, 64); g.stroke();
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

/** a ribbon following the centreline between lateral offsets d0..d1 (uv: u across, v along in metres / vScale) */
function ribbon(s0: number, s1: number, d0: number, d1: number, y: number, vScale: number, step = 1) {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const n = Math.ceil((s1 - s0) / step);
  for (let i = 0; i <= n; i++) {
    const s = s0 + ((s1 - s0) * i) / n;
    const a = onTrack(s, d0, y), b = onTrack(s, d1, y);
    pos.push(...a, ...b); uv.push(0, s / vScale, 1, s / vScale);
    if (i < n) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------------------------------------------ scenery
function palmGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  const trunk = new THREE.CylinderGeometry(0.16, 0.3, 9, 7, 6, true);
  trunk.translate(0, 4.5, 0);
  const tp = trunk.attributes.position;
  for (let i = 0; i < tp.count; i++) { const y = tp.getY(i); tp.setX(i, tp.getX(i) + 0.035 * y * y * 0.12); }
  parts.push(trunk);
  for (let k = 0; k < 9; k++) {
    const leaf = new THREE.PlaneGeometry(0.7, 4.2, 1, 8);
    const lp = leaf.attributes.position;
    for (let i = 0; i < lp.count; i++) { const v = (lp.getY(i) + 2.1) / 4.2; lp.setXYZ(i, lp.getX(i) * Math.sin(Math.PI * Math.min(1, v * 1.2)) * 1.2, 0, v * 4.2); lp.setY(i, 0.9 * Math.sin(v * 2.2) - 1.6 * v * v); }
    leaf.rotateY((k / 9) * Math.PI * 2);
    leaf.translate(0.34, 9, 0);
    parts.push(leaf);
  }
  let nv = 0; const pos: number[] = [], idx: number[] = [];
  for (const g of parts) { const p = g.attributes.position.array, ix = g.index!.array; for (let i = 0; i < p.length; i++) pos.push(p[i]); for (let i = 0; i < ix.length; i++) idx.push(ix[i] + nv); nv += p.length / 3; }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); m.setIndex(idx); m.computeVertexNormals();
  return m;
}

function useScenery() {
  return useMemo(() => {
    const r = mulberry32(2024);
    const facade = ['#d9c2a2', '#c98b6c', '#e0b6a6', '#8f9aab', '#e7e0d2', '#b8a089', '#a46f5e', '#cfd3d6'];
    const near: Box[] = [], far: Box[] = [];
    for (const side of [-1, 1]) {
      let z = side < 0 ? -8 : 12;
      while (z < 470) {
        const d = 12 + r() * 14, w = 14 + r() * 12, hgt = 12 + r() * 30 + (z > 200 ? 8 : 0);
        near.push({ p: [side * (15 + w / 2), 0, z + d / 2], s: [w, hgt, d], color: facade[Math.floor(r() * facade.length)] });
        z += d + 1.5 + r() * 4;
      }
      z = side < 0 ? 10 : 30;
      while (z < 700) {
        const d = 18 + r() * 20, w = 18 + r() * 20, hgt = 30 + r() * 60;
        far.push({ p: [side * (52 + w / 2 + r() * 20), 0, z + d / 2], s: [w, hgt, d], color: facade[Math.floor(r() * facade.length)] });
        z += d + 3 + r() * 8;
      }
    }
    // a few towers far east along the bay
    for (let i = 0; i < 14; i++) far.push({ p: [140 + i * 38 + r() * 20, 0, 30 + r() * 80], s: [20 + r() * 12, 40 + r() * 70, 20 + r() * 14], color: facade[Math.floor(r() * facade.length)] });
    // walls: left (outside) all the way, right only along the first straight
    const walls: Box[] = [], wallCol = ['#ecebe6', '#16a2a8', '#ecebe6', '#262a33'];
    for (let s = 60; s < SX + 420; s += 2) {
      const c = center(s), p = onTrack(s, -(HALF + 1.05));
      walls.push({ p, s: [0.55, 1.0, 2.04], rotY: c.yaw, color: wallCol[Math.floor(s / 8) % 4] });
      if (s < SC - 16) { const q = onTrack(s, HALF + 1.05); walls.push({ p: q, s: [0.55, 1.0, 2.04], rotY: c.yaw, color: wallCol[(Math.floor(s / 8) + 1) % 4] }); }
    }
    const posts: Box[] = [];
    for (let s = 60; s < SX + 420; s += 4) posts.push({ p: onTrack(s, -(HALF + 1.2)), s: [0.08, 4.2, 0.08], color: '#3b3f46' });
    const lamps: { p: P3; head: P3 }[] = [];
    for (let s = 70; s < SC - 10; s += 30) for (const sd of [-1, 1]) { const b = onTrack(s, sd * (HALF + 2.4)); lamps.push({ p: b, head: onTrack(s, sd * (HALF + 0.6), 8.4) }); }
    for (let x = -60; x < 560; x += 26) lamps.push({ p: [x, 0, -RC - HALF - 3.4], head: [x, 8.4, -RC - HALF - 1.6] });
    const palms: { p: P3; rot: number; sc: number }[] = [];
    for (let x = -140; x < 620; x += 15 + r() * 9) palms.push({ p: [x, 0, -46 - r() * 4], rot: r() * 6.28, sc: 0.85 + 0.35 * r() });
    for (let i = 0; i < 10; i++) palms.push({ p: [-14 - r() * 40, 0, -10 - r() * 30], rot: r() * 6.28, sc: 0.8 + 0.4 * r() });
    const streaks: { s: number; d: number; y: number; len: number }[] = [];
    for (let i = 0; i < 150; i++) { const d = (r() < 0.5 ? -1 : 1) * (2.6 + r() * 6); streaks.push({ s: 120 + r() * 330, d, y: 0.12 + r() * r() * 2.4, len: 2.5 + r() * 3.5 }); }
    // low streaks across the runoff between the side camera and the cars (bar 2 foreground)
    for (let i = 0; i < 90; i++) streaks.push({ s: SX - 20 + r() * 160, d: 7.6 + r() * 4.6, y: 0.04 + r() * 0.35, len: 1.5 + r() * 2.5 });
    return { near, far, walls, posts, lamps, palms, streaks };
  }, []);
}

/** camera-facing light trail through past positions (newest first) */
const Trail: React.FC<{ pts: P3[]; cam: P3; width: number; color: string; k: number }> = ({ pts, cam, width, color, k }) => {
  const { geo, mat } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(64 * 2 * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(64 * 2 * 3), 3));
    const idx: number[] = []; for (let i = 0; i < 63; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    g.setIndex(idx);
    return { geo: g, mat: new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false }) };
  }, []);
  const n = Math.min(64, pts.length);
  if (n < 2 || k <= 0.01) return null;
  const P = geo.attributes.position as THREE.BufferAttribute, C = geo.attributes.color as THREE.BufferAttribute;
  const base = new THREE.Color(color);
  const t = new THREE.Vector3(), v = new THREE.Vector3(), o = new THREE.Vector3();
  for (let i = 0; i < 64; i++) {
    const j = Math.min(i, n - 1), a = pts[Math.max(0, j - 1)], b = pts[Math.min(n - 1, j + 1)], p = pts[j];
    t.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    v.set(cam[0] - p[0], cam[1] - p[1], cam[2] - p[2]).normalize();
    o.crossVectors(t, v).normalize().multiplyScalar(width * (1 - (0.6 * j) / n));
    P.setXYZ(i * 2, p[0] + o.x, p[1] + o.y, p[2] + o.z); P.setXYZ(i * 2 + 1, p[0] - o.x, p[1] - o.y, p[2] - o.z);
    const fade = i < n ? k * (1 - j / (n - 1)) ** 1.6 : 0;
    C.setXYZ(i * 2, base.r * fade, base.g * fade, base.b * fade); C.setXYZ(i * 2 + 1, base.r * fade, base.g * fade, base.b * fade);
  }
  P.needsUpdate = C.needsUpdate = true;
  geo.computeBoundingSphere();
  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={22} />;
};

// ------------------------------------------------------------------------------------------------ the world
const World: React.FC<{ f: number; cam: ReturnType<typeof camAt> }> = ({ f, cam }) => {
  const t = f / FPS;
  const sc = useScenery();
  const heroGeo = useCarGeo(LIVERIES.hero), rivalGeo = useCarGeo(LIVERIES.rival);
  const R = useMemo(() => {
    const road = new THREE.MeshStandardMaterial({ map: roadTexture(), color: '#b9b4bd', roughness: 0.6, metalness: 0.05, envMapIntensity: 0.45 });
    const kerb = new THREE.MeshStandardMaterial({ map: stripeTexture('#d8252c', '#f0eeea'), roughness: 0.55 });
    const ground = new THREE.MeshStandardMaterial({ color: '#7d6f69', roughness: 0.92 });
    const near = windowMaterial({ color: '#ffffff', roughness: 0.82 }, { glass: '#141b27', lit: '#ffc985', litFrac: 0.22, litPower: 2.4, floorH: 3.2, winW: 1.9, seed: 3 });
    const far = windowMaterial({ color: '#ffffff', roughness: 0.85 }, { glass: '#232c3c', lit: '#ffcf8e', litFrac: 0.28, litPower: 2.4, floorH: 3.5, winW: 2.8, seed: 9 });
    const wall = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 });
    const post = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5, metalness: 0.6 });
    const fence = new THREE.MeshStandardMaterial({ map: fenceTexture(), transparent: true, opacity: 0.26, depthWrite: false, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.5 });
    (fence.map as THREE.Texture).repeat.set(1, 1);
    const palm = new THREE.MeshStandardMaterial({ color: '#2a2a22', roughness: 0.8, side: THREE.DoubleSide, emissive: new THREE.Color('#3a1c10'), emissiveIntensity: 0.25 });
    const pole = new THREE.MeshStandardMaterial({ color: '#2d3036', roughness: 0.4, metalness: 0.7 });
    const hill = new THREE.MeshStandardMaterial({ color: '#4a3550', roughness: 1, flatShading: true });
    const seaWall = new THREE.MeshStandardMaterial({ color: '#b9a593', roughness: 0.9 });
    const bridge = new THREE.MeshStandardMaterial({ color: '#e9e6df', roughness: 0.5, metalness: 0.2 });
    const glassRail = new THREE.MeshPhysicalMaterial({ color: '#9fc6d6', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.35 });
    const shadow = new THREE.MeshBasicMaterial({ map: glowTex(), color: '#000000', transparent: true, opacity: 0.7, depthWrite: false });
    const strip = [new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff8a3c').multiplyScalar(1.6), toneMapped: false }), new THREE.MeshBasicMaterial({ color: new THREE.Color('#2fe0ff').multiplyScalar(1.6), toneMapped: false })];
    return {
      strip, road, kerb, ground, near, far, wall, post, fence, palm, pole, hill, seaWall, bridge, glassRail, shadow,
      roadGeo: ribbon(40, SX + 460, -HALF, HALF, 0.02, 56, 1),
      kerbIn: ribbon(SC - 8, SX + 330, HALF - 0.9, HALF + 0.35, 0.035, 2, 0.5),
      kerbOut: ribbon(SX - 12, SX + 46, -HALF - 0.35, -HALF + 0.9, 0.035, 2, 0.5),
      fenceGeo: (() => { const g = ribbon(60, SX + 420, -(HALF + 1.2), -(HALF + 1.2), 0, 1, 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (i % 2) p.setY(i, 4.1); else p.setY(i, 1.0); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i) * 2.5, i % 2 ? 7.4 : 0); g.computeVertexNormals(); return g; })(),
      palmGeo: palmGeometry(),
      shadowGeo: new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    };
  }, []);
  (R.road.map as THREE.Texture).repeat.set(1, 1);
  (R.kerb.map as THREE.Texture).repeat.set(1, 1);

  const hero = carState(true, t), rival = carState(false, t);
  const bridges = BRIDGES;

  // light trails: tail lights sampled back in time
  // in the chase view the hero's own trail is kept short so it never streams into the lens
  const sideK = smoothStep(invLerp(56, 66, f));
  const trail = (hero: boolean, idx: number) => {
    const n = Math.round(lerp(hero ? 5 : 9, 30, sideK)), dt = lerp(hero ? 1 / 200 : 1 / 70, 1 / 75, sideK);
    return Array.from({ length: n }, (_, k) => carLightPoints(carState(hero, t - k * dt)).tail[idx]);
  };

  // tyre smoke: rear wheels while sliding, front wheels when the rival locks up on beat 3
  const smoke: Particle[] = [];
  const emit = (hero: boolean, a: number, b: number, wheels: 'rear' | 'front', amt: number, seed: number) => {
    const rate = 2.2;
    for (let tb = a; tb < Math.min(b, t); tb += 1 / (FPS * rate)) {
      const age = t - tb; if (age > 1.5) continue;
      const cs = carState(hero, tb), L = carLightPoints(cs);
      const yawC = Math.cos(cs.yaw), yawS = Math.sin(cs.yaw);
      const zLoc = wheels === 'rear' ? CAR.axleR : CAR.axleF;
      for (const side of [1, -1]) {
        const h = mulberry32(Math.floor(tb * 1000) * 7 + seed + (side > 0 ? 1 : 0));
        const x = side * CAR.track, z = zLoc - 0.2;
        const p0: P3 = [cs.pos[0] + x * yawC + z * yawS, 0.25, cs.pos[2] - x * yawS + z * yawC];
        void L;
        const drift: P3 = [(h() - 0.5) * 3, 0.9 + h() * 1.2, (h() - 0.5) * 3];
        const grow = 0.9 + age * (4.2 + h() * 2.0);
        const a0 = amt * (1 - smoothStep(invLerp(0, 1.5, age))) * smoothStep(invLerp(0, 0.06, age));
        smoke.push({ p: [p0[0] + drift[0] * age, p0[1] + drift[1] * age + 0.3 * grow, p0[2] + drift[2] * age], size: grow, c: rgb('#e9cbc4', 0.95), a: a0 * 0.85, rot: h() * 6.28 + age * (h() - 0.5) });
      }
    }
  };
  emit(true, 1.82, 2.95, 'rear', 1, 11);
  emit(false, 1.62, 2.7, 'rear', 0.8, 23);
  emit(false, 1.32, 1.6, 'front', 0.75, 37);
  smoke.sort((a, b) => {
    const da = (a.p[0] - cam.pos[0]) ** 2 + (a.p[2] - cam.pos[2]) ** 2, db = (b.p[0] - cam.pos[0]) ** 2 + (b.p[2] - cam.pos[2]) ** 2;
    return db - da;
  });

  // underbody sparks as the hero clips the apex kerb on beat 5, plus exhaust pops on beats 6, 7, 8
  const sparks: Particle[] = [];
  for (let i = 0; i < 160; i++) {
    const h = mulberry32(900 + i), tb = 1.9 + h() * 0.3, age = t - tb;
    if (age < 0 || age > 0.42) continue;
    const cs = carState(true, tb), yc = Math.cos(cs.yaw), ys = Math.sin(cs.yaw);
    const x = (h() - 0.5) * 1.4, z = -1.0 - h() * 1.0;
    const p0: P3 = [cs.pos[0] + x * yc + z * ys, 0.06, cs.pos[2] - x * ys + z * yc];
    const sp = 6 + h() * 12, fwd: P3 = [ys, 0, yc];
    const v: P3 = [fwd[0] * (20 - sp) + (h() - 0.5) * 8, 1.5 + h() * 3.5, fwd[2] * (20 - sp) + (h() - 0.5) * 8];
    const p: P3 = [p0[0] + v[0] * age, Math.max(0.02, p0[1] + v[1] * age - 4.9 * age * age), p0[2] + v[2] * age];
    const life = 1 - age / 0.42;
    sparks.push({ p, size: 0.035 + 0.02 * h(), c: rgb(h() < 0.3 ? '#fff4d8' : '#ffa040', 3.5 * life), a: 1, v: [v[0], v[1] - 9.8 * age, v[2]], stretch: 9 });
  }
  const pops: Particle[] = [];
  for (const tp of [2.5, 3.0, 3.5]) {
    const age = t - tp;
    if (age < 0 || age > 0.16) continue;
    const L = carLightPoints(hero), e = L.tail[2], k = 1 - age / 0.16;
    const back: P3 = [-Math.sin(hero.yaw), 0, -Math.cos(hero.yaw)];
    for (let j = 0; j < 4; j++) pops.push({ p: [e[0] + back[0] * (0.25 + j * 0.22), 0.42 + 0.02 * j, e[2] + back[2] * (0.25 + j * 0.22)], size: (0.5 - 0.08 * j) * (0.7 + 0.6 * k), c: rgb(j < 2 ? '#7fc8ff' : '#ff9a3a', 2.4 * k), a: 1, rot: j * 1.3 });
  }

  // speed streaks: static in the world, bright only near the camera and at speed
  const vHero = keys(t, HERO_V, easeInOutSine);
  const streaks: Particle[] = [];
  for (const st of sc.streaks) {
    const c = center(st.s), p = onTrack(st.s, st.d, st.y);
    const dx = p[0] - cam.pos[0], dz = p[2] - cam.pos[2], dist = Math.hypot(dx, dz);
    const low = st.d > 7.5;
    const k = smoothStep(invLerp(low ? 1.5 : 3, low ? 3.5 : 7, dist)) * (1 - smoothStep(invLerp(14, 28, dist))) * smoothStep(invLerp(30, 60, vHero)) * (low ? sideK * 0.8 : 1 - 0.55 * sideK);
    if (k < 0.02) continue;
    streaks.push({ p, size: 0.035, c: rgb('#ffe6cc', 1.1 * k), a: 1, v: c.h, stretch: st.len / 0.035 });
  }

  const L = carLightPoints(hero);
  const shadowFor = (s: CarState) => {
    const fwd = [Math.sin(s.yaw), Math.cos(s.yaw)], sd = [-SUN[0], -SUN[2]], n = Math.hypot(sd[0], sd[1]);
    const sx = sd[0] / n, sz = sd[1] / n, along = Math.abs(fwd[0] * sx + fwd[1] * sz), across = Math.sqrt(1 - along * along);
    const width = across * 4.8 + along * 2.1;
    return { p: [s.pos[0] + sx * 3.2, 0.03, s.pos[2] + sz * 3.2] as P3, rot: Math.atan2(sx, sz), sc: [width, 1, 9] as P3 };
  };
  const sh1 = shadowFor(hero), sh2 = shadowFor(rival);
  return (
    <>
      <SkyDome look={LOOK} at={cam.pos} drift={t * 0.004} />
      <SkyEnv look={LOOK} intensity={0.9} />
      <Glow pos={[cam.pos[0] + SUN[0] * 900, cam.pos[1] + SUN[1] * 900, cam.pos[2] + SUN[2] * 900]} size={240} color="#ffc88a" opacity={0.85} />
      <hemisphereLight args={['#7b7cc8', '#4a3030', 0.6]} />
      <directionalLight position={[cam.pos[0] + SUN[0] * 200, SUN[1] * 200 + 4, cam.pos[2] + SUN[2] * 200]} intensity={3.2} color="#ffb27a" />
      <directionalLight position={[cam.pos[0] - 40, 30, cam.pos[2] + 60]} intensity={0.55} color="#8fa2ff" />

      {/* ground, road, kerbs */}
      <mesh material={R.ground} rotation={[-Math.PI / 2, 0, 0]} position={[200, 0, 211]}><planeGeometry args={[1400, 520]} /></mesh>
      <mesh geometry={R.roadGeo} material={R.road} />
      <mesh geometry={R.kerbIn} material={R.kerb} />
      <mesh geometry={R.kerbOut} material={R.kerb} />
      <BoxField boxes={sc.walls} material={R.wall} />
      <BoxField boxes={sc.posts} material={R.post} />
      <mesh geometry={R.fenceGeo} material={R.fence} />

      {/* city */}
      <BoxField boxes={sc.near} material={R.near} />
      <BoxField boxes={sc.far} material={R.far} />
      {bridges.map((s, i) => {
        const c = onTrack(s, 0);
        return (
          <group key={i} position={[c[0], 0, c[2]]}>
            <mesh material={R.bridge} position={[0, 7.2, 0]}><boxGeometry args={[24, 1.1, 2.6]} /></mesh>
            <mesh material={R.glassRail} position={[0, 8.3, 1.2]}><boxGeometry args={[24, 1.1, 0.05]} /></mesh>
            <mesh material={R.glassRail} position={[0, 8.3, -1.2]}><boxGeometry args={[24, 1.1, 0.05]} /></mesh>
            {[-10.5, 10.5].map((x) => <mesh key={x} material={R.bridge} position={[x, 3.6, 0]}><boxGeometry args={[1.2, 7.2, 1.6]} /></mesh>)}
            <mesh material={R.strip[i % 2]} position={[0, 6.62, 1.32]}><boxGeometry args={[20, 0.12, 0.04]} /></mesh>
          </group>
        );
      })}
      {sc.lamps.map((l, i) => (
        <group key={i}>
          <mesh material={R.pole} position={[l.p[0], 4.2, l.p[2]]}><cylinderGeometry args={[0.09, 0.14, 8.4, 6]} /></mesh>
          <mesh material={R.pole} position={[(l.p[0] + l.head[0]) / 2, 8.4, (l.p[2] + l.head[2]) / 2]} rotation={[0, Math.atan2(l.head[0] - l.p[0], l.head[2] - l.p[2]), 0]}><boxGeometry args={[0.1, 0.1, Math.hypot(l.head[0] - l.p[0], l.head[2] - l.p[2])]} /></mesh>
          <Glow pos={[l.head[0], 8.25, l.head[2]]} size={2.4} color="#ffc27a" opacity={0.75} />
        </group>
      ))}

      {/* seafront: sea wall, palms, the bay, distant headlands, a few boats */}
      <mesh material={R.seaWall} position={[200, -1.4, -49]}><boxGeometry args={[1400, 2.8, 2]} /></mesh>
      {sc.palms.map((p, i) => <mesh key={i} geometry={R.palmGeo} material={R.palm} position={p.p} rotation={[0, p.rot, 0]} scale={p.sc} />)}
      <Sea />
      {[[-900, -1250, 380, 70, 220], [-420, -1450, 260, 44, 160], [-1300, -1100, 300, 110, 260], [700, -1500, 340, 55, 200], [1150, -1250, 260, 85, 220]].map(([x, z, sx, sy, sz], i) => (
        <mesh key={i} material={R.hill} position={[x, -6, z]} scale={[sx, sy, sz]}><icosahedronGeometry args={[1, 2]} /></mesh>
      ))}
      {[[-160, -380], [90, -620], [-40, -900]].map(([x, z], i) => (
        <group key={i} position={[x, -2.2, z]}>
          <mesh material={R.pole} position={[0, 0.6, 0]}><boxGeometry args={[7, 1.2, 2.2]} /></mesh>
          <mesh material={R.palm} position={[0, 5.5, 0]}><coneGeometry args={[2.4, 9, 3]} /></mesh>
        </group>
      ))}

      {/* car shadows (long, low sun from the north) and contact darkening */}
      {[sh1, sh2].map((s, i) => <mesh key={i} geometry={R.shadowGeo} material={R.shadow} position={s.p} rotation={[0, s.rot, 0]} scale={s.sc} renderOrder={5} />)}
      {[hero, rival].map((s, i) => <mesh key={`c${i}`} geometry={R.shadowGeo} material={R.shadow} position={[s.pos[0], 0.031, s.pos[2]]} rotation={[0, s.yaw, 0]} scale={[3.0, 1, 6.2]} renderOrder={5} />)}

      <RaceCar geo={rivalGeo} liv={LIVERIES.rival} s={rival} />
      <RaceCar geo={heroGeo} liv={LIVERIES.hero} s={hero} />
      <CarLights s={rival} />
      <CarLights s={hero} />
      {[0, 1].map((i) => <Trail key={`th${i}`} pts={trail(true, i)} cam={cam.pos} width={0.05} color="#ff2a3a" k={1.1 * sideK} />)}
      {[0, 1].map((i) => <Trail key={`tr${i}`} pts={trail(false, i)} cam={cam.pos} width={0.05} color="#ff2a3a" k={1.1} />)}
      <Particles items={smoke} max={600} map={puffTex(5)} order={26} />
      <Particles items={streaks} max={240} map={streakTex()} additive order={27} />
      <Particles items={sparks} max={200} map={glowTex()} additive order={28} />
      <Particles items={pops} max={16} map={glowTex()} additive order={29} />
      <Glow pos={[L.under[0], 0.15, L.under[2]]} size={5} color="#ff8a3a" opacity={1.2 * win(t, 1.92, 2.18, 0.05)} />
    </>
  );
};

// ------------------------------------------------------------------------------------------------ sea
const seaVert = /* glsl */ `
varying vec3 vW;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const seaFrag = /* glsl */ `
uniform vec3 uSunDir, uSun, uDeep, uSky, uHorizon, uGlow; uniform float uTime, uGlowPow;
varying vec3 vW;
vec3 waveN(vec2 p, float fade) {
  vec2 g = vec2(0.0);
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    vec2 dir = vec2(cos(fi * 2.1 + 0.4), sin(fi * 2.1 + 0.4));
    float k = 0.06 * pow(1.75, fi), a = 0.9 / pow(1.9, fi);
    float ph = dot(dir, p) * k + uTime * sqrt(9.8 * k) * 0.8;
    g += dir * k * a * cos(ph) * (fi < 3.0 ? 1.0 : fade);
  }
  return normalize(vec3(-g.x, 1.0, -g.y));
}
void main() {
  vec3 toC = cameraPosition - vW; float dist = length(toC); vec3 V = toC / dist;
  float fade = 1.0 - smoothstep(120.0, 700.0, dist);
  vec3 N = waveN(vW.xz, fade);
  N = normalize(mix(N, vec3(0.0, 1.0, 0.0), smoothstep(300.0, 1600.0, dist) * 0.6));
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  float fres = 0.04 + 0.96 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec2 rf = normalize(R.xz + 1e-4), sf = normalize(uSunDir.xz);
  vec3 sky = mix(uHorizon, uSky, pow(clamp(R.y, 0.0, 1.0), 0.45));
  sky = mix(sky, uGlow, pow(max(dot(rf, sf), 0.0), uGlowPow) * (1.0 - smoothstep(0.0, 0.5, R.y)));
  float sd = max(dot(R, uSunDir), 0.0);
  vec3 col = mix(uDeep, sky, fres) + uSun * (pow(sd, 900.0) * 30.0 + pow(sd, 60.0) * 0.6) ;
  vec2 vf = normalize(-V.xz + 1e-4);
  vec3 hz = mix(uHorizon, uGlow, pow(max(dot(vf, sf), 0.0), uGlowPow));
  col = mix(col, hz, smoothstep(250.0, 1500.0, dist));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const Sea: React.FC = () => {
  const f = useCurrentFrame();
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: seaVert, fragmentShader: seaFrag,
    uniforms: {
      uSunDir: { value: new THREE.Vector3(...SUN) }, uSun: { value: new THREE.Color('#ffe2b0').multiplyScalar(1.6) },
      uDeep: { value: new THREE.Color('#1a2147') }, uSky: { value: new THREE.Color(LOOK.zenith) }, uHorizon: { value: new THREE.Color(LOOK.horizon) },
      uGlow: { value: new THREE.Color(LOOK.glow) }, uGlowPow: { value: LOOK.glowPow ?? 5 }, uTime: { value: 0 },
    },
  }), []);
  mat.uniforms.uTime.value = f / FPS;
  return <mesh material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.6, -1450]}><planeGeometry args={[5200, 2800, 1, 1]} /></mesh>;
};

// ------------------------------------------------------------------------------------------------ shot
export const RaceCircuit: React.FC<V3Props> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const b = beatAt(f);
  // sun flare: screen position of the sun, faded when it leaves the frame or a car passes in front of it
  const sp = project([cam.pos[0] + SUN[0] * 1000, cam.pos[1] + SUN[1] * 1000, cam.pos[2] + SUN[2] * 1000], { pos: cam.pos, target: cam.target, fov: cam.fov }, 1920, 1080);
  const t = f / FPS;
  let occl = 1;
  const fpx = 540 / Math.tan((cam.fov * Math.PI) / 360);
  for (const s of [carState(true, t), carState(false, t)]) {
    const q = project([s.pos[0], 0.7, s.pos[2]], { pos: cam.pos, target: cam.target, fov: cam.fov }, 1920, 1080);
    const dpx = Math.hypot(q[0] - sp[0], (q[1] - sp[1]) * 1.6);
    const dist = Math.hypot(s.pos[0] - cam.pos[0], s.pos[2] - cam.pos[2]);
    occl = Math.min(occl, smoothStep(invLerp(0.25, 1.0, dpx / ((2.4 * fpx) / Math.max(dist, 3)))));
  }
  const sc = useScenery();
  const dir: P3 = SUN;
  const blockers = [...sc.near, ...sc.far].some((bx) => rayHitsBox(cam.pos, dir, [bx.p[0] - bx.s[0] / 2, 0, bx.p[2] - bx.s[2] / 2], [bx.p[0] + bx.s[0] / 2, bx.s[1], bx.p[2] + bx.s[2] / 2]))
    || BRIDGES.some((s) => { const c = onTrack(s, 0); return rayHitsBox(cam.pos, dir, [c[0] - 12, 6.6, c[2] - 1.3], [c[0] + 12, 8.9, c[2] + 1.3]); });
  if (blockers) occl = 0;
  const inFrame = sp[2] ? smoothStep(invLerp(-200, 120, Math.min(sp[0], 1920 - sp[0]))) * smoothStep(invLerp(-200, 80, Math.min(sp[1], 1080 - sp[1]))) : 0;
  const flare = inFrame * occl * (0.75 + 0.25 * b.pulse) * (1 - 0.6 * Math.sin(Math.PI * clamp(invLerp(54, 64, f))));
  return (
    <AbsoluteFill style={{ background: '#1a1020', overflow: 'hidden' }}>
      <WhipBlur id="race-whip" bx={cam.blur}>
        <ThreeStage exposure={1.0} fog={FOG}>
          <CamRig pos={cam.pos} target={cam.target} fov={cam.fov} roll={cam.roll} />
          <World f={f} cam={cam} />
        </ThreeStage>
      </WhipBlur>
      <LensFlare x={sp[0]} y={sp[1]} w={1920} h={1080} k={flare} size={cam.fov < 40 ? 1.25 : 0.9} />
      <Grade vignette={0.55} tint="#ff9a5a" tintOpacity={0.14} />
      <V3Tag label="GAME · RACING" />
    </AbsoluteFill>
  );
};
