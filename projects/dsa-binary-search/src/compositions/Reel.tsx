// The reel: one world (the PG room at night), one hero object (the scale), the two hosts, the speech-bubble captions.
// Scenes come from SCENE_TIMINGS.json; they enter already moving (whip) except where the scale itself hands off.
import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { C, FPS } from '../themes/tokens';
import { TL, TOTAL as T_FRAMES } from '../tl';
import { clamp, easeInQuint, easeOutQuint } from '../animation/anim';
import { Hosts } from '../chars/Hosts';
import { Bubble } from '../components/Bubble';
import { Hook } from '../scenes/Hook';
import { Problem } from '../scenes/Problem';
import { Game } from '../scenes/Game';
import { Code } from '../scenes/Code';
import { Office } from '../scenes/Office';
import { Hero } from '../scenes/Hero';
import { Exam } from '../scenes/Exam';
import { Cta, Payoff } from '../scenes/Payoff';
import AUDIO from '../config/audioManifest.json';

export const TOTAL = T_FRAMES;
type Comp = React.FC<{ t: number }>;
// visual groups (exam + border are one continuous scene)
const S = (id: string) => TL.scenes.find((s) => s.id === id)!;
const GROUPS: { id: string; C: Comp; s: number; e: number; whipIn: boolean }[] = [
  { id: 'hook', C: Hook, s: 0, e: S('hook').end, whipIn: false },
  { id: 'problem', C: Problem, s: S('problem').start, e: S('problem').end, whipIn: true },
  { id: 'game', C: Game, s: S('game').start, e: S('game').end, whipIn: false },
  { id: 'code', C: Code, s: S('code').start, e: S('code').end, whipIn: false },
  { id: 'office', C: Office, s: S('office').start, e: S('office').end, whipIn: true },
  { id: 'hero', C: Hero, s: S('hero').start, e: S('hero').end, whipIn: true },
  { id: 'exam', C: Exam, s: S('exam').start, e: S('border').end, whipIn: true },
  { id: 'payoff', C: Payoff, s: S('payoff').start, e: S('payoff').end, whipIn: true },
  { id: 'cta', C: Cta, s: S('cta').start, e: TL.total + 1, whipIn: true },
];
const WHIP = 0.3;

const World: React.FC<{ t: number; tone: string }> = ({ t, tone }) => {
  const office = tone === 'office', morning = tone === 'payoff' || tone === 'cta';
  const top = morning ? '#2A2F78' : office ? '#0E1A3E' : C.night2, bot = morning ? '#5B3C6E' : office ? '#081028' : C.night;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top} 0%, ${bot} 62%, ${C.deep} 100%)` }}>
      <div style={{ position: 'absolute', left: -200, top: -220, width: 1000, height: 1000, borderRadius: '50%',
        background: `radial-gradient(circle, ${morning ? 'rgba(255,190,120,0.28)' : 'rgba(255,184,102,0.16)'} 0%, rgba(255,184,102,0) 70%)` }} />
      <div style={{ position: 'absolute', right: -260, top: 500, width: 900, height: 900, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(120,130,255,${0.1 + 0.03 * Math.sin(t * 0.8)}) 0%, rgba(120,130,255,0) 70%)` }} />
      {/* the desk line the hosts sit behind */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1760, height: 160, background: '#2B1C16' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1752, height: 14, background: '#5A3A2A' }} />
    </AbsoluteFill>
  );
};

export const Reel: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cur = GROUPS.find((g) => t >= g.s && t < g.e) ?? GROUPS[GROUPS.length - 1];
  const src = (AUDIO as { reel?: string | null }).reel ?? 'audio/vo.wav';
  return (
    <AbsoluteFill style={{ background: C.night, overflow: 'hidden' }}>
      <World t={t} tone={cur.id} />
      {GROUPS.map((g, i) => {
        const nxt = GROUPS[i + 1];
        const leaving = nxt && nxt.whipIn && t >= g.e - 0.18 && t < g.e;
        if (!(t >= g.s && t < g.e)) return null;
        const inP = g.whipIn ? easeOutQuint(clamp((t - g.s) / WHIP)) : 1;
        const outP = leaving ? easeInQuint(clamp((t - (g.e - 0.18)) / 0.18)) : 0;
        const x = (1 - inP) * 700 - outP * 700;
        const skew = (1 - inP) * -10 + outP * -10;
        return (
          <AbsoluteFill key={g.id} style={{ transform: `translateX(${x}px) skewX(${skew}deg)` }}>
            <g.C t={t} />
          </AbsoluteFill>
        );
      })}
      <Hosts t={t} />
      <Bubble t={t} />
      <Audio src={staticFile(src)} />
    </AbsoluteFill>
  );
};
