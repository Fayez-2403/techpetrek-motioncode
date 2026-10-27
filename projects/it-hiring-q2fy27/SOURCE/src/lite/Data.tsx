// Data scenes (FACTS.md): hook (Wipro minus, baaki plus), total (+13,918 net), q1 (+5,480 -> +13,918), bars + wipro (one shared
// chart), twist (net != vacancies). Numbers count with a critically damped spring (no overshoot on digits).
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp, criticalSpring, easeOutCubic, invLerp } from '../lib/anim';
import { wf } from '../lib/words';
import { F } from '../styles/typography';
import { Bg, Chip, Enter, FPS, Flash, K, Kicker, SAFE, Slam, fadeIn, hit, pop, shake, useScene } from './kit';

const fmtN = (x: number) => Math.round(x).toLocaleString('en-US');
/** spring counter: 0 -> v from local frame `at` (critically damped: digits never overshoot) */
const count = (l: number, at: number, v: number, w = 7) => { const s = criticalSpring((l - at) / FPS, w); return s > 0.996 ? v : v * s; };
const signed = (x: number) => (x >= 0 ? '+' : '−') + fmtN(Math.abs(x));

export const SourceFoot: React.FC<{ p?: number; text?: string }> = ({ p = 1, text = 'Source: Q2 FY27 company results · Moneycontrol, People Matters (Oct 26)' }) => (
  <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 1350, textAlign: 'center', fontFamily: F.mono, fontSize: 20, color: K.steel, opacity: p }}>{text}</div>
);

const Arrow: React.FC<{ up: boolean; size: number; color: string; p: number }> = ({ up, size, color, p }) => (
  <svg width={size} height={size * 1.3} viewBox="-50 -65 100 130" style={{ transform: `translateY(${(1 - p) * (up ? 60 : -60)}px)`, opacity: clamp(p * 1.5) }}>
    <path d={up ? 'M0 -60 L44 -8 L16 -8 L16 60 L-16 60 L-16 -8 L-44 -8 Z' : 'M0 60 L44 8 L16 8 L16 -60 L-16 -60 L-16 8 L-44 8 Z'} fill={color} style={{ filter: `drop-shadow(0 0 18px ${color})` }} />
  </svg>
);

export const Hook: React.FC = () => {
  const { l, at } = useScene('hook');
  const baaki = at('h1', 'baaki'), plus = at('h1', 'plus');
  const settle = 1 + 0.05 * (1 - easeOutCubic(invLerp(0, 16, l)));
  const sk = shake(l, [plus], 12);
  return (
    <AbsoluteFill style={{ transform: `translate(${sk.x}px, ${sk.y}px)` }}>
      <Bg glow={l < baaki ? K.coral : K.teal} amount={0.3} at={l < baaki ? '50% 35%' : '50% 65%'} />
      <Kicker text="Q2 FY27 · JUL–SEP 2026 · NET HEADCOUNT" p={1} />
      {/* top half: Wipro minus (visible from frame 0) */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30, transform: `scale(${settle})` }}>
        <Arrow up={false} size={150} color={K.coral} p={1} />
        <div>
          <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 150, color: K.lunar, lineHeight: 0.95, letterSpacing: '-0.03em' }}>WIPRO</div>
          <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 110, color: K.coral, lineHeight: 1, textShadow: `0 0 30px ${K.coral}88` }}>MINUS…</div>
        </div>
      </div>
      {/* bottom half: the other four plus */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 790, display: 'flex', justifyContent: 'center', gap: 34 }}>
        {[0, 1, 2, 3].map((i) => { const p = pop(l, baaki + i * 5, 16, 0.5); return <div key={i} style={{ opacity: l < baaki + i * 5 ? 0.18 : 1, filter: l < baaki + i * 5 ? 'grayscale(1)' : undefined }}><Arrow up size={120} color={K.teal} p={l < baaki + i * 5 ? 1 : p} /></div>; })}
      </div>
      <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 990, textAlign: 'center' }}>
        <Slam l={l} at={baaki + 4} size={92}>BAAKI IT GIANTS</Slam><br />
        <Slam l={l} at={plus} size={130} color={K.teal} from={2.2} style={{ textShadow: `0 0 ${30 + 50 * hit(l, plus, 30)}px ${K.teal}aa` }}>PLUS?!</Slam>
      </div>
      <Flash l={l} at={plus} color={K.teal} max={0.3} />
    </AbsoluteFill>
  );
};

