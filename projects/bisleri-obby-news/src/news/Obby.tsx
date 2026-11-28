// The background: an original, code-built blocky obstacle course ("obby-style", not Roblox: no Roblox assets).
// A blocky dev avatar sprints and hops across floating platforms over water, deterministic from the frame.
// It falls into the water on the two "fail" beats and respawns; a giant blocky PAHs boss looms in the boss section.
import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ev } from '../tl';

const HOPS = 2.3;                       // hops per second
const STEP = 4.3;                       // z distance per platform
const N = 200;
const hash = (i: number) => { let x = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };
const PAL = ['#FF4D4D', '#FFC83D', '#3DDC84', '#4DA3FF', '#B46BFF', '#FF8A3D'];
type Plat = { x: number; y: number; z: number; w: number; d: number; col: string; moving: boolean; sweeper: boolean; kill: boolean };
const PLATS: Plat[] = Array.from({ length: N }, (_, i) => ({
  x: Math.sin(i * 0.83) * 2.6 + (hash(i) - 0.5) * 1.2,
  y: Math.floor(i / 9) % 3 === 1 ? 0.8 * Math.sin(i * 0.5) : 0,
  z: i * STEP, w: 2.4 + hash(i * 3) * 0.8, d: 2.4, col: PAL[i % PAL.length],
  moving: i % 7 === 3, sweeper: i % 9 === 5, kill: i % 11 === 8,
}));
const platX = (i: number, t: number) => PLATS[i].x + (PLATS[i].moving ? Math.sin(t * 2.2 + i) * 1.4 : 0);

/** avatar position at time t (with the two scripted falls) */
type Pose = { x: number; y: number; z: number; falling: boolean; splash: number; phase: number; air: number };
function avatarAt(t: number): Pose {
  const falls = [ev('qaFail'), ev('unsafe2')];
  for (const f of falls) {
    if (t >= f && t < f + 1.15) {
      const base: Pose = avatarAt(f - 1e-3), u = t - f;
      return { x: base.x + 0.6 * u, y: base.y + 2.2 * u - 9.8 * u * u * 0.9, z: base.z + 3.5 * u, falling: true, splash: base.y + 2.2 * u - 8.8 * u * u < -2.1 ? u : -1, phase: t * 14, air: 1 };
    }
  }
  const h = t * HOPS, i = Math.floor(h), u = h - i;
  const a = PLATS[i % N], b = PLATS[(i + 1) % N];
  const ax = platX(i % N, t), bx = platX((i + 1) % N, t);
  const air = Math.sin(Math.PI * u);
  return { x: ax + (bx - ax) * u, y: a.y + (b.y - a.y) * u + 0.75 + 1.7 * air, z: a.z + (b.z - a.z) * u, falling: false, splash: -1, phase: t * 14, air };
}

const faceTex = (() => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d')!;
  g.fillStyle = '#F2C29B'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#111'; g.fillRect(34, 46, 14, 20); g.fillRect(80, 46, 14, 20);
  g.fillStyle = '#111'; g.beginPath(); g.arc(64, 84, 22, 0.1 * Math.PI, 0.9 * Math.PI); g.lineWidth = 7; g.strokeStyle = '#111'; g.stroke();
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
})();

