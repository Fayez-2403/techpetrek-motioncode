// Word-level burned-in captions from the REAL voice timings (SCENE_TIMINGS captions). Max two short lines, groups of
// <= 5 words, the spoken word lifts; keywords take their world colour. Dark glass pill inside the safe area.
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { TIMINGS } from '../config/version';
import { clamp, easeOutQuint, invLerp } from '../animation/anim';
import { C, FONT, FPS } from '../themes/tokens';

interface Word { w: string; t0: number; t1: number }
interface Cap { t0: number; t1: number; words: Word[] }
const CAPS: Cap[] = (TIMINGS as unknown as { variants: { reel: { captions: Cap[] } } }).variants.reel.captions;
const GROUPS: Word[][] = CAPS.flatMap((c) => {
  const n = Math.ceil(c.words.length / 5), size = Math.ceil(c.words.length / n), out: Word[][] = [];
  for (let i = 0; i < c.words.length; i += size) out.push(c.words.slice(i, i + size));
  return out;
});

const TONE: [RegExp, string][] = [
  [/^(local|locally|device)/i, C.mint],
  [/^(rust|mcp|claude|paperpilot|paper,?$)/i, C.rust],
  [/^(upload|cloud|ruko)/i, C.coral],
  [/^(pdfs?|merge|split|compress|ocr|browser|desktop|command|open-source|engine|agents|settings)/i, C.cyan],
];
const tone = (w: string) => TONE.find(([r]) => r.test(w))?.[1];

export const Captions: React.FC<{ top?: number }> = ({ top = 1430 }) => {
  const t = useCurrentFrame() / FPS;
  const i = GROUPS.findIndex((g, k) => t >= g[0].t0 - 0.05 && t < Math.min(g[g.length - 1].t1 + 0.4, (GROUPS[k + 1]?.[0].t0 ?? 1e9) - 0.05));
  if (i < 0) return null;
  const g = GROUPS[i], p = easeOutQuint(invLerp(g[0].t0 - 0.05, g[0].t0 + 0.12, t));
  return (
    <div style={{ position: 'absolute', left: 100, right: 100, top, display: 'flex', justifyContent: 'center', zIndex: 40 }}>
      <div style={{ textAlign: 'center', padding: '12px 28px 14px', borderRadius: 22, background: 'rgba(10,16,26,0.78)', border: '1.5px solid rgba(255,255,255,0.12)',
        boxShadow: '0 18px 40px rgba(0,0,0,0.45)', backdropFilter: 'blur(14px)',
        opacity: clamp(p * 1.5), transform: `translateY(${(1 - p) * 16}px)`, fontFamily: FONT.ui, fontWeight: 800, fontSize: 52, lineHeight: 1.12, letterSpacing: -0.5 }}>
        {g.map((w, k) => {
          const spoken = t >= w.t0 - 0.03, pp = 1 - clamp((t - w.t0 + 0.03) / 0.16), col = tone(w.w);
          return (
            <React.Fragment key={k}>
              <span style={{ display: 'inline-block', color: spoken ? (col ?? C.ink) : 'rgba(243,246,250,0.42)',
                transform: spoken && pp > 0 ? `translateY(${-5 * pp}px) scale(${1 + 0.08 * pp})` : undefined }}>{w.w}</span>
              {k < g.length - 1 ? ' ' : ''}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
