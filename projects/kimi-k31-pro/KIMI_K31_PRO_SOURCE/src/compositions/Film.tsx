// One film = the scenes laid out by SCENE_TIMINGS.json, the narration captions and the soundtrack.
import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import timings from '../../SCENE_TIMINGS.json';
import audio from '../data/audioManifest.json';
import { SCENES } from '../data/sceneManifest';
import { LABELS } from '../data/verifiedClaims';
import { CaptionRenderer, type Card } from '../components/CaptionRenderer';
import { Grain } from '../components/Backdrop';
import { window_ } from '../lib/anim';
import { useLayout } from '../lib/layout';
import { loadFonts } from '../styles/typography';
import { C } from '../styles/theme';
import { F } from '../styles/typography';
import type { SceneId, Variant } from '../scenes/types';

loadFonts();

export const timingOf = (v: Variant) => timings.variants[v];

/** "Independent explainer" note over the opening seconds (the end card repeats it). */
const IndependentNote: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLayout();
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: L.tall ? 556 : 22, textAlign: 'center', fontFamily: F.mono,
      fontSize: L.t.attribution * 0.92, color: C.silver, opacity: 0.85 * window_(f, 12, 4.2 * 30, 12), zIndex: 70, letterSpacing: '0.02em' }}>
      {LABELS.independent}
    </div>
  );
};

export const Film: React.FC<{ variant: Variant; only?: SceneId }> = ({ variant, only }) => {
  const tm = timingOf(variant);
  const scenes = tm.scenes.filter((s) => !only || s.id === only);
  return (
    <AbsoluteFill style={{ background: C.void }}>
      {scenes.map((s) => {
        const Comp = SCENES[s.id as SceneId].component;
        return (
          <Sequence key={s.id} from={only ? 0 : s.from} durationInFrames={s.durationInFrames} name={`${SCENES[s.id as SceneId].n} ${s.id}`}>
            <Comp dur={s.durationInFrames} variant={variant} />
          </Sequence>
        );
      })}
      {!only && <CaptionRenderer cards={tm.captions as Card[]} />}
      {!only && <Sequence from={0} durationInFrames={150}><IndependentNote /></Sequence>}
      <Grain opacity={0.05} />
      {!only && <Audio src={staticFile(audio[variant])} />}
    </AbsoluteFill>
  );
};
