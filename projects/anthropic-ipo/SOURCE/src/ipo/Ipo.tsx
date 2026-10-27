// Anthropic IPO reel: dark hook ("Agla IPO kiska?"), then an ivory editorial-finance look. Facts: ../../FACTS.md. All charts and
// documents are our own illustrations (no screenshots, no logos: names are typography).
import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from 'remotion';
import audio from '../data/audioManifest.json';
import { TIMINGS } from '../data/version';
import { clamp, criticalSpring, easeInOutCubic, easeOutCubic, invLerp, lerp } from '../lib/anim';
import { hash } from '../lib/rng';
import { F } from '../styles/typography';
import { Grain } from '../components/Backdrop';
import { IndiaMapBlr } from '../media/IndiaMapBlr';
import { FPS, SEGS, hit, pop, shake, useScene } from '../lite/kit';
import { Ico, preloadIcons } from './icons';

preloadIcons();

const P = { ivory: '#F3EFE6', ivory2: '#E9E3D6', paper: '#FBF9F4', ink: '#1F1E1B', ink2: '#57534A', mute: '#8C877C', clay: '#D97757', clayDeep: '#B85C3E',
  green: '#2F7D4F', greenSoft: '#E3EFE6', red: '#B8463D', redSoft: '#F6E3DF', dark: '#141310', gold: '#E8B04B', line: 'rgba(31,30,27,0.12)' } as const;
const fade = (l: number, at: number, d = 12) => easeOutCubic(invLerp(at, at + d, l));
const count = (l: number, at: number, v: number, w = 5) => { const s = criticalSpring((l - at) / FPS, w); return l < at ? 0 : s > 0.996 ? v : v * s; };
const SH = '0 10px 30px rgba(31,30,27,0.12), 0 1px 3px rgba(31,30,27,0.10)';

