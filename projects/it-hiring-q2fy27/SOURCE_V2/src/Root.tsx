// Compositions: V2 of the IT hiring reel (Fluent light restyle).
import React from 'react';
import { Composition } from 'remotion';
import { FluentReel } from './fluent/FluentReel';
import { TOTAL } from './fluent/kit';
import { loadFonts } from './styles/typography';

loadFonts();

export const Root: React.FC = () => (
  <Composition id="JobsReel" component={FluentReel} durationInFrames={TOTAL} fps={60} width={1080} height={1920} />
);
