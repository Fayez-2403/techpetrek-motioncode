// Pre-fractured destructibles. A field (shapes.ts) is sampled on a grid and cut into Voronoi cells; each cell is
// meshed on its own (naive surface nets on max(field, cell distance)), so the pieces tile the intact shape
// exactly and their inner faces are true fracture planes. Runs once per target (in a worker in the browser,
// directly in the headless tests). Deterministic: the same kind, seed and count give the same pieces.
import { FIELDS, type FieldKind } from './shapes';
import { mulberry32, smoothstep } from './noise';

export interface Chunk {
  /** Mesh in the target's local rest frame (so a texture computed from `pos` sticks to the piece). */
  pos: Float32Array; nrm: Float32Array;
  /** Per vertex: x = fracture-face weight (0 outer skin, 1 inner face), y = distance to the cell edge (m), z = depth inside (m). */
  rock: Float32Array;
  idx: Uint32Array;
  /** Volume centroid (local), volume (m^3, from the grid) and bounding radius about the centroid. */
  c: [number, number, number]; vol: number; rad: number;
  /** Collider points relative to the centroid (a subset of the mesh, pulled in 6%; Rapier takes their hull). */
  hull: Float32Array;
  /** Neighbouring pieces and the shared face area (m^2) with each. */
  nb: number[]; area: number[];
  /** Depth of the centroid inside the shape (m). */
  depth: number;
}

export interface Fracture {
  kind: FieldKind; seed: number; chunks: Chunk[]; anchors: number[]; volume: number; h: number;
  bounds: [number, number, number, number, number, number]; ms: number; tris: number;
}

// cube corners (dx, dy, dz) and the 12 edges as corner pairs
const CORNERS = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];

