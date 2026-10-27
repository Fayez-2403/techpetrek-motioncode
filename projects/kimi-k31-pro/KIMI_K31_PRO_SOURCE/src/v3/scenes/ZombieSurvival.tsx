// V3 · GAME · ZOMBIE SURVIVAL (2 bars = 120 frames). Night, fog, an abandoned street; over-the-shoulder behind a survivor
// with a flashlight (stylized, bloodless: silhouettes, light and tension only).
// Bar 1: the beam sweeps the street; beat 2 a dead street lamp flickers on over a figure; beat 3 the beam catches one
// rising beside a wrecked car; beat 4 a third lurches out of the fog ahead; the battery stutters and dies.
// Beat 5 (the bar, the wow): he strikes a road flare and the street floods red, revealing the whole crowd in the fog
// while the camera cranes back; beat 6 he throws it, it tumbles through the air trailing sparks and lands on beat 8 among
// them, every shambler silhouetted against its glow. Everything is a pure function of the frame.
import React, { useLayoutEffect, useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { useThree } from '@react-three/fiber';
import { clamp, easeInOutSine, easeOutCubic, invLerp, keys, lerp, smoothStep } from '../../lib/anim';
import { hash, mulberry32, noise1 } from '../../lib/rng';
import { CamRig, ThreeStage, project } from '../../three/stage';
import { beatAt, V3Tag, type V3Props } from '../lib';
import {
  BoxField, Glow, Grade, LensFlare, LightCone, Particles, ShadowSetup, Shadows, SkyEnv, glowTex, makeSkyMaterial, puffTex, rgb, windowMaterial,
  type Box, type P3, type Particle, type SkyLook,
} from '../three/ActionKit';
import { Figure, OUTFITS, aimArm, fk, fogTint, footMin, useOutfitMaterials, type Outfit, type Pose } from '../three/ActionHumanoid';
import { mixPose, P, shamblePose, survivorPose, type ShambleVar } from '../three/ActionPoses';

const FPS = 30;
const K = (f: number, k: [number, number][]) => keys(f, k, easeInOutSine);
const FOG_TEAL = new THREE.Color('#1a2d37'), FOG_RED = new THREE.Color('#3d1416');

// ------------------------------------------------------------------------------------------------ timing
const IGNITE = 60, RELEASE = 75;
const flareK = (f: number) => smoothStep(invLerp(IGNITE - 1, IGNITE + 4, f));
const flicker = (f: number) => 0.82 + 0.18 * noise1(f * 0.9, 3) + 0.08 * Math.sin(f * 2.7);

// survivor: creeps forward, stops for the flare, steps back after the throw
const SURV_X = 0.7;
const survZ = (f: number) => K(f, [[0, 0], [56, 1.15], [62, 1.22], [80, 1.05], [120, 0.45]]);
const survWalk = (f: number) => K(f, [[0, 0.55], [54, 0.55], [60, 0], [80, 0], [86, 0.4], [120, 0.4]]);

/** where the flashlight points (world) */
const AIM: [number, P3][] = [[0, [-2.4, 0.9, 13.5]], [11, [-4.0, 1.3, 15.2]], [17, [-4.7, 1.5, 15.6]], [22, [-4.3, 1.4, 15.4]], [30, [2.5, 1.2, 12.2]], [38, [2.4, 1.25, 11.8]], [45, [0.0, 1.45, 20.5]], [54, [0.6, 1.0, 17]], [62, [2.0, 1.3, 9.5]], [80, [1.5, 1.4, 8.6]], [100, [-2.6, 1.4, 10.5]], [120, [-1.8, 1.4, 9.5]]];
function aimAt(f: number): P3 {
  const base = aimKeys(f);
  const w = smoothStep(invLerp(61, 70, f));
  if (w <= 0) return base;
  const z2 = zombieAt(ZS()[1], f, [SURV_X, 0, survZ(f)]);
  const c: P3 = [z2.pos[0], 1.25, z2.pos[2]];
  return [lerp(base[0], c[0], w), lerp(base[1], c[1], w), lerp(base[2], c[2], w)];
}
function aimKeys(f: number): P3 {
  let i = 0; while (i < AIM.length - 2 && f > AIM[i + 1][0]) i++;
  const [f0, a] = AIM[i], [f1, b] = AIM[i + 1];
  const fast = f1 - f0 <= 8;
  const u = clamp((f - f0) / (f1 - f0));
  const e = fast ? easeOutCubic(u) : easeInOutSine(u);
  return [lerp(a[0], b[0], e), lerp(a[1], b[1], e), lerp(a[2], b[2], e)];
}
/** flashlight strength: steady, a stutter on beat 4, dead just before the flare, back on with it */
function torchK(f: number) {
  if (f < 47) return 1;
  if (f < 57) { const h = hash(Math.floor(f / 1.5), 9); return h > 0.45 ? 0.9 : 0.12; }
  if (f < IGNITE) return 0.0;
  return 0.75 + 0.25 * smoothStep(invLerp(IGNITE, IGNITE + 6, f));
}
/** the street lamp: dead, flickers alive on beat 2, stutters, holds dim */
function lampK(f: number) {
  if (f < 13) return 0;
  if (f < 15) return hash(f, 4) > 0.5 ? 0.6 : 0;
  if (f < 24) return 1;
  if (f < 34) return hash(Math.floor(f / 2), 5) > 0.35 ? 0.85 : 0.15;
  return 0.7 + 0.2 * Math.sin(f * 0.4);
}

// ------------------------------------------------------------------------------------------------ the shamblers
interface Z { p0: P3; v: number; start: number; reveal: number; ph: number; vv: ShambleVar; sc: number; outfit: Outfit; crouch?: [number, number]; yawJ: number }
function buildZombies() {
  return (() => {
    const r = mulberry32(66);
    const shirts = ['#3a403a', '#363e48', '#463d35', '#4f4c46', '#343832', '#43383d'];
    const mk = (p0: P3, reveal: number, start: number, v: number, extra: Partial<Z> = {}): Z => ({
      p0, v, start, reveal, ph: r(), sc: 0.94 + 0.12 * r(), yawJ: (r() - 0.5) * 0.5,
      vv: { reach: (Math.floor(r() * 3) as 0 | 1 | 2), drag: r() < 0.5 ? 1 : -1, hunch: 0.8 + 0.5 * r(), tilt: (r() - 0.5) * 2, jerk: 0.4 + r() * 0.8 },
      outfit: { ...OUTFITS.shambler, top: shirts[Math.floor(r() * shirts.length)], topDark: '#2f3431' }, ...extra,
    });
    const list: Z[] = [
      mk([-5.0, 0, 15.6], 15, 22, 0.5),                                     // under the lamp, beat 2
      mk([2.3, 0, 11.8], 29, 34, 0.55, { crouch: [24, 33] }),               // rises beside the car, beat 3
      mk([-0.3, 0, 23.5], 44, 36, 0.75),                                    // out of the fog ahead, beat 4
    ];
    for (let i = 0; i < 14; i++) {
      const z = 13 + r() * 26, x = (r() - 0.5) * 11;
      if (Math.abs(x - 2.3) < 1.2 && Math.abs(z - 11.8) < 2) continue;
      list.push(mk([x, 0, z], IGNITE + 1 + Math.round((z - 13) / 7), Math.round(r() * 30), 0.35 + r() * 0.45));
    }
    return list;
  })();
}
function zombieAt(z: Z, f: number, target: P3) {
  const t = Math.max(0, (f - z.start) / FPS);
  const ph = z.ph + t * 0.55;
  const dx = target[0] - z.p0[0], dz = target[2] - z.p0[2], d = Math.hypot(dx, dz) || 1;
  const yaw = Math.atan2(dx, dz) + z.yawJ * 0.5;
  const dist = z.v * (t + 0.18 * Math.sin(2 * Math.PI * ph * 2));
  const pos: P3 = [z.p0[0] + (dx / d) * dist, 0, z.p0[2] + (dz / d) * dist];
  let pose = shamblePose(ph, z.vv);
  if (z.crouch) {
    const crouch = P({ root: [0, 0.55, 0], rot: [0.5, 0, 0.1], spine: [0.4, 0, 0], chest: [0.3, 0, 0], neck: [0.5, 0, 0.2], head: [0.2, 0, 0.3],
      lHip: [1.9, 0.2, 0.1], rHip: [1.5, 0.15, 0.1], lKn: 2.2, rKn: 1.8, lAn: -0.4, rAn: 0.1, lSh: [0.6, 0.2, 0], rSh: [0.3, 0.1, 0.2], lEl: 0.5, rEl: 0.3 });
    pose = mixPose(crouch, pose, smoothStep(invLerp(z.crouch[0], z.crouch[1], f)));
  }
  const fm = footMin(pose, pos, yaw, z.sc);
  pose = { ...pose, root: [0, pose.root[1] - fm / z.sc, 0] };
  return { pose, pos, yaw };
}

let ZS_CACHE: Z[] | null = null;
const ZS = () => (ZS_CACHE ??= buildZombies());

const Zombie: React.FC<{ z: Z; i: number; f: number; target: P3; fog: string }> = ({ z, i, f, target, fog }) => {
  const mats = useOutfitMaterials(z.outfit);
  const s = zombieAt(z, f, target);
  const k = 1 - smoothStep(invLerp(z.reveal - 1, z.reveal + 5, f));
  fogTint(mats, z.outfit, fog, k);
  if (k > 0.995) return null;
  return <Figure pose={s.pose} outfit={z.outfit} mats={mats} pos={s.pos} yaw={s.yaw} scale={z.sc} gaunt={0.8} seed={i * 1.7 + 0.3} />;
};

// ------------------------------------------------------------------------------------------------ survivor
function survivorAt(f: number) {
  const zs = survZ(f), pos: P3 = [SURV_X, 0, zs];
  let pose: Pose = survivorPose(zs / 0.9 + 0.1, survWalk(f));
  // left arm: guard, reach for the flare, strike, raise, wind up, throw, follow through, guard
  const lf = K(f, [[0, 0.55], [46, 0.55], [52, -0.1], [56, 0.9], [59, 1.25], [64, 2.55], [69, 2.6], [72, 2.95], [75, 1.6], [80, 0.6], [92, 0.5]]);
  const la = K(f, [[0, 0.25], [46, 0.25], [52, 0.3], [59, 0.25], [64, 0.38], [72, 0.15], [80, 0.2], [92, 0.25]]);
  const le = K(f, [[0, 1.35], [46, 1.35], [52, 0.6], [56, 1.5], [59, 1.1], [64, 0.35], [69, 0.4], [72, 1.6], [75, 0.15], [80, 0.35], [92, 1.3]]);
  const cy = K(f, [[0, 0], [60, 0], [66, 0.12], [72, 0.38], [76, -0.32], [84, -0.05], [100, 0]]);
  pose = { ...pose, lSh: [lf, la, 0], lEl: le, chest: [pose.chest[0], pose.chest[1] + cy, pose.chest[2]], spine: [pose.spine[0] + K(f, [[70, 0], [76, 0.12], [86, 0]]), pose.spine[1], pose.spine[2]] };
  // aim the flashlight arm (two passes: the chest twist moves the shoulder)
  const aim = aimAt(f);
  for (let k = 0; k < 2; k++) {
    const F = fk(pose, pos, 0);
    const sh = F.at('rSh');
    const a = aimArm(pose, pos, 0, -1, [aim[0] - sh[0], aim[1] - sh[1], aim[2] - sh[2]]);
    pose = { ...pose, rSh: [a.flex - 0.15, a.abd, 0], rEl: 0.1, rWr: 0.0 };   // -0.15: the bent elbow/wrist lift the beam
  }
  // head follows the beam a little
  const yawAim = Math.atan2(aim[0] - pos[0], aim[2] - pos[2]);
  pose = { ...pose, neck: [pose.neck[0], clamp(yawAim * 0.5, -0.5, 0.5), 0], head: [0.05, clamp(yawAim * 0.3, -0.4, 0.4), 0] };
  const fm = footMin(pose, pos, 0);
  pose = { ...pose, root: [0, pose.root[1] - fm, 0] };
  const F = fk(pose, pos, 0);
  const wr = F.at('rWr'), tip = F.at('rTip');
  const dir = [tip[0] - wr[0], tip[1] - wr[1], tip[2] - wr[2]] as P3;
  const n = Math.hypot(...dir) || 1;
  return { pose, pos, torch: { from: tip, dir: [dir[0] / n, dir[1] / n, dir[2] / n] as P3 }, lHand: F.at('lTip') };
}

/** the flare: in the hand until the release, then a tumbling arc that lands on beat 8, a small bounce and a slide */
function flareAt(f: number, handAtRelease: P3, hand: P3) {
  if (f < RELEASE) return { p: hand, spin: 0, flying: false };
  const t = (f - RELEASE) / FPS, v: P3 = [0.35, 3.0, 13.2];
  const y0 = handAtRelease[1], tl = (v[1] + Math.sqrt(v[1] * v[1] + 2 * 9.8 * (y0 - 0.05))) / 9.8;
  if (t <= tl) return { p: [handAtRelease[0] + v[0] * t, y0 + v[1] * t - 4.9 * t * t, handAtRelease[2] + v[2] * t] as P3, spin: t * 17, flying: true };
  const land: P3 = [handAtRelease[0] + v[0] * tl, 0.05, handAtRelease[2] + v[2] * tl];
  const tb = t - tl, bt = 0.26;
  if (tb < bt) return { p: [land[0] + 0.1 * tb, 0.05 + 1.3 * tb - 4.9 * tb * tb, land[2] + 3.6 * tb] as P3, spin: tl * 17 + tb * 9, flying: true };
  const ts = tb - bt, slide = 1.2 * (1 - Math.exp(-ts * 4));
  return { p: [land[0] + 0.03, 0.05, land[2] + 3.6 * bt + slide] as P3, spin: tl * 17 + bt * 9 + slide * 2, flying: false };
}

// ------------------------------------------------------------------------------------------------ world
function roadTextures() {
  const W = 512, H = 1024, r = mulberry32(17);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#2b2b2e'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40000; i++) { g.fillStyle = r() < 0.5 ? `rgba(10,10,12,${0.4 * r()})` : `rgba(120,118,115,${0.22 * r()})`; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
  g.strokeStyle = 'rgba(8,8,9,0.7)'; g.lineWidth = 2;
  for (let k = 0; k < 18; k++) { let x = r() * W, y = r() * H; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 8; j++) { x += (r() - 0.5) * 50; y += (r() - 0.3) * 40; g.lineTo(x, y); } g.stroke(); }
  g.fillStyle = 'rgba(200,180,90,0.35)';
  for (let k = 0; k < 4; k++) { g.fillRect(W * 0.49, k * 256 + 20, W * 0.02, 120); }
  // roughness: puddles are smooth (dark in the map)
  const rc = document.createElement('canvas'); rc.width = W; rc.height = H;
  const q = rc.getContext('2d')!;
  q.fillStyle = 'rgb(200,200,200)'; q.fillRect(0, 0, W, H);
  for (let k = 0; k < 16; k++) {
    const x = r() * W, y = r() * H, rx = 20 + r() * 90, ry = 30 + r() * 140;
    const gr = q.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    gr.addColorStop(0, 'rgb(96,96,96)'); gr.addColorStop(0.55, 'rgb(118,118,118)'); gr.addColorStop(1, 'rgba(200,200,200,0)');
    q.fillStyle = gr; q.beginPath(); q.ellipse(x, y, rx, ry, r() * 3, 0, 7); q.fill();
  }
  const map = new THREE.CanvasTexture(cv); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping; map.anisotropy = 8;
  const rough = new THREE.CanvasTexture(rc); rough.wrapS = rough.wrapT = THREE.RepeatWrapping; rough.anisotropy = 8;
  map.repeat.set(1, 6); rough.repeat.set(1, 6);
  return { map, rough };
}

