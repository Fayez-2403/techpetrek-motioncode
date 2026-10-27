// Pointer input for the live laboratory. Press on the bowstring or the glowing nock (a raycast against the
// string's two segments and the nock) to grab it; drag back to draw. The pull is where the pointer's ray meets
// the bow's draw plane (the vertical plane through the arrow), so dragging toward you draws, and pulling the
// nock below the arrow line raises the aim a little, like a slingshot. Press anywhere else and drag to aim.
// Works with mouse, pen and touch (pointer events).
import * as THREE from 'three';
import type { Stage } from './stage';
import { BRACE } from '../core/bowrig';
import { BOW } from '../core/config';

export class PointerInput {
  private ray = new THREE.Raycaster();
  private mode: 'none' | 'draw' | 'aim' = 'none';
  private start = { x: 0, y: 0, yaw: 0, pitch: 0 };
  private basePitch = 0;
  hover = false;
  onChange?: (s: { hover: boolean; drawing: boolean }) => void;

  constructor(private el: HTMLElement, private stage: Stage) {
    el.addEventListener('pointerdown', this.down);
    el.addEventListener('pointermove', this.move);
    el.addEventListener('pointerup', this.up);
    el.addEventListener('pointercancel', this.up);
    el.style.touchAction = 'none';
  }
  dispose() {
    this.el.removeEventListener('pointerdown', this.down); this.el.removeEventListener('pointermove', this.move);
    this.el.removeEventListener('pointerup', this.up); this.el.removeEventListener('pointercancel', this.up);
  }

  private ndc(e: PointerEvent) {
    const r = this.el.getBoundingClientRect();
    return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  /** Distance (m) from the pointer's ray to the string or nock; Infinity if it is far off. */
  private stringDistance(e: PointerEvent) {
    const s = this.stage, rig = s.sim.rig;
    this.ray.setFromCamera(this.ndc(e), s.camRig.cam);
    const g = s.bow.group, nock = g.localToWorld(new THREE.Vector3(0, 0.028, BRACE + rig.draw));
    let best = this.ray.ray.distanceToPoint(nock) - 0.09;
    for (const a of s.bow.anchors) {
      const A = g.localToWorld(a.clone());
      best = Math.min(best, Math.sqrt(this.ray.ray.distanceSqToSegment(A, nock)) - 0.035);
    }
    return best;
  }

  /** Where the pointer meets the draw plane, in the bow's frame: (height, distance back). */
  private planeHit(e: PointerEvent): { y: number; z: number } | null {
    const s = this.stage, rig = s.sim.rig, F = rig.frame(), p = rig.pos(s.sim.t);
    this.ray.setFromCamera(this.ndc(e), s.camRig.cam);
    const n = new THREE.Vector3(...F.x), o = new THREE.Vector3(...p);
    let plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, o);
    // seen nearly edge-on (camera straight behind the bow): use the horizontal plane through the nock instead
    if (Math.abs(this.ray.ray.direction.dot(n)) < 0.12) plane = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(...F.y), o);
    const hit = this.ray.ray.intersectPlane(plane, new THREE.Vector3());
    if (!hit) return null;
    const d = hit.sub(o);
    return { y: d.dot(new THREE.Vector3(...F.y)), z: d.dot(new THREE.Vector3(...F.z)) };
  }

  private down = (e: PointerEvent) => {
    if (e.button !== 0 || this.stage.live.camera === 'orbit') return;
    this.el.setPointerCapture(e.pointerId);
    if (this.stringDistance(e) < 0) {
      this.mode = 'draw';
      this.basePitch = this.stage.sim.rig.aimPitch;
      this.stage.grab();
    } else {
      this.mode = 'aim';
      const r = this.stage.sim.rig;
      this.start = { x: e.clientX, y: e.clientY, yaw: r.aimYaw, pitch: r.aimPitch };
    }
    this.onChange?.({ hover: this.hover, drawing: this.mode === 'draw' });
  };

  private move = (e: PointerEvent) => {
    const s = this.stage;
    if (this.mode === 'draw') {
      const h = this.planeHit(e);
      if (!h) return;
      s.pull(Math.max(0, Math.min(BOW.MAX_DRAW, h.z - BRACE)));
      // slingshot: the nock held below the arrow line tips the arrow up (and above it, down)
      const tilt = Math.atan2(0.028 - h.y, Math.max(0.2, h.z)) * 0.45;
      s.aim(s.sim.rig.aimYaw, this.basePitch + Math.max(-0.12, Math.min(0.12, tilt)));
    } else if (this.mode === 'aim') {
      const k = 0.0032 * (s.portrait ? 1.4 : 1);
      s.aim(this.start.yaw - (e.clientX - this.start.x) * k, this.start.pitch - (e.clientY - this.start.y) * k);
    } else {
      const h = this.stringDistance(e) < 0;
      if (h !== this.hover) { this.hover = h; this.el.style.cursor = h ? 'grab' : 'crosshair'; this.onChange?.({ hover: h, drawing: false }); }
    }
  };

  private up = (e: PointerEvent) => {
    if (this.mode === 'draw') this.stage.release();
    this.mode = 'none';
    try { this.el.releasePointerCapture(e.pointerId); } catch { /* not captured */ }
    this.onChange?.({ hover: this.hover, drawing: false });
  };
}
