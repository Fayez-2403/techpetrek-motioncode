// The gorge heightfield (an original, fictional landscape). The river runs along z under the bridge, which spans x.
// Near the bridge the rims sit at |x| = 15 m on a plateau at y ≈ -2 m, so every supported span (32-72 m) lands its
// bearings on rock. Far away the plateau rises into ridges. Pure function of (x, z).
import { fbm, ridge, smooth } from './noise';

export const RIVER_Y = -64;
export const RIM = 15;
export const PLATEAU_Y = -2;

/** the canyon centre line meanders, but stays straight within ±25 m of the bridge */
export const canyonCenter = (z: number) => (14 * Math.sin(z * 0.011) + 8 * Math.sin(z * 0.023 + 1.3)) * smooth(25, 120, Math.abs(z));

export function heightAt(x: number, z: number): number {
  const c = canyonCenter(z), d = Math.abs(x - c);
  const rim = RIM + 4 * fbm(z * 0.02, 3.1, 3) * smooth(30, 90, Math.abs(z));
  const floorW = 9 + 2 * fbm(z * 0.03, 7.7, 2);
  // the wall: stepped strata between the river floor and the rim
  let y: number;
  if (d < floorW) y = RIVER_Y - 1.5 + 0.6 * fbm(x * 0.2, z * 0.2, 2);
  else if (d < rim) {
    const t = (d - floorW) / (rim - floorW);
    const steps = t + 0.035 * Math.sin(t * 40 + fbm(z * 0.05, x * 0.05, 2) * 3);
    y = RIVER_Y + (PLATEAU_Y - RIVER_Y) * Math.pow(Math.min(1, Math.max(0, steps)), 0.42);
    y += 2.2 * fbm(x * 0.15, z * 0.15, 3) * (1 - Math.abs(2 * t - 1));
  } else {
    const far = d - rim;
    y = PLATEAU_Y + 1.2 * fbm(x * 0.05, z * 0.05, 4) * smooth(0, 10, far)
      + 9 * fbm(x * 0.012, z * 0.012, 4) * smooth(20, 90, far)
      + 160 * Math.pow(ridge(x * 0.0035, z * 0.0035, 5, 3), 2.2) * smooth(160, 520, Math.hypot(x, z));
    // flatten a pad around the abutments
    const pad = smooth(18, 8, Math.abs(z)) * smooth(215, 185, d);
    y = y * (1 - pad) + PLATEAU_Y * pad;
  }
  return y;
}

/** grid coordinates dense near the canyon walls, sparse far away */
export function axisSamples(dense: number, step: number, extent: number, grow: number): number[] {
  const out = [0];
  let x = 0, h = step;
  while (x < extent) { x += h; out.push(x); if (x > dense) h *= grow; }
  return [...out.slice(1).reverse().map((v) => -v), ...out];
}