export function generate(kind: FieldKind, seed: number, nChunks: number): Fracture {
  const T0 = Date.now();
  const spec = FIELDS[kind], f = spec.make(seed), h = spec.h;
  const [X0, Y0, Z0, X1, Y1, Z1] = spec.bounds;
  const nx = Math.floor((X1 - X0) / h) + 1, ny = Math.floor((Y1 - Y0) / h) + 1, nz = Math.floor((Z1 - Z0) / h) + 1;
  const nxy = nx * ny, NG = nxy * nz;
  const F = new Float32Array(NG);
  let inside = 0;
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const g = i + nx * j + nxy * k;
    let v = f(X0 + i * h, Y0 + j * h, Z0 + k * h);
    if (i === 0 || j === 0 || k === 0 || i === nx - 1 || j === ny - 1 || k === nz - 1) v = Math.max(v, h); // closed surfaces
    F[g] = v;
    if (v < 0) inside++;
  }
  const volume = inside * h * h * h;

  /** Trilinear sample of the field (clamped to the grid). */
  const sampleF = (px: number, py: number, pz: number) => {
    let gx = (px - X0) / h, gy = (py - Y0) / h, gz = (pz - Z0) / h;
    gx = Math.max(0, Math.min(nx - 1.0001, gx)); gy = Math.max(0, Math.min(ny - 1.0001, gy)); gz = Math.max(0, Math.min(nz - 1.0001, gz));
    const i = Math.floor(gx), j = Math.floor(gy), k = Math.floor(gz), fx = gx - i, fy = gy - j, fz = gz - k;
    const g = i + nx * j + nxy * k;
    const c00 = F[g]! + (F[g + 1]! - F[g]!) * fx, c10 = F[g + nx]! + (F[g + nx + 1]! - F[g + nx]!) * fx;
    const c01 = F[g + nxy]! + (F[g + nxy + 1]! - F[g + nxy]!) * fx, c11 = F[g + nxy + nx]! + (F[g + nxy + nx + 1]! - F[g + nxy + nx]!) * fx;
    const c0 = c00 + (c10 - c00) * fy, c1 = c01 + (c11 - c01) * fy;
    return c0 + (c1 - c0) * fz;
  };

  // ---- seeds: dart throwing inside the shape, smaller cells near the surface, larger in the core
  const rng = mulberry32(seed * 7919 + nChunks * 31 + 17);
  let dBase = Math.cbrt(volume / Math.max(1, nChunks)) * 0.96;
  const S: number[] = [];
  const cellOf = (v: number, cs: number) => Math.floor(v / cs);
  for (let pass = 0; pass < 12 && S.length / 3 < nChunks; pass++) {
    const cs = dBase * 0.62, hash = new Map<number, number[]>();
    const key = (a: number, b: number, c: number) => (a * 73856093) ^ (b * 19349663) ^ (c * 83492791);
    for (let s = 0; s < S.length; s += 3) {
      const kk = key(cellOf(S[s]!, cs), cellOf(S[s + 1]!, cs), cellOf(S[s + 2]!, cs));
      let b = hash.get(kk); if (!b) hash.set(kk, b = []); b.push(s);
    }
    const reach = 2;
    for (let a = 0; a < nChunks * 60 && S.length / 3 < nChunks; a++) {
      const px = X0 + rng() * (X1 - X0), py = Y0 + rng() * (Y1 - Y0), pz = Z0 + rng() * (Z1 - Z0);
      const fv = sampleF(px, py, pz);
      if (fv > -0.35 * h) continue;
      const dmin = dBase * (0.74 + 0.48 * smoothstep(0, spec.deep, -fv));
      const ci = cellOf(px, cs), cj = cellOf(py, cs), ck = cellOf(pz, cs);
      let ok = true;
      for (let u = -reach; u <= reach && ok; u++) for (let v = -reach; v <= reach && ok; v++) for (let w = -reach; w <= reach && ok; w++) {
        const b = hash.get(key(ci + u, cj + v, ck + w));
        if (b) for (const s of b) { const dx = S[s]! - px, dy = S[s + 1]! - py, dz = S[s + 2]! - pz; if (dx * dx + dy * dy + dz * dz < dmin * dmin) { ok = false; break; } }
      }
      if (!ok) continue;
      const s = S.length; S.push(px, py, pz);
      const kk = key(ci, cj, ck); let b = hash.get(kk); if (!b) hash.set(kk, b = []); b.push(s);
    }
    if (S.length / 3 < nChunks) dBase *= 0.93;
  }
  const N = S.length / 3;

  // ---- label every grid point near or inside the shape with its nearest seed (seeds bucketed on a dense grid)
  const gs = dBase;
  const bnx = Math.ceil((X1 - X0) / gs) + 1, bny = Math.ceil((Y1 - Y0) / gs) + 1, bnz = Math.ceil((Z1 - Z0) / gs) + 1;
  const head = new Int32Array(bnx * bny * bnz).fill(-1), next = new Int32Array(N).fill(-1);
  const bi = (v: number, v0: number, n: number) => Math.max(0, Math.min(n - 1, Math.floor((v - v0) / gs)));
  for (let s = 0; s < N; s++) {
    const b = bi(S[3 * s]!, X0, bnx) + bnx * (bi(S[3 * s + 1]!, Y0, bny) + bny * bi(S[3 * s + 2]!, Z0, bnz));
    next[s] = head[b]!; head[b] = s;
  }
  /** Seeds in the buckets within r of the point's bucket (calls fn with each). */
  const around = (px: number, py: number, pz: number, r: number, fn: (s: number) => void) => {
    const ci = bi(px, X0, bnx), cj = bi(py, Y0, bny), ck = bi(pz, Z0, bnz);
    for (let w = Math.max(0, ck - r); w <= Math.min(bnz - 1, ck + r); w++) for (let v = Math.max(0, cj - r); v <= Math.min(bny - 1, cj + r); v++)
      for (let u = Math.max(0, ci - r); u <= Math.min(bnx - 1, ci + r); u++) for (let s = head[u + bnx * (v + bny * w)]!; s >= 0; s = next[s]!) fn(s);
  };
  const nearest = (px: number, py: number, pz: number) => {
    const ci = bi(px, X0, bnx), cj = bi(py, Y0, bny), ck = bi(pz, Z0, bnz);
    let best = -1, bd = Infinity;
    for (let r = 1; r <= 4; r++) {
      for (let w = ck - r; w <= ck + r; w++) for (let v = cj - r; v <= cj + r; v++) for (let u = ci - r; u <= ci + r; u++) {
        if (u < 0 || v < 0 || w < 0 || u >= bnx || v >= bny || w >= bnz) continue;
        if (r > 1 && Math.max(Math.abs(u - ci), Math.abs(v - cj), Math.abs(w - ck)) < r) continue; // only the new shell
        for (let s = head[u + bnx * (v + bny * w)]!; s >= 0; s = next[s]!) {
          const dx = S[3 * s]! - px, dy = S[3 * s + 1]! - py, dz = S[3 * s + 2]! - pz, d = dx * dx + dy * dy + dz * dz;
          if (d < bd) { bd = d; best = s; }
        }
      }
      if (best >= 0 && Math.sqrt(bd) < (r - 0.5) * gs) break;
    }
    return best;
  };
  const label = new Int32Array(NG).fill(-1);
  const cnt = new Float64Array(N), cx = new Float64Array(N), cy = new Float64Array(N), cz = new Float64Array(N);
  const bb = new Int32Array(N * 6);
  for (let s = 0; s < N; s++) { bb[6 * s] = bb[6 * s + 1] = bb[6 * s + 2] = 1 << 30; bb[6 * s + 3] = bb[6 * s + 4] = bb[6 * s + 5] = -1; }
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const g = i + nx * j + nxy * k, v = F[g]!;
    if (v > 1.5 * h) continue;
    const s = nearest(X0 + i * h, Y0 + j * h, Z0 + k * h);
    if (s < 0) continue;
    label[g] = s;
    const o = 6 * s;
    if (i < bb[o]!) bb[o] = i; if (j < bb[o + 1]!) bb[o + 1] = j; if (k < bb[o + 2]!) bb[o + 2] = k;
    if (i > bb[o + 3]!) bb[o + 3] = i; if (j > bb[o + 4]!) bb[o + 4] = j; if (k > bb[o + 5]!) bb[o + 5] = k;
    if (v < 0) { cnt[s]!++; cx[s]! += X0 + i * h; cy[s]! += Y0 + j * h; cz[s]! += Z0 + k * h; }
  }
  // shared faces between pieces (inside points with a differently labelled inside neighbour)
  const pairs = new Map<number, number>();
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const g = i + nx * j + nxy * k;
    if (!(F[g]! < 0)) continue;
    const a = label[g]!;
    for (const d of [1, nx, nxy]) {
      const b = label[g + d]!;
      if (b >= 0 && b !== a && F[g + d]! < 0) { const kk = a < b ? a * N + b : b * N + a; pairs.set(kk, (pairs.get(kk) ?? 0) + 1); }
    }
  }
  const nb: number[][] = Array.from({ length: N }, () => []), area: number[][] = Array.from({ length: N }, () => []);
  const touch: Set<number>[] = Array.from({ length: N }, () => new Set());
  for (const [kk, c] of pairs) {
    const a = Math.floor(kk / N), b = kk % N;
    touch[a]!.add(b); touch[b]!.add(a);
    if (c < 2) continue; // a corner touch, not a face
    nb[a]!.push(b); area[a]!.push(c * h * h); nb[b]!.push(a); area[b]!.push(c * h * h);
  }

  // ---- mesh each cell: surface nets on max(F, distance to the cell's bisector planes)
  const chunks: Chunk[] = [];
  let tris = 0;
  for (let s = 0; s < N; s++) {
    const sx0 = S[3 * s]!, sy0 = S[3 * s + 1]!, sz0 = S[3 * s + 2]!;
    // planes: the cells that touch this one inside the shape, plus every seed close by (a Voronoi cell is the
    // intersection of the bisector half-spaces; an extra one only repeats a face, it never cuts the cell wrongly)
    const P: number[] = [];
    const near = new Set(touch[s]);
    around(sx0, sy0, sz0, 2, (t) => { if (t !== s) { const L = Math.hypot(S[3 * t]! - sx0, S[3 * t + 1]! - sy0, S[3 * t + 2]! - sz0); if (L < 1.6 * dBase) near.add(t); } });
    for (const t of near) {
      const dx = S[3 * t]! - sx0, dy = S[3 * t + 1]! - sy0, dz = S[3 * t + 2]! - sz0, L = Math.hypot(dx, dy, dz);
      // n . (p - m) with m the midpoint
      const nX = dx / L, nY = dy / L, nZ = dz / L;
      P.push(nX, nY, nZ, -(nX * (sx0 + dx / 2) + nY * (sy0 + dy / 2) + nZ * (sz0 + dz / 2)));
    }
    const nP = P.length / 4;
    // each cell is grown GROW past its bisector planes: surface nets stops a skin up to half a cell short of a
    // boundary, so without this every seam would be a groove; with it, neighbouring skins overlap on the same
    // surface (same colour and normal, so the seam vanishes) and the inner faces stay hidden inside the rock
    const GROW = 0.42 * h;
    const cellD = (px: number, py: number, pz: number) => {
      let m = -1e9;
      for (let q = 0; q < P.length; q += 4) { const d = P[q]! * px + P[q + 1]! * py + P[q + 2]! * pz + P[q + 3]!; if (d > m) m = d; }
      return m - GROW;
    };
    const o = 6 * s;
    if (bb[o + 3]! < 0) continue;
    const i0 = Math.max(0, bb[o]! - 2), j0 = Math.max(0, bb[o + 1]! - 2), k0 = Math.max(0, bb[o + 2]! - 2);
    const i1 = Math.min(nx - 1, bb[o + 3]! + 2), j1 = Math.min(ny - 1, bb[o + 4]! + 2), k1 = Math.min(nz - 1, bb[o + 5]! + 2);
    const sx = i1 - i0 + 1, sy = j1 - j0 + 1, sz = k1 - k0 + 1, sxy = sx * sy;
    const V = new Float32Array(sx * sy * sz);
    for (let k = 0; k < sz; k++) for (let j = 0; j < sy; j++) for (let i = 0; i < sx; i++) {
      const gi = i0 + i, gj = j0 + j, gk = k0 + k;
      let v = Math.max(F[gi + nx * gj + nxy * gk]!, nP ? cellD(X0 + gi * h, Y0 + gj * h, Z0 + gk * h) : -1e9);
      if (i === 0 || j === 0 || k === 0 || i === sx - 1 || j === sy - 1 || k === sz - 1) v = Math.max(v, 0.25 * h);
      V[i + sx * j + sxy * k] = v;
    }
    // one vertex per sign-changing cell, at the mean of its edge crossings
    const cxN = sx - 1, cyN = sy - 1, czN = sz - 1;
    const vid = new Int32Array(cxN * cyN * czN).fill(-1);
    const pos: number[] = [];
    const cv = new Float32Array(8);
    for (let k = 0; k < czN; k++) for (let j = 0; j < cyN; j++) for (let i = 0; i < cxN; i++) {
      let mask = 0;
      for (let c = 0; c < 8; c++) { const C = CORNERS[c]!; const v = V[i + C[0]! + sx * (j + C[1]!) + sxy * (k + C[2]!)]!; cv[c] = v; if (v < 0) mask |= 1 << c; }
      if (mask === 0 || mask === 255) continue;
      let ax = 0, ay = 0, az = 0, ne = 0;
      for (const [a, b] of EDGES) {
        const va = cv[a!]!, vb = cv[b!]!;
        if ((va < 0) === (vb < 0)) continue;
        const t = va / (va - vb), A = CORNERS[a!]!, B = CORNERS[b!]!;
        ax += A[0]! + (B[0]! - A[0]!) * t; ay += A[1]! + (B[1]! - A[1]!) * t; az += A[2]! + (B[2]! - A[2]!) * t; ne++;
      }
      vid[i + cxN * j + cxN * cyN * k] = pos.length / 3;
      pos.push(X0 + (i0 + i + ax / ne) * h, Y0 + (j0 + j + ay / ne) * h, Z0 + (k0 + k + az / ne) * h);
    }
    const nv = pos.length / 3;
    if (nv < 4) continue;
    // per-vertex normal and rock attributes
    const nrm = new Float32Array(nv * 3), rock = new Float32Array(nv * 3);
    const e = 0.4 * h;
    for (let q = 0; q < nv; q++) {
      const px = pos[3 * q]!, py = pos[3 * q + 1]!, pz = pos[3 * q + 2]!;
      const fv = sampleF(px, py, pz);
      let dv = -1e9, best = -1;
      for (let p = 0; p < P.length; p += 4) { const d = P[p]! * px + P[p + 1]! * py + P[p + 2]! * pz + P[p + 3]!; if (d > dv) { dv = d; best = p; } }
      dv -= GROW;
      let gx = sampleF(px + e, py, pz) - sampleF(px - e, py, pz), gy = sampleF(px, py + e, pz) - sampleF(px, py - e, pz), gz = sampleF(px, py, pz + e) - sampleF(px, py, pz - e);
      const gl = Math.hypot(gx, gy, gz) || 1; gx /= gl; gy /= gl; gz /= gl;
      const w = best < 0 ? 0 : smoothstep(-0.3, 0.3, dv - fv);
      let nX = gx, nY = gy, nZ = gz;
      if (best >= 0) { nX += (P[best]! - gx) * w; nY += (P[best + 1]! - gy) * w; nZ += (P[best + 2]! - gz) * w; }
      const nl = Math.hypot(nX, nY, nZ) || 1;
      nrm[3 * q] = nX / nl; nrm[3 * q + 1] = nY / nl; nrm[3 * q + 2] = nZ / nl;
      rock[3 * q] = w; rock[3 * q + 1] = Math.max(0, -dv); rock[3 * q + 2] = Math.max(0, -fv);
    }
    // quads across every sign-changing grid edge, wound to face along the normal
    const idx: number[] = [];
    const tri = (a: number, b: number, c: number) => {
      if (a < 0 || b < 0 || c < 0 || a === b || b === c || a === c) return;
      const ux = pos[3 * b]! - pos[3 * a]!, uy = pos[3 * b + 1]! - pos[3 * a + 1]!, uz = pos[3 * b + 2]! - pos[3 * a + 2]!;
      const vx = pos[3 * c]! - pos[3 * a]!, vy = pos[3 * c + 1]! - pos[3 * a + 1]!, vz = pos[3 * c + 2]! - pos[3 * a + 2]!;
      const tx = uy * vz - uz * vy, ty = uz * vx - ux * vz, tz = ux * vy - uy * vx;
      const ndot = tx * (nrm[3 * a]! + nrm[3 * b]! + nrm[3 * c]!) + ty * (nrm[3 * a + 1]! + nrm[3 * b + 1]! + nrm[3 * c + 1]!) + tz * (nrm[3 * a + 2]! + nrm[3 * b + 2]! + nrm[3 * c + 2]!);
      if (ndot >= 0) idx.push(a, b, c); else idx.push(a, c, b);
    };
    const cell = (i: number, j: number, k: number) => (i < 0 || j < 0 || k < 0 || i >= cxN || j >= cyN || k >= czN ? -1 : vid[i + cxN * j + cxN * cyN * k]!);
    for (let k = 0; k < sz; k++) for (let j = 0; j < sy; j++) for (let i = 0; i < sx; i++) {
      const v0 = V[i + sx * j + sxy * k]!;
      if (i < sx - 1 && j > 0 && k > 0) {
        const v1 = V[i + 1 + sx * j + sxy * k]!;
        if ((v0 < 0) !== (v1 < 0)) { const a = cell(i, j - 1, k - 1), b = cell(i, j, k - 1), c = cell(i, j, k), d = cell(i, j - 1, k); tri(a, b, c); tri(a, c, d); }
      }
      if (j < sy - 1 && i > 0 && k > 0) {
        const v1 = V[i + sx * (j + 1) + sxy * k]!;
        if ((v0 < 0) !== (v1 < 0)) { const a = cell(i - 1, j, k - 1), b = cell(i, j, k - 1), c = cell(i, j, k), d = cell(i - 1, j, k); tri(a, b, c); tri(a, c, d); }
      }
      if (k < sz - 1 && i > 0 && j > 0) {
        const v1 = V[i + sx * j + sxy * (k + 1)]!;
        if ((v0 < 0) !== (v1 < 0)) { const a = cell(i - 1, j - 1, k), b = cell(i, j - 1, k), c = cell(i, j, k), d = cell(i - 1, j, k); tri(a, b, c); tri(a, c, d); }
      }
    }
    if (idx.length < 12) continue;
    tris += idx.length / 3;
    // centroid, radius and collider points
    const n = cnt[s]!;
    const c: [number, number, number] = n > 0 ? [cx[s]! / n, cy[s]! / n, cz[s]! / n] : [sx0, sy0, sz0];
    let rad = 0;
    for (let q = 0; q < nv; q++) rad = Math.max(rad, Math.hypot(pos[3 * q]! - c[0], pos[3 * q + 1]! - c[1], pos[3 * q + 2]! - c[2]));
    const stride = Math.max(1, Math.ceil(nv / 64)), hull: number[] = [];
    for (let q = 0; q < nv; q += stride) for (let a = 0; a < 3; a++) hull.push((pos[3 * q + a]! - c[a]!) * 0.94);
    chunks.push({
      pos: new Float32Array(pos), nrm, rock, idx: new Uint32Array(idx), c, vol: Math.max(n, 1) * h * h * h, rad, hull: new Float32Array(hull),
      nb: [], area: [], depth: Math.max(0, -sampleF(c[0], c[1], c[2])),
    });
    (chunks[chunks.length - 1] as Chunk & { _seed: number })._seed = s;
  }
  // remap neighbour lists from seed ids to chunk ids (cells too small to mesh are dropped)
  const map = new Int32Array(N).fill(-1);
  chunks.forEach((ch, i) => { map[(ch as Chunk & { _seed: number })._seed] = i; });
  chunks.forEach((ch) => {
    const s = (ch as Chunk & { _seed: number })._seed;
    nb[s]!.forEach((t, q) => { const m = map[t]!; if (m >= 0) { ch.nb.push(m); ch.area.push(area[s]![q]!); } });
    delete (ch as Partial<Chunk & { _seed: number }>)._seed;
  });
  const anchors: number[] = [];
  if (spec.coreR > 0) {
    chunks.forEach((ch, i) => { if (Math.hypot(ch.c[0] - spec.core[0], ch.c[1] - spec.core[1], ch.c[2] - spec.core[2]) < spec.coreR) anchors.push(i); });
    if (!anchors.length) {
      let best = 0, bd = Infinity;
      chunks.forEach((ch, i) => { const d = Math.hypot(ch.c[0] - spec.core[0], ch.c[1] - spec.core[1], ch.c[2] - spec.core[2]); if (d < bd) { bd = d; best = i; } });
      anchors.push(best);
    }
  }
  return { kind, seed, chunks, anchors, volume, h, bounds: spec.bounds, ms: Date.now() - T0, tris };
}

/** The transferable buffers of a fracture (to post it from a worker without copying). */
export function transferables(fr: Fracture): ArrayBuffer[] {
  const out: ArrayBuffer[] = [];
  for (const c of fr.chunks) out.push(c.pos.buffer as ArrayBuffer, c.nrm.buffer as ArrayBuffer, c.rock.buffer as ArrayBuffer, c.idx.buffer as ArrayBuffer, c.hull.buffer as ArrayBuffer);
  return out;
}
