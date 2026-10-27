// Payoff: the four recovery steps (Microsoft's guidance) lighting on their spoken words, then sources + "Comment SAFETY" CTA.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { clamp, easeInOutCubic, easeOutCubic, invLerp } from '../lib/anim';
import { F } from '../styles/typography';
import { Bg, Chip, Enter, Flash, K, Kicker, SAFE, Slam, fadeIn, hit, pop, shake, useScene } from './kit';
import { KeyIcon } from './Story';

const STEPS = [
  { n: '01', t: 'ISOLATE', s: 'environment ko alag karo', w: 'Isolate' },
  { n: '02', t: 'CLEAN MACHINE', s: 'wahan se investigate karo', w: 'clean' },
  { n: '03', t: 'REBUILD', s: 'trusted artifacts se', w: 'rebuild' },
  { n: '04', t: 'ROTATE KEYS', s: 'saare reachable credentials', w: 'rotate' },
] as const;

export const Recover: React.FC = () => {
  const { l, dur, at } = useScene('recover');
  const ats = STEPS.map((s) => at('l6', s.w));
  const sk = shake(l, ats, 7);
  return (
    <Enter l={l} sx={sk.x} sy={sk.y}>
      <Bg glow={K.mint} amount={0.18 + 0.08 * ats.filter((a) => l >= a).length} />
      <Kicker text="AGAR EXPOSED HO · MICROSOFT GUIDANCE" color={K.mint} p={fadeIn(l, 2)} />
      <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 330, textAlign: 'center' }}>
        <Slam l={l} at={2} size={100} color={K.mint}>AB KYA KAREIN?</Slam>
      </div>
      {STEPS.map((s, i) => {
        const on = l >= ats[i], p = pop(l, ats[i], 18, 0.5);
        return (
          <div key={s.n} style={{ position: 'absolute', left: SAFE.side - 20, right: SAFE.side - 20, top: 520 + i * 182, height: 158, borderRadius: 24, display: 'flex', alignItems: 'center', gap: 28, padding: '0 34px',
            background: on ? 'rgba(14,122,82,0.35)' : 'rgba(16,26,46,0.7)', border: `3px solid ${on ? K.mint : 'rgba(236,239,244,0.15)'}`,
            boxShadow: on ? `0 0 ${20 + 50 * hit(l, ats[i], 24)}px rgba(46,229,157,0.5)` : 'none', transform: `scale(${on ? 1 + 0.06 * (1 - p) : 0.97})`, opacity: on ? 1 : 0.45 }}>
            <span style={{ fontFamily: F.serif, fontSize: 96, color: on ? K.mint : K.steel, lineHeight: 1 }}>{s.n}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 58, color: K.lunar, lineHeight: 1 }}>{s.t}</div>
              <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 25, color: on ? K.lunar : K.steel, marginTop: 8 }}>{s.s}</div>
            </div>
            {i === 3 ? <KeyIcon size={74} color={on ? K.mint : K.steel} rot={on ? 360 * easeOutCubic(invLerp(ats[3], ats[3] + 40, l)) : 0} /> : null}
            {on && i < 3 ? <svg width={64} height={64} viewBox="0 0 64 64"><path d="M12 34 L26 48 L52 18" fill="none" stroke={K.mint} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={70} strokeDashoffset={70 * (1 - easeOutCubic(invLerp(ats[i], ats[i] + 10, l)))} /></svg> : null}
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1262, display: 'flex', justifyContent: 'center', gap: 16, opacity: clamp(invLerp(dur - 150, dur - 120, l) * 1) }}>
        <Chip p={pop(l, Math.max(ats[3] + 20, dur - 140))} text="Package delete = kaafi nahi" sub="Microsoft: rebuild karo" color={K.orange} size={26} />
        <Chip p={pop(l, Math.max(ats[3] + 30, dur - 130))} text="Aage se: pin + verify" sub="versions + provenance" color={K.mint} size={26} />
      </div>
    </Enter>
  );
};

