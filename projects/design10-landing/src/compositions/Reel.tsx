// ONE PAGE, 10 UPGRADES. A vibe-coded landing page (src/page/Page.tsx) gains one design resource per spoken line. Each
// beat: the resource's name slams in with a real figure from its own homepage, its REAL site plays (our scroll recording,
// captured 2026-11-21) in a browser card that docks on the stage as a receipt, and the page shows that upgrade.
// Payoff: the finished page, then before/after. Word-level captions from Liam's take. Pure function of the frame.
import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { Page, PW, PH } from '../page/Page';
import { SITES, levelOf } from '../reel/sites';
import { E, T, clamp, lerp, lin, sceneAt, sec, spring, wordT } from '../reel/timeline';

export const TOTAL = Math.round(T.duration * 60);
const F = { d: 'Archivo, Inter, sans-serif', u: 'Inter, sans-serif', m: '"JetBrains Mono", monospace' };
const K = { acc: '#ff5a1f', ice: '#8fd3ff', gold: '#ffcf5a', ink: '#F3F1EC', bg: '#07080b' };
const FR = { x: 40, y: 470, w: 1000, bar: 44 };

function levelAt(t: number) {
  const s = sceneAt(t), L = levelOf(s.id);
  if (L > 0) return { L, a: t - s.t0, d: s.t1 - s.t0, id: s.id };
  return { L: ['payoff', 'cta'].includes(s.id) ? 11 : 0, a: t - s.t0, d: s.t1 - s.t0, id: s.id };
}

