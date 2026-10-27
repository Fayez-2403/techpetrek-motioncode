// The LiteLLM 1.107.0 reel: nine scenes on the Liam take (SCENE_TIMINGS.json), word-level karaoke captions, grain, the mix.
import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import audio from '../data/audioManifest.json';
import { TIMINGS } from '../data/version';
import { clamp, easeOutCubic, invLerp } from '../lib/anim';
import { F } from '../styles/typography';
import { Grain, Vignette } from '../components/Backdrop';
import { FPS, K, SEGS, seg } from './kit';
import { HookA, HookB } from './Hook';
import { Cta, Recover } from './Payoff';
import { DontRun, Release, RootCause, Startup, Targets } from './Story';

const SCENES: Record<string, React.FC> = { hookA: HookA, hookB: HookB, release: Release, startup: Startup, targets: Targets, rootcause: RootCause, dontrun: DontRun, recover: Recover, cta: Cta };

interface Word { w: string; t0: number; t1: number }
interface Cap { line: string; t0: number; t1: number; words: Word[] }
const CAPS: Cap[] = (TIMINGS as unknown as { variants: { reel: { captions: Cap[] } } }).variants.reel.captions;
/** caption groups: at most 6 words each (2 lines at 54 px inside 840 px) */
const GROUPS: Word[][] = CAPS.flatMap((c) => {
  const n = Math.ceil(c.words.length / 6), size = Math.ceil(c.words.length / n), out: Word[][] = [];
  for (let i = 0; i < c.words.length; i += size) out.push(c.words.slice(i, i + size));
  return out;
});
const KEY = /^(LiteLLM|Python|pip|AI|API|keys?|risk|malware|Microsoft|hacked|hijack|revoke|rotate|Isolate|rebuild|SAFETY|chori|chura|nahi|mat|GitHub|master|Import|LOL)/i;

const Captions: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const i = GROUPS.findIndex((g, k) => t >= g[0].t0 - 0.05 && t < Math.min(g[g.length - 1].t1 + 0.45, (GROUPS[k + 1]?.[0].t0 ?? 1e9) - 0.05));
  if (i < 0) return null;
  const g = GROUPS[i];
  const p = easeOutCubic(invLerp(g[0].t0 - 0.05, g[0].t0 + 0.1, t));
  const long = g.map((w) => w.w).join(' ').length > 34;
  return (
    <div style={{ position: 'absolute', left: 120, right: 120, top: 1420, display: 'flex', justifyContent: 'center', zIndex: 80 }}>
      <div style={{ textAlign: 'center', padding: '10px 24px', borderRadius: 14, background: 'rgba(5,8,14,0.78)', opacity: p, transform: `translateY(${(1 - p) * 12}px) scale(${0.96 + 0.04 * p})`,
        fontFamily: F.head, fontWeight: 800, fontSize: long ? 48 : 56, lineHeight: 1.12 }}>
        {g.map((w, k) => {
          const spoken = t >= w.t0 - 0.03, key = KEY.test(w.w) || /\d/.test(w.w);
          const pp = 1 - clamp((t - w.t0 + 0.03) / 0.16);
          return (
            <React.Fragment key={k}>
              <span style={{ display: 'inline-block', color: spoken ? (key ? K.yellow : '#fff') : 'rgba(236,239,244,0.45)', transform: spoken && pp > 0 ? `scale(${1 + 0.1 * pp})` : undefined }}>{w.w}</span>
              {k < g.length - 1 ? ' ' : ''}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/** thin progress bar inside the safe area (retention cue) */
const Progress: React.FC = () => {
  const f = useCurrentFrame(), last = seg('cta');
  return <div style={{ position: 'absolute', left: 120, top: 1590, height: 6, width: 840 * clamp(f / (last.from + last.durationInFrames)), background: K.orange, borderRadius: 3, opacity: 0.7, zIndex: 81 }} />;
};

/** the scene under the playhead (scenes read the film frame themselves) */
const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const s = SEGS.find((x) => f >= x.from && f < x.from + x.durationInFrames) ?? SEGS[SEGS.length - 1];
  const S = SCENES[s.id];
  return <AbsoluteFill key={s.id}><S /></AbsoluteFill>;
};

export const LiteReel: React.FC = () => (
  <AbsoluteFill style={{ background: K.navy }}>
    <Scene />
    <Vignette strength={0.5} />
    <Captions />
    <Progress />
    <Grain opacity={0.05} />
    <Audio src={staticFile(audio.reel)} />
  </AbsoluteFill>
);
