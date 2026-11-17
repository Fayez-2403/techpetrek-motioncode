// Camera bookmarks. In the lab a bookmark eases the camera there (OrbitControls stays live); in the reel the timeline
// poses the camera every frame (reelCam), so a frame is a pure function of t.
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, type CamPreset } from '../store';
import { deckNodes } from '../engineering/loadDistribution';
import { canyonCenter } from './terrain';

type Pose = { pos: [number, number, number]; look: [number, number, number]; fov: number };
export const reelCam: { pose: Pose | null } = { pose: null };

export function presetPose(p: CamPreset, span: number, truckX: number, env: string): Pose {
  const s = span / 48;
  if (env !== 'gorge') {
    const city: Record<string, Pose> = {
      hero: { pos: [-22, 5, 21], look: [0, 1, 0], fov: 45 }, under: { pos: [4, -3.2, 13], look: [0, 0.5, 0], fov: 52 },
      xray: { pos: [0, 2, 40], look: [0, 1, 0], fov: 36 }, sunset: { pos: [60, 12, 70], look: [-10, 14, 0], fov: 44 },
    };
    return city[p] ?? city.hero;
  }
  switch (p) {
    case 'under': return { pos: [7 * s, -10, 15], look: [0, 3, 0], fov: 52 };
    case 'macro': return { pos: [-span / 2 + 3.2, -1.4, 9.8], look: [-span / 2 + 7, 0.6, 4.6], fov: 38 };
    case 'xray': return { pos: [0, 3.5, 64 * s], look: [0, 3, 0], fov: 32 };
    case 'vehicle': return { pos: [truckX - 15, 6.5, 13], look: [truckX + 4, 1.5, 0], fov: 50 };
    case 'gorge': return { pos: [canyonCenter(105), -50, 105], look: [0, -4, 0], fov: 50 };
    case 'sunset': return { pos: [52 * s, 12, 60 * s], look: [-4, 3, -6], fov: 42 };
    default: return { pos: [-30 * s, 7, 27 * s], look: [2, 2, 0], fov: 46 };
  }
}

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

export function CameraDirector() {
  const { camera } = useThree(), cam = camera as THREE.PerspectiveCamera;
  const ctrl = useRef<any>(null);
  const nonce = useStore((s) => s.camNonce), dragging = useStore((s) => s.dragging), reel = useStore((s) => s.reel);
  const follow = useStore((s) => s.follow && s.mode === 'arcade' && s.arcade.armed);
  const tween = useRef<{ t: number; from: Pose; to: Pose } | null>(null);
  useEffect(() => {
    const s = useStore.getState(), d = deckNodes(s.model.nodes), span = d[d.length - 1].x;
    const to = presetPose(s.cam, span, s.design.loads.vehicle.x - span / 2, s.env);
    const tgt = ctrl.current?.target ?? new THREE.Vector3();
    const from: Pose = { pos: cam.position.toArray() as Pose['pos'], look: tgt.toArray(), fov: cam.fov };
    tween.current = { t: s.reducedMotion || nonce === 0 ? 1 : 0, from, to };
  }, [nonce]);
  useFrame((_, dt) => {
    if (reel && reelCam.pose) {
      const p = reelCam.pose; cam.position.set(...p.pos); cam.lookAt(...p.look);
      if (cam.fov !== p.fov) { cam.fov = p.fov; cam.updateProjectionMatrix(); }
      return;
    }
    const tw = tween.current; if (!tw || !ctrl.current) return;
    tw.t = Math.min(1, tw.t + dt / 1.4);
    const u = ease(tw.t), L = (a: number[], b: number[]) => a.map((v, i) => v + (b[i] - v) * u) as [number, number, number];
    cam.position.set(...L(tw.from.pos, tw.to.pos)); ctrl.current.target.set(...L(tw.from.look, tw.to.look));
    cam.fov = tw.from.fov + (tw.to.fov - tw.from.fov) * u; cam.updateProjectionMatrix();
    ctrl.current.update();
    if (tw.t >= 1) tween.current = null;
  });
  if (reel || follow) return null;
  return <OrbitControls ref={ctrl} makeDefault enabled={!dragging} enableDamping dampingFactor={0.08} maxDistance={420} minDistance={4} maxPolarAngle={Math.PI * 0.62} />;
}
