// 3D · TOWN (2 bars, half-time breakdown). A low-poly town diorama floating on a soft backdrop, seen through a tilt-shift
// lens on one slow orbit. Little cars, people, a boat and the windmill move the whole time while the light runs from
// midday to golden hour to dusk. Windows switch on in groups on beats 2-5; on beat 6 (the wow) every street lamp and the
// rest of the windows light at once in a cascade from the bridge, just as the town drops into blue dusk.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { clamp, easeInOutSine, lerp } from '../../lib/anim';
import { CamRig, Env, orbit, type V3 } from '../../three/stage';
import { V3Tag, type V3Props } from '../lib';
import { TownWorld, townTime } from '../three/WorldTown';
import { ShadowSun, WorldStage, mixHex, ramp, rampAt, useGlowTex, type Vec3 } from '../three/WorldKit';
import TL from '../timeline.json';

const LABEL = TL.shots.find((s) => s.id === 'town3d')!.label;

function camAt(f: number, dur: number) {
  const u = easeInOutSine(clamp(f / dur));
  const target: V3 = [0.6, -1.4, lerp(0.4, 0.9, u)];
  return { pos: orbit(target, lerp(72, 67, u), lerp(-0.55, 0.5, u), lerp(0.62, 0.55, u)), target, fov: 30 };
}

/** soft contact shadow under the floating tile */
const Under: React.FC<{ o: number }> = ({ o }) => {
  const tex = useGlowTex();
  return (
    <mesh position={[0, -9, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[78, 78, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} color="#1A1430" transparent opacity={o} depthWrite={false} />
    </mesh>
  );
};

/** tilt-shift: progressively blurred bands top and bottom (CSS backdrop blur over the canvas) */
const TiltShift: React.FC = () => {
  const band = (top: boolean, h: string, blur: number, solid: number): React.CSSProperties => ({
    position: 'absolute', left: 0, right: 0, height: h, [top ? 'top' : 'bottom']: 0, backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)`,
    WebkitMaskImage: `linear-gradient(${top ? 'to bottom' : 'to top'}, black 0%, black ${solid}%, transparent 100%)`,
    maskImage: `linear-gradient(${top ? 'to bottom' : 'to top'}, black 0%, black ${solid}%, transparent 100%)`, pointerEvents: 'none',
  });
  return (
    <>
      <div style={band(true, '40%', 2.5, 20)} />
      <div style={band(true, '26%', 6, 35)} />
      <div style={band(false, '36%', 2.5, 20)} />
      <div style={band(false, '22%', 6, 35)} />
    </>
  );
};

export const Town3D: React.FC<V3Props> = ({ dur }) => {
  const f = useCurrentFrame();
  const T = townTime(f, dur);
  const cam = camAt(f, dur);
  const d = T.d;
  // sun: high front-left at midday, swinging behind the town and down to the horizon at dusk
  const az = lerp(0.95, 2.65, d), el = lerp(0.88, 0.08, Math.pow(d, 0.9));
  const sun: Vec3 = [Math.cos(el) * Math.sin(az) * 80, Math.sin(el) * 80, Math.cos(el) * Math.cos(az) * 80];
  const sunCol = ramp(['#FFF5E6', '#FFE2B8', '#FFB46E', '#FF7A5A', '#E0607A'], d);
  const sunI = lerp(3.5, 0.45, Math.pow(d, 1.2));
  const R = (a: string, b: string, c: string, e: string) => rampAt([[0, a], [0.42, b], [0.68, c], [0.9, e], [1, e]], d);
  const hemiSky = R('#D6EBFF', '#FFE3C4', '#E8A08E', '#3E52A8'), hemiGround = R('#8FAE6E', '#A08A5C', '#5E4652', '#1C1C3A');
  const bgTop = R('#A9D8F5', '#F7C79B', '#C8747C', '#121A44'), bgMid = R('#DDEFF8', '#FCE1C0', '#E89E92', '#2E2C66'), bgBot = R('#F6EEDC', '#FBEAD2', '#EDB4A2', '#664878');
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${bgTop} 0%, ${bgMid} 55%, ${bgBot} 100%)` }}>
      <AbsoluteFill style={{ filter: `saturate(${1.14 - 0.08 * d}) contrast(1.04)` }}>
        <WorldStage exposure={lerp(1.02, 0.98, d)} near={0.5} far={600}>
          <Env intensity={lerp(0.1, 0.05, d)} />
          <CamRig pos={cam.pos} target={cam.target} fov={cam.fov} />
          <hemisphereLight color={hemiSky} groundColor={hemiGround} intensity={lerp(0.62, 0.34, d)} />
          <ShadowSun pos={sun} intensity={sunI} color={sunCol} ext={34} far={220} map={2048} radius={2.5} shadow={lerp(0.85, 0.6, d)} />
          <Under o={lerp(0.28, 0.42, d)} />
          <TownWorld f={f} dur={dur} />
        </WorldStage>
      </AbsoluteFill>
      <TiltShift />
      {/* the dusk wash deepens toward the frame edges; a warm lift when the lamps come on */}
      <AbsoluteFill style={{ pointerEvents: 'none', background: `radial-gradient(110% 95% at 50% 52%, rgba(0,0,0,0) 55%, ${mixHex('#2A1C3A', '#0E1030', d)}${Math.round(lerp(0.18, 0.5, d) * 255).toString(16).padStart(2, '0')} 100%)` }} />
      <AbsoluteFill style={{ pointerEvents: 'none', background: 'radial-gradient(60% 50% at 52% 55%, rgba(255,190,120,0.34) 0%, rgba(255,190,120,0) 70%)', opacity: T.wow }} />
      <V3Tag label={LABEL} dark={d < 0.55} />
    </AbsoluteFill>
  );
};
