// 08 · LONG-HORIZON AGENTS — B (illustrative reconstruction; master only).
// Entry: scene 07's workspace card (0.18 of the frame, centre) is the first node. HeroPullback reveals the skeleton of a
// workflow graph; the sample goal "Build and ship a dashboard" splits into PLAN -> SEARCH -> BUILD -> TEST -> DEBUG ->
// REVIEW -> DELIVER. Each node lights with a visible output (checklist, results, code, test log, a broken dashboard that is
// fixed in DEBUG while a side panel runs checks, review comments, the shipped dashboard). Evidence: Kimi Code Bench 3.0
// long-horizon, two bars on a 0-100 axis. Exit: the outputs converge into the finished app card, which collapses into one
// mint bar across the centre (960 x 8), the line scene 09 drops into its chart as the axis.
// All success marks belong to this labelled illustration; none of it is a Kimi run.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { KineticTitle } from '../components/KineticTitle';
import { ProvenanceLabel } from '../components/ProvenanceLabel';
import { SourceAttribution } from '../components/SourceAttribution';
import { AGENT_BG, BAR, BENCH_AXIS, CHECKS, CODE, DASH, DIFF, GOAL, INSPECTOR, LOOP, PLAN_ITEMS, REVIEW, SEARCH, STEPS, TEST_WORDS, TESTS, stepIndex, type Tok } from '../data/agentWorkflowData';
import { QF, QTRS } from '../data/fictionalFinance';
import { CLAIMS, LABELS, N, NAMES } from '../data/verifiedClaims';
import { clamp, dampedSpring, easeInCubic, easeInOutCubic, easeOutCubic, fmt, invLerp, lerp, reveal } from '../lib/anim';
import { useLayout } from '../lib/layout';
import { C, WORLD } from '../styles/theme';
import { F } from '../styles/typography';
import { FinanceDesk, sceneFrames, wordCue } from './FinanceResearch';
import type { SceneProps } from './types';

