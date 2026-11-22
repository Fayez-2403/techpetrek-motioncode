// Captures each resource's real homepage: title + meta description (docs/sites.json), a screenshot (public/sites/<id>.png)
// and a 7 s smooth-scroll recording (public/sites/<id>.webm) for the in-reel evidence panels.
import {createRequire} from 'node:module'; import os from 'node:os'; import path from 'node:path'; import fs from 'node:fs';
const {chromium} = createRequire(path.join(os.homedir(), '.claude/skills/teardown/x.js'))('playwright');
const SITES = [
  ['uizze', 'https://uizze.com'], ['thinkui', 'https://thinkui.xyz'], ['mobbin', 'https://mobbin.com'], ['landbook', 'https://land-book.com'],
  ['godly', 'https://godly.website'], ['fps60', 'https://60fps.design'], ['shadcn', 'https://ui.shadcn.com'], ['reactbits', 'https://reactbits.dev'],
  ['magicui', 'https://magicui.design'], ['fontshare', 'https://www.fontshare.com'],
];
const only = process.argv.slice(2);
const out = 'public/sites'; const meta = fs.existsSync('docs/sites.json') ? JSON.parse(fs.readFileSync('docs/sites.json', 'utf8')) : {};
const b = await chromium.launch({args: ['--disable-blink-features=AutomationControlled']});
for (const [id, url] of SITES) {
  if (only.length && !only.includes(id)) continue;
  const ctx = await b.newContext({viewport: {width: 1280, height: 800}, deviceScaleFactor: 1, colorScheme: 'dark', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', recordVideo: {dir: path.join(out, '_v_' + id), size: {width: 1280, height: 800}}});
  const p = await ctx.newPage();
  try {
    await p.goto(url, {waitUntil: 'domcontentloaded', timeout: 60000}); await p.waitForTimeout(3500);
    for (const s of ['button:has-text("Accept")', 'button:has-text("Got it")', 'button:has-text("Allow all")']) await p.locator(s).first().click({timeout: 800}).catch(() => {});
    await p.screenshot({path: path.join(out, `${id}.png`)});
    const info = await p.evaluate(() => ({title: document.title, desc: document.querySelector('meta[name="description"]')?.content || document.querySelector('meta[property="og:description"]')?.content || '', h1: [...document.querySelectorAll('h1,h2')].slice(0, 4).map((e) => e.innerText.trim()).filter(Boolean), url: location.href}));
    // smooth scroll for ~6 s
    for (let i = 0; i < 60; i++) { await p.mouse.wheel(0, 28); await p.waitForTimeout(100); }
    meta[id] = {...info, captured: '2026-11-21'}; console.log('ok', id, '|', info.title.slice(0, 70), '|', info.desc.slice(0, 90));
  } catch (e) { console.log('MISS', id, e.message.slice(0, 80)); }
  await ctx.close();
  const vdir = path.join(out, '_v_' + id); const vf = fs.existsSync(vdir) ? fs.readdirSync(vdir).find((f) => f.endsWith('.webm')) : null;
  if (vf) { fs.renameSync(path.join(vdir, vf), path.join(out, `${id}.webm`)); fs.rmSync(vdir, {recursive: true, force: true}); }
}
await b.close();
fs.writeFileSync('docs/sites.json', JSON.stringify(meta, null, 1));
