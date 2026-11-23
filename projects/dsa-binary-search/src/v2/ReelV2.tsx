// v2 "Pehchaan" cut: kal interview -> binary search in 20 s -> the interviewer quiz -> 3 clues -> CTA.
// Same world, hosts, scale and caption bubble as v1; the timeline is SCENE_TIMINGS.v2.json.
import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { C, FPS } from '../themes/tokens';
import { TL, TOTAL as T_FRAMES, ev } from './tl';
import { clamp, easeInQuint, easeOutQuint } from '../animation/anim';
import { HostsV2 } from './Hosts';
import { Bubble } from './Bubble';
import { Problem } from '../scenes/Problem';
import { Simple } from './Simple';
import { Quiz } from './Quiz';
import { CtaV2, Rule } from './Rule';
import AUDIO from '../config/audioManifest.json';

export const TOTAL_V2 = T_FRAMES;
type Comp = React.FC<{ t: number }>;
const S = (id: string) => TL.scenes.find((s) => s.id === id)!;
const ProblemV2: Comp = ({ t }) => <Problem t={t} at={{ notif: -0.22, headDrop: ev('headDrop'), whack: ev('scaleToss') }} view={{ lo: 1, hi: 1000 }} />;
const GROUPS: { id: string; C: Comp; s: number; e: number; whipIn: boolean }[] = [
  { id: 'problem', C: ProblemV2, s: 0, e: S('problem').end, whipIn: false },
  { id: 'simple', C: Simple, s: S('simple').start, e: S('simple').end, whipIn: false },   // the tossed scale hands off
  { id: 'quiz', C: Quiz, s: S('quiz').start, e: S('quiz').end, whipIn: false },           // the cards slide in themselves
  { id: 'rule', C: Rule, s: S('rule').start, e: S('rule').end, whipIn: true },
  { id: 'cta', C: CtaV2, s: S('cta').start, e: TL.total + 1, whipIn: true },
];
const WHIP = 0.3;

const World: React.FC<{ t: number; tone: string }> = ({ t, tone }) => {
  const quiz = tone === 'quiz', end = tone === 'rule' || tone === 'cta';
  const top = end ? '#2A2F78' : quiz ? '#1A1E58' : C.night2, bot = end ? '#5B3C6E' : C.night;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top} 0%, ${bot} 62%, ${C.deep} 100%)` }}>
      <div style={{ position: 'absolute', left: -200, top: -220, width: 1000, height: 1000, borderRadius: '50%',
        background: `radial-gradient(circle, ${end ? 'rgba(255,190,120,0.26)' : 'rgba(255,184,102,0.16)'} 0%, rgba(255,184,102,0) 70%)` }} />
      <div style={{ position: 'absolute', right: -260, top: 500, width: 900, height: 900, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(120,130,255,${0.1 + 0.03 * Math.sin(t * 0.8)}) 0%, rgba(120,130,255,0) 70%)` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1760, height: 160, background: '#2B1C16' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1752, height: 14, background: '#5A3A2A' }} />
    </AbsoluteFill>
  );
};

export const ReelV2: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const cur = GROUPS.find((g) => t >= g.s && t < g.e) ?? GROUPS[GROUPS.length - 1];
  const src = (AUDIO as { reel_v2?: string | null }).reel_v2 ?? 'audio/vo_v2.wav';
  // the scale leaves when the quiz starts (slides up out of frame)
  return (
    <AbsoluteFill style={{ background: C.night, overflow: 'hidden' }}>
      <World t={t} tone={cur.id} />
      {GROUPS.map((g, i) => {
        const nxt = GROUPS[i + 1];
        const out0 = g.id === 'simple' ? ev('quizIn') - 0.05 : g.e - 0.18;
        if (!(t >= g.s && t < (g.id === 'simple' ? Math.max(g.e, ev('quizIn') + 0.4) : g.e))) return null;
        const inP = g.whipIn ? easeOutQuint(clamp((t - g.s) / WHIP)) : 1;
        const leaving = (nxt && nxt.whipIn) || g.id === 'simple';
        const outP = leaving && t >= out0 ? easeInQuint(clamp((t - out0) / (g.id === 'simple' ? 0.4 : 0.18))) : 0;
        const x = (1 - inP) * 700 - (g.id === 'simple' ? 0 : outP * 700), y = g.id === 'simple' ? -outP * 1100 : 0;
        return (
          <AbsoluteFill key={g.id} style={{ transform: `translate(${x}px, ${y}px) skewX(${(1 - inP) * -10 + (g.id === 'simple' ? 0 : outP * -10)}deg)` }}>
            <g.C t={t} />
          </AbsoluteFill>
        );
      })}
      <HostsV2 t={t} />
      <Bubble t={t} />
      <Audio src={staticFile(src)} />
    </AbsoluteFill>
  );
};
