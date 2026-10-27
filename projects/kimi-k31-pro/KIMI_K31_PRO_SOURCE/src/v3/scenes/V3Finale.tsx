// V3 finale (5 bars): bar 1 recaps four shots, one per beat; bars 2-5 hold the lockup over the lunar sphere with the
// provenance lines. Text stays inside the rotated-reel safe band (x 250..1520).
import React from 'react';
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { LABELS, NAMES } from '../../data/verifiedClaims';
import { dampedSpring, easeInOutCubic, easeOutCubic, easeOutExpo, invLerp, lerp, reveal } from '../../lib/anim';
import { C } from '../../styles/theme';
import { F } from '../../styles/typography';
import { KineticTitle } from '../../components/KineticTitle';
import { CamRig, ThreeStage } from '../../three/stage';
import { LunarArc, Moon, OrbitPoints, Stars } from '../../three/MoonScene';
import { SAFE_X, SHOTS, V3, beatAt, type ShotId, type V3Props } from '../lib';
import { SkyFlight } from './SkyFlight';
import { RaceCircuit } from './RaceCircuit';
import { FutureCity } from './FutureCity';
import { Website3D } from './Website3D';

const RECAP: { id: ShotId; Comp: React.FC<V3Props>; at: number }[] = [
  { id: 'skyFlight', Comp: SkyFlight, at: 0.55 }, { id: 'raceCircuit', Comp: RaceCircuit, at: 0.6 },
  { id: 'futureCity', Comp: FutureCity, at: 0.8 }, { id: 'website3d', Comp: Website3D, at: 0.6 },
];
const lenOf = (id: ShotId) => SHOTS.find((s) => s.id === id)!.durationInFrames;

