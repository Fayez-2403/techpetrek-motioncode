// Kit for the Genie 4 reel: a retro Bollywood film-poster world on light poster paper. Palette with one meaning per
// colour, poster lettering (condensed Archivo with a 3D extrude), measured eases, scene clocks, the word-cue lookup,
// small credit / illustration tags, icons. Every function is a pure function of the frame.
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { TIMINGS } from '../data/version';
import { wf } from '../lib/words';
import { clamp, dampedSpring, invLerp } from '../lib/anim';

export const FPS = 60, W = 1080, H = 1920;
/** meanings: magenta = Genie generating, teal = Gemini reasoning, coral = a limit / caveat, gold = the cinema frame,
 *  mint = available / ok, saffron = the poster's sun (light, never a meaning) */
export const P = {
  paper: '#FFF4E2', paper2: '#FFE6BF', ray: '#FFD99A', card: '#FFFDF7', ink: '#1E1030', ink2: '#5B4868', ink3: '#9A8AA3',
  magenta: '#E0177A', magentaDeep: '#7E0A45', magentaSoft: '#FFE0EE',
  saffron: '#FF8A00', gold: '#F2B705', goldDeep: '#A86F00', goldLite: '#FFE58A',
  teal: '#00968F', tealDeep: '#005E59', tealSoft: '#D5F2EE',
  coral: '#EF4444', coralDeep: '#9E1C1C', coralSoft: '#FFE0DB',
  mint: '#13A579', mintSoft: '#D9F5EA', violet: '#6B3FD4',
} as const;
export const FONT = {
  poster: "'Archivo', 'Arial Narrow', sans-serif",
  ui: "'Inter', 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'Consolas', monospace",
} as const;
export const SAFE = { x: 110, y: 180, w: 860, bottom: 1620 } as const;
/** poster shadow: a hard offset, like screen-printed ink, never a blur glow */
export const ink = (d = 8, c: string = P.ink) => `${d}px ${d}px 0 ${c}`;

const bez = (x1: number, y1: number, x2: number, y2: number) => (x: number) => {
  x = clamp(x); let t = x;
  for (let i = 0; i < 6; i++) {
    const cx = 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3 - x;
    const d = 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
    if (Math.abs(d) < 1e-6) break; t = clamp(t - cx / d);
  }
  return 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
};
export const land = bez(0.16, 1, 0.3, 1);
export const leave = bez(0.7, 0, 0.84, 0);
export const inout = bez(0.65, 0, 0.35, 1);
export const arrive = (l: number, at: number, d = 14) => land(invLerp(at, at + d, l));
export const depart = (l: number, at: number, d = 12) => leave(invLerp(at, at + d, l));
/** the film's one visible spring: the poster stamps */
export const spring = (l: number, at: number, w = 16, z = 0.5) => (l < at ? 0 : dampedSpring((l - at) / FPS, w, z));
export const hit = (l: number, at: number, len = 14) => (l < at ? 0 : Math.exp(-((l - at) / len) * 3));

interface Seg { id: string; from: number; durationInFrames: number; start: number; end: number }
export const SEGS: Seg[] = (TIMINGS as unknown as { variants: { reel: { scenes: Seg[] } } }).variants.reel.scenes;
export const TOTAL: number = (TIMINGS as unknown as { variants: { reel: { durationInFrames: number } } }).variants.reel.durationInFrames;
export const seg = (id: string) => SEGS.find((s) => s.id === id)!;
export function useScene(id: string) {
  const f = useCurrentFrame(), s = seg(id);
  return { f, l: f - s.from, dur: s.durationInFrames, from: s.from, at: (line: string, word: string, nth = 0) => wf(line, word, nth) - s.from };
}

