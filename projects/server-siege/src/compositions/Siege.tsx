// SERVER SIEGE, the 68 s reel: the real capture of the app's ?reel=1 mode (a fixed-seed sim run seeked frame by frame)
// with Bro, the series host, explaining each beat from the bottom-left; word-level captions from the voice's own
// alignment; a concept chip per beat; the hook slam; the CTA with the run's real result; the mix. Pure function of frame.
import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';
import lines from '../../audio/out/lines.json';
import run from '../../audio/out/reel_run.json';
import { clamp, criticalSpring, easeOutCubic, invLerp } from '../animation/anim';
import { C, FONT, FPS } from '../themes/tokens';

export const SIEGE_SECONDS = 68;
export const CLIP = process.env.REMOTION_SIEGE_CLIP ?? 'clips/siege_capture_preview.mp4';
const BAR1 = 3.0, BEAT = 0.5;

interface Word { w: string; t0: number; t1: number }
interface Line { id: string; start: number; dur: number; pose: string; cap: string; words: Word[] }
const L = (lines as { lines: Line[] }).lines;
const WORDS = L.flatMap((l) => l.words.map((w) => ({ ...w, t0: l.start + w.t0, t1: l.start + w.t1, line: l.id })));
const R = (run as { report: { success: number; score: number; passed: boolean; p95: number; totals: { arrived: number } } }).report;

/** camera cuts inside the capture (web/src/cinematic/Timeline.ts SHOTS): the overlay punches on each */
const CUTS = [1.6, 3, 9, 17, 25, 29, 33, 37, 41, 49, 57, 63];

/** the concept Bro is explaining, per beat (a chip at the bottom right, inside the safe area) */
const CHIPS: { t0: number; t1: number; term: string; def: string; col: string }[] = [
  { t0: 3.6, t1: 8.8, term: 'SIMULATOR', def: 'a real sim behind the city', col: C.accent },
  { t0: 9.4, t1: 16.8, term: 'QUEUE', def: 'demand > capacity → it grows', col: C.amber },
  { t0: 17.4, t1: 24.6, term: 'LOAD BALANCER', def: 'spreads requests over servers', col: C.accent },
  { t0: 25.4, t1: 32.8, term: 'BOTTLENECK', def: 'the one layer at 100 %', col: C.warn },
  { t0: 33.4, t1: 40.8, term: 'CACHE HIT', def: 'repeated reads skip the DB', col: C.accent2 },
  { t0: 41.4, t1: 48.8, term: 'AUTOSCALING', def: 'new servers need time to boot', col: C.violet },
  { t0: 49.4, t1: 56.8, term: 'BALANCE', def: 'capacity · caching · queues', col: C.accent2 },
  { t0: 57.4, t1: 62.8, term: 'REAL LOGIC', def: 'every control changes the sim', col: C.accent },
];

const KEY = /^(10|lakh|server|siege|traffic|latency|errors|servers|load|balancer|database|overload|cache|reads|autoscaling|instances|capacity|caching|queue|recover|simulation|logic|server!?)/i;
const BAD = /^(errors|overload|gaya)/i;

function Host({ t }: { t: number }) {
  const line = [...L].reverse().find((l) => t >= l.start - 0.15) ?? L[0];
  const talking = WORDS.some((w) => t >= w.t0 - 0.03 && t <= w.t1 + 0.05);
  const beatPhase = t < BAR1 ? (t % BEAT) : ((t - BAR1) % BEAT);
  const hop = Math.exp(-beatPhase * 9);
  const bob = talking ? -hop * 18 + Math.sin(t * 2 * Math.PI * 4.2) * 4 : -hop * 5 + Math.sin(t * Math.PI) * 2;
  const pop = 1 + 0.07 * (1 - criticalSpring(t - line.start + 0.15, 14));
  const pose = talking ? line.pose : line.pose === 'shock' ? 'shock' : 'neutral';
  return (
    <div style={{ position: 'absolute', left: -20, top: 1300, width: 560, height: 640, transformOrigin: '50% 100%', transform: `translateY(${bob}px) scale(${(talking ? 1.03 : 0.99) * pop})` }}>
      <div style={{ position: 'absolute', left: 60, right: 60, bottom: 0, height: 440, borderRadius: '50% 50% 0 0', background: `radial-gradient(60% 70% at 50% 100%, ${C.accent}44, transparent 70%)` }} />
      <Img src={staticFile(`hosts/bro_${pose}.png`)} style={{ position: 'absolute', left: -50, bottom: 0, width: 660, height: 572, objectFit: 'contain', objectPosition: '50% 100%' }} />
    </div>
  );
}

