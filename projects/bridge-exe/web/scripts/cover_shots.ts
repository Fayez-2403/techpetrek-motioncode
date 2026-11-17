// Cover plates (1080x1920) from the real app: ../public/cover/cad.png and ../public/cover/force.png.
//   bun scripts/cover_shots.ts
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';
const OUT = '../public/cover'; if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto('http://localhost:54250/?reel=1', { waitUntil: 'networkidle' });
await page.waitForFunction(() => (window as any).__ready, null, { timeout: 120000 });
await page.evaluate(() => (window as any).seek(30)); await page.waitForTimeout(2500);
for (const k of ['cad', 'force']) {
  await page.evaluate((x) => (window as any).coverShot(x), k); await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${k}.png` }); console.log('cover plate', k);
}
await browser.close();
