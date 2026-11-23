// Cover: the khidki on 'Best 23' (gold) with both hosts. A real frame of the reel.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C } from '../themes/tokens';
import { ev } from '../tl';
import { Simple } from '../sw/Simple';
import { HostsV2 } from '../sw/Hosts';

export const Cover: React.FC = () => {
  const t = ev('best') + 0.6;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.night2} 0%, ${C.night} 62%, ${C.deep} 100%)` }}>
      <Simple t={t} />
      <HostsV2 t={t} />
    </AbsoluteFill>
  );
};
