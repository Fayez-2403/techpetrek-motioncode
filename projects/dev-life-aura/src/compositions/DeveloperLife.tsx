// SOFTWARE ENGINEER: THE LIFE BEHIND THE SCREEN (1080x1920, 60 fps, 6000 frames), timed by the measured music grid.
// Layers: shots (stock / generated protagonist / code screens / visualization) -> grade + grain -> type cards -> audio.
import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { GRID } from '../data/beat-grid';
import { SHOTS, BEATS, Placed } from '../data/edit';
import { ShotFootage, Grain } from '../components/Footage';
import { Screen } from '../screens/Screens';
import { Viz } from '../viz/Viz';

export const SECONDS = GRID.duration;
const FPS = 60;
const SANS = "'Archivo', 'Inter', sans-serif";
const cl = (x: number) => Math.min(1, Math.max(0, x));
const out5 = (x: number) => 1 - (1 - cl(x)) ** 5;
const beatAfter = (t: number, n = 0) => { const i = BEATS.findIndex((b) => b >= t - 0.02); return BEATS[Math.min(BEATS.length - 1, (i < 0 ? 0 : i) + n)]; };
import { START } from '../data/edit';
const SC = (id: string) => { const s = GRID.scenes.find((x) => x.id === id)!; return { ...s, t: START[id] ?? s.t }; };
const DROP = GRID.anchors.bass_drop, ENTER = 98.907;     // ENTER = the lid closes (screen off), on the last beat

// ---------- type cards: words arrive on beats, decelerating from oversize; < 6 words; 8 cards in 100 s ----------
type Card = { words: string[]; at: number[]; out: number; accent?: number; y?: number; size?: number };
const wordsOnBeats = (words: string[], t: number, every = 1) => words.map((_, i) => beatAfter(t, i * every));
const CARDS: Card[] = [
  { words: ['THEY', 'SEE', 'THE', 'CODE.'], at: wordsOnBeats(['', '', '', ''], 1.1), out: SC('02').t - 0.15 },
  { words: ['NOT', 'THE', 'LIFE', 'BEHIND', 'IT.'], at: wordsOnBeats(['', '', '', '', ''], 9.9), out: SC('04').t - 0.04 },
  { words: ['COMMUTE.', 'CONNECT.', 'CREATE.'], at: wordsOnBeats(['', '', ''], SC('04').t + 1.1, 2), out: SC('05').t - 0.3 },
  { words: ['BUILD', 'THE', 'THING.'], at: wordsOnBeats(['', '', ''], SC('06').t + 2.3), out: SC('06').t + 6.2 },
  { words: ['REFUEL', 'THE', 'HUMAN.'], at: wordsOnBeats(['', '', ''], SC('08').t + 1.2), out: SC('08').t + 5.3 },
  { words: ['WHEN', 'PROD', 'CALLS.'], at: [DROP, DROP + 0.18, DROP + 0.36], out: DROP + 2.9, accent: 1, size: 150 },
  { words: ['NEVER', 'STOP', 'LEARNING.'], at: wordsOnBeats(['', '', ''], SC('12').t + 1.5), out: SC('12').t + 5.6 },
  { words: ['LOG', 'OFF.'], at: [ENTER + 0.25, ENTER + 0.45], out: 100.5, y: 900, size: 170 },
];
function Cards({ t }: { t: number }) {
  return (
    <>{CARDS.map((c, ci) => {
      if (t < c.at[0] - 0.05 || t > c.out + 0.2) return null;
      const leave = cl((t - c.out) / 0.18), size = c.size ?? 112;
      return (
        <div key={ci} style={{ position: 'absolute', left: 50, right: 50, top: (c.y ?? 1440) - leave * 30, textAlign: 'center', opacity: 1 - leave, lineHeight: 1.02 }}>
          {c.words.map((w, i) => {
            const k = out5((t - c.at[i]) / 0.22); if (t < c.at[i]) return null;
            return <span key={i} style={{ display: 'inline-block', margin: '0 0.14em', transform: `scale(${1.45 - 0.45 * k})`, opacity: Math.min(1, k * 2.5),
              font: `700 ${size}px ${SANS}`, fontStretch: '72%', letterSpacing: '0.01em', color: c.accent === i ? '#ff2d3f' : '#f4f1ea',
              textShadow: '0 4px 30px rgba(0,0,0,.65), 0 1px 3px rgba(0,0,0,.6)' }}>{w}</span>;
          })}
        </div>
      );
    })}</>
  );
}

function ShotLayer({ s, t }: { s: Placed; t: number }) {
  const lt = t - s.t0, d = s.t1 - s.t0;
  if (s.kind === 'screen') return <Screen id={s.id} t={lt} d={d} />;
  if (s.kind === 'three') return <Viz id={s.id} t={lt} d={d} />;
  return <ShotFootage s={s} t={t} />;
}

export const DeveloperLife: React.FC = () => {
  const frame = useCurrentFrame(), t = frame / FPS;
  // the eye dissolves into the window light (01 -> 02); the final Enter switches the world off (14)
  const x01 = SC('02').t, dis = cl((t - (x01 - 0.3)) / 0.3);
  const off = cl((t - ENTER - 0.12) / 0.5);
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Audio src={staticFile('audio/mix_master.wav')} />
      {SHOTS.map((s, i) => {
        const pre = s.chapter === '02' && s.i === 0 ? 0.3 : 0;         // 02's first shot starts early for the dissolve
        const from = Math.round((s.t0 - pre) * FPS), dur = Math.max(1, Math.round(s.t1 * FPS) - from);   // tiles exactly: no 1-frame gaps
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            <AbsoluteFill style={{ opacity: pre ? dis : 1 }}><ShotLayer s={s} t={t} /></AbsoluteFill>
          </Sequence>
        );
      })}
      {/* the incident flash on the bass drop: two frames of red-white, then gone */}
      {t >= DROP && t < DROP + 3 / FPS ? <AbsoluteFill style={{ background: '#ffd6da', opacity: 0.55, mixBlendMode: 'screen' }} /> : null}
      <AbsoluteFill style={{ background: '#000', opacity: off * 0.62 }} />
      <Grain frame={frame} />
      <Cards t={t} />
      {t > ENTER + 0.5 ? <div style={{ position: 'absolute', right: 56, bottom: 300, font: `600 30px ${SANS}`, letterSpacing: '0.22em', color: '#f4f1ea', opacity: 0.75 * cl((t - ENTER - 0.5) / 0.2) }}>TECHPETREK</div> : null}
    </AbsoluteFill>
  );
};
