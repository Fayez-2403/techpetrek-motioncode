// Scene 01 THE INTERRUPTED UPLOAD (0-6.5 s) and Scene 02 THE PAPERPILOT REVEAL (6.5-13.5 s). Global frames; cues are words.
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { clamp, easeInOutCubic, easeInQuint, easeOutQuint, invLerp, lerp } from '../animation/anim';
import { hash, noise1 } from '../animation/rng';
import { wf } from '../audio/words';
import { Chip, Headline, Label, life, Logo, s0, s1, Sheet, Shot, SPRING, Stage, Win } from '../components/kit';
import { RustCore } from '../components/RustCore';
import { C, FONT, glow } from '../themes/tokens';

const Cursor: React.FC<{ x: number; y: number; frozen: boolean }> = ({ x, y, frozen }) => (
  <svg width={56} height={70} viewBox="0 0 28 35" style={{ position: 'absolute', left: x, top: y, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.6))' }}>
    <path d="M2 2 L2 28 L9 21 L14 33 L19 31 L14 19 L24 19 Z" fill={frozen ? '#C9D2DE' : '#fff'} stroke="#0A0F18" strokeWidth={2} strokeLinejoin="round" />
  </svg>
);

export const Hook: React.FC = () => {
  const g = useCurrentFrame();
  const R = wf('h01', 'RUKO!'), UP = wf('h01', 'upload'), HO = wf('h01', 'ho?'), END = s1('hook');
  const frozen = g >= R && g < UP;
  // the PDF: dragged toward the upload zone, frozen mid-air, then pulled down into the local browser window
  const drag = easeInOutCubic(clamp(g / R)) * 0.9 + 0.1 * clamp(g / R);
  const pull = easeInOutCubic(invLerp(UP, UP + 62, g));
  const jit = frozen ? 0 : 3 * noise1(g / 6, 3);
  const px = lerp(lerp(150, 560, drag), 360, pull) + jit, py = lerp(lerp(980, 640, drag), 905, pull);
  const grow = easeInQuint(invLerp(END - 30, END, g));
  const sc = lerp(1, 0.72, pull) * (1 + 2.2 * grow), rot = lerp(-8 + 6 * drag, 0, pull);
  const ring = clamp(g / R) * 0.34;   // upload progress ring: stops at 34 % when time freezes
  const ruko = SPRING.slam(g, R), rukoOut = clamp((g - HO - 8) / 10);
  const shake = g >= R && g < R + 14 ? 14 * Math.exp(-(g - R) / 4) * Math.sin((g - R) * 2.4) : 0;
  const cloudA = 1 - easeOutQuint(invLerp(UP + 10, UP + 40, g));
  const win = SPRING.panel(g, UP - 6);
  return (
    <Stage g={g} pool={frozen ? '#4A5568' : C.cyan} pool2={C.coral}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${shake}px, ${shake * 0.4}px) scale(${1 + 0.06 * ruko * (frozen ? 1 : 0.4)})`, transformOrigin: '540px 760px',
        filter: frozen ? 'saturate(0.2) brightness(0.8)' : undefined }}>
        {/* the upload zone of "some PDF website" (fictional, no brand) */}
        <div style={{ position: 'absolute', left: 600, top: 520, width: 380, height: 260, opacity: cloudA, borderRadius: 28, border: `3px dashed ${C.coral}AA`, background: 'rgba(255,100,117,0.06)' }}>
          <svg width={150} height={110} viewBox="0 0 150 110" style={{ position: 'absolute', left: 115, top: 28 }}>
            <path d="M40 92 a30 30 0 0 1 4 -60 a36 36 0 0 1 66 8 a26 26 0 0 1 2 52 z" fill="none" stroke={C.coral} strokeWidth={5} />
            {g < R ? <path d="M75 82 L75 44 M60 58 L75 43 L90 58" stroke={C.ink} strokeWidth={6} strokeLinecap="round" fill="none" /> : null}
          </svg>
          {/* the arrow shatters into harmless shards on RUKO */}
          {g >= R ? Array.from({ length: 26 }, (_, i) => {
            const t = (g - R) / 60, a = hash(i, 5) * Math.PI * 2, d = 40 + 260 * hash(i, 6);
            return <div key={i} style={{ position: 'absolute', left: 186 + Math.cos(a) * d * easeOutQuint(clamp(t * 2)), top: 86 + Math.sin(a) * d * easeOutQuint(clamp(t * 2)) + 120 * t * t,
              width: 8 + 10 * hash(i, 7), height: 4 + 6 * hash(i, 8), background: C.ink, opacity: clamp(1 - t), transform: `rotate(${a * 57 + g * 9}deg)` }} />;
          }) : null}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', fontFamily: FONT.ui, fontWeight: 700, fontSize: 34, color: C.ink }}>Upload PDF</div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 196, textAlign: 'center', fontFamily: FONT.mono, fontSize: 22, color: C.ink2 }}>random-pdf-site</div>
          <svg width={70} height={70} viewBox="0 0 36 36" style={{ position: 'absolute', right: 18, top: 18 }}>
            <circle cx={18} cy={18} r={14} fill="none" stroke="#33445A" strokeWidth={4} />
            <circle cx={18} cy={18} r={14} fill="none" stroke={C.coral} strokeWidth={4} strokeDasharray={`${ring * 88} 88`} transform="rotate(-90 18 18)" />
          </svg>
        </div>
        {/* the local browser window the PDF is pulled into */}
        <Win title="your browser · runs on your device" w={820} h={330} accent={C.mint}
          style={{ left: 130, top: 930, opacity: clamp(win * 1.4), transform: `translateY(${(1 - win) * 140}px)` }}>
          <div style={{ position: 'absolute', left: 30, top: 34, fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: C.mint }}>LOCAL</div>
          <div style={{ position: 'absolute', left: 30, top: 92, fontFamily: FONT.mono, fontSize: 24, color: C.ink2 }}>processed in this tab</div>
        </Win>
        {/* the green arrow that hooks the PDF away from the upload */}
        {g >= UP - 10 && g < UP + 80 ? (
          <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
            <path d="M 640 620 C 520 760, 400 850, 440 960" fill="none" stroke={C.mint} strokeWidth={14} strokeLinecap="round"
              strokeDasharray="700" strokeDashoffset={700 * (1 - easeOutQuint(invLerp(UP - 10, UP + 14, g)))} opacity={1 - invLerp(UP + 60, UP + 80, g)} style={{ filter: `drop-shadow(0 0 16px ${C.mint})` }} />
            <path d="M 414 930 L 442 972 L 474 934" fill="none" stroke={C.mint} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round"
              opacity={clamp((g - UP - 8) / 6) * (1 - invLerp(UP + 60, UP + 80, g))} />
          </svg>
        ) : null}
        <div style={{ position: 'absolute', left: px, top: py, transform: `scale(${sc}) rotate(${rot}deg)`, transformOrigin: '180px 240px' }}>
          <Sheet title="PRIVATE REPORT" name="PRIVATE_REPORT.pdf" tint={C.coral} seed={3} />
        </div>
        {g < UP ? <Cursor x={px + 300} y={py + 120} frozen={frozen} /> : null}
      </div>
      {/* RUKO! slams in front of the frozen world */}
      {g >= R && rukoOut < 1 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', fontFamily: FONT.display, fontWeight: 700, fontSize: 270, letterSpacing: -8, color: C.coral,
          opacity: clamp((g - R) / 2) * (1 - rukoOut), transform: `scale(${(2.2 - 1.2 * ruko) * (1 - 0.3 * rukoOut)}) translateY(${-200 * rukoOut}px)`, textShadow: `${glow(0.8, C.coral, 60)}, 0 14px 0 #7A1E2A` }}>RUKO!</div>
      ) : null}
      <Headline g={g} top={290} size={96} words={[{ t: 'PROCESS', at: HO + 14 }, { t: 'PDFs', at: HO + 20 }, { t: 'LOCALLY', at: HO + 28, c: C.mint, size: 128 }]} out={END - 16} />
      {frozen ? <Label top={232} left={90} a={0.8} color={C.coral}>UPLOAD PAUSED</Label> : null}
    </Stage>
  );
};

