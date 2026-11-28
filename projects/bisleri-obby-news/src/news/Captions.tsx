// Word-level karaoke captions (Roman Hinglish), gaming-style: white with a thick ink stroke, the spoken word in yellow.
import React from 'react';
import { TL, Word } from '../tl';

type Card = { words: Word[]; t0: number; t1: number };
const CARDS: Card[] = (() => {
  const out: Card[] = [];
  for (const l of TL.lines) {
    let cur: Word[] = [];
    const flush = () => { if (cur.length) out.push({ words: cur, t0: cur[0].t0, t1: cur[cur.length - 1].t1 }); cur = []; };
    for (const p of l.phrases) { if (cur.length && cur.length + p.words.length > 5) flush(); cur.push(...p.words); if (cur.length >= 3 && /[.?!…:]$/.test(p.cap.trim())) flush(); }
    flush();
  }
  return out;
})();

export const Captions: React.FC<{ t: number }> = ({ t }) => {
  const i = CARDS.findIndex((c, k) => t >= c.t0 - 0.05 && t < Math.min(CARDS[k + 1]?.t0 - 0.05 || 1e9, c.t1 + 0.4));
  if (i < 0) return null;
  const c = CARDS[i], pop = Math.min(1, (t - c.t0 + 0.05) / 0.1);
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: 1300, textAlign: 'center', transform: `scale(${0.85 + 0.15 * pop})`, zIndex: 8 }}>
      {c.words.map((w, k) => {
        const onW = t >= w.t0 - 0.03 && t < w.t1 + 0.02;
        return (
          // gap 34 px > the scaled spill of the spoken word (1.07x adds ~3.5 % per side), so a space always shows
          <span key={k} style={{ display: 'inline-block', margin: '0 17px', fontFamily: 'Archivo, Inter, sans-serif', fontWeight: 900, fontSize: 78, lineHeight: 1.1,
            color: onW ? '#FFD400' : '#FFFFFF', WebkitTextStroke: '8px #0B0B12', paintOrder: 'stroke', transform: `scale(${onW ? 1.07 : 1}) rotate(${onW ? -2 : 0}deg)` }}>{w.w}</span>
        );
      })}
    </div>
  );
};
