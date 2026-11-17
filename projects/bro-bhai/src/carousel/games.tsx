// The four mini-games drawn from src/carousel/sim.ts, each in a GW x GH logical box (pure in t).
//   Platformer: our pixel Bro (long hair, striped shirt) runs a brick level: code blocks, pipes, bugs, pits.
//   Arcade shooter: a ship sweeps a drone formation, wave after wave.
//   Team battle: 3 v 3 top-down arena, tracers, an ability blast, knock-outs, a capture point.
//   Puzzle: match-3 with swaps, clears, gravity and combos.
import React from 'react';
import { FONT } from '../themes/tokens';
import { hash } from '../animation/rng';
import { BLAST, GH, GW, KILLS, KOS, OBST, PF, PZ, PZ_KEYS, PZ_SCORE, SH, SHOTS, UNITS, btHp, btPos, btScore, btState, pfCam, pfHeroUp, shEnemy, shShipX, shWave } from './sim';

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const eOut = (t: number) => 1 - (1 - clamp(t)) ** 3;
const eInOut = (t: number) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2; };

const PAL: Record<string, string> = { k: '#1b1411', s: '#c98a62', g: '#e3eaf2', w: '#ffffff', b: '#241912', r: '#9a2f2f', R: '#6d1f1f', p: '#27324f',
  c: '#3bd5ff', C: '#0a7fb5', y: '#ffd23d', o: '#ff8a1f', m: '#ff3d9a', M: '#a3105b', l: '#9dff3b', L: '#3f9a14', v: '#b48cff', d: '#0b1b3a' };
export const Sprite: React.FC<{ rows: string[]; x: number; y: number; px: number; style?: React.CSSProperties }> = ({ rows, x, y, px, style }) => (
  <svg width={rows[0].length * px} height={rows.length * px} viewBox={`0 0 ${rows[0].length} ${rows.length}`} shapeRendering="crispEdges" style={{ position: 'absolute', left: x, top: y, ...style }}>
    {rows.flatMap((row, j) => [...row].map((ch, i) => (ch === '.' ? null : <rect key={`${i}-${j}`} x={i} y={j} width={1} height={1} fill={PAL[ch]} />)))}
  </svg>
);
const Hud: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ position: 'absolute', left: 14, right: 14, top: 10, display: 'flex', justifyContent: 'space-between', fontFamily: FONT.mono, fontWeight: 800, fontSize: 15, color: '#fff', textShadow: '2px 2px 0 rgba(0,0,0,0.55)', zIndex: 20, ...style }}>{children}</div>
);
const pad = (n: number, k = 6) => String(Math.round(n)).padStart(k, '0');

// ================================================================ A. platformer
const HERO = ['...kkkkkk...', '..kkkkkkkk..', '.kkkssssssk.', '.kgggssgggk.', '.kgwgssgwgk.', '.kssssssssk.', '.kbssbbssbk.', '.kbbbbbbbbk.',
  '.kkbbbbbbkk.', '.krrRrrRrrk.', 'srrRrrRrrRrs', 'srrRrrRrrRrs', '..rrRrrRrr..', '..pppppppp..'];
