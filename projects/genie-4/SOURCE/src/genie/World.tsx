// The world: poster paper with a slowly turning saffron sunburst (the filmi poster's sky), print grain and a warm edge, and
// the gold marquee "screen" that plays Google DeepMind's real Genie 4 footage. The screen is the carried object: every
// scene moves, resizes or pushes into it; it is never pinned. Pure functions of the frame.
import React from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { clamp, lerp } from '../lib/anim';
import { FPS, P } from './kit';

/** the poster ground. `cx, cy` = the sun's centre (it travels with the hero), `heat` = ray contrast 0..1 */
export const Ground: React.FC<{ cx?: number; cy?: number; heat?: number; spin?: number }> = ({ cx = 50, cy = 40, heat = 1, spin = 1 }) => {
  const f = useCurrentFrame(), a = (f / FPS) * 6 * spin;
  const ray = `rgba(255,190,90,${0.42 * heat})`;
  return (
    <AbsoluteFill style={{ background: P.paper }}>
      <AbsoluteFill style={{ background: `repeating-conic-gradient(from ${a}deg at ${cx}% ${cy}%, ${ray} 0deg 7deg, rgba(255,244,226,0) 7deg 15deg)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(60% 38% at ${cx}% ${cy}%, rgba(255,250,238,0.95) 0%, rgba(255,244,226,0.55) 45%, rgba(255,232,196,0) 100%)` }} />
      {/* print grain: a fixed turbulence pattern (seeded), multiplied over the paper */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: 0.22 }}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={7} stitchTiles="stitch" /><feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.42  0 0 0 0 0.30  0 0 0 0.55 0" /></filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      {/* halftone edge, like a cheap litho print */}
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(126,10,69,0.16) 2.2px, transparent 2.6px)', backgroundSize: '14px 14px',
        WebkitMaskImage: 'radial-gradient(85% 70% at 50% 45%, transparent 62%, black 100%)', maskImage: 'radial-gradient(85% 70% at 50% 45%, transparent 62%, black 100%)' }} />
    </AbsoluteFill>
  );
};

export interface Shot { x: number; y: number; w: number; tilt?: number }
/** the gold marquee screen playing a real clip (16:9). `zoom` pushes into a point of the frame (fx, fy in 0..1) so real UI
 *  reads at phone size; `cover` (0..1) grows the picture past the frame towards full bleed. The clip runs from the scene's
 *  first frame (`from`, film frames) at clip second `t0`. */
export const Screen: React.FC<{ clip: string; from: number; t0: number; shot: Shot; zoom?: number; fx?: number; fy?: number; rate?: number; bulbs?: boolean; frame?: number; dur?: number }> =
  ({ clip, from, t0, shot, zoom = 1, fx = 0.5, fy = 0.5, rate = 1, bulbs = true, frame = 1, dur = 2000 }) => {
    const f = useCurrentFrame(), w = shot.w, h = (w * 9) / 16, pad = 26 * frame;
    const n = Math.round((2 * (w + h)) / 46), lit = Math.floor((f / FPS) * 9);
    const bulb = (i: number) => {
      const u = i / n, per = 2 * (w + h), d = u * per;
      const [bx, by] = d < w ? [d, 0] : d < w + h ? [w, d - w] : d < 2 * w + h ? [w - (d - w - h), h] : [0, h - (d - 2 * w - h)];
      const on = (i + lit) % 3 === 0;
      return <div key={i} style={{ position: 'absolute', left: bx - 8 + pad, top: by - 8 + pad, width: 16, height: 16, borderRadius: 8,
        background: on ? '#FFF6C9' : '#D49A1A', boxShadow: on ? '0 0 14px 4px rgba(255,214,90,0.85)' : 'inset 0 -2px 0 rgba(0,0,0,0.25)' }} />;
    };
    return (
      <div style={{ position: 'absolute', left: shot.x - pad, top: shot.y - pad, width: w + 2 * pad, height: h + 2 * pad, transform: `rotate(${shot.tilt ?? 0}deg)` }}>
        {frame > 0 ? (
          <div style={{ position: 'absolute', inset: 0, borderRadius: 18, opacity: frame,
            background: `linear-gradient(145deg, ${P.goldLite} 0%, ${P.gold} 35%, ${P.goldDeep} 100%)`, boxShadow: `10px 12px 0 ${P.ink}, 0 30px 60px rgba(30,16,48,0.25)` }} />
        ) : null}
        {bulbs && frame > 0.5 ? Array.from({ length: n }, (_, i) => bulb(i)) : null}
        <div style={{ position: 'absolute', left: pad, top: pad, width: w, height: h, overflow: 'hidden', borderRadius: 6, background: '#111' }}>
          <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: `${fx * 100}% ${fy * 100}%` }}>
            <Sequence from={from} durationInFrames={dur} layout="none">
              <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} startFrom={Math.round(t0 * FPS)} playbackRate={rate} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Sequence>
          </div>
        </div>
      </div>
    );
  };

/** a full-bleed 9:16 crop of a 16:9 clip (for the immersive beats), focus fx in 0..1 across the wide frame */
export const Bleed: React.FC<{ clip: string; from: number; t0: number; fx?: number; scale?: number; rate?: number; dur?: number }> = ({ clip, from, t0, fx = 0.5, scale = 1, rate = 1, dur = 2000 }) => {
  const h = 1920, w = (h * 16) / 9, x = lerp(0, -(w - 1080), clamp(fx));
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: '#111' }}>
      <div style={{ position: 'absolute', left: x, top: 0, width: w, height: h, transform: `scale(${scale})`, transformOrigin: `${fx * 100}% 50%` }}>
        <Sequence from={from} durationInFrames={dur} layout="none">
          <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} startFrom={Math.round(t0 * FPS)} playbackRate={rate} muted style={{ width: '100%', height: '100%' }} />
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};
