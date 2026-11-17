// v2 capture for the screen-review carousel: each book's OFFICIAL page as a full-page screenshot (1280 css wide,
// up to 7000 css tall, dpr 1.5) + the box of every visible text element (css px), so the cursor and the lime
// highlight boxes land on real words.  -> ../public/full/<id>.png, ../src/config/full.json
import { chromium } from 'playwright-core';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
const P = [
  ['lbdl', 'https://fleuret.org/francois/lbdl.html'], ['udl', 'https://udlbook.github.io/udlbook/'], ['dlbook', 'https://www.deeplearningbook.org/'],
  ['d2l', 'https://d2l.ai/'], ['mml', 'https://mml-book.github.io/'], ['rl', 'http://incompleteideas.net/book/the-book-2nd.html'],
  ['sre', 'https://sre.google/sre-book/table-of-contents/'], ['srw', 'https://sre.google/workbook/table-of-contents/'], ['bsrs', 'https://google.github.io/building-secure-and-reliable-systems/raw/toc.html'],
  ['progit', 'https://git-scm.com/book/en/v2'], ['ejs', 'https://eloquentjavascript.net/'], ['ostep', 'https://pages.cs.wisc.edu/~remzi/OSTEP/'],
];
if (!existsSync('../public/full')) mkdirSync('../public/full', { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1.5, locale: 'en-US', ignoreHTTPSErrors: true });
const out = {};
for (const [id, url] of P) {
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); await page.waitForTimeout(4500);
    await page.evaluate(() => document.querySelectorAll('[class*="cookie"], [id*="cookie"], [class*="consent"]').forEach((e) => e.remove()));
    const H = Math.min(7000, await page.evaluate(() => document.documentElement.scrollHeight));
    await page.setViewportSize({ width: 1280, height: H }); await page.waitForTimeout(1200);
    const els = await page.evaluate(() => [...document.querySelectorAll('a, li, h1, h2, h3, h4, p, td, span, strong, b, em, button')]
      .map((e) => { const q = e.getBoundingClientRect(); const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').replace(/\s+/g, ' ').trim();
        return { tag: e.tagName.toLowerCase(), x: Math.round(q.x), y: Math.round(q.y + window.scrollY), w: Math.round(q.width), h: Math.round(q.height), text: (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160), own: own.slice(0, 160), href: e.getAttribute('href') }; })
      .filter((q) => q.w > 4 && q.h > 4 && q.text));
    await page.screenshot({ path: `../public/full/${id}.png`, clip: { x: 0, y: 0, width: 1280, height: H } });
    out[id] = { url, title: await page.title(), H, els };
    console.log(id, H, els.length, '|', out[id].title);
  } catch (e) { console.log('FAIL', id, String(e).slice(0, 100)); }
  await page.close();
}
writeFileSync('../src/config/full.json', JSON.stringify({ captured: '2026-11-04', pages: out }));
await browser.close();
