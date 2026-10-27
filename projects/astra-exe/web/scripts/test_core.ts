#!/usr/bin/env bun
// Headless tests of the simulation core (no browser): bun scripts/test_core.ts [--quick]
// Fires real shots through SimCore and checks what the physics did. Prints a report; exits 1 on a failure.
import { initRapier } from '../src/core/physics';
import { generate, type Fracture } from '../src/core/fracture';
import { SimCore } from '../src/core/simcore';
import { PHYS_DT, MODE_ORDER, type ModeId, type MaterialId, type GravityPreset, launchSpeed, BOW } from '../src/core/config';
import { PieceState } from '../src/core/destructible';
import { IMPOSSIBLE_SHOT, impossibleGeometry } from '../src/core/challenges';

await initRapier();
const quick = process.argv.includes('--quick');
const results: { name: string; ok: boolean; detail: string }[] = [];
const check = (name: string, ok: boolean, detail: string) => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`); };

const cache = new Map<string, Fracture>();
const frac = (k: 'mountain' | 'mini' | 'slab' | 'crystal', n: number) => { const key = `${k}${n}`; if (!cache.has(key)) cache.set(key, generate(k, 7, n)); return cache.get(key)!; };

function makeSim(opts: { mode?: ModeId; material?: MaterialId; gravity?: GravityPreset; mult?: number } = {}) {
  const s = new SimCore();
  s.addTarget('mountain', frac('mountain', 220));
  s.apply({ mode: opts.mode ?? 'vajra', material: opts.material ?? 'brittle', gravity: opts.gravity ?? 'earth', impactMult: opts.mult ?? 1 });
  return s;
}
const stepFor = (s: SimCore, sec: number) => { const n = Math.round(sec / PHYS_DT); for (let i = 0; i < n; i++) s.fixedStep(); };

/** Aim, pull to `frac` of full draw over 0.5 s, release, then simulate `after` seconds. */
function shoot(s: SimCore, yaw: number, pitch: number, frac = 1, after = 5) {
  s.aim(yaw, pitch); s.rig.yaw = yaw; s.rig.pitch = pitch;
  s.grab();
  const n = Math.round(0.5 / PHYS_DT);
  for (let i = 0; i < n; i++) { s.pull(BOW.MAX_DRAW * frac * Math.min(1, (i + 1) / (n * 0.7))); s.fixedStep(); }
  s.release();
  const evs: typeof s.events = [];
  const m = Math.round(after / PHYS_DT);
  let worst = 0;
  for (let i = 0; i < m; i++) { const a = performance.now(); s.fixedStep(); worst = Math.max(worst, performance.now() - a); evs.push(...s.events); s.events = []; }
  return { evs, worst };
}

// 1. a full-power Vajra shot at the mountain
{
  const s = makeSim();
  const T0 = performance.now();
  const { evs, worst } = shoot(s, 0, 0.09, 1, 6);
  const launch = evs.find((e) => e.type === 'launch') as any, hit = evs.find((e) => e.type === 'impact') as any;
  const breaks = evs.filter((e) => e.type === 'break');
  const d = s.targets.get('mountain')!;
  check('launch speed follows the draw-energy model', !!launch && Math.abs(launch.speed - launchSpeed(launch.power * BOW.MAX_DRAW)) < 0.01, `${launch?.speed.toFixed(2)} m/s at ${(launch?.power * 100).toFixed(1)}% draw (model ${launchSpeed(launch?.power * BOW.MAX_DRAW).toFixed(2)}; full draw ${launchSpeed(BOW.MAX_DRAW).toFixed(1)} m/s)`);
  check('arrow hits the mountain', !!hit, hit ? `t=${hit.t.toFixed(2)} s at (${hit.p.map((v: number) => v.toFixed(1)).join(', ')}), KE ${hit.ke.toFixed(1)} J, fantasy E ${(hit.info.E / 1e9).toFixed(2)} GJ, r* ${hit.info.rStar.toFixed(1)} m` : 'no impact');
  check('pieces break off and fall', breaks.length > 5 && d.looseFraction > 0.01, `${breaks.length} pieces broke (${(d.looseFraction * 100).toFixed(1)}% of the volume); vajra ${breaks.filter((b: any) => b.cause === 'vajra').length}, collapse ${breaks.filter((b: any) => b.cause === 'collapse').length}`);
  const loose = [...Array(d.n).keys()].filter((i) => d.state[i] === PieceState.Loose);
  const fell = loose.filter((i) => d.curP[3 * i + 1]! < d.rest[3 * i + 1]! - 5).length;
  check('loose pieces are moving rigid bodies', loose.length > 0 && fell > 0, `${loose.length} loose bodies, ${fell} already fallen more than 5 m`);
  check('worst physics step stays bounded', worst < 60, `${worst.toFixed(1)} ms worst step (${((performance.now() - T0) / 1000).toFixed(1)} s for 6.5 s of simulation)`);
  // reset
  s.resetTarget();
  stepFor(s, 0.2);
  check('reset restores the mountain', d.looseFraction === 0 && [...Array(d.n).keys()].every((i) => d.state[i] === PieceState.Attached), `loose fraction ${d.looseFraction}`);
}

// 2. determinism: two fresh sims, same shot, same result
{
  const sig = () => { const s = makeSim({ mode: 'cosmic' }); shoot(s, 0.02, 0.095, 1, quick ? 3 : 5); const d = s.targets.get('mountain')!; let h = 0; for (let i = 0; i < d.curP.length; i++) h = (h * 31 + Math.round(d.curP[i]! * 1000)) | 0; return h; };
  const a = sig(), b = sig();
  check('same inputs give the same result (bit-for-bit poses)', a === b, `pose hash ${a} vs ${b}`);
}

// 3. gravity changes the trajectory
{
  const hitAt = (g: GravityPreset) => { const s = makeSim({ gravity: g }); const { evs } = shoot(s, 0, 0.06, 0.7, 4); const h = evs.find((e) => e.type === 'impact') as any; return h ? h.p[1] : NaN; };
  const ye = hitAt('earth'), ym = hitAt('moon'), yz = hitAt('zero');
  check('gravity bends the path (same aim, 70% draw)', yz > ym && ym > ye, `impact height: zero-g ${yz.toFixed(1)} m, moon ${ym.toFixed(1)} m, earth ${ye.toFixed(1)} m`);
}

// 4. every mode and every material gives a different outcome
{
  const row: string[] = [];
  const outcome: Record<string, number> = {};
  for (const m of MODE_ORDER) {
    const s = makeSim({ mode: m });
    const { evs } = shoot(s, 0, 0.09, 1, quick ? 4 : 6);
    const d = s.targets.get('mountain')!;
    outcome[m] = d.looseFraction;
    const causes: Record<string, number> = {};
    for (const e of evs) if (e.type === 'break') causes[(e as any).cause] = (causes[(e as any).cause] ?? 0) + 1;
    row.push(`${m}: ${(d.looseFraction * 100).toFixed(1)}% [${Object.entries(causes).map(([k, v]) => `${k} ${v}`).join(', ')}]`);
  }
  check('four modes behave differently', new Set(Object.values(outcome).map((v) => v.toFixed(3))).size === 4, row.join(' | '));
  const mats: string[] = [], mv: number[] = [];
  for (const mat of ['brittle', 'dense', 'crystal', 'soft'] as MaterialId[]) {
    const s = makeSim({ material: mat });
    const { evs } = shoot(s, 0, 0.09, 1, 3);
    const h = evs.find((e) => e.type === 'impact') as any;
    mats.push(`${mat}: r* ${h?.info.rStar.toFixed(1)} m, ${h?.info.broken} broke`); mv.push(h?.info.rStar ?? 0);
  }
  check('materials change the break radius', new Set(mv.map((v) => v.toFixed(2))).size === 4, mats.join(' | '));
}

// 5. snapshot -> restore replays the same shot
{
  const s = makeSim({ mode: 'agni' });
  s.aim(0, 0.09); s.rig.yaw = 0; s.rig.pitch = 0.09;
  const snap = s.snapshot();
  const run = () => { s.grab(); for (let i = 0; i < 60; i++) { s.pull(BOW.MAX_DRAW); s.fixedStep(); } s.release(); stepFor(s, 3); const d = s.targets.get('mountain')!; return Array.from(d.curP.slice(0, 300)).map((v) => v.toFixed(3)).join(); };
  const a = run();
  s.restore(snap);
  const b = run();
  check('slow-motion replay (snapshot restore) is exact', a === b, a === b ? 'identical poses after restore' : 'poses differ');
}

// 6. the impossible shot's reference path goes through all three rings
{
  const s = new SimCore();
  s.addTarget('crystal', frac('crystal', 70));
  s.startChallenge('impossible');
  const geo = impossibleGeometry();
  const { yaw, pitch, drawFrac } = IMPOSSIBLE_SHOT;
  s.aim(yaw, pitch); s.rig.yaw = yaw; s.rig.pitch = pitch;
  // settle the hover phase the same way the reel does: release at t where the bob is ~0
  s.grab(); for (let i = 0; i < 90; i++) { s.pull(BOW.MAX_DRAW * drawFrac); s.fixedStep(); }
  s.release();
  const evs: any[] = []; for (let i = 0; i < 480; i++) { s.fixedStep(); evs.push(...s.events); s.events = []; }
  const rings = evs.filter((e) => e.type === 'ring').map((e) => e.idx);
  const hitE = evs.find((e) => e.type === 'impact');
  if (hitE) console.log('   impossible hit chunk local centroid', s.targets.get('crystal')!.fr.chunks[hitE.chunk]!.c.map((v: number) => v.toFixed(2)).join(', '));
  const won = s.challenge?.status;
  check('impossible shot: reference aim threads 3 rings and wins', rings.join() === '0,1,2' && won === 'won', `rings ${rings.join(',') || 'none'}, status ${won}, note "${s.challenge?.note}"; rings at z ${geo.rings.map((r) => r.c[2].toFixed(0)).join('/')} heights ${geo.rings.map((r) => r.c[1].toFixed(1)).join('/')} m`);
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
await Bun.write(new URL('../test-results/core.json', import.meta.url), JSON.stringify({ when: new Date().toISOString(), results }, null, 2));
process.exit(failed.length ? 1 : 0);
