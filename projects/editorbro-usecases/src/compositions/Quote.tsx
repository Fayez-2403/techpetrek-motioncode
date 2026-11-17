// "Maturity" quote reel (after the devgupta.tech reference: one line of text over running footage, music only).
// Music: our arrangement of the traditional Bella ciao melody (scripts/audio/bella.py), drop from 0.1 s at 120 BPM.
// Bookends are this reel's own: a laptop in a dark office.
//   0.1-2.1  intro: the lid snaps open on the drop, the screen powers on ("your laptop")
//   2.1-12.1 montage: one of our own shots per beat (scripts/cuts.py), the quote landing a line per downbeat
//   12.1     outro: the same laptop, switched off. git clone types on it; the dead stop (14.35) blacks it out;
//   14.6     the final hit switches it on in gold: EditorBro, and "Comment EDITOR" lands ("until your skills turn it on")
import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { LaptopRoom } from '../components/LaptopRoom';
import { Gold, Land, Typed } from '../components/Type';
import { clamp, dampedSpring, easeInOutCubic, easeOutQuint, invLerp } from '../animation/anim';
import grid from '../config/bella.json';
import cuts from '../config/cuts.json';
import { C, FONT, FPS } from '../themes/tokens';

export const QUOTE_FRAMES = Math.round(grid.total * FPS);
const CTA = cuts.cta.at, HIT = grid.sections.finalHit, STOP = grid.sections.stop[0], MONT = cuts.intro[1];
const URL = 'github.com/Fayez-2403/EditorBro';
const LINES: { at: number; parts: [string, string?][] }[] = [
  { at: 0.1, parts: [['Maturity is when you realise —']] },
  { at: 2.1, parts: [['your laptop is a '], ['money machine.', C.gold]] },
  { at: 4.1, parts: [['It stays switched off']] },
  { at: 6.1, parts: [['until your '], ['skills', C.teal], [' turn it on.']] },
];
const lastBeat = (T: number) => grid.beats.reduce((a, b) => (T >= b ? b : a), 0);

const Term: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: 'absolute', inset: 0, padding: '34px 38px', background: 'linear-gradient(180deg, #0c1013, #070809)', fontFamily: FONT.mono, fontSize: 40, lineHeight: 1.45, color: C.ink }}>{children}</div>
);

const Intro: React.FC<{ T: number }> = ({ T }) => {
  const lid = clamp(dampedSpring(T - 0.1, 15, 0.5), 0, 1.04);
  const power = T < 0.5 ? 0 : clamp((T - 0.5) * 6);
  const flash = T >= 0.5 ? Math.exp(-(T - 0.5) * 9) : 0;
  return (
    <LaptopRoom lid={lid} power={power} zoom={1.15 + 0.1 * easeInOutCubic(clamp(T / 2.1))} screen={
      <Term>
        <div style={{ color: C.ink2 }}>$ claude</div>
        <div><span style={{ color: C.teal }}>{'> '}</span><Typed T={T} t0={0.7} text="turn this laptop into a studio" cps={24} /></div>
        <AbsoluteFill style={{ background: `rgba(220,255,248,${0.8 * flash})` }} />
      </Term>
    } />
  );
};

