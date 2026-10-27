// WEB · INTERACTIVE ART SITE (2 bars). A fictional gallery site, lumen.example, in a generic browser window over a soft
// pastel plate. Its hero is a live flow-field piece (src/v3/three/ArtFlowLines.tsx): ink ribbons that part around the
// pointer like water around a stone.
//   bar 1  f0 cut into the live site, pointer glides through the piece (lines bend around it) · f15 the intro line
//          reveals and the field pulses · f30 hover "Studies": the piece morphs from tide to vortex · f45 hover "Atelier":
//          it morphs to a bloom · f54 click
//   bar 2  f60 (wow) page transition: night floods out from the click, the ink lines turn into light and the artwork
//          expands to fill the window · f63 "Currents" title · f75 / f90 / f105 three study cards rise in, one per beat,
//          while the pointer carves a wake through the full-bleed piece.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { ThreeStage } from '../../three/stage';
import { clamp, criticalSpring, dampedSpring, easeInOutCubic, easeOutCubic, invLerp, keys, lerp, reveal, spline, window_ } from '../../lib/anim';
import { F } from '../../styles/typography';
import { beatAt, V3Props, V3Tag } from '../lib';
import { BrowserWindow, CHROME_H, mixRgb, Pointer, PxCam, toWorld } from '../three/ArtKit';
import { FlowBackdrop, FlowLines } from '../three/ArtFlowLines';

// window + content geometry (frame px)
const WX = 212, WY = 74, WW = 1496, WH = 874;
const CW = WW, CH = WH - CHROME_H;
// page-1 artwork frame (content px)
const HERO = { x: 540, y: 104, w: 906, h: 670, r: 22 };
const MENU = [
  { label: 'Works', x: 520 },
  { label: 'Studies', x: 652 },
  { label: 'Atelier', x: 800 },
  { label: 'Visit', x: 944 },
];
const NAV_Y = 46;
const menuCx = (i: number) => MENU[i].x + [37, 46, 42, 26][i];

const PAL = {
  tide: ['#1C3ED0', '#0E8F86', '#F0A21A', '#1A1433'],
  vortex: ['#E5402A', '#F0A21A', '#7B2FD0', '#1A1433'],
  bloom: ['#E03B74', '#1C3ED0', '#F0A21A', '#0E8F86'],
  night: ['#FF6E5A', '#FFC65A', '#5CE1FF', '#A98BFF'],
};
const CARDS = [
  { title: 'STUDY 04 · TIDE', mode: [1, 0, 0] as [number, number, number], night: ['#5CE1FF', '#7EE3B6', '#A98BFF', '#FFFFFF'], bg: ['#10264A', '#060B1C'] as [string, string], seed: 21 },
  { title: 'STUDY 05 · EMBER', mode: [0, 1, 0] as [number, number, number], night: ['#FF6E5A', '#FFC65A', '#FF9A3D', '#FFE2B0'], bg: ['#3A1424', '#12060C'] as [string, string], seed: 22 },
  { title: 'STUDY 06 · AURORA', mode: [0.3, 0, 0.7] as [number, number, number], night: ['#7EE3B6', '#5CE1FF', '#C58BFF', '#FFC65A'], bg: ['#1A1446', '#07071A'] as [string, string], seed: 23 },
];
const CARD = { y: 566, w: 300, h: 186, x0: 56, gap: 24 };

/** pointer path in content px */
function pointerAt(f: number): [number, number] {
  const glide = [[1290, 640], [1150, 520], [990, 430], [860, 330], [790, 250]];
  if (f <= 24) { const p = spline(glide, f / 24); return [p[0], p[1]]; }
  const end = spline(glide, 1);
  const x = keys(f, [[24, end[0]], [29, menuCx(1)], [39, menuCx(1)], [44, menuCx(2)], [61, menuCx(2)]]);
  const y = keys(f, [[24, end[1]], [29, NAV_Y + 4], [61, NAV_Y + 4]]);
  if (f <= 61) return [x, y];
  const wake = [[menuCx(2), NAV_Y + 4], [1010, 250], [1240, 400], [1150, 560], [1320, 470], [1240, 300]];
  const u = invLerp(61, 124, f);
  const p = spline(wake, 0.45 * u + 0.55 * easeInOutCubic(u));
  return [p[0], p[1]];
}

