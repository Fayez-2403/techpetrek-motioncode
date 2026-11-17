// The 14 original characters as portraits (1080x1350 JPEG), rendered by the app: bun scripts/cast_portraits.ts [out dir]
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const out = process.argv[2] ?? '../aftercode-final/assets/cast'; mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await p.goto('http://localhost:54221/?reel=final', { waitUntil: 'networkidle' });
await p.waitForFunction(() => (window as any).__ac?.engine.analysis && (window as any).__reel, null, { timeout: 120000 });
await p.evaluate(() => (window as any).__reel.prepare());
const ids: string[] = await p.evaluate(() => (window as any).__reel.castIds);
const raf = () => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0)))));
for (const id of ids) {
  await p.evaluate((i) => (window as any).__reel.portrait(i), id); await p.waitForTimeout(1200); await raf();
  const b64: string = await p.evaluate(() => (document.querySelector('canvas') as HTMLCanvasElement).toDataURL('image/jpeg', 0.92).slice(23));
  writeFileSync(`${out}/${id}.jpg`, Buffer.from(b64, 'base64')); console.log(id);
}
await b.close();
