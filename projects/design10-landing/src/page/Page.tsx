// THE PAGE. One landing page for a demo product ("Orbit", a team calendar; our own illustration) that starts as
// vibe-coded AI slop (level 0) and gains one upgrade per design resource (level 1..10); the upgrades add up.
// Each upgrade illustrates what that resource gives you; level 10 uses the REAL Fontshare fonts (Clash Display + Satoshi,
// downloaded from Fontshare). Viewport 1000 x 860 (the browser window), page content scrolls inside it. Pure in t.
import React from 'react';
import { Img, staticFile } from 'remotion';
import { E, clamp, lerp, lin, spring } from '../reel/timeline';

export const PW = 1000, PH = 860;
const h1 = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

type Look = { bg: string; ink: string; sub: string; acc: string; card: string; line: string; head: string; body: string; radius: number };
function look(L: number): Look {
  const slop: Look = { bg: 'linear-gradient(135deg,#7c3aed 0%,#c026d3 55%,#db2777 100%)', ink: '#ffffff', sub: 'rgba(255,255,255,.85)', acc: '#ffffff', card: 'rgba(255,255,255,.14)', line: 'rgba(255,255,255,.25)', head: 'Inter', body: 'Inter', radius: 24 };
  if (L < 5) return { ...slop, bg: L >= 1 ? 'linear-gradient(160deg,#4c1d95 0%,#7c3aed 60%,#a21caf 100%)' : slop.bg };
  const ed: Look = { bg: '#f4f1ea', ink: '#141311', sub: '#5c5852', acc: '#ff5a1f', card: '#ffffff', line: '#e4dfd5', head: 'Inter', body: 'Inter', radius: L >= 7 ? 10 : 14 };
  return L >= 10 ? { ...ed, head: '"Clash Display"', body: 'Satoshi' } : ed;
}

