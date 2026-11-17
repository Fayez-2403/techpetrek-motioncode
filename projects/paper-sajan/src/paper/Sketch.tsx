// The sketch reveal: ink lines draw themselves in along a drawing-order map (the pen starts at the focus and spreads),
// then the watercolour wash floods in along a softer map. Per-frame canvas compositing, a pure function of
// (lineK, washK). Layers come from scripts/sketch_layers.py (public/art/<name>/).
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';

const W = 1080, H = 1920;
type Px = { lines: Uint8ClampedArray; order: Uint8ClampedArray; wash: Uint8ClampedArray; base: Uint8ClampedArray };
const CACHE: Record<string, Promise<Px>> = {};
function loadImg(src: string) { return new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
function pixels(i: HTMLImageElement) { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d')!; g.drawImage(i, 0, 0, W, H); return g.getImageData(0, 0, W, H).data; }
function load(name: string) {
  return (CACHE[name] ??= Promise.all(['lines.png', 'order.png', 'wash.png', 'base.jpg'].map((f) => loadImg(staticFile(`art/${name}/${f}`))))
    .then(([l, o, w, b]) => ({ lines: pixels(l), order: pixels(o), wash: pixels(w), base: pixels(b) })));
}

export const SketchReveal: React.FC<{ name: string; lineK: number; washK: number; paper?: [number, number, number] }> = ({ name, lineK, washK, paper = [20, 22, 50] }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [px, setPx] = useState<Px | null>(null);
  const [h] = useState(() => delayRender(`sketch ${name}`));
  useEffect(() => { load(name).then((p) => { setPx(p); }).catch((e) => { console.error(e); continueRender(h); }); }, [name, h]);
  useLayoutEffect(() => {
    if (!px || !ref.current) return;
    const g = ref.current.getContext('2d')!, img = g.createImageData(W, H), d = img.data;
    const { lines, order, wash, base } = px;
    const lk = lineK * 1.08 - 0.04, wk = washK * 1.25 - 0.12;      // thresholds; wash has a soft 0.12 edge
    for (let i = 0; i < d.length; i += 4) {
      // the paper
      let r = paper[0], gg = paper[1], b = paper[2];
      // the wash (the full illustration), soft-edged
      const wa = Math.min(1, Math.max(0, (wk - wash[i] / 255) / 0.12));
      if (wa > 0) { r += (base[i] - r) * wa; gg += (base[i + 1] - gg) * wa; b += (base[i + 2] - b) * wa; }
      // the ink, hard-edged pen front (drawn lines stay; the wash takes over their colour)
      const la = lines[i + 3] / 255;
      if (la > 0) {
        const on = Math.min(1, Math.max(0, (lk - order[i] / 255) / 0.015)) * la * (1 - wa * 0.85);
        if (on > 0) { r += (Math.max(lines[i], 200) - r) * on; gg += (Math.max(lines[i + 1], 196) - gg) * on; b += (Math.max(lines[i + 2], 186) - b) * on; }
      }
      d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    continueRender(h);
  }, [px, lineK, washK, paper, h]);
  return <canvas ref={ref} width={W} height={H} style={{ position: 'absolute', inset: 0, width: W, height: H }} />;
};
