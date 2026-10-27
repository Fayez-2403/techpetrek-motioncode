import React, { createContext, useContext } from 'react';
import { useVideoConfig } from 'remotion';
import { SAFE } from '../styles/theme';
import { T } from '../styles/typography';

/** Lets a subtree compose for a different frame than the composition's (V3 renders 16:9 scenes rotated inside a 9:16 reel). */
export const FrameContext = createContext<{ width: number; height: number } | null>(null);
export const FrameOverride: React.FC<{ width: number; height: number; children: React.ReactNode }> = ({ width, height, children }) =>
  React.createElement(FrameContext.Provider, { value: { width, height } }, children);

/** composition size, or the FrameOverride size inside one */
export function useFrameSize() {
  const cfg = useVideoConfig();
  const o = useContext(FrameContext);
  return { width: o?.width ?? cfg.width, height: o?.height ?? cfg.height, fps: cfg.fps };
}

/** The frame a scene is composing for: wide (16:9 master) or tall (9:16 reel). Scenes recompose, never crop. */
export function useLayout() {
  const { width: w, height: h, fps } = useFrameSize();
  const tall = h > w;
  return { w, h, fps, tall, safe: tall ? SAFE.reel : SAFE.master, t: tall ? T.reel : T.master, cx: w / 2, cy: h / 2 };
}
export type Layout = ReturnType<typeof useLayout>;