export const V3Finale: React.FC<V3Props> = ({ dur }) => {
  const f = useCurrentFrame();
  const recapEnd = V3.bar;                        // bar 1
  const lf = f - recapEnd;                         // lockup frame
  const t = f / 30;
  const cx = (SAFE_X[0] + SAFE_X[1]) / 2;
  const b = beatAt(f);
  const lock = dampedSpring((lf - 6) / 30, 14, 0.55);
  const sweep = easeInOutCubic(invLerp(0, dur - recapEnd, lf));
  const az = lerp(0.2, 1.9, sweep);
  const sun = new THREE.Vector3(Math.sin(az), 0.2, Math.cos(az));
  const fadeOut = 1 - easeInOutCubic(invLerp(dur - 20, dur, f));
  return (
    <AbsoluteFill style={{ background: '#03050B' }}>
      {/* bar 1: one shot per beat */}
      {RECAP.map((r, i) => (
        <Sequence key={r.id} from={i * V3.beat} durationInFrames={V3.beat} layout="none">
          <AbsoluteFill style={{ transform: `scale(${1.06 - 0.06 * easeOutCubic((f - i * V3.beat) / V3.beat)})` }}>
            <Sequence from={-Math.round(r.at * lenOf(r.id))} layout="none"><r.Comp dur={lenOf(r.id)} /></Sequence>
          </AbsoluteFill>
        </Sequence>
      ))}
      {f < recapEnd && <AbsoluteFill style={{ background: '#E8F9FF', opacity: 0.35 * b.pulse * (b.i > 0 ? 1 : 0), pointerEvents: 'none' }} />}

      {/* bars 2-5: lockup */}
      {lf >= 0 && (
        <AbsoluteFill style={{ opacity: fadeOut, background: `radial-gradient(70% 80% at 70% 50%, #0C1640 0%, ${C.void} 72%)` }}>
          <AbsoluteFill style={{ opacity: easeOutCubic(invLerp(0, 10, lf)) }}>
            <ThreeStage>
              <CamRig pos={[0.2 + 0.25 * sweep, 0.1, lerp(6.4, 5.6, easeOutCubic(sweep))]} target={[0.2, 0, 0]} fov={30} />
              <Stars opacity={0.5} />
              <group position={[1.75, 0, -0.6]}>
                <Moon t={t} sun={sun} scale={1.25} rim={1.0} />
                <group scale={1.25}>
                  <OrbitPoints t={t + 4} opacity={0.9} />
                  <LunarArc radius={1.3} tilt={[1.26, 0.18, 0.3]} sweep={Math.PI * 1.3} start={-0.6} draw={easeInOutCubic(invLerp(4, 60, lf))} opacity={0.75} />
                  <LunarArc radius={1.7} tilt={[1.4, -0.55, -0.2]} sweep={Math.PI * 0.9} start={2.2} draw={easeInOutCubic(invLerp(14, 70, lf))} color="#8C7DFF" opacity={0.6} />
                </group>
              </group>
            </ThreeStage>
          </AbsoluteFill>
          <div style={{ position: 'absolute', left: SAFE_X[0] + 40, top: 250, width: SAFE_X[1] - SAFE_X[0] - 80 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 26, opacity: reveal(lf, 2, 8) }}>
              {NAMES.brandWord.split('').map((ch, i) => (
                <span key={i} style={{ fontFamily: F.display, fontWeight: 800, fontSize: 176, lineHeight: 0.9, display: 'inline-block', marginRight: -26,
                  transform: `translateX(${(i - 1.5) * 120 * (1 - lock)}px)`, backgroundImage: 'linear-gradient(180deg,#FFFFFF 10%,#C9D3E4 62%,#8D99B2 100%)',
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{ch}</span>
              ))}
            </div>
            <div style={{ height: 3, width: 620 * easeOutCubic(invLerp(10, 26, lf)), margin: '22px 0 18px', background: `linear-gradient(90deg, ${C.cyan}, rgba(92,225,255,0))`, boxShadow: `0 0 16px ${C.cyan}` }} />
            <div style={{ fontFamily: F.display, fontWeight: 300, fontSize: 76, color: C.cyan, letterSpacing: '0.22em', opacity: reveal(lf, 12, 12),
              transform: `translateY(${(1 - easeOutExpo(invLerp(12, 30, lf))) * 24}px)` }}>{NAMES.versionWord}</div>
            <div style={{ marginTop: 40, display: 'flex', gap: 22, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <KineticTitle text="FROM THINKING" fx="reason" at={recapEnd * 0 + 34} size={54} weight={700} />
              <KineticTitle text="TO BUILDING." fx="build" at={46} size={54} weight={700} color={C.cyan} />
            </div>
            <div style={{ marginTop: 30, fontFamily: F.mono, fontSize: 24, letterSpacing: '0.14em', color: C.lunar, opacity: reveal(lf, 70, 14) }}>GAMES · 3D WORLDS · INTERACTIVE WEB</div>
            <div style={{ marginTop: 8, fontFamily: F.mono, fontSize: 17, color: C.silver, opacity: reveal(lf, 78, 14) }}>capabilities as described at kimi.ai/blog/kimi-k3-1-pro</div>
          </div>
          <div style={{ position: 'absolute', left: SAFE_X[0] + 40, bottom: 70, width: SAFE_X[1] - SAFE_X[0] - 80, display: 'flex', gap: 22, alignItems: 'center', opacity: reveal(lf, 96, 16) }}>
            <Img src={staticFile('brand/techpe-trek.jpg')} style={{ width: 72, height: 72, borderRadius: 16 }} />
            <div style={{ fontFamily: F.mono, fontSize: 17, lineHeight: 1.55, color: C.silver }}>
              <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: C.lunar, letterSpacing: '0.02em' }}>TechpeTrek</div>
              <div>Every scene in this reel was recreated in code by TechpeTrek · illustrative, not Kimi output</div>
              <div>{LABELS.independent.split(' · ')[1]}</div>
            </div>
          </div>
          <div style={{ position: 'absolute', left: SAFE_X[0] + 40, top: 180, textAlign: 'left', fontFamily: F.mono, fontSize: 18, letterSpacing: '0.18em', color: C.silver, opacity: 0.8 * reveal(lf, 110, 14) }}>
            WHAT WOULD YOU BUILD?
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
