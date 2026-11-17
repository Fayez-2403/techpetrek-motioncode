// Compositions: BRIDGE.EXE — Can your design survive? (1080x1920, 60 fps) and its cover stills.
import React from 'react';
import { Composition, Still } from 'remotion';
import { Bridge, BRIDGE_SECONDS } from './compositions/Bridge';
import { Cover } from './compositions/Cover';
import { FPS, H, W } from './themes/tokens';
import { loadFonts } from './themes/typography';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="Bridge" component={Bridge} durationInFrames={Math.round(BRIDGE_SECONDS * FPS)} fps={FPS} width={W} height={H} />
    <Still id="Cover" component={Cover} width={W} height={H} defaultProps={{ variant: 'main' as const }} />
    <Still id="CoverB" component={Cover} width={W} height={H} defaultProps={{ variant: 'exe' as const }} />
    <Still id="CoverC" component={Cover} width={W} height={H} defaultProps={{ variant: 'survive' as const }} />
  </>
);
