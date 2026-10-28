// Foreground of each scene, over the KV-pool world. Cues are spoken words (at(line, word)); facts per FACTS.md.
// Invented pictures (the two chats, their text) carry the "Illustrative reconstruction" tag.
import React from 'react';
import { clamp, invLerp, lerp } from '../lib/anim';
import { hash } from '../lib/rng';
import { VERSION } from '../data/version';
import { HookV2, ReconV2 } from './HookV2';
import { Icon, Illus, Punch, SAFE, SH, Source, C, FONT, arrive, depart, hit, inout, land, spring, useScene } from './kit';

const box = (x: number, y: number, w: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, ...extra });
const card: React.CSSProperties = { background: C.white, borderRadius: 28, border: `1px solid ${C.line}`, boxShadow: SH.s32 };
const mono = (size: number, color: string = C.ink, weight = 600): React.CSSProperties => ({ fontFamily: FONT.mono, fontSize: size, color, fontWeight: weight });
const ui = (size: number, color: string = C.ink, weight = 700): React.CSSProperties => ({ fontFamily: FONT.ui, fontSize: size, color, fontWeight: weight, letterSpacing: '-0.01em' });

// ================================================================== the chat (illustrative reconstruction)
const REPLY = 'Bug mila: auth.ts ki line 4212 par null check missing hai. Fix ye raha: ';
const LEAK = 'k9#p ~ vL2 ░░ Xq7 :: m0r…';
const ChatA: React.FC<{ l: number; y: number; chars: number; leak: number; from: [number, number]; caret: boolean }> = ({ l, y, chars, leak, from, caret }) => {
  const shown = REPLY.slice(0, Math.floor(chars));
  const lp = land(clamp(leak)), lh = hit(l, 9999);
  void lh;
  return (
    <div style={{ ...box(SAFE.x, y, SAFE.w), ...card, padding: '30px 34px 36px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: C.blue, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', ...ui(32, '#fff', 800) }}>A</div>
        <div style={{ ...ui(34) }}>User A</div>
        <div style={{ marginLeft: 'auto', padding: '8px 14px', borderRadius: 10, background: C.cyanSoft, ...mono(22, C.cyanInk) }}>@cf/zai-org/glm-5.3</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 26 }}>
        <div style={{ maxWidth: 600, background: C.blue, borderRadius: '26px 26px 8px 26px', padding: '18px 24px', color: '#fff' }}>
          <div style={{ display: 'inline-flex', gap: 10, alignItems: 'center', padding: '8px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.18)', ...mono(24, '#fff') }}>
            <Icon name="code" size={28} color="#fff" sw={2} /> codebase.txt · 7 lakh tokens
          </div>
          <div style={{ ...ui(38, '#fff', 600), marginTop: 12 }}>Isme bug dhoondo</div>
        </div>
      </div>
      <div style={{ marginTop: 24, background: '#F3F6FC', borderRadius: '26px 26px 26px 8px', padding: '22px 26px', ...ui(38, C.ink, 500), lineHeight: 1.32 }}>
        {shown}
        {leak > 0 ? (
          <span style={{ display: 'inline-block', position: 'relative', transform: `translate(${(1 - lp) * from[0]}px, ${(1 - lp) * from[1]}px) scale(${1.5 - 0.5 * lp})`, transformOrigin: '0 50%' }}>
            <span style={{ position: 'absolute', left: 4, top: -30, ...ui(21, C.coralInk, 800), whiteSpace: 'nowrap' }}>User B ka text</span>
            <span style={{ padding: '2px 12px', borderRadius: 10, background: C.coralSoft, border: `2.5px solid ${C.coral}`, ...mono(34, C.coralInk, 700), boxShadow: `0 0 ${24 * lp}px rgba(255,109,115,0.55)` }}>{LEAK}</span>
          </span>
        ) : null}
        {caret && Math.floor(l / 16) % 2 === 0 ? <span style={{ display: 'inline-block', width: 4, height: 38, background: C.ink, marginLeft: 4, verticalAlign: -6 }} /> : null}
      </div>
    </div>
  );
};
const ChatB: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) => (
  <div style={{ ...box(x, y, 520), ...card, padding: '22px 26px', opacity: clamp(p * 1.5), transform: `translateX(${(1 - p) * 120}px)`, background: '#FBFAFF' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: 24, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', ...ui(24, '#fff', 800) }}>B</div>
      <div style={{ ...ui(28) }}>User B</div>
    </div>
    <div style={{ marginTop: 14, background: C.violetSoft, borderRadius: 18, padding: '12px 16px', ...mono(26, C.violet, 600) }}>k9#p ~ vL2 ░░ Xq7 :: m0r…</div>
  </div>
);

// ================================================================== 1 hook
export const Hook: React.FC = () => {
  const { l, at, dur } = useScene('hook');
  const tLeak = at('h01', 'doosre'), tLand = at('h01', 'text');
  const leak = l < tLeak ? 0 : (l - tLeak) / (tLand - tLeak);
  const q = depart(l, dur - 10, 10);
  const push = 1 + 0.04 * inout(l / dur);
  return (
    <>
      <Punch l={l} y={190} size={112} words={[{ t: 'DOOSRE', at: -14 }, { t: 'USER', at: -10 }, { t: 'KA', at: -2 }, { t: 'TEXT?!', at: 4, c: C.coralInk }]} out={dur - 10} />
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${push}) translateY(${-q * 700}px)`, transformOrigin: '50% 55%' }}>
        <ChatB x={650} y={1150} p={arrive(l, -6, 10)} />
        <ChatA l={l} y={470} chars={lerp(30, REPLY.length, clamp(l / tLeak))} leak={leak} from={[260, 520]} caret={leak <= 0} />
        <Illus y={1330} center p={1} />
      </div>
    </>
  );
};

// ================================================================== 2 source: the disclosure, quoted
export const SourceScene: React.FC = () => {
  const { l, at, dur } = useScene('source');
  const p = arrive(l, 0, 16), st = at('l02', 'disclose'), sp = land(invLerp(st, st + 8, l)), q = depart(l, dur - 8, 8);
  return (
    <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - p) * 500 - q * 300}px)`, opacity: 1 - q }}>
      <div style={{ ...box(SAFE.x, 470, SAFE.w), ...card, padding: '40px 44px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Icon name="news" size={40} color={C.blueInk} sw={2} />
          <span style={{ ...mono(28, C.blueInk) }}>blog.cloudflare.com</span>
          <span style={{ marginLeft: 'auto', ...ui(28, C.ink2, 600) }}>26 Oct 2026</span>
        </div>
        <div style={{ ...ui(52, C.ink, 800), lineHeight: 1.14, marginTop: 28, letterSpacing: '-0.02em' }}>
          “Cross-request KV cache exposure in the GLM-5.3 Workers AI model, and our remediation with SGLang”
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1040, display: 'flex', justifyContent: 'center', opacity: l >= st ? 1 : 0 }}>
        <div style={{ transform: `rotate(-5deg) scale(${1.8 - 0.8 * sp})`, padding: '14px 30px', border: `6px solid ${C.blueInk}`, borderRadius: 16, ...ui(64, C.blueInk, 900), letterSpacing: '-0.02em', background: 'rgba(255,255,255,0.85)' }}>
          OFFICIAL DISCLOSURE
        </div>
      </div>
    </div>
  );
};

