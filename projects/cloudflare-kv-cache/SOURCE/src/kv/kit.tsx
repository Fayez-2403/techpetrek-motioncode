// Kit for the KV-cache reel: palette (one meaning per colour), type, measured eases, scene timing hooks, icons, the
// word-level captions and the small source / illustration tags. Every function is a pure function of the frame.
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { TIMINGS } from '../data/version';
import { wf } from '../lib/words';
import { clamp, dampedSpring, invLerp } from '../lib/anim';

export const FPS = 60, W = 1080, H = 1920;
/** light premium palette from the brief. Meanings: blue = User A (you), violet = other users, cyan = GPU / system,
 *  coral = exposed text, mango = rejected / limit, mint = fixed. *Ink variants keep text contrast on white. */
export const C = {
  bg: '#F8FAFF', bg2: '#EAF0FF', white: '#FFFFFF', ink: '#14213D', ink2: '#4A5675', ink3: '#8A93AB', line: 'rgba(20,33,61,0.10)',
  blue: '#3578FF', blueInk: '#1F5FE0', blueSoft: '#E6EEFF',
  violet: '#8057F5', violetSoft: '#EFEAFE',
  cyan: '#00C8E8', cyanInk: '#0090AD', cyanSoft: '#DDF7FC',
  coral: '#FF6D73', coralInk: '#E23C46', coralSoft: '#FFE8E9',
  mango: '#FFB347', mangoInk: '#C47406', mangoSoft: '#FFF2DE',
  mint: '#25D5A0', mintInk: '#0B9A70', mintSoft: '#DDF8EE',
} as const;
export const FONT = { ui: "'Inter', 'Segoe UI', sans-serif", mono: "'JetBrains Mono', 'Cascadia Mono', monospace" } as const;
export const SH = {
  s8: '0 4px 10px rgba(20,33,61,0.08), 0 1px 2px rgba(20,33,61,0.08)',
  s16: '0 10px 24px rgba(20,33,61,0.10), 0 2px 4px rgba(20,33,61,0.06)',
  s32: '0 24px 56px rgba(20,33,61,0.16), 0 4px 10px rgba(20,33,61,0.07)',
} as const;
/** safe frame from the brief: 110 px sides, 180 px top, 300 px bottom */
export const SAFE = { x: 110, y: 180, w: 860, bottom: 1620 } as const;

/** cubic-bezier easing; x(t) solved by Newton */
const bez = (x1: number, y1: number, x2: number, y2: number) => (x: number) => {
  x = clamp(x); let t = x;
  for (let i = 0; i < 6; i++) {
    const cx = 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3 - x;
    const d = 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
    if (Math.abs(d) < 1e-6) break; t = clamp(t - cx / d);
  }
  return 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
};
/** land: most travel in the first frames, long tail, no bounce (motionmaxxing motion.md) */
export const land = bez(0.16, 1, 0.3, 1);
/** leave: eases in and goes */
export const leave = bez(0.7, 0, 0.84, 0);
export const inout = bez(0.65, 0, 0.35, 1);
/** 0 -> 1 arrival from local frame `at` over `d` frames */
export const arrive = (l: number, at: number, d = 14) => land(invLerp(at, at + d, l));
export const depart = (l: number, at: number, d = 12) => leave(invLerp(at, at + d, l));
/** the film's one visible spring: the FIXED stamp */
export const spring = (l: number, at: number, w = 16, z = 0.5) => (l < at ? 0 : dampedSpring((l - at) / FPS, w, z));
/** decaying 1 -> 0 flash after `at` */
export const hit = (l: number, at: number, len = 14) => (l < at ? 0 : Math.exp(-((l - at) / len) * 3));

interface Seg { id: string; from: number; durationInFrames: number; start: number; end: number }
export const SEGS: Seg[] = (TIMINGS as unknown as { variants: { reel: { scenes: Seg[] } } }).variants.reel.scenes;
export const TOTAL: number = (TIMINGS as unknown as { variants: { reel: { durationInFrames: number } } }).variants.reel.durationInFrames;
export const seg = (id: string) => SEGS.find((s) => s.id === id)!;
/** scene clock: l = local frame, at(line, word) = local frame of a spoken word */
export function useScene(id: string) {
  const f = useCurrentFrame(), s = seg(id);
  return { f, l: f - s.from, dur: s.durationInFrames, at: (line: string, word: string, nth = 0) => wf(line, word, nth) - s.from };
}

