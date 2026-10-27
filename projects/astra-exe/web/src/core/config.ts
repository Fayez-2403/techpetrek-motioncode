// Every tunable number of the laboratory in one place. Physical quantities (SI units) are kept apart from the
// openly fantasy ones (CELESTIAL_GAIN, the impact multiplier, the mode gains), so the UI can label them honestly.

export type GravityPreset = 'zero' | 'moon' | 'earth' | 'extreme';
export type MaterialId = 'brittle' | 'dense' | 'crystal' | 'soft';
export type ModeId = 'vajra' | 'agni' | 'vayu' | 'cosmic';
export type CameraMode = 'cinematic' | 'orbit' | 'follow' | 'impact' | 'replay';
export type QualityId = 'low' | 'medium' | 'high' | 'ultra';

export const GRAVITY: Record<GravityPreset, { label: string; g: number }> = {
  zero: { label: 'Zero gravity', g: 0 },
  moon: { label: 'Moon-like', g: 1.62 },
  earth: { label: 'Earth-like', g: 9.81 },
  extreme: { label: 'Extreme fantasy', g: 29.4 },
};

/**
 * Target materials. toughness: energy flux (J/m^2) a piece survives; above it the piece breaks off.
 * eta: share of the arriving energy that becomes the piece's kinetic energy. Density in kg/m^3.
 */
export interface MaterialPreset {
  label: string; toughness: number; density: number; restitution: number; friction: number; eta: number;
  /** Extra decorative rubble per broken piece (crystal shatters into more shards). */
  shatter: number;
  /** Shader palette: skin, fracture face, mineral glow (linear RGB 0..1). */
  skin: [number, number, number]; face: [number, number, number]; glow: [number, number, number];
  /** 1 for crystal-like (glassy, glowing) shading. */
  glassy: number;
}
export const MATERIALS: Record<MaterialId, MaterialPreset> = {
  brittle: { label: 'Brittle stone', toughness: 6.0e5, density: 2400, restitution: 0.12, friction: 0.7, eta: 0.3, shatter: 1.4,
    skin: [0.2, 0.175, 0.16], face: [0.46, 0.34, 0.24], glow: [1.0, 0.62, 0.22], glassy: 0 },
  dense: { label: 'Dense rock', toughness: 1.6e6, density: 3000, restitution: 0.08, friction: 0.85, eta: 0.22, shatter: 0.8,
    skin: [0.085, 0.09, 0.105], face: [0.3, 0.29, 0.32], glow: [1.0, 0.45, 0.18], glassy: 0 },
  crystal: { label: 'Crystal', toughness: 9.0e5, density: 2650, restitution: 0.45, friction: 0.25, eta: 0.4, shatter: 2.6,
    skin: [0.22, 0.42, 0.62], face: [0.55, 0.82, 1.0], glow: [0.5, 0.85, 1.0], glassy: 1 },
  soft: { label: 'Soft fantasy material', toughness: 2.2e6, density: 1200, restitution: 0.65, friction: 0.9, eta: 0.5, shatter: 0.6,
    skin: [0.12, 0.26, 0.22], face: [0.85, 0.45, 0.62], glow: [1.0, 0.5, 0.85], glassy: 0 },
};

/**
 * The bow (stylised game physics, not a historical longbow). Linear draw-force curve F = k d up to MAX_DRAW,
 * stored energy E = k d^2 / 2, of which EFFICIENCY reaches the arrow: v = sqrt(2 * EFFICIENCY * E / ARROW_MASS).
 * With these numbers a full draw stores 112 J and launches the 25 g arrow at about 85 m/s.
 */
export const BOW = {
  MAX_DRAW: 0.72,
  K: 432,                // N/m (311 N, about 70 lbf, at full draw)
  EFFICIENCY: 0.8,
  ARROW_MASS: 0.025,     // kg
  /** Game-style quadratic air drag: a = -DRAG |v| v (1/m). */
  DRAG: 0.0006,
};
export function launchSpeed(draw: number) {
  const E = 0.5 * BOW.K * draw * draw;
  return Math.sqrt((2 * BOW.EFFICIENCY * E) / BOW.ARROW_MASS);
}

/**
 * Fantasy: the arrow's physical kinetic energy at impact (tens of joules) is multiplied by this "celestial gain"
 * and by the user's impact multiplier before it reaches the rock. This is the one openly invented number in the
 * impact; everything after it (energy flux vs toughness, piece speeds, rigid-body motion) follows the model.
 */