const Head: React.FC<{ l: number; at: number; children: React.ReactNode; size?: number; color?: string; serif?: boolean; style?: React.CSSProperties }> = ({ l, at, children, size = 110, color = P.ink, serif, style }) => {
  const p = pop(l, at, 17, 0.5);
  return <div style={{ fontFamily: serif ? F.serif : F.head, fontStyle: serif ? 'italic' : undefined, fontWeight: serif ? 400 : 900, fontSize: size, lineHeight: 0.98, letterSpacing: serif ? '-0.01em' : '-0.02em',
    color, opacity: l < at ? 0 : clamp((l - at + 1) / 4), transform: `translateY(${(1 - p) * 34}px) scale(${0.92 + 0.08 * p})`, transformOrigin: '50% 80%', ...style }}>{children}</div>;
};
const Kick: React.FC<{ text: string; p: number; color?: string; y?: number; dark?: boolean }> = ({ text, p, color = P.clay, y = 250, dark }) => (
  <div style={{ position: 'absolute', left: 120, right: 120, top: y, display: 'flex', justifyContent: 'center', opacity: clamp(p * 1.5), transform: `translateY(${(1 - p) * 14}px)` }}>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderRadius: 999, background: dark ? 'rgba(255,255,255,0.06)' : P.paper, border: `1.5px solid ${color}`,
      fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: '0.12em', color: dark ? P.ivory : P.ink, whiteSpace: 'nowrap' }}>
      <span style={{ width: 12, height: 12, borderRadius: 6, background: color }} />{text}</span>
  </div>
);
const Card: React.FC<{ x: number; y: number; w: number; h?: number; p: number; children: React.ReactNode; bg?: string; border?: string; style?: React.CSSProperties }> = ({ x, y, w, h, p, children, bg = P.paper, border = P.line, style }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 22, background: bg, border: `1.5px solid ${border}`, boxShadow: SH, opacity: clamp(p * 1.4),
    transform: `translateY(${(1 - p) * 40}px) scale(${0.96 + 0.04 * p})`, boxSizing: 'border-box', ...style }}>{children}</div>
);
const Chip: React.FC<{ text: string; p: number; color?: string; bg?: string; size?: number; ic?: string; icColor?: string }> = ({ text, p, color = P.ink, bg = P.paper, size = 34, ic, icColor }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.35, padding: `${size * 0.32}px ${size * 0.7}px`, borderRadius: 999, background: bg, border: `1.5px solid ${P.line}`, boxShadow: SH, color,
    fontFamily: F.head, fontWeight: 800, fontSize: size, whiteSpace: 'nowrap', opacity: clamp(p * 1.4), transform: `scale(${0.7 + 0.3 * p})` }}>
    {ic ? <Ico n={ic} size={size * 1.1} color={icColor ?? color} /> : null}{text}</span>
);
/** faint drifting icons behind a scene (themed per scene) */
const Drift: React.FC<{ icons: string[]; color?: string; opacity?: number; seed?: number }> = ({ icons, color = P.ink, opacity = 0.07, seed = 1 }) => {
  const f = useCurrentFrame();
  return (<>{Array.from({ length: 9 }, (_, i) => {
    const x = 60 + hash(seed, i, 1) * 900, y0 = 300 + hash(seed, i, 2) * 1100, sz = 70 + hash(seed, i, 3) * 90, sp = 0.15 + hash(seed, i, 4) * 0.35;
    const y = ((y0 - f * sp) % 1200 + 1200) % 1200 + 260;
    return <div key={i} style={{ position: 'absolute', left: x, top: y, opacity, transform: `rotate(${-20 + hash(seed, i, 5) * 40 + f * 0.05 * (i % 2 ? 1 : -1)}deg)` }}><Ico n={icons[i % icons.length]} size={sz} color={color} /></div>;
  })}</>);
};
const Src: React.FC<{ text: string; dark?: boolean }> = ({ text, dark }) => (
  <div style={{ position: 'absolute', left: 120, right: 120, top: 1352, textAlign: 'center', fontFamily: F.mono, fontSize: 19, letterSpacing: '0.06em', color: dark ? 'rgba(243,239,230,0.6)' : P.mute }}>{text}</div>
);
const Ivory: React.FC<{ children: React.ReactNode; l: number; drift?: string[]; seed?: number }> = ({ children, l, drift, seed }) => {
  const f = useCurrentFrame(), p = easeOutCubic(invLerp(0, 10, l));
  return (
    <AbsoluteFill style={{ background: P.ivory }}>
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${P.line} 1px, transparent 1px), linear-gradient(90deg, ${P.line} 1px, transparent 1px)`, backgroundSize: '72px 72px', opacity: 0.35,
        backgroundPosition: `${(f * 0.4) % 72}px ${(f * 0.6) % 72}px` }} />
      {drift ? <Drift icons={drift} seed={seed} /> : null}
      <AbsoluteFill style={{ transform: `translateY(${(1 - p) * 80}px)`, opacity: clamp(p * 1.5) }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
const Flash: React.FC<{ l: number; at: number; color?: string; max?: number }> = ({ l, at, color = '#fff', max = 0.5 }) =>
  l >= at && l < at + 6 ? <AbsoluteFill style={{ background: color, opacity: max * (1 - (l - at) / 6) }} /> : null;

// ---------------------------------------------------------------- 1. hook (dark)
const Tape: React.FC<{ f: number; y: number; dir: 1 | -1; seed: number }> = ({ f, y, dir, seed }) => (
  <div style={{ position: 'absolute', left: 0, top: y, height: 70, width: 1080, overflow: 'hidden', borderTop: '1px solid rgba(243,239,230,0.12)', borderBottom: '1px solid rgba(243,239,230,0.12)' }}>
    <div style={{ position: 'absolute', top: 14, whiteSpace: 'nowrap', transform: `translateX(${((dir * f * 3) % 1400) - 1400}px)`, fontFamily: F.mono, fontWeight: 700, fontSize: 34, color: 'rgba(243,239,230,0.55)' }}>
      {Array.from({ length: 24 }, (_, i) => {
        const up = hash(seed, i) > 0.4;
        return <span key={i} style={{ marginRight: 46 }}>??? <span style={{ color: up ? '#5BC48A' : '#E06A5E' }}>{up ? '▲' : '▼'}</span></span>;
      })}
    </div>
  </div>
);
const Hook: React.FC = () => {
  const { f, l, at } = useScene('hook');
  const agla = at('h1', 'Agla'), ipo = at('h1', 'IPO'), kiska = at('h1', 'kiska');
  const sk = shake(l, [ipo, kiska], 10);
  return (
    <AbsoluteFill style={{ background: P.dark, transform: `translate(${sk.x}px, ${sk.y}px)` }}>
      <AbsoluteFill style={{ background: 'radial-gradient(60% 40% at 50% 45%, rgba(217,119,87,0.32) 0%, rgba(0,0,0,0) 70%)' }} />
      <Tape f={f} y={250} dir={1} seed={3} /><Tape f={f} y={1250} dir={-1} seed={7} />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const x = 120 + hash(i, 9) * 840, y = 420 + hash(i, 4) * 760, s = 60 + hash(i, 2) * 90;
        return <div key={i} style={{ position: 'absolute', left: x, top: y + 18 * Math.sin(f / 22 + i), fontFamily: F.serif, fontStyle: 'italic', fontSize: s, color: 'rgba(232,176,75,0.28)', transform: `rotate(${-14 + hash(i, 1) * 28}deg)` }}>?</div>;
      })}
      <div style={{ position: 'absolute', left: 100, right: 100, top: 430, textAlign: 'center' }}>
        <Head l={l} at={-4} size={112} color={P.ivory}>KYA LAGTA HAI?</Head>
        <Head l={l} at={agla} size={150} color={P.gold} style={{ marginTop: 36 }}>AGLA IPO</Head>
        <Head l={l} at={kiska} size={150} color={P.ivory}>KISKA HOGA?</Head>
      </div>
      {/* the opening bell rings on "IPO" */}
      <svg width={180} height={180} viewBox="-50 -50 100 100" style={{ position: 'absolute', left: 450, top: 1120, opacity: fade(l, ipo - 4), transform: `rotate(${l >= ipo ? 18 * Math.sin((l - ipo) / 2.5) * Math.exp(-(l - ipo) / 30) : 0}deg)` }}>
        <path d="M-28 18 C-28 -20 -16 -34 0 -34 C16 -34 28 -20 28 18 L36 26 L-36 26 Z" fill="none" stroke={P.gold} strokeWidth={6} strokeLinejoin="round" />
        <circle cx={0} cy={34} r={7} fill={P.gold} /><path d="M0 -34 L0 -44" stroke={P.gold} strokeWidth={6} strokeLinecap="round" />
      </svg>
      <Drift icons={['rocket', 'trending-up', 'bell', 'chart-line', 'circle-help']} color={P.gold} opacity={0.12} seed={11} />
      <Flash l={l} at={kiska} color={P.gold} max={0.25} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 2. reveal
const Reveal: React.FC = () => {
  const { l, at } = useScene('reveal');
  const ai = at('h2', 'AI'), cl = at('h2', 'Claude'), st = at('h2', 'stock');
  const letters = 'ANTHROPIC'.split('');
  const pts = Array.from({ length: 12 }, (_, i) => [i * 70, 200 - i * 14 - 30 * Math.sin(i * 1.3) * (i % 3 === 0 ? 1 : 0.4)]);
  const draw = easeInOutCubic(invLerp(st - 4, st + 50, l));
  return (
    <Ivory l={l} drift={['sparkles', 'cpu', 'trending-up', 'bell']} seed={2}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 250, display: 'flex', justifyContent: 'center', transform: `scale(${pop(l, 0, 14, 0.5)}) rotate(${(1 - pop(l, 0, 14, 0.5)) * -40}deg)` }}>
        <Ico n="anthropic" size={70} color={P.ink} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', whiteSpace: 'nowrap' }}>
        {letters.map((c, i) => { const p = pop(l, 2 + i * 3, 18, 0.5); return (
          <span key={i} style={{ display: 'inline-block', fontFamily: F.head, fontWeight: 900, fontSize: 124, color: P.ink, opacity: clamp((l - 2 - i * 3) / 3), transform: `translateY(${(1 - p) * 60}px)` }}>{c}</span>); })}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 520, display: 'flex', justifyContent: 'center', gap: 16 }}>
        <Chip text="Badi AI company" p={pop(l, ai)} color={P.clayDeep} ic="sparkles" />
        <Chip text="Claude banati hai" p={pop(l, cl)} ic="claude" icColor={P.clay} />
      </div>
      <Card x={120} y={680} w={840} h={520} p={pop(l, st - 8)} style={{ padding: '30px 34px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: F.head, fontWeight: 900, fontSize: 52, color: P.ink }}><Ico n="trending-up" size={54} color={P.green} />Stock market</span>
          <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 22, color: P.mute }}>ILLUSTRATION</span>
        </div>
        <svg width={772} height={340} viewBox="-10 -20 790 300" style={{ marginTop: 20 }}>
          {[0, 1, 2, 3].map((k) => <line key={k} x1={0} x2={770} y1={k * 70} y2={k * 70} stroke={P.line} strokeWidth={2} />)}
          <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={P.green} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={1400} strokeDashoffset={1400 * (1 - draw)} />
          {draw > 0.98 ? <circle cx={pts[11][0]} cy={pts[11][1]} r={14} fill={P.green} /> : null}
        </svg>
      </Card>
      <Flash l={l} at={0} max={0.6} />
    </Ivory>
  );
};

// ---------------------------------------------------------------- 3. filing
const Filing: React.FC = () => {
  const { f, l, at } = useScene('filing');
  const oct = at('l1', '26'), file = at('l1', 'file'), nas = at('l1', 'Nasdaq'), tick = at('l1', 'ticker:');
  const board = l >= nas - 8;
  return (
    <Ivory l={l} drift={['file-text', 'landmark', 'stamp', 'gavel']} seed={3}>
      <Kick text="OCT 26, 2026 · U.S. SEC" p={fade(l, Math.max(2, oct))} />
      {/* the S-1 document (our illustration) */}
      <Card x={150} y={350} w={780} h={board ? 430 : 640} p={pop(l, 4)} style={{ padding: '34px 40px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><Ico n="landmark" size={46} color={P.ink2} />
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 22, color: P.mute, letterSpacing: '0.1em', maxWidth: 520 }}>UNITED STATES SECURITIES AND EXCHANGE COMMISSION</div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 10 }}><Ico n="file-text" size={84} color={P.clay} /><span style={{ fontFamily: F.head, fontWeight: 900, fontSize: 96, color: P.ink }}>FORM S-1</span></div>
        <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 36, color: P.ink2, maxWidth: 520 }}>Anthropic, PBC · Class A common stock</div>
        {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{ height: 14, borderRadius: 7, background: P.ivory2, marginTop: i ? 16 : 30, width: `${92 - hash(i, 5) * 30}%` }} />)}
        {l >= file ? <div style={{ position: 'absolute', right: 34, top: 40, transform: `rotate(-10deg) scale(${2 - pop(l, file, 20, 0.4)})`, opacity: clamp((l - file) / 3),
          padding: '12px 22px', border: `6px solid ${P.clay}`, borderRadius: 14, color: P.clay, fontFamily: F.head, fontWeight: 900, fontSize: 52, background: 'rgba(251,249,244,0.85)' }}>FILED</div> : null}
      </Card>
      {board ? (
        <div style={{ position: 'absolute', left: 90, width: 900, top: 820, borderRadius: 24, background: P.dark, padding: '28px 34px', boxSizing: 'border-box', boxShadow: SH, opacity: fade(l, nas - 8), transform: `translateY(${(1 - fade(l, nas - 8, 14)) * 50}px)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><Ico n="chart-line" size={36} color={P.gold} /><span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: '0.18em', color: P.gold }}>NASDAQ GLOBAL SELECT MARKET</span>
            <span style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 8, border: '1.5px solid rgba(243,239,230,0.3)', fontFamily: F.mono, fontWeight: 700, fontSize: 22, color: P.ivory }}>CLASS A</span></div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, marginTop: 10 }}>
            <span style={{ fontFamily: F.mono, fontWeight: 800, fontSize: 200, color: P.ivory, lineHeight: 1, letterSpacing: '0.06em', transform: `scale(${l >= tick ? 1 + 0.06 * hit(l, tick, 20) : 1})`, display: 'inline-block',
              textShadow: l >= tick ? `0 0 ${30 * hit(l, tick, 30)}px ${P.gold}` : undefined, opacity: l >= tick - 4 ? 1 : 0.25 }}>ANT</span>
            <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: 'rgba(243,239,230,0.7)' }}>price: TBD</span>
          </div>
          <div style={{ height: 6, marginTop: 14, borderRadius: 3, background: `repeating-linear-gradient(90deg, ${P.gold} 0 18px, transparent 18px 30px)`, backgroundPositionX: `${-f * 2}px`, opacity: 0.7 }} />
        </div>
      ) : null}
      <Src text="Source: Anthropic, Oct 26, 2026 · document is an illustration" />
    </Ivory>
  );
};

