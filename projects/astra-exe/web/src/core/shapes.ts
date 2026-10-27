// Destructible target shapes as signed-distance-like fields (metres, negative inside). The fracture generator
// samples a field on a grid, cuts it into Voronoi cells and meshes every cell, so the pieces fit back together
// into the intact shape exactly. All shapes are original procedural forms (no imported models).
import { Noise, smoothstep } from './noise';

export type FieldKind = 'mountain' | 'mini' | 'slab' | 'crystal';
export type Field = (x: number, y: number, z: number) => number;

export interface FieldSpec {
  /** Grid bounds in local metres: x0, y0, z0, x1, y1, z1. */
  bounds: [number, number, number, number, number, number];
  /** Grid step (m). */
  h: number;
  /** Depth (m) over which cells grow from small (surface) to large (core). */
  deep: number;
  /** The "levitation core": cells within coreR of core stay anchored; anything cut off from them falls. */
  core: [number, number, number];
  coreR: number;
  make: (seed: number) => Field;
}

const hexPrism = (px: number, py: number, pz: number, r: number, hh: number) => {
  // iq's hexagonal prism along y (r = apothem, hh = half height)
  const kx = -0.8660254, ky = 0.5, kz = 0.57735;
  let x = Math.abs(px), z = Math.abs(pz);
  const d0 = 2 * Math.min(kx * x + ky * z, 0);
  x -= d0 * kx; z -= d0 * ky;
  const cx = Math.max(-kz * r, Math.min(kz * r, x));
  const dx = Math.hypot(x - cx, z - r) * Math.sign(z - r);
  const dy = Math.abs(py) - hh;
  return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
};

/** A function tabulated on a coarse regular lattice and read back trilinearly (for the low-frequency parts of a field). */
class Lattice {
  private v: Float32Array; private nx: number; private ny: number; private nz: number;
  constructor(private x0: number, private y0: number, private z0: number, x1: number, y1: number, z1: number, private s: number, fn: (x: number, y: number, z: number) => number) {
    this.nx = Math.ceil((x1 - x0) / s) + 2; this.ny = Math.max(1, Math.ceil((y1 - y0) / s) + 2); this.nz = Math.ceil((z1 - z0) / s) + 2;
    this.v = new Float32Array(this.nx * this.ny * this.nz);
    for (let k = 0; k < this.nz; k++) for (let j = 0; j < this.ny; j++) for (let i = 0; i < this.nx; i++) this.v[i + this.nx * (j + this.ny * k)] = fn(x0 + i * s, y0 + j * s, z0 + k * s);
  }
  at(x: number, y: number, z: number): number {
    const { nx, ny, nz, v } = this;
    let gx = (x - this.x0) / this.s, gy = ny > 1 ? (y - this.y0) / this.s : 0, gz = (z - this.z0) / this.s;
    gx = gx < 0 ? 0 : gx > nx - 1.001 ? nx - 1.001 : gx; gy = gy < 0 ? 0 : gy > ny - 1.001 ? Math.max(0, ny - 1.001) : gy; gz = gz < 0 ? 0 : gz > nz - 1.001 ? nz - 1.001 : gz;
    const i = gx | 0, j = gy | 0, k = gz | 0, fx = gx - i, fy = gy - j, fz = gz - k;
    const g = i + nx * (j + ny * k), dy = ny > 1 ? nx : 0, dz = nx * ny;
    const c00 = v[g]! + (v[g + 1]! - v[g]!) * fx, c10 = v[g + dy]! + (v[g + dy + 1]! - v[g + dy]!) * fx;
    const c01 = v[g + dz]! + (v[g + dz + 1]! - v[g + dz]!) * fx, c11 = v[g + dz + dy]! + (v[g + dz + dy + 1]! - v[g + dz + dy]!) * fx;
    const c0 = c00 + (c10 - c00) * fy, c1 = c01 + (c11 - c01) * fy;
    return c0 + (c1 - c0) * fz;
  }
}