const CW = WORLD.code;
const FIN = WORLD.fin;
const W = 1920, H = 1080;
type Rect = { x: number; y: number; w: number; h: number };
const rgba = (h: string, a: number) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${a})`;
};
const decimals = (x: number) => (String(x).split('.')[1] ?? '').length;

// ------------------------------------------------------------------ layout (graph coordinates = screen at camera scale 1)
const CARD07 = { w: W * 0.18, h: H * 0.18 };          // the card scene 07 ends on
const THUMB = { w: 230, h: (230 * H) / W };             // the same card as the goal node's picture
const S0 = CARD07.w / THUMB.w;                          // camera scale that makes the two identical on frame 0
const GOAL_R: Rect = { x: W / 2 - THUMB.w / 2, y: 150, w: THUMB.w, h: THUMB.h + 56 };
const THUMB_C = { x: W / 2, y: GOAL_R.y + THUMB.h / 2 };
const NODE_W = 226, NODE_GAP = 26, NODE_Y = 452, NODE_H = 232, HEAD_H = 40;
const NODE_X0 = (W - (7 * NODE_W + 6 * NODE_GAP)) / 2;
const nodeR = (i: number): Rect => ({ x: NODE_X0 + i * (NODE_W + NODE_GAP), y: NODE_Y, w: NODE_W, h: NODE_H });
const thumbR = (i: number): Rect => { const n = nodeR(i); return { x: n.x + 8, y: n.y + HEAD_H + 4, w: n.w - 16, h: n.h - HEAD_H - 12 }; };
const BUS_Y = 414;
const INSP: Rect = { x: 1250, y: 104, w: 590, h: 290 };
const APP = { w: 560, h: 336 };

// ------------------------------------------------------------------ timeline
function timeline(dur: number) {
  const k = dur / 342, a = (x: number) => x * k;
  const cue = (re: RegExp, fb: number) => wordCue('master', 'agents', re, a(fb));
  const words = STEPS.slice(0, 5).map((s, i) => cue(s.word, [137, 150, 166, 180, 191][i]));
  const fix = cue(/^improve/i, 265) - a(4);
  const retest = fix + a(12);
  const review = retest + a(8), deliver = review + a(14);
  const act = [...words.slice(0, 4), words[4] + a(4), review, deliver];
  const exit0 = dur - 15;
  return {
    pull: [a(6), a(58)] as [number, number], ghost: a(10), title: a(20), reason: cue(/^goal/i, 83) - a(8),
    trunk: a(60), bus: a(68), appear: (i: number) => a(80) + i * a(6),
    act, fix, retest, testFail: act[3] + a(12), insp: act[4] + a(2), ev: act[4] + a(22),
    converge: [exit0, exit0 + a(8)] as [number, number], collapse: [exit0 + a(8), dur - 1] as [number, number], exit0,
  };
}
type TL = ReturnType<typeof timeline>;

type State = 'ghost' | 'pending' | 'active' | 'done' | 'fail';
function stateOf(i: number, f: number, T: TL): State {
  if (f < T.appear(i)) return 'ghost';
  if (f < T.act[i]) return 'pending';
  if (i === 3) { if (f >= T.retest + 6) return 'done'; if (f >= T.testFail) return 'fail'; return 'active'; }
  if (i === 4) return f >= T.fix + 12 ? 'done' : 'active';
  const next = i < 6 ? T.act[i + 1] : T.act[6] + 18;
  return f >= next ? 'done' : 'active';
}

// ------------------------------------------------------------------ small parts
const Txt: React.FC<{ x: number; y: number; px: number; font?: string; weight?: number; color?: string; ls?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ x, y, px, font = F.text, weight = 500, color = C.lunar, ls = 0, style, children }) => (
  <div style={{ position: 'absolute', left: x, top: y, fontFamily: font, fontSize: px, fontWeight: weight, color, letterSpacing: `${ls}em`, lineHeight: 1.2, whiteSpace: 'pre', ...style }}>{children}</div>
);

const Check: React.FC<{ s: number; p?: number; color?: string }> = ({ s, p = 1, color = C.mint }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" style={{ flex: 'none' }}>
    <circle cx={8} cy={8} r={7.4} fill={rgba(color, 0.16)} stroke={color} strokeWidth={1.3} />
    <path d="M4.6 8.3 L7 10.6 L11.6 5.7" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={12} strokeDashoffset={12 * (1 - p)} />
  </svg>
);
const Cross: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" style={{ flex: 'none' }}>
    <circle cx={8} cy={8} r={7.4} fill={rgba(C.red, 0.16)} stroke={C.red} strokeWidth={1.3} />
    <path d="M5.4 5.4 L10.6 10.6 M10.6 5.4 L5.4 10.6" stroke={C.red} strokeWidth={1.8} strokeLinecap="round" />
  </svg>
);
const Spinner: React.FC<{ s: number; f: number }> = ({ s, f }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" style={{ flex: 'none', transform: `rotate(${(f * 24) % 360}deg)` }}>
    <circle cx={8} cy={8} r={6.4} fill="none" stroke={rgba(C.cyan, 0.25)} strokeWidth={2} />
    <path d="M8 1.6 A6.4 6.4 0 0 1 14.4 8" fill="none" stroke={C.cyan} strokeWidth={2} strokeLinecap="round" />
  </svg>
);

/** The dashboard being built: sample data from scene 07. Designed at 400 x 240 and scaled. m = misalignment (0..1). */
const Dashboard: React.FC<{ w: number; m?: number; fixedAt?: number; f: number; shipped?: number; ok?: number }> = ({ w, m = 0, f, shipped = 0, ok = 0 }) => {
  const s = w / 400;
  const base = 214, ph = 96, px0 = 34, pw = 350;
  return (
    <div style={{ position: 'relative', width: w, height: 240 * s, overflow: 'hidden', borderRadius: 10 * s }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 400, height: 240, transform: `scale(${s})`, transformOrigin: '0 0', background: FIN.paper, fontFamily: F.text }}>
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: 30, background: FIN.ink, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px' }}>
          <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: '0.12em', color: C.lunar, fontWeight: 600 }}>{DASH.title}</span>
          <span style={{ fontFamily: F.mono, fontSize: 9, color: C.amber, border: `1px solid ${rgba(C.amber, 0.7)}`, borderRadius: 3, padding: '1px 5px' }}>{DASH.tag}</span>
        </div>
        {DASH.kpis.map((k, i) => {
          const off = i === 1 ? m : 0;
          return (
            <div key={k.label} style={{ position: 'absolute', left: 14 + i * 126, top: 40, width: 116, height: 52, borderRadius: 6, background: '#fff',
              border: `1px solid ${FIN.rule}`, transform: `translate(${off * 15}px, ${off * 8}px)`,
              boxShadow: i === 1 && off > 0.02 ? `0 0 0 2px ${C.red}` : i === 1 && ok > 0 ? `0 0 0 2px ${rgba(FIN.ok, ok)}` : 'none' }}>
              <div style={{ position: 'absolute', left: 10, top: 8, fontFamily: F.mono, fontSize: 8.5, color: FIN.mute, letterSpacing: '0.04em' }}>{k.label}</div>
              <div style={{ position: 'absolute', left: 10, top: 22, fontSize: 18, fontWeight: 700, color: FIN.ink }}>{k.value}</div>
            </div>
          );
        })}
        <svg width={400} height={240} style={{ position: 'absolute', left: 0, top: 0 }}>
          {[0, 0.5, 1].map((t) => <line key={t} x1={px0} x2={px0 + pw} y1={base - t * ph} y2={base - t * ph} stroke={t === 0 ? '#AEB8C8' : '#E3E8F0'} strokeWidth={1} />)}
          {QTRS.map((q, j) => {
            const gw = pw / 4, cx = px0 + gw * (j + 0.5);
            return (
              <g key={q}>
                {[QF.FY24[j], QF.FY25[j]].map((v, y) => {
                  const hh = (v / 400) * ph, x = y ? cx + 2 : cx - 2 - 26;
                  return <rect key={y} x={x} y={base - hh} width={26} height={hh} rx={2} fill={y ? FIN.accent : '#8E9AB2'} />;
                })}
                <text x={cx} y={base + 13} fontFamily={F.mono} fontSize={9} fill={FIN.mute} textAnchor="middle">{q}</text>
              </g>
            );
          })}
        </svg>
        {shipped > 0 && (
          <div style={{ position: 'absolute', right: 12, top: 100, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 20, background: rgba(FIN.ok, 0.14),
            border: `1px solid ${rgba(FIN.ok, 0.6)}`, opacity: shipped, transform: `scale(${0.85 + 0.15 * shipped})`, transformOrigin: 'right center' }}>
            <svg width={11} height={11} viewBox="0 0 16 16"><path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke={FIN.ok} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, color: '#1E7A57' }}>{DASH.shipped}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const tokColor: Record<Tok[0], string> = { kw: CW.kw, fn: CW.fn, str: CW.str, num: CW.num, tx: CW.text, com: CW.com, type: CW.type };

/** what each node shows once it runs */
const NodeOutput: React.FC<{ i: number; f: number; T: TL; r: Rect }> = ({ i, f, T, r }) => {
  const t = f - T.act[i];
  const row = (k: number, every = 5, d = 6) => easeOutCubic(invLerp(k * every, k * every + d, t));
  const pad = 12;
  if (i === 0) return (
    <>
      <Txt x={pad} y={10} px={11} font={F.mono} color={CW.mute}>plan.md</Txt>
      {PLAN_ITEMS.map((it, k) => {
        const p = row(k, 4), tick = easeOutCubic(invLerp(10 + k * 6, 16 + k * 6, t));
        return (
          <div key={it} style={{ position: 'absolute', left: pad, top: 36 + k * 32, display: 'flex', alignItems: 'center', gap: 9, opacity: p, transform: `translateX(${(1 - p) * 8}px)` }}>
            <div style={{ width: 15, height: 15, borderRadius: 4, border: `1.5px solid ${tick > 0.5 ? C.mint : CW.mute}`, background: tick > 0.5 ? rgba(C.mint, 0.18) : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {tick > 0 && <svg width={11} height={11} viewBox="0 0 16 16"><path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke={C.mint} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={16} strokeDashoffset={16 * (1 - tick)} /></svg>}
            </div>
            <span style={{ fontFamily: F.text, fontSize: 13.5, color: CW.text, fontWeight: 500 }}>{it}</span>
          </div>
        );
      })}
    </>
  );
  if (i === 1) return (
    <>
      <div style={{ position: 'absolute', left: pad, top: 10, right: pad, height: 26, borderRadius: 13, border: `1px solid ${CW.line}`, background: CW.bg, display: 'flex', alignItems: 'center', gap: 7, padding: '0 10px', opacity: row(0, 1) }}>
        <svg width={11} height={11} viewBox="0 0 16 16"><circle cx={7} cy={7} r={5} fill="none" stroke={CW.mute} strokeWidth={2} /><path d="M11 11 L15 15" stroke={CW.mute} strokeWidth={2} strokeLinecap="round" /></svg>
        <span style={{ fontFamily: F.mono, fontSize: 10.5, color: CW.text, whiteSpace: 'nowrap', overflow: 'hidden' }}>{SEARCH.query}</span>
      </div>
      {SEARCH.results.map((res, k) => {
        const p = row(k + 1, 4);
        return (
          <div key={res.title} style={{ position: 'absolute', left: pad, right: pad, top: 48 + k * 40, opacity: p, transform: `translateY(${(1 - p) * 6}px)`, borderLeft: `2px solid ${k === 0 ? C.cyan : CW.line}`, paddingLeft: 8 }}>
            <div style={{ fontFamily: F.text, fontSize: 12.5, fontWeight: 600, color: C.lunar, whiteSpace: 'nowrap' }}>{res.title}</div>
            <div style={{ fontFamily: F.mono, fontSize: 10, color: CW.mute, marginTop: 3 }}>{res.meta}</div>
          </div>
        );
      })}
    </>
  );
  if (i === 2) return (
    <>
      {CODE.map(([ind, toks], k) => {
        const p = row(k, 2, 4);
        return (
          <div key={k} style={{ position: 'absolute', left: pad, top: 10 + k * 19, display: 'flex', gap: 8, opacity: p, fontFamily: F.mono, fontSize: 10.5, whiteSpace: 'pre' }}>
            <span style={{ color: CW.com, width: 12, textAlign: 'right' }}>{k + 1}</span>
            <span>{' '.repeat(ind * 2)}{toks.map(([kind, tx], j) => <span key={j} style={{ color: tokColor[kind] }}>{tx}</span>)}</span>
          </div>
        );
      })}
    </>
  );
  if (i === 3) {
    const rerun = f >= T.retest;
    return (
      <>
        <Txt x={pad} y={10} px={11} font={F.mono} color={CW.mute}>{rerun ? `$ test --${TEST_WORDS.rerun}` : '$ test'}</Txt>
        {TESTS.map((ts, k) => {
          const p = row(k + 1, 3, 4);
          const pass = ts.ok || f >= T.retest + 4;
          return (
            <div key={ts.name} style={{ position: 'absolute', left: pad, top: 36 + k * 30, display: 'flex', alignItems: 'center', gap: 8, opacity: p }}>
              <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: CW.bg, background: pass ? C.mint : C.red, borderRadius: 3, padding: '2px 5px' }}>{pass ? TEST_WORDS.pass : TEST_WORDS.fail}</span>
              <span style={{ fontFamily: F.mono, fontSize: 10.5, color: pass ? CW.text : '#FFB0B0', whiteSpace: 'nowrap' }}>{ts.name}</span>
            </div>
          );
        })}
        <div style={{ position: 'absolute', left: pad, right: pad, top: 134, height: 1, background: CW.line, opacity: row(4, 3) }} />
        <div style={{ position: 'absolute', left: pad, top: 144, display: 'flex', gap: 8, alignItems: 'center', opacity: row(4, 3) }}>
          {f >= T.retest + 4 ? <Check s={15} /> : <Cross s={15} />}
          <span style={{ fontFamily: F.mono, fontSize: 10.5, color: f >= T.retest + 4 ? C.mint : '#FFB0B0' }}>{f >= T.retest + 4 ? TEST_WORDS.pass : TEST_WORDS.fail}</span>
        </div>
      </>
    );
  }
  if (i === 4) {
    const m = 1 - clamp(dampedSpring((f - T.fix) / 30, 16, 0.55));
    const okP = f >= T.fix ? 1 - invLerp(T.fix + 14, T.fix + 40, f) : 0;
    return <div style={{ position: 'absolute', left: 9, top: 26 }}><Dashboard w={r.w - 18} m={f < T.fix ? 1 : m} f={f} ok={okP} /></div>;
  }
  if (i === 5) return (
    <>
      {REVIEW.map((c, k) => {
        const p = row(k, 7, 8);
        return (
          <div key={c.text} style={{ position: 'absolute', left: pad + (k ? 18 : 0), right: pad, top: 14 + k * 66, opacity: p, transform: `translateY(${(1 - p) * 8}px)`, background: CW.panel2,
            border: `1px solid ${CW.line}`, borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 14, borderRadius: 7, background: k ? C.violet : C.cyan, opacity: 0.85 }} />
              <span style={{ fontFamily: F.mono, fontSize: 9.5, color: CW.mute }}>{c.who}</span>
              {c.done && <span style={{ marginLeft: 'auto', opacity: easeOutCubic(invLerp(k * 7 + 10, k * 7 + 16, t)) }}><Check s={13} /></span>}
            </div>
            <div style={{ fontFamily: F.text, fontSize: 12.5, color: C.lunar, marginTop: 4, fontWeight: 500 }}>{c.text}</div>
          </div>
        );
      })}
    </>
  );
  // deliver
  const sh = easeOutCubic(invLerp(10, 18, t));
  return <div style={{ position: 'absolute', left: 9, top: 26 }}><Dashboard w={r.w - 18} f={f} shipped={sh} /></div>;
};

const NodeCard: React.FC<{ i: number; f: number; T: TL; out: number }> = ({ i, f, T, out }) => {
  const r = nodeR(i), st = stateOf(i, f, T);
  const ghostP = easeOutCubic(invLerp(T.ghost + i * 2, T.ghost + 14 + i * 2, f));
  const appear = easeOutCubic(invLerp(T.appear(i), T.appear(i) + 12, f));
  const actP = easeOutCubic(invLerp(T.act[i], T.act[i] + 10, f));
  const border = st === 'fail' ? C.red : st === 'done' ? rgba(C.mint, 0.55) : st === 'active' ? C.cyan : '#26324E';
  const glow = st === 'active' ? `0 0 0 1px ${C.cyan}, 0 0 28px ${rgba(C.cyan, 0.28)}` : st === 'fail' ? `0 0 0 1px ${C.red}, 0 0 24px ${rgba(C.red, 0.25)}` : 'none';
  if (ghostP <= 0) return null;
  const tr = thumbR(i);
  const name = STEPS[i].name;
  return (
    <div style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, opacity: out }}>
      {/* the slot the graph will fill (seen during the pullback) */}
      {appear < 1 && <div style={{ position: 'absolute', inset: 0, borderRadius: 12, border: `1.5px dashed ${rgba(C.silver, 0.28)}`, opacity: ghostP * (1 - appear) }} />}
      {appear > 0 && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: 'linear-gradient(180deg, #111A30 0%, #0C1324 100%)', border: `1px solid ${border}`,
          boxShadow: `${glow === 'none' ? '' : glow + ', '}0 24px 50px rgba(0,0,0,0.45)`, opacity: appear, transform: `translateY(${(1 - appear) * -18}px) scale(${0.94 + 0.06 * appear})`, transformOrigin: '50% 0%', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: HEAD_H, display: 'flex', alignItems: 'center', gap: 9, padding: '0 12px', borderBottom: `1px solid ${CW.line}` }}>
            <span style={{ fontFamily: F.mono, fontSize: 12, color: st === 'pending' ? C.dim : C.steel, fontWeight: 600 }}>{stepIndex(i)}</span>
            <span style={{ fontFamily: F.display, fontSize: 15, fontWeight: 650, letterSpacing: '0.05em', color: st === 'pending' ? C.steel : C.lunar }}>{name}</span>
            <span style={{ marginLeft: 'auto', display: 'flex' }}>
              {st === 'pending' && <span style={{ width: 10, height: 10, borderRadius: 5, border: `1.5px solid ${C.dim}` }} />}
              {st === 'active' && <Spinner s={16} f={f} />}
              {st === 'done' && <Check s={17} p={easeOutCubic(invLerp(0, 8, f - (i === 3 ? T.retest + 6 : i === 4 ? T.fix + 12 : i < 6 ? T.act[i + 1] : T.act[6] + 18)))} />}
              {st === 'fail' && <Cross s={17} />}
            </span>
          </div>
          <div style={{ position: 'absolute', left: tr.x - r.x, top: tr.y - r.y, width: tr.w, height: tr.h, borderRadius: 8, background: CW.bg, border: `1px solid ${CW.line}`, overflow: 'hidden' }}>
            {/* skeleton until the step runs */}
            {actP < 1 && [0, 1, 2, 3].map((k) => <div key={k} style={{ position: 'absolute', left: 12, top: 16 + k * 30, height: 7, width: `${[62, 78, 50, 70][k]}%`, borderRadius: 4, background: '#18223A', opacity: 1 - actP }} />)}
            {f >= T.act[i] && <div style={{ position: 'absolute', inset: 0, opacity: actP }}><NodeOutput i={i} f={f} T={T} r={tr} /></div>}
          </div>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ the graph's lines
const GraphLines: React.FC<{ f: number; T: TL; out: number }> = ({ f, T, out }) => {
  const trunk = easeInOutCubic(invLerp(T.trunk, T.trunk + 10, f));
  const bus = easeInOutCubic(invLerp(T.bus, T.bus + 22, f));
  const cx = (i: number) => nodeR(i).x + NODE_W / 2;
  const x0 = cx(0), x6 = cx(6), gy = GOAL_R.y + GOAL_R.h;
  const lit = (i: number) => f >= T.act[i];
  const dimC = '#2A3B5E';
  // progress pulse: travels the bus to the active node
  const activeI = STEPS.reduce((m, _, i) => (f >= T.act[i] ? i : m), -1);
  const pulseX = activeI >= 0 ? lerp(activeI ? cx(activeI - 1) : W / 2, cx(activeI), easeInOutCubic(invLerp(T.act[activeI] - 8, T.act[activeI] + 2, f))) : W / 2;
  const loop = easeInOutCubic(invLerp(T.fix + 6, T.retest + 2, f));
  const lx0 = nodeR(4).x + NODE_W / 2, lx1 = nodeR(3).x + NODE_W / 2, ly = NODE_Y + NODE_H;
  const loopPath = `M${lx0},${ly + 2} C${lx0},${ly + 40} ${lx1},${ly + 40} ${lx1},${ly + 2}`;
  return (
    <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: out }}>
      {/* trunk from the goal down to the bus, then the bus across all steps */}
      <line x1={W / 2} x2={W / 2} y1={gy} y2={lerp(gy, BUS_Y, trunk)} stroke={C.cyan} strokeWidth={2} opacity={trunk > 0 ? 0.9 : 0} />
      {bus > 0 && <line x1={lerp(W / 2, x0, bus)} x2={lerp(W / 2, x6, bus)} y1={BUS_Y} y2={BUS_Y} stroke={dimC} strokeWidth={2} />}
      {bus > 0 && activeI >= 0 && <line x1={Math.min(W / 2, x0)} x2={pulseX} y1={BUS_Y} y2={BUS_Y} stroke={C.cyan} strokeWidth={2} opacity={0.0} />}
      {STEPS.map((_, i) => {
        const d = easeOutCubic(invLerp(T.appear(i) - 4, T.appear(i) + 6, f));
        if (d <= 0) return null;
        const x = cx(i);
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={BUS_Y} y2={lerp(BUS_Y, NODE_Y, d)} stroke={lit(i) ? C.cyan : dimC} strokeWidth={2} />
            <circle cx={x} cy={BUS_Y} r={4} fill={lit(i) ? C.cyan : dimC} />
            {i < 6 && (
              <path d={`M${nodeR(i).x + NODE_W + 7},${NODE_Y + NODE_H / 2 - 6} l7,6 l-7,6`} fill="none" stroke={f >= T.act[i + 1] ? C.cyan : dimC} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={d} />
            )}
          </g>
        );
      })}
      {activeI >= 0 && bus >= 1 && <circle cx={pulseX} cy={BUS_Y} r={6} fill={C.cyan} opacity={0.95} style={{ filter: `drop-shadow(0 0 8px ${C.cyan})` }} />}
      {/* the improve loop: DEBUG sends its fix back through TEST */}
      {loop > 0 && (
        <g>
          <path d={loopPath} fill="none" stroke={f >= T.retest + 6 ? C.mint : C.cyan} strokeWidth={2} strokeDasharray={420} strokeDashoffset={420 * (1 - loop)} />
          {loop >= 1 && <path d={`M${lx1 - 6},${ly + 12} L${lx1},${ly + 3} L${lx1 + 6},${ly + 12}`} fill="none" stroke={f >= T.retest + 6 ? C.mint : C.cyan} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
          <text x={(lx0 + lx1) / 2} y={ly + 22} fontFamily={F.mono} fontSize={13} fill={C.silver} textAnchor="middle" opacity={loop}>{LOOP.label}</text>
        </g>
      )}
    </svg>
  );
};

// ------------------------------------------------------------------ DEBUG inspector (side panel runs checks)
const Inspector: React.FC<{ f: number; T: TL; out: number }> = ({ f, T, out }) => {
  const p = easeOutCubic(invLerp(T.insp, T.insp + 14, f));
  if (p <= 0) return null;
  const m = f < T.fix ? 1 : 1 - clamp(dampedSpring((f - T.fix) / 30, 16, 0.55));
  const okP = f >= T.fix ? 1 - invLerp(T.fix + 16, T.fix + 44, f) : 0;
  const diff = easeOutCubic(invLerp(T.fix - 6, T.fix + 4, f));
  const callout = easeInOutCubic(invLerp(T.insp, T.insp + 12, f));
  const dn = nodeR(4);
  return (
    <>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: out }}>
        <path d={`M${dn.x + NODE_W / 2},${NODE_Y - 2} C${dn.x + NODE_W / 2},${INSP.y + INSP.h + 30} ${INSP.x + 120},${INSP.y + INSP.h + 30} ${INSP.x + 120},${INSP.y + INSP.h}`}
          fill="none" stroke={C.cyan} strokeWidth={1.6} strokeDasharray="5 5" opacity={0.75 * callout} />
      </svg>
      <div style={{ position: 'absolute', left: INSP.x, top: INSP.y, width: INSP.w, height: INSP.h, borderRadius: 14, background: 'linear-gradient(180deg, #111A30, #0B1222)',
        border: `1px solid ${rgba(C.cyan, 0.45)}`, boxShadow: `0 30px 60px rgba(0,0,0,0.5), 0 0 30px ${rgba(C.cyan, 0.12)}`, opacity: p * out,
        transform: `translateY(${(1 - p) * 16}px) scale(${0.97 + 0.03 * p})`, transformOrigin: '20% 100%', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 16, top: 12, fontFamily: F.mono, fontSize: 13, letterSpacing: '0.08em', color: C.silver }}>{INSPECTOR.title}</div>
        <div style={{ position: 'absolute', left: 16, top: 38 }}><Dashboard w={330} m={m} f={f} ok={okP} /></div>
        <div style={{ position: 'absolute', left: 16, top: 38 + 198 + 8, display: 'flex', flexDirection: 'column', gap: 4, fontFamily: F.mono, fontSize: 12.5, opacity: diff }}>
          <span style={{ color: '#FF9A9A' }}>{DIFF.del}</span>
          <span style={{ color: C.mint }}>{DIFF.add}</span>
        </div>
        <div style={{ position: 'absolute', left: 366, top: 38, right: 14, bottom: 14, borderLeft: `1px solid ${CW.line}`, paddingLeft: 14 }}>
          <div style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: '0.14em', color: C.steel, marginBottom: 12 }}>{INSPECTOR.checks}</div>
          {CHECKS.map((c, k) => {
            const t0 = T.insp + 10 + k * 7;
            const shown = easeOutCubic(invLerp(t0, t0 + 6, f));
            const settled = f >= t0 + 10;
            const pass = !c.fixes || (k === 1 ? f >= T.fix + 8 : f >= T.retest + 4);
            return (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 9, height: 38, opacity: shown }}>
                {!settled ? <Spinner s={16} f={f} /> : pass ? <Check s={16} p={easeOutCubic(invLerp(0, 8, f - (c.fixes ? (k === 1 ? T.fix + 8 : T.retest + 4) : t0 + 10)))} /> : <Cross s={16} />}
                <span style={{ fontFamily: F.text, fontSize: 14, fontWeight: 500, color: settled && !pass ? '#FFB0B0' : C.lunar, whiteSpace: 'nowrap' }}>{c.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

// ------------------------------------------------------------------ evidence: two bars on a 0-100 axis
const Evidence: React.FC<{ f: number; T: TL; out: number }> = ({ f, T, out }) => {
  const a = T.ev;
  const p = easeOutCubic(invLerp(a, a + 12, f));
  if (p <= 0) return null;
  const X = 1040, Y = 726, nameW = 128, trackX = X + nameW, trackW = 520;
  const rows = [
    { name: NAMES.modelShort, v: N.codeBench.kimi, col: C.cyan, txt: C.lunar },
    { name: NAMES.predecessorShort, v: N.codeBench.k3, col: C.steel, txt: C.silver },
  ];
  const g = easeOutCubic(invLerp(a + 8, a + 34, f));
  return (
    <div style={{ position: 'absolute', left: X, top: Y, width: 800, opacity: p * out, transform: `translateY(${(1 - p) * 12}px)` }}>
      <div style={{ fontFamily: F.mono, fontSize: 19, letterSpacing: '0.08em', color: C.lunar, fontWeight: 600 }}>{CLAIMS.codeBench.display}</div>
      <svg width={800} height={98} style={{ position: 'absolute', left: 0, top: 34, overflow: 'visible' }}>
        {BENCH_AXIS.ticks.map((t) => {
          const x = nameW + (t / BENCH_AXIS.max) * trackW;
          return (
            <g key={t}>
              <line x1={x} x2={x} y1={0} y2={70} stroke={t === 0 ? rgba(C.silver, 0.6) : rgba(C.silver, 0.14)} strokeWidth={1} />
              <text x={x} y={88} fontFamily={F.mono} fontSize={13} fill={C.steel} textAnchor="middle">{t === BENCH_AXIS.max ? `${t}%` : t}</text>
            </g>
          );
        })}
        {rows.map((r, i) => {
          const y = 6 + i * 34, w = (r.v / BENCH_AXIS.max) * trackW * g;
          return (
            <g key={r.name}>
              <text x={0} y={y + 17} fontFamily={F.text} fontSize={18} fontWeight={600} fill={r.txt}>{r.name}</text>
              <path d={`M${nameW},${y} L${nameW + Math.max(0, w - 4)},${y} Q${nameW + w},${y} ${nameW + w},${y + 4} L${nameW + w},${y + 20} Q${nameW + w},${y + 24} ${nameW + Math.max(0, w - 4)},${y + 24} L${nameW},${y + 24} Z`} fill={r.col} />
              <text x={nameW + w + 12} y={y + 18} fontFamily={F.text} fontSize={20} fontWeight={650} fill={r.txt}>{`${fmt(r.v * g, decimals(r.v))}%`}</text>
            </g>
          );
        })}
      </svg>
      <SourceAttribution id="codeBench" at={a + 10} size={16} style={{ position: 'absolute', left: 0, top: 136, width: 800 }} />
    </div>
  );
};

// ------------------------------------------------------------------ scene
export const AgentWorkflow: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const T = timeline(dur);
  const fin = sceneFrames('master', 'finance') || 414;
  // camera: HeroPullback from the card, then a slow drift toward the running node
  const pull = easeInOutCubic(invLerp(T.pull[0], T.pull[1], f));
  const activeI = STEPS.reduce((m, _, i) => (f >= T.act[i] ? i : m), -1);
  const settle = easeInOutCubic(invLerp(T.exit0 - 16, T.exit0, f));
  const drift = activeI >= 0 ? (nodeR(activeI).x + NODE_W / 2 - W / 2) * 0.035 : 0;
  const driftS = lerp(1, 1.03, easeInOutCubic(invLerp(T.pull[1], T.exit0 - 16, f)));
  const s = lerp(S0, 1, pull) * lerp(driftS, 1, settle);
  const cx = lerp(THUMB_C.x, W / 2, pull) + lerp(drift, 0, settle) * pull;
  const cy = lerp(THUMB_C.y, H / 2, pull);
  // exit
  const conv = easeInOutCubic(invLerp(T.converge[0], T.converge[1], f));
  const col = easeInOutCubic(invLerp(T.collapse[0], T.collapse[1], f));
  const out = 1 - easeInCubic(invLerp(T.converge[0], T.converge[0] + 6, f));
  // goal card
  const lab = easeOutCubic(invLerp(T.pull[0] + 8, T.pull[0] + 26, f));
  const goalLit = easeOutCubic(invLerp(T.trunk - 6, T.trunk + 6, f));
  const ringR = lerp(16 / S0, 14, pull);
  // the finished app card: from the DELIVER node to the centre, then into the bar
  const dr = thumbR(6);
  const appFrom = { x: dr.x + 9, y: dr.y + 26, w: dr.w - 18 };
  const toScreen = (x: number, y: number) => [W / 2 + (x - cx) * s, H / 2 + (y - cy) * s];
  const [ax0, ay0] = toScreen(appFrom.x, appFrom.y);
  const aw0 = appFrom.w * s, ah0 = aw0 * 0.6;
  const appX = lerp(ax0, W / 2 - APP.w / 2, conv), appY = lerp(ay0, H / 2 - APP.h / 2, conv), appW = lerp(aw0, APP.w, conv);
  const appH = appW * 0.6;
  const barW = lerp(appW, BAR.w, col), barH = lerp(appH, BAR.h, col);
  const barX = lerp(appX, (W - BAR.w) / 2, col), barY = lerp(appY, (H - BAR.h) / 2, col);
  const fitTall = L.tall ? L.w / W : 1;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(110% 90% at 50% 50%, ${AGENT_BG.inner} 0%, ${AGENT_BG.outer} 75%)`, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: L.tall ? (L.h - H * fitTall) / 2 : 0, width: W, height: H, transform: `scale(${fitTall})`, transformOrigin: '0 0' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: `translate(${W / 2}px, ${H / 2}px) scale(${s.toFixed(5)}) translate(${-cx}px, ${-cy}px)` }}>
          {/* graph paper */}
          <svg width={W * 2} height={H * 2} style={{ position: 'absolute', left: -W / 2, top: -H / 2, opacity: 0.5 * easeOutCubic(invLerp(T.ghost - 6, T.ghost + 20, f)) * out }}>
            <defs><pattern id="agent-dots" width={32} height={32} patternUnits="userSpaceOnUse"><circle cx={1.5} cy={1.5} r={1.2} fill="rgba(168,179,199,0.18)" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#agent-dots)" />
          </svg>
          <GraphLines f={f} T={T} out={out} />
          {STEPS.map((_, i) => {
            if (i === 6 && conv > 0) return <NodeCard key={i} i={i} f={f} T={T} out={out} />;
            const t = i === 6 ? 0 : easeInOutCubic(invLerp(T.converge[0] + (6 - i) * 0.6, T.converge[1] - 1, f));
            if (t <= 0) return <NodeCard key={i} i={i} f={f} T={T} out={1} />;
            const r = nodeR(i), dx = (cx - (r.x + r.w / 2)) * t, dy = (cy - (r.y + r.h / 2)) * t;
            return (
              <div key={i} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `translate(${dx}px, ${dy}px)`, opacity: 1 - t }}>
                <div style={{ transform: `scale(${1 - 0.6 * t})`, transformOrigin: `${r.x + r.w / 2}px ${r.y + r.h / 2}px` }}><NodeCard i={i} f={f} T={T} out={1} /></div>
              </div>
            );
          })}
          {/* the goal node: scene 07's workspace card */}
          {(() => {
            const t = easeInOutCubic(invLerp(T.converge[0], T.converge[1] - 1, f));
            const dx = (cx - THUMB_C.x) * t, dy = (cy - THUMB_C.y) * t;
            return (
              <div style={{ position: 'absolute', left: GOAL_R.x, top: GOAL_R.y, width: GOAL_R.w, height: lerp(THUMB.h, GOAL_R.h, lab), borderRadius: ringR,
                background: '#0E1526', overflow: 'hidden', opacity: 1 - t, transform: `translate(${dx}px, ${dy}px) scale(${1 - 0.5 * t})`,
                boxShadow: `0 ${30 / S0}px ${80 / S0}px rgba(0,0,0,0.55), 0 0 0 ${1.5 / S0}px ${goalLit > 0 ? rgba(C.cyan, 0.4 + 0.4 * goalLit) : 'rgba(232,237,246,0.4)'}${goalLit > 0 ? `, 0 0 ${30 * goalLit}px ${rgba(C.cyan, 0.25)}` : ''}` }}>
                <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `scale(${THUMB.w / W})`, transformOrigin: '0 0' }}>
                  <FinanceDesk f={fin - 1} dur={fin} variant="master" />
                </div>
                {lab > 0 && (
                  <div style={{ position: 'absolute', left: 0, right: 0, top: THUMB.h, height: GOAL_R.h - THUMB.h, borderTop: `1px solid ${rgba(C.cyan, 0.3)}`, padding: '8px 12px', boxSizing: 'border-box', opacity: lab }}>
                    <div style={{ fontFamily: F.mono, fontSize: 10.5, letterSpacing: '0.14em', color: C.cyan, fontWeight: 600 }}>{GOAL.kicker}</div>
                    <div style={{ fontFamily: F.text, fontSize: 16.5, color: C.lunar, fontWeight: 650, marginTop: 4, whiteSpace: 'nowrap' }}>{GOAL.text}</div>
                  </div>
                )}
              </div>
            );
          })()}
          <Inspector f={f} T={T} out={out} />
        </div>
        {/* screen-space type */}
        <div style={{ position: 'absolute', left: 80, top: 150, opacity: out * reveal(f, T.reason - 2, 6) }}>
          <KineticTitle text="REASON" fx="reason" at={T.reason} size={76} weight={700} tracking={0.04} accent={C.cyan} />
        </div>
        <div style={{ position: 'absolute', left: 80, top: 742, display: 'flex', flexDirection: 'column', gap: 8, opacity: out }}>
          <KineticTitle text="LONG-HORIZON" fx="rise" at={T.title} size={50} weight={650} tracking={0.01} />
          <KineticTitle text="AGENTIC WORK" fx="rise" at={T.title + 6} size={50} weight={650} tracking={0.01} />
        </div>
        <Evidence f={f} T={T} out={out} />
        {/* exit: the finished app card, then the bar */}
        {conv > 0 && (
          <div style={{ position: 'absolute', left: barX, top: barY, width: barW, height: barH,
            borderRadius: col > 0 ? lerp(10 * (appW / 400), BAR.h / 2, col) : 10 * (appW / 400), overflow: 'hidden', background: col > 0 ? BAR.color : 'transparent',
            boxShadow: `0 0 ${36 * Math.sin(Math.PI * col)}px ${rgba(BAR.color, 0.6)}${col < 0.5 ? `, 0 30px 70px rgba(0,0,0,${0.55 * (1 - col * 2)})` : ''}` }}>
            <div style={{ opacity: 1 - easeOutCubic(invLerp(0, 0.4, col)) }}><Dashboard w={barW} f={f} shipped={1} /></div>
          </div>
        )}
      </div>
      <AbsoluteFill style={{ opacity: 1 - easeInOutCubic(invLerp(T.collapse[0], T.collapse[1] - 2, f)) }}>
        <ProvenanceLabel kind="B" at={-12} />
        <div style={{ position: 'absolute', left: L.safe.side, top: L.safe.top + 50, fontFamily: F.mono, fontSize: L.t.label * 0.86, color: C.silver,
          opacity: 1 - easeInOutCubic(invLerp(T.pull[0] + 10, T.pull[0] + 24, f)) }}>{LABELS.fictional}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
