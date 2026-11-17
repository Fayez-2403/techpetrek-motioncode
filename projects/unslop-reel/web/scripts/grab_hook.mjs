// The hook's background pages: the unslop repo (with the boxes of its real star count and owner name) and Damir
// Sokolovsky's repositories tab.  -> ../public/pages/hook_repo.png, hook_profile.png, ../src/config/hook.json
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const ctx = await b.newContext({ locale: 'en-US', viewport: { width: 1280, height: 1800 }, deviceScaleFactor: 1.5, colorScheme: 'dark', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36' });
const out = { captured: new Date().toISOString() };
const box = (el) => { const q = el.getBoundingClientRect(); return { x: q.x, y: q.y + scrollY, w: q.width, h: q.height, text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 120) }; };
let p = await ctx.newPage();
await p.goto('https://github.com/heydamir/unslop', { waitUntil: 'domcontentloaded', timeout: 60000 }); await p.waitForTimeout(6000);
out.repo = await p.evaluate(`(() => { const box = ${box.toString()};
  const stars = [...document.querySelectorAll('a[href$="/stargazers"]')].filter((a) => a.getBoundingClientRect().width > 0);
  const owner = document.querySelector('a[rel="author"]') || [...document.querySelectorAll('a')].find((a) => a.textContent.trim() === 'heydamir' && a.getBoundingClientRect().width > 0);
  return { stars: stars.map(box), owner: owner && box(owner) };
})()`);
await p.screenshot({ path: '../public/pages/hook_repo.png', clip: { x: 0, y: 0, width: 1280, height: 1800 } });
await p.close();
p = await ctx.newPage();
await p.goto('https://github.com/heydamir?tab=repositories', { waitUntil: 'domcontentloaded', timeout: 60000 }); await p.waitForTimeout(6000);
out.profile = await p.evaluate(`(() => { const box = ${box.toString()};
  const name = document.querySelector('.vcard-fullname, [itemprop="name"]');
  const repos = [...document.querySelectorAll('#user-repositories-list li h3 a, a[itemprop="name codeRepository"]')].slice(0, 12).map(box);
  return { name: name && box(name), repos };
})()`);
await p.screenshot({ path: '../public/pages/hook_profile.png', clip: { x: 0, y: 0, width: 1280, height: 1800 } });
writeFileSync('../src/config/hook.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 1500));
await b.close();
