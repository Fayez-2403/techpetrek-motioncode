// Three replayable challenges on top of the free laboratory. Each one names its target, its rules and how it
// is won. The rings of THE IMPOSSIBLE SHOT sit on a real trajectory of this bow under Earth-like gravity
// (85% draw, about 6 degrees up), so a perfect shot exists and the trajectory preview helps you find it.
import { BOW, GRAVITY, PHYS_DT, launchSpeed, type MaterialId } from './config';
import { ballistic, type Ring } from './projectile';
import { BowRig, BOW_HOME, BRACE, ARROW_LEN } from './bowrig';
import type { Placement, V3 } from './destructible';

export type ChallengeId = 'first' | 'breaker' | 'impossible';
export type TargetId = 'mountain' | 'slab' | 'mini' | 'crystal';

const yawQ = (a: number): [number, number, number, number] => [0, Math.sin(a / 2), 0, Math.cos(a / 2)];

export const PLACEMENTS: Record<TargetId, Placement> = {
  mountain: { p: [0, 12, -118], q: yawQ(-0.45) },
  slab: { p: [0, 6.5, -46], q: yawQ(0) },
  mini: { p: [0, 9, -84], q: yawQ(0.6) },
  crystal: { p: [0, 0, -140], q: yawQ(0) }, // placed on the reference path in impossibleGeometry()
};

export interface ChallengeSpec {
  id: ChallengeId; title: string; goal: string; target: TargetId; material?: MaterialId; maxShots: number;
  teach: string[];
}
export const CHALLENGES: Record<ChallengeId, ChallengeSpec> = {
  first: { id: 'first', title: 'THE FIRST SHOT', goal: 'Break the crystal slab with a low-power arrow (45% draw or less).', target: 'slab', material: 'crystal', maxShots: 99,
    teach: ['Aim: drag empty space or use the arrow keys', 'Power: pull the glowing string back', 'Release to fire'] },
  breaker: { id: 'breaker', title: 'MOUNTAIN BREAKER', goal: 'Detach at least 40% of the dense-rock mountain in 3 arrows.', target: 'mini', material: 'dense', maxShots: 3,
    teach: ['Where you hit matters: cut the root and the top falls', 'Dense rock needs more energy', 'Watch the support collapse'] },
  impossible: { id: 'impossible', title: 'THE IMPOSSIBLE SHOT', goal: 'One arrow through all three rings, onto the marked crystal.', target: 'crystal', material: 'crystal', maxShots: 99,
    teach: ['Gravity bends the path: aim above the rings', 'Power changes the arc', 'Earth-like gravity, drag on'] },
};

/** The reference shot the rings are built on (also what the reel's perfect shot uses). */
export const IMPOSSIBLE_SHOT = { drawFrac: 0.85, yaw: 0.035, pitch: 0.108 };

let cache: { rings: Ring[]; crystal: Placement; path: number[] } | null = null;
export function impossibleGeometry() {
  if (cache) return cache;
  const { drawFrac, yaw, pitch } = IMPOSSIBLE_SHOT;
  const draw = drawFrac * BOW.MAX_DRAW, f = BowRig.dir(yaw, pitch), v = launchSpeed(draw);
  // tip position at release: nock + aim * arrow length (the bow hovers at BOW_HOME; the bob is ignored, 2.5 cm)
  const back = BRACE + draw;
  const tip: V3 = [BOW_HOME[0] - f[0] * back + f[0] * ARROW_LEN, BOW_HOME[1] - f[1] * back + f[1] * ARROW_LEN, BOW_HOME[2] - f[2] * back + f[2] * ARROW_LEN];
  const path = ballistic(tip, [f[0] * v, f[1] * v, f[2] * v], GRAVITY.earth.g, true, PHYS_DT, 2400);
  const at = (z: number) => {
    for (let i = 3; i < path.length; i += 3) if (path[i + 2]! <= z) {
      const a = path.slice(i - 3, i), b = path.slice(i, i + 3), u = (a[2]! - z) / (a[2]! - b[2]!);
      const p: V3 = [a[0]! + (b[0]! - a[0]!) * u, a[1]! + (b[1]! - a[1]!) * u, z];
      const d = [b[0]! - a[0]!, b[1]! - a[1]!, b[2]! - a[2]!], l = Math.hypot(d[0]!, d[1]!, d[2]!);
      return { p, n: [d[0]! / l, d[1]! / l, d[2]! / l] as V3 };
    }
    throw new Error('reference path never reaches z=' + z);
  };
  const rings: Ring[] = [-34, -68, -102].map((z) => { const { p, n } = at(z); return { c: p, n, rIn: 2.1, rOut: 2.7, passed: false }; });
  // the crystal: the path meets the big centre crystal's front face (local z ~ +2.3) 5.5 m up, above the small front crystals
  const hit = at(-138);
  const crystal: Placement = { p: [hit.p[0], hit.p[1] - 5.5, hit.p[2] - 2.3], q: yawQ(0) };
  cache = { rings, crystal, path };
  PLACEMENTS.crystal = crystal;
  return cache;
}

/** Is a piece of the crystal target part of the marked centre crystal? (local frame) */
export function isMarkedCrystal(c: V3): boolean { return Math.hypot(c[0], c[2]) < 3.0 && c[1] > 0.5; }

export interface ChallengeState {
  id: ChallengeId; shots: number; status: 'active' | 'won' | 'lost'; progress: number; note: string;
  /** For the impossible shot: rings passed by the current arrow. */
  rings: number[];
}

// the crystal's placement depends on the reference path: compute it before any target is created
impossibleGeometry();