// ================================================================== 3 model: one model affected
const LANES = 9, MID = 4;
const Lanes: React.FC<{ l: number; y: number; on: number; ticks: number; glmFixed?: number }> = ({ l, y, on, ticks, glmFixed = 0 }) => (
  <div style={{ ...box(SAFE.x - 40, y, SAFE.w + 80), display: 'flex', justifyContent: 'center', gap: 14 }}>
    {Array.from({ length: LANES }, (_, i) => {
      const glm = i === MID, p = arrive(l, Math.abs(i - MID) * 2, 12), tk = clamp(ticks * LANES - Math.abs(i - MID) * 0.9);
      const hot = glm ? on : 0;
      return (
        <div key={i} style={{ width: glm ? 150 : 74, height: 300, borderRadius: 22, background: glm ? (glmFixed > 0.5 ? C.mintSoft : hot > 0 ? C.coralSoft : C.white) : C.white,
          border: `${glm ? 4 : 2}px solid ${glm ? (glmFixed > 0.5 ? C.mint : hot > 0 ? C.coral : C.line) : C.line}`, boxShadow: glm ? SH.s16 : SH.s8,
          transform: `translateY(${(1 - p) * 140}px) scale(${glm ? 1 + 0.06 * hit(l, 9999) : 1})`, opacity: clamp(p * 1.5),
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
          {glm ? <Icon name="chip" size={64} color={glmFixed > 0.5 ? C.mintInk : hot > 0 ? C.coralInk : C.ink3} sw={2} /> : <Icon name="chip" size={38} color={C.ink3} sw={1.8} />}
          {!glm && tk > 0 ? <div style={{ transform: `scale(${land(tk)})` }}><Icon name="tick" size={40} color={C.mintInk} sw={3} /></div> : null}
        </div>
      );
    })}
  </div>
);
export const Model: React.FC = () => {
  const { l, at, dur } = useScene('model');
  const glm = at('l02', 'GLM-5.3'), wk = at('l02', 'Workers'), q = depart(l, dur - 8, 8);
  const gp = arrive(l, glm - 4, 14);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - q, transform: `translateY(${-q * 200}px)` }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', opacity: clamp(gp * 2), transform: `scale(${1.6 - 0.6 * gp})` }}>
        <div style={{ ...ui(230, C.ink, 900), letterSpacing: '-0.05em', lineHeight: 1 }}>GLM-5.3</div>
        <div style={{ display: 'inline-block', marginTop: 18, padding: '10px 20px', borderRadius: 14, background: C.cyanSoft, ...mono(34, C.cyanInk, 700) }}>@cf/zai-org/glm-5.3</div>
      </div>
      <Lanes l={l - wk + 10} y={760} on={l >= wk + 12 ? 1 : 0} ticks={0} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1085, textAlign: 'center', ...ui(32, C.ink2, 600), opacity: arrive(l, wk, 12) }}>Workers AI ke models</div>
      <Punch l={l} y={1170} size={84} words={[{ t: 'ONE', at: wk + 12 }, { t: 'MODEL', at: wk + 16 }, { t: 'AFFECTED', at: wk + 20, c: C.coralInk }]} />
    </div>
  );
};

