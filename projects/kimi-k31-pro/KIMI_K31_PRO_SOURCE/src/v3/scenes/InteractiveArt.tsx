// INTERACTIVE ART (2 bars), full screen, no chrome. "Bloom Field": ~52k GPU particles over a domain-warped fluid backdrop
// (src/v3/three/ArtParticles.tsx), steered by a deterministic pointer.
//   bar 1  f0 cut: a three-armed vortex of light trails the pointer like a comet (outer particles follow its past
//          positions) · f15 pulse · f30 the pointer presses and holds: the vortex contracts, spins up and brightens, the
//          ring fills · f45 pulse
//   bar 2  f60 (wow) release: a petal-shaped burst with streaks, a shock ring and a flash · f75 / f90 / f105 the bloom
//          breathes and shifts palette on each beat while the pointer parts it · f105-120 eighth-note pulses, spin-up and a
//          contraction into a white-hot core, the energy handing into the finale.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CamRig, project, ThreeStage } from '../../three/stage';
import { clamp, easeInCubic, easeInOutSine, easeOutExpo, invLerp, lerp, reveal } from '../../lib/anim';
import { F } from '../../styles/typography';
import { beatAt, V3Props, V3Tag } from '../lib';
import { FluidBackdrop, ParticleBloom, PATH_N, PATH_START, PATH_STEP, type ParticleState } from '../three/ArtParticles';

const W = 1920, H = 1080;
const HOLD: [number, number] = [0.9, 0.25];
// pointer keys: [frame, x, y] in world units on the z = 0 plane (frame spans about +-9 x +-5)
const KEYS: [number, number, number][] = [
  [-30, -7.4, -2.6], [-14, -5.6, -1.9], [0, -3.6, -0.9], [9, -1.9, 0.6], [18, 0.0, 1.45], [26, 1.5, 1.2], [33, HOLD[0], HOLD[1]],
  [60, HOLD[0], HOLD[1]], [70, 2.0, -0.7], [84, 3.3, 0.6], [98, 2.4, 2.1], [110, 0.2, 1.6], [122, -1.0, 0.2], [140, -2.0, -1.0],
];
/** Catmull-Rom through non-uniform keys */
function pointerAt(f: number): [number, number] {
  let i = 0;
  while (i < KEYS.length - 2 && f > KEYS[i + 1][0]) i++;
  const k0 = KEYS[Math.max(0, i - 1)], k1 = KEYS[i], k2 = KEYS[i + 1], k3 = KEYS[Math.min(KEYS.length - 1, i + 2)];
  const u = clamp((f - k1[0]) / (k2[0] - k1[0]));
  const holdSeg = k1[0] === 33 && k2[0] === 60;
  const out: [number, number] = [0, 0];
  for (let c = 1; c <= 2; c++) {
    const p1 = k1[c], p2 = k2[c];
    const m1 = holdSeg || k1[0] === 60 ? 0 : ((k2[c] - k0[c]) / (k2[0] - k0[0] || 1)) * (k2[0] - k1[0]);
    const m2 = holdSeg || k2[0] === 33 ? 0 : ((k3[c] - k1[c]) / (k3[0] - k1[0] || 1)) * (k2[0] - k1[0]);
    const u2 = u * u, u3 = u2 * u;
    out[c - 1] = (2 * u3 - 3 * u2 + 1) * p1 + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2 + (u3 - u2) * m2;
  }
  if (f > 33 && f < 60) { out[0] += 0.025 * Math.sin(f * 0.9); out[1] += 0.02 * Math.cos(f * 1.3); }
  return out;
}

const chargeAt = (f: number) => (f < 60 ? easeInOutSine(invLerp(31, 59, f)) : 0);
const spinRate = (f: number) => 0.35 + 1.7 * easeInCubic(invLerp(62, 120, f));   // rad/s, spins up into the finale
/** integrals from frame 0 (pure functions of f) */
function integrals(f: number) {
  let phase = 0, spin = 0;
  const step = 0.25;
  for (let x = 0; x < f; x += step) {
    const dx = Math.min(step, f - x) / 30;
    phase += (1 + 1.9 * chargeAt(x)) * dx;
    if (x >= 60) spin += spinRate(x) * dx;
  }
  return { phase, spin };
}
const PHASE_B = integrals(60).phase;

function pulseAt(f: number) {
  const b = beatAt(f);
  if (f < 60) return 0.6 * b.pulse * (1 + chargeAt(f));
  const big = [75, 90, 105].reduce((a, at) => a + (f >= at ? 1.6 * Math.exp(-(f - at) / 6) : 0), 0);
  const eighth = f >= 105 ? beatAt(f, 2).pulse * 0.9 : 0;
  return 0.7 * b.pulse + big + eighth;
}
const heatAt = (f: number) => (f < 60 ? 0.1 * chargeAt(f) : 1);
/** the petal palette rotates one petal on each beat of bar 2 */
const hueAt = (f: number) => [75, 90, 105].reduce((a, at) => a + easeOutExpo(invLerp(at, at + 8, f)) / 7, 0);
const squeezeAt = (f: number) => 0.72 * easeInCubic(invLerp(106, 120, f));

function stateAt(f: number): ParticleState {
  const { phase, spin } = integrals(f);
  return { frame: f, phase, charge: chargeAt(f), burstT: f >= 60 ? (f - 60) / 30 : -1, spin, pulse: pulseAt(f), squeeze: squeezeAt(f), heat: heatAt(f) };
}

