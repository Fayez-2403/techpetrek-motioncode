// FACT 3: AI reads tokens. One sentence: English = 10 tokens; the same Hindi line = 52 on GPT-4's tokenizer (cl100k_base)
// and 15 on GPT-4o's (o200k_base). All counts and pieces from our tiktoken run (docs/receipts.json).
import React from 'react';
import { C, FONT } from '../themes/tokens';
import { ev } from '../tl';
import { clamp, easeInOutCubic, easeOutCubic, easeOutQuint, lerp } from '../animation/anim';
import { Receipt, land } from './Kit';
import DEMO from '../config/demo.json';

const O = DEMO.tokens.o200k_base, L = DEMO.tokens.cl100k_base;
const PAL = ['#FFD23F', '#7FC8FF', '#FF8FB1', '#9BE07A', '#B89CFF', '#FFB866'];
const HIF = '"Nirmala UI", "Noto Sans Devanagari", Inter, sans-serif';

const Chips: React.FC<{ t: number; at: number; pieces: string[]; font?: string; size?: number }> = ({ t, at, pieces, font = FONT.ui, size = 38 }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
    {pieces.map((p, i) => (
      <span key={i} style={{ transform: `scale(${land(t, at + i * 0.03, 0.16)})`, background: PAL[i % PAL.length], color: C.ink, borderRadius: 10, padding: '4px 10px',
        fontFamily: font, fontWeight: 800, fontSize: size, whiteSpace: 'pre' }}>{p.replace(/^ /, '·')}</span>
    ))}
  </div>
);

export const Tokens: React.FC<{ t: number }> = ({ t }) => {
  const en = ev('tEn'), hi = ev('tHi'), old = ev('tOld'), n15 = ev('t15'), up = ev('tUp');
  const merge = easeInOutCubic(clamp((t - n15) / 0.4));
  const enSplit = t >= en;
  return (
    <>
      <Receipt id="tiktoken" t={t} at={ev('tSrc')} />
      {/* English line */}
      <div style={{ position: 'absolute', left: 70, right: 70, top: 450, transform: `scale(${land(t, ev('tQ'), 0.22)})` }}>
        <div style={{ fontFamily: FONT.ui, fontWeight: 800, fontSize: 26, color: C.dim, textAlign: 'center', marginBottom: 8 }}>English {enSplit && <span style={{ color: C.scale }}>· {O.en.n} tokens</span>}</div>
        {enSplit ? <Chips t={t} at={en} pieces={O.en.pieces} size={44} /> : (
          <div style={{ textAlign: 'center', fontFamily: FONT.ui, fontWeight: 800, fontSize: 50, color: '#fff' }}>
            {O.en.text.split(' ').map((w, i) => <span key={i} style={{ display: 'inline-block', marginRight: 12, textDecoration: t >= ev('tWords') ? 'line-through' : 'none', textDecorationColor: C.na }}>{w}</span>)}
          </div>
        )}
      </div>
      {/* Hindi line */}
      {t >= hi && (
        <div style={{ position: 'absolute', left: 60, right: 60, top: 640, transform: `scale(${land(t, hi, 0.22)})` }}>
          <div style={{ fontFamily: FONT.ui, fontWeight: 800, fontSize: 26, color: C.dim, textAlign: 'center', marginBottom: 8 }}>
            Hindi {t >= old && t < n15 && <span style={{ color: C.na }}>· GPT-4 tokenizer: {L.hi.n} tokens</span>}{t >= n15 && <span style={{ color: C.haan }}>· GPT-4o tokenizer: {O.hi.n} tokens</span>}
          </div>
          {t < old ? (
            <div style={{ textAlign: 'center', fontFamily: HIF, fontWeight: 700, fontSize: 46, color: '#fff' }}>{O.hi.text}</div>
          ) : t < n15 + 0.2 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', opacity: 1 - merge, transform: `scale(${1 - 0.3 * merge})` }}>
              {Array.from({ length: L.hi.n }, (_, i) => (
                <span key={i} style={{ width: 60, height: 48, borderRadius: 8, background: i % 2 ? '#FF7A8A' : C.na, transform: `scale(${land(t, old + i * 0.006, 0.12)})` }} />
              ))}
            </div>
          ) : (
            <Chips t={t} at={n15 + 0.2} pieces={O.hi.pieces} font={HIF} size={48} />
          )}
        </div>
      )}
      {/* the bars */}
      {t >= up && (
        <div style={{ position: 'absolute', left: 90, right: 90, top: 880 }}>
          {[['English', O.en.n, C.scale], ['Hindi · GPT-4', L.hi.n, C.na], ['Hindi · GPT-4o', O.hi.n, C.haan]].map(([lab, n, col], i) => {
            const p = easeOutQuint(clamp((t - up - i * 0.12) / 0.45));
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', height: 70, gap: 16 }}>
                <div style={{ width: 250, fontFamily: FONT.ui, fontWeight: 800, fontSize: 28, color: '#fff', textAlign: 'right' }}>{lab as string}</div>
                <div style={{ height: 46, width: lerp(0, 560 * ((n as number) / 52), p), background: col as string, borderRadius: 12 }} />
                <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 44, color: col as string, opacity: p }}>{n as number}</div>
              </div>
            );
          })}
          <div style={{ marginTop: 6, textAlign: 'center', fontFamily: FONT.ui, fontWeight: 700, fontSize: 22, color: C.dim }}>ek hi line, tiktoken se hamare laptop pe gina</div>
        </div>
      )}
    </>
  );
};
