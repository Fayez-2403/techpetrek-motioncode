import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome', args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto('http://localhost:54200/?reel=1&pdb=1&q=high');
await p.waitForFunction(() => (window as any).astra?.ready, null, { timeout: 300000 });
console.log(await p.evaluate(await Bun.file(process.argv[2]!).text()));
await b.close();