const Avatar: React.FC<{ t: number }> = ({ t }) => {
  const p = avatarAt(t);
  const swing = p.falling ? Math.sin(t * 30) * 1.2 : Math.sin(p.phase) * (0.9 - 0.5 * p.air);
  const tuck = p.air * 0.6;
  return (
    <group position={[p.x, p.y, p.z]} rotation={[p.falling ? -0.6 : 0.12 * p.air, 0, 0]}>
      {/* legs */}
      <mesh position={[-0.22, 0.45, 0]} rotation={[swing - tuck, 0, 0]}><boxGeometry args={[0.36, 0.9, 0.4]} /><meshStandardMaterial color="#2F3B66" /></mesh>
      <mesh position={[0.22, 0.45, 0]} rotation={[-swing - tuck, 0, 0]}><boxGeometry args={[0.36, 0.9, 0.4]} /><meshStandardMaterial color="#2F3B66" /></mesh>
      {/* torso: a teal dev hoodie + a laptop backpack */}
      <mesh position={[0, 1.35, 0]}><boxGeometry args={[0.95, 0.95, 0.5]} /><meshStandardMaterial color="#16A79C" /></mesh>
      <mesh position={[0, 1.4, -0.36]}><boxGeometry args={[0.75, 0.7, 0.22]} /><meshStandardMaterial color="#3A3F4A" /></mesh>
      {/* arms */}
      <mesh position={[-0.66, 1.35, 0]} rotation={[-swing * 1.1 + (p.falling ? -2.6 : 0), 0, 0.08]}><boxGeometry args={[0.32, 0.9, 0.36]} /><meshStandardMaterial color="#16A79C" /></mesh>
      <mesh position={[0.66, 1.35, 0]} rotation={[swing * 1.1 + (p.falling ? -2.6 : 0), 0, -0.08]}><boxGeometry args={[0.32, 0.9, 0.36]} /><meshStandardMaterial color="#16A79C" /></mesh>
      {/* head (face on the front) */}
      <mesh position={[0, 2.18, 0]}>
        <boxGeometry args={[0.78, 0.78, 0.78]} />
        {[0, 1, 2, 3, 4, 5].map((k) => (k === 4 && faceTex
          ? <meshStandardMaterial key={k} attach={`material-${k}`} map={faceTex} />
          : <meshStandardMaterial key={k} attach={`material-${k}`} color={k === 2 || k === 5 ? '#1B1B22' : '#F2C29B'} />))}
      </mesh>
    </group>
  );
};

const Course: React.FC<{ t: number }> = ({ t }) => {
  const h = Math.floor(t * HOPS);
  const from = Math.max(0, h - 3), to = Math.min(N - 1, h + 22);
  const items: React.ReactNode[] = [];
  for (let i = from; i <= to; i++) {
    const p = PLATS[i], x = platX(i, t);
    items.push(
      <group key={i} position={[x, p.y, p.z]}>
        <mesh position={[0, 0, 0]}><boxGeometry args={[p.w, 0.6, p.d]} /><meshStandardMaterial color={p.col} roughness={0.55} /></mesh>
        <mesh position={[0, -0.36, 0]}><boxGeometry args={[p.w * 0.96, 0.12, p.d * 0.96]} /><meshStandardMaterial color="#1A1A24" /></mesh>
        {p.sweeper && (
          <group position={[0, 1.2, 0]} rotation={[0, t * 3.4 + i, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.14, 0.14, p.w * 1.8, 10]} /><meshStandardMaterial color="#FF2E63" emissive="#FF2E63" emissiveIntensity={0.6} /></mesh>
            <mesh><cylinderGeometry args={[0.2, 0.2, 0.5, 10]} /><meshStandardMaterial color="#222" /></mesh>
          </group>
        )}
        {p.kill && <mesh position={[p.w * 0.7, 0.45, 0]}><boxGeometry args={[0.9, 0.3, 1.6]} /><meshStandardMaterial color="#FF1744" emissive="#FF1744" emissiveIntensity={0.9} /></mesh>}
        {i % 10 === 0 && (
          <group position={[-p.w * 0.35, 0.3, 0]}>
            <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.05, 0.05, 1.8, 6]} /><meshStandardMaterial color="#EEE" /></mesh>
            <mesh position={[0.35, 1.55, 0]}><boxGeometry args={[0.7, 0.42, 0.04]} /><meshStandardMaterial color="#3DDC84" emissive="#3DDC84" emissiveIntensity={0.4} /></mesh>
          </group>
        )}
      </group>,
    );
  }
  return <>{items}</>;
};

