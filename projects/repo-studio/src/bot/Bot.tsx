// The bot: a rigged voxel rebuild of Assets/claude bot face.png (fan-made; proportions measured from the PNG, 56 px =
// 1 unit): body 6 × 4, side arms 1 × 1, two eyes 0.5 × 1, four legs 0.5 × 1. Every part is posed by a plain Pose
// object, so a frame is a pure function of t (moves.ts builds the poses).
import React from 'react';
import * as THREE from 'three';

export const ORANGE = '#D97757';
export type Eyes = 'open' | 'blink' | 'happy' | 'angry' | 'wide' | 'squint' | 'closed' | 'dizzy';
export type Mouth = 'none' | 'o' | 'grin' | 'smile' | 'flat';
export interface Limb { raise: number; swing: number; stretch: number }      // radians, radians, 1 = rest length
export interface Pose {
  pos: [number, number, number]; rotY: number; rotZ: number; rotX: number;
  squash: number;            // 1 = rest; < 1 squashed (wider), > 1 stretched (thinner)
  armL: Limb; armR: Limb;
  legs: [number, number, number, number];   // lift (units) per leg, left to right
  legSwing: [number, number, number, number];
  eyes: Eyes; look: [number, number]; mouth: Mouth;
  goggles: number;           // < 0 none; 0 on the forehead … 1 over the eyes
  prop: 'none' | 'magnifier' | 'baton' | 'mic';
  glow: number;              // emissive kick (0..1) on hits
}
export const REST: Pose = {
  pos: [0, 0, 0], rotY: 0, rotZ: 0, rotX: 0, squash: 1,
  armL: { raise: 0, swing: 0, stretch: 1 }, armR: { raise: 0, swing: 0, stretch: 1 },
  legs: [0, 0, 0, 0], legSwing: [0, 0, 0, 0], eyes: 'open', look: [0, 0], mouth: 'none', goggles: -1, prop: 'none', glow: 0,
};

const BODY = { w: 5.96, h: 4.0, d: 2.4 };
const LEG_X = [-2.68, -1.68, 0.82, 1.82].map((x) => x + 0.25);   // from the PNG's leg columns
const LEG_Z = [0.42, -0.42, 0.42, -0.42];
const EYE_X = [-1.6, 1.9].map((x) => x - 0.05);

const mat = (c: string, e = 0, rough = 0.55) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0.05, emissive: c, emissiveIntensity: e });
const M = {
  body: mat(ORANGE), dark: new THREE.MeshStandardMaterial({ color: '#16110f', roughness: 0.3 }),
  lens: new THREE.MeshPhysicalMaterial({ color: '#7fe8ff', roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.55, emissive: '#2fb8d8', emissiveIntensity: 0.6 }),
  frame: new THREE.MeshStandardMaterial({ color: '#2a2d33', roughness: 0.35, metalness: 0.8 }),
  strap: new THREE.MeshStandardMaterial({ color: '#1c1f24', roughness: 0.8 }),
  brass: new THREE.MeshStandardMaterial({ color: '#caa45a', roughness: 0.3, metalness: 0.9 }),
  glass: new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0, transmission: 0.95, transparent: true, opacity: 0.25 }),
};

function EyesMesh({ eyes, look }: { eyes: Eyes; look: [number, number] }) {
  const z = BODY.d / 2 + 0.02, [lx, ly] = look;
  return (
    <group position={[lx * 0.25, 0.55 + ly * 0.2, z]}>
      {EYE_X.map((x, i) => {
        const s = i === 0 ? 1 : -1;
        if (eyes === 'happy') return (                                    // ^ ^
          <group key={i} position={[x, 0.1, 0]}>
            <mesh position={[-0.2, 0, 0]} rotation-z={0.75}><boxGeometry args={[0.62, 0.2, 0.06]} /><primitive object={M.dark} attach="material" /></mesh>
            <mesh position={[0.2, 0, 0]} rotation-z={-0.75}><boxGeometry args={[0.62, 0.2, 0.06]} /><primitive object={M.dark} attach="material" /></mesh>
          </group>
        );
        if (eyes === 'dizzy') return (                                    // x x
          <group key={i} position={[x, 0, 0]}>
            <mesh rotation-z={0.78}><boxGeometry args={[0.8, 0.16, 0.06]} /><primitive object={M.dark} attach="material" /></mesh>
            <mesh rotation-z={-0.78}><boxGeometry args={[0.8, 0.16, 0.06]} /><primitive object={M.dark} attach="material" /></mesh>
          </group>
        );
        const h = { open: 1, blink: 0.12, closed: 0.08, wide: 1.3, squint: 0.45, angry: 0.7 }[eyes];
        const w = eyes === 'wide' ? 0.62 : 0.5;
        return (
          <group key={i} position={[x, eyes === 'angry' ? -0.1 : 0, 0]} rotation-z={eyes === 'angry' ? s * -0.35 : 0}>
            <mesh scale={[w, h, 1]}><boxGeometry args={[1, 1, 0.06]} /><primitive object={M.dark} attach="material" /></mesh>
            {eyes === 'open' || eyes === 'wide' ? <mesh position={[0.1, 0.25 * h, 0.04]}><boxGeometry args={[0.14, 0.14, 0.02]} /><meshBasicMaterial color="#ffffff" /></mesh> : null}
          </group>
        );
      })}
    </group>
  );
}

