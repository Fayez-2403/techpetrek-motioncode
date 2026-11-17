// Composition: DEV JOURNEY, Chandni raat -> SEV-1 (1080x1920, 60 fps), timed by src/config/timeline.json.
import React from 'react';
import { Composition } from 'remotion';
import { DevJourney, SECONDS } from './compositions/DevJourney';
import { loadFonts } from './themes/typography';

loadFonts();

export const Root: React.FC = () => (
  <Composition id="DevJourney" component={DevJourney} durationInFrames={Math.round(SECONDS * 60)} fps={60} width={1080} height={1920} />
);
