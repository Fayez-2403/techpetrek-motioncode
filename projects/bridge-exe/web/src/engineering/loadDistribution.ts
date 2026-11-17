// How deck loads reach the analysed truss plane. Stated rules (also in the app's Info panel):
//  - The bridge has two identical truss planes; each analysed 2D truss carries HALF the deck. All load inputs are
//    per truss plane.
//  - Deck UDL q (N/m per plane) goes to the deck (bottom-chord) joints by tributary length: half the panel on each side.
//  - A vehicle point load P between two deck joints is shared by the lever rule (simply supported stringer):
//    P·(xj − x)/(xj − xi) to joint i and the rest to joint j.
//  - Self-weight (optional): ρ·A·L·g of each bar, half to each end joint.
// A "moving" vehicle is a sequence of independent static solves, one per position; any animation between positions
// is interpolation for display only.
import type { NodalLoad, TrussModel, TrussNode } from './types';
import { selfWeightLoads } from './truss';

export interface LoadCase {
  deckUDL: number;                 // N/m per truss plane (downward magnitude)
  selfWeight: boolean;
  vehicle: { on: boolean; x: number; P: number };   // x from the left support (m), P downward magnitude (N)
  points: { node: string; fx: number; fy: number }[];
  scale: number;                   // multiplies every load
}

export const deckNodes = (nodes: TrussNode[]) => nodes.filter((n) => n.deck).sort((a, b) => a.x - b.x);

export function vehicleShares(nodes: TrussNode[], x: number, P: number): NodalLoad[] {
  const d = deckNodes(nodes);
  if (d.length < 2) return [];
  const x0 = d[0].x, cx = Math.min(d[d.length - 1].x, Math.max(x0, x0 + x));
  let i = 0;
  while (i < d.length - 2 && d[i + 1].x < cx) i++;
  const a = d[i], b = d[i + 1], r = (cx - a.x) / (b.x - a.x);
  return [{ node: a.id, fx: 0, fy: -P * (1 - r), tag: 'vehicle' }, { node: b.id, fx: 0, fy: -P * r, tag: 'vehicle' }].filter((l) => l.fy !== 0);
}

export function buildLoads(model: Omit<TrussModel, 'loads'>, lc: LoadCase): NodalLoad[] {
  const out: NodalLoad[] = [];
  const d = deckNodes(model.nodes);
  if (lc.deckUDL > 0) d.forEach((n, i) => {
    const left = i > 0 ? (n.x - d[i - 1].x) / 2 : 0, right = i < d.length - 1 ? (d[i + 1].x - n.x) / 2 : 0;
    out.push({ node: n.id, fx: 0, fy: -lc.deckUDL * (left + right), tag: 'deck' });
  });
  if (lc.selfWeight) out.push(...selfWeightLoads(model));
  if (lc.vehicle.on && lc.vehicle.P > 0) out.push(...vehicleShares(model.nodes, lc.vehicle.x, lc.vehicle.P));
  for (const p of lc.points) out.push({ node: p.node, fx: p.fx, fy: p.fy, tag: 'point' });
  return out.map((l) => ({ ...l, fx: l.fx * lc.scale, fy: l.fy * lc.scale }));
}
