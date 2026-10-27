// 10 · HIGHSPEED (C, "Concept visualization — not a live timing").
//   entry   the two cyan rails 09 ends on become the tracks of two panels: K3.1 PRO and K3.1 PRO HIGHSPEED
//   run     one shared clock (a single playhead over both panels, same start mark) writes the SAME task sequence on
//           both tracks; the Highspeed sequence is the same blocks compressed by a representative ratio (the midpoint
//           of the vendor's range, from N.speed), so it completes sooner. No latency, tokens/s or quality claim.
//   merge   the two tracks fuse into one line under "2–3× FASTER" (FASTER accelerates in) + the vendor qualifier
//   exit    the line folds into a square: the front face of 11's cube
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CLAIMS, LABELS, N, NAMES } from '../data/verifiedClaims';
import { KineticTitle } from '../components/KineticTitle';
import { ProvenanceLabel } from '../components/ProvenanceLabel';
import { clamp, easeInOutCubic, easeOutCubic, invLerp, lerp, reveal } from '../lib/anim';
import { useLayout } from '../lib/layout';
import { C } from '../styles/theme';
import { F } from '../styles/typography';
import { BG, EDGE, FOLD, RAILS, voFrame } from './_evidence';
import type { SceneProps } from './types';

/** the abstract workflow both models run (the film's spine); relative block lengths are illustrative */
const TASKS: [string, number][] = [['PROMPT', 1.1], ['REASON', 1.7], ['BUILD', 2.2], ['TEST', 1.2], ['IMPROVE', 1.5], ['DELIVER', 1.1]];
const TOTAL = TASKS.reduce((a, [, w]) => a + w, 0);
/** representative speed ratio: midpoint of the vendor-reported range */
export const SPEED_RATIO = (N.speed.lo + N.speed.hi) / 2;
const SPEED_TEXT = `${N.speed.lo}–${N.speed.hi}×`;

/** points of a line of total length 4·side folding into a square (bottom edge centred at bx, by) */
function foldPath(bx: number, by: number, side: number, k: number, a1: number, a2: number) {
  const s = side * k, half = s / 2;
  const bl = [bx - half, by], br = [bx + half, by];
  const pl = [bl[0] - s * Math.cos(a1), bl[1] - s * Math.sin(a1)];
  const el = [pl[0] - half * Math.cos(a1 + a2), pl[1] - half * Math.sin(a1 + a2)];
  const pr = [br[0] + s * Math.cos(a1), br[1] - s * Math.sin(a1)];
  const er = [pr[0] + half * Math.cos(a1 + a2), pr[1] - half * Math.sin(a1 + a2)];
  return [el, pl, bl, br, pr, er].map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
}

