// 4:5 carousel (1080x1350), the reference format, built from the same CASE FILE parts as the reel:
//   1 hook (dark), 2-6 the first five cases (paper), 7 the checklist (dark), 8 the CTA (paper, case-file index).
// Each slide is a silent loop: builds in from bare paper on the beat grid, media plan plays, content fades back to bare
// paper in the last 18 frames so frame 0 follows seamlessly. Props { index, still? }: still = settled PNG state.
// Root registration (lead): see SLIDES below; text comes from cases.json (hook/CTA lines marked LEAD-EDITABLE).
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { CASES } from '../lib/timeline';
import { CARD45 } from '../components/cardLayout';
import {
  CHECKLIST, CardBackground, CaseCard, Footnote, Headline, Kicker, TopBar, cardTimes, iconFor, ink, pad2, type CardData,
} from '../components/CaseCard';
import { Chips } from '../components/Chips';
import { MediaWindow, mediaSchedule, sourceLine } from '../components/MediaWindow';
import { TypeTag } from '../components/TypeTag';
import { TYPE, fitSize, headlineLayout, useFontsReady } from '../components/cardText';
import { clamp, easeInOutCubic, easeOutCubic, invLerp } from '../lib/anim';
import { C } from '../styles/theme';
import { F } from '../styles/typography';

export const SLIDE_FRAMES = 660;        // 11 s at 60 fps
const TOTAL = 8;
type Kind = 'hook' | 'case' | 'checklist' | 'cta';
export interface SlideDef { id: string; kind: Kind; caseIndex?: number; durationInFrames: number }
const nCases = Math.min(5, CASES.length);
export const SLIDES: SlideDef[] = [
  { id: 'Slide-1', kind: 'hook', durationInFrames: SLIDE_FRAMES },
  ...Array.from({ length: nCases }, (_, i) => ({ id: `Slide-${i + 2}`, kind: 'case' as const, caseIndex: i, durationInFrames: SLIDE_FRAMES })),
  { id: `Slide-${nCases + 2}`, kind: 'checklist', durationInFrames: SLIDE_FRAMES },
  { id: `Slide-${nCases + 3}`, kind: 'cta', durationInFrames: SLIDE_FRAMES },
];

// LEAD-EDITABLE copy for the two non-case slides (the CTA promise must match SOURCES_CHECKLIST.md)
export const CAROUSEL_COPY = {
  hookChip: (CASES[0] as unknown as { disambiguation?: string }).disambiguation ?? 'Railway.com = developer cloud · NOT Indian Railways',
  hookKickerTag: 'CASE FILE',
  ctaKicker: 'Sources + checklist · in your DM',
  ctaHeadline: 'Comment SECURITY',
  ctaAccentWord: 1,
  ctaBody: ['Get the verified source links + the AI-agent safety checklist.'],
  handle: '@techpetrek',
};

const L = CARD45;
const W = L.w - L.body.x * 2;

