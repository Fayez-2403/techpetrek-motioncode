// ONE BALL, 18 UPGRADES. The ball stage (src/ball/Stage.tsx) gains one repo per spoken line. Each beat: the repo's
// name slams in with its real GitHub star count (docs/repos.json, GitHub API 2026-11-20), the repo's real page flies in
// and docks on the stage as a receipt, and the ball shows that repo's upgrade. Payoff: the finished ball, then
// before/after. Word-level captions from Liam's take. Pure function of the frame.
import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from 'remotion';
import { Stage, SW, SH } from '../ball/Stage';
import { REPOS, TOTAL_STARS, levelOf } from '../reel/repos';
import { E, T, clamp, lerp, lin, sceneAt, sec, spring, wordT } from '../reel/timeline';

export const TOTAL = Math.round(T.duration * 60);
export const MIX = 'audio/mix.wav';
const F = { d: 'Archivo, Inter, sans-serif', u: 'Inter, sans-serif', m: '"JetBrains Mono", monospace' };
const K = { coral: '#ff6b57', ice: '#8fd3ff', gold: '#ffcf5a', ink: '#F3F1EC', green: '#58e0a0', bg: '#06080d' };
const FRAME = { x: 40, y: 470, w: 1000, h: 860 };
const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`);

/** the level the ball is at, at time t (each repo's scene starts its upgrade) */
function levelAt(t: number) {
  const s = sceneAt(t), L = levelOf(s.id);
  if (L > 0) return { L, a: t - s.t0, d: s.t1 - s.t0, id: s.id };
  return { L: ['payoff', 'total', 'cta'].includes(s.id) ? 19 : 0, a: t - s.t0, d: s.t1 - s.t0, id: s.id };
}

function StageFrame({ t }: { t: number }) {
  const lv = levelAt(t), pay = sec('payoff'), tot = sec('total');
  // payoff: the frame grows to the full width; then before/after split
  const g = E.inout(lin(t, pay.t0, pay.t0 + 0.5)) * (1 - E.inout(lin(t, tot.t0, tot.t0 + 0.4)));
  const fw = lerp(FRAME.w, 1080, g), fx = lerp(FRAME.x, 0, g), fy = lerp(FRAME.y, 430, g), fh = fw * (SH / SW), k = fw / SW;
  const L = Math.min(18, lv.L), split = lv.id === 'payoff' ? E.inout(lin(t, pay.t1 - 1.5, pay.t1 - 0.9)) * 0.5 : 0;
  const shrink = lv.id === 'total' || lv.id === 'cta' ? E.inout(lin(t, tot.t0, tot.t0 + 0.4)) : 0;
  return (
    <div style={{ position: 'absolute', left: fx, top: fy + 40 * shrink, width: fw, height: fh, borderRadius: lerp(28, 0, g), overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,.65)', border: g < 0.5 ? '2px solid rgba(255,255,255,.12)' : 'none', opacity: 1 - 0.65 * shrink, transform: `scale(${1 - 0.15 * shrink})` }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: SW, height: SH, transform: `scale(${k})`, transformOrigin: '0 0' }}>
        <Stage t={t} L={L} a={lv.L === 19 ? 9 : lv.a} full={g > 0.5} slopHalf={lv.id === 'motionmaxxing' ? E.inout(lin(lv.a, 0.15, 0.5)) * 0.5 * (1 - E.inout(lin(lv.a, 1.7, 2.4))) : split} />
        {split > 0.01 ? <div style={{ position: 'absolute', right: 20, top: 20, padding: '6px 14px', borderRadius: 10, background: K.gold, color: '#111', fontFamily: F.d, fontWeight: 900, fontSize: 34, opacity: split * 2 }}>AFTER · 18 REPOS</div> : null}
      </div>
      {lv.id === 'remotion' ? <Timeline a={lv.a} w={fw} h={fh} /> : null}
    </div>
  );
}

/** Remotion beat: the stage sits in a timeline whose tracks are the 17 upgrades so far */
function Timeline({ a, w, h }: { a: number; w: number; h: number }) {
  const u = E.inout(lin(a, 0.15, 0.6)) * (1 - E.inout(lin(a, 2.6, 3.2))), ph = (a * 0.35) % 1;
  if (u <= 0) return null;
  const tracks = REPOS.slice(0, 17);
  return (
    <div style={{ position: 'absolute', left: 20, right: 20, bottom: 18, height: h * 0.42, opacity: u, transform: `translateY(${(1 - u) * 60}px)`, background: 'rgba(8,11,18,.92)', borderRadius: 14, border: '1px solid rgba(255,255,255,.14)', padding: '10px 14px', overflow: 'hidden' }}>
      {tracks.map((r, i) => (
        <div key={r.scene} style={{ display: 'flex', alignItems: 'center', height: (h * 0.42 - 20) / 17, gap: 10 }}>
          <span style={{ width: 170, fontFamily: F.m, fontSize: 13, color: 'rgba(243,241,236,.7)', whiteSpace: 'nowrap', overflow: 'hidden' }}>{r.name}</span>
          <div style={{ flex: 1, height: '62%', borderRadius: 4, background: `hsl(${(i * 37) % 360} 70% 62% / .75)`, marginLeft: `${(i * 3) % 18}%` }} />
        </div>
      ))}
      <div style={{ position: 'absolute', top: 6, bottom: 6, left: `${190 / w * 100 + ph * (100 - 190 / w * 100 - 4)}%`, width: 3, background: K.coral, boxShadow: `0 0 12px ${K.coral}` }} />
    </div>
  );
}

/** the repo's name, its real star count and job; its real GitHub page flies in and docks as a receipt */
function RepoCard({ t }: { t: number }) {
  const lv = levelAt(t); if (lv.L < 1 || lv.L > 18) return null;
  const r = REPOS[lv.L - 1], a = lv.a, d = lv.d;
  const slam = spring(a - 0.05, 17, 0.42), out = 1 - E.in(lin(a, d - 0.12, d)), cnt = E.out(lin(a, 0.25, 0.9));
  const long = r.name.length > 14;
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: 168, opacity: out }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <span style={{ fontFamily: F.m, fontWeight: 800, fontSize: 30, color: K.gold }}>{String(lv.L).padStart(2, '0')}</span>
        <span style={{ transformOrigin: '0 50%', display: 'inline-block', transform: `scale(${2 - slam}) rotate(${(1 - slam) * -3}deg)`, fontFamily: F.d, fontWeight: 900, fontStretch: '72%', fontSize: long ? 96 : 118, lineHeight: 0.95, color: '#fff', textShadow: '0 7px 0 #000', whiteSpace: 'nowrap' }}>{r.name}</span>
      </div>
      <div style={{ marginTop: 14, display: 'flex', gap: 12, alignItems: 'center', opacity: clamp((a - 0.2) / 0.2), transform: `translateY(${(1 - E.out(lin(a, 0.2, 0.45))) * 18}px)` }}>
        <span style={{ padding: '7px 16px', borderRadius: 12, background: K.gold, color: '#1a1205', fontFamily: F.m, fontWeight: 800, fontSize: 32 }}>★ {fmt(Math.round(r.stars * cnt))}</span>
        <span style={{ padding: '7px 16px', borderRadius: 12, background: 'rgba(10,14,22,.88)', border: '1px solid rgba(255,255,255,.16)', color: K.ink, fontFamily: F.u, fontWeight: 700, fontSize: 28 }}>{r.job}</span>
      </div>
    </div>
  );
}
function PageReceipt({ t }: { t: number }) {
  const lv = levelAt(t); if (lv.L < 1 || lv.L > 18) return null;
  const r = REPOS[lv.L - 1], a = lv.a, d = lv.d;
  const fly = E.out5(lin(a, 0, 0.28)), dock = E.inout(lin(a, 0.55, 0.95)), out = 1 - E.in(lin(a, d - 0.12, d));
  // big over the stage -> small receipt on the stage's top-right corner
  const w = lerp(940, 300, dock), x = lerp(70 + (1 - fly) * 700, FRAME.x + FRAME.w - 300 - 16, dock), y = lerp(560, FRAME.y + 16, dock), rot = lerp(-2.5, 3, dock);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: w * 0.42, overflow: 'hidden', borderRadius: 14, border: `3px solid ${K.gold}`, boxShadow: '0 18px 50px rgba(0,0,0,.6)', transform: `rotate(${rot}deg)`, opacity: fly * out, background: '#0d1117' }}>
      <Img src={staticFile(r.page)} style={{ width: '100%', display: 'block' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '4px 10px', background: 'rgba(0,0,0,.75)', fontFamily: F.m, fontSize: lerp(22, 13, dock), color: K.ink }}>github.com/{r.full}</div>
    </div>
  );
}

type Card = { big: string; col: string; small?: string };
const CARDS: Record<string, Card> = {
  hook: { big: '18 REPOS', col: K.gold, small: '1 boring ball · watch it level up' },
};
function TitleCard({ t }: { t: number }) {
  const s = sceneAt(t), c = CARDS[s.id]; if (!c) return null;
  const a = t - s.t0, d = s.t1 - s.t0, slam = spring(a - 0.15, 16, 0.42), out = 1 - E.in(lin(a, d - 0.14, d));
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: 168, textAlign: 'center', opacity: out }}>
      <div style={{ display: 'inline-block', transform: `scale(${2.2 - 1.2 * slam})`, fontFamily: F.d, fontWeight: 900, fontStretch: '72%', fontSize: 150, lineHeight: 0.92, color: c.col, textShadow: '0 8px 0 #000' }}>{c.big}</div>
      {c.small ? <div style={{ marginTop: 12, fontFamily: F.u, fontWeight: 700, fontSize: 32, color: K.ink, opacity: clamp((a - 0.4) / 0.2) }}>{c.small}</div> : null}
    </div>
  );
}

function Payoff({ t }: { t: number }) {
  const s = sec('payoff'); if (t < s.t0 || t >= s.t1) return null;
  const a = t - s.t0, u = spring(a - 0.6, 14, 0.42);
  return <div style={{ position: 'absolute', left: 0, right: 0, top: 210, textAlign: 'center', fontFamily: F.d, fontWeight: 900, fontStretch: '72%', fontSize: 112, color: '#fff', textShadow: '0 7px 0 #000', opacity: clamp(u * 2), transform: `scale(${1.6 - 0.6 * u})` }}>SAME BALL.<br /><span style={{ color: K.coral }}>18 UPGRADES.</span></div>;
}
function Total({ t }: { t: number }) {
  const s = sec('total'); if (t < s.t0 || t >= s.t1) return null;
  const a = t - s.t0, n = Math.round(TOTAL_STARS * E.out(lin(a, 0.2, 2.0))), slam = spring(a - 0.1, 14, 0.42);
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, top: 360, textAlign: 'center' }}>
      <div style={{ transform: `scale(${1.8 - 0.8 * slam})`, fontFamily: F.m, fontWeight: 800, fontSize: 140, color: K.gold, textShadow: '0 8px 0 #000, 0 0 60px rgba(255,207,90,.4)' }}>★ {n.toLocaleString('en-US')}</div>
      <div style={{ fontFamily: F.d, fontWeight: 800, fontStretch: '82%', fontSize: 44, color: K.ink }}>GITHUB STARS ACROSS ALL 18</div>
      <div style={{ marginTop: 34, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        {REPOS.map((r, i) => { const u = E.out(lin(a, 0.3 + i * 0.05, 0.6 + i * 0.05)); return <span key={r.scene} style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(10,14,22,.9)', border: '1px solid rgba(255,255,255,.16)', fontFamily: F.m, fontSize: 24, color: K.ink, opacity: u, transform: `translateY(${(1 - u) * 30}px)` }}>{r.name}</span>; })}
      </div>
      <div style={{ marginTop: 18, fontFamily: F.m, fontSize: 22, color: 'rgba(243,241,236,.55)' }}>GitHub API · 20 Nov 2026</div>
    </div>
  );
}
function Cta({ t }: { t: number }) {
  const s = sec('cta'); if (t < s.t0) return null;
  const a = t - s.t0, x = spring(a - 0.1, 12, 0.45), cm = wordT('cta', /^comment/i, 1.0) - s.t0, y = spring(a - cm + 0.1, 13, 0.4);
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: 420, textAlign: 'center' }}>
      <div style={{ transform: `scale(${1.6 - 0.6 * x})`, opacity: clamp(x * 2), fontFamily: F.d, fontWeight: 900, fontStretch: '74%', fontSize: 116, lineHeight: 0.95, color: '#fff', textShadow: '0 7px 0 #000' }}>ALL 18 LINKS<br /><span style={{ color: K.gold }}>+ THE SETUP</span></div>
      <div style={{ opacity: clamp(y), transform: `scale(${0.7 + 0.3 * y})`, display: 'inline-block', marginTop: 34, padding: '22px 56px', borderRadius: 999, background: K.coral, color: '#170604', fontFamily: F.d, fontWeight: 900, fontStretch: '82%', fontSize: 74, boxShadow: '0 10px 40px rgba(255,107,87,.5)' }}>COMMENT &ldquo;COPY&rdquo;</div>
    </div>
  );
}

const WORDS = T.lines.flatMap((l) => l.words.map((x) => ({ ...x, line: l.id })));
const NAMES = new RegExp(`^(${['ai', 'slop', '18', 'github', 'repos!?', ...REPOS.map((r) => r.name.split(/[ -.]/)[0].toLowerCase()), 'huashu', 'mg', 'three', 'react', 'blender', 'motion', 'copy\\.?', 'mp4', 'stars'].join('|')})`, 'i');
function Captions({ t }: { t: number }) {
  const cur = WORDS.findIndex((x) => t >= x.t0 - 0.05 && t < x.t1 + 0.3);
  if (cur < 0) return null;
  const x = WORDS[cur], line = WORDS.filter((y) => y.line === x.line), k = line.indexOf(x), start = Math.floor(k / 3) * 3, burst = line.slice(start, start + 3);
  const ent = E.out5(lin(t, burst[0].t0 - 0.06, burst[0].t0 + 0.1));
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, top: 1372, textAlign: 'center', opacity: ent, transform: `translateY(${(1 - ent) * 22}px)` }}>
      {burst.map((y, i) => {
        const on = t >= y.t0 - 0.03, now = on && t < y.t1 + 0.05, bare = y.w.replace(/[—…]/g, '');
        return <span key={i} style={{ display: 'inline-block', margin: '0 11px', fontFamily: F.d, fontWeight: 900, fontStretch: '80%', fontSize: 78, lineHeight: 1.08,
          color: !on ? 'rgba(243,241,236,.38)' : NAMES.test(bare) ? K.gold : K.ink, transform: `scale(${now ? 1.08 : 1})`, textShadow: '0 5px 0 #000, 0 0 26px rgba(0,0,0,.8)' }}>{bare}</span>;
      })}
    </div>
  );
}

export const Reel: React.FC = () => {
  const f = useCurrentFrame(), t = f / 60, s = sceneAt(t), cut = t - s.t0;
  const flash = s.t0 > 0 && cut < 0.18 ? 0.09 * (1 - cut / 0.18) ** 2 : 0;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, #111a2e 0%, ${K.bg} 70%)` }}>
      <StageFrame t={t} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.55) 0%, transparent 20%, transparent 68%, rgba(0,0,0,.55) 82%, rgba(0,0,0,.7) 100%)', pointerEvents: 'none' }} />
      <PageReceipt t={t} />
      <RepoCard t={t} />
      <TitleCard t={t} />
      <Payoff t={t} />
      <Total t={t} />
      <Cta t={t} />
      <Captions t={t} />
      <AbsoluteFill style={{ background: '#fff', opacity: flash }} />
      <div style={{ position: 'absolute', left: 40, right: 40, bottom: 318, textAlign: 'center', fontFamily: F.m, fontSize: 20, color: 'rgba(243,241,236,.5)' }}>list by @flxrnc · ★ GitHub API 20 Nov 2026 · ball upgrades = our illustration</div>
      {t >= sec('cta').t0 ? <Img src={staticFile('brand/techpe-trek.jpg')} style={{ position: 'absolute', right: 50, bottom: 370, width: 110, height: 110, borderRadius: 18, opacity: 0.8 * clamp((t - sec('cta').t0 - 0.4) / 0.4) }} /> : null}
      <Audio src={staticFile(MIX)} />
    </AbsoluteFill>
  );
};
