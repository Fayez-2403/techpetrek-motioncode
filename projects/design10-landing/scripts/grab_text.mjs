import {createRequire} from 'node:module'; import os from 'node:os'; import path from 'node:path'; import fs from 'node:fs';
const {chromium} = createRequire(path.join(os.homedir(), '.claude/skills/teardown/x.js'))('playwright');
const S = {uizze: 'https://uizze.com', thinkui: 'https://thinkui.xyz', mobbin: 'https://mobbin.com', landbook: 'https://land-book.com', godly: 'https://godly.website', fps60: 'https://60fps.design', shadcn: 'https://ui.shadcn.com', reactbits: 'https://reactbits.dev', magicui: 'https://magicui.design', fontshare: 'https://www.fontshare.com/about'};
const b = await chromium.launch(); const p = await b.newPage({userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'});
const out = {};
for (const [id, u] of Object.entries(S)) { try { await p.goto(u, {waitUntil: 'domcontentloaded', timeout: 60000}); await p.waitForTimeout(3000); out[id] = (await p.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 6000); } catch (e) { out[id] = 'MISS ' + e.message.slice(0, 60); } }
fs.writeFileSync('docs/sites_text.json', JSON.stringify(out, null, 1)); await b.close();
