// The four scenes of the Redemption Rouge film. Times are global seconds T (scene local f + scene.from), so every
// event reads straight from SCENE_TIMINGS.json, the same file the score reads.
//   race    0-8   night track: red trails rush past the bottle (front), whip to a low side tracking shot that
//                 accelerates through three shifts, brakes, holds a breath
//   notes   8-15  on the hit the track becomes roses: petals burst, the camera tilts down the bottle, which is the
//                 scent pyramid (top notes at the stopper, heart at the label, base at the foot)
//   box     15-20 bottle + box slide in, light combs the pinstripes; the official line lands
//   finale  20-24 the last red trail passes and lights the bottle; name, Eau de Parfum, the gold wordmark, the url
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { clamp, easeInCubic, easeInOutQuint, easeOutCubic, easeOutQuint, invLerp, lerp } from '../animation/anim';
import { hash, noise1 } from '../animation/rng';
import { TIMINGS } from '../config/version';
import { C, FONT } from '../themes/tokens';
import {
  Bottle, burst, fall, FrontStreaks, goldText, HTrail, orbit, Petals, SideStreaks, StageFloor, Sweep, TrackFloor, Trail, Velvet, Words,
} from '../components/world';
import type { SceneProps } from './index';

const EV = (TIMINGS as unknown as { variants: { reel: { events: Events } } }).variants.reel.events;
interface Group { at: number; words: string[]; step: number }
interface Events {
  passes: number[]; turn: number; shifts: number[]; brake: number; stop: number[]; hit: number;
  notes: { top: Group; heart: Group; base: Group }; line1: { at: number; text: string }; line2: { at: number; text: string };
  boxIn: number; carrier: number; name: number; end: number;
}
const FPS = 60;
const gT = (p: SceneProps & { from?: number }) => p.f / FPS;

/** a pass lights the glass: the band crosses the bottle in 0.3 s around the pass time */
function passSweeps(T: number, passes: number[], dirFlip = false): Sweep[] {
  const out: Sweep[] = [];
  passes.forEach((pt, i) => {
    const u = invLerp(pt - 0.16, pt + 0.16, T);
    if (u <= 0 || u >= 1) return;
    const left = (i % 2 === 0) !== dirFlip;
    out.push({ p: left ? u : 1 - u, a: Math.sin(u * Math.PI) * 0.95, angle: left ? 100 : 80, width: 11 });
  });
  return out;
}

// ================================================================ race (0-8)
function speedAt(T: number) {              // side-shot speed (arbitrary units): builds through three shifts, then brakes
  let s = 1 + 1.9 * easeInCubic(invLerp(EV.turn, EV.brake, T));
  for (const sh of EV.shifts) s *= 1 - 0.16 * Math.exp(-Math.max(0, T - sh) * 7) * (T >= sh ? 1 : 0);
  if (T >= EV.brake) s *= 1 - easeOutCubic(invLerp(EV.brake, EV.stop[0], T));
  return Math.max(0, s);
}
function travelSide(T: number) {           // integral of speed since the turn (fixed step, pure)
  let x = 0;
  for (let t = EV.turn; t < T; t += 1 / 240) x += speedAt(t) / 240;
  return x;
}