function useStreet() {
  return useMemo(() => {
    const r = mulberry32(303);
    const facade = ['#3b3836', '#2f3236', '#463c35', '#34302e', '#3d4246', '#2b2a2c'];
    const bld: Box[] = [];
    for (const side of [-1, 1]) {
      let z = -12;
      while (z < 140) { const d = 9 + r() * 10, h = 9 + r() * 16; bld.push({ p: [side * (8.2 + 7), 0, z + d / 2], s: [14, h, d - 0.3], color: facade[Math.floor(r() * facade.length)] }); z += d; }
    }
    const poles: P3[] = []; for (let z = 6; z < 130; z += 26) { poles.push([7.1, 0, z]); poles.push([-7.1, 0, z + 13]); }
    const bags: { p: P3; s: number }[] = []; for (let i = 0; i < 26; i++) bags.push({ p: [(r() < 0.5 ? -1 : 1) * (5.4 + r() * 2.2), 0.15, r() * 60], s: 0.28 + r() * 0.22 });
    const papers: { p: P3; rot: number }[] = []; for (let i = 0; i < 40; i++) papers.push({ p: [(r() - 0.5) * 9, 0.012, 2 + r() * 40], rot: r() * 6 });
    return { bld, poles, bags, papers };
  }, []);
}

const SEDAN = (() => ({ body: new RoundedBoxGeometry(1.8, 0.66, 4.4, 3, 0.14), cabin: new RoundedBoxGeometry(1.6, 0.5, 2.2, 3, 0.16), glass: new RoundedBoxGeometry(1.63, 0.34, 2.05, 2, 0.1) }))();
const Sedan: React.FC<{ p: P3; yaw: number; color: string; mats: Record<string, THREE.Material>; hazard?: number; door?: boolean }> = ({ p, yaw, color, mats, hazard = 0, door }) => {
  const body = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.4, envMapIntensity: 0.6 }), [color]);
  return (
    <group position={p} rotation={[0, yaw, 0]}>
      <mesh material={body} position={[0, 0.64, 0]} geometry={SEDAN.body} />
      <mesh material={body} position={[0, 1.12, -0.25]} geometry={SEDAN.cabin} />
      <mesh material={mats.glass} position={[0, 1.14, -0.25]} geometry={SEDAN.glass} />
      {[[0.85, 1.35], [-0.85, 1.35], [0.85, -1.35], [-0.85, -1.35]].map(([x, z], i) => (
        <group key={i} position={[x, 0.33, z]} rotation={[0, 0, Math.PI / 2]}>
          <mesh material={mats.tyre}><cylinderGeometry args={[0.33, 0.33, 0.24, 18]} /></mesh>
          <mesh material={mats.lamp} position={[0, x > 0 ? 0.125 : -0.125, 0]}><cylinderGeometry args={[0.19, 0.19, 0.01, 18]} /></mesh>
        </group>
      ))}
      {[0.6, -0.6].map((x) => <mesh key={`h${x}`} material={mats.lamp} position={[x, 0.72, 2.21]}><boxGeometry args={[0.36, 0.14, 0.02]} /></mesh>)}
      {[0.66, -0.66].map((x) => <mesh key={`t${x}`} material={mats.tail} position={[x, 0.78, -2.21]}><boxGeometry args={[0.3, 0.12, 0.02]} /></mesh>)}
      {door ? <mesh material={body} position={[1.35, 0.8, 0.55]} rotation={[0, -0.9, 0]}><boxGeometry args={[0.06, 0.85, 1.1]} /></mesh> : null}
      {hazard > 0 ? [[0.72, 2.2], [-0.72, 2.2], [0.72, -2.2], [-0.72, -2.2]].map(([x, z], i) => <Glow key={i} pos={[x, 0.7, z]} size={0.9} color="#ffab2e" opacity={hazard} />) : null}
    </group>
  );
};

