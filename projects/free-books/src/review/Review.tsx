// The screen-review carousel (1080 × 1350), in the language of the user's own repo-review reel: a dark purple ground,
// a lime accent, wide heavy type, "03 /12  domain" header, the REAL official page in a browser card that scrolls and
// zooms, a cursor that glides and clicks, lime highlight boxes drawn onto the real words, a funny mascot reacting at
// the card edge, and the big claim + purple mono subline in the bottom 30 %. Pure function of the frame.
import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from 'remotion';
import TG from '../config/targets.json';
import { Mascot, type Mood } from './Mascot';

const FPS = 60, W = 1080, TOP = 945;
const C = { bg: '#0a0812', lime: '#c8ff3d', purple: '#8b6cff', ink: '#f4f1ff', ink2: '#a59fc4', card: '#11101a', line: 'rgba(200,255,61,.9)' };
const F = { wide: 'Archivo, Inter, sans-serif', mono: '"JetBrains Mono", monospace', ui: 'Inter, sans-serif' };
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lin = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const E = {
  out: (x: number) => 1 - (1 - clamp(x)) ** 4, in: (x: number) => clamp(x) ** 3,
  inout: (x: number) => { x = clamp(x); return x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2; },
  back: (x: number) => { x = clamp(x); const c = 1.8; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; },
};
const spring = (t: number, w = 15, z = 0.4) => (t <= 0 ? 0 : 1 - Math.exp(-z * w * t) * Math.cos(w * Math.sqrt(1 - z * z) * t));
type Box = { x: number; y: number; w: number; h: number; text: string };
type Tg = { url: string; H: number; title: Box; stat: Box | null; free: Box | null; action: Box | null; toc: Box[]; chapters?: number };
const TGT = TG as unknown as Record<string, Tg>;

