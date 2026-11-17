// The hook (v5, 0 .. HOOK s): a FAST original pixel side-scroller under the user's intro line. Every beat sits on the
// intro's own word times (src/ep01/hook_events.json, written by the mixer, which places the same sounds):
//   sprint + coins -> water dive on "solo developer" -> block bump on "games" -> three fireballs pop bugs -> the repo chest
//   opens on "GitHub repo" -> radiation burst -> a hop over each engine pipe on "Unity / Unreal / Godot" -> 49 AI agents
//   join the hero on "lead... 49 AI agents" -> flag-pole finish + fireworks on "mazedaar games!".
// The hero is a pixel version of the host (red striped shirt, beard, glasses); no character, level or music from any
// existing game. Pure in t.
import React from 'react';
import { C, FONT } from '../themes/tokens';
import { clamp, easeOutCubic, invLerp, lerp } from '../animation/anim';
import { sp } from './kit';
import E from './hook_events.json';

const PX = 12;
const PAL: Record<string, string> = { k: '#1b1411', s: '#c98a62', g: '#e3eaf2', w: '#ffffff', b: '#241912', r: '#9a2f2f', R: '#6d1f1f', p: '#27324f', o: '#ffb02e', c: '#12B8F5', d: '#0b1b3a', m: '#E0338F', e: '#7dff6a' };
const HERO = [
  '...kkkkkk...', '..kkkkkkkk..', '.kkssssssk k'.replace(' ', 'k'), '.kgggssgggk.', '.kgwgssgwgk.', '.kssssssssk.', '.kbssbbssbk.', '.kbbbbbbbbk.',
  '.kkbbbbbbkk.', '.krrRrrRrrk.', 'srrRrrRrrRrs', 'srrRrrRrrRrs', '..rrRrrRrr..', '..pppppppp..',   // v3: long hair down to the shoulders
];
const LEGS = [['..ppp..ppp..', '.kkkk..kkkk.'], ['..pp....pp..', '.kkk....kkk.'], ['...pp..pp...', '...kk..kk...']];
const AGENT = ['.cccc.', 'cddddc', 'cdwdwc', 'cddddc', '.cccc.', '.c..c.'];          // a little AI agent bot
const BUG = ['m....m', '.mmmm.', 'mwmmwm', 'mmmmmm', '.m..m.'];                        // a bug (what the agents fight)
const GROUND = 1500, HX = 300, H = 16 * PX, BASE = GROUND - H;
const HOOK = E.hook;

const Sprite: React.FC<{ rows: string[]; x: number; y: number; px?: number; glow?: number; flip?: boolean; style?: React.CSSProperties }> = ({ rows, x, y, px = PX, glow = 0, flip, style }) => (
  <svg width={rows[0].length * px} height={rows.length * px} viewBox={`0 0 ${rows[0].length} ${rows.length}`} shapeRendering="crispEdges"
    style={{ position: 'absolute', left: x, top: y, transform: flip ? 'scaleY(-1)' : undefined, filter: glow ? `drop-shadow(0 0 ${18 * glow}px #9dff3b) drop-shadow(0 0 ${36 * glow}px #3bf0ff)` : undefined, ...style }}>
    {rows.flatMap((row, j) => [...row].map((ch, i) => (ch === '.' ? null : <rect key={`${i}-${j}`} x={i} y={j} width={1} height={1} fill={PAL[ch]} />)))}
  </svg>
);

/** the world scrolls fast and keeps accelerating; it stops just after the flag */
const STOP = E.flag[1] + 0.25;
const camX = (t: number) => { const u = Math.min(t, STOP); return 900 * u + 70 * u * u; };
/** a world x that sits at screen x `sx` at time `te` */
const at = (te: number, sx: number) => camX(te) + sx;
const scr = (wx: number, t: number) => wx - camX(t);
const arc = (t: number, a: number, b: number) => { const u = invLerp(a, b, t); return u > 0 && u < 1 ? Math.sin(u * Math.PI) : 0; };

