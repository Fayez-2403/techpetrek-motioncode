// The celestial arrow: an ebony shaft with gold bands, a faceted gold head, glowing vanes, and per-mode trails.
import * as THREE from 'three';
import { ARROW_LEN } from '../core/bowrig';
import type { Projectile } from '../core/projectile';
import { MODES, type ModeId } from '../core/config';
import { Ribbon } from './fx';
import { hashi } from '../core/noise';

export interface ArrowMesh { group: THREE.Group; setMode(core: THREE.Color, k: number): void }

const shaftMat = new THREE.MeshPhysicalMaterial({ color: 0x15100d, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2 });
const bandMat = new THREE.MeshPhysicalMaterial({ color: 0xf0bd5a, metalness: 1, roughness: 0.25 });

/** Arrow along -z: nock at z = 0, tip at z = -ARROW_LEN. */
export function buildArrow(): ArrowMesh {
  const g = new THREE.Group();
  const head = new THREE.MeshPhysicalMaterial({ color: 0xf6cd6e, metalness: 1, roughness: 0.18, emissive: new THREE.Color(1, 0.7, 0.3), emissiveIntensity: 1 });
  const vane = new THREE.MeshStandardMaterial({ color: 0x221508, emissive: new THREE.Color(1, 0.7, 0.3), emissiveIntensity: 1.2, side: THREE.DoubleSide, roughness: 0.6 });
  const core = new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 1.5, 0.6), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0052, 0.0056, ARROW_LEN - 0.1, 10), shaftMat);
  shaft.rotation.x = Math.PI / 2; shaft.position.z = -(ARROW_LEN - 0.1) / 2 - 0.01; shaft.castShadow = true; g.add(shaft);
  for (const z of [0.05, 0.19, 0.6, 0.8]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.0064, 0.0064, 0.012, 10), bandMat); b.rotation.x = Math.PI / 2; b.position.z = -z; g.add(b); }
  // faceted head: a long four-sided bipyramid
  const hg = new THREE.BufferGeometry();
  const L = ARROW_LEN, tip = [0, 0, -L], back = -L + 0.105, mid = -L + 0.05;
  const v = [tip, [0.017, 0, mid], [0, 0.0065, mid], [-0.017, 0, mid], [0, -0.0065, mid], [0, 0, back]];
  const f = [[0, 2, 1], [0, 3, 2], [0, 4, 3], [0, 1, 4], [5, 1, 2], [5, 2, 3], [5, 3, 4], [5, 4, 1]];
  hg.setAttribute('position', new THREE.Float32BufferAttribute(f.flat().flatMap((i) => v[i]!), 3)); hg.computeVertexNormals();
  const hm = new THREE.Mesh(hg, head); hm.castShadow = true; g.add(hm);
  // three vanes
  const vs = new THREE.Shape(); vs.moveTo(0, 0); vs.bezierCurveTo(0.03, 0.026, 0.09, 0.03, 0.135, 0.022); vs.lineTo(0.14, 0); vs.lineTo(0, 0);
  const vg = new THREE.ShapeGeometry(vs, 8);
  for (let k = 0; k < 3; k++) {
    const m = new THREE.Mesh(vg, vane);
    const holder = new THREE.Group(); holder.rotation.z = (k / 3) * Math.PI * 2 + 0.4; g.add(holder);
    m.rotation.y = -Math.PI / 2; m.position.set(0, 0.0052, 0.02 - 0.18); holder.add(m);
  }
  const nock = new THREE.Mesh(new THREE.CylinderGeometry(0.0068, 0.006, 0.018, 10), bandMat); nock.rotation.x = Math.PI / 2; nock.position.z = -0.006; g.add(nock);
  const glow = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, ARROW_LEN * 0.92, 4, 8), core); glow.rotation.x = Math.PI / 2; glow.position.z = -ARROW_LEN / 2; g.add(glow);
  return {
    group: g,
    setMode(c: THREE.Color, k: number) {
      head.emissive.copy(c).multiplyScalar(0.22); head.emissiveIntensity = 0.6 + k * 0.6;
      vane.emissive.copy(c).multiplyScalar(0.25); vane.emissiveIntensity = 0.8 + k;
      core.color.copy(c).multiplyScalar(0.12 * k); core.opacity = Math.min(0.45, 0.1 + 0.08 * k);
    },
  };
}

