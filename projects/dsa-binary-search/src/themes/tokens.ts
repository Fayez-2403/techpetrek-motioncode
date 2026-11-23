// ONE world: a Bengaluru PG room at night. Deep indigo ground, warm desk-lamp light, and one hero object: the yellow
// school scale. Colours carry one meaning each: yellow = the search space (the scale), green = HAAN / found range,
// red = NA / eliminated, gold = the answer.
export const FPS = 60;
export const W = 1080, H = 1920;
export const C = {
  night: '#12143A',     // ground
  night2: '#1D2160',    // lit wall
  deep: '#0A0B22',
  ink: '#121326',       // text on light
  paper: '#FFF7E8',     // bubbles, pages
  scale: '#FFD23F',     // the school scale = the search space
  scaleEdge: '#E3A900',
  tick: '#B3122E',      // scale markings
  na: '#FF5A6A',        // NA / eliminated
  haan: '#2BCB8D',      // HAAN / still alive
  gold: '#FFC93C',      // the answer
  lamp: '#FFB866',      // the lamp light
  dim: '#8E93C9',       // secondary text on dark
  bro: '#16A79C',       // Bro's hoodie (teal)
  bhai: '#93304F',      // Bhai's shirt (maroon)
  code: '#0E1030',      // editor
};
export const FONT = {
  display: 'Archivo, Inter, sans-serif',
  ui: 'Inter, sans-serif',
  mono: '"JetBrains Mono", monospace',
};
/** Instagram 9:16 safe area */
export const SAFE = { top: 230, bottom: 1560, left: 70, right: 1010 };
/** the hero zone every scene draws into (above the captions and the two hosts) */
export const ZONE = { top: 250, bottom: 1110, left: 60, right: 1020 };
