// V3 opener (portrait, the only upright shot): "ROTATE YOUR PHONE". A phone outline turns a quarter left with an arrow,
// then the whole card turns into the landscape orientation the rest of the reel uses (content rotated 90° clockwise).
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { LABELS } from '../../data/verifiedClaims';
import { dampedSpring, easeInOutCubic, invLerp, lerp, reveal } from '../../lib/anim';
import { mulberry32 } from '../../lib/rng';
import { C } from '../../styles/theme';
import { F } from '../../styles/typography';
import { beatAt, V3Props } from '../lib';

const STARS = (() => { const r = mulberry32(12); return Array.from({ length: 90 }, () => [r() * 1080, r() * 1920, 0.4 + r() * 1.6, r()]); })();

export const V3Intro: React.FC<V3Props & { landscape?: boolean }> = ({ dur, landscape }) => {
  const f = useCurrentFrame();
  const W = landscape ? 1920 : 1080, H = landscape ? 1080 : 1920;
  const turn = dampedSpring((f - 26) / 30, 10, 0.55);          // phone turns a quarter left
  const arc = easeInOutCubic(invLerp(18, 44, f));
  const out = easeInOutCubic(invLerp(dur - 16, dur, f));       // the card turns into landscape and fades
  const b = beatAt(f);
  const cx = W / 2, cy = landscape ? 470 : 860;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(80% 60% at 50% 45%, #0E1A44 0%, ${C.void} 75%)` }}>
      <div style={{ position: 'absolute', inset: 0, transform: landscape ? undefined : `rotate(${90 * out}deg) scale(${1 - 0.25 * out})`, opacity: 1 - out }}>
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {STARS.map(([x, y, r, k], i) => <circle key={i} cx={(x / 1080) * W} cy={(y / 1920) * H} r={r} fill="#C9D6F0" opacity={0.25 + 0.35 * Math.abs(Math.sin(f / 18 + k * 9))} />)}
          {/* arrow arc, counter-clockwise */}
          <path d={describeArc(cx, cy, 300, -70, -70 - 120 * arc)} fill="none" stroke={C.cyan} strokeWidth={6} strokeLinecap="round" opacity={0.9} />
          {arc > 0.95 && (() => { const a = ((-190 - 90) * Math.PI) / 180; const x = cx + 300 * Math.cos(a), y = cy + 300 * Math.sin(a); return <path d={`M ${x - 22} ${y - 6} L ${x} ${y + 22} L ${x + 22} ${y - 8}`} fill="none" stroke={C.cyan} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" transform={`rotate(-200 ${x} ${y})`} />; })()}
          {/* phone */}
          <g transform={`translate(${cx} ${cy}) rotate(${-90 * turn}) scale(${1 + 0.03 * b.pulse})`}>
            <rect x={-130} y={-240} width={260} height={480} rx={38} fill="rgba(10,17,48,0.8)" stroke={C.lunar} strokeWidth={7} />
            <rect x={-104} y={-204} width={208} height={408} rx={14} fill="none" stroke="rgba(232,237,246,0.35)" strokeWidth={2} />
            <path d="M -26 -40 L 40 0 L -26 40 Z" fill={C.cyan} opacity={reveal(f, 30, 10)} />
          </g>
        </svg>
        <div style={{ position: 'absolute', left: 0, right: 0, top: landscape ? 820 : 300, textAlign: 'center' }}>
          <div style={{ fontFamily: F.mono, fontSize: 24, letterSpacing: '0.16em', color: C.silver, opacity: reveal(f, 2, 10) }}>KIMI K3.1 PRO · SHOWCASE</div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: landscape ? 860 : 1210, textAlign: 'center' }}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: landscape ? 72 : 88, color: C.lunar, letterSpacing: '0.02em', lineHeight: 1.05,
            transform: `translateY(${(1 - reveal(f, 6, 16)) * 30}px)`, opacity: reveal(f, 6, 12) }}>{landscape ? 'SOUND ON' : <>ROTATE<br />YOUR PHONE</>}</div>
          <div style={{ marginTop: 26, fontFamily: F.text, fontWeight: 600, fontSize: 40, color: C.cyan, opacity: reveal(f, 18, 12) }}>{landscape ? 'music only · no narration' : 'turn it sideways for the full screen'}</div>
          {!landscape && <div style={{ marginTop: 18, fontFamily: F.mono, fontSize: 26, letterSpacing: '0.1em', color: C.silver, opacity: reveal(f, 26, 12) }}>SOUND ON · MUSIC ONLY</div>}
        </div>
        <div style={{ position: 'absolute', left: 60, right: 60, top: landscape ? 1000 : 1560, textAlign: 'center', fontFamily: F.mono, fontSize: 22, lineHeight: 1.5, color: C.silver, opacity: 0.85 * reveal(f, 34, 12) }}>
          Every scene recreated in code by TechpeTrek · illustrative, not Kimi output<br />{LABELS.independent.split(' · ')[1]}
        </div>
        <Img src={staticFile('brand/techpe-trek.jpg')} style={{ position: 'absolute', left: W / 2 - 40, top: landscape ? 40 : 170, width: 80, height: 80, borderRadius: 18, opacity: reveal(f, 2, 10) }} />
      </div>
    </AbsoluteFill>
  );
};

function describeArc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 < a0 ? 0 : 1} ${x1} ${y1}`;
}
void lerp;
