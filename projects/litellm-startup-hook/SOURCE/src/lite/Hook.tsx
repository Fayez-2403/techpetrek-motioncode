// Hook (user's idea): "Maan lo, aapne startup shuru kiya… aur aapki website, AI ne chura li! LOL." — a hypothetical, drawn as a
// cartoon: a mock startup site, a claw drops on "AI" and yanks it away on "chura". Then hookB rewinds it ("Nahi, abhi itna toh
// nahi hua") and turns to the real story: "Python start hote hi, API keys risk mein!" (qualified on screen: 1.107.0 only).
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { clamp, easeInCubic, easeInOutCubic, easeOutCubic, invLerp, lerp } from '../lib/anim';
import { F } from '../styles/typography';
import { Bg, Chip, Enter, Flash, K, SAFE, Slam, Stamp, Tag, fadeIn, hit, pop, shake, useScene } from './kit';

/** the mock startup site (fictional, no real brand) */
const Site: React.FC<{ glow: number; launched: number; l: number }> = ({ glow, launched, l }) => (
  <div style={{ position: 'relative', width: 780, height: 560, borderRadius: 28, background: '#F4F1EA', overflow: 'hidden',
    boxShadow: `0 40px 90px rgba(0,0,0,0.6), 0 0 ${30 + 60 * glow}px rgba(46,229,157,${0.25 + 0.5 * glow})`, border: `4px solid rgba(46,229,157,${0.2 + 0.8 * glow})` }}>
    <div style={{ height: 62, background: '#E3DED3', display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px' }}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c }} />)}
      <div style={{ marginLeft: 18, flex: 1, height: 34, borderRadius: 17, background: '#F4F1EA', display: 'flex', alignItems: 'center', padding: '0 18px',
        fontFamily: F.mono, fontSize: 22, color: '#3B3934' }}>apna-startup</div>
    </div>
    <div style={{ padding: '44px 48px' }}>
      <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: '0.14em', color: K.mintDeep }}>DAY 1 · LIVE</div>
      <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 92, lineHeight: 0.95, color: '#121212', marginTop: 14, letterSpacing: '-0.03em' }}>Apna<br />Startup.</div>
      <div style={{ display: 'flex', gap: 14, marginTop: 30 }}>
        <div style={{ padding: '16px 30px', borderRadius: 14, background: '#121212', color: '#F4F1EA', fontFamily: F.head, fontWeight: 800, fontSize: 28 }}>Get started</div>
        <div style={{ padding: '16px 30px', borderRadius: 14, border: '3px solid #121212', color: '#121212', fontFamily: F.head, fontWeight: 800, fontSize: 28 }}>Demo</div>
      </div>
      {[0, 1, 2].map((i) => <div key={i} style={{ height: 16, width: 520 - i * 120 + 30 * Math.sin(l / 20 + i), borderRadius: 8, background: 'rgba(18,18,18,0.12)', marginTop: i ? 14 : 34 }} />)}
    </div>
    {launched > 0 ? (
      <div style={{ position: 'absolute', right: 34, top: 96, transform: `rotate(${8 - 2 * launched}deg) scale(${1.8 - 0.8 * launched})`, opacity: clamp(launched * 2),
        padding: '10px 20px', borderRadius: 12, border: `5px solid ${K.mintDeep}`, color: K.mintDeep, fontFamily: F.head, fontWeight: 900, fontSize: 40 }}>LAUNCHED!</div>
    ) : null}
  </div>
);

