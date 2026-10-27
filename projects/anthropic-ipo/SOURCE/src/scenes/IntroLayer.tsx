// V2 kinetic intro (segments intro1..3, before the board hook): the user's hook, beat for beat on the voice.
//  intro1  "AI use karke 2 din mein website, 1 ghante mein reel, 2 minute mein automation???"  -> three speed panels, ???
//  intro2  "Bas? ... responsibility khatam nahi ... Saavdhan ho jao!"  -> freeze, RESPONSIBILITY / KHATAM struck / NAHI! stamp, alarm
//  intro3  "apps, videos, websites build ... bhool rahe hain: credentials, access, audit logs, human approval"
//          -> build tiles, glitch, four question panels (the checklist animations, held before they resolve)
// Every cue is a spoken word (lib/words), so a new take re-times it. Original visuals; UI-like panels are ILLUSTRATIVE.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { clamp, dampedSpring, easeInCubic, easeInOutCubic, easeOutCubic, invLerp, lerp } from '../lib/anim';
import { hash } from '../lib/rng';
import { FPS, segById } from '../lib/timeline';
import { wf } from '../lib/words';
import { MEDIA } from '../media';
import { C, SAFE } from '../styles/theme';
import { F } from '../styles/typography';

const LEAD = 4;   // visuals land a hair before the word
function cues() {
  return {
    two: wf('i01', '2') - LEAD, one: wf('i01', '1') - LEAD, twoB: wf('i01', '2', 1) - LEAD, q: wf('i01', 'diya???'),
    bas: wf('i02', 'Bas?') - 2, resp: wf('i02', 'responsibility') - 8, khatam: wf('i02', 'khatam') - LEAD, nahi: wf('i02', 'nahi') - LEAD,
    saav: wf('i02', 'Saavdhan') - LEAD, jao: wf('i02', 'ho', 1) - LEAD, ai3: wf('i03', 'AI') - LEAD,
    jaise: wf('i03', 'Jaise-jaise') - LEAD, apps: wf('i03', 'apps') - LEAD, videos: wf('i03', 'videos') - LEAD,
    webs: wf('i03', 'websites') - LEAD, build: wf('i03', 'build') - LEAD, bhool: wf('i03', 'bhool') - LEAD,
    cred: wf('i03', 'credentials') - LEAD, access: wf('i03', 'access') - LEAD, audit: wf('i03', 'audit') - LEAD, human: wf('i03', 'human') - LEAD,
    end: segById('hook')!.from,
  };
}
const K = segById('intro1') ? cues() : null;

const slam = (f: number, at: number, w = 13, z = 0.5) => (f < at ? 0 : dampedSpring((f - at) / FPS, w, z));
const flash = (f: number, at: number, len = 4) => (f >= at && f < at + len ? 1 - (f - at) / len : 0);
const HEAD = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: F.head, fontWeight: 900, fontSize: size, lineHeight: 0.9, letterSpacing: '-0.02em', color: C.lunar, whiteSpace: 'nowrap', ...extra });
const MONO = (size: number, color: string = C.steel): React.CSSProperties => ({ fontFamily: F.mono, fontWeight: 600, fontSize: size, letterSpacing: '0.16em', color, whiteSpace: 'nowrap' });
const Tag: React.FC = () => <div style={{ position: 'absolute', left: 12, bottom: 10, ...MONO(14, '#9AA0AC'), letterSpacing: '0.12em' }}>▢ ILLUSTRATIVE</div>;

// ---------------------------------------------------------------- backgrounds
const Floor: React.FC<{ f: number; tint: string; speed?: number; opacity?: number }> = ({ f, tint, speed = 0.022, opacity = 0.55 }) => {
  const H0 = 1180, ph = (f * speed) % 1, rows = 14;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity }}>
      {Array.from({ length: rows }, (_, i) => {
        const t = (i + ph) / rows, y = H0 + (1920 - H0) * t * t;
        return <line key={`h${i}`} x1={0} x2={1080} y1={y} y2={y} stroke={tint} strokeWidth={1 + 2 * t} opacity={0.15 + 0.6 * t} />;
      })}
      {Array.from({ length: 21 }, (_, j) => <line key={`v${j}`} x1={540 + (j - 10) * 8} y1={H0} x2={540 + (j - 10) * 190} y2={1920} stroke={tint} strokeWidth={1.4} opacity={0.35} />)}
    </svg>
  );
};
const Glow: React.FC<{ color: string; y?: number; r?: number; a?: number }> = ({ color, y = 820, r = 760, a = 0.35 }) => (
  <div style={{ position: 'absolute', left: 540 - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', opacity: a,
    background: `radial-gradient(circle, ${color} 0%, transparent 62%)` }} />
);

