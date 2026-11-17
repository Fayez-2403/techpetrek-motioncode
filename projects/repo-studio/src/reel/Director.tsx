// What the 3D world shows at time t. Each repo beat: the bot drops in and STOMPS (the cut lands on the impact), the
// real repo panel slams in behind it, the magnifier sweeps onto the page's real star counter, and the bot does that
// repo's job. Every element is a pure function of t; the beat times come from the voice (SCENE_TIMINGS.json).
import React from 'react';
import * as THREE from 'three';
import { Bot, REST, type Pose } from '../bot/Bot';
import { cheer, idle, jump, magnify, mix, walk, wave } from '../bot/moves';
import { Lens, Panel, PANEL_ASPECT, useTex } from '../world/Panel';
import { Cam, type CamPose } from '../world/Camera';
import { Dust, Floor, Gallery, Lights, SLUGS, arcPos } from '../world/Studio';
import { ArrayGrid, Bubbles, ContactSheet, Encoder, FilmStrip, Keys, Meter, Pedals, Printer, Rig, Scan, Shock, Streaks, Strings, Track, Wave, WireWorld } from './props';
import { BEATS, E, STAR_BOX, T, V3, beatAt, clamp, lerp, lin, sec, type Beat } from './timeline';

type V = [number, number, number];
interface Ctx { a: number; d: number; t: number; b: Beat; i: number }
interface Def {
  cam: (c: Ctx) => CamPose;
  bot: (c: Ctx) => Pose;
  props?: (c: Ctx) => React.ReactNode;
  panel?: { pos?: V; rotY?: number; w?: number; hide?: boolean };
  land?: V | null;     // where the bot stomps in (null = no drop-in)
  zoom?: number;       // camera distance multiplier (default DIST)
}
const DIST = 1.6;   // portrait framing: the bot ~40 % of the frame width
const PANEL: V = [0, 6.9, -4.6];
const K = (pos: V, look: V, fov = 50): CamPose => ({ pos, look, fov });
const camMove = (c: Ctx, a0: CamPose, a1: CamPose, ease = E.inout) => { const u = ease(clamp(c.a / c.d)); return { pos: V3(a0.pos, a1.pos, u), look: V3(a0.look, a1.look, u), fov: lerp(a0.fov ?? 50, a1.fov ?? 50, u) }; };
const at = (p: Pose, pos: V, rotY = 0): Pose => ({ ...p, pos: [p.pos[0] + pos[0], p.pos[1] + pos[1], p.pos[2] + pos[2]], rotY: p.rotY + rotY });
const L = (raise = 0, swing = 0, stretch = 1) => ({ raise, swing, stretch });

/** the drop-in: falling from above, a heavy landing at a = 0.17, then hand over to the action pose */
function landed(c: Ctx, where: V, action: Pose, handoff = 0.45): Pose {
  const j = jump(c.a, -0.55, 3.4, 0.6, where, where, true);
  return mix(j, action, E.out(lin(c.a, 0.3, handoff + 0.2)));
}