/** our page in a browser window; grows wide on the payoff, then splits before/after */
function Browser({ t }: { t: number }) {
  const lv = levelAt(t), pay = sec('payoff'), cta = sec('cta');
  const g = E.inout(lin(t, pay.t0, pay.t0 + 0.5)) * (1 - E.inout(lin(t, cta.t0, cta.t0 + 0.4)));
  const w = lerp(FR.w, 1080, g), x = lerp(FR.x, 0, g), y = lerp(FR.y, 420, g), k = w / PW, ph = PH * k;
  const L = Math.min(10, lv.L), split = lv.id === 'payoff' ? E.inout(lin(t, pay.t1 - 1.6, pay.t1 - 1.0)) : 0;
  const away = lv.id === 'cta' ? E.inout(lin(t, cta.t0, cta.t0 + 0.4)) : 0;
  return (
    <div style={{ position: 'absolute', left: x, top: y + 50 * away, width: w, height: ph + FR.bar, borderRadius: lerp(18, 0, g), overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,.65)', border: g < 0.5 ? '1px solid rgba(255,255,255,.14)' : 'none', opacity: 1 - 0.7 * away, transform: `scale(${1 - 0.12 * away})` }}>
      <div style={{ height: FR.bar, background: '#1b1c20', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px' }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />)}
        <span style={{ marginLeft: 16, flex: 1, height: 26, borderRadius: 8, background: '#2a2b31', color: '#9a9ca5', fontFamily: F.m, fontSize: 16, display: 'flex', alignItems: 'center', paddingLeft: 12 }}>orbit.demo · our demo page</span>
        <span style={{ fontFamily: F.m, fontSize: 15, color: L >= 10 ? K.gold : '#9a9ca5' }}>{lv.L >= 1 ? `${Math.min(10, lv.L)}/10 resources` : 'vibe-coded'}</span>
      </div>
      <div style={{ position: 'relative', width: w, height: ph, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: PW, height: PH, transform: `scale(${k})`, transformOrigin: '0 0' }}><Page t={t} L={L} a={lv.L === 11 ? 9 : lv.a} /></div>
        {split > 0 ? <div style={{ position: 'absolute', left: 0, top: 0, width: PW, height: PH, transform: `scale(${k})`, transformOrigin: '0 0', clipPath: `inset(0 ${100 - 50 * split}% 0 0)` }}><Page t={t} L={0} a={0} /></div> : null}
        {split > 0.05 ? <>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${50 * split}%`, width: 4, background: K.gold }} />
          <span style={{ position: 'absolute', left: 16, top: 16, padding: '6px 12px', borderRadius: 8, background: '#111', color: '#fff', fontFamily: F.d, fontWeight: 900, fontSize: 30, opacity: split }}>BEFORE</span>
          <span style={{ position: 'absolute', right: 16, top: 16, padding: '6px 12px', borderRadius: 8, background: K.gold, color: '#111', fontFamily: F.d, fontWeight: 900, fontSize: 30, opacity: split }}>AFTER · 10 RESOURCES</span>
        </> : null}
      </div>
    </div>
  );
}

/** the resource's name + a real figure from its own homepage */
function SiteCard({ t }: { t: number }) {
  const lv = levelAt(t); if (lv.L < 1 || lv.L > 10) return null;
  const s = SITES[lv.L - 1], a = lv.a, d = lv.d, slam = spring(a - 0.05, 17, 0.42), out = 1 - E.in(lin(a, d - 0.12, d));
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: 168, opacity: out }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <span style={{ fontFamily: F.m, fontWeight: 800, fontSize: 30, color: K.gold }}>{String(lv.L).padStart(2, '0')}</span>
        <span style={{ transformOrigin: '0 50%', display: 'inline-block', transform: `scale(${2 - slam}) rotate(${(1 - slam) * -3}deg)`, fontFamily: F.d, fontWeight: 900, fontStretch: '72%', fontSize: 118, lineHeight: 0.95, color: '#fff', textShadow: '0 7px 0 #000', whiteSpace: 'nowrap' }}>{s.name}</span>
      </div>
      <div style={{ marginTop: 14, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', opacity: clamp((a - 0.2) / 0.2), transform: `translateY(${(1 - E.out(lin(a, 0.2, 0.45))) * 18}px)` }}>
        <span style={{ padding: '7px 16px', borderRadius: 12, background: K.gold, color: '#1a1205', fontFamily: F.m, fontWeight: 800, fontSize: 28 }}>{s.chip}</span>
        <span style={{ padding: '7px 16px', borderRadius: 12, background: 'rgba(12,14,20,.9)', border: '1px solid rgba(255,255,255,.16)', color: K.ink, fontFamily: F.u, fontWeight: 700, fontSize: 26 }}>{s.job}</span>
      </div>
    </div>
  );
}

/** the REAL site, scrolling (our capture), flies in big and docks as a receipt on the stage */
function SiteReceipt({ t }: { t: number }) {
  const lv = levelAt(t); if (lv.L < 1 || lv.L > 10) return null;
  const s = SITES[lv.L - 1], a = lv.a, d = lv.d, sc = sec(s.scene);
  const fly = E.out5(lin(a, 0, 0.28)), dock = E.inout(lin(a, 0.75, 1.15)), out = 1 - E.in(lin(a, d - 0.12, d));
  const w = lerp(960, 330, dock), x = lerp(60 + (1 - fly) * 700, FR.x + FR.w - 330 - 14, dock), y = lerp(560, FR.y + FR.bar + 14, dock);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: w * 0.625 + 26, borderRadius: 12, overflow: 'hidden', border: `3px solid ${K.gold}`, boxShadow: '0 18px 50px rgba(0,0,0,.6)', transform: `rotate(${lerp(-2, 2.5, dock)}deg)`, opacity: fly * out, background: '#111' }}>
      <div style={{ height: 26, background: '#1b1c20', display: 'flex', alignItems: 'center', paddingLeft: 10, fontFamily: F.m, fontSize: lerp(17, 12, dock), color: '#c9cbd3' }}>● {s.url}</div>
      <Sequence from={Math.round(sc.t0 * 60)} durationInFrames={Math.round((sc.t1 - sc.t0) * 60)} layout="none">
        <OffthreadVideo src={staticFile(s.video)} muted style={{ width: '100%', display: 'block' }} />
      </Sequence>
    </div>
  );
}

function Hook({ t }: { t: number }) {
  const s = sec('hook'); if (t >= s.t1) return null;
  const a = t, slam = spring(a - 0.15, 16, 0.42), out = 1 - E.in(lin(a, s.t1 - 0.14, s.t1));
  return <div style={{ position: 'absolute', left: 50, right: 50, top: 168, textAlign: 'center', opacity: out }}>
    <div style={{ display: 'inline-block', transform: `scale(${2.2 - 1.2 * slam})`, fontFamily: F.d, fontWeight: 900, fontStretch: '72%', fontSize: 140, lineHeight: 0.92, color: K.gold, textShadow: '0 8px 0 #000' }}>10 RESOURCES</div>
    <div style={{ marginTop: 12, fontFamily: F.u, fontWeight: 700, fontSize: 32, color: K.ink, opacity: clamp((a - 0.4) / 0.2) }}>1 vibe-coded page · watch it level up</div></div>;
}
function Payoff({ t }: { t: number }) {
  const s = sec('payoff'); if (t < s.t0 || t >= s.t1) return null;
  const a = t - s.t0, u = spring(a - 0.5, 14, 0.42);
  return <div style={{ position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center', fontFamily: F.d, fontWeight: 900, fontStretch: '72%', fontSize: 104, lineHeight: 0.95, color: '#fff', textShadow: '0 7px 0 #000', opacity: clamp(u * 2), transform: `scale(${1.6 - 0.6 * u})` }}>SAME PAGE.<br /><span style={{ color: K.acc }}>10 RESOURCES.</span></div>;
}
function Cta({ t }: { t: number }) {
  const s = sec('cta'); if (t < s.t0) return null;
  const a = t - s.t0, x = spring(a - 0.1, 12, 0.45), cm = wordT('cta', /^comment/i, 1.2) - s.t0, y = spring(a - cm + 0.1, 13, 0.4);
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, top: 300, textAlign: 'center' }}>
      <div style={{ transform: `scale(${1.6 - 0.6 * x})`, opacity: clamp(x * 2), fontFamily: F.d, fontWeight: 900, fontStretch: '74%', fontSize: 104, lineHeight: 0.95, color: '#fff', textShadow: '0 7px 0 #000' }}>ALL 10 LINKS</div>
      <div style={{ marginTop: 26, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        {SITES.map((s, i) => { const u = E.out(lin(a, 0.25 + i * 0.05, 0.55 + i * 0.05)); return <span key={s.scene} style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(12,14,20,.92)', border: '1px solid rgba(255,255,255,.16)', fontFamily: F.m, fontSize: 24, color: K.ink, opacity: u, transform: `translateY(${(1 - u) * 30}px)` }}>{s.url}</span>; })}
      </div>
      <div style={{ opacity: clamp(y), transform: `scale(${0.7 + 0.3 * y})`, display: 'inline-block', marginTop: 34, padding: '22px 56px', borderRadius: 999, background: K.acc, color: '#fff', fontFamily: F.d, fontWeight: 900, fontStretch: '82%', fontSize: 74, boxShadow: '0 10px 40px rgba(255,90,31,.5)' }}>COMMENT &ldquo;DESIGN&rdquo;</div>
    </div>
  );
}

const WORDS = T.lines.flatMap((l) => l.words.map((x) => ({ ...x, line: l.id })));
const NAMES = /^(ai|slop|10|design|uizze|thinkui|mcp|mobbin|land-book|godly|60fps|shadcn|react|bits|magic|ui|fontshare|ahmedabad|free\.?|page|design\.?|links)/i;
function Captions({ t }: { t: number }) {
  const cur = WORDS.findIndex((x) => t >= x.t0 - 0.05 && t < x.t1 + 0.3);
  if (cur < 0) return null;
  const x = WORDS[cur], line = WORDS.filter((y) => y.line === x.line), k = line.indexOf(x), start = Math.floor(k / 3) * 3, burst = line.slice(start, start + 3);
  const ent = E.out5(lin(t, burst[0].t0 - 0.06, burst[0].t0 + 0.1));
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, top: 1400, textAlign: 'center', opacity: ent, transform: `translateY(${(1 - ent) * 22}px)` }}>
      {burst.map((y, i) => { const on = t >= y.t0 - 0.03, now = on && t < y.t1 + 0.05, bare = y.w.replace(/[—…]/g, '');
        return <span key={i} style={{ display: 'inline-block', margin: '0 11px', fontFamily: F.d, fontWeight: 900, fontStretch: '80%', fontSize: 78, lineHeight: 1.08, color: !on ? 'rgba(243,241,236,.38)' : NAMES.test(bare) ? K.gold : K.ink, transform: `scale(${now ? 1.08 : 1})`, textShadow: '0 5px 0 #000, 0 0 26px rgba(0,0,0,.8)' }}>{bare}</span>; })}
    </div>
  );
}

export const Reel: React.FC = () => {
  const f = useCurrentFrame(), t = f / 60, s = sceneAt(t), cut = t - s.t0, flash = s.t0 > 0 && cut < 0.18 ? 0.08 * (1 - cut / 0.18) ** 2 : 0;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, #15161d 0%, ${K.bg} 70%)` }}>
      <Browser t={t} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.55) 0%, transparent 20%, transparent 70%, rgba(0,0,0,.5) 84%, rgba(0,0,0,.7) 100%)', pointerEvents: 'none' }} />
      <SiteReceipt t={t} />
      <SiteCard t={t} />
      <Hook t={t} />
      <Payoff t={t} />
      <Cta t={t} />
      <Captions t={t} />
      <AbsoluteFill style={{ background: '#fff', opacity: flash }} />
      <div style={{ position: 'absolute', left: 40, right: 40, bottom: 318, textAlign: 'center', fontFamily: F.m, fontSize: 20, color: 'rgba(243,241,236,.5)' }}>list by @Dionisselamii · real sites captured 21 Nov 2026 · page upgrades = our illustration</div>
      {t >= sec('cta').t0 ? <Img src={staticFile('brand/techpe-trek.jpg')} style={{ position: 'absolute', right: 50, bottom: 370, width: 110, height: 110, borderRadius: 18, opacity: 0.8 * clamp((t - sec('cta').t0 - 0.4) / 0.4) }} /> : null}
      <Audio src={staticFile('audio/mix.wav')} />
    </AbsoluteFill>
  );
};
