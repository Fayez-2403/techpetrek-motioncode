// Scene 07 THE PRIVACY TRUTH (43-49 s) and Scene 08 THE CREATOR + FINAL CTA (49-55 s).
import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { clamp, easeInOutCubic, easeOutQuint, invLerp, lerp } from '../animation/anim';
import { wf } from '../audio/words';
import { Headline, Label, Logo, s0, s1, Sheet, Shot, SPRING, Stage } from '../components/kit';
import { C, FONT, glow } from '../themes/tokens';

export const Privacy: React.FC = () => {
  const g = useCurrentFrame();
  const A = s0('privacy'), END = s1('privacy');
  const LO = wf('l07', 'local'), CL = wf('l07', 'cloud'), DA = wf('l07', 'data'), ST = wf('l07', 'Settings');
  const pull = easeInOutCubic(invLerp(A, END, g)), left = SPRING.panel(g, LO - 4), right = SPRING.panel(g, CL - 4), chip = SPRING.ui(g, ST);
  const flowL = clamp((g - LO) / 10), flowR = clamp((g - DA + 6) / 10);
  return (
    <Stage g={g} pool={C.mint} pool2={C.coral} floor={false}>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '540px 860px', transform: `scale(${lerp(1.14, 1, pull)})` }}>
        {/* the device boundary: the PDF and the local engine live inside it */}
        <div style={{ position: 'absolute', left: 60, top: 560, width: 480, height: 700, borderRadius: 34, border: `3px dashed ${C.mint}88`, opacity: clamp(left * 1.4) }}>
          <div style={{ position: 'absolute', left: 24, top: -20, padding: '2px 12px', background: C.base, fontFamily: FONT.mono, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: C.mint }}>YOUR DEVICE</div>
        </div>
        <div style={{ position: 'absolute', left: 190, top: 620, transform: 'scale(0.6)', transformOrigin: '0 0' }}>
          <Sheet name="merged_compressed.pdf" title="MERGED + COMPRESSED" tint={C.mint} seed={4} pages={2} />
        </div>
        <div style={{ position: 'absolute', left: 90, top: 1000, width: 420, padding: '22px 24px', borderRadius: 22, background: 'rgba(10,18,28,0.95)', border: `2px solid ${C.mint}`,
          boxShadow: glow(0.4 * left, C.mint, 40), opacity: clamp(left * 1.4), transform: `translateY(${(1 - left) * 60}px)` }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: C.mint, lineHeight: 1 }}>LOCAL PDF ENGINE</div>
          <div style={{ fontFamily: FONT.ui, fontWeight: 500, fontSize: 26, color: C.ink, marginTop: 10 }}>merge, compress, OCR run here</div>
        </div>
        {/* local loop: pages circle between the PDF and the engine, never leaving the boundary */}
        {flowL > 0 ? [0, 1, 2].map((k) => {
          const u = ((g - LO) / 50 + k / 3) % 1, a = u * Math.PI * 2;
          return <div key={k} style={{ position: 'absolute', left: 300 + 150 * Math.cos(a) - 10, top: 900 + 90 * Math.sin(a) - 13, width: 20, height: 26, borderRadius: 3, background: C.paper, opacity: flowL * 0.9 }} />;
        }) : null}
        {/* the cloud agent: outside the boundary; what the tools return can travel to its model */}
        <div style={{ position: 'absolute', left: 590, top: 1000, width: 420, padding: '22px 24px', borderRadius: 22, background: 'rgba(28,12,16,0.92)', border: `2px solid ${C.coral}AA`,
          opacity: clamp(right * 1.4), transform: `translateY(${(1 - right) * 60}px)` }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: C.coral, lineHeight: 1 }}>CLOUD AI AGENT</div>
          <div style={{ fontFamily: FONT.ui, fontWeight: 500, fontSize: 26, color: C.ink, marginTop: 10 }}>its model can see what the tools return</div>
        </div>
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: clamp(right * 1.4) }}>
          <path d="M 420 760 C 640 700, 760 820, 800 990" fill="none" stroke={C.coral} strokeOpacity={0.6} strokeWidth={4} strokeDasharray="14 12" strokeDashoffset={-g * 2} />
        </svg>
        {flowR > 0 ? ['text', 'paths', 'text'].map((t, k) => {
          const u = ((g - DA) / 55 + k / 3) % 1, x = lerp(420, 800, u), y = lerp(760, 990, u) - 120 * Math.sin(u * Math.PI) * 0.6;
          return <div key={k} style={{ position: 'absolute', left: x - 34, top: y - 18, padding: '4px 10px', borderRadius: 8, background: C.coral, color: C.base, fontFamily: FONT.mono, fontWeight: 700, fontSize: 20, opacity: flowR * 0.95 }}>{t}</div>;
        }) : null}
      </div>
      <Headline g={g} top={250} size={92} words={[{ t: 'LOCAL', at: LO, c: C.mint }, { t: 'PROCESSING', at: LO + 6 }]} />
      <Headline g={g} top={352} size={92} words={[{ t: '≠', at: CL + 8, c: C.coral }, { t: 'OFFLINE', at: CL + 12 }, { t: 'AI', at: CL + 16, c: C.coral }]} />
      <div style={{ position: 'absolute', left: 90, right: 90, top: 1300, textAlign: 'center', fontFamily: FONT.mono, fontWeight: 700, fontSize: 28, letterSpacing: 1, color: C.base,
        padding: '14px 18px', borderRadius: 16, background: C.mint, opacity: clamp(chip * 1.5), transform: `scale(${0.9 + 0.1 * chip})` }}>CHECK YOUR AGENT'S MODEL + TOOL PERMISSIONS</div>
      <Label top={470} left={90} a={clamp((g - DA) / 12)}>e.g. pdf_extract_text returns the text to the agent</Label>
    </Stage>
  );
};

