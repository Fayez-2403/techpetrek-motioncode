// Carousel slides 2-7 (6 s each, 1080 x 1350): the facts, in the ep 01 light look (sky gradient, acrylic panels, navy
// type, cyan + magenta accents) with the Bro & Bhai hosts. Every claim is a row in docs/factcheck.md (README at
// commit 05ad7c8, re-checked 2 Nov 2026). Each element lands on its time in events.json (the mixer puts a tick there);
// after ~3.5 s the slide holds, readable, with only slow living motion. Pure in t.
import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from 'remotion';
import { C, FONT, depth } from '../themes/tokens';
import { clamp, dampedSpring, easeOutCubic, invLerp } from '../animation/anim';
import EV from './events.json';
import { Logo } from './Logo';

const T = () => useCurrentFrame() / EV.fps;
const W = 1080, H = 1350;
/** land: rise 36 px + fade, spring settle (decelerates in) */
const land = (t: number, at: number, dy = 36): React.CSSProperties => {
  const s = dampedSpring(t - at, 14, 0.72);
  return { opacity: clamp((t - at) / 0.16), transform: `translateY(${(1 - s) * dy}px)` };
};
const pop = (t: number, at: number): React.CSSProperties => {
  const s = dampedSpring(t - at, 16, 0.5);
  return { opacity: clamp((t - at) / 0.1), transform: `scale(${0.5 + 0.5 * s})` };
};
const abs = (x: number, y: number, st: React.CSSProperties = {}): React.CSSProperties => ({ position: 'absolute', left: x, top: y, ...st });

