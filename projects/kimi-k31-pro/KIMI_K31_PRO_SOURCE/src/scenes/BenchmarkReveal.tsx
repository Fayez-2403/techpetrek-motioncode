// 09 · BENCHMARK REVEAL (data). Terminal-Bench 4.0 as Moonshot reported it, drawn as an honest chart:
//   entry   the mint bar 08 ends on drops and becomes the chart's axis line; ticks and grid rise out of it
//   build   title, then the bars grow from a zero baseline to their exact values with count-ups (staggered, table order)
//   read    the narration's order: focus Kimi, then Opus, then a reference rule at Opus's value shows the small gap
//   exit    text and the other bars clear; the Kimi bar splits into the two tracks of 10 (Highspeed)
// Numbers only from benchmarkData / verifiedClaims. Scientific tone: no trophies, no winner framing, no glow on the hero.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { TERMINAL_BENCH } from '../data/benchmarkData';
import { ChartRenderer, barPath, barRect, shownValue, xOf } from '../components/ChartRenderer';
import { KineticTitle } from '../components/KineticTitle';
import { SourceAttribution } from '../components/SourceAttribution';
import { clamp, easeInCubic, easeInOutCubic, easeOutCubic, invLerp, lerp, reveal } from '../lib/anim';
import { useLayout } from '../lib/layout';
import { C } from '../styles/theme';
import { F } from '../styles/typography';
import { BG, CHART, ENTRY_BAR, EDGE, RAILS, voFrame } from './_evidence';
import type { SceneProps } from './types';

