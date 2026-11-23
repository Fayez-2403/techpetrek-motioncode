// FACT 4: Unix time. A seconds counter from 1 Jan 1970 races to today (our captured value), creeps to the signed 32-bit
// limit 2,147,483,647 = 2038-01-19 03:14:07 UTC, ticks its last seconds, then wraps to -2,147,483,648 = 1901-12-13
// 20:45:52 UTC. The fix: 64-bit (292 billion years, ~21x the age of the universe). Dates from docs/receipts.json.
import React from 'react';
import { C, FONT } from '../themes/tokens';
import { ev } from '../tl';
import { clamp, easeInOutCubic, easeOutCubic, lerp } from '../animation/anim';
import { Big, Receipt, land } from './Kit';
import DEMO from '../config/demo.json';

const Y = DEMO.y2038, MAX = Y.max, NOW = Y.now;
const fmt = (n: number) => (n < 0 ? '-' : '') + Math.abs(Math.round(n)).toLocaleString('en-US');

const Galaxy: React.FC<{ s: number; i: number }> = ({ s, i }) => (
  <svg width={64} height={64} viewBox="-32 -32 64 64" style={{ transform: `scale(${s}) rotate(${(i * 47) % 180}deg)` }}>
    <defs><radialGradient id={`gx${i}`}><stop offset="0%" stopColor="#FFF4D6" /><stop offset="35%" stopColor="#C9A8FF" stopOpacity={0.9} /><stop offset="100%" stopColor="#6B5BD6" stopOpacity={0} /></radialGradient></defs>
    <ellipse rx={30} ry={11} fill={`url(#gx${i})`} />
    <path d="M -22 4 Q -4 -12 18 -6 M 22 -4 Q 4 12 -18 6" stroke="#E6D8FF" strokeWidth={2.5} fill="none" opacity={0.8} />
    <circle r={4} fill="#fff" />
  </svg>
);

export const Y2038: React.FC<{ t: number }> = ({ t }) => {
  const ep = ev('yEpoch'), lim = ev('yLimit'), date = ev('yDate'), wrap = ev('yWrap'), b64 = ev('y64');
  let v = 0;
  if (t >= ep && t < lim) v = NOW * easeInOutCubic(clamp((t - ep) / (lim - ep - 0.1))) ** 2.2;
  else if (t >= lim && t < date) v = lerp(NOW, MAX - 3, easeInOutCubic(clamp((t - lim) / (date - lim))));
  else if (t >= date && t < wrap) v = MAX - 2 + Math.min(2, Math.floor(((t - date) / (wrap - date)) * 3));
  else if (t >= wrap) v = -2147483648;
  const big64 = t >= b64;
  const wrapped = t >= wrap && !big64;
  const glitch = t > wrap && t < wrap + 0.4 ? Math.sin(t * 95) * 12 : 0;
  const counter = big64 ? '9,223,372,036,854,775,807' : fmt(v);
  return (
    <>
      <Receipt id="wiki_2038" t={t} at={ev('ySrc')} />
      {t >= ep - 0.2 && (
        <div style={{ position: 'absolute', left: 60, right: 60, top: 450, textAlign: 'center', transform: `translateX(${glitch}px) scale(${land(t, ep - 0.2, 0.22)})` }}>
          <div style={{ fontFamily: FONT.ui, fontWeight: 800, fontSize: 28, color: C.dim }}>{big64 ? '64-bit counter ki limit' : 'seconds since 1 January 1970 (Unix time)'}</div>
          <div style={{ marginTop: 6, display: 'inline-block', background: '#0B0D2A', border: `5px solid ${wrapped ? C.na : big64 ? C.haan : '#3A3F86'}`, borderRadius: 22, padding: '10px 26px',
            fontFamily: FONT.mono, fontWeight: 800, fontSize: big64 ? 58 : 84, color: wrapped ? C.na : big64 ? C.haan : '#fff', fontVariantNumeric: 'tabular-nums' }}>{counter}</div>
          {t >= lim - 0.25 && t < lim + 1.2 && !wrapped && !big64 && (
            <div style={{ fontFamily: FONT.ui, fontWeight: 800, fontSize: 28, color: C.scale, marginTop: 6 }}>⬆ aaj ka time (hamare laptop pe): {fmt(NOW)}</div>
          )}
        </div>
      )}
      {t >= lim && !big64 && (
        <div style={{ position: 'absolute', left: 90, right: 90, top: 690, transform: `scale(${land(t, lim, 0.2)})` }}>
          <div style={{ height: 50, borderRadius: 14, background: '#262A6A', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${clamp(Math.max(0, v) / MAX) * 100}%`, background: wrapped ? C.na : C.scale }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT.mono, fontWeight: 800, fontSize: 24, color: '#fff', marginTop: 6 }}>
            <span>0 (1970)</span><span style={{ color: C.na }}>32-bit limit {fmt(MAX)}{t >= ev('yMax') ? ' ≈ 214 crore' : ''}</span>
          </div>
        </div>
      )}
      {t >= date && !big64 && (
        <div style={{ position: 'absolute', left: 60, right: 60, top: 800, textAlign: 'center', transform: `scale(${land(t, wrapped ? wrap : date, 0.2)})`,
          fontFamily: FONT.mono, fontWeight: 900, fontSize: 52, color: wrapped ? C.na : C.scale }}>{wrapped ? Y.wrap : Y.last}</div>
      )}
      {wrapped && <Big t={t} at={ev('y1901')} y={880} text="1901!" size={150} color={C.na} sub="ghadi 137 saal peeche" />}
      {big64 && <Big t={t} at={ev('y292')} y={680} text="292 billion saal" size={92} color={C.haan} />}
      {big64 && t >= ev('y21') && (
        <div style={{ position: 'absolute', left: 120, right: 120, top: 820, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
          {Array.from({ length: 21 }, (_, i) => <Galaxy key={i} i={i} s={land(t, ev('y21') + i * 0.03, 0.16)} />)}
          <div style={{ width: '100%', textAlign: 'center', fontFamily: FONT.ui, fontWeight: 800, fontSize: 34, color: '#fff', marginTop: 8 }}>universe ki umar × 21</div>
        </div>
      )}
    </>
  );
};

export const Cta: React.FC<{ t: number }> = ({ t }) => {
  const word = 'DYK', n = Math.round(word.length * clamp((t - ev('typeDYK')) / 0.35)), pulse = 1 + 0.06 * Math.sin(t * 8);
  return (
    <>
      <Big t={t} at={ev('cta')} y={400} text="4 SACH · 4 PROOF" size={96} sub="saare commands + sources DM mein" />
      <div style={{ position: 'absolute', left: 110, top: 720, width: 860, height: 120, borderRadius: 60, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 50px',
        fontFamily: FONT.ui, fontWeight: n ? 900 : 600, fontSize: n ? 56 : 40, color: n ? C.ink : '#9A9DB5' }}>
        {n ? word.slice(0, n) : 'Add a comment…'}{n > 0 && (t * 2) % 1 < 0.5 ? '|' : ''}
        <div style={{ position: 'absolute', right: 28, top: 16, width: 88, height: 88, borderRadius: 44, background: n === 3 ? C.bro : '#C9CBE0', transform: `scale(${n === 3 ? pulse : 1})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 40 }}>➤</div>
      </div>
      {t >= ev('typeDYK') + 0.7 && <Big t={t} at={ev('typeDYK') + 0.7} y={900} text="DM mein aa jaayega ✓" size={44} color={C.haan} />}
    </>
  );
};
