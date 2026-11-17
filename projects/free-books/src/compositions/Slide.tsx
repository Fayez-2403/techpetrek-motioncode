// One carousel slide (1080 × 1350): the 3D library fills the top 70 % (945 px), the facts sit in the bottom 30 %
// (405 px). Book slides: each book flies in, its OFFICIAL page slams in behind, the magnifier lands on the page's own
// proof that it is free, the book opens with light, the bot reacts. Slide 1 = the FREE hook, slide 7 = the CTA.
import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { BOOKS, SLIDES, byId, proof, segs, type Book } from '../config/books';
import { Bot, REST, type Pose } from '../bot/Bot';
import { cheer, idle, jump, mix, wave } from '../bot/moves';
import { Book3D } from '../world/Book3D';
import { Cam, type CamPose } from '../world/Camera';
import { Lens, Panel, PANEL_ASPECT, usePreload, ALL_TEXTURES } from '../world/Panel';
import { BG, Dust, Floor, Lights, Shafts, Shelves } from '../world/Library';

const FPS = 60, TOP = 945;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lin = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
type V = [number, number, number];
const V3 = (a: number[], b: number[], u: number) => a.map((x, i) => lerp(x, b[i], u)) as V;
const E = {
  out: (x: number) => 1 - (1 - clamp(x)) ** 4, in: (x: number) => clamp(x) ** 3,
  inout: (x: number) => { x = clamp(x); return x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2; },
  back: (x: number) => { x = clamp(x); const c = 1.7; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; },
};
const spring = (t: number, w = 15, z = 0.38) => (t <= 0 ? 0 : 1 - Math.exp(-z * w * t) * Math.cos(w * Math.sqrt(1 - z * z) * t));
const L = (raise = 0, swing = 0, stretch = 1) => ({ raise, swing, stretch });
const FONT = { display: 'Archivo, Inter, sans-serif', ui: 'Inter, sans-serif', mono: '"JetBrains Mono", monospace' };
const C = { green: '#3ddc84', amber: '#ffb347', ink: '#f6efe4', ink2: '#bfb3a3', orange: '#D97757', panel: '#120d09' };
const PAGE_SLUGS = ['sre', 'lbdl', 'udl', 'dlbook', 'd2l', 'mml', 'rl', 'progit', 'ejs', 'ostep'];

// ------------------------------------------------------------------ book slide 3D
function BookWorld({ t, books }: { t: number; books: { id: string; t0: number; t1: number }[] }) {
  const cur = books.find((s) => t >= s.t0 && t < s.t1) ?? books[books.length - 1];
  const i = books.indexOf(cur), a = t - cur.t0, d = cur.t1 - cur.t0, b = byId(cur.id), side = i % 2 ? -1 : 1;
  // the book: fly in (spin) -> stand -> open with light -> fly out to the shelf
  const inn = E.back(lin(a, 0, 0.5)), open = E.inout(lin(a, 1.5, 2.3)), out = E.in(lin(a, d - 0.42, d));
  const bookPos: V = [lerp(side * 9, 0.6 * side, inn) - out * side * 10, lerp(12, 2.6, inn) + Math.sin(a * 2) * 0.08 + out * 6, 1.2];
  const bookRot: V = [-0.05, lerp(side * 3.2, -0.35 * side, inn) + out * 2, lerp(side * 0.8, 0, inn)];
  // the official page + the magnifier on its proof text
  const pr = proof(b), pg = E.back(lin(a, 0.3, 0.7)), lu = E.inout(lin(a, 0.75, 1.45)), lk = E.out(lin(a, 0.6, 0.85)) * (1 - E.in(lin(a, d - 0.5, d - 0.2)));
  const pw = 7.6, ph = pw * PANEL_ASPECT, pp: V = [-1.2 * side, 6.6 + (1 - pg) * -9, -4.2];
  const tgt: [number, number] = pr ? [pr.u, pr.v] : [0.5, 0.6], uv: [number, number] = [lerp(0.5, tgt[0], lu), lerp(0.62, tgt[1], lu)];
  const lens: V = [pp[0] + (uv[0] - 0.5) * pw, pp[1] + (uv[1] - 0.5) * ph, pp[2] + 1.4];
  const zoom = pr && pr.w > 0.5 ? 2.2 : 3.2;
  // the bot: hops in, reads, cheers when the book opens
  const bx = -3.4 * side;
  const bot: Pose = a < 0.6 ? jump(a, -0.1, 2.6, 0.5, [bx - side * 4, 0, 2.4], [bx, 0, 2.4], true)
    : a < 1.5 ? idle(t, { pos: [bx, 0, 2.4], rotY: 0.5 * side, eyes: 'wide', look: [0.6 * side, 0.8], mouth: 'o' })
      : mix(idle(t, { pos: [bx, 0, 2.4], rotY: 0.5 * side }), cheer(t, { pos: [bx, 0, 2.4], rotY: 0.5 * side }), E.out(lin(a, 1.6, 1.9)));
  const cam: CamPose = { pos: V3([7 * side, 4.8, 15.5], [4.5 * side, 4.4, 12.8], E.inout(a / d)), look: V3([0, 4.4, 0], [0, 4.1, 0.5], E.inout(a / d)), fov: 46 };
  return (
    <>
      <Cam {...cam} />
      <group position={pp}><Panel slug={b.page} width={pw} glow={0.6} edge="#ffb347" /></group>
      {lk > 0.02 ? <Lens slug={b.page} uv={uv} zoom={zoom} radius={1.8 * lk} position={lens} /> : null}
      <Book3D book={b} open={open} glow={open} position={bookPos} rotation={bookRot} scale={0.9} />
      <group scale={0.55}><Bot p={{ ...bot, pos: [bot.pos[0] / 0.55, bot.pos[1] / 0.55, bot.pos[2] / 0.55] }} /></group>
    </>
  );
}

