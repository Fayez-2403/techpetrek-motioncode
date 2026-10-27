// Chart data for the benchmark scenes, built only from verifiedClaims (values) and fixed honest-scale rules.
import { CLAIMS, N, NAMES } from './verifiedClaims';

export interface Bar { model: string; value: number; hero?: boolean }
export interface BenchChart { id: string; title: string; unit: '%'; axisMin: 0; axisMax: 100; bars: Bar[]; qualifier: string; note: string }

/** Terminal-Bench 4.0, ordered as Moonshot's table orders it (highest first). Axis starts at 0 so bar lengths are honest. */
export const TERMINAL_BENCH: BenchChart = {
  id: 'terminalBench', title: `TERMINAL-BENCH ${N.benchVersion.tb}`, unit: '%', axisMin: 0, axisMax: 100,
  bars: [
    { model: NAMES.opus, value: N.tb.opus },
    { model: NAMES.model, value: N.tb.kimi, hero: true },
    { model: NAMES.astra, value: N.tb.astra },
  ],
  qualifier: CLAIMS.terminalBench.qualifier,
  note: CLAIMS.terminalBenchHarness.display,
};

export const BENCHCAD: BenchChart = {
  id: 'benchCad', title: 'BENCHCAD WITH TOOLS', unit: '%', axisMin: 0, axisMax: 100,
  bars: [
    { model: NAMES.opus, value: N.cad.opus },
    { model: NAMES.astra, value: N.cad.astra },
    { model: NAMES.model, value: N.cad.kimi, hero: true },
  ],
  qualifier: CLAIMS.benchCad.qualifier,
  note: CLAIMS.benchCadSubset.display,
};
