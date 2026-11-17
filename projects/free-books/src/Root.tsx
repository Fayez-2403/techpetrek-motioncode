// Compositions (1080 x 1350, 60 fps).
//  v2 (current): the screen-review carousel in the user's repo-review style: RevHook, Rev01..Rev12 (one book each), RevOutro.
//  v1 (kept): CarS1..CarS7, the 3D library version.
import React from 'react';
import { Composition } from 'remotion';
import { Slide, SLIDE_FRAMES } from './compositions/Slide';
import { SLIDES } from './config/books';
import { HookSlide, OutroSlide, ReviewSlide, REVS, REV_SECONDS, HOOK_SECONDS, OUTRO_SECONDS } from './review/Review';
import { loadFonts } from './themes/typography';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="RevHook" component={HookSlide} durationInFrames={HOOK_SECONDS * 60} fps={60} width={1080} height={1350} />
    {REVS.map((r) => <Composition key={r.id} id={`Rev${String(r.n).padStart(2, '0')}`} component={ReviewSlide} durationInFrames={REV_SECONDS * 60} fps={60} width={1080} height={1350} defaultProps={{ id: r.id }} />)}
    <Composition id="RevOutro" component={OutroSlide} durationInFrames={OUTRO_SECONDS * 60} fps={60} width={1080} height={1350} />
    {SLIDES.map((s) => <Composition key={s.id} id={`Car${s.id.toUpperCase()}`} component={Slide} durationInFrames={SLIDE_FRAMES(s.id)} fps={60} width={1080} height={1350} defaultProps={{ id: s.id }} />)}
  </>
);