export interface Rev { id: string; n: number; name: string; domain: string; badge: string; claim: string; subA: string; subB: string; statLabel: string; actionLabel: string }
export const REVS: Rev[] = [
  { id: 'lbdl', n: 1, name: 'LITTLE BOOK OF DL', domain: 'fleuret.org', badge: 'FREE PDF', claim: '1,000,000+ DOWNLOADS', subA: 'FRANÇOIS FLEURET · PHONE-SIZED READ', subB: 'FREE PDF · CC NON-COMMERCIAL', statLabel: '1M+ DOWNLOADS', actionLabel: '⬇ PDF' },
  { id: 'udl', n: 2, name: 'UNDERSTANDING DL', domain: 'udlbook.github.io', badge: 'FREE PDF', claim: 'FULL PDF · ₹0', subA: 'SIMON J. D. PRINCE · MIT PRESS 2023', subB: '+ PYTHON NOTEBOOKS FOR THE WHOLE TEXT', statLabel: 'NOTEBOOKS', actionLabel: '⬇ PDF' },
  { id: 'dlbook', n: 3, name: 'DEEP LEARNING', domain: 'deeplearningbook.org', badge: 'FREE ONLINE', claim: '20 CHAPTERS · FREE', subA: 'GOODFELLOW · BENGIO · COURVILLE', subB: 'MIT PRESS · FREE TO READ ONLINE', statLabel: 'THE AUTHORS', actionLabel: 'READ ↗' },
  { id: 'd2l', n: 4, name: 'DIVE INTO DL', domain: 'd2l.ai', badge: 'FREE + OPEN', claim: '500 UNIVERSITIES', subA: 'CODE · MATH · DISCUSSIONS', subB: 'PYTORCH · JAX · TENSORFLOW', statLabel: '500 UNIS', actionLabel: 'READ ↗' },
  { id: 'mml', n: 5, name: 'MATHS FOR ML', domain: 'mml-book.github.io', badge: 'FREE PDF', claim: 'THE MATHS, FREE', subA: 'LINEAR ALGEBRA · CALCULUS · PROBABILITY', subB: 'DEISENROTH · FAISAL · ONG · CUP', statLabel: 'CAMBRIDGE UP', actionLabel: '⬇ PDF' },
  { id: 'rl', n: 6, name: 'SUTTON & BARTO', domain: 'incompleteideas.net', badge: 'FREE PDF', claim: 'THE RL BIBLE', subA: 'REINFORCEMENT LEARNING · 2ND ED.', subB: "FULL PDF ON THE AUTHORS' OWN SITE", statLabel: 'THE AUTHORS', actionLabel: '⬇ PDF' },
  { id: 'sre', n: 7, name: 'GOOGLE SRE', domain: 'sre.google', badge: 'FREE ONLINE', claim: '34 CHAPTERS', subA: 'HOW GOOGLE RUNS PRODUCTION', subB: 'FREE TO READ ONLINE · BY GOOGLE', statLabel: 'CH 1', actionLabel: 'READ ↗' },
  { id: 'srw', n: 8, name: 'SRE WORKBOOK', domain: 'sre.google', badge: 'FREE ONLINE', claim: '21 CHAPTERS', subA: 'SLOS · ON-CALL · INCIDENTS', subB: 'FREE TO READ ONLINE · BY GOOGLE', statLabel: 'CH 1', actionLabel: 'READ ↗' },
  { id: 'bsrs', n: 9, name: 'SECURE + RELIABLE', domain: 'google.github.io', badge: 'FREE ONLINE', claim: '21 CHAPTERS', subA: 'SECURITY BY DESIGN · GOOGLE', subB: 'BUILDING SECURE & RELIABLE SYSTEMS', statLabel: 'CH 1', actionLabel: 'READ ↗' },
  { id: 'progit', n: 10, name: 'PRO GIT', domain: 'git-scm.com', badge: 'FREE EBOOK', claim: '10 CHAPTERS + 3', subA: 'GIT FROM ZERO TO INTERNALS', subB: 'CC BY-NC-SA 3.0 · FREE EBOOK', statLabel: 'CH 1', actionLabel: '⬇ EBOOK' },
  { id: 'ejs', n: 11, name: 'ELOQUENT JS', domain: 'eloquentjavascript.net', badge: 'FREE ONLINE', claim: '4TH EDITION', subA: 'JAVASCRIPT, PROPERLY · 2024', subB: 'CC BY-NC · SINGLE PDF FREE', statLabel: 'CONTENTS', actionLabel: '⬇ PDF' },
  { id: 'ostep', n: 12, name: 'OSTEP', domain: 'pages.cs.wisc.edu', badge: 'FREE PDF', claim: 'FREE FOREVER', subA: 'OPERATING SYSTEMS: THREE EASY PIECES', subB: '“IS AND WILL ALWAYS BE FREE”', statLabel: 'CHAPTERS', actionLabel: '⬇ PDF' },
];
export const REV_SECONDS = 8, HOOK_SECONDS = 10, OUTRO_SECONDS = 7;

// ------------------------------------------------------------------ ground
function Ground({ t }: { t: number }) {
  return (
    <AbsoluteFill style={{ background: `radial-gradient(70% 45% at 50% 30%, #23164a 0%, ${C.bg} 70%)` }}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(139,108,255,.22) 1.4px, transparent 1.6px)', backgroundSize: '34px 34px', backgroundPosition: `0 ${(t * 14) % 34}px`, opacity: 0.6 }} />
      {Array.from({ length: 14 }, (_, i) => { const x = (i * 211) % 1080, y = ((i * 337) % 1300) - ((t * (14 + i * 2)) % 1350); return <div key={i} style={{ position: 'absolute', left: x, top: (y + 1350) % 1350, width: 4, height: 4, borderRadius: 2, background: i % 3 ? C.purple : C.lime, opacity: 0.35 }} />; })}
    </AbsoluteFill>
  );
}

