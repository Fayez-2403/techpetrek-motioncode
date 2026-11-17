// v3 scenes (user, 2026-10-31): a future car on a faster road, the billboard is a 9:16 LED screen, the camera dives
// into it and the reel plays inside; the outro pulls back out of the screen: BUILD YOUR OWN. Times here are the v3
// voice's (SCENE_TIMINGS.v3.json); T3 = absolute v3 seconds.
import React from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from 'remotion';
import { BuildCard, FlipContent, ScreenMap } from '../components/Screen';
import { Gold, Land } from '../components/Type';
import { C, FONT } from '../themes/tokens';
import hookC from '../config/v3_hook_corners.json';
import pullC from '../config/v3_pull_corners.json';
import { Cta } from './Cta';
import { SceneProps } from './index';
import { TIMINGS } from '../config/version';

// every v3 moment comes from the voice's word timings (SCENE_TIMINGS.v3.json), so a re-time moves picture with sound
interface Wd { w: string; t0: number }
const WORDS: Wd[] = (TIMINGS as unknown as { variants: { reel: { captions: { words: Wd[] }[] } } }).variants.reel.captions.flatMap((c) => c.words);
const word = (re: RegExp) => WORDS.find((w) => re.test(w.w))?.t0 ?? 0;
const TOTAL = (TIMINGS as unknown as { variants: { reel: { seconds: number } } }).variants.reel.seconds;
const FPS = 60;
export const CODE_T = word(/^code/i), CAMERA_T = word(/^camera/i);
const DIVE_END = 6.4;                                              // = the world's D1 the plates were captured with (?D1=6.4)
const MEDIA = DIVE_END - 0.6;                                      // the screen switches on once the camera has caught it
const BUILD = word(/^apna/i), COMMENT = word(/^comment/i), PULL = TOTAL - 3.0;
const quadAt = (c: { frames: number[][][] }, i: number) => c.frames[Math.max(0, Math.min(c.frames.length - 1, i))];

// what the screen shows: a still poster while it's far away, then a power-on flicker into the media once caught
const OnScreen: React.FC<{ T: number }> = ({ T }) => {
  // before MEDIA the poster is painted in the 3D world itself (occluded naturally); the overlay starts here
  const k = T - MEDIA, flick = k < 0.25 ? (Math.floor(k * 40) % 2 === 0 ? 1 : 0.3) * (1 - k / 0.25) : 0;
  return (
    <AbsoluteFill>
      <FlipContent T={T} code={CODE_T} camera={CAMERA_T} />
      {flick > 0 ? <AbsoluteFill style={{ background: `rgba(230,255,250,${0.75 * flick})` }} /> : null}
    </AbsoluteFill>
  );
};

// The plate's own Sequence starts at its scene start, so startFrom is the scene's first frame; the quad follows T3.
export const Hook3: React.FC<SceneProps> = ({ T3 = 0 }) => (
  <AbsoluteFill>
    <OffthreadVideo src={staticFile('clips/v3_hook.mp4')} muted style={{ width: 1080, height: 1920 }} />
    {T3 >= MEDIA ? <ScreenMap quad={quadAt(hookC, Math.round(T3 * FPS))}><OnScreen T={T3} /></ScreenMap> : null}
  </AbsoluteFill>
);

export const Flip3: React.FC<SceneProps> = ({ T3 = 0, t0new = 4.5 }) =>
  T3 < DIVE_END ? (
    <AbsoluteFill>
      <OffthreadVideo src={staticFile('clips/v3_hook.mp4')} startFrom={Math.round(t0new * FPS)} muted style={{ width: 1080, height: 1920 }} />
      <ScreenMap quad={quadAt(hookC, Math.round(T3 * FPS))}><OnScreen T={T3} /></ScreenMap>
    </AbsoluteFill>
  ) : <FlipContent T={T3} code={CODE_T} camera={CAMERA_T} />;

export const Cta3: React.FC<SceneProps> = (p) => {
  const T3 = p.T3 ?? 0, t0new = p.t0new ?? 45.3;
  return (
    <AbsoluteFill>
      {T3 < BUILD ? <Cta {...p} road={false} /> : null}
      {T3 >= BUILD && T3 < PULL ? <BuildCard T={T3} at={BUILD} comment={COMMENT} /> : null}
      <Sequence from={Math.round((PULL - t0new) * FPS)} layout="none">
        <AbsoluteFill>
          <OffthreadVideo src={staticFile('clips/v3_pull.mp4')} muted style={{ width: 1080, height: 1920 }} />
          <ScreenMap quad={quadAt(pullC, Math.round((T3 - PULL) * FPS))}><BuildCard T={T3} at={BUILD} comment={COMMENT} /></ScreenMap>
          <Land T={T3} at={COMMENT - 0.04} from={1.3} style={{ position: 'absolute', top: 250, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ display: 'inline-block', padding: '22px 46px 28px', borderRadius: 30, background: 'rgba(8,10,12,0.8)', border: `2px solid ${C.gold}88` }}>
              <div style={{ fontFamily: FONT.ui, fontWeight: 700, fontSize: 48, color: C.ink }}>Comment</div>
              <Gold size={150}>EDITOR</Gold>
              <div style={{ fontFamily: FONT.brand, fontStyle: 'italic', fontSize: 38, color: C.ink2, marginTop: 6 }}>build your own studio</div>
            </div>
          </Land>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

