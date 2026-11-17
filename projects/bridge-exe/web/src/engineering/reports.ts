// Exports with provenance: CSV report, model JSON, replay manifest. Every file names the run, the input hash and the
// solver, and says what it is not.
import type { SolveOk, SolveResult, TrussModel } from './types';
import type { Design, LogEntry } from '../store';
import { PROXY_NOTE } from './educationalChecks';

export const DISCLAIMER = 'Educational linear-elastic model. Not a substitute for a licensed structural engineer, design-code checks or construction documents.';

export function reportCSV(model: TrussModel, r: SolveOk): string {
  const L: string[] = [];
  const q = (s: string | number) => (typeof s === 'number' ? String(s) : `"${s.replace(/"/g, '""')}"`);
  L.push(`# BRIDGE.EXE educational analysis report`);
  L.push(`# ${DISCLAIMER}`);
  L.push(`# runId,${r.runId}`, `# inputsHash,${r.inputsHash}`, `# solver,${q(`${r.solver.name} ${r.solver.version}`)}`, `# analysisType,${r.analysisType}`, `# units,SI (m, m², N, Pa)`);
  L.push(`# material,${q(model.material.name)},E_Pa,${model.material.E},rho_kgm3,${model.material.rho},fy_Pa,${model.material.fy},${q(model.material.source)}`);
  L.push(`# utilization,${q(PROXY_NOTE)}`);
  L.push(`# equilibrium_X_N,${r.diagnostics.equilibriumX_N},equilibrium_Y_N,${r.diagnostics.equilibriumY_N},residual_N,${r.diagnostics.forceResidual_N}`);
  L.push('', 'section,id,a,b,group,A_m2,length_m,axial_N,stress_Pa,utilization_proxy,governs');
  for (const m of model.members) {
    const x = r.members.find((y) => y.id === m.id)!;
    L.push(['member', m.id, m.a, m.b, m.group, m.A, x.length_m.toFixed(6), x.axial_N.toFixed(3), x.stress_Pa.toFixed(1), x.utilization.toFixed(5), x.governs].join(','));
  }
  L.push('', 'section,id,x_m,y_m,support,ux_m,uy_m');
  for (const n of model.nodes) { const x = r.nodes.find((y) => y.id === n.id)!; L.push(['node', n.id, n.x, n.y, n.support ?? '', x.ux_m.toExponential(9), x.uy_m.toExponential(9)].join(',')); }
  L.push('', 'section,node,rx_N,ry_N');
  for (const x of r.reactions) L.push(['reaction', x.nodeId, x.rx_N.toFixed(3), x.ry_N.toFixed(3)].join(','));
  L.push('', 'section,node,fx_N,fy_N,tag');
  for (const l of model.loads) L.push(['load', l.node, l.fx.toFixed(3), l.fy.toFixed(3), l.tag].join(','));
  return L.join('\n');
}

export const modelJSON = (design: Design, model: TrussModel, result: SolveResult | null) =>
  JSON.stringify({ format: 'bridge-exe/model@1', disclaimer: DISCLAIMER, design, model, result }, null, 1);

export const replayJSON = (log: LogEntry[], design: Design) =>
  JSON.stringify({ format: 'bridge-exe/replay@1', note: 'Every action with its step on the session clock and the input hash it produced. Replaying the edits reproduces the same solver inputs.', finalDesign: design, actions: log }, null, 1);
