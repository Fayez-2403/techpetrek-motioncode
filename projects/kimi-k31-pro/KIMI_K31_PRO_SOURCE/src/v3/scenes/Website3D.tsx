// V3 · WEB · 3D WEBSITE (2 bars). An original landing page for a fictional product ("Orbit One" headphones,
// orbit.example) in a floating browser window over a soft cloud plate. Bar 1: the hero builds, the product leans
// toward the cursor, then a drag spins it. Bar 2 (the wow, on the downbeat): "Finishes" is clicked, a dark section
// sheet rises under the product while it whips through a full turn and grows; beats 6 and 7 switch its finish.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { clamp, dampedSpring, easeInOutCubic, easeOutCubic, easeOutQuint, invLerp, lerp, reveal, window_ } from '../../lib/anim';
import { CamRig, Env, ThreeStage } from '../../three/stage';
import { F } from '../../styles/typography';
import { BAR_H, BrowserFrame, CloudPlate, Cursor, cursorAt, cursorFollow, type CursorKey } from '../components/BrowserFrame';
import { FINISHES, Headphones, finishColor, useHeadphoneAssets } from '../three/StudioHeadphones';
import { beatAt, V3Tag, type V3Props } from '../lib';

const WIN = { x: 170, y: 84, w: 1440, h: 868 };
const PW = WIN.w, PH = WIN.h - BAR_H;          // page size (content coords)
const PROD: [number, number] = [1010, 400];    // product centre on the page
const UPP = 0.00489;                           // world units per page px at the product's depth
const INK = '#14151C', MUTE = '#5C6070';

// cursor in page coords
const CUR: CursorKey[] = [[0, 1330, 760], [14, 1080, 470], [29, 1090, 440], [30, 1090, 440], [42, 820, 470], [44, 820, 470], [57, 708, 42], [62, 708, 42],
  [73, 252, 668], [77, 252, 668], [88, 382, 668], [92, 382, 668], [103, 1010, 530], [106, 1010, 530], [119, 1230, 548]];
const CLICKS = [60, 75, 90];
const DRAGS: [number, number][] = [[30, 43], [105, 119]];

const Scene3D: React.FC<{ f: number; finish: number; glow: number; yaw: number; pitch: number; scale: number; dx: number; dy: number; spark: number }> = ({ f, finish, glow, yaw, pitch, scale, dx, dy, spark }) => {
  const A = useHeadphoneAssets();
  const bob = 0.05 * Math.sin((f / 30) * Math.PI);
  return (
    <>
      <CamRig pos={[0, 0, 7.4]} target={[0, 0, 0]} fov={30} shiftX={(PROD[0] - PW / 2) / PW} viewOffsetY={(PROD[1] - PH / 2) / PH} />
      <Env intensity={1.05} />
      <directionalLight position={[-4, 5, 6]} intensity={2.2} color="#FFF4EA" />
      <directionalLight position={[5, 2, -4]} intensity={2.6} color="#C9D6FF" />
      <ambientLight intensity={0.25} />
      <group position={[dx * UPP, -dy * UPP + bob, 0]} scale={[scale, scale, scale]} rotation={[pitch, yaw, 0.04 * Math.sin(f / 40)]}>
        <Headphones A={A} finish={finish} glow={glow} spark={spark} />
      </group>
    </>
  );
};

const Btn: React.FC<{ dark?: boolean; children: React.ReactNode; hover?: number; style?: React.CSSProperties }> = ({ dark, children, hover = 0, style }) => (
  <div style={{ height: 60, padding: '0 30px', borderRadius: 30, display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: F.text, fontWeight: 600, fontSize: 22,
    background: dark ? INK : 'rgba(20,21,28,0.06)', color: dark ? '#fff' : INK, transform: `scale(${1 + 0.04 * hover})`, ...style }}>{children}</div>
);

