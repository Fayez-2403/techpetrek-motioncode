// WEB · INTERACTIVE STORYTELLING (2 bars). "Saltlight", a fictional scroll-told story site (saltlight.example). The 3D
// world (src/v3/three/ArtStoryWorld.tsx) is the site's sticky canvas; chapter cards scroll over it and the camera follows
// the scroll, like a real scrollytelling page.
//   bar 1  f0 cut on Chapter 1 · The Signal: a lighthouse at dusk, beam sweeping · f15 the chapter text reveals ·
//          f30 the reader scrolls: the card slides away, parallax numerals drift, the camera trucks out over the water ·
//          f45 Chapter 2 · The Crossing: far out, a small boat blinks back three times (f45 / f50 / f55)
//   bar 2  f57-60 (wow) the beam swings into the lens, the flare bursts the browser window open to full-bleed, and the
//          world turns to night · f60 Chapter 3 · The Answer · f75 / f90 a constellation draws itself (a small boat) ·
//          f105 / f110 / f115 its stars blink back three times.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CamRig, project, ThreeStage } from '../../three/stage';
import { clamp, easeInOutCubic, easeInOutSine, easeOutCubic, easeOutExpo, invLerp, lerp, reveal } from '../../lib/anim';
import { F } from '../../styles/typography';
import { beatAt, V3Props, V3Tag } from '../lib';
import { CHROME_H } from '../three/ArtKit';
import { Boat, Glow, LAMP, LIGHTHOUSE, Lighthouse, SkyAndSea, type Vec3 } from '../three/ArtStoryWorld';
import * as THREE from 'three';

const W = 1920, H = 1080;
const WIN = { x: 230, y: 64, w: 1460, h: 900 };
const BLEED = { x: -40, y: -120, w: 2000, h: 1250 };
const OMEGA = 1.1;           // beam rad/s
const FOV = 36;

const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** camera for frame f: dusk scroll path (bar 1), then the night crane (bar 2) */
function camAt(f: number) {
  const t = f / 30;
  if (f < 60) {
    const sp = easeInOutCubic(invLerp(30, 46, f));
    const drift = t * 0.6;
    const pos = lerp3([5.5 - drift * 0.6, 3.3, 15 - drift * 2.2], [17, 2.6, -14 - drift * 1.2], sp);
    pos[1] += sp * (1 - sp) * 2.2;
    const look = lerp3([-12.5, 8.6, -40], [19, 3.4, -100], easeInOutSine(invLerp(31, 47, f)));
    const target = lerp3(look, LAMP, easeInOutCubic(invLerp(50, 59.9, f)));
    return { pos, target, fov: FOV };
  }
  const u = (f - 60) / 60;
  const crane = easeInOutSine(clamp(u));
  const pos: Vec3 = [-26 + 2.0 * u, 1.5 + 0.8 * crane, 8 - 4 * u];
  const target: Vec3 = [-26 + 3.5 * u, lerp(12, 22, crane), -90];
  return { pos, target, fov: FOV + 4 };
}
const boatAt = (f: number): { pos: Vec3; yaw: number } => (f < 60
  ? { pos: [34 - f * 0.045, 0, -100 + f * 0.03], yaw: 2.6 }
  : { pos: [-17 + (f - 60) * 0.02, 0, -94], yaw: 2.9 });

const thetaTo = (p: Vec3) => Math.atan2(-(p[2] - LIGHTHOUSE[2]), p[0] - LIGHTHOUSE[0]);
const THETA0 = thetaTo(camAt(59.9).pos);
const beamAt = (f: number) => (f < 60 ? THETA0 + (OMEGA * (f - 59.9)) / 30 : 0.3 + (0.55 * (f - 60)) / 60);
/** how directly a beam points at the camera (0..1) */
function flareAt(f: number) {
  const th = beamAt(f), c = camAt(f).pos, tc = thetaTo(c);
  const a = Math.max(Math.cos(th - tc), Math.cos(th + Math.PI - tc));
  return Math.pow(Math.max(0, a), 70);
}

