// Bro & Bhai ep 01: Claude Code Game Studios. 1080x1920, 60 fps, 62 s (v5): the intro hook (its own length, the fast game
// level) then 17 fixed 3 s slots (the user's storyboard), Bro bottom-left and Bhai bottom-right talking it through. Every pixel is a pure function of t = frame / 60:
// slot timing from voScript.json, word timing from the voices' own alignment (audio/out/lines_duo.json), the beat map from
// audio/out/beats_ep01.json. Seeking straight to any frame gives the same image.
import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { C, FONT, FPS } from '../themes/tokens';
import { beatPulse, clamp, easeInCubic, invLerp } from '../animation/anim';
import { BPM, LINES, SLOT, TOTAL_S, slotAt, slotLen, slotStart, speaking, wordAt, type Line } from '../ep01/data';
import { Host, Source, Type3D, sp } from '../ep01/kit';
import { SCENES, SOURCED } from '../ep01/scenes';
import { GameHook } from '../ep01/hook';
import VIS from '../../audio/out/visemes_ep01.json';

export const EP01_FRAMES = Math.round(TOTAL_S * FPS);
void SLOT;
/** host poses per slot: [speaker's pose, listener's reaction] (public/hosts/<who>_<pose>.png, cut from the approved
 *  pose sheets by scripts/cut_poses.py). The speaker's pose fits the line; the listener reacts. */
type Pose = 'neutral' | 'talk' | 'point' | 'think' | 'shock' | 'laugh' | 'thumbs' | 'shrug' | 'hype';
const POSE: [Pose, Pose][] = [
  ['shock', 'neutral'], ['point', 'think'], ['hype', 'thumbs'], ['point', 'think'], ['talk', 'neutral'], ['thumbs', 'neutral'],
  ['shock', 'hype'], ['hype', 'shock'], ['talk', 'thumbs'], ['point', 'think'], ['talk', 'thumbs'], ['talk', 'think'],
  ['laugh', 'laugh'], ['shock', 'laugh'], ['laugh', 'shock'], ['shrug', 'neutral'], ['point', 'think'], ['hype', 'thumbs'],
];
const poseOf = (who: 'bro' | 'bhai', k: number, speaker: string) => `hosts/${who}_${POSE[k][speaker === who ? 0 : 1]}.png`;
/** v7 lip sync: while a host speaks, his mouth follows his own audio (scripts/audio/visemes.py: m/e/a/o at 15 per s, the
 *  talk_* frames of the v4 sheets); his slot gesture lands on the line's first 0.4 s and on its key word. */
const VL = (VIS as { rate: number; lines: Record<string, string> });
const hostSrc = (who: 'bro' | 'bhai', l: Line, t: number) => {
  if (l.who !== who || !speaking(who, t)) return poseOf(who, l.k, l.who);
  const kw = l.words.find((w) => w.w.replace(/[?!.,…:]+$/, '') === KEY[l.k].replace(/[?!.,…:]+$/, ''));
  if (t < l.at + 0.4 || (kw && t > kw.t0 - 0.08 && t < kw.t1 + 0.3)) return poseOf(who, l.k, l.who);
  const v = VL.lines[l.id]?.[Math.floor((t - l.at) * VL.rate)] ?? 'm';
  return `hosts/${who}_talk_${v}.png`;
};
/** the one cyan keyword per line (the word that carries the slot's TYPE) */
const KEY = ['49', 'studio', 'open-source', 'directors', 'specialists.', 'QA', '49', '74', 'hooks,', 'idea', 'milestones', 'review', 'platformer', 'QA', '49', 'one-click', 'costs', 'STUDIO.'];

/** word-level subtitles in 2-4 word bursts; the key word cyan, words not yet spoken faint */
const Captions: React.FC<{ l: Line; t: number }> = ({ l, t }) => {
  const groups: number[][] = []; let g: number[] = [];
  l.words.forEach((_, i) => { g.push(i); if (g.length >= 4 || /[.?!,…]$/.test(l.words[i].w) && g.length >= 2) { groups.push(g); g = []; } });
  if (g.length) groups.push(g);
  const cur = Math.max(0, wordAt(l, t)), gi = t < l.words[0].t0 - 0.1 ? -1 : groups.findIndex((x) => x.includes(cur));
  const grp = gi >= 0 ? groups[gi] : t > l.words[l.words.length - 1].t1 ? groups[groups.length - 1] : null;
  if (!grp || t > l.at + l.dur + 0.35) return null;
  const g0 = l.words[grp[0]].t0, s = sp(t - g0, 0, 18, 0.6), col = l.who === 'bro' ? C.bro : C.bhai;
  return (
    <div style={{ position: 'absolute', left: 70, right: 70, top: l.k === 0 ? 330 : 1196, display: 'flex', justifyContent: 'center', zIndex: 8 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', padding: '12px 26px', borderRadius: 22, background: 'rgba(255,255,255,0.92)', borderLeft: `8px solid ${col}`,
        boxShadow: '0 10px 30px rgba(11,27,58,0.12)', transform: `scale(${0.92 + 0.08 * s})`, fontFamily: FONT.display, fontWeight: 900, fontSize: 52, fontStretch: '86%' }}>
        {grp.map((i) => {
          const w = l.words[i], said = t >= w.t0 - 0.02, key = w.w.replace(/[?!.,…:]+$/, '') === KEY[l.k].replace(/[?!.,…:]+$/, '');
          return <span key={i} style={{ color: key ? C.cyanDeep : C.navy, opacity: said ? 1 : 0.32, textShadow: key ? `0 0 18px ${C.cyan}66` : undefined }}>{w.w}</span>;
        })}
      </div>
    </div>
  );
};

