// 03 · INTELLIGENCE ENGINE (concept visualization). PushThroughGeometry along a corridor of compute modules with light
// streaming along their links ("3T-CLASS"), out into open space where a document stack fans open and spills into a
// field of context tiles while "1,000,000" counts up and breaks into tiles ("UP TO 1M TOKENS"). Exit: the field
// flattens into the code rows that open scene 04.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CLAIMS, N } from '../data/verifiedClaims';
import { easeInExpo, easeInOutCubic, easeInOutSine, easeOutCubic, easeOutExpo, fmt, invLerp, lerp, reveal, spline, window_ } from '../lib/anim';
import { hash } from '../lib/rng';
import { useLayout } from '../lib/layout';
import { C, WORLD } from '../styles/theme';
import { F } from '../styles/typography';
import { KineticTitle } from '../components/KineticTitle';
import { ProvenanceLabel } from '../components/ProvenanceLabel';
import { SourceAttribution } from '../components/SourceAttribution';
import { CamRig, Env, ThreeStage, type V3 } from '../three/stage';
import { ContextField, Lattice } from '../three/ComputeLattice';
import type { SceneProps } from './types';

const PATH = [[0.2, 0.1, 9], [0.1, 0.0, 2], [-0.25, 0.12, -8], [0.3, -0.1, -18], [0, 0.05, -30], [0, 0, -40]];

