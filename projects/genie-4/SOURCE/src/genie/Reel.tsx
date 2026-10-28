// The reel: the scene under the playhead, filmi transitions centred on each cut, word-level captions and the mix.
import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import audio from '../data/audioManifest.json';
import { TIMINGS } from '../data/version';
import { clamp, invLerp } from '../lib/anim';
import { FONT, FPS, P, SEGS, ink, land } from './kit';
import { SCENES } from './Scenes';

interface Word { w: string; t0: number; t1: number }
interface Cap { t0: number; t1: number; words: Word[] }
const CAPS: Cap[] = (TIMINGS as unknown as { variants: { reel: { captions: Cap[] } } }).variants.reel.captions;
const GROUPS: Word[][] = CAPS.flatMap((c) => {
  const n = Math.ceil(c.words.length / 5), size = Math.ceil(c.words.length / n), out: Word[][] = [];
  for (let i = 0; i < c.words.length; i += size) out.push(c.words.slice(i, i + size));
  return out;
});
const GENIE = /^(genie|world|prompt|duniya|chal|weather|camera|characters|bust|tarbooz|phat|sounds|music|dialogue|real-time|interactive|4)/i;
const GEMINI = /^(gemini|director|planning|multi-step|events)/i;
const WARN = /^(lekin|perfect|nahi|drift|inconsistent|trusted|testers|preview|public|mat)/i;

