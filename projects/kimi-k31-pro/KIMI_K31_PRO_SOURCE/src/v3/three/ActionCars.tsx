// Original GT-prototype race cars for the V3 racing shot (no real make, no logos). The body is a loft of superellipse
// cross-sections whose width, height and "hood dip" vary along the car, with the wheel arches carved into the sides;
// liveries are vertex colours computed from position. Car frame: forward +Z, up +Y, left +X. Geometry is built once.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { keys, linear } from '../../lib/anim';
import { Glow, type P3 } from './ActionKit';

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sstep = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const K = (z: number, k: [number, number][]) => keys(z, k, linear);
/** smooth piecewise curve (catmull-like through keys via smoothstep blends) */
const S = (z: number, k: [number, number][]) => {
  if (z <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) if (z <= k[i + 1][0]) { const t = (z - k[i][0]) / (k[i + 1][0] - k[i][0]); return k[i][1] + (k[i + 1][1] - k[i][1]) * (t * t * (3 - 2 * t)); }
  return k[k.length - 1][1];
};

export const CAR = { len: 4.7, z0: -2.35, z1: 2.35, wheelR: 0.35, track: 0.83, axleR: -1.45, axleF: 1.35, width: 2.0 };

interface Station { hw: number; bot: number; top: number; dip: number; p: number }
type Livery = (x: number, y: number, z: number, top: boolean) => THREE.Color;