const NAMES = ['TCS', 'Infosys', 'HCLTech', 'Wipro', 'Tech Mahindra'];

export const Total: React.FC = () => {
  const { l, at } = useScene('total');
  const five = at('l1', 'five'), jul = at('l1', 'July'), net = at('l1', 'net'), add = at('l1', 'add');
  const v = count(l, net, 13918, 5);
  const sk = shake(l, [add], 10);
  return (
    <Enter l={l} sx={sk.x} sy={sk.y}>
      <Bg glow={K.teal} amount={0.2 + 0.25 * fadeIn(l, net, 30)} />
      <Kicker text="INDIA KE 5 IT GIANTS" p={fadeIn(l, 2)} color={K.teal} />
      <div style={{ position: 'absolute', left: SAFE.side - 20, right: SAFE.side - 20, top: 340, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
        {NAMES.map((n, i) => (
          <div key={n} style={{ padding: '12px 22px', borderRadius: 12, border: '2px solid rgba(236,239,244,0.3)', background: 'rgba(16,26,46,0.85)', fontFamily: F.head, fontWeight: 800, fontSize: 36,
            color: K.lunar, opacity: clamp(pop(l, five + i * 4) * 1.5), transform: `translateY(${(1 - pop(l, five + i * 4)) * 30}px)` }}>{n}</div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'center', opacity: fadeIn(l, jul) }}>
        <Chip p={pop(l, jul)} text="July – September 2026" sub="Q2 FY27" color={K.teal} size={34} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 760, textAlign: 'center', opacity: fadeIn(l, net - 4, 6) }}>
        <div style={{ fontFamily: F.mono, fontWeight: 800, fontSize: 34, letterSpacing: '0.2em', color: K.teal }}>NET ADDED</div>
        <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 230, lineHeight: 1, color: K.lunar, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
          transform: `scale(${1 + 0.08 * hit(l, add, 20)})`, textShadow: `0 0 ${40 + 60 * hit(l, add, 30)}px ${K.teal}88` }}>+{fmtN(v)}</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1080, display: 'flex', justifyContent: 'center' }}>
        <Chip p={pop(l, add)} text="Net headcount · vacancies nahi" color={K.yellow} size={32} />
      </div>
      <SourceFoot p={fadeIn(l, net + 20)} />
    </Enter>
  );
};

export const Q1: React.FC = () => {
  const { l, at } = useScene('q1');
  const num = at('l2', '5,480');
  const H = 560, s = H / 13918;
  const q1 = count(l, num - 10, 5480, 6);
  const ratio = fadeIn(l, num + 24, 12);
  return (
    <Enter l={l}>
      <Bg glow={K.teal} amount={0.25} at="50% 70%" />
      <Kicker text="PICHHLA QUARTER vs IS QUARTER" p={fadeIn(l, 2)} color={K.teal} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 360, height: 760, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 120 }}>
        {[{ k: 'Q1 FY27', v: q1, c: 'rgba(25,227,194,0.45)' }, { k: 'Q2 FY27', v: 13918, c: K.teal }].map((b) => (
          <div key={b.k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 62, color: K.lunar, fontVariantNumeric: 'tabular-nums' }}>+{fmtN(b.v)}</div>
            <div style={{ width: 230, height: Math.max(4, b.v * s), background: b.c, borderRadius: '18px 18px 0 0', boxShadow: `0 0 30px ${K.teal}55` }} />
            <div style={{ fontFamily: F.mono, fontWeight: 800, fontSize: 30, color: K.steel }}>{b.k}</div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1170, display: 'flex', justifyContent: 'center' }}>
        <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 84, color: K.teal, opacity: ratio, transform: `scale(${0.6 + 0.4 * pop(l, num + 24, 18, 0.45)})` }}>~2.5x</div>
      </div>
      <SourceFoot />
    </Enter>
  );
};

