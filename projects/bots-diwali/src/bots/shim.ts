// Local stand-ins for the engine helpers the copied character modules import (the engine itself is not touched).
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const ax = (size: number, _width = 100, weight = 900) => `${weight} ${size}px Archivo, Inter, sans-serif`;
export const mono = (size: number, weight = 500) => `${weight} ${size}px 'JetBrains Mono', monospace`;