// ------------------------------------------------------------------ slide 1: the FREE hook
function HookWorld({ t }: { t: number }) {
  const ring = BOOKS.map((b, i) => {
    const t0 = 0.9 + i * 0.12, u = E.back(lin(t, t0, t0 + 0.5)), th = (i / 12) * Math.PI * 2 + t * 0.55;
    const from: V = [((i % 6) - 2.5) * 2.4, 3 + Math.floor(i / 6) * 2.8, -9.5], to: V = [Math.sin(th) * 5.2, 3.4 + Math.sin(th * 2 + t) * 0.5, Math.cos(th) * 5.2 - 2];
    return { b, pos: V3(from, to, u), rotY: th + Math.PI, open: E.inout(lin(t, 6.0 + (i % 3) * 0.1, 6.8)) };
  });
  const bot: Pose = t < 0.55 ? { ...REST, pos: [0, 14 * (1 - (t / 0.55) ** 2), 1], squash: 1.15, armL: L(1.6), armR: L(1.6), eyes: 'wide', mouth: 'o' }
    : t < 5.6 ? mix(jump(t, -0.05, 6, 0.48, [0, 0, 1], [0, 0, 1], true), cheer(t, { pos: [0, 0, 1] }), E.out(lin(t, 1.1, 1.5)))
      : wave(t, { pos: [0, 0, 1], eyes: 'happy', mouth: 'grin' });
  const u = E.inout(lin(t, 0.4, 9.5));
  const cam: CamPose = { pos: V3([0, 3.6, 15.5], [8, 7.5, 20], u), look: V3([0, 2.6, -1], [0, 3.6, -2], u), fov: 50 };
  return (
    <>
      <Cam {...cam} />
      {ring.map((r) => <Book3D key={r.b.id} book={r.b} open={r.open} glow={r.open * 0.8} position={r.pos} rotation-y={r.rotY} scale={0.72} />)}
      <group scale={0.62}><Bot p={{ ...bot, pos: [bot.pos[0] / 0.62, bot.pos[1] / 0.62, bot.pos[2] / 0.62] }} /></group>
      {t > 0.55 && t < 1.35 ? <mesh position={[0, 0.06, 1]} rotation-x={-Math.PI / 2}><ringGeometry args={[(1 + 8 * E.out((t - 0.55) / 0.8)) * 0.86, 1 + 8 * E.out((t - 0.55) / 0.8), 64]} /><meshBasicMaterial color={C.amber} transparent opacity={0.8 * (1 - (t - 0.55) / 0.8)} toneMapped={false} /></mesh> : null}
    </>
  );
}

