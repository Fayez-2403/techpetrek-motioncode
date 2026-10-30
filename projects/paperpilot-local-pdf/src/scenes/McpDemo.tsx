// Scene 05 THE MCP WOW MOMENT (27.5-36.5 s) and Scene 06 THE NATURAL LANGUAGE DEMONSTRATION (36.5-43 s).
// Every terminal line is taken from our own test run (assets/recordings/claude_run.jsonl, transcript.json) or the
// official setup docs (docs/coding-agents.md); paths are shortened to file names.
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { clamp, easeInOutCubic, easeInQuint, easeOutQuint, invLerp, lerp } from '../animation/anim';
import { wf } from '../audio/words';
import { Headline, Label, s0, s1, Sheet, SPRING, Stage, Win } from '../components/kit';
import { RustCore } from '../components/RustCore';
import { C, FONT, glow } from '../themes/tokens';

const typed = (text: string, g: number, a: number, b: number) => text.slice(0, Math.round(text.length * clamp((g - a) / (b - a))));
const Caret: React.FC<{ g: number; col?: string }> = ({ g, col = C.cyan }) => (
  <span style={{ display: 'inline-block', width: '0.55em', height: '1.05em', verticalAlign: '-0.15em', background: col, opacity: Math.floor(g / 18) % 2 ? 0.15 : 1 }} />
);

const TOOLS = ['pdf_merge', 'pdf_split', 'pdf_compress', 'pdf_ocr', 'pdf_rotate', 'pdf_extract_text', 'pdf_watermark', 'pdf_redact'];