const FrontShot: React.FC<{ T: number }> = ({ T }) => {
  const vp = { x: 540 + 6 * noise1(T * 0.7, 3), y: 820 };
  const trails: Trail[] = [];
  for (let i = 0; i < 110; i++) {                                   // the traffic: a dense stream of trails
    const ts = -2.2 + i * 0.058 + 0.04 * hash(i, 1), v = 40 + 40 * hash(i, 2), zHead = 70 - v * (T - ts);
    if (zHead < -12 || zHead > 70) continue;
    const side = hash(i, 3) > 0.5 ? 1 : -1;
    trails.push({ x: side * (1.3 + 3.4 * hash(i, 4)), y: 0.1 + 2.6 * hash(i, 5), zHead, len: 4 + 7 * hash(i, 6), w: 0.05 + 0.08 * hash(i, 7),
      a: 0.55 + 0.45 * hash(i, 8), col: hash(i, 9) > 0.6 ? C.ember : C.rouge });
  }
  EV.passes.filter((p) => p < EV.turn).forEach((pt, i) => {         // hero passes: close, bright, beside the bottle
    const v = 80, zHead = 0.9 - v * (T - pt);
    if (zHead < -12 || zHead > 70) return;
    trails.push({ x: i % 2 ? 1.05 : -1.05, y: 0.45 + 0.3 * hash(i, 11), zHead, len: 11, w: 0.17, a: 1, col: C.ember });
  });
  const h = lerp(960, 1100, easeInOutQuint(invLerp(0, EV.turn, T))), shake = 1.6 * noise1(T * 28, 5);
  return (
    <AbsoluteFill style={{ background: C.base }}>
      <TrackFloor vp={vp} travel={T * 30} />
      <FrontStreaks trails={trails.filter((t) => Math.abs(t.x) > 1.2)} vp={vp} />
      <Bottle x={540} base={1360 + shake} h={h} sweeps={passSweeps(T, EV.passes.filter((p) => p < EV.turn))} rim={0.55} reflect={0.3} />
      <FrontStreaks trails={trails.filter((t) => Math.abs(t.x) <= 1.2)} vp={vp} reflect={0.3} />
      <Words text={EV.line1.text} t={T} at={EV.line1.at} out={EV.turn - 0.45} gap={0.1} size={80} y={300} />
    </AbsoluteFill>
  );
};

const SideShot: React.FC<{ T: number }> = ({ T }) => {
  const sp = speedAt(T), X = travelSide(T), braking = T >= EV.brake;
  const trails: HTrail[] = [];
  for (let i = 0; i < 46; i++) {
    const d = hash(i, 21), k = 700 + 2600 * d, L0 = 120 + 520 * d;
    const span = 1080 + 2 * (L0 * 3.2);
    const x = ((hash(i, 22) * span - X * k) % span + span) % span - L0 * 3.2;
    const len = L0 * (0.25 + 0.9 * sp);
    trails.push({ x, y: 260 + 1500 * hash(i, 23), len, th: 2 + 9 * d * d, a: (0.25 + 0.6 * d) * clamp(sp * 1.5), d });
  }
  EV.passes.filter((p) => p >= EV.turn).forEach((pt, i) => {          // hero passes: one near trail crosses the bottle
    const u = (T - pt) / 0.45;
    if (u < -1 || u > 1.4) return;
    trails.push({ x: 1180 - 2600 * (u + 0.5), y: 700 + 380 * hash(i, 31), len: 900, th: 18, a: 1, d: 1 });
  });
  const squat = -1.2 * easeInCubic(invLerp(EV.turn, EV.brake, T));
  // the brake: the bottle pitches forward and settles (the film's one visible spring)
  const pitch = braking ? 5 * Math.exp(-(T - EV.brake) * 5) * Math.sin((T - EV.brake) * 14) : 0;
  const dim = 1 - 0.45 * invLerp(EV.stop[0] - 0.05, EV.stop[0], T);
  const dashX = -((X * 3000) % 260);
  return (
    <AbsoluteFill style={{ background: C.base }}>
      <Velvet t={T} cx={540} cy={1000} power={0.55 * dim} />
      <AbsoluteFill style={{ opacity: dim }}><SideStreaks trails={trails.filter((t) => t.d < 0.75)} /></AbsoluteFill>
      <StageFloor y={1500} glow={0.8 * dim} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: 0.25 * dim }}>
        {Array.from({ length: 7 }, (_, i) => <rect key={i} x={dashX + i * 260 - 40} y={1700} width={150} height={7} fill="#E9D8CF" />)}
      </svg>
      <Bottle kind="side" x={540 + 3 * noise1(T * 24, 6)} base={1500} h={1180} tilt={squat + pitch} rim={0.7 * dim}
        sweeps={passSweeps(T, EV.passes.filter((p) => p >= EV.turn), true)} reflect={0.28} />
      <AbsoluteFill style={{ opacity: dim }}><SideStreaks trails={trails.filter((t) => t.d >= 0.75)} /></AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Race: React.FC<SceneProps> = (p) => {
  const T = gT(p);
  // whip pan at the turn: the front shot accelerates out left, the side shot decelerates in from the right
  if (T < EV.turn) {
    const u = easeInCubic(invLerp(EV.turn - 0.15, EV.turn, T));
    return <AbsoluteFill style={{ transform: `translateX(${-900 * u}px)`, filter: u > 0 ? `blur(${u * 22}px)` : undefined }}><FrontShot T={T} /></AbsoluteFill>;
  }
  const u = 1 - easeOutCubic(invLerp(EV.turn, EV.turn + 0.2, T));
  return <AbsoluteFill style={{ transform: `translateX(${900 * u}px)`, filter: u > 0.01 ? `blur(${u * 22}px)` : undefined }}><SideShot T={T} /></AbsoluteFill>;
};

