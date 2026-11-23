// HOOK: the real terminal types 0.1 + 0.2 from frame 0 -> 0.30000000000000004 on "nahi"; the clock flips 2038 -> 1901;
// DID YOU KNOW slams. FACT 1: why: 0.1 never ends in binary (like 1/3 in decimal), the scissors round it, the 4 is left.
import React from 'react';
import { C, FONT } from '../themes/tokens';
import { ev } from '../tl';
import { clamp, easeInOutCubic, easeOutCubic, easeOutQuint, lerp } from '../animation/anim';
import { Big, Receipt, Terminal, land } from './Kit';
import DEMO from '../config/demo.json';

const F = DEMO.float;

export const Hook: React.FC<{ t: number }> = ({ t }) => {
  const res = ev('hResult'), flip = ev('hFlip'), title = ev('hTitle');
  const shrink = easeInOutCubic(clamp((t - title) / 0.35));
  const flipP = clamp((t - flip) / 0.25);
  const glitch = t > flip && t < flip + 0.35 ? Math.sin(t * 90) * 10 : 0;
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-shrink * 120}px) scale(${1 - 0.25 * shrink})`, opacity: 1 - 0.9 * shrink, transformOrigin: '50% 30%' }}>
        {/* the question, on screen from frame 0; struck out when the real answer lands */}
        <div style={{ position: 'absolute', left: 40, right: 40, top: 270, textAlign: 'center', fontFamily: FONT.display, fontWeight: 900, fontSize: 118, color: t >= res ? C.na : C.scale, fontStretch: '82%' }}>
          <span style={{ position: 'relative' }}>0.1 + 0.2 = 0.3?
            {t >= res && <span style={{ position: 'absolute', left: -10, right: -10, top: '52%', height: 14, background: C.na, transform: `scaleX(${easeOutQuint(clamp((t - res) / 0.2))})`, transformOrigin: 'left' }} />}
          </span>
        </div>
        {t >= res && <div style={{ position: 'absolute', right: 70, top: 250, transform: `rotate(-10deg) scale(${land(t, res + 0.1, 0.18)})`, fontFamily: FONT.display, fontWeight: 900, fontSize: 64, color: '#fff', background: C.na, borderRadius: 16, padding: '4px 18px' }}>NAHI!</div>}
        <Terminal t={t} inAt={-0.3} x={80} y={440} w={920} size={52}
          lines={[{ at: -0.25, s: '0.1 + 0.2', d: 0.7 }, { at: res, s: F.sum, kind: 'out' }]} />
        {t >= res && (
          <div style={{ position: 'absolute', left: 80 + 4 + 30 + 18 * 31.2 - 6, top: 440 + 58 + 70 - 2, width: 46, height: 70, borderRadius: 12,
            border: `5px solid ${C.na}`, transform: `scale(${land(t, res + 0.15, 0.2)})`, boxShadow: `0 0 30px ${C.na}` }} />
        )}
        {/* the clock */}
        {t >= 0.9 && (
          <div style={{ position: 'absolute', left: 140, right: 140, top: 690, height: 300, borderRadius: 30, background: '#0B0D2A', border: `5px solid ${t >= flip ? C.na : '#3A3F86'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `translateX(${glitch}px) scale(${land(t, 0.9, 0.25)})` }}>
            <div style={{ fontFamily: FONT.mono, fontWeight: 800, fontSize: 30, color: t >= flip ? C.na : C.dim }}>
              {t >= flip ? '13 DEC · 20:45:52 UTC' : `19 JAN · 03:14:0${Math.min(7, Math.floor(clamp((t - 0.9) / (flip - 0.9)) * 8))} UTC`}
            </div>
            <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 150, color: t >= flip ? C.na : '#fff', transform: `scaleY(${t >= flip ? lerp(0.2, 1, easeOutCubic(flipP)) : 1})` }}>
              {t >= flip ? '1901' : '2038'}
            </div>
          </div>
        )}
      </div>
      {t >= title && (
        <>
          <Big t={t} at={title} y={430} text="DID YOU KNOW?" size={130} color={C.scale} />
          <div style={{ position: 'absolute', left: 60, right: 60, top: 620, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 18 }}>
            {['0.1 + 0.2', 'password', 'AI tokens', '2038'].map((s, i) => (
              <div key={s} style={{ transform: `scale(${land(t, title + 0.35 + i * 0.12, 0.2)})`, background: C.paper, border: `5px solid ${C.ink}`, borderRadius: 26,
                padding: '14px 28px', fontFamily: FONT.display, fontWeight: 900, fontSize: 52, color: C.ink }}>{s}</div>
            ))}
          </div>
        </>
      )}
    </>
  );
};