const ROWS = [
  { n: 'HCLTech', v: 6450, w: 'HCLTech' },
  { n: 'Tech Mahindra', v: 5446, w: 'Mahindra' },
  { n: 'Infosys', v: 4480, w: 'Infosys' },
  { n: 'TCS', v: 4258, w: 'TCS' },
  { n: 'Wipro', v: -6716, w: 'Minus' },
] as const;
const ROW_LINE = ['l3', 'l3', 'l3', 'l3', 'l4'];

/** the shared company chart (bars + wipro scenes), cued on the spoken company names; film-frame based */
const Chart: React.FC<{ f: number }> = ({ f }) => {
  const Z = 540, S = 410 / 6716, Y0 = 470, GAP = 152;
  const ats = ROWS.map((r, i) => wf(ROW_LINE[i], r.w) - 6);
  const wipName = wf('l4', 'Wipro');
  const total = wf('l4', '6,716') + 40;
  return (
    <>
      <div style={{ position: 'absolute', left: Z - 2, top: Y0 - 10, width: 4, height: GAP * 5, background: 'rgba(236,239,244,0.35)' }} />
      {ROWS.map((r, i) => {
        const at = ats[i], neg = r.v < 0;
        const shown = i === 4 ? f >= wipName - 4 : f >= at - 4;
        const g = count(f, at, r.v, 8);
        const len = Math.abs(g) * S;
        const c = neg ? K.coral : K.teal;
        const active = f >= at && f < (ats[i + 1] ?? total);
        return (
          <div key={r.n} style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: Y0 + i * GAP, opacity: shown ? 1 : 0.18, transform: `scale(${active ? 1.03 : 1})`, transformOrigin: '50% 50%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: F.head, fontWeight: 800, fontSize: 46, color: K.lunar }}>{r.n}</span>
              <span style={{ fontFamily: F.head, fontWeight: 900, fontSize: 56, color: f >= at ? c : K.steel, fontVariantNumeric: 'tabular-nums' }}>{f >= at ? signed(g) : i === 4 && shown ? '?' : ''}</span>
            </div>
            <div style={{ position: 'relative', height: 44, marginTop: 8, background: 'rgba(236,239,244,0.06)', borderRadius: 10 }}>
              <div style={{ position: 'absolute', top: 0, height: 44, borderRadius: 10, background: c, boxShadow: `0 0 ${16 + 30 * hit(f, at, 20)}px ${c}`,
                left: neg ? Z - SAFE.side - len : Z - SAFE.side, width: len }} />
            </div>
          </div>
        );
      })}
      {f >= total ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: Y0 + 5 * GAP + 6, display: 'flex', justifyContent: 'center' }}>
          <Chip p={pop(f, total)} text="NET TOTAL: +13,918" sub="6,450 + 5,446 + 4,480 + 4,258 − 6,716" color={K.teal} size={38} />
        </div>
      ) : null}
    </>
  );
};

export const Bars: React.FC = () => {
  const { f, l } = useScene('bars');
  return (
    <Enter l={l}>
      <Bg glow={K.teal} amount={0.2} />
      <Kicker text="Q2 FY27 · NET HEADCOUNT CHANGE" p={fadeIn(l, 2)} color={K.teal} />
      <Chart f={f} />
      <SourceFoot />
    </Enter>
  );
};

