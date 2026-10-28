// V2 cover with the two (fictional) characters: Sheetal asks her phone, Munni stares at hers, which glows with Sheetal's
// text. Drawn in code in the reel's grammar (flat shapes, soft shadow, palette meanings: violet = Sheetal, blue = Munni,
// coral = the leaked text). The agenda card names the real incident (FACTS.md F1, F3, F5, F9). Text stays in x 110..970, y 220..1550.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { C, FONT, SH } from './kit';
import { EVENTS, World } from './World';

const HAIR = '#241816', HAIR_HI = '#3A2723';
interface Look { skin: string; skinShade: string; top: string; topShade: string; hair: 'bun' | 'long'; mood: 'ask' | 'confused'; look: number; tilt: number; screen: 'ask' | 'leak' }

/** one character, bust with a phone, viewBox 400 x 660 */
const Person: React.FC<Look & { flip?: boolean }> = ({ skin, skinShade, top, topShade, hair, mood, look, tilt, screen, flip }) => (
  <svg viewBox="0 0 400 660" width={400} height={660} style={{ overflow: 'visible', transform: flip ? 'scaleX(-1)' : undefined }}>
    <defs>
      <radialGradient id={`glow-${screen}`} cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={C.coral} stopOpacity="0.55" /><stop offset="100%" stopColor={C.coral} stopOpacity="0" /></radialGradient>
    </defs>
    {/* long hair behind the shoulders */}
    {hair === 'long' ? <path d="M96 270 C80 380 92 470 120 520 L280 520 C308 470 320 380 304 270 Z" fill={HAIR} /> : null}
    {/* torso: kurta with a neckline and a dupatta stripe */}
    <path d="M40 660 C40 520 100 440 200 440 C300 440 360 520 360 660 Z" fill={top} />
    <path d="M150 446 C165 490 235 490 250 446 C232 440 168 440 150 446 Z" fill={topShade} />
    <path d="M70 560 C120 500 150 470 168 446 L186 450 C160 500 120 560 96 660 L64 660 Z" fill="rgba(255,255,255,0.22)" />
    {/* neck */}
    <path d="M172 372 L228 372 L232 452 C214 466 186 466 168 452 Z" fill={skinShade} />
    <g transform={`rotate(${tilt} 200 300)`}>
      {/* bun */}
      {hair === 'bun' ? <><circle cx="200" cy="150" r="52" fill={HAIR} /><path d="M168 132 C185 118 215 118 232 132" stroke={HAIR_HI} strokeWidth="6" fill="none" strokeLinecap="round" /></> : null}
      {/* ears + jhumka earrings */}
      <ellipse cx="108" cy="292" rx="18" ry="26" fill={skinShade} /><ellipse cx="292" cy="292" rx="18" ry="26" fill={skinShade} />
      <circle cx="108" cy="328" r="9" fill={C.mango} /><circle cx="292" cy="328" r="9" fill={C.mango} />
      {/* face */}
      <ellipse cx="200" cy="282" rx="92" ry="108" fill={skin} />
      {/* hair front */}
      <path d="M106 280 C92 172 158 150 200 150 C262 150 314 184 296 282 C284 228 246 200 214 204 C190 216 150 222 126 238 C114 250 108 264 106 280 Z" fill={HAIR} />
      <path d="M150 182 C176 168 226 166 258 186" stroke={HAIR_HI} strokeWidth="7" fill="none" strokeLinecap="round" />
      {hair === 'bun' ? <circle cx="200" cy="250" r="6" fill={C.coralInk} /> : null}
      {/* brows */}
      {mood === 'ask'
        ? <><path d="M140 252 Q160 238 180 248" stroke={HAIR} strokeWidth="8" fill="none" strokeLinecap="round" /><path d="M220 248 Q240 238 260 252" stroke={HAIR} strokeWidth="8" fill="none" strokeLinecap="round" /></>
        : <><path d="M138 244 Q158 226 180 240" stroke={HAIR} strokeWidth="8" fill="none" strokeLinecap="round" /><path d="M220 256 Q242 250 262 258" stroke={HAIR} strokeWidth="8" fill="none" strokeLinecap="round" /></>}
      {/* eyes (pupils follow `look`) */}
      {[160, 240].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="282" rx="17" ry={mood === 'confused' ? 19 : 15} fill="#FFFFFF" />
          <circle cx={x + look * 7} cy={mood === 'confused' ? 284 : 283} r="10" fill={HAIR} />
          <circle cx={x + look * 7 + 3} cy="279" r="3.2" fill="#FFFFFF" />
        </g>
      ))}
      {/* nose, cheeks, mouth */}
      <path d="M200 296 Q194 318 204 322" stroke={skinShade} strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="140" cy="322" r="15" fill={C.coral} opacity="0.22" /><circle cx="260" cy="322" r="15" fill={C.coral} opacity="0.22" />
      {mood === 'ask'
        ? <path d="M176 344 Q200 364 224 344" stroke="#7A3B33" strokeWidth="7" fill="none" strokeLinecap="round" />
        : <ellipse cx="204" cy="350" rx="11" ry="13" fill="#7A3B33" />}
    </g>
    {/* the phone in both hands */}
    <g transform="rotate(-8 200 560)">
      <ellipse cx="200" cy="560" rx="120" ry="70" fill={`url(#glow-${screen})`} opacity={screen === 'leak' ? 1 : 0} />
      <rect x="140" y="470" width="120" height="196" rx="22" fill={C.ink} />
      <rect x="150" y="484" width="100" height="168" rx="14" fill={screen === 'leak' ? C.coralSoft : C.violetSoft} />
      {screen === 'leak'
        ? <><rect x="160" y="520" width="80" height="34" rx="8" fill="#FFFFFF" stroke={C.coral} strokeWidth="4" /><rect x="166" y="532" width="60" height="9" rx="4" fill={C.coral} /><rect x="160" y="566" width="62" height="12" rx="6" fill={C.coral} opacity="0.6" /></>
        : <><rect x="186" y="512" width="56" height="30" rx="10" fill={C.violet} /><rect x="160" y="556" width="44" height="14" rx="7" fill={C.ink3} opacity="0.5" /></>}
      <ellipse cx="146" cy="600" rx="26" ry="34" fill={skin} /><ellipse cx="254" cy="600" rx="26" ry="34" fill={skin} />
    </g>
  </svg>
);

