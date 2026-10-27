// SkyFx: props and effects for the GAME · DUEL shot (original designs): an energy blade (white-hot core, coloured
// camera-facing glow and a hilt), an expanding shock ring, and the floating stone arena (tiled disc, carved rim, rocky
// underside, broken columns). Effects are pure functions of their props; the blade glow is a Ribbons strip.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mulberry32 } from '../../lib/rng';
import { madd, mergeSimple, norm, Ribbons, type P3, type Strip } from './SkyKit';
import { Glow } from './SkyGlider';

const Y = new THREE.Vector3(0, 1, 0);
const quatAlong = (d: P3) => { const q = new THREE.Quaternion().setFromUnitVectors(Y, new THREE.Vector3(...d).normalize()); return [q.x, q.y, q.z, q.w] as [number, number, number, number]; };

/** the blade strips (core + halo) for the shared Ribbons batch, plus hilt meshes; the hilt sits at `hilt`, the blade along `dir` */
export function bladeStrips(hilt: P3, dir: P3, len: number, col: [number, number, number], k = 1): Strip[] {
  const a = madd(hilt, dir, 0.1), b = madd(hilt, dir, len);
  const pts: P3[] = [0, 0.25, 0.5, 0.75, 1].map((u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]);
  return [
    { pts, w: [0.13, 0.14, 0.14, 0.12, 0.07], a: 0.75 * k, col },
    { pts, w: [0.42, 0.44, 0.42, 0.36, 0.2], a: 0.2 * k, col },
  ];
}

/** hilt + a solid, untonemapped blade core (reads on bright skies, where additive glow alone vanishes) */
export const BladeHilt: React.FC<{ hilt: P3; dir: P3; color: string; core: string; len: number }> = ({ hilt, dir, color, core, len }) => {
  const G = useMemo(() => ({
    blade: (() => { const g = new THREE.CapsuleGeometry(0.024, 1, 4, 10); g.translate(0, 0.5, 0); return g; })(),
    inner: (() => { const g = new THREE.CapsuleGeometry(0.011, 1, 4, 8); g.translate(0, 0.5, 0); return g; })(),
    coreMat: new THREE.MeshBasicMaterial({ color: core, toneMapped: false }), whiteMat: new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false }),
    grip: new THREE.CylinderGeometry(0.022, 0.026, 0.24, 12), guard: new THREE.BoxGeometry(0.16, 0.035, 0.05), pommel: new THREE.SphereGeometry(0.032, 12, 8),
    metal: new THREE.MeshPhysicalMaterial({ color: '#30343D', metalness: 0.9, roughness: 0.28, clearcoat: 0.6 }),
    emit: new THREE.MeshBasicMaterial({ color, toneMapped: false }),
  }), [color, core]);
  const q = quatAlong(dir);
  return (
    <group position={hilt} quaternion={q}>
      <mesh geometry={G.grip} material={G.metal} position={[0, -0.02, 0]} castShadow />
      <mesh geometry={G.guard} material={G.metal} position={[0, 0.1, 0]} castShadow />
      <mesh geometry={G.guard} material={G.emit} position={[0, 0.1, 0]} scale={[0.6, 0.5, 1.05]} />
      <mesh geometry={G.pommel} material={G.metal} position={[0, -0.15, 0]} />
      <mesh geometry={G.blade} material={G.coreMat} position={[0, 0.12, 0]} scale={[1, len - 0.1, 1]} />
      <mesh geometry={G.inner} material={G.whiteMat} position={[0, 0.13, 0]} scale={[1.05, len - 0.14, 1.05]} renderOrder={2} />
    </group>
  );
};