// ------------------------------------------------------------------ the browser card with the real page
interface Key { t: number; box: Box | null; zoom: number }
const CARD = { x: 60, y: 236, w: 960, h: 680, bar: 46 };
function view(id: string, keys: Key[], t: number) {
  const tg = TGT[id], vw = CARD.w, vh = CARD.h - CARD.bar;
  let i = keys.findIndex((k, j) => t < (keys[j + 1]?.t ?? 1e9)); if (i < 0) i = keys.length - 1;
  const a = keys[i], b = keys[i + 1] ?? a, u = E.inout(lin(t, a.t, a.t + 0.9));
  const fc = (k: Key) => (k.box ? [k.box.x + k.box.w / 2, k.box.y + k.box.h / 2] : [640, 300]);
  const [fx0, fy0] = fc(a), [fx1, fy1] = fc(t >= a.t ? b : a);
  const k = t >= a.t && b !== a ? u : 0;
  const z = lerp(a.zoom, b.zoom, k), fx = lerp(fx0, fx1, k), fy = lerp(fy0, fy1, k), s = (vw / 1280) * z;
  const left = z < 1.15 ? 0 : clamp(fx * s - vw / 2, 0, Math.max(0, 1280 * s - vw)), top = clamp(fy * s - vh * 0.42, 0, Math.max(0, tg.H * s - vh));
  return { s, left, top, vw, vh, toCard: (bx: Box) => ({ x: bx.x * s - left, y: bx.y * s - top + CARD.bar, w: bx.w * s, h: bx.h * s }) };
}

function Highlight({ r, t0, t, label, strong = true, t1 = 99 }: { r: { x: number; y: number; w: number; h: number }; t0: number; t: number; label?: string; strong?: boolean; t1?: number }) {
  if (t < t0 || t > t1 + 0.3) return null;
  const k = E.out(lin(t, t0, t0 + 0.35)), fade = 1 - lin(t, t1, t1 + 0.3), pad = 8, per = 2 * (r.w + r.h + 4 * pad);
  const L = r.x - pad, T = r.y - pad, Wd = r.w + 2 * pad, Hd = r.h + 2 * pad;
  return (
    <div style={{ opacity: fade }}>
      <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
        <rect x={L} y={T} width={Wd} height={Hd} rx={10} fill={strong ? 'rgba(200,255,61,.13)' : 'none'} stroke={C.line} strokeWidth={4} strokeDasharray={per} strokeDashoffset={per * (1 - k)} style={{ filter: 'drop-shadow(0 0 10px rgba(200,255,61,.55))' }} />
      </svg>
      {label ? <div style={{ position: 'absolute', left: Math.min(L + Wd - 10, CARD.w - 190), top: T - 34, transform: `scale(${E.back(lin(t, t0 + 0.2, t0 + 0.5))})`, transformOrigin: '0 100%', padding: '4px 12px', borderRadius: 8, background: C.lime, color: '#0a0812', fontFamily: F.mono, fontWeight: 800, fontSize: 22, whiteSpace: 'nowrap' }}>{label}</div> : null}
    </div>
  );
}

function Cursor({ x, y, press }: { x: number; y: number; press: number }) {
  return (
    <>
      {press > 0 && press < 1 ? <div style={{ position: 'absolute', left: x - 40 * press, top: y - 40 * press, width: 80 * press, height: 80 * press, borderRadius: '50%', border: `4px solid ${C.lime}`, opacity: 1 - press }} /> : null}
      <svg style={{ position: 'absolute', left: x - 4, top: y - 4, transform: `scale(${press > 0 && press < 0.25 ? 0.85 : 1})`, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.6))' }} width={44} height={54} viewBox="0 0 29 35">
        <path d="M2 2 L2 27 L8.5 21 L13 32 L17.5 30 L13 19.5 L22 19.5 Z" fill={C.lime} stroke="#0a0812" strokeWidth={2} strokeLinejoin="round" />
      </svg>
    </>
  );
}