// ---------------------------------------------------------------- intro1: speed panels
const Badge: React.FC<{ on: number; text: string }> = ({ on, text }) => (
  <div style={{ position: 'absolute', right: 14, top: 12, padding: '5px 12px', borderRadius: 8, background: C.mint, ...MONO(16, '#06140E'),
    letterSpacing: '0.1em', transform: `scale(${0.6 + 0.4 * on})`, opacity: clamp(on * 2) }}>{text}</div>
);
const MiniSite: React.FC<{ t: number }> = ({ t }) => {
  const g = (a: number, b: number) => easeOutCubic(invLerp(a, b, t));
  return (
    <>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 30, background: '#2A2D35', display: 'flex', gap: 7, alignItems: 'center', paddingLeft: 12 }}>
        {[C.alert, '#F2C14E', C.mint].map((c) => <span key={c} style={{ width: 10, height: 10, borderRadius: 5, background: c }} />)}
      </div>
      <div style={{ position: 'absolute', left: 18, top: 44, height: 22, width: 504 * g(0, 8), borderRadius: 6, background: '#3A3E48' }} />
      <div style={{ position: 'absolute', left: 18, top: 78, height: 84, width: 504, borderRadius: 10, background: `linear-gradient(90deg, ${C.alert}, #FF8A4F)`,
        transform: `scaleY(${g(6, 16)})`, transformOrigin: 'top' }} />
      {[0, 1, 2].map((k) => (
        <div key={k} style={{ position: 'absolute', left: 18 + k * 172, top: 176, width: 160, height: 96, borderRadius: 10, background: '#323640',
          transform: `scale(${g(14 + 4 * k, 22 + 4 * k)})` }}>
          <div style={{ margin: '14px 12px 0', height: 10, borderRadius: 5, background: '#4A4F5B', width: 100 }} />
          <div style={{ margin: '10px 12px 0', height: 10, borderRadius: 5, background: '#4A4F5B', width: 70 }} />
        </div>
      ))}
      <Badge on={g(28, 34)} text="LIVE ✓" />
    </>
  );
};
const CLIPS: [number, number, number, string][] = [[0, 12, 130, C.alert], [0, 150, 110, '#F2C14E'], [0, 268, 150, C.alert], [1, 12, 90, C.mint], [1, 110, 180, '#7EB6FF'],
  [1, 298, 120, C.mint], [2, 12, 200, '#A48BFF'], [2, 220, 90, '#F2C14E'], [2, 318, 140, '#7EB6FF']];
