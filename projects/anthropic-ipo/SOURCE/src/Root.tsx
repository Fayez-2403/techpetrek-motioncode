// Compositions: the Anthropic IPO reel.
import React from 'react';
import { Composition } from 'remotion';
import { IpoReel } from './ipo/Ipo';
import { TOTAL } from './lite/kit';
import { loadFonts } from './styles/typography';

loadFonts();

export const Root: React.FC = () => (
  <Composition id="IpoReel" component={IpoReel} durationInFrames={TOTAL} fps={60} width={1080} height={1920} />
);