// ================================================================== 4 window: Aug 27 -> Sep 9 (14 days)
const DAYS = [27, 28, 29, 30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9];
export const Window: React.FC = () => {
  const { l, at, dur } = useScene('window');
  const a = at('l03', 'August'), b = at('l03', '9'), q = depart(l, dur - 6, 6);
  const fill = (l - a) / (b - a) * 14;
  return (
    <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-q * 400}px)`, opacity: 1 - q }}>
      <Punch l={l} y={260} size={110} words={[{ t: 'AUG 27', at: a }, { t: '→', at: a + 8, c: C.ink3 }, { t: 'SEP 9', at: b, c: C.mintInk }]} />
      <div style={{ ...box(SAFE.x, 560, SAFE.w), display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 14 }}>
        {DAYS.map((d, i) => {
          const p = arrive(l, i * 1.5, 12), on = fill > i, last = i === 13, rep = i === 12;
          const bg = last && on ? C.mint : on ? C.coral : C.white;
          return (
            <div key={i} style={{ height: 150, borderRadius: 18, background: bg, border: `2px solid ${on ? 'transparent' : C.line}`, boxShadow: SH.s8, position: 'relative',
              transform: `translateY(${(1 - p) * 90}px) scale(${1 + 0.1 * hit(l, a + i * (b - a) / 14, 10)})`, opacity: clamp(p * 1.6),
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ ...ui(20, on ? 'rgba(255,255,255,0.85)' : C.ink3, 700) }}>{i < 5 ? 'AUG' : 'SEP'}</div>
              <div style={{ ...ui(54, on ? '#fff' : C.ink, 800) }}>{d}</div>
              {rep && fill > 12.5 ? <div style={{ position: 'absolute', bottom: -40, ...ui(22, C.ink2, 700), whiteSpace: 'nowrap' }}>reported</div> : null}
              {last && fill > 13.5 ? <div style={{ position: 'absolute', bottom: -40, ...ui(22, C.mintInk, 800), whiteSpace: 'nowrap' }}>fixed</div> : null}
            </div>
          );
        })}
      </div>
      <Source y={1010} p={arrive(l, a + 20, 12)} />
    </div>
  );
};

// ================================================================== 5 count: 155 responses
export const Count: React.FC = () => {
  const { l, at, dur } = useScene('count');
  const a = at('l03', '155'), q = depart(l, dur - 8, 8), n = Math.min(155, Math.max(0, Math.floor((l - a + 6) * 155 / 50)));
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - q, transform: `scale(${1 - q * 0.15})` }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 220, textAlign: 'center', ...ui(250, C.coralInk, 900), letterSpacing: '-0.05em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{n}</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 480, textAlign: 'center', ...ui(64, C.ink, 900), letterSpacing: '-0.03em', opacity: arrive(l, at('l03', 'responses'), 10) }}>RESPONSES</div>
      <div style={{ ...box(SAFE.x + 20, 600, SAFE.w - 40), display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 9 }}>
        {Array.from({ length: 155 }, (_, i) => (
          <div key={i} style={{ height: 42, borderRadius: 8, background: i < n ? C.coral : 'rgba(20,33,61,0.06)', opacity: i < n ? 0.55 + 0.45 * hash(i, 2) : 1,
            transform: `scale(${i < n ? 1 + 0.25 * hit(l, a - 6 + i * 50 / 155, 8) : 0.9})` }} />
        ))}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1235, textAlign: 'center', ...ui(30, C.ink2, 600), opacity: arrive(l, at('l03', 'affect'), 12) }}>155 responses gine gaye, users nahi</div>
      <Source y={1292} p={arrive(l, at('l03', 'affect'), 12)} />
    </div>
  );
};

// ================================================================== 6 tokens: the long prompt overruns the pool (floor is the hero)
export const Tokens: React.FC = () => {
  const { l, at } = useScene('tokens');
  const k = at('l04', '6'), t0 = 18;
  const fill = l < t0 ? 0 : l < k ? 681280 * (l - t0) / (k - t0) : 681280 + (1048576 - 681280) * land(invLerp(k, k + 96, l));
  const over = fill > 681280, pct = fill / 1048576, lim = 681280 / 1048576;
  return (
    <>
      <div style={{ ...box(SAFE.x, 240, SAFE.w), ...card, padding: '26px 32px 30px', transform: `translateY(${(1 - arrive(l, 0, 14)) * -300}px)` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ ...mono(76, over ? C.mangoInk : C.blueInk, 800), fontVariantNumeric: 'tabular-nums' }}>{Math.round(fill).toLocaleString('en-US')}</span>
          <span style={{ ...ui(34, C.ink2, 700) }}>tokens</span>
        </div>
        <div style={{ position: 'relative', height: 26, marginTop: 18, borderRadius: 13, background: 'rgba(20,33,61,0.07)' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${100 * Math.min(pct, lim)}%`, borderRadius: 13, background: C.blue }} />
          {over ? <div style={{ position: 'absolute', left: `${100 * lim}%`, top: 0, bottom: 0, width: `${100 * (pct - lim)}%`, borderRadius: '0 13px 13px 0', background: C.mango }} /> : null}
          <div style={{ position: 'absolute', left: `${100 * lim}%`, top: -12, bottom: -12, width: 5, borderRadius: 3, background: C.ink }} />
        </div>
        <div style={{ position: 'relative', height: 34, marginTop: 10 }}>
          <span style={{ position: 'absolute', left: `${100 * lim}%`, transform: 'translateX(-50%)', ...mono(24, C.ink, 700), whiteSpace: 'nowrap' }}>681,280</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 1130, height: 140, borderRadius: 28, background: 'rgba(255,255,255,0.9)', boxShadow: SH.s16, opacity: arrive(l, k - 4, 10) }} />
      <Punch l={l} y={1150} size={100} words={[{ t: '>681,280', at: k, c: C.mangoInk }, { t: 'TOKENS', at: k + 6 }]} />
      <Illus y={1300} center p={arrive(l, 30, 12)} text="Diagram · 1 tile = 1 KV page" />
    </>
  );
};

