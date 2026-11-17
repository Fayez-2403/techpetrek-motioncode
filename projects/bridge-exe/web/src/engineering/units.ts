// SI inside, friendly units on screen. Every converter is a plain multiply so the tests can check them exactly.
export const N_PER_KN = 1e3;
export const PA_PER_MPA = 1e6;
export const PA_PER_GPA = 1e9;
export const MM_PER_M = 1e3;
export const MM2_PER_M2 = 1e6;
export const KG_PER_T = 1e3;
export const G = 9.80665; // m/s², standard gravity

export const kN = (n: number) => n * N_PER_KN;        // kN -> N
export const toKN = (n: number) => n / N_PER_KN;      // N -> kN
export const MPa = (p: number) => p * PA_PER_MPA;     // MPa -> Pa
export const toMPa = (p: number) => p / PA_PER_MPA;
export const GPa = (p: number) => p * PA_PER_GPA;     // GPa -> Pa
export const toGPa = (p: number) => p / PA_PER_GPA;
export const mm = (l: number) => l / MM_PER_M;        // mm -> m
export const toMM = (l: number) => l * MM_PER_M;
export const mm2 = (a: number) => a / MM2_PER_M2;     // mm² -> m²
export const toMM2 = (a: number) => a * MM2_PER_M2;
export const toT = (kg: number) => kg / KG_PER_T;

const fix = (v: number, d: number) => (Object.is(Math.round(v * 10 ** d) / 10 ** d, -0) ? 0 : v).toFixed(d);
export const fmt = {
  kN: (n: number, d = 1) => `${fix(toKN(n), d)} kN`,
  MPa: (p: number, d = 1) => `${fix(toMPa(p), d)} MPa`,
  GPa: (p: number, d = 0) => `${fix(toGPa(p), d)} GPa`,
  mm: (l: number, d = 1) => `${fix(toMM(l), d)} mm`,
  m: (l: number, d = 2) => `${fix(l, d)} m`,
  mm2: (a: number, d = 0) => `${fix(toMM2(a), d)} mm²`,
  t: (kg: number, d = 1) => `${fix(toT(kg), d)} t`,
  pct: (r: number, d = 0) => `${fix(r * 100, d)}%`,
};