export const Wipro: React.FC = () => {
  const { f, l, at } = useScene('wipro');
  const minus = at('l4', 'Minus');
  const sk = shake(l, [minus, minus + 20], 18);
  const glitch = l >= minus - 2 && l < minus + 10;
  return (
    <AbsoluteFill style={{ transform: `translate(${sk.x + (glitch ? ((l % 3) - 1) * 16 : 0)}px, ${sk.y}px)` }}>
      <Bg glow={K.coral} amount={0.2 + 0.35 * fadeIn(l, minus, 10)} at="50% 75%" />
      <Kicker text="Q2 FY27 · NET HEADCOUNT CHANGE" p={1} color={l >= minus ? K.coral : K.teal} />
      <Chart f={f} />
      {glitch ? <AbsoluteFill style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,90,78,0.25) 0 3px, transparent 3px 14px)', transform: `translateY(${(l * 23) % 14}px)` }} /> : null}
      <SourceFoot />
      <Flash l={l} at={minus} color={K.coral} max={0.45} />
    </AbsoluteFill>
  );
};

export const Twist: React.FC = () => {
  const { l, at } = useScene('twist');
  const tw = at('l5', 'twist'), num = at('l5', '13,918'), nahi = at('l5', 'nahi');
  const sk = shake(l, [nahi], 14);
  const x = easeOutCubic(invLerp(nahi, nahi + 10, l));
  return (
    <Enter l={l} sx={sk.x} sy={sk.y}>
      <Bg glow={K.yellow} amount={0.18} />
      <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 280, textAlign: 'center' }}>
        <Slam l={l} at={Math.max(2, tw)} size={130} color={K.yellow}>TWIST!</Slam>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 780, padding: '26px 34px', borderRadius: 24, background: 'rgba(25,227,194,0.14)', border: `3px solid ${K.teal}`, opacity: clamp(pop(l, tw + 20) * 1.5), transform: `scale(${0.9 + 0.1 * pop(l, tw + 20)})` }}>
          <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 84, color: K.teal, lineHeight: 1 }}>+13,918</div>
          <div style={{ fontFamily: F.head, fontWeight: 800, fontSize: 40, color: K.lunar, marginTop: 6 }}>NET HEADCOUNT</div>
          <div style={{ fontFamily: F.mono, fontSize: 22, color: K.steel, marginTop: 6 }}>Sep 30 headcount − Jun 30 headcount</div>
        </div>
        <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 130, color: K.yellow, lineHeight: 1, transform: `rotate(${(1 - pop(l, num)) * 180}deg) scale(${pop(l, num)})` }}>≠</div>
        <div style={{ position: 'relative', width: 780, padding: '26px 34px', borderRadius: 24, background: 'rgba(16,26,46,0.85)', border: '3px solid rgba(236,239,244,0.3)', opacity: clamp(pop(l, num + 8) * 1.5) }}>
          <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 84, color: K.lunar, lineHeight: 1, opacity: 1 - 0.5 * x }}>13,918</div>
          <div style={{ fontFamily: F.head, fontWeight: 800, fontSize: 40, color: K.lunar, marginTop: 6, opacity: 1 - 0.5 * x }}>LIVE JOB OPENINGS</div>
          {l >= nahi ? <svg style={{ position: 'absolute', inset: 0 }} width={780} height={190} viewBox="0 0 780 190">
            <path d={`M 40 30 L ${40 + 700 * x} ${30 + 130 * x}`} stroke={K.coral} strokeWidth={14} strokeLinecap="round" />
            <path d={`M 740 30 L ${740 - 700 * x} ${30 + 130 * x}`} stroke={K.coral} strokeWidth={14} strokeLinecap="round" /></svg> : null}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1210, display: 'flex', justifyContent: 'center' }}>
        <Chip p={pop(l, nahi + 6)} text="NET ≠ JOB OPENINGS" color={K.coral} size={40} />
      </div>
      <Flash l={l} at={nahi} color={K.coral} max={0.3} />
    </Enter>
  );
};

