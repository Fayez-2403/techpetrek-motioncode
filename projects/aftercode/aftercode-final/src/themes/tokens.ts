// The reel's style tokens: AFTERCODE's own world (the app's palette, web/src/ui/styles.css): night ink, cyan, pink, lime.
export const FPS = 60;
export const W = 1080, H = 1920;
export const C = {
  base: '#06060a',     // night ink
  ink: '#eceaf5',      // text
  ink2: '#a19eb8',     // secondary text
  accent: '#3bf0ff',   // cyan: the app's accent
  accent2: '#ff3bd0',  // pink: battles, the second rapper
  lime: '#b6ff3b',     // VS, CTA
  card: 'rgba(10, 10, 18, 0.86)',
  warn: '#ff5a7a',
};
export const FONT = {
  display: 'Archivo, Inter, sans-serif',  // condensed display (variable width 62-125 %)
  ui: 'Inter, sans-serif',
  mono: '"JetBrains Mono", monospace',
};
/** hard offset shadow, the house "printed" depth */
export const ink = (d = 6, col = C.base) => `${d}px ${d}px 0 ${col}`;
/** Instagram 9:16 safe area: keep captions/CTA inside (top 220, bottom 380 for the UI, sides 90) */
export const SAFE = { top: 220, bottom: 1540, left: 90, right: 990 };