const MiniReel: React.FC<{ t: number }> = ({ t }) => (
  <>
    {[0, 1, 2].map((k) => <div key={k} style={{ position: 'absolute', left: 12, right: 12, top: 52 + k * 66, height: 50, borderRadius: 8, background: '#262930' }} />)}
    {CLIPS.map(([tr, x, w, c], k) => {
      const p = easeOutCubic(invLerp(2 + 3 * k, 8 + 3 * k, t));
      return <div key={k} style={{ position: 'absolute', left: x + 12 + (1 - p) * 260, top: 56 + tr * 66, width: w, height: 42, borderRadius: 7, background: c, opacity: p }} />;
    })}
    <div style={{ position: 'absolute', top: 40, height: 210, width: 3, background: C.lunar, left: 16 + ((t * 11) % 500), boxShadow: `0 0 12px ${C.lunar}` }} />
    <Badge on={easeOutCubic(invLerp(30, 36, t))} text="EXPORTED ✓" />
  </>
);
const NODES: [number, number, string][] = [[70, 150, 'HOOK'], [205, 72, 'AI'], [345, 205, 'MAIL'], [475, 105, 'DB']];
const MiniFlow: React.FC<{ t: number }> = ({ t }) => (
  <svg width={540} height={290} style={{ position: 'absolute', inset: 0 }}>
    {NODES.slice(1).map(([x, y], k) => {
      const [x0, y0] = NODES[k], len = Math.hypot(x - x0, y - y0), p = easeOutCubic(invLerp(2 + 6 * k, 9 + 6 * k, t));
      const u = (t * 0.035 + k * 0.33) % 1;
      return (
        <g key={k}>
          <line x1={x0} y1={y0} x2={x} y2={y} stroke={C.mint} strokeWidth={4} strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
          {p >= 1 && <circle cx={lerp(x0, x, u)} cy={lerp(y0, y, u)} r={7} fill={C.mintSoft} />}
        </g>
      );
    })}
    {NODES.map(([x, y, s], k) => {
      const p = easeOutCubic(invLerp(6 * k, 6 * k + 6, t));
      return (
        <g key={s} transform={`translate(${x} ${y}) scale(${p})`}>
          <circle r={34} fill="#262930" stroke={k === 1 ? C.mint : '#4A4F5B'} strokeWidth={3} />
          <text textAnchor="middle" dy={6} fontFamily={F.mono} fontWeight={700} fontSize={k === 1 ? 20 : 14} fill={k === 1 ? C.mintSoft : C.lunar}>{s}</text>
        </g>
      );
    })}
    <foreignObject x={0} y={0} width={540} height={290}><Badge on={easeOutCubic(invLerp(26, 32, t))} text="RUNNING ✓" /></foreignObject>
  </svg>
);
const PANELS = [
  { num: '2', unit: 'DIN', label: 'WEBSITE', Mini: MiniSite },
  { num: '1', unit: 'GHANTA', label: 'REEL', Mini: MiniReel },
  { num: '2', unit: 'MIN', label: 'AUTOMATION', Mini: MiniFlow },
];
const SpeedPanel: React.FC<{ f: number; at: number; i: number; freeze: number | null }> = ({ f, at, i, freeze }) => {
  if (f < at) return null;
  const P = PANELS[i], dir = i % 2 ? -1 : 1, p = slam(f, at, 14, 0.55);
  const t = (freeze !== null ? Math.min(f, freeze) : f) - at;
  const punch = 1 + 0.45 * (1 - slam(f, at + 3, 15, 0.42));
  return (
    <div style={{ position: 'absolute', left: SAFE.side, width: 952, top: 380 + i * 340, height: 310,
      transform: `translateX(${(1 - p) * 1150 * dir}px) skewX(${(1 - clamp(p)) * -14 * dir}deg)` }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 392, height: 310 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, transform: `scale(${punch})`, transformOrigin: 'left bottom' }}>
          <span style={HEAD(250, { color: C.alert, lineHeight: 0.82, textShadow: '0 0 40px rgba(255,90,31,0.45)' })}>{P.num}</span>
          <span style={HEAD(P.unit.length > 4 ? 54 : 84, { paddingBottom: 18, fontStretch: P.unit.length > 4 ? '72%' : '85%' })}>{P.unit}</span>
        </div>
        <div style={{ marginTop: 22, display: 'inline-block', padding: '8px 14px', borderRadius: 8, border: `2px solid ${C.mint}`, ...MONO(24, C.mintSoft) }}>{P.label} ✓</div>
      </div>
      <div style={{ position: 'absolute', right: 0, top: 10, width: 540, height: 290, borderRadius: 18, overflow: 'hidden', background: '#1C1E24',
        border: '1px solid rgba(236,239,244,0.14)', boxShadow: '0 24px 60px rgba(0,0,0,0.55)' }}>
        <P.Mini t={t} />
        <Tag />
      </div>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: C.lunar, opacity: 0.35 * flash(f, at + 5, 5), pointerEvents: 'none' }} />
    </div>
  );
};