const mixHex = (a: string, b: string, t: number) => {
  const p = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], clamp(t)))).join(',')})`;
};

export const BenchmarkReveal: React.FC<SceneProps> = ({ dur, variant }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const reel = variant === 'reel';
  const chart = TERMINAL_BENCH;
  const g = CHART[variant];
  const n = chart.bars.length;
  const kimi = chart.bars.findIndex((b) => b.hero);
  const opus = 0; // the first row (Moonshot's table order, highest first)

  // ---- beats: on the narration's words when they exist, else fractions of the scene
  const titleAt = Math.min(voFrame(variant, 'bench', /^Terminal/i, 0.02 * dur), 0.1 * dur);
  const barsAt = reel ? Math.round(0.12 * dur) : Math.max(Math.round(0.1 * dur), Math.min(voFrame(variant, 'bench', /^Moonshot/i, 0.15 * dur), 0.2 * dur));
  const growDur = reel ? 34 : 44, step = reel ? 6 : 8;
  const kimiAt = voFrame(variant, 'bench', reel ? /^65/ : /^Kimi/i, (reel ? 0.36 : 0.29) * dur);
  const opusAt = voFrame(variant, 'bench', reel ? /^Opus/i : /^Claude/i, (reel ? 0.59 : 0.58) * dur);
  const gapAt = voFrame(variant, 'bench', reel ? /^(thoda|behind)$/i : /^(Bas|Just)$/i, (reel ? 0.74 : 0.84) * dur);
  const exitAt = Math.round((reel ? 0.84 : 0.9) * dur);

  // ---- entry: the bar from 08 falls onto the axis position, stretches to the plot width and cools to the axis colour
  const E = ENTRY_BAR[variant];
  const fall = easeInCubic(invLerp(0, 13, f));
  const settle = f > 13 ? Math.exp(-(f - 13) / 3) * Math.sin((f - 13) * 1.3) * 3 : 0;
  const stretch = easeInOutCubic(invLerp(6, 24, f));
  const entryY = lerp(E.cy, g.axisY, fall) - settle;
  const entryX0 = lerp(E.cx - E.w / 2, g.x0, stretch), entryX1 = lerp(E.cx + E.w / 2, g.x0 + g.plotW, stretch);
  const entryH = lerp(E.h, 2, easeInOutCubic(invLerp(10, 26, f)));
  const entryCol = mixHex(C.mint, '#B9C1CF', invLerp(14, 30, f));
  const entryVis = 1 - invLerp(26, 34, f);
  const axis = invLerp(18, 18 + (reel ? 24 : 32), f);

  // ---- bars
  const grow = chart.bars.map((_, i) => invLerp(barsAt + i * step, barsAt + i * step + growDur, f));

  // ---- guided reading (emphasis per row)
  const toKimi = reveal(f, kimiAt, 10, easeInOutCubic);
  const toOpus = reveal(f, opusAt, 10, easeInOutCubic);
  const toGap = reveal(f, gapAt, 12, easeInOutCubic);
  const dimLevel = 0.42;
  const focus = chart.bars.map((_, i) => {
    let fo = 1;
    if (i !== kimi) fo = lerp(1, dimLevel, toKimi);
    if (i === opus) fo = lerp(fo, 1, toOpus);
    if (i === kimi) fo = lerp(fo, dimLevel, toOpus * (1 - toGap));
    if (i === kimi && toGap > 0) fo = Math.max(fo, toGap);
    return fo;
  });

  // ---- exit: text clears, neutral bars fade, the Kimi bar becomes the two rails of 10
  const ex = invLerp(exitAt, dur - 2, f);
  const textOut = 1 - easeInOutCubic(invLerp(0, 0.35, ex));
  const otherOut = 1 - easeInOutCubic(invLerp(0.05, 0.45, ex));
  const stretchX = easeInOutCubic(invLerp(0.14, 0.56, ex));   // stage 1: the bar runs out to full width and thins into a track
  const split = easeInOutCubic(invLerp(0.5, 0.97, ex));        // stage 2: the track splits into two rails

  // near-still camera: 1.5 % push across the scene (eased), about the plot centre
  const push = 1 + 0.015 * easeInOutCubic(invLerp(0, exitAt, f));
  const ox = g.x0 + g.plotW * 0.45, oy = (g.plotTop + g.axisY) / 2;
  const toScreen = (x: number, y: number) => [ox + (x - ox) * push, oy + (y - oy) * push] as const;

  // the Kimi bar in screen space (it leaves the scaled chart during the morph)
  const kr = barRect(chart, g, kimi, shownValue(chart, kimi, grow[kimi]));
  const [kx, ky] = toScreen(kr.x, kr.y), kw = kr.w * push, kh = kr.h * push;
  const R = RAILS[variant];
  const kcy = ky + kh / 2;
  const trackH = lerp(kh, R.h * 1.5, stretchX);
  const rail = (y: number, lag: number) => {
    const s2 = easeInOutCubic(clamp((split - lag) / (1 - lag)));
    const hh = lerp(trackH, R.h, s2);
    return { x: lerp(kx, R.x0, stretchX), y: lerp(kcy, y, s2) - hh / 2, w: lerp(kw, R.x1 - R.x0, stretchX), h: hh };
  };
  const ra = rail(R.y[0], 0), rb = rail(R.y[1], 0.06);
  const morphing = ex > 0.14;

  // reference rule at Opus's value (the gap the narration names; no number is added)
  const xo = xOf(chart, g, shownValue(chart, opus, grow[opus]));
  const xk = xOf(chart, g, shownValue(chart, kimi, grow[kimi]));
  const ruleTop = g.rowY[opus] - g.barH / 2 - 10, ruleBot = g.rowY[kimi] + g.barH / 2 + 10;
  const ruleDraw = easeOutCubic(invLerp(gapAt, gapAt + 14, f));
  const bracket = easeOutCubic(invLerp(gapAt + 8, gapAt + 20, f));
  const [rx, rt] = toScreen(xo, ruleTop), [, rbt] = toScreen(xo, ruleBot), [kxx, kyy] = toScreen(xk, g.rowY[kimi]);

  // ---- type
  const titleSize = reel ? 64 : 60;
  const subSize = reel ? 32 : 27;
  const footSize = reel ? 24 : 19;
  const side = L.safe.side;
  const titleTop = reel ? 300 : 120;
  const subOn = reveal(f, barsAt - 4, 14);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(110% 90% at ${BG.at[0]}% ${BG.at[1]}%, ${BG.core} 0%, ${C.void} 72%)` }}>
      {/* title block */}
      <div style={{ position: 'absolute', left: reel ? side : 200, right: side, top: titleTop, opacity: textOut,
        transform: `scale(${push})`, transformOrigin: `${ox - (reel ? side : 200)}px ${oy - titleTop}px` }}>
        <div style={{ fontFamily: F.mono, fontSize: reel ? 24 : 20, letterSpacing: '0.16em', color: C.silver, marginBottom: reel ? 18 : 14, opacity: 0.8 * reveal(f, titleAt, 10) }}>
          {chart.unit === '%' ? 'BENCHMARK · SCORE (%)' : 'BENCHMARK'}
        </div>
        <KineticTitle text={chart.title} fx="decode" at={titleAt} size={titleSize} weight={600} tracking={0.02} color={C.lunar} />
        <div style={{ fontFamily: F.text, fontSize: subSize, fontWeight: 500, color: C.silver, marginTop: reel ? 22 : 18, lineHeight: 1.3, maxWidth: reel ? 952 : 1400,
          opacity: subOn, transform: `translateY(${(1 - easeOutCubic(subOn)) * 10}px)` }}>
          {chart.qualifier}
        </div>
      </div>

      <ChartRenderer chart={chart} g={g} w={L.w} h={L.h} grow={grow} axis={axis} names={invLerp(barsAt - 16, barsAt + 6, f)} focus={focus}
        textOpacity={textOut} barOpacity={chart.bars.map((_, i) => (i === kimi ? (morphing ? 0 : 1) : otherOut))} scale={push} ox={ox} oy={oy} />

      <svg width={L.w} height={L.h} style={{ position: 'absolute', inset: 0, overflow: 'visible' }} aria-hidden>
        {/* entry bar */}
        {entryVis > 0 && <rect x={entryX0} y={entryY - entryH / 2} width={entryX1 - entryX0} height={entryH} rx={entryH / 2} fill={entryCol} opacity={entryVis} />}
        {/* reference rule + bracket (Opus value, down through the Kimi row) */}
        {ruleDraw > 0 && textOut > 0 && (
          <g opacity={textOut * 0.9}>
            <line x1={rx} x2={rx} y1={rt} y2={lerp(rt, rbt, ruleDraw)} stroke={C.lunar} strokeWidth={1.5} strokeDasharray="3 5" />
            <line x1={kxx + 3} x2={kxx + 3 + (rx - kxx - 3) * bracket} y1={kyy} y2={kyy} stroke={C.lunar} strokeWidth={1.5} opacity={0.85} />
          </g>
        )}
        {/* exit: the Kimi bar splits into the two rails */}
        {morphing && (
          <g>
            <path d={barPath(rb.x, rb.y, rb.w, rb.h, lerp(6, 2, stretchX))} fill={EDGE} />
            <path d={barPath(ra.x, ra.y, ra.w, ra.h, lerp(6, 2, stretchX))} fill={EDGE} />
          </g>
        )}
      </svg>

      {/* footnote: Moonshot's harness note + source */}
      <div style={{ position: 'absolute', left: reel ? side : 200, right: side, top: reel ? 1150 : 812, opacity: textOut * reveal(f, barsAt + 10, 16) }}>
        <div style={{ fontFamily: F.mono, fontSize: footSize, color: C.silver, lineHeight: 1.4, letterSpacing: '0.01em', maxWidth: reel ? 952 : 1520 }}>
          {chart.note}
        </div>
        <SourceAttribution id="terminalBenchHarness" size={footSize} style={{ marginTop: reel ? 12 : 8, color: C.steel }} />
      </div>
    </AbsoluteFill>
  );
};