const SourceCard: React.FC<{ p: number; who: string; title: string; meta: string; l: number; k: number }> = ({ p, who, title, meta, l, k }) => (
  <div style={{ width: 840, padding: '26px 32px', borderRadius: 22, background: 'rgba(16,26,46,0.92)', border: '2px solid rgba(236,239,244,0.25)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    opacity: clamp(p * 1.5), transform: `translateX(${(1 - p) * 300 + 8 * Math.sin(l / 22 + k * 2)}px) rotate(${0.6 * Math.sin(l / 30 + k)}deg)`, borderColor: `rgba(255,90,31,${0.25 + 0.35 * (0.5 + 0.5 * Math.sin(l / 10 + k * 3))})` }}>
    <div style={{ fontFamily: F.mono, fontWeight: 800, fontSize: 24, color: K.orange, letterSpacing: '0.1em' }}>{who}</div>
    <div style={{ fontFamily: F.head, fontWeight: 800, fontSize: 38, color: K.lunar, lineHeight: 1.12, marginTop: 8 }}>{title}</div>
    <div style={{ fontFamily: F.mono, fontSize: 21, color: K.steel, marginTop: 10 }}>{meta}</div>
  </div>
);

export const Cta: React.FC = () => {
  const { l, at } = useScene('cta');
  const src = at('l7', 'Sources'), com = at('l7', 'Comment'), saf = at('l7', 'SAFETY'), sav = at('l7', 'save');
  const g = easeInOutCubic(invLerp(com - 4, com + 8, l));
  const glitch = l >= com - 4 && l < com + 8;
  const sk = shake(l, [saf, sav], 10);
  return (
    <Enter l={l} sx={sk.x + (glitch ? (l % 3 - 1) * 18 : 0)} sy={sk.y}>
      <Bg glow={g > 0.5 ? K.mint : K.orange} amount={0.25 + 0.15 * g} />
      {/* sources */}
      <AbsoluteFill style={{ opacity: 1 - g, transform: `translateY(${-g * 200 + 6 * Math.sin(l / 18)}px) scale(${1 + 0.0009 * l})` }}>
        <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 300, textAlign: 'center' }}><Slam l={l} at={Math.max(2, src)} size={110}>SOURCES</Slam></div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
          <SourceCard l={l} k={0} p={pop(l, src + 6)} who="LITELLM MAINTAINERS" title="The attack chain behind the v1.107.0 LiteLLM release" meta="Oct 23, 2026 · docs.litellm.ai/blog" />
          <SourceCard l={l} k={1} p={pop(l, src + 16)} who="MICROSOFT SECURITY BLOG" title="Inside the LiteLLM 1.107.0 supply chain compromise" meta="Oct 23, 2026 · microsoft.com/security/blog" />
        </div>
      </AbsoluteFill>
      {glitch ? <AbsoluteFill style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(46,229,157,0.25) 0 4px, transparent 4px 22px)', transform: `translateY(${(l * 37) % 22}px)` }} /> : null}
      {/* CTA */}
      {l >= com - 2 ? (
        <AbsoluteFill style={{ opacity: g }}>
          <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 330, textAlign: 'center' }}>
            <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 34, letterSpacing: '0.3em', color: K.lunar }}>COMMENT KARO</div>
            <div style={{ marginTop: 10 }}><Slam l={l} at={saf} size={190} color={K.mint} from={2.4} style={{ textShadow: `0 0 ${30 + 60 * hit(l, saf, 30)}px rgba(46,229,157,0.7)` }}>SAFETY</Slam></div>
            <div style={{ fontFamily: F.head, fontWeight: 700, fontSize: 40, color: K.lunar, marginTop: 18, opacity: fadeIn(l, saf + 12) }}>clean-machine incident checklist</div>
            <div style={{ fontFamily: F.mono, fontSize: 22, color: K.steel, marginTop: 6, opacity: fadeIn(l, saf + 16) }}>(defensive steps only)</div>
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 860, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '26px 48px', borderRadius: 999, background: l >= sav ? K.mint : 'rgba(16,26,46,0.9)', border: `3px solid ${K.mint}`,
              transform: `scale(${l >= sav ? 1 + 0.18 * hit(l, sav, 18) : 0.9 + 0.1 * pop(l, saf + 10)})`, opacity: fadeIn(l, saf + 8) }}>
              <svg width={52} height={64} viewBox="0 0 52 64"><path d="M6 4 H46 V60 L26 46 L6 60 Z" fill={l >= sav ? '#06281B' : 'none'} stroke={l >= sav ? '#06281B' : K.mint} strokeWidth={6} strokeLinejoin="round" /></svg>
              <span style={{ fontFamily: F.head, fontWeight: 900, fontSize: 64, color: l >= sav ? '#06281B' : K.lunar }}>SAVE KARO</span>
            </div>
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 1080, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, opacity: fadeIn(l, sav + 6) }}>
            <Img src={staticFile('brand/techpe-trek.jpg')} style={{ width: 64, height: 64, borderRadius: 16 }} />
            <span style={{ fontFamily: F.head, fontWeight: 800, fontSize: 38, color: K.lunar }}>TechpeTrek</span>
          </div>
          <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 1170, textAlign: 'center', fontFamily: F.mono, fontSize: 20, color: K.steel, lineHeight: 1.5, opacity: fadeIn(l, sav + 10) }}>
            Sources: LiteLLM (Oct 23) · Microsoft Security (Oct 23)<br />Independent explainer · facts as of Oct 26, 2026
          </div>
        </AbsoluteFill>
      ) : null}
      <Flash l={l} at={com} color={K.mint} max={0.35} />
    </Enter>
  );
};
