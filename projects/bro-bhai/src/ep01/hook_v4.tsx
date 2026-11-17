// The hook (0-3 s): an original pixel platformer level, full screen. The hero is a pixel version of the host (red striped
// shirt, beard, glasses): he runs, dives into the water, leaps out, throws three bouncing fireballs, then fires a radiation
// burst, and "49 AI ROLES?!" slams in. Original art (no character, music or level from any existing game). Pure in t.
import React from 'react';
import { C, FONT } from '../themes/tokens';
import { clamp, easeInOutCubic, easeOutCubic, invLerp, lerp } from '../animation/anim';
import { sp } from './kit';

const PX = 12;  // one sprite pixel = 12 screen px
const PAL: Record<string, string> = { k: '#1b1411', s: '#c98a62', g: '#e3eaf2', w: '#ffffff', b: '#241912', r: '#9a2f2f', R: '#6d1f1f', p: '#27324f', o: '#ffb02e' };
const HERO = [
  '...kkkkkk...', '..kkkkkkkk..', '..kssssssk..', '..gggssggg..', '..gwgssgwg..', '..ssssssss..', '..bssbbssb..', '..bbbbbbbb..',
  '...bbbbbb...', '.rrrRrrRrrr.', 'srrRrrRrrRrs', 'srrRrrRrrRrs', '..rrRrrRrr..', '..pppppppp..',
];
const LEGS = [['..ppp..ppp..', '.kkkk..kkkk.'], ['..pp....pp..', '.kkk....kkk.'], ['...pp..pp...', '...kk..kk...']];
const GROUND = 1500, POOL = [330, 640];

const Sprite: React.FC<{ rows: string[]; x: number; y: number; flip?: boolean; glow?: number }> = ({ rows, x, y, flip, glow = 0 }) => (
  <svg width={12 * PX} height={rows.length * PX} viewBox={`0 0 12 ${rows.length}`} shapeRendering="crispEdges"
    style={{ position: 'absolute', left: x, top: y, transform: flip ? 'scaleX(-1)' : undefined, filter: glow ? `drop-shadow(0 0 ${18 * glow}px #9dff3b) drop-shadow(0 0 ${36 * glow}px #3bf0ff)` : undefined }}>
    {rows.flatMap((row, j) => [...row].map((ch, i) => (ch === '.' ? null : <rect key={`${i}-${j}`} x={i} y={j} width={1} height={1} fill={PAL[ch]} />)))}
  </svg>
);

/** where the hero is (top-left of the sprite), and his state, at hook time t */
function hero(t: number) {
  const H = 16 * PX;
  if (t < 0.35) return { x: lerp(60, POOL[0] - 40, t / 0.35), y: GROUND - H, run: true, wet: 0 };
  if (t < 0.75) { const u = invLerp(0.35, 0.75, t); return { x: lerp(POOL[0] - 40, 440, u), y: lerp(GROUND - H, GROUND + 70, easeInOutCubic(u)) - Math.sin(u * Math.PI) * 120, run: false, wet: clamp((u - 0.35) * 3) }; }
  if (t < 1.25) { const u = invLerp(0.75, 1.25, t); return { x: lerp(440, 690, u), y: lerp(GROUND + 70, 1100 - H, u) - Math.sin(u * Math.PI) * 520, run: false, wet: clamp(1 - u * 4) }; }
  return { x: 700, y: 1100 - H, run: false, wet: 0 };
}