const DEFS: Record<string, Def> = {
  blender: {
    cam: (c) => camMove(c, K([9, 3.2, 15], [0, 4.4, 0], 52), K([6.5, 3.6, 13], [0, 4.8, 0], 50)),
    bot: (c) => landed(c, [0, 0, 1.5], at({ ...idle(c.t), armL: L(c.a > 0.75 ? 1.5 : 0.3), armR: L(c.a > 0.75 ? 1.5 : 0.3), eyes: 'squint', mouth: c.a > 0.75 ? 'grin' : 'none' }, [0, 0, 1.5])),
    props: (c) => <group position={[0, 0, 1.5]}><Rig a={c.a - 0.2} /></group>,
  },
  threejs: {
    cam: (c) => { const th = lerp(0.9, -0.7, E.inout(c.a / c.d)); return K([Math.sin(th) * 18, 5 + 2 * Math.sin(c.a), Math.cos(th) * 18], [0, 4.6, -1], 50); },
    bot: (c) => landed(c, [0, 0, 1.5], at({ ...idle(c.t), rotY: c.a * 3, armL: L(1.2), armR: L(1.2), eyes: 'happy', mouth: 'grin' }, [0, 0, 1.5])),
    props: (c) => <WireWorld a={c.a} />,
  },
  numpy: {
    cam: (c) => camMove(c, K([0, 15, 15], [0, 2, -1], 52), K([3, 12, 13], [0, 2.5, -1], 50)),
    bot: (c) => landed(c, [0, 0, 4.5], at(magnify(c.t, { look: [0, -0.6], prop: 'none' }), [0, 0, 4.5])),
    props: (c) => <ArrayGrid a={c.a} />,
  },
  numba: {
    cam: (c) => { const x = lerp(-9, 9, E.inout(lin(c.a, 0.15, 1.3))); return K([x * 0.6 - 2, 3.2, 14], [x * 0.8, 3, 0], 50); },
    bot: (c) => walk(c.t, BEATS[c.i].t0 + 0.15, [-9, 0, 1.5], [9, 0, 1.5], 1.15, true),
    props: (c) => <Streaks a={c.a} x={lerp(-9, 9, E.inout(lin(c.a, 0.15, 1.3)))} />,
    land: null,
  },
  scipy: {
    cam: (c) => camMove(c, K([-13, 3, 12], [0, 2.4, 1], 50), K([-10, 3.6, 13], [1, 2.6, 1], 50)),
    bot: (c) => { const x = lerp(-6, 6, E.inout(c.a / c.d)), y = 1.2 + 0.4 * Math.sin(x * 0.8 + c.a * 4) * (1 - clamp(c.a / 1.4)); return { ...idle(c.t), pos: [x, y + 1.0, 2], rotZ: Math.sin(c.a * 5) * 0.12, armL: L(1.0), armR: L(1.0), eyes: 'wide', mouth: 'grin' }; },
    props: (c) => <Wave a={c.a} />,
    land: null,
  },
  gsap: {
    cam: (c) => camMove(c, K([0, 4, 21], [0, 3, 0], 46), K([2, 4.5, 19], [1, 3, 0], 46)),
    bot: (c) => {
      const keys = [-6, -2, 2, 6], k = Math.min(2, Math.floor(c.a / 0.45)), a0 = k * 0.45;
      return jump(c.a, a0, 2.2, 0.32, [keys[k], 0, 1], [keys[k + 1], 0, 1]);
    },
    props: (c) => <Track a={c.a} keys={[-6, -2, 2, 6]} />,
    land: null,
  },
  remotion: {
    cam: (c) => camMove(c, K([4, 5, 17], [0, 5, 0], 50), K([1, 5.5, 15], [0, 5.2, 0], 48)),
    bot: (c) => landed(c, [0, 0, 2.5], walk(c.t, BEATS[c.i].t0 + 0.45, [0, 0, 2.5], [0.01, 0, 2.5], 2)),
    props: (c) => <FilmStrip a={c.a} tex={useTex('repos/remotion_top.png')} />,
    panel: { pos: [-7.5, 6.5, -6], rotY: 0.5, w: 6.5 },
  },
  puppeteer: {
    cam: (c) => camMove(c, K([5, 8, 15], [0, 6, 0], 50), K([3, 9, 13], [0, 6.5, 0], 48)),
    bot: (c) => {
      const j = Math.sin(c.a * 7), k = Math.sin(c.a * 5 + 1);
      return { ...REST, pos: [Math.sin(c.a * 2) * 0.6, 3 + Math.sin(c.a * 4) * 0.4, 1.5], rotZ: j * 0.12, armL: L(0.8 + j * 0.6), armR: L(0.8 - j * 0.6), legs: [Math.max(0, k) * 0.6, 0, 0, Math.max(0, -k) * 0.6], eyes: c.a > 1 ? 'dizzy' : 'wide', mouth: 'o' };
    },
    props: (c) => { const y = 3 + Math.sin(c.a * 4) * 0.4, j = Math.sin(c.a * 7); return <Strings a={c.a} bar={[0, 13, 1.5]} anchors={[[-3.6, y + 3.6 + j * 0.6, 1.5], [3.6, y + 3.6 - j * 0.6, 1.5], [-2, y + 5, 1.5], [2.1, y + 5, 1.5]]} />; },
    land: null,
  },
  tonejs: {
    cam: (c) => camMove(c, K([2, 9, 15], [0, 1.5, 1], 50), K([-1, 8, 14], [0, 1.6, 1], 48)),
    bot: (c) => { const xs = [-4.4, -1.2, 2, 5.2], k = Math.min(2, Math.floor(c.a / 0.5)); return jump(c.a, k * 0.5, 1.6, 0.34, [xs[k], 0.4, 1.5], [xs[k + 1], 0.4, 1.5]); },
    props: (c) => <Keys a={c.a} hits={[{ t: 0.46, k: 6 }, { t: 0.96, k: 9 }, { t: 1.46, k: 12 }]} />,
    land: null,
  },
  pedalboard: {
    cam: (c) => camMove(c, K([0, 7.5, 15], [0, 1.5, 1], 50), K([0, 6.5, 13.5], [0, 1.8, 1], 48)),
    bot: (c) => { const xs = [-4.2, -4.2, 0, 4.2], k = Math.min(2, Math.floor((c.a + 0.55) / 0.7)); return jump(c.a, k * 0.7 - 0.55, 2.6, 0.55, [xs[k], 1.1, 2], [xs[k + 1], 1.1, 2], true); },
    props: (c) => <><Pedals a={c.a} hits={[0.12, 0.82, 1.52]} />{[0.12, 0.82, 1.52].map((h, i) => <Shock key={i} a={c.a - h} pos={[(i - 1) * 4.2, 1.2, 2]} />)}</>,
    land: null,
  },
  pyloudnorm: {
    cam: (c) => camMove(c, K([6, 6, 17], [-1, 4.5, 0], 50), K([4, 7, 15], [-1, 5, 0], 48)),
    bot: (c) => c.a < 1.05 ? at(idle(c.t, { eyes: 'wide', look: [-0.6, 0.6] }), [1.5, 0, 2]) : c.a < 1.75 ? jump(c.a, 1.05, 3.2, 0.55, [1.5, 0, 2], [-0.7, 6.35, -0.5], true) : at(cheer(c.t), [-0.7, 6.35, -0.5]),
    props: (c) => <><Meter a={c.a} /><Shock a={c.a - 1.72} pos={[-0.7, 6.4, -0.5]} c="#63E5FA" /></>,
  },
  opencv: {
    cam: (c) => camMove(c, K([0, 4.5, 14], [0, 4.2, 0], 50), K([0, 4.8, 12], [0, 4.4, 0], 48)),
    bot: (c) => landed(c, [0, 0, 1.5], at(idle(c.t, { goggles: E.out(lin(c.a, 0.35, 0.7)), eyes: 'squint', look: [Math.sin(c.a * 3), 0], mouth: 'flat' }), [0, 0, 1.5])),
    props: (c) => <Scan a={c.a} />,
  },
  pillow: {
    cam: (c) => camMove(c, K([0, 6, 17], [0, 5, -1], 50), K([0, 6.2, 15], [0, 5.2, -1], 48)),
    bot: (c) => landed(c, [0, 0, 2.5], at(magnify(c.t, { look: [0.4, 1] }), [0, 0, 2.5])),
    props: (c) => <ContactSheet a={c.a} texs={SLUGS.map((s) => useTex(`repos/${s}_top.png`))} />,
    panel: { hide: true },
  },
  fasterwhisper: {
    cam: (c) => camMove(c, K([-5, 5, 15], [0, 5, 0], 50), K([-3, 5.5, 13], [0, 5.5, 0], 48)),
    bot: (c) => landed(c, [0, 0, 1.5], at(idle(c.t, { mouth: Math.floor(c.a * 7) % 2 ? 'o' : 'smile', eyes: 'happy' }), [0, 0, 1.5])),
    props: (c) => <Bubbles a={c.a - 0.3} words={['captions', 'likh', 'deta', 'hai', '✓']} />,
  },
  ffmpeg: {
    cam: (c) => camMove(c, K([0, 5, 19], [0, 2.5, 0], 48), K([3, 4.5, 16], [1, 2.5, 0], 46)),
    bot: (c) => { const x = lerp(-11, -3.2, E.inout(lin(c.a, 0.1, 1.3))); return c.a < 1.3 ? walk(c.t, BEATS[c.i].t0 + 0.1, [-11, 0, 0.5], [-3.2, 0, 0.5], 1.2) : at(cheer(c.t), [x, 0, 2.5]); },
    props: (c) => <Encoder a={c.a} />,
    land: null,
  },
  reportlab: {
    cam: (c) => camMove(c, K([-3, 5, 15], [1.5, 3.5, 0], 50), K([-1, 5.5, 13], [1.5, 4, 0], 48)),
    bot: (c) => landed(c, [-1.5, 0, 2.5], at(idle(c.t, { armL: L(c.a > 1 ? 1.6 : 0.3), armR: L(c.a > 1 ? 1.6 : 0.3), eyes: c.a > 1 ? 'happy' : 'wide', mouth: 'grin' }), [-1.5, 0, 2.5])),
    props: (c) => <Printer a={c.a} />,
  },
};