const Outro: React.FC<{ T: number; kick: number }> = ({ T, kick }) => {
  const on = T >= HIT, dead = T >= STOP && T < HIT;
  const boot = easeOutQuint(invLerp(CTA + 0.45, CTA + 0.7, T));
  const power = dead ? 0 : on ? 0.92 + 0.08 * kick : (0.15 + 0.85 * boot) * (0.88 + 0.12 * kick);
  const flash = on ? Math.exp(-(T - HIT) * 7) : 0;
  const zoom = 1.15 + 0.05 * (T - CTA) + (on ? 0.06 * easeOutQuint(clamp((T - HIT) / 0.5)) : 0);   // never stops moving
  return (
    <AbsoluteFill>
      <LaptopRoom lid={1} power={power} zoom={zoom} glow={on ? '242,195,90' : '31,229,200'} screen={on ? (
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, #2a2008, #0b0904 75%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Gold size={110}>EditorBro</Gold>
          <div style={{ fontFamily: FONT.mono, fontSize: 24, color: C.ink, opacity: 0.85 }}>{URL}</div>
          <AbsoluteFill style={{ background: `linear-gradient(105deg, transparent ${(T - HIT) * 60 - 30}%, rgba(255,240,200,0.28) ${(T - HIT) * 60 - 18}%, transparent ${(T - HIT) * 60 - 6}%)` }} />
          <AbsoluteFill style={{ background: `rgba(255,244,214,${0.9 * flash})` }} />
        </div>
      ) : (
        <Term>
          <div><span style={{ color: C.teal }}>$ </span><Typed T={T} t0={CTA + 0.7} text={`git clone ${URL}`} cps={30} cursor={T < CTA + 2.3} /></div>
          {T >= CTA + 1.9 ? <div style={{ color: C.green, marginTop: 10, opacity: clamp((T - CTA - 1.9) * 6) }}>✓ cloned · 64 skills · ready</div> : null}
        </Term>
      )} />
      <Land T={T} at={CTA + 0.02} out={STOP - 0.3} style={{ position: 'absolute', top: 260, left: 0, right: 0, textAlign: 'center', fontFamily: FONT.display, fontStretch: '80%', fontWeight: 600, fontSize: 70, color: C.ink, textShadow: '0 4px 24px #000' }}>
        The skill that turns it on:
      </Land>
      <Land T={T} at={HIT} from={1.5} style={{ position: 'absolute', top: 240, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 52, color: C.ink, textShadow: '0 4px 24px #000' }}>Comment</div>
        <Gold size={170}>EDITOR</Gold>
        <div style={{ fontFamily: FONT.brand, fontStyle: 'italic', fontSize: 40, color: C.ink2, marginTop: 4, textShadow: '0 4px 24px #000' }}>for the repo link</div>
      </Land>
    </AbsoluteFill>
  );
};

export const Quote: React.FC = () => {
  const f = useCurrentFrame(), T = f / FPS;
  const kick = Math.exp(-(T - lastBeat(T)) * 10);                    // 1 on every beat, decaying
  const inOutro = T >= CTA;
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {T < MONT ? <Intro T={T} /> : null}
      {cuts.shots.map((s, i) => (
        <Sequence key={i} from={Math.round(s.at * FPS)} durationInFrames={Math.round(s.dur * FPS)} layout="none">
          <AbsoluteFill style={{ transform: `scale(${1 + 0.07 * Math.exp(-(T - s.at) * 9)})` }}>
            <OffthreadVideo src={staticFile(s.file)} muted style={{ width: 1080, height: 1920 }} />
          </AbsoluteFill>
          <div style={{ position: 'absolute', left: 70, top: 1400, fontFamily: FONT.mono, fontSize: 30, color: C.ink, letterSpacing: 1,
            padding: '8px 16px', borderRadius: 10, background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)' }}>
            {s.label} <span style={{ color: C.teal }}>· code</span>
          </div>
        </Sequence>
      ))}
      {inOutro ? <Outro T={T} kick={kick} /> : null}

      {/* readability over the montage: dark top for the quote, a beat flash */}
      {!inOutro ? (
        <>
          <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.12) 55%, rgba(0,0,0,0.3) 100%)', pointerEvents: 'none' }} />
          {T >= MONT ? <AbsoluteFill style={{ background: `rgba(255,255,255,${0.06 * kick})` }} /> : null}
          <div style={{ position: 'absolute', top: 240, left: 60, right: 60, textAlign: 'center', transform: `scale(${1 + 0.012 * kick})` }}>
            {LINES.map((l, i) => {
              const p = easeOutQuint(invLerp(l.at, l.at + 0.35, T)), out = easeOutQuint(invLerp(CTA - 0.3, CTA, T));
              return (
                <div key={i} style={{ fontFamily: FONT.display, fontStretch: '78%', fontWeight: 500, fontSize: i === 0 ? 68 : 84, lineHeight: 1.15, color: C.ink,
                  marginBottom: i === 0 ? 34 : 0, opacity: clamp(p * 1.5) * (1 - out), filter: `blur(${(1 - p) * 8}px)`,
                  transform: `translateY(${(1 - p) * 26 - out * 60}px)`, textShadow: '0 4px 24px rgba(0,0,0,0.85)' }}>
                  {l.parts.map(([txt, col], k) => <span key={k} style={{ color: col ?? C.ink, fontWeight: col ? 700 : 500 }}>{txt}</span>)}
                </div>
              );
            })}
          </div>
        </>
      ) : null}
      <Audio src={staticFile((grid as { audio?: string }).audio ?? 'audio/bella.wav')} />
    </AbsoluteFill>
  );
};
