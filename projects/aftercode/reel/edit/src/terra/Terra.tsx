// GPT-6.1 Terra launch reel. Every shot is OpenAI's own launch film (public/clips/terra.mp4, 1920x1080 @ 24 fps), cropped,
// scaled or windowed — never retimed on the "Shown at actual speed" CAD recording. Facts: ../../FACTS.md (video + description).
import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import audio from '../data/audioManifest.json';
import { TIMINGS } from '../data/version';
import { clamp, dampedSpring, easeInOutCubic, easeOutCubic, invLerp, lerp } from '../lib/anim';
import { F } from '../styles/typography';
import { Grain } from '../components/Backdrop';
import { FPS, SEGS, seg, useScene } from '../lite/kit';

const G = { ink: '#0A0A0B', ink2: '#141416', gold: '#F2C14E', goldDeep: '#C98F1C', cream: '#F5F1E8', white: '#F4F4F2', mute: '#9A958B', red: '#E5484D' } as const;
const SRC = staticFile('clips/terra.mp4');
const pop = (l: number, at: number, w = 16, z = 0.5) => (l < at ? 0 : dampedSpring((l - at) / FPS, w, z));
const hit = (l: number, at: number, len = 14) => (l < at ? 0 : Math.exp(-((l - at) / len) * 3));
const fade = (l: number, at: number, d = 10) => easeOutCubic(invLerp(at, at + d, l));

/** a clip of the OpenAI film from source second `s0` at `rate`, placed at scene-local frame `at` (scene start `from`) */
const Clip: React.FC<{ from: number; at: number; dur: number; s0: number; rate?: number; mode: 'fill' | 'window'; fx?: number; fy?: number; z0?: number; z1?: number;
  y?: number; w?: number; radius?: number; l: number }> = ({ from, at, dur, s0, rate = 1, mode, fx = 0.5, fy = 0.5, z0 = 1, z1 = 1.06, y = 640, w = 1080, radius = 0, l }) => {
  if (l < at || l >= at + dur) return null;
  const u = (l - at) / dur, z = lerp(z0, z1, easeInOutCubic(u));
  let style: React.CSSProperties;
  if (mode === 'fill') {
    const H = 1920 * z, W = H * (16 / 9);
    style = { position: 'absolute', width: W, height: H, left: 540 - fx * W, top: 960 - fy * H };
  } else {
    const W = w * z, H = W * (9 / 16);
    style = { position: 'absolute', width: W, height: H, left: 540 - W / 2, top: y + (w * 9 / 16 - H) / 2, borderRadius: radius };
  }
  return (
    <Sequence from={from + at} durationInFrames={dur} layout="none">
      <OffthreadVideo src={SRC} startFrom={Math.round(s0 * FPS)} playbackRate={rate} muted style={{ ...style, objectFit: 'cover' }} />
    </Sequence>
  );
};

const Serif: React.FC<{ children: React.ReactNode; size: number; color?: string; style?: React.CSSProperties }> = ({ children, size, color = G.cream, style }) => (
  <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: size, lineHeight: 1, color, letterSpacing: '-0.01em', ...style }}>{children}</div>
);
const Punch: React.FC<{ l: number; at: number; children: React.ReactNode; size: number; color?: string; style?: React.CSSProperties }> = ({ l, at, children, size, color = G.cream, style }) => {
  const p = pop(l, at, 18, 0.5);
  return <div style={{ fontFamily: F.head, fontWeight: 900, fontStretch: '75%', fontSize: size, lineHeight: 0.92, letterSpacing: '-0.01em', color, opacity: l < at ? 0 : clamp((l - at + 1) / 3),
    transform: `scale(${1.5 - 0.5 * p})`, transformOrigin: '50% 60%', whiteSpace: 'nowrap', ...style }}>{children}</div>;
};
const Credit: React.FC<{ text?: string; dark?: boolean; y?: number }> = ({ text = 'FOOTAGE: OPENAI · GPT-6.1 TERRA LAUNCH FILM', dark = true, y = 1340 }) => (
  <div style={{ position: 'absolute', left: 120, right: 120, top: y, textAlign: 'center', fontFamily: F.mono, fontWeight: 600, fontSize: 18, letterSpacing: '0.14em', color: dark ? 'rgba(245,241,232,0.7)' : 'rgba(10,10,11,0.55)' }}>{text}</div>
);
const Flash: React.FC<{ l: number; at: number; color?: string; max?: number; len?: number }> = ({ l, at, color = G.cream, max = 0.7, len = 6 }) =>
  l >= at && l < at + len ? <AbsoluteFill style={{ background: color, opacity: max * (1 - (l - at) / len) }} /> : null;