/** the hero's height above his running line at t (positive = up), and his pose */
function heroY(t: number) {
  const [d0, d1] = E.dive, du = invLerp(d0, d1, t);
  if (du > 0 && du < 1) return { y: BASE + Math.sin(du * Math.PI) * 240 - Math.sin(Math.min(1, du * 3) * Math.PI) * 70, wet: du > 0.25 && du < 0.8, air: true };
  const [j0, j1] = E.jumpBlock;
  if (t > j0 && t < j1) return { y: BASE - arc(t, j0, j1) * 300, wet: false, air: true };
  for (const p of E.pipes) if (t > p - 0.22 && t < p + 0.22) return { y: BASE - arc(t, p - 0.22, p + 0.22) * 300, wet: false, air: true };
  const [f0, f1] = E.flag;
  if (t > f0 && t < f1) return { y: BASE - arc(t, f0, f1 + (f1 - f0) * 0.6) * 560, wet: false, air: true };
  if (t >= f1 && t < f1 + 0.3) return { y: BASE - (1 - invLerp(f1, f1 + 0.3, t)) * 300, wet: false, air: true };   // slides down the pole
  return { y: BASE, wet: false, air: false };
}

const Pop: React.FC<{ t: number; a: number; b: number; y: number; text: string; col: string; size?: number }> = ({ t, a, b, y, text, col, size = 118 }) => {
  if (t < a || t > b) return null;
  const s = sp(t - a, 0, 18, 0.5), out = clamp((b - t) / 0.12);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', transform: `scale(${(2 - s) * (0.9 + 0.1 * out)}) rotate(${(1 - s) * -5}deg)`, opacity: out }}>
      <span style={{ fontFamily: FONT.display, fontWeight: 900, fontStretch: '76%', fontSize: size, color: '#fff', letterSpacing: '0.01em', WebkitTextStroke: `4px ${C.navy}`,
        textShadow: `0 9px 0 ${C.navy}, 0 15px 0 ${col}, 0 0 40px ${col}` }}>{text}</span>
    </div>
  );
};

