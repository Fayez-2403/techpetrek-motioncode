// SERVER SIEGE reel tokens: the app's night-city palette (web/src/world/layout.ts COLOR), so overlay and capture are one world.
export const FPS = 60;
export const W = 1080, H = 1920;
export const C = {
  base: '#070d1c',     // night navy
  ink: '#e8f4ff',      // text
  ink2: '#9fb3cc',     // secondary text
  accent: '#2ee6ff',   // cyan: healthy, the request flow
  accent2: '#2bff9a',  // emerald: cache, recovery
  card: 'rgba(7,13,28,0.72)',
  warn: '#ff4d5e',     // coral: overload, failure
  amber: '#ffb020',
  violet: '#a98bff',
};
export const FONT = {
  display: 'Archivo, Inter, sans-serif',
  ui: 'Inter, sans-serif',
  mono: '"JetBrains Mono", monospace',
};
export const ink = (d = 6, col = '#02050c') => `${d}px ${d}px 0 ${col}`;
/** Instagram 9:16 safe area: captions and CTA inside (top 220, bottom 1540, sides 70) */
export const SAFE = { top: 220, bottom: 1540, left: 70, right: 1010 };