function Card({ id, t, keys, children, enter = 0 }: { id: string; t: number; keys: Key[]; children?: (v: ReturnType<typeof view>) => React.ReactNode; enter?: number }) {
  const v = view(id, keys, t), inn = E.back(lin(t, enter, enter + 0.5));
  const tilt = (1 - inn) * 18, sweep = ((t * 0.45) % 1.6) - 0.3;
  return (
    <div style={{ position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, perspective: 1600 }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - inn) * 260}px) rotateX(${tilt}deg) scale(${0.86 + 0.14 * inn})`, opacity: clamp(inn * 2), borderRadius: 22, overflow: 'hidden', background: C.card,
        border: '2px solid rgba(200,255,61,.55)', boxShadow: '0 0 0 1px rgba(139,108,255,.4), 0 30px 80px rgba(0,0,0,.6), 0 0 60px rgba(139,108,255,.35)' }}>
        <div style={{ height: CARD.bar, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px', background: '#191726', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />)}
          <span style={{ marginLeft: 14, padding: '6px 16px', borderRadius: 10, background: '#0f0d18', fontFamily: F.mono, fontSize: 20, color: C.ink2, flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>🔒 {TGT[id].url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
        </div>
        <div style={{ position: 'absolute', left: 0, top: CARD.bar, width: v.vw, height: v.vh, overflow: 'hidden', background: '#fff' }}>
          <Img src={staticFile(`full/${id}.png`)} style={{ position: 'absolute', left: -v.left, top: -v.top, width: 1280 * v.s, height: TGT[id].H * v.s, maxWidth: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent ${sweep * 100 - 8}%, rgba(255,255,255,.18) ${sweep * 100}%, transparent ${sweep * 100 + 8}%)` }} />
        </div>
        {children?.(v)}
      </div>
    </div>
  );
}

function Header({ r, t }: { r: Rev; t: number }) {
  const a = spring(t - 0.05, 14, 0.42), b = E.out(lin(t, 0.2, 0.5)), c = spring(t - 0.45, 13, 0.4);
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 40 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, opacity: b }}>
        <span style={{ fontFamily: F.wide, fontWeight: 900, fontStretch: '125%', fontSize: 96, lineHeight: 0.9, color: 'transparent', WebkitTextStroke: `3px ${C.lime}`, transform: `translateY(${(1 - a) * -40}px)`, display: 'inline-block' }}>{String(r.n).padStart(2, '0')}</span>
        <span style={{ fontFamily: F.mono, fontSize: 30, color: C.ink2 }}>/12</span>
        <span style={{ fontFamily: F.mono, fontSize: 28, color: C.ink2, marginLeft: 18 }}>{r.domain}</span>
      </div>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: F.wide, fontWeight: 900, fontStretch: '125%', fontSize: r.name.length > 14 ? 50 : 60, color: C.lime, letterSpacing: '0.01em', transform: `translateX(${(1 - a) * -60}px)`, opacity: a, display: 'inline-block', textShadow: '0 0 30px rgba(200,255,61,.35)' }}>{r.name}</span>
        <span style={{ transform: `scale(${0.4 + 0.6 * c})`, opacity: clamp(c * 2), padding: '10px 20px', borderRadius: 999, background: C.lime, color: '#0a0812', fontFamily: F.wide, fontWeight: 900, fontStretch: '110%', fontSize: 28, boxShadow: '0 0 30px rgba(200,255,61,.45)' }}>✓ {r.badge}</span>
      </div>
    </div>
  );
}

