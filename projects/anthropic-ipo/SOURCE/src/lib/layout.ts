import React, { createContext, useContext } from 'react';
import { useVideoConfig } from 'remotion';

/** Lets a subtree compose for a different frame than the composition's (the 4:5 carousel reuses the 9:16 card parts). */
export const FrameContext = createContext<{ width: number; height: number } | null>(null);
export const FrameOverride: React.FC<{ width: number; height: number; children: React.ReactNode }> = ({ width, height, children }) =>
  React.createElement(FrameContext.Provider, { value: { width, height } }, children);

/** composition size, or the FrameOverride size inside one */
export function useFrameSize() {
  const cfg = useVideoConfig();
  const o = useContext(FrameContext);
  return { width: o?.width ?? cfg.width, height: o?.height ?? cfg.height, fps: cfg.fps };
}
