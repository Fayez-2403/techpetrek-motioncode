// Captures the top of each repo's real GitHub page (public/repos/<slug>.png) for the in-reel evidence panels.
import {createRequire} from 'node:module'; import os from 'node:os'; import path from 'node:path'; import fs from 'node:fs';
const {chromium} = createRequire(path.join(os.homedir(), '.claude/skills/teardown/x.js'))('playwright');
const R = JSON.parse(fs.readFileSync('docs/repos.json', 'utf8')).repos;
const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1280, height: 860}, deviceScaleFactor: 1.5, colorScheme: 'dark'});
for (const r of R) {
  const slug = r.repo.split('/')[1].toLowerCase().replace(/[^a-z0-9]/g, '');
  try { await p.goto(r.url, {waitUntil: 'domcontentloaded', timeout: 60000}); await p.waitForTimeout(1800);
    await p.screenshot({path: `public/repos/${slug}.png`}); console.log('ok', slug); } catch (e) { console.log('MISS', slug, e.message.slice(0, 60)); }
}
await b.close();