export const Mcp: React.FC = () => {
  const g = useCurrentFrame();
  const A = s0('mcp'), END = s1('mcp');
  const AUR = wf('l05', 'Aur'), MCP = wf('l05', 'MCP'), SRV = wf('l05', 'server!'), CL = wf('l05', 'Claude'), CODE = wf('l05', 'Code'), AG = wf('l05', 'agents'), PDF = wf('l05', 'PDF', 0);
  const grow = easeInOutCubic(invLerp(AUR + 8, AUR + 60, g));
  const big = SPRING.slam(g, MCP), toTop = easeInOutCubic(invLerp(CL - 14, CL + 12, g));
  const split = SPRING.panel(g, CL - 4), link = clamp((g - CODE) / 10);
  const push = easeInQuint(invLerp(END - 40, END, g));
  const cmd = 'claude mcp add --transport stdio paperpilot -- paperpilot-mcp';
  // terminal: a blinking caret in the dark grows into a full terminal, then becomes the Claude Code panel
  const tw = lerp(lerp(60, 960, grow), 940, toTop), th = lerp(lerp(60, 520, grow), 330, toTop);
  const tx = lerp(540 - tw / 2, 70, toTop), ty = lerp(lerp(900, 640, grow), 470, toTop);
  return (
    <Stage g={g} pool={C.rust} pool2={C.cyan} floor={false}>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '540px 1120px', transform: `scale(${1 + 0.35 * push})` }}>
        <Win title={toTop > 0.5 ? 'Claude Code · sample-pdfs' : 'terminal'} w={tw} h={th} accent={C.cyan}
          style={{ left: tx, top: ty, opacity: g < AUR ? 0 : clamp((g - AUR) / 6) * (1 - clamp((g - MCP) / 6) * (1 - toTop)) }}>
          {toTop < 0.5 ? (
            <div style={{ padding: 28, fontFamily: FONT.mono, fontSize: 34, lineHeight: 1.45, color: C.ink, opacity: grow }}>
              <span style={{ color: C.mint }}>$ </span>{typed(cmd, g, AUR + 30, MCP - 6)}<Caret g={g} />
            </div>
          ) : (
            <div style={{ padding: 26, fontFamily: FONT.mono, fontSize: 30, lineHeight: 1.6, color: C.ink, opacity: clamp((toTop - 0.5) * 3) }}>
              <div><span style={{ color: C.ink2 }}>MCP servers</span></div>
              <div><span style={{ color: C.mint }}>●</span> paperpilot <span style={{ color: C.mint }}>connected</span></div>
              <div style={{ color: C.ink2 }}>stdio · local process · {Math.round(76 * clamp((g - CODE) / 40))} tools</div>
            </div>
          )}
        </Win>
        {/* the blinking cursor alone in the dark */}
        {g < AUR + 8 ? <div style={{ position: 'absolute', left: 520, top: 880, fontFamily: FONT.mono, fontSize: 56 }}><Caret g={g} /></div> : null}
        {/* the local MCP server panel + the glowing connection */}
        {g >= CL - 10 ? (
          <>
            <div style={{ position: 'absolute', left: 536, top: 800, width: 8, height: 170, borderRadius: 4, background: link ? C.rust : '#2A3A50', boxShadow: link ? glow(0.9 * link, C.rust, 40) : 'none', opacity: split }}>
              {link > 0 ? [0, 1, 2].map((k) => <div key={k} style={{ position: 'absolute', left: -6, top: ((g - CODE) * 3 + k * 57) % 170, width: 20, height: 20, borderRadius: 10, background: C.paper }} />) : null}
            </div>
            <Win title="paperpilot-mcp v0.6.1 · on this PC" w={940} h={360} accent={C.rust} style={{ left: 70, top: 970, opacity: clamp(split * 1.4), transform: `translateY(${(1 - split) * 200}px)` }}>
              <div style={{ position: 'absolute', left: 24, top: 22, right: 24, display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                {TOOLS.map((t, i) => {
                  const on = clamp((g - PDF + 6 - i * 5) / 6);
                  return <div key={t} style={{ padding: '10px 16px', borderRadius: 12, fontFamily: FONT.mono, fontWeight: 600, fontSize: 25, color: on ? C.base : C.ink,
                    background: on ? C.rust : 'rgba(255,255,255,0.05)', border: `1.5px solid ${on ? C.rust : '#2A3A50'}` }}>{t}</div>;
                })}
                <div style={{ padding: '10px 16px', fontFamily: FONT.mono, fontSize: 25, color: C.ink2 }}>+68 more</div>
              </div>
            </Win>
          </>
        ) : null}
      </div>
      {/* MCP in enormous dimensional letters with rust tracers, then it climbs to the top */}
      {g >= MCP ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: lerp(380, 238, toTop), textAlign: 'center', transform: `scale(${lerp(0.6 + 0.4 * big, 0.36, toTop)})`, transformOrigin: '50% 0' }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 340, letterSpacing: -6, lineHeight: 1, color: C.paper,
            textShadow: Array.from({ length: 14 }, (_, i) => `${i * 1.5}px ${i * 2}px 0 ${i < 13 ? '#9C4A25' : '#000'}`).join(', ') + `, ${glow(0.7, C.rust, 80)}` }}>MCP</div>
          <svg width={760} height={70} viewBox="0 0 760 70" style={{ display: 'block', margin: '0 auto' }}>
            <path d="M10 35 H750" stroke={C.rust} strokeWidth={4} strokeDasharray="40 30" strokeDashoffset={-g * 6} />
          </svg>
        </div>
      ) : null}
      <div style={{ position: 'absolute', left: 0, right: 0, top: lerp(840, 380, toTop), textAlign: 'center', fontFamily: FONT.mono, fontWeight: 700, fontSize: lerp(50, 34, toTop), letterSpacing: 6,
        color: C.rust, opacity: clamp((g - SRV) / 8) * (1 - clamp((g - AG + 8) / 8)) }}>MODEL CONTEXT PROTOCOL</div>
      <Headline g={g} top={372} size={54} words={[{ t: 'AI AGENTS', at: AG, c: C.cyan }, { t: '+', at: AG + 4 }, { t: 'LOCAL PDF TOOLS', at: AG + 8, c: C.mint }]} />
      <Label top={1345} left={70} a={clamp((g - CODE - 20) / 12)}>from our test run · Claude Code 2.1.312 + paperpilot-mcp v0.6.1</Label>
    </Stage>
  );
};

