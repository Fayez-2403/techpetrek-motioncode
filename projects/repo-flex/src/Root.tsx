// Compositions: Flexing My Repos (1080x1920, 60 fps) and its cover still.
import React from 'react';
import { Composition, Still } from 'remotion';
import { Cover } from './compositions/Cover';
import { Reel, TOTAL } from './compositions/Reel';
import { Flex, FLEX_FRAMES } from './compositions/Flex';
import { FPS, H, W } from './themes/tokens';
import { loadFonts } from './themes/typography';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="Flex" component={Flex} durationInFrames={FLEX_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Reel" component={Reel} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
    <Still id="Cover" component={Cover} width={W} height={H} />
  </>
);