/** hook: panels slam into their arc, the bot drops from the sky and stomps; total: all panels lit; cta: wave */
function Hook({ t }: { t: number }) {
  return (
    <group>
      {SLUGS.map((s, i) => {
        const t0 = 0.05 + i * 0.12, u = E.out(lin(t, t0, t0 + 0.45)), p = arcPos(i);
        const from: V = [p.pos[0] * 2.2, p.pos[1] + 18, p.pos[2] * 2.2];
        return u > 0 ? <Panel key={s} slug={s} width={7} position={V3(from, p.pos, u)} rotation={[(1 - u) * 1.2, p.rotY + (1 - u) * 2, 0]} glow={0.5 + (1 - u)} /> : null;
      })}
    </group>
  );
}

function hookCam(t: number): CamPose {
  const u = E.inout(lin(t, 1.2, 6.2));
  return { pos: V3([3, 4, 17], [0, 11, 36], u), look: V3([0, 3.4, 0], [0, 5.5, 0], u), fov: lerp(54, 50, u) };
}

export const World: React.FC<{ t: number }> = ({ t }) => {
  const hook = t < BEATS[0].t0, total = t >= sec('total').t0 && t < sec('cta').t0, cta = t >= sec('cta').t0;
  const b = beatAt(t), i = b ? BEATS.indexOf(b) : -1;
  let cam: CamPose, pose: Pose, props: React.ReactNode = null, panel: React.ReactNode = null, shockA = -1, gallery = true;
  if (hook) {
    cam = hookCam(t);
    // frame 0: already falling out of the sky; the stomp lands on "news!" (0.77 s)
    pose = t < 0.77 ? { ...REST, pos: [0, 16 * (1 - (t / 0.77) ** 2), 0], squash: 1.18, armL: L(1.7), armR: L(1.7), eyes: 'wide', mouth: 'o', rotZ: Math.sin(t * 9) * 0.08 }
      : mix(jump(t, 0.15, 9, 0.5, [0, 0, 0], [0, 0, 0], true), wave(t, { prop: 'mic', eyes: 'happy', mouth: 'grin' }), E.out(lin(t, 1.6, 2.1)));
    shockA = t - 0.77; gallery = false;
    props = <Hook t={t} />;
  } else if (b && !total && !cta) {
    const def = DEFS[b.slug], c: Ctx = { a: t - b.t0, d: b.t1 - b.t0, t, b, i };
    cam = def.cam(c); pose = def.bot(c); props = def.props?.(c);
    const z = def.zoom ?? DIST; cam = { ...cam, pos: cam.pos.map((p, k) => cam.look[k] + (p - cam.look[k]) * z) as V };
    if (def.land !== null) shockA = c.a - 0.17;
    if (!def.panel?.hide) {
      const pp = def.panel?.pos ?? PANEL, w = def.panel?.w ?? 8, h = w * PANEL_ASPECT, enter = E.back(lin(c.a, 0, 0.32));
      const star = STAR_BOX(b.slug), lu = E.inout(lin(c.a, 0.25, 0.95)), lensK = E.out(lin(c.a, 0.18, 0.42)) * (1 - E.in(lin(c.a, c.d - 0.3, c.d)));
      const tgt: [number, number] = star ? [star.u, star.v] : [0.5, 0.7];
      const lx = pp[0] + (lerp(0.5, tgt[0], lu) - 0.5) * w, ly = pp[1] + (lerp(0.6, tgt[1], lu) - 0.5) * h;
      panel = (
        <group>
          <group position={[pp[0], pp[1] + (1 - enter) * 12, pp[2]]} rotation={[(1 - enter) * -0.6, def.panel?.rotY ?? 0, 0]}><Panel slug={b.slug} width={w} glow={1} /></group>
          {lensK > 0.01 ? <Lens slug={b.slug} uv={[lerp(0.5, tgt[0], lu), lerp(0.6, tgt[1], lu)]} zoom={3.4} radius={1.7 * lensK} position={[lx, ly, pp[2] + 1.4]} rotation-y={def.panel?.rotY ?? 0} /> : null}
        </group>
      );
    }
  } else if (total) {
    const a = t - sec('total').t0, th = lerp(-0.5, 0.5, E.inout(a / 5));
    cam = { pos: [Math.sin(th) * 34, 12 - a * 0.6, Math.cos(th) * 34], look: [0, 5, 0], fov: 52 };
    pose = at(cheer(t), [0, 3, 0]);
    props = <group>{SLUGS.map((s, k) => { const p = arcPos(k), on = a > 0.3 + k * 0.12; return <Panel key={s} slug={s} width={7} position={p.pos} rotation-y={p.rotY} glow={on ? 1.6 : 0.3} edge={on ? '#F5A64D' : '#63E5FA'} />; })}
      <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[3.6, 4.2, 3, 32]} /><meshStandardMaterial color="#141a22" metalness={0.6} roughness={0.35} emissive="#F5A64D" emissiveIntensity={0.08} /></mesh></group>;
    gallery = false;
  } else {
    const a = t - sec('cta').t0;
    cam = { pos: V3([0, 7, 34], [0, 5.5, 25], E.out(a / 3)), look: [0, 3.4, 0], fov: 50 };
    pose = wave(t, { pos: [0, 0, 0], prop: 'mic', mouth: Math.floor(a * 6) % 2 && a < 2.9 ? 'o' : 'grin' });
  }
  // camera shake on the stomp
  const sh = shockA >= 0 && shockA < 0.35 ? (1 - shockA / 0.35) * 0.35 : 0;
  const camS = { ...cam!, pos: [cam!.pos[0] + Math.sin(t * 90) * sh, cam!.pos[1] + Math.cos(t * 77) * sh, cam!.pos[2]] as V };
  return (
    <>
      <Cam {...camS} />
      <Lights />
      <Floor />
      <Dust t={t} />
      {gallery ? <Gallery except={b ? [b.slug] : []} dim={0.25} /> : null}
      {panel}
      {props}
      <Bot p={pose!} />
      <Shock a={shockA} pos={[pose!.pos[0], 0.06, pose!.pos[2]]} />
    </>
  );
};
export const DEF_SLUGS = Object.keys(DEFS);
export { T };
