// Fluent-styled kit for V2 (light, no blur, no neon, soft contrast): design tokens, Fluent motion curves, the app frame
// (title bar + pivot tabs), cards, message bars, toasts, buttons and outline icons. Pure functions of the frame.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { TIMINGS } from '../data/version';
import { wf } from '../lib/words';
import { clamp, dampedSpring, invLerp } from '../lib/anim';

export const FPS = 60;
/** Fluent 2 light tokens, softened: no pure black/white text extremes, no saturated neon */
export const T = {
  bg: '#EEF1F6', bg2: '#E6EBF3', card: '#FFFFFF', card2: '#F7F8FA', stroke: 'rgba(36,36,48,0.08)', stroke2: 'rgba(36,36,48,0.14)',
  text: '#2B2D35', text2: '#5E6270', text3: '#8B8F9C',
  brand: '#0F6CBD', brand2: '#2886DE', brandSoft: '#E3EEFA', brandSoft2: '#CFE2F7',
  green: '#2E8B3E', greenSoft: '#E5F4E7', red: '#C4314B', redSoft: '#FBE9EC', amber: '#C27A0E', amberSoft: '#FFF4D6',
  purple: '#7B5FB5', purpleSoft: '#EFEAF8', teal: '#108A8A', tealSoft: '#E1F3F3',
} as const;
export const FONT = {
  punch: "'Segoe UI Black', 'Segoe UI Variable Display', 'Segoe UI', sans-serif",
  ui: "'Segoe UI Variable Display', 'Segoe UI Variable', 'Segoe UI', sans-serif",
  text: "'Segoe UI Variable Text', 'Segoe UI', sans-serif",
  mono: "'Cascadia Mono', 'Consolas', monospace",
} as const;
export const SH = {
  s4: '0 2px 4px rgba(30,34,48,0.10), 0 0 2px rgba(30,34,48,0.08)',
  s8: '0 4px 8px rgba(30,34,48,0.10), 0 0 2px rgba(30,34,48,0.08)',
  s16: '0 8px 16px rgba(30,34,48,0.11), 0 0 2px rgba(30,34,48,0.08)',
  s28: '0 14px 28px rgba(30,34,48,0.12), 0 0 8px rgba(30,34,48,0.07)',
} as const;
/** window content area (inside the app frame) and the brief's safe zones */
export const WIN = { x: 60, y: 226, w: 960, h: 1160 } as const;
export const CONTENT = { x: 96, y: 372, w: 888 } as const;

/** cubic-bezier easing (Fluent curves); x(t) solved by Newton */
const bez = (x1: number, y1: number, x2: number, y2: number) => (x: number) => {
  x = clamp(x); let t = x;
  for (let i = 0; i < 6; i++) {
    const cx = 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3 - x;
    const d = 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
    if (Math.abs(d) < 1e-6) break; t = clamp(t - cx / d);
  }
  return 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
};
export const decel = bez(0.1, 0.9, 0.2, 1);        // Fluent decelerate (entrances)
export const accel = bez(0.9, 0.1, 1, 0.2);        // Fluent accelerate (exits)
export const easeE = bez(0.33, 0, 0.67, 1);        // Fluent ease
/** 0 -> 1 Fluent entrance from local frame `at` over `d` frames */
export const enter = (l: number, at: number, d = 24) => decel(invLerp(at, at + d, l));
/** punchy spring (slight overshoot) for headline words and numbers' plates */
export const pop = (l: number, at: number, w = 15, z = 0.55) => (l < at ? 0 : dampedSpring((l - at) / FPS, w, z));
export const hit = (l: number, at: number, len = 16) => (l < at ? 0 : Math.exp(-((l - at) / len) * 3));

interface Seg { id: string; from: number; durationInFrames: number }
export const SEGS: Seg[] = (TIMINGS as unknown as { variants: { reel: { scenes: Seg[] } } }).variants.reel.scenes;
export const TOTAL: number = (TIMINGS as unknown as { variants: { reel: { durationInFrames: number } } }).variants.reel.durationInFrames;
export const seg = (id: string) => SEGS.find((s) => s.id === id)!;
export function useScene(id: string) {
  const f = useCurrentFrame(); const s = seg(id);
  return { f, l: f - s.from, dur: s.durationInFrames, at: (line: string, word: string, nth = 0) => wf(line, word, nth) - s.from };
}

