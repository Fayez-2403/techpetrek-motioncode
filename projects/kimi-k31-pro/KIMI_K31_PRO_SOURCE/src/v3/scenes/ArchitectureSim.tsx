// 3D · ARCHITECTURE SIMULATION (2 bars, half-time breakdown). A white-clay city model seen from high above. Beat 0: the
// site plan draws itself (plot line, setback, structural grid with axis bubbles, footprint, north arrow) and the column
// lines of a parametric twisting tower rise out of it. Beats 1-3: the floor plates drop in, a batch per beat, each slab
// edge flashing as it lands; the crown caps it. Beats 3-4: the glass facade sweeps up panel by panel. Bar 2 (the wow):
// the sun study starts, the sun appears on its path at dawn and steps across the sky on every beat, so the long shadows
// of the tower and its neighbours swing across the site from morning to dusk. Camera: one slow crane-down orbit.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { clamp, easeInOutSine, keys, lerp, reveal } from '../../lib/anim';
import { useLayout } from '../../lib/layout';
import { F } from '../../styles/typography';
import { CamRig, Env, orbit, project, type V3 } from '../../three/stage';
import { V3Tag, beatAt, type V3Props } from '../lib';
import { ARCH, ArchWorld, SUN_R, archTime, sunDir } from '../three/WorldArch';
import { WorldStage, mixHex } from '../three/WorldKit';
import TL from '../timeline.json';

const LABEL = TL.shots.find((s) => s.id === 'architectureSim')!.label;
const INK = '#1C2433', MUTE = '#6A7385', BLUE = '#2F6FE8', SUN = '#FF8A2A';

/** one continuous move: a crane down while the tower assembles (bar 1), then a pull-back for the sun study (bar 2) */
function camAt(f: number, dur: number) {
  const u = easeInOutSine(clamp(f / dur)), b = dur / 2;
  const yaw = lerp(-0.5, 0.32, u);
  const el = keys(f, [[0, 0.98], [b, 0.6], [dur, 0.4]], easeInOutSine);
  const r = keys(f, [[0, 80], [b, 72], [dur, 86]], easeInOutSine);
  const ty = keys(f, [[0, 2], [b, 11], [dur, 11.5]], easeInOutSine);
  const target: V3 = [lerp(1.5, -3, u), ty, lerp(1, -2, u)];
  return { pos: orbit(target, r, yaw, el), target, fov: 34 };
}

