// HAPPY DIWALI FROM THE BOTS (1080x1920, 60 fps).
import React from 'react';
import { Composition } from 'remotion';
import { BotsDiwali, SECONDS } from './compositions/BotsDiwali';
import { loadFonts } from './themes/typography';

loadFonts();

export const Root: React.FC = () => (
  <Composition id="BotsDiwali" component={BotsDiwali} durationInFrames={Math.round(SECONDS * 60)} fps={60} width={1080} height={1920} />
);