// ------------------------------------------------------------------ icons (Fluent-like outline, 24 px grid)
const P: Record<string, string> = {
  calendar: 'M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM4 9h16M8 2.5V5.5M16 2.5V5.5',
  briefcase: 'M3.5 9a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2zM9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17',
  cap: 'M2.5 9.5 12 5l9.5 4.5L12 14zM6.5 11.5v4c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-4M21.5 9.5v5',
  chart: 'M4 20h16M7 16v-4M11 16V8M15 16v-6M19 16V5',
  people: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.5-3.5 3.2-5.5 6.5-5.5s6 2 6.5 5.5M16 4.5a3 3 0 0 1 0 6M18 14.5c2 .6 3.3 2.4 3.5 5',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.6v.2',
  warning: 'M10.3 4.5 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.5a2 2 0 0 0-3.4 0zM12 9.5v4.5M12 17v.2',
  error: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 9l6 6M15 9l-6 6',
  check: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12.3l2.7 2.7L16.2 9.5',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
  cloud: 'M7 18.5h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.6 4.5 4.5 0 0 0 7 18.5z',
  database: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  branch: 'M6 6.5a2.5 2.5 0 1 0 0-.01zM6 9v6M6 20a2.5 2.5 0 1 0 0-.01zM18 9a2.5 2.5 0 1 0 0-.01zM18 9c0 4-6 3-11 7.5',
  code: 'M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15',
  shield: 'M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6zM8.5 12l2.5 2.5 4.5-5',
  bookmark: 'M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.5L5.5 20.5v-16a1 1 0 0 1 1-1z',
  comment: 'M4 5.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10l-5 4v-4H6a2 2 0 0 1-2-2z',
  up: 'M12 19V5M5.5 11.5 12 5l6.5 6.5',
  down: 'M12 5v14M5.5 12.5 12 19l6.5-6.5',
  rocket: 'M12 15l-3-3c1.5-4.5 4.5-8 10.5-8.5-.5 6-4 9-8.5 10.5zM9 12l-3.5-.5L8 8.5h3.5M12 15l.5 3.5 3-2.5V12.5M6.5 17.5c-1 0-2 1-2.5 2.5 1.5-.5 2.5-1.5 2.5-2.5z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.7 3.6 5.7 3.6 9s-1.1 6.3-3.6 9c-2.5-2.7-3.6-5.7-3.6-9S9.5 5.7 12 3z',
  laptop: 'M5 6a1.5 1.5 0 0 1 1.5-1.5h11A1.5 1.5 0 0 1 19 6v9H5zM2.5 18.5h19',
  news: 'M5 4.5h11a1.5 1.5 0 0 1 1.5 1.5v13.5H6.5A2 2 0 0 1 4.5 17.5V5zM17.5 9h2v9a1.5 1.5 0 0 1-3 0M8 8.5h6M8 12h6M8 15.5h4',
};
export const Icon: React.FC<{ name: keyof typeof P | string; size?: number; color?: string; sw?: number; style?: React.CSSProperties }> = ({ name, size = 32, color = T.text, sw = 1.7, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flex: 'none', ...style }}>
    <path d={P[name]} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ------------------------------------------------------------------ surfaces
export const Card: React.FC<{ x?: number; y?: number; w?: number; h?: number; p?: number; children?: React.ReactNode; style?: React.CSSProperties; tint?: string; elev?: keyof typeof SH; abs?: boolean }> =
  ({ x, y, w, h, p = 1, children, style, tint = T.card, elev = 's8', abs = true }) => (
    <div style={{ ...(abs ? { position: 'absolute', left: x, top: y } : {}), width: w, height: h, background: tint, borderRadius: 12, border: `1px solid ${T.stroke}`, boxShadow: SH[elev],
      opacity: clamp(p * 1.4), transform: `translateY(${(1 - p) * 36}px) scale(${0.97 + 0.03 * p})`, ...style }}>{children}</div>
  );

/** Fluent MessageBar (info / warning / error / success) */
export const MessageBar: React.FC<{ kind: 'info' | 'warning' | 'error' | 'success'; title: string; body?: string; p: number; w?: number; style?: React.CSSProperties }> = ({ kind, title, body, p, w = 888, style }) => {
  const c = { info: [T.brand, T.brandSoft, 'info'], warning: [T.amber, T.amberSoft, 'warning'], error: [T.red, T.redSoft, 'error'], success: [T.green, T.greenSoft, 'check'] }[kind];
  return (
    <div style={{ width: w, display: 'flex', alignItems: 'center', gap: 18, padding: '18px 24px', borderRadius: 10, background: c[1], border: `1px solid ${c[0]}33`,
      opacity: clamp(p * 1.4), transform: `translateY(${(1 - p) * 24}px)`, ...style }}>
      <Icon name={c[2]} size={40} color={c[0]} sw={2} />
      <div>
        <div style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 34, color: T.text, lineHeight: 1.15 }}>{title}</div>
        {body ? <div style={{ fontFamily: FONT.text, fontWeight: 500, fontSize: 25, color: T.text2, marginTop: 4 }}>{body}</div> : null}
      </div>
    </div>
  );
};

