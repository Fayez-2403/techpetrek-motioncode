// Compositions: JOB INTERVIEW SE $6 BILLION HACK?! (1080 x 1920, 60 fps).
import React from 'react';
import { Composition } from 'remotion';
import { Heist, HEIST_SECONDS } from './compositions/Heist';
import { loadFonts } from './themes/typography';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="BinanceReel" component={Heist} durationInFrames={Math.round(HEIST_SECONDS * 60)} fps={60} width={1080} height={1920} />
  </>
);