// ---------------------------------------------------------------- 4. tbd
const Tbd: React.FC = () => {
  const { f, l, at } = useScene('tbd');
  const dec = at('l2', 'decide');
  const Field: React.FC<{ y: number; label: string; a: number }> = ({ y, label, a }) => (
    <Card x={150} y={y} w={780} p={pop(l, a)} style={{ padding: '26px 34px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Ico n="circle-help" size={34} color={P.clay} /><span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 24, color: P.mute, letterSpacing: '0.1em' }}>{label}</span></div>
      <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 84, color: P.ink, marginTop: 6 }}>— — —<span style={{ opacity: Math.floor(f / 15) % 2 ? 1 : 0, color: P.clay }}>|</span></div>
    </Card>
  );
  return (
    <Ivory l={l} drift={['circle-help', 'scale', 'calendar']} seed={4}>
      <div style={{ position: 'absolute', left: 100, right: 100, top: 280, textAlign: 'center' }}><Head l={l} at={2} size={92} serif>Kitne shares? Kis price pe?</Head></div>
      <Field y={480} label="NUMBER OF SHARES" a={6} />
      <Field y={720} label="PRICE RANGE" a={14} />
      {l >= dec ? <div style={{ position: 'absolute', left: 0, right: 0, top: 980, textAlign: 'center', transform: `rotate(-4deg) scale(${1.8 - 0.8 * pop(l, dec, 20, 0.42)})`, opacity: clamp((l - dec) / 3) }}>
        <span style={{ padding: '14px 26px', border: `6px solid ${P.clayDeep}`, borderRadius: 14, color: P.clayDeep, fontFamily: F.head, fontWeight: 900, fontSize: 58, background: P.paper }}>NOT YET DETERMINED</span>
      </div> : null}
      <div style={{ position: 'absolute', left: 120, right: 120, top: 1140, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap', opacity: fade(l, dec + 10) }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: F.mono, fontWeight: 700, fontSize: 22, color: P.mute }}><Ico n="handshake" size={30} color={P.mute} />PROSPECTUS</span>
        <Chip text="Goldman Sachs" ic="goldmansachs" icColor="#6F9FD8" p={pop(l, dec + 10)} size={30} /><Chip text="Morgan Stanley" ic="landmark" p={pop(l, dec + 16)} size={30} />
      </div>
      <Src text="Source: Anthropic S-1 announcement, Oct 26, 2026" />
    </Ivory>
  );
};

// ---------------------------------------------------------------- 5. revenue
const Revenue: React.FC = () => {
  const { l, at } = useScene('revenue');
  const big = at('l3', '16.3'), old = at('l3', '4.6');
  const H = 620, S = H / 16.3;
  const bars = [{ k: 'Full year 2025', v: 4.6, a: Math.min(old, big + 60), c: P.ivory2, t: P.ink2 }, { k: 'H1 2026 · 6 months', v: 16.3, a: big - 6, c: P.green, t: P.green }];
  return (
    <Ivory l={l} drift={['dollar-sign', 'banknote', 'chart-column', 'trending-up']} seed={5}>
      <Kick text="REVENUE · S-1 FILING" p={fade(l, 2)} color={P.green} />
      {l >= big ? Array.from({ length: 10 }, (_, i) => {
        const t = ((l - big) * 1.2 + i * 37) % 260, x = 630 + (hash(i, 7) - 0.5) * 240;
        return <div key={i} style={{ position: 'absolute', left: x, top: 640 - t, opacity: 0.85 * (1 - t / 260) }}><Ico n={i % 2 ? 'dollar-sign' : 'banknote'} size={46} color={P.green} /></div>;
      }) : null}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 340, height: 820, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 90 }}>
        {bars.map((b) => {
          const v = count(l, b.a, b.v, 4);
          return (
            <div key={b.k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 84, color: b.t, opacity: l >= b.a ? 1 : 0 }}>${v.toFixed(1)}B</div>
              <div style={{ position: 'relative', overflow: 'hidden', width: 270, height: Math.max(6, v * S) * (1 + 0.012 * Math.sin(l / 9)), borderRadius: '22px 22px 6px 6px', background: b.c, border: `1.5px solid ${P.line}`, boxShadow: SH }}>
                <div style={{ position: 'absolute', left: 0, right: 0, height: 160, top: ((l * 6) % 900) - 200, background: 'linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.35), rgba(255,255,255,0))' }} />
              </div>
              <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 24, color: P.ink2 }}>{b.k}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1210, display: 'flex', justifyContent: 'center' }}>
        <Chip text="6 mahine > poore 2025 ka 3.5x" p={pop(l, old + 30)} color={P.green} bg={P.greenSoft} size={36} ic="trending-up" />
      </div>
      <Src text="Source: Anthropic S-1, via Yahoo Finance (Oct 26, 2026)" />
    </Ivory>
  );
};