// ---------------------------------------------------------------- intro3: build tiles
const TileIcon: React.FC<{ k: number }> = ({ k }) => (
  <svg width={150} height={150} viewBox="0 0 150 150">
    {k === 0 && [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={10 + c * 46} y={10 + r * 46} width={36} height={36} rx={9} fill={(r + c) % 2 ? C.mint : C.lunar} />))}
    {k === 1 && <><rect x={8} y={24} width={134} height={102} rx={18} fill="none" stroke={C.lunar} strokeWidth={8} /><path d="M62 52 L102 75 L62 98 Z" fill={C.alert} /></>}
    {k === 2 && <><rect x={8} y={18} width={134} height={114} rx={14} fill="none" stroke={C.lunar} strokeWidth={8} /><line x1={8} y1={44} x2={142} y2={44} stroke={C.lunar} strokeWidth={8} />
      <rect x={26} y={60} width={98} height={16} rx={6} fill={C.alert} /><rect x={26} y={86} width={70} height={12} rx={5} fill="#5A5F6B" /><rect x={26} y={106} width={86} height={12} rx={5} fill="#5A5F6B" /></>}
  </svg>
);
const TILES = ['APPS', 'VIDEOS', 'WEBSITES'];

// ---------------------------------------------------------------- intro3: question panels
const QUEST = [
  { key: 'cred', anim: 'checklistKey', a: 'CREDENTIALS', b: 'KAHAN?' },
  { key: 'access', anim: 'checklistShield', a: 'ACCESS', b: 'KITNA?' },
  { key: 'audit', anim: 'checklistLogs', a: 'AUDIT LOGS', b: 'KYUN?' },
  { key: 'human', anim: 'checklistApproval', a: 'HUMAN APPROVAL', b: 'KYA?' },
] as const;
const QuestionPanel: React.FC<{ f: number; at: number; next: number | null; k: number }> = ({ f, at, next, k }) => {
  if (f < at || (next !== null && f >= next + 12)) return null;
  const Q = QUEST[k], M = MEDIA[Q.anim];
  const pin = slam(f, at, 14, 0.6), pout = next !== null ? easeInCubic(invLerp(next, next + 11, f)) : 0;
  const x = (1 - pin) * 1150 - pout * 1150, skew = (1 - clamp(pin)) * -12 + pout * 12;
  const size = Math.min(150, Math.floor(876 / (Q.a.length * 0.6)));
  return (
    <div style={{ position: 'absolute', left: SAFE.side, width: 952, top: 320, height: 960, transform: `translateX(${x}px) skewX(${skew}deg)`,
      borderRadius: 34, background: C.graphite2, border: '3px solid rgba(255,90,31,0.55)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: 28, top: 26, ...MONO(24, C.alert) }}>{k + 1} / 4</div>
      <div style={{ position: 'absolute', left: 32, top: 70, ...HEAD(size, { fontStretch: '80%' }) }}>{Q.a}</div>
      <div style={{ position: 'absolute', left: 32, top: 70 + size * 0.98, ...HEAD(150, { color: C.alert, fontStretch: '80%', textShadow: '0 0 36px rgba(255,90,31,0.4)' }) }}>{Q.b}</div>
      <div style={{ position: 'absolute', left: 24, right: 24, bottom: 24, height: 560, borderRadius: 22, overflow: 'hidden', background: C.graphite }}>
        {M && <M w={904} h={560} f={Math.min(50, (f - at) * 0.7)} dur={400} />}
        <Tag />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: C.lunar, opacity: 0.3 * flash(f, at + 4, 5) }} />
    </div>
  );
};

