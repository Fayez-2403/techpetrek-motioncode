// Runs the reel's sim (fixed seed, REEL_ACTIONS) headless and writes ../audio/out/reel_run.json: per-sample metrics, the
// event log and the final report. The mixer places its sim-event sounds from this file, and docs/factcheck.md cites it.
//   bun scripts/export_run.ts
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { Sim } from '../src/simulation/engine';
import { scenarioById } from '../src/simulation/scenarios';
import { REEL_ACTIONS } from '../src/cinematic/Timeline';

const s = new Sim(scenarioById('million'), {}, REEL_ACTIONS);
s.runTo(1e9);
const r = s.report();
if (!existsSync('../audio/out')) mkdirSync('../audio/out', { recursive: true });
writeFileSync('../audio/out/reel_run.json', JSON.stringify({
  _doc: 'The reel run of SERVER SIEGE: scenario "million", seed ' + s.p.seed + ', actions = REEL_ACTIONS (src/cinematic/Timeline.ts). Sim time t (s); reel time = t + 3.',
  seed: s.p.seed, actions: REEL_ACTIONS, report: r,
  samples: s.samples.map((x) => ({ t: x.t, arr: Math.round(x.arrRate), err: +x.errRate.toFixed(4), p95: x.p95, app: +x.appUtil.toFixed(3), db: +x.dbUtil.toFixed(3), hit: +x.hitRate.toFixed(3), up: x.up, boot: x.booting, jobQ: x.jobQ, cost: x.cost })),
  log: s.logLines,
}, null, 0));
console.log(`arrived ${r.totals.arrived} completed ${r.totals.completed} rejected ${r.totals.rejected} timedOut ${r.totals.timedOut} success ${(r.success * 100).toFixed(2)}% p95 ${r.p95} ms peak ${r.peakCost} cr/hr score ${r.score} ${r.passed ? 'PASS' : 'FAIL'}`);
for (const l of s.logLines) console.log(`${(l.t + 3).toFixed(1).padStart(5)}  ${l.text}`);
