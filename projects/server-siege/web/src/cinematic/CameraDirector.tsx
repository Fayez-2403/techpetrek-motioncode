// Camera modes for the app (overview / follow / bottleneck / orbit / cinematic), eased toward their targets, and the
// reel's camera, which is a pure function of reel time (keyframes in Timeline.ts) so every captured frame is exact.
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useStore, type CamMode } from '../store';
import { POS, recent } from '../world/layout';
import { vclock } from '../world/clock';
import { VIEW_SHIFT, reelCamera, reelClock } from './Timeline';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** the shot a mode wants right now: [camera position, look-at] */
function shot(mode: CamMode, t: number): [THREE.Vector3, THREE.Vector3] {
  const S = useStore.getState().sim;
  switch (mode) {
    case 'follow': {                                    // ride along the request path, gateway -> LB -> towers -> DB, on a loop
      const path = [V(-44, 6, 6), V(-27, 7, 7), V(-11, 8, 7), V(4, 10, 9), V(24, 12, 9)];
      const u = (t * 0.05) % 1, k = u * (path.length - 1), i = Math.floor(k), f = k - i;
      const pos = path[i].clone().lerp(path[Math.min(path.length - 1, i + 1)], f);
      return [pos, pos.clone().add(V(10, -4, -7))];
    }
    case 'bottleneck': {                                // whichever tier is the most utilized
      const app = recent(S, (s) => s.appUtil), db = recent(S, (s) => s.dbUtil), job = recent(S, (s) => s.jobUtil);
      const tgt = db >= app && db >= job ? POS.db : app >= job ? POS.district : POS.workers;
      return [tgt.clone().add(V(-12, 13, 18)), tgt.clone().add(V(0, 4, 0))];
    }
    case 'cinematic': {
      const a = t * 0.06;
      return [V(Math.cos(a) * 58, 30 + 6 * Math.sin(t * 0.11), Math.sin(a) * 50), V(0, 2, 0)];
    }
    default:
      return [V(-10, 46, 58), V(2, 0, 0)];
  }
}

export function CameraDirector() {
  const { camera, size } = useThree();
  const mode = useStore((s) => s.cam), reel = useStore((s) => s.reel);
  const look = useRef(V(2, 0, 0)), pos = useMemo(() => V(0, 0, 0), []), tgt = useMemo(() => V(0, 0, 0), []);
  useFrame((_, dt) => {
    if (reel) {
      const k = reelCamera(reelClock.t);
      camera.position.copy(k.pos); camera.lookAt(k.look);
      const pc = camera as THREE.PerspectiveCamera;
      pc.fov = k.fov;
      pc.setViewOffset(size.width, size.height, 0, size.height * VIEW_SHIFT, size.width, size.height);   // frame centre 12 % higher
      pc.updateProjectionMatrix();
      return;
    }
    if (mode === 'orbit') return;
    const [p, l] = shot(mode, vclock.t);
    const a = 1 - Math.exp(-dt * 2.2);
    pos.copy(camera.position).lerp(p, a); tgt.copy(look.current).lerp(l, a);
    camera.position.copy(pos); look.current.copy(tgt); camera.lookAt(tgt);
  });
  return mode === 'orbit' && !reel ? <OrbitControls makeDefault target={look.current} maxPolarAngle={Math.PI * 0.47} minDistance={12} maxDistance={140} /> : null;
}
