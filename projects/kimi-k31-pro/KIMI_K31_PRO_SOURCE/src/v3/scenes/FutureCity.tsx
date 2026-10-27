// 3D · FUTURE CITY (3 bars, half-time breakdown). A procedural megacity at dusk. Bar 1: low in the central avenue,
// light streams of flying traffic pour past both ways, holographic billboards and roof beacons pulse on the beats, and
// the camera slips under the first sky bridge on beat 2. Bar 2: one long crane up between the towers, under a second
// bridge (beat 5) and a third (beat 7), climbing the face of the arcology that closes the avenue. Bar 3 (the wow): on
// the downbeat the camera crests its roof and the city falls away: the bay, a distant skyline and a huge moon, with the
// high traffic lanes streaming out toward it; the camera glides on and settles.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { clamp } from '../../lib/anim';
import { CamRig, Env } from '../../three/stage';
import { V3Tag, type V3Props } from '../lib';
import { CityWorld, cityCam } from '../three/WorldCity';
import { SkyDome, WorldStage, mixHex } from '../three/WorldKit';
import TL from '../timeline.json';

const LABEL = TL.shots.find((s) => s.id === 'futureCity')!.label;

export const FutureCity: React.FC<V3Props> = ({ dur }) => {
  const f = useCurrentFrame();
  const cam = cityCam(f, dur);
  const rev = clamp((f - 116) / 10);
  const flash = f >= 120 ? Math.exp(-(f - 120) / 8) : 0;
  return (
    <AbsoluteFill style={{ background: '#0A0718' }}>
      <WorldStage exposure={1.05} shadows={false} near={0.5} far={9000}>
        <Env intensity={0.14} />
        <fogExp2 attach="fog" args={['#2B1942', 0.0034]} color={mixHex('#2A1844', '#3A2050', rev)} density={0.0034 - 0.0018 * rev} />
        <CamRig pos={cam.pos} target={cam.target} fov={cam.fov} roll={cam.roll} />
        <SkyDome at={cam.pos} radius={6000} zenith="#050618" mid="#24145A" horizon="#C64A7C" ground="#0B0818" glow="#FF8A5C" glowDir={[0.05, 0.03, -1]} glowPow={9} glowAmt={0.5} />
        <CityWorld f={f} dur={dur} cam={cam.pos} />
      </WorldStage>
      {/* moonlight bloom on the reveal */}
      <AbsoluteFill style={{ pointerEvents: 'none', background: 'radial-gradient(60% 60% at 58% 38%, rgba(200,184,255,0.35) 0%, rgba(200,184,255,0) 70%)', opacity: flash }} />
      <AbsoluteFill style={{ pointerEvents: 'none', background: 'radial-gradient(120% 100% at 50% 50%, rgba(0,0,0,0) 58%, rgba(4,2,12,0.55) 100%)' }} />
      <V3Tag label={LABEL} />
    </AbsoluteFill>
  );
};