/** A flying arrow's mesh and trails. */
export class FlightView {
  arrow = buildArrow(); main = new Ribbon(90); halo = new Ribbon(90); extra: Ribbon[] = [];
  group = new THREE.Group();
  constructor() {
    this.group.add(this.arrow.group, this.main.mesh, this.halo.mesh);
    for (let i = 0; i < 3; i++) { const r = new Ribbon(90); this.extra.push(r); this.group.add(r.mesh); }
  }
  update(a: Projectile, alpha: number, t: number, cam: THREE.Vector3) {
    const M = MODES[a.mode as ModeId], core = new THREE.Color(...M.core), trail = new THREE.Color(...M.trail);
    const p = a.stuck ? a.p : [a.prevP[0] + (a.p[0] - a.prevP[0]) * alpha, a.prevP[1] + (a.p[1] - a.prevP[1]) * alpha, a.prevP[2] + (a.p[2] - a.prevP[2]) * alpha];
    const dir = a.stuck ? a.stuck.dir : a.dir;
    const since = a.stuck ? t - a.stuck.t : 0;
    // a lodged arrow glows on, then dissolves into light after 2.5 s
    const vis = !a.stuck || since < 2.5;
    this.arrow.group.visible = vis && (a.alive || !!a.stuck);
    // position: the projectile tracks the tip; the mesh's origin is the nock
    this.arrow.group.position.set(p[0]! - dir[0] * ARROW_LEN, p[1]! - dir[1] * ARROW_LEN, p[2]! - dir[2] * ARROW_LEN);
    this.arrow.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), new THREE.Vector3(dir[0], dir[1], dir[2]));
    this.arrow.setMode(core, a.stuck ? 3 * Math.max(0, 1 - since / 2.5) : 3.2);
    // trail: the last 0.45 s of the tip's path, fading after the hit
    const fade = a.stuck ? Math.max(0, 1 - since / 0.6) : a.alive ? 1 : 0;
    const pts = a.trail.slice(-3 * 60);
    if (fade <= 0 || pts.length < 6) { this.main.hide(); this.halo.hide(); for (const r of this.extra) r.hide(); return; }
    if (!a.stuck) pts.push(p[0]!, p[1]!, p[2]!);
    const c = (k: number, col: THREE.Color) => (s: number): [number, number, number, number] => [col.r * k, col.g * k, col.b * k, fade * s * s];
    this.main.set(pts, cam, (s) => 0.08 + 0.26 * s, c(3.2, core.clone().multiplyScalar(0.3)));
    this.halo.set(pts, cam, (s) => 0.4 + 1.5 * s * s, c(0.75, trail));
    const n = pts.length / 3, mode = a.mode as ModeId;
    for (let k = 0; k < this.extra.length; k++) {
      const r = this.extra[k]!;
      if (mode === 'agni' && k > 0 || mode === 'cosmic' && k > 1) { r.hide(); continue; }
      const q: number[] = [];
      for (let i = 0; i < n; i++) {
        const s = i / Math.max(1, n - 1), x = pts[3 * i]!, y = pts[3 * i + 1]!, z = pts[3 * i + 2]!;
        // a frame around the path: side = dir x up, up2 = side x dir
        let sx = -dir[2], sz = dir[0]; const sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl;
        const ux = dir[1] * sz, uy = dir[2] * sx - dir[0] * sz, uz = -dir[1] * sx;
        let ox = 0, oy = 0, oz = 0;
        const step = Math.floor(t * 30);
        if (mode === 'vajra') {
          // crackling filaments that re-form 30 times a second
          const j = (hashi(i, k, step, 9) - 0.5) * 0.5 * (1 - s * 0.5), j2 = (hashi(i, k + 7, step, 9) - 0.5) * 0.5 * (1 - s * 0.5);
          ox = sx * j + ux * j2; oy = uy * j2; oz = sz * j + uz * j2;
        } else if (mode === 'vayu') {
          // two helices wound round the path
          const a0 = i * 0.55 + k * Math.PI + t * 14, rr = 0.35 * (0.3 + s);
          ox = sx * Math.cos(a0) * rr + ux * Math.sin(a0) * rr; oy = uy * Math.sin(a0) * rr; oz = sz * Math.cos(a0) * rr + uz * Math.sin(a0) * rr;
        } else if (mode === 'agni') {
          // a wide flickering heat sheet
          const w = 0.25 * Math.sin(i * 0.9 + t * 20) * (1 - s);
          ox = ux * w; oy = uy * w + 0.1 * (1 - s); oz = uz * w;
        } else {
          const a0 = i * 0.3 + t * 6 + k * 2.1, rr = 0.22 * s;
          ox = sx * Math.cos(a0) * rr + ux * Math.sin(a0) * rr; oy = uy * Math.sin(a0) * rr; oz = sz * Math.cos(a0) * rr + uz * Math.sin(a0) * rr;
        }
        q.push(x + ox, y + oy, z + oz);
      }
      const col = mode === 'cosmic' ? new THREE.Color().setHSL((0.62 + k * 0.18 + t * 0.2) % 1, 0.8, 0.6) : trail;
      r.set(q, cam, (s) => (mode === 'agni' ? 0.9 : 0.09) * (0.4 + s), c(mode === 'agni' ? 0.8 : 2.6, col));
    }
  }
  hide() { this.arrow.group.visible = false; this.main.hide(); this.halo.hide(); for (const r of this.extra) r.hide(); }
}
