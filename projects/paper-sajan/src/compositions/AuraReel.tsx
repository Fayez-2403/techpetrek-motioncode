// SAJAN: the developer's aura (25.02 s, 1080x1920, 60 fps). Song 1:45.18-2:10.20 (the user's remix of
// "Sajan Sajan Teri Dulhan"). Real developer footage traced into hand-drawn line animation (scripts/sketch_video.py,
// no generated images): grey and plain until the song's breath, then his AURA ignites on the bass return, and it
// drains out as the laptop closes into the song's own silence: "log off.". Shots + times: src/data/reel.json.
import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import R from '../data/reel.json';

export const REEL_SECONDS = R.s1 - R.s0;
const FPS = 60, r = (s: number) => s - R.s0;
const BASS = r(R.bass);
const KICKS = [112.84, 113.40, 113.94, 114.48, 115.05, 115.42, 115.79, 116.35, 116.88, 117.25, 117.61, 117.98, 118.36, 118.70, 119.25, 119.92, 120.34, 120.64, 121.28, 121.68, 122.20, 122.79, 123.28, 123.60, 124.23, 124.58, 125.12, 125.64, 126.23, 126.76, 127.16, 127.47, 128.04, 128.62].map(r);
const LIME = '#c8ff3a', CREAM = '#efe6d2', HAND = "'Kalam', cursive";
const cl = (x: number) => Math.min(1, Math.max(0, x)), out4 = (x: number) => 1 - (1 - cl(x)) ** 4, in3 = (x: number) => cl(x) ** 3;
const h = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const kickEnv = (t: number) => KICKS.reduce((m, k) => (t >= k ? Math.max(m, Math.exp(-(t - k) / 0.13)) : m), 0);
const SHOTS = R.shots.map((s) => ({ ...s, t0: r(s.a), t1: r(s.b) }));
const LYR = R.lyrics.map(([w, s]) => [w as string, r(s as number)] as [string, number]);
const AAJA = r(117.25), END = REEL_SECONDS;

function Lyrics({ t }: { t: number }) {
  if (t < LYR[0][1] - 0.05 || t > AAJA + 0.5) return null;
  const lines = [[0], [1, 2, 3], [4, 5, 6]], fly = in3((t - AAJA) / 0.4);
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, top: 190, textAlign: 'center', opacity: 1 - fly, transform: `translateY(${-fly * 140}px) scale(${1 + fly * 0.15})` }}>
      {lines.map((ln, li) => (
        <div key={li} style={{ height: li === 0 ? 175 : 108 }}>
          {ln.map((wi) => {
            const [w, at] = LYR[wi]; if (t < at - 0.03) return null;
            const k = out4((t - at) / 0.3), cur = LYR.findIndex(([, a]) => a > t) - 1 === wi || (wi === LYR.length - 1 && t >= at);
            const big = wi === 6 ? 1.25 : 1;
            return <span key={wi} style={{ display: 'inline-block', margin: '0 14px', font: `700 ${(li === 0 ? 168 : 96) * big}px/1 ${HAND}`, color: cur ? LIME : CREAM,
              clipPath: `inset(-25% ${100 - k * 100}% -25% -5%)`, transform: `translateY(${(1 - k) * 16}px) rotate(${(h(wi) - 0.5) * 6}deg)`,
              textShadow: cur ? '0 0 28px rgba(200,255,58,.6), 0 3px 0 rgba(0,0,0,.55)' : '0 3px 0 rgba(0,0,0,.55)' }}>{w}</span>;
          })}
        </div>
      ))}
    </div>
  );
}

// the aura igniting: lime strokes radiate from him for a beat (an anime power-up, drawn in code)
function Ignite({ t }: { t: number }) {
  const k = (t - BASS) / 0.55; if (k < 0 || k > 1) return null;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      {Array.from({ length: 26 }, (_, i) => {
        const a = (i / 26) * Math.PI * 2 + h(i) * 0.2, r0 = 160 + 700 * out4(k) * (0.6 + 0.4 * h(i + 3)), r1 = r0 + 120 + 200 * h(i + 9);
        const cx = 330, cy = 980;
        return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1} stroke={LIME} strokeWidth={6 * (1 - k) + 1} strokeLinecap="round" opacity={1 - k} />;
      })}
    </svg>
  );
}

