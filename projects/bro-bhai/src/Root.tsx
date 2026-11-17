// Compositions: Bro & Bhai ep 01 (Claude Code Game Studios, 62 s), its 7-slide video carousel, the template Reel, and the cover still.
import React from 'react';
import { Composition, Still } from 'remotion';
import { Cover } from './compositions/Cover';
import { Reel, TOTAL } from './compositions/Reel';
import { Ep01, EP01_FRAMES } from './compositions/Ep01';
import { Slide1, S1_FRAMES } from './carousel/Slide1';
import { INFO, INFO_FRAMES } from './carousel/Info';
import { FPS, H, W } from './themes/tokens';
import { loadFonts } from './themes/typography';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="Ep01" component={Ep01} durationInFrames={EP01_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Reel" component={Reel} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
    {/* ep 01 video carousel (1080 x 1350, 4:5): CarS1 = the game-mashup hook, CarS2..CarS7 = the facts */}
    <Composition id="CarS1" component={Slide1} durationInFrames={S1_FRAMES} fps={FPS} width={1080} height={1350} />
    {INFO.map((C, i) => <Composition key={i} id={`CarS${i + 2}`} component={C} durationInFrames={INFO_FRAMES} fps={FPS} width={1080} height={1350} />)}
    <Still id="Cover" component={Cover} width={W} height={H} />
  </>
);