/** constellation (a small boat) defined on screen at the f90 pose, unprojected onto the sky */
let CAM90: THREE.PerspectiveCamera | null = null;
// hull A B C D, mast foot M, mast top E, boom end G
const CONST_2D: [number, number][] = [[-1.15, 0.0], [-0.72, 0.42], [0.68, 0.42], [1.2, -0.02], [0.02, -0.02], [0.08, -1.62], [-0.92, -0.2]];
const CONST_LINES: [number, number, number][] = [[0, 1, 0], [1, 2, 0], [2, 3, 0], [3, 0, 0], [4, 5, 1], [5, 6, 1], [6, 4, 1], [5, 3, 1]];
const CONST_DIRS: Vec3[] = (() => {
  const c = camAt(90), cam = new THREE.PerspectiveCamera(c.fov, W / H, 0.05, 2000);
  cam.position.set(...c.pos); cam.lookAt(...c.target); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  CAM90 = cam;
  return CONST_2D.map(([x, y]) => {
    const sx = 1262 + x * 128, sy = 318 + y * 100;
    const v = new THREE.Vector3((sx / W) * 2 - 1, -(sy / H) * 2 + 1, 0.5).unproject(cam).sub(cam.position).normalize();
    return [v.x, v.y, v.z] as Vec3;
  });
})();

/** Milky Way great circle through two screen points at the f90 pose */
const BAND_N: Vec3 = (() => {
  const cam = CAM90!;
  const dir = (sx: number, sy: number) => new THREE.Vector3((sx / W) * 2 - 1, -(sy / H) * 2 + 1, 0.5).unproject(cam).sub(cam.position).normalize();
  const n = new THREE.Vector3().crossVectors(dir(120, 1020), dir(1700, 60)).normalize();
  return [n.x, n.y, n.z];
})();

const Words: React.FC<{ text: string; at: number; f: number; step?: number }> = ({ text, at, f, step = 1.1 }) => (
  <>{text.split(' ').map((w, i) => (
    <span key={i} style={{ display: 'inline-block', marginRight: '0.28em', opacity: reveal(f, at + i * step, 7), transform: `translateY(${(1 - reveal(f, at + i * step, 9)) * 16}px)`, filter: `blur(${(1 - reveal(f, at + i * step, 8)) * 4}px)` }}>{w}</span>
  ))}</>
);