function Bottom({ claim, sub, t, t0 = 0.6, swipe = true, accent = C.ink }: { claim: string; sub: string; t: number; t0?: number; swipe?: boolean; accent?: string }) {
  const a = spring(t - t0, 13, 0.42), w = claim.length > 16 ? 76 : 92;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: TOP, height: 1350 - TOP, padding: '34px 60px' }}>
      <div style={{ fontFamily: F.wide, fontWeight: 900, fontStretch: '125%', fontSize: w, lineHeight: 0.95, color: accent, transform: `scale(${1.5 - 0.5 * a})`, transformOrigin: '0 50%', opacity: clamp(a * 2), textShadow: '0 6px 0 #000' }}>{claim}</div>
      <div key={sub} style={{ marginTop: 18, fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: C.purple, letterSpacing: '0.04em' }}>{sub}</div>
      {swipe ? <div style={{ position: 'absolute', left: 60, bottom: 50, padding: '10px 26px', borderRadius: 40, border: `2px solid ${C.lime}`, color: C.lime, fontFamily: F.wide, fontWeight: 900, fontStretch: '110%', fontSize: 30, transform: `translateX(${8 * Math.max(0, Math.sin(t * 6))}px)` }}>SWIPE →</div> : null}
    </div>
  );
}

const Logo = () => <Img src={staticFile('brand/techpe-trek.jpg')} style={{ position: 'absolute', right: 34, bottom: 34, width: 86, height: 86, opacity: 0.4 }} />;

