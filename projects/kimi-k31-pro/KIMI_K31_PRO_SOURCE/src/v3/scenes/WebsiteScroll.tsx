// V3 · WEB · 3D SCROLL ANIMATION (2 bars). A scroll-driven story site for a fictional product ("Atlas One", a pocket
// observatory; atlas.example) in a floating dark browser window over a golden cloud plate. The page scrolls in wheel
// bursts on the beat and the scroll position drives the 3D object: folded (hero) -> wings unfold (beat 2) -> the wow on
// bar 2: it bursts into its layers with callouts -> snaps back together on beat 6 and wakes up ("first light").
// Parallax: stars 0.18x, planet limb 0.07x, outlined section numbers 1.25x. All copy is fictional sample copy.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { clamp, dampedSpring, easeInCubic, easeInOutCubic, easeOutCubic, invLerp, keys, reveal } from '../../lib/anim';
import { mulberry32 } from '../../lib/rng';
import { CamRig, Env, ThreeStage, orbit, project, type V3 } from '../../three/stage';
import { F } from '../../styles/typography';
import { BAR_H, BrowserFrame, CloudPlate, Cursor, cursorAt, type CursorKey } from '../components/BrowserFrame';
import { SAT_ANCHORS, Satellite, useSatelliteAssets } from '../three/StudioSatellite';
import { beatAt, V3Tag, type V3Props } from '../lib';

const WIN = { x: 170, y: 84, w: 1440, h: 868 };
const PW = WIN.w, PH = WIN.h - BAR_H;
const D2R = Math.PI / 180;
const AMBER = '#FF9A4D', TXT = '#F3EFE9', MUTE = '#A29DAE';
const OBJ: [number, number] = [1010, 430];

/** page scroll in sections: wheel bursts that land on the beat grid */
const SCROLL: [number, number][] = [[0, 0], [12, 0], [30, 1], [45, 1.07], [60, 2], [78, 2.08], [90, 3], [120, 3.07]];
export const scrollAt = (f: number) => keys(f, SCROLL, easeInOutCubic);

const STARS = (() => { const r = mulberry32(31); return Array.from({ length: 150 }, () => [r() * PW, r() * PH * 1.6, 0.6 + r() * 1.6, r()]); })();

const SECTIONS = [
  { k: 'ATLAS ONE · FIELD SERIES', h: ['A whole', 'observatory,', 'folded.'], b: 'A pocket-sized orbital camera, told in four scrolls.' },
  { k: '02 — DEPLOY', h: ['Unfolds', 'on cue.'], b: 'Two wings open in one quiet, unhurried motion.' },
  { k: '03 — ANATOMY', h: ['Every layer,', 'considered.'], b: 'Optics, core, power and wings, each made to come apart.' },
  { k: '04 — FIRST LIGHT', h: ['Ready for', 'first light.'], b: 'Join the list for launch-day field notes.' },
];
const CALLOUTS: { key: keyof ReturnType<typeof SAT_ANCHORS>; t: string; s: string; at: number }[] = [
  { key: 'optics', t: 'OPTICS', s: 'folded refractor', at: 62 },
  { key: 'core', t: 'CORE', s: 'gold-foil shell', at: 65 },
  { key: 'wings', t: 'WINGS', s: 'accordion panels', at: 68 },
  { key: 'power', t: 'POWER', s: 'hex power cell', at: 71 },
];

function camAt(f: number, s: number) {
  const yaw = (keys(s, [[0, 34], [1, 16], [2, 24], [3, 30]]) + f * 0.2) * D2R;
  const pitch = keys(s, [[0, 15], [1, 9], [2, 12], [3, 8]]) * D2R;
  const dist = keys(s, [[0, 7.9], [1, 12.0], [2, 12.6], [3, 11.6]]);
  const target: V3 = [0, keys(s, [[0, 0.36], [1, 0.1], [2, 0.3], [3, 0.12]]), 0];
  return { pos: orbit(target, dist, yaw, pitch), target, fov: 30, shiftX: (OBJ[0] - PW / 2) / PW, viewOffsetY: (OBJ[1] - PH / 2) / PH };
}

