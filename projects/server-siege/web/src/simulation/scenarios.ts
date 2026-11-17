// The six levels, the sandbox and the reel run. Each scenario is data: a traffic curve, the request mix, the starting
// parameters, which controls are locked (and why), scripted faults and the mission targets.
import type { Params } from './engine';

export type ControlKey = 'traffic' | 'replicas' | 'lb' | 'health' | 'cache' | 'autoscale' | 'db' | 'workers' | 'timeout';

export interface Scenario {
  id: string;
  name: string;
  level: number;              // 0 = sandbox / reel
  brief: string;
  lesson: string;
  duration: number;           // sim seconds
  curve: [number, number][];  // (sim s, req/s at traffic 100 %), piecewise linear
  exactTotal?: number;        // scale the curve so arrivals sum to exactly this at 100 % traffic
  mix: [number, number, number, number];   // cacheable read, read, write, async job (sum 1)
  params: Partial<Params>;
  locked: Partial<Record<ControlKey, string>>;
  faults?: { at: number; inst: number; degraded: boolean }[];
  targets: { success: number; p95: number; budget: number };
}

export const MIX_DEFAULT: Scenario['mix'] = [0.62, 0.13, 0.12, 0.13];

/** the million-request launch curve: a ramp, a plateau, a lull, a second bigger surge, the tail */
export const MILLION_CURVE: [number, number][] = [
  [0, 3000], [6, 8000], [10, 20000], [28, 22000], [33, 16000], [38, 18000], [42, 27000], [48, 26000], [54, 14000], [60, 10000],
];

export const SCENARIOS: Scenario[] = [
  {
    id: 'l1', level: 1, name: 'First Traffic Spike', duration: 40,
    brief: 'One app server. Traffic climbs to 9,000 req/s. Keep errors under 2 %.',
    lesson: 'One instance serves 5,000 req/s. Past that, its queue fills, then requests get rejected.',
    curve: [[0, 1000], [15, 9000], [40, 9000]], mix: MIX_DEFAULT,
    params: { appReplicas: 1, dbTier: 'L', cacheOn: false, autoscale: false, workers: 4 },
    locked: { lb: 'Only one server: nothing to balance yet', cache: 'Unlocked in Level 4', autoscale: 'Unlocked in Level 5', db: 'The database is not the problem here' },
    targets: { success: 0.98, p95: 500, budget: 1200 },
  },
  {
    id: 'l2', level: 2, name: 'The Load Balancer', duration: 40,
    brief: 'Four servers, 14,000 req/s. Server #3 is degraded (30 % speed). Round robin keeps feeding it.',
    lesson: 'Round robin is blind to load. Least connections, or health checks, route around a sick instance.',
    curve: [[0, 14000], [40, 14000]], mix: MIX_DEFAULT,
    params: { appReplicas: 4, lb: 'rr', healthChecks: false, dbTier: 'L', cacheOn: false, autoscale: false, workers: 6 },
    locked: { replicas: 'Fix the routing, not the fleet size', cache: 'Unlocked in Level 4', autoscale: 'Unlocked in Level 5', db: 'Not the bottleneck here' },
    faults: [{ at: 0, inst: 2, degraded: true }],
    targets: { success: 0.99, p95: 300, budget: 1200 },
  },
  {
    id: 'l3', level: 3, name: 'Database Bottleneck', duration: 45,
    brief: 'Traffic climbs to 20,000 req/s on a small database (tier S: 8,000 units/s). App servers are cheap. Is that the fix?',
    lesson: 'App replicas never add database capacity. Find the layer at 100 % and fix that one.',
    curve: [[0, 4000], [12, 20000], [45, 20000]], mix: MIX_DEFAULT,
    params: { appReplicas: 2, dbTier: 'S', cacheOn: false, autoscale: false, workers: 8 },
    locked: { cache: 'Unlocked in Level 4', autoscale: 'Unlocked in Level 5' },
    targets: { success: 0.98, p95: 500, budget: 1200 },
  },
  {
    id: 'l4', level: 4, name: 'Cache Rescue', duration: 45,
    brief: '80 % of traffic is the same popular pages, read again and again. The database (tier M) is locked.',
    lesson: 'A cache hit never reaches the app or the database. It only helps repeated reads; writes still go through.',
    curve: [[0, 8000], [8, 22000], [45, 22000]], mix: [0.8, 0.05, 0.07, 0.08],
    params: { appReplicas: 6, dbTier: 'M', cacheOn: false, cacheSize: 2000, autoscale: false, workers: 6 },
    locked: { db: 'Budget freeze: no bigger database', autoscale: 'Unlocked in Level 5', replicas: 'The app tier is fine' },
    targets: { success: 0.99, p95: 300, budget: 1200 },
  },
  {
    id: 'l5', level: 5, name: 'Autoscaling Delay', duration: 45,
    brief: 'Quiet, then a surge to 24,000 req/s in 3 s. New instances need 4 s to boot.',
    lesson: 'Autoscaling reacts after the fact. Keep enough baseline capacity, and a target that leaves headroom.',
    curve: [[0, 4000], [10, 4000], [13, 24000], [45, 24000]], mix: MIX_DEFAULT,
    params: { appReplicas: 2, autoscale: true, asTarget: 0.9, asMin: 2, asMax: 10, dbTier: 'L', cacheOn: true, cacheSize: 20000, workers: 10 },
    locked: { db: 'Not the bottleneck here', cache: 'Already on' },
    targets: { success: 0.99, p95: 400, budget: 1200 },
  },
  {
    id: 'million', level: 6, name: 'The One Million Challenge', duration: 60,
    brief: '1,000,000 simulated requests in 60 s. Keep ≥ 99 % success, p95 ≤ 400 ms, and stay under 1,200 credits/hr.',
    lesson: 'Every layer has a limit. Balance capacity, caching and queues, within a budget.',
    curve: MILLION_CURVE, exactTotal: 1_000_000, mix: MIX_DEFAULT,
    params: { appReplicas: 2, dbTier: 'M', cacheOn: false, autoscale: false, workers: 6 },
    locked: { traffic: 'The challenge is exactly 1,000,000 requests' },
    targets: { success: 0.99, p95: 400, budget: 1200 },
  },
  {
    id: 'sandbox', level: 0, name: 'Sandbox', duration: 120,
    brief: 'Everything unlocked. Steady 15,000 req/s at 100 % traffic.',
    lesson: 'Try to break it. Then fix it.',
    curve: [[0, 15000], [120, 15000]], mix: MIX_DEFAULT,
    params: { appReplicas: 4, dbTier: 'M', cacheOn: true, cacheSize: 20000, workers: 8 },
    locked: {},
    targets: { success: 0.99, p95: 400, budget: 1200 },
  },
];

export const scenarioById = (id: string) => SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[5];

/** req/s at sim second t (100 % traffic, before exactTotal scaling) */
export function curveAt(curve: [number, number][], t: number): number {
  if (t <= curve[0][0]) return curve[0][1];
  for (let i = 1; i < curve.length; i++) {
    const [t1, r1] = curve[i];
    if (t <= t1) { const [t0, r0] = curve[i - 1]; return r0 + ((r1 - r0) * (t - t0)) / (t1 - t0); }
  }
  return curve[curve.length - 1][1];
}
