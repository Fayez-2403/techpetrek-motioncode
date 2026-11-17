// Model checks that run before any solve. Anything here stops the solve with a readable reason; nothing is zero-filled.
import type { TrussModel } from './types';

export interface Validation { status: 'ok' | 'invalid' | 'unstable'; reasons: string[]; warnings: string[] }

export function validateTruss(m: TrussModel): Validation {
  const reasons: string[] = [], warnings: string[] = [];
  const ids = new Set<string>(), nodeById = new Map(m.nodes.map((n) => [n.id, n]));
  for (const n of m.nodes) {
    if (ids.has(n.id)) reasons.push(`Duplicate node ID ${n.id}`);
    ids.add(n.id);
    if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) reasons.push(`Node ${n.id} has a non-numeric coordinate`);
  }
  const mids = new Set<string>(), pairs = new Map<string, string>();
  const degree = new Map<string, number>(m.nodes.map((n) => [n.id, 0]));
  for (const e of m.members) {
    if (mids.has(e.id)) reasons.push(`Duplicate member ID ${e.id}`);
    mids.add(e.id);
    const a = nodeById.get(e.a), b = nodeById.get(e.b);
    if (!a || !b) { reasons.push(`Member ${e.id} references a missing node (${!a ? e.a : e.b})`); continue; }
    if (e.a === e.b) { reasons.push(`Member ${e.id} connects node ${e.a} to itself`); continue; }
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    if (L < 1e-6) reasons.push(`Member ${e.id} has zero length (${e.a} and ${e.b} coincide)`);
    if (!(e.A > 0)) reasons.push(`Member ${e.id} has zero or negative area`);
    else if (e.A < 1e-7) reasons.push(`Member ${e.id} area ${e.A.toExponential(2)} m² is effectively zero`);
    const key = [e.a, e.b].sort().join('|');
    if (pairs.has(key)) warnings.push(`Members ${pairs.get(key)} and ${e.id} overlap (same two nodes)`);
    pairs.set(key, e.id);
    degree.set(e.a, (degree.get(e.a) ?? 0) + 1); degree.set(e.b, (degree.get(e.b) ?? 0) + 1);
  }
  if (!(m.material.E > 0)) reasons.push('Elastic modulus E must be positive');
  for (const l of m.loads) if (!nodeById.has(l.node)) reasons.push(`A load (${l.tag}) is applied to missing node ${l.node}`);
  if (reasons.length) return { status: 'invalid', reasons, warnings };

  // stability: necessary conditions (the solver's pivot check is the sufficient one)
  const unstable: string[] = [];
  for (const [id, d] of degree) {
    const n = nodeById.get(id)!;
    if (d === 0 && !n.support) unstable.push(`Node ${id} is not connected to any member`);
    else if (d === 1 && !n.support) unstable.push(`Node ${id} hangs on a single member, so it can swing freely`);
  }
  const r = m.nodes.reduce((s, n) => s + (n.support === 'pin' ? 2 : n.support === 'roller' ? 1 : 0), 0);
  if (r < 3) unstable.push(`Only ${r} support restraint${r === 1 ? '' : 's'}; a plane truss needs at least 3 (a pin + a roller)`);
  const j = m.nodes.length, mm = m.members.length;
  if (mm + r < 2 * j) unstable.push(`Counting rule fails: members + restraints = ${mm} + ${r} = ${mm + r} < 2 × joints = ${2 * j}. Add ${2 * j - mm - r} member${2 * j - mm - r === 1 ? '' : 's'}.`);
  if (unstable.length) return { status: 'unstable', reasons: unstable, warnings };
  if (mm + r > 2 * j) warnings.push(`Statically indeterminate (degree ${mm + r - 2 * j}); the stiffness method handles this`);
  return { status: 'ok', reasons, warnings };
}
