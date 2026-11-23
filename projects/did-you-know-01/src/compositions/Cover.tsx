// Cover: the hook frame (the real 0.30000000000000004 + the 1901 clock) with both hosts.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C } from '../themes/tokens';
import { ev } from '../tl';
import { Hook } from '../dyk/HookFloat';
import { Hosts } from '../dyk/Hosts';

export const Cover: React.FC = () => {
  const t = ev('hFlip') + 0.8;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.night2} 0%, ${C.night} 62%, ${C.deep} 100%)` }}>
      <Hook t={t} />
      <Hosts t={t} />
    </AbsoluteFill>
  );
};