// ------------------------------------------------------------------ one book
export const ReviewSlide: React.FC<{ id: string }> = ({ id }) => {
  const t = useCurrentFrame() / FPS, r = REVS.find((x) => x.id === id)!, tg = TGT[id];
  const stat = tg.toc.length >= 3 ? tg.toc[0] : tg.stat ?? tg.title, rows = tg.toc.length >= 5 ? tg.toc.slice(2, 5) : tg.toc.length >= 3 ? tg.toc.slice(0, 3) : [];
  const keys: Key[] = [{ t: 0, box: tg.title, zoom: 1 }, { t: 1.9, box: rows[1] ?? stat, zoom: rows.length ? 1.05 : 1.3 }, { t: 3.7, box: tg.free ?? stat, zoom: 1.85 }, { t: 5.6, box: tg.action ?? tg.free, zoom: 1.4 }, { t: 7.1, box: tg.title, zoom: 1.0 }];
  const sub = t < 3.7 ? r.subA : r.subB;
  // mascot: peeks from the card's right edge, hops at each beat, mood follows the review
  const beat = t < 1.9 ? 0 : t < 3.7 ? 1 : t < 5.6 ? 2 : 3, bt = [0.5, 1.9, 3.7, 5.6][beat], hop = Math.max(0, Math.sin(Math.min(1, (t - bt) / 0.35) * Math.PI)) * 34;
  const mood: Mood = (['shock', 'think', 'love', 'wink'] as Mood[])[beat];
  const enter = E.back(lin(t, 0.4, 0.9));
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <Ground t={t} />
      <Header r={r} t={t} />
      <Card id={id} t={t} keys={keys}>
        {(v) => {
          const T = (b: Box | null) => (b ? v.toCard(b) : null), title = T(tg.title)!, st = T(stat), fr = T(tg.free), ac = T(tg.action);
          const cursorAt = (b: { x: number; y: number; w: number; h: number } | null) => (b ? [b.x + Math.min(b.w * 0.8, 180), b.y + b.h * 0.7] : [CARD.w - 120, CARD.h - 80]);
          const path: [number, ReturnType<typeof cursorAt>][] = [[0.9, cursorAt(title)], [2.3, cursorAt(rows.length ? T(rows[1]) : st)], [4.0, cursorAt(fr)], [6.0, cursorAt(ac)], [7.3, [CARD.w + 80, CARD.h + 60]]];
          let ci = path.findIndex((p) => t < p[0]); if (ci < 0) ci = path.length; const p0 = ci === 0 ? [CARD.w + 60, CARD.h - 40] : path[ci - 1][1], p1 = ci < path.length ? path[ci][1] : p0;
          const u = ci === 0 ? E.inout(lin(t, 0.4, 0.9)) : ci < path.length ? E.inout(lin(t, path[ci][0] - 0.55, path[ci][0])) : 1;
          const cx = lerp(p0[0], p1[0], u), cy = lerp(p0[1], p1[1], u) - Math.sin(u * Math.PI) * 30;
          return (
            <>
              <Highlight r={title} t0={1.0} t={t} t1={1.9} label="THE BOOK" strong={false} />
              {rows.length ? rows.map((rw, i) => <Highlight key={i} r={T(rw)!} t0={2.4 + i * 0.25} t={t} t1={3.7} label={i === 0 ? (tg.chapters ? `${tg.chapters} CHAPTERS` : r.statLabel) : undefined} />)
                : st ? <Highlight r={st} t0={2.4} t={t} t1={3.7} label={r.statLabel} /> : null}
              {fr ? <Highlight r={fr} t0={4.15} t={t} t1={5.6} label="FREE ✓" /> : null}
              {ac && t > 5.7 ? <Highlight r={ac} t0={6.1} t={t} label={r.actionLabel} /> : null}
              <Cursor x={cx} y={cy} press={t > 6.0 ? lin(t, 6.0, 6.55) : 0} />
            </>
          );
        }}
      </Card>
      <Mascot t={t} x={CARD.x + CARD.w - 70} y={CARD.y + CARD.h - 70 - hop + (1 - enter) * 300} scale={0.85} squash={hop > 1 ? 1.08 : 1 - 0.1 * Math.max(0, 1 - (t - bt - 0.35) / 0.15) * (t > bt + 0.35 ? 1 : 0)}
        mood={mood} look={beat === 1 ? [-1, -0.6] : beat === 3 ? [-0.8, -0.3] : [-0.4, -0.8]} blink={(t % 2.7) > 2.58} paw={beat === 2 ? 'thumb' : beat === 1 ? 'point' : beat === 3 ? 'wave' : 'none'} pawAngle={-150} rot={Math.sin(t * 2) * 3} />
      <Bottom claim={r.claim} sub={sub} t={t} swipe={id !== 'ostep'} accent={id === 'ostep' || id === 'lbdl' ? C.lime : C.ink} />
      <Logo />
      <Audio src={staticFile(`audio/rev_${id}.wav`)} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ slide 1: the FREE hook
const ORDER = REVS.map((r) => r.id);
export const HookSlide: React.FC = () => {
  const t = useCurrentFrame() / FPS, a = spring(t - 0.1, 12, 0.38), b = E.out(lin(t, 0.45, 0.8));
  const per = 0.55, i = Math.min(11, Math.max(0, Math.floor((t - 1.2) / per))), lt = t - 1.2 - i * per, id = ORDER[i], tg = TGT[id];
  const keys: Key[] = [{ t: 0, box: tg.free ?? tg.title, zoom: 1.25 }];
  const flip = lt < 0.08 && t > 1.2 ? 1 - lt / 0.08 : 0;
  const mood: Mood = t < 1.2 ? 'shock' : t < 7.8 ? (i % 2 ? 'love' : 'happy') : 'wink';
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <Ground t={t} />
      <div style={{ position: 'absolute', left: 60, top: 30, display: 'flex', alignItems: 'flex-end', gap: 24 }}>
        <span style={{ fontFamily: F.wide, fontWeight: 900, fontStretch: '125%', fontSize: 168, lineHeight: 0.85, color: C.lime, transform: `scale(${2 - a})`, transformOrigin: '0 100%', display: 'inline-block', textShadow: '0 0 50px rgba(200,255,61,.45)' }}>₹0</span>
        <span style={{ opacity: b, transform: `translateY(${(1 - b) * 20}px)`, fontFamily: F.wide, fontWeight: 900, fontStretch: '115%', fontSize: 46, lineHeight: 1, color: C.ink, paddingBottom: 12 }}>12 FREE<br />TECH BOOKS</span>
      </div>
      <Card id={id} t={Math.max(lt, 0) + 10} keys={keys} enter={-9.6}>
        {(v) => {
          const fr = tg.free ? v.toCard(tg.free) : null;
          return (
            <>
              {fr && t > 1.2 ? <Highlight r={fr} t0={10.05} t={Math.max(lt, 0) + 10} label="FREE ✓" /> : null}
              <div style={{ position: 'absolute', right: 16, top: 56, padding: '6px 14px', borderRadius: 10, background: 'rgba(10,8,18,.88)', color: C.lime, fontFamily: F.mono, fontWeight: 800, fontSize: 24 }}>{String(i + 1).padStart(2, '0')}/12</div>
              <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: flip * 0.5 }} />
            </>
          );
        }}
      </Card>
      <Mascot t={t} x={CARD.x + 90} y={CARD.y - 40 - (t < 1.1 ? (1 - t / 1.1) * 700 : Math.max(0, Math.sin(((t - 1.2) % per) / per * Math.PI)) * 22)} scale={0.9} mood={mood} look={[0.6, 0.5]} blink={(t % 2.4) > 2.3} paw={t > 7.8 ? 'wave' : 'point'} pawAngle={30} rot={Math.sin(t * 3) * 4} />
      <Bottom claim="100% LEGAL" sub="OFFICIAL FREE PDFs · NO PIRACY" t={t} t0={0.9} accent={C.lime} />
      <Logo />
      <Audio src={staticFile('audio/rev_hook.wav')} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ last slide: the ranked list + CTA
