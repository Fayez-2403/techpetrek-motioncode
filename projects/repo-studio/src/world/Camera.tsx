// Poses the default R3F camera for this frame (Remotion renders one frame per render, so this is pure in t).
import React, { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export type CamPose = { pos: [number, number, number]; look: [number, number, number]; fov?: number; roll?: number };
export const Cam: React.FC<CamPose> = ({ pos, look, fov = 45, roll = 0 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...pos); camera.up.set(Math.sin(roll), Math.cos(roll), 0); camera.lookAt(...look);
    camera.fov = fov; camera.near = 0.1; camera.far = 500; camera.updateProjectionMatrix();
  });
  return null;
};
