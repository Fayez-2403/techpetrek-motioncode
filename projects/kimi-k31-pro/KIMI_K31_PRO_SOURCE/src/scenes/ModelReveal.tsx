// 02 · MODEL REVEAL. The point that ends the hook blooms into a lunar sphere; a moonlight terminator sweeps across it
// until it is a crescent; orbiting points and lunar arcs draw in; the KIMI / K3.1 PRO lockup locks with a click.
// Exit: the camera rushes at the lit limb (the lattice of 03 follows on a hit).
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { CLAIMS, NAMES } from '../data/verifiedClaims';
import { clamp, dampedSpring, easeInExpo, easeInOutCubic, easeOutCubic, easeOutExpo, invLerp, lerp, reveal } from '../lib/anim';
import { useLayout } from '../lib/layout';
import { C } from '../styles/theme';
import { F } from '../styles/typography';
import { KineticTitle } from '../components/KineticTitle';
import { CamRig, ThreeStage } from '../three/stage';
import { Halo, LunarArc, Moon, OrbitPoints, Stars } from '../three/MoonScene';
import type { SceneProps } from './types';

export const ModelReveal: React.FC<SceneProps> = ({ dur, variant }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const p = f / dur, t = f / 30;
  const reel = variant === 'reel';

  // phases (fractions of the scene)
  const bloom = easeInOutCubic(invLerp(2, 0.15 * dur, f));              // point -> sphere
  const sweep = easeInOutCubic(invLerp(0.04 * dur, 0.62 * dur, f));      // terminator: full -> crescent
  const lockAt = Math.round(0.36 * dur), subAt = Math.round(0.52 * dur);
  const exitP = easeInExpo(invLerp(0.86 * dur, dur, f));

  const az = lerp(-0.42, 2.05, sweep);                                   // sun azimuth around the sphere
  const sun = new THREE.Vector3(Math.sin(az), 0.22, Math.cos(az));

  // framing: sphere right of the lockup (master) or above it (reel)
  // the sphere blooms at screen centre (where the hook's point ends), then drifts aside for the lockup
  const drift = easeInOutCubic(invLerp(0.03 * dur, 0.32 * dur, f));
  const pos: [number, number, number] = reel ? [0, lerp(0.2, 1.68, drift), 0] : [lerp(0.18, 1.02, drift), lerp(0, 0.02, drift), 0];
  const d0 = reel ? 12.6 : 5.6, d1 = reel ? 11.8 : 4.95;
  const dist = lerp(lerp(d0, d1, easeOutCubic(p / 0.86)), 1.75, exitP);
  const yaw = lerp(-0.07, 0.04, p) + exitP * 0.12;
  const target: [number, number, number] = [lerp(reel ? 0 : 0.18, pos[0] + 0.55, exitP), lerp(reel ? 0.2 : 0, pos[1] + 0.1, exitP), 0];
  const cam: [number, number, number] = [target[0] + Math.sin(yaw) * dist, target[1] + 0.12, Math.cos(yaw) * dist];

  const pointScale = 0.02 + 0.98 * bloom;
  const arcs = reveal(f, 0.18 * dur, 0.5 * dur, easeInOutCubic);
  const ringsOn = reveal(f, 0.1 * dur, 0.35 * dur);

  // lockup mechanics: letters close in from a wide spread and lock with a slight overshoot
  const lockT = (f - lockAt) / 30;
  const spread = 1 - dampedSpring(lockT, 15, 0.55);
  const lockVis = clamp((f - lockAt + 6) / 8);
  const flash = Math.exp(-Math.max(0, f - lockAt - 9) / 4) * (f >= lockAt + 9 ? 1 : 0);
  const outFade = 1 - easeInOutCubic(invLerp(0.84 * dur, 0.93 * dur, f));
  const kimi = reel ? 196 : 212, sub = reel ? 72 : 80;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(90% 80% at ${reel ? '50% 34%' : '64% 50%'}, #0B1434 0%, ${C.void} 72%)` }}>
      <ThreeStage>
        <CamRig pos={cam} target={target} fov={30} />
        <Stars opacity={0.55 * (1 - exitP)} />
        <group position={pos}>
          <Halo scale={lerp(0.4, 5.2, bloom)} opacity={0.10 + 0.5 * (1 - bloom)} color="#7FDFFF" />
          <Moon t={t} sun={sun} scale={pointScale} rim={0.9} bloom={(1 - bloom) * 0.9} />
          <group scale={pointScale}>
            <OrbitPoints t={t + 4} opacity={ringsOn * (1 - exitP * 0.6)} />
            <LunarArc radius={1.24} tilt={[1.26, 0.18, 0.3]} sweep={Math.PI * 1.25} start={-0.6} draw={arcs} opacity={0.75} />
            <LunarArc radius={1.62} tilt={[1.4, -0.55, -0.2]} sweep={Math.PI * 0.9} start={2.2} draw={reveal(f, 0.26 * dur, 0.45 * dur, easeInOutCubic)} color="#8C7DFF" opacity={0.6} />
            <LunarArc radius={2.02} tilt={[1.05, 1.05, 0.45]} sweep={Math.PI * 0.7} start={4.1} draw={reveal(f, 0.32 * dur, 0.4 * dur, easeInOutCubic)} opacity={0.45} thick={0.003} />
          </group>
        </group>
      </ThreeStage>

      {/* lockup */}
      <div style={{ position: 'absolute', left: reel ? 0 : L.safe.side + 40, right: reel ? 0 : undefined, top: reel ? 845 : 330,
        display: 'flex', flexDirection: 'column', alignItems: reel ? 'center' : 'flex-start', opacity: lockVis * outFade }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {NAMES.brandWord.split('').map((ch, i, a) => {
            const off = (i - (a.length - 1) / 2) * kimi * 0.9 * spread;
            return (
              <span key={i} style={{ fontFamily: F.display, fontWeight: 800, fontSize: kimi, letterSpacing: '0.06em', lineHeight: 0.9, display: 'inline-block',
                transform: `translateX(${off}px)`, backgroundImage: 'linear-gradient(180deg, #FFFFFF 10%, #C9D3E4 62%, #8D99B2 100%)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: `drop-shadow(0 0 ${18 * flash}px rgba(92,225,255,0.8))` }}>{ch}</span>
            );
          })}
        </div>
        <div style={{ height: 3, margin: `${reel ? 22 : 26}px 0 ${reel ? 18 : 22}px`, width: kimi * 3.6 * easeOutCubic(invLerp(lockAt + 6, lockAt + 22, f)),
          background: `linear-gradient(90deg, ${C.cyan}, rgba(92,225,255,0))`, boxShadow: `0 0 ${10 + 20 * flash}px ${C.cyan}`, alignSelf: reel ? 'center' : 'flex-start' }} />
        <div style={{ fontFamily: F.display, fontWeight: 300, fontSize: sub, letterSpacing: '0.24em', color: C.cyan, lineHeight: 1,
          opacity: reveal(f, lockAt + 8, 12), transform: `translateY(${(1 - easeOutExpo(invLerp(lockAt + 8, lockAt + 26, f))) * 30}px)` }}>{NAMES.versionWord}</div>
        <div style={{ marginTop: reel ? 34 : 46 }}>
          <KineticTitle text="NEW FRONTIER OF OPEN INTELLIGENCE" fx="decode" at={subAt} size={reel ? 30 : 30} font={F.text} weight={600} tracking={0.26} color={C.silver} />
        </div>
        <div style={{ marginTop: 18, fontFamily: F.mono, fontSize: reel ? 24 : 20, color: C.steel, opacity: reveal(f, subAt + 14, 12), letterSpacing: '0.04em', textAlign: reel ? 'center' : 'left' }}>
          {`by ${NAMES.maker} · open-weight`}
          {reel ? <div style={{ marginTop: 10, color: C.silver }}>{`${CLAIMS.identity.display.replace(' OPEN-WEIGHT MODEL', '')} = ${CLAIMS.identity.qualifier.split('= ')[1]}`}</div> : null}
        </div>
      </div>
      <AbsoluteFill style={{ background: C.void, opacity: easeInOutCubic(invLerp(0.95 * dur, dur, f)) * 0.85, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
