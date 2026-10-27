// "Orbit One": an original, fictional pair of over-ear headphones for the V3 3D-website shot (v3studio). Polished
// alloy band and yokes, oval cups capped with a glass dome over a glowing ring driver, velvet cushions. Three
// finishes blend continuously (finish 0 silver, 1 rose, 2 midnight). Geometry is built once; props drive the look.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { latheX, makeGlow, paramSurface } from './StudioRacer';

export const FINISHES = [
  { name: 'Silver', metal: '#D9DEE6', rough: 0.14, fabric: '#2A2A31', glow: '#8FE8FF', halo: '#CFE2FF', swatch: 'linear-gradient(135deg,#F4F6F9,#AEB6C2)' },
  { name: 'Rose', metal: '#E7B097', rough: 0.17, fabric: '#E9DCD2', glow: '#FFB48C', halo: '#FFC9AE', swatch: 'linear-gradient(135deg,#F8D6C5,#C9876C)' },
  { name: 'Midnight', metal: '#2E3858', rough: 0.26, fabric: '#191B25', glow: '#A493FF', halo: '#8C7DFF', swatch: 'linear-gradient(135deg,#56628C,#161A2C)' },
] as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const C = (i: number, k: 'metal' | 'fabric' | 'glow') => new THREE.Color(FINISHES[i][k]);
/** finish colour at a continuous index */
export function finishColor(t: number, k: 'metal' | 'fabric' | 'glow' | 'halo') {
  const i = Math.min(1, Math.floor(t)), u = Math.min(1, Math.max(0, t - i));
  return new THREE.Color(FINISHES[i][k]).lerp(new THREE.Color(FINISHES[i + 1][k]), u);
}

const CUP = { x: 0.86, y: -0.6, sy: 1.1 };
const BAND = { rx: 1.04, ry: 1.12, cy: 0.15, th0: 0.22 };

function driverTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d')!;
  const g = x.createRadialGradient(256, 256, 0, 256, 256, 256);
  g.addColorStop(0, '#2A2D35'); g.addColorStop(0.55, '#15171C'); g.addColorStop(1, '#0B0C10');
  x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  for (let r = 18; r < 256; r += 7) { x.strokeStyle = `rgba(255,255,255,${r % 21 === 4 ? 0.12 : 0.05})`; x.lineWidth = 1.5; x.beginPath(); x.arc(256, 256, r, 0, Math.PI * 2); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function build() {
  // band: a flat, rounded section swept over an elliptical arc
  const band = paramSurface(28, 90, (u, v, o) => {
    const th = lerp(BAND.th0, Math.PI - BAND.th0, v), a = u * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    const t = 0.05 * Math.sign(ca) * Math.abs(ca) ** 0.45, z = 0.17 * Math.sign(sa) * Math.abs(sa) ** 0.45;
    o.set((BAND.rx + t) * Math.cos(th), BAND.cy + (BAND.ry + t) * Math.sin(th), z);
  }, true, 4, 6).geo;
  // a polished inlay strip on top of the band
  const inlay = paramSurface(16, 80, (u, v, o) => {
    const th = lerp(BAND.th0 + 0.12, Math.PI - BAND.th0 - 0.12, v), a = u * Math.PI * 2;
    const t = 0.052 + 0.012 * Math.sin(a), z = 0.045 * Math.cos(a);
    o.set((BAND.rx + t) * Math.cos(th), BAND.cy + (BAND.ry + t) * Math.sin(th), z);
  }, true).geo;
  // inner cushion band
  const pad = paramSurface(24, 60, (u, v, o) => {
    const th = lerp(0.62, Math.PI - 0.62, v), a = u * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    const t = -0.085 + 0.04 * Math.sign(ca) * Math.abs(ca) ** 0.6, z = 0.13 * Math.sign(sa) * Math.abs(sa) ** 0.6;
    o.set((BAND.rx + t) * Math.cos(th), BAND.cy + (BAND.ry + t) * Math.sin(th), z);
  }, true).geo;
  // cup housing (axis +X, inner plane at x=0), glass dome, driver, rings, cushion
  const cup = latheX([[0.0, 0.0], [0.0, 0.47], [0.03, 0.53], [0.1, 0.56], [0.19, 0.566], [0.27, 0.545], [0.32, 0.51], [0.345, 0.47], [0.352, 0.445]], 72, 6, 1).geo;
  const dome = latheX([[0.352, 0.445], [0.37, 0.4], [0.385, 0.3], [0.393, 0.16], [0.396, 0.0]], 72).geo;
  const driver = new THREE.CircleGeometry(0.44, 72).rotateY(Math.PI / 2).translate(0.335, 0, 0);
  const ring = new THREE.TorusGeometry(0.3, 0.011, 10, 120).rotateY(Math.PI / 2).translate(0.34, 0, 0);
  const ring2 = new THREE.TorusGeometry(0.17, 0.008, 8, 96).rotateY(Math.PI / 2).translate(0.34, 0, 0);
  const bezel = new THREE.TorusGeometry(0.447, 0.024, 16, 120).rotateY(Math.PI / 2).translate(0.35, 0, 0);
  const cushion = new THREE.TorusGeometry(0.37, 0.13, 28, 72).rotateY(Math.PI / 2).scale(0.62, 1, 1).translate(-0.05, 0, 0);
  // yoke: an arc over the cup in the YZ plane, through the middle of its depth
  const yokePts = Array.from({ length: 41 }, (_, i) => { const p = lerp(-0.12, Math.PI + 0.12, i / 40); return new THREE.Vector3(0.17, 0.665 * CUP.sy * Math.sin(p), 0.64 * Math.cos(p)); });
  const yoke = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(yokePts), 80, 0.034, 14, false);
  const pivot = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 28).rotateX(Math.PI / 2);
  const yTop = CUP.y + 0.665 * CUP.sy, bandEnd = BAND.cy + BAND.ry * Math.sin(BAND.th0);
  const stem = new THREE.CylinderGeometry(0.03, 0.03, bandEnd - yTop + 0.05, 20).translate(0, (bandEnd + yTop) / 2, 0);
  const sleeve = new THREE.CylinderGeometry(0.058, 0.05, 0.16, 28).translate(0, bandEnd + 0.02, 0);
  return { band, inlay, pad, cup, dome, driver, ring, ring2, bezel, cushion, yoke, pivot, stem, sleeve, yTop, bandEnd };
}

