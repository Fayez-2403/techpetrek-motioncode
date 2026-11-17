// The world: a night library. A polished wooden floor fading into warm fog, a wall of shelves behind (our 12 books
// plus muted filler spines, seeded), warm key light, cool rim light, dust in the light. Pure in t.
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BOOKS } from '../config/books';

export const BG = '#0d0a08';
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export const Lights: React.FC = () => (
  <>
    <ambientLight intensity={0.22} />
    <hemisphereLight args={['#ffd9a8', '#1a1008', 0.55]} />
    <directionalLight position={[7, 14, 9]} intensity={2.8} color="#ffd8a8" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={18} shadow-camera-bottom={-18} />
    <pointLight position={[-8, 5, 3]} intensity={80} distance={30} color="#63c8fa" />
    <pointLight position={[6, 3, -6]} intensity={90} distance={26} color="#ff9a52" />
  </>
);

export const Floor: React.FC = () => (
  <group>
    <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[300, 300]} /><meshStandardMaterial color="#2a1a10" roughness={0.38} metalness={0.25} /></mesh>
    {Array.from({ length: 40 }, (_, i) => <mesh key={i} rotation-x={-Math.PI / 2} position={[(i - 20) * 1.2, 0.005, 0]}><planeGeometry args={[0.02, 300]} /><meshBasicMaterial color="#160d07" /></mesh>)}
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 1]}><circleGeometry args={[7, 48]} /><meshBasicMaterial color="#ffb070" transparent opacity={0.08} /></mesh>
  </group>
);

/** the back wall of shelves: 5 rows of spines; our 12 books glow brighter */
export const Shelves: React.FC<{ z?: number; lit?: number }> = ({ z = -10, lit = 0.4 }) => {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const spines = useMemo(() => {
    const r = rng(31), out: { x: number; y: number; w: number; h: number; c: string; ours: boolean }[] = [];
    const muted = ['#4a2e22', '#2f3b4a', '#3b2f45', '#24443a', '#57452a', '#5a2a2a', '#2c2c34'];
    for (let row = 0; row < 5; row++) {
      let x = -16;
      while (x < 16) {
        const w = 0.35 + r() * 0.4, h = 1.6 + r() * 0.7, ours = r() < 0.12;
        const b = BOOKS[Math.floor(r() * BOOKS.length)];
        out.push({ x: x + w / 2, y: 0.6 + row * 2.6 + h / 2, w, h, c: ours ? b.cover[0] : muted[Math.floor(r() * muted.length)], ours });
        x += w + 0.04 + (r() < 0.06 ? 0.8 : 0);
      }
    }
    return out;
  }, []);
  useLayoutEffect(() => {
    const m = ref.current, M = new THREE.Matrix4(), C = new THREE.Color();
    spines.forEach((s, i) => { m.setMatrixAt(i, M.compose(new THREE.Vector3(s.x, s.y, z), new THREE.Quaternion(), new THREE.Vector3(s.w, s.h, 1.2))); m.setColorAt(i, C.set(s.c).multiplyScalar(s.ours ? 1 + lit : 1)); });
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [lit]);
  return (
    <group>
      <instancedMesh ref={ref} args={[undefined, undefined, spines.length]} castShadow receiveShadow><boxGeometry /><meshStandardMaterial roughness={0.7} /></instancedMesh>
      {Array.from({ length: 6 }, (_, row) => <mesh key={row} position={[0, 0.5 + row * 2.6, z + 0.1]} receiveShadow><boxGeometry args={[33, 0.22, 1.8]} /><meshStandardMaterial color="#3b2416" roughness={0.6} /></mesh>)}
      <mesh position={[0, 7, z - 0.8]}><boxGeometry args={[34, 15, 0.3]} /><meshStandardMaterial color="#1c120b" roughness={0.9} /></mesh>
    </group>
  );
};

export const Dust: React.FC<{ t: number; n?: number }> = ({ t, n = 300 }) => {
  const base = useMemo(() => { const r = rng(9); return Array.from({ length: n }, () => [(r() - 0.5) * 30, r() * 14, (r() - 0.5) * 20, r() * 6.28] as const); }, [n]);
  const geo = useMemo(() => new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)), [n]);
  const a = geo.attributes.position.array as Float32Array;
  base.forEach(([x, y, z, p], i) => { a[i * 3] = x + Math.sin(t * 0.2 + p) * 0.6; a[i * 3 + 1] = (y + t * 0.18) % 14; a[i * 3 + 2] = z + Math.cos(t * 0.15 + p) * 0.6; });
  geo.attributes.position.needsUpdate = true;
  return <points geometry={geo}><pointsMaterial size={0.05} color="#ffe2b8" transparent opacity={0.6} depthWrite={false} /></points>;
};

/** soft volumetric-looking light shafts (additive planes) from the upper left */
export const Shafts: React.FC<{ t: number }> = ({ t }) => (
  <group position={[-6, 9, -4]} rotation={[0, 0.3, -0.5]}>
    {[0, 1, 2].map((i) => <mesh key={i} position={[i * 2.2, -4, i * 0.6]}><planeGeometry args={[1.4 + i * 0.4, 16]} /><meshBasicMaterial color="#ffd9a0" transparent opacity={0.05 + 0.02 * Math.sin(t * 0.8 + i)} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} /></mesh>)}
  </group>
);
