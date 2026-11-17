// The typed contract between the UI, the solvers and the 3D view. SI units everywhere (m, m², N, Pa, kg).

export type Support = 'pin' | 'roller' | null;
export type MemberGroup = 'top' | 'bottom' | 'vertical' | 'diagonal' | 'endpost' | 'added';

export interface TrussNode { id: string; x: number; y: number; support: Support; deck: boolean }
export interface TrussMember { id: string; a: string; b: string; group: MemberGroup; A: number }
export interface Material {
  id: string; name: string;
  E: number;      // Pa
  rho: number;    // kg/m³
  fy: number;     // Pa, nominal yield used only by the educational proxy
  source: string; // where the numbers come from
}
export interface NodalLoad { node: string; fx: number; fy: number; tag: string } // N, +y up

/** One plane of the bridge: an idealised pin-jointed 2D truss. */
export interface TrussModel {
  units: 'SI';
  analysisType: 'linear-2d-truss';
  nodes: TrussNode[];
  members: TrussMember[];
  material: Material;
  loads: NodalLoad[];
}

export interface NodeResult { id: string; ux_m: number; uy_m: number }
export interface MemberResult {
  id: string; length_m: number; axial_N: number; stress_Pa: number;
  /** educational proxy, see educationalChecks.ts; not a code check */
  utilization: number; governs: 'yield' | 'euler' | 'none';
}
export interface ReactionResult { nodeId: string; rx_N: number; ry_N: number }

export interface SolveOk {
  runId: string;
  analysisType: 'linear-2d-truss';
  units: 'SI';
  solver: { name: string; version: string };
  inputsHash: string;
  status: 'solved';
  nodes: NodeResult[];
  members: MemberResult[];
  reactions: ReactionResult[];
  metrics: {
    maxAbsDisplacement_m: number; maxDisplacementNode: string;
    maxAbsAxial_N: number; maxAxialMember: string;
    maxUtilization: number; maxUtilizationMember: string;
    mass_kg: number; totalLoadY_N: number;
  };
  diagnostics: { forceResidual_N: number; equilibriumX_N: number; equilibriumY_N: number; equilibriumM_Nm: number; dof: number; warnings: string[] };
}
export interface SolveFail {
  runId: string;
  analysisType: 'linear-2d-truss';
  solver: { name: string; version: string };
  inputsHash: string;
  status: 'unstable' | 'invalid';
  reasons: string[];
}
export type SolveResult = SolveOk | SolveFail;
