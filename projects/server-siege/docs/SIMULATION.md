# SERVER SIEGE: how the simulation works, and what it does not model

The simulation lives in `web/src/simulation/` (`core.ts`, `engine.ts`, `scenarios.ts`) and is tested in
`web/tests/simulation.test.ts` (`cd web && bun test`: 12 checks). The 3D world and the reel only **display** its state.

## Model
- **Clock.** A fixed 10 ms timestep, independent of the render frame rate. A 60 s scenario is 6,000 ticks.
- **Requests as cohorts.** Requests that arrive in the same tick with the same type move together as one integer
  count `{type, n, bornAt}`. FIFO queues split a cohort when capacity runs out mid-cohort. One million logical requests
  therefore cost a few thousand queue operations, and `arrived = completed + rejected + timedOut + inFlight` holds
  exactly on every tick (tested).
- **Arrivals.** Each scenario has a piecewise-linear rate curve. Arrivals are taken from the rounded cumulative expected
  count. The One Million Challenge scales its curve so the run sends exactly 1,000,000. Types are split by a
  largest-remainder rule, so the mix is exact.
- **Request types.**

  | Type | Share | Path | DB cost |
  |---|---|---|---|
  | Cacheable read | 62 % | edge cache → (miss) LB → app → DB | 1 unit |
  | Read | 13 % | LB → app → DB | 1 unit |
  | Write | 12 % | LB → app → DB, never cached | 2 units |
  | Async job | 13 % | LB → app → job queue | none; workers |

  Level 4 uses 80 / 5 / 7 / 8.
- **Edge cache.** LRU with a size limit and a TTL, filled on miss with a 50 ms warm-up (misses while warming still go
  to the DB).
  - **Key draws:** each cacheable read draws a key from Zipf(s = 1) over 50,000 keys with a seeded mulberry32 RNG. This
    is the only per-request work.
  - **Hits** complete in 22 ms (20 ms network + 2 ms edge) and never use app or DB capacity.
- **App instances.**
  - **Rate:** 5,000 req/s, capped at `concurrency / service time`. A degraded instance runs at 30 %.
  - **Queue:** 4,000 per instance. Overflow is rejected (503).
  - **Boot:** a new instance boots for `startupDelay` (4 s) before it is routable. Scale-in drains gracefully.
- **Load balancer.**
  - **Round robin:** exact per-request rotation, blind to load.
  - **Least connections:** routes in 1/16 chunks to the shortest queue.
  - **Weighted:** splits by configured (nominal) capacity, and does not know an instance is degraded.
  - **Health checks:** optional, once a second. An instance whose queue wait exceeds 1 s leaves the rotation, and
    returns below 0.25 s.
- **Database.** Its own capacity: tier S = 8,000, M = 14,000 and L = 24,000 units/s. Its queue holds 20,000. **App
  replicas never change it** (tested).
- **Workers.** 400 jobs/s each. 2 % of attempts fail (deterministic) and retry after 1 s, up to the retry limit; after
  that they are dead-lettered.
- **Timeouts.** A synchronous request still queued when it could only finish past the client timeout (default 2 s) is
  counted as timed out.
- **Autoscaler.** The Kubernetes HPA rule: `desired = ceil(ready · util / target)` over a 3 s utilization window, in
  both directions.
  - **Tolerance:** no change within ±10 % of the target.
  - **Cooldown:** 5 s between decisions (3 s in the reel run).
  - **Boot and limits:** it respects the boot delay and its min/max.
- **Latency.**
  - **Formula:** completion time − arrival time + 20 ms network + fixed service times (app 6 ms, DB 4 ms).
  - **Histogram:** recorded from completed requests only, in 5 ms buckets up to 10 s.
  - **Percentiles:** live p50 and p95 use a sliding window of the last 5 one-second histograms; the report uses the
    whole run. A percentile is the upper edge of its bucket, so it reads at most 5 ms high.
- **Cost.** Fictional credits/hr:
  - app instance 60
  - DB S, M or L: 80, 180 or 420
  - worker 10
  - cache 20 per 10k entries

  The budget compares the **peak** rate.
- **Score.**

  ```
  score = 1000 · (0.5 · min(1, success / target) + 0.3 · min(1, p95 target / p95) + 0.2 · clamp(1.5 − peak cost / budget))
  ```

  The mission passes only if all three targets are met.
- **Determinism and replay.** There is no clock or Math.random in the sim. The same seed, scenario, parameters and
  action timeline give byte-identical samples (tested). Checkpoints are taken every 5 s of sim time. Rewind restores
  the nearest checkpoint and re-simulates the recorded actions, and that equals a fresh run (tested).

## Not modelled (by design)
- **Network.** No real network: no packet loss, TCP or TLS, and no geography or CDN PoPs.
- **Database.** No connection-pool exhaustion, lock contention, replication lag, indexes or query plans. The DB is
  a single FIFO queue with a work-unit capacity.
- **Coupling.** App instances don't hold a slot while waiting on the DB; app and DB are tandem queues.
- **Retries.** No retry storms from clients: a failed request is final. Job retries are modelled.
- **Cache.** No cache stampede or thundering herd beyond the warm-up window, and no write invalidation.
- **Queue order.** FIFO timeouts drop from the head. Load-balancer splitting can make arrival order inside an app queue
  slightly non-monotonic, and the model ignores that.
- **Cost.** Not real cloud pricing.

## Honesty
This is a teaching simulator. Its numbers are simulated, never measurements of a real system, and the reel says so
on screen.
