// Lead-owned overlays: the hook title (power line -> tease) with the "NOT Indian Railways" chip, the narration punch captions (one band for the
// whole reel, paper or dark styling by segment), and the CTA type over the board's final pull-back.
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { TIMINGS as timings, VERSION } from '../data/version';
import { clamp, dampedSpring, easeInOutCubic, easeOutCubic, invLerp, lerp, reveal, window_ } from '../lib/anim';
import { CARD_SEGS, FPS, IN, caseNo, segAt, segById } from '../lib/timeline';
import { wfAny } from '../lib/words';
import { CARD } from '../components/cardLayout';
import { C, SAFE } from '../styles/theme';
import { F } from '../styles/typography';

interface Word { w: string; t0: number; t1: number }
interface Cap { line: string; t0: number; t1: number; text: string; words: Word[] }
const CAPS: Cap[] = (timings as unknown as { variants: { reel: { captions: Cap[] } } }).variants.reel.captions;
const KEY = /^(SECURITY|Railway|CERT-In|LiteLLM|Copilot|Reuters|rotate|keys|confirm|nahi|India|AI|Number|credentials|access|audit|human|approval|Saavdhan|responsibility|cases)/i;
const V2 = VERSION === 'v2';

/** Hook title (top band). Frame 0 opens on the power line (the GPT draft's hook "Indian devs — aapki cloud API keys RISK
 *  mein?!"); RISK inks orange with a punch on the stamp hit. When the fifth string snaps taut the lines roll over to the
 *  tease "1 of 6 case files · India ka CERT-In bhi." (the brief: by 4–5 s, 1 of N cases, CERT-In among them).
 *  The NOT-Indian-Railways chip sits under it from f36. */
const STAMP_F = 30, TEASE_F = 240;
const BIG: React.CSSProperties = { fontFamily: F.head, fontWeight: 900, fontSize: 112, lineHeight: 1, letterSpacing: '-0.02em', color: C.lunar,
  textShadow: '0 6px 34px rgba(0,0,0,0.6)', whiteSpace: 'nowrap' };
const MONO: React.CSSProperties = { fontFamily: F.mono, fontWeight: 600, fontSize: 26, letterSpacing: '0.16em', color: C.alert, whiteSpace: 'nowrap' };
/** one row: the power text rolls up and out, the tease text rolls up in (masked by the row) */
const Row: React.FC<{ h: number; out: number; inn: number; a: React.ReactNode; b: React.ReactNode; style: React.CSSProperties }> = ({ h, out, inn, a, b, style }) => (
  <div style={{ position: 'relative', height: h, overflow: 'hidden' }}>
    <div style={{ ...style, position: 'absolute', left: 0, top: 0, transform: `translateY(${-out * 110}%)`, opacity: 1 - out }}>{a}</div>
    <div style={{ ...style, position: 'absolute', left: 0, top: 0, transform: `translateY(${(1 - inn) * 110}%)`, opacity: inn }}>{b}</div>
  </div>
);

