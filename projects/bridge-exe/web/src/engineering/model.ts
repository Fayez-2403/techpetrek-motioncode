// UI parameters -> validated solver input. The 3D view and the reel read the same TrussModel, so every member drawn
// on screen has the solver's ID.
import type { Material, TrussModel } from './types';
import { buildTruss, type TrussParams } from '../geometry/trussPresets';
import { buildLoads, type LoadCase } from './loadDistribution';

export const DEFAULT_LOADS: LoadCase = {
  deckUDL: 20e3,                                   // 20 kN/m per truss plane (illustrative)
  selfWeight: true,
  vehicle: { on: true, x: 24, P: 300e3 },          // 300 kN per plane (illustrative)
  points: [],
  scale: 1,
};

export function makeModel(p: TrussParams, material: Material, lc: LoadCase): TrussModel {
  const { nodes, members } = buildTruss(p);
  const base = { units: 'SI' as const, analysisType: 'linear-2d-truss' as const, nodes, members, material };
  return { ...base, loads: buildLoads(base, lc) };
}
