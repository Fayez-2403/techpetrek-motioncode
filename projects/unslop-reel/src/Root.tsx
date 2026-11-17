// Composition: AI WEBSITE SAB EK JAISI?! — the unslop reel (1080x1920, 60 fps), timed by SCENE_TIMINGS.json.
import React from 'react';
import { Composition } from 'remotion';
import { Unslop, UNSLOP_SECONDS } from './compositions/Unslop';
import { loadFonts } from './themes/typography';

loadFonts();

export const Root: React.FC = () => (
  <Composition id="UnslopReel" component={Unslop} durationInFrames={Math.round(UNSLOP_SECONDS * 60)} fps={60} width={1080} height={1920} />
);