const HookTitle: React.FC = () => {
  const f = useCurrentFrame();
  const s = segById('hook')!;
  const local = f - s.from;
  if (local < 0 || local >= s.durationInFrames) return null;
  const end = s.durationInFrames;
  const vis = 1 - invLerp(end - 10, end - 2, local);
  const settle = 1 + 0.035 * (1 - easeOutCubic(invLerp(0, 18, local)));      // legible at frame 0, settles in
  const hit = local >= STAMP_F ? 1 - dampedSpring((local - STAMP_F) / FPS, 16, 0.4) : 0;   // 1 -> 0 with a wobble
  const inked = local >= STAMP_F;
  const out = (r: number) => (V2 ? 0 : easeInOutCubic(invLerp(TEASE_F + 4 * r, TEASE_F + 4 * r + 12, local)));
  const inn = (r: number) => (V2 ? 0 : easeOutCubic(invLerp(TEASE_F + 4 * r + 5, TEASE_F + 4 * r + 18, local)));
  const chipOn = window_(local, 36, end - 6, 10);
  const pop = dampedSpring((local - 36) / FPS, 16, 0.5);
  return (
    <>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 780, opacity: vis, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(8,8,10,0.84) 0%, rgba(8,8,10,0.62) 48%, rgba(8,8,10,0) 100%)' }} />
      <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: SAFE.top + 2, opacity: vis,
        transform: `translateY(${hit * 8}px) scale(${settle})`, transformOrigin: 'left top' }}>
        {V2 ? (
          <>
            {/* v2: "Ye dekho 5 bade cases, jo pichhle 2 hafton mein hue"; one chip lights per string as it snaps taut */}
            <Row h={40} out={0} inn={0} style={MONO} a="PICHHLE 2 HAFTE · OCT 13–23, 2026" b={null} />
            <Row h={114} out={0} inn={0} style={BIG} a={<><span style={{ display: 'inline-block', color: C.alert, transform: `scale(${1 + 0.16 * hit})`, transformOrigin: '50% 70%',
              marginRight: 24 * hit, textShadow: `0 0 ${36 * (0.4 + hit)}px rgba(255,90,31,0.55), 0 6px 34px rgba(0,0,0,0.6)` }}>5</span> BADE</>} b={null} />
            <Row h={118} out={0} inn={0} style={BIG} a="CASES." b={null} />
            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              {[0, 1, 2, 3, 4].map((k) => {
                const on = local >= 120 + 30 * k ? dampedSpring((local - (120 + 30 * k)) / FPS, 18, 0.45) : 0;
                const lit = local >= 120 + 30 * k;
                return <div key={k} style={{ width: 70, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: 22,
                  background: lit ? C.alert : 'rgba(21,22,26,0.8)', color: lit ? '#120604' : C.steel, border: `2px solid ${lit ? C.alert : 'rgba(236,239,244,0.25)'}`,
                  transform: `scale(${lit ? 0.7 + 0.3 * on : 1})`, boxShadow: lit ? '0 0 24px rgba(255,90,31,0.6)' : 'none' }}>{`0${k + 1}`}</div>;
              })}
            </div>
          </>
        ) : (
          <>
            <Row h={40} out={out(0)} inn={inn(0)} style={MONO} a="INDIAN DEVS · AAPKI CLOUD" b="1 OF 6 CASE FILES · OCT 13–23, 2026" />
            <Row h={114} out={out(1)} inn={inn(1)} style={BIG} a="API KEYS" b="India ka" />
            <Row h={118} out={out(2)} inn={inn(2)} style={BIG}
              a={<><span style={{ display: 'inline-block', color: inked ? C.alert : C.lunar, transform: `scale(${1 + 0.1 * hit})`, transformOrigin: '50% 70%', marginRight: 20 * hit,
                textShadow: inked ? `0 0 ${36 * (0.4 + hit)}px rgba(255,90,31,0.55), 0 6px 34px rgba(0,0,0,0.6)` : BIG.textShadow }}>RISK</span> mein?!</>}
              b={<><span style={{ color: C.alert }}>CERT-In</span> bhi.</>} />
          </>
        )}
        <div style={{ marginTop: 20, opacity: chipOn, transform: `scale(${0.9 + 0.1 * pop})`, transformOrigin: 'left center', display: 'inline-flex', alignItems: 'center', gap: 18,
          padding: '12px 26px 14px 22px', borderRadius: 12, background: 'rgba(21,22,26,0.86)', border: `2px solid ${C.alert}`, boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
          <span style={{ width: 16, height: 16, borderRadius: 8, background: C.alert, boxShadow: `0 0 14px ${C.alert}`, flex: 'none' }} />
          <span style={{ display: 'flex', flexDirection: 'column', whiteSpace: 'nowrap' }}>
            <span style={{ fontFamily: F.head, fontWeight: 700, fontSize: 30, color: C.lunar, letterSpacing: '0.01em' }}>Railway.com = developer cloud</span>
            <span style={{ fontFamily: F.head, fontWeight: 900, fontSize: 46, color: C.alert, letterSpacing: '0.005em', lineHeight: 1.05 }}>NOT Indian Railways</span>
          </span>
        </div>
      </div>
    </>
  );
};

