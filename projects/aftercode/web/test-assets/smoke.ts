import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
const url = process.argv[2] ?? 'http://localhost:54211/';
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: process.env.PHONE ? { width: 390, height: 844 } : { width: 1600, height: 900 }, deviceScaleFactor: 1 });
const errs: string[] = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('response', (r) => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url()}`); });
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForFunction(() => (window as any).__ac?.engine.analysis, null, { timeout: 120000 });
const img = 'data:image/jpeg;base64,' + readFileSync('test-assets/portrait.jpg').toString('base64');
const faces = await p.evaluate(async (img) => (window as any).__ac.addFace(img, 0, 'Smoke'), img);
const st = await p.evaluate(() => { const a = (window as any).__ac; return { track: a.engine.trackId, bpm: a.engine.analysis.bpm.toFixed(1), lib: document.querySelectorAll('.track').length, slots: document.querySelectorAll('.slot').length }; });
await p.waitForTimeout(1500); await p.screenshot({ path: 'test-assets/smoke.png' }); if (process.env.PHONE) { for (const t of ['Music', 'Worlds']) { await p.click('.mtabs button:has-text("' + t + '")'); await p.waitForTimeout(600); await p.screenshot({ path: 'test-assets/smoke_' + t + '.png' }); } await p.evaluate(() => (window as any).__ac.openFace(0)); await p.waitForTimeout(800); await p.screenshot({ path: 'test-assets/smoke_face.png' }); }
console.log(JSON.stringify({ url, faces, ...st, errors: errs.slice(0, 8) }));
await b.close();
