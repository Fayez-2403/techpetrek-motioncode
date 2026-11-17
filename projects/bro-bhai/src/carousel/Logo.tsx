// The Tech pe Trek logo on every carousel slide (user's note, 2026-11-02): a small square, bottom-right, 40 % opacity, above everything.
import React from 'react';
import { Img, staticFile } from 'remotion';

export const LOGO = { size: 80, margin: 24 };
export const Logo: React.FC = () => (
  <Img src={staticFile('brand/techpe-trek.jpg')} style={{ position: 'absolute', right: LOGO.margin, bottom: LOGO.margin, width: LOGO.size, height: LOGO.size, borderRadius: 0, opacity: 0.4, zIndex: 50 }} />
);
