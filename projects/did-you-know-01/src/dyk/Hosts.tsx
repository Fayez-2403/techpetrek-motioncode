// Bro bottom-left, Bhai bottom-right; moods follow the reveals.
import React from 'react';
import { Character, Mood } from '../chars/Character';
import { ev, lineAt, mouth } from '../tl';
import { clamp } from '../animation/anim';

const win = (t: number, k: string, a: number, b: number) => t >= ev(k) + a && t < ev(k) + b;
function broMood(t: number): Mood {
  if (t >= ev('cta')) return 'happy';
  if (win(t, 'y21', 0, 2)) return 'happy';
  if (win(t, 'yWrap', 0, 1.6)) return 'shock';
  if (win(t, 'tOld', 0, 1.4)) return 'shock';
  if (win(t, 'tUp', 0, 1.5)) return 'happy';
  if (win(t, 'hDiff', 0, 1.2)) return 'shock';
  if (win(t, 'hMatch', 0, 1.1)) return 'happy';
  if (win(t, 'hQ', 0, 1.8)) return 'think';
  if (win(t, 'fFour', -0.3, 1.4)) return 'shock';
  if (win(t, 'fBin', 0, 3)) return 'think';
  if (win(t, 'hResult', 0, 1.2) || win(t, 'hFlip', 0, 1.4)) return 'shock';
  return 'idle';
}
function bhaiMood(t: number): Mood {
  if (win(t, 'hMatch', 0, 1.1) || win(t, 'tNew', 0, 1.4) || win(t, 'y21', 0, 2) || t >= ev('cta')) return 'happy';
  return 'smug';
}

export const Hosts: React.FC<{ t: number }> = ({ t }) => {
  const l = lineAt(t), sp = l?.who;
  const mb = mouth('bro', t), mh = mouth('bhai', t);
  const W = 470, y = 1920 - W * (560 / 420) + 70;
  return (
    <>
      <div style={{ position: 'absolute', left: -6, top: y }}>
        <Character who="bro" t={t} talk={mb} mood={broMood(t)} look={sp === 'bhai' ? 0.9 : 0.15} lookY={sp === 'bhai' ? 0 : -0.7} glow={clamp(mb * 1.6)} width={W} />
      </div>
      <div style={{ position: 'absolute', left: 1080 - W + 6, top: y }}>
        <Character who="bhai" t={t} talk={mh} mood={bhaiMood(t)} look={sp === 'bro' ? -0.9 : -0.15} lookY={sp === 'bro' ? 0 : -0.7} glow={clamp(mh * 1.6)} width={W} />
      </div>
    </>
  );
};
