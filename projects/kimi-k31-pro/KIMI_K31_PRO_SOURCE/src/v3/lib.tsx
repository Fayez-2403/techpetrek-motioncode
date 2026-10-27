// V3 showcase helpers: the beat-locked shot timeline, beat helpers for in-shot hits, and the provenance tag every
// shot carries (no narration, so the label does the work of saying "made for this video, not Kimi output").
import React from 'react';
import { useCurrentFrame } from 'remotion';
import TL from './timeline.json';
import { reveal } from '../lib/anim';
import { C } from '../styles/theme';
import { F } from '../styles/typography';

export const V3 = { fps: TL.fps, bpm: TL.bpm, bar: TL.barFrames, beat: TL.barFrames / 4, w: 1920, h: 1080 } as const;
export type ShotId = (typeof TL.shots)[number]['id'];
export interface V3Props { dur: number }

/** shot start frames and lengths from the bar counts */
export const SHOTS = (() => {
  let b = 0;
  return TL.shots.map((s) => { const o = { ...s, from: b * V3.bar, durationInFrames: s.bars * V3.bar, bar0: b }; b += s.bars; return o; });
})();
export const TOTAL_FRAMES = SHOTS.reduce((a, s) => a + s.durationInFrames, 0);

/** beat index and phase (0..1) at a local frame, plus a decaying pulse on each beat (1 on the beat, falling) */
export function beatAt(frame: number, sub = 1) {
  const len = V3.beat / sub, i = Math.floor(frame / len), ph = (frame - i * len) / len;
  return { i, ph, pulse: Math.exp(-ph * 6) };
}

/**
 * Text keep-out for the rotated reel: once the phone is turned, Instagram's top UI covers the landscape frame's left
 * ~250 px and its bottom UI the right ~400 px. Keep key text inside x 250..1520 (full picture can use the whole frame).
 */
export const SAFE_X = [250, 1520] as const;

/** category tag + provenance: bottom-left inside the safe area, decodes in at the cut */
export const V3Tag: React.FC<{ label: string; at?: number; dark?: boolean }> = ({ label, at = 4, dark }) => {
  const f = useCurrentFrame();
  const p = reveal(f, at, 10);
  const n = Math.round(p * label.length);
  return (
    <div style={{ position: 'absolute', left: SAFE_X[0] + 10, bottom: 52, zIndex: 60, opacity: p > 0 ? 1 : 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '9px 16px', borderRadius: 6, alignSelf: 'flex-start',
        background: dark ? 'rgba(255,255,255,0.8)' : 'rgba(4,7,18,0.58)', border: `1px solid ${dark ? 'rgba(14,21,38,0.25)' : 'rgba(232,237,246,0.3)'}`, backdropFilter: 'blur(6px)' }}>
        <span style={{ width: 9, height: 9, borderRadius: 2, background: C.cyan, boxShadow: `0 0 10px ${C.cyan}`, transform: 'rotate(45deg)' }} />
        <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: '0.12em', color: dark ? C.ink : C.lunar, whiteSpace: 'pre' }}>{label.slice(0, n)}</span>
      </div>
      <div style={{ fontFamily: F.mono, fontSize: 15, letterSpacing: '0.06em', color: dark ? C.steel : C.silver, opacity: reveal(f, at + 8, 10) * 0.9 }}>
        ILLUSTRATIVE · BUILT IN CODE FOR THIS VIDEO · NOT KIMI OUTPUT
      </div>
    </div>
  );
};

/** animatic placeholder for a V3 shot */
export const v3stub = (title: string) => {
  const S: React.FC<V3Props> = ({ dur }) => {
    const f = useCurrentFrame();
    const b = beatAt(f);
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#070A16', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ fontFamily: F.display, fontSize: 80, color: C.lunar, transform: `scale(${1 + 0.04 * b.pulse})` }}>{title}</div>
        <div style={{ fontFamily: F.mono, fontSize: 26, color: C.silver, marginTop: 20 }}>{`${(dur / 30).toFixed(1)} s · beat ${b.i}`}</div>
      </div>
    );
  };
  return S;
};
