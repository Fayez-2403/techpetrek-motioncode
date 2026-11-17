// Look test (6.6 s of the real song, 1:49.94-1:56.54): the sketch draws itself in during the beat-free break, the
// watercolour floods, "Sajan" is written into the sky on the sung word, and on the bass return the paper crane lifts
// off toward the moon while the lyric lands word by word. Midnight-indigo paper, cream ink, one marigold accent.
import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from 'remotion';
import { SketchReveal } from '../paper/Sketch';
import { Crane } from '../paper/Crane';

const S0 = 109.94;                                   // song time at reel 0
const r = (song: number) => song - S0;               // song -> reel
const BASS = r(112.845), HALF = 0.7316 / 2;
const WORDS: [string, number][] = [['Sajan', r(111.98)], ['sajan', r(113.38)], ['teri', r(114.12)], ['dulhan', r(114.6)], ['tujhko', r(115.38)], ['pukare…', r(116.22)]];
const cl = (x: number) => Math.min(1, Math.max(0, x));
const out = (x: number) => 1 - (1 - cl(x)) ** 4, io = (x: number) => { x = cl(x); return x < 0.5 ? 8 * x ** 4 : 1 - (-2 * x + 2) ** 4 / 2; };
const h = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const HAND = "'Kalam', cursive";

function Lyrics({ t }: { t: number }) {
  // the words gather in the empty sky: line 1 "Sajan", line 2 "sajan teri dulhan", line 3 "tujhko pukare…"
  const lines = [[0], [1, 2, 3], [4, 5]];
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 210, textAlign: 'center' }}>
      {lines.map((ln, li) => (
        <div key={li} style={{ height: li === 0 ? 175 : 108 }}>
          {ln.map((wi) => {
            const [w, at] = WORDS[wi]; if (t < at - 0.03) return null;
            const k = out((t - at) / 0.32), last = WORDS.findIndex(([, a]) => a > t) - 1 === wi || (wi === WORDS.length - 1 && t >= at);
            return (
              <span key={wi} style={{ display: 'inline-block', margin: '0 16px', font: `700 ${li === 0 ? 168 : 96}px/1 ${HAND}`, color: last ? '#ffb447' : '#f1e6d2',
                clipPath: `inset(-20% ${100 - k * 100}% -20% -5%)`, transform: `translateY(${(1 - k) * 18}px) rotate(${(h(wi) - 0.5) * 6}deg)`,
                textShadow: last ? '0 0 26px rgba(255,170,60,.55), 0 3px 0 rgba(0,0,0,.25)' : '0 3px 0 rgba(0,0,0,.25)', transition: 'none' }}>{w}</span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export const LookTest: React.FC = () => {
  const t = useCurrentFrame() / 60;
  const lineK = 0.35 + 0.65 * io(t / 1.8), washK = io((t - 1.35) / 1.3);
  // camera: a slow push, a small punch on the bass, a drift toward the sky as the crane rises
  const punch = Math.exp(-Math.max(0, t - BASS) / 0.18) * (t >= BASS ? 1 : 0);
  const z = 1.0 + 0.05 * cl(t / 6.6) + 0.025 * punch, ty = -60 * io((t - BASS) / 3.5);
  // the crane: sits folded in her palms, lifts on the bass, grows as it sweeps right below the lyric, exits frame right
  const f = io((t - BASS) / 3.4);
  const bx = (u: number) => (1 - u) ** 3 * 530 + 3 * (1 - u) ** 2 * u * 560 + 3 * (1 - u) * u * u * 980 + u ** 3 * 1300;
  const by = (u: number) => (1 - u) ** 3 * 985 + 3 * (1 - u) ** 2 * u * 700 + 3 * (1 - u) * u * u * 760 + u ** 3 * 640;
  const cx = bx(f), cy = by(f), cs = 0.6 + 1.35 * Math.sin(Math.min(1, f * 1.5) * Math.PI / 2);
  const flap = t < BASS ? 0.25 : (t - BASS) / HALF;
  const ang = t < BASS ? 0 : -18 * Math.sin(f * Math.PI) ;
  return (
    <AbsoluteFill style={{ background: '#141632', overflow: 'hidden' }}>
      <Audio src={staticFile('audio/test.wav')} />
      <AbsoluteFill style={{ transform: `translateY(${ty}px) scale(${z})`, transformOrigin: '50% 45%' }}>
        <SketchReveal name="bride" lineK={lineK} washK={washK} />
        {/* stars twinkle and the moon breathes */}
        {Array.from({ length: 40 }, (_, i) => { const x = h(i) * 1080, y = h(i + 99) * 860, a = 0.3 + 0.7 * Math.abs(Math.sin(t * (1 + h(i + 7) * 2) + i)); return <div key={i} style={{ position: 'absolute', left: x, top: y, width: 3, height: 3, borderRadius: 2, background: '#fff6e0', opacity: a * cl((washK - 0.3) * 3) }} />; })}
        <div style={{ position: 'absolute', left: 316 - 150, top: 302 - 150, width: 300, height: 300, borderRadius: 150, background: 'radial-gradient(circle, rgba(255,240,205,.35) 0%, rgba(255,240,205,0) 65%)', opacity: cl(washK * 1.5) * (0.8 + 0.2 * Math.sin(t * 2)) }} />
      </AbsoluteFill>
      <Crane x={cx} y={cy + ty} s={cs} flap={flap} rot={ang} glow={t < BASS ? 0.15 * washK : 0.5} op={t < BASS ? cl((washK - 0.4) / 0.4) : 1} />
      <Lyrics t={t} />
      {/* paper grain over everything */}
      <Img src={staticFile('art/paper.png')} style={{ position: 'absolute', inset: 0, width: 1080, height: 1920, mixBlendMode: 'multiply', opacity: 0.22 }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(5,6,20,.5) 100%)' }} />
    </AbsoluteFill>
  );
};
