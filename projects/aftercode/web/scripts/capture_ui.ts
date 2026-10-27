// UI inserts for the reel, captured from the real desktop app (1920x1080, 60 fps, scripted state, song clock = r + O):
//  ui_face   (3.84 s)  FACE DANCE STUDIO modal: upload / selfie / default; "default avatar" picked at 2.9 s
//  ui_roster (1.92 s)  the roster filling up: dancers 01..05 added one after another
//  ui_app    (7.68 s)  the whole app running with a five-dancer crew; the world switches to Particle Galaxy at 3.84 s
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
const OUT = '../reel/clips'; if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
const O = 22.96, want = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto('http://localhost:54210/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => (window as any).__ac?.engine.analysis, null, { timeout: 120000 });
const raf = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0)))));
const CLIPS: { id: string; r0: number; dur: number; setup: string; step: string }[] = [
  { id: 'ui_face', r0: 5.36, dur: 3.84,
    setup: `ac.setState({ world: 'tunnel', camera: 'front', performers: [ac.getState().performers[0]], view: 'dance' }); ac.openFace(0);`,
    step: `if (r > 2.9) ac.openFace(null);` },
  { id: 'ui_roster', r0: 34.16, dur: 1.92,
    setup: `ac.openFace(null); ac.setState({ world: 'stage', camera: 'wide', crewMode: 'chorus', formation: 'line', performers: [ac.getState().performers[0]] });`,
    step: `const n = Math.min(5, 1 + Math.floor(r / 0.32)); const st = ac.getState(); if (st.performers.length < n) { const P = [...st.performers]; while (P.length < n) { const b = st.performers[0]; P.push({ ...b, id: 'r' + P.length, look: { ...b.look, outfit: ['hoodie','office','street','neon','chrome'][P.length % 5], skin: ['#c99a7a','#8d5a3c','#e2b896','#a8714f','#f0c9a8'][P.length % 5] } }); } ac.setState({ performers: P, selected: n - 1 }); }` },
  { id: 'ui_app', r0: 55.28, dur: 7.68,
    setup: `ac.setState({ world: 'stage', camera: 'director', crewMode: 'chorus', formation: 'dynamic', selected: 0 });`,
    step: `if (r > 3.84 && ac.getState().world !== 'galaxy') ac.setState({ world: 'galaxy' });` },
];
for (const c of CLIPS) {
  if (want.length && !want.includes(c.id)) continue;
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '60', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-threads', '2', '-crf', '14', '-pix_fmt', 'yuv420p', `${OUT}/${c.id}.mp4`], { stdio: ['pipe', 'inherit', 'inherit'] });
  await page.evaluate((s) => { const ac = (window as any).__ac; new Function('ac', s)(ac); }, c.setup);
  await page.evaluate((t) => { (window as any).__ac.engine.manual = t; }, c.r0 + O); await page.waitForTimeout(2500);
  for (let f = 0; f < Math.round(c.dur * 60); f++) {
    const r = f / 60;
    await page.evaluate(([s, rr, t]) => { const ac = (window as any).__ac; new Function('ac', 'r', s)(ac, rr); ac.engine.manual = t; }, [c.step, r, c.r0 + O + r] as const);
    await raf();
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise((res) => ff.stdin.once('drain', res));
  }
  ff.stdin.end(); await new Promise((res) => ff.on('close', res)); console.log('done', c.id);
}
await browser.close();