/** cartoon grabber claw on a cable, pivot at the claw's hub; `close` 0 open .. 1 shut */
const Claw: React.FC<{ y: number; close: number }> = ({ y, close }) => (
  <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
    <line x1={540} y1={-40} x2={540} y2={y - 40} stroke="#9AA3B2" strokeWidth={10} />
    <g transform={`translate(540 ${y})`}>
      <rect x={-70} y={-60} width={140} height={60} rx={16} fill="#2A3242" stroke={K.red} strokeWidth={5} />
      <circle cx={0} cy={-30} r={12} fill={K.red} />
      {[-1, 1].map((s) => (
        <g key={s} transform={`rotate(${s * (34 - 30 * close)})`}>
          <path d={`M ${s * 40} 0 L ${s * 70} 90 L ${s * 30} 160`} fill="none" stroke="#C9D1DE" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
      <text x={0} y={-74} textAnchor="middle" fontFamily={F.mono} fontWeight={800} fontSize={30} fill={K.red}>AI</text>
    </g>
  </svg>
);

export const HookA: React.FC = () => {
  const { l, at } = useScene('hookA');
  const st = at('h1', 'startup'), web = at('h1', 'website'), ai = at('h1', 'AI'), ch = at('h1', 'chura'), lol = at('h1', 'LOL');
  const dropT = easeOutCubic(invLerp(ai - 4, ai + 12, l));
  const close = easeInOutCubic(invLerp(ch - 6, ch + 2, l));
  const yank = easeInCubic(invLerp(ch + 4, ch + 22, l));
  const cardY = 880 - 1500 * yank;
  const clawY = lerp(-220, 600, dropT) - 1500 * yank;
  const sk = shake(l, [ch + 6, lol], 16);
  const settle = 1 + 0.05 * (1 - easeOutCubic(invLerp(0, 16, l)));   // readable at frame 0, settles
  return (
    <AbsoluteFill style={{ transform: `translate(${sk.x}px, ${sk.y}px)` }}>
      <Bg glow={K.mint} amount={0.22 + 0.2 * (1 - yank)} />
      <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 270, textAlign: 'center', transform: `scale(${settle})` }}>
        <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 140, lineHeight: 0.95, color: K.lunar, letterSpacing: '-0.03em', textShadow: '0 8px 40px rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>MAAN LO…</div>
        <div style={{ marginTop: 18, height: 70 }}><Slam l={l} at={st} size={58} color={K.mint} from={1.4}>aapne STARTUP shuru kiya</Slam></div>
      </div>
      <div style={{ position: 'absolute', left: 540, top: cardY, transform: `translate(-50%, -50%) rotate(${-6 * yank}deg) scale(${0.94 + 0.06 * pop(l, 0, 14, 0.6)})`,
        filter: yank > 0.05 ? `blur(${yank * 10}px)` : undefined }}>
        <Site glow={hit(l, web, 30)} launched={pop(l, st + 6, 18, 0.5)} l={l} />
      </div>
      {l >= ai - 4 ? <Claw y={clawY} close={close} /> : null}
      {/* motion streaks during the yank */}
      {yank > 0 && yank < 1 ? [0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{ position: 'absolute', left: 230 + i * 150, top: 300, width: 8, height: 1200, background: `linear-gradient(transparent, rgba(236,239,244,${0.35 * (1 - yank)}), transparent)` }} />
      )) : null}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 820, height: 200 }}><Stamp l={l} at={ch + 8} text="CHURA LI?!" size={120} /></div>
      {l >= lol ? (
        <div style={{ position: 'absolute', left: 640, top: 1110, transform: `rotate(${8 + 6 * Math.sin((l - lol) / 4) * Math.exp(-(l - lol) / 20)}deg) scale(${pop(l, lol, 18, 0.35)})`,
          padding: '18px 34px', borderRadius: 40, background: K.yellow, color: '#121212', fontFamily: F.head, fontWeight: 900, fontSize: 84, boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>LOL</div>
      ) : null}
      <Tag text="HYPOTHETICAL · ILLUSTRATION" y={1330} />
      <Flash l={l} at={ch + 8} color={K.red} max={0.35} />
    </AbsoluteFill>
  );
};

const KEYS = ['AI_API_KEY', 'CLOUD_KEY', 'SSH_KEY', 'GH_TOKEN', '.env', 'DB_PASS'];

export const HookB: React.FC = () => {
  const { l, at } = useScene('hookB');
  const abhi = at('h2', 'abhi'), lek = at('h2', 'Lekin'), py = at('h2', 'Python'), st = at('h2', 'start'), keys = at('h2', 'keys'), risk = at('h2', 'risk');
  const rew = 1 - easeOutCubic(invLerp(0, 22, l));                 // VHS rewind: the site falls back into place
  const part2 = l >= lek;
  const sk = shake(l, [lek, st, risk], 14);
  const red = easeOutCubic(invLerp(st, st + 12, l));
  return (
    <AbsoluteFill style={{ transform: `translate(${sk.x}px, ${sk.y}px)` }}>
      {!part2 ? (
        <AbsoluteFill>
          <Bg glow={K.mint} amount={0.3} />
          <div style={{ position: 'absolute', left: 540, top: 900 - 1500 * rew, transform: `translate(-50%, -50%) scale(0.86)`, filter: rew > 0.02 ? `blur(${rew * 8}px)` : undefined }}>
            <Site glow={0.4} launched={1} l={l} />
          </div>
          {/* rewind scanlines + RGB split */}
          {l < 26 ? <AbsoluteFill style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0 3px, transparent 3px 7px)', opacity: 1 - l / 26 }} /> : null}
          {l < 26 ? <div style={{ position: 'absolute', left: SAFE.side, top: 1200, fontFamily: F.mono, fontWeight: 800, fontSize: 40, color: K.lunar, opacity: (l % 12) < 8 ? 1 : 0 }}>◀◀ REWIND</div> : null}
          <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 260, textAlign: 'center' }}>
            <Slam l={l} at={2} size={170} color={K.mint}>NAHI!</Slam>
            <div style={{ marginTop: 16, fontFamily: F.head, fontWeight: 700, fontSize: 52, color: K.lunar, opacity: fadeIn(l, abhi), transform: `translateY(${(1 - fadeIn(l, abhi)) * 20}px)` }}>
              abhi itna toh nahi hua…
            </div>
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 1240, display: 'flex', justifyContent: 'center' }}>
            <Chip p={pop(l, abhi + 10)} text="Website safe hai." sub="(abhi ke liye)" color={K.mint} size={36} />
          </div>
        </AbsoluteFill>
      ) : (
        <Enter l={l - lek}>
          <Bg glow={K.red} amount={0.18 + 0.4 * red} />
          <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 250, textAlign: 'center' }}>
            {l < py ? (
              <>
                <Slam l={l} at={lek} size={110}>LEKIN</Slam><br />
                <Slam l={l} at={lek + 8} size={110} color={K.orange}>YE DEKHO</Slam>
                <div style={{ fontSize: 120, color: K.orange, lineHeight: 1, marginTop: 6, transform: `translateY(${10 * Math.sin(l / 5)}px)` }}>↓</div>
              </>
            ) : (
              <>
                <Slam l={l} at={py} size={100}>PYTHON START</Slam><br />
                <span style={{ display: 'inline-block', marginTop: 8 }}>
                  <Slam l={l} at={keys} size={100} style={{ marginRight: 28 }}>= KEYS</Slam>
                  <Slam l={l} at={risk} size={100} color={K.red} from={2.2} style={{ textShadow: `0 0 ${40 * (0.5 + hit(l, risk, 30))}px rgba(255,59,47,0.7)` }}>RISK?!</Slam>
                </span>
              </>
            )}
          </div>
          {l >= py - 6 ? <Terminal l={l} py={py} st={st} keys={keys} red={red} /> : null}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 1236, display: 'flex', justifyContent: 'center' }}>
            <Chip p={pop(l, risk + 4)} text="Sirf LiteLLM 1.107.0" sub="wale affected environments" color={K.red} size={36} />
          </div>
          <Flash l={l} at={st} color={K.red} max={0.4} />
        </Enter>
      )}
      <Flash l={l} at={lek} />
    </AbsoluteFill>
  );
};