const Captions: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const i = GROUPS.findIndex((g, k) => t >= g[0].t0 - 0.05 && t < Math.min(g[g.length - 1].t1 + 0.4, (GROUPS[k + 1]?.[0].t0 ?? 1e9) - 0.05));
  if (i < 0) return null;
  const g = GROUPS[i], p = land(invLerp(g[0].t0 - 0.05, g[0].t0 + 0.1, t)), long = g.map((w) => w.w).join(' ').length > 26;
  return (
    <div style={{ position: 'absolute', left: 110, right: 110, top: 1440, display: 'flex', justifyContent: 'center', zIndex: 40 }}>
      <div style={{ textAlign: 'center', padding: '10px 24px', borderRadius: 16, background: P.card, border: `4px solid ${P.ink}`, boxShadow: ink(6), opacity: clamp(p * 1.5),
        transform: `translateY(${(1 - p) * 16}px) rotate(${(i % 2 ? 1 : -1) * 0.8}deg)`, fontFamily: FONT.poster, fontStretch: '86%', fontWeight: 800, fontSize: long ? 50 : 58, lineHeight: 1.1 }}>
        {g.map((w, k) => {
          const spoken = t >= w.t0 - 0.03, pp = 1 - clamp((t - w.t0 + 0.03) / 0.16);
          const col = GEMINI.test(w.w) ? P.teal : WARN.test(w.w) ? P.coral : GENIE.test(w.w) ? P.magenta : P.ink;
          return (
            <React.Fragment key={k}>
              <span style={{ display: 'inline-block', color: spoken ? col : P.ink3, transform: spoken && pp > 0 ? `translateY(${-5 * pp}px) scale(${1 + 0.08 * pp})` : undefined }}>{w.w}</span>
              {k < g.length - 1 ? ' ' : ''}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ transitions, each centred on its cut (k = 0 is the cut)
type Kind = 'clap' | 'strip' | 'flash' | 'whip';
const KIND: Record<string, Kind> = { hook2: 'whip', announce: 'clap', worldmodel: 'strip', keys: 'flash', prompt: 'strip', physics: 'clap', audio: 'whip', director: 'strip',
  robot: 'flash', limits: 'clap', preview: 'strip', engine: 'whip', picture: 'clap', cta: 'flash' };
const Clap: React.FC<{ k: number }> = ({ k }) => {
  const c = k < 0 ? land(clamp((k + 9) / 9)) : 1 - land(clamp(k / 10));
  const bar = (top: boolean) => (
    <div style={{ position: 'absolute', left: -40, right: -40, height: 980, ...(top ? { top: 0 } : { bottom: 0 }), transform: `translateY(${(top ? -1 : 1) * (1 - c) * 1000}px)`,
      background: `repeating-linear-gradient(${top ? 135 : 45}deg, ${P.ink} 0 70px, ${P.card} 70px 140px)`, ...(top ? { borderBottom: `14px solid ${P.ink}` } : { borderTop: `14px solid ${P.ink}` }) }} />
  );
  return <AbsoluteFill style={{ zIndex: 60 }}>{bar(true)}{bar(false)}</AbsoluteFill>;
};
const Strip: React.FC<{ k: number }> = ({ k }) => {
  const u = clamp((k + 10) / 20), y = 1920 - u * (1920 + 900);
  return (
    <AbsoluteFill style={{ zIndex: 60 }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: y, height: 900, background: P.ink }}>
        {Array.from({ length: 22 }, (_, i) => <div key={i} style={{ position: 'absolute', left: 24, top: i * 42 + 10, width: 30, height: 22, borderRadius: 5, background: P.paper }} />)}
        {Array.from({ length: 22 }, (_, i) => <div key={'r' + i} style={{ position: 'absolute', right: 24, top: i * 42 + 10, width: 30, height: 22, borderRadius: 5, background: P.paper }} />)}
        <div style={{ position: 'absolute', left: 90, right: 90, top: 60, bottom: 60, borderRadius: 10, background: `linear-gradient(180deg, ${P.magenta}, ${P.saffron})`, opacity: 0.9 }} />
      </div>
    </AbsoluteFill>
  );
};
const Flash: React.FC<{ k: number }> = ({ k }) => {
  const a = k < 0 ? clamp((k + 6) / 6) : Math.exp(-k / 5);
  return <AbsoluteFill style={{ zIndex: 60, background: `radial-gradient(circle at 50% 45%, rgba(255,250,230,${a}) 0%, rgba(255,214,120,${a * 0.85}) 45%, rgba(255,138,0,${a * 0.5}) 100%)` }} />;
};
const Whip: React.FC<{ k: number }> = ({ k }) => {
  const u = clamp((k + 8) / 16), x = -1400 + u * 2800;
  return (
    <AbsoluteFill style={{ zIndex: 60, overflow: 'hidden' }}>
      {Array.from({ length: 14 }, (_, i) => <div key={i} style={{ position: 'absolute', left: x - (i % 4) * 160, top: i * 140, width: 1400, height: 80 + (i % 3) * 30, borderRadius: 40,
        background: i % 2 ? P.magenta : P.saffron, opacity: 0.92 }} />)}
    </AbsoluteFill>
  );
};
const Transition: React.FC = () => {
  const f = useCurrentFrame();
  for (const s of SEGS) {
    const kind = KIND[s.id], k = f - s.from;
    if (!kind || k < -12 || k > 12) continue;
    return kind === 'clap' ? <Clap k={k} /> : kind === 'strip' ? <Strip k={k} /> : kind === 'flash' ? <Flash k={k} /> : <Whip k={k} />;
  }
  return null;
};

const Page: React.FC = () => {
  const f = useCurrentFrame();
  const s = SEGS.find((x) => f >= x.from && f < x.from + x.durationInFrames) ?? SEGS[SEGS.length - 1];
  const S = SCENES[s.id], u = (f - s.from) / s.durationInFrames;
  // a slow push-in on every scene keeps held beats alive; the CTA keeps pushing to the last frame
  return <AbsoluteFill key={s.id} style={{ transform: `scale(${1 + (s.id === 'cta' ? 0.06 : 0.03) * u})`, transformOrigin: '50% 45%' }}><S /></AbsoluteFill>;
};

export const Reel: React.FC = () => (
  <AbsoluteFill style={{ background: P.paper, fontFamily: FONT.ui }}>
    <Page />
    <Transition />
    <Captions />
    <Audio src={staticFile(audio.reel)} />
  </AbsoluteFill>
);
