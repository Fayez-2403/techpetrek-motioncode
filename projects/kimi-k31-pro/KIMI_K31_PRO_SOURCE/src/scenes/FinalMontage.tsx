// 12 · CREATOR PAYOFF. A fast montage built only from shots already in the film (each scene is a pure function of its
// frame, so a shot is just that scene played from an offset), cut on the narration's words ("Coding, 3D, research,
// agents."), then the title "KIMI K3.1 PRO → FROM THINKING TO BUILDING." and the end card.
import React from 'react';
import { AbsoluteFill, Freeze, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';
import timings from '../../SCENE_TIMINGS.json';
import { LABELS, NAMES } from '../data/verifiedClaims';
import { easeInOutCubic, easeOutCubic, easeOutExpo, invLerp, lerp, reveal, window_ } from '../lib/anim';
import { useLayout } from '../lib/layout';
import { C } from '../styles/theme';
import { F } from '../styles/typography';
import { KineticTitle } from '../components/KineticTitle';
import { CodingWorld } from './CodingWorld';
import { CADLaboratory } from './CADLaboratory';
import { FinanceResearch } from './FinanceResearch';
import { AgentWorkflow } from './AgentWorkflow';
import { HumanSimulation } from './HumanSimulation';
import { ModelReveal } from './ModelReveal';
import type { SceneId, SceneProps, Variant } from './types';

const FPS = 30;
const COMP: Partial<Record<SceneId, React.FC<SceneProps>>> = { coding: CodingWorld, cad: CADLaboratory, finance: FinanceResearch, agents: AgentWorkflow, human: HumanSimulation, reveal: ModelReveal };

const sceneDur = (v: Variant, id: SceneId) => timings.variants[v].scenes.find((s) => s.id === id)?.durationInFrames ?? 0;

/** word start times (s, relative to this scene) of the payoff line, from the caption timings */
function payoffWords(v: Variant) {
  const tm = timings.variants[v];
  const start = tm.scenes.find((s) => s.id === 'payoff')!.start;
  const line = tm.vo.find((x) => x.scene === 'payoff')!.id;
  return tm.captions.filter((c) => c.line === line).flatMap((c) => c.words.map((w) => ({ w: w.w, t: w.t0 - start })));
}

/** one montage shot: scene `id` played from `at` (fraction of its own length), with a gentle push */
const Shot: React.FC<{ id: SceneId; at: number; variant: Variant; len: number; source?: Variant }> = ({ id, at, variant, len, source }) => {
  const f = useCurrentFrame();
  const v = source ?? variant;
  const Comp = COMP[id]!;
  const d = sceneDur(v, id) || sceneDur('master', id);
  const s = lerp(1.0, 1.045, easeOutCubic(f / Math.max(1, len)));
  return (
    <AbsoluteFill style={{ transform: `scale(${s})` }}>
      <Sequence from={-Math.round(at * d)} layout="none">
        <Comp dur={d} variant={v} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const FinalMontage: React.FC<SceneProps> = ({ dur, variant }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const reel = variant === 'reel';
  const words = payoffWords(variant);
  const wt = (i: number, fallback: number) => Math.round((words[i]?.t ?? fallback) * FPS);
  // cut points by word (Hinglish v1 or English v2): after "agents." -> title; "kaam"/"but" -> FROM THINKING; "Aap"/"So" -> end card
  const find = (re: RegExp, after = 0) => { const k = words.findIndex((w, j) => j >= after && re.test(w.w.replace(/[,.?!:]+$/, ''))); return k; };
  const iAgents = find(/^agents$/i), iThink = find(/^(kaam|but)$/i, iAgents + 1), iEnd = find(/^(Aap|So)$/i, iThink + 1);

  // shot list, cut on words: master "Coding, 3D, research, agents." / reel: fixed fast cuts before the question
  const shots: { id: SceneId; at: number; from: number }[] = reel
    // offsets chosen where every number on screen has finished counting (a montage never shows a mid-count value)
    ? [{ id: 'coding', at: 0.74, from: 0 }, { id: 'cad', at: 0.4, from: 10 }, { id: 'human', at: 0.82, from: 20 }, { id: 'finance', at: 0.44, from: 30 }, { id: 'reveal', at: 0.3, from: 40 }]
    : [{ id: 'coding', at: 0.84, from: 0 }, { id: 'cad', at: 0.66, from: wt(1, 0.75) }, { id: 'finance', at: 0.72, from: wt(2, 1.5) },
       { id: 'agents', at: 0.86, from: wt(3, 2.2) }, { id: 'human', at: 0.82, from: wt(3, 2.2) + 16 }, { id: 'reveal', at: 0.3, from: wt(3, 2.2) + 30 }];
  const titleAt = reel ? 40 : wt(iAgents + 1, 3.5) - 4;              // "Focus ab sirf answers par nahi" -> title over the sphere
  const thinkAt = reel ? 50 : wt(iThink, 5.9) - 2;              // "kaam deliver karne par hai" -> FROM THINKING TO BUILDING
  const endAt = reel ? 78 : wt(iEnd, 8.4) - 6;   // the question -> end card

  const last = shots[shots.length - 1];
  return (
    <AbsoluteFill style={{ background: C.void }}>
      {shots.map((s, i) => {
        const to = i < shots.length - 1 ? shots[i + 1].from : endAt;
        const len = Math.max(1, to - s.from);
        if (s === last) {
          // the sphere is held (frozen before its own lockup) under the film title
          const d = sceneDur(variant, 'reveal');
          return (
            <Sequence key={i} from={s.from} durationInFrames={len} layout="none">
              <AbsoluteFill style={{ transform: `scale(${lerp(1.0, 1.08, easeOutCubic(invLerp(s.from, to, f)))})`, opacity: 1 - 0.55 * reveal(f, titleAt, 10) }}>
                <Freeze frame={Math.round(s.at * d)}><ModelReveal dur={d} variant={variant} /></Freeze>
              </AbsoluteFill>
            </Sequence>
          );
        }
        return <Sequence key={i} from={s.from} durationInFrames={len} layout="none"><Shot id={s.id} at={s.at} variant={variant} len={len} /></Sequence>;
      })}
      {/* cut flashes on each shot change */}
      {shots.slice(1).map((s, i) => <AbsoluteFill key={i} style={{ background: '#E8F9FF', opacity: 0.32 * Math.max(0, 1 - Math.abs(f - s.from) / 2.5), pointerEvents: 'none' }} />)}

      {/* film title */}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: window_(f, titleAt, endAt, 8), paddingBottom: reel ? 300 : 80 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: reel ? 128 : 150, color: C.lunar, letterSpacing: '0.06em', lineHeight: 1,
            opacity: 1 - 0.75 * reveal(f, thinkAt, 10), transform: `scale(${lerp(1.08, 1, easeOutExpo(invLerp(titleAt, titleAt + 16, f)))})`, textShadow: '0 6px 50px rgba(0,0,0,0.8)' }}>
            {NAMES.brandWord} <span style={{ fontWeight: 300, color: C.cyan, letterSpacing: '0.12em' }}>{NAMES.versionWord}</span>
          </div>
          {f >= thinkAt - 2 && (
            <div style={{ marginTop: reel ? 40 : 48, display: 'flex', flexDirection: reel ? 'column' : 'row', gap: reel ? 18 : 30, alignItems: 'center', justifyContent: 'center' }}>
              <KineticTitle text="FROM THINKING" fx="reason" at={thinkAt} size={reel ? 66 : 76} weight={700} />
              <KineticTitle text="TO BUILDING." fx="build" at={thinkAt + 10} size={reel ? 66 : 76} weight={700} color={C.cyan} />
            </div>
          )}
        </div>
      </AbsoluteFill>

      {/* end card */}
      {f >= endAt && <EndCard at={endAt} dur={dur} reel={reel} />}
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ at: number; dur: number; reel: boolean }> = ({ at, reel }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const p = easeInOutCubic(invLerp(at, at + 14, f));
  return (
    <AbsoluteFill style={{ opacity: p, background: `radial-gradient(90% 70% at 50% ${reel ? '40%' : '46%'}, #0C1640 0%, ${C.void} 75%)`, alignItems: 'center', justifyContent: reel ? 'flex-start' : 'center', paddingTop: reel ? 330 : 0, paddingBottom: reel ? 0 : 120 }}>
      <svg width={L.w} height={L.h} style={{ position: 'absolute', inset: 0, opacity: 0.5 }}>
        <circle cx={L.w / 2} cy={reel ? L.h * 0.4 : L.h * 0.46} r={reel ? 430 : 470} fill="none" stroke={C.cyan} strokeWidth={1.5} strokeDasharray={2950} strokeDashoffset={2950 * (1 - easeInOutCubic(invLerp(at, at + 50, f)))} opacity={0.5} />
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, opacity: reveal(f, at + 4, 12) }}>
        <Img src={staticFile('brand/techpe-trek.jpg')} style={{ width: reel ? 120 : 96, height: reel ? 120 : 96, borderRadius: 22, boxShadow: '0 10px 40px rgba(0,0,0,0.6)' }} />
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: reel ? 46 : 40, color: C.lunar, letterSpacing: '0.02em' }}>TechpeTrek</div>
      </div>
      <div style={{ marginTop: reel ? 70 : 54, textAlign: 'center' }}>
        <KineticTitle text={reel ? 'WHAT WOULD' : 'WHAT WOULD YOU BUILD?'} fx="build" at={at + 8} size={reel ? 92 : 104} weight={800} />
        {reel && <div><KineticTitle text="YOU BUILD?" fx="build" at={at + 16} size={92} weight={800} color={C.cyan} /></div>}
      </div>
      {reel && (
        <div style={{ marginTop: 44, fontFamily: F.text, fontWeight: 650, fontSize: 44, color: C.amber, opacity: reveal(f, at + 34, 12), letterSpacing: '0.04em' }}>{(timings as { version?: string }).version === 'v2' ? 'TELL ME IN THE COMMENTS ↓' : 'COMMENT MEIN BATAO ↓'}</div>
      )}
      <div style={{ position: reel ? 'relative' : 'absolute', marginTop: reel ? 90 : 0, bottom: reel ? undefined : 170, left: 0, right: 0, textAlign: 'center', fontFamily: F.mono, fontSize: reel ? 24 : 19,
        color: C.silver, lineHeight: 1.6, opacity: reveal(f, at + 20, 14), padding: `0 ${L.safe.side}px` }}>
        <div>{LABELS.independent}</div>
        <div>Visuals: illustrative reconstructions & concept visualizations · Numbers: Moonshot-reported</div>
        <div>{LABELS.source}</div>
      </div>
    </AbsoluteFill>
  );
};