export function useHeadphoneAssets() {
  return useMemo(() => {
    const g = build(), glow = makeGlow();
    return {
      g, glow,
      metal: new THREE.MeshPhysicalMaterial({ color: '#D9DEE6', metalness: 1, roughness: 0.14, clearcoat: 0.8, clearcoatRoughness: 0.08, envMapIntensity: 1.25 }),
      chrome: new THREE.MeshPhysicalMaterial({ color: '#F5F7FA', metalness: 1, roughness: 0.05, envMapIntensity: 1.5 }),
      fabric: new THREE.MeshPhysicalMaterial({ color: '#2A2A31', roughness: 0.92, metalness: 0, sheen: 0.55, sheenRoughness: 0.5, sheenColor: new THREE.Color('#8E8E9C') }),
      glass: new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', metalness: 0, roughness: 0.03, transmission: 1, thickness: 0.12, ior: 1.5, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6, transparent: true }),
      driver: new THREE.MeshStandardMaterial({ map: driverTexture(), metalness: 0.6, roughness: 0.38 }),
      emit: new THREE.MeshBasicMaterial({ color: '#8FE8FF', toneMapped: false }),
      sprite: new THREE.SpriteMaterial({ map: glow, color: '#8FE8FF', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false }),
    };
  }, []);
}
export type HeadphoneAssets = ReturnType<typeof useHeadphoneAssets>;

/** finish: continuous 0..2; glow: ring intensity; spark: angle of the light travelling around each ring */
export const Headphones: React.FC<{ A: HeadphoneAssets; finish: number; glow: number; spark: number }> = ({ A, finish, glow, spark }) => {
  const fi = Math.min(1, Math.floor(finish)), fu = Math.min(1, Math.max(0, finish - fi));
  A.metal.color.copy(finishColor(finish, 'metal'));
  A.metal.roughness = lerp(FINISHES[fi].rough, FINISHES[fi + 1].rough, fu);
  A.fabric.color.copy(finishColor(finish, 'fabric'));
  const gc = finishColor(finish, 'glow');
  A.emit.color.copy(gc).multiplyScalar(0.6 + 0.7 * glow);
  A.sprite.color.copy(gc); A.sprite.opacity = 0.35 + 0.5 * glow;
  const G = A.g;
  const side = (s: 1 | -1) => (
    <group scale={[s, 1, 1]}>
      <group position={[CUP.x, CUP.y, 0]}>
        <group scale={[1, CUP.sy, 1]}>
          <mesh geometry={G.cup} material={A.metal} />
          <mesh geometry={G.driver} material={A.driver} />
          <mesh geometry={G.ring} material={A.emit} />
          <mesh geometry={G.ring2} material={A.emit} />
          <mesh geometry={G.bezel} material={A.chrome} />
          <mesh geometry={G.dome} material={A.glass} />
          <mesh geometry={G.cushion} material={A.fabric} />
          <sprite material={A.sprite} position={[0.42, 0.3 * Math.sin(spark * s), 0.3 * Math.cos(spark * s)]} scale={[0.32, 0.32, 1]} />
        </group>
        <mesh geometry={G.yoke} material={A.metal} />
        <mesh geometry={G.pivot} material={A.chrome} position={[0.17, -0.08, 0.66]} />
        <mesh geometry={G.pivot} material={A.chrome} position={[0.17, -0.08, -0.66]} />
      </group>
      <group position={[CUP.x + 0.17, 0, 0]}>
        <mesh geometry={G.stem} material={A.chrome} />
        <mesh geometry={G.sleeve} material={A.metal} />
      </group>
    </group>
  );
  return (
    <group position={[0, -0.05, 0]}>
      <mesh geometry={G.band} material={A.metal} />
      <mesh geometry={G.inlay} material={A.chrome} />
      <mesh geometry={G.pad} material={A.fabric} />
      {side(1)}
      {side(-1)}
    </group>
  );
};
void C;
