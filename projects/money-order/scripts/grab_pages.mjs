// Real screen grabs (mobile viewport) of official help pages + page text for the fact check.
import {createRequire} from 'node:module'; import os from 'node:os'; import path from 'node:path'; import fs from 'node:fs';
const {chromium} = createRequire(path.join(os.homedir(), '.claude/skills/teardown/x.js'))('playwright');
const S = [
  ['gpay', 'https://support.google.com/pay/india/answer/9494510?hl=en-GB', ['five working days', 'in progress'], true],
  ['paytm_train', 'https://paytm.com/support/paytm-travel/paytm-money-deducted-train-booking-failed', ['deducted', 'refund'], true],
  ['phonepe_biz', 'https://business.phonepe.com/articles/upi-transaction-failed-but-money-deducted-complete-resolution-guide', ['money deducted', 'deducted'], true],
  ['bhim', 'https://www.bhimupi.org.in/faqs', ['debited', 'pending'], true],
  ['stripe', 'https://docs.stripe.com/api/idempotent_requests', ['safely retrying', 'Idempotency-Key'], false],
];
const b = await chromium.launch(); const out = {};
for (const [id, url, snips, mobile] of S) {
  const p = await b.newPage(mobile ? {viewport: {width: 412, height: 880}, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true,
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'}
    : {viewport: {width: 1000, height: 1200}, deviceScaleFactor: 2,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'});
  try {
    await p.goto(url, {waitUntil: 'domcontentloaded', timeout: 60000}); await p.waitForTimeout(7000);
    const title = await p.title();
    const text = (await p.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
    await p.screenshot({path: `public/receipts/${id}_top.png`});
    let hit = null;
    for (const s of snips) {
      const loc = p.getByText(s, {exact: false}).first();
      if (await loc.count()) { try { await loc.scrollIntoViewIfNeeded({timeout: 3000}); await p.evaluate(() => window.scrollBy(0, -200)); await p.waitForTimeout(600);
        const bx = await loc.boundingBox(); if (bx) { hit = {snippet: s, box: bx}; break; } } catch {} }
    }
    await p.screenshot({path: `public/receipts/${id}_hit.png`});
    out[id] = {url, title, hit, captured: new Date().toISOString(), text: text.slice(0, 15000)};
    console.log(id, '|', title.slice(0, 70), '|', hit ? hit.snippet : 'no snippet', '| chars', text.length);
  } catch (e) { out[id] = {url, error: e.message.slice(0, 120)}; console.log(id, 'FAILED', e.message.slice(0, 100)); }
  await p.close();
}
await b.close(); fs.writeFileSync('docs/sources2.json', JSON.stringify(out, null, 1));
