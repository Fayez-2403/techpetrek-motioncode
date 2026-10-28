// Cover (cover.png): the KV-pool world frozen while the decode head reads stale pages, two chats (illustrative) joined by
// one glowing coral strand, the 5-word headline and "155 RESPONSES • FIXED". Critical text inside x 110..970, y 220..1550.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { VERSION } from '../data/version';
import { C, FONT, SH } from './kit';
import { EVENTS, World } from './World';

const chat = (x: number, y: number, w: number, who: string, col: string, soft: string, text: string, mono: boolean): React.ReactNode => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, padding: '24px 28px', borderRadius: 30, background: 'rgba(255,255,255,0.86)', border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: SH.s32 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 58, height: 58, borderRadius: 29, background: col, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.ui, fontWeight: 800, fontSize: 30, flex: 'none' }}>{who[0]}</div>
      <div style={{ fontFamily: FONT.ui, fontWeight: 800, fontSize: 32, color: C.ink }}>{who.length > 1 ? who : `User ${who}`}</div>
    </div>
    <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 18, background: soft, fontFamily: mono ? FONT.mono : FONT.ui, fontWeight: 600, fontSize: 30, color: mono ? col : C.ink }}>{text}</div>
  </div>
);

export const Cover: React.FC = () => {
  const ev = EVENTS();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <World at={(ev.read0 + ev.read1) / 2 + 0.3} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(248,250,255,0.92) 0%, rgba(248,250,255,0.55) 34%, rgba(248,250,255,0.1) 60%, rgba(248,250,255,0.5) 100%)' }} />
      <div style={{ position: 'absolute', left: 90, right: 90, top: 230, textAlign: 'center', fontFamily: FONT.ui, fontWeight: 900, fontSize: 150, lineHeight: 0.95, letterSpacing: '-0.045em', color: C.ink }}>
        AI NE <span style={{ color: C.coralInk }}>DATA MIX</span> KIYA?
      </div>
      {VERSION === 'v2' ? chat(110, 760, 600, 'Sheetal', C.violet, C.violetSoft, 'Market growth kaisi rahegi?', false) : chat(110, 760, 560, 'A', C.blue, C.blueSoft, 'Isme bug dhoondo…', false)}
      {VERSION === 'v2' ? chat(370, 1060, 600, 'Munni', C.blue, C.coralSoft, '“market growth kaisi…”', false) : chat(410, 1060, 560, 'B', C.violet, C.violetSoft, 'k9#p ~ vL2 ░░ Xq7', true)}
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <defs><filter id="g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" /></filter></defs>
        {[['g', 22, 0.6], ['', 9, 1]].map(([f, sw, a]) => (
          <path key={String(f)} d="M 760 1175 C 980 1080, 900 960, 640 905" fill="none" stroke={C.coral} strokeWidth={sw as number} strokeLinecap="round" opacity={a as number} filter={f ? 'url(#g)' : undefined} />
        ))}
        <circle cx={640} cy={905} r={14} fill={C.coral} />
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1360, display: 'flex', justifyContent: 'center' }}>
        <div style={{ padding: '18px 34px', borderRadius: 22, background: C.white, boxShadow: SH.s16, fontFamily: FONT.ui, fontWeight: 900, fontSize: 52, letterSpacing: '-0.02em', color: C.ink }}>
          155 RESPONSES <span style={{ color: C.ink3 }}>•</span> <span style={{ color: C.mintInk }}>FIXED</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 110, top: 1480, fontFamily: FONT.ui, fontWeight: 600, fontSize: 24, color: C.ink2 }}>{VERSION === 'v2' ? 'Illustrative · names fictional · Source: Cloudflare blog' : 'Illustrative · Source: Cloudflare blog'}</div>
      <Img src={staticFile('brand/techpe-trek.jpg')} style={{ position: 'absolute', right: 110, top: 1430, width: 120, height: 120, borderRadius: 24, boxShadow: SH.s16 }} />
    </AbsoluteFill>
  );
};