const Frame: React.FC<{ n: number; kicker: string; kcol?: string; audio: string; children: React.ReactNode }> = ({ n, kicker, kcol = C.cyan, audio, children }) => {
  const t = T();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(170deg, ${C.sky0}, ${C.sky1} 60%, #ffffff)`, overflow: 'hidden' }}>
      <Audio src={staticFile(`audio/${audio}.wav`)} />
      <div style={{ position: 'absolute', left: -200 + 30 * Math.sin(t * 0.6), top: -160, width: 760, height: 760, borderRadius: '50%', background: `radial-gradient(${C.cyan}33, transparent 65%)` }} />
      <div style={{ position: 'absolute', right: -260, bottom: 120 + 30 * Math.cos(t * 0.5), width: 820, height: 820, borderRadius: '50%', background: `radial-gradient(${C.magenta}1f, transparent 65%)` }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(11,27,58,0.07) 2px, transparent 2px)', backgroundSize: '36px 36px' }} />
      <div style={abs(60, 60, { ...land(t, EV.info[`s${n}` as 's2'][0], 20), padding: '10px 20px', borderRadius: 14, background: kcol, color: '#fff', fontFamily: FONT.mono, fontWeight: 800, fontSize: 26, letterSpacing: '0.06em' })}>{kicker}</div>
      <div style={abs(W - 60 - 150, 60, { width: 150, textAlign: 'right', fontFamily: FONT.mono, fontWeight: 800, fontSize: 28, color: C.navy2 })}>{n}/7{n < 7 ? <> <span style={{ color: C.cyan, display: 'inline-block', transform: `translateX(${6 * Math.max(0, Math.sin(t * 3))}px)` }}>→</span></> : null}</div>
      {children}
      <Logo />
    </AbsoluteFill>
  );
};
const Title: React.FC<{ t: number; at: number; y?: number; size?: number; children: React.ReactNode }> = ({ t, at, y = 150, size = 104, children }) => (
  <div style={abs(60, y, { ...land(t, at, 50), width: 960, fontFamily: FONT.display, fontWeight: 900, fontStretch: '78%', fontSize: size, lineHeight: 0.98, color: C.navy, letterSpacing: '-0.01em' })}>{children}</div>
);
const Hl: React.FC<{ children: React.ReactNode; col?: string }> = ({ children, col = C.cyan }) => <span style={{ color: col }}>{children}</span>;
const Panel: React.FC<{ x: number; y: number; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, style, children }) => (
  <div style={abs(x, y, { width: w, height: h, borderRadius: 30, background: 'rgba(255,255,255,0.82)', border: '1.5px solid #fff', boxShadow: depth(1), boxSizing: 'border-box', ...style })}>{children}</div>
);
const Chip: React.FC<{ children: React.ReactNode; col?: string; mono?: boolean; style?: React.CSSProperties }> = ({ children, col = C.cyan, mono, style }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 16px', borderRadius: 14, background: '#fff', border: `2.5px solid ${col}`, color: C.navy, fontFamily: mono ? FONT.mono : FONT.ui, fontWeight: 700, fontSize: 25, whiteSpace: 'nowrap', boxShadow: depth(0.4), ...style }}>{children}</div>
);
/** a host bust (public/hosts/<who>_<pose>.png, 900 x 780), anchored on the bottom edge, with a slow breath */
const Host: React.FC<{ who: 'bro' | 'bhai'; pose: string; x: number; w: number; t: number; at: number; flip?: boolean }> = ({ who, pose, x, w, t, at, flip }) => {
  const s = dampedSpring(t - at, 11, 0.62), h = (w * 780) / 900;
  return <Img src={staticFile(`hosts/${who}_${pose}.png`)} style={abs(x, H - h + (1 - s) * 120 + 4 * Math.sin(t * 2.2), { width: w, height: h, opacity: clamp((t - at) / 0.15), transform: `${flip ? 'scaleX(-1) ' : ''}scale(${1 + 0.008 * Math.sin(t * 2.2)})`, transformOrigin: '50% 100%' })} />;
};
const Bubble: React.FC<{ t: number; at: number; x: number; y: number; tail: 'left' | 'right'; children: React.ReactNode; col?: string }> = ({ t, at, x, y, tail, children, col = C.navy }) => (
  <div style={abs(x, y, { ...pop(t, at), transformOrigin: tail === 'right' ? '100% 100%' : '0 100%' })}>
    <div style={{ position: 'relative', padding: '16px 24px', borderRadius: 26, background: '#fff', border: `3px solid ${col}`, fontFamily: FONT.ui, fontWeight: 800, fontSize: 32, color: C.navy, whiteSpace: 'nowrap', boxShadow: depth(0.6) }}>
      {children}
      <div style={{ position: 'absolute', bottom: -16, [tail]: 40, width: 26, height: 26, background: '#fff', borderRight: `3px solid ${col}`, borderBottom: `3px solid ${col}`, transform: 'rotate(45deg)' }} />
    </div>
  </div>
);
const SourceLine: React.FC<{ t: number; at: number; y?: number; w?: number; children?: React.ReactNode }> = ({ t, at, y = H - 64, w = 560, children }) => (
  <div style={abs(60, y, { opacity: clamp((t - at) / 0.3), width: w, fontFamily: FONT.mono, fontSize: 18, lineHeight: 1.35, color: C.navy2 })}>{children ?? 'Source: the repo README, github.com/Donchitos/Claude-Code-Game-Studios · checked 2 Nov 2026'}</div>
);
const count = (t: number, at: number, v: number) => Math.round(v * easeOutCubic(invLerp(at, at + 0.7, t)));