/** Windows-style toast notification sliding in from the right edge */
export const Toast: React.FC<{ l: number; at: number; out?: number; icon: string; title: string; body: string; y: number; color?: string }> = ({ l, at, out = 1e9, icon, title, body, y, color = T.brand }) => {
  if (l < at) return null;
  const p = enter(l, at, 26), q = accel(invLerp(out, out + 16, l));
  return (
    <div style={{ position: 'absolute', right: 64, top: y, width: 560, padding: '18px 22px', borderRadius: 12, background: T.card, border: `1px solid ${T.stroke}`, boxShadow: SH.s28,
      display: 'flex', gap: 16, alignItems: 'flex-start', transform: `translateX(${(1 - p) * 640 + q * 640}px)`, opacity: 1 - q, zIndex: 30 }}>
      <div style={{ width: 52, height: 52, borderRadius: 10, background: `${color}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Icon name={icon} size={32} color={color} sw={2} /></div>
      <div>
        <div style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 27, color: T.text }}>{title}</div>
        <div style={{ fontFamily: FONT.text, fontWeight: 500, fontSize: 22, color: T.text2, marginTop: 2 }}>{body}</div>
      </div>
    </div>
  );
};

export const Pill: React.FC<{ text: string; color?: string; bg?: string; p?: number; size?: number; icon?: string; style?: React.CSSProperties }> = ({ text, color = T.brand, bg = T.brandSoft, p = 1, size = 26, icon, style }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: `${size * 0.28}px ${size * 0.62}px`, borderRadius: 999, background: bg, color, fontFamily: FONT.ui, fontWeight: 700,
    fontSize: size, whiteSpace: 'nowrap', opacity: clamp(p * 1.4), transform: `scale(${0.85 + 0.15 * p})`, ...style }}>
    {icon ? <Icon name={icon} size={size * 1.15} color={color} sw={2} /> : null}{text}
  </span>
);

/** punchy headline: each word springs in on its cue (Segoe UI Black); `hl` marks words drawn on a soft highlighter */
export const Headline: React.FC<{ l: number; words: { t: string; at: number; color?: string; hl?: string }[]; size?: number; align?: 'left' | 'center'; style?: React.CSSProperties }> = ({ l, words, size = 96, align = 'left', style }) => (
  <div style={{ fontFamily: FONT.punch, fontSize: size, lineHeight: 1.04, letterSpacing: '-0.015em', color: T.text, textAlign: align, ...style }}>
    {words.map((w, i) => {
      const p = pop(l, w.at, 16, 0.5), shown = l >= w.at - 1;
      const hlp = w.hl ? decel(invLerp(w.at + 4, w.at + 20, l)) : 0;
      return (
        <React.Fragment key={i}>
          <span style={{ display: 'inline-block', position: 'relative', color: w.color ?? T.text, opacity: shown ? clamp((l - w.at + 1) / 4) : 0,
            transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + 0.1 * p})`, transformOrigin: '50% 80%' }}>
            {w.hl ? <span style={{ position: 'absolute', left: -6, right: -6, bottom: '0.08em', height: '0.42em', background: w.hl, borderRadius: 6, transformOrigin: 'left', transform: `scaleX(${hlp})`, zIndex: -1 }} /> : null}
            {w.t}
          </span>{i < words.length - 1 ? ' ' : ''}
        </React.Fragment>
      );
    })}
  </div>
);

export const Label: React.FC<{ text: string; style?: React.CSSProperties }> = ({ text, style }) => (
  <div style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 22, letterSpacing: '0.08em', color: T.text3, textTransform: 'uppercase', ...style }}>{text}</div>
);
export const Source: React.FC<{ text: string; y?: number; p?: number }> = ({ text, y = 1318, p = 1 }) => (
  <div style={{ position: 'absolute', left: CONTENT.x, right: 1080 - CONTENT.x - CONTENT.w, top: y, display: 'flex', alignItems: 'center', gap: 8, opacity: p }}>
    <Icon name="news" size={24} color={T.text3} sw={1.8} />
    <span style={{ fontFamily: FONT.text, fontWeight: 500, fontSize: 20, color: T.text3 }}>{text}</span>
  </div>
);

/** soft light backdrop: a pale Mica-like gradient with slow drifting tint blobs and a dotted grid (no blur filter) */
export const Backdrop: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${T.bg} 0%, ${T.bg2} 100%)` }}>
      <AbsoluteFill style={{ background: `radial-gradient(40% 25% at ${30 + 10 * Math.sin(f / 120)}% ${18 + 6 * Math.cos(f / 140)}%, rgba(40,134,222,0.13) 0%, rgba(40,134,222,0) 100%),
        radial-gradient(45% 28% at ${72 + 8 * Math.cos(f / 130)}% ${82 + 5 * Math.sin(f / 110)}%, rgba(123,95,181,0.10) 0%, rgba(123,95,181,0) 100%)` }} />
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(43,45,53,0.09) 1.4px, transparent 1.6px)', backgroundSize: '36px 36px', backgroundPosition: `${(f * 0.3) % 36}px ${(f * 0.5) % 36}px` }} />
    </AbsoluteFill>
  );
};
