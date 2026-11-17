// Carousel slide 1 (12 s, 1080 x 1350): the hook. Four original mini-games play in a 2 x 2 grid under the user's line
// "You don't need a FULL TEAM to make a game now"; on the beat each game punches in full-frame (grid -> platformer ->
// whip -> shooter -> whip -> team battle -> whip -> puzzle -> back to the grid), then FULL TEAM is struck out and
// "1 DEV + 49 AI AGENTS" lands. The last 0.4 s fade back to frame 0, so the loop is clean. Pure in t.
import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { C, FONT } from '../themes/tokens';
import { clamp, dampedSpring, easeInOutCubic, easeInOutQuint, easeOutCubic, invLerp, lerp } from '../animation/anim';
import { GAMES } from './games';
import { GH, GW } from './sim';
import EV from './events.json';
import { LOGO, Logo } from './Logo';

const S1 = EV.s1, BAND = 330, AREA = { x: 0, y: BAND, w: 1080, h: 1350 - BAND };
const cell = (i: number) => ({ x: 8 + (i % 2) * 536, y: BAND + 8 + Math.floor(i / 2) * 506, w: 528, h: 498 });
type Rect = { x: number; y: number; w: number; h: number };
const mix = (a: Rect, b: Rect, p: number): Rect => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });

/** where panel i sits at t, and its stacking order */
function panel(i: number, t: number): { r: Rect; z: number; rad: number } {
  const F = S1.focus, grid = { r: cell(i), z: 1, rad: 18 };
  const k = F.findIndex(([a, b]) => t >= a && t < b);
  if (k < 0) {
    const end = F[F.length - 1][1];                                  // the last focus shrinks back into its cell
    if (i === F.length - 1 && t >= end && t < end + 0.32) { const p = easeInOutQuint(invLerp(end, end + 0.32, t)); return { r: mix(AREA, cell(i), p), z: 5, rad: 18 * p }; }
    return grid;
  }
  const [a] = F[k];
  if (k === 0 && i === 0) { const p = easeInOutQuint(invLerp(a, a + 0.3, t)); return { r: mix(cell(0), AREA, p), z: 5, rad: 18 * (1 - p) }; }
  const e = easeInOutCubic(invLerp(a, a + 0.24, t));                 // whip: the old game leaves left, the new one enters from the right
  if (i === k) return { r: { ...AREA, x: 1080 * (1 - e) }, z: 6, rad: 0 };
  if (i === k - 1 && e < 1) return { r: { ...AREA, x: -1080 * e }, z: 5, rad: 0 };
  return grid;
}

const Band: React.FC<{ t: number }> = ({ t }) => {
  const ph = (t % 0.5) / 0.5, pulse = 1 + 0.03 * Math.exp(-7 * ph * 0.5);
  const reset = 1 - invLerp(S1.reset, S1.reset + 0.35, t);
  const strike = easeOutCubic(invLerp(S1.strike, S1.strike + 0.2, t)) * reset;
  const ext = Array.from({ length: 7 }, (_, i) => `0 ${i + 1}px 0 ${i === 6 ? '#7a4d00' : '#b8860b'}`).join(', ');
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: BAND, background: 'linear-gradient(#0b1b3a, #10234a)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.045) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.045) 2px, transparent 2px)', backgroundSize: '30px 30px' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 30, textAlign: 'center', fontFamily: FONT.display, fontWeight: 900, fontStretch: '80%', fontSize: 60, color: '#fff', letterSpacing: '0.02em' }}>YOU DON'T NEED A</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 88, textAlign: 'center' }}>
        <span style={{ position: 'relative', display: 'inline-block', transform: `scale(${pulse})`, fontFamily: FONT.display, fontWeight: 900, fontStretch: '76%', fontSize: 172, lineHeight: 1, color: '#ffcf3d',
          WebkitTextStroke: '3px #0b1b3a', textShadow: `${ext}, 0 0 50px rgba(255,207,61,${0.35 * (1 - strike)})`, opacity: 1 - 0.45 * strike }}>
          FULL TEAM
          <span style={{ position: 'absolute', left: -20, right: -20, top: '50%', height: 22, marginTop: -6, background: '#ff3d5a', borderRadius: 11, transformOrigin: '0 50%', transform: `rotate(-4deg) scaleX(${strike})`, boxShadow: '0 4px 0 #0b1b3a' }} />
        </span>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 254, textAlign: 'center', fontFamily: FONT.display, fontWeight: 900, fontStretch: '80%', fontSize: 60, color: '#fff', letterSpacing: '0.02em' }}>TO MAKE A GAME NOW.</div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 6, background: `linear-gradient(90deg, ${C.magenta}, #ffcf3d, ${C.cyan})` }} />
    </div>
  );
};