/** warm film-burn sweep (gradient only) used on whip cuts */
const Burn: React.FC<{ l: number; at: number; len?: number }> = ({ l, at, len = 14 }) => {
  if (l < at || l >= at + len) return null;
  const u = (l - at) / len;
  return <AbsoluteFill style={{ background: `linear-gradient(110deg, rgba(0,0,0,0) ${u * 120 - 40}%, rgba(242,140,40,0.55) ${u * 120 - 15}%, rgba(255,226,150,0.75) ${u * 120}%, rgba(0,0,0,0) ${u * 120 + 30}%)`, mixBlendMode: 'screen' }} />;
};
const Bars: React.FC<{ p?: number }> = ({ p = 1 }) => (<>
  <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 200 * p, background: G.ink }} />
  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 300 * p, background: G.ink }} />
</>);

// ---------------------------------------------------------------- scenes
const Hook: React.FC = () => {
  const { f, l, at } = useScene('hook'); const from = f - l;
  const oa = at('h1', 'OpenAI'), gpt = at('h1', 'GPT-6.1'), terra = at('h1', 'Terra!');
  const roll = clamp(l / terra);                                   // drum roll tension 0 -> 1
  const jit = roll * 6 * Math.sin(l * 2.3);
  const strobe = [2.7, 3.7, 4.4, 5.2][Math.floor(l / 5) % 4];   // flash-cuts of the film under the drum roll
  return (
    <AbsoluteFill style={{ background: G.ink, transform: `translate(${jit}px, ${-jit * 0.6}px)` }}>
      {l < oa ? <><Clip from={from} at={Math.floor(l / 5) * 5} dur={5} s0={strobe} mode="fill" fx={0.5} z0={1.2} z1={1.25} l={l} /><AbsoluteFill style={{ background: `rgba(10,10,11,${0.5 + 0.25 * (Math.floor(l / 5) % 2)})` }} /></> : null}
      {l >= oa && l < gpt ? <Clip from={from} at={oa} dur={gpt - oa} s0={0.2} mode="window" y={660} z0={1.0} z1={1.12} radius={22} l={l} /> : null}
      {l >= gpt ? <Clip from={from} at={gpt} dur={9999} s0={2.4} rate={0.9} mode="fill" fx={0.45} fy={0.5} z0={1.0} z1={1.25} l={l} /> : null}
      {l >= gpt ? <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(10,10,11,0.55) 0%, rgba(10,10,11,0.1) 40%, rgba(10,10,11,0.65) 100%)' }} /> : null}
      <div style={{ position: 'absolute', left: 0, right: 0, top: l < oa ? 760 : 300, textAlign: 'center', opacity: l < gpt ? 1 : 0 }}>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: '0.3em', color: G.cream }}>OPENAI KA</div>
        <Serif size={150} color={G.gold} style={{ marginTop: 18, transform: `scale(${1 + 0.06 * roll})` }}>naya model…</Serif>
      </div>
      {l >= gpt ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center' }}>
          <Punch l={l} at={gpt} size={190}>GPT-6.1</Punch>
          <Serif size={260} color={G.gold} style={{ marginTop: -10, opacity: l < terra ? 0 : 1, transform: `scale(${1.6 - 0.6 * pop(l, terra, 14, 0.45)})`, textShadow: '0 10px 60px rgba(0,0,0,0.6)' }}>Terra</Serif>
          <div style={{ marginTop: 30, fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: '0.3em', color: G.cream, opacity: fade(l, terra + 10) }}>IS NOW IN ORBIT</div>
        </div>
      ) : null}
      <Flash l={l} at={oa} max={0.5} /><Flash l={l} at={terra} color={G.gold} max={0.8} len={10} />
      <Credit />
    </AbsoluteFill>
  );
};