// ---------------------------------------------------------------- 2 · what it is
export const Slide2: React.FC = () => {
  const t = T(), e = EV.info.s2;
  const stats: [number, string, string][] = [[49, 'AGENTS', C.cyan], [74, 'SKILLS', C.magenta], [15, 'HOOKS', '#f59e0b'], [14, 'RULES', C.ok]];
  return (
    <Frame n={2} kicker="THE REPO" audio="carousel_s2">
      <Title t={t} at={e[1]}>Claude Code<br /><Hl>Game Studios</Hl></Title>
      <div style={abs(60, 372, { ...land(t, e[2]), width: 940, fontFamily: FONT.ui, fontWeight: 600, fontSize: 38, lineHeight: 1.3, color: C.navy2 })}>An open-source template that turns one Claude Code session into a whole game studio.</div>
      {stats.map(([v, l, col], i) => (
        <Panel key={l} x={60 + (i % 2) * 490} y={520 + Math.floor(i / 2) * 186} w={470} h={170} style={{ ...pop(t, e[3 + i]), display: 'flex', alignItems: 'center', gap: 22, padding: '0 34px' }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 900, fontStretch: '78%', fontSize: 120, color: col, lineHeight: 1, minWidth: 140, fontVariantNumeric: 'tabular-nums' }}>{count(t, e[3 + i], v)}</div>
          <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 42, color: C.navy, letterSpacing: '0.04em' }}>{l}</div>
        </Panel>
      ))}
      <div style={abs(60, 990, { ...land(t, e[7]), display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' })}>
        <Chip col={C.ok}>Open source · MIT licence</Chip>
        <Chip col="#f59e0b">32.6K+ ★ on GitHub (2 Nov 2026)</Chip>
      </div>
      <Host who="bro" pose="point" x={600} w={480} t={t} at={e[1]} />
      <Bubble t={t} at={e[6]} x={470} y={892} tail="right">Ek repo, poora studio!</Bubble>
      <SourceLine t={t} at={e[7]} y={H - 44} w={560}>Source: the repo README · checked 2 Nov 2026</SourceLine>
    </Frame>
  );
};

// ---------------------------------------------------------------- 3 · the hierarchy
const TIERS: { label: string; col: string; names: string[] }[] = [
  { label: 'TIER 1 · DIRECTORS', col: C.magenta, names: ['creative-director', 'technical-director', 'producer'] },
  { label: 'TIER 2 · DEPARTMENT LEADS', col: C.cyan, names: ['game-designer', 'lead-programmer', 'art-director', 'audio-director', 'narrative-director', 'qa-lead', 'release-manager', 'localization-lead'] },
  { label: 'TIER 3 · SPECIALISTS', col: C.ok, names: ['gameplay-programmer', 'ai-programmer', 'level-designer', 'sound-designer', 'writer', 'qa-tester', '+ more'] },
];
export const Slide3: React.FC = () => {
  const t = T(), e = EV.info.s3, Y = [372, 540, 800];
  return (
    <Frame n={3} kicker="HOW IT'S ORGANISED" audio="carousel_s3">
      <Title t={t} at={e[1]} size={96}>A studio <Hl>hierarchy</Hl>,<br />not one chatbot</Title>
      {/* the connectors draw down between tiers */}
      {[0, 1].map((k) => <div key={k} style={abs(536, Y[k] + (k === 0 ? 110 : 214), { width: 8, borderRadius: 4, background: `linear-gradient(${TIERS[k].col}, ${TIERS[k + 1].col})`, height: (Y[k + 1] - Y[k] - (k === 0 ? 110 : 214)) * easeOutCubic(invLerp(e[2 + k] + 0.2, e[3 + k], t)) })} />)}
      {TIERS.map((tier, k) => (
        <div key={tier.label} style={abs(60, Y[k], { ...land(t, e[2 + k]), width: 960 })}>
          <div style={{ fontFamily: FONT.mono, fontWeight: 800, fontSize: 24, color: tier.col, letterSpacing: '0.06em', marginBottom: 12 }}>{tier.label}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {tier.names.map((nm, i) => <div key={nm} style={pop(t, e[2 + k] + 0.05 * i)}><Chip col={tier.col} mono style={nm === '+ more' ? { background: tier.col, color: '#fff' } : undefined}>{nm}</Chip></div>)}
          </div>
        </div>
      ))}
      <div style={abs(60, 1062, { ...land(t, e[5]), width: 560 })}>
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontStretch: '80%', fontSize: 56, lineHeight: 1.02, color: C.navy }}>“you still make<br /><Hl col={C.magenta}>every decision</Hl>”</div>
        <div style={{ marginTop: 8, fontFamily: FONT.ui, fontWeight: 600, fontSize: 24, color: C.navy2 }}>— the README</div>
      </div>
      <Host who="bhai" pose="think" x={640} w={440} t={t} at={e[1]} />
      <SourceLine t={t} at={e[6]} y={H - 44} w={600}>Our illustration of the README's 3-tier list · 49 agents in all</SourceLine>
    </Frame>
  );
};

