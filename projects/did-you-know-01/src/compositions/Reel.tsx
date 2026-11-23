// DID YOU KNOW #01: hook -> 4 facts (float, hash, tokens, 2038) -> CTA. Same Bro & Bhai world as the binary search reel.
// Each fact: the live demo (our run, verbatim), the logic animated on the words, the SOURCE strip (the real page).
import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { C, FPS } from '../themes/tokens';
import { TL, TOTAL as T_FRAMES } from '../tl';
import { clamp, easeInQuint, easeOutQuint } from '../animation/anim';
import { Hosts } from '../dyk/Hosts';
import { Bubble } from '../components/Bubble';
import { Float, Hook } from '../dyk/HookFloat';
import { Hash } from '../dyk/Hash';
import { Tokens } from '../dyk/Tokens';
import { Cta, Y2038 } from '../dyk/Y2038';
import AUDIO from '../config/audioManifest.json';

export const TOTAL = T_FRAMES;
type Comp = React.FC<{ t: number }>;
const S = (id: string) => TL.scenes.find((s) => s.id === id)!;
const GROUPS: { id: string; C: Comp; s: number; e: number; n?: number }[] = [
  { id: 'hook', C: Hook, s: 0, e: S('hook').end },
  { id: 'float', C: Float, s: S('float').start, e: S('float').end, n: 1 },
  { id: 'hash', C: Hash, s: S('hash').start, e: S('hash').end, n: 2 },
  { id: 'tokens', C: Tokens, s: S('tokens').start, e: S('tokens').end, n: 3 },
  { id: 'y2038', C: Y2038, s: S('y2038').start, e: S('y2038').end, n: 4 },
  { id: 'cta', C: Cta, s: S('cta').start, e: TL.total + 1 },
];

const World: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.night2} 0%, ${C.night} 62%, ${C.deep} 100%)` }}>
    <div style={{ position: 'absolute', left: -200, top: -220, width: 1000, height: 1000, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,184,102,0.16) 0%, rgba(255,184,102,0) 70%)' }} />
    <div style={{ position: 'absolute', right: -260, top: 500, width: 900, height: 900, borderRadius: '50%', background: `radial-gradient(circle, rgba(120,130,255,${0.1 + 0.03 * Math.sin(t * 0.8)}) 0%, rgba(120,130,255,0) 70%)` }} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1760, height: 160, background: '#2B1C16' }} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1752, height: 14, background: '#5A3A2A' }} />
  </AbsoluteFill>
);

/** the fact badge: "DID YOU KNOW #n" lands at the top of each fact (a small corner tag after it lands) */
const Badge: React.FC<{ t: number; n: number; s: number }> = ({ t, n, s }) => {
  const u = t - s; if (u < 0) return null;
  const big = 1 - easeOutQuint(clamp((u - 1.0) / 0.35));
  const land = u < 0.22 ? 1 + (1 - easeOutQuint(u / 0.22)) * 0.6 : 1;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 252 + big * 40, display: 'flex', justifyContent: 'center', zIndex: 5, pointerEvents: 'none', opacity: big > 0.02 ? 1 : 0 }}>
      <div style={{ transform: `scale(${land * (0.6 + 0.4 * big)})`, background: C.scale, color: C.ink, border: `6px solid ${C.ink}`, borderRadius: 26, padding: '10px 30px',
        fontFamily: 'Archivo, Inter, sans-serif', fontWeight: 900, fontSize: 64, fontStretch: '82%' }}>DID YOU KNOW #{n}</div>
    </div>
  );
};

export const Reel: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const src = (AUDIO as { reel?: string | null }).reel ?? 'audio/vo.wav';
  return (
    <AbsoluteFill style={{ background: C.night, overflow: 'hidden' }}>
      <World t={t} />
      {GROUPS.map((g, i) => {
        if (!(t >= g.s && t < g.e)) return null;
        const inP = i === 0 ? 1 : easeOutQuint(clamp((t - g.s) / 0.3));
        const outP = i < GROUPS.length - 1 && t >= g.e - 0.18 ? easeInQuint(clamp((t - (g.e - 0.18)) / 0.18)) : 0;
        const x = (1 - inP) * 700 - outP * 700, sk = (1 - inP) * -10 + outP * -10;
        return (
          <AbsoluteFill key={g.id} style={{ transform: `translateX(${x}px) skewX(${sk}deg)` }}>
            <g.C t={t} />
            {g.n && <Badge t={t} n={g.n} s={g.s} />}
          </AbsoluteFill>
        );
      })}
      <Hosts t={t} />
      <Bubble t={t} />
      <Audio src={staticFile(src)} />
    </AbsoluteFill>
  );
};
