#!/usr/bin/env bun
// Capture the reel from the app's cinematic mode (?reel=1): every frame is window.astra.seek(t) on the real
// simulation, then a screenshot of the page (WebGL + the real DOM controls + the overlay), piped to ffmpeg.
//   stills: bun scripts/capture.ts stills --t 0,0.5,3.2 [--out ../out/reel_stills]
//   video:  bun scripts/capture.ts video [--from 0] [--to 65] [--fps 60] [--crf 16] [--out ../out/reel_seg.mp4]
//   cues:   bun scripts/capture.ts cues --out ../../output/cues.json     (every sim event in reel time, for the mix)
//   det:    bun scripts/capture.ts det --t 0.3,17,38.6,51.6               (same frame in any seek order? prints hashes)
// Uses the dev server at --url (default http://localhost:54200).
import { chromium, type Browser, type Page } from 'playwright-core';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const argv = process.argv.slice(2);
const mode = argv[0] ?? 'stills';
const opt = (k: string, d: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1]! : d; };
const URL = `${opt('url', 'http://localhost:54200')}/?reel=1&pdb=1&q=${opt('q', 'high')}`;
const wingetFF = path.join(process.env.LOCALAPPDATA ?? '', 'Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/ffmpeg.exe');
const FFMPEG = existsSync(wingetFF) ? wingetFF : 'ffmpeg';

