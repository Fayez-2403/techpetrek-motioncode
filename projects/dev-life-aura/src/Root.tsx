// Composition: SOFTWARE ENGINEER, THE LIFE BEHIND THE SCREEN (1080x1920, 60 fps, 6000 frames).
import React from 'react';
import { Composition } from 'remotion';
import { DeveloperLife, SECONDS } from './compositions/DeveloperLife';
import { loadFonts } from './themes/typography';

loadFonts();

export const Root: React.FC = () => (
  <Composition id="DeveloperLife" component={DeveloperLife} durationInFrames={Math.round(SECONDS * 60)} fps={60} width={1080} height={1920} />
);