export const Cta: React.FC = () => {
  const g = useCurrentFrame();
  const A = s0('cta'), END = s1('cta');
  const KR = wf('l08', 'Krushna'), PR = wf('l08', 'project!'), CM = wf('l08', 'Comment'), PA = wf('l08', 'PAPER,'), RE = wf('l08', 'repo');
  const card = SPRING.panel(g, A + 2);
  const zin = easeOutQuint(invLerp(KR - 10, KR + 24, g)), back = easeInOutCubic(invLerp(PR - 30, PR + 6, g));
  const z = lerp(1 + 1.6 * zin, 0.8, back);
  const icon = SPRING.paper(g, PR - 4), mark = SPRING.ui(g, RE + 10);
  return (
    <Stage g={g} pool={C.rust} pool2={C.cyan}>
      <div style={{ position: 'absolute', left: 60, top: lerp(500, 230, back), width: 960, height: 600, transform: `scale(${lerp(0.9 + 0.1 * card, 1, zin) * (back ? 1 : 1)})`, transformOrigin: '50% 0',
        opacity: clamp(card * 1.4) }}>
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${z})`, transformOrigin: back > 0.5 ? '50% 0' : '0% 11%' }}>
          <Shot src="img/github_repo.png" w={960} h={600} pos="0 0" credit="github.com/KrushnaVardhanReddy/PaperPilot · 29 Oct 2026" />
          <div style={{ position: 'absolute', left: 10, top: 64, width: 210, height: 26, borderRadius: 8, border: `3px solid ${C.rust}`, boxShadow: glow(0.8, C.rust, 20), opacity: clamp((g - KR) / 8) * (1 - back) }} />
        </div>
      </div>
      <Logo size={150} style={{ left: 820, top: 200, opacity: clamp(icon * 1.4), transform: `scale(${icon}) rotate(${8 * (1 - icon) + 6}deg)`, filter: `drop-shadow(0 0 30px ${C.rust}99)` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 745, textAlign: 'center', fontFamily: FONT.ui, fontWeight: 700, fontSize: 38, color: C.ink, opacity: clamp((g - PR + 10) / 10) }}>
        by <span style={{ color: C.rust }}>Krushna Vardhan Reddy</span> · open source · Apache-2.0
      </div>
      <Headline g={g} top={815} size={120} words={[{ t: 'COMMENT', at: CM }]} />
      <Headline g={g} top={930} size={250} words={[{ t: 'PAPER', at: PA, c: C.rust }]} />
      <svg width={900} height={30} viewBox="0 0 900 30" style={{ position: 'absolute', left: 90, top: 1170, opacity: clamp((g - PA) / 8) }}>
        <path d="M0 15 H900" stroke={C.rust} strokeWidth={4} strokeDasharray="50 26" strokeDashoffset={-g * 5} />
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1220, textAlign: 'center', fontFamily: FONT.mono, fontWeight: 700, fontSize: 46, letterSpacing: 8, color: C.cyan,
        opacity: clamp((g - RE) / 8), transform: `translateY(${(1 - SPRING.ui(g, RE)) * 20}px)` }}>GET THE REPO</div>
      <Img src={staticFile('brand/techpe-trek.jpg')} style={{ position: 'absolute', right: 90, top: 1300, width: 104, height: 104, borderRadius: 22, opacity: 0.85 * clamp(mark * 1.4),
        transform: `scale(${0.8 + 0.2 * mark}) rotate(${(1 - mark) * -10}deg)` }} />
      {g > END - 30 ? <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 540px 1040px, ${C.rust}33, transparent 60%)`, opacity: clamp((g - END + 30) / 6) * (1 - clamp((g - END + 20) / 20)) }} /> : null}
    </Stage>
  );
};