export const OutroSlide: React.FC = () => {
  const t = useCurrentFrame() / FPS, hi = Math.min(11, Math.floor(lin(t, 0.8, 4.2) * 12));
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <Ground t={t} />
      <div style={{ position: 'absolute', left: 60, top: 44, fontFamily: F.mono, fontSize: 28, color: C.ink2 }}>START WITH</div>
      <div style={{ position: 'absolute', left: 60, top: 80, fontFamily: F.wide, fontWeight: 900, fontStretch: '125%', fontSize: 54, color: C.lime }}>the little book of DL</div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 170 }}>
        {REVS.map((r, i) => {
          const k = E.out(lin(t, 0.1 + i * 0.06, 0.5 + i * 0.06)), on = i === hi;
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 18, height: 60, marginBottom: 6, padding: '0 18px', borderRadius: 12, transform: `translateX(${(1 - k) * -120}px)`, opacity: k,
              background: on ? 'rgba(200,255,61,.14)' : 'rgba(255,255,255,.03)', border: on ? `2px solid ${C.lime}` : '2px solid rgba(255,255,255,.06)' }}>
              <span style={{ fontFamily: F.mono, fontWeight: 800, fontSize: 26, color: on ? C.lime : C.ink2, width: 46 }}>{String(r.n).padStart(2, '0')}</span>
              <span style={{ flex: 1, fontFamily: F.wide, fontWeight: 800, fontStretch: '110%', fontSize: 28, color: on ? C.lime : C.ink }}>{r.name}</span>
              <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 20, color: C.purple }}>{r.badge}</span>
            </div>
          );
        })}
      </div>
      <Mascot t={t} x={940} y={150 + Math.max(0, Math.sin(t * 5)) * -16} scale={0.75} mood={t > 4.5 ? 'wink' : 'happy'} look={[-0.7, 0.6]} blink={(t % 2.5) > 2.4} paw="wave" />
      <Bottom claim={'COMMENT “BOOKS”'} sub="ALL 12 OFFICIAL LINKS IN YOUR DM · SAVE THIS 🔖" t={t} t0={4.3} swipe={false} accent={C.lime} />
      <Logo />
      <Audio src={staticFile('audio/rev_outro.wav')} />
    </AbsoluteFill>
  );
};
