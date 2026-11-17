// Look-dev stills: the app (landscape, playing to a sim time) and the reel capture mode (portrait, seeked).
//   bun scripts/shots.ts app 1920x1080 <simSec> <out.png> [scenario] [cam]
//   bun scripts/shots.ts reel <t,t,t...> <outDir>
import { chromium } from 'playwright-core';
const [mode, a, b, c, d, e] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const URL = process.env.URL ?? 'http://localhost:54240/';
if (mode === 'reel') {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (er) => console.log('PAGEERROR', er.message)); page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text()));
  await page.goto(URL + '?reel=1', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => (window as any).__ready);
  await page.evaluate(() => (window as any).seek(0)); await page.waitForTimeout(2500);
  for (const t of a.split(',').map(Number)) {
    await page.evaluate((x) => (window as any).seek(x), t); await page.waitForTimeout(300);
    await page.screenshot({ path: `${b}/reel_${String(t).padStart(5, '0')}.png` });
    console.log(t, JSON.stringify(await page.evaluate(() => { const i = (window as any).__reelInfo(); return { now: i.now, err: i.last?.errRate, db: i.last?.dbUtil, app: i.last?.appUtil, rec: i.recovered }; })));
  }
} else {
  const [w, h] = a.split('x').map(Number);
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (er) => console.log('PAGEERROR', er.message)); page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text()));
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  if (d) await page.evaluate(async ([id, cam]) => { const m = await import('/src/store.ts'); m.useStore.getState().load(id); if (cam) m.useStore.getState().setCam(cam); }, [d, e ?? ''] as const);
  await page.evaluate(async (ms) => { const m = await import('/src/store.ts'); const s = m.useStore.getState(); s.setPicker(false); s.sim.runTo(ms); s.bump(); }, Number(b) * 1000);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: c });
}
await browser.close();
