// Word-by-word captions as a speech bubble whose tail points at the speaker. Roman Hinglish only. The spoken word gets
// a yellow highlighter stroke (the same yellow as the scale).
import React from 'react';
import { TL, Word } from './tl';
import { C, FONT } from '../themes/tokens';
import { clamp, easeOutCubic } from '../animation/anim';

type Card = { who: 'bro' | 'bhai'; words: Word[]; t0: number; t1: number };
const CARDS: Card[] = (() => {
  const out: Card[] = [];
  for (const l of TL.lines) {
    if (['a09', 'a11', 'a13', 'a17'].includes(l.id)) continue;   // the question card already shows these words
    let cur: Word[] = [];
    const flush = () => { if (cur.length) out.push({ who: l.who, words: cur, t0: cur[0].t0, t1: cur[cur.length - 1].t1 }); cur = []; };
    for (const p of l.phrases) {
      if (cur.length && cur.length + p.words.length > 7) flush();
      cur.push(...p.words);
      if (cur.length >= 4 && /[.?!…]$/.test(p.cap.trim())) flush();
    }
    flush();
  }
  return out;
})();

export const Bubble: React.FC<{ t: number }> = ({ t }) => {
  const i = CARDS.findIndex((c, k) => t >= c.t0 - 0.06 && t < Math.min(CARDS[k + 1]?.t0 - 0.06 || 1e9, c.t1 + 0.45));
  if (i < 0) return null;
  const c = CARDS[i];
  const pop = easeOutCubic(clamp((t - (c.t0 - 0.06)) / 0.12));
  const bro = c.who === 'bro';
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 1128, height: 190, display: 'flex', alignItems: 'flex-end', justifyContent: bro ? 'flex-start' : 'flex-end', padding: '0 10px' }}>
      <div style={{ position: 'relative', transform: `scale(${0.9 + 0.1 * pop})`, transformOrigin: `${bro ? 25 : 75}% 100%`, opacity: pop,
        background: C.paper, border: `5px solid ${C.ink}`, borderRadius: 34, padding: '16px 30px 18px', maxWidth: 940,
        boxShadow: `0 10px 0 ${C.deep}`, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT.ui, fontWeight: 850, fontSize: 54, lineHeight: 1.16, color: C.ink, letterSpacing: -0.5 }}>
          {c.words.map((w, k) => {
            const on = t >= w.t0 - 0.03 && t < w.t1 + 0.02;
            const done = t >= w.t1;
            return (
              <span key={k} style={{ position: 'relative', display: 'inline-block', margin: '0 7px', opacity: done || on ? 1 : 0.55 }}>
                <span style={{ position: 'absolute', left: -6, right: -6, top: '14%', bottom: '6%', background: C.scale, borderRadius: 8,
                  transform: `scaleX(${on ? 1 : 0})`, transformOrigin: 'left', zIndex: 0 }} />
                <span style={{ position: 'relative', zIndex: 1 }}>{w.w}</span>
              </span>
            );
          })}
        </div>
        {/* tail */}
        <svg width={64} height={44} style={{ position: 'absolute', bottom: -40, ...(bro ? { left: 70 } : { right: 70 }) }}>
          <path d={bro ? 'M 8 0 L 54 0 L 14 40 Z' : 'M 10 0 L 56 0 L 50 40 Z'} fill={C.paper} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
          <rect x={4} y={-6} width={56} height={9} fill={C.paper} />
        </svg>
      </div>
    </div>
  );
};