const World: React.FC<{ f: number; cam: { pos: P3; target: P3 }; S: ReturnType<typeof survivorAt> }> = ({ f, cam, S }) => {
  const { scene } = useThree();
  const st = useStreet();
  const zs = ZS();
  const survMats = useOutfitMaterials(OUTFITS.survivor);
  const red = flareK(f) * flicker(f);
  const fogCol = FOG_TEAL.clone().lerp(FOG_RED, 0.85 * flareK(f) * (0.9 + 0.1 * flicker(f)));
  const fogHex = '#' + fogCol.getHexString();
  const fog = useMemo(() => new THREE.Fog('#14222a', 4, 46), []);
  fog.color.copy(fogCol); fog.near = lerp(4, 7, flareK(f)); fog.far = lerp(44, 66, flareK(f));
  useLayoutEffect(() => { scene.fog = fog; return () => { scene.fog = null; }; }, [scene, fog]);

  const M = useMemo(() => {
    const { map, rough } = roadTextures();
    return {
      road: new THREE.MeshStandardMaterial({ map, roughnessMap: rough, roughness: 1, metalness: 0.0, envMapIntensity: 1.2 }),
      walk: new THREE.MeshStandardMaterial({ color: '#4a4846', roughness: 0.85 }),
      curb: new THREE.MeshStandardMaterial({ color: '#77736d', roughness: 0.8 }),
      bld: windowMaterial({ color: '#ffffff', roughness: 0.9 }, { glass: '#0b0f14', lit: '#ffad62', litFrac: 0.03, litPower: 0.55, floorH: 3.3, winW: 1.7, glassRough: 0.55, glassMetal: 0.1, seed: 12, shopFrac: 0.0 }),
      pole: new THREE.MeshStandardMaterial({ color: '#1d1c1c', roughness: 0.8 }),
      wire: new THREE.MeshBasicMaterial({ color: '#0b0c0d' }),
      bag: new THREE.MeshStandardMaterial({ color: '#141518', roughness: 0.35, metalness: 0.1 }),
      paper: new THREE.MeshStandardMaterial({ color: '#8a857a', roughness: 0.9, side: THREE.DoubleSide }),
      glass: new THREE.MeshStandardMaterial({ color: '#0c1116', roughness: 0.1, metalness: 0.6 }),
      tyre: new THREE.MeshStandardMaterial({ color: '#0d0d0e', roughness: 0.9 }),
      lamp: new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.5, metalness: 0.6 }),
      tail: new THREE.MeshStandardMaterial({ color: '#3a0d0d', roughness: 0.3, metalness: 0.2 }),
      lampHead: new THREE.MeshBasicMaterial({ color: '#ffd9a0', toneMapped: false }),
      torch: new THREE.MeshStandardMaterial({ color: '#1b1d22', roughness: 0.35, metalness: 0.8 }),
      lens: new THREE.MeshBasicMaterial({ color: '#fff4dc', toneMapped: false }),
      stick: new THREE.MeshStandardMaterial({ color: '#b3141c', roughness: 0.5, emissive: new THREE.Color('#ff2a1a'), emissiveIntensity: 0 }),
      streak: new THREE.MeshBasicMaterial({ map: glowTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
      sky: makeSkyMaterial(SKY),
    };
  }, []);
  M.sky.uniforms.uHorizon.value.copy(fogCol);
  M.sky.uniforms.uZenith.value.set('#040609').lerp(new THREE.Color('#12060a'), red);

  // lights
  const spot = useMemo(() => {
    const l = new THREE.SpotLight('#fff1d6', 0, 46, 0.25, 0.6, 1.7);
    l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.bias = -0.0008; l.shadow.normalBias = 0.02; l.shadow.camera.near = 0.3; l.shadow.camera.far = 46;
    return l;
  }, []);
  const tk = torchK(f);
  const beamEnd: P3 = [S.torch.from[0] + S.torch.dir[0] * 30, S.torch.from[1] + S.torch.dir[1] * 30, S.torch.from[2] + S.torch.dir[2] * 30];
  const beamNear: P3 = [S.torch.from[0] + S.torch.dir[0] * 15, S.torch.from[1] + S.torch.dir[1] * 15, S.torch.from[2] + S.torch.dir[2] * 15];
  spot.intensity = 240 * tk;
  spot.position.set(...S.torch.from);
  spot.target.position.set(...beamEnd); spot.target.updateMatrixWorld();

  const LAMP: P3 = [-6.0, 7.6, 14.9];
  const lk = lampK(f);
  const lamp = useMemo(() => new THREE.SpotLight('#ffbf6e', 0, 22, 0.78, 0.7, 1.4), []);
  lamp.intensity = 260 * lk;
  lamp.position.set(...LAMP); lamp.target.position.set(-5.2, 0, 15.6); lamp.target.updateMatrixWorld();

  // flare
  const relHand = useMemo(() => survivorAt(RELEASE).lHand, []);
  const fl = flareAt(f, relHand, S.lHand);
  const lit = f >= IGNITE - 2;
  const burst = Math.exp(-Math.max(0, f - IGNITE) / 3) * (f >= IGNITE ? 1 : 0);
  const flareI = lit ? (f < IGNITE ? 0.3 * hash(f, 2) : 1) * flicker(f) * (1 + 2.5 * burst) : 0;
  M.stick.emissiveIntensity = flareI * 2;
  const landed = f >= RELEASE + 26 ? smoothStep(invLerp(RELEASE + 26, RELEASE + 32, f)) : 0;

  // flare sparks and smoke
  const sparks: Particle[] = [], smoke: Particle[] = [];
  if (lit) {
    for (let i = 0; i < 140; i++) {
      const h = mulberry32(5000 + i), tb = IGNITE - 2 + h() * (f - IGNITE + 2), age = (f - tb) / FPS;
      if (age < 0 || age > 0.45 || tb < IGNITE - 2) continue;
      const src = flareAt(tb, relHand, survivorAt(Math.min(tb, RELEASE)).lHand).p;
      const v: P3 = [(h() - 0.5) * 3, 1.5 + h() * 3.2, (h() - 0.5) * 3];
      const life = 1 - age / 0.45;
      sparks.push({ p: [src[0] + v[0] * age, Math.max(0.02, src[1] + v[1] * age - 4.9 * age * age), src[2] + v[2] * age], size: 0.022, c: rgb(h() < 0.4 ? '#ffe9d0' : '#ff5a3a', 4 * life), a: 1, v: [v[0], v[1] - 9.8 * age, v[2]], stretch: 7 });
    }
    for (let i = 0; i < 46; i++) {
      const h = mulberry32(7000 + i), tb = IGNITE + i * 1.3, age = (f - tb) / FPS;
      if (age < 0 || age > 2.2) continue;
      const src = flareAt(tb, relHand, survivorAt(Math.min(tb, RELEASE)).lHand).p;
      const rise = 0.5 + 0.6 * age;
      const p: P3 = [src[0] + (h() - 0.5) * 0.6 * age + 0.25 * age, src[1] + rise * age + 0.1, src[2] + (h() - 0.5) * 0.6 * age];
      const near = Math.max(0, 1 - Math.hypot(p[0] - fl.p[0], p[1] - fl.p[1], p[2] - fl.p[2]) / 3);
      smoke.push({ p, size: 0.4 + age * 1.3, c: rgb('#ff4a3a', 0.25 + 1.4 * near * flareI), a: 0.5 * (1 - age / 2.2) * smoothStep(invLerp(0, 0.1, age)), rot: h() * 6 + age * 0.4 });
    }
  }

  // wet-road reflection streaks under bright sources, stretched toward the camera
  const streak = (src: P3, k: number, col: string, w = 0.9, len = 9) => {
    if (k <= 0.01) return null;
    const dx = cam.pos[0] - src[0], dz = cam.pos[2] - src[2], d = Math.hypot(dx, dz) || 1;
    const yaw = Math.atan2(dx, dz);
    const L = Math.min(len, d * 0.8);
    return <mesh position={[src[0] + (dx / d) * L * 0.45, 0.025, src[2] + (dz / d) * L * 0.45]} rotation={[-Math.PI / 2, 0, yaw]} scale={[w, L, 1]} renderOrder={21}>
      <planeGeometry /><meshBasicMaterial attach="material" map={glowTex()} color={col} transparent opacity={k} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>;
  };
  const hz = beatAt(f).ph < 0.4 ? 0.9 : 0.05;
  const target: P3 = [S.pos[0], 0, S.pos[2]];
  return (
    <>
      <ShadowSetup />
      <mesh material={M.sky} position={cam.pos} renderOrder={-1000} frustumCulled={false}><sphereGeometry args={[400, 32, 16]} /></mesh>
      <SkyEnv look={SKY} intensity={0.35} />
      <hemisphereLight args={['#2a3c4c', '#0a0b0d', 0.32]} />
      <directionalLight position={[14, 16, 60]} intensity={0.4} color="#7f9cc4" />
      <pointLight position={[cam.pos[0] - 0.2, cam.pos[1] + 0.5, cam.pos[2] - 0.5]} color="#7f9cb4" intensity={4 * (1 - 0.5 * flareK(f))} distance={7} decay={1.2} />
      <pointLight position={[S.pos[0] + 1.6, 2.6, S.pos[2] + 2.4]} color="#9fb6cc" intensity={2.0 * (1 - 0.7 * flareK(f))} distance={4} decay={1.5} />
      <primitive object={spot} /><primitive object={spot.target} />
      <primitive object={lamp} /><primitive object={lamp.target} />
      {lit && <pointLight position={fl.p} color="#ff3a26" intensity={90 * flareI} distance={60} decay={1.35} />}
      {lit && f < RELEASE && <pointLight position={[S.lHand[0], S.lHand[1] + 0.1, S.lHand[2] - 0.2]} color="#ff4030" intensity={10 * flareI} distance={5} decay={1.6} />}
      <pointLight position={[3.6, 0.8, 13.5]} color="#ffa630" intensity={6 * hz} distance={7} decay={1.6} />

      <Shadows cast={false} receive>
        <mesh material={M.road} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 60]}><planeGeometry args={[10, 150]} /></mesh>
        {[-1, 1].map((s) => <mesh key={s} material={M.walk} position={[s * 6.6, 0.075, 60]}><boxGeometry args={[3.2, 0.15, 150]} /></mesh>)}
        {[-1, 1].map((s) => <mesh key={`c${s}`} material={M.curb} position={[s * 5.05, 0.08, 60]}><boxGeometry args={[0.12, 0.16, 150]} /></mesh>)}
        <BoxField boxes={st.bld} material={M.bld} />
      </Shadows>
      <Shadows cast receive>
        <Sedan p={[3.6, 0, 13.5]} yaw={-0.35} color="#4a2c26" mats={M} hazard={hz} door />
        <Sedan p={[-4.1, 0, 6.2]} yaw={0.22} color="#2c3a44" mats={M} />
        <Sedan p={[-1.2, 0, 31]} yaw={1.35} color="#5a5a52" mats={M} />
        <Sedan p={[3.0, 0, 44]} yaw={-0.15} color="#30302e" mats={M} />
        {st.bags.map((b, i) => <mesh key={i} material={M.bag} position={b.p} scale={[b.s, b.s * 0.8, b.s]}><sphereGeometry args={[1, 10, 8]} /></mesh>)}
        {/* the street lamp (it flickers alive on beat 2) */}
        <mesh material={M.lamp} position={[-6.6, 3.9, 14.9]}><cylinderGeometry args={[0.09, 0.14, 7.8, 8]} /></mesh>
        <mesh material={M.lamp} position={[-6.3, 7.75, 14.9]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.05, 0.05, 0.7, 6]} /></mesh>
        <mesh material={lk > 0.3 ? M.lampHead : M.lamp} position={LAMP} scale={[0.5, 0.12, 0.3]}><sphereGeometry args={[1, 12, 8]} /></mesh>
        {st.poles.map((p, i) => <mesh key={`p${i}`} material={M.pole} position={[p[0], 4.6, p[2]]}><cylinderGeometry args={[0.12, 0.16, 9.2, 6]} /></mesh>)}
        {zs.map((z, i) => <Zombie key={i} z={z} i={i} f={f} target={target} fog={fogHex} />)}
        <Figure pose={S.pose} outfit={OUTFITS.survivor} mats={survMats} pos={S.pos} yaw={0}
          rHand={<group position={[0, -0.1, 0.015]}><mesh material={M.torch}><cylinderGeometry args={[0.026, 0.02, 0.2, 12]} /></mesh><mesh material={M.lens} position={[0, -0.101, 0]}><cylinderGeometry args={[0.024, 0.024, 0.004, 12]} /></mesh></group>}
          lHand={lit || f > 50 ? (f < RELEASE ? <mesh material={M.stick} position={[0, -0.1, 0.02]}><cylinderGeometry args={[0.016, 0.016, 0.26, 8]} /></mesh> : null) : null} />
      </Shadows>
      {st.papers.map((p, i) => <mesh key={`pp${i}`} material={M.paper} position={p.p} rotation={[-Math.PI / 2, 0, p.rot]}><planeGeometry args={[0.24, 0.3]} /></mesh>)}
      {/* wires between the poles */}
      {st.poles.slice(0, -2).map((p, i) => { const q = st.poles[i + 2]; const mid: P3 = [(p[0] + q[0]) / 2, 8.2, (p[2] + q[2]) / 2]; const len = Math.hypot(q[0] - p[0], q[2] - p[2]); return <mesh key={`w${i}`} material={M.wire} position={mid} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.015, 0.015, len, 3]} /></mesh>; })}

      {/* flare in flight / on the ground */}
      {f >= RELEASE && <mesh material={M.stick} position={fl.p} rotation={[fl.spin, 0.4, fl.flying ? fl.spin * 0.3 : Math.PI / 2]}><cylinderGeometry args={[0.016, 0.016, 0.26, 8]} /></mesh>}
      {lit && <>
        <Glow pos={fl.p} size={0.55 + 0.5 * burst} color="#fff0e8" opacity={0.95 * Math.min(1, flareI)} />
        <Glow pos={fl.p} size={2.6 + 4 * burst} color="#ff3a26" opacity={0.85 * Math.min(1, flareI)} />
        <Glow pos={fl.p} size={16 + 20 * burst + 8 * landed} color="#ff2a1c" opacity={(0.28 + 0.12 * landed) * Math.min(1.2, flareI)} />
        <mesh position={[fl.p[0], 0.03, fl.p[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={[9, 9, 1]} renderOrder={21}><planeGeometry /><meshBasicMaterial map={glowTex()} color="#ff3020" transparent opacity={0.55 * landed * Math.min(1, flareI)} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
      </>}
      <Glow pos={LAMP} size={2.4} color="#ffc07a" opacity={0.9 * lk} />
      <Glow pos={[S.torch.from[0] + S.torch.dir[0] * 0.05, S.torch.from[1], S.torch.from[2] + S.torch.dir[2] * 0.05]} size={0.5} color="#fff6e0" opacity={0.9 * tk} />
      <LightCone from={S.torch.from} to={beamNear} radius={15 * Math.tan(0.22)} color="#fff0d8" intensity={0.42 * tk} t={f / FPS} dust={0.8} floor={0} pow={2.0} layers={3} />
      <LightCone from={LAMP} to={[-5.2, -0.5, 15.6]} radius={5.6} color="#ffbf6e" intensity={0.2 * lk} t={f / FPS + 3} dust={0.6} floor={0} pow={1.2} layers={3} />
      {streak(fl.p, lit ? 0.9 * Math.min(1, flareI) * (1 - smoothStep(invLerp(0.4, 1.4, fl.p[1]))) : 0, '#ff3a26', 1.2, 10)}
      {streak([-5.6, 0, 14.9], 0.5 * lk, '#ffbf6e', 1.4, 8)}
      {streak([3.6, 0, 15.6], 0.6 * hz, '#ffa630', 0.7, 5)}
      <Particles items={smoke} max={60} map={puffTex(3)} fog={[fogHex, 8, 60]} order={24} />
      <Particles items={sparks} max={160} map={glowTex()} additive order={28} />
    </>
  );
};

const SKY: SkyLook = { sunDir: [0.3, 0.35, 0.88], zenith: '#040609', horizon: '#14222a', glow: '#1e2e36', ground: '#0a0c0e', sun: '#9fb4c8', sunPower: 0.6, sunSize: 0.012, glowPow: 3, cloud: 0.4, cloudScale: 1.3, cloudLit: '#2a3a44', cloudDark: '#0b1014', cloudSeed: 5 };

// ------------------------------------------------------------------------------------------------ camera
function camAt(f: number, S: ReturnType<typeof survivorAt>) {
  const b = S.pos;
  const crane = K(f, [[0, 0], [60, 0], [82, 1], [94, 1], [120, 0.62]]);
  const breathe = 0.018 * Math.sin(f * 0.17) + 0.01 * Math.sin(f * 0.41 + 1);
  const off: P3 = [lerp(-0.62, -0.95, crane), lerp(1.68, 2.35, crane) + breathe, lerp(-1.45, -2.7, crane)];
  const pos: P3 = [b[0] + off[0] + 0.012 * Math.sin(f * 0.23), off[1], b[2] + off[2]];
  const aim = aimAt(f);
  const look: P3 = [lerp(-0.35, 0.1, crane) + 0.12 * (aim[0] - b[0]) * (1 - crane), lerp(1.36, 1.25, crane), 9];
  const target: P3 = [b[0] + look[0], look[1], b[2] + look[2]];
  return { pos, target, fov: lerp(42, 49, crane) - K(f, [[94, 0], [120, 2.5]]) };
}

// ------------------------------------------------------------------------------------------------ shot
export const ZombieSurvival: React.FC<V3Props> = () => {
  const f = useCurrentFrame();
  const S = survivorAt(f);
  const cam = camAt(f, S);
  const burst = f >= IGNITE ? Math.exp(-(f - IGNITE) / 4) : 0;
  const relHand = useMemo(() => survivorAt(RELEASE).lHand, []);
  const fl = flareAt(f, relHand, S.lHand);
  const sp = project(fl.p, { pos: cam.pos, target: cam.target, fov: cam.fov }, 1920, 1080);
  const lit = f >= IGNITE;
  return (
    <AbsoluteFill style={{ background: '#0a1014', overflow: 'hidden' }}>
      <ThreeStage exposure={1.15}>
        <CamRig pos={cam.pos} target={cam.target} fov={cam.fov} />
        <World f={f} cam={cam} S={S} />
      </ThreeStage>
      {lit && sp[2] ? <LensFlare x={sp[0]} y={sp[1]} w={1920} h={1080} k={0.45 * flicker(f) + 0.4 * burst} warm="255,70,50" cool="255,120,110" size={0.55} /> : null}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 60% at 70% 45%, rgba(255,120,90,1), rgba(255,40,30,0.5) 60%, rgba(0,0,0,0))', opacity: 0.32 * burst, mixBlendMode: 'screen', pointerEvents: 'none' }} />
      <Grade vignette={0.72} tint={lit ? '#ff3020' : '#2a6a7a'} tintOpacity={lit ? 0.1 : 0.12} />
      <V3Tag label="GAME · ZOMBIE SURVIVAL" />
    </AbsoluteFill>
  );
};
