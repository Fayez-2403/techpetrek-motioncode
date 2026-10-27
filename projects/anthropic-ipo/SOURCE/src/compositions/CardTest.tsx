// Card builder's test compositions (not part of the deliverable). Register <CardTestCompositions /> anywhere inside a Root
// to get: CardTest-<id> (9:16 card for every case + checklist, card-local frame = composition frame, 9 s, beat phase 0)
// and the carousel slides Slide-1..8 (4:5). The card builder renders them from a private entry (out/wip/card/entry.tsx).
import React from 'react';
import { Composition, useCurrentFrame } from 'remotion';
import { CASES, FPS } from '../lib/timeline';
import { CHECKLIST, CaseCard, type CardData } from '../components/CaseCard';
import { CarouselSlide, SLIDES } from './Carousel';

const LEN = 540;
const CardTest: React.FC<{ id: string; variant: 'paper' | 'dark'; still?: boolean }> = ({ id, variant, still }) => {
  const f = useCurrentFrame();
  const data = id === 'checklist' ? CHECKLIST : (CASES.find((c) => c.id === id) as unknown as CardData);
  const n = id === 'checklist' ? CASES.length + 2 : CASES.findIndex((c) => c.id === id) + 2;
  return <CaseCard data={data} counter={{ n, total: CASES.length + 3 }} f={f} len={LEN} phase={0} layout="CARD" variant={variant} still={still} />;
};

export const CardTestCompositions: React.FC = () => (
  <>
    {[...CASES.map((c) => c.id), 'checklist'].map((id) => (
      <Composition key={id} id={`CardTest-${id}`} component={CardTest} defaultProps={{ id, variant: id === 'checklist' ? 'dark' as const : 'paper' as const }}
        durationInFrames={LEN + 30} fps={FPS} width={1080} height={1920} />
    ))}
    {SLIDES.map((s, i) => (
      <Composition key={s.id} id={s.id} component={CarouselSlide} defaultProps={{ index: i }} durationInFrames={s.durationInFrames} fps={FPS} width={1080} height={1350} />
    ))}
  </>
);