// ================================================================ notes (8-15)
const BH = 1700;                                  // bottle height in the notes shot
const ZONE = { top: 0.16, heart: 0.555, base: 0.9 };   // where each layer sits on the bottle (fraction of height)
const AIM = { top: 640, heart: 930, base: 1240 };      // where that zone sits on screen
function bottleTop(T: number) {
  const top = AIM.top - ZONE.top * BH, heart = AIM.heart - ZONE.heart * BH, base = AIM.base - ZONE.base * BH;
  const { heart: gh, base: gb } = EV.notes;
  let y = top;
  y = lerp(y, heart, easeInOutQuint(invLerp(gh.at - 0.45, gh.at, T)));
  y = lerp(y, base, easeInOutQuint(invLerp(gb.at - 0.45, gb.at, T)));
  y -= 1300 * easeInCubic(invLerp(14.7, EV.boxIn, T));                // leave accelerating: the camera keeps tilting
  return y;
}

const NoteGroup: React.FC<{ T: number; title: string; g: Group; out: number; y: number }> = ({ T, title, g, out, y }) => {
  const leave = easeInCubic(invLerp(out, out + 0.3, T));
  const hp = easeOutQuint(invLerp(g.at - 0.2, g.at + 0.25, T));
  return (
    <div style={{ position: 'absolute', left: 84, top: y - 60 * leave, width: 470, opacity: 1 - leave, filter: leave > 0 ? `blur(${leave * 8}px)` : undefined }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 40, letterSpacing: 3, backgroundImage: goldText, WebkitBackgroundClip: 'text', color: 'transparent',
        opacity: hp, transform: `translateX(${(1 - hp) * -30}px)` }}>{title}</div>
      <div style={{ width: 120 * hp, height: 2, margin: '14px 0 18px', background: `linear-gradient(90deg, ${C.gold}, transparent)` }} />
      {g.words.map((w, i) => {
        const p = easeOutQuint(invLerp(g.at + i * g.step, g.at + i * g.step + 0.4, T));
        return <div key={w} style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: 500, fontSize: 72, lineHeight: 1.08, color: C.ivory, opacity: p,
          transform: `translateY(${(1 - p) * 16}px) scale(${lerp(1.16, 1, p)})`, transformOrigin: '0% 50%', filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined,
          textShadow: '0 4px 24px rgba(0,0,0,0.7)' }}>{w}</div>;
      })}
    </div>
  );
};