function loft(nu: number, nv: number, z0: number, z1: number, st: (z: number) => Station, pinch: [number, number], livery?: Livery, arches?: { z: number; y: number; r: number; inner: number }[]) {
  const pos: number[] = [], col: number[] = [], idx: number[] = [];
  const dark = new THREE.Color('#07080a');
  for (let i = 0; i <= nu; i++) {
    const z = z0 + ((z1 - z0) * i) / nu;
    const s = st(z);
    const e0 = Math.sqrt(clamp((z - z0) / pinch[0])), e1 = Math.sqrt(clamp((z1 - z) / pinch[1]));
    const env = Math.min(e0, e1);
    const mid = (s.top + s.bot) / 2, hh = ((s.top - s.bot) / 2) * (0.25 + 0.75 * env);
    for (let j = 0; j < nv; j++) {
      const th = -Math.PI / 2 + (j / nv) * Math.PI * 2;
      const c = Math.cos(th), sn = Math.sin(th);
      const xn = Math.sign(c) * Math.abs(c) ** (2 / s.p), yn = Math.sign(sn) * Math.abs(sn) ** (2 / s.p);
      let x = s.hw * env * xn;
      let y = mid + hh * yn;
      if (yn > 0) y -= s.dip * (1 - xn * xn) * yn * env;
      let archT = 0;
      if (arches) for (const a of arches) {
        const r = Math.hypot(z - a.z, y - a.y);
        const t = sstep(a.r + 0.03, a.r - 0.03, r) * sstep(0.25, 0.45, Math.abs(xn));
        if (t > 0) { x = Math.sign(x) * (Math.abs(x) + (Math.min(Math.abs(x), a.inner) - Math.abs(x)) * t); archT = Math.max(archT, t); }
      }
      pos.push(x, y, z);
      const cc = livery ? livery(x, y, z, yn > 0.55) : new THREE.Color(1, 1, 1);
      if (archT > 0) cc.lerp(dark, sstep(0.2, 0.8, archT));
      col.push(cc.r, cc.g, cc.b);
    }
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = i * nv + j, b = i * nv + ((j + 1) % nv), c = a + nv, d = b + nv;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const bodyStation = (z: number): Station => ({
  hw: S(z, [[-2.35, 0.9], [-1.95, 0.96], [-1.45, 1.0], [-0.95, 0.95], [-0.2, 0.9], [0.6, 0.93], [1.35, 0.985], [1.9, 0.95], [2.35, 0.86]]),
  bot: S(z, [[-2.35, 0.16], [-1.9, 0.11], [1.9, 0.11], [2.35, 0.13]]),
  top: S(z, [[-2.35, 0.8], [-1.95, 0.82], [-1.45, 0.88], [-0.9, 0.8], [-0.3, 0.74], [0.5, 0.72], [1.35, 0.76], [1.95, 0.58], [2.35, 0.4]]),
  dip: S(z, [[-2.35, 0.04], [-1.45, 0.15], [-0.9, 0.08], [-0.35, 0.0], [0.45, 0.0], [0.95, 0.12], [1.35, 0.2], [1.9, 0.13], [2.35, 0.04]]),
  p: K(z, [[-2.35, 3.2], [0, 3.4], [2.35, 2.5]]),
});
const canopyStation = (z: number): Station => ({
  hw: S(z, [[-0.62, 0.46], [-0.1, 0.6], [0.55, 0.57], [1.02, 0.36]]),
  bot: 0.5,
  top: S(z, [[-0.62, 0.78], [-0.25, 1.07], [0.25, 1.12], [0.7, 0.99], [1.02, 0.76]]),
  dip: 0, p: 2.3,
});

export interface LiveryDef { base: string; stripe: string; accent: string; lower: string; wing: string; rim: string; num?: string }
export const LIVERIES: Record<'hero' | 'rival', LiveryDef> = {
  hero: { base: '#0c5cff', stripe: '#f4f7ff', accent: '#4ef0ff', lower: '#121418', wing: '#0b0d12', rim: '#c9ced8' },
  rival: { base: '#141519', stripe: '#d6ff2e', accent: '#ff5a1f', lower: '#0c0d10', wing: '#d6ff2e', rim: '#2b2e35' },
};

function liveryFn(d: LiveryDef): Livery {
  const base = new THREE.Color(d.base), stripe = new THREE.Color(d.stripe), accent = new THREE.Color(d.accent), lower = new THREE.Color(d.lower);
  return (x, y, z, top) => {
    const c = base.clone();
    // a swept side stripe rising toward the tail, with a thin accent pinline under it
    const band = y - (0.42 + 0.11 * (-z / 2.35));
    const sideOk = z > -2.2 && z < 2.1;
    if (sideOk && Math.abs(x) > 0.55 && band > -0.05 && band < 0.08) c.copy(stripe);
    if (sideOk && Math.abs(x) > 0.55 && band > -0.1 && band <= -0.05) c.copy(accent);
    // twin racing stripes over the top
    if (top && Math.abs(Math.abs(x) - 0.2) < 0.045) c.copy(accent);
    // nose tip accent
    if (z > 2.05 && y > 0.2) c.lerp(accent, 0.85);
    if (y < 0.24) c.copy(lower);
    return c;
  };
}

/** airfoil cross-section for the rear wing (chord along z, thickness along y) */
function wingGeo(span: number) {
  const sh = new THREE.Shape();
  const n = 16, pts: THREE.Vector2[] = [];
  for (let i = 0; i <= n; i++) { const u = i / n, t = 0.11 * 5 * (0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u * u + 0.2843 * u ** 3 - 0.1015 * u ** 4); pts.push(new THREE.Vector2(-u * 0.42, t * 0.42 + 0.05 * Math.sin(Math.PI * u))); }
  for (let i = n; i >= 0; i--) { const u = i / n, t = 0.11 * 5 * (0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u * u + 0.2843 * u ** 3 - 0.1015 * u ** 4); pts.push(new THREE.Vector2(-u * 0.42, -t * 0.42 + 0.05 * Math.sin(Math.PI * u))); }
  sh.setFromPoints(pts);
  const g = new THREE.ExtrudeGeometry(sh, { depth: span, bevelEnabled: false, curveSegments: 4 });
  g.translate(0, 0, -span / 2);
  g.rotateY(Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

function tyreGeo() {
  const prof: [number, number][] = [[0.235, -0.15], [0.3, -0.158], [0.333, -0.145], [0.348, -0.1], [0.352, 0], [0.348, 0.1], [0.333, 0.145], [0.3, 0.158], [0.235, 0.15]];
  const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 40);
  g.rotateZ(Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

function rimGeo() {
  const sh = new THREE.Shape();
  sh.absarc(0, 0, 0.24, 0, Math.PI * 2, false);
  for (let k = 0; k < 6; k++) {
    const a0 = (k / 6) * Math.PI * 2 + 0.16, a1 = a0 + Math.PI * 2 / 6 - 0.32, h = new THREE.Path();
    h.moveTo(0.07 * Math.cos(a0 + 0.12), 0.07 * Math.sin(a0 + 0.12));
    h.absarc(0, 0, 0.205, a0, a1, false);
    h.lineTo(0.07 * Math.cos(a1 - 0.12), 0.07 * Math.sin(a1 - 0.12));
    sh.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.045, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 2, curveSegments: 24 });
  g.translate(0, 0, -0.022);
  g.rotateY(Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

export interface CarGeo { body: THREE.BufferGeometry; canopy: THREE.BufferGeometry; wing: THREE.BufferGeometry; tyre: THREE.BufferGeometry; rim: THREE.BufferGeometry }

export function useCarGeo(liv: LiveryDef): CarGeo {
  return useMemo(() => {
    const arches = [CAR.axleR, CAR.axleF].map((z) => ({ z, y: CAR.wheelR, r: 0.43, inner: 0.66 }));
    return {
      body: loft(150, 64, CAR.z0, CAR.z1, bodyStation, [0.025, 0.12], liveryFn(liv), arches),
      canopy: loft(40, 40, -0.62, 1.02, canopyStation, [0.12, 0.2]),
      wing: wingGeo(1.84),
      tyre: tyreGeo(),
      rim: rimGeo(),
    };
  }, [liv]);
}

export interface CarState {
  pos: P3; yaw: number; pitch?: number; roll?: number;
  spin: number;          // wheel angle (rad)
  steer?: number;        // front wheel steer (rad)
  brake?: number;        // 0..1 brake lights + glowing discs
  head?: number;         // headlight strength
  blur?: number;         // 0..1 wheel motion blur
}

/** a whole car: lofted body, glass canopy, wing, wheels, lights. Lights glows can be drawn separately with CarLights. */
export const RaceCar: React.FC<{ geo: CarGeo; liv: LiveryDef; s: CarState }> = ({ geo, liv, s }) => {
  const mats = useMemo(() => ({
    paint: new THREE.MeshPhysicalMaterial({ vertexColors: true, metalness: 0.12, roughness: 0.3, clearcoat: 0.75, clearcoatRoughness: 0.08, envMapIntensity: 0.5 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#06080c', metalness: 0.1, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.0 }),
    carbon: new THREE.MeshStandardMaterial({ color: '#0d0e11', metalness: 0.4, roughness: 0.45, envMapIntensity: 0.8 }),
    wing: new THREE.MeshPhysicalMaterial({ color: liv.wing, metalness: 0.3, roughness: 0.3, clearcoat: 1, envMapIntensity: 1.1 }),
    tyre: new THREE.MeshStandardMaterial({ color: '#111214', metalness: 0, roughness: 0.82, envMapIntensity: 0.35 }),
    rim: new THREE.MeshStandardMaterial({ color: liv.rim, metalness: 0.95, roughness: 0.22, envMapIntensity: 1.3 }),
    disc: new THREE.MeshStandardMaterial({ color: '#2a2b2f', metalness: 0.8, roughness: 0.4, emissive: new THREE.Color('#ff5a10'), emissiveIntensity: 0 }),
    tail: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff1a2a').multiplyScalar(2.2), toneMapped: false }),
    head: new THREE.MeshBasicMaterial({ color: new THREE.Color('#dff3ff').multiplyScalar(2.5), toneMapped: false }),
    blur: new THREE.MeshBasicMaterial({ color: '#1a1b1e', transparent: true, opacity: 0.6, depthWrite: false }),
  }), [liv]);
  mats.disc.emissiveIntensity = 0.6 + 2.2 * (s.brake ?? 0);
  mats.tail.color.set('#ff1a2a').multiplyScalar(1.4 + 2.8 * (s.brake ?? 0));
  mats.blur.opacity = 0.75 * (s.blur ?? 0);
  const wheels: [number, number, boolean][] = [[CAR.track, CAR.axleF, true], [-CAR.track, CAR.axleF, true], [CAR.track, CAR.axleR, false], [-CAR.track, CAR.axleR, false]];
  return (
    <group position={s.pos} rotation={[s.pitch ?? 0, s.yaw, s.roll ?? 0, 'YXZ']}>
      <mesh geometry={geo.body} material={mats.paint} />
      <mesh geometry={geo.canopy} material={mats.glass} />
      {/* splitter, diffuser, side skirts */}
      <mesh material={mats.carbon} position={[0, 0.1, 2.12]}><boxGeometry args={[1.86, 0.035, 0.42]} /></mesh>
      <mesh material={mats.carbon} position={[0, 0.17, -2.15]} rotation={[-0.25, 0, 0]}><boxGeometry args={[1.5, 0.05, 0.5]} /></mesh>
      {[-0.5, -0.17, 0.17, 0.5].map((x) => <mesh key={x} material={mats.carbon} position={[x, 0.2, -2.2]}><boxGeometry args={[0.02, 0.16, 0.42]} /></mesh>)}
      {/* rear wing on swan-neck struts */}
      <mesh geometry={geo.wing} material={mats.wing} position={[0, 1.13, -1.86]} />
      {[0.93, -0.93].map((x) => <mesh key={x} material={mats.carbon} position={[x, 1.08, -2.04]}><boxGeometry args={[0.025, 0.34, 0.56]} /></mesh>)}
      {[0.42, -0.42].map((x) => <mesh key={x} material={mats.carbon} position={[x, 0.95, -1.98]} rotation={[0.25, 0, 0]}><boxGeometry args={[0.03, 0.34, 0.12]} /></mesh>)}
      {/* mirrors */}
      {[0.86, -0.86].map((x) => <mesh key={x} material={mats.wing} position={[x, 0.86, 0.62]}><boxGeometry args={[0.16, 0.07, 0.12]} /></mesh>)}
      {/* rear fascia: carbon panel, exhausts, rain light */}
      <mesh material={mats.carbon} position={[0, 0.42, -2.36]}><boxGeometry args={[1.66, 0.36, 0.04]} /></mesh>
      {[0.86, -0.86].map((x) => <mesh key={`b${x}`} material={mats.tail} position={[x * 0.97, 0.6, -2.3]}><boxGeometry args={[0.04, 0.26, 0.04]} /></mesh>)}
      {[0.2, -0.2].map((x) => <mesh key={x} material={mats.rim} position={[x, 0.36, -2.38]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.055, 0.06, 0.1, 14, 1, true]} /></mesh>)}
      <mesh material={mats.tail} position={[0, 0.26, -2.39]}><boxGeometry args={[0.16, 0.06, 0.02]} /></mesh>
      {/* lights */}
      <mesh material={mats.tail} position={[0, 0.69, -2.345]}><boxGeometry args={[1.5, 0.035, 0.03]} /></mesh>
      {[0.58, -0.58].map((x) => <mesh key={x} material={mats.head} position={[x, 0.45, 2.02]} rotation={[0, x > 0 ? 0.5 : -0.5, 0]}><boxGeometry args={[0.32, 0.05, 0.03]} /></mesh>)}
      {/* wheels */}
      {wheels.map(([x, z, front], i) => (
        <group key={i} position={[x, CAR.wheelR, z]} rotation={[0, front ? s.steer ?? 0 : 0, 0]}>
          <group rotation={[s.spin, 0, 0]}>
            <mesh geometry={geo.tyre} material={mats.tyre} />
            <mesh geometry={geo.rim} material={mats.rim} position={[x > 0 ? 0.11 : -0.11, 0, 0]} />
          </group>
          <mesh material={mats.disc} position={[x > 0 ? 0.04 : -0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.19, 0.19, 0.03, 24]} /></mesh>
          {(s.blur ?? 0) > 0.02 && <mesh material={mats.blur} position={[x > 0 ? 0.16 : -0.16, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.232, 0.232, 0.01, 32]} /></mesh>}
        </group>
      ))}
    </group>
  );
};

/** world-space light glows for a car (tail + head), drawn after the car so they read through fog/haze */
export function carLightPoints(s: CarState) {
  const c = Math.cos(s.yaw), sn = Math.sin(s.yaw);
  const at = (x: number, y: number, z: number): P3 => [s.pos[0] + x * c + z * sn, s.pos[1] + y, s.pos[2] - x * sn + z * c];
  return {
    tail: [at(0.55, 0.69, -2.36), at(-0.55, 0.69, -2.36), at(0, 0.69, -2.36)] as P3[],
    head: [at(0.58, 0.45, 2.06), at(-0.58, 0.45, 2.06)] as P3[],
    rearWheels: [at(CAR.track, 0.05, CAR.axleR), at(-CAR.track, 0.05, CAR.axleR)] as P3[],
    under: at(0, 0.05, 0.6),
  };
}

export const CarLights: React.FC<{ s: CarState; tailK?: number; headK?: number }> = ({ s, tailK = 1, headK = 1 }) => {
  const L = carLightPoints(s);
  const b = s.brake ?? 0;
  return (
    <>
      {L.tail.map((p, i) => <Glow key={`t${i}`} pos={p} size={i === 2 ? 1.6 + 1.6 * b : 0.9 + 1.1 * b} color="#ff2a32" opacity={(0.45 + 0.55 * b) * tailK} stretch={i === 2 ? [2.4, 0.5] : [1, 1]} />)}
      {L.head.map((p, i) => <Glow key={`h${i}`} pos={p} size={1.3} color="#cfeaff" opacity={0.7 * headK * (s.head ?? 1)} />)}
    </>
  );
};