export const Ep01: React.FC = () => {
  const t = useCurrentFrame() / FPS, { k, u: u0, line } = slotAt(t);
  const u = u0;
  const Scene = SCENES[k];
  const L = slotLen(k), exit = easeInCubic(invLerp(L - 0.16, L, u0)), enter = sp(u, 0, 15, 0.7);
  const pulse = beatPulse(t, BPM, 9);
  const caveat = t >= slotStart(14) && t < slotStart(16), myth = caveat;   // slots 15-16: dark "myth mode" (pattern interrupt)
  // camera: every cut lands 6 % in and springs back, then a slow push-in through the slot (a fresh frame every 3 s)
  const cam = 1 + 0.06 * (1 - sp(u0, 0, 11, 0.75)) + 0.025 * (u0 / L);
  const lx = k % 2 ? 72 : 28, ly = 22 + (k % 3) * 8;       // the light pool moves on every cut
  const bump = 1 + 0.018 * pulse;                            // the stage bumps on every beat
  const shake = u0 < 0.18 ? Math.sin(u0 * 95) * 9 * (1 - u0 / 0.18) : 0;   // a short hit-shake on each cut
  const bg = myth ? `radial-gradient(110% 60% at ${lx}% ${ly}%, #24376a 0%, #0b1b3a 60%, #070f22 100%)`
    : `radial-gradient(110% 60% at ${lx}% ${ly}%, #ffffff 0%, ${C.sky0} 55%, #c2e1f8 100%)`;
  return (
    <AbsoluteFill style={{ background: bg, overflow: 'hidden' }}>
     {k === 0 ? <GameHook t={t} /> : (<>
      {/* drifting sparkle field (seeded positions, pure in t) */}
      {Array.from({ length: 34 }, (_, i) => {
        const r1 = ((i * 9301 + 49297) % 233280) / 233280, r2 = ((i * 4733 + 1013) % 9973) / 9973;
        const y = (((r2 * 1920 - t * (40 + 70 * r1)) % 1920) + 1920) % 1920, x = r1 * 1080 + Math.sin(t * (0.6 + r2) + i) * 30;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: 6 + 8 * r1, height: 6 + 8 * r1, borderRadius: '50%', background: i % 3 ? C.cyan : C.magenta, opacity: (myth ? 0.55 : 0.28) * (0.5 + 0.5 * pulse) }} />;
      })}
     <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.5}px) scale(${cam})`, transformOrigin: '50% 45%' }}>
      {/* a soft cyan floor glow that breathes on the beat */}
      <div style={{ position: 'absolute', left: -200, right: -200, top: 1050, height: 900, background: `radial-gradient(50% 50% at 50% 50%, ${C.cyan}${Math.round(26 + 20 * pulse).toString(16)}, transparent 70%)` }} />
      {/* top strip: chapter + counter (inside the safe zone, below y 220) */}
      <div style={{ position: 'absolute', left: 70, right: 70, top: 228, display: 'flex', justifyContent: 'space-between', fontFamily: FONT.mono, fontSize: 22, color: myth ? '#9fb3d9' : C.navy2 }}>
        <span>// {String(k + 1).padStart(2, '0')} — {line.type.toLowerCase()}</span>
        <span><span style={{ color: C.magenta, fontWeight: 800 }}>{String(k + 1).padStart(2, '0')}</span>/18</span>
      </div>
      <Type3D key={`t${k}`} text={line.type} u={u} y={272} size={line.type.length > 16 ? 92 : 112} col={myth ? '#ffffff' : C.navy} />
      {/* the stage: enters on a spring, leaves accelerating (the next slot's spring takes over on the cut) */}
      <AbsoluteFill style={{ transform: `translateY(${(1 - enter) * 70 - exit * 40}px) scale(${(0.94 + 0.06 * clamp(enter) - 0.04 * exit) * bump})`, opacity: clamp(enter * 2.5) * (1 - exit) }}>
        <Scene u={u} />
      </AbsoluteFill>
      {SOURCED.has(k) ? <Source u={u} /> : null}
      {caveat ? (
        <div style={{ position: 'absolute', left: 70, right: 70, top: 470, textAlign: 'center', opacity: clamp((t - slotStart(14)) / 0.2) }}>
          <span style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 14, background: C.magenta, color: '#fff', fontFamily: FONT.ui, fontWeight: 800, fontSize: 27 }}>
            49 roles ≠ 49 employees · not a one-click game
          </span>
        </div>
      ) : null}
     </AbsoluteFill>
     </>)}
      {k === 0 ? null : <>
      <Host who="bro" t={t} u={u0} talk={speaking('bro', t)} listen={line.who === 'bhai'} src={hostSrc('bro', line, t)} />
      <Host who="bhai" t={t} u={u0} talk={speaking('bhai', t)} listen={line.who === 'bro'} src={hostSrc('bhai', line, t)} />
      </>}
      <Captions l={line} t={t} />
      {/* each cut: a quick white flash band (pattern interrupt, 4 frames) */}
      {k > 0 && u0 < 0.06 ? <AbsoluteFill style={{ background: `rgba(235,250,255,${0.75 * (1 - u0 / 0.06)})` }} /> : null}
      <Audio src={staticFile('audio/mix_ep01.wav')} />
    </AbsoluteFill>
  );
};
export { LINES };