/** The hero: a floating mountain with craggy peaks on a broad rim and a fluted root tapering into the abyss. */
function mountainField(seed: number, scale = 1): Field {
  const n = new Noise(seed), m = new Noise(seed + 101);
  // hanging spurs under the rim: [x, z, top y, length, radius]
  const spurs: [number, number, number, number, number][] = [[-20, 9, -6, 30, 6.5], [21, -4, -5, 26, 5.5], [3, 16, -10, 22, 5], [-8, -17, -8, 24, 5.5]];
  // low-frequency parts on coarse lattices (unscaled metres): the domain warp, the peak height map, the root's flutes
  const s = 0.022;
  const wX = new Lattice(-50, -62, -46, 50, 58, 46, 3, (x, y, z) => n.fbm(x * s, y * s, z * s, 2) * 7);
  const wY = new Lattice(-50, -62, -46, 50, 58, 46, 3, (x, y, z) => n.fbm(x * s - 8.2, y * s + 12.5, z * s - 3.3, 2) * 4);
  const wZ = new Lattice(-50, -62, -46, 50, 58, 46, 3, (x, y, z) => n.fbm(x * s + 17.3, y * s - 4.1, z * s + 9.7, 2) * 7);
  // sharp peaks: a cone with a convex flank, roughened by ridged noise (crags and spires on a broad plateau)
  const spire = (X: number, Z: number, cx: number, cz: number, h: number, r: number) => { const d = Math.hypot(X - cx, Z - cz) / r; return d >= 1 ? 0 : h * Math.pow(1 - d, 1.7); };
  const topL = new Lattice(-56, 0, -52, 56, 0, 52, 0.6, (X, _y, Z) => {
    const r = Math.hypot(X, Z / 0.75), crag = m.ridged(X * 0.06, 7.7, Z * 0.06, 4), rough = m.ridged(X * 0.16, 3.3, Z * 0.16, 3);
    const peaks = spire(X, Z, -6, -5, 34, 16) + spire(X, Z, 11, 2, 27, 12) + spire(X, Z, -21, 6, 19, 10) + spire(X, Z, 6, -15, 16, 9)
      + spire(X, Z, -14, -16, 12, 7) + spire(X, Z, 21, -8, 11, 7) + spire(X, Z, 1, 13, 9, 6);
    return 4 + peaks * (0.72 + 0.45 * crag) + rough * 3.2 + crag * 3 * (1 - smoothstep(20, 34, r));
  });
  // flutes as a function of the angle around the axis (as cos, sin) and height
  // (height is stored divided by 15, so the lattice step is 0.07 in cos/sin and 1.05 m in height)
  const fluteL = new Lattice(-1.05, -64 / 15, -1.05, 1.05, 10 / 15, 1.05, 0.07, (c, ys, sn) => 0.16 * n.fbm(c * 2.6, ys * 15 * 0.045, sn * 2.6, 3));
  return (x0, y0, z0) => {
    const x = x0 / scale, y = y0 / scale, z = z0 / scale;
    // cheap bound first: far outside the widest possible body (warp <= 7 m, flutes +16%, detail <= 4.4 m)
    const r0 = Math.sqrt(x * x + (z * z) / 0.5625);
    const kb = Math.min(1, Math.max(0, -(y + 4) / 50));
    const Rmax = 34 * 1.24 * Math.pow(1 - kb, 0.82) + 12;
    if (r0 > Rmax + 2 || y < -60) return Math.max(r0 - Rmax, 2) * scale;
    const X = x + wX.at(x, y, z), Y = y + wY.at(x, y, z), Z = z + wZ.at(x, y, z);
    const r = Math.sqrt(X * X + (Z * Z) / 0.5625);
    const dTop = (Y - topL.at(X, 0, Z)) * 0.5;
    // a broad cliffed rim (y 0..5) over a root that tapers to a point 50 m below, fluted with vertical ridges
    let R: number;
    if (Y > 0) R = 34 * (1 - 0.12 * smoothstep(4, 30, Y));
    else {
      const k = Math.min(1, -Y / 50), rr = r || 1;
      R = 34 * (k < 0.08 ? 1 - k * 0.6 : 0.952 * Math.pow(Math.max(0, (1 - k) / 0.92), 0.82)) * (k < 0.05 ? 1 : 1 + 1.35 * fluteL.at(X / rr, Y / 15, Z / 0.75 / rr));
    }
    let d = Math.max((r - R) * 0.8, dTop, -(Y + 50));
    for (const [sx, sz, sy, L, sr] of spurs) {
      const k = (sy - Y) / L;
      if (k < -0.2 || k > 1.2) continue;
      const rr = sr * Math.pow(Math.max(0, 1 - Math.max(0, k)), 0.8);
      const ds = Math.max(Math.sqrt((X - sx) ** 2 + (Z - sz) ** 2) - rr, Y - sy - 2, sy - L - Y) * 0.8;
      d = Math.min(d, ds);
    }
    // the rock detail (at most 4.4 m) cannot flip the sign far from the surface: skip it there
    if (d > 6 || d < -9) return d * scale;
    d += n.fbm(x * 0.085, y * 0.085, z * 0.085, 3) * 3.0 + (m.ridged(x * 0.16, y * 0.16, z * 0.16, 2) - 0.5) * 1.4;
    return d * scale;
  };
}

