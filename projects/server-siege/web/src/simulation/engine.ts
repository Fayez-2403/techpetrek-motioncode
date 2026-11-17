// SERVER SIEGE simulation engine: a deterministic fixed-timestep (10 ms) model of
//   client -> edge cache -> load balancer -> app instances -> database | job queue -> workers.
// Requests move as integer cohorts, so one million logical requests cost a few thousand queue operations; the only
// per-request work is the cache's key draw. Same seed + scenario + params + action timeline = identical results.
// Invariant on every tick: arrived = completed + rejected + timedOut + inFlight.
import { CohortQueue, Hist, LruCache, Rng, RT, Zipf, type Cohort } from './core';
import { curveAt, type Scenario } from './scenarios';

export const DT = 10;                 // ms of sim time per tick
export const SAMPLE_MS = 100;         // metrics sample period
export const CHECKPOINT_MS = 5000;    // rewind checkpoints
export const NET_MS = 20;             // client <-> edge round trip, added to every response
export const EDGE_HIT_MS = 2;         // cache hit service time at the edge
export const APP_MS = 6, DB_MS = 4;   // fixed service times on top of queueing
export const CACHE_KEYS = 50_000, CACHE_WARM_MS = 50;

export type LbStrategy = 'rr' | 'least' | 'weighted';
export type DbTier = 'S' | 'M' | 'L';
export const DB_TIERS: Record<DbTier, { units: number; cost: number }> = { S: { units: 8000, cost: 80 }, M: { units: 14000, cost: 180 }, L: { units: 24000, cost: 420 } };
export const COST = { app: 60, worker: 10, cachePer10k: 20 };   // fictional credits per hour

export interface Params {
  seed: number;
  trafficPct: number;       // 0..100 % of the scenario curve
  appReplicas: number;      // desired instance count (manual mode)
  appRate: number;          // req/s one instance's CPU can serve
  appConcurrency: number;   // max requests in service; effective rate = min(appRate, concurrency / service time)
  appQueue: number;         // per-instance queue capacity
  lb: LbStrategy;
  healthChecks: boolean;
  cacheOn: boolean;
  cacheSize: number;        // entries
  cacheTtl: number;         // ms
  autoscale: boolean;
  asTarget: number;         // target utilization 0..1
  asMin: number;
  asMax: number;
  startupDelay: number;     // ms an instance boots before it is routable
  asWindow: number;         // ms of utilization the autoscaler averages
  asCooldown: number;       // ms between scaling decisions
  dbTier: DbTier;
  dbQueue: number;
  workers: number;
  workerRate: number;       // jobs/s per worker
  jobQueue: number;
  jobRetries: number;
  jobFailRate: number;      // fraction of job attempts that fail (modelled, deterministic)
  timeout: number;          // ms a client waits before giving up
}

export const DEFAULT_PARAMS: Params = {
  seed: 20261101, trafficPct: 100, appReplicas: 2, appRate: 5000, appConcurrency: 400, appQueue: 4000, lb: 'least', healthChecks: false,
  cacheOn: false, cacheSize: 20000, cacheTtl: 30000, autoscale: false, asTarget: 0.7, asMin: 2, asMax: 12, startupDelay: 4000,
  asWindow: 3000, asCooldown: 5000, dbTier: 'M', dbQueue: 20000, workers: 6, workerRate: 400, jobQueue: 30000, jobRetries: 2,
  jobFailRate: 0.02, timeout: 2000,
};

/** an action on the timeline: set params at sim time `at` (ms). Recorded from the console or scripted for the reel. */
export interface Action { at: number; set: Partial<Params>; label?: string }

export type InstState = 'boot' | 'up' | 'drain' | 'off';
export interface Inst {
  id: number; state: InstState; launchedAt: number; readyAt: number; offAt: number;
  degraded: boolean; healthy: boolean; q: CohortQueue; credit: number;
  util: number;          // smoothed 0..1
  servedTick: number; assignedTick: number; served: number; assigned: number;   // per tick / per sample counters
}

export interface Totals { arrived: number; completed: number; rejected: number; timedOut: number; hits: number; misses: number;
  byType: number[]; jobsDone: number; jobsRetried: number; jobsDead: number; jobsRejected: number; spend: number; peakCost: number }

