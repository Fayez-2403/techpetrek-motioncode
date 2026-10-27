// Narration captions (Roman Hinglish) from SCENE_TIMINGS.json. One card at a time; the spoken word brightens, numbers
// are amber. Master: lower third. Reel: above Instagram's bottom UI (clear of the lowest ~420 px).
import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { clamp, easeOutCubic } from '../lib/anim';
import { useLayout } from '../lib/layout';
import { C } from '../styles/theme';
import { F } from '../styles/typography';

export interface Card { line: string; t0: number; t1: number; text: string; words: { w: string; t0: number; t1: number }[] }

const isNum = (w: string) => /\d/.test(w);

export const CaptionRenderer: React.FC<{ cards: Card[]; hide?: (t: number) => boolean; yOffset?: (t: number) => number }> = ({ cards, hide, yOffset }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const t = f / fps;
  const card = cards.find((c, i) => t >= c.t0 - 0.08 && t < Math.max(c.t1 + 0.25, Math.min(c.t1 + 0.6, (cards[i + 1]?.t0 ?? 1e9) - 0.08)));
  if (!card || hide?.(t)) return null;
  const pin = easeOutCubic(clamp((t - card.t0 + 0.08) / 0.18));
  const fs = L.t.caption;
  const bottom = L.tall ? 440 : 64;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: bottom + (yOffset?.(t) ?? 0), display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 80 }}>
      <div style={{ maxWidth: L.tall ? L.w - 120 : 1400, textAlign: 'center', fontFamily: F.text, fontWeight: 650, fontSize: fs, lineHeight: 1.18,
        letterSpacing: '-0.005em', padding: `${fs * 0.22}px ${fs * 0.5}px`, borderRadius: fs * 0.3, background: 'rgba(3,5,12,0.55)',
        backdropFilter: 'blur(8px)', transform: `translateY(${(1 - pin) * 14}px)`, opacity: pin }}>
        {card.words.map((w, i) => {
          const on = t >= w.t0 - 0.03;
          const col = isNum(w.w) ? C.amber : on ? '#FFFFFF' : 'rgba(232,237,246,0.62)';
          return <span key={i} style={{ color: col, textShadow: on ? '0 2px 14px rgba(0,0,0,0.6)' : 'none' }}>{w.w}{i < card.words.length - 1 ? ' ' : ''}</span>;
        })}
      </div>
    </div>
  );
};
