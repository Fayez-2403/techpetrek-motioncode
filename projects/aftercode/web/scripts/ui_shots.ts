// UI fit check: screenshots of the app at the common laptop / desktop viewports (100 % zoom), plus overflow numbers.
//   bun scripts/ui_shots.ts [url] [outDir]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const url = process.argv[2] ?? 'http://localhost:54221/';
const out = process.argv[3] ?? 'test-assets/ui';
mkdirSync(out, { recursive: true });
const SIZES = [[1280, 720], [1366, 768], [1536, 864], [1920, 1080], [390, 844]];
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const [w, h] of SIZES) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => (window as any).__ac?.engine.analysis, null, { timeout: 120000 });
  await p.waitForTimeout(1200);
  // anything clipped: elements whose content is wider/taller than their box, or that run off the viewport
  const report = await p.evaluate(() => {
    const vw = innerWidth, vh = innerHeight, bad: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('header, header *, footer, footer *, aside, .rail, .rail *')) {
      const r = el.getBoundingClientRect(); if (!r.width || getComputedStyle(el).visibility === 'hidden') continue;
      const name = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '') + (el.textContent ? ` "${el.textContent.trim().slice(0, 18)}"` : '');
      if (r.right > vw + 1 || r.bottom > vh + 1) bad.push(`off-screen ${name} (${Math.round(r.right)}x${Math.round(r.bottom)})`);
      const cs = getComputedStyle(el);
      if ((cs.overflowX === 'hidden' || cs.overflowX === 'auto') && el.scrollWidth > el.clientWidth + 2 && el.children.length) bad.push(`clipped-x ${name} (${el.scrollWidth} > ${el.clientWidth})`);
    }
    return bad.slice(0, 12);
  });
  await p.screenshot({ path: `${out}/${w}x${h}.png` });
  console.log(`${w}x${h}`, report.length ? '\n  ' + report.join('\n  ') : 'ok');
  await p.close();
}
await b.close();
