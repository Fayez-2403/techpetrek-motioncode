// The real pages the reel's lens reads: the GitHub repo (README rendered by GitHub) and the Daily Launch snapshot,
// as full-page screenshots + boxes of the exact sentences (css px). Plus unslop's own two vibecoded example screens.
//   cd web && node scripts/grab_pages.mjs   -> ../public/pages/*.png, ../src/config/pages.json
import { chromium } from 'playwright-core';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
if (!existsSync('../public/pages')) mkdirSync('../public/pages', { recursive: true });
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const ctx = await b.newContext({ locale: 'en-US', viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1.5, colorScheme: 'dark', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36' });
const PAGES = {
  repo: { url: 'https://github.com/heydamir/unslop', want: {
    about: 'A Claude skill that turns vibecoded, AI-looking UI into a designed interface',
    what: 'unslop is a skill for Claude Code and Codex',
    slop: 'the purple gradients, glows, emoji labels, shouty copy and uneven spacing',
    stacks: 'Next.js, React, Vue, Svelte, Tailwind or plain HTML and CSS',
    direction: 'It audits the screen and proposes a direction before it edits anything',
    passes: 'Spacing, color, icons, copy, type, layout, details, visuals and motion, in that order',
    story: 'A square video under 10 seconds of your screen unslopping itself',
    needs: 'It needs Playwright and ffmpeg',
    paid: 'it shows the prompt and asks before every paid generation',
    license: 'as long as you credit Damir Sokolovsky',
    created: 'Created by Damir Sokolovsky',
  } },
  daily: { url: 'https://dailylaunch.org/p/unslop', want: { today: '+1.2k', rank: '18', launched: '29 October 2026', asof: '4 November 2026' } },
};
const out = { captured: '2026-11-04' };
for (const [id, P] of Object.entries(PAGES)) {
  const p = await ctx.newPage();
  await p.goto(P.url, { waitUntil: 'domcontentloaded', timeout: 60000 }); await p.waitForTimeout(6000);
  await p.evaluate(() => document.querySelectorAll('[id*="cookie"], [class*="cookie"], [class*="consent"], [class*="Cookie"]').forEach((e) => e.remove()));
  const measure = () => p.evaluate((want) => {
    const out = {};
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n; while ((n = walker.nextNode())) {
      for (const [k, s] of Object.entries(want)) {
        if (out[k]) continue; const i = n.textContent.indexOf(s); if (i < 0) continue;
        const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + s.length);
        const q = r.getBoundingClientRect(); if (q.width < 1) continue; const pq = n.parentElement.getBoundingClientRect();
        out[k] = { x: q.x, y: q.y + window.scrollY, w: q.width, h: q.height, para: { x: pq.x, y: pq.y + window.scrollY, w: pq.width, h: pq.height }, text: n.parentElement.textContent.replace(/\s+/g, ' ').trim().slice(0, 300) };
      }
    }
    return out;
  }, P.want);
  let boxes = await measure();
  const maxY = Math.max(0, ...Object.values(boxes).map((x) => x.y)) + 700, H = Math.min(9000, Math.max(1800, Math.ceil(maxY)));
  await p.setViewportSize({ width: 1280, height: H }); await p.waitForTimeout(1500);
  boxes = await measure();   // re-measure: some pages (Daily Launch) reflow when the viewport grows
  await p.screenshot({ path: `../public/pages/${id}.png`, clip: { x: 0, y: 0, width: 1280, height: H } });
  out[id] = { url: P.url, H, boxes, missing: Object.keys(P.want).filter((k) => !boxes[k]) };
  console.log(id, 'H', H, 'missing', out[id].missing.join(',') || '-');
  for (const [k, v] of Object.entries(boxes)) console.log('  ', k, Math.round(v.y), '|', v.text.slice(0, 100));
  await p.close();
}
// unslop's own vibecoded example screens (repo examples/), rendered as the reel's "before"
const ex = path.resolve('../../../tools/unslop/examples');
for (const f of ['dashboard', 'hero']) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 })).newPage();
  await p.goto('file:///' + path.join(ex, f + '.html').replaceAll('\\', '/')); await p.waitForTimeout(1500);
  await p.screenshot({ path: `../public/pages/example_${f}.png`, fullPage: false });
  console.log('example', f);
}
writeFileSync('../src/config/pages.json', JSON.stringify(out, null, 1));
await b.close();
