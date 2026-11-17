// Bro & Bhai ep 01 look (the user's prompt, TPT-20261030-1200-01): original Fluent-inspired light mode. Bright sky blue /
// white acrylic panels, deep navy text, cyan focal glow, small magenta accents, soft physically plausible depth.
export const FPS = 60;
export const W = 1080, H = 1920;
export const C = {
  sky0: '#DDF1FF',     // background top
  sky1: '#F7FBFF',     // background bottom
  navy: '#0B1B3A',     // text
  navy2: '#4A5A78',    // secondary text
  cyan: '#12B8F5',     // focal glow, keywords
  cyanDeep: '#0A8CC4',
  magenta: '#E0338F',  // small accents, caveats
  bro: '#12B8F5',      // Bro's colour (left)
  bhai: '#E0338F',     // Bhai's colour (right)
  ok: '#18B26B',
  bad: '#E5484D',
  panel: 'rgba(255,255,255,0.74)',
  line: 'rgba(11,27,58,0.10)',
  // template names (src/components, the template Reel and Cover) mapped onto this look
  base: '#F7FBFF', ink: '#0B1B3A', ink2: '#4A5A78', accent: '#12B8F5', accent2: '#E0338F', card: '#FFFFFF', warn: '#E5484D',
};
export const FONT = {
  display: 'Archivo, Inter, sans-serif',
  ui: 'Inter, sans-serif',
  mono: '"JetBrains Mono", monospace',
};
/** acrylic depth: a soft key shadow + a tight contact shadow */
export const depth = (k = 1) => `0 ${18 * k}px ${48 * k}px rgba(11,27,58,${0.14 * k}), 0 ${2 * k}px ${6 * k}px rgba(11,27,58,0.10)`;
/** hard offset shadow (template components) */
export const ink = (d = 6, col = '#0B1B3A') => `${d}px ${d}px 0 ${col}`;
/** Safe zones from the prompt: top 220 and bottom 300 free of critical text; captions inside y 250..1580 */
export const SAFE = { top: 220, bottom: 1620, left: 70, right: 1010 };