// ---------------------------------------------------------------- the layer
export const IntroLayer: React.FC = () => {
  const f = useCurrentFrame();
  if (!K || f >= K.end) return null;

  // intro1 + the freeze of intro2
  if (f < K.saav) {
    const frozen = f >= K.bas ? K.bas : null;
    const fadeA = 1 - invLerp(K.resp, K.resp + 10, f);
    const dimQ = 1 - 0.45 * clamp((f - K.q - 12) / 6);
    const qs = [14, 20, 26].map((d, i) => ({ at: K.q + d, x: [230, 540, 850][i], rot: [-10, 4, 12][i] }));
    const basP = slam(f, K.bas, 15, 0.45), up = easeInOutCubic(invLerp(K.resp, K.resp + 12, f));
    const letters = 'RESPONSIBILITY'.split('');
    const strike = easeOutCubic(invLerp(K.nahi - 2, K.nahi + 4, f)), stamp = slam(f, K.nahi + 2, 16, 0.45);
    return (
      <AbsoluteFill style={{ background: C.graphite, overflow: 'hidden' }}>
        <Glow color={frozen === null ? C.alert : '#555'} a={0.28} />
        <Floor f={frozen ?? f} tint={frozen === null ? C.alert : '#666'} />
        {f < K.two && (
          <div style={{ position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center' }}>
            <div style={HEAD(420, { color: C.mint, textShadow: `0 0 ${60 + 20 * Math.sin(f / 6)}px rgba(31,158,110,0.7)`, transform: `scale(${1 + 0.04 * (1 - easeOutCubic(invLerp(0, 20, f)))})` })}>AI</div>
            <div style={{ ...MONO(40, C.lunar), marginTop: 30 }}>USE KARKE…</div>
          </div>
        )}
        {f >= K.two && f < K.resp + 10 && (
          <div style={{ position: 'absolute', inset: 0, opacity: fadeA, filter: frozen !== null ? 'grayscale(1) brightness(0.45)' : undefined,
            transform: `scale(${frozen !== null ? 1 + 0.05 * (1 - easeOutCubic(invLerp(K.bas, K.bas + 8, f))) : 1})` }}>
            <div style={{ position: 'absolute', left: SAFE.side, top: 290, ...MONO(30, C.mint) }}>AI USE KARKE</div>
            <div style={{ opacity: frozen === null ? dimQ : 1 }}>
              <SpeedPanel f={f} at={K.two} i={0} freeze={frozen} />
              <SpeedPanel f={f} at={K.one} i={1} freeze={frozen} />
              <SpeedPanel f={f} at={K.twoB} i={2} freeze={frozen} />
            </div>
            {frozen === null && qs.map((q, i) => f >= q.at && (
              <div key={i} style={{ position: 'absolute', left: q.x - 110, top: 700, width: 220, textAlign: 'center',
                transform: `rotate(${q.rot}deg) scale(${1 + 0.8 * (1 - slam(f, q.at, 18, 0.45))})`, ...HEAD(340, { color: C.alert, textShadow: '0 10px 50px rgba(0,0,0,0.8)' }) }}>?</div>
            ))}
          </div>
        )}
        {f >= K.bas && (
          <div style={{ position: 'absolute', left: 0, right: 0, top: lerp(720, 300, up), textAlign: 'center', transform: `scale(${lerp(0.4 + 0.6 * basP, 0.42, up)})`, transformOrigin: 'center top' }}>
            <div style={HEAD(330, { textShadow: '0 12px 60px rgba(0,0,0,0.7)' })}>BAS?</div>
          </div>
        )}
        {f >= K.resp && (
          <>
            <div style={{ position: 'absolute', left: SAFE.side, top: 600, ...MONO(34) }}>YAHAN AAPKI</div>
            <div style={{ position: 'absolute', left: SAFE.side, top: 650, display: 'flex' }}>
              {letters.map((ch, i) => {
                const p = easeOutCubic(invLerp(K.resp + i * 1.2, K.resp + i * 1.2 + 6, f));
                return <span key={i} style={{ ...HEAD(134, { fontStretch: '75%' }), display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}>{ch}</span>;
              })}
            </div>
          </>
        )}
        {f >= K.khatam && (
          <div style={{ position: 'absolute', left: SAFE.side, top: 860, opacity: easeOutCubic(invLerp(K.khatam, K.khatam + 5, f)) }}>
            <span style={HEAD(170, { fontStretch: '75%', color: '#B9BEC8' })}>KHATAM</span>
            <div style={{ position: 'absolute', left: -10, right: -10, top: 70, height: 16, borderRadius: 8, background: C.alert, transform: `scaleX(${strike})`, transformOrigin: 'left' }} />
          </div>
        )}
        {f >= K.nahi + 2 && (
          <div style={{ position: 'absolute', left: 420, top: 1050, padding: '6px 34px 14px', border: `10px solid ${C.alert}`, borderRadius: 18,
            transform: `rotate(-7deg) scale(${1 + 0.6 * (1 - stamp)})`, opacity: clamp(stamp * 3) * 0.95, ...HEAD(160, { color: C.alert, fontStretch: '85%' }) }}>NAHI!</div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: C.lunar, opacity: 0.45 * flash(f, K.bas, 5) + 0.3 * flash(f, K.nahi + 2, 4) }} />
      </AbsoluteFill>
    );
  }

  // SAAVDHAN (rest of intro2)
  if (f < K.jaise) {
    const p = slam(f, K.saav, 14, 0.45), pulse = Math.max(flash(f, K.saav, 14), flash(f, K.saav + 20, 14));
    const stripes = (top: number) => (
      <div style={{ position: 'absolute', left: -80, width: 1240, top, height: 74, transform: `translateX(${-((f * 3) % 79)}px)`,
        background: `repeating-linear-gradient(45deg, ${C.alert} 0 28px, #0E0E10 28px 56px)`, opacity: 0.95 }} />
    );
    const jao = slam(f, K.jao, 16, 0.5);
    return (
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 45%, #3A0D06 0%, #120405 70%)', overflow: 'hidden' }}>
        {stripes(266)}{stripes(1330)}
        <svg width={230} height={200} viewBox="0 0 230 200" style={{ position: 'absolute', left: 425, top: 450, transform: `scale(${0.5 + 0.5 * p})` }}>
          <path d="M115 10 L222 192 L8 192 Z" fill="none" stroke={C.alert} strokeWidth={16} strokeLinejoin="round" />
          <rect x={105} y={68} width={20} height={72} rx={8} fill={C.alert} /><circle cx={115} cy={164} r={12} fill={C.alert} />
        </svg>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 730, textAlign: 'center', transform: `scale(${1 + 0.35 * (1 - p)})` }}>
          <div style={HEAD(196, { color: C.alert, fontStretch: '82%', textShadow: '0 0 60px rgba(255,90,31,0.6)' })}>SAAVDHAN!</div>
        </div>
        {f >= K.jao && <div style={{ position: 'absolute', left: 0, right: 0, top: 960, textAlign: 'center', transform: `scale(${0.6 + 0.4 * jao})`, ...HEAD(110) }}>HO JAO</div>}
        <div style={{ position: 'absolute', inset: 0, boxShadow: `inset 0 0 ${220 + 120 * pulse}px rgba(255,40,20,${0.35 + 0.4 * pulse})` }} />
        <div style={{ position: 'absolute', inset: 0, background: C.alert, opacity: 0.22 * flash(f, K.saav, 4) }} />
      </AbsoluteFill>
    );
  }

  // intro3: build tiles -> bhool -> question panels
  const glitch = f >= K.bhool && f < K.bhool + 10;
  const fadeT = 1 - 0.82 * easeOutCubic(invLerp(K.bhool + 4, K.bhool + 14, f));
  const inQ = f >= K.cred;
  const buildP = slam(f, K.build, 14, 0.45);
  return (
    <AbsoluteFill style={{ background: C.graphite, overflow: 'hidden' }}>
      <Glow color={inQ ? C.alert : C.mint} a={0.22} />
      <Floor f={f} tint={inQ ? C.alert : C.mint} speed={inQ ? 0.02 : 0.05} opacity={0.45} />
      {!inQ && (
        <>
          {Array.from({ length: 22 }, (_, i) => {
            const y = 260 + hash(i, 3) * 1150, sp = 18 + hash(i, 5) * 26, x = ((hash(i, 7) * 1400 + (f - K.jaise) * sp) % 1500) - 200;
            return <div key={i} style={{ position: 'absolute', left: x, top: y, width: 120 + hash(i, 9) * 220, height: 3, background: C.mint, opacity: 0.25 * fadeT, transform: 'rotate(-8deg)' }} />;
          })}
          {f < K.apps + 8 && (
            <div style={{ position: 'absolute', left: SAFE.side, top: 610, opacity: 1 - invLerp(K.apps, K.apps + 8, f) }}>
              <div style={{ ...HEAD(150, { fontStretch: '80%' }), opacity: clamp(slam(f, K.jaise, 14, 0.55) * 2), transform: `translateY(${(1 - slam(f, K.jaise, 14, 0.55)) * 60}px)` }}>JAISE-JAISE</div>
              {f >= K.ai3 && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 26, marginTop: 14, transform: `scale(${1 + 0.3 * (1 - slam(f, K.ai3, 15, 0.5))})`, transformOrigin: 'left center' }}>
                  <span style={HEAD(176, { color: C.mint, textShadow: '0 0 50px rgba(31,158,110,0.6)' })}>AI</span>
                  <span style={HEAD(140, { fontStretch: '78%' })}>LEVERAGE</span>
                </div>
              )}
            </div>
          )}
          {f >= K.apps && <div style={{ position: 'absolute', left: SAFE.side, top: 300, ...MONO(30, C.mint), opacity: fadeT }}>JAISE-JAISE AI LEVERAGE KARKE</div>}
          {[K.apps, K.videos, K.webs].map((at, k) => {
            if (f < at) return null;
            const p = slam(f, at, 14, 0.5), j = glitch ? (hash(f, k) - 0.5) * 36 : 0;
            return (
              <div key={k} style={{ position: 'absolute', left: SAFE.side + k * 328, top: 420, width: 296, opacity: fadeT,
                transform: `translate(${j}px, ${(1 - p) * 700}px) rotate(${(1 - p) * (k - 1) * 18}deg)`, filter: glitch ? `drop-shadow(${j / 3}px 0 0 #22E1FF) drop-shadow(${-j / 3}px 0 0 ${C.alert})` : undefined }}>
                <div style={{ height: 296, borderRadius: 28, background: C.graphite2, border: '2px solid rgba(236,239,244,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: f >= K.build ? `0 0 ${40 + 30 * (1 - clamp((f - K.build) / 20))}px rgba(31,158,110,0.45)` : '0 20px 50px rgba(0,0,0,0.5)' }}><TileIcon k={k} /></div>
                <div style={{ marginTop: 16, textAlign: 'center', ...MONO(28, C.lunar) }}>{TILES[k]}</div>
              </div>
            );
          })}
          {f >= K.build && f < K.bhool + 8 && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: 850, textAlign: 'center', transform: `scale(${1 + 0.5 * (1 - buildP)}) translateX(${glitch ? (hash(f, 9) - 0.5) * 50 : 0}px)` }}>
              <div style={HEAD(230, { color: C.mint, textShadow: glitch ? `8px 0 0 #22E1FF, -8px 0 0 ${C.alert}` : '0 0 60px rgba(31,158,110,0.6)' })}>BUILD</div>
              <div style={{ ...MONO(32, C.lunar), marginTop: 18 }}>KAR RAHE HAIN</div>
            </div>
          )}
          {f >= K.bhool && (
            <div style={{ position: 'absolute', left: SAFE.side, top: 880 }}>
              <div style={MONO(34)}>WAISE HI LOG</div>
              <div style={{ display: 'flex', marginTop: 14 }}>
                {'BHOOL RAHE HAIN…'.split('').map((ch, i) => {
                  const p = easeOutCubic(invLerp(K.bhool + 4 + i * 1.3, K.bhool + 9 + i * 1.3, f));
                  return <span key={i} style={{ ...HEAD(110, { fontStretch: '75%' }), display: 'inline-block', whiteSpace: 'pre', opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>{ch}</span>;
                })}
              </div>
            </div>
          )}
        </>
      )}
      {inQ && (
        <>
          <QuestionPanel f={f} at={K.cred} next={K.access} k={0} />
          <QuestionPanel f={f} at={K.access} next={K.audit} k={1} />
          <QuestionPanel f={f} at={K.audit} next={K.human} k={2} />
          <QuestionPanel f={f} at={K.human} next={null} k={3} />
        </>
      )}
      <div style={{ position: 'absolute', inset: 0, background: C.lunar, opacity: 0.5 * flash(f, K.end - 3, 3) + 0.25 * flash(f, K.build, 4) }} />
    </AbsoluteFill>
  );
};