export const CELESTIAL_GAIN = 2.2e7;

export interface ModeSpec {
  id: ModeId; label: string; hi: string; short: string; emoji: string;
  /** Linear-RGB colours: core (HDR) and trail. */
  core: [number, number, number]; trail: [number, number, number];
  /** Energy gain of the mode (fantasy). */
  gain: number;
  /** Radius scale of the break, outward push and how much of the push follows the arrow. */
  radius: number; push: number; follow: number;
  blurb: string;
}
export const MODES: Record<ModeId, ModeSpec> = {
  vajra: { id: 'vajra', label: 'Vajra Pulse', hi: 'वज्र प्रहार', short: 'VAJRA', emoji: '⚡', core: [6, 4.6, 1.2], trail: [1, 0.82, 0.3], gain: 1.0, radius: 1.0, push: 1.25, follow: 0.35,
    blurb: 'Concentrated impact: a local break, a hard outward impulse and a shockwave.' },
  agni: { id: 'agni', label: 'Agni Wave', hi: 'अग्नि लहर', short: 'AGNI', emoji: '🔥', core: [7, 2.6, 0.6], trail: [1, 0.45, 0.12], gain: 0.9, radius: 1.25, push: 0.55, follow: 0.15,
    blurb: 'Heat spreads from the hit (a shader effect, not real combustion); pieces crack loose one by one.' },
  vayu: { id: 'vayu', label: 'Vayu Storm', hi: 'वायु तूफ़ान', short: 'VAYU', emoji: '🌪️', core: [2.2, 5.5, 6.5], trail: [0.5, 0.92, 1], gain: 0.75, radius: 0.85, push: 0.6, follow: 0.1,
    blurb: 'A wide wind field: loose pieces are pushed out and lifted into a vortex that fades.' },
  cosmic: { id: 'cosmic', label: 'Cosmic Fracture', hi: 'ब्रह्मांड भंजन', short: 'COSMIC', emoji: '🌌', core: [4.4, 2.6, 7.5], trail: [0.72, 0.5, 1], gain: 1.35, radius: 1.6, push: 0.35, follow: 0.05,
    blurb: 'Fiction: time slows, a radial fracture runs through the rock, pieces float, then gravity returns.' },
};
export const MODE_ORDER: ModeId[] = ['vajra', 'agni', 'vayu', 'cosmic'];

// dpr: the most device pixels per CSS pixel; fbm / rockOct: noise octaves in the sky and cloud / rock shaders; clouds: cloud-sea layers; bloomDiv: bloom works at 1/bloomDiv resolution.
// (high is what the reel is captured at: keep its look fixed.)
export const QUALITY: Record<QualityId, { label: string; chunks: number; debris: number; sparks: number; shadow: number; msaa: number; bloom: boolean; dpr: number; fbm: number; rockOct: number; clouds: number; bloomDiv: number }> = {
  low: { label: 'Low (about 90 rigid pieces)', chunks: 90, debris: 600, sparks: 6000, shadow: 1024, msaa: 0, bloom: true, dpr: 0.75, fbm: 3, rockOct: 3, clouds: 2, bloomDiv: 4 },
  medium: { label: 'Medium (about 220)', chunks: 220, debris: 1500, sparks: 14000, shadow: 1024, msaa: 2, bloom: true, dpr: 1, fbm: 3, rockOct: 3, clouds: 3, bloomDiv: 4 },
  high: { label: 'High (about 480)', chunks: 480, debris: 2600, sparks: 22000, shadow: 2048, msaa: 4, bloom: true, dpr: 1.5, fbm: 5, rockOct: 4, clouds: 3, bloomDiv: 2 },
  ultra: { label: 'Ultra (about 1000, capable GPUs)', chunks: 1000, debris: 4000, sparks: 30000, shadow: 4096, msaa: 4, bloom: true, dpr: 2, fbm: 5, rockOct: 4, clouds: 3, bloomDiv: 2 },
};

/** Fixed physics step (s). Rendering interpolates between steps, so slow motion stays smooth. */
export const PHYS_DT = 1 / 120;
/** Collision groups (Rapier: membership << 16 | filter). */
export const GROUP = {
  STATIC: (0b0001 << 16) | 0b1010,
  DEBRIS: (0b0010 << 16) | 0b0111,
  FRESH: (0b0100 << 16) | 0b0110,
  PROP: (0b1000 << 16) | 0b0011,
  /** Ray filter for the arrow: hits everything. */
  RAY: (0xffff << 16) | 0b1111,
};
