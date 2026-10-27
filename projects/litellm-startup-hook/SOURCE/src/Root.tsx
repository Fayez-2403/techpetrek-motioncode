// Compositions: the LiteLLM reel, plus one test composition per reused media animation.
import React from 'react';
import { Composition } from 'remotion';
import { LiteReel } from './lite/LiteReel';
import { TOTAL } from './lite/kit';
import { loadFonts } from './styles/typography';

loadFonts();

export const Root: React.FC = () => (
  <Composition id="LiteReel" component={LiteReel} durationInFrames={TOTAL} fps={60} width={1080} height={1920} />
);