function MouthMesh({ mouth }: { mouth: Mouth }) {
  if (mouth === 'none') return null;
  const z = BODY.d / 2 + 0.02;
  const g = { o: [0.5, 0.5], grin: [1.5, 0.32], smile: [1.0, 0.18], flat: [0.9, 0.12] }[mouth];
  return (
    <group position={[0.15, -0.55, z]}>
      <mesh scale={[g[0], g[1], 1]}><boxGeometry args={[1, 1, 0.06]} /><primitive object={M.dark} attach="material" /></mesh>
      {mouth === 'grin' ? <mesh position={[0, 0.06, 0.035]} scale={[1.3, 0.1, 1]}><boxGeometry args={[1, 1, 0.02]} /><meshBasicMaterial color="#fff6ee" /></mesh> : null}
    </group>
  );
}

function Goggles({ k }: { k: number }) {
  // slides from the forehead (k = 0) down over the eyes (k = 1)
  const y = 0.55 + (1 - k) * 1.15, z = BODY.d / 2 + 0.12;
  return (
    <group position={[0, y, 0]}>
      <mesh><boxGeometry args={[BODY.w + 0.12, 0.34, BODY.d + 0.12]} /><primitive object={M.strap} attach="material" /></mesh>
      {EYE_X.map((x) => (
        <group key={x} position={[x, 0, z]}>
          <mesh rotation-x={Math.PI / 2}><cylinderGeometry args={[0.78, 0.78, 0.32, 20]} /><primitive object={M.frame} attach="material" /></mesh>
          <mesh position={[0, 0, 0.17]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.62, 0.62, 0.04, 20]} /><primitive object={M.lens} attach="material" /></mesh>
        </group>
      ))}
      <mesh position={[(EYE_X[0] + EYE_X[1]) / 2, 0, z]}><boxGeometry args={[EYE_X[1] - EYE_X[0] - 1.4, 0.18, 0.2]} /><primitive object={M.frame} attach="material" /></mesh>
    </group>
  );
}

function Arm({ side, l, prop }: { side: -1 | 1; l: Limb; prop: Pose['prop'] }) {
  // shoulder pivot at the body side, arm points outward along ±x
  return (
    <group position={[side * BODY.w / 2, -0.5, 0]} rotation={[l.swing, 0, side * l.raise]}>
      <mesh position={[side * 0.5 * l.stretch, 0, 0]} scale={[l.stretch, 1, 1]} castShadow><boxGeometry args={[1, 1, 1.0]} /><primitive object={M.body} attach="material" /></mesh>
      {side === 1 && prop === 'magnifier' ? (
        <group position={[1.0 * l.stretch + 0.2, 0.2, 0.2]} rotation-z={-side * l.raise}>
          <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.14, 0.14, 1.6, 10]} /><primitive object={M.brass} attach="material" /></mesh>
          <group position={[0, 2.5, 0]}>
            <mesh><torusGeometry args={[1.05, 0.16, 12, 40]} /><primitive object={M.brass} attach="material" /></mesh>
            <mesh rotation-x={Math.PI / 2}><cylinderGeometry args={[1.0, 1.0, 0.05, 40]} /><primitive object={M.glass} attach="material" /></mesh>
          </group>
        </group>
      ) : null}
      {side === 1 && prop === 'baton' ? <mesh position={[1.1 * l.stretch, 0.8, 0]} rotation-z={0.3}><cylinderGeometry args={[0.07, 0.07, 2.2, 8]} /><meshStandardMaterial color="#f4efe6" /></mesh> : null}
      {side === -1 && prop === 'mic' ? (
        <group position={[-1.05 * l.stretch, 0.5, 0.3]}>
          <mesh><cylinderGeometry args={[0.12, 0.16, 1.1, 10]} /><primitive object={M.frame} attach="material" /></mesh>
          <mesh position={[0, 0.65, 0]}><sphereGeometry args={[0.3, 14, 10]} /><meshStandardMaterial color="#3a3f47" roughness={0.6} metalness={0.4} /></mesh>
        </group>
      ) : null}
    </group>
  );
}

export const Bot: React.FC<{ p: Pose; scale?: number }> = ({ p, scale = 1 }) => {
  const sx = 1 / Math.sqrt(p.squash);
  const legH = 0.96;
  return (
    <group position={p.pos} rotation={[p.rotX, p.rotY, p.rotZ]} scale={scale}>
      {/* the body sits on its legs; squash keeps the feet on the ground */}
      <group position={[0, legH + (BODY.h / 2) * p.squash, 0]} scale={[sx, p.squash, sx]}>
        <mesh castShadow receiveShadow material={p.glow > 0 ? mat(ORANGE, p.glow * 0.8) : M.body}><boxGeometry args={[BODY.w, BODY.h, BODY.d]} /></mesh>
        <EyesMesh eyes={p.eyes} look={p.look} />
        <MouthMesh mouth={p.mouth} />
        {p.goggles >= 0 ? <Goggles k={p.goggles} /> : null}
        <Arm side={-1} l={p.armL} prop={p.prop} />
        <Arm side={1} l={p.armR} prop={p.prop} />
      </group>
      {LEG_X.map((x, i) => (
        <group key={i} position={[x, legH + p.legs[i], LEG_Z[i]]} rotation-x={p.legSwing[i]}>
          <mesh position={[0, -legH / 2, 0]} castShadow><boxGeometry args={[0.5, legH, 0.6]} /><primitive object={M.body} attach="material" /></mesh>
          <mesh position={[0, -legH + 0.06, 0.08]} castShadow><boxGeometry args={[0.6, 0.12, 0.78]} /><meshStandardMaterial color="#b85f42" roughness={0.6} /></mesh>
        </group>
      ))}
    </group>
  );
};