export const Demo: React.FC = () => {
  const g = useCurrentFrame();
  const A = s0('demo'), END = s1('demo');
  const YE = wf('l06', 'ye'), MG = wf('l06', 'merge'), KR = wf('l06', 'karo,'), CP = wf('l06', 'compress'), DO = wf('l06', 'do!');
  const prompt = 'Merge these three sample PDFs and compress the result.';
  const ENTER = YE - 6, done = DO + 18;
  const hero = easeInOutCubic(invLerp(done, done + 40, g)), check = SPRING.slam(g, done + 6);
  const row = (at: number) => ({ opacity: clamp((g - at) / 6), transform: `translateY(${(1 - SPRING.ui(g, at)) * 14}px)` });
  const merged = SPRING.slam(g, KR), squeeze = easeInOutCubic(invLerp(CP, CP + 30, g));
  return (
    <Stage g={g} pool={C.mint} pool2={C.rust}>
      <Win title="Claude Code · sample-pdfs" w={960} h={560} accent={C.cyan}
        style={{ left: 60, top: 250, transform: `translateY(${-120 * hero}px) scale(${1 - 0.12 * hero})`, transformOrigin: '50% 0', opacity: 1 - 0.55 * hero }}>
        <div style={{ padding: '22px 26px', fontFamily: FONT.mono, fontSize: 27, lineHeight: 1.5, color: C.ink }}>
          <div><span style={{ color: C.cyan }}>&gt; </span>{typed(prompt, g, A + 2, ENTER - 4)}{g < ENTER ? <Caret g={g} /> : null}</div>
          <div style={{ ...row(MG), marginTop: 14 }}><span style={{ color: C.rust }}>⏺ </span>paperpilot · <b>pdf_merge</b> <span style={{ color: C.ink2 }}>(MCP)</span></div>
          <div style={row(MG + 4)}><span style={{ color: C.ink2 }}>  inputs: invoice.pdf, report.pdf, notes.pdf</span></div>
          <div style={row(KR + 6)}><span style={{ color: C.mint }}>  ⎿ "PDFs merged successfully."</span></div>
          <div style={{ ...row(CP), marginTop: 10 }}><span style={{ color: C.rust }}>⏺ </span>paperpilot · <b>pdf_compress</b> <span style={{ color: C.ink2 }}>(MCP)</span></div>
          <div style={row(CP + 4)}><span style={{ color: C.ink2 }}>  quality: "medium"</span></div>
          <div style={row(DO + 4)}><span style={{ color: C.mint }}>  ⎿ "PDF compressed successfully."</span></div>
        </div>
      </Win>
      {/* the papers: three appear on "ye teen", fly into the engine and merge, then the chamber compresses the result */}
      <RustCore g={g} size={180} x={540} y={1235} power={clamp((g - MG) / 12)} label="PAPERPILOT · LOCAL" style={{ opacity: clamp((g - YE) / 10) * (1 - hero) }} />
      {g < KR + 2 ? ['invoice.pdf', 'report.pdf', 'notes.pdf'].map((nm, i) => {
        const inn = SPRING.paper(g, YE + i * 5), fly = easeInQuint(invLerp(MG, KR, g));
        return <div key={nm} style={{ position: 'absolute', left: lerp(90 + i * 320, 470, fly), top: lerp(830, 1160, fly), opacity: clamp(inn * 2), transform: `scale(${(0.5 + 0.1 * inn) * (1 - 0.6 * fly)})`, transformOrigin: '0 0' }}>
          <Sheet name={nm} title={nm.split('.')[0].toUpperCase()} tint={[C.cyan, C.rust, C.mint][i]} seed={i + 1} />
        </div>;
      }) : (
        <div style={{ position: 'absolute', left: lerp(lerp(620, 400, squeeze), 350, hero), top: lerp(900, 560, hero) + 10 * hero * Math.sin((g - done) / 16),
          transform: `scale(${lerp(0.55 * merged, 1, hero) * (1 + 0.04 * hero * invLerp(done + 40, END, g))}) rotate(${hero * 2.2 * Math.sin((g - done) / 23)}deg)`, transformOrigin: '0 0' }}>
          <Sheet name={g >= done ? 'merged_compressed.pdf' : 'merged.pdf'} title={g >= done ? 'MERGED + COMPRESSED' : 'MERGED'} tint={C.mint} seed={4} pages={Math.round(lerp(8, 2, squeeze))} />
          {squeeze > 0 && squeeze < 1 ? [-1, 1].map((s) => <div key={s} style={{ position: 'absolute', top: 40, height: 400, width: 14, borderRadius: 7, left: s < 0 ? lerp(-90, -24, squeeze) : lerp(450, 384, squeeze), background: C.cyan, boxShadow: glow(0.8, C.cyan, 30) }} />) : null}
          {hero > 0 ? <div style={{ position: 'absolute', left: 0, top: 0, width: 360, height: 480, borderRadius: 10, overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: -100, bottom: -100, width: 120, left: lerp(-200, 520, invLerp(done + 34, done + 70, g)), transform: 'rotate(18deg)',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)' }} />
          </div> : null}
          {g >= done + 6 ? (
            <div style={{ position: 'absolute', left: 280, top: -40, width: 130, height: 130, borderRadius: 65, background: C.mint, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: `scale(${check * (1 + 0.05 * Math.sin((g - done) / 9))})`, boxShadow: glow(0.6 + 0.3 * Math.sin((g - done) / 9), C.mint, 50) }}>
              <svg width={70} height={70} viewBox="0 0 24 24"><path d="M4 12.5 L10 18 L20 6" fill="none" stroke={C.base} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          ) : null}
        </div>
      )}
      <Label top={1338} left={90} a={clamp((g - done - 20) / 12)} color={C.mint}>real result of our test run · sample files · 29 Oct 2026</Label>
    </Stage>
  );
};
