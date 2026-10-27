// Compositions: the reel, one test composition per media animation (M-<id>, window size), carousel slides (added by builders).
import React from 'react';
import { Composition, useCurrentFrame } from 'remotion';
import { Reel } from './compositions/Reel';
import { TOTAL, FPS } from './lib/timeline';
import { MEDIA } from './media';
import { CARD } from './components/cardLayout';
import { loadFonts } from './styles/typography';
import { CarouselSlide, SLIDES } from './compositions/Carousel';

loadFonts();
const MediaTest: React.FC<{ id: string }> = ({ id }) => { const f = useCurrentFrame(); const M = MEDIA[id]; return <M w={CARD.media.w} h={CARD.media.h} f={f} dur={240} />; };

export const Root: React.FC = () => (
  <>
    <Composition id="RailwayReel" component={Reel} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    {Object.keys(MEDIA).map((id) => (
      <Composition key={id} id={`M-${id}`} component={MediaTest} defaultProps={{ id }} durationInFrames={240} fps={FPS} width={CARD.media.w} height={CARD.media.h} />
    ))}
    {SLIDES.map((s, i) => (
      <Composition key={s.id} id={s.id} component={CarouselSlide} defaultProps={{ index: i }} durationInFrames={s.durationInFrames} fps={FPS} width={1080} height={1350} />
    ))}
  </>
);