/** the calendar app UI on the hero (our demo product) */
const AppCard: React.FC<{ lk: Look; t: number; w: number; L: number }> = ({ lk, t, w, L }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], ev = [[0, 1, 2, '#ff5a1f'], [1, 3, 1, '#2f6feb'], [2, 0, 2, '#14b8a6'], [3, 2, 1, '#f59e0b'], [4, 1, 2, '#8b5cf6']] as const;
  return (
    <div style={{ width: w, borderRadius: lk.radius, background: L >= 5 ? '#fff' : 'rgba(255,255,255,.12)', border: `1px solid ${lk.line}`, boxShadow: L >= 5 ? '0 30px 60px rgba(20,19,17,.12)' : '0 20px 40px rgba(0,0,0,.25)', padding: 16, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>{['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} style={{ width: 10, height: 10, borderRadius: 5, background: c }} />)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
        {days.map((d, i) => (
          <div key={d}>
            <div style={{ fontFamily: lk.body, fontSize: 12, fontWeight: 600, color: lk.sub, marginBottom: 6 }}>{d}</div>
            {[0, 1, 2, 3].map((r) => { const e = ev.find((x) => x[0] === i && r >= x[1] && r < x[1] + x[2]); return <div key={r} style={{ height: 30, marginBottom: 6, borderRadius: 6, background: e ? e[3] : L >= 5 ? '#f1eee8' : 'rgba(255,255,255,.08)', opacity: e ? 0.9 : 1, transform: e && L >= 6 ? `scale(${1 + 0.03 * Math.sin(t * 3 + i)})` : undefined }} />; })}
          </div>
        ))}
      </div>
    </div>
  );
};

/** a line icon that draws itself (ThinkUI: real animated icons instead of emoji) */
const Icon: React.FC<{ kind: number; draw: number; col: string }> = ({ kind, draw, col }) => {
  const paths = ['M6 20 L20 6 M12 6 H20 V14', 'M5 12 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 M12 8 V12 L15 14', 'M6 11 V8 a6 6 0 0 1 12 0 V11 M5 11 H19 V20 H5 Z'];
  return <svg width={44} height={44} viewBox="0 0 24 24"><path d={paths[kind]} fill="none" stroke={col} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} /></svg>;
};

/** a phone showing a 3-screen onboarding flow (Mobbin: real flows, not single screens) */
const Phone: React.FC<{ t: number; lk: Look }> = ({ t, lk }) => {
  const i = Math.floor(t / 1.1) % 3, u = E.inout(lin(t % 1.1, 0, 0.35));
  const scr = [['Welcome to Orbit', 'Plan the week together'], ['Pick your team', '3 people selected'], ['You are all set', 'First meeting: Mon 10:00']];
  return (
    <div style={{ width: 170, height: 340, borderRadius: 30, background: '#111', padding: 8, boxSizing: 'border-box', boxShadow: '0 30px 50px rgba(0,0,0,.35)' }}>
      <div style={{ width: '100%', height: '100%', borderRadius: 24, overflow: 'hidden', position: 'relative', background: '#fff' }}>
        {[0, 1, 2].map((k) => { const x = (k - i) * 100 - (k === i ? 0 : 0) + (k === (i + 1) % 3 ? 100 * (1 - u) : 0) - (k === i ? 100 * u * 0 : 0);
          return <div key={k} style={{ position: 'absolute', inset: 0, transform: `translateX(${k === i ? 0 : 100}%)`, opacity: k === i ? 1 : 0, padding: 14, boxSizing: 'border-box', fontFamily: lk.body }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ff5a1f', marginTop: 40 }} />
            <div style={{ fontWeight: 700, fontSize: 17, color: '#141311', marginTop: 16 }}>{scr[k][0]}</div>
            <div style={{ fontSize: 12, color: '#6b675f', marginTop: 6 }}>{scr[k][1]}</div>
            <div style={{ position: 'absolute', left: 14, right: 14, bottom: 18, height: 34, borderRadius: 10, background: '#141311', color: '#fff', fontSize: 12, fontWeight: 700, display: 'grid', placeItems: 'center' }}>Continue</div>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 64, display: 'flex', justifyContent: 'center', gap: 5 }}>{[0, 1, 2].map((d) => <span key={d} style={{ width: d === k ? 14 : 5, height: 5, borderRadius: 3, background: d === k ? '#141311' : '#d6d2ca' }} />)}</div>
          </div>; })}
      </div>
    </div>
  );
};

export const Page: React.FC<{ t: number; L: number; a: number }> = ({ t, L, a }) => {
  const lk = look(L), act = (n: number) => L === n;
  const struct = L >= 1, editorial = L >= 5;
  // Land-book: the camera scrolls down the real page structure and comes back
  const scroll = act(4) ? 620 * E.inout(lin(a, 0.3, 1.3)) * (1 - E.inout(lin(a, 1.8, 2.6))) : 0;
  const heroH = struct ? 560 : 860;
  const godlyWipe = act(5) ? E.inout(lin(a, 0.1, 0.9)) : 1;
  const letters = (s: string, on: boolean) => s.split('').map((ch, i) => { const k = on ? E.out(lin(a - i * 0.025, 0.1, 0.5)) : 1;
    return <span key={i} style={{ display: 'inline-block', transform: `translateY(${(1 - k) * 40}px)`, opacity: k, whiteSpace: 'pre' }}>{ch}</span>; });
  const headline = struct ? (editorial ? 'Plan the week\nbefore Monday.' : 'Plan your week in minutes') : 'Build the Future with AI';
  const sections = ['HERO', 'SOCIAL PROOF', 'FEATURES', 'PRICING', 'CTA'];
  const shimmer = L >= 9 ? (t * 0.6) % 1 : -1;
  const bodyPage = (lkx: Look, Lx: number) => (
    <div style={{ position: 'absolute', left: 0, top: -scroll, width: PW, fontFamily: lkx.body, color: lkx.ink }}>
      {/* background */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: PW, height: 1500, background: lkx.bg }} />
      {Lx >= 8 ? <svg width={PW} height={heroH} style={{ position: 'absolute', left: 0, top: 0, opacity: 0.55 }}>
        {[0, 1, 2, 3].map((k) => { const pts: string[] = []; for (let x = 0; x <= PW; x += 20) pts.push(`${x},${380 + k * 38 + 26 * Math.sin(x / 120 + t * (0.9 + k * 0.2) + k)}`); return <polyline key={k} points={pts.join(' ')} fill="none" stroke={['#ff5a1f', '#ffb38a', '#2f6feb', '#14b8a6'][k]} strokeWidth={2} opacity={0.5} />; })}
      </svg> : null}
      {Lx >= 5 ? <svg width={PW} height={1500} style={{ position: 'absolute', left: 0, top: 0, mixBlendMode: 'multiply', opacity: 0.12 }}><filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={Math.floor(t * 12) % 97} /></filter><rect width={PW} height={1500} filter="url(#gr)" /></svg> : null}
      {/* nav */}
      {struct ? <div style={{ position: 'absolute', left: 48, right: 48, top: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 16, fontWeight: 600 }}>
        <span style={{ fontFamily: lkx.head, fontWeight: 700, fontSize: 24, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 22, height: 22, borderRadius: 11, border: `4px solid ${lkx.acc}` }} />Orbit</span>
        <span style={{ display: 'flex', gap: 26, color: lkx.sub }}>{['Product', 'Teams', 'Pricing'].map((x, i) => <span key={x} style={{ position: 'relative' }}>{x}{Lx >= 6 && i === Math.floor((t * 0.8) % 3) ? <span style={{ position: 'absolute', left: 0, right: 0, bottom: -6, height: 2, background: lkx.acc }} /> : null}</span>)}</span>
        <span style={{ padding: '9px 16px', borderRadius: Lx >= 7 ? 8 : 999, background: lkx.ink, color: editorial ? '#f4f1ea' : '#4c1d95', fontSize: 14, fontWeight: 700 }}>Start free</span>
      </div> : null}
      {/* hero */}
      <div style={{ position: 'absolute', left: struct ? 48 : 0, top: struct ? 120 : 250, width: struct ? 500 : PW, textAlign: struct ? 'left' : 'center' }}>
        {Lx >= 7 ? <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 999, border: `1px solid ${lkx.line}`, background: lkx.card, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>New · Team templates</span> : null}
        <div style={{ fontFamily: lkx.head, fontWeight: Lx >= 10 ? 600 : 800, fontSize: editorial ? (Lx >= 10 ? 74 : 66) : struct ? 54 : 64, lineHeight: editorial ? 0.98 : 1.08, letterSpacing: editorial ? '-0.03em' : '-0.01em', whiteSpace: 'pre-line' }}>
          {Lx >= 8 && act(8) ? letters(headline, true) : headline}</div>
        <div style={{ marginTop: 18, fontSize: struct ? 19 : 22, lineHeight: 1.45, color: lkx.sub, maxWidth: struct ? 430 : 720, marginLeft: struct ? 0 : 'auto', marginRight: struct ? 0 : 'auto' }}>
          {struct ? 'Orbit finds the time your whole team is free, then books it.' : 'Revolutionize your workflow with cutting-edge AI-powered solutions that scale.'}</div>
        <div style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: struct ? 'flex-start' : 'center' }}>
          {(() => { const press = Lx >= 6 && act(6) ? Math.max(0, 1 - Math.abs(a - 1.15) / 0.12) : 0;
            return <span style={{ position: 'relative', overflow: 'hidden', padding: '15px 26px', borderRadius: Lx >= 7 ? 10 : 999, background: editorial ? lkx.acc : '#fff', color: editorial ? '#fff' : '#6d28d9', fontWeight: 700, fontSize: 17, transform: `scale(${1 - 0.05 * press})`, boxShadow: editorial ? '0 10px 24px rgba(255,90,31,.3)' : '0 10px 30px rgba(0,0,0,.2)' }}>
              {struct ? 'Plan my week' : 'Get Started 🚀'}{shimmer >= 0 ? <span style={{ position: 'absolute', top: 0, bottom: 0, left: `${shimmer * 160 - 30}%`, width: '30%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent)', transform: 'skewX(-20deg)' }} /> : null}</span>; })()}
          {struct ? <span style={{ padding: '15px 22px', borderRadius: Lx >= 7 ? 10 : 999, border: `1px solid ${lkx.line}`, fontWeight: 600, fontSize: 17 }}>See how it works</span> : null}
        </div>
        {Lx >= 6 ? (() => { const on = act(6) ? a > 1.6 : true, k = act(6) ? spring(a - 1.6, 16, 0.4) : 1;
          return <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: lkx.sub }}><span style={{ width: 46, height: 26, borderRadius: 13, background: on ? lkx.acc : lkx.line, position: 'relative' }}><span style={{ position: 'absolute', top: 3, left: 3 + 20 * clamp(k, 0, 1.1), width: 20, height: 20, borderRadius: 10, background: '#fff' }} /></span>Sync with Google Calendar</div>; })() : null}
      </div>
      {struct ? <div style={{ position: 'absolute', left: 580, top: Lx >= 3 ? 150 : 140 }}><AppCard lk={lkx} t={t} w={370} L={Lx} /></div> : null}
      {Lx >= 3 ? <div style={{ position: 'absolute', left: 820, top: 300, transform: act(3) ? `translateY(${(1 - E.out(lin(a, 0.1, 0.5))) * 400}px)` : undefined }}><Phone t={act(3) ? a : t} lk={lkx} /></div> : null}
      {/* features / sections */}
      <div style={{ position: 'absolute', left: 48, right: 48, top: struct ? heroH + (Lx >= 9 ? 60 : 0) : 560, display: Lx >= 9 ? 'grid' : 'flex', gridTemplateColumns: '2fr 1fr', gridTemplateRows: '150px 150px', gap: 16 }}>
        {['Finds free time', 'Books in one click', 'Private by default'].map((x, i) => (
          <div key={x} style={{ flex: 1, gridRow: Lx >= 9 && i === 0 ? 'span 2' : undefined, borderRadius: lkx.radius, background: lkx.card, border: `1px solid ${lkx.line}`, padding: 22, boxSizing: 'border-box', minHeight: 150 }}>
            {Lx >= 2 ? <Icon kind={i} draw={act(2) ? E.inout(lin(a - i * 0.2, 0.2, 1.0)) : 1} col={editorial ? lkx.acc : '#fff'} /> : <div style={{ fontSize: 36 }}>{['🚀', '⚡', '🔒'][i]}</div>}
            <div style={{ marginTop: 10, fontFamily: lkx.head, fontWeight: 700, fontSize: 21 }}>{struct ? x : ['Fast', 'Powerful', 'Secure'][i]}</div>
            <div style={{ marginTop: 6, fontSize: 15, color: lkx.sub }}>{struct ? ['Across every calendar on the team.', 'No back-and-forth emails.', 'Only free/busy is shared.'][i] : 'Lorem ipsum dolor sit amet consectetur.'}</div>
          </div>
        ))}
      </div>
      {Lx >= 9 ? <div style={{ position: 'absolute', left: 0, right: 0, top: heroH - 30, height: 60, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 60, whiteSpace: 'nowrap', transform: `translateX(${-((t * 60) % 600)}px)`, fontFamily: lkx.head, fontWeight: 700, fontSize: 22, color: lkx.sub, opacity: 0.7 }}>
          {Array.from({ length: 12 }, (_, i) => <span key={i}>{['Northwind', 'Acme Co', 'Globex', 'Initech', 'Umbrella', 'Hooli'][i % 6]}</span>)}</div></div> : null}
      {Lx >= 4 ? <>
        <div style={{ position: 'absolute', left: 48, right: 48, top: heroH + 400, height: 220, borderRadius: lkx.radius, background: lkx.card, border: `1px solid ${lkx.line}`, display: 'flex', gap: 16, padding: 20, boxSizing: 'border-box' }}>
          {['Free', 'Team', 'Business'].map((p, i) => <div key={p} style={{ flex: 1, borderRadius: 12, border: `1px solid ${lkx.line}`, padding: 16, background: i === 1 ? (editorial ? lkx.ink : 'rgba(255,255,255,.15)') : 'transparent', color: i === 1 && editorial ? '#f4f1ea' : lkx.ink }}><div style={{ fontWeight: 700, fontSize: 18 }}>{p}</div><div style={{ fontFamily: lkx.head, fontSize: 34, fontWeight: 700, marginTop: 10 }}>{['$0', '$8', '$16'][i]}</div><div style={{ fontSize: 13, opacity: 0.7 }}>per seat / month</div></div>)}
        </div>
        <div style={{ position: 'absolute', left: 48, right: 48, top: heroH + 650, height: 120, borderRadius: lkx.radius, background: editorial ? lkx.ink : 'rgba(255,255,255,.2)', color: editorial ? '#f4f1ea' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', fontFamily: lkx.head, fontSize: 30, fontWeight: 700 }}>Your week, sorted.<span style={{ padding: '12px 20px', borderRadius: 10, background: lkx.acc, color: editorial ? '#fff' : '#6d28d9', fontSize: 16 }}>Start free</span></div>
      </> : null}
      {act(4) ? sections.map((s, i) => { const y = [0, heroH - 40, heroH, heroH + 400, heroH + 650][i], o = clamp((a - 0.2 - i * 0.12) * 4) * (1 - E.in(lin(a, 2.4, 2.7)));
        return <div key={s} style={{ position: 'absolute', left: 12, right: 12, top: y + 6, height: [heroH - 50, 70, 300, 220, 120][i], border: '2px dashed #ff5a1f', borderRadius: 10, opacity: o }}><span style={{ position: 'absolute', left: 10, top: -14, padding: '2px 8px', background: '#ff5a1f', color: '#fff', fontFamily: '"JetBrains Mono"', fontSize: 14, fontWeight: 700 }}>{s}</span></div>; }) : null}
    </div>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0b0b0d' }}>
      {act(5) ? <>
        {bodyPage(look(4), 4)}
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - godlyWipe * 100}% 0 0)` }}>{bodyPage(lk, L)}</div>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${godlyWipe * 100}%`, width: 4, background: '#ff5a1f', boxShadow: '0 0 20px #ff5a1f', opacity: godlyWipe < 1 ? 1 : 0 }} />
      </> : bodyPage(lk, L)}
      {L === 0 || (L < 1) ? <div style={{ position: 'absolute', right: 16, bottom: 16, padding: '6px 12px', borderRadius: 8, background: '#111', color: '#fff', fontFamily: '"JetBrains Mono"', fontSize: 18 }}>purple gradient · centred · emoji · lorem</div> : null}
      {act(1) ? ['mobbin', 'godly', 'landbook'].map((s, i) => { const u = E.out(lin(a, 0.1 + i * 0.15, 0.5 + i * 0.15)) * (1 - E.in(lin(a, 1.6, 2.1)));
        return <Img key={s} src={staticFile(`sites/${s}.png`)} style={{ position: 'absolute', right: 30 + i * 40, top: 120 + i * 120, width: 420, borderRadius: 12, border: '3px solid #8fd3ff', boxShadow: '0 20px 40px rgba(0,0,0,.4)', opacity: u, transform: `translateX(${(1 - u) * 500}px) rotate(${(i - 1) * 3}deg)` }} />; }) : null}
      {act(6) ? (() => { const p = [[700, 700], [130, 490], [150, 480], [60, 600], [80, 612]], k = a; const seg = Math.min(3, Math.floor(k / 0.6)), u = E.inout((k % 0.6) / 0.45);
        const x = lerp(p[seg][0], p[Math.min(4, seg + 1)][0], u), y = lerp(p[seg][1], p[Math.min(4, seg + 1)][1], u);
        return <svg width={36} height={36} viewBox="0 0 24 24" style={{ position: 'absolute', left: x, top: y }}><path d="M4 3 L20 12 L12 14 L9 21 Z" fill="#141311" stroke="#fff" strokeWidth={1.5} /></svg>; })() : null}
      {act(7) ? [['Button', 48, 395], ['Badge', 48, 112], ['Card', 580, 140]].map(([n, x, y], i) => { const o = clamp((a - 0.2 - i * 0.2) * 4) * (1 - E.in(lin(a, 2.2, 2.6)));
        return <div key={n as string} style={{ position: 'absolute', left: (x as number) - 6, top: (y as number) - 26, padding: '2px 8px', background: '#18181b', color: '#fafafa', fontFamily: '"JetBrains Mono"', fontSize: 15, borderRadius: 6, opacity: o }}>&lt;{n} /&gt;</div>; }) : null}
      {act(10) ? (() => { const u = E.out(lin(a, 0.1, 0.4)) * (1 - E.in(lin(a, 2.6, 3.0)));
        return <div style={{ position: 'absolute', right: 24, bottom: 24, padding: '14px 18px', borderRadius: 12, background: '#141311', color: '#f4f1ea', opacity: u, transform: `translateY(${(1 - u) * 30}px)` }}>
          <div style={{ fontFamily: '"Clash Display"', fontWeight: 600, fontSize: 34 }}>Clash Display</div><div style={{ fontFamily: 'Satoshi', fontWeight: 500, fontSize: 20, marginTop: 2 }}>Satoshi · fontshare.com · ITF</div></div>; })() : null}
    </div>
  );
};
export const _h1 = h1;
