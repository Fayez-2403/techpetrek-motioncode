// Small deterministic building blocks the engine is made of: a seeded RNG, a Zipf key sampler, a FIFO queue of request
// cohorts, an LRU+TTL cache and a latency histogram. Nothing here reads a clock or Math.random.

/** mulberry32: a fast seeded PRNG; returns floats in [0, 1). Its state is one uint32, so it snapshots trivially. */
export class Rng {
  s: number;
  constructor(seed: number) { this.s = seed >>> 0; }
  next(): number {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/** Zipf(s) over keys 0..n-1 by inverse CDF (binary search). Key 0 is the most popular. */
export class Zipf {
  cdf: Float64Array;
  constructor(n: number, s = 1.0) {
    this.cdf = new Float64Array(n);
    let acc = 0;
    for (let i = 0; i < n; i++) { acc += 1 / Math.pow(i + 1, s); this.cdf[i] = acc; }
    for (let i = 0; i < n; i++) this.cdf[i] /= acc;
  }
  sample(u: number): number {
    let lo = 0, hi = this.cdf.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (this.cdf[m] < u) lo = m + 1; else hi = m; }
    return lo;
  }
}

export const RT = { CREAD: 0, READ: 1, WRITE: 2, JOB: 3 } as const;
export type RT = 0 | 1 | 2 | 3;
export const RT_NAMES = ['cacheable read', 'read', 'write', 'async job'] as const;

/** A group of identical requests that arrived in the same tick. Counts are integers so accounting is exact. */
export interface Cohort { type: RT; n: number; born: number }

/** FIFO of cohorts with a hard capacity (in requests). take() splits a cohort when capacity runs out mid-cohort. */
export class CohortQueue {
  items: Cohort[] = [];
  head = 0;
  size = 0;
  constructor(public cap: number) {}
  /** pushes what fits; returns how many were rejected (queue full) */
  push(c: Cohort): number {
    const room = Math.max(0, this.cap - this.size);
    const n = Math.min(room, c.n);
    if (n > 0) {
      const last = this.items.length > this.head ? this.items[this.items.length - 1] : null;
      if (last && last.type === c.type && last.born === c.born) last.n += n;   // merge same-tick arrivals
      else this.items.push({ type: c.type, n, born: c.born } as Cohort);
      this.size += n;
    }
    return c.n - n;
  }
  /** removes up to `budget` cost units from the head; cost(type) per request. Calls out(type, n, born) per piece. */
  take(budget: number, cost: (t: RT) => number, out: (t: RT, n: number, born: number) => void): number {
    let used = 0;
    while (this.head < this.items.length) {
      const c = this.items[this.head], k = cost(c.type);
      const fit = Math.min(c.n, Math.floor((budget - used) / k));
      if (fit <= 0) break;
      out(c.type, fit, c.born);
      c.n -= fit; this.size -= fit; used += fit * k;
      if (c.n === 0) this.head++; else break;
    }
    this.compact();
    return used;
  }
  /** drops cohorts born before `cutoff` from the head (the client gave up); returns dropped counts by type */
  expire(cutoff: number, out: (t: RT, n: number) => void) {
    while (this.head < this.items.length && this.items[this.head].born < cutoff) {
      const c = this.items[this.head++]; this.size -= c.n; out(c.type, c.n);
    }
    this.compact();
  }
  /** empties the queue into out() (used when an instance is terminated) */
  drain(out: (t: RT, n: number) => void) { this.expire(Infinity, out); }
  oldest(): number { return this.head < this.items.length ? this.items[this.head].born : Infinity; }
  private compact() { if (this.head > 64 && this.head * 2 > this.items.length) { this.items = this.items.slice(this.head); this.head = 0; } }
  clone(): CohortQueue { const q = new CohortQueue(this.cap); q.items = this.items.slice(this.head).map((c) => ({ ...c })); q.size = this.size; return q; }
}

/** LRU cache with TTL and a warm-up delay (fill on miss). Map keeps insertion order, so the first key is the LRU one. */
export class LruCache {
  map = new Map<number, number>();   // key -> readyAt (ms); expiry = readyAt + ttl
  constructor(public cap: number, public ttl: number, public warm: number) {}
  /** true on a hit; on a miss the key starts warming (unless it is already warming) */
  lookup(key: number, now: number): boolean {
    const ready = this.map.get(key);
    if (ready !== undefined) {
      if (now >= ready && now < ready + this.ttl) { this.map.delete(key); this.map.set(key, ready); return true; }
      if (now < ready) return false;                     // still warming: a miss, the fill is already in flight
      this.map.delete(key);                              // expired
    }
    this.map.set(key, now + this.warm);
    if (this.map.size > this.cap) this.map.delete(this.map.keys().next().value as number);
    return false;
  }
  resize(cap: number) { this.cap = cap; while (this.map.size > cap) this.map.delete(this.map.keys().next().value as number); }
  clear() { this.map.clear(); }
  clone(): LruCache { const c = new LruCache(this.cap, this.ttl, this.warm); c.map = new Map(this.map); return c; }
}

/** Latency histogram over completed requests: 5 ms buckets up to 10 s (the last bucket collects the rest). */
export const BUCKET_MS = 5, BUCKETS = 2000;
export class Hist {
  b = new Float64Array(BUCKETS);
  n = 0;
  sum = 0;
  add(ms: number, count: number) {
    const i = Math.min(BUCKETS - 1, Math.floor(ms / BUCKET_MS));
    this.b[i] += count; this.n += count; this.sum += ms * count;
  }
  addHist(h: Hist) { for (let i = 0; i < BUCKETS; i++) this.b[i] += h.b[i]; this.n += h.n; this.sum += h.sum; }
  /** the q-quantile, reported as the upper edge of its bucket (a conservative estimate, at most 5 ms high) */
  quantile(q: number): number {
    if (this.n === 0) return 0;
    const target = q * this.n;
    let acc = 0;
    for (let i = 0; i < BUCKETS; i++) { acc += this.b[i]; if (acc >= target) return (i + 1) * BUCKET_MS; }
    return BUCKETS * BUCKET_MS;
  }
  mean() { return this.n ? this.sum / this.n : 0; }
  clone(): Hist { const h = new Hist(); h.b.set(this.b); h.n = this.n; h.sum = this.sum; return h; }
}
