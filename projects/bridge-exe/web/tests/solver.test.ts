// Solver and engineering-contract tests (bun test). Analytical and published references, plus the linear-model
// properties the prompt's test matrix asks for. Python cross-checks (numpy + PyNite) live in ../../solver.
import { describe, expect, test } from 'bun:test';
import { solveTruss } from '../src/engineering/truss';
import { solveBeam, closedForm } from '../src/engineering/beam';
import { makeModel, DEFAULT_LOADS } from '../src/engineering/model';
import { DEFAULT_PARAMS, buildTruss, type TrussParams } from '../src/geometry/trussPresets';
import { MATERIALS } from '../src/engineering/materials';
import { vehicleShares } from '../src/engineering/loadDistribution';
import { hashOf } from '../src/engineering/hash';
import * as U from '../src/engineering/units';
import type { SolveOk, TrussModel } from '../src/engineering/types';

const steel = MATERIALS[0];
const ok = (r: ReturnType<typeof solveTruss>) => { if (r.status !== 'solved') throw new Error(r.reasons.join('; ')); return r as SolveOk; };
const rel = (a: number, b: number) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-30);

describe('units', () => {
  test('N/kN, Pa/MPa/GPa, m/mm, m²/mm²', () => {
    expect(U.kN(1)).toBe(1000); expect(U.toKN(2500)).toBe(2.5);
    expect(U.MPa(250)).toBe(2.5e8); expect(U.toMPa(2.5e8)).toBe(250);
    expect(U.GPa(200)).toBe(2e11); expect(U.toGPa(2e11)).toBe(200);
    expect(U.mm(12)).toBeCloseTo(0.012, 15); expect(U.toMM(0.0125)).toBeCloseTo(12.5, 12);
    expect(U.mm2(12000)).toBeCloseTo(0.012, 15); expect(U.toMM2(0.006)).toBeCloseTo(6000, 9);
    expect(U.fmt.kN(-1234.5)).toBe('-1.2 kN'); expect(U.fmt.mm(0.02345)).toBe('23.4 mm');
  });
});

describe('beam (Euler–Bernoulli FE) vs closed form', () => {
  const L = 20, E = 200e9, I = 0.02;
  test('centre point load: R = P/2, δ = PL³/48EI, M = PL/4', () => {
    const P = 400e3, r = solveBeam({ analysisType: 'linear-beam-euler-bernoulli', L, E, I, points: [{ x: L / 2, fy: -P }], q: 0 });
    if (r.status !== 'solved') throw new Error('beam failed');
    const cf = closedForm.centerPoint(P, L, E, I);
    expect(rel(r.metrics.maxAbsDeflection_m, cf.deflection)).toBeLessThan(1e-9);
    for (const rx of r.reactions) expect(rel(rx.ry_N, cf.reaction)).toBeLessThan(1e-9);
    expect(rel(r.metrics.maxAbsMoment_Nm, cf.moment)).toBeLessThan(1e-9);
    expect(Math.abs(r.diagnostics.equilibriumY_N) / P).toBeLessThan(1e-9);
  });
  test('uniform load: R = wL/2, δ = 5wL⁴/384EI, M = wL²/8', () => {
    const w = 30e3, r = solveBeam({ analysisType: 'linear-beam-euler-bernoulli', L, E, I, points: [], q: -w });
    if (r.status !== 'solved') throw new Error('beam failed');
    const cf = closedForm.udl(w, L, E, I);
    expect(rel(r.metrics.maxAbsDeflection_m, cf.deflection)).toBeLessThan(1e-9);
    for (const rx of r.reactions) expect(rel(rx.ry_N, cf.reaction)).toBeLessThan(1e-9);
    expect(rel(r.metrics.maxAbsMoment_Nm, cf.moment)).toBeLessThan(1e-9);
  });
  test('stiffer beam deflects less; double load doubles deflection', () => {
    const run = (E2: number, P: number) => (solveBeam({ analysisType: 'linear-beam-euler-bernoulli', L, E: E2, I, points: [{ x: 7, fy: -P }], q: 0 }) as any).metrics.maxAbsDeflection_m;
    expect(run(2 * E, 1e5)).toBeLessThan(run(E, 1e5));
    expect(rel(run(E, 2e5), 2 * run(E, 1e5))).toBeLessThan(1e-12);
  });
});

