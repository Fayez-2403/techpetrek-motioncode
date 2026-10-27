import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome', args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
const p = await b.newPage({ viewport: { width: +(process.argv[3] ?? 1600), height: +(process.argv[4] ?? 900) } });
await p.goto('http://localhost:54200/?q=' + (process.argv[2] ?? 'medium'));
await p.waitForFunction(() => (window as any).astra?.ui?.get().loaded, null, { timeout: 180000 });
await p.waitForTimeout(2000);
const r = await p.evaluate(async () => {
  const s = (window as any).astra.stage, R = s.renderer, gl = R.getContext(), C = s.pipe.composer, T: Record<string, number> = {};
  const wrap = (o: any, fn: string, name: string) => { const f = o[fn].bind(o); o[fn] = (...a: any[]) => { gl.finish(); const t = performance.now(); const v = f(...a); gl.finish(); T[name] = (T[name] ?? 0) + performance.now() - t; return v; }; };
  // shadow map pass inside the scene render: time it separately
  const sm = R.shadowMap, smr = sm.render.bind(sm); sm.render = (...a: any[]) => { gl.finish(); const t = performance.now(); smr(...a); gl.finish(); T['  shadow map'] = (T['  shadow map'] ?? 0) + performance.now() - t; };
  C.passes.forEach((ps: any, i: number) => wrap(ps, 'render', `${i} ${ps.constructor.name}`));
  let n = 0; const t0 = performance.now();
  await new Promise<void>((res) => { const f = () => { n++; performance.now() - t0 < 3000 ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); });
  for (const k in T) T[k] = +(T[k]! / n).toFixed(2);
  return { frames: n, canvas: `${R.domElement.width}x${R.domElement.height}`, ms: T };
});
console.log(process.argv[2], r.canvas, r.frames, 'frames'); for (const [k, v] of Object.entries(r.ms)) console.log(`  ${k.padEnd(26)} ${v} ms`);
await b.close();