// ================================================================== 7 pool: the pool is smaller than the context window
export const Pool: React.FC = () => {
  const { l, at } = useScene('pool');
  const kv = at('l05', 'KV'), small = at('l05', 'chhota');
  return (
    <>
      <Punch l={l} y={200} size={110} words={[{ t: 'KV', at: kv, c: C.cyanInk }, { t: 'CACHE', at: kv + 6 }]} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1210, textAlign: 'center', opacity: arrive(l, small, 10), transform: `scale(${1.3 - 0.3 * arrive(l, small, 10)})` }}>
        <span style={{ padding: '14px 26px', borderRadius: 18, background: C.white, boxShadow: SH.s16, ...ui(44, C.ink, 800) }}>
          pool <span style={{ color: C.mangoInk }}>&lt;</span> context window
        </span>
      </div>
    </>
  );
};

// ================================================================== 8 bug: rejected, still admitted (SGLang, disaggregated prefill/decode)
export const Bug: React.FC = () => {
  const { l, at, dur } = useScene('bug');
  const sg = at('l05', 'SGLang'), rj = at('l05', 'rejection-path'), bg = at('l05', 'bug');
  const stamp = land(invLerp(rj, rj + 8, l)), travel = inout(invLerp(bg - 6, bg + 34, l)), q = depart(l, dur - 8, 8);
  const gpu = (x: number, label: string, col: string, p: number) => (
    <div style={{ ...box(x, 600, 360), height: 300, ...card, borderRadius: 26, opacity: clamp(p * 1.5), transform: `translateY(${(1 - p) * 120}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 34 }}>
      <Icon name="chip" size={84} color={col} sw={1.8} />
      <div style={{ ...ui(40, C.ink, 800), marginTop: 14 }}>{label}</div>
      <div style={{ ...ui(26, C.ink3, 600) }}>GPUs</div>
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - q }}>
      <Punch l={l} y={220} size={100} words={[{ t: 'SGLANG', at: sg }, { t: 'BUG', at: bg, c: C.mangoInk }]} />
      {gpu(SAFE.x - 20, 'Prefill', C.cyanInk, arrive(l, 0, 14))}
      {gpu(SAFE.x + SAFE.w - 340, 'Decode', C.cyanInk, arrive(l, 4, 14))}
      <div style={{ ...box(SAFE.x + 350, 750, SAFE.w - 680), height: 6, borderRadius: 3, background: `repeating-linear-gradient(90deg, ${C.cyan} 0 18px, transparent 18px 30px)`, backgroundPosition: `${l * 2}px 0` }} />
      <div style={{ ...box(lerp(SAFE.x + 10, SAFE.x + SAFE.w - 270, travel), 980, 260), padding: '16px 18px', borderRadius: 18, background: C.blue, boxShadow: SH.s16, transform: `rotate(${-3 + 6 * travel}deg)` }}>
        <div style={{ ...ui(28, '#fff', 800) }}>{VERSION === 'v2' ? 'Munni ki request' : 'User A request'}</div>
        <div style={{ ...mono(22, 'rgba(255,255,255,0.9)') }}>&gt;681,280 tokens</div>
        {l >= rj ? (
          <div style={{ position: 'absolute', left: 20, top: -86, transform: `rotate(-8deg) scale(${1.7 - 0.7 * stamp})`, padding: '6px 16px', border: `5px solid ${C.mangoInk}`, borderRadius: 12, background: C.mangoSoft, ...ui(40, C.mangoInk, 900) }}>REJECTED</div>
        ) : null}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1150, textAlign: 'center', ...ui(38, C.ink, 700), opacity: arrive(l, bg, 12) }}>
        reject mark hua… <span style={{ color: C.coralInk }}>phir bhi decode tak gaya</span>
      </div>
      <Illus y={1225} center p={arrive(l, 20, 12)} text="Diagram · prefill → decode (disaggregated)" />
    </div>
  );
};

// ================================================================== 9 stale: the decode head reads leftover pages (floor is the hero)
export const Stale: React.FC = () => {
  const { l, at } = useScene('stale');
  const ph = at('l06', 'phir');
  return (
    <>
      <Punch l={l} y={200} size={116} words={[{ t: 'STALE', at: ph - 6, c: C.coralInk }, { t: 'CACHE', at: ph }]} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1230, display: 'flex', justifyContent: 'center', gap: 22, opacity: arrive(l, ph + 6, 10) }}>
        {[[C.violet, 'purane pages (doosre users)'], [C.coral, 'decode ne padh liye']].map(([c, t]) => (
          <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderRadius: 14, background: C.white, boxShadow: SH.s8, ...ui(28, C.ink, 700) }}>
            <span style={{ width: 26, height: 18, borderRadius: 5, background: c }} />{t}
          </span>
        ))}
      </div>
    </>
  );
};

// ================================================================== 10 recon: the stale page lands in User A's reply
export const Recon: React.FC = () => {
  const { l, at, dur } = useScene('recon');
  const a = at('l06', 'data'), q = depart(l, dur - 10, 10);
  return (
    <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - arrive(l, 0, 16)) * 600 - q * 120}px)`, opacity: 1 - q * 0.6 }}>
      <Punch l={l} y={200} size={104} words={[{ t: 'REPLY', at: 4 }, { t: 'MEIN', at: 8 }, { t: 'LEAK', at: a - 4, c: C.coralInk }]} />
      <ChatA l={l} y={430} chars={REPLY.length} leak={(l - (a - 16)) / 18} from={[0, 700]} caret={false} />
      <Illus y={1180} center p={1} text="Illustrative reconstruction · fake text, real user data nahi" />
    </div>
  );
};

