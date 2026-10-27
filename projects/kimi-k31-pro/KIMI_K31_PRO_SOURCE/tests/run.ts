// npm test [-- --live]   (--live also checks every quote against the live article and docs)
import { factualChecks } from './factualChecks';
import { assetChecks } from './assetChecks';
import { renderChecks } from './renderChecks';

export interface Check { name: string; ok: boolean; detail?: string }

(async () => {
  const live = process.argv.includes('--live');
  const groups: [string, Check[]][] = [['factual', await factualChecks(live)], ['assets', assetChecks()], ['render', renderChecks()]];
  let fail = 0;
  for (const [g, cs] of groups) {
    const bad = cs.filter((c) => !c.ok);
    fail += g === 'render' ? 0 : bad.length;
    console.log(`\n[${g}] ${cs.length - bad.length}/${cs.length} passed`);
    for (const c of bad) console.log(`  FAIL ${c.name}${c.detail ? `  — ${c.detail}` : ''}`);
  }
  console.log(fail ? `\n${fail} failing check(s)` : '\nall factual and asset checks passed (render checks are informational until the files exist)');
  process.exit(fail ? 1 : 0);
})();
