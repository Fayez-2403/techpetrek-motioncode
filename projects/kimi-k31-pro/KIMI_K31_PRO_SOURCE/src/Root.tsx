// Compositions: the two films, plus one isolated composition per scene and format for stills (S-<scene>-<variant>).
import React from 'react';
import { Composition } from 'remotion';
import { KimiMasterFilm } from './compositions/KimiMasterFilm';
import { KimiInstagramCut } from './compositions/KimiInstagramCut';
import { Film, timingOf } from './compositions/Film';
import type { SceneId, Variant } from './scenes/types';
import { KimiShowcaseV3, KimiShowcaseV3Landscape, V3Shot } from './v3/V3Film';
import { SHOTS, TOTAL_FRAMES } from './v3/lib';

const FPS = 30;
const SIZE = { master: [1920, 1080], reel: [1080, 1920] } as const;

export const Root: React.FC = () => (
  <>
    <Composition id="KimiMasterFilm" component={KimiMasterFilm} durationInFrames={timingOf('master').durationInFrames} fps={FPS} width={1920} height={1080} />
    <Composition id="KimiInstagramCut" component={KimiInstagramCut} durationInFrames={timingOf('reel').durationInFrames} fps={FPS} width={1080} height={1920} />
    {(['master', 'reel'] as Variant[]).flatMap((v) =>
      timingOf(v).scenes.map((s) => (
        <Composition key={`${s.id}-${v}`} id={`S-${s.id}-${v}`} component={Film} defaultProps={{ variant: v, only: s.id as SceneId }}
          durationInFrames={s.durationInFrames} fps={FPS} width={SIZE[v][0]} height={SIZE[v][1]} />
      )),
    )}
    <Composition id="KimiShowcaseV3" component={KimiShowcaseV3} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1080} height={1920} />
    <Composition id="KimiShowcaseV3Landscape" component={KimiShowcaseV3Landscape} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
    {SHOTS.map((s) => (
      <Composition key={`v3-${s.id}`} id={`V3-${s.id}`} component={V3Shot} defaultProps={{ id: s.id }} durationInFrames={s.durationInFrames} fps={FPS} width={1920} height={1080} />
    ))}
  </>
);
