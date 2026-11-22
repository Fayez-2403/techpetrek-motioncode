// Composition: ONE PAGE, 10 UPGRADES (1080x1920, 60 fps).
import React from 'react';
import { Composition } from 'remotion';
import { Reel, TOTAL } from './compositions/Reel';
import { loadFonts } from './themes/typography';

loadFonts();

export const Root: React.FC = () => <Composition id="Reel" component={Reel} durationInFrames={TOTAL} fps={60} width={1080} height={1920} />;
