// Binance's Nov 3 report as a full-page screenshot + boxes of the sentences the magnifier lands on (css px).
//   -> ../public/pages/report.png, ../src/config/report.json
import { chromium } from 'playwright-core';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
if (!existsSync('../public/pages')) mkdirSync('../public/pages', { recursive: true });
const u = 'https://www.binance.bh/en/blog/community/3229153443759566763';
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await (await b.newContext({ locale: 'en-US', viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1.5, colorScheme: 'dark', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36' })).newPage();
await p.goto(u, { waitUntil: 'domcontentloaded', timeout: 60000 }); await p.waitForTimeout(8000);
await p.evaluate(() => document.querySelectorAll('[id*="cookie"], [class*="cookie"], [class*="consent"], [class*="Cookie"]').forEach((e) => e.remove()));
const want = { impacted: 'USD 6.34 billion', frozen: 'USD 2.85 billion', absorb: 'absorb the financial impact', title: 'Initial Findings and Response Update', date: '2026-11-03', interview: 'job-hunting platform', aitool: 'internal AI tool to gain control', btc: '18,270 BTC' };
const boxes = await p.evaluate((want) => {
  const out = {};
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n; while ((n = walker.nextNode())) {
    for (const [k, s] of Object.entries(want)) {
      if (out[k]) continue; const i = n.textContent.indexOf(s); if (i < 0) continue;
      const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + s.length);
      const q = r.getBoundingClientRect(); const pq = n.parentElement.getBoundingClientRect();
      out[k] = { x: q.x, y: q.y + window.scrollY, w: q.width, h: q.height, para: { x: pq.x, y: pq.y + window.scrollY, w: pq.width, h: pq.height }, text: n.parentElement.textContent.replace(/\s+/g, ' ').trim().slice(0, 300) };
    }
  }
  return out;
}, want);
const maxY = Math.max(...Object.values(boxes).map((x) => x.y)) + 600, H = Math.min(9000, Math.max(2000, Math.ceil(maxY)));
await p.setViewportSize({ width: 1280, height: H }); await p.waitForTimeout(1500);
await p.screenshot({ path: '../public/pages/report.png', clip: { x: 0, y: 0, width: 1280, height: H } });
writeFileSync('../src/config/report.json', JSON.stringify({ url: u, captured: '2026-11-04', H, boxes }, null, 1));
for (const [k, v] of Object.entries(boxes)) console.log(k, Math.round(v.y), '|', v.text.slice(0, 110));
await b.close();
