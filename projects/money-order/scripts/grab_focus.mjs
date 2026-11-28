// Focused real screen grabs: the page scrolled so the key sentence sits at 42% height; its box saved for the highlight.
import {createRequire} from 'node:module'; import os from 'node:os'; import path from 'node:path'; import fs from 'node:fs';
const {chromium} = createRequire(path.join(os.homedir(), '.claude/skills/teardown/x.js'))('playwright');
const S = [
  ['paytm_head', 'https://paytm.com/support/paytm-travel/paytm-money-deducted-train-booking-failed', 'Money Deducted But No', 0.30],
  ['paytm_common', 'https://paytm.com/support/paytm-travel/paytm-money-deducted-train-booking-failed', "It's a common issue", 0.42],
  ['paytm_rebook', 'https://paytm.com/support/paytm-travel/paytm-money-deducted-train-booking-failed', 'Do not rebook', 0.45],
  ['gpay_progress', 'https://support.google.com/pay/india/answer/9494510?hl=en-GB', 'in progress, wait for five', 0.45],
  ['phonepe_head', 'https://business.phonepe.com/articles/upi-transaction-failed-but-money-deducted-complete-resolution-guide', 'UPI Transaction Failed but Money Deducted: Complete', 0.40],
];
const b = await chromium.launch(); const out = {};
for (const [id, url, phrase, at] of S) {
  const p = await b.newPage({viewport: {width: 412, height: 880}, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'});
  try {
    await p.goto(url, {waitUntil: 'domcontentloaded', timeout: 60000}); await p.waitForTimeout(6500);
    await p.evaluate(() => { for (const e of document.querySelectorAll('[class*="download" i], [class*="sticky" i], [class*="banner" i]')) { if (getComputedStyle(e).position === 'fixed') e.style.display = 'none'; } });
    const loc = p.getByText(phrase, {exact: false}).first();
    await loc.scrollIntoViewIfNeeded({timeout: 5000});
    let bx = await loc.boundingBox();
    await p.evaluate(([y, at]) => window.scrollBy(0, y - 880 * at), [bx.y, at]); await p.waitForTimeout(700);
    bx = await loc.boundingBox();
    await p.screenshot({path: `public/receipts/${id}.png`});
    out[id] = {url, phrase, box: bx, viewport: [412, 880], scale: 2.5, captured: new Date().toISOString()};
    console.log(id, JSON.stringify(bx));
  } catch (e) { out[id] = {url, error: e.message.slice(0, 120)}; console.log(id, 'FAILED', e.message.slice(0, 120)); }
  await p.close();
}
await b.close(); fs.writeFileSync('docs/grab_boxes.json', JSON.stringify(out, null, 1));
