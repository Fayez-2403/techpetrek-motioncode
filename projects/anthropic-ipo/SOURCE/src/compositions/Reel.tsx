import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import audio from '../data/audioManifest.json';
import { loadFonts } from '../styles/typography';
import { C } from '../styles/theme';
import { BoardLayer } from '../scenes/BoardLayer';
import { CardLayer } from '../scenes/CardLayer';
import { IntroLayer } from '../scenes/IntroLayer';
import { Overlays } from '../scenes/Overlays';
import { Grain } from '../components/Backdrop';

loadFonts();

/** the reel: [v2 kinetic intro] + continuous 3D board + 2D case cards + overlays + the mix */
export const Reel: React.FC = () => (
  <AbsoluteFill style={{ background: C.graphite }}>
    <BoardLayer />
    <IntroLayer />
    <CardLayer />
    <Overlays />
    <Grain opacity={0.05} />
    <Audio src={staticFile(audio.reel)} />
  </AbsoluteFill>
);
