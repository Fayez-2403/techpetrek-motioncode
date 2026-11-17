// An origami paper crane in flat folded facets (marigold shades, the film's one colour), side view facing right.
// flap: 0..1 wing phase (0 = up, 0.5 = down). Pure function of its props.
import React from 'react';

const P = (pts: number[][]) => pts.map((p) => p.join(',')).join(' ');
export const Crane: React.FC<{ x: number; y: number; s: number; flap: number; rot?: number; glow?: number; op?: number }> = ({ x, y, s, flap, rot = 0, glow = 0, op = 1 }) => {
  const w = Math.cos(flap * Math.PI * 2);              // +1 up .. -1 down
  const near = 0.15 + 0.85 * w, far = 0.25 + 0.75 * w;  // wing scaleY about the body line
  return (
    <svg width={260 * s} height={220 * s} viewBox="0 0 260 220" style={{ position: 'absolute', left: x - 130 * s, top: y - 120 * s, opacity: op, transform: `rotate(${rot}deg)`, overflow: 'visible',
      filter: `drop-shadow(0 ${6 * s}px ${10 * s}px rgba(0,0,0,.35)) drop-shadow(0 0 ${glow * 24}px rgba(255,180,80,${0.6 * glow}))` }}>
      {/* far wing (behind), darker */}
      <g transform={`translate(0,120) scale(1,${far}) translate(0,-120)`}><polygon points={P([[96, 120], [158, 120], [150, 30]])} fill="#b9640f" /><polygon points={P([[96, 120], [150, 30], [124, 120]])} fill="#a3560b" /></g>
      {/* tail and neck */}
      <polygon points={P([[92, 124], [30, 52], [40, 50], [108, 126]])} fill="#e3901f" />
      <polygon points={P([[30, 52], [40, 50], [36, 62]])} fill="#c97914" />
      <polygon points={P([[150, 124], [214, 46], [222, 50], [166, 128]])} fill="#f0a033" />
      <polygon points={P([[214, 46], [240, 58], [222, 50]])} fill="#c97914" />
      {/* body: two folded halves */}
      <polygon points={P([[78, 122], [128, 104], [178, 122], [128, 140]])} fill="#f6b14a" />
      <polygon points={P([[78, 122], [128, 140], [178, 122]])} fill="#d98419" />
      {/* near wing (front), lit */}
      <g transform={`translate(0,118) scale(1,${near}) translate(0,-118)`}><polygon points={P([[90, 118], [166, 118], [126, 10]])} fill="#ffc46a" /><polygon points={P([[126, 10], [166, 118], [140, 118]])} fill="#eda03b" /></g>
    </svg>
  );
};
