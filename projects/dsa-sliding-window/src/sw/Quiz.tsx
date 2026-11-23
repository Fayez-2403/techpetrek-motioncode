// QUIZ (the core): Bhai, the interviewer, asks 5 real question types (worded like GFG / LeetCode). Each card: giveaway
// words highlighted as spoken, a live mini-khidki demo on the real example, Bro's answer stamps SLIDING WINDOW + the clue.
import React from 'react';
import { C, FONT } from '../themes/tokens';
import { ev } from '../tl';
import { clamp, easeInOutCubic, easeInQuint, easeOutCubic, easeOutQuint, lerp } from '../animation/anim';
import { land } from './ScaleBar';
import { Khidki, Tiles } from './Khidki';

type Q = { k: string; ok: string; next: string; words: string[]; hl: number[]; hlAt: string; hl2?: { at: string; idx: number[] }; clue: string; src: string; ill: 'fixed' | 'norepeat' | 'minlen' | 'anagram' | 'contig' };
const QZ: Q[] = [
  { k: 'q1', ok: 'q1ok', next: 'q2', words: ['Return', 'the', 'maximum', 'sum', 'of', 'a', 'subarray', 'of', 'size', 'k.'], hl: [6, 8, 9], hlAt: 'q1hl', clue: 'ishaara: SUBARRAY + SIZE FIXED', src: 'GFG · Max Sum Subarray of Size K', ill: 'fixed' },
  { k: 'q2', ok: 'q2ok', next: 'q3', words: ['Find', 'the', 'longest', 'substring', 'without', 'duplicate', 'characters.'], hl: [2, 3], hlAt: 'q2hl', hl2: { at: 'q2hl2', idx: [5, 6] }, clue: 'ishaara: LONGEST + shart', src: 'LeetCode 3', ill: 'norepeat' },
  { k: 'q3', ok: 'q3ok', next: 'q4', words: ['Find', 'the', 'minimal', 'length', 'subarray', 'with', 'sum', 'at', 'least', 'target.'], hl: [2, 3, 4], hlAt: 'q3hl', hl2: { at: 'q3hl2', idx: [6, 7, 8] }, clue: 'ishaara: SHORTEST + shart', src: 'LeetCode 209', ill: 'minlen' },
  { k: 'q4', ok: 'q4ok', next: 'q5', words: ['Find', 'all', 'anagrams', 'of', '"abc"', 'in', 'a', 'string.'], hl: [2, 3, 4], hlAt: 'q4hl', clue: 'ishaara: FIXED khidki + ginti', src: 'LeetCode 438', ill: 'anagram' },
  { k: 'q5', ok: 'q5ok', next: 'tieOff', words: ['contiguous', 'ya', 'consecutive'], hl: [0], hlAt: 'q5hl', hl2: { at: 'q5hl2', idx: [2] }, clue: 'ishaara: CONTIGUOUS', src: 'LeetCode 643 · GFG', ill: 'contig' },
];

const step = (t: number, a: number, b: number, n: number) => clamp(Math.floor(((t - a) / (b - a)) * n), 0, n - 1);

