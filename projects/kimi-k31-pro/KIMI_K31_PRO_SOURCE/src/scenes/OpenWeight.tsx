// 11 · OPEN-WEIGHT (C, "Concept visualization").
//   entry     the square 10 folds into is this cube's front face, seen face-on (same size, same place)
//   unfold    the camera turns to a 3/4 view; the five upper faces open on their hinges one by one and the network
//             inside lights up, light flowing outward along every trace (onto the opened faces too)
//   repo      the camera pushes into the opened net; an abstract repository view builds over it (weights/, config,
//             tokenizer; generic names, no links), its status read from WEIGHTS_STATUS
//   infra     the repository docks as the sidebar of a clean, abstract dev environment: "your infrastructure"
//   type      OPEN-WEIGHT MODEL · FULL WEIGHTS PLANNED BY NOV 4, 2026 (+ "Announced plan") · availability · enterprise
// Nothing here says free, lightweight or unrestricted, and no licence terms are shown.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CLAIMS, LABELS, WEIGHTS_STATUS } from '../data/verifiedClaims';
import { KineticTitle } from '../components/KineticTitle';
import { ProvenanceLabel } from '../components/ProvenanceLabel';
import { clamp, easeInOutCubic, easeOutCubic, easeOutExpo, invLerp, keys, lerp, reveal } from '../lib/anim';
import { useLayout } from '../lib/layout';
import { C } from '../styles/theme';
import { F } from '../styles/typography';
import { CamRig, Env, ThreeStage, fitDistance, orbit, type V3 } from '../three/stage';
import { OpenWeightCube } from '../three/OpenWeightCube';
import { BG, EDGE, FOLD, voFrame } from './_evidence';
import type { SceneProps } from './types';

const FOV = 30;
/** "OPEN-WEIGHT MODEL": the identity claim without its parameter-class prefix */
const OPEN_WEIGHT = CLAIMS.identity.display.split(' ').slice(1).join(' ');
/** the viewer-facing part of the weights qualifier ("Announced plan"; the rest is a note for the team) */
const WEIGHTS_Q = CLAIMS.weights.qualifier.split(' · ')[0];
/** "Rolling out on", from the claim's own text */
const CHANNELS_LEAD = CLAIMS.channels.text.split(' Kimi.ai')[0];

const TREE: { depth: number; name: string; dir?: boolean }[] = [
  { depth: 0, name: 'model/', dir: true },
  { depth: 1, name: 'weights/', dir: true },
  { depth: 1, name: 'config' },
  { depth: 1, name: 'tokenizer' },
];

/** window chrome shared by the repository view and the dev environment */
const Chrome: React.FC<{ title: string; size: number; tag?: string; tagOn?: number }> = ({ title, size, tag, tagOn = 1 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.5, padding: `${size * 0.55}px ${size * 0.8}px`, borderBottom: '1px solid rgba(232,237,246,0.08)' }}>
    {[0, 1, 2].map((i) => <span key={i} style={{ width: size * 0.5, height: size * 0.5, borderRadius: '50%', background: 'rgba(232,237,246,0.16)' }} />)}
    <span style={{ fontFamily: F.mono, fontSize: size, color: C.silver, marginLeft: size * 0.4, letterSpacing: '0.04em' }}>{title}</span>
    {tag && (
      <span style={{ marginLeft: 'auto', fontFamily: F.mono, fontSize: size * 0.82, letterSpacing: '0.12em', color: C.amber, border: '1px solid rgba(255,181,71,0.45)',
        borderRadius: 4, padding: `${size * 0.12}px ${size * 0.4}px`, opacity: tagOn }}>{tag}</span>
    )}
  </div>
);

