// Compositions: the AFTERCODE product reel (edit of captures from the app).
import React from 'react';
import { Composition } from 'remotion';
import { AfterReel } from './ac/AfterReel';

export const Root: React.FC = () => (
  <Composition id="AfterReel" component={AfterReel} durationInFrames={4200} fps={60} width={1080} height={1920} />
);
