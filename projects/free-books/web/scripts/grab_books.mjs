// Real screens of each book's OFFICIAL page (no login) + the box of the on-page text that says it is free,
// as uv on the screenshot (the magnifier lands there). -> ../public/pages/<slug>.png, ../src/config/pages.json
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const P = [
  ['sre', 'https://sre.google/books/', /^Read online$/i],
  ['lbdl', 'https://fleuret.org/francois/lbdl.html', /non-commercial Creative Commons/i],
  ['udl', 'https://udlbook.github.io/udlbook/', /download.*pdf|pdf.*download|full pdf/i],
  ['dlbook', 'https://www.deeplearningbook.org/', /available online for free/i],
  ['d2l', 'https://d2l.ai/', /500 universities/i],
  ['mml', 'https://mml-book.github.io/', /freely available/i],
  ['rl', 'http://incompleteideas.net/book/the-book-2nd.html', /^Full Pdf$/i],
  ['progit', 'https://git-scm.com/book/en/v2', /Creative Commons Attribution Non Commercial Share Alike/i],
  ['ejs', 'https://eloquentjavascript.net/', /Creative Commons attribution-noncommercial/i],
  ['ostep', 'https://pages.cs.wisc.edu/~remzi/OSTEP/', /always be free/i],
];
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1600 }, deviceScaleFactor: 1.5, locale: 'en-US', ignoreHTTPSErrors: true });
const out = {};
for (const [slug, url, re] of P) {
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); await page.waitForTimeout(4000);
    const hit = await page.evaluate((src) => {
      const re = new RegExp(src.s, src.f);
      const els = [...document.querySelectorAll('a, p, span, li, h1, h2, h3, b, strong, em, div, td')]
        .filter((e) => re.test((e.textContent || '').replace(/\s+/g, ' ').trim()))
        .map((e) => { const q = e.getBoundingClientRect(); return { x: q.x, y: q.y, w: q.width, h: q.height, text: (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 140) }; })
        .filter((q) => q.w > 0 && q.h > 0 && q.y < 1600 && q.y > -10).sort((a, b) => a.w * a.h - b.w * b.h);
      return els[0] ?? null;
    }, { s: re.source, f: re.flags });
    if (hit && hit.y > 1100) { await page.evaluate((y) => window.scrollTo(0, y - 500), hit.y); await page.waitForTimeout(800); hit.y -= await page.evaluate(() => window.scrollY); }
    await page.screenshot({ path: `../public/pages/${slug}.png` });
    out[slug] = { url, title: await page.title(), proof: hit && { u: (hit.x + hit.w / 2) / 1280, v: 1 - (hit.y + hit.h / 2) / 1600, w: hit.w / 1280, h: hit.h / 1600, text: hit.text } };
    console.log(slug, '|', out[slug].title, '|', hit ? hit.text.slice(0, 90) : 'NO PROOF FOUND');
  } catch (e) { console.log('FAIL', slug, String(e).slice(0, 100)); }
  await page.close();
}
writeFileSync('../src/config/pages.json', JSON.stringify({ captured: '2026-11-04', pages: out }, null, 1));
await browser.close();
