// V2 hook (the user's): "Sheetal… ne AI se poocha… AI ne jawab bata diya… Munni ko! Ab Munni iska kya kare? Where is the
// confusion, me lord?!", one continuous shot over the three hook scenes, plus the recon payoff (Munni's reply holds Sheetal's
// text). Who is who follows the incident (FACTS.md F2, F5, F7): the over-long request (Munni's 7-lakh-token file) got a reply
// built over stale pages from an earlier request (Sheetal's prompt). Names and chats are fictional and labelled so.
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { clamp, invLerp, lerp } from '../lib/anim';
import { wf } from '../lib/words';
import { C, FONT, Icon, Illus, Punch, SAFE, SH, arrive, depart, hit, inout, land, seg, useScene } from './kit';

const card: React.CSSProperties = { background: C.white, borderRadius: 28, border: `1px solid ${C.line}`, boxShadow: SH.s32 };
const ui = (size: number, color: string = C.ink, weight = 700): React.CSSProperties => ({ fontFamily: FONT.ui, fontSize: size, color, fontWeight: weight, letterSpacing: '-0.01em' });
const mono = (size: number, color: string = C.ink, weight = 600): React.CSSProperties => ({ fontFamily: FONT.mono, fontSize: size, color, fontWeight: weight });
const Avatar: React.FC<{ ch: string; col: string; size?: number }> = ({ ch, col, size = 64 }) => (
  <div style={{ width: size, height: size, borderRadius: size / 2, background: col, display: 'flex', alignItems: 'center', justifyContent: 'center', ...ui(size * 0.5, '#fff', 800), flex: 'none' }}>{ch}</div>
);

/** Sheetal's chat: her question, and a reply that never arrives (typing dots) */
const Dots: React.FC<{ f: number; col: string }> = ({ f, col }) => (
  <>{[0, 1, 2].map((i) => <div key={i} style={{ width: 16, height: 16, borderRadius: 8, background: col, opacity: 0.35 + 0.65 * Math.max(0, Math.sin((f / 60) * 7 - i * 0.9)) }} />)}</>
);
const SheetalCard: React.FC<{ f: number; q: number; dots: boolean }> = ({ f, q, dots }) => (
  <div style={{ ...card, padding: '28px 32px 30px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Avatar ch="S" col={C.violet} />
      <div style={{ ...ui(38, C.ink, 800) }}>Sheetal</div>
      <div style={{ marginLeft: 'auto', padding: '8px 14px', borderRadius: 10, background: C.cyanSoft, ...mono(22, C.cyanInk) }}>@cf/zai-org/glm-5.3</div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, height: 88 }}>
      {q > 0 ? (
        <div style={{ background: C.violet, borderRadius: '26px 26px 8px 26px', padding: '18px 26px', ...ui(42, '#fff', 600), opacity: clamp(q * 1.5), transform: `translateY(${(1 - q) * 30}px) scale(${1.15 - 0.15 * q})`, transformOrigin: '100% 100%' }}>Market growth kaisi rahegi?</div>
      ) : (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '0 26px', borderRadius: '26px 26px 8px 26px', background: C.violetSoft }}><Dots f={f} col={C.violet} /></div>
      )}
    </div>
    {dots ? (
      <div style={{ display: 'inline-flex', gap: 10, marginTop: 22, padding: '20px 26px', borderRadius: '26px 26px 26px 8px', background: '#F3F6FC' }}>
        <Dots f={f} col={C.ink3} />
      </div>
    ) : null}
  </div>
);