/** a terminal: "$ python" types on "Python", Enter on "start" turns it red; key tiles around it vanish on "keys" */
const Terminal: React.FC<{ l: number; py: number; st: number; keys: number; red: number }> = ({ l, py, st, keys, red }) => {
  const typed = 'python app.py'.slice(0, Math.max(0, Math.floor((l - py) / 2)));
  const ring = invLerp(st, st + 40, l);
  return (
    <>
      {l >= st ? <div style={{ position: 'absolute', left: 540 - 520 * ring, top: 860 - 520 * ring, width: 1040 * ring, height: 1040 * ring, borderRadius: '50%',
        border: `6px solid ${K.red}`, opacity: 0.7 * (1 - ring) }} /> : null}
      {KEYS.map((k, i) => {
        const a = (i / KEYS.length) * Math.PI * 2 + l / 90;
        const go = easeInCubic(invLerp(keys + i * 4, keys + i * 4 + 18, l));
        const x = 540 + Math.cos(a) * (400 + 500 * go), y = 860 + Math.sin(a) * (300 + 300 * go) - 400 * go;
        return (
          <div key={k} style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${1 - 0.5 * go}) rotate(${go * 40}deg)`, opacity: 1 - go,
            padding: '10px 16px', borderRadius: 10, background: 'rgba(16,26,46,0.92)', border: `2px solid ${go > 0 ? K.red : 'rgba(236,239,244,0.35)'}`,
            fontFamily: F.mono, fontWeight: 700, fontSize: 24, color: K.lunar, whiteSpace: 'nowrap', filter: go > 0 ? `blur(${go * 6}px)` : undefined }}>
            {k}
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: 540, top: 860, transform: `translate(-50%, -50%) scale(${0.9 + 0.1 * pop(l, py - 6, 16, 0.5)})`, width: 640, height: 300, borderRadius: 22,
        background: '#0B1120', border: `3px solid ${red > 0 ? K.red : 'rgba(236,239,244,0.3)'}`, boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 ${80 * red}px rgba(255,59,47,${0.6 * red})`, overflow: 'hidden' }}>
        <div style={{ height: 46, background: '#141C2E', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 10 }}>
          {[0, 1, 2].map((i) => <span key={i} style={{ width: 14, height: 14, borderRadius: 7, background: 'rgba(236,239,244,0.25)' }} />)}
          <span style={{ marginLeft: 12, fontFamily: F.mono, fontSize: 20, color: K.steel }}>terminal</span>
        </div>
        <div style={{ padding: '30px 30px', fontFamily: F.mono, fontSize: 44, color: K.lunar }}>
          <span style={{ color: K.mint }}>$</span> {typed}<span style={{ opacity: Math.floor(l / 15) % 2 ? 1 : 0 }}>▌</span>
          {l >= st ? <div style={{ marginTop: 26, fontSize: 30, fontWeight: 800, color: K.red, opacity: (l - st) % 16 < 11 ? 1 : 0.35 }}>! startup pe hidden code…</div> : null}
        </div>
      </div>
      <Tag y={1180} text="ILLUSTRATION" />
    </>
  );
};
