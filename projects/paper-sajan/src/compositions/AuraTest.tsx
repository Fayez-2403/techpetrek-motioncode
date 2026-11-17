// AURA look test (6.6 s, song 1:49.94-1:56.54): the developer as hand-drawn line animation traced from real footage
// (scripts/sketch_video.py, no generated images). The beat-free breath is the plain sketch; on the bass return his
// AURA ignites (lime rim + screen-lit lines), with a flash and a punch; on "dulhan" a diagonal cut to his hands.
import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';

const S0 = 109.94, r = (s: number) => s - S0;
const BASS = r(112.845), CUT = r(114.6);
const WORDS: [string, number][] = [['Sajan', r(111.98)], ['sajan', r(113.38)], ['teri', r(114.12)], ['dulhan', r(114.6)], ['tujhko', r(115.38)], ['pukare…', r(116.22)]];
const cl = (x: number) => Math.min(1, Math.max(0, x)), out = (x: number) => 1 - (1 - cl(x)) ** 4;
const h = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const LIME = '#c8ff3a', CREAM = '#efe6d2', HAND = "'Kalam', cursive";

function Lyrics({ t }: { t: number }) {
  const lines = [[0], [1, 2, 3], [4, 5]];
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: 190, textAlign: 'center' }}>
      {lines.map((ln, li) => (
        <div key={li} style={{ height: li === 0 ? 175 : 108 }}>
          {ln.map((wi) => {
            const [w, at] = WORDS[wi]; if (t < at - 0.03) return null;
            const k = out((t - at) / 0.3), cur = (WORDS.findIndex(([, a]) => a > t) - 1 === wi) || (wi === WORDS.length - 1);
            return <span key={wi} style={{ display: 'inline-block', margin: '0 15px', font: `700 ${li === 0 ? 168 : 96}px/1 ${HAND}`, color: cur ? LIME : CREAM,
              clipPath: `inset(-25% ${100 - k * 100}% -25% -5%)`, transform: `translateY(${(1 - k) * 16}px) rotate(${(h(wi) - 0.5) * 6}deg)`,
              textShadow: cur ? `0 0 28px rgba(200,255,58,.55), 0 3px 0 rgba(0,0,0,.5)` : '0 3px 0 rgba(0,0,0,.5)' }}>{w}</span>;
          })}
        </div>
      ))}
    </div>
  );
}

export const AuraTest: React.FC = () => {
  const fr = useCurrentFrame(), t = fr / 60;
  const punch = t >= BASS ? Math.exp(-(t - BASS) / 0.16) : 0, flash = t >= BASS && t < BASS + 3 / 60;
  const z = 1.0 + 0.05 * cl(t / CUT) + 0.04 * punch;
  // the diagonal cut (as in the references): a black band sweeps through and the next drawing is on the other side
  const w = cl((t - (CUT - 0.12)) / 0.24), band = -400 + w * 2300;
  const bassF = Math.round(BASS * 60), cutF = Math.round(CUT * 60);
  return (
    <AbsoluteFill style={{ background: '#0d1014', overflow: 'hidden' }}>
      <Audio src={staticFile('audio/test.wav')} />
      <AbsoluteFill style={{ transform: `scale(${z})` }}>
        <Sequence durationInFrames={bassF} layout="none"><OffthreadVideo src={staticFile('sketch/desk_plain.mp4')} muted style={{ width: 1080, height: 1920 }} /></Sequence>
        <Sequence from={bassF} durationInFrames={cutF - bassF} layout="none"><OffthreadVideo src={staticFile('sketch/desk_aura.mp4')} startFrom={bassF} muted style={{ width: 1080, height: 1920 }} /></Sequence>
        <Sequence from={cutF} layout="none"><OffthreadVideo src={staticFile('sketch/hands_aura.mp4')} muted style={{ width: 1080, height: 1920, transform: `scale(${1.04 + 0.04 * cl((t - CUT) / 2)})` }} /></Sequence>
      </AbsoluteFill>
      {w > 0 && w < 1 ? <div style={{ position: 'absolute', left: -600, top: band - 900, width: 2400, height: 520, background: '#050607', transform: 'rotate(-32deg)', boxShadow: `0 0 0 6px ${LIME}` }} /> : null}
      {flash ? <AbsoluteFill style={{ background: LIME, opacity: 0.55, mixBlendMode: 'screen' }} /> : null}
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(8,9,11,.82) 0%, rgba(8,9,11,.45) 30%, rgba(8,9,11,0) 45%)' }} />
      <Lyrics t={t} />
      <Img src={staticFile('art/paper.png')} style={{ position: 'absolute', inset: 0, width: 1080, height: 1920, mixBlendMode: 'multiply', opacity: 0.18 }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,.5) 100%)' }} />
    </AbsoluteFill>
  );
};
