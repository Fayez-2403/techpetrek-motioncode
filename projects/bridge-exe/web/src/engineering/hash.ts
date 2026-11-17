// Deterministic content hash of a solver input (canonical JSON, two FNV-1a passes -> 64-bit hex). No clocks, no random.
export function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v as object).sort().map((k) => `${JSON.stringify(k)}:${canonical((v as any)[k])}`).join(',')}}`;
  if (typeof v === 'number') return Number.isFinite(v) ? String(+v.toPrecision(12)) : 'null';
  return JSON.stringify(v);
}
function fnv(s: string, seed: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
export function hashOf(v: unknown): string {
  const s = canonical(v);
  return fnv(s, 0x811c9dc5).toString(16).padStart(8, '0') + fnv(s, 0x2b992ddf).toString(16).padStart(8, '0');
}
