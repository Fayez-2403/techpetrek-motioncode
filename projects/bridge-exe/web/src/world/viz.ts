// Shared visual state between the solver results and the meshes. Truss coordinates (x along the span from the pin,
// y up from the deck chord) map to world X = x − span/2, Y = y, Z = ±HALF_W (the two truss planes).
// `viz.k` blends undeformed -> deformed (0..1); the app eases it, the reel sets it from the timeline.
import * as THREE from 'three';
import type { Lens } from '../store';
import type { MemberResult, SolveOk, TrussModel } from '../engineering/types';

export const HALF_W = 4.6;
export const viz = { k: 0, lensMix: 1, pulse: -1, xray: 0 };

export const PAL = {
  steel: new THREE.Color('#7f8fa0'),
  tension: new THREE.Color('#63E5FA'),
  compression: new THREE.Color('#FF6C70'),
  neutral: new THREE.Color('#8a96a3'),
  amber: new THREE.Color('#F5A64D'),
  emerald: new THREE.Color('#58D6AF'),
  slate: new THREE.Color('#2a4058'),
  white: new THREE.Color('#E8F3F7'),
  dirty: new THREE.Color('#5d6670'),
};

export function nodeWorld(model: TrussModel, result: SolveOk | null, k: number, mag: number) {
  const span = Math.max(...model.nodes.map((n) => n.x));
  const disp = new Map(result?.nodes.map((n) => [n.id, n]) ?? []);
  const out = new Map<string, { x: number; y: number }>();
  for (const n of model.nodes) {
    const d = disp.get(n.id);
    out.set(n.id, { x: n.x - span / 2 + (d ? d.ux_m * mag * k : 0), y: n.y + (d ? d.uy_m * mag * k : 0) });
  }
  return { span, pos: out };
}

const tmp = new THREE.Color();
/** member colour for a lens. Axial: compression red, tension cyan, scaled by |N| / max; neutral below 2 % of max. */
export function memberColor(lens: Lens, m: MemberResult | undefined, r: SolveOk | null, fresh: boolean, out: THREE.Color, dispMag = 0) {
  if (lens === 'real' || !m || !r) return out.copy(PAL.steel);
  if (!fresh) return out.copy(PAL.dirty);
  if (lens === 'axial' || lens === 'path') {
    const rel = Math.abs(m.axial_N) / Math.max(r.metrics.maxAbsAxial_N, 1e-9);
    if (rel < 0.02) return out.copy(PAL.neutral);
    return out.copy(PAL.neutral).lerp(m.axial_N > 0 ? PAL.tension : PAL.compression, Math.min(1, 0.25 + rel * 0.9));
  }
  if (lens === 'util') {
    const u = m.utilization;
    if (u < 0.5) return out.copy(PAL.slate).lerp(PAL.emerald, u / 0.5);
    if (u < 0.8) return out.copy(PAL.emerald).lerp(PAL.amber, (u - 0.5) / 0.3);
    return out.copy(PAL.amber).lerp(PAL.compression, Math.min(1, (u - 0.8) / 0.2));
  }
  // deform: colour by displacement magnitude of the member's midpoint, relative to the run's max
  const t = Math.min(1, dispMag / Math.max(r.metrics.maxAbsDisplacement_m, 1e-12));
  return out.copy(tmp.set('#1f4e79')).lerp(PAL.tension, Math.min(1, t * 1.6)).lerp(PAL.amber, Math.max(0, t - 0.6) / 0.4);
}

const up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), dir = new THREE.Vector3(), mid = new THREE.Vector3(), sc = new THREE.Vector3();
/** cylinder (unit radius, unit height along +Y, centred) from a to b */
export function segMatrix(a: THREE.Vector3, b: THREE.Vector3, r: number, out: THREE.Matrix4, rz = r) {
  dir.subVectors(b, a); const len = dir.length();
  q.setFromUnitVectors(up, len > 1e-9 ? dir.normalize() : up);
  mid.addVectors(a, b).multiplyScalar(0.5); sc.set(r, len, rz);
  return out.compose(mid, q, sc);
}