describe('truss vs published / analytical references', () => {
  test('OpenSeesPy truss example (ndm 2): node 4 displacement 0.5301, -0.1779', () => {
    // https://openseespydoc.readthedocs.io/en/latest/src/truss.html  E = 3000, A = 10, 5, 5, load (100, -50) at node 4
    const m: TrussModel = {
      units: 'SI', analysisType: 'linear-2d-truss',
      nodes: [{ id: '1', x: 0, y: 0, support: 'pin', deck: false }, { id: '2', x: 144, y: 0, support: 'pin', deck: false },
        { id: '3', x: 168, y: 0, support: 'pin', deck: false }, { id: '4', x: 72, y: 96, support: null, deck: false }],
      members: [{ id: '1', a: '1', b: '4', group: 'diagonal', A: 10 }, { id: '2', a: '2', b: '4', group: 'diagonal', A: 5 }, { id: '3', a: '3', b: '4', group: 'diagonal', A: 5 }],
      material: { id: 'x', name: 'example', E: 3000, rho: 0, fy: 1e9, source: 'OpenSeesPy example' },
      loads: [{ node: '4', fx: 100, fy: -50, tag: 'example' }],
    };
    const r = ok(solveTruss(m)), n4 = r.nodes.find((n) => n.id === '4')!;
    expect(n4.ux_m).toBeCloseTo(0.530093, 5);
    expect(n4.uy_m).toBeCloseTo(-0.177894, 5);
    expect(Math.abs(r.diagnostics.equilibriumX_N)).toBeLessThan(1e-9);
    expect(Math.abs(r.diagnostics.equilibriumY_N)).toBeLessThan(1e-9);
  });
  test('Pratt under deck UDL: midspan bottom chord = M/h (method of sections)', () => {
    const q = 20e3, p = { ...DEFAULT_PARAMS }, w = p.span / p.panels;
    const r = ok(solveTruss(makeModel(p, steel, { ...DEFAULT_LOADS, deckUDL: q, selfWeight: false, vehicle: { on: false, x: 0, P: 0 } })));
    const x = 3 * w, M = (q * x * (p.span - x)) / 2;
    expect(rel(r.members.find((m) => m.id === 'BC4')!.axial_N, M / p.height)).toBeLessThan(1e-9);
    // symmetric reactions = half the total load
    for (const rx of r.reactions) expect(rel(rx.ry_N, (q * p.span) / 2)).toBeLessThan(1e-9);
  });
});

describe('truss linear-model properties', () => {
  const lc = DEFAULT_LOADS;
  test('equilibrium of every preset (forces and moment) within 1e-6 N', () => {
    for (const topology of ['pratt', 'howe', 'warren'] as const) for (const panels of [4, 6, 8, 10]) {
      const r = ok(solveTruss(makeModel({ ...DEFAULT_PARAMS, topology, panels }, steel, lc)));
      expect(Math.abs(r.diagnostics.equilibriumX_N)).toBeLessThan(1e-6);
      expect(Math.abs(r.diagnostics.equilibriumY_N)).toBeLessThan(1e-6);
      expect(Math.abs(r.diagnostics.equilibriumM_Nm)).toBeLessThan(1e-3);
      expect(r.diagnostics.forceResidual_N).toBeLessThan(1e-4);
    }
  });
  test('presets are statically determinate: m + r = 2j', () => {
    for (const topology of ['pratt', 'howe', 'warren'] as const) for (const panels of [2, 4, 6, 8, 12]) {
      const { nodes, members } = buildTruss({ ...DEFAULT_PARAMS, topology, panels });
      expect(members.length + 3).toBe(2 * nodes.length);
    }
  });
  test('higher E -> smaller deflection; doubling load doubles displacements and forces', () => {
    const base = ok(solveTruss(makeModel(DEFAULT_PARAMS, steel, { ...lc, selfWeight: false })));
    const stiff = ok(solveTruss(makeModel(DEFAULT_PARAMS, { ...steel, E: steel.E * 2 }, { ...lc, selfWeight: false })));
    const dbl = ok(solveTruss(makeModel(DEFAULT_PARAMS, steel, { ...lc, selfWeight: false, scale: 2 })));
    expect(stiff.metrics.maxAbsDisplacement_m).toBeLessThan(base.metrics.maxAbsDisplacement_m);
    expect(rel(dbl.metrics.maxAbsDisplacement_m, 2 * base.metrics.maxAbsDisplacement_m)).toBeLessThan(1e-10);
    expect(rel(dbl.metrics.maxAbsAxial_N, 2 * base.metrics.maxAbsAxial_N)).toBeLessThan(1e-10);
  });
  test('moving vehicle: results change with position; lever rule conserves P', () => {
    const { nodes } = buildTruss(DEFAULT_PARAMS);
    for (const x of [0, 3, 6, 13.7, 24, 47.9, 48]) expect(Math.abs(vehicleShares(nodes, x, 300e3).reduce((s, l) => s + l.fy, 0) + 300e3)).toBeLessThan(1e-6);
    const at = (x: number) => ok(solveTruss(makeModel(DEFAULT_PARAMS, steel, { ...lc, vehicle: { on: true, x, P: 300e3 } }))).metrics.maxAbsDisplacement_m;
    expect(at(24)).toBeGreaterThan(at(6));
  });
});

