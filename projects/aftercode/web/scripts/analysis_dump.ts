// print the in-app analysis of the current track (Realizer by default)
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto('http://localhost:54210/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => (window as any).__ac?.engine.analysis, null, { timeout: 120000 });
const a = await page.evaluate(() => { const x = (window as any).__ac.engine.analysis; const per = (t0: number, t1: number) => { const o = []; for (let i = 0; i < x.beats.length; i++) { const b = x.beats[i]; if (b < t0 || b > t1) continue; let e = 0, k = 0; for (let f = Math.round(b * 100); f < Math.round(b * 100) + 48; f++) { e += x.rms[f] + x.bass[f]; k++; } o.push(b.toFixed(2) + ':' + (e / k).toFixed(2)); } return o.join(' '); }; return { ret: per(52, 66), ret2: per(40, 50), bpm: x.bpm, first: x.beats.slice(0, 6), down: x.downbeats.slice(0, 6), n: x.beats.length, sections: x.sections.map((s: any) => [s.t0.toFixed(1), s.level.toFixed(2), s.drop]) }; });
console.log(JSON.stringify(a, null, 0));
await browser.close();
