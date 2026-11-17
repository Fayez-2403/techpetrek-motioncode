// Compositions: SERVER SIEGE — Can your backend survive? (1080x1920, 60 fps).
import React from 'react';
import { Composition } from 'remotion';
import { Siege, SIEGE_SECONDS } from './compositions/Siege';
import { FPS, H, W } from './themes/tokens';
import { loadFonts } from './themes/typography';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="Siege" component={Siege} durationInFrames={SIEGE_SECONDS * FPS} fps={FPS} width={W} height={H} />
  </>
);