/** everything that changes during a run; cloned for checkpoints */
interface State {
  now: number; tick: number; p: Params; rng: Rng; insts: Inst[]; nextId: number; rr: number;
  cache: LruCache; db: CohortQueue; dbCredit: number; dbUsedTick: number; jobs: CohortQueue; jobCredit: number; jobUsedTick: number;
  retries: { n: number; at: number; attempt: number }[]; failAcc: number;
  arrAcc: number; arrEmitted: number; typeAcc: number[];
  totals: Totals; secHist: Hist[]; runHist: Hist; asUtil: number[]; asLast: number; actionIdx: number;
  flow: Flow; log: LogLine[]; recovered: boolean;
}

/** per-sample flows (requests in the last SAMPLE_MS) that the 3D world turns into particle density */
export interface Flow { arrivals: number; hits: number; toLb: number; toInst: number[]; toDb: number; toJobs: number; dbDone: number; jobsDone: number; rejected: number; timedOut: number; completed: number }
const newFlow = (): Flow => ({ arrivals: 0, hits: 0, toLb: 0, toInst: [], toDb: 0, toJobs: 0, dbDone: 0, jobsDone: 0, rejected: 0, timedOut: 0, completed: 0 });

export interface LogLine { t: number; kind: 'info' | 'warn' | 'bad' | 'good'; text: string }

export interface Sample {
  t: number; arrRate: number; doneRate: number; failRate: number; errRate: number; hitRate: number;
  p50: number; p95: number; mean: number; appUtil: number; dbUtil: number; jobUtil: number;
  inFlight: number; appQ: number; dbQ: number; jobQ: number; up: number; booting: number; cost: number;
}

export class Sim {
  sc: Scenario;
  actions: Action[];
  s!: State;
  samples: Sample[] = [];
  /** per-sample flows, index = sample number (what particles were emitted with at any past moment) */
  flows: Flow[] = [];
  private checkpoints: { at: number; state: State; samples: number }[] = [];
  private zipf = new Zipf(CACHE_KEYS, 1.0);
  private scale = 1;
  private winHist = new Hist();
  private sample = { arrived: 0, completed: 0, failed: 0, hits: 0, misses: 0, appUsed: 0, appCap: 0, dbUsed: 0, dbCap: 0, jobUsed: 0, jobCap: 0 };

  constructor(sc: Scenario, params: Partial<Params> = {}, actions: Action[] = []) {
    this.sc = sc;
    this.actions = [...actions].sort((a, b) => a.at - b.at);
    if (sc.exactTotal) {                        // scale the curve so the run's arrivals sum to exactly exactTotal
      let sum = 0;
      for (let k = 0; k < (sc.duration * 1000) / DT; k++) sum += (curveAt(sc.curve, (k * DT) / 1000) * DT) / 1000;
      this.scale = sc.exactTotal / sum;
    }
    this.reset({ ...DEFAULT_PARAMS, ...sc.params, ...params });
  }

  reset(p: Params) {
    const s: State = {
      now: 0, tick: 0, p: { ...p }, rng: new Rng(p.seed), insts: [], nextId: 0, rr: 0,
      cache: new LruCache(p.cacheSize, p.cacheTtl, CACHE_WARM_MS), db: new CohortQueue(p.dbQueue), dbCredit: 0, dbUsedTick: 0,
      jobs: new CohortQueue(p.jobQueue), jobCredit: 0, jobUsedTick: 0, retries: [], failAcc: 0, arrAcc: 0, arrEmitted: 0, typeAcc: [0, 0, 0, 0],
      totals: { arrived: 0, completed: 0, rejected: 0, timedOut: 0, hits: 0, misses: 0, byType: [0, 0, 0, 0], jobsDone: 0, jobsRetried: 0, jobsDead: 0, jobsRejected: 0, spend: 0, peakCost: 0 },
      secHist: [new Hist()], runHist: new Hist(), asUtil: [], asLast: -1e9, actionIdx: 0, flow: newFlow(), log: [], recovered: false,
    };
    this.s = s;
    for (let i = 0; i < p.appReplicas; i++) this.launch(true);
    this.samples = [];
    this.flows = [];
    this.checkpoints = [{ at: 0, state: cloneState(s), samples: 0 }];
    this.resetSample();
    this.log('info', `${this.sc.name}: ${p.appReplicas} app instance${p.appReplicas === 1 ? '' : 's'}, DB tier ${p.dbTier}, cache ${p.cacheOn ? 'on' : 'off'}`);
  }