// ================================================================== 11 patch: pool made 3x bigger + SGLang patched (floor is the hero)
export const Patch: React.FC = () => {
  const { l, at } = useScene('patch');
  const imp = at('l07', 'Important:'), bada = at('l07', 'bada'), pa = at('l07', 'patch');
  const row = (p: number, icon: string, a: React.ReactNode, b: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '18px 24px', borderRadius: 20, background: C.white, boxShadow: SH.s16, opacity: clamp(p * 1.5), transform: `translateX(${(1 - p) * -200}px)` }}>
      <div style={{ width: 60, height: 60, borderRadius: 16, background: C.mintSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={36} color={C.mintInk} sw={2.2} /></div>
      <div><div style={{ ...ui(34, C.ink, 800) }}>{a}</div><div style={{ ...ui(25, C.ink2, 600), marginTop: 2 }}>{b}</div></div>
    </div>
  );
  return (
    <>
      <Punch l={l} y={190} size={110} words={[{ t: 'CONFIG', at: bada - 6 }, { t: '+', at: pa - 4, c: C.ink3 }, { t: 'PATCH', at: pa, c: C.mintInk }]} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', opacity: arrive(l, imp, 8) * (1 - depart(l, bada - 10, 8)), ...ui(58, C.ink, 900) }}>Important:</div>
      <div style={{ ...box(SAFE.x, 1080, SAFE.w), display: 'flex', flexDirection: 'column', gap: 14 }}>
        {row(arrive(l, bada, 14), 'layers', <>KV pool: 681,280 → <span style={{ color: C.mintInk }}>~2.04M</span> tokens</>, 'ab poora context window fit hota hai')}
        {row(arrive(l, pa, 14), 'code', <>SGLang patched</>, 'rejected request KV transfer se pehle retire')}
      </div>
    </>
  );
};

