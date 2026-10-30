// Transitions centred on each cut (k = frames from the cut; negative before it). Every cut has a reason from the story:
//   paper  the dragged PDF fills the frame and becomes a paper-white wipe (hook -> reveal)
//   beam   the OCR scan line flares into a circuit trace (powers -> engine)
//   zoom   the camera accelerates down the MCP path: streaks + iris (engine -> mcp)
//   wipe   a textured rust panel folds the privacy paths into the repo card (privacy -> cta)
//   push   handled by the scenes (objects carry across the cut); a faint smear here
// Full-cover moments always carry texture (G2: no flat field longer than 3 frames).
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp, easeInQuint, easeOutQuint } from '../animation/anim';
import { hash } from '../animation/rng';
import { C } from '../themes/tokens';

export type Kind = 'cut' | 'paper' | 'beam' | 'zoom' | 'wipe' | 'push';

const PaperFace: React.FC = () => (
  <>
    {Array.from({ length: 26 }, (_, i) => (
      <div key={i} style={{ position: 'absolute', left: 120, top: 240 + i * 56, height: 14, borderRadius: 7, background: '#DCE2EC',
        width: 840 * (0.45 + 0.55 * hash(i, 4)) }} />
    ))}
  </>
);

export const Transition: React.FC<{ kind: Kind; k: number }> = ({ kind, k }) => {
  if (kind === 'cut' || k < -14 || k > 16) return null;
  if (kind === 'paper') {  // a sheet grows from the centre to full frame, then lifts away upward
    const grow = easeInQuint(clamp((k + 14) / 12));
    const s = k < -2 ? 0.25 + 0.75 * grow : 1;
    const lift = k <= 1 ? 0 : easeOutQuint(clamp((k - 1) / 15));
    return (
      <AbsoluteFill style={{ zIndex: 60, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, background: C.paper, transformOrigin: '540px 900px',
          transform: `translateY(${-2100 * lift}px) scale(${s}) rotate(${(1 - s) * -6 + lift * -4}deg)`, opacity: k < -12 ? 0 : 1,
          boxShadow: '0 40px 120px rgba(0,0,0,0.6)' }}>
          <PaperFace />
        </div>
      </AbsoluteFill>
    );
  }
  if (kind === 'beam') {  // the horizontal scan line thickens, flares, then thins into the circuit trace
    const up = easeInQuint(clamp((k + 12) / 12)), down = easeOutQuint(clamp(k / 14));
    const hgt = k < 0 ? 4 + 140 * up : 144 * (1 - down) + 3;
    const a = k < 0 ? 0.4 + 0.6 * up : 1 - down;
    return (
      <AbsoluteFill style={{ zIndex: 60, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 960 - hgt / 2, height: hgt, opacity: a,
          background: `linear-gradient(180deg, transparent, ${C.cyan} 35%, #E9FDFF 50%, ${C.cyan} 65%, transparent)`, boxShadow: `0 0 80px ${C.cyan}` }} />
      </AbsoluteFill>
    );
  }
  if (kind === 'zoom') {  // radial streaks + a closing iris that reopens on the next scene
    const into = easeInQuint(clamp((k + 14) / 14)), out = easeOutQuint(clamp(k / 16));
    const r = k < 0 ? 1400 * (1 - into) + 90 : 90 + 1400 * out;
    const a = k < 0 ? into : 1 - out;
    return (
      <AbsoluteFill style={{ zIndex: 60, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 540px 900px, transparent ${r}px, ${C.base} ${r + 60}px)` }} />
        {Array.from({ length: 40 }, (_, i) => {
          const ang = hash(i, 9) * 360, len = 300 + 500 * hash(i, 10), d = 200 + 600 * ((hash(i, 11) + (k + 14) / 20) % 1);
          return <div key={i} style={{ position: 'absolute', left: 540, top: 900, width: len, height: 3, opacity: a * 0.8,
            background: `linear-gradient(90deg, transparent, ${i % 3 ? C.rust : C.cyan})`, transformOrigin: '0 50%', transform: `rotate(${ang}deg) translateX(${d}px)` }} />;
        })}
      </AbsoluteFill>
    );
  }
  if (kind === 'wipe') {  // a striped panel crosses the cut: accelerates in, decelerates out; full cover k -2..1
    const x = k < -2 ? -1080 + 1080 * easeInQuint(clamp((k + 12) / 10)) : k <= 1 ? 0 : 1080 * easeOutQuint(clamp((k - 1) / 13));
    return <AbsoluteFill style={{ zIndex: 60 }}><div style={{ position: 'absolute', top: 0, bottom: 0, left: x, width: 1080,
      background: `repeating-linear-gradient(115deg, ${C.rust} 0 60px, #D9663A 60px 120px)` }} /></AbsoluteFill>;
  }
  const a = clamp(1 - Math.abs(k) / 8) * 0.25;
  return <AbsoluteFill style={{ zIndex: 60, background: `linear-gradient(90deg, transparent, rgba(0,0,0,${a}), transparent)` }} />;
};