export const StoryWeb: React.FC<V3Props> = ({ dur }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const b = beatAt(f);
  void dur;

  const night = f >= 60 ? 1 : 0;
  const blue = night ? 1 : 0.5 * easeInOutCubic(invLerp(30, 48, f));   // time passes as you scroll
  const cam = camAt(f);
  const beam = beamAt(f);
  const flare = flareAt(f);
  const boat = boatAt(f);
  // boat lantern: steady glow, three blinks back on 45 / 50 / 55, then again with the stars
  const blink = (at: number) => (f >= at ? Math.exp(-(f - at) / 2.2) : 0);
  const boatLamp = night ? 0.6 : 0.2 + 1.5 * (blink(45) + blink(48.75) + blink(52.5));
  const signal = night ? 0 : 1.6 * Math.exp(-Math.max(0, f - 15) / 9) * (f >= 15 ? 1 : 0);   // the one long flash on beat 1
  const lampI = night ? 1 : 0.55;

  // whiteout covering the cut: rises with the flare, decays after the bar
  const white = f < 60 ? clamp(flare * 1.1) * reveal(f, 50, 6) : 1 - easeOutCubic(invLerp(61, 73, f));
  // window bursts to full-bleed under the light
  const e = easeInOutCubic(invLerp(56, 62, f));
  const win = { x: lerp(WIN.x, BLEED.x, e), y: lerp(WIN.y, BLEED.y, e), w: lerp(WIN.w, BLEED.w, e), h: lerp(WIN.h, BLEED.h, e) };
  const content = { x: win.x, y: win.y + CHROME_H, w: win.w, h: win.h - CHROME_H };
  const r = lerp(16, 0, e);
  const clip = `inset(${content.y}px ${W - content.x - content.w}px ${H - content.y - content.h}px ${content.x}px round 0 0 ${r}px ${r}px)`;

  // scroll (content px) and the page
  const S = 844 * easeInOutCubic(invLerp(30, 44, f));
  const pageOut = 1 - reveal(f, 56, 5);

  const lampPx = project(LAMP, cam, W, H);
  const stars = night ? easeOutCubic(invLerp(60, 84, f)) : 0;
  const starWave = night ? lerp(0.05, 2.6, easeOutExpo(invLerp(60, 96, f))) : 0;
  const sunDir: Vec3 = [-0.22, 0.045, -1];
  const fog: [string, number, number] = night ? ['#141C3C', 40, 520] : blue > 0.25 ? ['#8E6A8C', 55, 520] : ['#E6A08C', 55, 520];

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(160deg, #2A2346 0%, #5B3A5E 45%, #E49A7E 100%)', overflow: 'hidden' }}>
      {/* soft plate glow behind the window */}
      <div style={{ position: 'absolute', left: 300, top: 640, width: 1400, height: 700, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,196,150,0.55), rgba(255,196,150,0))' }} />
      {/* window body + shadow */}
      <div style={{ position: 'absolute', left: win.x, top: win.y, width: win.w, height: win.h, borderRadius: r, background: '#0E1222', boxShadow: '0 50px 100px rgba(10,6,30,0.5), 0 12px 30px rgba(10,6,30,0.35)' }} />

      {/* the sticky canvas + page, clipped to the window's content area */}
      <div style={{ position: 'absolute', inset: 0, clipPath: clip }}>
        <ThreeStage exposure={1.0}>
          <CamRig pos={cam.pos} target={cam.target} fov={cam.fov} />
          <fog attach="fog" args={fog} />
          <hemisphereLight color={night ? '#4A5BA8' : '#FFB69E'} groundColor={night ? '#05070F' : '#2A3550'} intensity={night ? 0.55 : 1.1 - 0.6 * blue} />
          <directionalLight position={night ? [60, 80, 40] : [-40, 10, -200]} color={night ? '#9DB4FF' : '#FF9A5E'} intensity={night ? 0.9 : 2.6 - 1.6 * blue} />
          <directionalLight position={[40, 30, 60]} color={night ? '#334477' : '#B9A8FF'} intensity={night ? 0.25 : 0.55} />
          <pointLight position={[LAMP[0], LAMP[1] + 0.5, LAMP[2]]} color="#FFC98A" intensity={night ? 220 : 90} distance={30} decay={2} />
          <SkyAndSea t={t} night={blue} cam={cam.pos} sunDir={sunDir} stars={night ? stars : 0.55 * blue} starWave={night ? starWave : 3.2} waveDir={CONST_DIRS[4]} bandN={BAND_N} lampI={lampI}
            boatLamp={[boat.pos[0], 1.9, boat.pos[2]]} boatI={boatLamp} />
          <Lighthouse beam={beam} beamI={night ? 0.8 : 0.5 + 0.5 * blue + 0.6 * signal} lampI={lampI + signal} night={blue} />
          <Boat pos={boat.pos} yaw={boat.yaw} t={t} lamp={boatLamp} night={night} />
          <LampGlow night={night} flare={flare + 0.35 * signal} />
        </ThreeStage>

        {/* constellation (night) */}
        {night ? <Constellation f={f} cam={cam} /> : null}

        {/* page content (scrolls) */}
        {pageOut > 0 && (
          <div style={{ position: 'absolute', left: content.x, top: content.y, width: content.w, height: content.h, opacity: pageOut }}>
            {/* parallax numerals */}
            {['01', '02'].map((n, i) => (
              <div key={n} style={{ position: 'absolute', left: 470, top: 70 + (i * 844 - S) * 0.62, fontFamily: F.display, fontWeight: 800, fontSize: 300, lineHeight: 1, color: 'transparent', WebkitTextStroke: '2px rgba(255,244,234,0.42)', letterSpacing: '-0.04em' }}>{n}</div>
            ))}
            <div style={{ position: 'absolute', left: 0, top: 0, width: content.w, height: 220, background: 'linear-gradient(180deg, rgba(30,18,50,0.45), rgba(30,18,50,0))' }} />
            {/* site header */}
            <div style={{ position: 'absolute', left: 52, top: 26, right: 52, height: 50, display: 'flex', alignItems: 'center', gap: 22 }}>
              <span style={{ fontFamily: F.display, fontWeight: 800, fontSize: 28, letterSpacing: '0.22em', color: '#FFF4E8' }}>SALTLIGHT</span>
              <span style={{ fontFamily: F.text, fontSize: 22, color: 'rgba(255,240,228,0.8)' }}>a story in three chapters</span>
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', gap: 10, marginRight: 190 }}>
                {['I', 'II', 'III'].map((n, i) => {
                  const on = i === 0 ? 1 - reveal(f, 36, 6) : i === 1 ? reveal(f, 36, 6) : 0;
                  return <div key={n} style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 19, letterSpacing: '0.1em', padding: '6px 14px', borderRadius: 16, color: on > 0.5 ? '#1A1426' : '#FFF4E8', background: `rgba(255,240,228,${0.12 + 0.8 * on})` }}>{n}</div>;
                })}
              </div>
            </div>
            {/* progress rail */}
            <div style={{ position: 'absolute', left: 22, top: 140, width: 3, height: 560, borderRadius: 2, background: 'rgba(255,240,228,0.2)' }}>
              <div style={{ width: 3, height: 560 * (0.18 + 0.32 * (S / 844) + 0.04 * Math.min(1, f / 60)), borderRadius: 2, background: '#FFD08A' }} />
            </div>
            {/* chapter cards */}
            <ChapterCard top={236 - S} f={f} kicker="CHAPTER 1" title="The Signal" body="Every night at nine, Mara lit the lamp and sent one long flash out to sea." bodyAt={4} titleAt={-10} />
            <ChapterCard top={236 + 844 - S} f={f} kicker="CHAPTER 2" title="The Crossing" body="Far out on the dark water, a small light blinked back. Three times." bodyAt={45} titleAt={36} />
            {/* scroll cue */}
            <div style={{ position: 'absolute', left: 52, top: content.h - 70, fontFamily: F.mono, fontSize: 18, letterSpacing: '0.16em', color: 'rgba(255,240,228,0.75)', opacity: 1 - reveal(f, 28, 6),
              transform: `translateY(${4 * Math.sin(t * 6)}px)` }}>SCROLL ↓</div>
          </div>
        )}

        {/* chapter 3, full-bleed */}
        {night ? (
          <div style={{ position: 'absolute', left: 296, top: 0, width: 900, height: H }}>
            <div style={{ position: 'absolute', top: 168, fontFamily: F.display, fontWeight: 800, fontSize: 24, letterSpacing: '0.22em', color: '#FFF4E8', opacity: 0.85 * reveal(f, 66, 8) }}>SALTLIGHT</div>
            <div style={{ position: 'absolute', top: 300, fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: '0.22em', color: '#FFD08A', opacity: reveal(f, 62, 8) }}>CHAPTER 3</div>
            <div style={{ position: 'absolute', top: 336, fontFamily: F.display, fontWeight: 800, fontSize: 108, lineHeight: '130px', color: '#FFF8EE', whiteSpace: 'nowrap',
              letterSpacing: `${lerp(0.14, -0.01, easeOutExpo(invLerp(60, 76, f)))}em`, opacity: reveal(f, 60, 8), filter: `blur(${(1 - reveal(f, 60, 12)) * 10}px)`,
              textShadow: '0 0 50px rgba(150,170,255,0.45)' }}>The Answer</div>
            <div style={{ position: 'absolute', top: 492, width: 700, fontFamily: F.text, fontWeight: 500, fontSize: 40, lineHeight: 1.35, color: '#E6E8FA' }}>
              <Words text="Then, one by one, the stars answered too." at={75} f={f} step={1.3} />
            </div>
          </div>
        ) : null}

        {/* lens flare (DOM, additive look) */}
        {white > 0.005 && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen' }}>
            <div style={{ position: 'absolute', left: (f < 60 ? lampPx[0] : W / 2) - 1400, top: (f < 60 ? lampPx[1] : H / 2) - 1400, width: 2800, height: 2800, borderRadius: '50%',
              background: `radial-gradient(closest-side, rgba(255,250,236,${white}), rgba(255,226,170,${0.85 * white}) 30%, rgba(255,180,120,${0.4 * white}) 60%, rgba(255,160,110,0))` }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: (f < 60 ? lampPx[1] : H / 2) - 6, height: 12, background: `linear-gradient(90deg, rgba(255,220,170,0), rgba(255,236,200,${white}), rgba(255,220,170,0))`, filter: 'blur(3px)' }} />
            <div style={{ position: 'absolute', inset: 0, background: `rgba(255,248,236,${clamp((white - 0.72) / 0.28)})` }} />
          </div>
        )}
      </div>

      {/* browser chrome (rides the window; pushed out of frame by the burst) */}
      <div style={{ position: 'absolute', left: win.x, top: win.y, width: win.w, height: CHROME_H, borderRadius: `${r}px ${r}px 0 0`, background: '#15182A', borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px', boxSizing: 'border-box', opacity: 1 - e * 0.4 }}>
        {['M15 5 L8 12 L15 19', 'M9 5 L16 12 L9 19', 'M19 12 A7 7 0 1 1 16.5 6.6 M19 4.5 V9 H14.5'].map((d, i) => (
          <svg key={i} width={26} height={26} viewBox="0 0 24 24"><path d={d} fill="none" stroke={i === 1 ? '#565A78' : '#B4B7CF'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
        ))}
        <div style={{ marginLeft: 10, height: 36, width: 560, borderRadius: 18, background: '#22263C', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', boxSizing: 'border-box' }}>
          <svg width={16} height={18} viewBox="0 0 16 18"><rect x={2} y={8} width={12} height={9} rx={2} fill="#B4B7CF" /><path d="M4.5 8 V5.5 A3.5 3.5 0 0 1 11.5 5.5 V8" fill="none" stroke="#B4B7CF" strokeWidth={2} /></svg>
          <span style={{ fontFamily: F.text, fontWeight: 500, fontSize: 21, color: '#E7E4F2' }}>{f < 38 ? 'saltlight.example/chapter-1' : 'saltlight.example/chapter-2'}</span>
        </div>
        <div style={{ flex: 1 }} />
        <svg width={26} height={26} viewBox="0 0 24 24"><path d="M6 6 L18 18 M18 6 L6 18" fill="none" stroke="#B4B7CF" strokeWidth={2} strokeLinecap="round" /></svg>
      </div>

      <V3Tag label="WEB · INTERACTIVE STORYTELLING" />
    </AbsoluteFill>
  );
};

const ChapterCard: React.FC<{ top: number; f: number; kicker: string; title: string; body: string; bodyAt: number; titleAt: number }> = ({ top, f, kicker, title, body, bodyAt, titleAt }) => (
  <div style={{ position: 'absolute', left: 52, top, width: 610, padding: '34px 40px 38px', boxSizing: 'border-box', borderRadius: 22,
    background: 'linear-gradient(160deg, rgba(20,16,40,0.62), rgba(20,16,40,0.38))', border: '1px solid rgba(255,240,228,0.18)', backdropFilter: 'blur(10px)', boxShadow: '0 30px 60px rgba(0,0,0,0.25)' }}>
    <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 20, letterSpacing: '0.22em', color: '#FFD08A', opacity: reveal(f, titleAt, 8) }}>{kicker}</div>
    <div style={{ marginTop: 10, overflow: 'hidden', height: 74 }}>
      <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 58, lineHeight: '72px', color: '#FFF6EC', transform: `translateY(${(1 - reveal(f, titleAt + 2, 12, easeOutCubic)) * 100}%)` }}>{title}</div>
    </div>
    <div style={{ marginTop: 18, fontFamily: F.text, fontSize: 31, lineHeight: 1.4, color: 'rgba(255,244,234,0.92)' }}><Words text={body} at={bodyAt} f={f} /></div>
  </div>
);