// ================================================================== 12 fixed: the film's one spring
export const Fixed: React.FC = () => {
  const { l, at, dur } = useScene('fixed');
  const fx = at('l07', 'fix'), s = spring(l, fx - 4, 15, 0.5), q = depart(l, dur - 8, 8);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - q }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'center', opacity: l >= fx - 4 ? 1 : 0 }}>
        <div style={{ transform: `rotate(-6deg) scale(${2.2 - 1.2 * s})`, padding: '26px 46px', border: `10px solid ${C.mintInk}`, borderRadius: 30, background: 'rgba(255,255,255,0.94)', textAlign: 'center', boxShadow: SH.s32 }}>
          <div style={{ ...ui(150, C.mintInk, 900), letterSpacing: '-0.04em', lineHeight: 1 }}>FIXED</div>
          <div style={{ ...ui(60, C.mintInk, 800), marginTop: 6 }}>SEP 9, 2026</div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1020, textAlign: 'center', ...ui(32, C.ink2, 600), opacity: arrive(l, fx + 14, 12) }}>model 9 Sep, 19:40 UTC ko wapas live</div>
      <Source y={1290} p={arrive(l, fx + 14, 12)} />
    </div>
  );
};

// ================================================================== 13 the caveat: no evidence of deliberate exploitation; other models not affected
export const NoExploit: React.FC = () => {
  const { l, at, dur } = useScene('noexploit');
  const nh = at('l08', 'nahi'), bk = at('l08', 'baaki'), q = depart(l, dur - 8, 8);
  const cross = land(invLerp(nh, nh + 14, l)), up = inout(invLerp(bk - 10, bk + 10, l));
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - q }}>
      <Punch l={l} y={200} size={96} words={[{ t: 'NO', at: nh, c: C.mintInk }, { t: 'EXPLOIT', at: nh + 4 }, { t: 'EVIDENCE', at: nh + 8 }]} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: lerp(470, 445, up), display: 'flex', justifyContent: 'center', transform: `scale(${lerp(1, 0.55, up)})`, transformOrigin: '50% 0' }}>
        <div style={{ position: 'relative', width: 300, height: 270, opacity: arrive(l, 0, 14) }}>
          <svg width={300} height={270} viewBox="0 0 24 22"><path d="M10.3 2.5 1.8 17.5A2 2 0 0 0 3.5 20.5h17a2 2 0 0 0 1.7-3L13.7 2.5a2 2 0 0 0-3.4 0zM12 8v5.5M12 16.6v.2" fill={C.coralSoft} stroke={C.coral} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div style={{ position: 'absolute', left: -20, top: 232, width: 400 * cross, height: 18, borderRadius: 9, background: C.mintInk, transform: 'rotate(-35deg)', transformOrigin: '0 50%', boxShadow: SH.s8 }} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: SAFE.x, right: SAFE.x, top: lerp(800, 625, up), textAlign: 'center', opacity: arrive(l, nh + 10, 12) }}>
        <div style={{ ...ui(44, C.ink, 700), fontStyle: 'italic', lineHeight: 1.2 }}>“We found no evidence of deliberate exploitation.”</div>
        <div style={{ ...ui(26, C.ink3, 600), marginTop: 8 }}>— Cloudflare</div>
      </div>
      {l >= bk - 14 ? <Lanes l={l - bk + 20} y={850} on={0} ticks={clamp((l - bk - 10) / 50)} glmFixed={1} /> : null}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1175, textAlign: 'center', ...ui(34, C.ink, 700), opacity: arrive(l, at('l08', 'affected'), 12) }}>
        baaki Workers AI models: <span style={{ color: C.mintInk }}>affected nahi</span>
      </div>
    </div>
  );
};

