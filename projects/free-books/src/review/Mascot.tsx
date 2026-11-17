// "Repo buddy": our own funny mascot (an original round, cat-eared character, not GitHub's logo). Pure SVG, every part
// posed by props so a frame is a pure function of t: pupils look around, brows lift, it blinks, five mouths, ears
// wiggle, paws point / wave / thumbs-up, the body squashes on landings.
import React from 'react';

export type Mood = 'happy' | 'shock' | 'smug' | 'love' | 'wink' | 'think';
export interface Buddy { x: number; y: number; scale?: number; rot?: number; squash?: number; mood: Mood; look?: [number, number]; blink?: boolean; paw?: 'none' | 'point' | 'wave' | 'thumb'; pawAngle?: number; t: number; flip?: boolean }

const BODY = '#232836', RIM = '#3a4257', LIME = '#c8ff3d';

export const Mascot: React.FC<Buddy> = ({ x, y, scale = 1, rot = 0, squash = 1, mood, look = [0, 0], blink = false, paw = 'none', pawAngle = 0, t, flip = false }) => {
  const ear = Math.sin(t * 9) * 4, sx = 1 / Math.sqrt(squash);
  const [lx, ly] = look.map((v) => v * 7);
  const eyeH = blink || mood === 'wink' ? 3 : mood === 'shock' ? 30 : mood === 'smug' ? 16 : 24;
  const brow = mood === 'shock' ? -12 : mood === 'think' ? -6 : mood === 'smug' ? 4 : -3;
  const mouths: Record<Mood, React.ReactNode> = {
    happy: <path d="M 78 128 Q 100 150 122 128" stroke="#0b0d12" strokeWidth={7} fill="none" strokeLinecap="round" />,
    shock: <ellipse cx={100} cy={136} rx={11} ry={14} fill="#0b0d12" />,
    smug: <path d="M 84 132 Q 104 140 120 126" stroke="#0b0d12" strokeWidth={7} fill="none" strokeLinecap="round" />,
    love: <g><path d="M 76 126 Q 100 158 124 126 Z" fill="#0b0d12" /><path d="M 90 140 Q 100 150 110 140 Z" fill="#ff6b8b" /></g>,
    wink: <g><path d="M 76 126 Q 100 156 124 126 Z" fill="#0b0d12" /><rect x={92} y={128} width={16} height={6} rx={2} fill="#fff" /></g>,
    think: <path d="M 86 134 L 116 130" stroke="#0b0d12" strokeWidth={7} strokeLinecap="round" />,
  };
  const pawR = paw === 'point' ? <g transform={`rotate(${pawAngle} 158 120)`}><rect x={150} y={108} width={46} height={22} rx={11} fill={BODY} stroke={RIM} strokeWidth={3} /><rect x={186} y={112} width={22} height={13} rx={6} fill={BODY} stroke={RIM} strokeWidth={3} /></g>
    : paw === 'wave' ? <g transform={`rotate(${-40 + Math.sin(t * 16) * 28} 160 112)`}><rect x={150} y={64} width={24} height={54} rx={12} fill={BODY} stroke={RIM} strokeWidth={3} /></g>
      : paw === 'thumb' ? <g><rect x={150} y={100} width={34} height={30} rx={12} fill={BODY} stroke={RIM} strokeWidth={3} /><rect x={162} y={76} width={14} height={30} rx={7} fill={BODY} stroke={RIM} strokeWidth={3} /></g>
        : <rect x={156} y={118} width={22} height={30} rx={11} fill={BODY} stroke={RIM} strokeWidth={3} />;
  return (
    <svg width={200 * scale} height={200 * scale} viewBox="0 0 200 200" style={{ position: 'absolute', left: x - 100 * scale, top: y - 100 * scale, overflow: 'visible', transform: `rotate(${rot}deg) scaleX(${flip ? -1 : 1})`, transformOrigin: '50% 90%' }}>
      <g transform={`translate(100 180) scale(${sx} ${squash}) translate(-100 -180)`}>
        <ellipse cx={100} cy={186} rx={52} ry={8} fill="rgba(0,0,0,.35)" />
        {/* ears */}
        <path d={`M 44 70 L ${48 + ear} 18 L 86 50 Z`} fill={BODY} stroke={RIM} strokeWidth={4} strokeLinejoin="round" />
        <path d={`M 156 70 L ${152 - ear} 18 L 114 50 Z`} fill={BODY} stroke={RIM} strokeWidth={4} strokeLinejoin="round" />
        <path d={`M 54 60 L ${56 + ear} 32 L 76 52 Z`} fill="#ff8fab" opacity={0.7} />
        <path d={`M 146 60 L ${144 - ear} 32 L 124 52 Z`} fill="#ff8fab" opacity={0.7} />
        {/* body */}
        <circle cx={100} cy={108} r={72} fill={BODY} stroke={RIM} strokeWidth={5} />
        <ellipse cx={100} cy={120} rx={52} ry={46} fill="#f2e9dc" />
        {/* feet + left paw */}
        <rect x={64} y={168} width={28} height={18} rx={9} fill={BODY} stroke={RIM} strokeWidth={3} />
        <rect x={108} y={168} width={28} height={18} rx={9} fill={BODY} stroke={RIM} strokeWidth={3} />
        <rect x={22} y={118} width={22} height={30} rx={11} fill={BODY} stroke={RIM} strokeWidth={3} />
        {pawR}
        {/* eyes */}
        {[78, 122].map((cx, i) => (
          <g key={cx}>
            {mood === 'love' ? <path d={`M ${cx} ${104} l -10 -10 a 6 6 0 0 1 10 -6 a 6 6 0 0 1 10 6 z`} fill="#ff4d79" transform={`translate(0 6) scale(1)`} />
              : mood === 'happy' && !blink ? <path d={`M ${cx - 11} 100 Q ${cx} 86 ${cx + 11} 100`} stroke="#0b0d12" strokeWidth={6} fill="none" strokeLinecap="round" />
                : mood === 'wink' && i === 1 ? <path d={`M ${cx - 11} 98 Q ${cx} 88 ${cx + 11} 98`} stroke="#0b0d12" strokeWidth={6} fill="none" strokeLinecap="round" />
                  : <g><ellipse cx={cx} cy={98} rx={13} ry={eyeH / 2 + 2} fill="#fff" stroke="#0b0d12" strokeWidth={3} />
                    {eyeH > 6 ? <><circle cx={cx + lx} cy={98 + ly} r={6.5} fill="#0b0d12" /><circle cx={cx + lx + 2.5} cy={95 + ly} r={2} fill="#fff" /></> : null}</g>}
            <rect x={cx - 13} y={76 + brow} width={26} height={6} rx={3} fill="#0b0d12" transform={`rotate(${(i ? -1 : 1) * (mood === 'smug' ? 12 : mood === 'think' ? (i ? 14 : -6) : 0)} ${cx} ${79 + brow})`} />
          </g>
        ))}
        {/* cheeks + mouth */}
        <ellipse cx={62} cy={122} rx={9} ry={5} fill={LIME} opacity={0.55} />
        <ellipse cx={138} cy={122} rx={9} ry={5} fill={LIME} opacity={0.55} />
        {mouths[mood]}
      </g>
    </svg>
  );
};
