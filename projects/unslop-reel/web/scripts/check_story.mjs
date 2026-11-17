// Stills of the story file at step 0 (the original rebuilt) and at the last step, to check it before story.mjs renders it.
import { chromium } from 'playwright-core';
import path from 'node:path';
const f = 'file:///' + path.resolve('../unslop-story/story.html').split(path.sep).join('/');
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await (await b.newContext({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 1 })).newPage();
await p.goto(f); await p.waitForTimeout(2500);
await p.screenshot({ path: '../out/story_s0.png' });
await p.evaluate(() => document.documentElement.classList.add('s1', 's2', 's3', 's4'));
await p.waitForTimeout(800);
await p.screenshot({ path: '../out/story_s4.png' });
await b.close();