function camAt(f: number) {
  const t = f / 30;
  const kick = f >= 60 ? 1.1 * Math.exp(-(f - 60) / 5) : 0;
  const z = lerp(15.6, 14.4, easeInOutSine(invLerp(0, 60, f))) + kick - (f >= 60 ? 2.2 * easeInCubic(invLerp(64, 120, f)) : 0);
  const pos: [number, number, number] = [0.6 * Math.sin(t * 0.55) + 0.25, 0.35 * Math.sin(t * 0.43), z];
  const roll = f >= 60 ? 0.12 * easeInOutSine(invLerp(60, 120, f)) : 0.02 * Math.sin(t);
  return { pos, target: [0.35, 0.15, 0] as [number, number, number], fov: 35, roll };
}

export const InteractiveArt: React.FC<V3Props> = ({ dur }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  void dur;
  const cam = camAt(f);
  const cur = stateAt(f);
  const prev = stateAt(Math.max(0, f - (f >= 60 && f < 75 ? 1.6 : 1.0)));
  const path: [number, number][] = Array.from({ length: PATH_N }, (_, i) => pointerAt(PATH_START + i * PATH_STEP));
  const ptr = pointerAt(f);
  const burstC: [number, number, number] = [HOLD[0], HOLD[1], 0];
  const camUp: [number, number, number] = [Math.sin(cam.roll), Math.cos(cam.roll), 0];
  const proj = (x: number, y: number) => project([x, y, 0], { pos: cam.pos, target: cam.target, fov: cam.fov, up: camUp }, W, H);
  const [sx, sy] = proj(ptr[0], ptr[1]);
  const [bx, by] = proj(burstC[0], burstC[1]);

  const charge = cur.charge;
  const flash = f >= 60 ? Math.exp(-(f - 60) / 4.5) : 0.35 * easeInCubic(invLerp(52, 60, f));
  const pressed = f >= 31 && f < 60 ? reveal(f, 31, 3) : 0;
  const ringR = 30 * (1 - 0.25 * pressed) * (f >= 60 ? 1 + 0.4 * reveal(f, 60, 6) : 1);
  const ringA = f >= 60 ? 1 - reveal(f, 60, 8) * 0.6 : 1;
  const shock = f >= 60 ? easeOutExpo(invLerp(60, 84, f)) : 0;

  return (
    <AbsoluteFill style={{ background: '#030312', overflow: 'hidden' }}>
      <ThreeStage>
        <CamRig pos={cam.pos} target={cam.target} fov={cam.fov} up={camUp} />
        <FluidBackdrop w={W} h={H} t={t} cur={[sx / W, 1 - sy / H]} swirl={f < 60 ? 1.1 + 2.4 * charge : 0.9} burstT={f >= 60 ? (f - 60) / 30 : -1}
          pulse={cur.pulse * 0.6} heat={cur.heat} charge={charge} flash={flash} core={[bx / W, 1 - by / H]} coreI={1.1 * easeInCubic(invLerp(104, 120, f)) + 0.25 * (f >= 60 ? Math.exp(-(f - 60) / 20) : 0)} />
        <ParticleBloom count={44000} streaks={8000} cur={cur} prev={prev} path={path} burstC={burstC} phaseB={PHASE_B} chargeB={chargeAt(59.99)}
          pointer={ptr} pointerOn={reveal(f, 64, 12)} px={16} gain={(f < 60 ? 1.5 : 1.6) + 0.5 * squeezeAt(f)} streak={f < 60 ? 0.6 : 1 - 0.65 * reveal(f, 68, 10) + 0.8 * reveal(f, 106, 10)} hueShift={hueAt(f)} />
      </ThreeStage>

      {/* shock ring on the release */}
      {shock > 0 && shock < 1 && (
        <div style={{ position: 'absolute', left: bx - 1400 * shock, top: by - 1400 * shock, width: 2800 * shock, height: 2800 * shock, borderRadius: '50%',
          border: `${lerp(10, 1, shock)}px solid rgba(255,225,245,${0.85 * (1 - shock)})`, boxShadow: `0 0 40px rgba(255,120,220,${0.6 * (1 - shock)})`, mixBlendMode: 'screen' }} />
      )}

      {/* pointer: ring + dot, charge arc while held */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <g transform={`translate(${sx} ${sy})`} opacity={ringA}>
          <circle r={ringR} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={2} />
          <circle r={4.5} fill="#FFFFFF" />
          {pressed > 0 && (
            <circle r={ringR + 9} fill="none" stroke="#FFFFFF" strokeWidth={3.5} strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * (ringR + 9) * charge} 9999`} transform="rotate(-90)" style={{ filter: 'drop-shadow(0 0 6px rgba(255,160,240,0.9))' }} />
          )}
        </g>
      </svg>
      {f >= 24 && f < 62 && (
        <div style={{ position: 'absolute', left: sx + 54, top: sy - 13, fontFamily: F.mono, fontWeight: 700, fontSize: 21, letterSpacing: '0.24em', color: '#FFFFFF',
          opacity: reveal(f, 24, 6) * (1 - reveal(f, 57, 4)), textShadow: '0 0 12px rgba(160,120,255,0.9)' }}>
          {f < 31 ? 'PRESS' : 'HOLD'}
        </div>
      )}
      {/* piece caption, gallery style */}
      <div style={{ position: 'absolute', left: 1180, top: 900, textAlign: 'right', width: 330, opacity: 0.9 * reveal(f, 4, 10), textShadow: '0 2px 14px rgba(0,0,10,0.9)' }}>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 26, letterSpacing: '0.14em', color: '#F4F0FF' }}>BLOOM FIELD</div>
        <div style={{ fontFamily: F.mono, fontSize: 17, letterSpacing: '0.12em', color: 'rgba(230,226,255,0.75)', marginTop: 6 }}>press · hold · release</div>
      </div>
      <V3Tag label="INTERACTIVE ART" />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `rgba(255,240,250,${clamp(flash - 0.62)})` }} />
    </AbsoluteFill>
  );
};
