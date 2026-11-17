// Real footage and the generated protagonist, through one grade per chapter and one camera move per shot.
// Stock plays frame-exact with <OffthreadVideo> (60 fps proxies in public/footage). A generated shot plays its Veo clip
// when src/data/gen.json lists one, otherwise its identity-locked start frame with a slow push (honest placeholder).
import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile } from 'remotion';
import { GEN_CLIPS, Grade, Move, Placed } from '../data/edit';

// grades: CSS filters + a tint layer (soft-light). Pale-gold day, cobalt screens, low-key alert, warm travel.
export const GRADES: Record<Grade, { f: string; tint: string; tintOp: number }> = {
  dawn: { f: 'saturate(.92) contrast(1.06) brightness(.94)', tint: '#ffb066', tintOp: 0.16 },
  day: { f: 'saturate(.9) contrast(1.08) brightness(1.0)', tint: '#e8c98f', tintOp: 0.1 },
  warm: { f: 'saturate(.95) contrast(1.08) brightness(.97)', tint: '#ffbe7a', tintOp: 0.12 },
  night: { f: 'saturate(.85) contrast(1.14) brightness(.86)', tint: '#3d5bff', tintOp: 0.14 },
  alert: { f: 'saturate(.8) contrast(1.22) brightness(.8)', tint: '#ff2a3c', tintOp: 0.16 },
  travel: { f: 'saturate(1.02) contrast(1.06) brightness(.98)', tint: '#ff9a52', tintOp: 0.12 },
  end: { f: 'saturate(.85) contrast(1.12) brightness(.9)', tint: '#ffb066', tintOp: 0.12 },
};
const STILL: Record<string, string> = { V1: 'F1_eye_macro', V2: 'F2_platform', V3: 'F3_deepwork', V4: 'F4_incident', V5: 'F5_logoff',
  F1: 'F1_eye_macro', F2: 'F2_platform', F3: 'F3_deepwork', F4: 'F4_incident', F5: 'F5_logoff' };

function moveT(m: Move | undefined, k: number) {
  const z = interpolate(k, [0, 1], [m?.z0 ?? 1.02, m?.z1 ?? 1.06]);
  const x = interpolate(k, [0, 1], [m?.x0 ?? 0, m?.x1 ?? 0]), y = interpolate(k, [0, 1], [m?.y0 ?? 0, m?.y1 ?? 0]);
  return `translate(${x}px, ${y}px) scale(${z})`;
}

export const ShotFootage: React.FC<{ s: Placed; t: number }> = ({ s, t }) => {
  const k = Math.min(1, Math.max(0, (t - s.t0) / Math.max(0.01, s.t1 - s.t0)));
  if (s.kind !== 'clip' && s.kind !== 'gen') return null;
  const g = GRADES[s.grade], tf = moveT(s.move, k);
  let media: React.ReactNode;
  if (s.kind === 'clip') {
    media = <OffthreadVideo src={staticFile(`footage/${s.src}.mp4`)} startFrom={Math.round((s.from ?? 0) * 60)} muted
      style={{ width: 1080, height: 1920, objectFit: 'cover', transform: `${tf}${s.flip ? ' scaleX(-1)' : ''}`, filter: g.f }} />;
  } else {
    const clip = GEN_CLIPS[s.id];
    media = clip
      ? <OffthreadVideo src={staticFile(clip)} startFrom={Math.round((s.from ?? 0) * 60)} muted style={{ width: 1080, height: 1920, objectFit: 'cover', transform: tf, filter: g.f }} />
      : <Img src={staticFile(`gen/${STILL[s.id]}.jpg`)} style={{ width: 1080, height: 1920, objectFit: 'cover', transform: tf, filter: g.f }} />;
  }
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: '#000' }}>
      {media}
      <AbsoluteFill style={{ background: g.tint, opacity: g.tintOp, mixBlendMode: 'soft-light' }} />
    </AbsoluteFill>
  );
};

// film grain: a seeded SVG noise whose seed steps every frame (deterministic), plus a soft vignette
export const Grain: React.FC<{ frame: number; amount?: number }> = ({ frame, amount = 0.11 }) => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: amount, mixBlendMode: 'overlay' }}>
      <filter id={`g${frame % 8}`}><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 97} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="1080" height="1920" filter={`url(#g${frame % 8})`} />
    </svg>
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 70% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,.42) 100%)' }} />
  </AbsoluteFill>
);