export const GameHook: React.FC<{ t: number }> = ({ t }) => {
  const h = hero(t), legs = h.run ? LEGS[Math.floor(t * 14) % 2] : t < 1.25 ? LEGS[2] : LEGS[0];
  const rad = invLerp(1.9, 2.6, t), shake = (t > 1.95 && t < 2.6 ? 10 : 0) * Math.sin(t * 90) + (t > 2.55 && t < 2.75 ? 14 * Math.sin(t * 120) : 0);
  const slam = sp(t, 2.55, 18, 0.45);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', transform: `translate(${shake}px, ${shake * 0.6}px)`, background: 'linear-gradient(#4fb8ff, #9fdcff 55%, #d5f2ff)' }}>
      {/* parallax clouds + hills */}
      {[[120, 420, 1.0], [620, 300, 1.4], [860, 620, 0.8]].map(([x, y, s], i) => (
        <div key={i} style={{ position: 'absolute', left: x - t * 40 * s, top: y, width: 220 * s, height: 70 * s, background: '#fff', borderRadius: 40, boxShadow: `${50 * s}px -${26 * s}px 0 -6px #fff, ${110 * s}px 0 0 -4px #fff` }} />
      ))}
      <svg viewBox="0 0 1080 500" style={{ position: 'absolute', left: -t * 25, top: 1100, width: 1200, height: 500 }}><path d="M0 400 Q180 180 360 400 Q560 120 760 400 Q940 220 1200 400 L1200 500 L0 500 Z" fill="#5fcf7a" /></svg>
      {/* ground (pixel bricks) with the water pool */}
      {Array.from({ length: 15 }, (_, i) => {
        const x = i * 72; if (x + 72 > POOL[0] && x < POOL[1]) return null;
        return <div key={i} style={{ position: 'absolute', left: x, top: GROUND, width: 72, height: 420, background: '#b5652d', borderTop: '18px solid #54c25e', boxShadow: 'inset 0 -2px 0 #7a3f17, inset -2px 0 0 #7a3f17',
          backgroundImage: 'linear-gradient(#7a3f17 4px, transparent 4px), linear-gradient(90deg, #7a3f17 4px, transparent 4px)', backgroundSize: '72px 36px, 36px 72px' }} />;
      })}
      {/* floating platform + code blocks */}
      <div style={{ position: 'absolute', left: 640, top: 1100, width: 260, height: 54, background: '#b5652d', borderTop: '14px solid #54c25e', borderRadius: 6 }} />
      {[[300, 900], [372, 900], [444, 900]].map(([x, y], i) => (
        <div key={i} style={{ position: 'absolute', left: x, top: y - (t > 0.95 && t < 1.15 && i === 1 ? 18 : 0), width: 72, height: 72, background: '#ffcf3d', border: '6px solid #b8860b', fontFamily: FONT.mono, fontWeight: 800, fontSize: 26, color: '#7a4d00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{'</>'}</div>
      ))}
      {/* the hero */}
      <Sprite rows={[...HERO, ...legs]} x={h.x} y={h.y} glow={rad > 0 && rad < 1 ? 1 - Math.abs(rad - 0.4) : 0} />
      {/* water (drawn over the hero when he's under) */}
      <div style={{ position: 'absolute', left: POOL[0], top: GROUND + 24, width: POOL[1] - POOL[0], height: 400, background: 'rgba(38,128,230,0.82)',
        backgroundImage: `repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0 30px, transparent 30px 60px)`, backgroundSize: '60px 8px', backgroundRepeat: 'repeat-x', backgroundPosition: `${t * 120}px 0` }} />
      {/* splash */}
      {t > 0.45 && t < 1.0 ? Array.from({ length: 14 }, (_, i) => {
        const a = -Math.PI / 2 + (i - 6.5) * 0.16, u = (t - 0.45) / 0.55, d = 260 * easeOutCubic(u);
        return <div key={i} style={{ position: 'absolute', left: 430 + Math.cos(a) * d, top: GROUND + 10 + Math.sin(a) * d + 500 * u * u, width: 18, height: 18, background: '#bfe6ff', opacity: 1 - u }} />;
      }) : null}
      {/* three bouncing fireballs */}
      {[1.3, 1.5, 1.7].map((at, i) => {
        if (t < at) return null;
        const u = t - at, x = 820 + u * 420, y = 1000 - Math.abs(Math.sin(u * 9)) * 140 + u * 30;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: 46, height: 46, borderRadius: 23, background: 'radial-gradient(circle, #fff7b0 0%, #ffb02e 45%, #ff4d1a 80%)', boxShadow: '0 0 30px #ff7a1a, -30px 0 30px -10px #ffb02e' }} />;
      })}
      {/* radiation burst: shock rings + beams from the hero */}
      {rad > 0 && rad < 1.4 ? (
        <svg viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0, width: 1080, height: 1920 }}>
          {[0, 1, 2, 3].map((i) => { const r = Math.max(0, (rad - i * 0.12) * 1300); return <circle key={i} cx={772} cy={1010} r={r} fill="none" stroke={i % 2 ? '#3bf0ff' : '#9dff3b'} strokeWidth={26 - i * 4} opacity={clamp(1 - r / 1300)} />; })}
          {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2 + rad, L = 900 * easeOutCubic(clamp(rad * 1.6)); return <line key={i} x1={772} y1={1010} x2={772 + Math.cos(a) * L} y2={1010 + Math.sin(a) * L} stroke="#eaffb0" strokeWidth={10} opacity={0.7 * clamp(1 - rad)} />; })}
        </svg>
      ) : null}
      {t > 1.92 && t < 2.05 ? <div style={{ position: 'absolute', inset: 0, background: `rgba(220,255,160,${0.6 * (1 - (t - 1.92) / 0.13)})` }} /> : null}
      {/* HUD (below the 220 px safe line) */}
      <div style={{ position: 'absolute', left: 70, right: 70, top: 236, display: 'flex', justifyContent: 'space-between', fontFamily: FONT.mono, fontWeight: 800, fontSize: 30, color: '#fff', textShadow: '3px 3px 0 #10306b' }}>
        <span>SCORE {String(Math.min(49, Math.floor(t * 20))).padStart(6, '0')}</span><span>LEVEL 01</span><span>AGENTS ×49</span>
      </div>
      {/* the slam */}
      {t > 2.55 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center', transform: `scale(${2.2 - 1.2 * slam}) rotate(${(1 - slam) * -6}deg)`, opacity: clamp((t - 2.55) / 0.05) }}>
          <span style={{ fontFamily: FONT.display, fontWeight: 900, fontStretch: '78%', fontSize: 150, color: '#fff', textShadow: `0 8px 0 ${C.navy}, 0 14px 0 ${C.cyanDeep}, 0 0 50px ${C.cyan}` }}>49 AI ROLES?!</span>
        </div>
      ) : null}
    </div>
  );
};
export const HOOK_END = 3.0;
export { lerp };