  get done() { return this.s.now >= this.sc.duration * 1000; }
  get p() { return this.s.p; }
  get totals() { return this.s.totals; }
  get inFlight() { return this.s.insts.reduce((a, i) => a + i.q.size, 0) + this.s.db.size; }
  get insts() { return this.s.insts; }
  get logLines() { return this.s.log; }
  get cacheFill() { return this.s.cache.map.size; }
  get jobsQueued() { return this.s.jobs.size + this.s.retries.reduce((a, r) => a + r.n, 0); }
  get dbQueued() { return this.s.db.size; }
  /** current cost rate, credits/hr */
  get cost() {
    const p = this.s.p, live = this.s.insts.filter((i) => i.state !== 'off').length;
    return live * COST.app + DB_TIERS[p.dbTier].cost + p.workers * COST.worker + (p.cacheOn ? Math.ceil(p.cacheSize / 10000) * COST.cachePer10k : 0);
  }
  last(): Sample | undefined { return this.samples[this.samples.length - 1]; }

  /** records a console action at the current time (and drops any recorded future, e.g. after a rewind) */
  dispatch(set: Partial<Params>, label?: string) {
    this.actions = this.actions.slice(0, this.s.actionIdx);   // a new branch: forget the recorded future
    this.actions.push({ at: this.s.now, set, label });
  }

  /** advance to sim time `ms` (or the end of the scenario) */
  runTo(ms: number) { const end = Math.min(ms, this.sc.duration * 1000); while (this.s.now < end) this.step(); }

  /** rewind: restore the nearest checkpoint at or before `ms`, then re-simulate the recorded actions up to `ms` */
  seek(ms: number) {
    if (ms >= this.s.now) { this.runTo(ms); return; }
    let cp = this.checkpoints[0];
    for (const c of this.checkpoints) if (c.at <= ms) cp = c;
    this.s = cloneState(cp.state);
    this.samples.length = cp.samples;
    this.flows.length = cp.samples;
    this.checkpoints = this.checkpoints.filter((c) => c.at <= cp.at);
    this.rebuildWindow();
    this.resetSample();
    this.runTo(ms);
  }