/** brand footer: logo + handle left, swipe cue right */
const Footer: React.FC<{ variant: 'paper' | 'dark'; swipe: boolean; t: number }> = ({ variant, swipe, t }) => {
  const p = ink(variant);
  const q = easeOutCubic(invLerp(0, 24, t));
  return (
    <div style={{ position: 'absolute', left: L.body.x, top: 1232, width: W, height: 70, opacity: q }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: p.hair }} />
      <div style={{ position: 'absolute', left: 0, top: 22, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Img src={staticFile('brand/techpe-trek.jpg')} style={{ width: 40, height: 40, borderRadius: 10, display: 'block' }} />
        <span style={{ fontFamily: F.mono, fontSize: 21, fontWeight: 600, letterSpacing: '0.04em', color: p.text }}>{CAROUSEL_COPY.handle}</span>
      </div>
      {swipe && (
        <div style={{ position: 'absolute', right: 0, top: 30, fontFamily: F.mono, fontSize: 20, fontWeight: 600, letterSpacing: '0.16em', color: p.accent }}>
          SWIPE <span style={{ display: 'inline-block', transform: `translateX(${Math.sin(t / 14) * 4}px)` }}>→</span>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------- slide 1: hook (dark cover)
const HookSlide: React.FC<{ f: number; len: number; still?: boolean }> = ({ f, len, still }) => {
  const c = CASES[0] as unknown as CardData;
  const T = cardTimes(len, 0);
  const t1 = still ? 999 : f - T.B1;
  const media = { x: L.media.x, y: 486, w: L.media.w, h: 604, r: L.media.r };
  const slots = mediaSchedule([{ anim: 'envCards' }], T.B2, len, 0);
  const chipT = still ? 999 : f - T.B1 - 30;
  const q = easeOutCubic(invLerp(0, 20, chipT));
  const chipSize = fitSize(CAROUSEL_COPY.hookChip, W - 60, 24, TYPE.monoBold, 18);
  return (
    <>
      <CardBackground w={L.w} h={L.h} variant="dark" />
      <TopBar L={L} f={f} tag={c.tag} n={1} total={TOTAL} variant="dark" dashAt={still ? -999 : 0} at={T.B1} still={still} />
      <Kicker x={L.body.x} y={128} size={24} icon={32} maxRight={L.counter.right} text={c.kicker} iconName={iconFor(c)} t={still ? 999 : t1 - 4} variant="dark" />
      <Headline x={L.body.x} y={188} w={W} size={112} lh={0.92} maxLines={2} text={c.headline} t={still ? 999 : t1 - 8} variant="dark" />
      <div style={{ position: 'absolute', left: L.body.x, top: 410, height: 50, display: 'flex', alignItems: 'center', gap: 14, padding: '0 22px',
        borderRadius: 25, border: `2px solid ${C.alert}`, background: 'rgba(255,90,31,0.10)', opacity: q, transform: `translateY(${(1 - q) * 12}px)`,
        fontFamily: F.mono, fontSize: chipSize, fontWeight: 700, letterSpacing: '0.04em', color: C.lunar, whiteSpace: 'nowrap' }}>
        <span style={{ width: 10, height: 10, borderRadius: 5, background: C.alert }} />
        {CAROUSEL_COPY.hookChip}
      </div>
      <MediaWindow receipts={[]} footnote={c.footnote} geo={media} f={f} at={T.B2} slots={slots} variant="dark" still={still} tagSize={17} />
      <Footnote x={L.footnote.x} y={L.footnote.y} size={L.footnote.size} text={c.footnote} t={still ? 999 : f - T.B2 - 12} variant="dark" width={W} />
      <Chips chips={c.chips} geo={L.chips} width={W} f={f} at={[T.B3, T.B4]} variant="dark" still={still} />
      <Footer variant="dark" swipe t={still ? 999 : f - T.B3} />
    </>
  );
};

// ---------------------------------------------------------------- slide 8: CTA with the case-file index
const CtaSlide: React.FC<{ f: number; len: number; still?: boolean }> = ({ f, len, still }) => {
  const T = cardTimes(len, 0);
  const t1 = still ? 999 : f - T.B1;
  const p = ink('paper');
  const hl = headlineLayout(CAROUSEL_COPY.ctaHeadline, { w: W, size: 112, maxLines: 2 });
  const bodyY = Math.round(188 + hl.lines.length * hl.size * 0.92 + 26);
  const boxY = bodyY + CAROUSEL_COPY.ctaBody.length * 44 + 30;
  const box = { x: L.body.x, y: boxY, w: W, h: 1186 - boxY };
  const rows = CASES.slice(0, 6) as unknown as CardData[];
  const rowH = Math.min(104, (box.h - 70) / rows.length);
  const inP = still ? 1 : easeOutCubic(invLerp(T.B2, T.B2 + 36, f));
  return (
    <>
      <CardBackground w={L.w} h={L.h} variant="paper" />
      <TopBar L={L} f={f} tag="ACTION" n={TOTAL} total={TOTAL} variant="paper" dashAt={still ? -999 : 0} at={T.B1} still={still} />
      <Kicker x={L.body.x} y={128} size={24} icon={32} maxRight={L.counter.right} text={CAROUSEL_COPY.ctaKicker} iconName="doc" t={still ? 999 : t1 - 4} variant="paper" />
      <Headline x={L.body.x} y={188} w={W} size={112} lh={0.92} maxLines={2} text={CAROUSEL_COPY.ctaHeadline} accentWords={[CAROUSEL_COPY.ctaAccentWord]}
        t={still ? 999 : t1 - 8} variant="paper" />
      {CAROUSEL_COPY.ctaBody.map((b, i) => {
        const q = still ? 1 : easeOutCubic(invLerp(T.B1 + 26 + i * 7, T.B1 + 50 + i * 7, f));
        return <div key={i} style={{ position: 'absolute', left: L.body.x, top: bodyY + i * 44, fontFamily: F.head, fontWeight: TYPE.body.weight, fontSize: 34,
          letterSpacing: '-0.004em', color: p.body, opacity: q, transform: `translateY(${(1 - q) * 16}px)`, whiteSpace: 'nowrap' }}>{b}</div>;
      })}
      {/* case-file index card */}
      <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: 18, background: '#FBF8F1',
        boxShadow: `inset 0 0 0 1.5px rgba(18,18,18,0.86), 0 ${22 * inP}px ${46 * inP}px -${14 * inP}px rgba(48,32,10,${0.4 * inP})`,
        transform: `scale(${0.96 + 0.04 * inP})`, opacity: clamp(inP * 1.6), overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 30, top: 24, right: 30, display: 'flex', justifyContent: 'space-between', fontFamily: F.mono, fontSize: 18,
          fontWeight: 600, letterSpacing: '0.14em', color: C.alertDeep }}>
          <span>CASE FILE INDEX</span><span style={{ color: C.mute }}>{pad2(CASES.length)} CASES</span>
        </div>
        {rows.map((c, i) => {
          const q = still ? 1 : easeOutCubic(invLerp(T.B2 + 10 + i * 8, T.B2 + 34 + i * 8, f));
          const y = 64 + i * rowH;
          const hs = fitSize(c.headline, box.w - 60 - 86 - 20, 30, TYPE.value, 22);
          const src = sourceLine(c.footnote.split('·').filter((s) => !s.includes('“')).join('·'));
          return (
            <div key={c.id} style={{ position: 'absolute', left: 30, right: 30, top: y, height: rowH, borderTop: '1px solid rgba(18,18,18,0.12)', opacity: q,
              transform: `translateX(${(1 - q) * 24}px)` }}>
              <div style={{ position: 'absolute', left: 0, top: rowH * 0.12, fontFamily: F.serif, fontSize: rowH * 0.62, lineHeight: 1, color: C.alert }}>{pad2(c.n ?? i + 1)}</div>
              <div style={{ position: 'absolute', left: 86, top: rowH * 0.17, fontFamily: F.head, fontWeight: TYPE.value.weight, fontSize: hs, letterSpacing: '-0.015em',
                lineHeight: 1, color: C.ink, whiteSpace: 'nowrap' }}>{c.headline}</div>
              <div style={{ position: 'absolute', left: 86, top: rowH * 0.56, display: 'flex', alignItems: 'center', gap: 14 }}>
                <TypeTag tag={c.tag} f={f} at={T.B2 + 14 + i * 8} variant="paper" size={15} still={still} />
                <span style={{ fontFamily: F.mono, fontSize: 17, color: C.mute, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{src}</span>
              </div>
            </div>
          );
        })}
      </div>
      <Footer variant="paper" swipe={false} t={still ? 999 : f - T.B3} />
    </>
  );
};

/** one carousel slide; props.index = position in SLIDES */
export const CarouselSlide: React.FC<{ index: number; still?: boolean }> = ({ index, still }) => {
  useFontsReady();
  const frame = useCurrentFrame();
  const def = SLIDES[index] ?? SLIDES[0];
  const len = def.durationInFrames - 30;
  // still: a settled frame well into the first media item
  const f = still ? cardTimes(len, 0).B2 + 110 : frame;
  const out = still ? 0 : easeInOutCubic(invLerp(def.durationInFrames - 18, def.durationInFrames - 1, frame));
  const dark = def.kind === 'hook' || def.kind === 'checklist';
  let body: React.ReactNode;
  if (def.kind === 'hook') body = <HookSlide f={f} len={len} still={still} />;
  else if (def.kind === 'cta') body = <CtaSlide f={f} len={len} still={still} />;
  else {
    const data = def.kind === 'checklist' ? CHECKLIST : (CASES[def.caseIndex ?? 0] as unknown as CardData);
    body = (
      <CaseCard data={data} counter={{ n: index + 1, total: TOTAL }} f={f} len={len} phase={0} layout="CARD45"
        variant={dark ? 'dark' : 'paper'} still={still}>
        <Footer variant={dark ? 'dark' : 'paper'} swipe t={still ? 999 : f - cardTimes(len, 0).B3} />
      </CaseCard>
    );
  }
  return (
    <AbsoluteFill style={{ background: dark ? C.graphite : C.paper }}>
      <CardBackground w={L.w} h={L.h} variant={dark ? 'dark' : 'paper'} />
      <AbsoluteFill style={{ opacity: 1 - out }}>{body}</AbsoluteFill>
    </AbsoluteFill>
  );
};