export const Highspeed: React.FC<SceneProps> = ({ dur, variant }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const reel = variant === 'reel';
  const R = RAILS[variant];
  const FD = FOLD[variant];

  // ---- beats (fractions of the scene; text on the narration's words)
  const runAt = Math.round((reel ? 0.05 : 0.09) * dur);
  const runEnd = Math.round((reel ? 0.3 : 0.5) * dur);
  const runLen = runEnd - runAt;
  const hsEnd = runAt + runLen / SPEED_RATIO;
  const mergeAt = Math.round((reel ? 0.31 : 0.53) * dur), mergeLen = reel ? 10 : 18;
  const numAt = Math.max(mergeAt + mergeLen - 4, voFrame(variant, 'highspeed', /^2$/, (reel ? 0.35 : 0.56) * dur));
  const fasterAt = Math.max(numAt + 6, voFrame(variant, 'highspeed', /^faster/i, (reel ? 0.5 : 0.65) * dur) - 10);
  const qualAt = fasterAt + 14;
  const foldAt = Math.round(0.85 * dur), foldEnd = dur - 3;
  const textOutAt = foldAt - 12;

  // ---- geometry
  const trackW = R.x1 - R.x0;
  const hsW = trackW / SPEED_RATIO;
  const blockH = reel ? 76 : 56;
  const panelPad = reel ? { top: 140, bot: 70 } : { top: 72, bot: 72 };
  const labelSize = reel ? 20 : 18;
  const panelX0 = reel ? 40 : 176, panelX1 = reel ? L.w - 40 : 1744;
  const mergedY = (R.y[0] + R.y[1]) / 2 + (reel ? 120 : 40);

  // shared clock
  const playX = R.x0 + trackW * clamp((f - runAt) / runLen);
  const running = f >= runAt;

  // ---- entry: rails cool from bright cyan into quiet tracks
  const cool = easeInOutCubic(invLerp(2, 16, f));
  const panelsOn = easeOutCubic(invLerp(4, 20, f));

  // ---- merge
  const mg = easeInOutCubic(invLerp(mergeAt, mergeAt + mergeLen, f));
  const blocksOut = 1 - easeInOutCubic(invLerp(mergeAt - 6, mergeAt + mergeLen * 0.4, f));
  const lineW = reel ? R.x1 - R.x0 : 1180;
  const lineX0 = lerp(R.x0, L.w / 2 - lineW / 2, mg);
  const railY = (i: 0 | 1) => lerp(R.y[i], mergedY, mg);

  // ---- fold
  const u = invLerp(foldAt, foldEnd, f);
  const folding = u > 0;
  const a1 = (Math.PI / 2) * easeInOutCubic(invLerp(0, 0.66, u));
  const a2 = (Math.PI / 2) * easeInOutCubic(invLerp(0.34, 1, u));
  const k = lerp(lineW / (4 * FD.side), 1, easeInOutCubic(invLerp(0, 0.55, u)));
  const by = lerp(mergedY, FD.cy + FD.side / 2, easeInOutCubic(invLerp(0, 0.7, u)));
  const bx = lerp(lineX0 + lineW / 2, FD.cx, easeInOutCubic(invLerp(0, 0.7, u)));
  const faceFill = easeOutCubic(invLerp(0.75, 1, u));

  // ---- type
  const textOut = 1 - easeInOutCubic(invLerp(textOutAt, textOutAt + 10, f));
  const nameSize = reel ? 40 : 32;
  const heroSize = reel ? 150 : 124;
  const fasterSize = reel ? 124 : 112;

  const tracks: { name: string; len: number; done: number }[] = [
    { name: NAMES.versionWord, len: trackW, done: runEnd },
    { name: NAMES.highspeedShort.toUpperCase(), len: hsW, done: hsEnd },
  ];

  return (
    <AbsoluteFill style={{ background: `radial-gradient(110% 90% at ${BG.at[0]}% ${BG.at[1]}%, ${BG.core} 0%, ${C.void} 72%)` }}>
      <ProvenanceLabel kind="C" note="Not a live timing" />

      <svg width={L.w} height={L.h} style={{ position: 'absolute', inset: 0, overflow: 'visible' }} aria-hidden>
        {/* panels */}
        {tracks.map((tr, i) => {
          const y = R.y[i];
          return (
            <rect key={`p${i}`} x={panelX0} y={y - panelPad.top} width={panelX1 - panelX0} height={panelPad.top + panelPad.bot} rx={16}
              fill="rgba(16,25,58,0.55)" stroke="rgba(232,237,246,0.10)" strokeWidth={1} opacity={panelsOn * blocksOut} />
          );
        })}
        {/* a fine time ruler across the top of the panels (no units: this is not a live timing) */}
        {Array.from({ length: 41 }, (_, k) => {
          const x = R.x0 + (trackW * k) / 40, major = k % 5 === 0;
          const y0 = R.y[0] - blockH / 2 - 18;
          return <line key={`r${k}`} x1={x} x2={x} y1={y0} y2={y0 + (major ? 10 : 5)} stroke="rgba(232,237,246,0.3)" strokeWidth={1}
            opacity={panelsOn * blocksOut * easeOutCubic(invLerp(4 + k * 0.4, 14 + k * 0.4, f))} />;
        })}
        {/* the shared start mark */}
        <line x1={R.x0} x2={R.x0} y1={R.y[0] - blockH / 2 - 16} y2={R.y[1] + blockH / 2 + 16} stroke="rgba(232,237,246,0.4)" strokeWidth={1.5}
          opacity={panelsOn * blocksOut} />

        {/* tracks + task blocks */}
        {tracks.map((tr, i) => {
          const y = railY(i as 0 | 1);
          const scale = tr.len / TOTAL;
          let acc = R.x0;
          const fitsAll = TASKS.every(([w2, wt]) => wt * scale - 12 > w2.length * labelSize * 0.62);
          const complete = running && f >= tr.done;
          const capOn = reveal(f, tr.done, 8);
          return (
            <g key={`t${i}`}>
              {/* rail: bright at the hand-off, then quiet */}
              <rect x={lineX0} y={y - R.h / 2} width={lerp(R.x1 - R.x0, lineW, mg)} height={R.h} rx={R.h / 2}
                fill={EDGE} opacity={lerp(1, 0.28, cool * (1 - mg)) * (folding ? 0 : 1)} />
              {TASKS.map(([word, wt], j) => {
                const x = acc, w = wt * scale;
                acc += w;
                const written = clamp(playX - x, 0, w);
                if (!running || written <= 0) return null;
                const full = written >= w - 0.5;
                const gap = 4;
                const label = fitsAll ? word : word[0];
                return (
                  <g key={j} opacity={blocksOut}>
                    <rect x={x + (j ? gap / 2 : 0)} y={y - blockH / 2} width={Math.max(0, written - (j ? gap / 2 : 0) - (full ? gap / 2 : 0))} height={blockH} rx={4}
                      fill={EDGE} opacity={full ? 0.86 : 1} />
                    {full && (
                      <text x={x + w / 2} y={y + 1} textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700}
                        fontSize={labelSize} fill={C.ink} style={{ letterSpacing: '0.06em' }}>{label}</text>
                    )}
                  </g>
                );
              })}
              {/* end cap when the sequence completes */}
              {complete && (
                <rect x={R.x0 + tr.len - 1} y={y - blockH / 2 - 12} width={3} height={blockH + 24} fill={C.mint} opacity={capOn * blocksOut} />
              )}
            </g>
          );
        })}

        {/* the shared playhead */}
        {running && f < runEnd + 8 && (
          <g opacity={1 - invLerp(runEnd, runEnd + 8, f)}>
            <line x1={playX} x2={playX} y1={R.y[0] - blockH / 2 - 22} y2={R.y[1] + blockH / 2 + 22} stroke={C.lunar} strokeWidth={2} />
            <path d={`M${playX - 7},${R.y[0] - blockH / 2 - 32} h14 l-7,10 z`} fill={C.lunar} />
          </g>
        )}

        {/* the difference, after both complete: a dotted span on the Highspeed track (no number) */}
        {f > runEnd && (
          <line x1={R.x0 + hsW + 8} x2={R.x0 + hsW + 8 + (trackW - hsW - 8) * easeOutCubic(invLerp(runEnd + 2, runEnd + 16, f))}
            y1={R.y[1]} y2={R.y[1]} stroke={C.mint} strokeWidth={2} strokeDasharray="2 7" strokeLinecap="round" opacity={0.8 * blocksOut} />
        )}

        {/* exit: the merged line folds into the cube's front face */}
        {folding && (
          <g>
            <defs>
              <linearGradient id="hsFace" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#66709F" stopOpacity={0.78} />
                <stop offset="1" stopColor="#2A3676" stopOpacity={0.72} />
              </linearGradient>
            </defs>
            <polygon points={foldPath(bx, by, FD.side, 1, Math.PI / 2, Math.PI / 2)} fill="url(#hsFace)" opacity={faceFill} />
            <polyline points={foldPath(bx, by, FD.side, k, a1, a2)} fill="none" stroke={EDGE} strokeWidth={16} strokeOpacity={0.2} strokeLinejoin="round" />
            <polyline points={foldPath(bx, by, FD.side, k, a1, a2)} fill="none" stroke="#7FE9FF" strokeWidth={R.h} strokeLinejoin="miter" strokeLinecap="square" />
            {/* corner nodes, as the cube's edges meet in 11's first frame */}
            {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx2, sy2], i) => (
              <rect key={i} x={FD.cx + (sx2 * FD.side) / 2 - 5} y={FD.cy + (sy2 * FD.side) / 2 - 5} width={10} height={10} fill="#9FF0FF" opacity={faceFill * 0.9} />
            ))}
          </g>
        )}
      </svg>

      {/* panel names */}
      {tracks.map((tr, i) => {
        const y = R.y[i];
        const done = running && f >= tr.done;
        return (
          <div key={`n${i}`} style={{ position: 'absolute', left: reel ? R.x0 + 4 : 200, top: reel ? y - panelPad.top + 18 : y, width: reel ? 900 : 236,
            transform: reel ? undefined : 'translateY(-50%)', opacity: panelsOn * blocksOut,
            fontFamily: F.text, fontWeight: 650, fontSize: nameSize, lineHeight: 1.12, color: C.lunar, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span>{tr.name}</span>
            <span style={{ width: nameSize * 0.36, height: nameSize * 0.36, borderRadius: '50%', background: C.mint, opacity: done ? reveal(f, tr.done, 8) : 0, flex: 'none' }} />
          </div>
        );
      })}

      {/* time legend under the panels */}
      <div style={{ position: 'absolute', left: R.x0, top: R.y[1] + panelPad.bot + (reel ? 18 : 14), fontFamily: F.mono, fontSize: reel ? 24 : 18, color: C.steel,
        letterSpacing: '0.14em', opacity: panelsOn * blocksOut }}>
        {'TIME →'}
      </div>

      {/* 2–3× FASTER + vendor qualifier */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: reel ? mergedY - 330 : mergedY - 292, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: reel ? 6 : 10, opacity: textOut }}>
        <KineticTitle text={SPEED_TEXT} fx="rise" at={numAt} size={heroSize} weight={700} color={C.amber} tracking={-0.02} />
        {/* stacked under the number, so FASTER accelerates in across clear space */}
        <KineticTitle text="FASTER" fx="faster" at={fasterAt} size={fasterSize} weight={700} color={C.lunar} tracking={0.01} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: mergedY + (reel ? 34 : 30), textAlign: 'center', opacity: textOut * reveal(f, qualAt, 12) }}>
        <div style={{ fontFamily: F.text, fontWeight: 500, fontSize: reel ? 34 : 28, color: C.silver }}>{CLAIMS.highspeed.qualifier}</div>
        <div style={{ fontFamily: F.mono, fontSize: reel ? 24 : 18, color: C.steel, marginTop: 10, letterSpacing: '0.02em' }}>{LABELS.source}</div>
      </div>
    </AbsoluteFill>
  );
};