// ---------------------------------------------------------------- 6. risk
const Risk: React.FC = () => {
  const { l, at } = useScene('risk');
  const comp = at('l4', '430'), loss = at('l4', '80.7'), acc = at('l4', 'accounting');
  return (
    <Ivory l={l} drift={['cpu', 'server', 'zap', 'scale']} seed={6}>
      <div style={{ position: 'absolute', left: 100, right: 100, top: 270, textAlign: 'center' }}><Head l={l} at={2} size={96} serif color={P.clayDeep}>Lekin kharche bhi bade…</Head></div>
      <Card x={120} y={430} w={840} h={400} p={pop(l, comp - 6)} style={{ padding: '30px 36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Ico n="server" size={34} color={P.ink2} /><span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 24, color: P.mute, letterSpacing: '0.1em' }}>LOCKED-IN COMPUTE DEALS</span></div>
        <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 130, color: P.ink, lineHeight: 1.05 }}>${Math.round(count(l, comp, 430, 4))}B+</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          {Array.from({ length: 12 }, (_, i) => <div key={i} style={{ width: 52, height: 84, borderRadius: 8, background: P.dark, opacity: clamp(pop(l, comp + 6 + i * 3) * 1.4), transform: `translateY(${(1 - pop(l, comp + 6 + i * 3)) * 30}px)`,
            backgroundImage: `repeating-linear-gradient(180deg, transparent 0 14px, ${i % 2 ? P.gold : '#5BC48A'} 14px 17px)` }} />)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <Chip text="Amazon" ic="amazon" icColor="#E8932A" p={pop(l, comp + 30)} size={28} /><Chip text="Google" ic="google" icColor="#4A84E8" p={pop(l, comp + 36)} size={28} />
          <span style={{ fontFamily: F.head, fontWeight: 700, fontSize: 26, color: P.ink2 }}>jaise partners</span></div>
      </Card>
      <Card x={120} y={870} w={840} h={340} p={pop(l, loss - 6)} bg={P.redSoft} border="rgba(184,70,61,0.3)" style={{ padding: '30px 36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Ico n="triangle-alert" size={34} color={P.red} /><span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 24, color: P.red, letterSpacing: '0.1em' }}>NET LOSS · H1 2026</span></div>
        <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 130, color: P.red, lineHeight: 1.05 }}>−${count(l, loss, 80.7, 4).toFixed(1)}B</div>
        <div style={{ fontFamily: F.head, fontWeight: 700, fontSize: 30, color: P.ink2, opacity: fade(l, acc) }}>zyada tar accounting charges se</div>
      </Card>
      <Src text="Source: Anthropic S-1, via Yahoo Finance (Oct 26, 2026)" />
    </Ivory>
  );
};

// ---------------------------------------------------------------- 7. india
const India: React.FC = () => {
  const { l, dur, at } = useScene('india');
  const blr = at('l5', 'Bengaluru'), sec = at('l5', 'second-largest');
  return (
    <Ivory l={l} drift={['map-pin', 'globe', 'plane', 'building-2']} seed={7}>
      <Kick text="ANTHROPIC × INDIA" p={fade(l, 2)} />
      <div style={{ position: 'absolute', left: 90, top: 330, width: 900, height: 760, borderRadius: 26, overflow: 'hidden', boxShadow: SH, opacity: fade(l, 4) }}>
        <IndiaMapBlr w={900} h={760} f={l} dur={dur} />
        <div style={{ position: 'absolute', left: 24, bottom: 24, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderRadius: 14, background: 'rgba(251,249,244,0.94)', opacity: fade(l, sec + 24),
          transform: `translateY(${(1 - fade(l, sec + 24, 14)) * 30}px)` }}>
          <Ico n="trending-up" size={34} color={P.green} /><span style={{ fontFamily: F.head, fontWeight: 800, fontSize: 28, color: P.ink }}>India run-rate revenue 2x</span>
          <span style={{ fontFamily: F.mono, fontSize: 19, color: P.mute }}>since Oct 2025</span>
        </div>
        <div style={{ position: 'absolute', left: 24, top: 24, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12, background: 'rgba(251,249,244,0.94)', opacity: fade(l, blr) }}>
          <Ico n="anthropic" size={28} color={P.ink} /><Ico n="building-2" size={30} color={P.clay} /><span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 20, color: P.ink }}>MD: IRINA GHOSE</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 120, top: 1110, display: 'flex', gap: 14, flexWrap: 'wrap', width: 840 }}>
        <Chip text="Bengaluru office · Feb 2026" p={pop(l, blr)} ic="map-pin" icColor={P.clay} />
        <Chip text="Asia mein 2nd, Tokyo ke baad" p={pop(l, blr + 14)} size={28} color={P.ink2} ic="plane" />
      </div>
      {l >= sec - 6 ? (
        <div style={{ position: 'absolute', right: 110, top: 360, width: 250, height: 250, borderRadius: 125, background: P.clay, color: P.paper, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: SH, transform: `scale(${pop(l, sec - 6, 16, 0.45)}) rotate(${-8 + 8 * pop(l, sec - 6)}deg)` }}>
          <Ico n="claude" size={44} color={P.paper} /><span style={{ fontFamily: F.head, fontWeight: 900, fontSize: 96, lineHeight: 1 }}>#2</span>
          <span style={{ fontFamily: F.head, fontWeight: 800, fontSize: 24, textAlign: 'center', lineHeight: 1.1 }}>Claude ka market<br />(company)</span>
        </div>
      ) : null}
      <Src text="Source: Anthropic via Business Today (Feb 16, 2026) · map: illustration" />
    </Ivory>
  );
};

