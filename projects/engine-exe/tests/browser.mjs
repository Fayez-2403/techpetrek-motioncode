// Shared harness for the browser tests: opens a built page in the teardown kit's Chromium on the real GPU.
import {createRequire} from 'node:module';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const SKILL = process.env.TEARDOWN_SKILL || path.join(os.homedir(), '.claude', 'skills', 'teardown');
const req = createRequire(path.join(SKILL, 'x.js'));
export const {chromium} = req('playwright');
export const ARGS = [...(process.platform === 'win32' ? ['--use-angle=d3d11'] : []), '--force_high_performance_gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--hide-scrollbars'];

export async function open(file, {width = 1600, height = 900, capture = false, dpr = 1} = {}) {
  const browser = await chromium.launch({args: ARGS});
  const page = await browser.newPage({viewport: {width, height}, deviceScaleFactor: dpr});
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  if (capture) await page.addInitScript(() => (window.__CAPTURE = true));
  await page.goto(pathToFileURL(path.resolve(file)).href);
  return {browser, page, errors};
}
