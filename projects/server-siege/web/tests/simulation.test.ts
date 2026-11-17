// The master prompt's 12 simulation checks (plus rewind determinism). Run: bun test
import { describe, expect, test } from 'bun:test';
import { Hist } from '../src/simulation/core';
import { DB_TIERS, DT, Sim, type Action, type Params } from '../src/simulation/engine';
import { scenarioById, type Scenario } from '../src/simulation/scenarios';

const base = scenarioById('million');
const custom = (o: Partial<Scenario>): Scenario => ({ ...base, id: 'test', exactTotal: undefined, faults: [], ...o });
const run = (sc: Scenario, p: Partial<Params> = {}, a: Action[] = []) => { const s = new Sim(sc, p, a); s.runTo(1e9); return s; };
const balance = (s: Sim) => { const T = s.totals; return T.arrived - (T.completed + T.rejected + T.timedOut + s.inFlight); };

describe('server siege simulation', () => {
  test('1. identical seed + scenario + params + actions give identical results', () => {
    const acts: Action[] = [{ at: 14000, set: { appReplicas: 5 } }, { at: 30000, set: { cacheOn: true } }];
    const a = run(base, {}, acts), b = run(base, {}, acts);
    expect(JSON.stringify(a.samples)).toBe(JSON.stringify(b.samples));
    expect(a.report()).toEqual(b.report());
    const c = run(base, { seed: 7 }, acts);                         // a different seed changes the cache's key draws
    expect(c.totals.hits).not.toBe(a.totals.hits);
  });

  test('2. zero traffic creates no phantom completions', () => {
    const s = run(custom({ duration: 10 }), { trafficPct: 0 });
    expect(s.totals.arrived).toBe(0);
    expect(s.totals.completed).toBe(0);
    expect(s.report().p95).toBe(0);
  });

  test('3 + 4. every request is accounted exactly once, on every tick; the challenge sends exactly 1,000,000', () => {
    const s = new Sim(base, { appReplicas: 2 });
    while (!s.done) { s.step(); expect(balance(s)).toBe(0); }
    expect(s.totals.arrived).toBe(1_000_000);
    expect(s.totals.byType.reduce((x, y) => x + y, 0)).toBe(1_000_000);
    expect(s.totals.rejected + s.totals.timedOut).toBeGreaterThan(0);   // this run fails requests, and they are counted
  });

  test('5. cache hits never consume app or database capacity', () => {
    const sc = custom({ duration: 20, mix: [1, 0, 0, 0], curve: [[0, 10000], [20, 10000]] });
    const s = run(sc, { cacheOn: true, cacheSize: 50000, appReplicas: 4, dbTier: 'L' });
    const T = s.totals;
    expect(T.hits).toBeGreaterThan(0);
    const served = s.insts.reduce((a, i) => a + i.q.size, 0) + s.dbQueued;
    // only misses reach the load balancer: completions = hits + misses that went through the DB
    expect(T.completed + T.rejected + T.timedOut + served).toBe(T.hits + T.misses);
    const dbSeen = s.samples.reduce((a, x) => a + x.dbUtil * DB_TIERS.L.units * 0.1, 0);
    expect(dbSeen).toBeLessThanOrEqual(T.misses + 1);
  });

  test('6. writes bypass the read cache', () => {
    const s = run(custom({ duration: 10, mix: [0, 0, 1, 0] }), { cacheOn: true, dbTier: 'L', appReplicas: 6 });
    expect(s.totals.hits).toBe(0);
    expect(s.cacheFill).toBe(0);
  });

  test('7. a health-checked unhealthy instance stops receiving new requests', () => {
    const sc = scenarioById('l2');
    const s = new Sim(sc, { healthChecks: true, lb: 'rr' });
    const sick = () => s.insts[2];
    let pulled = 0;
    while (!s.done) {
      const wasHealthy = sick().healthy;
      s.step();
      if (!wasHealthy && !sick().healthy) { pulled++; expect(sick().assignedTick).toBe(0); }
    }
    expect(sick().degraded).toBe(true);
    expect(pulled).toBeGreaterThan(100);                          // it spent time out of rotation, receiving nothing
  });

  test('8. autoscaling respects the startup delay and its limits', () => {
    const s = new Sim(scenarioById('l5'), { asMax: 6 });
    let maxLive = 0;
    while (!s.done) {
      s.step();
      for (const i of s.insts) { if (i.state === 'boot') expect(i.assignedTick).toBe(0); if (i.state === 'up') expect(s.s.now).toBeGreaterThan(i.readyAt - 1); }
      maxLive = Math.max(maxLive, s.insts.filter((i) => i.state === 'up' || i.state === 'boot').length);
      for (const i of s.insts) if (i.state === 'up' && i.launchedAt > 0) expect(i.readyAt - i.launchedAt).toBe(s.p.startupDelay);
    }
    expect(maxLive).toBeLessThanOrEqual(6);
    expect(s.insts.length).toBeGreaterThan(2);                      // it did scale out
  });

  test('9. more app replicas never add database capacity', () => {
    const sc = custom({ duration: 20, curve: [[0, 30000], [20, 30000]] });
    for (const n of [4, 12]) {
      const s = run(sc, { appReplicas: n, dbTier: 'S' });
      for (const x of s.samples) expect(x.dbUtil).toBeLessThanOrEqual(1 + 2 / (DB_TIERS.S.units * 0.1));   // at most a 2-unit carry
      const dbDone = s.samples.reduce((a, x) => a + x.dbUtil, 0) * DB_TIERS.S.units * 0.1;
      expect(dbDone).toBeLessThanOrEqual(DB_TIERS.S.units * 20 + 10);
    }
  });

  test('10. timeouts are recorded and no completed request is slower than the timeout', () => {
    const s = run(custom({ duration: 15, curve: [[0, 30000], [15, 30000]] }), { dbTier: 'S', appReplicas: 8, timeout: 500, dbQueue: 50000 });
    expect(s.totals.timedOut).toBeGreaterThan(0);
    expect(s.report().p95).toBeLessThanOrEqual(500 + 5);
  });

  test('11. queues never exceed their capacity (overflow is rejected and counted)', () => {
    const s = new Sim(custom({ duration: 15, curve: [[0, 40000], [15, 40000]] }), { appReplicas: 2, appQueue: 1000, dbQueue: 3000, dbTier: 'S' });
    while (!s.done) { s.step(); for (const i of s.insts) expect(i.q.size).toBeLessThanOrEqual(1000); expect(s.dbQueued).toBeLessThanOrEqual(3000); }
    expect(s.totals.rejected).toBeGreaterThan(0);
  });

  test('12. percentiles come from completed-request observations', () => {
    const h = new Hist();
    h.add(10, 90); h.add(400, 10);
    expect(h.quantile(0.5)).toBe(15);        // upper edge of the 10-15 ms bucket
    expect(h.quantile(0.95)).toBe(405);
    expect(new Hist().quantile(0.95)).toBe(0);
    const s = run(custom({ duration: 5 }), { appReplicas: 8, dbTier: 'L' });
    expect(s.report().p50).toBeGreaterThan(0);
  });

  test('rewind: seeking back and replaying equals a fresh run', () => {
    const acts: Action[] = [{ at: 14000, set: { appReplicas: 5 } }, { at: 30000, set: { cacheOn: true } }];
    const fresh = run(base, {}, acts);
    const s = new Sim(base, {}, acts);
    s.runTo(42000); s.seek(12345); s.runTo(1e9);
    expect(JSON.stringify(s.samples)).toBe(JSON.stringify(fresh.samples));
    expect(s.totals).toEqual(fresh.totals);
    expect(DT).toBe(10);
  });
});