/** Munni's chat: her very long request, and a reply carrying Sheetal's text (the leak chip flies in from `from`) */
export const MunniCard: React.FC<{ leak: number; from: [number, number] }> = ({ leak, from }) => {
  const lp = land(clamp(leak));
  return (
    <div style={{ ...card, padding: '28px 32px 34px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Avatar ch="M" col={C.blue} />
        <div style={{ ...ui(38, C.ink, 800) }}>Munni</div>
        <div style={{ marginLeft: 'auto', padding: '8px 14px', borderRadius: 10, background: C.cyanSoft, ...mono(22, C.cyanInk) }}>@cf/zai-org/glm-5.3</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
        <div style={{ background: C.blue, borderRadius: '26px 26px 8px 26px', padding: '16px 22px', color: '#fff' }}>
          <div style={{ display: 'inline-flex', gap: 10, alignItems: 'center', padding: '8px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.18)', ...mono(24, '#fff') }}>
            <Icon name="code" size={28} color="#fff" sw={2} /> notes.txt · 7 lakh tokens
          </div>
          <div style={{ ...ui(38, '#fff', 600), marginTop: 10 }}>Iska summary do</div>
        </div>
      </div>
      <div style={{ marginTop: 22, minHeight: 128, background: '#F3F6FC', borderRadius: '26px 26px 26px 8px', padding: '20px 24px', ...ui(36, C.ink, 500), lineHeight: 1.3 }}>
        Summary:{' '}
        {leak > 0 ? (
          <span style={{ display: 'inline-block', position: 'relative', marginTop: 34, transform: `translate(${(1 - lp) * from[0]}px, ${(1 - lp) * from[1]}px) scale(${1.4 - 0.4 * lp})`, transformOrigin: '0 50%' }}>
            <span style={{ position: 'absolute', left: 4, top: -32, ...ui(22, C.coralInk, 800), whiteSpace: 'nowrap' }}>Sheetal ka text</span>
            <span style={{ padding: '4px 14px', borderRadius: 12, background: C.coralSoft, border: `2.5px solid ${C.coral}`, ...ui(34, C.coralInk, 700), boxShadow: `0 0 ${24 * lp}px rgba(255,109,115,0.55)`, whiteSpace: 'nowrap' }}>
              “market growth kaisi rahegi…”
            </span>
          </span>
        ) : null}
      </div>
    </div>
  );
};

/** the three hook scenes share one shot; time runs from the start of "hook" */
export const HookV2: React.FC = () => {
  const f = useCurrentFrame(), l = f - seg('hook').from, end = seg('hook3').from + seg('hook3').durationInFrames - seg('hook').from;
  const W = (line: string, word: string) => wf(line, word) - seg('hook').from;
  const pc = W('h01', 'poocha:'), aur = W('h02', 'Aur'), jw = W('h02', 'jawab'), mu = W('h02', 'Munni'), ab = W('h03', 'Ab'), wh = W('h03', 'Where');
  const h2 = seg('hook2').from - seg('hook').from;
  // Sheetal's card: hero, then it shrinks up as Munni's arrives, then leaves on "Ab"
  const shrink = inout(invLerp(jw - 12, jw + 14, l)), gone = depart(l, ab - 6, 14);
  // Munni's card: slides up on "jawab", becomes the hero on "Ab"
  const mIn = arrive(l, jw - 6, 18), hero = inout(invLerp(ab - 6, ab + 18, l));
  const leak = (l - (mu - 18)) / 18;
  const out = depart(l, end - 10, 10);
  const label = (t: string, at: number, color: string) => {
    const p = arrive(l, at, 10);
    return <span style={{ display: 'inline-block', color, transform: `scale(${1.35 - 0.35 * p})`, opacity: clamp(p * 2.5), transformOrigin: '50% 70%' }}>{t}</span>;
  };
  return (
    <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-out * 500}px)` }}>
      {/* the names are the hook: each lands huge on its spoken cue, the previous one makes room */}
      <div style={{ position: 'absolute', left: 60, right: 60, top: 175, height: 260, textAlign: 'center', fontFamily: FONT.ui, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
        {l < h2 ? <div style={{ fontSize: 170, transform: `translateY(${depart(l, h2 - 8, 8) * -40}px) scale(${1 + 0.09 * inout(clamp(l / h2))})` }}>{label('SHEETAL', -3, C.violet)}</div> : null}
        {l >= h2 && l < ab - 4 ? (
          <div style={{ fontSize: 150 }}>{l >= mu - 2 ? <>{label('MUNNI', mu - 2, C.blueInk)} {label('KO?!', mu + 6, C.ink)}</> : <span style={{ fontSize: 84, whiteSpace: 'nowrap' }}>{label('AI NE', aur, C.ink)} {label('JAWAB', jw, C.ink)} {label('DIYA…', jw + 10, C.ink3)}</span>}</div>
        ) : null}
        {l >= ab - 4 && l < wh - 2 ? <div style={{ fontSize: 112 }}>{label('AB MUNNI', ab - 4, C.blueInk)} {label('KYA KARE?', ab + 8, C.ink)}</div> : null}
        {l >= wh - 2 ? <div style={{ fontSize: 92, lineHeight: 1.02 }}>{label('WHERE IS THE', wh - 2, C.ink)} {label('CONFUSION,', wh + 8, C.coralInk)} {label('ME LORD?!', W('h03', 'me') - 2, C.ink)}</div> : null}
      </div>
      <div style={{ position: 'absolute', left: SAFE.x, width: SAFE.w, top: lerp(560, 430, shrink), transform: `scale(${lerp(1, 0.78, shrink)}) translateY(${(1 - arrive(l, 16, 30)) * 520 - gone * 500}px)`, transformOrigin: '50% 0', opacity: 1 - gone }}>
        <SheetalCard f={f} q={arrive(l, pc, 14)} dots={l > pc + 40} />
      </div>
      {l >= jw - 6 ? (
        <div style={{ position: 'absolute', left: SAFE.x, width: SAFE.w, top: lerp(lerp(1500, 770, mIn), 520, hero), transform: `scale(${1 + 0.04 * hit(l, mu + 6, 16)})`, transformOrigin: '50% 30%' }}>
          <MunniCard leak={leak} from={[230, -420]} />
        </div>
      ) : null}
      {l >= ab ? (
        <div style={{ position: 'absolute', right: 70, top: 440, ...ui(200, C.coralInk, 900), transform: `rotate(${12 - 12 * arrive(l, ab + 6, 14)}deg) scale(${1.6 - 0.6 * arrive(l, ab + 6, 14)})`, opacity: arrive(l, ab + 6, 10) }}>?</div>
      ) : null}
      <Illus y={1340} center p={1} text="Illustrative · names fictional" />
    </div>
  );
};

// ================================================================== recon (v2): Munni's reply holds Sheetal's text
export const ReconV2: React.FC = () => {
  const { l, at, dur } = useScene('recon');
  const a = at('l06', 'data'), q = depart(l, dur - 10, 10);
  return (
    <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - arrive(l, 0, 16)) * 600 - q * 120}px)`, opacity: 1 - q * 0.6 }}>
      <Punch l={l} y={200} size={104} words={[{ t: 'REPLY', at: 4 }, { t: 'MEIN', at: 8 }, { t: 'LEAK', at: a - 4, c: C.coralInk }]} />
      <div style={{ position: 'absolute', left: SAFE.x, width: SAFE.w, top: 440 }}><MunniCard leak={(l - (a - 16)) / 18} from={[0, 700]} /></div>
      <Illus y={1180} center p={1} text="Illustrative reconstruction · names fictional, real user data nahi" />
    </div>
  );
};