function Captions({ t }: { t: number }) {
  // 2-4 word bursts: a burst is the words of the current line between pauses / every 3 words
  const cur = WORDS.findIndex((w) => t >= w.t0 - 0.05 && t < w.t1 + 0.25);
  if (cur < 0) return null;
  const w = WORDS[cur], line = WORDS.filter((x) => x.line === w.line);
  const k = line.indexOf(w), start = Math.floor(k / 3) * 3, burst = line.slice(start, start + 3);
  const b0 = burst[0].t0, ent = easeOutCubic(invLerp(b0 - 0.05, b0 + 0.12, t));
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 1150, textAlign: 'center', transform: `translateY(${(1 - ent) * 24}px)`, opacity: ent }}>
      {burst.map((x, i) => {
        const on = t >= x.t0 - 0.03, now = t >= x.t0 - 0.03 && t < x.t1 + 0.05;
        const key = KEY.test(x.w.replace(/[^\w!]/g, '')), bad = BAD.test(x.w.replace(/\W/g, ''));
        return (
          <span key={i} style={{ display: 'inline-block', margin: '0 12px', fontFamily: FONT.display, fontWeight: 900, fontStretch: '82%', fontSize: 84, lineHeight: 1.05,
            color: !on ? 'rgba(232,244,255,0.35)' : bad ? C.warn : key ? C.accent : C.ink, transform: `scale(${now ? 1.08 : 1})`,
            textShadow: '0 5px 0 #02050c, 0 0 30px rgba(0,0,0,0.6)' }}>{x.w}</span>
        );
      })}
    </div>
  );
}

function Chip({ t }: { t: number }) {
  const c = CHIPS.find((x) => t >= x.t0 && t < x.t1);
  if (!c) return null;
  const a = criticalSpring(t - c.t0, 12), out = clamp((c.t1 - t) / 0.2);
  return (
    <div style={{ position: 'absolute', left: 540, right: 50, top: 1405, opacity: Math.min(1, out), transform: `translateX(${(1 - a) * 80}px)` }}>
      <div style={{ borderRadius: 22, padding: '16px 22px 18px', background: C.card, border: `2px solid ${c.col}`, boxShadow: `0 0 40px ${c.col}33`, backdropFilter: 'blur(8px)' }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontStretch: '80%', fontSize: 44, color: c.col, letterSpacing: '0.02em' }}>{c.term}</div>
        <div style={{ fontFamily: FONT.ui, fontWeight: 600, fontSize: 26, color: C.ink, marginTop: 2 }}>{c.def}</div>
      </div>
    </div>
  );
}

function Hook({ t }: { t: number }) {
  if (t >= 3) return null;
  const a = criticalSpring(t - 0.05, 16), shake = t < 0.4 ? Math.sin(t * 90) * 10 * (1 - t / 0.4) : 0;
  const gone = t > 2.45 ? clamp((t - 2.45) / 0.12) : 0;    // "gaya!": the number glitches out
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 520, textAlign: 'center', transform: `translate(${shake}px, 0) scale(${2 - a})`, opacity: 1 - gone }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 900, fontStretch: '72%', fontSize: 250, lineHeight: 0.9, color: '#fff', textShadow: `0 10px 0 #03122a, 0 0 60px ${C.accent}`,
        clipPath: gone ? `inset(${gone * 40}% 0 ${gone * 40}% 0)` : undefined }}>10 LAKH</div>
      <div style={{ display: 'inline-block', fontFamily: FONT.mono, fontWeight: 800, fontSize: 40, letterSpacing: '0.14em', color: C.accent, marginTop: 14, padding: '8px 22px', borderRadius: 14, background: 'rgba(3,8,20,0.82)', border: `2px solid ${C.accent}66` }}>SIMULATED REQUESTS</div>
    </div>
  );
}