const hh = (h: number) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60 / 15) * 15).padStart(2, '0')}`;

/** top-left: the model's parameters and the build phases */
const ModelPanel: React.FC<{ f: number }> = ({ f }) => {
  const T = archTime(f);
  const on = reveal(f, 2, 12);
  const phase = f < 15 ? 0 : f < 40 ? 1 : f < 60 ? 2 : 3;
  const steps = ['SITE', 'STRUCTURE', 'FACADE', 'SUN STUDY'];
  const row = (k: string, v: string, hot = false) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: F.mono, fontSize: 17, color: MUTE, letterSpacing: '0.06em', padding: '3px 0' }}>
      <span>{k}</span><span style={{ color: hot ? BLUE : INK, fontWeight: 700 }}>{v}</span>
    </div>
  );
  return (
    <div style={{ position: 'absolute', left: 270, top: 46, width: 330, opacity: on, transform: `translateY(${(1 - on) * -14}px)`,
      background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(28,36,51,0.12)', borderRadius: 10, padding: '14px 18px 14px', backdropFilter: 'blur(8px)', boxShadow: '0 10px 30px rgba(40,44,60,0.10)' }}>
      <div style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, letterSpacing: '0.16em', color: INK, marginBottom: 8 }}>PARAMETRIC TOWER</div>
      {row('FLOORS', `${String(T.placed).padStart(2, '0')} / ${ARCH.N}`, T.placed > 0 && T.placed < ARCH.N)}
      {row('TWIST', `${Math.round((ARCH.twist * 180) / Math.PI)}°`)}
      {row('TAPER', ARCH.taper.toFixed(2))}
      {row('FACADE', `${Math.round(T.facade * 100)}%`, T.facade > 0 && T.facade < 1)}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: i === 3 ? 1.5 : i === 1 ? 1.45 : 1, textAlign: 'center', fontFamily: F.mono, fontSize: 11.5, letterSpacing: '0.06em', padding: '5px 0', borderRadius: 4,
            color: i === phase ? '#fff' : i < phase ? INK : MUTE, background: i === phase ? (i === 3 ? SUN : BLUE) : i < phase ? 'rgba(47,111,232,0.12)' : 'rgba(28,36,51,0.05)' }}>{s}</div>
        ))}
      </div>
    </div>
  );
};

/** top-right: the sun-study readout (path diagram, clock, shadow-hour ticks); appears just before the bar */
const SunPanel: React.FC<{ f: number }> = ({ f }) => {
  const T = archTime(f);
  const on = reveal(f, 46, 12);
  const b = beatAt(f);
  const W = 340, cx = W / 2, R = 128;
  const ang = Math.PI * T.sunS;
  const sx = cx + R * Math.cos(ang), sy = 150 - R * 0.62 * Math.sin(ang);
  const live = f >= 60;
  return (
    <div style={{ position: 'absolute', left: 1500 - W, top: 156, width: W, opacity: on, transform: `translateY(${(1 - on) * -14}px)`,
      background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(28,36,51,0.12)', borderRadius: 10, padding: '14px 0 12px', backdropFilter: 'blur(8px)', boxShadow: '0 10px 30px rgba(40,44,60,0.10)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 18px', fontFamily: F.mono, fontSize: 15, fontWeight: 700, letterSpacing: '0.16em', color: INK }}>
        <span>SUN STUDY</span><span style={{ color: MUTE, fontWeight: 400 }}>21 JUN</span>
      </div>
      <svg width={W} height={168} style={{ display: 'block', marginTop: 4 }}>
        <line x1={20} x2={W - 20} y1={150} y2={150} stroke="rgba(28,36,51,0.25)" strokeWidth={1.5} />
        <path d={Array.from({ length: 61 }, (_, i) => { const a = Math.PI * (1 - i / 60); return `${i ? 'L' : 'M'}${(cx + R * Math.cos(a)).toFixed(1)},${(150 - R * 0.62 * Math.sin(a)).toFixed(1)}`; }).join(' ')}
          fill="none" stroke={SUN} strokeWidth={2} strokeDasharray="4 5" opacity={0.8} />
        {Array.from({ length: 15 }, (_, h) => { const a = Math.PI * (h / 14), x = cx + R * Math.cos(a), y = 150 - R * 0.62 * Math.sin(a); const past = live && h / 14 <= T.sunS;
          return <circle key={h} cx={x} cy={y} r={h % 2 ? 2.4 : 3.6} fill={past ? SUN : '#fff'} stroke={SUN} strokeWidth={1.5} />; })}
        {live ? <>
          <line x1={sx} y1={sy} x2={cx} y2={150} stroke={SUN} strokeWidth={1} opacity={0.5} />
          <circle cx={sx} cy={sy} r={13 + 6 * b.pulse} fill={SUN} opacity={0.18} />
          <circle cx={sx} cy={sy} r={7} fill={SUN} />
        </> : null}
        <text x={20} y={166} fontFamily={F.mono} fontSize={12} fill={MUTE}>W</text>
        <text x={W - 28} y={166} fontFamily={F.mono} fontSize={12} fill={MUTE}>E</text>
      </svg>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 18px' }}>
        <span style={{ fontFamily: F.mono, fontSize: 13, letterSpacing: '0.12em', color: MUTE }}>LOCAL TIME</span>
        <span style={{ fontFamily: F.mono, fontSize: 34, fontWeight: 700, color: live ? INK : MUTE, transform: `scale(${1 + 0.05 * (live ? b.pulse : 0)})`, transformOrigin: '100% 70%' }}>{live ? hh(T.hour) : '--:--'}</span>
      </div>
      <div style={{ padding: '8px 18px 0' }}>
        <div style={{ fontFamily: F.mono, fontSize: 11.5, letterSpacing: '0.12em', color: MUTE, marginBottom: 5 }}>SHADOW HOURS</div>
        <div style={{ position: 'relative', height: 16 }}>
          {Array.from({ length: 15 }, (_, h) => {
            const x = 4 + (1 - h / 14) * (W - 44), past = live && h / 14 <= T.sunS;
            return <div key={h} style={{ position: 'absolute', left: x, top: h % 3 === 0 ? 0 : 5, width: 2, height: h % 3 === 0 ? 16 : 11, borderRadius: 1, background: past ? SUN : 'rgba(28,36,51,0.22)' }} />;
          })}
          {live ? <div style={{ position: 'absolute', left: 4 + (1 - T.sunS) * (W - 44) - 1, top: -3, width: 4, height: 22, borderRadius: 2, background: INK }} /> : null}
        </div>
      </div>
    </div>
  );
};

export const ArchitectureSim: React.FC<V3Props> = ({ dur }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const T = archTime(f);
  const cam = camAt(f, dur);
  // seamless model base; warms with the sun study and dims a touch at dusk
  const warm = T.sunOn * (0.3 + 0.7 * (1 - Math.sin(Math.PI * T.sunS)));
  const dusk = clamp((T.sunS - 0.7) / 0.3) * T.sunOn;
  const bgTop = mixHex(mixHex('#E9ECEF', '#F3E3CF', warm), '#E6C9AE', dusk);
  const bgBot = mixHex(mixHex('#F1EFEA', '#F6EADB', warm), '#EBD3BB', dusk);
  const fogC = mixHex(mixHex('#ECEBE7', '#F2E6D8', warm), '#E8D1BA', dusk);
  const flash = f >= 60 ? Math.exp(-(f - 60) / 6) : 0;
  const sd = sunDir(T.sunS);
  const sunPx = project([sd[0] * SUN_R, sd[1] * SUN_R, sd[2] * SUN_R], cam, L.w, L.h);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${bgTop} 0%, ${bgBot} 100%)` }}>
      <WorldStage exposure={1.08 + 0.04 * T.sunOn - 0.06 * dusk} near={0.5} far={1200}>
        <Env intensity={0.16 - 0.02 * T.sunOn} />
        <fog attach="fog" args={['#ECEBE7', 150, 420]} color={fogC} />
        <CamRig pos={cam.pos} target={cam.target} fov={cam.fov} />
        <ArchWorld f={f} />
      </WorldStage>
      {/* sunrise bloom on the bar */}
      <AbsoluteFill style={{ pointerEvents: 'none', background: `radial-gradient(70% 70% at ${(sunPx[0] / 19.2).toFixed(1)}% ${(sunPx[1] / 10.8).toFixed(1)}%, rgba(255,196,130,0.55) 0%, rgba(255,196,130,0) 60%)`, opacity: flash * 0.7 }} />
      <AbsoluteFill style={{ pointerEvents: 'none', background: 'radial-gradient(130% 110% at 50% 45%, rgba(0,0,0,0) 60%, rgba(60,50,40,0.16) 100%)' }} />
      <ModelPanel f={f} />
      <SunPanel f={f} />
      <V3Tag label={LABEL} dark />
    </AbsoluteFill>
  );
};