export const IntelligenceEngine: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const t = f / 30, p = f / dur;
  const A = 0.36;                                        // end of the lattice flight
  const inA = p < A;

  // phase A: flight through the lattice
  const u = easeInOutSine(invLerp(0, A * dur, f)) * 0.92 + easeInExpo(invLerp(0.36 * dur, A * dur, f)) * 0.08;
  const c = spline(PATH, u) as V3, look = spline(PATH, Math.min(1, u + 0.06)) as V3;
  const roll = Math.sin(t * 0.7) * 0.05;
  const flash = window_(f, A * dur - 3, A * dur + 3, 3);

  // phase B: document stack -> context field
  const b0 = A * dur;
  const fan = easeInOutCubic(invLerp(b0, b0 + 0.1 * dur, f));
  const spill = easeInOutCubic(invLerp(b0 + 0.1 * dur, b0 + 0.2 * dur, f));
  const fill = easeOutCubic(invLerp(b0 + 0.13 * dur, 0.84 * dur, f)) * 1.12;
  const flatten = easeInOutCubic(invLerp(0.9 * dur, 0.97 * dur, f));
  const pull = easeInOutCubic(invLerp(b0 + 0.08 * dur, 0.86 * dur, f));
  const camB: V3 = [lerp(0.6, 0, pull), lerp(0.35, lerp(2.2, 0, flatten), pull), lerp(4.2, lerp(9.5, 13.5, flatten), pull)];
  const fade3d = 1 - easeInOutCubic(invLerp(0.955 * dur, dur, f));

  // the million: counts up, then its digits shatter into tiles
  const m0 = b0 + 0.03 * dur, mCount = easeOutExpo(invLerp(m0, m0 + 0.09 * dur, f)), shatter = easeInOutCubic(invLerp(m0 + 0.11 * dur, m0 + 0.2 * dur, f));
  const million = fmt(N.contextTokens * mCount, 0);

  const hero = L.t.hero;
  return (
    <AbsoluteFill style={{ background: inA ? `radial-gradient(80% 70% at 50% 50%, #0E1A44 0%, ${C.void} 75%)` : `radial-gradient(90% 80% at 50% 50%, #0A1236 0%, ${C.void} 80%)` }}>
      <AbsoluteFill style={{ opacity: fade3d }}>
        <ThreeStage fog={inA ? ['#070C22', 6, 30] : ['#050A1C', 8, lerp(30, 60, flatten)]}>
          <Env intensity={0.9} />
          <ambientLight intensity={0.15} />
          {inA ? (
            <>
              <CamRig pos={c} target={look} fov={52} roll={roll} />
              <pointLight position={[c[0] + 1.5, c[1] + 1, c[2] - 3]} intensity={9} distance={14} color="#5CE1FF" />
              <pointLight position={[c[0] - 2, c[1] - 1, c[2] - 7]} intensity={7} distance={14} color="#8C7DFF" />
              <Lattice t={t} glow={0.5 + 0.5 * Math.sin(t * 2)} />
            </>
          ) : (
            <>
              <CamRig pos={camB} target={[0, lerp(-0.3, lerp(0.6, 0, flatten), pull), 0]} fov={40} />
              <directionalLight position={[2, 3, 6]} intensity={1.4} />
              <ContextField fan={fan} spill={spill} fill={fill} flatten={flatten} />
            </>
          )}
        </ThreeStage>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#DFF7FF', opacity: flash * 0.75, mixBlendMode: 'screen' }} />

      {/* phase A type */}
      <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: L.safe.side + 30, opacity: window_(f, 0.05 * dur, 0.345 * dur, 8) }}>
        <KineticTitle text={CLAIMS.identity.display.split(' ')[0]} fx="rise" at={0.05 * dur} size={hero * 1.05} weight={800} tracking={0.01} style={{ textShadow: '0 0 40px rgba(6,10,24,0.9)' }} />
        <div style={{ marginTop: 22, fontFamily: F.text, fontSize: L.t.statement * 0.9, fontWeight: 600, color: C.lunar, opacity: reveal(f, 0.1 * dur, 12) }}>OPEN-WEIGHT</div>
        <SourceAttribution text={`${CLAIMS.identity.qualifier}`} at={0.12 * dur} style={{ marginTop: 14, fontSize: L.t.evidence * 0.85 }} />
      </AbsoluteFill>

      {/* phase B: the million */}
      {!inA && (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 150 }}>
          <div style={{ position: 'relative', textShadow: '0 4px 40px rgba(3,5,12,0.95)', fontFamily: F.display, fontWeight: 800, fontSize: hero * 0.95, color: C.lunar, letterSpacing: '-0.01em', whiteSpace: 'pre',
            opacity: window_(f, m0, m0 + 0.2 * dur, 6) }}>
            {million.split('').map((ch, i) => (
              <span key={i} style={{ display: 'inline-block', position: 'relative', opacity: 1 - shatter, filter: `blur(${shatter * 6}px)` }}>
                {ch}
                {ch !== ',' && Array.from({ length: 9 }, (_, k) => {
                  const a = hash(i, k) * Math.PI * 2, d = 120 + hash(k, i, 3) * 520;
                  return <span key={k} style={{ position: 'absolute', left: `${(k % 3) * 33}%`, top: `${20 + Math.floor(k / 3) * 25}%`, width: hero * 0.2, height: hero * 0.2, borderRadius: 4,
                    background: k % 4 === 0 ? C.amber : C.cyan, opacity: shatter > 0 ? (1 - shatter) * 0.95 + 0.05 : 0,
                    transform: `translate(${Math.cos(a) * d * shatter}px, ${Math.sin(a) * d * shatter}px) scale(${1 - shatter * 0.6})`, boxShadow: `0 0 18px ${C.cyan}` }} />;
                })}
              </span>
            ))}
          </div>
        </AbsoluteFill>
      )}
      {!inA && (
        <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 200, opacity: window_(f, m0 + 0.17 * dur, 0.9 * dur, 10) }}>
          <div style={{ padding: '26px 46px 24px', borderRadius: 18, background: 'rgba(3,6,18,0.72)', backdropFilter: 'blur(10px)', border: '1px solid rgba(92,225,255,0.25)', textAlign: 'center' }}>
            <KineticTitle text={CLAIMS.context.display} fx="build" at={m0 + 0.17 * dur} size={L.t.title} weight={700} />
            <SourceAttribution text={`${CLAIMS.context.qualifier} · ${CLAIMS.contextTier.display}`} at={m0 + 0.22 * dur} style={{ marginTop: 14 }} />
          </div>
        </AbsoluteFill>
      )}
      {!inA && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', paddingTop: 170, opacity: window_(f, 0.7 * dur, 0.92 * dur, 8) }}>
          <div style={{ fontFamily: F.text, fontWeight: 650, fontSize: L.t.statement, color: C.lunar, letterSpacing: '0.04em', textShadow: '0 2px 24px rgba(0,0,0,0.9)' }}>
            MORE CONTEXT. <span style={{ color: C.cyan }}>MORE COMPLEX WORKFLOWS.</span>
          </div>
        </AbsoluteFill>
      )}

      {/* exit: the code rows of scene 04 (exact geometry shared with CodingWorld) */}
      <AbsoluteFill style={{ background: WORLD.code.bg, opacity: easeInOutCubic(invLerp(0.95 * dur, dur, f)) }}>
        {Array.from({ length: 18 }, (_, i) => (
          <div key={i} style={{ position: 'absolute', left: 360, top: 200 + i * 38, height: 12, borderRadius: 6, width: 300 + hash(i, 5) * 800, background: 'rgba(92,225,255,0.35)' }} />
        ))}
      </AbsoluteFill>
      <ProvenanceLabel kind="C" note="Not a depiction of Kimi's actual architecture" at={8} />
    </AbsoluteFill>
  );
};
