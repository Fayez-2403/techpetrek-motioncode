// Character look-dev: a lineup of looks on one stage, shot close and wide, with the UI hidden.
//   bun scripts/look_test.ts [url] [out] [lineup json]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const url = process.argv[2] ?? 'http://localhost:54221/';
const out = process.argv[3] ?? 'test-assets/looks';
mkdirSync(out, { recursive: true });
const LINEUP = process.argv[4] ? JSON.parse(process.argv[4]) : [
  { outfit: 'suit', hair: 'side', facialHair: 'stubble', skin: '#dba57f', hairColor: '#4a2f1e', accessory: 'glasses' },
  { outfit: 'kurta', hair: 'quiff', facialHair: 'beard', skin: '#ad7350', hairColor: '#0e0c0b' },
  { outfit: 'lehenga', hair: 'long', skin: '#c98a64', hairColor: '#2a1c14', eyes: '#5a3a22' },
  { outfit: 'leather', hair: 'quiff', facialHair: 'goatee', skin: '#eabf9c', hairColor: '#0e0c0b', accessory: 'shades' },
  { outfit: 'sweater', hair: 'afro', skin: '#6f4631', hairColor: '#0e0c0b', build: 1.15 },
  { outfit: 'hoodie', hair: 'ponytail', skin: '#f6d7c0', hairColor: '#b88a52', eyes: '#3d5f8c', height: 0.94 },
];
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
const errs: string[] = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForFunction(() => (window as any).__ac?.engine.analysis, null, { timeout: 120000 });
await p.evaluate((L) => {
  const ac = (window as any).__ac, s = ac.getState();
  const base = s.performers[0].look;
  ac.setState({ world: 'stage', duoMode: 'battle', formation: 'line', performers: L.map((l: object, i: number) => ({ id: 'L' + i, faceId: null, style: 'hiphop', role: i ? 'support' : 'lead', look: { ...base, ...l } })) });
  document.querySelector('.app')!.classList.add('reel');
  ac.engine.seek(20); ac.engine.play();
}, LINEUP);
for (const [cam, wait] of [['wide', 2500], ['front', 1500], ['close', 1500]] as const) {
  await p.evaluate((c) => (window as any).__ac.setState({ camera: c }), cam);
  await p.waitForTimeout(wait);
  await p.screenshot({ path: `${out}/${cam}.png` });
}
console.log(JSON.stringify({ errors: errs.slice(0, 5) }));
await b.close();