export const Slide1: React.FC = () => {
  const t = useCurrentFrame() / EV.fps;
  const reset = 1 - invLerp(S1.reset, S1.reset + 0.35, t);
  const ans = dampedSpring(t - S1.answer, 13, 0.55), dim = clamp((t - S1.answer + 0.15) / 0.3) * reset;
  const k = S1.focus.findIndex(([a, b]) => t >= a && t < b);
  const swipe = clamp((t - S1.swipe) / 0.25) * reset, nudge = 10 * Math.max(0, Math.sin((t - S1.swipe) * 2 * Math.PI));
  return (
    <AbsoluteFill style={{ background: '#05070f' }}>
      <Audio src={staticFile('audio/carousel_s1.wav')} />
      {GAMES.map((g, i) => {
        const { r, z, rad } = panel(i, t);
        return (
          <div key={g.key} style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, zIndex: z, borderRadius: rad, overflow: 'hidden', boxShadow: z > 1 ? '0 0 60px rgba(0,0,0,0.6)' : undefined }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: GW, height: GH, transformOrigin: '0 0', transform: `scale(${r.w / GW}, ${r.h / GH})` }}><g.C t={t} /></div>
          </div>
        );
      })}
      {/* the game's name while it is full-frame */}
      {k >= 0 ? (() => {
        const [a, b] = S1.focus[k], s = dampedSpring(t - a - 0.12, 15, 0.6), out = clamp((b - t) / 0.1);
        return <div style={{ position: 'absolute', left: 40, top: 1350 - 120, zIndex: 9, transform: `translateX(${(1 - s) * -420}px)`, opacity: out, padding: '12px 26px', borderRadius: 16, background: GAMES[k].col, color: '#0b1b3a',
          fontFamily: FONT.display, fontWeight: 900, fontStretch: '80%', fontSize: 52, letterSpacing: '0.03em', boxShadow: '0 8px 0 #0b1b3a' }}>{GAMES[k].name}</div>;
      })() : null}
      {/* the answer */}
      <div style={{ position: 'absolute', left: 0, top: BAND, width: 1080, height: 1350 - BAND, background: `rgba(5,8,25,${0.55 * dim})`, zIndex: 10 }} />
      {t >= S1.answer ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 690, zIndex: 11, textAlign: 'center', opacity: clamp(ans * 3) * reset, transform: `scale(${0.6 + 0.4 * ans}) rotate(${(1 - ans) * -6}deg)` }}>
          <svg width={1080} height={1000} viewBox="-540 -500 1080 1000" style={{ position: 'absolute', left: 0, top: -440, opacity: 0.55, WebkitMaskImage: 'radial-gradient(closest-side, #000 35%, transparent 100%)' }}>
            {Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2 + t * 0.4; return <path key={i} d={`M0 0 L${Math.cos(a - 0.08) * 700} ${Math.sin(a - 0.08) * 700} L${Math.cos(a + 0.08) * 700} ${Math.sin(a + 0.08) * 700} Z`} fill={i % 2 ? C.cyan : '#ffcf3d'} opacity={0.35} />; })}
          </svg>
          <div style={{ position: 'relative', display: 'inline-block', padding: '22px 46px', borderRadius: 28, background: C.cyan, border: '6px solid #fff', boxShadow: '0 12px 0 #0b1b3a, 0 0 80px rgba(18,184,245,0.6)',
            fontFamily: FONT.display, fontWeight: 900, fontStretch: '78%', fontSize: 92, lineHeight: 1, color: '#0b1b3a', whiteSpace: 'nowrap' }}>1 DEV + 49 AI AGENTS</div>
          <div style={{ position: 'relative', display: 'inline-block', marginTop: 30, padding: '10px 24px', borderRadius: 16, background: 'rgba(11,27,58,0.92)', fontFamily: FONT.ui, fontWeight: 800, fontSize: 34, color: '#fff' }}>one open-source repo turns Claude Code into a game studio</div>
        </div>
      ) : null}
      {t >= S1.swipe ? <div style={{ position: 'absolute', right: LOGO.margin + LOGO.size + 20, top: 1350 - 112, zIndex: 12, opacity: swipe, transform: `translateX(${nudge}px)`, padding: '14px 30px', borderRadius: 40, background: '#fff', color: '#0b1b3a',
        fontFamily: FONT.display, fontWeight: 900, fontSize: 44, boxShadow: '0 6px 0 #0b1b3a' }}>SWIPE →</div> : null}
      <div style={{ position: 'absolute', left: 40, top: 1350 - 46, zIndex: 8, fontFamily: FONT.mono, fontSize: 17, color: 'rgba(255,255,255,0.75)', background: 'rgba(0,0,0,0.45)', padding: '3px 10px', borderRadius: 8, opacity: k >= 0 ? 0 : 1 }}>illustration · our own mini-games</div>
      <Band t={t} />
      <Logo />
    </AbsoluteFill>
  );
};
export const S1_FRAMES = Math.round(S1.dur * EV.fps);