export const ArtWebsite: React.FC<V3Props> = ({ dur }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const b = beatAt(f);
  void dur;

  // morphs on the hover beats, then the room's own mode after the transition
  const s1 = clamp(dampedSpring((f - 30) / 30, 11, 0.5), 0, 1.12), s2 = clamp(dampedSpring((f - 45) / 30, 11, 0.5), 0, 1.12);
  const s3 = criticalSpring((f - 60) / 30, 6);
  const m0: [number, number, number] = [1 - Math.min(1, s1), Math.min(1, s1) * (1 - Math.min(1, s2)), Math.min(1, s2)];
  const kick = (s1 - Math.min(1, s1)) + (s2 - Math.min(1, s2));                 // overshoot reads as a snap
  const mode: [number, number, number] = [lerp(m0[0], 0.42, s3), lerp(m0[1], 0.12, s3), lerp(m0[2] + kick, 0.46, s3)];
  const pal = f < 45 ? { a: PAL.tide, b: PAL.vortex, m: criticalSpring((f - 30) / 30, 12) } : { a: PAL.vortex, b: PAL.bloom, m: criticalSpring((f - 45) / 30, 12) };
  const preview = f < 30 ? 'WORKS' : f < 45 ? 'STUDIES' : 'ATELIER';

  // page transition: click at 54, night floods from the click, artwork expands 57..69
  const press = window_(f, 52, 57, 2);
  const e = easeInOutCubic(invLerp(57, 69, f));
  const hx = lerp(HERO.x, 0, e), hy = lerp(HERO.y, 0, e), hw = lerp(HERO.w, CW, e), hh = lerp(HERO.h, CH, e), hr = lerp(HERO.r, 0, e);
  const [hcx, hcy] = toWorld(hx + hw / 2, hy + hh / 2, CW, CH);
  const scale = hh / 2;
  const [clx, cly] = toWorld(menuCx(2), NAV_Y, CW, CH);
  const floodR = 1900 * easeInOutCubic(invLerp(55, 68, f));
  const flood: [number, number, number] = [clx, cly, floodR > 0 ? floodR : -1];
  const rim = window_(f, 55, 70, 4) * 0.9;
  const night = easeInOutCubic(invLerp(57, 64, f));

  // pointer: an obstacle in the flow only while it is over the piece
  const [px, py] = pointerAt(f);
  const inset = Math.min(px - hx, hx + hw - px, py - hy, hy + hh - py);
  const curOn = clamp((inset - 10) / 50) * (f > 60 ? reveal(f, 62, 12) : 1);
  const [cwx, cwy] = toWorld(px, py, CW, CH);
  const cursor: [number, number] = [(cwx - hcx) / scale, (cwy - hcy) / scale];
  const center: [number, number] = [lerp(0.15, 0.55, s3), lerp(0.02, -0.05, s3)];
  const pulse = 0.55 * b.pulse + 0.6 * Math.exp(-Math.max(0, f - 30) / 5) * (f >= 30 ? 1 : 0) + 0.6 * Math.exp(-Math.max(0, f - 45) / 5) * (f >= 45 ? 1 : 0);

  // window camera: slow push, a nudge on the bar
  const push = easeInOutCubic(invLerp(0, 120, f));
  const nudge = 0.014 * Math.sin(Math.min(1, Math.max(0, (f - 58) / 14)) * Math.PI);
  const ws = lerp(0.95, 0.995, push) + nudge;
  const ry = lerp(4.5, -2.2, push), rx = lerp(2.2, -0.6, push);
  const ty = lerp(10, -4, push);

  // nav text turns light as the flood passes it
  const inkAt = (x: number) => { const k = clamp((floodR - Math.abs(x - menuCx(2)) - 40) / 80); const c = mixRgb('#17122B', '#EDE8F7', k); return `rgb(${c.map((v) => Math.round(v * 255)).join(',')})`; };
  const navInk = inkAt(1300);
  const hoverIdx = f < 30 ? -1 : f < 45 ? 1 : 2;
  const under = (i: number) => (i === 1 ? window_(f, 30, 45, 4) : i === 2 ? reveal(f, 45, 6) * (1 - reveal(f, 58, 6)) : 0);

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(125deg, #F7E6D8 0%, #EBDDEF 45%, #D7DDF4 72%, #CFE6EC 100%)', overflow: 'hidden' }}>
      {/* soft plate */}
      <div style={{ position: 'absolute', left: -200 + 60 * Math.sin(t * 0.6), top: -260, width: 1100, height: 900, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,214,190,0.85), rgba(255,214,190,0))' }} />
      <div style={{ position: 'absolute', left: 1180 - 50 * Math.sin(t * 0.5), top: 380, width: 1100, height: 900, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(176,196,255,0.75), rgba(176,196,255,0))' }} />
      <div style={{ position: 'absolute', left: 560, top: 820 + 20 * Math.sin(t * 0.7), width: 900, height: 500, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,255,255,0.7), rgba(255,255,255,0))' }} />

      <BrowserWindow x={WX} y={WY} w={WW} h={WH} url={f < 58 ? 'lumen.example' : 'lumen.example/atelier'}
        transform={`translateY(${ty}px) perspective(2600px) rotateY(${ry}deg) rotateX(${rx}deg) scale(${ws})`}>
        <ThreeStage width={CW} height={CH}>
          <PxCam h={CH} />
          <FlowBackdrop t={t} clip={[0, 0, CW, CH, 0]} flood={flood} feather={90} rim={rim} paper={['#EDE5D9', '#E6DCCD']} night={['#1A1242', '#06061A']} />
          <FlowBackdrop t={t} clip={[hcx, hcy, hw, hh, hr]} flood={flood} feather={90} rim={rim} paper={['#FBF7F0', '#F3ECE1']} night={['#1E154C', '#07071C']} renderOrder={1} />
          <FlowLines t={t} count={1900} K={41} step={0.022} seed={7} rect={[hcx, hcy, scale]} clip={[hcx, hcy, hw, hh, hr]}
            mode={mode} center={center} cursor={cursor} cursorR={lerp(0.17, 0.2, s3)} cursorOn={curOn}
            palA={pal.a} palB={pal.b} palMix={pal.m} palNight={PAL.night} flood={flood} feather={90}
            width={lerp(2.2, 2.5, s3)} alpha={0.92} nightAlpha={0.5} pulse={pulse} rim={rim} renderOrder={2} />
          {CARDS.map((c, i) => {
            const at = 69 + 15 * i;   // lands on 75 / 90 / 105
            if (f < at - 1) return null;
            const rise = dampedSpring((f - at) / 30, 12, 0.62);
            const x = CARD.x0 + i * (CARD.w + CARD.gap), y = CARD.y + (1 - rise) * 330;
            const [cx, cy] = toWorld(x + CARD.w / 2, y + CARD.h / 2, CW, CH);
            const clip: [number, number, number, number, number] = [cx, cy, CARD.w, CARD.h, 14];
            return (
              <group key={c.title}>
                <FlowBackdrop t={t} clip={clip} flood={[cx, cy, 9999]} night={c.bg} renderOrder={3 + i * 2} />
                <FlowLines t={t + i * 3} count={380} K={29} step={0.042} seed={c.seed} aspMax={1.7} rect={[cx, cy, CARD.h / 2]} clip={clip}
                  mode={c.mode} center={[0.1, 0]} cursor={[9, 9]} cursorR={0.1} cursorOn={0} palA={c.night} palNight={c.night}
                  flood={[cx, cy, 9999]} width={1.5} nightAlpha={0.7} pulse={b.pulse * 0.5} renderOrder={4 + i * 2} />
              </group>
            );
          })}
        </ThreeStage>

        {/* nav */}
        <div style={{ position: 'absolute', left: 56, top: NAV_Y - 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'conic-gradient(from 200deg, #E5402A, #F0A21A, #1C3ED0, #0E8F86, #E5402A)', transform: `rotate(${t * 40}deg)` }} />
          <span style={{ fontFamily: F.display, fontWeight: 800, fontSize: 30, letterSpacing: '0.16em', color: inkAt(130) }}>LUMEN</span>
        </div>
        {MENU.map((m, i) => (
          <div key={m.label} style={{ position: 'absolute', left: m.x, top: NAV_Y - 18, fontFamily: F.text, fontWeight: 600, fontSize: 27, color: inkAt(menuCx(i)), opacity: hoverIdx === -1 || hoverIdx === i || f > 60 ? 1 : 0.55 }}>
            {m.label}
            <div style={{ position: 'absolute', left: 0, right: 0, top: 38, height: 3, borderRadius: 2, background: i === 1 ? '#E5402A' : '#E03B74', transform: `scaleX(${under(i)})`, transformOrigin: '0 50%' }} />
          </div>
        ))}
        <div style={{ position: 'absolute', left: CW - 92, top: NAV_Y - 22, width: 44, height: 44, borderRadius: 22, border: `2px solid ${navInk}`, opacity: 0.8, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, alignItems: 'center' }}>
          {[0, 1].map((k) => <div key={k} style={{ width: 18, height: 2.5, borderRadius: 2, background: navInk }} />)}
        </div>

        {/* page 1: left column */}
        {f < 66 && (() => {
          const out = easeInOutCubic(invLerp(56, 64, f));
          const tx = -60 * out;
          return (
            <div style={{ position: 'absolute', left: 58 + tx, top: 0, width: 440, height: CH, opacity: 1 - out }}>
              <div style={{ position: 'absolute', top: 206, fontFamily: F.mono, fontWeight: 700, fontSize: 19, letterSpacing: '0.18em', color: '#9A6A4E', opacity: reveal(f, -8, 8) }}>NOW SHOWING · STUDY 07</div>
              {['Light that', 'listens.'].map((w, i) => (
                <div key={w} style={{ position: 'absolute', top: 246 + i * 92, overflow: 'hidden', height: 100 }}>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 80, lineHeight: '96px', color: '#17122B', letterSpacing: '-0.01em',
                    transform: `translateY(${(1 - reveal(f, -14 + i * 2, 12, easeOutCubic)) * 100}%)` }}>{w}</div>
                </div>
              ))}
              <div style={{ position: 'absolute', top: 470, width: 420, fontFamily: F.text, fontSize: 28, lineHeight: 1.42, color: '#4E4760' }}>
                {'Move through the field and it moves around you.'.split(' ').map((w, i) => (
                  <span key={i} style={{ display: 'inline-block', marginRight: 8, opacity: reveal(f, 15 + i * 1.2, 7), transform: `translateY(${(1 - reveal(f, 15 + i * 1.2, 9)) * 14}px)` }}>{w}</span>
                ))}
              </div>
              <div style={{ position: 'absolute', top: 640, display: 'flex', alignItems: 'center', gap: 14, opacity: reveal(f, 20, 10) }}>
                <div style={{ padding: '14px 26px', borderRadius: 30, background: '#17122B', color: '#FBF7F0', fontFamily: F.text, fontWeight: 600, fontSize: 24 }}>Enter the atelier</div>
                <div style={{ fontFamily: F.mono, fontSize: 18, color: '#7A7088', letterSpacing: '0.1em' }}>EST. 2026</div>
              </div>
            </div>
          );
        })()}

        {/* page 1: preview chip inside the artwork */}
        {f < 64 && (
          <div style={{ position: 'absolute', left: HERO.x + 22, top: HERO.y + HERO.h - 64, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderRadius: 24,
            background: 'rgba(251,247,240,0.86)', border: '1px solid rgba(23,18,43,0.12)', opacity: 1 - reveal(f, 56, 6) }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: f < 30 ? '#1C3ED0' : f < 45 ? '#E5402A' : '#E03B74', transform: `scale(${1 + 0.6 * b.pulse})` }} />
            <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 18, letterSpacing: '0.14em', color: '#17122B' }}>PREVIEW · {preview}</span>
          </div>
        )}

        {/* page 2: the room */}
        {f >= 60 && <div style={{ position: 'absolute', inset: 0, opacity: reveal(f, 61, 10), background: 'radial-gradient(ellipse 780px 300px at 440px 300px, rgba(6,6,24,0.62), rgba(6,6,24,0.3) 60%, rgba(6,6,24,0))' }} />}
        {f >= 60 && (
          <div style={{ position: 'absolute', left: 58, top: 0, width: 900, height: CH }}>
            <div style={{ position: 'absolute', top: 150, fontFamily: F.mono, fontWeight: 700, fontSize: 21, letterSpacing: '0.2em', color: '#FFC65A', opacity: reveal(f, 64, 8) }}>ATELIER · ROOM 02</div>
            <div style={{ position: 'absolute', top: 184, overflow: 'hidden', height: 190 }}>
              <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 150, lineHeight: '180px', color: '#F4F0FF', letterSpacing: '-0.02em', textShadow: '0 0 40px rgba(120,90,255,0.45)',
                transform: `translateY(${(1 - reveal(f, 62, 14, easeOutCubic)) * 105}%)` }}>Currents</div>
            </div>
            <div style={{ position: 'absolute', top: 392, fontFamily: F.text, fontWeight: 500, fontSize: 32, color: '#D9D3EE', opacity: reveal(f, 75, 8), transform: `translateY(${(1 - reveal(f, 75, 10)) * 16}px)` }}>
              Every visitor bends the field.
            </div>
            {CARDS.map((c, i) => {
              const at = 69 + 15 * i;   // lands on 75 / 90 / 105
              const rise = dampedSpring((f - at) / 30, 12, 0.62);
              const x = CARD.x0 - 58 + i * (CARD.w + CARD.gap), y = CARD.y + (1 - rise) * 330;
              return f < at - 1 ? null : (
                <div key={c.title} style={{ position: 'absolute', left: x, top: y, width: CARD.w, height: CARD.h, borderRadius: 14, border: '1px solid rgba(255,255,255,0.22)', boxShadow: '0 20px 40px rgba(0,0,0,0.35)', background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(4,4,16,0.7) 100%)' }}>
                  <div style={{ position: 'absolute', left: 14, bottom: 12, fontFamily: F.mono, fontWeight: 700, fontSize: 17, letterSpacing: '0.12em', color: '#F4F0FF', textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>{c.title}</div>
                </div>
              );
            })}
          </div>
        )}

        <Pointer x={px} y={py} press={press} scale={1.15} />
      </BrowserWindow>

      <V3Tag label="WEB · INTERACTIVE ART SITE" dark />
    </AbsoluteFill>
  );
};
