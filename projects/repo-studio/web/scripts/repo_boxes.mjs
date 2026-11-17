// Exact element boxes on each captured repo page (same viewport as grab_repos.mjs), as uv on the screenshot:
// the star counter, the repo title, the About block, the README's first heading. -> ../src/config/repoBoxes.json
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';
const R = JSON.parse(readFileSync('../docs/repos.json', 'utf8')).repos.filter((r) => !r.repo.includes('reportlab'));
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1600 }, colorScheme: 'dark', deviceScaleFactor: 1.5, locale: 'en-US' });
const out = {};
for (const r of R) {
  const slug = r.repo.split('/')[1].toLowerCase().replace(/\W/g, '');
  const page = await ctx.newPage();
  await page.goto(r.url, { waitUntil: 'domcontentloaded', timeout: 60000 }); await page.waitForTimeout(3000);
  const b = await page.evaluate(() => {
    const box = (el) => { if (!el) return null; const q = el.getBoundingClientRect(); return q.width ? { x: q.x, y: q.y, w: q.width, h: q.height, text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80) } : null; };
    // the smallest visible element whose own text reads like "117k stars" (About sidebar) / "Star 117k" (header button)
    const all = [...document.querySelectorAll('a, span, button, strong')];
    const byText = (re) => all.filter((e) => re.test((e.textContent || '').replace(/\s+/g, ' ').trim())).map(box).filter(Boolean).sort((a, b) => a.w * a.h - b.w * b.h)[0] ?? null;
    return {
      starBtn: byText(/^Star\s*[\d.,]+k?$/i),
      starsAbout: byText(/^[\d.,]+k?\s*stars?$/i),
      title: box(document.querySelector('strong[itemprop="name"] a, #repo-title-component a, [itemprop="name"]')),
      about: box(document.querySelector('.BorderGrid-cell p.f4, .Layout-sidebar p')),
      readme: box(document.querySelector('article.markdown-body h1, article.markdown-body h2, article.markdown-body p')),
    };
  });
  const uv = (q) => q && { u: (q.x + q.w / 2) / 1280, v: 1 - (q.y + q.h / 2) / 1600, w: q.w / 1280, h: q.h / 1600, text: q.text };
  out[slug] = Object.fromEntries(Object.entries(b).map(([k, q]) => [k, uv(q)]));
  console.log(slug, JSON.stringify(out[slug].starsAbout?.text ?? out[slug].starBtn?.text), out[slug].readme?.text?.slice(0, 40));
  await page.close();
}
writeFileSync('../src/config/repoBoxes.json', JSON.stringify(out, null, 1));
await browser.close();
