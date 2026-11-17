// Element boxes (css px, viewport 1440x900) on unslop's vibecoded example, for the reel's red slop tags.
//   -> ../src/config/example.json
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
const f = 'file:///' + path.resolve('../../../tools/unslop/examples/dashboard.html').split(path.sep).join('/');
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(f); await p.waitForTimeout(2500);
const boxes = await p.evaluate(() => {
  const r = (el) => { const q = el.getBoundingClientRect(); return { x: q.x, y: q.y, w: q.width, h: q.height }; };
  const byText = (sel, s) => [...document.querySelectorAll(sel)].find((e) => e.textContent.trim().startsWith(s));
  return {
    window: r(document.querySelector('body > div')), aside: r(document.querySelector('aside')), main: r(document.querySelector('main')),
    headline: r(document.querySelector('h1')), navlabel: r(byText('p', 'NAVIGATION')), overview: r(document.querySelector('nav a')),
    emojiNav: r(document.querySelector('nav')), logo: r(document.querySelector('aside > div > div')), newBadge: r(byText('span', 'New')),
    paid: r(document.querySelectorAll('.glass-card')[0]), bars: r(document.querySelector('.items-end')), change: r(byText('p', '🔥')),
    search: r(byText('span', 'Search anything')), plans: r(byText('p', '💳')),
  };
});
writeFileSync('../src/config/example.json', JSON.stringify({ viewport: [1440, 900], dpr: 1.5, boxes }, null, 1));
console.log(Object.entries(boxes).map(([k, v]) => `${k} ${Math.round(v.x)},${Math.round(v.y)} ${Math.round(v.w)}x${Math.round(v.h)}`).join('\n'));
await b.close();
