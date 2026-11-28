// Real news pages: headline screenshot + page text (for the fact check) + a screenshot at the key sentence.
import {createRequire} from 'node:module'; import os from 'node:os'; import path from 'node:path'; import fs from 'node:fs';
const {chromium} = createRequire(path.join(os.homedir(), '.claude/skills/teardown/x.js'))('playwright');
const S = [
  ['bs_fssai', 'https://www.business-standard.com/industry/news/fssai-sanctions-prosecution-against-bisleri-over-unsafe-water-sample-126112200774_1.html', ['prosecution', 'bromate']],
  ['bs_dispute', 'https://www.business-standard.com/companies/news/bisleri-disputes-fssai-findings-after-prosecution-sanction-over-water-126112300240_1.html', ['12 micrograms', 'bromate', 'safe']],
  ['onmanorama', 'https://www.onmanorama.com/news/india/2026/11/23/fssai-flags-bisleri-water-as-unsafe-company-says-bromate-within-prescribed-limit.html', ['12 micrograms', 'bromate']],
  ['fpj', 'https://www.freepressjournal.in/business/maintain-stringent-quality-control-bisleri-responds-as-fssai-flags-goa-facilitys-drinking-water-sample-as-unsafe', ['Goa', 'bromate']],
  ['southmatters', 'https://www.southmatters.com/national/fssai-bisleri-prosecution-unsafe-water-sample-2026/', ['polynuclear', 'recall']],
  ['e4m', 'https://www.exchange4media.com/marketing-news/bisleri-says-packaged-water-is-safe-questions-fssai-test-findings-in-goa-sample-case-160572.html', ['PAH', 'Goa']],
];
const b = await chromium.launch(); const out = {};
for (const [id, url, snips] of S) {
  const p = await b.newPage({viewport: {width: 900, height: 1200}, deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'});
  try {
    await p.goto(url, {waitUntil: 'domcontentloaded', timeout: 60000}); await p.waitForTimeout(6000);
    const title = await p.title();
    const h1 = await p.evaluate(() => (document.querySelector('h1')?.innerText || '').trim());
    const text = (await p.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
    const hb = await p.evaluate(() => { const e = document.querySelector('h1'); if (!e) return null; e.scrollIntoView({block: 'center'}); const r = e.getBoundingClientRect(); return {x: r.x, y: r.y, width: r.width, height: r.height}; });
    await p.waitForTimeout(500); await p.screenshot({path: `public/receipts/${id}_head.png`});
    let hit = null;
    for (const s of snips) {
      const loc = p.getByText(s, {exact: false}).first();
      if (await loc.count()) { try { await loc.scrollIntoViewIfNeeded({timeout: 3000}); await p.evaluate(() => window.scrollBy(0, -250)); await p.waitForTimeout(500); const bx = await loc.boundingBox(); if (bx) { hit = {snippet: s, box: bx}; break; } } catch {} }
    }
    await p.screenshot({path: `public/receipts/${id}_body.png`});
    out[id] = {url, title, h1, headBox: hb, hit, captured: new Date().toISOString(), text: text.slice(0, 12000)};
    console.log(id, '|', h1.slice(0, 90), '|', hit ? hit.snippet : 'no snippet', '| chars', text.length);
  } catch (e) { out[id] = {url, error: e.message.slice(0, 120)}; console.log(id, 'FAILED', e.message.slice(0, 100)); }
  await p.close();
}
await b.close(); fs.writeFileSync('docs/sources.json', JSON.stringify(out, null, 1));
