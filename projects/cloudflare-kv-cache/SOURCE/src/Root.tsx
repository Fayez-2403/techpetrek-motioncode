// Compositions: the Cloudflare GLM-5.3 KV-cache reel (55 s, 1080x1920, 60 fps) and its cover still.
import React from 'react';
import { Composition, Still } from 'remotion';
import { Cover } from './kv/Cover';
import { CoverCharacters } from './kv/CoverCharacters';
import { Reel } from './kv/Reel';
import { TOTAL } from './kv/kit';
import { loadFonts } from './styles/typography';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={TOTAL} fps={60} width={1080} height={1920} />
    <Still id="Cover" component={Cover} width={1080} height={1920} />
    <Still id="CoverCharacters" component={CoverCharacters} width={1080} height={1920} />
  </>
);
