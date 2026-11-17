// Simply supported Euler–Bernoulli beam, finite elements with cubic Hermite shape functions (v, θ per node).
// For point loads on nodes and a uniform load with consistent nodal loads, the nodal deflections are exact for this
// theory, so the classic cases PL³/48EI and 5wL⁴/384EI are reproduced to round-off. Assumptions: linear elastic,
// small deflection, plane sections, no shear deformation (fine for slender spans; deep beams need Timoshenko).
import { solveDense, zeros } from './linalg';
import { hashOf } from './hash';

export interface BeamModel {
  analysisType: 'linear-beam-euler-bernoulli';
  L: number;            // m
  E: number;            // Pa
  I: number;            // m⁴
  points: { x: number; fy: number }[];  // N, +up
  q: number;            // N/m over the full span, +up
  elements?: number;
}
export interface BeamSegment { x0: number; x1: number; V0: number; V1: number; M0: number; M1: number }
export interface BeamOk {
  runId: string; analysisType: 'linear-beam-euler-bernoulli'; status: 'solved'; inputsHash: string;
  solver: { name: string; version: string };
  xs: number[]; uy: number[]; theta: number[]; segments: BeamSegment[];
  reactions: { x: number; ry_N: number }[];
  metrics: { maxAbsDeflection_m: number; at_m: number; maxAbsMoment_Nm: number; maxAbsShear_N: number };
  diagnostics: { equilibriumY_N: number; warnings: string[] };
}
export interface BeamFail { runId: string; analysisType: 'linear-beam-euler-bernoulli'; status: 'invalid'; inputsHash: string; reasons: string[] }
export const BEAM_SOLVER = { name: 'bridge-exe Euler–Bernoulli beam FE (TypeScript)', version: '1.0.0' };

export function solveBeam(m: BeamModel, seq = 1): BeamOk | BeamFail {
  const inputsHash = hashOf(m), runId = `B${String(seq).padStart(3, '0')}-${inputsHash.slice(0, 8)}`;
  const reasons: string[] = [];
  if (!(m.L > 0)) reasons.push('Span must be positive');
  if (!(m.E > 0)) reasons.push('E must be positive');
  if (!(m.I > 0)) reasons.push('Second moment of area I must be positive');
  for (const p of m.points) if (p.x < 0 || p.x > m.L) reasons.push(`Point load at x = ${p.x} m lies outside the span`);
  if (reasons.length) return { runId, analysisType: m.analysisType, status: 'invalid', inputsHash, reasons };

  const n = m.elements ?? 64;
  const xs = [...new Set([...Array.from({ length: n + 1 }, (_, i) => (m.L * i) / n), ...m.points.map((p) => p.x)].map((x) => +x.toFixed(9)))].sort((a, b) => a - b);
  const nn = xs.length, nd = nn * 2, EI = m.E * m.I;
  const K = zeros(nd), F = new Float64Array(nd);
  const fe = (Le: number) => [m.q * Le / 2, m.q * Le * Le / 12, m.q * Le / 2, -m.q * Le * Le / 12];
  const ke = (Le: number) => {
    const c = EI / Le ** 3, L2 = Le * Le;
    return [[12, 6 * Le, -12, 6 * Le], [6 * Le, 4 * L2, -6 * Le, 2 * L2], [-12, -6 * Le, 12, -6 * Le], [6 * Le, 2 * L2, -6 * Le, 4 * L2]].map((r) => r.map((x) => x * c));
  };
  for (let e = 0; e < nn - 1; e++) {
    const Le = xs[e + 1] - xs[e], k = ke(Le), f = fe(Le), d = [2 * e, 2 * e + 1, 2 * e + 2, 2 * e + 3];
    for (let i = 0; i < 4; i++) { F[d[i]] += f[i]; for (let j = 0; j < 4; j++) K[d[i]][d[j]] += k[i][j]; }
  }
  for (const p of m.points) F[2 * xs.findIndex((x) => Math.abs(x - p.x) < 1e-8)] += p.fy;
  const fixed = new Set([0, 2 * (nn - 1)]);   // v = 0 at both ends; rotations free (pin + roller)
  const free = Array.from({ length: nd }, (_, i) => i).filter((d) => !fixed.has(d));
  const sol = solveDense(free.map((r) => Float64Array.from(free.map((c) => K[r][c]))), Float64Array.from(free.map((r) => F[r])));
  if (!sol.ok) return { runId, analysisType: m.analysisType, status: 'invalid', inputsHash, reasons: ['Beam stiffness matrix is singular'] };
  const u = new Float64Array(nd);
  free.forEach((d, i) => (u[d] = sol.x[i]));
  const reactions = [...fixed].map((d) => { let s = 0; for (let j = 0; j < nd; j++) s += K[d][j] * u[j]; return { x: xs[d / 2], ry_N: s - F[d] }; });

  const segments: BeamSegment[] = [];
  for (let e = 0; e < nn - 1; e++) {
    const Le = xs[e + 1] - xs[e], k = ke(Le), f = fe(Le), d = [u[2 * e], u[2 * e + 1], u[2 * e + 2], u[2 * e + 3]];
    const end = k.map((r, i) => r.reduce((s, kij, j) => s + kij * d[j], 0) - f[i]);
    segments.push({ x0: xs[e], x1: xs[e + 1], V0: end[0], V1: -end[2], M0: -end[1], M1: end[3] });
  }
  const uy = xs.map((_, i) => u[2 * i]), theta = xs.map((_, i) => u[2 * i + 1]);
  let iMax = 0; uy.forEach((v, i) => { if (Math.abs(v) > Math.abs(uy[iMax])) iMax = i; });
  const totalY = m.points.reduce((s, p) => s + p.fy, 0) + m.q * m.L + reactions.reduce((s, r) => s + r.ry_N, 0);
  return {
    runId, analysisType: m.analysisType, status: 'solved', inputsHash, solver: BEAM_SOLVER, xs, uy, theta, segments, reactions,
    metrics: {
      maxAbsDeflection_m: Math.abs(uy[iMax]), at_m: xs[iMax],
      maxAbsMoment_Nm: Math.max(...segments.flatMap((s) => [Math.abs(s.M0), Math.abs(s.M1)])),
      maxAbsShear_N: Math.max(...segments.flatMap((s) => [Math.abs(s.V0), Math.abs(s.V1)])),
    },
    diagnostics: { equilibriumY_N: totalY, warnings: [] },
  };
}

/** closed forms used by the tests and the Info panel */
export const closedForm = {
  centerPoint: (P: number, L: number, E: number, I: number) => ({ deflection: (P * L ** 3) / (48 * E * I), reaction: P / 2, moment: (P * L) / 4 }),
  udl: (w: number, L: number, E: number, I: number) => ({ deflection: (5 * w * L ** 4) / (384 * E * I), reaction: (w * L) / 2, moment: (w * L * L) / 8 }),
};
