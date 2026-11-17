// BRIDGE.EXE, the 70 s reel: the real capture of the app's ?reel=1 mode (real solver runs, seeked frame by frame),
// with the hook title, the BRIDGE.EXE title on its spoken word, the user's on-screen lines, the real-artifact cards of
// the CAD/report beat, word-level captions from the voice's own alignment, the CTA and the mix. Pure function of frame.
import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';
import TIMING from '../../SCENE_TIMINGS.json';
import ART from '../config/artifacts.json';
import { clamp, criticalSpring, easeOutQuint, invLerp } from '../animation/anim';
import { C, FONT, FPS } from '../themes/tokens';

export const BRIDGE_SECONDS = TIMING.duration;
export const CLIP = process.env.REMOTION_BRIDGE_CLIP ?? 'clips/bridge_capture_preview.mp4';
export const MIX = process.env.REMOTION_BRIDGE_MIX ?? 'audio/mix_bridge.wav';
const SEC = (id: string) => TIMING.sections.find((s) => s.id === id)!;
const WORDS = TIMING.lines.flatMap((l) => l.words.map((w) => ({ ...w, line: l.id })));
const wordT = (line: string, re: RegExp, fb: number) => WORDS.find((w) => w.line === line && re.test(w.w))?.t0 ?? fb;

/** camera cuts inside the capture (web/src/reel/timeline.ts shots): sections + the in-section cuts */
const CUTS = [2.7, ...TIMING.sections.slice(1).map((s) => s.t0), SEC('geometry').t0 + 2.6, SEC('load').t0 + 4.2, SEC('lenses').t0 + 4.2];

const KEY = /^(load|test|bridge|bridge\.exe|claude|span|truss|3d|solver|deflection,?|forces,?|reactions|height|cad|civil!?)$/i;
const WARN = /^(game|effect|nahi!?|nahi\.)$/i;

function Captions({ t }: { t: number }) {
  const cur = WORDS.findIndex((w) => t >= w.t0 - 0.05 && t < w.t1 + 0.3);
  if (cur < 0) return null;
  const w = WORDS[cur], line = WORDS.filter((x) => x.line === w.line), k = line.indexOf(w);
  const start = Math.floor(k / 3) * 3, burst = line.slice(start, start + 3);
  const ent = easeOutQuint(invLerp(burst[0].t0 - 0.06, burst[0].t0 + 0.1, t));
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: 1370, textAlign: 'center', transform: `translateY(${(1 - ent) * 22}px)`, opacity: ent }}>
      {burst.map((x, i) => {
        const on = t >= x.t0 - 0.03, now = on && t < x.t1 + 0.05, bare = x.w.replace(/[“”"…—]/g, '');
        return (
          <span key={i} style={{ display: 'inline-block', margin: '0 11px', fontFamily: FONT.display, fontWeight: 900, fontStretch: '80%', fontSize: 78, lineHeight: 1.08,
            color: !on ? 'rgba(232,243,247,0.38)' : WARN.test(bare) ? C.amber : KEY.test(bare) ? C.accent : C.ink, transform: `scale(${now ? 1.07 : 1})`,
            textShadow: '0 5px 0 #020a12, 0 0 28px rgba(0,0,0,0.7)' }}>{bare}</span>
        );
      })}
    </div>
  );
}

/** a short on-screen line from the user's script, landing small (decelerating from oversize), then leaving fast */
function Line({ t, t0, t1, text, col = C.accent, top = 1250 }: { t: number; t0: number; t1: number; text: string; col?: string; top?: number }) {
  if (t < t0 || t > t1) return null;
  const a = criticalSpring(t - t0, 15), out = clamp((t1 - t) / 0.18);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, textAlign: 'center', opacity: out, transform: `scale(${1.8 - 0.8 * a})` }}>
      <span style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 14, background: 'rgba(7,21,34,0.86)', border: `2px solid ${col}88`,
        fontFamily: FONT.display, fontWeight: 900, fontStretch: '80%', fontSize: 40, letterSpacing: '0.08em', color: col }}>{text}</span>
    </div>
  );
}

