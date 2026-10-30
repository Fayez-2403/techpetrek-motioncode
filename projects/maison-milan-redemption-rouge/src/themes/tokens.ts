// Redemption Rouge world: a wet night track that turns into a rose room. Colours sampled from the official product
// photos (red glass, black sphere stopper, gold label type) plus a near-black rouge ground.
export const FPS = 60;
export const W = 1080, H = 1920;
export const C = {
  base: '#070205',     // ground: rouge-black night
  deep: '#1A0408',     // lit ground near the hero
  rouge: '#B5121B',    // the glass red (one accent: speed light, petals)
  ember: '#FF3B2F',    // hottest streak core
  gold: '#D9B26A',     // label gold: names and note headings only
  gold2: '#F3DDA4',    // gold highlight
  ivory: '#F4ECE4',    // lines of copy
  ivory2: '#B8A9A2',   // quiet text (url, small print)
  // template keys kept for the shared components
  ink: '#F4ECE4', ink2: '#B8A9A2', accent: '#B5121B', accent2: '#D9B26A', card: '#1A0408', warn: '#FF3B2F',
};
export const FONT = {
  display: 'Cinzel, serif',                         // product name, note headings (matches the banner's gold serif)
  serif: '"Cormorant Garamond", serif',             // lines of copy, note words (italic)
  ui: 'Inter, sans-serif',                          // url only
  mono: '"JetBrains Mono", monospace',
};
export const ink = (d = 6, col = C.base) => `${d}px ${d}px 0 ${col}`;
/** Instagram 9:16 safe area: top 220, bottom 1540 (UI), sides 90 */
export const SAFE = { top: 220, bottom: 1540, left: 90, right: 990 };
