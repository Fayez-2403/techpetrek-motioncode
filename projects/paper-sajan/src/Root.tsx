// SAJAN: the developer's aura. AuraReel = the 25 s reel; AuraTest = the 6.6 s look test (1080x1920, 60 fps).
import React from 'react';
import { Composition } from 'remotion';
import { AuraReel, REEL_SECONDS } from './compositions/AuraReel';
import { AuraTest } from './compositions/AuraTest';
import { loadFonts } from './themes/typography';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="AuraReel" component={AuraReel} durationInFrames={Math.round(REEL_SECONDS * 60)} fps={60} width={1080} height={1920} />
    <Composition id="AuraTest" component={AuraTest} durationInFrames={396} fps={60} width={1080} height={1920} />
  </>
);
