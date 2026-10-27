// V2 reel: light Fluent backdrop + "Jobs Brief" app frame + the page under the playhead + word-level captions + the mix.
import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import audio from '../data/audioManifest.json';
import { TIMINGS } from '../data/version';
import { clamp, invLerp } from '../lib/anim';
import { Backdrop, FONT, FPS, SEGS, SH, T, decel } from './kit';
import { AppFrame, SCENES } from './Scenes';

interface Word { w: string; t0: number; t1: number }
interface Cap { t0: number; t1: number; words: Word[] }
const CAPS: Cap[] = (TIMINGS as unknown as { variants: { reel: { captions: Cap[] } } }).variants.reel.captions;
const GROUPS: Word[][] = CAPS.flatMap((c) => {
  const n = Math.ceil(c.words.length / 6), size = Math.ceil(c.words.length / n), out: Word[][] = [];
  for (let i = 0; i < c.words.length; i += size) out.push(c.words.slice(i, i + size));
  return out;
});
const KEY = /^(November|jobs?|naya|scene|net|headcount|vacancies|nahi|Wipro|Minus|plus|HCLTech|Mahindra|Infosys|TCS|Freshers?|graduates|AI|GenAI|Python|Java|cloud|SQL|Git|testing|deploy|official|JOBS|save)/i;

const Captions: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const i = GROUPS.findIndex((g, k) => t >= g[0].t0 - 0.05 && t < Math.min(g[g.length - 1].t1 + 0.45, (GROUPS[k + 1]?.[0].t0 ?? 1e9) - 0.05));
  if (i < 0) return null;
  const g = GROUPS[i], p = decel(invLerp(g[0].t0 - 0.05, g[0].t0 + 0.12, t));
  const long = g.map((w) => w.w).join(' ').length > 34;
  return (
    <div style={{ position: 'absolute', left: 120, right: 120, top: 1418, display: 'flex', justifyContent: 'center', zIndex: 40 }}>
      <div style={{ textAlign: 'center', padding: '12px 26px', borderRadius: 14, background: T.card, border: `1px solid ${T.stroke}`, boxShadow: SH.s16, opacity: clamp(p * 1.5),
        transform: `translateY(${(1 - p) * 14}px)`, fontFamily: "'Segoe UI Variable Display', 'Segoe UI', sans-serif", fontWeight: 800, fontSize: long ? 46 : 54, lineHeight: 1.15 }}>
        {g.map((w, k) => {
          const spoken = t >= w.t0 - 0.03, key = KEY.test(w.w) || /\d/.test(w.w), pp = 1 - clamp((t - w.t0 + 0.03) / 0.16);
          return (
            <React.Fragment key={k}>
              <span style={{ display: 'inline-block', color: spoken ? (key ? T.brand : T.text) : T.text3, transform: spoken && pp > 0 ? `translateY(${-4 * pp}px) scale(${1 + 0.07 * pp})` : undefined }}>{w.w}</span>
              {k < g.length - 1 ? ' ' : ''}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const Page: React.FC = () => {
  const f = useCurrentFrame();
  const s = SEGS.find((x) => f >= x.from && f < x.from + x.durationInFrames) ?? SEGS[SEGS.length - 1];
  const S = SCENES[s.id], u = (f - s.from) / s.durationInFrames;
  return <AbsoluteFill key={s.id} style={{ transform: `scale(${1 + 0.018 * u})`, transformOrigin: '50% 45%' }}><S /></AbsoluteFill>;
};

const Progress: React.FC = () => {
  const f = useCurrentFrame(), last = SEGS[SEGS.length - 1];
  return (
    <div style={{ position: 'absolute', left: 120, right: 120, top: 1596, height: 6, borderRadius: 3, background: 'rgba(43,45,53,0.10)' }}>
      <div style={{ height: 6, borderRadius: 3, background: T.brand, width: `${100 * clamp(f / (last.from + last.durationInFrames))}%` }} />
    </div>
  );
};

export const FluentReel: React.FC = () => (
  <AbsoluteFill style={{ background: T.bg, fontFamily: FONT.ui }}>
    <Backdrop />
    <AppFrame />
    <Page />
    <Captions />
    <Progress />
    <Audio src={staticFile(audio.reel)} />
  </AbsoluteFill>
);