export const Notes: React.FC<SceneProps> = (p) => {
  const T = EV.hit + gT(p);
  const arrive = easeOutQuint(invLerp(EV.hit, EV.hit + 0.5, T));
  const top = bottleTop(T), s = lerp(1.14, 1, arrive);
  const { top: gt, heart: gh, base: gb } = EV.notes;
  const bx = 830, centerY = top + BH * 0.45;
  const petals = [
    ...burst(44, 7, T, EV.hit, { x: bx, y: AIM.top + 120 }, 1),
    ...orbit(26, 9, T - gh.at, { x: bx, y: AIM.heart }, clamp(invLerp(gh.at - 0.3, gh.at + 0.2, T)) * (1 - clamp(invLerp(gb.at - 0.4, gb.at, T)))),
    ...fall(16, 13, T, clamp(invLerp(gb.at - 0.5, gb.at, T)) * 0.9, 1.4),
  ];
  const back = petals.filter((q) => q.z < 0), front = petals.filter((q) => q.z >= 0);
  const glint: Sweep[] = [
    { p: invLerp(EV.hit + 0.05, EV.hit + 0.6, T), a: 1 - invLerp(EV.hit + 0.4, EV.hit + 0.6, T), angle: 110, width: 12 },
    { p: invLerp(gh.at - 0.1, gh.at + 0.5, T), a: Math.sin(Math.PI * clamp(invLerp(gh.at - 0.1, gh.at + 0.5, T))) * 0.7, angle: 70, width: 14 },
    { p: invLerp(gb.at - 0.1, gb.at + 0.5, T), a: Math.sin(Math.PI * clamp(invLerp(gb.at - 0.1, gb.at + 0.5, T))) * 0.6, angle: 110, width: 14 },
  ];
  return (
    <AbsoluteFill style={{ background: C.base }}>
      <Velvet t={T} cx={bx} cy={clamp(centerY, 500, 1300)} power={1.1} />
      <Petals list={back} seed={1} />
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${s})`, transformOrigin: `${bx}px ${AIM.top}px` }}>
        <Bottle x={bx} base={top + BH} h={BH} sweeps={glint} rim={0.45} reflect={0} />
      </div>
      <Petals list={front} seed={2} />
      <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(7,2,5,0.85) 0%, rgba(7,2,5,0.55) 30%, transparent 48%)' }} />
      <NoteGroup T={T} title="TOP NOTES" g={gt} out={gh.at - 0.5} y={420} />
      <NoteGroup T={T} title="HEART NOTES" g={gh} out={gb.at - 0.5} y={720} />
      <NoteGroup T={T} title="BASE NOTES" g={gb} out={14.6} y={1000} />
    </AbsoluteFill>
  );
};

// ================================================================ box (15-20)
export const Box: React.FC<SceneProps> = (p) => {
  const T = EV.boxIn + gT(p);
  const inP = easeOutQuint(invLerp(EV.boxIn, EV.boxIn + 0.6, T));
  const leave = easeInCubic(invLerp(19.8, 20.0, T));
  const push = lerp(1, 1.06, easeInOutQuint(invLerp(EV.boxIn, 20, T)));
  const comb = (a: number, d: number) => ({ p: invLerp(a, a + d, T), a: Math.sin(Math.PI * clamp(invLerp(a, a + d, T))) * 0.85, angle: 100, width: 10 } as Sweep);
  return (
    <AbsoluteFill style={{ background: C.base }}>
      <Velvet t={T} cx={560} cy={1050} power={0.95} />
      <StageFloor y={1490} />
      <Petals list={fall(14, 17, T, 0.75, 0.9).filter((q) => q.z < 0)} seed={3} />
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${420 * (1 - inP) - 600 * leave}px) scale(${lerp(1.1, 1, inP) * push})`, transformOrigin: '540px 1300px',
        filter: leave > 0 ? `blur(${leave * 16}px)` : undefined }}>
        <Bottle kind="box" x={560} base={1490} h={1040} sweeps={[comb(16.1, 0.9), comb(18.1, 0.9)]} reflect={0.26} floorBlur={4} />
      </div>
      <Petals list={fall(10, 19, T, 0.85, 1.1).filter((q) => q.z >= 0)} seed={4} />
      <Words text={EV.line2.text} t={T} at={EV.line2.at} out={19.45} gap={0.15} size={68} y={200} maxW={860} />
    </AbsoluteFill>
  );
};