const Boss: React.FC<{ t: number; z: number }> = ({ t, z }) => {
  const a = ev('pahs'), b = ev('reply');
  if (t < a - 0.2 || t > b + 0.6) return null;
  const rise = Math.min(1, Math.max(0, (t - a) / 0.8)), sink = Math.min(1, Math.max(0, (t - b) / 0.6));
  const y = -9 + 13 * (1 - Math.pow(1 - rise, 3)) - 12 * sink;
  const shake = t > ev('boss') && t < ev('boss') + 1.2 ? Math.sin(t * 50) * 0.25 : 0;
  return (
    <group position={[-6.5 + shake, y + 1.5, z + 18]} rotation={[0, -0.35, 0]} scale={1.2}>
      <mesh><boxGeometry args={[6, 6, 6]} /><meshStandardMaterial color="#5B2A86" roughness={0.4} /></mesh>
      {[-1.4, 1.4].map((x) => <mesh key={x} position={[x, 1, -3.05]}><boxGeometry args={[1.2, 1.2, 0.2]} /><meshStandardMaterial color="#FFEB3B" emissive="#FFEB3B" emissiveIntensity={1} /></mesh>)}
      <mesh position={[0, -1.4, -3.05]}><boxGeometry args={[3.4, 0.6, 0.2]} /><meshStandardMaterial color="#111" /></mesh>
      {[-2.2, 0, 2.2].map((x) => <mesh key={x} position={[x, 3.5, 0]}><coneGeometry args={[0.6, 1.4, 4]} /><meshStandardMaterial color="#8E44D9" /></mesh>)}
    </group>
  );
};

const Splash: React.FC<{ t: number }> = ({ t }) => {
  const out: React.ReactNode[] = [];
  for (const f of [ev('qaFail'), ev('unsafe2')]) {
    const u = t - f - 0.55; if (u < 0 || u > 0.9) continue;
    const p = avatarAt(f + 0.5);
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2, r = 2.2 * u;
      out.push(<mesh key={`${f}-${k}`} position={[p.x + Math.cos(a) * r, -2.1 + 3.2 * u - 6 * u * u, p.z + 1 + Math.sin(a) * r]}>
        <sphereGeometry args={[0.16, 8, 8]} /><meshStandardMaterial color="#B3E5FC" transparent opacity={1 - u / 0.9} /></mesh>);
    }
    out.push(<mesh key={`ring${f}`} position={[p.x, -2.05, p.z + 1]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.4 + 3 * u, 0.6 + 3 * u, 32]} /><meshBasicMaterial color="#E1F5FE" transparent opacity={1 - u / 0.9} /></mesh>);
  }
  return <>{out}</>;
};

const CameraRig: React.FC<{ t: number }> = ({ t }) => {
  const { camera } = useThree();
  const p = avatarAt(t);
  const lag = avatarAt(Math.max(0, t - 0.12));
  const shake = (t > ev('scratch') && t < ev('scratch') + 0.25) || (t > ev('qaFail') + 0.5 && t < ev('qaFail') + 0.8) ? Math.sin(t * 80) * 0.25 : 0;
  // pitched up so the runner sits low in frame (the news cards own the upper half)
  camera.position.set(lag.x * 0.7 + shake, Math.max(1.5, lag.y * 0.4) + 4.8, lag.z - 8.6);
  camera.lookAt(p.x * 0.85, Math.max(0.5, p.y * 0.5) + 5.6, p.z + 16);
  return null;
};

export const Obby: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const z = avatarAt(t).z;
  const sky = useMemo(() => new THREE.Color('#5EC8F5'), []);
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: 62, near: 0.1, far: 220, position: [0, 5, -8] }}
      onCreated={({ scene }) => { scene.background = sky; scene.fog = new THREE.Fog('#9DDCF7', 40, 120); }}>
      <hemisphereLight args={['#FFFFFF', '#5A7BA8', 1.0]} />
      <directionalLight position={[8, 16, -6]} intensity={1.6} />
      <CameraRig t={t} />
      {/* the water ("paani") */}
      <mesh position={[0, -2.2, z + 40]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[220, 260]} /><meshStandardMaterial color="#1E88E5" roughness={0.25} metalness={0.1} />
      </mesh>
      {Array.from({ length: 10 }, (_, k) => (
        <mesh key={k} position={[((k * 37) % 60) - 30, -2.15, Math.floor(z / 30) * 30 + ((k * 53) % 90)]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1 + ((t * 0.8 + k * 0.3) % 2), 1.15 + ((t * 0.8 + k * 0.3) % 2), 32]} /><meshBasicMaterial color="#90CAF9" transparent opacity={0.35} />
        </mesh>
      ))}
      <Course t={t} />
      <Avatar t={t} />
      <Splash t={t} />
      <Boss t={t} z={z} />
    </ThreeCanvas>
  );
};