describe('failure modes return readable errors, never numbers', () => {
  test('missing diagonal -> unstable with the counting rule', () => {
    const r = solveTruss(makeModel({ ...DEFAULT_PARAMS, removed: ['D2'] }, steel, DEFAULT_LOADS));
    expect(r.status).toBe('unstable');
    if (r.status !== 'solved') expect(r.reasons.join(' ')).toContain('Counting rule');
    expect((r as any).nodes).toBeUndefined();
  });
  test('count satisfied but geometrically unstable -> singular stiffness (pivot check)', () => {
    // swap a diagonal for a redundant second bottom-chord bar: counts pass, but panel 2 becomes a mechanism
    const p: TrussParams = { ...DEFAULT_PARAMS, removed: ['D2'], added: [{ id: 'X1', a: 'B1', b: 'B3' }] };
    const r = solveTruss(makeModel(p, steel, DEFAULT_LOADS));
    expect(r.status).toBe('unstable');
    if (r.status !== 'solved') expect(r.reasons[0]).toContain('singular');
  });
  test('zero area, zero length, disconnected node, missing supports', () => {
    const base = makeModel(DEFAULT_PARAMS, steel, DEFAULT_LOADS);
    const zeroA = { ...base, members: base.members.map((m, i) => (i === 0 ? { ...m, A: 0 } : m)) };
    expect(solveTruss(zeroA).status).toBe('invalid');
    const zeroL = { ...base, nodes: base.nodes.map((n) => (n.id === 'T1' ? { ...n, x: 6, y: 0 } : n)) };
    const zl = solveTruss(zeroL); expect(zl.status).toBe('invalid');
    const lonely = { ...base, nodes: [...base.nodes, { id: 'Z', x: 3, y: 9, support: null, deck: false } as const] };
    expect(solveTruss(lonely).status).toBe('unstable');
    const noSup = { ...base, nodes: base.nodes.map((n) => ({ ...n, support: null })) };
    const ns = solveTruss(noSup); expect(ns.status).toBe('unstable');
    if (ns.status !== 'solved') expect(ns.reasons.join(' ')).toContain('support');
  });
});

describe('provenance', () => {
  test('input hash is stable and changes with any input', () => {
    const a = makeModel(DEFAULT_PARAMS, steel, DEFAULT_LOADS);
    expect(hashOf(a)).toBe(hashOf(JSON.parse(JSON.stringify(a))));
    expect(hashOf(a)).not.toBe(hashOf(makeModel({ ...DEFAULT_PARAMS, height: 6.25 }, steel, DEFAULT_LOADS)));
    const r1 = ok(solveTruss(a, 7)), r2 = ok(solveTruss(a, 7));
    expect(r1.runId).toBe(r2.runId); expect(r1.members).toEqual(r2.members);
  });
});
