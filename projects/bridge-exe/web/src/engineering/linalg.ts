// Dense Gaussian elimination with partial pivoting. Truss models here have < 200 DOF, so dense is exact and fast.
// A zero (relative) pivot means the stiffness matrix is singular: the model is a mechanism. We report which DOF failed
// instead of returning anything that looks like a result.
export type LinSolve = { ok: true; x: Float64Array } | { ok: false; dof: number; pivot: number };

export function solveDense(Ain: Float64Array[], bin: Float64Array, relTol = 1e-10): LinSolve {
  const n = bin.length;
  const A = Ain.map((r) => Float64Array.from(r)), b = Float64Array.from(bin);
  let scale = 0;
  for (let i = 0; i < n; i++) scale = Math.max(scale, Math.abs(A[i][i]));
  if (scale === 0) return { ok: false, dof: 0, pivot: 0 };
  for (let k = 0; k < n; k++) {
    let p = k, best = Math.abs(A[k][k]);
    for (let i = k + 1; i < n; i++) if (Math.abs(A[i][k]) > best) { best = Math.abs(A[i][k]); p = i; }
    if (best <= relTol * scale) return { ok: false, dof: k, pivot: best / scale }; // rows swap, columns don't: column k is unknown k
    if (p !== k) { [A[p], A[k]] = [A[k], A[p]]; [b[p], b[k]] = [b[k], b[p]]; }
    const akk = A[k][k];
    for (let i = k + 1; i < n; i++) {
      const f = A[i][k] / akk;
      if (f === 0) continue;
      const Ai = A[i], Ak = A[k];
      for (let j = k; j < n; j++) Ai[j] -= f * Ak[j];
      b[i] -= f * b[k];
    }
  }
  const x = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j];
    x[i] = s / A[i][i];
  }
  return { ok: true, x };
}

export const zeros = (n: number) => Array.from({ length: n }, () => new Float64Array(n));
