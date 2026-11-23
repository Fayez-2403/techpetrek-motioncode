// Screenshots of the real source pages, scrolled to the proof line; the line's box is saved so the reel can highlight it.
import {createRequire} from 'node:module'; import os from 'node:os'; import path from 'node:path'; import fs from 'node:fs';
const {chromium} = createRequire(path.join(os.homedir(), '.claude/skills/teardown/x.js'))('playwright');
const SRC = [
  ['python_float', 'https://docs.python.org/3/tutorial/floatingpoint.html', ['0.1 + 0.1 + 0.1 == 0.3', '1/3', 'Floating-Point Arithmetic']],
  ['gmail_dots', 'https://support.google.com/mail/answer/7436150?hl=en', ["Dots don't matter", 'dots', 'Gmail']],
  ['owasp_hash', 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html', ['one-way function', 'Hashing', 'Password Storage']],
  ['tiktoken', 'https://github.com/openai/tiktoken', ['encoding_for_model', 'o200k_base', 'tiktoken']],
  ['wiki_2038', 'https://en.wikipedia.org/wiki/Year_2038_problem', ['03:14:07', '19 January 2038', 'Year 2038 problem']],
];
fs.mkdirSync('public/receipts', {recursive: true});
const b = await chromium.launch(); const out = {};
for (const [id, url, snips] of SRC) {
  const p = await b.newPage({viewport: {width: 900, height: 1200}, deviceScaleFactor: 2, colorScheme: 'light'});
  try {
    await p.goto(url, {waitUntil: 'domcontentloaded', timeout: 60000}); await p.waitForTimeout(4000);
    let hit = null;
    for (const s of snips) {
      const loc = p.getByText(s, {exact: false}).first();
      if (await loc.count()) { await loc.scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -320)); await p.waitForTimeout(600); const bx = await loc.boundingBox(); if (bx) { hit = {snippet: s, box: bx}; break; } }
    }
    await p.screenshot({path: `public/receipts/${id}.png`});
    const title = await p.title();
    const text = (await p.evaluate(() => document.body.innerText)).slice(0, 4000);
    out[id] = {url, title, hit, captured: new Date().toISOString(), text};
    console.log(id, '|', title, '|', hit ? hit.snippet + ' @ ' + Math.round(hit.box.y) : 'NO SNIPPET');
  } catch (e) { console.log(id, 'FAILED', e.message.slice(0, 120)); }
  await p.close();
}
await b.close();
fs.writeFileSync('docs/sources.json', JSON.stringify(out, null, 1));
