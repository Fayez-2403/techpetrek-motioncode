// Shared plate pieces for the PaperPilot reel. Every piece takes GLOBAL film frames (g = useCurrentFrame(), cue
// frames from wf()), so a scene never mixes local and global time.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { TIMINGS } from '../config/version';
import { clamp, criticalSpring, dampedSpring, easeOutQuint, invLerp } from '../animation/anim';
import { hash, noise1 } from '../animation/rng';
import { C, FONT, FPS, glow } from '../themes/tokens';

interface Scene { id: string; from: number; durationInFrames: number }
const SC: Scene[] = (TIMINGS as unknown as { variants: { reel: { scenes: Scene[] } } }).variants.reel.scenes;
/** global start / end frame of a scene */
export const s0 = (id: string) => SC.find((s) => s.id === id)!.from;
export const s1 = (id: string) => { const s = SC.find((x) => x.id === id)!; return s.from + s.durationInFrames; };

/** springs by object class (motion-studio motion.py): paper is light and quick, panels heavy, UI crisp */
export const SPRING = {
  paper: (g: number, at: number) => dampedSpring((g - at) / FPS, 15, 0.55),
  panel: (g: number, at: number) => dampedSpring((g - at) / FPS, 9, 0.78),
  ui: (g: number, at: number) => criticalSpring((g - at) / FPS, 18),
  slam: (g: number, at: number) => dampedSpring((g - at) / FPS, 22, 0.32),
};
/** land decelerates (in), leave accelerates (out): 0..1..0 over [a, b] */
export const life = (g: number, a: number, b: number, din = 14, dout = 10) =>
  Math.min(easeOutQuint(invLerp(a, a + din, g)), 1 - invLerp(b - dout, b, g) ** 3);

/** the built world: deep stage, one coloured pool of light, a perspective grid floor, grain and vignette */
export const Stage: React.FC<{ g: number; pool?: string; pool2?: string; floor?: boolean; children?: React.ReactNode }> = ({ g, pool = C.cyan, pool2 = C.rust, floor = true, children }) => (
  <AbsoluteFill style={{ background: C.base, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: -300 + 40 * noise1(g / 140, 1), top: 300, width: 1700, height: 1400, borderRadius: '50%',
      background: `radial-gradient(closest-side, ${pool}2E, transparent)` }} />
    <div style={{ position: 'absolute', left: 300 + 50 * noise1(g / 160, 2), top: -300, width: 1100, height: 900, borderRadius: '50%',
      background: `radial-gradient(closest-side, ${pool2}22, transparent)` }} />
    {floor ? (
      <div style={{ position: 'absolute', left: -1080, right: -1080, top: 1180, height: 1400, transformOrigin: '50% 0', transform: 'perspective(900px) rotateX(72deg)',
        backgroundImage: `linear-gradient(${C.cyan}30 2px, transparent 2px), linear-gradient(90deg, ${C.cyan}30 2px, transparent 2px)`,
        backgroundSize: '120px 120px', backgroundPosition: `0 ${(g * 1.2) % 120}px`, maskImage: 'linear-gradient(180deg, #000, transparent 70%)', WebkitMaskImage: 'linear-gradient(180deg, #000, transparent 70%)' }} />
    ) : null}
    {children}
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,0.72))', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', inset: 0, opacity: 0.07, pointerEvents: 'none', mixBlendMode: 'overlay',
      backgroundImage: `repeating-radial-gradient(circle at ${17 + (g * 7) % 50}% ${23 + (g * 13) % 50}%, #fff 0 1px, transparent 1px 3px)` }} />
  </AbsoluteFill>
);

/** a PDF sheet: real thickness (stacked edges), soft contact shadow, printed sample content, optional file-name tag */
export const Sheet: React.FC<{ w?: number; h?: number; title?: string; name?: string; tint?: string; seed?: number; pages?: number;
  photo?: boolean; style?: React.CSSProperties; tag?: boolean }> = ({ w = 360, h = 480, title = 'DOCUMENT', name, tint = C.cyan, seed = 1, pages = 3, photo = true, style, tag = true }) => {
  const u = w / 360;
  return (
    <div style={{ position: 'absolute', width: w, height: h, ...style }}>
      {Array.from({ length: pages - 1 }, (_, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, transform: `translate(${(pages - 1 - i) * 5 * u}px, ${(pages - 1 - i) * 6 * u}px)`,
          background: i % 2 ? '#E6EBF2' : '#D8DFE9', borderRadius: 10 * u }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, background: C.paper, borderRadius: 10 * u, overflow: 'hidden',
        boxShadow: `0 ${30 * u}px ${60 * u}px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(0,0,0,0.06)` }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 10 * u, background: tint }} />
        <div style={{ position: 'absolute', left: 28 * u, top: 34 * u, fontFamily: FONT.display, fontWeight: 700, fontSize: 26 * u, color: C.paperInk, letterSpacing: -0.5 }}>{title}</div>
        <div style={{ position: 'absolute', left: 28 * u, top: 70 * u, fontFamily: FONT.mono, fontSize: 11 * u, color: '#7A8698' }}>SAMPLE · synthetic data</div>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{ position: 'absolute', left: 28 * u, top: (104 + i * 22) * u, height: 9 * u, borderRadius: 5 * u, background: '#D6DCE6', width: (304 * (0.5 + 0.5 * hash(i, seed))) * u }} />
        ))}
        {photo ? <div style={{ position: 'absolute', left: 28 * u, right: 28 * u, top: 250 * u, bottom: 40 * u, borderRadius: 8 * u,
          background: `linear-gradient(${120 + 60 * hash(seed, 2)}deg, ${tint}AA, #2B3B55 60%, ${C.rust}88)` }} /> : null}
      </div>
      {tag && name ? (
        <div style={{ position: 'absolute', left: '50%', top: h + 22 * u, transform: 'translateX(-50%)', whiteSpace: 'nowrap', padding: `${6 * u}px ${14 * u}px`, borderRadius: 10 * u,
          background: 'rgba(14,23,36,0.9)', border: `1.5px solid ${tint}66`, fontFamily: FONT.mono, fontWeight: 600, fontSize: 22 * u, color: C.ink }}>{name}</div>
      ) : null}
    </div>
  );
};

