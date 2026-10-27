// Compositions: the GPT-6.1 Terra launch reel (OpenAI footage, TechpeTrek edit).
import React from 'react';
import { Composition } from 'remotion';
import { TerraReel } from './terra/Terra';
import { TOTAL } from './lite/kit';
import { loadFonts } from './styles/typography';

loadFonts();

export const Root: React.FC = () => (
  <Composition id="TerraReel" component={TerraReel} durationInFrames={TOTAL} fps={60} width={1080} height={1920} />
);
