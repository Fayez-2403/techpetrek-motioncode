// JOB INTERVIEW SE $6 BILLION HACK?! — the Binance breach reel (1080 x 1920, 60 fps). A 3D reconstruction (src/reel/
// Director.tsx) under a 2D news layer: the hook slams, date chips that keep Oct 29 (incident) apart from Nov 3 (report),
// counters, the frozen ≠ recovered meter, the myth-bust stamp, the attribution columns, the safety checklist, word-level
// captions, and persistent "illustrative reconstruction" / source labels. Every number is from docs/factcheck.md.
import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { World, T, sec, wordT, E } from '../reel/Director';
import { C, usePreload } from '../world/props';

export const HEIST_SECONDS = T.duration;
export const MIX = process.env.REMOTION_HEIST_MIX ?? 'audio/mix_heist.wav';
const F = { cond: 'Archivo, Inter, sans-serif', ui: 'Inter, sans-serif', mono: '"JetBrains Mono", monospace' };
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lin = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const spring = (t: number, w = 15, z = 0.4) => (t <= 0 ? 0 : 1 - Math.exp(-z * w * t) * Math.cos(w * Math.sqrt(1 - z * z) * t));
const WORDS = T.lines.flatMap((l) => l.words.map((w) => ({ ...w, line: l.id })));
const KEY = /^(fake|job|interview|\$6\.34|billion|hack|binance|june|tampered|september|project|director|ceo|assignment|malicious|ai|springboard|ruko|18,270|bitcoin|\$2\.85b|freeze|fbi|north|korea|sandbox|safe)/i;
const RECON = ['june', 'sept', 'springboard', 'myth', 'drain', 'lesson'];

function Slam({ t, t0, t1, children, top, size = 120, color = '#fff', from = 2.6, rot = 0, glitch = false }: { t: number; t0: number; t1: number; children: React.ReactNode; top: number; size?: number; color?: string; from?: number; rot?: number; glitch?: boolean }) {
  if (t < t0 || t > t1) return null;
  const a = spring(t - t0, 16, 0.42), out = 1 - E.in(lin(t, t1 - 0.15, t1)), g = glitch ? Math.sin(t * 90) * 6 : 0;
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, top, textAlign: 'center', opacity: out * clamp(a * 3), transform: `scale(${from - (from - 1) * a}) rotate(${rot * (1 - a)}deg)` }}>
      <div style={{ fontFamily: F.cond, fontWeight: 900, fontStretch: '72%', fontSize: size, lineHeight: 0.9, color, letterSpacing: '0.01em', textShadow: `${g}px 0 0 rgba(255,59,79,.8), ${-g}px 0 0 rgba(169,155,255,.8), 0 8px 0 #01040b, 0 0 50px rgba(0,0,0,.6)` }}>{children}</div>
    </div>
  );
}
const Chip = ({ t, t0, t1, date, text, top = 250, col = C.orange }: { t: number; t0: number; t1: number; date: string; text: string; top?: number; col?: string }) => {
  if (t < t0 || t > t1) return null;
  const a = E.out(lin(t, t0, t0 + 0.3)), out = 1 - E.in(lin(t, t1 - 0.15, t1));
  return (
    <div style={{ position: 'absolute', left: 50, top, display: 'flex', alignItems: 'center', gap: 14, opacity: out, transform: `translateX(${(1 - a) * -300}px)` }}>
      <span style={{ padding: '10px 18px', borderRadius: 12, background: col, color: '#0a0c12', fontFamily: F.mono, fontWeight: 800, fontSize: 30 }}>{date}</span>
      <span style={{ padding: '10px 18px', borderRadius: 12, background: 'rgba(6,10,20,.86)', border: `2px solid ${col}88`, color: '#fff', fontFamily: F.cond, fontWeight: 900, fontStretch: '80%', fontSize: 42, letterSpacing: '0.02em' }}>{text}</span>
    </div>
  );
};

