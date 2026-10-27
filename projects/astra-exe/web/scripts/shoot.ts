#!/usr/bin/env bun
// Screenshots of the live app in headless Chrome (GPU): bun scripts/shoot.ts [--size 1600x900] [--q medium]
//   [--steps "wait:2|fire|wait:3.5|shot:name"] [--out ../out/shots]
// Steps: wait:<s> (real seconds), fire, shot:<name>, eval:<js>, set:<json settings>, drag:<x0,y0,x1,y1,ms> (real mouse).
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const opt = (k: string, d: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1]! : d; };
const [W, H] = opt('size', '1600x900').split('x').map(Number) as [number, number];
const out = path.resolve(opt('out', '../out/shots'));
mkdirSync(out, { recursive: true });
const url = `${opt('url', 'http://localhost:54200')}/?pdb=1&q=${opt('q', 'medium')}${opt('extra', '')}`;
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: !argv.includes('--headed'),
  args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const logs: string[] = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
const t0 = Date.now();
await page.goto(url);
await page.waitForFunction(() => (window as any).astra?.ui?.get().loaded, null, { timeout: 180000 });
console.log(`loaded in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
for (const step of opt('steps', 'wait:2|shot:idle').split('|').filter(Boolean)) {
  const [k, ...rest] = step.split(':'); const v = rest.join(':');
  if (k === 'wait') await page.waitForTimeout(+v * 1000);
  else if (k === 'fire') await page.evaluate(() => (window as any).astra.stage.fire());
  else if (k === 'shot') { const f = path.join(out, `${v}.png`); await page.screenshot({ path: f }); console.log(f); }
  else if (k === 'eval') console.log(await page.evaluate(v));
  else if (k === 'canvas') {
    // the WebGL canvas itself (rendered now, read back with toDataURL), with the page's DOM UI composited over it
    const url: string = await page.evaluate(() => { const s = (window as any).astra.stage; s.updateViews(0, { camera: false }); s.render(); return s.renderer.domElement.toDataURL('image/png'); });
    const f = path.join(out, `${v}.png`); await Bun.write(f, Buffer.from(url.split(',')[1]!, 'base64')); console.log(f);
  }
  else if (k === 'evalfile') console.log(await page.evaluate(await Bun.file(v).text()));
  else if (k === 'set') await page.evaluate((s) => (window as any).astra.settings.set(JSON.parse(s)), v);
  else if (k === 'drag') {
    const [x0, y0, x1, y1, ms] = v.split(',').map(Number) as [number, number, number, number, number];
    await page.mouse.move(x0, y0); await page.mouse.down();
    const n = Math.max(2, Math.round(ms / 16));
    for (let i = 1; i <= n; i++) { await page.mouse.move(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n); await page.waitForTimeout(16); }
  } else if (k === 'up') await page.mouse.up();
}
if (logs.length) console.log('BROWSER LOG:\n' + logs.slice(0, 30).join('\n'));
await browser.close();
