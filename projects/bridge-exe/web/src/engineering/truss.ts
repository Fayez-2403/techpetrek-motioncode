// Linear elastic 2D truss, direct stiffness method. Each node has (ux, uy); each bar has E, A, L and carries axial
// force only. Assemble K, apply restraints, solve K_ff u_f = F_f, then recover axial forces, reactions and residuals.
// A singular K (a mechanism) fails loudly with the node and direction of the zero pivot.
import type { MemberResult, NodalLoad, SolveFail, SolveResult, TrussModel } from './types';
import { solveDense, zeros } from './linalg';
import { hashOf } from './hash';
import { validateTruss } from './validation';
import { utilization } from './educationalChecks';
import { G } from './units';

export const SOLVER = { name: 'bridge-exe direct-stiffness 2D truss (TypeScript)', version: '1.0.0' };

export function solveTruss(model: TrussModel, seq = 1): SolveResult {
  const inputsHash = hashOf(model);
  const runId = `R${String(seq).padStart(3, '0')}-${inputsHash.slice(0, 8)}`;
  const fail = (status: SolveFail['status'], reasons: string[]): SolveFail =>
    ({ runId, analysisType: 'linear-2d-truss', solver: SOLVER, inputsHash, status, reasons });

  const v = validateTruss(model);
  if (v.status !== 'ok') return fail(v.status, v.reasons);

  const { nodes, members, material: mat } = model;
  const idx = new Map(nodes.map((n, i) => [n.id, i]));
  const nd = nodes.length * 2;
  const K = zeros(nd), F = new Float64Array(nd);

  const geo = members.map((e) => {
    const a = nodes[idx.get(e.a)!], b = nodes[idx.get(e.b)!];
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
    return { e, ia: idx.get(e.a)!, ib: idx.get(e.b)!, c: dx / L, s: dy / L, L, k: (mat.E * e.A) / L };
  });
  for (const g of geo) {
    const { c, s, k } = g;
    const kk = [c * c, c * s, s * s].map((x) => x * k);
    const d = [2 * g.ia, 2 * g.ia + 1, 2 * g.ib, 2 * g.ib + 1];
    const ke = [
      [kk[0], kk[1], -kk[0], -kk[1]],
      [kk[1], kk[2], -kk[1], -kk[2]],
      [-kk[0], -kk[1], kk[0], kk[1]],
      [-kk[1], -kk[2], kk[1], kk[2]],
    ];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) K[d[i]][d[j]] += ke[i][j];
  }
  for (const l of model.loads) { const i = idx.get(l.node)!; F[2 * i] += l.fx; F[2 * i + 1] += l.fy; }

  const fixed = new Uint8Array(nd);
  nodes.forEach((n, i) => {
    if (n.support === 'pin') { fixed[2 * i] = 1; fixed[2 * i + 1] = 1; }
    if (n.support === 'roller') fixed[2 * i + 1] = 1;   // a horizontal roller: free in x, restrained in y
  });
  const free: number[] = [];
  for (let d = 0; d < nd; d++) if (!fixed[d]) free.push(d);
  const Kff = free.map((r) => Float64Array.from(free.map((c) => K[r][c])));
  const Ff = Float64Array.from(free.map((r) => F[r]));
  const sol = solveDense(Kff, Ff);
  if (!sol.ok) {
    const dof = free[sol.dof], n = nodes[Math.floor(dof / 2)];
    return fail('unstable', [
      `Stiffness matrix is singular: the model is a mechanism (zero pivot at node ${n.id}, ${dof % 2 ? 'uy' : 'ux'}).`,
      'Add a member or a support so every joint is held in both directions.',
    ]);
  }
  const u = new Float64Array(nd);
  free.forEach((d, i) => (u[d] = sol.x[i]));

  // residual of the solved system and recovered reactions
  let residual = 0;
  for (let i = 0; i < free.length; i++) {
    let s = 0; const r = free[i];
    for (let j = 0; j < free.length; j++) s += K[r][free[j]] * u[free[j]];
    residual = Math.max(residual, Math.abs(s - F[r]));
  }
  const reactions = nodes.flatMap((n, i) => {
    if (!n.support) return [];
    const row = (d: number) => { let s = 0; for (let j = 0; j < nd; j++) s += K[d][j] * u[j]; return s - F[d]; };
    return [{ nodeId: n.id, rx_N: fixed[2 * i] ? row(2 * i) : 0, ry_N: fixed[2 * i + 1] ? row(2 * i + 1) : 0 }];
  });

  let mass = 0;
  const memberResults: MemberResult[] = geo.map((g) => {
    const du = u[2 * g.ib] - u[2 * g.ia], dv = u[2 * g.ib + 1] - u[2 * g.ia + 1];
    const N = g.k * (g.c * du + g.s * dv);   // + tension, - compression
    mass += mat.rho * g.e.A * g.L;
    const { u: ut, governs } = utilization(N, g.e.A, g.L, mat.E, mat.fy);
    return { id: g.e.id, length_m: g.L, axial_N: N, stress_Pa: N / g.e.A, utilization: ut, governs };
  });

  // global equilibrium: applied loads + reactions = 0 (forces and moment about the origin)
  let ex = 0, ey = 0, em = 0;
  const all: NodalLoad[] = [...model.loads, ...reactions.map((r) => ({ node: r.nodeId, fx: r.rx_N, fy: r.ry_N, tag: 'reaction' }))];
  for (const l of all) { const n = nodes[idx.get(l.node)!]; ex += l.fx; ey += l.fy; em += n.x * l.fy - n.y * l.fx; }

  const nodeResults = nodes.map((n, i) => ({ id: n.id, ux_m: u[2 * i], uy_m: u[2 * i + 1] }));
  const maxD = nodeResults.reduce((b, n) => (Math.hypot(n.ux_m, n.uy_m) > b.v ? { v: Math.hypot(n.ux_m, n.uy_m), id: n.id } : b), { v: 0, id: '' });
  const maxN = memberResults.reduce((b, m) => (Math.abs(m.axial_N) > b.v ? { v: Math.abs(m.axial_N), id: m.id } : b), { v: 0, id: '' });
  const maxU = memberResults.reduce((b, m) => (m.utilization > b.v ? { v: m.utilization, id: m.id } : b), { v: 0, id: '' });
  const warnings = [...v.warnings];
  const loadScale = Math.max(1, ...model.loads.map((l) => Math.hypot(l.fx, l.fy)));
  if (Math.abs(ex) > 1e-6 * loadScale || Math.abs(ey) > 1e-6 * loadScale) warnings.push('Equilibrium residual above tolerance');
  return {
    runId, analysisType: 'linear-2d-truss', units: 'SI', solver: SOLVER, inputsHash, status: 'solved',
    nodes: nodeResults, members: memberResults, reactions,
    metrics: {
      maxAbsDisplacement_m: maxD.v, maxDisplacementNode: maxD.id, maxAbsAxial_N: maxN.v, maxAxialMember: maxN.id,
      maxUtilization: maxU.v, maxUtilizationMember: maxU.id, mass_kg: mass,
      totalLoadY_N: model.loads.reduce((s, l) => s + l.fy, 0),
    },
    diagnostics: { forceResidual_N: residual, equilibriumX_N: ex, equilibriumY_N: ey, equilibriumM_Nm: em, dof: free.length, warnings },
  };
}

/** self-weight of the members as nodal loads (half of each bar to each end), for the dead-load case */
export function selfWeightLoads(model: Pick<TrussModel, 'nodes' | 'members' | 'material'>): NodalLoad[] {
  const pos = new Map(model.nodes.map((n) => [n.id, n]));
  const acc = new Map<string, number>();
  for (const e of model.members) {
    const a = pos.get(e.a), b = pos.get(e.b);
    if (!a || !b) continue;
    const w = model.material.rho * e.A * Math.hypot(b.x - a.x, b.y - a.y) * G;
    acc.set(e.a, (acc.get(e.a) ?? 0) - w / 2); acc.set(e.b, (acc.get(e.b) ?? 0) - w / 2);
  }
  return [...acc].map(([node, fy]) => ({ node, fx: 0, fy, tag: 'self-weight' }));
}