// ------------------------------------------------------------------ slide 7: the CTA tower
function CtaWorld({ t }: { t: number }) {
  const n = BOOKS.length;
  const top = 0.55 + n * 0.62 * 0.62;
  const bot: Pose = t < 3.0 ? idle(t, { pos: [3.5, 0, 2.5], eyes: 'wide', look: [-0.8, 1], mouth: 'o' })
    : t < 3.7 ? jump(t, 3.0, 4, 0.55, [3.5, 0, 2.5], [0, top / 0.6, 0.3], true) : wave(t, { pos: [0, top / 0.6, 0.3], eyes: 'happy', mouth: 'grin' });
  const u = E.inout(lin(t, 0, 6.5));
  return (
    <>
      <Cam pos={V3([6, 3.5, 15], [3, 8.5, 17], u)} look={V3([0, 2.5, 0], [0, 5, 0], u)} fov={48} />
      {BOOKS.map((b, i) => {
        const t0 = 0.2 + i * 0.2, k = E.out(lin(t, t0, t0 + 0.35)), y = 0.62 * 0.62 * i + 0.25;
        return <group key={b.id} position={[Math.sin(i * 2.1) * 0.25, lerp(14, y, k), 0.3]} rotation={[-Math.PI / 2, 0, i * 0.37 + (1 - k) * 2]}><Book3D book={b} scale={0.62} /></group>;
      })}
      <group scale={0.6}><Bot p={bot} /></group>
    </>
  );
}