function Hook({ t }: { t: number }) {
  const end = SEC('hook').t1;
  if (t >= end) return null;
  const a = criticalSpring(t - 0.05, 15), b = criticalSpring(t - 0.55, 13), shake = t < 0.35 ? Math.sin(t * 95) * 9 * (1 - t / 0.35) : 0;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', transform: `translate(${shake}px,0)` }}>
      <div style={{ transform: `scale(${3.2 - 2.2 * a})`, opacity: clamp(a * 3), fontFamily: FONT.display, fontWeight: 900, fontStretch: '72%', fontSize: 132, lineHeight: 0.92, color: '#fff',
        textShadow: `0 8px 0 #020a12, 0 0 60px ${C.accent}99` }}>AI × BRIDGE<br />ENGINEERING<span style={{ color: C.amber }}>?!</span></div>
      <div style={{ opacity: b, transform: `translateY(${(1 - b) * 20}px)`, display: 'inline-block', marginTop: 22, padding: '8px 20px', borderRadius: 12, background: 'rgba(7,21,34,0.86)',
        fontFamily: FONT.mono, fontWeight: 700, fontSize: 28, color: C.amber, letterSpacing: '0.06em' }}>LOAD TEST · REAL SOLVER</div>
    </div>
  );
}

function Title({ t }: { t: number }) {
  const at = wordT('v02', /BRIDGE/i, 4.7) - 0.2, end = SEC('reveal').t0 + 4.4;
  if (t < at || t > end) return null;
  const a = criticalSpring(t - at, 13), out = clamp((end - t) / 0.25);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 360, textAlign: 'center', opacity: out, transform: `scale(${1.7 - 0.7 * a})` }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 900, fontStretch: '70%', fontSize: 190, lineHeight: 0.9, color: '#fff', textShadow: `0 9px 0 #020a12, 0 0 70px ${C.accent}aa` }}>
        BRIDGE<span style={{ color: C.accent }}>.EXE</span></div>
      <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 30, letterSpacing: '0.1em', color: C.ink, marginTop: 16, opacity: clamp((t - at - 0.45) / 0.3) }}>
        INTERACTIVE BRIDGE LAB · BUILT WITH CLAUDE CODE</div>
    </div>
  );
}

function Card({ t, at, title, lines, file, mono = true, col = C.accent, top }: { t: number; at: number; title: string; lines: string[]; file: string; mono?: boolean; col?: string; top: number }) {
  if (t < at) return null;
  const a = easeOutQuint(invLerp(at, at + 0.32, t));
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top, transform: `translateX(${(1 - a) * 260}px)`, opacity: clamp(a * 2), borderRadius: 22, background: 'rgba(5,14,24,0.94)',
      border: `2px solid ${col}66`, boxShadow: '0 18px 50px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 22px', background: `${col}1c`, fontFamily: FONT.mono, fontSize: 22, color: col }}>
        <b style={{ fontFamily: FONT.display, fontStretch: '82%', letterSpacing: '0.08em', fontSize: 26 }}>{title}</b><span style={{ color: C.ink2 }}>{file}</span></div>
      <div style={{ padding: '14px 22px 16px', fontFamily: mono ? FONT.mono : FONT.ui, fontSize: 22, lineHeight: 1.42, color: C.ink, whiteSpace: 'pre', overflow: 'hidden' }}>
        {lines.map((l, i) => <div key={i} style={{ opacity: clamp((t - at - 0.1 - i * 0.07) / 0.15), color: l.startsWith('#') || l.startsWith('$') || l.trim() === '...' ? C.ink3 : undefined }}>{l}</div>)}
      </div>
    </div>
  );
}

function Artifacts({ t }: { t: number }) {
  const s = SEC('cad');
  if (t < s.t0 + 1.2 || t >= s.t1) return null;
  const out = clamp((s.t1 - t) / 0.2);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: out }}>
      <div style={{ position: 'absolute', inset: 0, background: `rgba(3,9,16,${0.55 * clamp((t - s.t0 - 1.2) / 0.4)})` }} />
      <Card t={t} at={s.t0 + 1.3} top={250} title="SOLVER · TypeScript" file={ART.files[0].split('/').pop()!} lines={ART.code.map((l) => l.replace(/^ {2}/, ''))} />
      <Card t={t} at={s.t0 + 2.3} top={590} title="CROSS-CHECK" file="crosscheck.py" col={C.emerald} lines={ART.check.map((l) => l.replace('worst relative difference', 'worst rel. diff').replace(/\s+\(tolerance.*$/, ''))} />
      <Card t={t} at={s.t0 + 3.2} top={850} title="CAD · IFC (IfcOpenShell)" file="BRIDGE_EXE_MODEL.ifc" col={C.amber} lines={ART.ifc} />
      <Card t={t} at={s.t0 + 3.9} top={1090} title="REPORT · CSV" file="ANALYSIS_REPORT.csv" col={C.ink2} lines={[ART.csv[0], ...ART.csv.slice(2).map((l) => l.split(',').slice(1, 3).concat(l.split(',')[7]).join(' · ') + ' N')]} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1300, textAlign: 'center', fontFamily: FONT.mono, fontSize: 21, color: C.ink2, opacity: clamp((t - s.t0 - 2) / 0.3) }}>real files from this project · re-typeset for the phone</div>
    </div>
  );
}