const Fast: React.FC = () => {
  const { f, l, at } = useScene('fast'); const from = f - l;
  const ws = [{ t: 'FAST.', a: at('l1', 'fast') }, { t: 'CAPABLE.', a: at('l1', 'capable') }, { t: 'COMPUTER USE.', a: at('l1', 'computer') }];
  const cut = ws[0].a - 10;
  return (
    <AbsoluteFill style={{ background: G.ink }}>
      <Clip from={from} at={0} dur={cut} s0={3.6} rate={0.8} mode="fill" fx={0.55} z0={1.05} z1={1.15} l={l} />
      {l >= cut ? <>
        <Clip from={from} at={cut} dur={9999} s0={5.0} rate={0.25} mode="fill" fx={0.62} fy={0.5} z0={1.3} z1={1.42} l={l} />
        <AbsoluteFill style={{ background: 'rgba(10,10,11,0.5)' }} />
        <Clip from={from} at={cut} dur={9999} s0={5.9} rate={0.55} mode="window" y={720} radius={20} z0={0.92} z1={0.98} l={l} />
      </> : null}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center' }}>
        <Serif size={64} style={{ opacity: fade(l, 4) }}>OpenAI ke hisaab se…</Serif>
        <div style={{ marginTop: 34 }}>{ws.map((w) => <Punch key={w.t} l={l} at={w.a} size={w.t.length > 8 ? 128 : 150} color={w.t === 'COMPUTER USE.' ? G.gold : G.cream} style={{ marginTop: 6 }}>{w.t}</Punch>)}</div>
      </div>
      <Burn l={l} at={cut} /><Flash l={l} at={0} max={0.35} />
      <Credit />
    </AbsoluteFill>
  );
};

const Demo: React.FC = () => {
  const { f, l, at } = useScene('demo'); const from = f - l;
  const bola = at('l2', 'bola:'), det = at('l2', 'detailed');
  const zoom = easeInOutCubic(invLerp(bola, bola + 40, l));
  return (
    <AbsoluteFill style={{ background: G.ink }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 290, textAlign: 'center' }}>
        <Serif size={78} style={{ opacity: fade(l, 2) }}>Ek photo. Ek line.</Serif>
      </div>
      {l < bola ? <Clip from={from} at={0} dur={bola} s0={9.6} rate={0.6} mode="window" y={640} radius={22} z0={1.0} z1={1.05} l={l} /> : null}
      {l >= bola ? (
        // the prompt, read from the ChatGPT window frame: push in on the bubble
        <div style={{ position: 'absolute', left: 0, top: 560, width: 1080, height: 720, overflow: 'hidden', borderRadius: 26 }}>
          <Clip from={from} at={bola} dur={9999} s0={17.6} rate={0.25} mode="window" y={lerp(0, -140, zoom)} w={lerp(1080, 2300, zoom)} l={l} />
        </div>
      ) : null}
      <div style={{ position: 'absolute', left: 100, right: 100, top: 1310, textAlign: 'center', opacity: fade(l, det) }}>
        <div style={{ display: 'inline-block', padding: '14px 26px', borderRadius: 16, background: G.gold, color: G.ink, fontFamily: F.head, fontWeight: 800, fontSize: 34 }}>“Detailed 3D model… for die-cast toy manufacturing”</div>
      </div>
      <Burn l={l} at={bola - 4} /><Flash l={l} at={0} max={0.3} />
    </AbsoluteFill>
  );
};

