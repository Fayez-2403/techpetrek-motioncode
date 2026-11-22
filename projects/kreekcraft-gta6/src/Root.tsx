// Compositions: one postable 9:16 clip per moment (src/config/clips.generated.json from docs/clips.json + the cut words).
import React from 'react';
import { Composition } from 'remotion';
import { Clip, type ClipProps } from './compositions/Clip';
import CLIPS from './config/clips.generated.json';
import { loadFonts } from './themes/typography';

loadFonts();

export const Root: React.FC = () => (
  <>
    {(CLIPS as ClipProps[]).map((c) => (
      <Composition key={c.id} id={c.id.replace(/_/g, '-')} component={Clip} durationInFrames={Math.floor(c.dur * 30)} fps={30} width={1080} height={1920} defaultProps={c} />
    ))}
  </>
);