const LEGS = [['..ppp..ppp..', '.kkkk..kkkk.'], ['..pp....pp..', '.kkk....kkk.'], ['...pp..pp...', '...kk..kk...']];
const BUG = ['m......m', '.m.mm.m.', '..mmmm..', '.mwmmwm.', 'mmmmmmmm', '.mMmmMm.', 'm.m..m.m'];
const TILE = 36;
export const Platformer: React.FC<{ t: number }> = ({ t }) => {
  const cam = pfCam(t), up = pfHeroUp(t), air = up > 0.5, gy = PF.gy;
  const legs = air ? LEGS[2] : LEGS[Math.floor(t * 14) % 2];
  const pits = OBST.filter((o) => o.kind === 'pit').map((o) => [o.wx - 46, o.wx + 46]);
  const bumps = OBST.filter((o) => o.kind === 'block' && t > o.t).length;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'linear-gradient(#4fb2ff, #9fdcff 60%, #d6f1ff)' }}>
      {[[60, 70, 1], [300, 40, 1.3], [470, 120, 0.8], [700, 60, 1.1]].map(([x, y, s], i) => (
        <div key={i} style={{ position: 'absolute', left: ((((x - cam * 0.2 * s) % 800) + 800) % 800) - 140, top: y + 30, width: 90 * s, height: 30 * s, background: '#fff', borderRadius: 18, boxShadow: `${22 * s}px -${12 * s}px 0 -3px #fff, ${48 * s}px 0 0 -2px #fff` }} />
      ))}
      <svg viewBox="0 0 1200 200" style={{ position: 'absolute', left: -(((cam * 0.45) % 600) + 600) % 600, top: gy - 150, width: 1200, height: 200 }}>
        <path d="M0 160 Q100 40 200 160 Q300 60 400 160 Q500 30 600 160 Q700 40 800 160 Q900 60 1000 160 Q1100 30 1200 160 L1200 200 L0 200 Z" fill="#62cf7c" />
        <path d="M0 170 Q150 110 300 170 Q450 100 600 170 Q750 110 900 170 Q1050 100 1200 170 L1200 200 L0 200 Z" fill="#3fae5c" />
      </svg>
      {/* ground, with pits */}
      {Array.from({ length: Math.ceil(GW / TILE) + 2 }, (_, i) => {
        const wx = (Math.floor(cam / TILE) + i) * TILE;
        if (pits.some(([a, b]) => wx + TILE > a && wx < b)) return null;
        return <div key={wx} style={{ position: 'absolute', left: wx - cam, top: gy, width: TILE, height: GH - gy, background: '#b5652d', borderTop: '9px solid #54c25e',
          backgroundImage: 'linear-gradient(#7a3f17 2px, transparent 2px), linear-gradient(90deg, #7a3f17 2px, transparent 2px)', backgroundSize: `${TILE}px ${TILE / 2}px, ${TILE / 2}px ${TILE}px`, boxShadow: 'inset -2px 0 0 #7a3f17' }} />;
      })}
      {OBST.map((o) => {
        const x = o.wx - cam; if (x < -120 || x > GW + 120) return null;
        if (o.kind === 'pipe') return (
          <div key={o.n} style={{ position: 'absolute', left: x - 30, top: gy - 74, width: 60, height: 74 }}>
            <div style={{ position: 'absolute', left: 5, right: 5, top: 20, bottom: 0, background: 'linear-gradient(90deg, #1f8a3a, #5ae377 40%, #1f8a3a)', border: '3px solid #0e4a1d' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 24, background: 'linear-gradient(90deg, #1f8a3a, #6ff08a 40%, #1f8a3a)', border: '3px solid #0e4a1d' }} />
          </div>
        );
        if (o.kind === 'bug') return <Sprite key={o.n} rows={BUG} px={4} x={x - 16 - (t - o.t) * 30} y={gy - 28 + (Math.floor(t * 8) % 2)} />;
        if (o.kind === 'block') {
          const hit = t > o.t, b = hit && t < o.t + 0.14 ? 8 : 0, top = gy - 64 - PF.height - 38;
          return (
            <React.Fragment key={o.n}>
              {[-1, 0, 1].map((k) => <div key={k} style={{ position: 'absolute', left: x - 18 + k * 36, top: top - (k === 0 ? b : 0), width: 36, height: 36, background: k === 0 && hit ? '#c9a46a' : k === 0 ? '#ffcf3d' : '#c0703a', border: '3px solid #7a4d00', boxSizing: 'border-box',
                fontFamily: FONT.mono, fontWeight: 800, fontSize: 12, color: '#7a4d00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{k === 0 ? '</>' : ''}</div>)}
              {hit && t < o.t + 0.5 ? <div style={{ position: 'absolute', left: x - 11, top: top - 30 - (t - o.t) * 160, width: 22, height: 28, borderRadius: '50%', background: '#ffcf3d', border: '3px solid #b8860b', opacity: 1 - (t - o.t) / 0.5, transform: `scaleX(${Math.abs(Math.cos(t * 18))})` }} /> : null}
            </React.Fragment>
          );
        }
        return null;
      })}
      <Sprite rows={[...HERO, ...legs]} px={4} x={PF.hx} y={gy - 64 - up} style={{ transform: air ? 'rotate(-6deg)' : undefined }} />
      {/* dust puffs on each landing */}
      {OBST.map((o) => { const l = o.t + PF.jump / 2, u = (t - l) / 0.3; return u > 0 && u < 1 ? [-1, 1].map((d) => <div key={`${o.n}${d}`} style={{ position: 'absolute', left: PF.hx + 22 + d * (14 + 30 * u), top: gy - 8 - 10 * u, width: 12, height: 12, borderRadius: 6, background: '#fff', opacity: 1 - u }} />) : null; })}
      <Hud><span>SCORE {pad(1200 + bumps * 200 + Math.floor(t * 50) * 10)}</span><span>LEVEL 01</span><span>◎×{String(8 + bumps).padStart(2, '0')}</span></Hud>
    </div>
  );
};

// ================================================================ B. arcade shooter
const DRONE = ['...xxx...', '..xwdwx..', '.xxxxxxx.', 'xxxxxxxxx', '.xyxyxyx.', '..x...x..'];   // an original saucer drone (blinking lights)
const ROWC = [['m', 'M'], ['o', 'R'], ['l', 'L']];
const SHIP = ['....w....', '...cwc...', '...ccc...', '..cCwCc..', '.ccCwCcc.'.slice(0, 9), 'cccCCCccc', 'cc.ooo.cc', '....y....'];
export const Shooter: React.FC<{ t: number }> = ({ t }) => {
  const w = shWave(t), sx = shShipX(t);
  const kills = KILLS.filter((k) => k.tk <= t).length;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'linear-gradient(#070322, #1d0c4f 70%, #33115e)' }}>
      {[0, 1, 2].flatMap((layer) => Array.from({ length: 26 }, (_, i) => {
        const x = hash(i, layer) * GW, sp = 40 + layer * 70, y = ((hash(i, layer + 7) * GH + t * sp) % GH);
        return <div key={`${layer}-${i}`} style={{ position: 'absolute', left: x, top: y, width: 1 + layer, height: 1 + layer * (layer === 2 ? 4 : 1), background: '#fff', opacity: 0.35 + layer * 0.25 }} />;
      }))}
      {/* the formation of the current wave (and the tail of the last one's explosions) */}
      {[w - 1, w].flatMap((wv) => wv < 0 ? [] : Array.from({ length: SH.cols * SH.rows }, (_, i) => {
        const c = i % SH.cols, r = Math.floor(i / SH.cols), k = KILLS.find((q) => q.w === wv && q.c === c && q.r === r)!;
        if (t >= k.tk) {
          const u = (t - k.tk) / 0.35; if (u > 1) return null;
          return (
            <React.Fragment key={`e${wv}-${i}`}>
              <div style={{ position: 'absolute', left: k.x - 30 * u, top: k.y - 30 * u, width: 60 * u, height: 60 * u, borderRadius: '50%', border: `${4 * (1 - u) + 1}px solid #ffd23d`, opacity: 1 - u }} />
              {Array.from({ length: 8 }, (_, j) => { const a = (j / 8) * Math.PI * 2 + i; return <div key={j} style={{ position: 'absolute', left: k.x + Math.cos(a) * 34 * eOut(u), top: k.y + Math.sin(a) * 34 * eOut(u), width: 5, height: 5, background: j % 2 ? '#ff8a1f' : '#fff', opacity: 1 - u }} />; })}
            </React.Fragment>
          );
        }
        if (wv !== w) return null;
        const p = shEnemy(wv, c, r, t), [a, b] = ROWC[r];
        const blink = Math.floor(t * 6 + c + r) % 2;
        const rows = DRONE.map((row, j) => row.replace(/x/g, j === 1 ? b : a).replace(/y/g, blink ? 'y' : 'w'));
        return <Sprite key={`e${wv}-${i}`} rows={rows} px={4} x={p.x - 18} y={p.y - 12} />;
      }))}
      {/* our bullets: a two-shot burst per kill */}
      {KILLS.flatMap((k, i) => [k.tf - 0.07, k.tf].map((tf, j) => {
        if (t < tf || t > k.tk) return null;
        const y = SH.shipY - 24 - (t - tf) * SH.bullet; if (y < k.y) return null;
        return <div key={`b${i}${j}`} style={{ position: 'absolute', left: k.x - 2, top: y, width: 4, height: 16, borderRadius: 2, background: '#fff6a8', boxShadow: '0 0 8px #ffd23d' }} />;
      }))}
      {/* enemy pellets (decor) */}
      {Array.from({ length: 4 }, (_, i) => { const per = 1.3, ph = ((t + i * 0.33) % per) / per, x = 120 + hash(i, Math.floor((t + i * 0.33) / per)) * 300; return <div key={`p${i}`} style={{ position: 'absolute', left: x, top: 150 + ph * 360, width: 7, height: 7, borderRadius: 4, background: '#ff3d6e', boxShadow: '0 0 6px #ff3d6e' }} />; })}
      <Sprite rows={SHIP} px={4} x={sx - 18} y={SH.shipY - 16} />
      <div style={{ position: 'absolute', left: sx - 5, top: SH.shipY + 18, width: 10, height: 8 + 6 * Math.abs(Math.sin(t * 40)), borderRadius: 5, background: 'linear-gradient(#ffd23d, transparent)' }} />
      <Hud><span>1UP {pad(kills * 150)}</span><span>HI {pad(98250)}</span><span>WAVE {String(w + 1).padStart(2, '0')}</span></Hud>
      <div style={{ position: 'absolute', left: 14, bottom: 10, display: 'flex', gap: 6 }}>{[0, 1, 2].map((i) => <Sprite key={i} rows={SHIP} px={2} x={0} y={0} style={{ position: 'relative' }} />)}</div>
    </div>
  );
};

