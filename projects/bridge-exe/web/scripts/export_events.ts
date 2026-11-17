// The reel's sound events, read from the running ?reel=1 page (so they are the frames' own events):
// span-slider steps, drag snaps, lens switches, the RUN press, and the arcade's Rapier bursts (break / impact / splash).
// -> ../audio/out/reel_events.json (read by scripts/audio/mix_bridge.py).   bun scripts/export_events.ts
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
await page.goto('http://localhost:54250/?reel=1', { waitUntil: 'networkidle' });
await page.waitForFunction(() => (window as any).__ready, null, { timeout: 120000 });
const ev = await page.evaluate(async () => {
  const S = (window as any).__bx.useStore, out: { t: number; kind: string; v?: unknown }[] = [];
  let prev: any = null;
  for (let f = 0; f <= 70 * 120; f++) {           // 120 Hz scan of the timeline state (no rendering needed)
    const t = f / 120; await (window as any).seekState(t);
    const s = S.getState(), cur = { span: s.design.params.span, dy: s.design.params.offsets.T4?.dy ?? 0, lens: s.lens, run: s.result?.runId ?? null, section: s.reelSection };
    if (prev) {
      if (cur.span !== prev.span) out.push({ t, kind: 'span', v: cur.span });
      if (cur.dy !== prev.dy) out.push({ t, kind: 'snap', v: cur.dy });
      if (cur.lens !== prev.lens) out.push({ t, kind: 'lens', v: cur.lens });
      if (cur.run !== prev.run && cur.run) out.push({ t, kind: 'run', v: cur.run });
    }
    prev = cur;
  }
  return out;
});
const info = await page.evaluate(() => (window as any).__reelInfo());
writeFileSync('../audio/out/reel_events.json', JSON.stringify({ events: ev, arcade: info.arcade, runs: { A: info.A.runId, B: info.B.runId } }, null, 1));
console.log(`${ev.length} timeline events, ${info.arcade.bursts.length} arcade bursts -> audio/out/reel_events.json`);
await browser.close();
