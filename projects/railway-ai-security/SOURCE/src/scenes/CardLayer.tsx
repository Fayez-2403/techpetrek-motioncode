// The 2D CASE FILE card for each case segment and the checklist segment (see docs/BUILD_RULES.md).
// For a card segment: cross-fades in over local [IN-XF, IN) on top of the 3D card that flew to camera, plays its
// beat-locked choreography and media plan to the segment end, and stays for the first XF frames of the next segment
// (cross-fading out while the 3D board takes over again). Text comes from cases.json (checklist: CHECKLIST in CaseCard).
// Narration punch captions are drawn by the lead's Overlays; the card keeps the caption band (y 1436-1506) clear.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { TIMINGS as timings } from '../data/version';
import { CASES, CASE_TOTAL, FPS, IN, SEGS, XF, caseNo, type Seg } from '../lib/timeline';
import type { CueAt } from '../components/MediaWindow';
import { CHECKLIST, CaseCard, type CardData, type Intro } from '../components/CaseCard';
import type { Variant } from '../components/TypeTag';

/** 'build' = the card builds itself after the hand-off; 'handoff' = numeral / kicker / headline already inked at the
 *  hand-off (use this if the 3D flying card texture shows them, so nothing pops out and back in) */
export const CARD_INTRO: Intro = 'handoff';

const START = IN - XF;

// media cuts follow the narration: a plan item's `word` is found in the spoken words of the card's own segment
interface Word { w: string; t0: number }
const WORDS: Word[] = (timings as unknown as { variants: { reel: { captions: { words: Word[] }[] } } }).variants.reel.captions.flatMap((c) => c.words);
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
const cueFor = (seg: Seg): CueAt => (word) => {
  const w = WORDS.find((x) => x.t0 * FPS >= seg.from && x.t0 * FPS < seg.from + seg.durationInFrames && norm(x.w) === norm(word));
  return w ? Math.round(w.t0 * FPS) - (seg.from + START) : null;
};
function cardFor(seg: Seg): { data: CardData; variant: Variant } | null {
  if (seg.id === 'checklist') return { data: CHECKLIST, variant: 'dark' };
  const c = CASES.find((x) => x.id === seg.id);
  return c ? { data: c as unknown as CardData, variant: 'paper' } : null;
}

/** which card is on screen at a film frame: its data, card-local frame f, segment length len, beat phase, opacity */
export function cardAt(frame: number) {
  const i = SEGS.findIndex((s) => frame >= s.from && frame < s.from + s.durationInFrames);
  if (i < 0) return null;
  const seg = SEGS[i], local = frame - seg.from;
  const cur = cardFor(seg);
  if (cur && local >= START) {
    return { ...cur, seg, index: i, f: local - START, len: seg.durationInFrames - START, phase: seg.from + START, opacity: Math.min(1, (local - START) / XF) };
  }
  const prevSeg = i > 0 ? SEGS[i - 1] : null;
  const prev = prevSeg ? cardFor(prevSeg) : null;
  if (prevSeg && prev && local < XF) {
    const f = prevSeg.durationInFrames - START + local;
    return { ...prev, seg: prevSeg, index: i - 1, f, len: prevSeg.durationInFrames - START, phase: prevSeg.from + START, opacity: 1 - local / XF };
  }
  return null;
}

export const CardLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const c = cardAt(frame);
  if (!c) return null;
  return (
    <AbsoluteFill style={{ opacity: c.opacity }}>
      <CaseCard data={c.data} counter={{ n: caseNo(c.seg.id), total: CASE_TOTAL }} f={c.f} len={c.len} phase={c.phase}
        layout="CARD" variant={c.variant} intro={CARD_INTRO} cueAt={cueFor(c.seg)} />
    </AbsoluteFill>
  );
};
