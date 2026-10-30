// The film: the scene under the playhead (from SCENE_TIMINGS), a hit flash on the brake -> roses cut, film grain, and
// the mix from src/config/audioManifest.json. Music-only brand film: no captions. Pure function of the frame.
import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import audio from '../config/audioManifest.json';
import { TIMINGS } from '../config/version';
import { Kind, Transition } from '../components/Transition';
import { Grain } from '../components/world';
import { sceneFor } from '../scenes';
import { C } from '../themes/tokens';
import { noise1 } from '../animation/rng';

interface Scene { id: string; from: number; durationInFrames: number }
const SC: Scene[] = (TIMINGS as unknown as { variants: { reel: { scenes: Scene[] } } }).variants.reel.scenes;
export const TOTAL: number = (TIMINGS as unknown as { variants: { reel: { durationInFrames: number } } }).variants.reel.durationInFrames;

// transition into each scene id: the scenes carry their own camera moves across the cuts (whip, tilt, slide);
// only the hit gets a flash
const KIND: Record<string, Kind> = { notes: 'flash' };

export const Reel: React.FC = () => {
  const frame = useCurrentFrame();
  const i = Math.max(0, SC.findIndex((s) => frame >= s.from && frame < s.from + s.durationInFrames));
  const s = SC[i], S = sceneFor(s.id);
  const next = SC[i + 1], prevCut = s.from, nextCut = next?.from ?? 1e9;
  const k = frame - prevCut < nextCut - frame ? frame - prevCut : frame - nextCut;
  const kind = (frame - prevCut < nextCut - frame ? KIND[s.id] : next && KIND[next.id]) ?? 'cut';
  const mix = (audio as { reel: string | null }).reel;
  return (
    <AbsoluteFill style={{ background: C.base }}>
      {/* a hand-held breath on every shot, so no frame is ever frozen */}
      <AbsoluteFill style={{ transform: `translate(${4 * noise1(frame / 60, 11)}px, ${3 * noise1(frame / 66, 12)}px) rotate(${0.15 * noise1(frame / 80, 13)}deg) scale(1.01)` }}>
        <S f={frame - s.from} n={s.durationInFrames} id={s.id} />
      </AbsoluteFill>
      <Transition kind={kind} k={k} />
      <Grain frame={frame} />
      {mix ? <Audio src={staticFile(mix)} /> : null}
    </AbsoluteFill>
  );
};