const Cad: React.FC = () => {
  const { f, l, dur, at } = useScene('cad'); const from = f - l;
  const ready = at('l3', 'ready!');
  return (
    <AbsoluteFill style={{ background: '#2B2C30' }}>
      {/* the CAD screen recording at 1.0x only (OpenAI: "Shown at actual speed. Some sections omitted.") */}
      <Clip from={from} at={0} dur={dur} s0={12.6} rate={1} mode="fill" fx={0.5} fy={0.42} z0={1.0} z1={1.08} l={l} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(10,10,11,0.75) 0%, rgba(10,10,11,0) 30%, rgba(10,10,11,0) 62%, rgba(10,10,11,0.8) 100%)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 280, textAlign: 'center' }}>
        <Punch l={l} at={2} size={110}>SCREEN DEKHA.</Punch>
        <Punch l={l} at={at('l3', 'apps')} size={110} color={G.gold}>APPS CHALAYE.</Punch>
      </div>
      {l >= ready ? <div style={{ position: 'absolute', left: 0, right: 0, top: 1150, textAlign: 'center' }}><Punch l={l} at={ready} size={120} color={G.gold}>MODEL READY!</Punch></div> : null}
      <div style={{ position: 'absolute', left: 120, right: 120, top: 1290, textAlign: 'center' }}>
        <span style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(10,10,11,0.75)', fontFamily: F.mono, fontWeight: 700, fontSize: 21, color: G.cream }}>OpenAI: “Shown at actual speed. Some sections omitted.”</span>
      </div>
      <Flash l={l} at={0} max={0.4} /><Flash l={l} at={ready} color={G.gold} max={0.35} />
    </AbsoluteFill>
  );
};

const Sees: React.FC = () => {
  const { f, l, at } = useScene('sees'); const from = f - l;
  const does = at('l4', 'Does');
  return (
    <AbsoluteFill style={{ background: '#F5F5F5' }}>
      <Clip from={from} at={0} dur={9999} s0={22.0} rate={1} mode="window" y={656} z0={1.25} z1={1.4} l={l} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center' }}>
        <Serif size={120} color={G.ink}>Sees it.</Serif>
        <Serif size={120} color={G.goldDeep} style={{ opacity: l >= does ? 1 : 0, transform: `scale(${1.3 - 0.3 * pop(l, does)})` }}>Does it.</Serif>
      </div>
      <Credit dark={false} />
      <Flash l={l} at={0} color="#fff" max={0.6} />
    </AbsoluteFill>
  );
};

const Price: React.FC = () => {
  const { f, l, at } = useScene('price'); const from = f - l;
  const fifty = at('l5', 'pachaas'), kam = at('l5', 'kam!'), api = at('l5', 'API');
  const n = Math.round(50 * clamp(dampedSpring((l - 12) / FPS, 1.6, 1)));   // counts up from the scene start, lands as the voice says it
  return (
    <AbsoluteFill style={{ background: G.ink }}>
      <Clip from={from} at={0} dur={9999} s0={3.8} rate={0.35} mode="fill" fx={0.5} fy={0.55} z0={1.1} z1={1.3} l={l} />
      <AbsoluteFill style={{ background: 'rgba(10,10,11,0.62)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center' }}>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 28, letterSpacing: '0.24em', color: G.cream, opacity: fade(l, 4) }}>VS GPT-5.6 TERRA</div>
        <div style={{ fontFamily: F.head, fontWeight: 900, fontStretch: '75%', fontSize: 420, lineHeight: 1, color: G.gold, marginTop: 20, opacity: l >= fifty ? 1 : 0.55,
          transform: `scale(${1 + 0.08 * hit(l, kam, 20)})`, textShadow: '0 20px 80px rgba(0,0,0,0.6)' }}>{n}%</div>
        <Punch l={l} at={kam} size={130}>KAM PRICE</Punch>
        <div style={{ marginTop: 26, fontFamily: F.head, fontWeight: 700, fontSize: 40, color: G.cream, opacity: fade(l, api) }}>standard API prices · lower</div>
      </div>
      <Credit text="SOURCE: OPENAI (VIDEO DESCRIPTION, OCT 26, 2026)" />
      <Flash l={l} at={kam} color={G.gold} max={0.5} /><Burn l={l} at={0} />
    </AbsoluteFill>
  );
};