/** the abstract file tree; rows decode in, connectors draw */
const Tree: React.FC<{ f: number; at: number; size: number; tag?: string }> = ({ f, at, size, tag }) => {
  const rowH = size * 1.75, indent = size * 1.6;
  return (
    <div style={{ position: 'relative', padding: `${size * 0.7}px ${size * 0.9}px`, height: TREE.length * rowH + size * 1.4 }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible' }} aria-hidden>
        {TREE.slice(1).map((r, i) => {
          const y = size * 0.7 + (i + 1) * rowH + rowH / 2, x = size * 0.9 + size * 0.55;
          const d = easeOutCubic(invLerp(at + 6 + i * 5, at + 16 + i * 5, f));
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={size * 0.7 + rowH * 0.85 + i * rowH} y2={size * 0.7 + rowH * 0.85 + i * rowH + (rowH * 0.65 + 2) * d} stroke={EDGE} strokeOpacity={0.55} strokeWidth={1.5} />
              <line x1={x} x2={x + (indent - size * 0.75) * d} y1={y} y2={y} stroke={EDGE} strokeOpacity={0.55} strokeWidth={1.5} />
            </g>
          );
        })}
      </svg>
      {TREE.map((r, i) => {
        const on = reveal(f, at + i * 5, 10);
        return (
          <div key={r.name} style={{ position: 'absolute', left: size * 0.9 + r.depth * indent, top: size * 0.7 + i * rowH, height: rowH, display: 'flex', alignItems: 'center', gap: size * 0.5,
            opacity: on, transform: `translateX(${(1 - on) * -10}px)` }}>
            <span style={{ width: size * 0.78, height: size * (r.dir ? 0.6 : 0.78), borderRadius: 2, border: `1.5px solid ${r.dir ? EDGE : 'rgba(232,237,246,0.5)'}`,
              background: r.dir ? 'rgba(92,225,255,0.14)' : 'transparent', flex: 'none' }} />
            <KineticTitle text={r.name} fx="decode" at={at + i * 5} size={size} font={F.mono} weight={r.depth === 0 ? 600 : 500} tracking={0.01}
              color={r.dir ? C.lunar : C.silver} accent={EDGE} />
            {r.depth === 0 && tag && (
              <span style={{ fontFamily: F.mono, fontSize: Math.max(18, size * 0.72), letterSpacing: '0.12em', color: C.amber, border: '1px solid rgba(255,181,71,0.5)',
                borderRadius: 4, padding: `1px ${size * 0.3}px`, marginLeft: size * 0.3, opacity: reveal(f, at + 12, 10) }}>{tag}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const OpenWeight: React.FC<SceneProps> = ({ dur, variant }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const reel = variant === 'reel';
  const t = f / 30;
  const P = (x: number) => Math.round(x * dur);
  const FD = FOLD[variant];

  // ---- beats
  const titleAt = Math.max(8, voFrame(variant, 'openweight', /^open-weight/i, (reel ? 0.03 : 0.26) * dur));
  const weightsAt = voFrame(variant, 'openweight', /^Full/i, (reel ? 0.2 : 0.51) * dur);
  const repoAt = P(reel ? 0.4 : 0.5), dockAt = P(reel ? 0.55 : 0.64);
  const channelsAt = Math.max(P(reel ? 0.5 : 0.66), voFrame(variant, 'openweight', /^(Abhi|Available)$/i, (reel ? 0.56 : 0.66) * dur));
  const enterpriseAt = channelsAt + (reel ? 18 : 22);

  // ---- the cube: unfold face by face (front, right, left, back, then the top on the back's hinge)
  const u0 = reel ? 0.06 : 0.1, us = reel ? 0.05 : 0.05, ud = reel ? 0.13 : 0.13;
  const face = (k: number) => easeInOutCubic(invLerp(P(u0 + k * us), P(u0 + k * us + ud), f));
  const unfold = { front: face(0), right: face(1), left: face(2), back: face(3), top: face(4) };
  const net = easeOutCubic(invLerp(P(0.05), P(reel ? 0.36 : 0.42), f));
  const faceNet = easeOutCubic(invLerp(P(u0 + 0.05), P(reel ? 0.46 : 0.52), f));

  // ---- camera: face-on (matching 10's square) → 3/4 → push into the opened net
  const d0 = fitDistance(2 * (L.h / FD.side), FOV) + 1; // front face (z = +1) spans FD.side px
  const kf = (pairs: [number, number][]) => keys(f, pairs.map(([p, v]) => [P(p), v]), easeInOutCubic);
  const yaw = kf(reel ? [[0, 0], [0.04, 0], [0.34, -0.5], [0.62, -0.24], [1, -0.16]] : [[0, 0], [0.05, 0], [0.36, -0.66], [0.62, -0.3], [1, -0.2]]);
  const pitch = kf(reel ? [[0, 0], [0.04, 0], [0.34, 0.78], [0.62, 1.28], [1, 1.33]] : [[0, 0], [0.05, 0], [0.36, 0.58], [0.62, 1.24], [1, 1.3]]);
  const dist = kf(reel ? [[0, d0], [0.04, d0], [0.34, 31], [0.62, 14], [1, 12.8]] : [[0, d0], [0.05, d0], [0.36, 13.6], [0.62, 8.8], [1, 8.0]]);
  const sx = reel ? 0 : kf([[0, 0], [0.05, 0], [0.36, 2.65], [0.62, 2.3], [1, 2.25]]);
  const ty = kf([[0, 0], [0.05, 0], [0.36, -0.55], [0.62, -1], [1, -1]]);
  const tz = kf([[0, 0], [0.05, 0], [0.36, -0.4], [0.62, -0.6], [1, -0.6]]);
  const right: V3 = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const target: V3 = [-right[0] * sx, ty, tz - right[2] * sx];
  const cam = orbit(target, dist, yaw, pitch);
  // reel: the cube sits high (FOLD.cy) and rides a little higher while it opens, clear of the type below
  const vo0 = (L.h / 2 - FD.cy) / L.h;
  const viewOffsetY = reel ? kf([[0, vo0], [0.04, vo0], [0.34, vo0 + 0.045], [0.62, vo0 + 0.03], [1, vo0 + 0.03]]) : 0;
  const bgP = easeInOutCubic(invLerp(P(0.04), P(0.36), f)); // backdrop drifts from 10's framing to this scene's

  // ---- 2-D layers over the 3-D
  const repo = easeOutExpo(invLerp(repoAt, repoAt + 16, f));
  const dock = easeInOutCubic(invLerp(dockAt, dockAt + 22, f));
  const infra = easeOutCubic(invLerp(dockAt + 4, dockAt + 24, f));
  const dim = 0.5 * easeInOutCubic(invLerp(repoAt - 6, repoAt + 20, f)) + 0.12 * dock;
  const textBed = easeInOutCubic(invLerp(titleAt - 10, titleAt + 20, f));

  // window rectangles (repo alone → docked as the sidebar of the infra window)
  const IW = reel ? { x: 64, y: 350, w: 952, h: 500 } : { x: 960, y: 230, w: 840, h: 450 };
  const RW0 = reel ? { x: 150, y: 400, w: 780, h: 340 } : { x: 1040, y: 260, w: 660, h: 340 };
  const sideW = reel ? 400 : 330;
  const RW1 = { x: IW.x + 1, y: IW.y + (reel ? 58 : 52), w: sideW, h: IW.h - (reel ? 59 : 53) };
  const rw = { x: lerp(RW0.x, RW1.x, dock), y: lerp(RW0.y, RW1.y, dock), w: lerp(RW0.w, RW1.w, dock), h: lerp(RW0.h, RW1.h, dock) };
  const chromeSize = reel ? 24 : 19;
  const treeSize = lerp(reel ? 34 : 28, reel ? 28 : 23, dock);

  // ---- type column
  const side = L.safe.side;
  const titleSize = reel ? 64 : 80;
  const colX = reel ? side : 120, colW = reel ? L.w - 2 * side : 800;
  const colTop = reel ? 960 : 262;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(${lerp(110, 100, bgP)}% ${lerp(90, 85, bgP)}% at ${lerp(BG.at[0], reel ? 50 : 62, bgP)}% ${lerp(BG.at[1], reel ? 33 : 48, bgP)}%, ${BG.core} 0%, ${C.void} ${lerp(72, 70, bgP)}%)` }}>
      <ThreeStage exposure={1.05}>
        <Env intensity={0.5} />
        <CamRig pos={cam} target={target} fov={FOV} viewOffsetY={viewOffsetY} />
        <ambientLight intensity={0.25} />
        <directionalLight position={[-4, 6, 5]} intensity={1.6} color="#DCE8FF" />
        <directionalLight position={[5, 2, -4]} intensity={0.8} color="#7FDFFF" />
        <OpenWeightCube t={t} unfold={unfold} net={net} faceNet={faceNet} edge={1 - 0.25 * dim} panel={lerp(0.55, 0.35, unfold.top)} core={net * (1 - 0.6 * unfold.front)} />
      </ThreeStage>

      {/* the 3-D recedes behind the repository / dev environment */}
      <AbsoluteFill style={{ background: `rgba(3,5,11,${dim})`, pointerEvents: 'none' }} />
      {/* a dark bed under the type column so small lines stay legible over the network */}
      <AbsoluteFill style={{ pointerEvents: 'none', opacity: textBed, background: reel
        ? 'linear-gradient(180deg, rgba(3,5,11,0) 44%, rgba(3,5,11,0.86) 50%, rgba(3,5,11,0.9) 72%, rgba(3,5,11,0.6) 100%)'
        : 'linear-gradient(90deg, rgba(3,5,11,0.88) 0%, rgba(3,5,11,0.78) 34%, rgba(3,5,11,0) 50%)' }} />

      {/* already shown in 10: fully on at the cut, no second decode */}
      <ProvenanceLabel kind="C" at={-20} />

      {/* dev environment: your infrastructure */}
      {infra > 0 && (
        <div style={{ position: 'absolute', left: IW.x, top: IW.y, width: IW.w, height: IW.h, borderRadius: 16, overflow: 'hidden', opacity: infra,
          transform: `scale(${lerp(0.97, 1, infra)})`, background: 'rgba(9,14,32,0.86)', border: '1px solid rgba(232,237,246,0.12)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.45)' }}>
          <Chrome title="your infrastructure" size={chromeSize} />
          <div style={{ position: 'absolute', left: sideW + 1, top: reel ? 58 : 52, right: 0, bottom: 0 }}>
            <InfraBody f={f} at={dockAt + 10} reel={reel} />
          </div>
        </div>
      )}

      {/* repository view (then the sidebar of the dev environment) */}
      {repo > 0 && (
        <div style={{ position: 'absolute', left: rw.x, top: rw.y, width: rw.w, height: rw.h, borderRadius: lerp(16, 0, dock), overflow: 'hidden',
          opacity: repo, transform: `translateY(${(1 - repo) * 16}px)`, background: `rgba(10,16,38,${lerp(0.84, 0.55, dock)})`,
          border: `1px solid rgba(127,233,255,${lerp(0.28, 0, dock)})`, borderRight: `1px solid rgba(232,237,246,${lerp(0.28, 0.1, dock)})`,
          boxShadow: dock < 1 ? `0 24px 60px rgba(0,0,0,${0.4 * (1 - dock)})` : 'none' }}>
          <div style={{ height: (reel ? 58 : 52) * (1 - dock), overflow: 'hidden', opacity: 1 - dock }}>
            <Chrome title="repository" size={chromeSize} />
          </div>
          <Tree f={f} at={repoAt + 4} size={treeSize} tag={WEIGHTS_STATUS.toUpperCase()} />
        </div>
      )}

      {/* type */}
      <div style={{ position: 'absolute', left: colX, top: colTop, width: colW, display: 'flex', flexDirection: 'column', alignItems: reel ? 'center' : 'flex-start',
        textAlign: reel ? 'center' : 'left' }}>
        <div style={{ display: 'flex', flexDirection: reel ? 'row' : 'column', gap: reel ? titleSize * 0.3 : 6, flexWrap: 'wrap', justifyContent: reel ? 'center' : 'flex-start' }}>
          {OPEN_WEIGHT.split(' ').map((w, i) => (
            <KineticTitle key={w} text={w} fx="rise" at={titleAt + i * 6} size={titleSize} weight={700} tracking={0} color={C.lunar} />
          ))}
        </div>
        <div style={{ marginTop: reel ? 28 : 40, opacity: reveal(f, weightsAt, 12), transform: `translateY(${(1 - easeOutCubic(reveal(f, weightsAt, 16))) * 14}px)` }}>
          <div style={{ fontFamily: F.text, fontWeight: 650, fontSize: reel ? 38 : 37, color: C.lunar, letterSpacing: '0.01em', lineHeight: 1.15, whiteSpace: 'nowrap' }}>
            {CLAIMS.weights.display}
          </div>
          <div style={{ fontFamily: F.mono, fontSize: reel ? 24 : 18, color: C.silver, marginTop: 10, letterSpacing: '0.02em' }}>
            <span style={{ color: C.amber }}>{WEIGHTS_Q}</span>{` · ${LABELS.source}`}
          </div>
        </div>
        <div style={{ width: reel ? 140 : 120, height: 1, background: 'rgba(232,237,246,0.22)', margin: reel ? '30px 0 24px' : '36px 0 26px',
          transform: `scaleX(${easeOutCubic(reveal(f, channelsAt - 6, 14))})`, transformOrigin: reel ? 'center' : 'left' }} />
        <div style={{ opacity: reveal(f, channelsAt, 12) }}>
          <div style={{ fontFamily: F.mono, fontSize: reel ? 24 : 18, letterSpacing: '0.12em', color: C.steel, textTransform: 'uppercase' }}>{CHANNELS_LEAD}</div>
          <div style={{ fontFamily: F.text, fontWeight: 600, fontSize: reel ? 31 : 27, color: C.lunar, marginTop: 10, letterSpacing: '0.02em', lineHeight: 1.25 }}>
            {CLAIMS.channels.display}
          </div>
        </div>
        <div style={{ fontFamily: F.mono, fontSize: reel ? 24 : 18, color: C.silver, marginTop: reel ? 18 : 16, letterSpacing: '0.04em', opacity: 0.9 * reveal(f, enterpriseAt, 12) }}>
          {CLAIMS.enterprise.display}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** the main area of the abstract dev environment: three generic compute units fed from the sidebar, an editor of
 *  abstract lines and a quiet terminal strip. No text content, no product claims. */
const InfraBody: React.FC<{ f: number; at: number; reel: boolean }> = ({ f, at, reel }) => {
  const units = 3, uh = reel ? 118 : 104, gap = reel ? 18 : 16;
  const lines = [0.62, 0.44, 0.78, 0.36, 0.55, 0.7, 0.3];
  return (
    <div style={{ position: 'absolute', inset: 0, padding: reel ? 26 : 24 }}>
      {/* compute units */}
      <div style={{ display: 'flex', gap }}>
        {Array.from({ length: units }, (_, i) => {
          const on = easeOutCubic(invLerp(at + i * 5, at + 14 + i * 5, f));
          const live = clamp((f - at - 18 - i * 6) / 10);
          return (
            <div key={i} style={{ flex: 1, height: uh, borderRadius: 10, border: `1px solid rgba(92,225,255,${0.18 + 0.32 * live})`, background: `rgba(92,225,255,${0.04 + 0.06 * live})`,
              opacity: on, transform: `translateY(${(1 - on) * 10}px)`, position: 'relative', overflow: 'hidden' }}>
              {Array.from({ length: 4 }, (_, k) => (
                <div key={k} style={{ position: 'absolute', left: 14, right: 14 + k * 18, top: 18 + k * (uh - 36) / 3.4, height: 5, borderRadius: 3,
                  background: k === 0 ? `rgba(92,225,255,${0.35 + 0.5 * live})` : 'rgba(232,237,246,0.14)' }} />
              ))}
              <span style={{ position: 'absolute', right: 12, top: 12, width: 8, height: 8, borderRadius: '50%', background: C.mint, opacity: live * 0.9 }} />
            </div>
          );
        })}
      </div>
      {/* the feed from the sidebar's weights/ row into the units */}
      <svg width="100%" height={40} style={{ display: 'block', overflow: 'visible' }} aria-hidden>
        <line x1={-(reel ? 26 : 24)} x2="100%" y1={20} y2={20} stroke={EDGE} strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray="10 8"
          strokeDashoffset={-((f - at) * 2.2)} opacity={easeOutCubic(invLerp(at + 8, at + 22, f))} />
      </svg>
      {/* editor: abstract lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: reel ? 15 : 13 }}>
        {lines.map((w, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', opacity: reveal(f, at + 10 + i * 2, 8) }}>
            <div style={{ width: 22, height: 5, borderRadius: 3, background: 'rgba(232,237,246,0.10)' }} />
            <div style={{ width: `${w * 85}%`, marginLeft: (i % 3) * 22, height: 6, borderRadius: 3, background: i % 4 === 1 ? 'rgba(140,125,255,0.45)' : 'rgba(232,237,246,0.2)' }} />
          </div>
        ))}
      </div>
      {/* terminal strip */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: reel ? 64 : 54, borderTop: '1px solid rgba(232,237,246,0.08)', background: 'rgba(3,5,11,0.5)',
        display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px', opacity: reveal(f, at + 16, 10) }}>
        <span style={{ fontFamily: F.mono, fontSize: reel ? 24 : 20, color: C.mint }}>›</span>
        <div style={{ width: '38%', height: 6, borderRadius: 3, background: 'rgba(232,237,246,0.2)' }} />
        <div style={{ width: 10, height: reel ? 24 : 20, background: C.lunar, opacity: Math.floor(f / 15) % 2 === 0 ? 0.8 : 0 }} />
      </div>
    </div>
  );
};