// ================================================================== 14 devs: what to do
export const Devs: React.FC = () => {
  const { l, at, dur } = useScene('devs');
  const d = at('l09', 'Developers:'), v = at('l09', 'v0.5.22'), mt = VERSION === 'v2' ? at('l09', 'aur') : at('l09', 'multi-tenant'), iso = at('l09', 'isolation'), q = depart(l, dur - 8, 8);
  const items: [number, React.ReactNode, string, boolean][] = [
    [v, <>SGLang <span style={{ fontFamily: FONT.mono, color: C.blueInk }}>v0.5.22+</span></>, 'disaggregated prefill/decode chalate ho toh', false],
    [mt, <>Context limit ≤ KV pool</>, 'is incident ka root cause yahi tha', false],
    [iso, <>Cross-tenant isolation test</>, 'TechpeTrek suggestion', true],
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - q }}>
      <Punch l={l} y={200} size={100} words={[{ t: 'DEVELOPERS:', at: d }]} out={iso - 12} />
      <Punch l={l} y={200} size={96} words={[{ t: 'TEST', at: iso }, { t: 'TENANT', at: iso + 4, c: C.blueInk }, { t: 'ISOLATION', at: iso + 8 }]} />
      <div style={{ ...box(SAFE.x, 470, SAFE.w), display: 'flex', flexDirection: 'column', gap: 22 }}>
        {items.map(([t, a, b, sug], i) => {
          const p = arrive(l, 4 + i * 6, 16), tk = land(invLerp(t + 8, t + 18, l));   // rows arrive with the scene, tick on their cue
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '26px 28px', borderRadius: 24, background: C.white, boxShadow: SH.s16, border: `2px solid ${tk > 0.5 ? C.mint : C.line}`,
              opacity: clamp(p * 1.5), transform: `translateY(${(1 - p) * 80}px) scale(${1.06 - 0.06 * p})` }}>
              <div style={{ width: 70, height: 70, borderRadius: 35, flex: 'none', border: `4px solid ${tk > 0 ? C.mint : C.ink3}`, background: tk > 0.5 ? C.mint : C.white, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {tk > 0 ? <div style={{ transform: `scale(${tk})` }}><Icon name="tick" size={44} color="#fff" sw={3.4} /></div> : null}
              </div>
              <div>
                <div style={{ ...ui(42, C.ink, 800) }}>{a}</div>
                <div style={{ ...ui(26, sug ? C.violet : C.ink2, sug ? 700 : 600), marginTop: 4 }}>{b}</div>
              </div>
            </div>
          );
        })}
      </div>
      <Source y={1180} p={arrive(l, v + 20, 12)} text="Items 1-2: Cloudflare blog · item 3: suggestion" />
    </div>
  );
};

