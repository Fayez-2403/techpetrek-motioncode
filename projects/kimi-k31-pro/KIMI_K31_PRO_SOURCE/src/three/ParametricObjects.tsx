// Two parametric objects for the CAD lab's quick beats: an architectural tower whose floors twist with a parameter, and
// a configurable desk lamp (arm angle, shade size). White-clay / dark-metal model look with crisp CAD edges.
import React, { useMemo } from 'react';
import * as THREE from 'three';

const clay = () => new THREE.MeshStandardMaterial({ color: '#E9ECF1', roughness: 0.62, metalness: 0.02 });
const edge = (c = '#5CE1FF', o = 0.55) => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o });

export const Tower: React.FC<{ twist: number; floors?: number; draw?: number }> = ({ twist, floors = 26, draw = 1 }) => {
  const { slab, slabEdges, core, mat, em } = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 0.05, 0.62);
    return { slab: g, slabEdges: new THREE.EdgesGeometry(g), core: new THREE.BoxGeometry(0.26, 1, 0.26), mat: clay(), em: edge() };
  }, []);
  const n = Math.round(floors * draw);
  return (
    <group>
      <mesh geometry={core} material={mat} position={[0, (floors * 0.085) / 2, 0]} scale={[1, floors * 0.085, 1]} />
      {Array.from({ length: n }, (_, i) => {
        const u = i / (floors - 1), s = 1 - 0.32 * u;
        return (
          <group key={i} position={[0, i * 0.085, 0]} rotation={[0, u * twist, 0]} scale={[s, 1, s]}>
            <mesh geometry={slab} material={mat} />
            <lineSegments geometry={slabEdges} material={em} />
          </group>
        );
      })}
    </group>
  );
};

export const Lamp: React.FC<{ arm: number; shade: number }> = ({ arm, shade }) => {
  const m = useMemo(() => ({
    metal: new THREE.MeshPhysicalMaterial({ color: '#2C323D', metalness: 0.9, roughness: 0.3, clearcoat: 0.8 }),
    accent: new THREE.MeshPhysicalMaterial({ color: '#FFB547', metalness: 0.6, roughness: 0.35 }),
    bulb: new THREE.MeshBasicMaterial({ color: '#FFE7B8', toneMapped: false }),
    shadeG: (() => { const g = new THREE.LatheGeometry([new THREE.Vector2(0.06, 0), new THREE.Vector2(0.12, -0.05), new THREE.Vector2(0.3, -0.26), new THREE.Vector2(0.31, -0.27)], 64); return g; })(),
  }), []);
  const a1 = -0.35 + arm * 0.5, a2 = 1.1 - arm * 0.9;
  return (
    <group>
      <mesh material={m.metal} position={[0, 0.03, 0]}><cylinderGeometry args={[0.34, 0.38, 0.06, 64]} /></mesh>
      <group position={[0, 0.06, 0]} rotation={[0, 0, a1]}>
        <mesh material={m.metal} position={[0, 0.5, 0]}><boxGeometry args={[0.05, 1, 0.05]} /></mesh>
        <mesh material={m.accent} position={[0, 1, 0]}><sphereGeometry args={[0.06, 32, 16]} /></mesh>
        <group position={[0, 1, 0]} rotation={[0, 0, a2]}>
          <mesh material={m.metal} position={[0, 0.42, 0]}><boxGeometry args={[0.045, 0.84, 0.045]} /></mesh>
          <group position={[0, 0.84, 0]} rotation={[0, 0, -a1 - a2 - 0.6]} scale={0.7 + shade * 0.6}>
            <mesh geometry={m.shadeG} material={m.metal} />
            <mesh material={m.bulb} position={[0, -0.1, 0]}><sphereGeometry args={[0.05, 16, 12]} /></mesh>
          </group>
        </group>
      </group>
    </group>
  );
};