  // ---------------------------------------------------------------------------------------------------------- one tick
  step() {
    const s = this.s, p = s.p, now = s.now, end = now + DT;
    while (s.actionIdx < this.actions.length && this.actions[s.actionIdx].at <= now) this.apply(this.actions[s.actionIdx++]);
    for (const f of this.sc.faults ?? []) if (f.at * 1000 === now) { const i = s.insts[f.inst]; if (i) { i.degraded = f.degraded; this.log('bad', `Instance #${i.id + 1} degraded: running at 30 % speed`); } }
    for (const i of s.insts) {
      if (i.state === 'boot' && now >= i.readyAt) { i.state = 'up'; this.log('good', `Instance #${i.id + 1} healthy (booted in ${((i.readyAt - i.launchedAt) / 1000).toFixed(1)} s)`); }
      i.servedTick = 0; i.assignedTick = 0;
    }

    // 1. arrivals: cumulative expected count, rounded, so totals are exact; the type split carries its own remainders
    const rate = curveAt(this.sc.curve, now / 1000) * this.scale * (p.trafficPct / 100);
    s.arrAcc += (rate * DT) / 1000;
    const A = Math.round(s.arrAcc) - s.arrEmitted;
    s.arrEmitted += A;
    const counts = this.split(A);
    s.totals.arrived += A; this.sample.arrived += A; s.flow.arrivals += A;
    for (let k = 0; k < 4; k++) s.totals.byType[k] += counts[k];

    // 2. edge cache: one Zipf key per cacheable read (the only per-request work)
    let miss = counts[RT.CREAD];
    if (p.cacheOn && miss > 0) {
      let hits = 0;
      for (let k = 0; k < counts[RT.CREAD]; k++) if (s.cache.lookup(this.zipf.sample(s.rng.next()), now)) hits++;
      miss -= hits;
      s.totals.hits += hits; this.sample.hits += hits; s.flow.hits += hits;
      this.complete(hits, NET_MS + EDGE_HIT_MS);
    }
    if (p.cacheOn) { s.totals.misses += miss; this.sample.misses += miss; }

    // 3. load balancer
    const toLb: Cohort[] = [];
    if (miss) toLb.push({ type: RT.CREAD, n: miss, born: now });
    for (const t of [RT.READ, RT.WRITE, RT.JOB] as RT[]) if (counts[t]) toLb.push({ type: t, n: counts[t], born: now });
    for (const c of toLb) { s.flow.toLb += c.n; this.route(c); }

    // 4. timeouts: clients give up on anything still queued after `timeout`
    const cutoff = end + NET_MS + APP_MS + DB_MS - p.timeout;   // anything older could only finish past the timeout
    const expire = (_t: RT, n: number) => { s.totals.timedOut += n; this.sample.failed += n; s.flow.timedOut += n; };
    for (const i of s.insts) i.q.expire(cutoff, expire);
    s.db.expire(cutoff, expire);

    // 5. app instances serve their queues
    let appUsed = 0, appCap = 0;
    for (const i of s.insts) {
      if (i.state !== 'up' && i.state !== 'drain') { i.util *= 0.9; continue; }
      const cap = this.instRate(i) * DT / 1000;
      const budget = cap + i.credit;
      const used = i.q.take(budget, () => 1, (t, n, born) => this.afterApp(t, n, born, end));
      i.credit = Math.min(budget - used, 1);
      i.servedTick = used; i.served += used;
      i.util += (Math.min(1, used / cap) - i.util) * 0.05;   // ~200 ms smoothing for the display
      appUsed += used; appCap += cap;
      if (i.state === 'drain' && i.q.size === 0) { i.state = 'off'; i.offAt = now; this.log('info', `Instance #${i.id + 1} decommissioned`); }
    }
    this.sample.appUsed += appUsed; this.sample.appCap += appCap;
    s.asUtil.push(appCap ? appUsed / appCap : 0);
    if (s.asUtil.length > p.asWindow / DT) s.asUtil.shift();

    // 6. database: writes cost 2 units, reads 1
    const dbCap = (DB_TIERS[p.dbTier].units * DT) / 1000, dbBudget = dbCap + s.dbCredit;
    const dbUsed = s.db.take(dbBudget, (t) => (t === RT.WRITE ? 2 : 1), (_t, n, born) => { s.flow.dbDone += n; this.complete(n, end - born + NET_MS + APP_MS + DB_MS); });
    s.dbCredit = Math.min(dbBudget - dbUsed, 2);
    s.dbUsedTick = dbUsed; this.sample.dbUsed += dbUsed; this.sample.dbCap += dbCap;

    // 7. workers: async jobs, with modelled failures retried after a 1 s backoff
    // (in the job queue a cohort's `born` holds its attempt number: job latency after the 202 ack is not a request latency)
    while (s.retries.length && s.retries[0].at <= now) { const r = s.retries.shift()!; const rej = s.jobs.push({ type: RT.JOB, n: r.n, born: r.attempt }); s.totals.jobsDead += rej; }
    const jobCap = (p.workers * p.workerRate * DT) / 1000, jobBudget = jobCap + s.jobCredit;
    const jobUsed = s.jobs.take(jobBudget, () => 1, (_t, n, attempt) => {
      s.failAcc += n * p.jobFailRate;
      const f = Math.min(n, Math.floor(s.failAcc)); s.failAcc -= f;
      s.totals.jobsDone += n - f; s.flow.jobsDone += n - f;
      if (f && attempt < p.jobRetries) { s.totals.jobsRetried += f; s.retries.push({ n: f, at: now + 1000, attempt: attempt + 1 }); }
      else if (f) s.totals.jobsDead += f;
    });
    s.jobCredit = Math.min(jobBudget - jobUsed, 1);
    s.jobUsedTick = jobUsed; this.sample.jobUsed += jobUsed; this.sample.jobCap += jobCap;

    // 8. health checks (every second) and the autoscaler
    if (now % 1000 === 0) { if (p.healthChecks) this.healthCheck(); if (p.autoscale) this.autoscale(); }

    // 9. cost, clock, samples, checkpoints
    const cost = this.cost;
    s.totals.spend += (cost * DT) / 3_600_000;
    s.totals.peakCost = Math.max(s.totals.peakCost, cost);
    s.now = end; s.tick++;
    if (end % 1000 === 0) s.secHist.push(new Hist());
    if (end % SAMPLE_MS === 0) this.takeSample();
    if (end % CHECKPOINT_MS === 0 && !this.checkpoints.some((c) => c.at === end)) this.checkpoints.push({ at: end, state: cloneState(s), samples: this.samples.length });
  }