// ---------------------------------------------------------------- 4 · engines
const ENGINES = [
  { name: 'Godot 4', lead: 'godot-specialist', subs: 'GDScript · Shaders · GDExtension', col: '#478cbf' },
  { name: 'Unity', lead: 'unity-specialist', subs: 'DOTS/ECS · Shaders/VFX · Addressables · UI Toolkit', col: '#3a3f4a' },
  { name: 'Unreal Engine 5', lead: 'unreal-specialist', subs: 'GAS · Blueprints · Replication · UMG/CommonUI', col: '#5b3fd6' },
];
export const Slide4: React.FC = () => {
  const t = T(), e = EV.info.s4;
  return (
    <Frame n={4} kicker="PICK YOUR ENGINE" audio="carousel_s4">
      <Title t={t} at={e[1]}>Godot, Unity<br />or <Hl>Unreal</Hl></Title>
      {ENGINES.map((g, i) => (
        <Panel key={g.name} x={60} y={390 + i * 206} w={960} h={186} style={{ ...land(t, e[2 + i], 60), overflow: 'hidden', padding: '26px 34px 0 58px' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 22, background: g.col }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ fontFamily: FONT.display, fontWeight: 900, fontStretch: '80%', fontSize: 60, color: C.navy, lineHeight: 1 }}>{g.name}</div>
            <Chip col={g.col} mono>{g.lead}</Chip>
          </div>
          <div style={{ marginTop: 18, fontFamily: FONT.ui, fontWeight: 600, fontSize: 30, color: C.navy2 }}>{g.subs}</div>
        </Panel>
      ))}
      <div style={abs(60, 1036, { ...land(t, e[5]), width: 560, fontFamily: FONT.ui, fontWeight: 800, fontSize: 38, lineHeight: 1.22, color: C.navy })}>Agent sets for <Hl>all three</Hl> engines come in the template. Use the one you build in.</div>
      <Host who="bro" pose="thumbs" x={650} w={430} t={t} at={e[1]} />
      <SourceLine t={t} at={e[6]} y={H - 44} w={600}>Source: README, "Engine Specialists" · no engine logos used</SourceLine>
    </Frame>
  );
};