const LampGlow: React.FC<{ night: number; flare: number }> = ({ night, flare }) => (
  <Glow pos={LAMP} size={(night ? 9 : 6) + 26 * flare} color="#FFD9A0" intensity={(night ? 1.2 : 0.8) + 3 * flare} core={1.4} depthTest={false} />
);

const Constellation: React.FC<{ f: number; cam: { pos: Vec3; target: Vec3; fov: number } }> = ({ f, cam }) => {
  const pts = CONST_DIRS.map((d) => project([cam.pos[0] + d[0] * 900, cam.pos[1] + d[1] * 900, cam.pos[2] + d[2] * 900], cam, W, H));
  const groupAt = [75, 90];
  const answer = (at: number) => (f >= at ? Math.exp(-(f - at) / 3) : 0);
  const pulse = answer(105) + answer(110) + answer(115);
  const starOn = (i: number) => { const g = CONST_LINES.find((l) => l[0] === i || l[1] === i)?.[2] ?? 0; return reveal(f, groupAt[g] - 2 + i * 0.6, 6); };
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <radialGradient id="cstar"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.25" stopColor="#FFE9C4" stopOpacity="0.9" /><stop offset="1" stopColor="#9FB2FF" stopOpacity="0" /></radialGradient>
        <filter id="cglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <g filter="url(#cglow)">
        {CONST_LINES.map(([a, c, g], i) => {
          const p = reveal(f, groupAt[g] + (i % 3) * 3, 10, easeInOutCubic);
          if (p <= 0) return null;
          const [x0, y0] = pts[a], [x1, y1] = pts[c];
          return <line key={i} x1={x0} y1={y0} x2={lerp(x0, x1, p)} y2={lerp(y0, y1, p)} stroke="#CFE0FF" strokeOpacity={0.55 + 0.4 * pulse} strokeWidth={2 + 1.5 * pulse} strokeLinecap="round" />;
        })}
      </g>
      {pts.map(([x, y], i) => {
        const on = starOn(i);
        if (on <= 0) return null;
        const s = (10 + 4 * Math.sin(f / 5 + i * 2)) * (0.6 + 0.4 * on) * (1 + 1.3 * pulse);
        return <circle key={i} cx={x} cy={y} r={s} fill="url(#cstar)" opacity={on} />;
      })}
    </svg>
  );
};
