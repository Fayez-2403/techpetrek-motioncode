// Writes the cross-check fixtures: each model + the TypeScript solver's result -> ../solver/fixtures/*.json.
// python ../solver/crosscheck.py then re-solves every model with numpy (independent code) and PyNite 3.x.
//   bun scripts/export_fixtures.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { solveTruss } from '../src/engineering/truss';
import { makeModel, DEFAULT_LOADS } from '../src/engineering/model';
import { DEFAULT_PARAMS } from '../src/geometry/trussPresets';
import { MATERIALS } from '../src/engineering/materials';
import { solveBeam } from '../src/engineering/beam';

const OUT = '../solver/fixtures';
mkdirSync(OUT, { recursive: true });
const steel = MATERIALS[0];
const cases = {
  pratt_default: makeModel(DEFAULT_PARAMS, steel, DEFAULT_LOADS),
  howe_6p_vehicle: makeModel({ ...DEFAULT_PARAMS, topology: 'howe', panels: 6 }, steel, { ...DEFAULT_LOADS, vehicle: { on: true, x: 13.7, P: 250e3 } }),
  warren_10p_tall: makeModel({ ...DEFAULT_PARAMS, topology: 'warren', panels: 10, height: 8 }, steel, DEFAULT_LOADS),
  pratt_dragged: makeModel({ ...DEFAULT_PARAMS, offsets: { T3: { dx: 0.5, dy: 1.5 }, T4: { dx: 0, dy: 2.25 }, T5: { dx: -0.5, dy: 1.5 } } }, steel, DEFAULT_LOADS),
  pratt_aluminium: makeModel(DEFAULT_PARAMS, MATERIALS[1], { ...DEFAULT_LOADS, vehicle: { on: false, x: 0, P: 0 } }),
};
for (const [name, model] of Object.entries(cases)) {
  writeFileSync(`${OUT}/${name}.json`, JSON.stringify({ name, model, ts: solveTruss(model) }, null, 1));
}
const beam = { analysisType: 'linear-beam-euler-bernoulli' as const, L: 24, E: 200e9, I: 0.035, points: [{ x: 12, fy: -500e3 }], q: -40e3 };
writeFileSync(`${OUT}/beam_city.json`, JSON.stringify({ name: 'beam_city', model: beam, ts: solveBeam(beam) }, null, 1));
console.log(`wrote ${Object.keys(cases).length + 1} fixtures -> ${OUT}`);