const Ill: React.FC<{ q: Q; t: number }> = ({ q, t }) => {
  const k0 = ev(q.k), okT = ev(q.ok);
  if (q.ill === 'fixed') {
    const A = [2, 1, 5, 1, 3, 2], S = [8, 7, 9, 6], w = 110, g = 12, x0 = 100;
    const a = k0 + 0.6, b = okT - 0.1;
    const raw = t < a ? 0 : t < b ? ((t - a) / 0.55) % 4 : 2;
    const pos = t < b ? raw : 2;
    const ok = t >= b;
    return (
      <g>
        <Tiles x0={x0} y={130} w={w} gap={g} h={110} vals={A} size={56} fill={(i) => (ok && i >= 2 && i <= 4 ? C.gold : C.scale)} />
        <Khidki mini x={x0 + pos * (w + g) - 5} y={130 - 63} aw={3 * w + 2 * g + 10} ah={126} t={t} glow={ok ? C.gold : undefined} />
        <text x={460} y={262} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={38} fill={C.ink}>
          {S.map((s, i) => (i <= Math.floor(raw) || ok ? `${s}${i < 3 ? ' · ' : ''}` : '')).join('')}{ok ? '  → best 9' : ''}
        </text>
      </g>
    );
  }
  if (q.ill === 'norepeat') {
    const s = 'abcabcbb', TR = [[0, 0], [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [5, 6], [7, 7]], w = 88, g = 10, x0 = 73;
    const a = ev('q2hl2'), b = okT - 0.25, ok = t >= b;
    const i = ok ? 2 : t < a ? 0 : step(t, a, b, TR.length);
    const [lo, hi] = ok ? [0, 2] : TR[i];
    const jumped = !ok && i > 0 && TR[i][0] > TR[i - 1][0];
    return (
      <g>
        <Tiles x0={x0} y={130} w={w} gap={g} h={100} vals={s.split('')} size={56} fill={(j) => (ok && j <= 2 ? C.gold : jumped && j === hi ? '#FFC2C8' : C.scale)} />
        <Khidki mini x={x0 + lo * (w + g) - 5} y={130 - 58} aw={(hi - lo + 1) * (w + g) - g + 10} ah={116} t={t} glow={ok ? C.gold : jumped ? C.na : undefined} />
        <text x={460} y={262} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={38} fill={jumped ? C.na : C.ink}>
          {ok ? 'longest: "abc" = 3' : jumped ? 'repeat! khidki chhoti' : `khidki: "${s.slice(lo, hi + 1)}"`}
        </text>
      </g>
    );
  }
  if (q.ill === 'minlen') {
    const A = [2, 3, 1, 2, 4, 3], w = 110, g = 12, x0 = 100;
    const SEQ: [number, number, number, string?][] = [[0, 0, 2], [0, 1, 5], [0, 2, 6], [0, 3, 8, 'ok'], [1, 3, 6], [1, 4, 10, 'ok'], [2, 4, 7, 'ok'], [3, 4, 6], [3, 5, 9, 'ok'], [4, 5, 7, 'best']];
    const a = ev('q3hl2'), b = okT - 0.1, ok = t >= b;
    const i = ok ? SEQ.length - 1 : t < a ? 0 : step(t, a, b, SEQ.length);
    const [lo, hi, sum, f] = SEQ[i];
    return (
      <g>
        <Tiles x0={x0} y={130} w={w} gap={g} h={110} vals={A} size={56} fill={(j) => (ok && j >= 4 ? C.gold : C.scale)} />
        <Khidki mini x={x0 + lo * (w + g) - 5} y={130 - 63} aw={(hi - lo + 1) * (w + g) - g + 10} ah={126} t={t} glow={ok ? C.gold : f ? C.haan : undefined} />
        <text x={460} y={262} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={38} fill={f ? '#1C9A6A' : C.ink}>
          {ok ? 'sum ≥ 7 · sabse chhoti = [4, 3] → 2' : `sum = ${sum}${f ? ' ≥ 7 → peeche se ghatao' : ''}`}
        </text>
      </g>
    );
  }
  if (q.ill === 'anagram') {
    const s = 'cbaebabacd', w = 80, g = 8, x0 = 24, HITS = [0, 6];
    const huh = t >= ev('q4huh') && t < ev('q4size');
    const a = ev('q4count'), b = okT - 0.2, ok = t >= b;
    const pos = t < ev('q4size') ? -1 : t < a ? 0 : ok ? 6 : lerp(0, 7, easeInOutCubic(clamp((t - a) / (b - a))));
    const p = Math.round(pos);
    const seenHits = HITS.filter((h) => (ok ? true : pos >= h - 0.02));
    const cnt = p >= 0 ? s.slice(p, p + 3).split('').sort().join('') : '';
    return (
      <g>
        <Tiles x0={x0} y={130} w={w} gap={g} h={96} vals={s.split('')} size={50} fill={(j) => (seenHits.some((h) => j >= h && j < h + 3) ? '#B8F5D8' : C.scale)} />
        {huh && <text x={460} y={262} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={40} fill={C.na}>sum? numbers? kuch nahi…</text>}
        {pos >= 0 && <Khidki mini x={x0 + pos * (w + g) - 5} y={130 - 56} aw={3 * w + 2 * g + 10} ah={112} t={t} glow={HITS.includes(p) ? C.haan : undefined} />}
        {pos >= 0 && (
          <text x={460} y={262} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={38} fill={HITS.includes(p) || ok ? '#1C9A6A' : C.ink}>
            {ok ? 'anagram at 0 aur 6 ✓' : `ginti: ${cnt} ${cnt === 'abc' ? '= abc ✓' : '≠ abc'}`}
          </text>
        )}
      </g>
    );
  }
  // contiguous
  const pos = t < okT ? ((t - k0) / 0.5) % 4 : 3;
  return (
    <g>
      <Tiles x0={130} y={140} w={100} gap={12} h={96} vals={[1, 2, 3, 4, 5, 6]} size={50} />
      <Khidki mini x={130 + pos * 112 - 5} y={140 - 56} aw={2 * 100 + 12 + 10} ah={112} t={t} glow={t >= okT ? C.haan : undefined} />
      <text x={460} y={262} textAnchor="middle" fontFamily={FONT.display} fontWeight={900} fontSize={38} fill={C.ink}>lagatar = bina gap ke = khidki</text>
    </g>
  );
};

export const Quiz: React.FC<{ t: number }> = ({ t }) => (
  <>
    {QZ.map((q) => {
      const a = ev(q.k), b = ev(q.next) - 0.12;
      if (t < a || t > b + 0.4) return null;
      const inP = easeOutQuint(clamp((t - a) / 0.42)), outP = easeInQuint(clamp((t - b) / 0.34));
      const x = lerp(1150, 0, inP) - 1250 * outP, rot = lerp(9, 0, inP) - 12 * outP;
      const okT = ev(q.ok), stamp = t >= okT;
      return (
        <div key={q.k} style={{ position: 'absolute', left: 80, top: 292, width: 920, height: 790, transform: `translateX(${x}px) rotate(${rot}deg)`,
          background: C.paper, border: `6px solid ${C.ink}`, borderRadius: 34, boxShadow: `0 14px 0 ${C.deep}` }}>
          <div style={{ position: 'absolute', left: 40, top: 30, right: 40, display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width={64} height={64}><circle cx={32} cy={32} r={32} fill={C.bhai} /><path d="M 26 30 L 38 30 L 35 36 L 29 36 Z M 30 36 L 34 36 L 39 60 L 32 64 L 25 60 Z" fill="#1F2A6B" /><circle cx={32} cy={20} r={11} fill="#A86E48" /></svg>
            <span style={{ fontFamily: FONT.ui, fontWeight: 800, fontSize: 32, color: '#5A5D78' }}>Interviewer</span>
            <span style={{ marginLeft: 'auto', fontFamily: FONT.ui, fontWeight: 800, fontSize: 22, color: '#5A5D78', background: '#EEF0F7', borderRadius: 16, padding: '6px 14px' }}>like: {q.src}</span>
          </div>
          <div style={{ position: 'absolute', left: 44, right: 44, top: 120, fontFamily: FONT.ui, fontWeight: 850, fontSize: q.ill === 'contig' ? 84 : 58, lineHeight: 1.16, color: C.ink, letterSpacing: -1, textAlign: q.ill === 'contig' ? 'center' : 'left' }}>
            {q.words.map((w, i) => {
              const at = q.hl.includes(i) ? ev(q.hlAt) + q.hl.indexOf(i) * 0.08 : q.hl2?.idx.includes(i) ? ev(q.hl2.at) + q.hl2.idx.indexOf(i) * 0.08 : null;
              const p = at === null ? 0 : easeOutCubic(clamp((t - at) / 0.2));
              return (
                <span key={i} style={{ position: 'relative', display: 'inline-block', marginRight: 16 }}>
                  <span style={{ position: 'absolute', left: -6, right: -6, top: '18%', bottom: '4%', background: C.scale, borderRadius: 8, transform: `scaleX(${p})`, transformOrigin: 'left' }} />
                  <span style={{ position: 'relative' }}>{w}</span>
                </span>
              );
            })}
          </div>
          <svg width={920} height={300} style={{ position: 'absolute', left: 0, top: 336 }}><Ill q={q} t={t} /></svg>
          {stamp && (
            <>
              <div style={{ position: 'absolute', right: 30, top: 700, transform: `scale(${land(t, okT, 0.16)}) rotate(-6deg)`, border: `8px solid ${C.haan}`, borderRadius: 18,
                padding: '6px 20px', fontFamily: FONT.display, fontWeight: 900, fontSize: 46, color: '#1C9A6A', background: 'rgba(43,203,141,0.08)' }}>SLIDING WINDOW ✓</div>
              <div style={{ position: 'absolute', left: 40, top: 630, transform: `scale(${land(t, okT + 0.25, 0.18)})`, transformOrigin: 'left center',
                background: C.ink, color: C.scale, borderRadius: 30, padding: '10px 24px', fontFamily: FONT.ui, fontWeight: 850, fontSize: 28 }}>{q.clue}</div>
            </>
          )}
        </div>
      );
    })}
  </>
);
