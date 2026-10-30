// PaperPilot world: a dark ink-blue stage, real paper-white sheets, cyan for "local / digital", rust orange for the
// Rust engine and MCP, mint for "on your device / success", coral only for uploads and caveats (from the user's brief).
export const FPS = 60;
export const W = 1080, H = 1920;
export const C = {
  base: '#080B12',     // stage
  surface: '#121D2B',  // panels, floor
  paper: '#F9FAFC',    // PDF sheets
  ink: '#F3F6FA',      // text on dark
  ink2: '#8795A8',     // muted gray
  paperInk: '#1B2433', // text printed on paper
  cyan: '#29D6E5',
  rust: '#EE7946',
  mint: '#8DE3B5',
  coral: '#FF6475',
  card: '#0E1724',
};
export const FONT = {
  display: '"Space Grotesk", Inter, sans-serif',
  ui: 'Inter, sans-serif',
  mono: '"IBM Plex Mono", monospace',
};
/** soft coloured glow (text-shadow / box-shadow) */
export const glow = (a: number, col: string = C.cyan, r = 40) => `0 0 ${r}px ${col}${Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0')}`;
/** Instagram 9:16 safe area: keep captions/CTA inside (top 220, bottom 380 for the UI, sides 90) */
export const SAFE = { top: 220, bottom: 1540, left: 90, right: 990 };