function Title({ t }: { t: number }) {
  const w = WORDS.find((x) => /siege/i.test(x.w));
  const at = (w?.t0 ?? 4.2) - 0.35;
  if (t < at || t > 8.8) return null;
  const a = criticalSpring(t - at, 13), out = clamp((8.8 - t) / 0.25);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 440, textAlign: 'center', opacity: out, transform: `scale(${1.6 - 0.6 * a})` }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 900, fontStretch: '70%', fontSize: 170, lineHeight: 0.88, color: '#fff', textShadow: `0 9px 0 #03122a, 0 0 70px ${C.accent}aa` }}>SERVER<br />SIEGE</div>
      <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 30, letterSpacing: '0.12em', color: C.accent, marginTop: 18, opacity: clamp((t - at - 0.4) / 0.3) }}>PLAYABLE 3D SYSTEM-DESIGN SIMULATOR</div>
    </div>
  );
}

function Cta({ t }: { t: number }) {
  if (t < 63.2) return null;
  const a = criticalSpring(t - 63.2, 11), b = criticalSpring(t - 64.4, 11);
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 380, textAlign: 'center' }}>
      <div style={{ transform: `scale(${1.4 - 0.4 * a})`, opacity: a, fontFamily: FONT.display, fontWeight: 900, fontStretch: '74%', fontSize: 104, lineHeight: 0.95, color: '#fff', textShadow: `0 7px 0 #03122a, 0 0 50px ${C.accent}88` }}>
        CAN YOU SAVE<br />YOUR SERVER?
      </div>
      <div style={{ opacity: b, transform: `translateY(${(1 - b) * 30}px)`, display: 'inline-block', marginTop: 26, padding: '10px 20px', borderRadius: 14, background: 'rgba(3,8,20,0.85)', fontFamily: FONT.mono, fontSize: 26, fontWeight: 700, color: C.ink, letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
        This run: {(R.success * 100).toFixed(1)}% ok · p95 {R.p95} ms · score {R.score} · <span style={{ color: R.passed ? C.accent2 : C.warn }}>{R.passed ? 'PASS' : 'FAIL'}</span>
      </div>
      <div style={{ opacity: b, transform: `scale(${0.8 + 0.2 * b})`, display: 'inline-block', marginTop: 28, padding: '18px 40px', borderRadius: 999, background: C.accent, color: '#03122a', fontFamily: FONT.display, fontWeight: 900, fontStretch: '85%', fontSize: 54 }}>
        COMMENT &ldquo;SERVER&rdquo;
      </div>
    </div>
  );
}

export const Siege: React.FC = () => {
  const frame = useCurrentFrame(), t = frame / FPS;
  const cut = CUTS.reduce((m, c) => (t >= c && t - c < m ? t - c : m), 9);
  const punch = 1 + 0.035 * Math.exp(-cut * 10), flash = cut < 0.07 ? 0.35 * (1 - cut / 0.07) : 0;
  return (
    <AbsoluteFill style={{ background: C.base }}>
      <AbsoluteFill style={{ transform: `scale(${punch})` }}>
        <OffthreadVideo src={staticFile(CLIP)} muted style={{ width: '100%', height: '100%' }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, transparent 0%, transparent 56%, rgba(5,10,22,0.78) 70%, rgba(5,10,22,0.96) 84%)' }} />
      <AbsoluteFill style={{ background: '#fff', opacity: flash }} />
      <Hook t={t} />
      <Title t={t} />
      <Cta t={t} />
      <Chip t={t} />
      <Captions t={t} />
      <Host t={t} />
      <Audio src={staticFile('audio/mix_siege.wav')} />
    </AbsoluteFill>
  );
};
