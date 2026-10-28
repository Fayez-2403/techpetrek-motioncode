// The reel: the KV-pool world, the scene under the playhead, word-level captions and the mix.
import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import audio from '../data/audioManifest.json';
import { TIMINGS } from '../data/version';
import { clamp, invLerp } from '../lib/anim';
import { C, FONT, FPS, SEGS, SH, land } from './kit';
import { SCENES } from './Scenes';
import { World } from './World';

interface Word { w: string; t0: number; t1: number }
interface Cap { t0: number; t1: number; words: Word[] }
const CAPS: Cap[] = (TIMINGS as unknown as { variants: { reel: { captions: Cap[] } } }).variants.reel.captions;
/** caption bursts of 2-5 words, never across caption cards */
const GROUPS: Word[][] = CAPS.flatMap((c) => {
  const n = Math.ceil(c.words.length / 5), size = Math.ceil(c.words.length / n), out: Word[][] = [];
  for (let i = 0; i < c.words.length; i += size) out.push(c.words.slice(i, i + size));
  return out;
});
const SHEETAL = /^sheetal/i, MUNNI = /^munni/i;
const HOT = /^(doosre|text|data|purane|leak|reject|confusion)/i, GOOD = /^(fix|nahi|patch|bada|save|isolation)/i;
const KEY = /^(AI|Cloudflare|GLM|Workers|August|September|responses|tokens|lakh|hazaar|KV|cache|pool|SGLang|rejection|bug|Important|evidence|affected|Developers|v0|multi-tenant|tests|CACHE|Reel|\d)/i;

const Captions: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const i = GROUPS.findIndex((g, k) => t >= g[0].t0 - 0.05 && t < Math.min(g[g.length - 1].t1 + 0.4, (GROUPS[k + 1]?.[0].t0 ?? 1e9) - 0.05));
  if (i < 0) return null;
  const g = GROUPS[i], p = land(invLerp(g[0].t0 - 0.05, g[0].t0 + 0.1, t));
  const long = g.map((w) => w.w).join(' ').length > 26;
  return (
    <div style={{ position: 'absolute', left: 110, right: 110, top: 1440, display: 'flex', justifyContent: 'center', zIndex: 40 }}>
      <div style={{ textAlign: 'center', padding: '12px 26px', borderRadius: 18, background: C.white, boxShadow: SH.s16, opacity: clamp(p * 1.5),
        transform: `translateY(${(1 - p) * 16}px)`, fontFamily: FONT.ui, fontWeight: 800, fontSize: long ? 48 : 56, lineHeight: 1.15, letterSpacing: '-0.015em' }}>
        {g.map((w, k) => {
          const spoken = t >= w.t0 - 0.03, pp = 1 - clamp((t - w.t0 + 0.03) / 0.16);
          const col = SHEETAL.test(w.w) ? C.violet : MUNNI.test(w.w) ? C.blueInk : HOT.test(w.w) ? C.coralInk : GOOD.test(w.w) ? C.mintInk : KEY.test(w.w) ? C.blueInk : C.ink;
          return (
            <React.Fragment key={k}>
              <span style={{ display: 'inline-block', color: spoken ? col : C.ink3, transform: spoken && pp > 0 ? `translateY(${-4 * pp}px) scale(${1 + 0.07 * pp})` : undefined }}>{w.w}</span>
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
  // a slow push-in on every scene keeps held beats alive (no dead frame); the CTA keeps pushing to the last frame
  return <AbsoluteFill key={s.id} style={{ transform: `scale(${1 + (s.id === 'cta' ? 0.06 : 0.025) * u})`, transformOrigin: '50% 42%' }}><S /></AbsoluteFill>;
};

export const Reel: React.FC<{ muted?: boolean }> = ({ muted }) => (
  <AbsoluteFill style={{ background: C.bg, fontFamily: FONT.ui }}>
    <World />
    <Page />
    <Captions />
    {muted ? null : <Audio src={staticFile(audio.reel)} />}
  </AbsoluteFill>
);
