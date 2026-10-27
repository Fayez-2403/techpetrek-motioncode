// Shared Three.js stage: a ThreeCanvas the size of the frame, a studio environment map for controlled reflections,
// and a camera rig driven by props (so the camera is a pure function of the frame, like everything else).
import React, { useLayoutEffect, useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { useFrameSize } from '../lib/layout';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type V3 = [number, number, number];

export const ThreeStage: React.FC<{ children: React.ReactNode; exposure?: number; style?: React.CSSProperties; fog?: [string, number, number]; width?: number; height?: number }> = ({ children, exposure = 1, style, fog, width: w, height: h }) => {
  const cfg = useFrameSize();
  const width = w ?? cfg.width, height = h ?? cfg.height;
  return (
    <ThreeCanvas width={width} height={height} style={{ position: 'absolute', inset: 0, ...style }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
      camera={{ fov: 35, near: 0.05, far: 2000, position: [0, 0, 10] }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = exposure; gl.setClearColor(0x000000, 0); }}>
      {fog ? <fog attach="fog" args={fog} /> : null}
      {children}
    </ThreeCanvas>
  );
};

/** studio reflections (generated, no image files) */
export const Env: React.FC<{ intensity?: number }> = ({ intensity = 1 }) => {
  const { gl, scene } = useThree();
  const tex = useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const t = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    return t;
  }, [gl]);
  useLayoutEffect(() => {
    scene.environment = tex;
    scene.environmentIntensity = intensity;
    return () => { scene.environment = null; };
  }, [scene, tex, intensity]);
  return null;
};

/** places the camera every frame. `roll` in radians. */
export const CamRig: React.FC<{ pos: V3; target: V3; fov?: number; roll?: number; up?: V3; viewOffsetY?: number; shiftX?: number }> = ({ pos, target, fov = 35, roll = 0, up, viewOffsetY = 0, shiftX = 0 }) => {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(...pos);
    if (up) cam.up.set(...up).normalize(); else cam.up.set(Math.sin(roll), Math.cos(roll), 0);
    cam.lookAt(...target);
    cam.fov = fov;
    cam.aspect = size.width / size.height;
    if (viewOffsetY || shiftX) cam.setViewOffset(size.width, size.height, -shiftX * size.width, viewOffsetY * size.height, size.width, size.height);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
  });
  return null;
};

/** camera distance that keeps a subject of height `h` filling the frame at a given fov (dolly zoom / ortho-to-perspective) */
export const fitDistance = (h: number, fovDeg: number) => h / (2 * Math.tan((fovDeg * Math.PI) / 360));

/** point on a sphere around `c` */
export const orbit = (c: V3, r: number, yaw: number, pitch: number): V3 => [c[0] + r * Math.cos(pitch) * Math.sin(yaw), c[1] + r * Math.sin(pitch), c[2] + r * Math.cos(pitch) * Math.cos(yaw)];

/** screen position (px) of a world point for the camera CamRig would build from the same props */
export function project(p: V3, cam: { pos: V3; target: V3; fov: number; up?: V3; shiftX?: number; viewOffsetY?: number }, w: number, h: number): [number, number, boolean] {
  const c = new THREE.PerspectiveCamera(cam.fov, w / h, 0.05, 2000);
  c.position.set(...cam.pos);
  c.up.set(...(cam.up ?? [0, 1, 0])).normalize();
  c.lookAt(...cam.target);
  c.updateMatrixWorld(); c.updateProjectionMatrix();
  const v = new THREE.Vector3(...p).project(c);
  return [(v.x * 0.5 + 0.5) * w + (cam.shiftX ?? 0) * w, (-v.y * 0.5 + 0.5) * h - (cam.viewOffsetY ?? 0) * h, v.z < 1];
}
