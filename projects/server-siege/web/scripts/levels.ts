import { Sim } from '../src/simulation/engine';
import { scenarioById } from '../src/simulation/scenarios';
const cases: [string, any, any][] = [
  ['l1', {}, { appReplicas: 2 }],
  ['l2', {}, { lb: 'least' }],
  ['l3', {}, { dbTier: 'L', appReplicas: 5 }],
  ['l4', {}, { cacheOn: true, cacheSize: 20000 }],
  ['l5', {}, { appReplicas: 4, asMin: 4, asTarget: 0.6 }],
  ['million', {}, { appReplicas: 4, cacheOn: true, autoscale: true, asMin: 4, workers: 9 }],
];
for (const [id, bad, good] of cases) for (const [k, p] of [['default', bad], ['fix', good]] as const) {
  const s = new Sim(scenarioById(id), p); s.runTo(1e9); const r = s.report();
  console.log(id.padEnd(8), k.padEnd(8), `ok=${(r.success*100).toFixed(2)}% p95=${r.p95} peak=${r.peakCost} score=${r.score} ${r.passed ? 'PASS' : 'fail'}`);
}