// ------------------------------------------------------------------ bottom 30 %
function Bottom({ slide, t }: { slide: (typeof SLIDES)[number]; t: number }) {
  if (slide.id === 's1') {
    const a = spring(t - 0.55, 12, 0.4), b = E.out(lin(t, 1.3, 1.7)), c = E.out(lin(t, 2.0, 2.4)), sw = E.out(lin(t, 7.6, 8)), nudge = 10 * Math.max(0, Math.sin((t - 7.6) * 6));
    return (
      <div style={{ position: 'absolute', left: 0, right: 0, top: TOP, height: 405, padding: '26px 56px', background: C.panel, borderTop: `4px solid ${C.green}` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 22 }}>
          <span style={{ transform: `scale(${2 - a})`, transformOrigin: '0 70%', display: 'inline-block', fontFamily: FONT.display, fontWeight: 900, fontStretch: '72%', fontSize: 150, lineHeight: 0.9, color: C.green, textShadow: '0 6px 0 #062a16' }}>FREE</span>
          <span style={{ opacity: b, transform: `translateX(${(1 - b) * 40}px)`, fontFamily: FONT.display, fontWeight: 900, fontStretch: '78%', fontSize: 64, color: C.ink, lineHeight: 1 }}>12 TOP<br />TECH BOOKS</span>
        </div>
        <div style={{ opacity: c, marginTop: 14, fontFamily: FONT.display, fontWeight: 800, fontStretch: '85%', fontSize: 44, color: C.amber }}>₹0 · 100% LEGAL · OFFICIAL LINKS</div>
        <div style={{ opacity: c, marginTop: 8, fontFamily: FONT.ui, fontWeight: 600, fontSize: 30, color: C.ink2 }}>AI · deep learning · maths · Google SRE · Git · JS · OS — free from the authors &amp; publishers themselves</div>
        <div style={{ position: 'absolute', right: 56, bottom: 30, opacity: sw, transform: `translateX(${nudge}px)`, padding: '12px 28px', borderRadius: 40, background: C.ink, color: '#120d09', fontFamily: FONT.display, fontWeight: 900, fontSize: 40 }}>SWIPE →</div>
      </div>
    );
  }
  if (slide.id === 's7') {
    const a = spring(t - 0.3, 12, 0.42), b = E.out(lin(t, 1.0, 1.4)), c = E.out(lin(t, 1.8, 2.2));
    return (
      <div style={{ position: 'absolute', left: 0, right: 0, top: TOP, height: 405, padding: '30px 56px', background: C.panel, borderTop: `4px solid ${C.orange}` }}>
        <div style={{ transform: `scale(${1.6 - 0.6 * a})`, transformOrigin: '0 50%', display: 'inline-block', padding: '14px 34px', borderRadius: 999, background: C.orange, color: '#1a0a04', fontFamily: FONT.display, fontWeight: 900, fontStretch: '82%', fontSize: 64 }}>COMMENT &ldquo;BOOKS&rdquo;</div>
        <div style={{ opacity: b, marginTop: 20, fontFamily: FONT.display, fontWeight: 800, fontStretch: '85%', fontSize: 44, color: C.ink }}>all 12 official links in your DM 📩</div>
        <div style={{ opacity: c, marginTop: 12, fontFamily: FONT.ui, fontWeight: 600, fontSize: 30, color: C.ink2 }}>Love one? Buy the print and support the authors. Save this for later 🔖</div>
      </div>
    );
  }
  const sg = segs(slide), cur = sg.find((s) => t >= s.t0 && t < s.t1) ?? sg[sg.length - 1], b: Book = byId(cur.id), a = t - cur.t0, d = cur.t1 - cur.t0;
  const idx = BOOKS.findIndex((x) => x.id === b.id) + 1, inn = E.out(lin(a, 0.1, 0.45)), out = 1 - E.in(lin(a, d - 0.3, d)), pr = proof(b), q = E.out(lin(a, 1.2, 1.6));
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: TOP, height: 405, padding: '24px 56px', background: C.panel, borderTop: `4px solid ${b.cover[0] === '#f7df1e' ? '#f7df1e' : C.amber}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 800, fontStretch: '85%', fontSize: 28, letterSpacing: '0.12em', color: C.amber }}>{slide.kicker}</span>
        <span style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 26, color: C.ink2 }}>{String(idx).padStart(2, '0')} / 12</span>
      </div>
      <div style={{ opacity: out, transform: `translateY(${(1 - inn) * 40}px)` }}>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ padding: '6px 16px', borderRadius: 10, background: C.green, color: '#04210f', fontFamily: FONT.display, fontWeight: 900, fontSize: 30 }}>{b.free}</span>
          <span style={{ fontFamily: FONT.display, fontWeight: 900, fontStretch: '74%', fontSize: b.title.join(' ').length > 30 ? 52 : 62, color: C.ink, lineHeight: 1 }}>{b.title.join(' ')}</span>
        </div>
        <div style={{ marginTop: 10, fontFamily: FONT.ui, fontWeight: 700, fontSize: 30, color: C.ink }}>{b.by} <span style={{ color: C.ink2, fontWeight: 500 }}>· {b.pub}</span></div>
        <div style={{ marginTop: 8, fontFamily: FONT.ui, fontWeight: 500, fontSize: 29, color: C.ink2 }}>you&rsquo;ll learn: <span style={{ color: C.ink }}>{b.learn}</span></div>
        <div style={{ marginTop: 12, opacity: q }}>
          <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 27, color: C.amber }}>🔗 {b.site}</div>
          {pr ? <div style={{ marginTop: 4, fontFamily: FONT.mono, fontSize: 21, color: C.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>on the official page: “{pr.text.length > 60 ? (pr.text.match(/[^.]*?(free|Free|PDF|online|Creative Commons|Pdf)[^.]{0,30}/)?.[0] ?? pr.text).slice(0, 60).trim() + '…' : pr.text}”</div> : null}
        </div>
      </div>
    </div>
  );
}

export const Slide: React.FC<{ id: string }> = ({ id }) => {
  const f = useCurrentFrame(), t = f / FPS, slide = SLIDES.find((s) => s.id === id)!;
  const ready = usePreload(ALL_TEXTURES(PAGE_SLUGS));
  const books = segs(slide);
  return (
    <AbsoluteFill style={{ background: BG }}>
      {ready ? (
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: TOP }}>
          <ThreeCanvas width={1080} height={TOP} shadows gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}>
            <color attach="background" args={[BG]} />
            <fog attach="fog" args={[BG, 16, 48]} />
            <Lights /><Floor /><Shelves lit={id === 's1' ? 0.6 : 0.3} /><Dust t={t} /><Shafts t={t} />
            {id === 's1' ? <HookWorld t={t} /> : id === 's7' ? <CtaWorld t={t} /> : <BookWorld t={t} books={books} />}
          </ThreeCanvas>
        </div>
      ) : null}
      <div style={{ position: 'absolute', left: 0, right: 0, top: TOP - 90, height: 90, background: `linear-gradient(180deg, transparent, ${C.panel})` }} />
      <Bottom slide={slide} t={t} />
      <div style={{ position: 'absolute', left: 30, top: 24, fontFamily: FONT.mono, fontSize: 18, color: 'rgba(246,239,228,.5)' }}>{id === 's1' ? '' : 'official free editions · covers: our design · bot: fan-made'}</div>
      <Img src={staticFile('brand/techpe-trek.jpg')} style={{ position: 'absolute', right: 24, top: 20, width: 74, height: 74, borderRadius: 0, opacity: 0.4 }} />
      <Audio src={staticFile(`audio/slide_${id}.wav`)} />
    </AbsoluteFill>
  );
};
export const SLIDE_FRAMES = (id: string) => Math.round(SLIDES.find((s) => s.id === id)!.dur * FPS);
