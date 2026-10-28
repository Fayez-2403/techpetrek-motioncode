// Compositions: the Google DeepMind Genie 4 reel (1080x1920, 60 fps).
import React from 'react';
import { Composition, Still } from 'remotion';
import { Cover } from './genie/Cover';
import { Reel } from './genie/Reel';
import { TOTAL } from './genie/kit';
import { loadFonts } from './styles/typography';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={TOTAL} fps={60} width={1080} height={1920} />
    <Still id="Cover" component={Cover} width={1080} height={1920} />
  </>
);