/** narration captions: one Roman Hinglish card at a time in the caption band; the spoken word brightens */
const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const card = CAPS.find((c, i) => t >= c.t0 - 0.06 && t < Math.max(c.t1 + 0.2, Math.min(c.t1 + 0.5, (CAPS[i + 1]?.t0 ?? 1e9) - 0.06)));
  if (!card) return null;
  const { seg, local } = segAt(f);
  const onCard = seg.id !== 'hook' && seg.id !== 'cta' && local >= IN - 6 && seg.id !== 'checklist';
  const pin = easeOutCubic(invLerp(card.t0 - 0.06, card.t0 + 0.12, t));
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: CARD.caption.y - 8, display: 'flex', justifyContent: 'center', zIndex: 80, pointerEvents: 'none' }}>
      <div style={{ maxWidth: 952, textAlign: 'center', padding: '8px 22px', borderRadius: 12, opacity: pin, transform: `translateY(${(1 - pin) * 10}px)`,
        background: onCard ? 'rgba(18,18,18,0.9)' : 'rgba(10,10,12,0.66)', backdropFilter: 'blur(8px)',
        fontFamily: F.head, fontWeight: 750, fontSize: card.text.length > 60 ? 38 : CARD.caption.size, lineHeight: 1.12, letterSpacing: '-0.005em' }}>
        {card.words.map((w, i) => {
          const spoken = t >= w.t0 - 0.03;
          const key = KEY.test(w.w.replace(/[,.?!:—]+$/, '')) || /\d/.test(w.w);
          const pop = V2 ? 1 - clamp((t - w.t0 + 0.03) / 0.16) : 0;   // v2: the word lands with a small pop
          return (
            <React.Fragment key={i}>
              <span style={{ display: 'inline-block', color: spoken ? (key ? C.alert : '#FFFFFF') : 'rgba(236,239,244,0.5)',
                transform: spoken && pop > 0 ? `scale(${1 + 0.08 * pop})` : undefined }}>{w.w}</span>{i < card.words.length - 1 ? ' ' : ''}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/** v2: "Number one..five". A giant numeral slams on the spoken word "Number", then shrinks into the card's numeral slot */
const NUM_SEGS = ['railway', 'certin', 'litellm', 'copilot', 'reuters'];
const NumberSlam: React.FC = () => {
  const f = useCurrentFrame();
  if (!V2) return null;
  const { seg, local } = segAt(f);
  if (!NUM_SEGS.includes(seg.id)) return null;
  const w = wfAny('Number', seg.from, seg.from + seg.durationInFrames);
  if (w === null) return null;
  const at = w - seg.from - 3, fly0 = Math.max(IN - 16, at + 18), fly1 = fly0 + 12;
  if (local < at || local >= fly1 + 2) return null;
  const p = dampedSpring((local - at) / FPS, 15, 0.45), fl = easeInOutCubic(invLerp(fly0, fly1, local));
  const ring = invLerp(at, at + 18, local), fade = 1 - invLerp(fly1 - 4, fly1 + 2, local);
  const cx = lerp(540, CARD.numeral.x + 52, fl), cy = lerp(860, CARD.numeral.y + 78, fl), s = lerp(1, 0.27, fl) * (1 + 0.45 * (1 - p));
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.6 * (1 - fl), background: 'radial-gradient(circle at 50% 45%, rgba(8,8,10,0.85) 0%, rgba(8,8,10,0.3) 70%)' }} />
      <div style={{ position: 'absolute', left: 540 - 700 * ring, top: 860 - 700 * ring, width: 1400 * ring, height: 1400 * ring, borderRadius: '50%',
        border: `6px solid ${C.alert}`, opacity: 0.6 * (1 - ring) }} />
      <div style={{ position: 'absolute', left: cx, top: cy, transform: `translate(-50%, -50%) scale(${s})`, opacity: fade, textAlign: 'center' }}>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 44, letterSpacing: '0.4em', color: C.lunar, opacity: 1 - fl, marginBottom: -40 }}>NUMBER</div>
        <div style={{ fontFamily: F.serif, fontSize: 620, lineHeight: 1, color: C.alert, textShadow: '0 0 80px rgba(255,90,31,0.55)' }}>{caseNo(seg.id)}</div>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: C.lunar, opacity: local < at + 3 ? 0.3 * (1 - (local - at) / 3) : 0 }} />
    </AbsoluteFill>
  );
};
/** v2: short flashes on the hard cut into the board and on every card hand-off */
const CutFlash: React.FC = () => {
  const f = useCurrentFrame();
  if (!V2) return null;
  const { seg, local } = segAt(f);
  let a = 0;
  if (seg.id === 'hook' && local < 5) a = 0.45 * (1 - local / 5);
  if (CARD_SEGS.includes(seg) && local >= IN - 6 && local < IN - 2) a = 0.2 * (1 - (local - (IN - 6)) / 4);
  return a > 0 ? <AbsoluteFill style={{ background: C.lunar, opacity: a, pointerEvents: 'none' }} /> : null;
};

const CtaType: React.FC = () => {
  const f = useCurrentFrame();
  const s = segById('cta')!;
  const local = f - s.from;
  if (local < 0) return null;
  const at = 70;
  const p = easeInOutCubic(invLerp(at, at + 20, local));
  const word = dampedSpring((local - at - 8) / FPS, 13, 0.5);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 260, opacity: p }}>
      <div style={{ textAlign: 'center', padding: '40px 54px', borderRadius: 26, background: 'rgba(15,15,18,0.72)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,90,31,0.4)' }}>
        <div style={{ fontFamily: F.mono, fontSize: 26, letterSpacing: '0.2em', color: C.lunar, opacity: 0.85 }}>COMMENT</div>
        <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 132, color: C.alert, letterSpacing: '0.02em', lineHeight: 1, marginTop: 8,
          transform: `scale(${0.85 + 0.15 * word})`, textShadow: '0 0 40px rgba(255,90,31,0.45)' }}>SECURITY</div>
        <div style={{ fontFamily: F.head, fontWeight: 600, fontSize: 36, color: C.lunar, marginTop: 18, opacity: reveal(local, at + 18, 14) }}>verified sources + checklist, DM mein</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 26, opacity: reveal(local, at + 30, 14) }}>
          <Img src={staticFile('brand/techpe-trek.jpg')} style={{ width: 58, height: 58, borderRadius: 14 }} />
          <span style={{ fontFamily: F.head, fontWeight: 800, fontSize: 32, color: C.lunar }}>TechpeTrek</span>
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 19, color: C.steel, marginTop: 20, lineHeight: 1.5, opacity: reveal(local, at + 40, 14) }}>
          Sources: blog.railway.com · cert-in.org.in · embracethered.com · reuters.com<br />Independent explainer · facts as of Oct 26, 2026
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Overlays: React.FC = () => (
  <>
    <HookTitle />
    <NumberSlam />
    <CutFlash />
    <CtaType />
    <Captions />
  </>
);
