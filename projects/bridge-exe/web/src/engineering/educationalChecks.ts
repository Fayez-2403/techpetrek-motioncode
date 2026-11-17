// The educational utilisation proxy. Declared assumptions (also printed in the app's Info panel and
// docs/ENGINEERING_ASSUMPTIONS.md):
//   - every member is a thin circular hollow section with wall t = D/20, so A = πDt  ->  D = √(20A/π), I = πD⁴/160
//   - tension: utilisation = N / (fy·A)
//   - compression: utilisation = |N| / min(fy·A, Pcr) with the Euler load Pcr = π²EI/L² (pinned ends, K = 1)
// No resistance factors, imperfections, connections, local buckling, fatigue or code curves. NOT a code-compliance check.
export const PROXY_NOTE = 'educational proxy — not code compliance';
export const WALL_RATIO = 20;

export function chs(A: number) {
  const D = Math.sqrt((WALL_RATIO * A) / Math.PI), t = D / WALL_RATIO, I = (Math.PI * D ** 4) / (8 * WALL_RATIO);
  return { D, t, I };
}

export function utilization(N: number, A: number, L: number, E: number, fy: number): { u: number; governs: 'yield' | 'euler' | 'none' } {
  if (Math.abs(N) < 1e-9) return { u: 0, governs: 'none' };
  const Ny = fy * A;
  if (N > 0) return { u: N / Ny, governs: 'yield' };
  const Pcr = (Math.PI ** 2 * E * chs(A).I) / (L * L);
  return Pcr < Ny ? { u: -N / Pcr, governs: 'euler' } : { u: -N / Ny, governs: 'yield' };
}

/** a fictional teaching deflection target, written as span / n */
export const deflectionLimit = (span: number, n: number) => span / n;
