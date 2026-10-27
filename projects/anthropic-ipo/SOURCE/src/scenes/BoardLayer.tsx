// The continuous 3D CASE BOARD (board builder): a dark incident-room evidence board with every case card pinned in a
// constellation (Railway central), receipts beside them, red strings, a swinging pendant lamp with a dusty beam.
// Full frame, film frame from useCurrentFrame(); all choreography in src/three/CaseBoardChoreo.tsx (boardAt).
// Returns null while a 2D card covers the frame (cardCovers) so the WebGL board costs nothing there.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { cardCovers, isIntro, segAt } from '../lib/timeline';
import { C } from '../styles/theme';
import { ThreeStage } from '../three/stage';
import { boardAt } from '../three/CaseBoardChoreo';
import { CaseBoardScene } from '../three/CaseBoardScene';
import { useBoardAssets } from '../three/CaseBoardTextures';

export const BoardLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const assets = useBoardAssets();
  if (cardCovers(frame) || isIntro(segAt(frame).seg.id)) return null;   // v2 intro: IntroLayer owns the frame
  const st = boardAt(frame);
  return (
    <AbsoluteFill style={{ background: C.felt }}>
      {assets && (
        <ThreeStage exposure={0.98}>
          <CaseBoardScene st={st} assets={assets} />
        </ThreeStage>
      )}
      {/* faint vignette, gone at the hand-off so the 3D card matches the 2D card */}
      <AbsoluteFill style={{ pointerEvents: 'none', opacity: 0.85 * st.vignette,
        background: 'radial-gradient(120% 95% at 50% 46%, rgba(0,0,0,0) 52%, rgba(4,3,6,0.55) 100%)' }} />
    </AbsoluteFill>
  );
};