export const Reveal: React.FC = () => {
  const g = useCurrentFrame();
  const A = s0('reveal'), END = s1('reveal');
  const PP = wf('l02', 'PaperPilot!'), RU = wf('l02', 'Rust'), OS = wf('l02', 'open-source'), BR = wf('l02', 'browser'), LO = wf('l02', 'locally');
  const orbit = easeInOutCubic(invLerp(A, END, g));
  const toCore = easeInOutCubic(invLerp(RU - 6, RU + 26, g));
  const toShot = easeInOutCubic(invLerp(BR - 10, BR + 18, g));
  const icon = SPRING.paper(g, PP - 14), shot = SPRING.panel(g, BR - 8), rcpt = SPRING.ui(g, LO + 4);
  // pages through the core: one in, one processed out, twice
  const cyc = (k: number) => clamp((g - RU - 10 - k * 40) / 50);
  return (
    <Stage g={g} pool={C.cyan} pool2={C.rust}>
      <Logo size={170} style={{ left: 455, top: 238, opacity: clamp(icon * 1.3), transform: `scale(${0.6 + 0.4 * icon}) rotate(${(1 - icon) * -20}deg)`, filter: `drop-shadow(0 0 40px ${C.rust}88)` }} />
      <Headline g={g} top={430} size={146} words={[{ t: 'PAPERPILOT', at: PP }]} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 596, textAlign: 'center', fontFamily: FONT.mono, fontWeight: 600, fontSize: 40, letterSpacing: 8, color: C.cyan,
        opacity: clamp((g - OS) / 8), transform: `translateY(${(1 - SPRING.ui(g, OS)) * 20}px)` }}>OPEN-SOURCE PDF TOOLKIT</div>
      <Chip g={g} at={RU} text="RUST" col={C.rust} style={{ left: 170, top: 680 }} />
      <Chip g={g} at={BR} text="WASM" col={C.cyan} style={{ left: 420, top: 680 }} />
      <Chip g={g} at={LO} text="LOCAL" col={C.mint} style={{ left: 680, top: 680 }} />
      {/* 3D paper stack orbiting under the logo, then sliding left to feed the core */}
      <div style={{ position: 'absolute', left: lerp(360, 70, toCore), top: lerp(820, 900, toCore), width: 360, height: 480, perspective: 1400, opacity: 1 - toShot,
        transform: `scale(${lerp(1, 0.52, toCore)})`, transformOrigin: '0 0' }}>
        <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateX(16deg) rotateY(${-38 + 60 * orbit}deg)` }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} style={{ position: 'absolute', inset: 0, transform: `translateZ(${i * 30 + 10 * Math.sin(g / 30 + i)}px)` }}>
              <Sheet title={['INVOICE', 'REPORT', 'NOTES', 'CONTRACT', 'SLIDES', 'RESUME'][i]} tint={[C.cyan, C.rust, C.mint, C.cyan, C.rust, C.mint][i]} seed={i + 1} pages={1} tag={false} />
            </div>
          ))}
        </div>
      </div>
      {/* the core: one page enters, one processed page exits */}
      <RustCore g={g} size={300} x={560} y={1060} power={toCore} style={{ opacity: toCore * (1 - toShot), transform: `scale(${0.7 + 0.3 * toCore})` }} />
      {[0, 1].map((k) => {
        const t = cyc(k);
        if (t <= 0 || t >= 1 || toShot >= 1) return null;
        const inp = t < 0.5, u = inp ? easeInQuint(t * 2) : easeOutQuint((t - 0.5) * 2);
        const x = inp ? lerp(230, 500, u) : lerp(600, 860, u), y = inp ? lerp(1010, 1020, u) : lerp(1020, 980, u);
        return <div key={k} style={{ position: 'absolute', left: x, top: y, transform: `scale(${inp ? 0.28 * (1 - 0.6 * u) : 0.12 + 0.16 * u})`, transformOrigin: '0 0', opacity: (1 - toShot) }}>
          <Sheet pages={1} tint={inp ? C.cyan : C.mint} seed={k + 7} tag={false} title={inp ? 'IN' : 'DONE ✓'} />
        </div>;
      })}
      {/* proof: the real browser app, our three files loaded, and what the network did */}
      <Shot src="img/web_engine.png" w={900} h={526} credit="usepaperpilot.com · our test, 29 Oct 2026"
        style={{ left: 90, top: 790, opacity: clamp(shot * 1.3), transform: `translateY(${(1 - shot) * 260}px) rotateX(${(1 - shot) * 18}deg) scale(${1 + 0.03 * invLerp(BR, END, g)})` }} />
      <div style={{ position: 'absolute', left: 470, top: 1112, width: 500, padding: '18px 24px', borderRadius: 18, background: 'rgba(8,14,22,0.94)', border: `2px solid ${C.mint}`,
        boxShadow: glow(0.5, C.mint, 40), fontFamily: FONT.mono, opacity: clamp(rcpt * 1.5), transform: `translateY(${(1 - rcpt) * 40}px) scale(${0.9 + 0.1 * rcpt})` }}>
        <div style={{ fontSize: 20, color: C.ink2, letterSpacing: 2 }}>NETWORK · DURING MERGE</div>
        <div style={{ fontSize: 22, color: C.ink, marginTop: 6 }}>GET paperpilot_wasm_bg.wasm</div>
        <div style={{ fontSize: 34, fontWeight: 700, color: C.mint, marginTop: 6 }}>PDF uploads: 0</div>
      </div>
      {/* the three files lift out of the list and leave in three directions (they arrive in the next scene) */}
      {['invoice.pdf', 'report.pdf', 'notes.pdf'].map((nm, i) => {
        const t = easeInQuint(invLerp(END - 34 + i * 4, END, g));
        if (t <= 0) return null;
        const dx = [-900, 0, 900][i], dy = [-100, -1000, -100][i];
        return <div key={nm} style={{ position: 'absolute', left: 300 + i * 160 + dx * t, top: 960 + i * 50 + dy * t, transform: `scale(${0.4 + 0.2 * t}) rotate(${(i - 1) * 20 * t}deg)`, transformOrigin: '0 0' }}>
          <Sheet name={nm} title={nm.split('.')[0].toUpperCase()} tint={[C.cyan, C.rust, C.mint][i]} seed={i + 1} />
        </div>;
      })}
    </Stage>
  );
};
