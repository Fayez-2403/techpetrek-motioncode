const radius = 18;
const quarter = Math.PI * radius / 2;
const segments = [162, quarter, 48, quarter, 162, quarter, 48, quarter];
const length = segments.reduce((sum, n) => sum + n, 0);
const wrap = s => ((s % length) + length) % length;

export const route = {
  length, radius, wrap,
  sample(distance) {
    let s = wrap(distance), x = -42, z = -81, angle = 0;
    for (let i = 0; i < segments.length; i++) {
      const step = Math.min(s, segments[i]);
      if (i % 2) {
        const next = angle + step / radius;
        x += radius * (Math.cos(angle) - Math.cos(next));
        z += radius * (Math.sin(next) - Math.sin(angle));
        angle = next;
      } else {
        x += Math.sin(angle) * step;
        z += Math.cos(angle) * step;
      }
      s -= step;
      if (s <= 1e-8) break;
    }
    const tx = Math.sin(angle), tz = Math.cos(angle);
    return {x, z, tx, tz, nx: tz, nz: -tx, angle};
  }
};
export default route;
