// UI states check: a cast preset loaded with both panels open, then both collapsed (the [ and ] keys), at a laptop size.
//   bun scripts/ui_states.ts [url] [out] [w] [h]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const url = process.argv[2] ?? 'http://localhost:54221/', out = process.argv[3] ?? 'test-assets/ui_states';
const W = +(process.argv[4] ?? 1366), H = +(process.argv[5] ?? 768);
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForFunction(() => (window as any).__ac?.engine.analysis, null, { timeout: 120000 });
await p.click('.presets button:has-text("NETA vs NETA")');
await p.waitForTimeout(2500);
await p.screenshot({ path: `${out}/cast_open.png` });
await p.click('.b-tabs button:has-text("Face & hair")'); await p.waitForTimeout(400);
await p.screenshot({ path: `${out}/cast_face_tab.png` });
await p.keyboard.press('['); await p.keyboard.press(']'); await p.waitForTimeout(1200);
await p.screenshot({ path: `${out}/collapsed.png` });
await p.keyboard.press('['); await p.keyboard.press(']'); await p.waitForTimeout(300);
await b.close();
