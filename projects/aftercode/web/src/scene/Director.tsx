// Virtual cinematography. A shot = camera position + look target + fov, as a pure function of the beat position b.
// Auto director: cuts only on 4-bar phrase lines (never every beat), picks wide coverage when several dancers move in
// sync or at a drop, and keeps every performer in frame (framing from the crew's width). Kicks add a tiny camera
// micro-impact; motion stays slow (no whip pans) to avoid motion sickness.
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getState, type CameraId } from '../state';
import { AF } from './af';

const SHOTS: Exclude<CameraId, 'director'>[] = ['front', 'orbit', 'low', 'track', 'crane', 'close', 'concert', 'wide'];
const h = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export function shotFor(preset: CameraId, b: number, n: number, kind: string): { id: Exclude<CameraId, 'director'>; start: number } {
  if (preset !== 'director') return { id: preset, start: 0 };
  const block = Math.floor(b / 16), start = block * 16;
  if (AF.drop && n > 1) return { id: block % 2 ? 'concert' : 'wide', start };
  if (n > 2 && (kind === 'chorus' || kind === 'buildup')) return { id: (['wide', 'orbit', 'crane', 'wide'] as const)[block % 4], start };
  const pool = n > 2 ? (['wide', 'orbit', 'low', 'crane', 'track', 'concert'] as const) : (['front', 'orbit', 'low', 'close', 'track', 'crane', 'concert'] as const);
  return { id: pool[Math.floor(h(block) * pool.length)], start };
}

export function framing(id: Exclude<CameraId, 'director'>, u: number, width: number, vertical: boolean) {
  const W = Math.max(1.6, width + 1.4) * (vertical ? 1.7 : 1), dist = 2.6 + W * 0.95, y = 1.05;
  const P = new THREE.Vector3(), T = new THREE.Vector3(0, 0.95, 0); let fov = 38;
  switch (id) {
    case 'front': P.set(Math.sin(u * 0.15) * 0.4, y + 0.2, dist); break;
    case 'orbit': { const a = 0.55 + u * 0.35; P.set(Math.sin(a) * dist, y + 0.45, Math.cos(a) * dist); break; }
    case 'low': P.set(-0.5 + u * 1.0, 0.32, dist * 0.82); T.y = 1.25; fov = 44; break;
    case 'track': P.set(-dist * 0.75 + u * dist * 0.6, y + 0.1, dist * 0.7); break;
    case 'crane': P.set(0.3, 0.5 + u * 2.4, dist * (0.95 + u * 0.25)); T.y = 0.9 - u * 0.15; break;
    case 'close': P.set(0.25, 1.55, 1.55 + width * 0.2); T.set(0, 1.45, 0); fov = 30; break;
    case 'wide': P.set(Math.sin(u * 0.3) * 0.8, y + 0.9, dist * 1.2); T.y = 0.85; fov = 40; break;
    case 'concert': { const a = -0.9 + u * 1.8; P.set(Math.sin(a) * dist * 1.05, 2.1 + Math.sin(u * 3) * 0.2, Math.cos(a) * dist * 1.05); fov = 42; break; }
  }
  return { P, T, fov };
}

/** set by the reel module: a scripted camera (pure function of reel time) that replaces the director */
export const reelCam: { fn: null | ((cam: THREE.PerspectiveCamera) => void) } = { fn: null };
export const Director: React.FC<{ override?: (cam: THREE.PerspectiveCamera) => boolean }> = ({ override }) => {
  const { camera } = useThree();
  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (override && override(cam)) return;
    if (reelCam.fn) { reelCam.fn(cam); return; }
    const s = getState(), n = s.performers.length;
    const kind = n === 1 ? 'solo' : n === 2 ? s.duoMode : s.crewMode;
    const sh = shotFor(s.camera, AF.b, n, kind);
    const u = Math.min(1, (AF.b - sh.start) / 16);
    const width = n <= 1 ? 0 : (n - 1) * 1.15;
    const f = framing(sh.id, s.camera === 'director' ? u : (AF.t * 0.02) % 1, width, s.vertical);
    const punch = AF.kick * 0.035;
    cam.position.copy(f.P).add(new THREE.Vector3(0, punch * 0.6, -punch * 2));
    cam.lookAt(f.T); cam.fov = f.fov - AF.kick * 0.8; cam.updateProjectionMatrix();
  });
  return null;
};