function Captions({ t }: { t: number }) {
  const cur = WORDS.findIndex((w) => t >= w.t0 - 0.05 && t < w.t1 + 0.3);
  if (cur < 0) return null;
  const w = WORDS[cur], line = WORDS.filter((x) => x.line === w.line), k = line.indexOf(w), st = Math.floor(k / 3) * 3, burst = line.slice(st, st + 3);
  const ent = E.out(lin(t, burst[0].t0 - 0.06, burst[0].t0 + 0.1));
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, top: 1395, textAlign: 'center', opacity: ent, transform: `translateY(${(1 - ent) * 22}px)` }}>
      {burst.map((x, i) => {
        const on = t >= x.t0 - 0.03, now = on && t < x.t1 + 0.05, bare = x.w.replace(/[—…'"]/g, '');
        return <span key={i} style={{ display: 'inline-block', margin: '0 12px', fontFamily: F.cond, fontWeight: 900, fontStretch: '78%', fontSize: 82, lineHeight: 1.06,
          color: !on ? 'rgba(238,242,255,.36)' : KEY.test(bare) ? C.orange : C.ink, transform: `scale(${now ? 1.08 : 1})`, textShadow: '0 5px 0 #000, 0 0 26px rgba(0,0,0,.8)' }}>{bare}</span>;
      })}
    </div>
  );
}

const Source = ({ text }: { text: string }) => <div style={{ position: 'absolute', left: 50, bottom: 318, padding: '6px 14px', borderRadius: 10, background: 'rgba(6,10,20,.85)', fontFamily: F.mono, fontSize: 21, color: 'rgba(238,242,255,.75)' }}>{text}</div>;