// ================================================================ finale (20-24)
export const Finale: React.FC<SceneProps> = (p) => {
  const T = EV.carrier + gT(p);
  const arrive = easeOutQuint(invLerp(EV.carrier, EV.carrier + 0.55, T));
  const cu = invLerp(EV.carrier - 0.05, EV.carrier + 0.5, T);              // the last red trail crosses behind the bottle
  const carrierX = -1500 + 6200 * (T - (EV.carrier - 0.05));                // keeps moving until the tail has left (~20.6 s)
  const lit = Math.exp(-Math.abs(carrierX - 540) / 500) * (cu > 0 && cu < 1 ? 1 : 0);
  const wm = easeOutQuint(invLerp(EV.name + 1.0, EV.name + 1.5, T));
  const url = easeOutQuint(invLerp(EV.name + 1.5, EV.name + 1.9, T));
  const sweeps: Sweep[] = [
    { p: clamp((carrierX + 300) / 1500), a: lit, angle: 95, width: 12 },
    { p: invLerp(23.0, 23.7, T), a: Math.sin(Math.PI * clamp(invLerp(23.0, 23.7, T))) * 0.7, angle: 110, width: 10 },
  ];
  const pet = fall(18, 23, T, 0.9, 0.8);
  return (
    <AbsoluteFill style={{ background: C.base }}>
      <Velvet t={T} cx={540} cy={950} power={0.8 + 0.5 * lit + 0.2 * arrive} />
      <StageFloor y={1290} />
      <Petals list={pet.filter((q) => q.z < 0)} seed={5} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="car" x1="1" x2="0"><stop offset="0" stopColor="#FFE3D6" /><stop offset="0.06" stopColor={C.ember} /><stop offset="1" stopColor={C.rouge} stopOpacity="0" /></linearGradient>
          <filter id="carG" x="-20%" y="-300%" width="140%" height="700%"><feGaussianBlur stdDeviation="16" /></filter>
        </defs>
        <rect x={carrierX - 1300} y={905} width={1300} height={42} rx={21} fill={C.ember} opacity={0.6} filter="url(#carG)" />
        <rect x={carrierX - 1300} y={916} width={1300} height={20} rx={10} fill="url(#car)" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${lerp(1.12, 1, arrive)})`, transformOrigin: '540px 1290px' }}>
        <Bottle x={540} base={1290} h={780} sweeps={sweeps} rim={0.5 + 0.4 * lit} reflect={0.3} />
      </div>
      <Petals list={pet.filter((q) => q.z >= 0)} seed={6} />
      <Words text="REDEMPTION" t={T} at={EV.name} gap={0.1} size={100} y={238} font={FONT.display} italic={false} weight={600} spacing={6} gradient={goldText} maxW={1000} />
      <Words text="ROUGE" t={T} at={EV.name + 0.15} gap={0.1} size={100} y={348} font={FONT.display} italic={false} weight={600} spacing={6} gradient={goldText} maxW={1000} />
      <Words text="Eau de Parfum" t={T} at={EV.name + 0.55} gap={0.1} size={50} y={472} />
      <Img src={staticFile('img/wordmark.png')} style={{ position: 'absolute', left: 540 - 150, top: 1335, width: 300, opacity: wm,
        transform: `scale(${lerp(1.25, 1, wm)})`, filter: wm < 1 ? `blur(${(1 - wm) * 8}px)` : undefined }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1490, textAlign: 'center', fontFamily: FONT.ui, fontWeight: 500, fontSize: 32, letterSpacing: 3,
        color: C.ivory2, opacity: url, transform: `translateY(${(1 - url) * 14}px)` }}>maisonmilan.co</div>
    </AbsoluteFill>
  );
};