/** an expanding ring in the plane with normal `n`; camera-independent (lies flat) */
const ringFrag = /* glsl */ `
uniform vec3 uCol; uniform float uA; uniform float uW; varying vec2 vUv;
void main() { float r = length(vUv - 0.5) * 2.0; float k = exp(-pow((r - 0.86) / uW, 2.0)) + 0.35 * exp(-pow((r - 0.8) / (uW * 3.0), 2.0)); float a = k * uA; gl_FragColor = vec4(uCol * a, a); }`;
export const ShockRing: React.FC<{ c: P3; n: P3; r: number; a: number; color: string; w?: number }> = ({ c, n, r, a, color, w = 0.04 }) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uCol: { value: new THREE.Color() }, uA: { value: 1 }, uW: { value: 0.04 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: ringFrag, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false,
  }), []);
  if (a <= 0.003 || r <= 0) return null;
  mat.uniforms.uCol.value.set(color); mat.uniforms.uA.value = a; mat.uniforms.uW.value = w;
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...n).normalize());
  return (
    <mesh position={c} quaternion={[q.x, q.y, q.z, q.w]} scale={[r / 0.86, r / 0.86, 1]} material={mat} renderOrder={26}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
};

// ------------------------------------------------------------------------------------------------ arena
export const ARENA_R = 5.6;
function arenaGeo() {
  const rnd = mulberry32(2718);
  const parts: THREE.BufferGeometry[] = [];
  const cols: number[][] = [];
  const stoneA = new THREE.Color('#C49E74'), stoneB = new THREE.Color('#A6825C'), stoneC = new THREE.Color('#B7916A'), moss = new THREE.Color('#6E8A48');
  // tiled disc: rings of slightly irregular stone tiles with grout gaps
  const rings = [[0, 0.9, 1], [0.95, 2.0, 8], [2.05, 3.2, 14], [3.25, 4.4, 20], [4.45, 5.25, 26]];
  for (const [r0, r1, n] of rings) {
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI * 2 + 0.012, a1 = ((k + 1) / n) * Math.PI * 2 - 0.012;
      const h = 0.06 + rnd() * 0.03, tilt = (rnd() - 0.5) * 0.02;
      const g = r0 === 0 ? new THREE.CylinderGeometry(r1, r1, h, 24) : ringSeg(r0 + 0.02, r1 - 0.02, a0, a1, h);
      g.translate(0, (r0 === 0 ? -h / 2 : 0) + tilt, 0);
      const c = (rnd() < 0.33 ? stoneA : rnd() < 0.5 ? stoneB : stoneC).clone().multiplyScalar(0.92 + rnd() * 0.12);
      if (rnd() < 0.12) c.lerp(moss, 0.45);
      parts.push(g.index ? g.toNonIndexed() : g); cols.push([c.r, c.g, c.b]);
    }
  }
  // carved rim with a lip
  const rs = new THREE.Shape(); rs.absarc(0, 0, ARENA_R, 0, Math.PI * 2, false);
  const rh = new THREE.Path(); rh.absarc(0, 0, 5.25, 0, Math.PI * 2, true); rs.holes.push(rh);
  const rim = new THREE.ExtrudeGeometry(rs, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 96 });
  rim.rotateX(-Math.PI / 2); rim.translate(0, -0.2, 0);
  parts.push(rim.toNonIndexed()); cols.push([0.62, 0.5, 0.38]);
  // grout bed
  const bed = new THREE.CylinderGeometry(ARENA_R - 0.1, ARENA_R - 0.1, 0.08, 64); bed.translate(0, -0.07, 0);
  parts.push(bed.toNonIndexed()); cols.push([0.33, 0.29, 0.25]);
  const merged = mergeColored(parts, cols);
  return merged;
}
function ringSeg(r0: number, r1: number, a0: number, a1: number, h: number, seg = 6) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r1, a0, a1, false);
  s.absarc(0, 0, r0, a1, a0, true);
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 1, curveSegments: seg });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -h, 0);
  g.computeVertexNormals();
  return g;
}
function mergeColored(gs: THREE.BufferGeometry[], cols: number[][]) {
  const pos: number[] = [], nor: number[] = [], col: number[] = [];
  gs.forEach((g, i) => {
    if (!g.attributes.normal) g.computeVertexNormals();
    const p = g.attributes.position.array, n = g.attributes.normal.array;
    for (let k = 0; k < p.length; k++) { pos.push(p[k]); nor.push(n[k]); }
    for (let k = 0; k < p.length / 3; k++) col.push(...cols[i]);
  });
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  m.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  m.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return m;
}
function undersideGeo() {
  const rnd = mulberry32(99);
  const NT = 40, NV = 12, pos: number[] = [], col: number[] = [], idx: number[] = [];
  const A = new THREE.Color('#A88B6A'), Bc = new THREE.Color('#6E5A48');
  for (let i = 0; i <= NV; i++) for (let j = 0; j < NT; j++) {
    const v = i / NV, th = (j / NT) * Math.PI * 2;
    const r = ARENA_R * (1 - v) ** 1.3 * (1 + 0.12 * Math.sin(5 * th + v * 4) + (i > 0 && i < NV ? (rnd() - 0.5) * 0.12 : 0)) + 0.02;
    const y = -0.12 - v * 7.5 * (1 + 0.2 * Math.sin(3 * th));
    pos.push(r * Math.cos(th), y, r * Math.sin(th));
    const c = A.clone().lerp(Bc, v * 0.8 + 0.2 * Math.sin(y * 3));
    col.push(c.r, c.g, c.b);
  }
  for (let i = 0; i < NV; i++) for (let j = 0; j < NT; j++) {
    const a = i * NT + j, b = i * NT + ((j + 1) % NT), c = (i + 1) * NT + j, d = (i + 1) * NT + ((j + 1) % NT);
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
// the camera orbits yaw 1.2 -> 4.7 outside the rim: columns stand on the far arc so they frame, never block
export const COLUMNS: { a: number; h: number; tilt: number }[] = [{ a: 5.05, h: 3.4, tilt: 0 }, { a: 5.75, h: 1.7, tilt: 0.04 }, { a: 0.3, h: 3.0, tilt: -0.03 }, { a: 0.85, h: 1.2, tilt: 0.02 }];

export const Arena: React.FC = () => {
  const G = useMemo(() => {
    const col = new THREE.CylinderGeometry(0.32, 0.36, 1, 10, 1);
    const cap = new THREE.BoxGeometry(0.9, 0.22, 0.9);
    const base = new THREE.BoxGeometry(0.95, 0.25, 0.95);
    return {
      top: arenaGeo(), under: undersideGeo(), col, cap, base,
      stone: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, flatShading: true }),
      colMat: new THREE.MeshStandardMaterial({ color: '#C8A982', roughness: 0.8, flatShading: true }),
      rune: new THREE.MeshBasicMaterial({ color: '#FFD08A', toneMapped: false }),
      runeGeo: mergeSimple([0, 1, 2, 3, 4, 5, 6, 7].map((k) => { const g = new THREE.BoxGeometry(0.5, 0.012, 0.06); g.translate(0, 0.02, -5.42); g.rotateY((k / 8) * Math.PI * 2 + 0.2); return g; })),
    };
  }, []);
  return (
    <group>
      <mesh geometry={G.top} material={G.stone} receiveShadow castShadow />
      <mesh geometry={G.under} material={G.stone} />
      <mesh geometry={G.runeGeo} material={G.rune} />
      {COLUMNS.map((c, i) => {
        const x = Math.cos(c.a) * 5.3, z = Math.sin(c.a) * 5.3;
        return (
          <group key={i} position={[x, 0, z]} rotation={[c.tilt, 0, c.tilt * 0.7]}>
            <mesh geometry={G.base} material={G.colMat} position={[0, 0.12, 0]} castShadow receiveShadow />
            <mesh geometry={G.col} material={G.colMat} position={[0, 0.25 + c.h / 2, 0]} scale={[1, c.h, 1]} castShadow receiveShadow />
            {c.h > 2.5 && <mesh geometry={G.cap} material={G.colMat} position={[0, 0.36 + c.h, 0]} castShadow />}
          </group>
        );
      })}
    </group>
  );
};

/** additive glow helpers re-exported for the duel */
export { Glow, Ribbons };