function Overlay({ t }: { t: number }) {
  const S = sec, h = S('hook'), rp = S('report'), jn = S('june'), sp = S('sept'), sb = S('springboard'), my = S('myth'), dr = S('drain'), fr = S('frozen'), at = S('attribution'), ls = S('lesson'), cta = S('cta');
  const id = (T.sections.find((s) => t >= s.t0 && t < s.t1) ?? T.sections[T.sections.length - 1]).id;
  const six = wordT('v02', /^\$6\.34B/, rp.t0 + 3), btc = wordT('v07', /^18,270/, dr.t0 + 1.6), frz = wordT('v08', /^\$2\.85B/, fr.t0 + 0.6);
  const n634 = 6.34 * E.out(lin(t, six - 0.1, six + 0.9)), nbtc = Math.round(18270 * E.out(lin(t, btc - 0.1, btc + 1.2)));
  return (
    <>
      {/* HOOK */}
      <Slam t={t} t0={0.04} t1={1.32} top={330} size={150} glitch={t > 0.9}>JOB<br />INTERVIEW</Slam>
      <Slam t={t} t0={1.34} t1={h.t1 - 0.05} top={300} size={170} from={3.4}>SE <span style={{ color: C.orange }}>$6 BILLION</span><br />HACK?!</Slam>
      {t > 2.4 && t < h.t1 ? <div style={{ position: 'absolute', left: 0, right: 0, top: 690, textAlign: 'center', opacity: E.out(lin(t, 2.4, 2.7)) }}>
        <span style={{ padding: '10px 22px', borderRadius: 12, background: 'rgba(6,10,20,.88)', border: `2px solid ${C.lav}`, fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: C.ink }}>$6.34B impacted · Binance says</span></div> : null}
      {/* REPORT */}
      <Chip t={t} t0={rp.t0 + 0.1} t1={rp.t1} date="OCT 29" text="INCIDENT" />
      <Chip t={t} t0={rp.t0 + 0.6} t1={rp.t1} date="NOV 3" text="BINANCE REPORT" top={340} col={C.lav} />
      {t > six - 0.15 && t < rp.t1 ? <div style={{ position: 'absolute', left: 0, right: 0, top: 1130, textAlign: 'center' }}>
        <span style={{ fontFamily: F.cond, fontWeight: 900, fontStretch: '72%', fontSize: 190, color: C.orange, textShadow: '0 8px 0 #1a0a02, 0 0 60px rgba(255,122,47,.5)' }}>${n634.toFixed(2)}B</span>
        <div style={{ fontFamily: F.mono, fontWeight: 800, fontSize: 32, color: C.ink, marginTop: -10 }}>DIGITAL ASSETS IMPACTED</div></div> : null}
      {id === 'report' ? <Source text="Source: Binance, “Initial Findings and Response Update”, 3 Nov 2026" /> : null}
      {/* JUNE / SEPT */}
      <Chip t={t} t0={jn.t0 + 0.1} t1={jn.t1} date="JUNE 2026" text="TAMPERED DEV TOOL" />
      {t > jn.t0 + 0.7 && t < jn.t1 ? <div style={{ position: 'absolute', left: 50, top: 340, fontFamily: F.ui, fontWeight: 700, fontSize: 30, color: C.ink, opacity: E.out(lin(t, jn.t0 + 0.7, jn.t0 + 1)) }}>installed while getting an AI coding tool</div> : null}
      <Chip t={t} t0={sp.t0 + 0.1} t1={sp.t0 + 3.3} date="SEPT 2026" text="SHAM INTERVIEW" />
      <Chip t={t} t0={sp.t0 + 3.3} t1={sp.t1} date="SEPT 2026" text="MALICIOUS “ASSIGNMENT”" col={C.red} />
      {/* SPRINGBOARD / MYTH */}
      <Chip t={t} t0={sb.t0 + 0.1} t1={sb.t1} date="OCT 20" text="INTERNAL AI TOOL = SPRINGBOARD" col={C.lav} />
      {t > sb.t0 + 1.2 && t < my.t1 ? <div style={{ position: 'absolute', left: 0, right: 0, top: 1210, textAlign: 'center', opacity: E.out(lin(t, sb.t0 + 1.2, sb.t0 + 1.5)) }}>
        <span style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(169,155,255,.18)', border: `2px solid ${C.lav}`, fontFamily: F.mono, fontWeight: 800, fontSize: 28, color: C.lav }}>USED BY ATTACKERS · NOT AUTONOMOUS</span></div> : null}
      <Slam t={t} t0={my.t0 + 0.15} t1={my.t1} top={330} size={132} color="#fff" rot={-8} from={3}>
        <span style={{ display: 'inline-block', padding: '10px 26px', border: `10px solid ${C.red}`, borderRadius: 18, transform: 'rotate(-4deg)', background: 'rgba(30,4,8,.55)' }}>AI DIDN&rsquo;T<br />STEAL BY ITSELF</span></Slam>
      {/* DRAIN / FROZEN */}
      <Chip t={t} t0={dr.t0 + 0.1} t1={dr.t1} date="OCT 29" text="HOT WALLET DRAINED" col={C.red} />
      {t > btc - 0.15 && t < dr.t1 ? <div style={{ position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center' }}>
        <span style={{ fontFamily: F.cond, fontWeight: 900, fontStretch: '72%', fontSize: 170, color: C.amber, textShadow: '0 8px 0 #1a0a02' }}>{nbtc.toLocaleString('en-US')} ₿</span>
        <div style={{ fontFamily: F.mono, fontWeight: 800, fontSize: 30, color: C.ink }}>BTC SENT TO AN ATTACKER ADDRESS</div></div> : null}
      {t > fr.t0 && t < fr.t1 ? (() => {
        const pg = t > fr.t0 + 3.6;
        const k = E.out(lin(t, frz - 0.1, frz + 0.9)), a2 = E.out(lin(t, fr.t0 + 3.7, fr.t0 + 4.1));
        return (
          <div style={{ position: 'absolute', left: 60, right: 60, top: 300 }}>
            {pg ? null : <><div style={{ opacity: clamp((t - frz + 0.15) / 0.12), transform: `scale(${1 + 0.25 * (1 - E.out(lin(t, frz - 0.15, frz + 0.2)))})`, transformOrigin: 'left center', fontFamily: F.cond, fontWeight: 900, fontStretch: '76%', fontSize: 64, color: C.ink }}><span style={{ color: C.ice }}>~${(2.85 * k).toFixed(2)}B</span> FROZEN / INTERCEPTED</div>
            <div style={{ position: 'relative', height: 44, marginTop: 16, borderRadius: 22, background: 'rgba(255,122,47,.35)', border: `2px solid ${C.orange}`, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(2.85 / 6.34) * 100 * k}%`, background: `linear-gradient(90deg, ${C.ice}, #4fb7e0)` }} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: F.mono, fontSize: 24, color: 'rgba(238,242,255,.8)' }}><span>frozen ≠ recovered</span><span>of ~$6.34B impacted</span></div></>}
            {a2 > 0 ? <div style={{ marginTop: 26, opacity: a2, transform: `translateY(${(1 - a2) * 20}px)`, display: 'inline-block', padding: '12px 22px', borderRadius: 14, background: C.green, color: '#04210f', fontFamily: F.cond, fontWeight: 900, fontStretch: '80%', fontSize: 46 }}>BINANCE WILL ABSORB THE LOSS</div> : null}
          </div>
        );
      })() : null}
      {id === 'frozen' ? <Source text="Source: Binance report, 3 Nov 2026 · figures subject to reconciliation" /> : null}
      {/* ATTRIBUTION */}
      {t > at.t0 && t < at.t1 ? (() => {
        const l = E.out(lin(t, at.t0 + 0.3, at.t0 + 0.7)), r = E.out(lin(t, at.t0 + wordT('v09', /^North$/, at.t0 + 2.4) - at.t0, at.t0 + wordT('v09', /^North$/, at.t0 + 2.4) - at.t0 + 0.4));
        const col = (o: number, h1: string, b1: string, c: string) => <div style={{ flex: 1, minHeight: 470, opacity: o, transform: `translateY(${(1 - o) * 80}px)`, padding: 30, borderRadius: 24, background: 'rgba(6,10,20,.82)', border: `3px solid ${c}`, boxShadow: `0 0 50px ${c}44` }}>
          <div style={{ fontFamily: F.cond, fontWeight: 900, fontStretch: '76%', fontSize: 92, lineHeight: 0.95, color: c }}>{h1}</div><div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 42, lineHeight: 1.2, color: C.ink, marginTop: 22 }}>{b1}</div></div>;
        return (
          <div style={{ position: 'absolute', left: 50, right: 50, top: 420 }}>
            <div style={{ textAlign: 'center', fontFamily: F.cond, fontWeight: 900, fontStretch: '80%', fontSize: 58, color: C.ink, marginBottom: 26 }}>ATTRIBUTION · <span style={{ color: C.red }}>DISPUTED</span></div>
            <div style={{ display: 'flex', gap: 20 }}>{col(l, 'FBI', 'blames a North Korea-linked group (TraderTraitor)', C.amber)}{col(r, 'NORTH KOREA', 'rejects the claim', C.lav)}</div>
          </div>
        );
      })() : null}
      {id === 'attribution' ? <Source text="Sources: Binance report; NBC News / Reuters; The National, 3 Nov 2026" /> : null}
      {/* LESSON */}
      {t > ls.t0 && t < ls.t1 ? (
        <div style={{ position: 'absolute', left: 50, right: 50, top: 290 }}>
          {[['VERIFY THE RECRUITER', 0.3], ['UNKNOWN CODE → SANDBOX', 2.2], ['WORK CREDENTIALS STAY OFF IT', 4.0]].map(([txt, d0], i) => {
            const k = spring(t - ls.t0 - (d0 as number), 14, 0.45);
            return k > 0 ? <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16, opacity: clamp(k * 2), transform: `translateX(${(1 - k) * -200}px)` }}>
              <span style={{ width: 70, height: 70, borderRadius: 18, background: C.green, color: '#04210f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.cond, fontWeight: 900, fontSize: 48 }}>{i + 1}</span>
              <span style={{ padding: '12px 20px', borderRadius: 14, background: 'rgba(6,10,20,.88)', fontFamily: F.cond, fontWeight: 900, fontStretch: '80%', fontSize: 50, color: C.ink }}>{txt as string}</span></div> : null;
          })}
        </div>
      ) : null}
      {/* CTA */}
      {t > cta.t0 ? (() => { const a = spring(t - cta.t0 - 0.1, 12, 0.42), b = spring(t - wordT('v11', /^SAFE/, cta.t0 + 0.8) + 0.1, 13, 0.4);
        return (
          <div style={{ position: 'absolute', left: 50, right: 50, top: 330, textAlign: 'center' }}>
            <div style={{ transform: `scale(${1.5 - 0.5 * a})`, opacity: clamp(a * 2), fontFamily: F.cond, fontWeight: 900, fontStretch: '74%', fontSize: 92, color: '#fff', textShadow: '0 7px 0 #01040b' }}>INTERVIEW TASK MILA?</div>
            <div style={{ display: 'inline-block', marginTop: 26, transform: `scale(${0.7 + 0.3 * b})`, opacity: clamp(b * 2), padding: '20px 46px', borderRadius: 999, background: C.orange, color: '#1a0a02', fontFamily: F.cond, fontWeight: 900, fontStretch: '80%', fontSize: 74, boxShadow: '0 10px 40px rgba(255,122,47,.45)' }}>🛡 COMMENT &ldquo;SAFE&rdquo;</div>
            <div style={{ marginTop: 18, opacity: clamp(b), fontFamily: F.mono, fontSize: 28, color: C.ink }}>developer safety checklist in your DM</div>
          </div>
        ); })() : null}
      {RECON.includes(id) || (id === 'frozen' && t < fr.t0 + 3.6) || id === 'hook' ? <div style={{ position: 'absolute', left: 50, top: 205, padding: '5px 12px', borderRadius: 8, background: 'rgba(6,10,20,.75)', fontFamily: F.mono, fontSize: 20, color: 'rgba(238,242,255,.7)' }}>illustrative reconstruction</div> : null}
    </>
  );
}

export const Heist: React.FC = () => {
  const t = useCurrentFrame() / 60;
  const ready = usePreload(['pages/report.png']);
  // whip streak on every section cut (cut on motion)
  const cut = Math.min(...T.sections.map((s) => (t >= s.t0 ? t - s.t0 : 9)), t >= 1.3 ? t - 1.3 : 9, t >= 2.95 ? t - 2.95 : 9);
  const whip = cut < 0.14 ? 1 - cut / 0.14 : 0;
  return (
    <AbsoluteFill style={{ background: C.navy }}>
      {ready ? (
        <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}>
          <color attach="background" args={[C.navy]} />
          <fog attach="fog" args={[C.navy, 6, 26]} />
          <World t={t} />
        </ThreeCanvas>
      ) : null}
      <AbsoluteFill style={{ background: 'radial-gradient(120% 70% at 50% 45%, transparent 55%, rgba(0,0,0,.65) 100%)' }} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(3,6,14,.55) 0%, transparent 18%, transparent 64%, rgba(3,6,14,.6) 80%, rgba(3,6,14,.8) 100%)' }} />
      {whip > 0 ? <AbsoluteFill style={{ background: `linear-gradient(90deg, transparent, rgba(255,179,71,${0.22 * whip}) 45%, rgba(255,255,255,${0.18 * whip}) 50%, transparent)`, transform: `translateX(${(1 - whip) * 600 - 300}px) skewX(-18deg)` }} /> : null}
      <Overlay t={t} />
      <Captions t={t} />
      <Img src={staticFile('brand/techpe-trek.jpg')} style={{ position: 'absolute', right: 46, bottom: 320, width: 96, height: 96, borderRadius: 16, opacity: 0.75 }} />
      <Audio src={staticFile(MIX)} />
    </AbsoluteFill>
  );
};