export const CoverCharacters: React.FC = () => {
  const ev = EVENTS();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <World at={(ev.read0 + ev.read1) / 2 + 0.3} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(248,250,255,0.96) 0%, rgba(248,250,255,0.78) 30%, rgba(248,250,255,0.35) 62%, rgba(248,250,255,0.85) 100%)' }} />
      {/* headline: the story in five words */}
      <div style={{ position: 'absolute', left: 80, right: 80, top: 205, textAlign: 'center', fontFamily: FONT.ui, fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 0.98, color: C.ink }}>
        <div style={{ fontSize: 78, whiteSpace: 'nowrap' }}><span style={{ color: C.violet }}>SHEETAL</span> KA SAWAAL,</div>
        <div style={{ fontSize: 88, whiteSpace: 'nowrap', marginTop: 6 }}><span style={{ color: C.blueInk }}>MUNNI</span> KO JAWAB?!</div>
      </div>
      {/* characters */}
      <div style={{ position: 'absolute', left: 40, top: 610, transform: 'scale(0.98)', transformOrigin: '0 0', filter: 'drop-shadow(0 24px 30px rgba(20,33,61,0.18))' }}>
        <Person skin="#D29B78" skinShade="#B97F5E" top={C.violet} topShade="#6A43DE" hair="bun" mood="ask" look={1} tilt={4} screen="ask" />
      </div>
      <div style={{ position: 'absolute', left: 640, top: 600, transform: 'scale(0.98)', transformOrigin: '0 0', filter: 'drop-shadow(0 24px 30px rgba(20,33,61,0.18))' }}>
        <Person skin="#C38A66" skinShade="#A8714F" top={C.blue} topShade="#2560E0" hair="long" mood="confused" look={-1} tilt={-7} screen="leak" />
      </div>
      {/* Sheetal's question bubble, the coral strand to Munni's phone, Munni's "?" */}
      <div style={{ position: 'absolute', left: 110, top: 520, padding: '16px 24px', borderRadius: '26px 26px 26px 8px', background: C.violet, boxShadow: SH.s16, fontFamily: FONT.ui, fontWeight: 700, fontSize: 36, color: '#fff' }}>
        Market growth kaisi rahegi?
      </div>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <defs><filter id="sg" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" /></filter></defs>
        {[['g', 20, 0.55], ['', 8, 1]].map(([f, sw, a]) => (
          <path key={String(f)} d="M 560 572 C 760 520, 1030 640, 1000 900 S 900 1050 860 1088" fill="none" stroke={C.coral} strokeWidth={sw as number} strokeLinecap="round" strokeDasharray={f ? undefined : '2 18'} opacity={a as number} filter={f ? 'url(#sg)' : undefined} />
        ))}
        <circle cx={860} cy={1088} r={12} fill={C.coral} />
      </svg>
      <div style={{ position: 'absolute', left: 700, top: 520, fontFamily: FONT.ui, fontWeight: 900, fontSize: 150, color: C.coralInk, transform: 'rotate(12deg)', textShadow: '0 10px 24px rgba(226,60,70,0.25)' }}>?</div>
      {/* agenda: the real incident, specific */}
      <div style={{ position: 'absolute', left: 110, right: 110, top: 1270, padding: '24px 30px', borderRadius: 28, background: C.white, boxShadow: SH.s32, fontFamily: FONT.ui }}>
        <Img src={staticFile('brand/techpe-trek.jpg')} style={{ position: 'absolute', right: 24, bottom: 24, width: 104, height: 104, borderRadius: 20, boxShadow: SH.s8 }} />
        <div style={{ fontWeight: 900, fontSize: 46, letterSpacing: '-0.02em', color: C.ink }}>Cloudflare <span style={{ fontFamily: FONT.mono, fontWeight: 800, color: C.cyanInk }}>GLM-5.3</span> AI bug</div>
        <div style={{ fontWeight: 700, fontSize: 34, color: C.ink2, marginTop: 6 }}>155 replies mein <span style={{ color: C.coralInk }}>doosre users ka text</span></div>
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <span style={{ padding: '8px 16px', borderRadius: 12, background: C.coralSoft, color: C.coralInk, fontWeight: 800, fontSize: 28 }}>27 Aug – 9 Sep 2026</span>
          <span style={{ padding: '8px 16px', borderRadius: 12, background: C.mintSoft, color: C.mintInk, fontWeight: 900, fontSize: 28 }}>FIXED ✓</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 110, top: 1515, fontFamily: FONT.ui, fontWeight: 600, fontSize: 23, color: C.ink2 }}>Names fictional · illustrative · Source: Cloudflare blog</div>
    </AbsoluteFill>
  );
};
