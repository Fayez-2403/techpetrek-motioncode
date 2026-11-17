// The hook's world: a vertical wall of five monitors (2 / 1 / 2, built for a 9:16 frame), every one showing the same
// vibecoded screen (unslop's own example, public/pages/example_dashboard.png). The middle one lands first (frame 0 is never
// empty), then the top pair, then the bottom pair, on the beat. Then the camera pushes into the middle screen until 760 css
// px of it span the frame, which is exactly where the 2D cut picks it up. Pure in t.
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { E, lerp, lin } from '../reel/time';

export const SCREEN = { w: 1.56, h: 0.975, y: 1.95 };   // plane size (16:10 like the 1440x900 capture); y = the hero's centre
export const LAND = [-0.15, 0.34, 0.34, 0.68, 0.68];     // landing times per monitor (centre first and already landing at frame 0)
const ORDER = [2, 0, 1, 3, 4];
const POS = (i: number) => [{ x: -0.83, y: 3.06, ry: 0.12 }, { x: 0.83, y: 3.06, ry: -0.12 }, { x: 0, y: SCREEN.y, ry: 0 }, { x: -0.83, y: 0.84, ry: 0.12 }, { x: 0.83, y: 0.84, ry: -0.12 }][i];

export function useTexture(file: string) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const [h] = useState(() => delayRender('tex ' + file));
  useEffect(() => {
    new THREE.TextureLoader().load(staticFile(file), (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; setTex(t); continueRender(h); }, undefined, () => continueRender(h));
  }, [file, h]);
  return tex;
}

function Cam({ pos, look, fov }: { pos: number[]; look: number[]; fov: number }) {
  const cam = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => { cam.position.set(pos[0], pos[1], pos[2]); cam.fov = fov; cam.near = 0.05; cam.far = 60; cam.lookAt(look[0], look[1], look[2]); cam.updateProjectionMatrix(); });
  return null;
}

function Monitor({ tex, k, i }: { tex: THREE.Texture; k: number; i: number }) {
  const p = POS(i), s = lerp(1.3, 1, E.out(k)), z = (1 - E.out(k)) * 1.2, back = i === 2 ? 0 : -0.25;
  if (k <= 0) return null;
  return (
    <group position={[p.x, p.y, back + z]} rotation-y={p.ry} scale={s}>
      <mesh position={[0, 0, -0.03]}><boxGeometry args={[SCREEN.w + 0.07, SCREEN.h + 0.07, 0.05]} /><meshStandardMaterial color="#1b1b1e" metalness={0.6} roughness={0.35} /></mesh>
      <mesh position={[0, 0, 0.001]}><planeGeometry args={[SCREEN.w, SCREEN.h]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
    </group>
  );
}

/** the 2D cut's view of the screen: css point (cx, cy) of the 1440x900 capture at the frame centre, 760 css px wide */
export const CUT = { cx: 600, cy: 296, cssW: 760 };

export const MonitorWall: React.FC<{ t: number; tex: THREE.Texture; t1: number }> = ({ t, tex, t1 }) => {
  // camera: a slow truck along the row while they land, then the push into the centre screen (ends at the cut)
  const push = E.inout(lin(t, 1.45, t1));
  const fov = 40, hf = 2 * Math.atan(Math.tan((fov / 2) * Math.PI / 180) * (1080 / 1920));
  const dEnd = ((CUT.cssW / 1440) * SCREEN.w) / 2 / Math.tan(hf / 2);
  const tx = (CUT.cx / 1440 - 0.5) * SCREEN.w, ty = SCREEN.y + (0.5 - CUT.cy / 900) * SCREEN.h;   // the hero sits at z 0
  const a = [lerp(-0.25, 0.15, E.out(lin(t, 0, 1.45))), 2.22, 8.2], b = [tx, ty, dEnd];
  const pos = [lerp(a[0], b[0], push), lerp(a[1], b[1], push), lerp(a[2], b[2], push)];
  const look = [lerp(0, tx, push), lerp(2.25, ty, push), 0];
  return (
    <>
      <Cam pos={pos} look={look} fov={fov} />
      <ambientLight intensity={0.5} color="#b9a8ff" />
      <directionalLight position={[2, 5, 4]} intensity={1.6} color="#ffffff" castShadow />
      <pointLight position={[0, 2.2, 2.4]} intensity={8} distance={8} color="#8b5cf6" />
      {ORDER.map((i, n) => <Monitor key={i} i={i} tex={tex} k={lin(t, LAND[n], LAND[n] + 0.24)} />)}
    </>
  );
};
