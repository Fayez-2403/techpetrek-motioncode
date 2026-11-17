// Real, dated source grab for the "OPEN SOURCE TEMPLATE" slot: the repo page as GitHub serves it (light theme).
//   node scripts/receipt.mjs  -> public/receipts/github_repo_<date>.png (+ _readme.png: the README's top)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('../../aftercode/web/node_modules/playwright-core');
const date = new Date().toISOString().slice(0, 10);
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage({ viewport: { width: 1000, height: 1300 }, deviceScaleFactor: 2, colorScheme: 'light' });
await p.goto('https://github.com/Donchitos/Claude-Code-Game-Studios', { waitUntil: 'networkidle', timeout: 90000 });
await p.screenshot({ path: `public/receipts/github_repo_${date}.png`, clip: { x: 0, y: 0, width: 1000, height: 640 } });
const rd = await p.$('article.markdown-body');
if (rd) { await rd.scrollIntoViewIfNeeded(); await rd.screenshot({ path: `public/receipts/github_readme_${date}.png` }); }
console.log('ok', date);
await b.close();
