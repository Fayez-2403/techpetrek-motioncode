// Bisleri x obby breaking news: the obby run (3D, always moving) under a gaming-news broadcast layer + captions + logo.
import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from 'remotion';
import { TOTAL as T_FRAMES } from '../tl';
import { Obby } from './Obby';
import { Overlay } from './Overlay';
import { Captions } from './Captions';
import AUDIO from '../config/audioManifest.json';

export const TOTAL = T_FRAMES;
export const Reel: React.FC = () => {
  const t = useCurrentFrame() / 60;
  const src = (AUDIO as { reel?: string | null }).reel ?? 'audio/vo.wav';
  return (
    <AbsoluteFill style={{ background: '#5EC8F5', overflow: 'hidden' }}>
      <Obby />
      {/* speed lines while running */}
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        {Array.from({ length: 10 }, (_, k) => {
          const y = (k * 197) % 1920, x = ((t * 2600 + k * 431) % 1500) - 200;
          return <div key={k} style={{ position: 'absolute', left: k % 2 ? x : 1080 - x, top: y, width: 140, height: 4, background: 'rgba(255,255,255,0.45)', transform: `rotate(${k % 2 ? 8 : -8}deg)` }} />;
        })}
      </AbsoluteFill>
      <Overlay t={t} />
      <Captions t={t} />
      <Img src={staticFile('brand/techpe-trek.jpg')} style={{ position: 'absolute', right: 40, bottom: 330, width: 96, height: 96, borderRadius: 20, border: '4px solid #0B0B12', zIndex: 9 }} />
      <Audio src={staticFile(src)} />
    </AbsoluteFill>
  );
};