  // ---------------------------------------------------------------------------------------------------------- parts
  private split(A: number): number[] {
    const s = this.s, mix = this.sc.mix, out = [0, 0, 0, 0];
    let given = 0;
    for (let k = 0; k < 4; k++) { s.typeAcc[k] += A * mix[k]; out[k] = Math.floor(s.typeAcc[k]); s.typeAcc[k] -= out[k]; given += out[k]; }
    while (given < A) {                                     // largest remainder gets the leftover requests
      let best = 0; for (let k = 1; k < 4; k++) if (s.typeAcc[k] > s.typeAcc[best]) best = k;
      out[best]++; s.typeAcc[best] -= 1; given++;
    }
    return out;
  }

  private instRate(i: Inst) { const p = this.s.p; return Math.min(p.appRate, p.appConcurrency / ((APP_MS + DB_MS) / 1000) ) * (i.degraded ? 0.3 : 1); }
  private routable() { return this.s.insts.filter((i) => i.state === 'up' && (!this.s.p.healthChecks || i.healthy)); }

  private route(c: Cohort) {
    const s = this.s, rs = this.routable();
    if (!rs.length) { this.reject(c.n); return; }
    const give = (i: Inst, n: number) => {
      if (n <= 0) return;
      const rej = i.q.push({ type: c.type, n, born: c.born });
      i.assignedTick += n - rej; i.assigned += n - rej;
      s.flow.toInst[i.id] = (s.flow.toInst[i.id] ?? 0) + n - rej;
      if (rej) this.reject(rej);
    };
    const k = rs.length;
    if (s.p.lb === 'rr') {                                  // exact per-request round robin over the rotation
      const base = Math.floor(c.n / k), extra = c.n % k;
      for (let j = 0; j < k; j++) give(rs[(s.rr + j) % k], base + (j < extra ? 1 : 0));
      s.rr = (s.rr + c.n) % k;
    } else if (s.p.lb === 'least') {                        // sixteen chunks, each to the instance with the fewest open requests
      const chunks = Math.min(16, c.n);
      for (let j = 0; j < chunks; j++) {
        const n = Math.floor((c.n * (j + 1)) / chunks) - Math.floor((c.n * j) / chunks);
        let best = rs[0]; for (const i of rs) if (i.q.size < best.q.size) best = i;
        give(best, n);
      }
    } else {                                                // weighted by configured (nominal) capacity, largest remainder
      const w = rs.map(() => s.p.appRate), W = w.reduce((a, b) => a + b, 0);
      const share = w.map((x) => (c.n * x) / W), n = share.map(Math.floor);
      let left = c.n - n.reduce((a, b) => a + b, 0);
      const order = share.map((x, j) => [x - n[j], j]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
      for (const [, j] of order) { if (left-- <= 0) break; n[j]++; }
      rs.forEach((i, j) => give(i, n[j]));
    }
  }

  /** a request finished its app step: jobs are acknowledged (202) and queued for workers; reads and writes go to the DB */
  private afterApp(t: RT, n: number, born: number, end: number) {
    const s = this.s;
    if (t === RT.JOB) {
      const rej = s.jobs.push({ type: RT.JOB, n, born: 0 });
      s.totals.jobsRejected += rej; s.flow.toJobs += n - rej;
      this.complete(n - rej, end - born + NET_MS + APP_MS);
      if (rej) this.reject(rej);
    } else {
      const rej = s.db.push({ type: t, n, born });
      s.flow.toDb += n - rej;
      if (rej) this.reject(rej);
    }
  }

  private complete(n: number, ms: number) {
    if (n <= 0) return;
    const s = this.s;
    s.totals.completed += n; this.sample.completed += n; s.flow.completed += n;
    s.secHist[s.secHist.length - 1].add(ms, n); s.runHist.add(ms, n); this.winHist.add(ms, n);
  }
  private reject(n: number) { const s = this.s; s.totals.rejected += n; this.sample.failed += n; s.flow.rejected += n; }

  private launch(instant = false) {
    const s = this.s, id = s.nextId++;
    const ready = instant ? s.now : s.now + s.p.startupDelay;
    s.insts.push({ id, state: instant ? 'up' : 'boot', launchedAt: s.now, readyAt: ready, offAt: -1, degraded: false, healthy: true,
      q: new CohortQueue(s.p.appQueue), credit: 0, util: 0, servedTick: 0, assignedTick: 0, served: 0, assigned: 0 });
  }
  /** graceful scale-in: stop routing to the newest instance; it serves what it has queued, then shuts down */
  private retire() {
    const s = this.s, live = s.insts.filter((i) => i.state === 'boot' || i.state === 'up');
    const i = live[live.length - 1];
    if (!i) return;
    if (i.state === 'boot') { i.state = 'off'; i.offAt = s.now; } else i.state = 'drain';
  }
  private live() { return this.s.insts.filter((i) => i.state === 'boot' || i.state === 'up').length; }

  private apply(a: Action) {
    const s = this.s, prev = s.p, p = (s.p = { ...prev, ...a.set });
    if (a.label) this.log('info', a.label);
    if (a.set.appReplicas !== undefined && !p.autoscale) {
      const want = Math.max(1, Math.min(16, p.appReplicas));
      let n = this.live();
      if (want > n) this.log('info', `Launching ${want - n} app instance${want - n > 1 ? 's' : ''} (${(p.startupDelay / 1000).toFixed(0)} s boot)`);
      while (n < want) { this.launch(); n++; }
      while (n > want) { this.retire(); n--; }
    }
    if (a.set.cacheSize !== undefined) s.cache.resize(p.cacheSize);
    if (a.set.cacheTtl !== undefined) s.cache.ttl = p.cacheTtl;
    if (a.set.cacheOn === false) s.cache.clear();
    if (a.set.dbQueue !== undefined) s.db.cap = p.dbQueue;
    if (a.set.jobQueue !== undefined) s.jobs.cap = p.jobQueue;
    if (a.set.appQueue !== undefined) for (const i of s.insts) i.q.cap = p.appQueue;
    if (a.set.dbTier && a.set.dbTier !== prev.dbTier) this.log('info', `Database tier ${prev.dbTier} → ${p.dbTier} (${DB_TIERS[p.dbTier].units.toLocaleString()} units/s)`);
    if (a.set.cacheOn !== undefined && a.set.cacheOn !== prev.cacheOn) this.log(a.set.cacheOn ? 'good' : 'info', `Edge cache ${a.set.cacheOn ? 'ON' : 'OFF'}`);
    if (a.set.autoscale !== undefined && a.set.autoscale !== prev.autoscale) this.log('info', `Autoscaling ${a.set.autoscale ? `ON (target ${Math.round(p.asTarget * 100)} %, ${p.asMin}–${p.asMax})` : 'OFF'}`);
    if (a.set.lb && a.set.lb !== prev.lb) this.log('info', `Load balancer: ${{ rr: 'round robin', least: 'least connections', weighted: 'weighted' }[p.lb]}`);
  }

  private healthCheck() {
    const s = this.s;
    for (const i of s.insts) {
      if (i.state !== 'up') continue;
      const wait = i.q.size / this.instRate(i);
      if (i.healthy && wait > 1) { i.healthy = false; this.log('warn', `Health check: instance #${i.id + 1} pulled from rotation (${wait.toFixed(1)} s queue)`); }
      else if (!i.healthy && wait < 0.25) { i.healthy = true; this.log('good', `Health check: instance #${i.id + 1} back in rotation`); }
    }
  }

  /** the Kubernetes HPA rule: desired = ceil(ready · util / target), both directions, ignored within a 10 % tolerance */
  private autoscale() {
    const s = this.s, p = s.p;
    if (s.now - s.asLast < p.asCooldown || !s.asUtil.length) return;
    const util = s.asUtil.reduce((a, b) => a + b, 0) / s.asUtil.length;
    const up = s.insts.filter((i) => i.state === 'up').length, live = this.live();
    if (Math.abs(util / p.asTarget - 1) <= 0.1) return;
    const desired = Math.max(p.asMin, Math.min(p.asMax, Math.ceil((up * util) / p.asTarget)));
    if (desired > live) {
      for (let k = live; k < desired; k++) this.launch();
      s.asLast = s.now;
      this.log('warn', `Autoscaler: utilization ${Math.round(util * 100)} % vs target ${Math.round(p.asTarget * 100)} % → launching ${desired - live} (boot ${(p.startupDelay / 1000).toFixed(0)} s)`);
    } else if (desired < live && desired < up) {
      for (let k = desired; k < live; k++) this.retire();
      s.asLast = s.now;
      this.log('info', `Autoscaler: utilization ${Math.round(util * 100)} % → scaling in to ${desired}`);
    }
  }

  /** the flows of the last complete sample period (what the 3D world draws) */
  lastFlow: Flow = newFlow();
  private resetSample() { for (const k in this.sample) (this.sample as Record<string, number>)[k] = 0; this.lastFlow = this.s.flow; this.s.flow = newFlow(); }
  private rebuildWindow() { this.winHist = new Hist(); for (const h of this.s.secHist.slice(-5)) this.winHist.addHist(h); }

  private takeSample() {
    const s = this.s, x = this.sample, k = 1000 / SAMPLE_MS;
    if (s.now % 1000 === 0) this.rebuildWindow();          // the window is the last 5 one-second histograms
    const ms = this.winHist;
    const looked = x.hits + x.misses;
    const sm: Sample = {
      t: s.now / 1000, arrRate: x.arrived * k, doneRate: x.completed * k, failRate: x.failed * k,
      errRate: x.completed + x.failed ? x.failed / (x.completed + x.failed) : 0,
      hitRate: looked ? x.hits / looked : 0, p50: ms.quantile(0.5), p95: ms.quantile(0.95), mean: ms.mean(),
      appUtil: x.appCap ? x.appUsed / x.appCap : 0, dbUtil: x.dbCap ? x.dbUsed / x.dbCap : 0, jobUtil: x.jobCap ? x.jobUsed / x.jobCap : 0,
      inFlight: this.inFlight, appQ: s.insts.reduce((a, i) => a + i.q.size, 0), dbQ: s.db.size, jobQ: this.jobsQueued,
      up: s.insts.filter((i) => i.state === 'up').length, booting: s.insts.filter((i) => i.state === 'boot').length, cost: this.cost,
    };
    this.samples.push(sm);
    this.flows.push(s.flow);
    // SYSTEM RECOVERED: only on live metrics (2 s of < 1 % errors, p95 under target, every tier under 90 %), after trouble
    const recent = this.samples.slice(-20);
    const ok = recent.length === 20 && recent.every((r) => r.errRate < 0.01 && r.p95 <= this.sc.targets.p95 && r.dbUtil < 0.9 && r.appUtil < 0.9);
    const trouble = this.samples.some((r) => r.errRate > 0.05 || r.dbUtil > 0.98);
    if (!s.recovered && ok && trouble) { s.recovered = true; this.log('good', 'SYSTEM RECOVERED: errors < 1 %, p95 within target, every tier under 90 %'); }
    if (s.recovered && !ok && recent.at(-1)!.errRate > 0.05) s.recovered = false;
    for (const i of s.insts) { i.served = 0; i.assigned = 0; }
    this.resetSample();
  }
  get recovered() { return this.s.recovered; }

  private log(kind: LogLine['kind'], text: string) { this.s.log.push({ t: this.s.now / 1000, kind, text }); if (this.s.log.length > 200) this.s.log.shift(); }

  /** final mission report with the transparent score formula */
  report() {
    const T = this.s.totals, tg = this.sc.targets;
    const finished = T.completed + T.rejected + T.timedOut;
    const success = finished ? T.completed / finished : 1;
    const p95 = this.s.runHist.quantile(0.95), p50 = this.s.runHist.quantile(0.5);
    const rel = Math.min(1, success / tg.success), lat = Math.min(1, tg.p95 / Math.max(1, p95)), cost = Math.max(0, Math.min(1, 1.5 - T.peakCost / tg.budget));   // full marks at <= 50 % of budget
    const score = Math.round(1000 * (0.5 * rel + 0.3 * lat + 0.2 * cost));
    const passed = success >= tg.success && p95 <= tg.p95 && T.peakCost <= tg.budget;
    return { success, p50, p95, mean: this.s.runHist.mean(), peakCost: T.peakCost, spend: T.spend, score, passed, rel, lat, cost, totals: { ...T } };
  }
}

function cloneState(s: State): State {
  return {
    ...s, p: { ...s.p }, rng: new Rng(s.rng.s),
    insts: s.insts.map((i) => ({ ...i, q: i.q.clone() })),
    cache: s.cache.clone(), db: s.db.clone(), jobs: s.jobs.clone(), retries: s.retries.map((r) => ({ ...r })),
    typeAcc: [...s.typeAcc], totals: { ...s.totals, byType: [...s.totals.byType] },
    secHist: s.secHist.map((h) => h.clone()), runHist: s.runHist.clone(), asUtil: [...s.asUtil],
    flow: { ...s.flow, toInst: [...s.flow.toInst] }, log: [...s.log],
  };
}
