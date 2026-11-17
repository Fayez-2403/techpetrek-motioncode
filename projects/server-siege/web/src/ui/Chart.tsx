// A small canvas line chart over sim.samples (it only ever draws simulator output).
import { useEffect, useRef } from 'react';

export interface Series { values: number[]; color: string; fill?: boolean; label: string }

export function Chart({ series, duration, now, max, target: refLine, height = 64, fmt }: {
  series: Series[]; duration: number; now: number; max?: number; target?: { v: number; color: string; label: string }; height?: number; fmt: (v: number) => string;
}) {
  const cv = useRef<HTMLCanvasElement>(null);
  const peak = max ?? Math.max(1, refLine?.v ?? 0, ...series.flatMap((s) => s.values)) * 1.1;
  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = c.clientWidth, H = c.clientHeight;
    if (c.width !== W * dpr || c.height !== H * dpr) { c.width = W * dpr; c.height = H * dpr; }
    const g = c.getContext('2d')!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    g.strokeStyle = 'rgba(140,170,220,0.10)'; g.lineWidth = 1;
    for (let k = 1; k < 4; k++) { const y = Math.round((H * k) / 4) + 0.5; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    const n = Math.max(1, Math.round(duration * 10));             // one sample per 100 ms
    const x = (i: number) => (i / n) * W, y = (v: number) => H - 2 - (Math.min(v, peak) / peak) * (H - 4);
    if (refLine) {
      g.setLineDash([4, 4]); g.strokeStyle = refLine.color; g.beginPath(); g.moveTo(0, y(refLine.v)); g.lineTo(W, y(refLine.v)); g.stroke(); g.setLineDash([]);
    }
    for (const s of series) {
      if (!s.values.length) continue;
      g.beginPath();
      s.values.forEach((v, i) => (i ? g.lineTo(x(i + 1), y(v)) : g.moveTo(x(1), y(v))));
      if (s.fill) {
        const grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, s.color + '55'); grad.addColorStop(1, s.color + '00');
        g.save(); g.lineTo(x(s.values.length), H); g.lineTo(x(1), H); g.closePath(); g.fillStyle = grad; g.fill(); g.restore();
        g.beginPath(); s.values.forEach((v, i) => (i ? g.lineTo(x(i + 1), y(v)) : g.moveTo(x(1), y(v))));
      }
      g.strokeStyle = s.color; g.lineWidth = 1.6; g.lineJoin = 'round'; g.stroke();
    }
    const cx = (now / duration) * W;                              // playhead
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(cx + 0.5, 0); g.lineTo(cx + 0.5, H); g.stroke();
  });
  return (
    <div className="chart">
      <canvas ref={cv} style={{ height }} />
      <div className="chart-legend">
        {series.map((s) => <span key={s.label}><i style={{ background: s.color }} />{s.label}</span>)}
        {refLine ? <span><i className="dash" style={{ borderColor: refLine.color }} />{refLine.label}</span> : null}
        <span className="scale">max {fmt(peak)}</span>
      </div>
    </div>
  );
}