const Scene3D: React.FC<{ f: number; cam: ReturnType<typeof camAt>; unfold: number; explode: number; light: number; pulse: number }> = ({ f, cam, unfold, explode, light, pulse }) => {
  const A = useSatelliteAssets();
  return (
    <>
      <CamRig pos={cam.pos} target={cam.target} fov={cam.fov} shiftX={cam.shiftX} viewOffsetY={cam.viewOffsetY} />
      <Env intensity={0.75} />
      <directionalLight position={[4, -2.5, 5]} intensity={3.2} color="#FFB27A" />
      <directionalLight position={[-5, 6, 2]} intensity={1.6} color="#BFD0FF" />
      <directionalLight position={[0, 3, -6]} intensity={2.2} color="#FFD9B8" />
      <ambientLight intensity={0.18} />
      <group position={[0, 0.04 * Math.sin((f / 30) * Math.PI * 0.7), 0]} rotation={[0.06 * Math.sin(f / 33), 0, 0.05 * Math.sin(f / 41)]}>
        <Satellite A={A} unfold={unfold} explode={explode} light={light} pulse={pulse} />
      </group>
    </>
  );
};

export const WebsiteScroll: React.FC<V3Props> = () => {
  const f = useCurrentFrame();
  const b = beatAt(f);
  const s = scrollAt(f), sp = s * PH;
  const vel = (scrollAt(f + 1) - scrollAt(f - 1)) / 2;

  // 3D story driven by the scroll (the burst kicks on the bar)
  const unfold = clamp(invLerp(0.12, 0.96, s));
  const pre = 0.1 * easeInCubic(invLerp(48, 60, f));
  const pop = f >= 60 ? dampedSpring((f - 60) / 30, 20, 0.45) : 0;
  const back = easeInOutCubic(invLerp(80, 90, f));
  const bounce = f >= 90 ? -0.07 * Math.sin(((f - 90) / 7) * Math.PI) * Math.exp(-(f - 90) / 7) : 0;
  const explode = (f < 60 ? pre : (0.1 + 0.9 * pop) * (1 - back)) + bounce;
  const light = reveal(f, 90, 10);
  const cam = camAt(f, s);

  // cursor (page coords): parked over the page while the wheel turns, then to the CTA on beat 7
  const ctaY = 3 * PH - scrollAt(104) * PH + 150 + 300;
  const CUR: CursorKey[] = [[0, 930, 700], [10, 840, 600], [90, 846, 612], [103, 205, ctaY], [110, 205, ctaY], [120, 250, ctaY - 26]];
  const [cx0, cy0] = cursorAt(f, CUR);
  const tick = vel > 0.004 ? Math.sin(f * 1.6) * 2 : 0;
  const cx = cx0, cy = cy0 + tick;
  const wheel = clamp(vel * 30);
  const clickAge = f >= 105 ? f - 105 : -1;

  // callouts
  const anchors = SAT_ANCHORS(Math.max(0, explode));
  const calloutsOn = 1 - easeInOutCubic(invLerp(79, 86, f));
  // fixed label slots on the left, above and below the wing line
  const SLOT: Record<string, number> = { optics: 200, wings: 296, core: 560, power: 672 };
  const pts = CALLOUTS.map((c) => { const [ax, ay] = project(anchors[c.key], cam, PW, PH); return { ...c, ax, ay, y: SLOT[c.key] }; });

  const planetTop = 690 - sp * 0.07;
  const dawn = clamp(0.35 + 0.65 * light + 0.1 * b.pulse * light);
  const enter = easeOutCubic(invLerp(0, 16, f));
  const winT = `translateY(${(1 - enter) * 46 + 5 * Math.sin((f / 30) * Math.PI * 0.5 + 1)}px) scale(${0.965 + 0.035 * enter}) perspective(2400px) rotateX(${(1 - enter) * 6}deg)`;
  const ring = f >= 90 ? easeOutCubic(invLerp(90, 112, f)) : 0;
  const [ox, oy] = project([0, 1.55, 0], cam, PW, PH);

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <CloudPlate f={f} tone="golden" seed={23} />
      <BrowserFrame x={WIN.x} y={WIN.y} w={WIN.w} h={WIN.h} url="atlas.example" path="/one" theme="dark" transform={winT} load={reveal(f, 0, 12)}>
        {/* ---------------- parallax backdrop */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 70% 20%, #1A1522 0%, #0B0A10 70%)' }} />
        <svg width={PW} height={PH} style={{ position: 'absolute', inset: 0 }}>
          {STARS.map(([x, y, r, k], i) => {
            const yy = ((y - sp * 0.18) % (PH * 1.6) + PH * 1.6) % (PH * 1.6);
            return yy < PH ? <circle key={i} cx={x} cy={yy} r={r} fill="#F4E9DD" opacity={0.25 + 0.45 * Math.abs(Math.sin(f / 14 + k * 9))} /> : null;
          })}
        </svg>
        <div style={{ position: 'absolute', left: PW * 0.64 - 1500, top: planetTop - 170, width: 3000, height: 520, borderRadius: '50%',
          background: `radial-gradient(closest-side, rgba(255,150,90,${0.45 * dawn}) 0%, rgba(220,80,110,${0.25 * dawn}) 40%, rgba(120,40,90,0) 100%)`, filter: 'blur(6px)' }} />
        <div style={{ position: 'absolute', left: PW * 0.64 - 1700, top: planetTop, width: 3400, height: 3400, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 0%, #2A1A26 0%, #120D16 18%, #08070B 40%)',
          boxShadow: `0 -6px 26px rgba(255,190,130,${0.6 * dawn}), inset 0 10px 22px rgba(255,160,100,${0.65 * dawn})` }} />
        {/* outlined section numbers (1.25x) */}
        {SECTIONS.map((_, i) => (
          <div key={i} style={{ position: 'absolute', left: 52, top: i * PH * 1.25 - sp * 1.25 + 70, fontFamily: F.display, fontWeight: 800, fontSize: 300, lineHeight: 1,
            color: 'transparent', WebkitTextStroke: '2px rgba(255,214,180,0.09)', letterSpacing: '-0.04em' }}>{`0${i + 1}`}</div>
        ))}
        {/* ---------------- sections (1x) */}
        {SECTIONS.map((sec, i) => {
          const d = i - s, top = i * PH - sp + 150, o = clamp(1 - Math.abs(d) * 1.6);
          if (o <= 0) return null;
          return (
            <div key={i} style={{ position: 'absolute', left: 90, top, width: 640, opacity: i === 0 ? Math.min(o, 1) : o }}>
              <div style={{ fontFamily: F.mono, fontSize: 19, fontWeight: 600, letterSpacing: '0.16em', color: AMBER }}>{sec.k}</div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: i === 0 ? 62 : 64, lineHeight: 1.08, color: TXT, marginTop: 22, letterSpacing: '-0.01em' }}>
                {sec.h.map((l, j) => {
                  const k = i === 0 ? easeOutCubic(invLerp(-4 + j * 3, 8 + j * 3, f)) : clamp(1 - Math.abs(d) * 2.2 + 0.0);
                  return <span key={j} style={{ display: 'block', overflow: 'hidden', paddingBottom: 8 }}><span style={{ display: 'block', transform: `translateY(${(1 - k) * 105}%)` }}>{l}</span></span>;
                })}
              </div>
              <div style={{ marginTop: 26, width: 470, fontFamily: F.text, fontSize: 26, lineHeight: 1.4, color: MUTE }}>{sec.b}</div>
              {i === 0 && (
                <div style={{ marginTop: 56, display: 'flex', alignItems: 'center', gap: 14, opacity: 1 - clamp(s * 3) }}>
                  <div style={{ width: 28, height: 44, borderRadius: 14, border: '2px solid rgba(243,239,233,0.6)', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 11, top: 8 + 10 * ((f / 18) % 1), width: 4, height: 9, borderRadius: 2, background: AMBER, opacity: 1 - ((f / 18) % 1) }} />
                  </div>
                  <span style={{ fontFamily: F.text, fontSize: 21, color: MUTE }}>Scroll to explore</span>
                </div>
              )}
              {i === 3 && (
                <div style={{ marginTop: 40, display: 'flex', gap: 16 }}>
                  <div style={{ height: 60, padding: '0 30px', borderRadius: 30, background: AMBER, color: '#1A0F08', display: 'flex', alignItems: 'center', fontFamily: F.text, fontWeight: 700, fontSize: 22,
                    transform: `scale(${clickAge >= 0 && clickAge < 6 ? 0.95 : 1})`, boxShadow: clickAge >= 0 ? `0 0 ${30 * Math.exp(-clickAge / 8)}px ${AMBER}` : undefined }}>Join the waitlist</div>
                  <div style={{ height: 60, padding: '0 26px', borderRadius: 30, border: '1px solid rgba(243,239,233,0.25)', color: TXT, display: 'flex', alignItems: 'center', fontFamily: F.text, fontWeight: 600, fontSize: 22 }}>Read field notes</div>
                </div>
              )}
              {i === 3 && <div style={{ marginTop: 26, fontFamily: F.mono, fontSize: 15, letterSpacing: '0.08em', color: 'rgba(162,157,174,0.75)' }}>FICTIONAL PRODUCT · SAMPLE COPY</div>}
            </div>
          );
        })}
        {/* ---------------- sticky 3D stage */}
        {ring > 0 && ring < 1 && (
          <div style={{ position: 'absolute', left: ox - 420 * ring, top: oy - 420 * ring, width: 840 * ring, height: 840 * ring, borderRadius: '50%',
            border: `2px solid rgba(255,170,110,${0.8 * (1 - ring)})`, boxShadow: `0 0 40px rgba(255,150,90,${0.5 * (1 - ring)})` }} />
        )}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <ThreeStage width={PW} height={PH} exposure={1.05}>
            <Scene3D f={f} cam={cam} unfold={unfold} explode={explode} light={light} pulse={b.pulse} />
          </ThreeStage>
        </div>
        {/* ---------------- explode callouts */}
        {calloutsOn > 0 && f >= 60 && (
          <svg width={PW} height={PH} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {pts.map((p) => {
              const k = easeOutCubic(invLerp(p.at, p.at + 8, f)) * calloutsOn, lx = 822, mx = 862;
              const ex = mx + (p.ax - mx) * k, ey = p.y + (p.ay - p.y) * k;
              return k > 0 ? (
                <g key={p.key} opacity={k}>
                  <polyline points={`${lx},${p.y} ${mx},${p.y} ${ex},${ey}`} fill="none" stroke="rgba(255,190,140,0.8)" strokeWidth={1.8} />
                  <circle cx={p.ax} cy={p.ay} r={6 * k} fill={AMBER} />
                  <circle cx={p.ax} cy={p.ay} r={13 * k} fill="none" stroke="rgba(255,154,77,0.5)" strokeWidth={1.5} />
                </g>
              ) : null;
            })}
          </svg>
        )}
        {calloutsOn > 0 && f >= 60 && pts.map((p) => {
          const k = easeOutCubic(invLerp(p.at, p.at + 8, f)) * calloutsOn;
          return k > 0 ? (
            <div key={p.key} style={{ position: 'absolute', left: 620, top: p.y - 26, width: 190, textAlign: 'right', opacity: k, transform: `translateX(${(1 - k) * -20}px)` }}>
              <div style={{ fontFamily: F.mono, fontSize: 20, fontWeight: 700, letterSpacing: '0.14em', color: TXT }}>{p.t}</div>
              <div style={{ fontFamily: F.text, fontSize: 19, color: MUTE, marginTop: 4 }}>{p.s}</div>
            </div>
          ) : null;
        })}
        {/* ---------------- progress bar (sticky, under the text column) + scrollbar */}
        <div style={{ position: 'absolute', left: 90, top: 736, width: 600, height: 2, background: 'rgba(243,239,233,0.14)' }}>
          <div style={{ width: 600 * (s / 3), height: 2, background: AMBER }} />
        </div>
        {['Fold', 'Deploy', 'Anatomy', 'First light'].map((t, i) => {
          const on = s >= i - 0.5, cur = Math.round(s) === i;
          return (
            <div key={t} style={{ position: 'absolute', left: 90 + i * 200 - 7, top: 729, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ width: 12, height: 12, borderRadius: 7, background: on ? AMBER : '#0B0A10', border: `2px solid ${on ? AMBER : 'rgba(243,239,233,0.3)'}`, boxShadow: cur ? `0 0 ${12 + 8 * b.pulse}px ${AMBER}` : undefined }} />
              <span style={{ fontFamily: F.mono, fontSize: 17, fontWeight: 600, letterSpacing: '0.06em', color: cur ? TXT : 'rgba(162,157,174,0.65)', whiteSpace: 'pre' }}>{`0${i + 1} ${t}`}</span>
            </div>
          );
        })}
        <div style={{ position: 'absolute', left: PW - 12, top: 8 + (s / 3.07) * (PH - 16 - 190), width: 6, height: 190, borderRadius: 3, background: 'rgba(243,239,233,0.28)' }} />
        {/* ---------------- sticky nav */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: PW, height: 80, display: 'flex', alignItems: 'center', padding: '0 90px', boxSizing: 'border-box',
          background: 'linear-gradient(180deg, rgba(11,10,16,0.85), rgba(11,10,16,0))' }}>
          <svg width={28} height={28} viewBox="0 0 28 28"><circle cx={14} cy={14} r={11} fill="none" stroke={TXT} strokeWidth={2} /><ellipse cx={14} cy={14} rx={5} ry={11} fill="none" stroke={TXT} strokeWidth={1.6} /><path d="M3 14 H25" stroke={TXT} strokeWidth={1.6} /></svg>
          <span style={{ marginLeft: 12, fontFamily: F.display, fontWeight: 700, fontSize: 24, letterSpacing: '0.24em', color: TXT }}>ATLAS</span>
          <div style={{ display: 'flex', gap: 40, marginLeft: 150 }}>
            {['Mission', 'Craft', 'Field notes'].map((t) => <span key={t} style={{ fontFamily: F.text, fontSize: 21, fontWeight: 500, color: MUTE }}>{t}</span>)}
          </div>
          <div style={{ marginLeft: 'auto', height: 46, padding: '0 24px', borderRadius: 23, border: `1.5px solid ${AMBER}`, color: AMBER, display: 'flex', alignItems: 'center', fontFamily: F.text, fontWeight: 600, fontSize: 19 }}>Waitlist</div>
        </div>
        {/* ---------------- cursor + wheel indicator */}
        {wheel > 0.02 && (
          <div style={{ position: 'absolute', left: cx + 30, top: cy + 30, opacity: wheel, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 18, background: 'rgba(243,239,233,0.12)', border: '1px solid rgba(243,239,233,0.18)', zIndex: 70 }}>
            <div style={{ width: 16, height: 26, borderRadius: 8, border: `2px solid ${TXT}`, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 5, top: 4 + 8 * ((f / 6) % 1), width: 3, height: 6, borderRadius: 2, background: AMBER }} />
            </div>
            <svg width={18} height={26} viewBox="0 0 18 26">{[0, 1].map((k) => <path key={k} d={`M3 ${6 + k * 8 + 3 * ((f / 6) % 1)} L9 ${12 + k * 8 + 3 * ((f / 6) % 1)} L15 ${6 + k * 8 + 3 * ((f / 6) % 1)}`} fill="none" stroke={TXT} strokeWidth={2} strokeLinecap="round" opacity={0.5 + 0.5 * k} />)}</svg>
          </div>
        )}
        <Cursor x={cx} y={cy} clickAge={clickAge} press={f >= 103 && f < 107 ? 1 : 0} />
      </BrowserFrame>
      <V3Tag label="WEB · 3D SCROLL ANIMATION" dark />
    </AbsoluteFill>
  );
};