// ------------------------------------------------------------------ icons (outline, 24 px grid)
const P: Record<string, string> = {
  check: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12.3l2.7 2.7L16.2 9.5',
  tick: 'M5 12.5l4.5 4.5L19 7.5',
  warning: 'M10.3 4.5 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.5a2 2 0 0 0-3.4 0zM12 9.5v4.5M12 17v.2',
  news: 'M5 4.5h11a1.5 1.5 0 0 1 1.5 1.5v13.5H6.5A2 2 0 0 1 4.5 17.5V5zM17.5 9h2v9a1.5 1.5 0 0 1-3 0M8 8.5h6M8 12h6M8 15.5h4',
  calendar: 'M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM4 9h16M8 2.5V5.5M16 2.5V5.5',
  chip: 'M7 7h10v10H7zM9.5 3v4M14.5 3v4M9.5 17v4M14.5 17v4M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4',
  layers: 'M12 3 2.5 8 12 13l9.5-5zM2.5 12 12 17l9.5-5M2.5 16 12 21l9.5-5',
  comment: 'M4 5.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10l-5 4v-4H6a2 2 0 0 1-2-2z',
  bookmark: 'M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.5L5.5 20.5v-16a1 1 0 0 1 1-1z',
  send: 'M4 12 20 4l-5 16-3.5-6.5zM11.5 13.5 20 4',
  code: 'M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.5-3.5 3.2-5.5 6.5-5.5s6 2 6.5 5.5M16 4.5a3 3 0 0 1 0 6M18 14.5c2 .6 3.3 2.4 3.5 5',
  arrow: 'M4 12h15M13.5 6.5 19 12l-5.5 5.5',
};
export const Icon: React.FC<{ name: string; size?: number; color?: string; sw?: number; style?: React.CSSProperties }> = ({ name, size = 32, color = C.ink, sw = 1.8, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flex: 'none', ...style }}>
    <path d={P[name]} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ------------------------------------------------------------------ type
/** the scene's on-screen label (from the brief's storyboard): words land at their spoken cue, one accent word.
 *  Arrives from 1.25x and settles (arrival decelerates from oversize); leaves upward with `out`. */
export const Punch: React.FC<{ l: number; words: { t: string; at: number; c?: string }[]; y?: number; size?: number; out?: number }> = ({ l, words, y = 230, size = 104, out = 1e9 }) => {
  const q = depart(l, out, 12);
  return (
    <div style={{ position: 'absolute', left: SAFE.x - 20, right: SAFE.x - 20, top: y, textAlign: 'center', fontFamily: FONT.ui, fontWeight: 900, fontSize: size, lineHeight: 1.0,
      letterSpacing: '-0.035em', color: C.ink, opacity: 1 - q, transform: `translateY(${-q * 60}px)`, zIndex: 20 }}>
      {words.map((w, i) => {
        const p = arrive(l, w.at, 12), shown = l >= w.at;
        return (
          <React.Fragment key={i}>
            <span style={{ display: 'inline-block', color: w.c ?? C.ink, opacity: shown ? clamp(p * 2.2) : 0, transform: `scale(${1.25 - 0.25 * p}) translateY(${(1 - p) * -10}px)`, transformOrigin: '50% 60%' }}>{w.t}</span>
            {i < words.length - 1 ? ' ' : ''}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** small, quiet label for invented pictures (FACTS.md requires it) */
export const Illus: React.FC<{ x?: number; y: number; p?: number; text?: string; center?: boolean }> = ({ x = SAFE.x, y, p = 1, text = 'Illustrative reconstruction', center }) => (
  <div style={{ position: 'absolute', ...(center ? { left: 0, right: 0, display: 'flex', justifyContent: 'center' } : { left: x }), top: y, opacity: p, zIndex: 25 }}>
    <span style={{ fontFamily: FONT.ui, fontWeight: 600, fontSize: 22, color: C.ink2, padding: '5px 12px', borderRadius: 8, border: `1.5px dashed ${C.ink3}`, background: 'rgba(255,255,255,0.75)' }}>{text}</span>
  </div>
);
/** small source credit */
export const Source: React.FC<{ y?: number; p?: number; text?: string }> = ({ y = 1350, p = 1, text = 'Source: Cloudflare blog · 26 Oct 2026' }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center', opacity: p, zIndex: 25 }}>
    <Icon name="news" size={24} color={C.ink3} sw={1.8} />
    <span style={{ fontFamily: FONT.ui, fontWeight: 500, fontSize: 22, color: C.ink3 }}>{text}</span>
  </div>
);
