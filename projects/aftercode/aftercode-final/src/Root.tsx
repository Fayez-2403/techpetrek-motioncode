// Compositions: AFTERCODE Final: Build Your Cast (1080x1920, 60 fps) and its cover still.
import React from 'react';
import { Composition, Still } from 'remotion';
import { Cover } from './compositions/Cover';
import { Final, TOTAL } from './compositions/Final';
import { FPS, H, W } from './themes/tokens';
import { loadFonts } from './themes/typography';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="Final" component={Final} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="FinalAd" component={Final} durationInFrames={TOTAL} fps={FPS} width={W} height={H} defaultProps={{ v: 'v2' as const }} />
    <Still id="Cover" component={Cover} width={W} height={H} />
  </>
);