// ------------------------------------------------------------------ poster lettering
/** a filmi title word: condensed heavy caps, a 3D extrude in `deep`, face in `face`; lands from oversize on its cue */
export const Filmi: React.FC<{ text: string; size: number; face?: string; deep?: string; p?: number; stretch?: number; style?: React.CSSProperties; depth?: number }> = ({ text, size, face = P.magenta, deep = P.ink, p = 1, stretch = 72, style, depth }) => {
  const d = depth ?? Math.round(size * 0.07), layers = Array.from({ length: d }, (_, i) => `${i + 1}px ${i + 1}px 0 ${deep}`).join(',');
  return (
    <span style={{ display: 'inline-block', fontFamily: FONT.poster, fontWeight: 900, fontStretch: `${stretch}%`, fontSize: size, lineHeight: 0.92, letterSpacing: '-0.01em', textTransform: 'uppercase',
      color: face, textShadow: layers, WebkitTextStroke: `${Math.max(2, size * 0.018)}px ${P.ink}`, paintOrder: 'stroke fill',
      opacity: clamp(p * 3), transform: `scale(${1.5 - 0.5 * p}) rotate(${(1 - p) * -6}deg)`, transformOrigin: '50% 60%', ...style }}>{text}</span>
  );
};

/** small, quiet credit for real footage (DeepMind's own disclaimer stays visible in the clip) */
export const Credit: React.FC<{ y: number; p?: number; text?: string }> = ({ y, p = 1, text = 'Video: Google DeepMind · Genie 4 · deepmind.google, 27 Oct 2026' }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', opacity: p, zIndex: 30 }}>
    <span style={{ fontFamily: FONT.ui, fontWeight: 600, fontSize: 21, color: P.ink2, background: 'rgba(255,253,247,0.86)', padding: '4px 12px', borderRadius: 8 }}>{text}</span>
  </div>
);
/** label for our own diagrams */
export const Tag: React.FC<{ y: number; p?: number; text: string }> = ({ y, p = 1, text }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', opacity: p, zIndex: 30 }}>
    <span style={{ fontFamily: FONT.ui, fontWeight: 600, fontSize: 21, color: P.ink2, padding: '4px 12px', borderRadius: 8, border: `1.5px dashed ${P.ink3}`, background: 'rgba(255,253,247,0.86)' }}>{text}</span>
  </div>
);

// ------------------------------------------------------------------ icons (24 px outline)
const I: Record<string, string> = {
  gear: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7 7 0 0 1-2 1.2L14.8 21h-4l-.3-2.4a7 7 0 0 1-2-1.2l-1.9.7-2-3.4 1.6-1.2a7 7 0 0 1 0-3L4.6 9.3l2-3.4 1.9.7a7 7 0 0 1 2-1.2L10.8 3h4l.3 2.4a7 7 0 0 1 2 1.2l1.9-.7 2 3.4-1.6 1.2a7 7 0 0 1 0 3z',
  palette: 'M12 3a9 9 0 0 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.3-1.1-1.6-1.1-2.8 0-1 .8-1.6 1.8-1.6H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3zM7.5 12.5h.01M9.5 8h.01M14.5 7.5h.01M17.5 11h.01',
  calendar: 'M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM4 9h16M8 2.5V5.5M16 2.5V5.5',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  list: 'M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  wave: 'M2 12h2l2-6 3 12 3-15 3 15 3-9 2 3h2',
  music: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  chat: 'M4 5.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10l-5 4v-4H6a2 2 0 0 1-2-2z',
  wind: 'M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7',
  send: 'M4 12 20 4l-5 16-3.5-6.5zM11.5 13.5 20 4',
  bookmark: 'M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.5L5.5 20.5v-16a1 1 0 0 1 1-1z',
  comment: 'M4 5.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10l-5 4v-4H6a2 2 0 0 1-2-2z',
  film: 'M4 4h16v16H4zM8 4v16M16 4v16M4 8h4M4 12h4M4 16h4M16 8h4M16 12h4M16 16h4',
  key: 'M5 5h14v14H5z',
};
export const Icon: React.FC<{ name: string; size?: number; color?: string; sw?: number; style?: React.CSSProperties }> = ({ name, size = 32, color = P.ink, sw = 1.9, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flex: 'none', ...style }}>
    <path d={I[name]} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