const Avail: React.FC = () => {
  const { f, l, at } = useScene('avail'); const from = f - l;
  const plans = [{ t: 'Plus', w: 'Plus,' }, { t: 'Pro', w: 'Pro,' }, { t: 'Enterprise', w: 'Enterprise' }, { t: 'Edu', w: 'Edu' }].map((p) => ({ ...p, a: at('l6', p.w) }));
  const cw = at('l6', 'ChatGPT'), dev = at('l6', 'Developers'), api = at('l6', 'API');
  return (
    <AbsoluteFill style={{ background: '#F5F5F5' }}>
      <Clip from={from} at={0} dur={cw} s0={25.2} rate={0.7} mode="window" y={480} z0={1.2} z1={1.3} l={l} />
      {l >= cw ? <Clip from={from} at={cw} dur={9999} s0={17.4} rate={0.6} mode="window" y={480} radius={18} z0={0.98} z1={1.04} l={l} /> : null}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 290, textAlign: 'center' }}>
        <Serif size={84} color={G.ink}>Rollout shuru.</Serif>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 30, flexWrap: 'wrap', padding: '0 100px' }}>
          {plans.map((p) => (
            <span key={p.t} style={{ padding: '14px 28px', borderRadius: 999, background: G.ink, color: G.gold, fontFamily: F.head, fontWeight: 800, fontSize: 44,
              opacity: clamp(pop(l, p.a) * 1.5), transform: `scale(${0.6 + 0.4 * pop(l, p.a)})` }}>{p.t}</span>
          ))}
        </div>
      </div>
      {l >= cw ? <div style={{ position: 'absolute', left: 0, right: 0, top: 1110, display: 'flex', justifyContent: 'center', gap: 22 }}>
        <Punch l={l} at={cw} size={80} color={G.ink}>CHATGPT WORK</Punch>
        <Punch l={l} at={at('l6', 'Codex')} size={80} color={G.goldDeep}>+ CODEX</Punch>
      </div> : null}
      {l >= dev ? <div style={{ position: 'absolute', left: 0, right: 0, top: 1222, textAlign: 'center', opacity: fade(l, dev) }}>
        <span style={{ display: 'inline-block', padding: '16px 30px', borderRadius: 14, background: G.ink, color: G.cream, fontFamily: F.mono, fontWeight: 700, fontSize: 34,
          transform: `scale(${l >= api ? 1 + 0.08 * hit(l, api, 20) : 1})` }}>API: <span style={{ color: G.gold }}>gpt-6.1-terra</span></span>
      </div> : null}
      <Credit dark={false} />
      <Flash l={l} at={cw} color="#fff" max={0.6} />
    </AbsoluteFill>
  );
};

const Cta: React.FC = () => {
  const { f, l, at } = useScene('cta'); const from = f - l;
  const com = at('l7', 'Comment');
  return (
    <AbsoluteFill style={{ background: '#FFFFFF' }}>
      <Clip from={from} at={0} dur={9999} s0={29.2} rate={0.45} mode="window" y={600} z0={1.0} z1={1.1} l={l} />
      <div style={{ position: 'absolute', left: 100, right: 100, top: 290, textAlign: 'center' }}>
        <Serif size={92} color={G.ink}>Terra se sabse pehle</Serif>
        <Serif size={92} color={G.goldDeep}>kya banwaoge?</Serif>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1060, display: 'flex', justifyContent: 'center' }}>
        <div style={{ padding: '22px 48px', borderRadius: 999, background: G.ink, color: G.gold, fontFamily: F.head, fontWeight: 900, fontSize: 64, transform: `scale(${0.85 + 0.15 * pop(l, com)})`, opacity: fade(l, com - 6) }}>COMMENT KARO</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1210, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, opacity: fade(l, 10) }}>
        <Img src={staticFile('brand/techpe-trek.jpg')} style={{ width: 56, height: 56, borderRadius: 14 }} />
        <span style={{ fontFamily: F.head, fontWeight: 800, fontSize: 34, color: G.ink }}>TechpeTrek</span>
      </div>
      <Credit dark={false} y={1300} text="FOOTAGE & FACTS: OPENAI · OCT 26, 2026 · INDEPENDENT EXPLAINER" />
    </AbsoluteFill>
  );
};

