// Compositions: ONE BOT, 16 REPOS (1080x1920, 60 fps) + look-dev.
import React from 'react';
import { Composition } from 'remotion';
import { BotLookDev } from './compositions/BotLookDev';
import { HeroLookDev } from './compositions/HeroLookDev';
import { Studio, STUDIO_SECONDS } from './compositions/Studio';
import { loadFonts } from './themes/typography';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="Studio" component={Studio} durationInFrames={Math.round(STUDIO_SECONDS * 60)} fps={60} width={1080} height={1920} />
    <Composition id="HeroLookDev" component={HeroLookDev} durationInFrames={4} fps={60} width={1080} height={1920} />
    <Composition id="BotLookDev" component={BotLookDev} durationInFrames={10} fps={60} width={1080} height={1080} />
  </>
);
