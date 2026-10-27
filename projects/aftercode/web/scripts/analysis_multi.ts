// measure several tracks with the app's own analysis: bpm, first downbeats, sections (level, drop)
import { chromium } from 'playwright-core';
const files = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
await page.goto('http://localhost:54210/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => (window as any).__ac?.engine.analysis, null, { timeout: 120000 });
for (const f of files) {
  const a = await page.evaluate(async (f) => { const e = (window as any).__ac.engine; const x = await e.load('m:' + f, '/music/' + f + '.mp3');
    return { f, dur: +x.duration.toFixed(2), bpm: +x.bpm.toFixed(2), down: x.downbeats.map((d: number) => +d.toFixed(3)), sections: x.sections.map((s: any) => [+s.t0.toFixed(2), +s.level.toFixed(2), s.drop ? 1 : 0]) }; }, f);
  console.log(JSON.stringify(a));
}
await browser.close();