function Cta({ t }: { t: number }) {
  const s = SEC('cta'), at = wordT('v10', /comment/i, s.t0 + 1.4) - 0.15;
  if (t < s.t0 + 0.1) return null;
  const a = criticalSpring(t - (s.t0 + 0.15), 11), b = criticalSpring(t - at, 12), c = criticalSpring(t - (at + 0.9), 12);
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: 330, textAlign: 'center' }}>
      <div style={{ transform: `scale(${1.5 - 0.5 * a})`, opacity: a, fontFamily: FONT.display, fontWeight: 900, fontStretch: '74%', fontSize: 92, lineHeight: 0.95, color: '#fff', textShadow: '0 7px 0 #020a12, 0 0 50px rgba(245,166,77,0.55)' }}>
        CIVIL ENGINEERS<br /><span style={{ color: C.amber }}>&amp; CAD USERS</span></div>
      <div style={{ opacity: b, transform: `scale(${0.75 + 0.25 * b})`, display: 'inline-block', marginTop: 30, padding: '20px 44px', borderRadius: 999, background: C.accent, color: '#04202b',
        fontFamily: FONT.display, fontWeight: 900, fontStretch: '82%', fontSize: 60, boxShadow: '0 10px 40px rgba(99,229,250,0.45)' }}>COMMENT &ldquo;CIVIL&rdquo;</div>
      <div style={{ opacity: c, transform: `translateY(${(1 - c) * 20}px)`, marginTop: 22, fontFamily: FONT.mono, fontSize: 27, color: C.ink, lineHeight: 1.45 }}>
        tools · repo links · safe setup checklist<br /><span style={{ color: C.ink2, fontSize: 22 }}>educational simulation · not construction approval</span></div>
    </div>
  );
}

export const Bridge: React.FC = () => {
  const frame = useCurrentFrame(), t = frame / FPS;
  const cut = CUTS.reduce((m, c) => (t >= c && t - c < m ? t - c : m), 9);
  const punch = 1 + 0.03 * Math.exp(-cut * 10), flash = cut < 0.06 ? 0.22 * (1 - cut / 0.06) : 0;
  const ld = SEC('load'), runFlash = Math.max(0, 1 - Math.abs(t - (ld.t0 + 5.02)) / 0.08) * 0.5;
  return (
    <AbsoluteFill style={{ background: C.base }}>
      <AbsoluteFill style={{ transform: `scale(${punch})` }}>
        <OffthreadVideo src={staticFile(CLIP)} muted style={{ width: '100%', height: '100%' }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(3,9,16,0.35) 0%, transparent 16%, transparent 64%, rgba(3,9,16,0.55) 76%, rgba(3,9,16,0.8) 90%)' }} />
      <AbsoluteFill style={{ background: '#fff', opacity: flash + runFlash }} />
      <Hook t={t} />
      <Title t={t} />
      <Line t={t} t0={SEC('geometry').t0 + 0.25} t1={SEC('geometry').t1 - 0.1} text="DRAG • DESIGN • MODIFY" />
      <Line t={t} t0={ld.t0 + 5.1} t1={ld.t1 - 0.1} text="REAL SOLVER OUTPUT" col={C.emerald} top={1255} />
      <Line t={t} t0={SEC('lenses').t0 + 0.2} t1={SEC('lenses').t1 - 0.1} text="DEFLECTION • FORCES • REACTIONS" />
      <Line t={t} t0={SEC('compare').t0 + 0.2} t1={SEC('compare').t1 - 0.1} text="A vs B — MODEL COMPARISON" top={1250} />
      <Line t={t} t0={SEC('cad').t0 + 0.2} t1={SEC('cad').t0 + 1.25} text="AI → CAD → SOLVER → REPORT" col={C.amber} />
      <Artifacts t={t} />
      <Line t={t} t0={SEC('evidence').t0 + 0.2} t1={SEC('evidence').t1 - 0.1} text="EDUCATIONAL SIMULATION" col={C.amber} />
      <Cta t={t} />
      <Captions t={t} />
      {t >= SEC('cta').t0 ? <Img src={staticFile('brand/techpe-trek.jpg')} style={{ position: 'absolute', right: 50, bottom: 330, width: 110, height: 110, borderRadius: 18, opacity: 0.75 * clamp((t - SEC('cta').t0 - 0.5) / 0.4) }} /> : null}
      <Audio src={staticFile(MIX)} />
    </AbsoluteFill>
  );
};
