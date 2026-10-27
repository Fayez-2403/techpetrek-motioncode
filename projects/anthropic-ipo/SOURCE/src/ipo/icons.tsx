// Real icon artwork, tinted with CSS masks: Lucide (ISC) UI icons in public/icons/lucide, and Simple Icons (CC0) brand marks
// in public/icons/brands (company marks, used only to identify the companies named in the reporting). Every file is
// preloaded behind delayRender, so no frame renders before its icons have loaded.
import React from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';

export const LUCIDE = ['bell', 'file-text', 'landmark', 'trending-up', 'building-2', 'map-pin', 'languages', 'briefcase', 'users', 'wallet', 'globe', 'shield-alert',
  'triangle-alert', 'cpu', 'server', 'banknote', 'indian-rupee', 'dollar-sign', 'arrow-right', 'circle-check', 'message-circle', 'sparkles', 'rocket', 'calendar',
  'scale', 'plane', 'credit-card', 'zap', 'chart-column', 'chart-line', 'hand-coins', 'circle-help', 'gavel', 'stamp', 'handshake', 'graduation-cap', 'search'] as const;
export const BRANDS = ['anthropic', 'claude', 'airindia', 'amazon', 'amazonwebservices', 'cognizant', 'goldmansachs', 'google', 'razorpay'] as const;
const url = (n: string) => staticFile(BRANDS.includes(n as (typeof BRANDS)[number]) ? `icons/brands/${n}.svg` : `icons/lucide/${n}.svg`);

let started = false;
export function preloadIcons() {
  if (started || typeof window === 'undefined') return;
  started = true;
  const h = delayRender('icons');
  Promise.all([...LUCIDE, ...BRANDS].map((n) => new Promise<void>((res) => { const i = new Image(); i.onload = () => res(); i.onerror = () => res(); i.src = url(n); })))
    .then(() => continueRender(h));
}

/** an icon tinted to `color` (mask-based, so Lucide strokes and brand fills both take the colour) */
export const Ico: React.FC<{ n: string; size?: number; color?: string; style?: React.CSSProperties }> = ({ n, size = 40, color = '#1F1E1B', style }) => (
  <div style={{ width: size, height: size, flex: 'none', background: color, WebkitMaskImage: `url(${url(n)})`, maskImage: `url(${url(n)})`, WebkitMaskSize: 'contain', maskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center', ...style }} />
);
