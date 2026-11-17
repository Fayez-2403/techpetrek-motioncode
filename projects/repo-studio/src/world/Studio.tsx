// The world: a dark glossy studio floor that recedes into fog, a ring of real repo panels at several depths (parallax),
// warm key + cyan rim lights, a soft light pool under the bot, floating dust. Seeded and pure in t.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Panel } from './Panel';

export const BG = '#07090d';
export const SLUGS = ['blender', 'threejs', 'numpy', 'numba', 'gsap', 'remotion', 'puppeteer', 'tonejs', 'scipy', 'pedalboard', 'pyloudnorm', 'fasterwhisper', 'opencv', 'pillow', 'ffmpeg', 'reportlab'];

function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export const Lights: React.FC<{ key2?: string }> = () => (
  <>
    <ambientLight intensity={0.18} />
    <hemisphereLight args={['#9fb7e8', '#2a1d16', 0.5]} />
    <directionalLight position={[8, 16, 10]} intensity={2.6} color="#ffe3c8" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} />
    <pointLight position={[-9, 6, -6]} intensity={120} distance={40} color="#63E5FA" />
    <pointLight position={[9, 3, 4]} intensity={70} distance={30} color="#ff8a5c" />
  </>
);

export const Floor: React.FC = () => (
  <group>
    <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[400, 400]} /><meshStandardMaterial color="#0c0f14" roughness={0.32} metalness={0.55} /></mesh>
    {/* grid lines, fading with distance via fog */}
    <gridHelper args={[400, 200, '#1b2a36', '#121a22']} position={[0, 0.01, 0]} />
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}><circleGeometry args={[7, 48]} /><meshBasicMaterial color="#ffb38a" transparent opacity={0.07} /></mesh>
  </group>
);

export const Dust: React.FC<{ t: number; n?: number }> = ({ t, n = 260 }) => {
  const base = useMemo(() => { const r = rng(9); return Array.from({ length: n }, () => [(r() - 0.5) * 60, r() * 22, (r() - 0.5) * 60, r() * 6.28] as const); }, [n]);
  const geo = useMemo(() => new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)), [n]);
  const a = geo.attributes.position.array as Float32Array;
  base.forEach(([x, y, z, p], i) => { a[i * 3] = x + Math.sin(t * 0.2 + p) * 0.8; a[i * 3 + 1] = (y + t * 0.25) % 22; a[i * 3 + 2] = z + Math.cos(t * 0.17 + p) * 0.8; });
  geo.attributes.position.needsUpdate = true;
  return <points geometry={geo}><pointsMaterial size={0.06} color="#ffd9b8" transparent opacity={0.55} depthWrite={false} /></points>;
};

/** the gallery: every repo panel standing on a big arc behind the action (index i from SLUGS) */
export const arcPos = (i: number, n = SLUGS.length, R = 34): { pos: [number, number, number]; rotY: number } => {
  const a = -Math.PI * 0.55 + (i / (n - 1)) * Math.PI * 1.1;   // back half only: cameras in front never sit behind a panel
  return { pos: [Math.sin(a) * R, 5.4, -Math.cos(a) * R], rotY: -a };
};
export const Gallery: React.FC<{ except?: string[]; dim?: number }> = ({ except = [], dim = 0.35 }) => (
  <group>
    {SLUGS.map((s, i) => except.includes(s) ? null : <Panel key={s} slug={s} width={7} position={arcPos(i).pos} rotation-y={arcPos(i).rotY} glow={dim} />)}
  </group>
);

export const Fog: React.FC<{ near?: number; far?: number }> = ({ near = 14, far = 70 }) => <fog attach="fog" args={[BG, near, far]} />;