/** Challenge 1: a floating crystal slab, faceted, slightly tilted. */
function slabField(seed: number): Field {
  const n = new Noise(seed);
  return (x, y, z) => {
    // tilt 9 degrees about z
    const c = Math.cos(0.16), s = Math.sin(0.16);
    const px = c * x - s * y, py = s * x + c * y, pz = z;
    const qx = Math.abs(px) - 3.9, qy = Math.abs(py) - 5.8, qz = Math.abs(pz) - 0.55;
    const out = Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - 0.28;
    // facets: planar noise steps read like cut crystal faces
    const facet = Math.abs(n.n3(x * 0.32, y * 0.32, z * 0.32)) * 0.35;
    return out + facet;
  };
}

/** Challenge 3: a crystal formation on a rock base; the tall centre crystal is the marked target. */
function crystalField(seed: number): Field {
  const n = new Noise(seed);
  // crystals: [base x, base y, base z, tilt x, tilt z, apothem, half height]
  const xs: [number, number, number, number, number, number, number][] = [
    [0, -1, 0, 0, 0, 2.3, 7.5], [-4.2, -2.2, 1.2, 0.42, -0.25, 1.4, 4.6], [3.9, -2.4, -0.8, -0.38, 0.3, 1.5, 4.9],
    [1.2, -2.8, 3.8, 0.18, 0.5, 1.15, 3.6], [-1.8, -2.7, -3.9, -0.15, -0.48, 1.25, 3.9],
  ];
  return (x, y, z) => {
    // rock base: a squashed blob
    let d = (Math.hypot(x / 1.25, (y + 4.5) / 0.7, z / 1.15) - 5.2) * 0.75 + n.fbm(x * 0.2, y * 0.2, z * 0.2, 3) * 1.4;
    for (const [bx, by, bz, tx, tz, r, hh] of xs) {
      // rotate the point into the crystal's frame (small tilts about x and z), then a pointed hex prism
      let px = x - bx, py = y - by - hh * 0.65, pz = z - bz;
      const cx = Math.cos(tx), sx = Math.sin(tx), cz = Math.cos(tz), sz = Math.sin(tz);
      const y1 = cx * py - sx * pz, z1 = sx * py + cx * pz; py = y1; pz = z1;
      const x2 = cz * px + sz * py, y2 = -sz * px + cz * py; px = x2; py = y2;
      const taper = smoothstep(hh * 0.35, hh, py);
      const dc = hexPrism(px, py, pz, r * (1 - 0.92 * taper), hh);
      d = Math.min(d, dc);
    }
    return d;
  };
}

export const FIELDS: Record<FieldKind, FieldSpec> = {
  mountain: { bounds: [-47, -57, -41, 47, 60, 41], h: 0.85, deep: 14, core: [0, -2, 0], coreR: 13, make: (s) => mountainField(s) },
  mini: { bounds: [-26, -32, -23, 26, 34, 23], h: 0.5, deep: 8, core: [0, -1.2, 0], coreR: 7, make: (s) => mountainField(s, 0.55) },
  slab: { bounds: [-6.2, -7.8, -1.8, 6.2, 7.8, 1.8], h: 0.22, deep: 1, core: [0, 0, 0], coreR: 0, make: (s) => slabField(s) },
  crystal: { bounds: [-10, -9.5, -10, 10, 15, 10], h: 0.3, deep: 3, core: [0, -5, 0], coreR: 3.2, make: (s) => crystalField(s) },
};
