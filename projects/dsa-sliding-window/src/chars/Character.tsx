// Bro & Bhai, drawn in code (SVG busts). Every part is a pure function of time: breathing, blinks (hashed schedule),
// lip flap from the real voice envelope (src/config/mouth.json), and a mood that bends brows, eyes and mouth.
import React from 'react';
import { C } from '../themes/tokens';
import { clamp, lerp } from '../animation/anim';

export type Who = 'bro' | 'bhai';
export type Mood = 'idle' | 'smug' | 'shock' | 'stress' | 'happy' | 'think' | 'drop';

const SKIN = { bro: '#C9895B', bhai: '#A86E48' };
const SKIN_D = { bro: '#AE7046', bhai: '#8E5A39' };
const HAIR = '#17151C';

/** hashed blink: ~every 3-4.5 s, 0.13 s long */
const blinkAt = (t: number, seed: number) => {
  const period = 3.4 + (seed % 7) * 0.17, ph = ((t + seed * 0.61) % period + period) % period;
  return ph < 0.13 ? Math.sin((ph / 0.13) * Math.PI) : 0;
};

export const Character: React.FC<{ who: Who; t: number; talk: number; mood: Mood; look?: number; lookY?: number; glow?: number; width: number; tie?: number }> = ({
  who, t, talk, mood, look = 0, lookY = 0, glow = 0, width, tie = 0,
}) => {
  const isBro = who === 'bro';
  const breathe = Math.sin(t * 2.1 + (isBro ? 0 : 1.7));
  const drop = mood === 'drop' ? 1 : 0;
  const shock = mood === 'shock' ? 1 : 0;
  const happy = mood === 'happy' ? 1 : 0;
  const smug = mood === 'smug' ? 1 : 0;
  const stress = mood === 'stress' ? 1 : 0;
  const think = mood === 'think' ? 1 : 0;
  const bob = -talk * 7 + breathe * 2.2;
  const tilt = (isBro ? -1 : 1) * (2 + talk * 2.5 * Math.sin(t * 7.3)) + smug * (isBro ? 0 : 4) - think * 5 + drop * 14;
  const headY = bob + drop * 62 + shock * -8;
  const blink = Math.max(blinkAt(t, isBro ? 3 : 11), drop, happy * 0.55);
  const eyeR = 1 + shock * 0.35;
  const browY = -shock * 16 + stress * 4 + happy * -4;
  const browIn = stress * 9 - shock * 2;
  const px = clamp(look, -1, 1) * 6, py = clamp(lookY, -1, 1) * 5 + drop * 6;
  const open = clamp(talk * 1.15);
  const skin = SKIN[who], skinD = SKIN_D[who];
  // mouth
  const mx = 210, my = 302;
  const mouthEl = open > 0.07 || shock
    ? (
      <g>
        <ellipse cx={mx} cy={my + 2} rx={lerp(15, 25, open) + shock * 4} ry={lerp(5, 21, Math.max(open, shock * 0.8))} fill="#3B1220" />
        <ellipse cx={mx} cy={my + 2 + lerp(3, 12, open)} rx={lerp(8, 15, open)} ry={lerp(2, 7, open)} fill="#E0566E" />
        <rect x={mx - lerp(11, 18, open)} y={my + 2 - lerp(5, 20, open)} width={lerp(22, 36, open)} height={lerp(2, 6, open)} rx={2} fill="#FFF6EE" opacity={open > 0.3 ? 1 : 0} />
      </g>
    )
    : (
      <path d={`M ${mx - 20} ${my} Q ${mx} ${my + 9 + happy * 10 - stress * 14 + smug * 4} ${mx + 20 + smug * 8} ${my - smug * 6}`} stroke="#3B1220" strokeWidth={6} fill="none" strokeLinecap="round" />
    );
  const eye = (cx: number, side: number) => (
    <g>
      <ellipse cx={cx} cy={238} rx={15 * eyeR} ry={17 * eyeR * (1 - blink * 0.94)} fill="#FFFDF8" />
      {blink < 0.85 && <circle cx={cx + px} cy={240 + py} r={8} fill="#1A1210" />}
      {blink < 0.85 && <circle cx={cx + px + 3} cy={236 + py} r={2.6} fill="#fff" />}
      {/* brow */}
      <rect x={cx - 22} y={isBro ? 196 + browY : 192 + browY} width={44} height={isBro ? 9 : 12} rx={5} fill={HAIR}
        transform={`rotate(${side * (browIn + (smug && side > 0 && !isBro ? -12 : 0) + (smug && side > 0 && isBro ? -8 : 0))} ${cx} ${200 + browY})`} />
    </g>
  );
  return (
    <svg viewBox="0 0 420 560" width={width} height={width * (560 / 420)} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <radialGradient id={`glow-${who}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={C.lamp} stopOpacity={0.55} />
          <stop offset="100%" stopColor={C.lamp} stopOpacity={0} />
        </radialGradient>
      </defs>
      {glow > 0 && <ellipse cx={210} cy={260} rx={230} ry={260} fill={`url(#glow-${who})`} opacity={glow} />}
      {/* torso */}
      <g transform={`translate(0 ${breathe * 1.4})`}>
        {isBro ? (
          <g>
            <path d="M 12 560 C 18 452 84 402 158 392 L 262 392 C 336 402 402 452 408 560 Z" fill={C.bro} />
            <path d="M 150 392 C 160 440 260 440 270 392 C 300 400 300 370 210 372 C 120 370 120 400 150 392 Z" fill="#0F8077" />
            <line x1={188} y1={420} x2={182} y2={482} stroke="#F3EFE6" strokeWidth={5} strokeLinecap="round" />
            <line x1={232} y1={420} x2={238} y2={482} stroke="#F3EFE6" strokeWidth={5} strokeLinecap="round" />
            <path d="M 120 520 Q 210 540 300 520 L 296 560 L 124 560 Z" fill="#0F8077" />
          </g>
        ) : (
          <g>
            <path d="M 12 560 C 18 452 84 402 158 392 L 262 392 C 336 402 402 452 408 560 Z" fill={C.bhai} />
            <path d="M 168 388 L 210 446 L 252 388 L 236 384 L 210 420 L 184 384 Z" fill="#6E1F38" />
            <rect x={268} y={462} width={56} height={44} rx={6} fill="#7A2340" />
            <circle cx={210} cy={474} r={5} fill="#F1D3DB" /><circle cx={210} cy={510} r={5} fill="#F1D3DB" />
          </g>
        )}
        <rect x={178} y={318} width={64} height={84} rx={20} fill={skinD} />
        {tie > 0 && (
          <g transform={`translate(0 ${(1 - tie) * -260})`} opacity={clamp(tie * 2)}>
            <path d="M 184 392 L 236 392 L 226 412 L 194 412 Z" fill="#F4F1EA" />
            <path d="M 196 404 L 224 404 L 216 426 L 204 426 Z" fill="#1F2A6B" />
            <path d="M 204 424 L 216 424 L 232 520 L 210 552 L 188 520 Z" fill="#1F2A6B" />
            <path d="M 199 452 L 222 440 M 196 482 L 226 466 M 193 512 L 229 494" stroke={C.scale} strokeWidth={5} />
          </g>
        )}
      </g>
      {/* head */}
      <g transform={`translate(0 ${headY}) rotate(${tilt} 210 330)`}>
        {isBro && <path d="M 100 230 C 92 120 150 62 214 62 C 286 62 334 118 322 232 L 336 340 C 316 356 296 340 298 300 L 124 300 C 126 340 104 356 86 340 Z" fill={HAIR} />}
        <ellipse cx={120} cy={246} rx={16} ry={23} fill={skinD} />
        <ellipse cx={300} cy={246} rx={16} ry={23} fill={skinD} />
        <ellipse cx={210} cy={240} rx={92} ry={110} fill={skin} />
        {!isBro && (
          <g>
            {/* beard + moustache */}
            <path d="M 120 238 C 120 330 160 360 210 362 C 260 360 300 330 300 238 C 292 300 270 322 246 316 C 232 296 188 296 174 316 C 150 322 128 300 120 238 Z" fill={HAIR} />
            <path d="M 176 290 Q 210 270 244 290 Q 226 296 210 290 Q 194 296 176 290 Z" fill={HAIR} />
          </g>
        )}
        {/* cheeks */}
        <ellipse cx={150} cy={280} rx={16} ry={9} fill="#E0786A" opacity={0.22 + happy * 0.3} />
        <ellipse cx={270} cy={280} rx={16} ry={9} fill="#E0786A" opacity={0.22 + happy * 0.3} />
        {eye(172, -1)}
        {eye(248, 1)}
        <path d="M 208 250 Q 198 276 206 282 Q 214 284 220 280" stroke={skinD} strokeWidth={5} fill="none" strokeLinecap="round" />
        {mouthEl}
        {isBro ? (
          <g>
            {/* messy fringe + round glasses */}
            <path d="M 116 214 Q 118 120 210 112 Q 300 116 306 214 Q 290 168 262 182 Q 252 140 222 172 Q 206 132 182 174 Q 158 146 136 190 Q 128 200 116 214 Z" fill={HAIR} />
            <circle cx={172} cy={238} r={31} fill="none" stroke="#1E1A22" strokeWidth={6} />
            <circle cx={248} cy={238} r={31} fill="none" stroke="#1E1A22" strokeWidth={6} />
            <path d="M 203 236 Q 210 230 217 236" stroke="#1E1A22" strokeWidth={6} fill="none" />
            <circle cx={160} cy={226} r={7} fill="#fff" opacity={0.35} />
            <circle cx={236} cy={226} r={7} fill="#fff" opacity={0.35} />
          </g>
        ) : (
          <g>
            {/* short hair with a curly fringe */}
            <path d="M 118 200 Q 112 118 210 104 Q 308 118 302 200 Q 296 160 270 150 L 150 150 Q 124 160 118 200 Z" fill={HAIR} />
            {[138, 162, 186, 210, 234, 258, 282].map((x, i) => <circle key={i} cx={x} cy={152 + (i % 2) * 8} r={17} fill={HAIR} />)}
          </g>
        )}
      </g>
    </svg>
  );
};
