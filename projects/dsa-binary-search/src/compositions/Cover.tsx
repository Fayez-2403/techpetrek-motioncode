// Cover (1080x1920): the hook's payoff frame (one gold name left, "31"), with both hosts. Real frame of the reel.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C } from '../themes/tokens';
import { ev } from '../tl';
import { Hook } from '../scenes/Hook';
import { Hosts } from '../chars/Hosts';

export const Cover: React.FC = () => {
  const t = ev('halveB') + 0.7;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.night2} 0%, ${C.night} 62%, ${C.deep} 100%)` }}>
      <Hook t={t} />
      <Hosts t={t} />
    </AbsoluteFill>
  );
};
