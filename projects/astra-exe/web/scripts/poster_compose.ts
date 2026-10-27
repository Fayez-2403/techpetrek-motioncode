#!/usr/bin/env bun
// Renders poster/poster.html (the cover: a real lab frame from scripts/poster.ts plus type) to PNG and JPG at 1080x1920,
// a 3:4 crop as the profile grid shows it, and prints each text block's box so overlaps and the grid crop can be checked.
//   bun scripts/poster_compose.ts [--out ../output] [--name cover_poster]
import { chromium } from 'playwright-core';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const argv = process.argv.slice(2);
const opt = (k: string, d: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1]! : d; };
const out = path.resolve(opt('out', '../output')), name = opt('name', 'cover_poster');
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.resolve('poster/poster.html')).href + (opt('q', '') ? `?${opt('q', '')}` : ''));
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode())); });
  const boxes = await page.evaluate(() => [...document.querySelectorAll('.hook > div, .callout, .lockup > div')].map((e) => {
    const r = e.getBoundingClientRect(); return { el: `${e.parentElement!.className}>${e.className}`, x0: Math.round(r.left), y0: Math.round(r.top), x1: Math.round(r.right), y1: Math.round(r.bottom), fits: r.left >= 24 && r.right <= 1056 && r.top >= 240 && r.bottom <= 1680 };
  }));
  for (const b of boxes) console.log(`${b.el.padEnd(22)} x ${b.x0}-${b.x1}  y ${b.y0}-${b.y1}  ${b.fits ? 'inside the 3:4 crop' : 'OUTSIDE the safe area'}`);
  const png = path.join(out, `${name}_1080x1920.png`);
  await page.screenshot({ path: png, type: 'png' });
  await page.screenshot({ path: path.join(out, `${name}_1080x1920.jpg`), type: 'jpeg', quality: 93 });
  await page.screenshot({ path: path.join(out, `${name}_grid_3x4.jpg`), type: 'jpeg', quality: 90, clip: { x: 0, y: 240, width: 1080, height: 1440 } });
  console.log(png);
} finally { await browser.close(); }
