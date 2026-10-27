// The Astral Bow's state: where it floats, where it aims, how far the string is drawn and how it rings after a
// release. A stylised game model, stepped at the physics rate:
//   held:     the nock follows the pull with a critically damped spring (no snapping to the pointer)
//   released: the string is a damped oscillator around brace height (about 9 Hz, rings for about 1.5 s)
//   launch:   the arrow leaves with v = sqrt(2 * efficiency * (k d^2 / 2) / m) for the draw d at release
import { BOW, launchSpeed } from './config';
import { hashi, clamp } from './noise';
import type { V3 } from './destructible';

export const BRACE = 0.17;          // brace height: string to grip at rest (m, bow-local +z toward the archer)
export const ARROW_LEN = 0.95;
export const BOW_HOME: V3 = [0, 3.4, 0];

export class BowRig {
  draw = 0; drawVel = 0; prevDraw = 0;
  /** Desired draw while held (m). */
  target = 0;
  held = false;
  yaw = 0; pitch = 0.07; prevYaw = 0; prevPitch = 0.07;
  aimYaw = 0; aimPitch = 0.07;
  /** Lateral string vibration after a release: amplitude (m) and its start. */
  vibAmp = 0; vibT0 = -1e9;
  releasedAt = -1e9;
  /** Fire button: an automatic draw to `autoTo` that releases itself. */
  auto: { t0: number; to: number } | null = null;
  /** Max draw allowed by the DRAW POWER setting (0..1 of BOW.MAX_DRAW). */
  limit = 1;

  get maxDraw() { return BOW.MAX_DRAW * this.limit; }
  /** Draw as a share of the bow's full draw (what the power meter shows). */
  get power() { return this.draw / BOW.MAX_DRAW; }

  /** Bow position at sim time t (a slow hover). */
  pos(t: number): V3 { return [BOW_HOME[0], BOW_HOME[1] + 0.025 * Math.sin(0.9 * t), BOW_HOME[2]]; }

  /** Unit aim direction for yaw/pitch (yaw 0 = -z, toward the mountain). */
  static dir(yaw: number, pitch: number): V3 {
    const c = Math.cos(pitch);
    return [-Math.sin(yaw) * c, Math.sin(pitch), -Math.cos(yaw) * c];
  }
  aim(): V3 { return BowRig.dir(this.yaw, this.pitch); }

  /** The bow's local frame in world space: x lateral (right), y up, z back toward the archer. */
  frame(yaw = this.yaw, pitch = this.pitch) {
    const f = BowRig.dir(yaw, pitch);
    const z: V3 = [-f[0], -f[1], -f[2]];
    // right = up x z, normalised; up = z x right
    let rx = 1 * z[2] - 0 * z[1], ry = 0 * z[0] - 0 * z[2], rz = 0 * z[1] - 1 * z[0];
    const rl = Math.hypot(rx, ry, rz) || 1; rx /= rl; ry /= rl; rz /= rl;
    const ux = z[1] * rz - z[2] * ry, uy = z[2] * rx - z[0] * rz, uz = z[0] * ry - z[1] * rx;
    return { x: [rx, ry, rz] as V3, y: [ux, uy, uz] as V3, z };
  }

  /** World position of the nock (the string's centre) at draw d. */
  nock(t: number, d = this.draw): V3 {
    const p = this.pos(t), F = this.frame();
    const k = BRACE + d;
    return [p[0] + F.z[0] * k, p[1] + F.z[1] * k, p[2] + F.z[2] * k];
  }

  grab() { if (this.auto) return false; this.held = true; this.target = this.draw; return true; }
  pull(d: number) { if (this.held) this.target = clamp(d, 0, this.maxDraw); }
  setAim(yaw: number, pitch: number) { this.aimYaw = yaw; this.aimPitch = clamp(pitch, -0.35, 0.75); }

  /** Release: returns the launch speed (m/s), or 0 if the string was barely drawn. */
  release(t: number): number {
    if (!this.held) return 0;
    this.held = false; this.auto = null;
    const d = this.draw;
    if (d < 0.04) return 0;
    this.releasedAt = t; this.vibAmp = 0.006 + 0.016 * (d / BOW.MAX_DRAW); this.vibT0 = t;
    return launchSpeed(d);
  }

  startAuto(t: number) {
    if (this.held || this.auto) return;
    this.held = true; this.auto = { t0: t, to: this.maxDraw };
  }

  /**
   * One physics step. Returns the launch speed if the automatic draw released this step.
   */
  step(t: number, dt: number): number {
    this.prevDraw = this.draw; this.prevYaw = this.yaw; this.prevPitch = this.pitch;
    const a = 1 - Math.exp(-dt * 12);
    this.yaw += (this.aimYaw - this.yaw) * a; this.pitch += (this.aimPitch - this.pitch) * a;
    let fired = 0;
    if (this.auto) {
      const u = (t - this.auto.t0) / 0.75;
      this.target = this.auto.to * (u >= 1 ? 1 : u * u * (3 - 2 * u));
      if (u >= 1.2) fired = this.release(t);
    }
    if (this.held) {
      const w = 24, d = Math.min(this.target, this.maxDraw);
      this.drawVel += (w * w * (d - this.draw) - 2 * w * this.drawVel) * dt;
    } else {
      const w = 2 * Math.PI * 9, z = 0.09;
      this.drawVel += (-w * w * this.draw - 2 * z * w * this.drawVel) * dt;
    }
    this.draw += this.drawVel * dt;
    if (this.held) this.draw = clamp(this.draw, 0, BOW.MAX_DRAW);
    return fired;
  }

  /** Visual string displacement at time t: lateral ringing after a release plus a tremor near full draw. */
  stringOffset(t: number): V3 {
    const age = t - this.vibT0;
    const ring = age >= 0 && age < 2 ? this.vibAmp * Math.exp(-age / 0.35) * Math.sin(age * 2 * Math.PI * 21) : 0;
    const strain = this.held ? clamp((this.draw / BOW.MAX_DRAW - 0.85) / 0.15, 0, 1) : 0;
    const k = Math.floor(t * 90);
    const tremor = strain * 0.0035;
    return [ring + tremor * (hashi(k, 1, 0, 3) - 0.5), tremor * (hashi(k, 2, 0, 3) - 0.5), 0];
  }
}