// ================================================================== 15 cta: comment CACHE
export const Cta: React.FC = () => {
  const { l, at } = useScene('cta');
  const c = at('l10', 'CACHE,'), sv = at('l10', 'save');
  const typed = 'CACHE'.slice(0, [0, 3, 7, 10, 15, 19].filter((k) => l >= c - 10 + k).length - 1 + (l >= c - 10 ? 1 : 0));
  const sent = l >= c + 22, press = hit(l, c + 18, 6), saved = l >= sv;
  return (
    <>
      <Punch l={l} y={260} size={120} words={[{ t: 'COMMENT', at: 0 }, { t: 'CACHE', at: c - 4, c: C.blueInk }]} />
      <div style={{ ...box(SAFE.x, 640, SAFE.w), ...card, padding: '26px 28px', display: 'flex', alignItems: 'center', gap: 18, transform: `translateY(${(1 - arrive(l, 0, 14)) * 300}px)` }}>
        <Icon name="comment" size={52} color={C.ink2} sw={2} />
        <div style={{ flex: 1, ...ui(56, typed ? C.ink : C.ink3, typed ? 900 : 500), letterSpacing: typed ? '0.02em' : '-0.01em' }}>
          {typed || 'Add a comment…'}{!sent && Math.floor(l / 16) % 2 === 0 ? <span style={{ display: 'inline-block', width: 5, height: 52, background: C.blue, marginLeft: 4, verticalAlign: -6 }} /> : null}
        </div>
        <div style={{ width: 84, height: 84, borderRadius: 42, background: sent ? C.mint : C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 - 0.12 * press})` }}>
          <Icon name={sent ? 'tick' : 'send'} size={44} color="#fff" sw={2.6} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 860, display: 'flex', justifyContent: 'center', opacity: arrive(l, sv - 10, 12) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 30px', borderRadius: 22, background: C.white, boxShadow: SH.s16, transform: `scale(${1 + 0.08 * hit(l, sv, 10)})` }}>
          <svg width={52} height={52} viewBox="0 0 24 24"><path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.5L5.5 20.5v-16a1 1 0 0 1 1-1z" fill={saved ? C.ink : 'none'} stroke={C.ink} strokeWidth={1.9} strokeLinejoin="round" /></svg>
          <span style={{ ...ui(44, C.ink, 800) }}>Reel save karo</span>
        </div>
      </div>
      <Source y={1080} p={arrive(l, sv + 6, 14)} text="Source: blog.cloudflare.com/kv-cache-exposure-remediation · 26 Oct 2026" />
    </>
  );
};

export const SCENES: Record<string, React.FC> = {
  ...(VERSION === 'v2' ? { hook: HookV2, hook2: HookV2, hook3: HookV2 } : { hook: Hook }), source: SourceScene, model: Model, window: Window, count: Count, tokens: Tokens, pool: Pool, bug: Bug, stale: Stale,
  recon: VERSION === 'v2' ? ReconV2 : Recon, patch: Patch, fixed: Fixed, noexploit: NoExploit, devs: Devs, cta: Cta,
};