// ---------------------------------------------------------------- 5 · get started
const TERM: { s: string; col?: string }[] = [
  { s: '$ git clone https://github.com/Donchitos/' }, { s: '    Claude-Code-Game-Studios.git my-game' }, { s: '$ cd my-game' }, { s: '$ claude' }, { s: '> /start', col: '#3bd5ff' },
];
export const Slide5: React.FC = () => {
  const t = T(), e = EV.info.s5;
  const chars = Math.floor(Math.max(0, t - e[2]) * 70);
  let left = chars;
  const steps = ['Clone the repo', 'Open Claude Code in the ROOT folder', 'Run /start: it asks where you are and picks the workflow'];
  return (
    <Frame n={5} kicker="GET STARTED" audio="carousel_s5">
      <Title t={t} at={e[1]}>3 steps to<br />your <Hl>studio</Hl></Title>
      <Panel x={60} y={384} w={960} h={330} style={{ ...land(t, e[2] - 0.2, 40), background: '#0b1b3a', border: '1.5px solid #1d3463', padding: '62px 34px 0' }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => <div key={c} style={abs(30 + i * 30, 24, { width: 16, height: 16, borderRadius: 8, background: c })} />)}
        {TERM.map((l, i) => { const n = Math.max(0, Math.min(l.s.length, left)); left -= l.s.length; return (
          <div key={i} style={{ fontFamily: FONT.mono, fontWeight: 600, fontSize: 30, lineHeight: 1.45, color: l.col ?? '#e6f0ff', whiteSpace: 'pre' }}>{l.s.slice(0, n)}{n > 0 && n < l.s.length && Math.floor(t * 6) % 2 ? '▌' : ''}</div>
        ); })}
      </Panel>
      {steps.map((s, i) => (
        <div key={s} style={abs(60, 760 + i * 92, { ...land(t, e[4 + i]), display: 'flex', alignItems: 'center', gap: 20, width: 960 })}>
          <div style={{ width: 62, height: 62, borderRadius: 31, background: C.cyan, color: '#fff', fontFamily: FONT.display, fontWeight: 900, fontSize: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{i + 1}</div>
          <div style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: i === 2 ? 30 : 34, color: C.navy, lineHeight: 1.2, maxWidth: i === 2 ? 600 : 880 }}>{s}</div>
        </div>
      ))}
      <div style={abs(60, 1060, { ...land(t, e[7]), display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' })}>
        <div style={{ fontFamily: FONT.mono, fontWeight: 800, fontSize: 22, color: C.navy2 }}>YOU NEED</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: 600 }}>{['Git', 'Claude Code', 'Python 3', 'Bash'].map((x) => <Chip key={x} col={C.navy2}>{x}</Chip>)}</div>
      </div>
      <Host who="bro" pose="point" x={650} w={430} t={t} at={e[1]} />
      <SourceLine t={t} at={e[7]} y={H - 44} w={600}>Source: README, Getting Started · on Windows, Bash = Git Bash</SourceLine>
    </Frame>
  );
};

// ---------------------------------------------------------------- 6 · the honest part
export const Slide6: React.FC = () => {
  const t = T(), e = EV.info.s6;
  const rows: [string, number, string, number][] = [['minimal', 1, '1 doc · 0 min', 0.06], ['standard', 30, '30 docs · 58 min', 1]];
  const last = e[4];
  return (
    <Frame n={6} kicker="READ THIS BEFORE YOU HYPE IT" kcol={C.magenta} audio="carousel_s6">
      <Title t={t} at={e[1]} size={98}>More process ≠<br /><Hl col={C.magenta}>a better game</Hl></Title>
      <Panel x={60} y={366} w={960} h={410} style={{ ...land(t, e[2], 40), padding: '28px 36px' }}>
        <div style={{ fontFamily: FONT.ui, fontWeight: 800, fontSize: 32, color: C.navy }}>The author's own test: 4 games from 1 brief</div>
        <div style={{ fontFamily: FONT.ui, fontWeight: 600, fontSize: 25, color: C.navy2, marginTop: 4 }}>docs written before the first line of game code</div>
        {rows.map(([mode, , lab, frac], i) => (
          <div key={mode} style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 170, fontFamily: FONT.mono, fontWeight: 800, fontSize: 28, color: C.navy }}>{mode}</div>
            <div style={{ position: 'relative', flex: 1, height: 56 }}>
              <div style={{ height: 56, width: `${Math.max(3, 100 * frac * easeOutCubic(invLerp(e[3] + i * 0.2, e[3] + i * 0.2 + 0.6, t)))}%`, borderRadius: 14, background: i ? C.magenta : C.ok }} />
              <div style={abs(i ? 20 : 54, 10, { fontFamily: FONT.ui, fontWeight: 800, fontSize: 28, color: i ? '#fff' : C.navy, opacity: clamp((t - e[3] - 0.4 - i * 0.2) / 0.2), whiteSpace: 'nowrap' })}>{lab}</div>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 34, fontFamily: FONT.ui, fontWeight: 700, fontSize: 28, color: C.navy, ...land(t, last) }}>Two blind reviewers + a human playtest ranked the <b style={{ color: C.magenta }}>standard build LAST.</b></div>
        {t >= last ? <div style={abs(640, 150, { transform: `rotate(-10deg) scale(${1.8 - 0.8 * dampedSpring(t - last, 18, 0.5)})`, opacity: clamp((t - last) / 0.06), border: `8px solid ${C.bad}`, borderRadius: 16, padding: '2px 22px', color: C.bad, fontFamily: FONT.display, fontWeight: 900, fontSize: 62, background: 'rgba(255,255,255,0.7)' })}>LAST</div> : null}
      </Panel>
      {['✕  Not a one-click game maker: a template you clone', '✕  49 agent roles ≠ 49 employees', '₹  Model usage is on your bill (directors ask for Opus)'].map((s, i) => (
        <div key={s} style={abs(60, 800 + i * 66, { ...land(t, e[5 + i]), width: 960, fontFamily: FONT.ui, fontWeight: 800, fontSize: 32, color: C.navy, whiteSpace: 'nowrap' })}>{s}</div>
      ))}
      <Host who="bhai" pose="shrug" x={690} w={390} t={t} at={e[1]} />
      <Bubble t={t} at={e[7]} x={330} y={1110} tail="right" col={C.magenta}>Studio ≠ shortcut, bhai</Bubble>
      <SourceLine t={t} at={e[7]} y={H - 44} w={560}>Source: README, "Does it produce games, or documents?"</SourceLine>
    </Frame>
  );
};