// a WebGL context that failed (shader programs that do not validate, or a lost context) still screenshots fine: the page
// shows the DOM and the overlay over a blank canvas. Under memory pressure this happened mid-render, so it is checked.
const glBroken = (logs: string[]) => logs.some((l) => /WebGLProgram: Shader Error|VALIDATE_STATUS false|context lost/i.test(l));
async function open(): Promise<{ browser: Browser; page: Page; logs: string[] }> {
  for (let attempt = 1; ; attempt++) {
    const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true,
      args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--force-device-scale-factor=1'] });
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    const logs: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error' || /context lost/i.test(m.text())) logs.push(`[${m.type()}] ${m.text()}`); });
    page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
    const t0 = Date.now();
    await page.goto(URL);
    await page.waitForFunction(() => (window as any).astra?.ready || (window as any).astra?.ui?.get().status.some((s: string) => s.startsWith('error')), null, { timeout: 300000 });
    const err = await page.evaluate(() => (window as any).astra?.ui?.get().status.find((s: string) => s.startsWith('error')));
    if (err) throw new Error(`reel failed to load: ${err}\n${logs.join('\n')}`);
    if (glBroken(logs)) {
      await browser.close().catch(() => {});
      if (attempt >= 3) throw new Error(`WebGL failed on load 3 times:\n${logs.slice(0, 8).join('\n')}`);
      console.error(`WebGL failed on load (attempt ${attempt}); relaunching the browser`); continue;
    }
    console.log(`reel ready in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    return { browser, page, logs };
  }
}
const seek = (page: Page, t: number) => page.evaluate(async (t) => (window as any).astra.seek(t), t);
const shot = (page: Page) => page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1920 } });

const { browser, page, logs } = await open();
try {
  if (mode === 'stills') {
    const out = path.resolve(opt('out', '../out/reel_stills')); mkdirSync(out, { recursive: true });
    for (const t of opt('t', '0').split(',').map(Number)) {
      const a = Date.now(); const r = await seek(page, t); const png = await shot(page);
      const f = path.join(out, `r_${t.toFixed(2).padStart(6, '0')}.png`); await Bun.write(f, png);
      console.log(`${f}  ${r.shot} sim ${r.simT.toFixed(3)} s  (${Date.now() - a} ms)`);
    }
  } else if (mode === 'video') {
    // frames -> ffmpeg (node child_process: real backpressure); every seek and screenshot has a deadline, and on a hang the
    // browser is relaunched and the same frame is rendered again (seek(t) is pure, so nothing else changes)
    const fps = +opt('fps', '60'), from = +opt('from', '0'), to = +opt('to', '65'), out = path.resolve(opt('out', '../out/reel_seg.mp4'));
    mkdirSync(path.dirname(out), { recursive: true });
    const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(fps), '-i', 'pipe:0',
      '-vf', 'scale=out_color_matrix=bt709:out_range=tv,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709', '-c:v', 'libx264', '-preset', opt('preset', 'slow'), '-crf', opt('crf', '16'),
      '-pix_fmt', 'yuv420p', '-tune', 'film', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise<number>((r) => ff.on('close', (c) => r(c ?? 1)));
    const deadline = <T,>(p: Promise<T>, ms: number, what: string) => Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`${what} timed out after ${ms} ms`)), ms))]);
    let cur = { browser, page, logs };
    const f0 = Math.round(from * fps), f1 = Math.round(to * fps), T0 = Date.now();
    for (let n = f0; n < f1; n++) {
      let png: Buffer | null = null;
      for (let attempt = 0; attempt < 4 && !png; attempt++) {
        try {
          await deadline(seek(cur.page, n / fps), 120000, `seek frame ${n}`);
          png = await deadline(shot(cur.page), 60000, `screenshot frame ${n}`) as Buffer;
        } catch (e) {
          console.error(`
${String(e)}; relaunching the browser (attempt ${attempt + 1})`);
          await cur.browser.close().catch(() => {});
          cur = await open();
        }
      }
      if (!png) throw new Error(`frame ${n} failed 4 times`);
      if (!ff.stdin!.write(png)) await once(ff.stdin!, 'drain');
      if ((n - f0) % 30 === 29 || n === f1 - 1) { const el = (Date.now() - T0) / 1000, k = n - f0 + 1; console.error(`${k}/${f1 - f0} frames  ${(k / el).toFixed(2)} fps  eta ${((f1 - f0 - k) / (k / el) / 60).toFixed(1)} min`); }
    }
    ff.stdin!.end();
    const code = await done; if (code !== 0) throw new Error(`ffmpeg exited ${code}`);
    console.log(`wrote ${out} (${f1 - f0} frames in ${((Date.now() - T0) / 1000).toFixed(0)} s)`);
    if (cur.browser !== browser) await cur.browser.close().catch(() => {});
  } else if (mode === 'frames') {
    // frames to disk (no encoder running beside the browser: the laptop's commit memory is tight); encode afterwards
    const fps = +opt('fps', '60'), from = +opt('from', '0'), to = +opt('to', '65'), dir = path.resolve(opt('dir', '../out/frames'));
    mkdirSync(dir, { recursive: true });
    const deadline = <T,>(p: Promise<T>, ms: number, what: string) => Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`${what} timed out after ${ms} ms`)), ms))]);
    let cur = { browser, page, logs };
    const f0 = Math.round(from * fps), f1 = Math.round(to * fps), T0 = Date.now();
    for (let n = f0; n < f1; n++) {
      const file = path.join(dir, `f_${String(n).padStart(5, '0')}.png`);
      if (existsSync(file)) continue;   // resumable
      let ok = false;
      for (let attempt = 0; attempt < 4 && !ok; attempt++) {
        try {
          await deadline(seek(cur.page, n / fps), 120000, `seek frame ${n}`);
          const png = await deadline(shot(cur.page), 60000, `screenshot frame ${n}`);
          if (glBroken(cur.logs)) throw new Error(`WebGL failed at frame ${n}: ${cur.logs.find((l) => glBroken([l]))}`);
          await Bun.write(file, png); ok = true;
        } catch (e) {
          console.error(`
${String(e)}; relaunching the browser (attempt ${attempt + 1})`);
          await cur.browser.close().catch(() => {});
          cur = await open();
        }
      }
      if (!ok) throw new Error(`frame ${n} failed 4 times`);
      if ((n - f0) % 60 === 59 || n === f1 - 1) { const el = (Date.now() - T0) / 1000, k = n - f0 + 1; console.error(`${k}/${f1 - f0} frames  ${(k / el).toFixed(2)} fps  eta ${((f1 - f0 - k) / (k / el) / 60).toFixed(1)} min`); }
    }
    console.log(`frames ${f0}..${f1 - 1} in ${dir} (${((Date.now() - T0) / 1000).toFixed(0)} s)`);
    if (cur.browser !== browser) await cur.browser.close().catch(() => {});
  } else if (mode === 'cues') {
    const out = path.resolve(opt('out', '../output/cues.json')); mkdirSync(path.dirname(out), { recursive: true });
    const cues = await page.evaluate(async () => (window as any).astra.cues());
    const sb = await page.evaluate(() => (window as any).astra.storyboard());
    await Bun.write(out, JSON.stringify({ cues, storyboard: sb }, null, 1));
    console.log(`wrote ${out}: ${cues.length} cues`);
  } else if (mode === 'det') {
    const ts = opt('t', '0.3,17,38.6,51.6').split(',').map(Number);
    const hash = async (t: number) => { await seek(page, t); return createHash('sha256').update(await shot(page)).digest('hex').slice(0, 16); };
    const fwd: Record<string, string> = {}, rev: Record<string, string> = {};
    for (const t of ts) fwd[t] = await hash(t);
    for (const t of [...ts].reverse()) rev[t] = await hash(t);
    for (const t of ts) console.log(`t=${t}: forward ${fwd[t]}  reversed ${rev[t]}  ${fwd[t] === rev[t] ? 'SAME' : 'DIFFERENT'}`);
  }
  if (logs.length) console.log('BROWSER LOG:\n' + logs.slice(0, 30).join('\n'));
} finally { await browser.close(); }
