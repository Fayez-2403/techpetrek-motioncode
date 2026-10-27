// Palette and per-world looks. Base: midnight navy, near-black blue, lunar white, metallic silver. Accents: soft
// electric cyan, subtle violet. Semantic: mint = verified / complete, amber = highlighted numbers.
export const C = {
  void: '#03050B',
  night: '#060A18',
  navy: '#0A1130',
  navy2: '#111A42',
  ink: '#0E1526',
  lunar: '#E8EDF6',
  silver: '#A8B3C7',
  steel: '#66728C',
  dim: '#3A445C',
  cyan: '#5CE1FF',
  cyanDeep: '#1BA8D6',
  violet: '#8C7DFF',
  mint: '#7EE3B6',
  amber: '#FFB547',
  red: '#FF6B6B',
} as const;

/** Each world keeps its own character inside the palette. */
export const WORLD = {
  // coding: an authentic dark developer workspace
  code: { bg: '#0B0F1A', panel: '#111726', panel2: '#151C2E', line: '#1F2940', text: '#D7DEEA', mute: '#6B7891',
    kw: '#8C7DFF', str: '#7EE3B6', num: '#FFB547', fn: '#5CE1FF', com: '#56627A', type: '#A8C7FF' },
  // CAD: precise engineering software in a neutral studio
  cad: { bg0: '#2B2F36', bg1: '#15171B', grid: 'rgba(210,216,226,0.07)', gridMajor: 'rgba(210,216,226,0.14)', dim: '#5CE1FF',
    ink: '#E6EAF0', mute: '#8E97A6', axisX: '#E06A5A', axisY: '#7CC77A', axisZ: '#5A8DE0' },
  // human simulation: a clean, dim scientific visualization
  lab: { bg0: '#070B12', bg1: '#0B1220', bone: '#DCE3EE', muscle: '#E0675F', muscleOk: '#7EE3B6', grid: 'rgba(120,160,200,0.08)', text: '#C9D3E2' },
  // finance: premium analytical software, light panels and crisp tables
  fin: { bg: '#0A1024', paper: '#F5F7FB', paper2: '#EBEFF6', ink: '#0E1526', mute: '#5C6880', rule: '#D6DCE7', accent: '#1F6FE0',
    hi: '#FFB547', ok: '#2FA77A' },
} as const;

export const SAFE = {
  // Instagram 9:16 UI overlays: keep text clear of the top ~250 px and the bottom ~400 px
  reel: { top: 260, bottom: 420, side: 64 },
  master: { top: 54, bottom: 54, side: 80 },
} as const;