const SCENES: Record<string, React.FC> = { hook: Hook, fast: Fast, demo: Demo, cad: Cad, sees: Sees, price: Price, avail: Avail, cta: Cta };
const LIGHT = new Set(['sees', 'avail', 'cta']);

// ---------------------------------------------------------------- captions
interface Word { w: string; t0: number; t1: number }
const CAPS: { words: Word[] }[] = (TIMINGS as unknown as { variants: { reel: { captions: { words: Word[] }[] } } }).variants.reel.captions;
const GROUPS: Word[][] = CAPS.map((c) => ({ words: c.words.filter((w) => !/^drumroll/i.test(w.w)) })).filter((c) => c.words.length).flatMap((c) => { const n = Math.ceil(c.words.length / 6), sz = Math.ceil(c.words.length / n), o: Word[][] = []; for (let i = 0; i < c.words.length; i += sz) o.push(c.words.slice(i, i + sz)); return o; });
const KEY = /^(Drumroll|OpenAI|GPT|Terra|fast|capable|computer|3D|model|screen|apps|action|ready|Sees|Does|pachaas|percent|kam|API|Plus|Pro|Enterprise|Edu|ChatGPT|Work|Codex|Comment)/i;
const Captions: React.FC<{ light: boolean }> = ({ light }) => {
  const f = useCurrentFrame(), t = f / FPS;
  const i = GROUPS.findIndex((g, k) => t >= g[0].t0 - 0.05 && t < Math.min(g[g.length - 1].t1 + 0.45, (GROUPS[k + 1]?.[0].t0 ?? 1e9) - 0.05));
  if (i < 0) return null;
  const g = GROUPS[i], p = easeOutCubic(invLerp(g[0].t0 - 0.05, g[0].t0 + 0.1, t));
  return (
    <div style={{ position: 'absolute', left: 120, right: 120, top: 1420, display: 'flex', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ textAlign: 'center', padding: '10px 24px', borderRadius: 14, background: light ? 'rgba(10,10,11,0.88)' : 'rgba(10,10,11,0.72)', opacity: p, transform: `translateY(${(1 - p) * 12}px)`,
        fontFamily: F.head, fontWeight: 800, fontSize: g.map((w) => w.w).join(' ').length > 34 ? 46 : 54, lineHeight: 1.12 }}>
        {g.map((w, k) => {
          const sp = t >= w.t0 - 0.03, key = KEY.test(w.w) || /\d/.test(w.w), pp = 1 - clamp((t - w.t0 + 0.03) / 0.16);
          return <React.Fragment key={k}><span style={{ display: 'inline-block', color: sp ? (key ? G.gold : '#FFFFFF') : 'rgba(245,241,232,0.45)', transform: sp && pp > 0 ? `scale(${1 + 0.1 * pp})` : undefined }}>{w.w}</span>{k < g.length - 1 ? ' ' : ''}</React.Fragment>;
        })}
      </div>
    </div>
  );
};

export const TerraReel: React.FC = () => {
  const f = useCurrentFrame();
  const s = SEGS.find((x) => f >= x.from && f < x.from + x.durationInFrames) ?? SEGS[SEGS.length - 1];
  const S = SCENES[s.id], u = (f - s.from) / s.durationInFrames;
  return (
    <AbsoluteFill style={{ background: G.ink }}>
      <AbsoluteFill key={s.id} style={{ transform: `scale(${1 + 0.02 * u})` }}><S /></AbsoluteFill>
      <Captions light={LIGHT.has(s.id)} />
      <Grain opacity={0.06} />
      <Audio src={staticFile(audio.reel)} />
    </AbsoluteFill>
  );
};
export { seg, Bars, lerp };