// ---------------------------------------------------------------- 7 · CTA
export const Slide7: React.FC = () => {
  const t = T(), e = EV.info.s7;
  const b = dampedSpring(t - e[2], 12, 0.5);
  return (
    <Frame n={7} kicker="BRO & BHAI · EP 01" audio="carousel_s7">
      <Title t={t} at={e[1]} size={100}>Your one-person<br />game studio starts<br />with <span style={{ fontFamily: FONT.mono, fontWeight: 800, color: C.cyan, fontStretch: '100%' }}>/start</span></Title>
      <div style={abs(0, 500, { width: W, textAlign: 'center', opacity: clamp(b * 2), transform: `scale(${0.6 + 0.4 * b})` })}>
        <div style={{ display: 'inline-block', padding: '26px 54px', borderRadius: 30, background: `linear-gradient(135deg, ${C.cyan}, ${C.cyanDeep})`, color: '#fff', fontFamily: FONT.display, fontWeight: 900, fontSize: 84, whiteSpace: 'nowrap',
          boxShadow: `0 20px 60px ${C.cyan}66, 0 8px 0 ${C.navy}`, transform: `scale(${1 + 0.02 * Math.sin(t * 4)})` }}>Comment “STUDIO”</div>
        <div style={{ marginTop: 26, fontFamily: FONT.ui, fontWeight: 800, fontSize: 36, color: C.navy }}>repo link + safe setup checklist in your DMs</div>
      </div>
      <div style={abs(0, 760, { ...land(t, e[3]), width: W, textAlign: 'center' })}>
        <div style={{ fontFamily: FONT.mono, fontWeight: 600, fontSize: 28, color: C.navy }}>github.com/Donchitos/Claude-Code-Game-Studios</div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 14 }}><Chip col={C.magenta}>Save it for your first game</Chip><Chip col={C.ok}>Share with your dev dost</Chip></div>
      </div>
      <Host who="bro" pose="hype" x={-30} w={520} t={t} at={e[4]} />
      <Host who="bhai" pose="hype" x={590} w={520} t={t} at={e[4] + 0.15} />
    </Frame>
  );
};

export const INFO = [Slide2, Slide3, Slide4, Slide5, Slide6, Slide7];
export const INFO_FRAMES = Math.round(EV.info.dur * EV.fps);