const Marquee: React.FC<{ t: number; at: number; y: number; label: string; digits: string; color: string }> = ({ t, at, y, label, digits, color }) => {
  if (t < at) return null;
  const inP = easeOutQuint(clamp((t - at) / 0.35)), shift = Math.max(0, t - at - 0.3) * 260;
  return (
    <div style={{ position: 'absolute', left: 80, right: 80, top: y, height: 120, transform: `translateX(${lerp(200, 0, inP)}px)`, opacity: inP }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 230, height: 120, display: 'flex', alignItems: 'center', fontFamily: FONT.display, fontWeight: 900, fontSize: 60, color: '#fff', zIndex: 2 }}>{label}</div>
      <div style={{ position: 'absolute', left: 230, right: 0, top: 10, height: 100, overflow: 'hidden', borderRadius: 18, background: '#0B0D2A', border: '3px solid #3A3F86' }}>
        <div style={{ position: 'absolute', left: 20 - shift, top: 14, whiteSpace: 'nowrap', fontFamily: FONT.mono, fontWeight: 800, fontSize: 58, color }}>{digits}</div>
      </div>
    </div>
  );
};

export const Float: React.FC<{ t: number }> = ({ t }) => {
  const cut = ev('fRound');
  const bits = F.bin01 + F.bin01.slice(2) + F.bin01.slice(2);
  const cutP = easeOutCubic(clamp((t - cut) / 0.3));
  return (
    <>
      <Receipt id="python_float" t={t} at={ev('fSrc')} />
      <Terminal t={t} inAt={ev('fRun') - 0.2} x={80} y={450} w={920} size={40}
        lines={[{ at: ev('fRun'), s: '0.1 + 0.2', d: 0.6 }, { at: ev('fOut'), s: F.sum, kind: 'out' },
          { at: ev('fOut') + 0.4, s: '0.1 + 0.2 == 0.3', d: 0.5 }, { at: ev('fOut') + 1.0, s: F.eq, kind: 'bad' }]} />
      {t >= ev('fFour') && t < ev('fBin') + 0.2 && (
        <div style={{ position: 'absolute', left: 80 + 4 + 30 + 18 * 24 - 8, top: 450 + 58 + 54 - 2, width: 42, height: 58, borderRadius: 12, border: `6px solid ${C.na}`, boxShadow: `0 0 34px ${C.na}`, transform: `scale(${land(t, ev('fFour'), 0.2)})` }} />
      )}
      <Big t={t} at={ev('fBin')} y={760} text="binary mein 0.1 =" size={56} />
      <Marquee t={t} at={ev('f01')} y={830} label="0.1 →" digits={bits + '…'} color={C.scale} />
      {t < ev('fLeft') && <Marquee t={t} at={ev('fThird')} y={960} label="1/3 →" digits={'0.' + '3'.repeat(80) + '…'} color="#9BD4FF" />}
      {t >= ev('fNever') && t < cut && (
        <div style={{ position: 'absolute', right: 110, top: 770, fontFamily: FONT.display, fontWeight: 900, fontSize: 80, color: C.na, transform: `scale(${land(t, ev('fNever'), 0.2)})` }}>∞</div>
      )}
      {t >= cut && (
        <>
          <div style={{ position: 'absolute', left: 760, top: 815, width: 8, height: 150, background: '#fff', transform: `scaleY(${cutP})`, boxShadow: '0 0 20px #fff' }} />
          <div style={{ position: 'absolute', left: 724, top: 742, fontSize: 70, transform: `rotate(${lerp(-40, 0, cutP)}deg)` }}>✂️</div>
          <div style={{ position: 'absolute', right: 90, top: 760, fontFamily: FONT.display, fontWeight: 900, fontSize: 50, color: '#fff', transform: `scale(${land(t, cut + 0.1, 0.2)})` }}>round!</div>
        </>
      )}
      {t >= ev('fLeft') && (
        <div style={{ position: 'absolute', left: 80, right: 80, top: 972, transform: `scale(${land(t, ev('fLeft'), 0.2)})`, background: C.paper, border: `5px solid ${C.ink}`,
          borderRadius: 22, padding: '12px 22px', fontFamily: FONT.ui, fontWeight: 800, fontSize: 30, color: C.ink, textAlign: 'center' }}>
          💡 paise ka hisaab float mein nahi: <span style={{ fontFamily: FONT.mono }}>Decimal</span> ya integer paise
        </div>
      )}
    </>
  );
};