const India2: React.FC = () => {
  const { l, at } = useScene('india2');
  const lang = at('l6', '10'), air = at('l6', 'Air'), cred = at('l6', 'CRED,'), raz = at('l6', 'Razorpay'), hire = at('l6', 'hiring');
  return (
    <Ivory l={l} drift={['languages', 'graduation-cap', 'users', 'handshake']} seed={8}>
      <Card x={120} y={290} w={840} h={330} p={pop(l, Math.max(2, lang - 4))} style={{ padding: '26px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Ico n="languages" size={36} color={P.clay} /><span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 24, color: P.mute, letterSpacing: '0.1em' }}>INDIAN LANGUAGES</span></div>
        <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 96, color: P.clayDeep, lineHeight: 1.05 }}>10 languages</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
          {['Hindi', 'Bengali', 'Tamil', 'Urdu', '+6'].map((t, i) => <Chip key={t} text={t} p={pop(l, lang + 6 + i * 4)} size={30} />)}
        </div>
      </Card>
      <Card x={120} y={660} w={840} h={330} p={pop(l, air - 6)} style={{ padding: '26px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Ico n="handshake" size={36} color={P.clay} /><span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 24, color: P.mute, letterSpacing: '0.1em' }}>INDIAN PARTNERS (SOME)</span></div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 20 }}>
          <Chip text="Air India" ic="airindia" icColor="#C8102E" p={pop(l, air)} size={42} /><Chip text="CRED" ic="credit-card" p={pop(l, cred)} size={42} />
          <Chip text="Razorpay" ic="razorpay" icColor="#3395FF" p={pop(l, raz)} size={42} /><Chip text="Cognizant" ic="cognizant" icColor="#1A4CA1" p={pop(l, raz + 12)} size={42} />
        </div>
      </Card>
      <Card x={120} y={1030} w={840} h={240} p={pop(l, hire - 6)} bg={P.greenSoft} border="rgba(47,125,79,0.3)" style={{ padding: '26px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Ico n="users" size={36} color={P.green} /><span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 24, color: P.green, letterSpacing: '0.1em' }}>BENGALURU HIRING</span></div>
        <div style={{ display: 'flex', gap: 18, marginTop: 14 }}>
          {[{ t: 'Technical', i: 'cpu' }, { t: 'Research', i: 'search' }, { t: 'Business', i: 'briefcase' }].map((r, k) => (
            <div key={r.t} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 16, background: P.paper, border: `1.5px solid ${P.line}`,
              opacity: clamp(pop(l, hire + k * 6) * 1.4), transform: `scale(${0.8 + 0.2 * pop(l, hire + k * 6)})` }}>
              <Ico n={r.i} size={42} color={P.green} /><span style={{ fontFamily: F.head, fontWeight: 900, fontSize: 36, color: P.ink }}>{r.t}</span></div>
          ))}
        </div>
      </Card>
      <Src text="Source: Anthropic via Business Today (Feb 16, 2026)" />
    </Ivory>
  );
};

// ---------------------------------------------------------------- 9. invest
const Invest: React.FC = () => {
  const { l, at } = useScene('invest');
  const list = at('l7', 'Listing'), brk = at('l7', 'international'), lrs = at('l7', 'LRS');
  const steps = [
    { t: 'Aap (India)', s: 'Rupee se shuru', a: 4, c: P.ink, i: 'indian-rupee' },
    { t: 'LRS route (RBI)', s: 'up to $250,000 / saal', a: lrs, c: P.clayDeep, i: 'landmark' },
    { t: 'International broker', s: 'US stocks account', a: brk, c: P.ink, i: 'wallet' },
    { t: 'Nasdaq: ANT', s: 'listing ke baad hi', a: list, c: P.green, i: 'chart-line' },
  ];
  const order = [0, 3, 2, 1];   // the voice says listing -> broker -> LRS; the cards keep the money-flow order
  void order;
  return (
    <Ivory l={l} drift={['wallet', 'indian-rupee', 'dollar-sign', 'hand-coins']} seed={9}>
      <div style={{ position: 'absolute', left: 100, right: 100, top: 270, textAlign: 'center' }}><Head l={l} at={2} size={96} serif>Invest kaise karein?</Head></div>
      {steps.map((s, i) => (
        <React.Fragment key={s.t}>
          <Card x={150} y={420 + i * 220} w={780} h={170} p={pop(l, s.a)} border={l >= s.a ? s.c : P.line} style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 26 }}>
            <div style={{ width: 92, height: 92, borderRadius: 20, background: `${s.c}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Ico n={s.i} size={54} color={s.c} /></div>
            <div>
              <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 50, color: P.ink }}>{s.t}</div>
              <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, color: P.ink2 }}>{s.s}</div>
            </div>
          </Card>
          {i < 3 ? <div style={{ position: 'absolute', left: 536, top: 590 + i * 220, width: 8, height: 50, borderRadius: 4, background: `repeating-linear-gradient(180deg, ${P.clay} 0 10px, transparent 10px 18px)`, backgroundPositionY: `${(l * 1.5) % 18}px`, opacity: 0.7 }} /> : null}
        </React.Fragment>
      ))}
      {(() => {   // a coin travels down the flow: rupee until the LRS step, dollar after it
        const u = clamp((l - 20) / 200), y = 470 + u * 660, usd = u > 0.36;
        return <div style={{ position: 'absolute', left: 860, top: y, width: 70, height: 70, borderRadius: 35, background: usd ? P.green : P.gold, boxShadow: SH, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `scaleX(${Math.cos(l / 6)})` }}><Ico n={usd ? 'dollar-sign' : 'indian-rupee'} size={40} color={P.paper} /></div>;
      })()}
      <Src text="LRS limit per RBI rules · check your broker, tax & TCS before investing" />
    </Ivory>
  );
};

// ---------------------------------------------------------------- 10. caution
const Caution: React.FC = () => {
  const { l, at } = useScene('caution');
  const al = at('l8', 'allotment'), fin = at('l8', 'financial'), risk = at('l8', 'Risk');
  const items = [{ t: 'IPO allotment India se: mushkil', a: al, i: 'circle-help' }, { t: 'Ye financial advice nahi', a: fin, i: 'shield-alert' }, { t: 'Tax / TCS rules check karo', a: fin + 20, i: 'gavel' }, { t: 'Risk samjho, phir socho', a: risk, i: 'scale' }];
  return (
    <Ivory l={l} drift={['triangle-alert', 'shield-alert', 'scale']} seed={10}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center' }}>
        <svg width={170} height={150} viewBox="0 0 100 88" style={{ transform: `scale(${pop(l, 2)})` }}><path d="M50 4 L96 84 L4 84 Z" fill={P.gold} stroke={P.ink} strokeWidth={4} strokeLinejoin="round" />
          <path d="M50 32 V56 M50 68 V70" stroke={P.ink} strokeWidth={8} strokeLinecap="round" /></svg>
        <Head l={l} at={6} size={100}>DHYAAN SE!</Head>
      </div>
      {items.map((it, i) => (
        <Card key={it.t} x={150} y={640 + i * 150} w={780} h={124} p={pop(l, it.a)} style={{ padding: '0 30px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <Ico n={it.i} size={52} color={i === 1 ? P.red : P.clay} />
          <span style={{ fontFamily: F.head, fontWeight: 800, fontSize: 44, color: P.ink }}>{it.t}</span>
        </Card>
      ))}
    </Ivory>
  );
};

// ---------------------------------------------------------------- 11. cta
const Cta: React.FC = () => {
  const { l, at } = useScene('cta');
  const daav = at('l9', 'daav'), com = at('l9', 'Comment');
  return (
    <AbsoluteFill style={{ background: P.dark }}>
      <AbsoluteFill style={{ background: 'radial-gradient(60% 40% at 50% 40%, rgba(217,119,87,0.3) 0%, rgba(0,0,0,0) 70%)' }} />
      <Drift icons={['bell', 'trending-up', 'message-circle', 'rocket']} color={P.gold} opacity={0.1} seed={12} />
      <div style={{ position: 'absolute', left: 100, right: 100, top: 300, textAlign: 'center' }}>
        <Head l={l} at={2} size={96} serif color={P.ivory}>Aap ANT pe</Head>
        <Head l={l} at={daav} size={150} color={P.gold}>DAAV LAGAOGE?</Head>
      </div>
      <div style={{ position: 'absolute', left: 150, right: 150, top: 720, display: 'flex', gap: 30 }}>
        {[{ t: 'HAAN', c: P.green, i: 'rocket' }, { t: 'NAHI', c: P.red, i: 'shield-alert' }].map((b, i) => (
          <div key={b.t} style={{ flex: 1, padding: '34px 0', borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'rgba(243,239,230,0.06)', border: `3px solid ${b.c}`, fontFamily: F.head, fontWeight: 900, fontSize: 64, color: P.ivory,
            transform: `scale(${0.85 + 0.15 * pop(l, daav + 6 + i * 6)})`, opacity: fade(l, daav + 6 + i * 6) }}><Ico n={b.i} size={56} color={b.c} />{b.t}</div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 960, textAlign: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 16, padding: '20px 44px', borderRadius: 999, background: P.clay, color: P.paper, fontFamily: F.head, fontWeight: 900, fontSize: 60, transform: `scale(${0.85 + 0.15 * pop(l, com)})`, opacity: fade(l, com - 6) }}><Ico n="message-circle" size={60} color={P.paper} />COMMENT KARO</span>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1110, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, opacity: fade(l, 10) }}>
        <Img src={staticFile('brand/techpe-trek.jpg')} style={{ width: 56, height: 56, borderRadius: 14 }} />
        <span style={{ fontFamily: F.head, fontWeight: 800, fontSize: 34, color: P.ivory }}>TechpeTrek</span>
      </div>
      <Src dark text="Sources: Anthropic (Oct 26) · S-1 via Yahoo Finance · Business Today · Not financial advice" />
    </AbsoluteFill>
  );
};

const SCENES: Record<string, React.FC> = { hook: Hook, reveal: Reveal, filing: Filing, tbd: Tbd, revenue: Revenue, risk: Risk, india: India, india2: India2, invest: Invest, caution: Caution, cta: Cta };
const DARK = new Set(['hook', 'cta']);

interface Word { w: string; t0: number; t1: number }
const CAPS: { words: Word[] }[] = (TIMINGS as unknown as { variants: { reel: { captions: { words: Word[] }[] } } }).variants.reel.captions;
const GROUPS: Word[][] = CAPS.flatMap((c) => { const n = Math.ceil(c.words.length / 6), sz = Math.ceil(c.words.length / n), o: Word[][] = []; for (let i = 0; i < c.words.length; i += sz) o.push(c.words.slice(i, i + sz)); return o; });
const KEY = /^(IPO|Anthropic|AI|Claude|stock|SEC|S-1|Nasdaq|ANT|shares|price|revenue|billion|dollar|compute|loss|India|Bengaluru|second-largest|languages|CRED|Razorpay|Air|hiring|LRS|broker|allotment|advice|Risk|Comment|daav)/i;
const Captions: React.FC<{ dark: boolean }> = ({ dark }) => {
  const f = useCurrentFrame(), t = f / FPS;
  const i = GROUPS.findIndex((g, k) => t >= g[0].t0 - 0.05 && t < Math.min(g[g.length - 1].t1 + 0.45, (GROUPS[k + 1]?.[0].t0 ?? 1e9) - 0.05));
  if (i < 0) return null;
  const g = GROUPS[i], p = easeOutCubic(invLerp(g[0].t0 - 0.05, g[0].t0 + 0.1, t));
  return (
    <div style={{ position: 'absolute', left: 120, right: 120, top: 1420, display: 'flex', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ textAlign: 'center', padding: '10px 24px', borderRadius: 14, background: dark ? 'rgba(243,239,230,0.1)' : P.ink, opacity: p, transform: `translateY(${(1 - p) * 12}px)`,
        fontFamily: F.head, fontWeight: 800, fontSize: g.map((w) => w.w).join(' ').length > 34 ? 46 : 54, lineHeight: 1.12 }}>
        {g.map((w, k) => {
          const sp = t >= w.t0 - 0.03, key = KEY.test(w.w) || /\d/.test(w.w), pp = 1 - clamp((t - w.t0 + 0.03) / 0.16);
          return <React.Fragment key={k}><span style={{ display: 'inline-block', color: sp ? (key ? P.gold : P.ivory) : 'rgba(243,239,230,0.45)', transform: sp && pp > 0 ? `scale(${1 + 0.1 * pp})` : undefined }}>{w.w}</span>{k < g.length - 1 ? ' ' : ''}</React.Fragment>;
        })}
      </div>
    </div>
  );
};
const Progress: React.FC = () => {
  const f = useCurrentFrame(), last = SEGS[SEGS.length - 1];
  return <div style={{ position: 'absolute', left: 120, top: 1596, height: 6, borderRadius: 3, width: 840 * clamp(f / (last.from + last.durationInFrames)), background: P.clay, opacity: 0.8 }} />;
};

/** scene transition: a skewed clay / ink panel with the next scene's icon sweeps across (16 frames) */
const WIPE_ICON: Record<string, string> = { reveal: 'anthropic', filing: 'file-text', tbd: 'circle-help', revenue: 'chart-column', risk: 'server', india: 'map-pin', india2: 'languages', invest: 'wallet', caution: 'triangle-alert', cta: 'message-circle' };
const Wipe: React.FC<{ id: string; l: number; k: number }> = ({ id, l, k }) => {
  if (l >= 16 || !WIPE_ICON[id]) return null;
  const u = easeInOutCubic(l / 16), x = lerp(0, 1500, u), c = k % 2 ? P.ink : P.clay;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 60 }}>
      <div style={{ position: 'absolute', left: -300 + x, top: -200, width: 1700, height: 2400, background: c, transform: 'skewX(-14deg)', display: 'flex', alignItems: 'center', paddingLeft: 760 }}>
        <div style={{ transform: `skewX(14deg) scale(${1 + 0.3 * u})` }}><Ico n={WIPE_ICON[id]} size={200} color={P.paper} /></div>
      </div>
    </AbsoluteFill>
  );
};
const TICK = 'ANTHROPIC IPO  ·  S-1 FILED OCT 26, 2026  ·  NASDAQ: ANT  ·  H1 2026 REVENUE $16.3B  ·  BENGALURU OFFICE  ·  CLAUDE: INDIA #2 MARKET  ·  NOT FINANCIAL ADVICE  ·  ';
const Ticker: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1622, height: 54, background: P.dark, overflow: 'hidden', display: 'flex', alignItems: 'center', zIndex: 55 }}>
      <div style={{ whiteSpace: 'nowrap', transform: `translateX(${-((f * 2.4) % 1700)}px)`, fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: '0.08em', color: P.gold }}>{TICK.repeat(3)}</div>
    </div>
  );
};

export const IpoReel: React.FC = () => {
  const f = useCurrentFrame();
  const s = SEGS.find((x) => f >= x.from && f < x.from + x.durationInFrames) ?? SEGS[SEGS.length - 1];
  const S = SCENES[s.id], u = (f - s.from) / s.durationInFrames;
  return (
    <AbsoluteFill style={{ background: P.ivory }}>
      <AbsoluteFill key={s.id} style={{ transform: `scale(${1 + 0.025 * u})` }}><S /></AbsoluteFill>
      <Wipe id={s.id} l={f - s.from} k={SEGS.indexOf(s)} />
      <Ticker />
      <Captions dark={DARK.has(s.id)} />
      <Progress />
      <Grain opacity={0.05} />
      <Audio src={staticFile(audio.reel)} />
    </AbsoluteFill>
  );
};
export { lerp };