// ================================================================ C. team battle
const TEAM = { blue: { a: '#3bd5ff', b: '#0a6fa8' }, red: { a: '#ff4d6d', b: '#a3102e' } };
export const Battle: React.FC<{ t: number }> = ({ t }) => {
  const pos = Object.fromEntries(UNITS.map((u) => [u.id, btPos(u, t)]));
  const sc = btScore(t), cap = clamp(0.35 + t * 0.04);
  const clock = Math.max(0, 134 - Math.floor(t));
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#2c6a3a',
      backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.08) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.08) 75%), linear-gradient(45deg, rgba(0,0,0,0.08) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.08) 75%)',
      backgroundSize: '44px 44px', backgroundPosition: '0 0, 22px 22px' }}>
      {[150, 260, 370].map((y) => <div key={y} style={{ position: 'absolute', left: 30, right: 30, top: y - 16, height: 32, background: 'rgba(214,200,160,0.30)', borderRadius: 16 }} />)}
      <div style={{ position: 'absolute', left: GW / 2 - 62, top: 260 - 62, width: 124, height: 124, borderRadius: '50%', border: '4px dashed rgba(255,255,255,0.55)', background: `conic-gradient(${TEAM.blue.a}88 ${cap * 360}deg, rgba(255,255,255,0.08) 0)` }} />
      <div style={{ position: 'absolute', left: GW / 2 - 14, top: 246, fontFamily: FONT.mono, fontWeight: 800, fontSize: 22, color: '#fff' }}>A</div>
      {/* bases */}
      {[['blue', 26], ['red', GW - 26]].map(([team, x]) => (
        <div key={team as string} style={{ position: 'absolute', left: (x as number) - 22, top: 238, width: 44, height: 50, background: TEAM[team as 'blue'].a, clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)', boxShadow: `0 0 20px ${TEAM[team as 'blue'].a}`, opacity: 0.9 }} />
      ))}
      {/* tracers + sparks */}
      {SHOTS.map((s, i) => {
        const u = (t - s.t) / 0.12; if (u < 0 || u > 1.6) return null;
        const a = pos[s.from], b = pos[s.to], col = s.from.startsWith('B') ? TEAM.blue.a : TEAM.red.a;
        const hx = lerp(a[0], b[0], clamp(u)), hy = lerp(a[1], b[1], clamp(u)), tx = lerp(a[0], b[0], clamp(u - 0.5)), ty = lerp(a[1], b[1], clamp(u - 0.5));
        return (
          <React.Fragment key={i}>
            {u < 1 ? <svg style={{ position: 'absolute', inset: 0, width: GW, height: GH }}><line x1={tx} y1={ty} x2={hx} y2={hy} stroke={col} strokeWidth={4} strokeLinecap="round" /><line x1={tx} y1={ty} x2={hx} y2={hy} stroke="#fff" strokeWidth={1.5} strokeLinecap="round" /></svg> : null}
            {u >= 1 ? <div style={{ position: 'absolute', left: b[0] - 10, top: b[1] - 10, width: 20, height: 20, borderRadius: '50%', border: `3px solid ${col}`, transform: `scale(${1 + (u - 1) * 2})`, opacity: 1 - (u - 1) / 0.6 }} /> : null}
          </React.Fragment>
        );
      })}
      {/* the ability blast: a ring flies from B1 to R0, then bursts */}
      {(() => {
        const u = (t - BLAST.t) / 0.4; if (u < 0 || u > 1.8) return null;
        const a = pos[BLAST.from], b = pos[BLAST.to], p = eInOut(u);
        return u < 1 ? <div style={{ position: 'absolute', left: lerp(a[0], b[0], p) - 18, top: lerp(a[1], b[1], p) - 18, width: 36, height: 36, borderRadius: '50%', background: 'radial-gradient(#fff, #3bd5ff 55%, transparent 70%)', boxShadow: '0 0 30px #3bd5ff' }} />
          : <div style={{ position: 'absolute', left: b[0] - 70, top: b[1] - 70, width: 140, height: 140, borderRadius: '50%', border: '8px solid #3bd5ff', transform: `scale(${0.2 + (u - 1) * 1.2})`, opacity: 1 - (u - 1) / 0.8, boxShadow: '0 0 40px #3bd5ff' }} />;
      })()}
      {/* units */}
      {UNITS.map((u) => {
        const [x, y] = pos[u.id], st = btState(u.id, t), col = TEAM[u.team];
        const ko = KOS.find((k) => k.id === u.id && t >= k.t && t < k.t + 0.9);
        if (st.down && !ko) return null;
        const fu = ko ? (t - ko.t) / 0.9 : 0;
        const tgt = SHOTS.filter((s) => s.from === u.id && s.t <= t).pop(), tp = tgt ? pos[tgt.to] : [GW / 2, y];
        const ang = Math.atan2(tp[1] - y, tp[0] - x);
        return (
          <React.Fragment key={u.id}>
            {ko ? (
              <>
                <div style={{ position: 'absolute', left: x - 40, top: y - 40, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(#fff, ${col.a} 40%, transparent 70%)`, transform: `scale(${0.4 + fu * 1.4})`, opacity: 1 - fu }} />
                <div style={{ position: 'absolute', left: x - 40, width: 80, textAlign: 'center', top: y - 52 - fu * 40, fontFamily: FONT.display, fontWeight: 900, fontSize: 30, color: '#fff', WebkitTextStroke: '2px #1b1b1b', opacity: 1 - fu * fu }}>KO!</div>
              </>
            ) : null}
            <div style={{ position: 'absolute', left: x - 17, top: y - 17, width: 34, height: 34, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, #fff 0 10%, ${col.a} 30%, ${col.b} 100%)`, border: '3px solid #10131f', boxSizing: 'border-box', opacity: ko ? 1 - fu : 1, transform: `rotate(${ang}rad)` }}>
              <div style={{ position: 'absolute', left: 20, top: 11, width: 18, height: 6, background: '#10131f', borderRadius: 3 }} />
            </div>
            {!ko ? (
              <div style={{ position: 'absolute', left: x - 18, top: y - 30, width: 36, height: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 3 }}>
                <div style={{ width: `${btHp(u, t) * 100}%`, height: '100%', borderRadius: 3, background: btHp(u, t) > 0.4 ? '#7dff6a' : '#ffd23d' }} />
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
      <Hud style={{ justifyContent: 'center', gap: 14 }}>
        <span style={{ background: TEAM.blue.b, padding: '2px 10px', borderRadius: 6 }}>BLUE {sc.blue}</span>
        <span>{Math.floor(clock / 60)}:{String(clock % 60).padStart(2, '0')}</span>
        <span style={{ background: TEAM.red.b, padding: '2px 10px', borderRadius: 6 }}>{sc.red} RED</span>
      </Hud>
      <div style={{ position: 'absolute', right: 14, bottom: 12, width: 180, height: 10, background: 'rgba(0,0,0,0.45)', borderRadius: 5, overflow: 'hidden' }}><div style={{ width: `${cap * 100}%`, height: '100%', background: TEAM.blue.a }} /></div>
      <div style={{ position: 'absolute', right: 14, width: 180, bottom: 26, textAlign: 'center', fontFamily: FONT.mono, fontWeight: 800, fontSize: 12, color: '#fff' }}>CAPTURING A · {Math.round(cap * 100)}%</div>
    </div>
  );
};

// ================================================================ D. match-3 puzzle
const GEM = [
  { c: '#ff4060', d: '#9e0f2a', shape: 'circle' }, { c: '#3bd5ff', d: '#0a6fa8', shape: 'diamond' }, { c: '#ffd23d', d: '#a57a00', shape: 'square' },
  { c: '#7dff6a', d: '#2e8f1e', shape: 'tri' }, { c: '#d18cff', d: '#6a2aa3', shape: 'hex' }, { c: '#ff9a3d', d: '#a3480a', shape: 'star' },
];
const SHAPE: Record<string, string> = {
  diamond: 'M22 2 L42 22 L22 42 L2 22 Z', square: 'M5 5 H39 V39 H5 Z', tri: 'M22 3 L42 39 H2 Z', hex: 'M12 3 H32 L42 22 L32 41 H12 L2 22 Z',
  star: 'M22 2 L27.5 15.5 L42 16 L30.5 25.5 L34.5 40 L22 31.5 L9.5 40 L13.5 25.5 L2 16 L16.5 15.5 Z',
};
const Gem: React.FC<{ type: number; x: number; y: number; s: number; glow: number }> = ({ type, x, y, s, glow }) => {
  const g = GEM[type], id = `g${type}`;
  return (
    <svg width={44} height={44} viewBox="0 0 44 44" style={{ position: 'absolute', left: x - 22, top: y - 22, transform: `scale(${s})`, filter: glow ? `drop-shadow(0 0 ${8 * glow}px #fff)` : undefined, overflow: 'visible' }}>
      <defs><radialGradient id={id} cx="35%" cy="30%" r="80%"><stop offset="0" stopColor="#fff" /><stop offset="0.35" stopColor={g.c} /><stop offset="1" stopColor={g.d} /></radialGradient></defs>
      {g.shape === 'circle' ? <circle cx={22} cy={22} r={19} fill={`url(#${id})`} stroke={g.d} strokeWidth={2.5} /> : <path d={SHAPE[g.shape]} fill={`url(#${id})`} stroke={g.d} strokeWidth={2.5} strokeLinejoin="round" />}
      <ellipse cx={16} cy={13} rx={6} ry={3.5} fill="rgba(255,255,255,0.7)" />
    </svg>
  );
};
const BX = (GW - PZ.cols * PZ.cell) / 2, BY = 62;
export const Puzzle: React.FC<{ t: number }> = ({ t }) => {
  let i = 0; while (i < PZ_KEYS.length - 1 && PZ_KEYS[i + 1].t <= t) i++;
  const A = PZ_KEYS[i], B = PZ_KEYS[Math.min(i + 1, PZ_KEYS.length - 1)];
  const raw = B === A ? 1 : clamp((t - A.t) / (B.t - A.t));
  const u = B.ease === 'swap' ? eInOut(raw) : B.ease === 'fall' ? raw * raw : raw;
  const ids = new Set([...Object.keys(B.gems), ...Object.keys(A.gems)].map(Number));
  const cellXY = (c: number, r: number) => [BX + (c + 0.5) * PZ.cell, BY + (r + 0.5) * PZ.cell];
  const pops = PZ_KEYS.filter((k) => k.pops.length && t >= k.t - 0.2 && t < k.t + 0.7);
  const score = PZ_SCORE(t);
  const sel = B.swap && B.ease === 'fall' && t > B.t - 0.32 ? B.swap : A.ease === 'fall' && A.swap && t < A.t + 0.02 ? A.swap : null;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'radial-gradient(120% 90% at 50% 0%, #6b2fa8, #2a1458 60%, #170a35)' }}>
      <div style={{ position: 'absolute', left: BX - 10, top: BY - 10, width: PZ.cols * PZ.cell + 20, height: PZ.rows * PZ.cell + 20, borderRadius: 18, background: 'rgba(10,4,30,0.55)', border: '3px solid rgba(255,255,255,0.18)' }} />
      <div style={{ position: 'absolute', left: BX, top: BY, width: PZ.cols * PZ.cell, height: PZ.rows * PZ.cell, overflow: 'hidden' }}>
        {Array.from({ length: PZ.cols * PZ.rows }, (_, k) => { const c = k % PZ.cols, r = Math.floor(k / PZ.cols); return (c + r) % 2 ? <div key={k} style={{ position: 'absolute', left: c * PZ.cell, top: r * PZ.cell, width: PZ.cell, height: PZ.cell, background: 'rgba(255,255,255,0.05)' }} /> : null; })}
        {[...ids].map((id) => {
          const a = A.gems[id], b = B.gems[id];
          if (!b && (!a || a.s === 0)) return null;
          const p = a && b ? { c: lerp(a.c, b.c, u), r: lerp(a.r, b.r, u), s: lerp(a.s, b.s, B.ease === 'clear' ? raw * raw : u), type: b.type } : (b ?? a)!;
          if (p.s <= 0.01) return null;
          const [x, y] = cellXY(p.c, p.r);
          const dying = B.ease === 'clear' && b && b.s === 0;
          return <Gem key={id} type={p.type} x={x - BX} y={y - BY} s={dying ? 1 + 0.25 * Math.sin(raw * Math.PI) - raw * raw : p.s} glow={dying ? 1 - raw : 0} />;
        })}
      </div>
      {sel ? [[sel[0], sel[1]], [sel[2], sel[3]]].map(([c, r], k) => { const [x, y] = cellXY(c, r); return <div key={k} style={{ position: 'absolute', left: x - 27, top: y - 27, width: 54, height: 54, borderRadius: 12, border: '3px solid #fff', boxShadow: '0 0 14px #fff' }} />; }) : null}
      {pops.flatMap((k) => k.pops.map((p, j) => {
        const v = (t - (k.t - 0.2)) / 0.9, [x, y] = cellXY(p.c, p.r);
        return (
          <React.Fragment key={`${k.t}${j}`}>
            <div style={{ position: 'absolute', left: x - 60, width: 120, textAlign: 'center', top: y - 20 - v * 50, fontFamily: FONT.display, fontWeight: 900, fontSize: 26, color: '#fff', WebkitTextStroke: '1.5px #2a1458', opacity: 1 - v }}>+{p.n * 10 * p.combo}</div>
            {p.combo > 1 ? <div style={{ position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center', fontFamily: FONT.display, fontWeight: 900, fontStretch: '80%', fontSize: 52, color: '#ffd23d', WebkitTextStroke: '2.5px #3a0f6b', transform: `scale(${1.4 - 0.4 * eOut(v * 3)}) rotate(-6deg)`, opacity: 1 - v * v }}>COMBO ×{p.combo}!</div> : null}
          </React.Fragment>
        );
      }))}
      <Hud><span>SCORE {score.toLocaleString('en-US')}</span><span>LEVEL 07</span><span>MOVES {Math.max(1, 24 - PZ_KEYS.filter((k) => k.ease === 'swap' && k.t <= t).length)}</span></Hud>
    </div>
  );
};

export const GAMES = [
  { key: 'pf', name: 'PLATFORMER', col: '#ffcf3d', C: Platformer },
  { key: 'sh', name: 'ARCADE SHOOTER', col: '#ff3d9a', C: Shooter },
  { key: 'bt', name: 'TEAM BATTLE', col: '#3bd5ff', C: Battle },
  { key: 'pz', name: 'PUZZLE', col: '#b48cff', C: Puzzle },
] as const;
