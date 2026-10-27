// Scene registry: component, provenance class and the label each scene must carry.
//   A authentic product footage (none in this film)   B illustrative reconstruction   C concept visualization
//   data = a chart of reported numbers (carries its source attribution)   title = type/brand only
import type React from 'react';
import type { SceneId, SceneProps } from '../scenes/types';
import { ImpossibleHook } from '../scenes/ImpossibleHook';
import { ModelReveal } from '../scenes/ModelReveal';
import { IntelligenceEngine } from '../scenes/IntelligenceEngine';
import { CodingWorld } from '../scenes/CodingWorld';
import { CADLaboratory } from '../scenes/CADLaboratory';
import { HumanSimulation } from '../scenes/HumanSimulation';
import { FinanceResearch } from '../scenes/FinanceResearch';
import { AgentWorkflow } from '../scenes/AgentWorkflow';
import { BenchmarkReveal } from '../scenes/BenchmarkReveal';
import { Highspeed } from '../scenes/Highspeed';
import { OpenWeight } from '../scenes/OpenWeight';
import { FinalMontage } from '../scenes/FinalMontage';

export type Provenance = 'A' | 'B' | 'C' | 'data' | 'title';

export const SCENES: Record<SceneId, { n: number; title: string; provenance: Provenance; component: React.FC<SceneProps> }> = {
  hook: { n: 1, title: 'The impossible hook', provenance: 'C', component: ImpossibleHook },
  reveal: { n: 2, title: 'Model reveal', provenance: 'title', component: ModelReveal },
  engine: { n: 3, title: 'Intelligence engine', provenance: 'C', component: IntelligenceEngine },
  coding: { n: 4, title: 'Coding becomes creation', provenance: 'B', component: CodingWorld },
  cad: { n: 5, title: '3D engineering lab', provenance: 'B', component: CADLaboratory },
  human: { n: 6, title: 'Human simulation', provenance: 'B', component: HumanSimulation },
  finance: { n: 7, title: 'Financial research', provenance: 'B', component: FinanceResearch },
  agents: { n: 8, title: 'Long-horizon agents', provenance: 'B', component: AgentWorkflow },
  bench: { n: 9, title: 'Benchmark reveal', provenance: 'data', component: BenchmarkReveal },
  highspeed: { n: 10, title: 'Highspeed', provenance: 'C', component: Highspeed },
  openweight: { n: 11, title: 'Open-weight', provenance: 'C', component: OpenWeight },
  payoff: { n: 12, title: 'Creator payoff', provenance: 'B', component: FinalMontage },
};
