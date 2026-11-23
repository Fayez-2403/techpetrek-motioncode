// v2 hosts: Bro bottom-left, Bhai bottom-right. Bhai puts on an interviewer tie for the quiz.
import React from 'react';
import { Character, Mood } from '../chars/Character';
import { ev, lineAt, mouth } from './tl';
import { clamp, easeOutCubic } from '../animation/anim';

const OKS = ['q1ok', 'q2ok', 'q3ok', 'q4ok', 'q5ok'];
const QS = ['q1', 'q2', 'q3', 'q4', 'q5'];
const near = (t: number, k: string, a: number, b: number) => t >= ev(k) + a && t < ev(k) + b;

function broMood(t: number): Mood {
  if (t >= ev('phod') - 0.3) return 'happy';
  if (OKS.some((k) => near(t, k, -0.1, 1.3))) return 'happy';
  if (t >= ev('q3huh') && t < ev('q3range')) return 'stress';
  if (QS.some((k, i) => t >= ev(k) && t < ev(OKS[i]) - 0.1)) return 'think';
  if (near(t, 'surprised', 0, 1.1)) return 'shock';
  if (near(t, 'found', 0, 1.6)) return 'happy';
  if (t >= ev('target') && t < ev('snap1')) return 'think';
  if (t >= ev('headDrop') && t < ev('tension') + 0.5) return 'drop';
  if (t < ev('headDrop')) return 'stress';
  return 'idle';
}
function bhaiMood(t: number): Mood {
  if (OKS.some((k) => near(t, k, 0.1, 1.2))) return 'happy';
  if (t >= ev('phod')) return 'happy';
  if (near(t, 'tension', 0, 1.2)) return 'happy';
  return 'smug';
}

export const HostsV2: React.FC<{ t: number }> = ({ t }) => {
  const l = lineAt(t), speaking = l?.who;
  const mb = mouth('bro', t), mh = mouth('bhai', t);
  const tie = easeOutCubic(clamp((t - ev('tieOn')) / 0.35)) * (1 - easeOutCubic(clamp((t - ev('tieOff')) / 0.35)));
  const W = 470, y = 1920 - W * (560 / 420) + 70;
  return (
    <>
      <div style={{ position: 'absolute', left: -6, top: y }}>
        <Character who="bro" t={t} talk={mb} mood={broMood(t)} look={speaking === 'bhai' ? 0.9 : 0.15} lookY={speaking === 'bhai' ? 0 : -0.7} glow={clamp(mb * 1.6)} width={W} />
      </div>
      <div style={{ position: 'absolute', left: 1080 - W + 6, top: y }}>
        <Character who="bhai" t={t} talk={mh} mood={bhaiMood(t)} look={speaking === 'bro' ? -0.9 : -0.15} lookY={speaking === 'bro' ? 0 : -0.7} glow={clamp(mh * 1.6)} width={W} tie={tie} />
      </div>
    </>
  );
};
