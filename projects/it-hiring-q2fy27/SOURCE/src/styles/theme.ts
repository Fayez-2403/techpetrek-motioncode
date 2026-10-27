// CASE FILE palette: editorial paper + ink + one security-alert accent; a dark "alert" variant for the hook and the
// checklist; TechpeTrek purple / lime only on brand marks; mint for "do this" actions; evidence-string red on the board.
export const C = {
  paper: '#F3EEE4', paper2: '#E8E0D0', paperEdge: '#D9CFBC', ink: '#121212', ink2: '#3B3934', mute: '#7B7468',
  grid: 'rgba(18,18,18,0.055)', alert: '#FF5A1F', alertDeep: '#D63F0B', mint: '#1F9E6E', mintSoft: '#7EE3B6',
  graphite: '#15161A', graphite2: '#1F2127', steel: '#8B909C', lunar: '#ECEFF4',
  string: '#C62F2A', cork: '#2A2621', felt: '#1B1A1F', purple: '#8B3DF5', lime: '#B6F23A',
} as const;

/** Instagram 9:16 UI: keep text clear of the top ~250 px and the bottom ~420 px */
export const SAFE = { top: 260, bottom: 420, side: 64 } as const;
export const W = 1080, H = 1920, FPS = 60;
