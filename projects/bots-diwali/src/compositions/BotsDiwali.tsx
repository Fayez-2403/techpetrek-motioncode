// HAPPY DIWALI FROM THE BOTS (16 s, 1080x1920, 60 fps): the 3D street (src/world/Scene.tsx) + the finale's
// "Happy Diwali" written in sparkler light + the sound (public/audio/mix.wav).
import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { Scene } from '../world/Scene';
import { DURATION, WRITE0, WRITE1, SAY } from '../world/plan';

export const SECONDS = DURATION;
const cl = (x: number) => Math.min(1, Math.max(0, x));
const h = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// "Happy Diwali" written left to right by a sparkler: the letters reveal behind a bright write-head that throws sparks
function SparkleWrite({ t }: { t: number }) {
  if (t < WRITE0) return null;
  const k = cl((t - WRITE0) / (WRITE1 - WRITE0)), headX = 90 + k * 900, headY = 560 + Math.sin(k * 18) * 26;
  return (
    <>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 410, textAlign: 'center', font: "700 172px/1 'Kalam', cursive", color: '#fff4d6',
        clipPath: `inset(-20% ${100 - k * 104}% -20% -5%)`, transform: 'rotate(-4deg)',
        textShadow: '0 0 12px #ffd27a, 0 0 34px #ff9a3c, 0 0 70px rgba(255,140,40,.8)' }}>Happy Diwali</div>
      {k < 1 ? (
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={headX} cy={headY} r={14} fill="#fffbe8" style={{ filter: 'drop-shadow(0 0 18px #ffcf6a)' }} />
          {Array.from({ length: 28 }, (_, i) => { const slot = Math.floor(t * 30), a = h(i * 7 + slot) * Math.PI * 2, r = 20 + h(i + slot * 3) * 90;
            return <line key={i} x1={headX + Math.cos(a) * r * 0.3} y1={headY + Math.sin(a) * r * 0.3} x2={headX + Math.cos(a) * r} y2={headY + Math.sin(a) * r} stroke="#ffd98a" strokeWidth={3} strokeLinecap="round" opacity={0.85} />; })}
        </svg>
      ) : null}
    </>
  );
}

// each bot's name tag pops once, small, as it says its line (who is who, without logos)
function NameTags({ t }: { t: number }) {
  const tags: [keyof typeof SAY, string, number, string][] = [['grok', 'GROK', 250, '#f4f4f4'], ['claude', 'CLAUDE', 440, '#D97757'], ['muse', 'MUSE', 640, '#3d8bff'], ['dots', 'DOTS', 830, '#6f9cff']];
  return (<>{tags.map(([k, name, x, c]) => {
    const a = t - SAY[k]; if (a < 0 || a > 2.6) return null;
    const kin = 1 - (1 - cl(a / 0.25)) ** 3, kout = cl((a - 2.2) / 0.4);
    return <div key={k} style={{ position: 'absolute', left: x - 120, width: 240, top: 1330 - kin * 20, textAlign: 'center', opacity: kin * (1 - kout),
      font: "700 44px 'Archivo', sans-serif", fontStretch: '80%', letterSpacing: '0.06em', color: c, textShadow: '0 2px 14px rgba(0,0,0,.8)' }}>{name}</div>;
  })}</>);
}

export const BotsDiwali: React.FC = () => {
  const t = useCurrentFrame() / 60;
  return (
    <AbsoluteFill style={{ background: '#0b0a1e' }}>
      <Audio src={staticFile('audio/mix.wav')} />
      <ThreeCanvas width={1080} height={1920} shadows={false} gl={{ antialias: false }} camera={{ fov: 46, near: 0.05, far: 120, position: [0, 1, 2] }}>
        <Scene />
      </ThreeCanvas>
      <NameTags t={t} />
      <SparkleWrite t={t} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 90% 75% at 50% 50%, rgba(0,0,0,0) 60%, rgba(5,4,15,.45) 100%)' }} />
    </AbsoluteFill>
  );
};
