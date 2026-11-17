#!/usr/bin/env node
// Builds ENGINE.EXE with the teardown kit: the live simulator and the tour film, each one offline HTML file.
// Copies the simulator to ./engine-live.html.   node scripts/build.mjs
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = process.env.TEARDOWN_SKILL || path.join(os.homedir(), '.claude', 'skills', 'teardown');
const build = path.join(SKILL, 'sims', 'build.mjs');
if (!fs.existsSync(build)) {
  console.error(`teardown skill not found at ${SKILL}\ninstall: npx skills add elvarofficial/teardown -g -a claude-code\nthen: cd "${SKILL}" && npm install && npx playwright install chromium`);
  process.exit(1);
}
execFileSync(process.execPath, [build, './sim/engine-live', './sim/engine-film'], {cwd: ROOT, stdio: 'inherit', env: {...process.env, TEARDOWN_OUT: path.join(ROOT, 'teardown-out')}});
fs.copyFileSync(path.join(ROOT, 'teardown-out', 'dist', 'engine-live.html'), path.join(ROOT, 'engine-live.html'));
console.log(`→ ${path.join(ROOT, 'engine-live.html')}`);
