// Writes the reel's run A (design A, the real solve) as the sample deliverables:
//   ../output/BRIDGE_EXE_SAMPLE_MODEL.json   design + model + result (bridge-exe/model@1)
//   ../output/BRIDGE_EXE_ANALYSIS_REPORT.csv educational report with provenance
//   bun scripts/export_run.ts
import { writeFileSync } from 'node:fs';
import { makeModel } from '../src/engineering/model';
import { solveTruss } from '../src/engineering/truss';
import { modelJSON, reportCSV } from '../src/engineering/reports';
import type { SolveOk } from '../src/engineering/types';
import { DESIGN_A } from '../src/reel/timeline';

const model = makeModel(DESIGN_A.params, DESIGN_A.material, DESIGN_A.loads);
const r = solveTruss(model, 1) as SolveOk;
writeFileSync('../output/BRIDGE_EXE_SAMPLE_MODEL.json', modelJSON(DESIGN_A, model, r));
writeFileSync('../output/BRIDGE_EXE_ANALYSIS_REPORT.csv', reportCSV(model, r));
console.log(`run ${r.runId}  hash ${r.inputsHash}  members ${model.members.length}  max ${(r.metrics.maxAbsDisplacement_m * 1000).toFixed(1)} mm`);
