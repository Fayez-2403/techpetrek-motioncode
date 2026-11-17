// Real screens of the 16 repos (public pages, no login), captured 2026-11-03 for the reel's 3D panels.
//   node scripts/grab_repos.mjs   -> assets/screenshots/<slug>.png (1280x1600, dark theme) + _top.png (1280x720)
import { chromium } from 'playwright-core';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
const R = JSON.parse(readFileSync('../docs/repos.json', 'utf8')).repos.filter((r) => !r.repo.includes('reportlab'));
const pages = [...R.map((r) => ({ slug: r.repo.split('/')[1].toLowerCase().replace(/\W/g, ''), url: r.url })), { slug: 'reportlab', url: 'https://www.reportlab.com/opensource/' }];
const OUT = '../assets/screenshots'; if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1600 }, colorScheme: 'dark', deviceScaleFactor: 1.5, locale: 'en-US' });
for (const p of pages) {
  const page = await ctx.newPage();
  try {
    await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 60000 }); await page.waitForTimeout(3500);
    await page.evaluate(() => { for (const s of ['.js-cookie-consent-banner', '#cookie-consent-banner', '.flash-full', '[data-testid="cookie-banner"]', '.cookie-consent', '#onetrust-banner-sdk']) document.querySelectorAll(s).forEach((e) => e.remove()); });
    await page.screenshot({ path: `${OUT}/${p.slug}.png` });
    await page.screenshot({ path: `${OUT}/${p.slug}_top.png`, clip: { x: 0, y: 0, width: 1280, height: 720 } });
    console.log('ok', p.slug, await page.title());
  } catch (e) { console.log('FAIL', p.slug, String(e).slice(0, 120)); }
  await page.close();
}
await browser.close();
