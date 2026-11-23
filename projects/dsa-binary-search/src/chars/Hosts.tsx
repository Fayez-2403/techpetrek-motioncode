// The two hosts, fixed sides (series format): Bro bottom-left, Bhai bottom-right. Moods follow the story beats.
import React from 'react';
import { Character, Mood } from './Character';
import { ev, lineAt, mouth } from '../tl';
import { clamp } from '../animation/anim';

const between = (t: number, a: string, b: string) => t >= ev(a) && t < ev(b);

function broMood(t: number): Mood {
  if (t >= ev('cta')) return 'happy';
  if (t >= ev('snapHand')) return 'happy';
  if (t >= ev('gold23') && t < ev('gold23') + 2.2) return 'happy';
  if (t >= ev('sorted') - 0.1 && t < ev('bExact')) return 'shock';
  if (between(t, 'fail', 'scaleIn')) return 'stress';
  if (between(t, 'sim10', 'fail')) return 'think';
  if (between(t, 'frustrate', 'heroTitle')) return 'stress';
  if (between(t, 'crack', 'fix')) return 'shock';
  if (between(t, 'found', 'bsTitle')) return 'happy';
  if (between(t, 'crawl1', 'chop')) return 'think';
  if (t >= ev('headDrop') && t < ev('bhaiIn') + 0.5) return 'drop';
  if (between(t, 'notif', 'headDrop')) return 'stress';
  if (t >= ev('halveA') + 0.3 && t < ev('halveB') + 0.4) return 'shock';
  return 'idle';
}
function bhaiMood(t: number): Mood {
  if (between(t, 'crack', 'fix')) return 'shock';
  if (between(t, 'fail', 'scaleIn')) return 'smug';
  if (t >= ev('gold23') && t < ev('cardFlip')) return 'happy';
  if (t >= ev('snapHand')) return 'happy';
  if (between(t, 'found', 'bsTitle')) return 'happy';
  return 'smug';
}

export const Hosts: React.FC<{ t: number; show?: number }> = ({ t, show = 1 }) => {
  const l = lineAt(t);
  const speaking = l?.who;
  const mb = mouth('bro', t), mh = mouth('bhai', t);
  const lookBro = speaking === 'bhai' ? 0.9 : 0.15, lookBhai = speaking === 'bro' ? -0.9 : -0.15;
  const W = 470;
  const y = 1920 - W * (560 / 420) + 70 + (1 - show) * 700;
  return (
    <>
      <div style={{ position: 'absolute', left: -6, top: y }}>
        <Character who="bro" t={t} talk={mb} mood={broMood(t)} look={lookBro} lookY={speaking === 'bhai' ? 0 : -0.7} glow={clamp(mb * 1.6)} width={W} />
      </div>
      <div style={{ position: 'absolute', left: 1080 - W + 6, top: y }}>
        <Character who="bhai" t={t} talk={mh} mood={bhaiMood(t)} look={lookBhai} lookY={speaking === 'bro' ? 0 : -0.7} glow={clamp(mh * 1.6)} width={W} />
      </div>
    </>
  );
};
