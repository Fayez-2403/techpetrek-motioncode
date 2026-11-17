// A procedural 3D person (vendored zach-d-films rig, src/vendor/zach): posed every frame from a joint map, pure in t.
// We dress it as a developer: a dark hoodie colour per person. Poses below are in the rig's YXZ euler radians.
import React, { useMemo } from 'react';
import * as THREE from 'three';
// @ts-expect-error vendored JS module
import { makeHuman } from '../vendor/zach/human.js';

export type Joints = Record<string, [number, number, number] | number>;
export const SIT: Joints = {
  drop: -0.43, lHip: [-1.5, 0, 0.06], rHip: [-1.5, 0, -0.06], lKn: [1.45, 0, 0], rKn: [1.45, 0, 0], lAn: [0.05, 0, 0], rAn: [0.05, 0, 0],
  lSh: [-0.95, 0.15, 0.18], rSh: [-0.95, -0.15, -0.18], lEl: [-0.75, 0, 0], rEl: [-0.75, 0, 0], chest: [0.12, 0, 0], neck: [0.12, 0, 0],
};
export const STAND: Joints = { lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07] };
/** typing: hands bob alternately; a little head nod */
export const typing = (t: number): Joints => {
  const a = Math.sin(t * 22) * 0.06, b = Math.sin(t * 19 + 1) * 0.06;
  return { ...SIT, lEl: [-0.75 + a, 0, 0], rEl: [-0.75 + b, 0, 0], neck: [0.16 + Math.sin(t * 3) * 0.03, 0, 0] };
};
/** recoil from the screen: lean back, hands up, head back */
export const recoil = (k: number): Joints => ({
  ...SIT, chest: [0.12 - 0.35 * k, 0, 0], neck: [0.12 - 0.3 * k, 0, 0], lSh: [-0.95 - 0.9 * k, 0.15, 0.18 + 0.4 * k], rSh: [-0.95 - 0.9 * k, -0.15, -0.18 - 0.4 * k],
  lEl: [-0.75 - 0.9 * k, 0, 0], rEl: [-0.75 - 0.9 * k, 0, 0],
});
export const mixJ = (a: Joints, b: Joints, k: number): Joints => {
  const o: Joints = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const va = a[key] ?? (key === 'drop' ? 0 : [0, 0, 0]), vb = b[key] ?? (key === 'drop' ? 0 : [0, 0, 0]);
    o[key] = typeof va === 'number' ? (va as number) + ((vb as number) - (va as number)) * k : (va as number[]).map((x, i) => x + ((vb as number[])[i] - x) * k) as [number, number, number];
  }
  return o;
};

export const Person: React.FC<{ pose: Joints; mouth?: number; hoodie?: string } & React.JSX.IntrinsicElements['group']> = ({ pose, mouth = 0, hoodie = '#24304a', ...g }) => {
  const h = useMemo(() => {
    const hu = makeHuman('dev');
    hu.root.traverse((o: THREE.Object3D) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (m && m.color && m.color.getHex() === 0x1d1d20) { (o as THREE.Mesh).material = m.clone(); ((o as THREE.Mesh).material as THREE.MeshStandardMaterial).color.set(hoodie); }
    });
    return hu;
  }, [hoodie]);
  h.setPose(pose); h.setMouth(mouth);
  return <group {...g}><primitive object={h.root} /></group>;
};