/** kinetic headline: words land on their own frames with a slam spring; each word can carry a colour */
export const Headline: React.FC<{ g: number; words: { t: string; at: number; c?: string; size?: number }[]; top: number; size?: number; out?: number; align?: 'center' | 'left'; left?: number }> =
  ({ g, words, top, size = 120, out = 1e9, align = 'center', left = 0 }) => {
    const o = 1 - clamp((g - out) / 10) ** 2;
    if (o <= 0) return null;
    return (
      <div style={{ position: 'absolute', left: align === 'center' ? 0 : left, right: 0, top, textAlign: align, fontFamily: FONT.display, fontWeight: 700, lineHeight: 0.95, letterSpacing: -2, opacity: o }}>
        {words.map((w, i) => {
          const p = SPRING.slam(g, w.at), a = clamp((g - w.at) / 4);
          return (
            <span key={i} style={{ display: 'inline-block', margin: '0 0.12em', fontSize: w.size ?? size, color: w.c ?? C.ink, opacity: a,
              transform: `translateY(${(1 - p) * 60}px) scale(${0.7 + 0.3 * p})`, textShadow: w.c ? glow(0.55, w.c, 50) : '0 8px 30px rgba(0,0,0,0.6)' }}>{w.t}</span>
          );
        })}
      </div>
    );
  };

/** small honest label (source / "our test run" / "illustrative"), quiet, never a HUD */
export const Label: React.FC<{ children: React.ReactNode; top: number; left?: number; right?: number; a?: number; color?: string }> = ({ children, top, left, right, a = 1, color = C.ink2 }) => (
  <div style={{ position: 'absolute', top, left, right, opacity: a, fontFamily: FONT.mono, fontWeight: 500, fontSize: 24, color, letterSpacing: 0.3, textAlign: left === undefined ? 'right' : 'left' }}>{children}</div>
);

/** a status chip that lights on its word */
export const Chip: React.FC<{ g: number; at: number; text: string; col: string; style?: React.CSSProperties; size?: number }> = ({ g, at, text, col, style, size = 34 }) => {
  const on = clamp((g - at) / 8), p = SPRING.ui(g, at);
  return (
    <div style={{ position: 'absolute', padding: '12px 26px', borderRadius: 999, fontFamily: FONT.mono, fontWeight: 700, fontSize: size, letterSpacing: 2,
      color: on > 0.5 ? C.base : C.ink2, background: on > 0 ? col : 'rgba(18,29,43,0.9)', border: `2px solid ${on > 0 ? col : '#2A3A50'}`,
      boxShadow: on > 0 ? glow(0.7 * on, col, 40) : 'none', transform: `scale(${0.92 + 0.08 * p + 0.06 * Math.sin(clamp((g - at) / 12) * Math.PI)})`, ...style }}>{text}</div>
  );
};

/** a generic dark window (no product chrome): title text, three neutral dots, content */
export const Win: React.FC<{ title: string; w: number; h: number; style?: React.CSSProperties; accent?: string; children?: React.ReactNode }> = ({ title, w, h, style, accent = C.cyan, children }) => (
  <div style={{ position: 'absolute', width: w, height: h, borderRadius: 22, background: 'rgba(11,18,29,0.96)', border: `1.5px solid ${accent}44`,
    boxShadow: `0 40px 90px rgba(0,0,0,0.6), ${glow(0.25, accent, 60)}`, overflow: 'hidden', ...style }}>
    <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      {[0, 1, 2].map((i) => <div key={i} style={{ width: 14, height: 14, borderRadius: 7, background: '#3A4A60' }} />)}
      <div style={{ marginLeft: 14, fontFamily: FONT.mono, fontSize: 22, color: C.ink2 }}>{title}</div>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 52, bottom: 0 }}>{children}</div>
  </div>
);

/** a real screenshot in a frame (credit under it) */
export const Shot: React.FC<{ src: string; w: number; h: number; fit?: 'cover' | 'contain'; pos?: string; style?: React.CSSProperties; credit?: string; scale?: number; origin?: string }> =
  ({ src, w, h, fit = 'cover', pos = '50% 0%', style, credit, scale = 1, origin = '50% 50%' }) => (
    <div style={{ position: 'absolute', width: w, height: h, ...style }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.65)', border: '1.5px solid rgba(255,255,255,0.12)', background: '#0B111B' }}>
        <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: fit, objectPosition: pos, transform: `scale(${scale})`, transformOrigin: origin }} />
      </div>
      {credit ? <div style={{ position: 'absolute', top: h + 14, right: 4, fontFamily: FONT.mono, fontSize: 21, color: C.ink2 }}>{credit}</div> : null}
    </div>
  );

/** the official PaperPilot app icon (apps/web/public/logo.png, Apache-2.0 repo), cropped to its rounded tile
 *  (source px 70..442) so the file's grey backdrop never shows */
export const Logo: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => {
  const k = size / 372;
  return (
    <div style={{ position: 'absolute', width: size, height: size, borderRadius: size * 0.2, overflow: 'hidden', ...style }}>
      <Img src={staticFile('img/pp_logo.png')} style={{ position: 'absolute', left: -70 * k, top: -70 * k, width: 512 * k, height: 512 * k }} />
    </div>
  );
};
