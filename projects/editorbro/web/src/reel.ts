// Reel mode: a fixed-size canvas with window.seek(t) for frame capture (?w=1080&h=1920&t=1.5).
// ?play=1 plays it live from the rAF timestamp; the world itself stays a pure function of t.
import { createHighway } from './world/highway';

declare global {
  interface Window { seek: (t: number) => void; __ready?: boolean }
}

const q = new URLSearchParams(location.search);
const W = Number(q.get('w') ?? 1080), H = Number(q.get('h') ?? 1920);
const canvas = document.getElementById('c') as HTMLCanvasElement;
canvas.style.width = `${W}px`;
canvas.style.height = `${H}px`;

const world = await createHighway(canvas, W, H, { sign: q.get('sign') === 'cta' ? 'cta' : 'welcome', v3: q.get('v') === '3', pull: q.has('pull'),
  times: Object.fromEntries((['S', 'D0', 'D1'] as const).filter((k) => q.has(k)).map((k) => [k, Number(q.get(k))])) });
(window as unknown as { corners: () => number[][] }).corners = () => world.corners();
window.seek = (t: number) => world.render(t);
window.seek(Number(q.get('t') ?? 0));
window.__ready = true;

if (q.has('play')) {
  let t0: number | null = null;
  const loop = (ts: number) => {
    t0 ??= ts;
    window.seek(((ts - t0) / 1000) % 5);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
