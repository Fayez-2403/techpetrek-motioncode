// Reads Binance's own Nov 3 report in a real browser (plain requests get a bot check) and saves its full text +
// a screenshot of the header, for docs/factcheck.md. No login.
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const u = 'https://www.binance.bh/en/blog/community/3229153443759566763';
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await (await b.newContext({ locale: 'en-US', viewport: { width: 1280, height: 1600 }, deviceScaleFactor: 1.5, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36' })).newPage();
await p.goto(u, { waitUntil: 'domcontentloaded', timeout: 60000 }); await p.waitForTimeout(8000);
writeFileSync('../assets/sources/binance_nov3_report.txt', `${u}\nretrieved 2026-11-04\n\n` + await p.evaluate(() => document.body.innerText));
await p.screenshot({ path: '../assets/sources/binance_nov3_report_top.png' });
console.log(await p.title());
await b.close();