export const Website3D: React.FC<V3Props> = () => {
  const f = useCurrentFrame();
  const b = beatAt(f);
  const [cx, cy] = cursorAt(f, CUR);
  const [fx, fy] = cursorFollow(f, CUR, 7);

  // window entry + float
  const enter = easeOutCubic(invLerp(0, 16, f));
  const winT = `translateY(${(1 - enter) * 46 + 5 * Math.sin((f / 30) * Math.PI * 0.5)}px) scale(${0.965 + 0.035 * enter}) perspective(2400px) rotateX(${(1 - enter) * 6}deg)`;

  // section 2 sheet (starts on the bar)
  const sheet = easeOutQuint(invLerp(60, 71, f));
  const heroOut = easeInOutCubic(invLerp(60, 70, f));
  const finish = f < 75 ? 0 : f < 90 ? easeOutCubic(invLerp(75, 83, f)) : 1 + easeOutCubic(invLerp(90, 98, f));
  const fIdx = f < 75 ? 0 : f < 90 ? 1 : 2;

  // product motion: hover lean toward the cursor, drag spins, a full whip turn on the bar
  const hover = window_(f, 8, 58, 8);
  const lean = clamp((fx - PROD[0]) / 520, -1, 1), leanY = clamp((fy - PROD[1]) / 420, -1, 1);
  const spin = 2.5 * easeOutCubic(invLerp(30, 52, f)) + Math.PI * 2 * easeOutCubic(invLerp(60, 88, f)) - 0.9 * easeOutCubic(invLerp(105, 124, f));
  const yaw = -0.72 + 0.0035 * f + spin + 0.42 * lean * hover;
  const pitch = 0.1 + 0.2 * leanY * hover - 0.06 * window_(f, 60, 84, 8);
  const grow = f < 60 ? 1 : 1 + 0.1 * dampedSpring((f - 60) / 30, 9, 0.45);
  const shift = easeInOutCubic(invLerp(60, 76, f));
  const dx = lerp(0, -10, shift), dy = lerp(0, -14, shift);
  const glow = 0.55 + 0.45 * b.pulse + 0.6 * Math.max(0, 1 - Math.abs(f - 61) / 10) + 0.5 * [75, 90].reduce((a, c) => a + (f >= c ? Math.exp(-(f - c) / 6) : 0), 0);
  const spark = f * 0.16;

  const lastClick = CLICKS.filter((c) => f >= c).pop();
  const press = CLICKS.some((c) => f >= c - 2 && f < c + 2) || DRAGS.some(([a, z]) => f >= a && f < z) ? 1 : 0;
  const grabbing = DRAGS.some(([a, z]) => f >= a - 3 && f < z + 2) || (f >= 14 && f < 29);
  const halo = finishColor(finish, 'halo').getStyle();
  const flash = Math.max(0, 1 - Math.abs(f - 62) / 9);

  // headline mask-up reveal
  const line = (i: number, at = 0) => { const k = easeOutCubic(invLerp(at + i * 4, at + 14 + i * 4, f)); return { transform: `translateY(${(1 - k) * 110}%)`, display: 'block' as const }; };
  const fade = (a: number, d = 10) => ({ opacity: reveal(f, a, d), transform: `translateY(${(1 - reveal(f, a, d)) * 18}px)` });

  const ringPath = (front: boolean) => {
    const rx = 430 * grow, ry = 108 * grow, cxr = PROD[0] + dx, cyr = PROD[1] + dy + 40;
    const a0 = front ? 0 : Math.PI, pts = Array.from({ length: 49 }, (_, i) => { const a = a0 + (i / 48) * Math.PI; return `${cxr + rx * Math.cos(a)},${cyr + ry * Math.sin(a)}`; });
    return pts.join(' ');
  };
  const dotA = f * 0.07 + 0.6, dotFront = Math.sin(dotA) > 0;
  const dot = [PROD[0] + dx + 430 * grow * Math.cos(dotA), PROD[1] + dy + 40 + 108 * grow * Math.sin(dotA)];
  const ringCol = `rgba(${lerp(110, 255, sheet)},${lerp(100, 255, sheet)},${lerp(190, 255, sheet)},${lerp(0.45, 0.28, sheet)})`;
  const Ring: React.FC<{ front: boolean }> = ({ front }) => (
    <svg width={PW} height={PH} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', transform: `rotate(-9deg)`, transformOrigin: `${PROD[0]}px ${PROD[1] + 40}px` }}>
      <polyline points={ringPath(front)} fill="none" stroke={ringCol} strokeWidth={2.2} />
      {dotFront === front && <circle cx={dot[0]} cy={dot[1]} r={7} fill={sheet > 0.5 ? halo : '#6B5CFF'} style={{ filter: `drop-shadow(0 0 8px ${sheet > 0.5 ? halo : '#8C7DFF'})` }} />}
    </svg>
  );

  const navDark = sheet > 0.92;
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <CloudPlate f={f} tone="morning" seed={11} />
      <BrowserFrame x={WIN.x} y={WIN.y} w={WIN.w} h={WIN.h} url="orbit.example" path="/one" transform={winT} load={reveal(f, 0, 12)}>
        {/* ---------------- hero section */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #F7F6F4 0%, #F1EFF2 100%)' }}>
          <div style={{ position: 'absolute', left: PROD[0] - 520, top: PROD[1] - 430, width: 1040, height: 860, borderRadius: '50%',
            background: 'radial-gradient(closest-side, rgba(196,186,255,0.75) 0%, rgba(255,214,196,0.55) 45%, rgba(255,230,220,0) 100%)', transform: `scale(${1 + 0.03 * b.pulse})` }} />
          <div style={{ position: 'absolute', left: PROD[0] - 250, top: PROD[1] + 300, width: 500, height: 60, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(40,30,70,0.28), rgba(40,30,70,0))' }} />
          <div style={{ position: 'absolute', left: 90, top: 120, transform: `translateY(${-200 * heroOut}px)`, opacity: 1 - heroOut }}>
            <div style={{ fontFamily: F.mono, fontSize: 19, letterSpacing: '0.18em', color: '#6B5CFF', fontWeight: 600, ...fade(0, 8) }}>ORBIT ONE · WIRELESS</div>
            <div style={{ fontFamily: F.text, fontWeight: 600, fontSize: 118, lineHeight: 0.98, letterSpacing: '-0.045em', color: INK, marginTop: 22 }}>
              <span style={{ display: 'block', overflow: 'hidden', paddingBottom: 6 }}><span style={line(0)}>Sound,</span></span>
              <span style={{ display: 'block', overflow: 'hidden', paddingBottom: 10 }}><span style={line(1)}>suspended.</span></span>
            </div>
            <div style={{ width: 520, marginTop: 30, fontFamily: F.text, fontSize: 27, lineHeight: 1.38, color: MUTE, ...fade(12) }}>Hand-polished alloy, glass-ring drivers and a quiet that follows you around.</div>
            <div style={{ display: 'flex', gap: 18, marginTop: 40, alignItems: 'center', ...fade(18) }}>
              <Btn dark>Pre-order</Btn>
              <Btn>Watch the film <svg width={16} height={16} viewBox="0 0 16 16"><path d="M4 2 L13 8 L4 14 Z" fill={INK} /></svg></Btn>
            </div>
          </div>
          <div style={{ position: 'absolute', left: 90, top: 712, display: 'flex', gap: 14, transform: `translateY(${-200 * heroOut + (1 - reveal(f, 24, 10)) * 18}px)`, opacity: (1 - heroOut) * reveal(f, 24, 10) }}>
            {['Alloy band', 'Glass-ring drivers', 'Spatial mode'].map((t) => (
              <div key={t} style={{ padding: '12px 20px', borderRadius: 24, background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(20,21,28,0.08)', display: 'flex', gap: 10, alignItems: 'center',
                fontFamily: F.text, fontSize: 20, fontWeight: 500, color: INK }}><span style={{ width: 9, height: 9, borderRadius: 5, background: '#6B5CFF' }} />{t}</div>
            ))}
          </div>
        </div>
        {/* ---------------- finishes section: a dark sheet rising under the product */}
        {sheet > 0 && (
          <div style={{ position: 'absolute', left: 0, top: PH * (1 - sheet), width: PW, height: PH, borderRadius: `${(1 - sheet) * 60}px ${(1 - sheet) * 60}px 0 0`, overflow: 'hidden',
            background: 'linear-gradient(180deg, #17151F 0%, #0E0D14 100%)' }}>
            <div style={{ position: 'absolute', left: PROD[0] - 560, top: PROD[1] - 460 + PH * 0, width: 1120, height: 920, borderRadius: '50%', opacity: 0.55 + 0.35 * flash,
              background: `radial-gradient(closest-side, ${halo} 0%, rgba(0,0,0,0) 70%)`, transform: `scale(${1 + 0.2 * flash + 0.03 * b.pulse})` }} />
            <div style={{ position: 'absolute', left: 90, top: 126 }}>
              <div style={{ fontFamily: F.mono, fontSize: 19, letterSpacing: '0.18em', color: '#FFB48C', fontWeight: 600, opacity: reveal(f, 64, 8) }}>FINISHES</div>
              <div style={{ fontFamily: F.text, fontWeight: 600, fontSize: 112, lineHeight: 1.02, letterSpacing: '-0.045em', color: '#F6F4FA', marginTop: 22 }}>
                <span style={{ display: 'block', overflow: 'hidden', paddingBottom: 6 }}><span style={line(0, 63)}>Pick your</span></span>
                <span style={{ display: 'block', overflow: 'hidden', paddingBottom: 10 }}><span style={line(1, 63)}>light.</span></span>
              </div>
              <div style={{ marginTop: 34, height: 40, position: 'relative', fontFamily: F.text, fontSize: 30, color: '#B9B6C8', opacity: reveal(f, 70, 8) }}>
                Finish&nbsp;&nbsp;
                {FINISHES.map((x, i) => (
                  <span key={x.name} style={{ position: 'absolute', left: 104, top: 0, color: '#FFFFFF', fontWeight: 600,
                    opacity: i === fIdx ? reveal(f, i === 0 ? 70 : i === 1 ? 75 : 90, 6) : 0, transform: `translateY(${i === fIdx ? (1 - reveal(f, i === 0 ? 70 : i === 1 ? 75 : 90, 6)) * 16 : 0}px)` }}>{x.name}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 66, marginTop: 70 }}>
                {FINISHES.map((x, i) => {
                  const on = i === fIdx, k = reveal(f, 66 + i * 3, 8);
                  return (
                    <div key={x.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: k, transform: `translateY(${(1 - k) * 20}px)` }}>
                      <div style={{ width: 64, height: 64, borderRadius: 32, background: x.swatch, boxShadow: on ? `0 0 0 4px #0E0D14, 0 0 0 7px ${x.halo}, 0 0 26px ${x.halo}` : '0 0 0 1px rgba(255,255,255,0.2)' }} />
                      <div style={{ fontFamily: F.text, fontSize: 20, color: on ? '#fff' : '#8C8A9C', fontWeight: on ? 600 : 500 }}>{x.name}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 56, fontFamily: F.text, fontSize: 24, color: '#8C8A9C', opacity: reveal(f, 78, 10) }}>Each ring glows to match its finish.</div>
            </div>
          </div>
        )}
        {/* ---------------- product (above both sections), orbit ring split behind / in front */}
        <Ring front={false} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <ThreeStage width={PW} height={PH} exposure={1.0}>
            <Scene3D f={f} finish={finish} glow={glow} yaw={yaw} pitch={pitch} scale={grow} dx={dx} dy={dy} spark={spark} />
          </ThreeStage>
        </div>
        <Ring front />
        {/* ---------------- sticky nav */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: PW, height: 84, display: 'flex', alignItems: 'center', padding: '0 90px', boxSizing: 'border-box',
          background: navDark ? 'rgba(14,13,20,0.7)' : 'rgba(247,246,244,0.0)', borderBottom: navDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(20,21,28,0.0)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width={30} height={30} viewBox="0 0 30 30"><ellipse cx={15} cy={15} rx={13} ry={5.5} fill="none" stroke={navDark ? '#fff' : INK} strokeWidth={2} transform="rotate(-20 15 15)" /><circle cx={15} cy={15} r={5} fill={navDark ? '#fff' : INK} /></svg>
            <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 25, letterSpacing: '0.2em', color: navDark ? '#fff' : INK }}>ORBIT</span>
          </div>
          <div style={{ display: 'flex', gap: 40, marginLeft: 150 }}>
            {['Sound', 'Design', 'Finishes', 'Specs'].map((t) => {
              const active = t === 'Finishes' && f >= 60;
              return <span key={t} style={{ fontFamily: F.text, fontSize: 21, fontWeight: active ? 600 : 500, color: navDark ? (active ? '#fff' : '#9C99AC') : active ? INK : MUTE,
                borderBottom: `2px solid ${active ? (navDark ? '#FFB48C' : INK) : 'transparent'}`, paddingBottom: 4 }}>{t}</span>;
            })}
          </div>
          <div style={{ marginLeft: 'auto' }}><Btn dark={!navDark} style={{ height: 48, fontSize: 19, background: navDark ? '#fff' : INK, color: navDark ? INK : '#fff' }}>Pre-order</Btn></div>
        </div>
        {/* hint chip + cursor (page coords) */}
        {(() => { const k = window_(f, 16, 32, 5); return k > 0 ? (
          <div style={{ position: 'absolute', left: cx + 30, top: cy + 34, opacity: k, transform: `scale(${0.9 + 0.1 * k})`, padding: '10px 16px', borderRadius: 20, background: 'rgba(20,21,28,0.82)',
            fontFamily: F.text, fontSize: 19, fontWeight: 600, color: '#fff', whiteSpace: 'pre', zIndex: 70 }}>Drag to turn  ↔</div>) : null; })()}
        <Cursor x={cx} y={cy} press={press} clickAge={lastClick !== undefined ? f - lastClick : -1} grab={grabbing} dark={f < 63} />
      </BrowserFrame>
      <V3Tag label="WEB · 3D WEBSITE" dark />
    </AbsoluteFill>
  );
};
