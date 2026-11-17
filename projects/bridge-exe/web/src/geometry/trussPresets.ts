// Parametric truss topologies with stable IDs. Bottom chord joints B0..Bn carry the deck; B0 is a pin, Bn a roller.
//   Pratt / Howe: top joints T1..T(n-1) above the interior deck joints, inclined end posts, verticals, one diagonal
//                 per interior panel (Pratt diagonals fall toward midspan, Howe diagonals rise toward it).
//   Warren:       top joints T0..T(n-1) above panel midpoints, no verticals.
// All three satisfy m + r = 2j (statically determinate) for any even panel count >= 2 (checked by the tests).
import type { MemberGroup, TrussMember, TrussNode } from '../engineering/types';

export type Topology = 'pratt' | 'howe' | 'warren';
export interface TrussParams {
  topology: Topology;
  span: number;        // m
  panels: number;      // even
  height: number;      // m
  areas: Record<'top' | 'bottom' | 'vertical' | 'diagonal', number>;  // m²
  offsets: Record<string, { dx: number; dy: number }>;  // node drags (top joints only)
  removed: string[];   // member IDs removed by the user / a challenge
  added: { id: string; a: string; b: string }[];
}

export const DEFAULT_PARAMS: TrussParams = {
  topology: 'pratt', span: 48, panels: 8, height: 6,
  areas: { top: 0.012, bottom: 0.010, vertical: 0.004, diagonal: 0.006 },
  offsets: {}, removed: [], added: [],
};

export function buildTruss(p: TrussParams): { nodes: TrussNode[]; members: TrussMember[] } {
  const n = Math.max(2, Math.round(p.panels / 2) * 2), w = p.span / n;
  const nodes: TrussNode[] = [];
  const off = (id: string) => p.offsets[id] ?? { dx: 0, dy: 0 };
  for (let i = 0; i <= n; i++) nodes.push({ id: `B${i}`, x: i * w, y: 0, support: i === 0 ? 'pin' : i === n ? 'roller' : null, deck: true });
  const tops = p.topology === 'warren' ? Array.from({ length: n }, (_, i) => ({ id: `T${i}`, x: (i + 0.5) * w })) : Array.from({ length: n - 1 }, (_, i) => ({ id: `T${i + 1}`, x: (i + 1) * w }));
  for (const t of tops) { const o = off(t.id); nodes.push({ id: t.id, x: t.x + o.dx, y: p.height + o.dy, support: null, deck: false }); }

  const members: TrussMember[] = [];
  const area = (g: MemberGroup) => (g === 'endpost' ? p.areas.top : g === 'added' ? p.areas.diagonal : p.areas[g as keyof TrussParams['areas']]);
  const add = (id: string, a: string, b: string, group: MemberGroup) => members.push({ id, a, b, group, A: area(group) });
  for (let i = 0; i < n; i++) add(`BC${i + 1}`, `B${i}`, `B${i + 1}`, 'bottom');
  if (p.topology === 'warren') {
    for (let i = 0; i < n - 1; i++) add(`TC${i + 1}`, `T${i}`, `T${i + 1}`, 'top');
    for (let i = 0; i < n; i++) { add(`D${2 * i + 1}`, `B${i}`, `T${i}`, 'diagonal'); add(`D${2 * i + 2}`, `T${i}`, `B${i + 1}`, 'diagonal'); }
  } else {
    for (let i = 1; i < n - 1; i++) add(`TC${i}`, `T${i}`, `T${i + 1}`, 'top');
    add('EP1', 'B0', 'T1', 'endpost'); add('EP2', `B${n}`, `T${n - 1}`, 'endpost');
    for (let i = 1; i < n; i++) add(`V${i}`, `B${i}`, `T${i}`, 'vertical');
    for (let i = 1; i < n - 1; i++) {
      const leftHalf = i < n / 2, pratt = p.topology === 'pratt';
      const [a, b] = leftHalf === pratt ? [`T${i}`, `B${i + 1}`] : [`B${i}`, `T${i + 1}`];
      add(`D${i}`, a, b, 'diagonal');
    }
  }
  const kept = members.filter((m) => !p.removed.includes(m.id));
  for (const a of p.added) kept.push({ id: a.id, a: a.a, b: a.b, group: 'added', A: p.areas.diagonal });
  return { nodes, members: kept };
}

export const isDraggable = (id: string) => id.startsWith('T');
export const SNAP = 0.25;  // m
export const snap = (v: number) => Math.round(v / SNAP) * SNAP;
