// Deterministic randomness and noise for the whole simulation. Nothing in src/core may call Math.random():
// every shape, fracture pattern, spin and spark comes from a seed, so a shot replays bit-identically.

/** mulberry32: a small, fast seeded PRNG returning floats in [0, 1). */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer hash of up to three ints and a seed, as a float in [0, 1). */
export function hashi(x: number, y = 0, z = 0, seed = 0): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 2147483647) + Math.imul(seed | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Signed hash in [-1, 1). */
export const shash = (x: number, y = 0, z = 0, seed = 0) => hashi(x, y, z, seed) * 2 - 1;

export const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
export const sat = (x: number) => clamp(x, 0, 1);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const smoothstep = (a: number, b: number, x: number) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };

function grad(h: number, x: number, y: number, z: number) {
  const k = h & 15, u = k < 8 ? x : y, v = k < 4 ? y : k === 12 || k === 14 ? x : z;
  return ((k & 1) ? -u : u) + ((k & 2) ? -v : v);
}

/** Improved Perlin gradient noise (3D) with a seeded permutation; output roughly in [-1, 1]. */
export class Noise {
  private p = new Uint8Array(512);
  constructor(seed: number) {
    const r = mulberry32(seed), q = new Uint8Array(256);
    for (let i = 0; i < 256; i++) q[i] = i;
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = q[i]!; q[i] = q[j]!; q[j] = t; }
    for (let i = 0; i < 512; i++) this.p[i] = q[i & 255]!;
  }
  n3(x: number, y: number, z: number): number {
    const p = this.p;
    const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
    x -= X; y -= Y; z -= Z;
    const xi = X & 255, yi = Y & 255, zi = Z & 255;
    const u = x * x * x * (x * (x * 6 - 15) + 10), v = y * y * y * (y * (y * 6 - 15) + 10), w = z * z * z * (z * (z * 6 - 15) + 10);
    const A = p[xi]! + yi, AA = p[A]! + zi, AB = p[A + 1]! + zi, B = p[xi + 1]! + yi, BA = p[B]! + zi, BB = p[B + 1]! + zi;
    const g000 = grad(p[AA]!, x, y, z), g100 = grad(p[BA]!, x - 1, y, z), g010 = grad(p[AB]!, x, y - 1, z), g110 = grad(p[BB]!, x - 1, y - 1, z);
    const g001 = grad(p[AA + 1]!, x, y, z - 1), g101 = grad(p[BA + 1]!, x - 1, y, z - 1), g011 = grad(p[AB + 1]!, x, y - 1, z - 1), g111 = grad(p[BB + 1]!, x - 1, y - 1, z - 1);
    const a0 = g000 + u * (g100 - g000), a1 = g010 + u * (g110 - g010), b0 = g001 + u * (g101 - g001), b1 = g011 + u * (g111 - g011);
    const c0 = a0 + v * (a1 - a0), c1 = b0 + v * (b1 - b0);
    return c0 + w * (c1 - c0);
  }
  /** Fractal sum, normalised to about [-1, 1]. */
  fbm(x: number, y: number, z: number, oct = 4, lac = 2.03, gain = 0.5): number {
    let s = 0, a = 1, n = 0;
    for (let i = 0; i < oct; i++) { s += a * this.n3(x, y, z); n += a; a *= gain; x *= lac; y *= lac; z *= lac; }
    return s / n;
  }
  /** Ridged fractal: sharp crests (0 at valleys, about 1 on ridges). */
  ridged(x: number, y: number, z: number, oct = 4): number {
    let s = 0, a = 0.5, w = 1, n = 0;
    for (let i = 0; i < oct; i++) {
      let v = 1 - Math.abs(this.n3(x, y, z));
      v *= v * w; w = clamp(v * 2, 0, 1);
      s += v * a; n += a; a *= 0.5; x *= 2.1; y *= 2.1; z *= 2.1;
    }
    return s / n;
  }
}