export const GameHook: React.FC<{ t: number }> = ({ t }) => {
  const cx = camX(t), h = heroY(t), run = !h.air;
  const legs = run ? LEGS[Math.floor(t * 18) % 2] : LEGS[2];
  const rad = invLerp(E.charge, E.radiation + 0.7, t);
  const radOn = t > E.charge && t < E.radiation + 0.7;
  const joined = Math.round(49 * clamp(invLerp(E.lead, E.agents, t)));
  const hits = E.bugHit.filter((b) => t > b).length, coins = E.coins.filter((c) => t > c).length;
  const shake = (t > E.radiation && t < E.radiation + 0.35 ? 12 * Math.sin(t * 95) * (1 - (t - E.radiation) / 0.35) : 0)
    + E.pipes.reduce((a, p) => a + (t > p + 0.2 && t < p + 0.32 ? 6 * Math.sin(t * 120) : 0), 0)
    + (t > E.flag[1] && t < E.flag[1] + 0.3 ? 10 * Math.sin(t * 110) : 0);
  const pool = { x: at((E.dive[0] + E.dive[1]) / 2, HX + 72) - 200, w: 400 };
  const blockX = at(E.bump, HX - 36), pipes = E.pipes.map((p) => at(p, HX + 70 - 65));
  const chestX = at(E.chest, HX + 290), flagX = at(E.flag[1], HX + 150);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', transform: `translate(${shake}px, ${shake * 0.5}px)`, background: 'linear-gradient(#3aa8ff, #8fd4ff 55%, #cdeeff)' }}>
      <div style={{ position: 'absolute', inset: 0, transform: 'scale(1.35)', transformOrigin: `${HX + 72}px ${GROUND}px` }}>
      {/* speed lines (the level is FAST) */}
      {Array.from({ length: 16 }, (_, i) => {
        const r = ((i * 7919) % 97) / 97, y = 380 + r * 900, x = (((1300 - (cx * (1.4 + r) + i * 260)) % 1500) + 1500) % 1500 - 200;
        return <div key={`s${i}`} style={{ position: 'absolute', left: x, top: y, width: 160 + r * 220, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.55)' }} />;
      })}
      {/* parallax clouds + hills */}
      {[[120, 470, 1.0], [640, 360, 1.4], [980, 640, 0.8], [1500, 420, 1.2]].map(([x, y, s], i) => (
        <div key={i} style={{ position: 'absolute', left: ((((x - cx * 0.25 * s) % 1700) + 1700) % 1700) - 300, top: y, width: 220 * s, height: 70 * s, background: '#fff', borderRadius: 40, boxShadow: `${50 * s}px -${26 * s}px 0 -6px #fff, ${110 * s}px 0 0 -4px #fff` }} />
      ))}
      <svg viewBox="0 0 2400 500" style={{ position: 'absolute', left: -(((cx * 0.5) % 1200) + 1200) % 1200, top: 1110, width: 2400 * 1.0, height: 500 }}>
        <path d="M0 400 Q180 180 360 400 Q560 120 760 400 Q940 220 1200 400 Q1380 180 1560 400 Q1760 120 1960 400 Q2140 220 2400 400 L2400 500 L0 500 Z" fill="#5fcf7a" />
      </svg>
      {/* ground bricks, with the pool's gap */}
      {Array.from({ length: 17 }, (_, i) => {
        const wx = (Math.floor(cx / 72) + i) * 72, x = wx - cx;
        if (wx + 72 > pool.x && wx < pool.x + pool.w) return null;
        return <div key={`g${wx}`} style={{ position: 'absolute', left: x, top: GROUND, width: 72, height: 420, background: '#b5652d', borderTop: '18px solid #54c25e', boxShadow: 'inset 0 -2px 0 #7a3f17, inset -2px 0 0 #7a3f17',
          backgroundImage: 'linear-gradient(#7a3f17 4px, transparent 4px), linear-gradient(90deg, #7a3f17 4px, transparent 4px)', backgroundSize: '72px 36px, 36px 72px' }} />;
      })}
      {/* coins on the run line: each one is collected at its time */}
      {E.coins.map((c, i) => {
        const x = scr(at(c, HX + 70), t), got = t > c;
        if (x < -80 || x > 1160 || (got && t > c + 0.3)) return null;
        return <div key={`c${i}`} style={{ position: 'absolute', left: x, top: BASE + 40 - (got ? (t - c) * 500 : 0), width: 40, height: 52, borderRadius: '50%', background: '#ffcf3d', border: '6px solid #b8860b', opacity: got ? 1 - (t - c) / 0.3 : 1, transform: `scaleX(${Math.abs(Math.cos(t * 8 + i))})` }} />;
      })}
      {/* code blocks the hero bumps on "games" */}
      {[-1, 0, 1].map((k) => {
        const x = scr(blockX + k * 72, t); if (x < -80 || x > 1160) return null;
        const bump = k === 0 && t > E.bump && t < E.bump + 0.18 ? 20 : 0;
        return <div key={`b${k}`} style={{ position: 'absolute', left: x, top: BASE - 300 - 84 - bump, width: 72, height: 72, background: k === 0 && t > E.bump ? '#c9a46a' : '#ffcf3d', border: '6px solid #b8860b', fontFamily: FONT.mono, fontWeight: 800, fontSize: 24, color: '#7a4d00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{'</>'}</div>;
      })}
      {/* bugs: popped by the fireballs */}
      {E.bugHit.map((b, i) => {
        const fx = HX + 130 + (b - E.fire[i]) * 1100, wx = at(b, fx), x = scr(wx, t), dead = t > b;
        if (x < -80 || x > 1160 || (dead && t > b + 0.4)) return null;
        return <Sprite key={`bug${i}`} rows={BUG} px={10} x={x} y={GROUND - 50 - (dead ? (t - b) * 400 : 0)} flip={dead} style={{ opacity: dead ? 1 - (t - b) / 0.4 : 1 }} />;
      })}
      {/* the repo chest: opens on "GitHub repo" */}
      {(() => {
        const x = scr(chestX, t); if (x < -200 || x > 1160) return null;
        const open = clamp((t - E.chest) / 0.18);
        return (
          <div style={{ position: 'absolute', left: x, top: GROUND - 110, width: 150, height: 110 }}>
            {open > 0 ? <div style={{ position: 'absolute', left: -40, right: -40, top: -160, bottom: 40, background: `radial-gradient(50% 60% at 50% 100%, ${C.cyan}${Math.round(200 * open).toString(16).padStart(2, '0')}, transparent 70%)` }} /> : null}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, background: '#8a4b1f', border: '6px solid #4a2408', borderRadius: 6 }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: 20, height: 40, background: '#a65d28', border: '6px solid #4a2408', borderRadius: '30px 30px 4px 4px', transformOrigin: '50% 100%', transform: `translateY(${-open * 30}px) rotate(${-open * 35}deg)` }} />
            <div style={{ position: 'absolute', left: 50, top: 52, width: 50, height: 26, background: '#ffcf3d', border: '4px solid #b8860b', fontFamily: FONT.mono, fontSize: 14, fontWeight: 800, color: '#7a4d00', textAlign: 'center', lineHeight: '18px' }}>{'</>'}</div>
          </div>
        );
      })()}
      {/* the three engine pipes: one hop each, on its word */}
      {pipes.map((wx, i) => {
        const x = scr(wx, t); if (x < -200 || x > 1160) return null;
        const lab = ['UNITY', 'UNREAL', 'GODOT'][i], show = sp(t - E.pipes[i] + 0.1, 0, 16, 0.5);
        return (
          <div key={`p${i}`} style={{ position: 'absolute', left: x, top: GROUND - 200, width: 130, height: 200 }}>
            <div style={{ position: 'absolute', left: 10, right: 10, top: 40, bottom: 0, background: 'linear-gradient(90deg, #1f8a3a, #47d164 40%, #1f8a3a)', border: '6px solid #0e4a1d' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 48, background: 'linear-gradient(90deg, #1f8a3a, #5ae377 40%, #1f8a3a)', border: '6px solid #0e4a1d' }} />
            <div style={{ position: 'absolute', left: -60, right: -60, top: -96, textAlign: 'center', transform: `scale(${show})`, fontFamily: FONT.display, fontWeight: 900, fontStretch: '80%', fontSize: 50, color: '#fff', WebkitTextStroke: `3px ${C.navy}`, textShadow: `0 5px 0 ${C.navy}` }}>{lab}</div>
          </div>
        );
      })}
      {/* the finish: flag pole */}
      {(() => {
        const x = scr(flagX, t); if (x < -100 || x > 1160) return null;
        const down = clamp((t - E.flag[1]) / 0.3);
        return (
          <div style={{ position: 'absolute', left: x, top: GROUND - 760, width: 20, height: 760 }}>
            <div style={{ position: 'absolute', left: 6, top: 30, width: 10, bottom: 0, background: '#d8e4ea' }} />
            <div style={{ position: 'absolute', left: -6, top: 0, width: 34, height: 34, borderRadius: '50%', background: '#ffcf3d', border: '4px solid #b8860b' }} />
            <div style={{ position: 'absolute', left: 16, top: 50 + down * 560, width: 130, height: 90, background: C.magenta, clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />
          </div>
        );
      })()}
      {/* water (over the hero while he's under) */}
      {(() => { const x = scr(pool.x, t); return x > -pool.w && x < 1100 ? <div style={{ position: 'absolute', left: x, top: GROUND + 24, width: pool.w, height: 400, background: 'rgba(38,128,230,0.82)', backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0 30px, transparent 30px 60px)', backgroundSize: '60px 8px', backgroundRepeat: 'repeat-x', backgroundPosition: `${t * 160}px 0`, zIndex: 3 }} /> : null; })()}
      {t > E.splash && t < E.splash + 0.55 ? Array.from({ length: 16 }, (_, i) => {
        const a = -Math.PI / 2 + (i - 7.5) * 0.15, u = (t - E.splash) / 0.55, d = 280 * easeOutCubic(u);
        return <div key={`sp${i}`} style={{ position: 'absolute', left: HX + 60 + Math.cos(a) * d, top: GROUND + Math.sin(a) * d + 520 * u * u, width: 18, height: 18, background: '#bfe6ff', opacity: 1 - u, zIndex: 4 }} />;
      }) : null}
      {/* the AI agents: drop in behind the hero, 7 x 7, and hover along */}
      {Array.from({ length: joined }, (_, i) => {
        const ti = E.lead + (E.agents - E.lead) * (i / 48), fall = easeOutCubic(clamp((t - ti) / 0.25));
        const col = i % 7, row = Math.floor(i / 7), bob = Math.sin(t * 14 + i) * 5;
        return <Sprite key={`a${i}`} rows={AGENT} px={7} x={HX - 54 - col * 40 + (t > E.flag[1] ? clamp((t - E.flag[1]) / 0.6) * 160 : 0)} y={lerp(300, GROUND - 52 - row * 46, fall) + bob} />;
      })}
      {/* the hero */}
      <div style={{ position: 'absolute', zIndex: 2 }}>
        <Sprite rows={[...HERO, ...legs]} x={HX + (t > E.flag[1] ? 70 : 0)} y={h.y} glow={radOn ? 1 - Math.abs(rad - 0.45) : 0} />
      </div>
      {/* three fireballs */}
      {E.fire.map((f, i) => {
        if (t < f || t > E.bugHit[i] + 0.05) return null;
        const u = t - f, x = HX + 130 + u * 1100, y = BASE + 60 - Math.abs(Math.sin(u * 14)) * 90;
        return <div key={`f${i}`} style={{ position: 'absolute', left: x, top: y, width: 46, height: 46, borderRadius: 23, background: 'radial-gradient(circle, #fff7b0 0%, #ffb02e 45%, #ff4d1a 80%)', boxShadow: '0 0 30px #ff7a1a, -30px 0 30px -10px #ffb02e', zIndex: 3 }} />;
      })}
      {/* radiation burst from the hero */}
      {radOn ? (
        <svg viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0, width: 1080, height: 1920, zIndex: 3 }}>
          {[0, 1, 2, 3].map((i) => { const r = Math.max(0, (invLerp(E.radiation, E.radiation + 0.6, t) - i * 0.1) * 1400); return <circle key={i} cx={HX + 72} cy={BASE + 90} r={r} fill="none" stroke={i % 2 ? '#3bf0ff' : '#9dff3b'} strokeWidth={28 - i * 4} opacity={clamp(1 - r / 1400)} />; })}
          {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2 + rad * 2, L = 900 * easeOutCubic(clamp(invLerp(E.radiation, E.radiation + 0.3, t))); return <line key={i} x1={HX + 72} y1={BASE + 90} x2={HX + 72 + Math.cos(a) * L} y2={BASE + 90 + Math.sin(a) * L} stroke="#eaffb0" strokeWidth={10} opacity={0.7 * clamp(1 - invLerp(E.radiation, E.radiation + 0.7, t))} />; })}
        </svg>
      ) : null}
      {t > E.radiation && t < E.radiation + 0.12 ? <div style={{ position: 'absolute', inset: 0, background: `rgba(220,255,160,${0.6 * (1 - (t - E.radiation) / 0.12)})`, zIndex: 5 }} /> : null}
      {/* fireworks on "games!" */}
      {E.fireworks.map((f, k) => {
        if (t < f || t > f + 0.7) return null;
        const u = (t - f) / 0.7, cx0 = 300 + k * 260, cy0 = 620 + (k % 2) * 160;
        return Array.from({ length: 18 }, (_, i) => {
          const a = (i / 18) * Math.PI * 2, d = 220 * easeOutCubic(u);
          return <div key={`fw${k}-${i}`} style={{ position: 'absolute', left: cx0 + Math.cos(a) * d, top: cy0 + Math.sin(a) * d + 120 * u * u, width: 14, height: 14, borderRadius: 7, background: [C.magenta, C.cyan, '#ffcf3d'][k % 3], opacity: 1 - u, zIndex: 4 }} />;
        });
      })}
      </div>
      {/* HUD (below the 220 px safe line) */}
      <div style={{ position: 'absolute', left: 70, right: 70, top: 236, display: 'flex', justifyContent: 'space-between', fontFamily: FONT.mono, fontWeight: 800, fontSize: 30, color: '#fff', textShadow: '3px 3px 0 #10306b', zIndex: 6 }}>
        <span>SCORE {String(coins * 100 + hits * 500 + joined * 50).padStart(6, '0')}</span><span>LEVEL 01</span><span>AGENTS ×{joined}</span>
      </div>
      {/* the words as game call-outs */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 7 }}>
        <Pop t={t} a={E.solo} b={E.dive[1] + 0.35} y={560} text="SOLO DEV?" col={C.magenta} />
        <Pop t={t} a={E.github} b={E.github + 1.35} y={560} text="GITHUB REPO" col={C.cyan} size={110} />
        <Pop t={t} a={E.pipes[0] - 0.05} b={E.lead - 0.15} y={560} text="ALL ENGINES" col="#47d164" size={110} />
        <Pop t={t} a={E.n49} b={E.mazedaar - 0.25} y={540} text="49 AI AGENTS" col={C.cyan} size={124} />
        <Pop t={t} a={E.mazedaar - 0.1} b={HOOK} y={540} text="MAZEDAAR GAMES!" col={C.magenta} size={104} />
      </div>
      {t > HOOK - 0.1 ? <div style={{ position: 'absolute', inset: 0, background: `rgba(255,255,255,${(t - (HOOK - 0.1)) / 0.1})`, zIndex: 9 }} /> : null}
    </div>
  );
};
export const HOOK_END = HOOK;
export { lerp };
