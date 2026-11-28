// Real screen grabs (mobile) of the cold-open pages + text for the fact check; key-sentence boxes saved.
import {createRequire} from 'node:module'; import os from 'node:os'; import path from 'node:path'; import fs from 'node:fs';
const {chromium} = createRequire(path.join(os.homedir(), '.claude/skills/teardown/x.js'))('playwright');
const S = [
  ['afaqs', 'https://www.afaqs.com/news/media/tata-ipl-2025-achieved-record-viewership-jiostar-9378356', ['55 million', 'peak concurrency']],
  ['socialsamosa', 'https://www.socialsamosa.com/industry-updates/tata-ipl-2025-highest-viewership-across-tv-digital-platforms-jiostar-9379318', ['55 million', 'peak concurrency']],
  ['eternal_blinkit', 'https://eternal.com/our-businesses/blinkit', ['10 minutes', 'minutes']],
  ['bt_darkstores', 'https://www.businesstoday.in/amp/magazine/deep-dive/story/why-start-ups-are-going-big-on-dark-stores-517751-2026-02-24', ['dark store', 'dark stores']],
  ['cf_cdn', 'https://www.cloudflare.com/learning/cdn/what-is-a-cdn/', ['geographically distributed', 'content delivery network']],
  ['mdn_cache', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control', ['max-age', 'max-age=']],
];
const b = await chromium.launch(); const out = {};
for (const [id, url, snips] of S) {
  const p = await b.newPage({viewport: {width: 412, height: 880}, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'});
  try {
    await p.goto(url, {waitUntil: 'domcontentloaded', timeout: 60000}); await p.waitForTimeout(7000);
    await p.evaluate(() => { for (const e of document.querySelectorAll('*')) { const s = getComputedStyle(e); if ((s.position === 'fixed' || s.position === 'sticky') && e.getBoundingClientRect().top > 300) e.style.display = 'none'; } });
    const title = await p.title();
    const text = (await p.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
    await p.screenshot({path: `public/receipts/${id}_top.png`});
    let hit = null;
    for (const s of snips) {
      const loc = p.getByText(s, {exact: false}).first();
      if (await loc.count()) { try { await loc.scrollIntoViewIfNeeded({timeout: 4000}); let bx = await loc.boundingBox();
        await p.evaluate(([y]) => window.scrollBy(0, y - 880 * 0.42), [bx.y]); await p.waitForTimeout(700);
        bx = await loc.boundingBox(); if (bx) { hit = {snippet: s, box: bx}; break; } } catch {} }
    }
    await p.screenshot({path: `public/receipts/${id}_hit.png`});
    out[id] = {url, title, hit, captured: new Date().toISOString(), text: text.slice(0, 20000)};
    console.log(id, '|', title.slice(0, 70), '|', hit ? hit.snippet + ' @' + Math.round(hit.box.y) : 'no snippet', '| chars', text.length);
  } catch (e) { out[id] = {url, error: e.message.slice(0, 120)}; console.log(id, 'FAILED', e.message.slice(0, 100)); }
  await p.close();
}
await b.close(); fs.writeFileSync('docs/sources.json', JSON.stringify(out, null, 1));