export const AuraReel: React.FC = () => {
  const fr = useCurrentFrame(), t = fr / FPS;
  const punch = t >= BASS ? kickEnv(t) : 0, z = 1.0 + 0.03 * punch;
  // diagonal-band cuts (as in the references) on the shots marked "diagonal": the band sweeps across the cut
  const diag = SHOTS.filter((s) => s.fx === 'diagonal').map((s) => s.t0).find((c) => t > c - 0.14 && t < c + 0.14);
  const band = diag !== undefined ? -600 + cl((t - (diag - 0.14)) / 0.28) * 2600 : null;
  const close = SHOTS.find((s) => s.id === 'close')!, lid = r(128.62);
  const drain = cl((t - (lid - 1.3)) / 1.3);                        // the aura drains as the lid comes down
  const logK = out4((t - (lid + 0.25)) / 0.45), endFade = cl((t - (END - 0.55)) / 0.5);
  return (
    <AbsoluteFill style={{ background: '#0d1014', overflow: 'hidden' }}>
      <Audio src={staticFile('audio/reel.wav')} />
      <AbsoluteFill style={{ transform: `scale(${z})` }}>
        {SHOTS.map((s, i) => {
          const from = Math.round(s.t0 * FPS), dur = Math.max(1, Math.round(s.t1 * FPS) - from), push = 1.02 + 0.05 * cl((t - s.t0) / Math.max(0.1, s.t1 - s.t0));
          const fz = (s as { frame?: { z: number; x: number; flip?: boolean } }).frame;
          const vid = (look: string, op = 1) => <OffthreadVideo src={staticFile(`sketch/${s.id}_${look}.mp4`)} muted style={{ position: 'absolute', width: 1080, height: 1920, transform: `translateX(${fz?.x ?? 0}px) scale(${push * (fz?.z ?? 1)})${fz?.flip ? ' scaleX(-1)' : ''}`, opacity: op }} />;
          return (
            <Sequence key={s.id} from={from} durationInFrames={dur} layout="none">
              {s.look === 'fade' ? <>{vid('plain')}{vid('aura', 1 - drain)}</> : vid(s.look)}
            </Sequence>
          );
        })}
      </AbsoluteFill>
      <Ignite t={t} />
      {t >= BASS && t < BASS + 3 / FPS ? <AbsoluteFill style={{ background: LIME, opacity: 0.55, mixBlendMode: 'screen' }} /> : null}
      {band !== null ? <div style={{ position: 'absolute', left: -700, top: band - 900, width: 2500, height: 560, background: '#050607', transform: 'rotate(-32deg)', boxShadow: `0 0 0 6px ${LIME}` }} /> : null}
      {/* readability under the lyric, only while it is on screen */}
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(8,9,11,.85) 0%, rgba(8,9,11,.45) 30%, rgba(8,9,11,0) 45%)', opacity: cl((t - LYR[0][1] + 0.3) / 0.3) * (1 - cl((t - AAJA - 0.3) / 0.4)) }} />
      <Lyrics t={t} />
      {/* log off: handwritten into the song's own silence */}
      {t > lid ? <AbsoluteFill style={{ background: '#0d1014', opacity: 0.55 * logK }} /> : null}
      {t > lid + 0.2 ? <div style={{ position: 'absolute', left: 0, right: 0, top: 820, textAlign: 'center', font: `700 150px/1 ${HAND}`, color: LIME,
        clipPath: `inset(-30% ${100 - logK * 100}% -30% -5%)`, textShadow: '0 0 34px rgba(200,255,58,.55)', transform: `rotate(-3deg) translateY(${(1 - logK) * 20}px)` }}>log off.</div> : null}
      <Img src={staticFile('art/paper.png')} style={{ position: 'absolute', inset: 0, width: 1080, height: 1920, mixBlendMode: 'multiply', opacity: 0.18 }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,.5) 100%)' }} />
      <AbsoluteFill style={{ background: '#0d1014', opacity: endFade * 0.6 }} />
    </AbsoluteFill>
  );
};
