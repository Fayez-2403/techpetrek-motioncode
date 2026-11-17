# SERVER SIEGE — Master Prompt (TPT-20261101-SIEGE-01)

The user's original brief, mastered: every open choice is now a decision, every number is pinned and every honesty rule is
testable. Build exactly this. If something here conflicts with the user's later notes, the notes win.

## 0. One line
A playable 3D system-design simulator in which a fictional indie game's launch goes viral. One million **simulated**
requests hit the backend in 60 s of sim time, and the player keeps it alive. Alongside it, a 68 s Hinglish explainer reel
in which **Bro** (the Bro & Bhai series host, bottom-left) explains every beat, in sync with an original 120 BPM score.

**Lesson:** *Scaling isn't just adding servers. It's understanding the bottleneck.*
**Viewer reaction we want:** "Wait… I can actually PLAY system design?!"

## 1. Non-negotiables
1. **The simulation is the product.** The 3D world and the reel only display sim state; nothing visual invents an outcome.
2. **Determinism.** The same seed, scenario, parameters and action timeline give byte-identical metrics. There is no Math.random,
   Date.now or performance.now inside the sim, and the sim clock is independent of the render fps.
3. **Honesty.**
   - The words are always "simulated requests". It is never a load test of a real site, and no network calls are made.
   - Costs are fictional "credits/hr", and particles are labelled as aggregates ("1 packet ≈ N requests").
   - Every number on screen in the reel comes from a sim run that is logged in docs/factcheck.md.
4. **Accounting balances on every tick:** `arrived = completed + failed + inFlight`. Failed is split into rejected
   (queue full) and timed out.
5. **SYSTEM RECOVERED and mission success** show only when the live metrics meet the declared targets.

## 2. Simulation model (fixed timestep, cohort-based)
- **Clock.** dt = 10 ms of sim time; 6,000 ticks = 60 s. Requests move as **cohorts** {type, count, bornAt}, and FIFO queues
  split cohorts when capacity runs out mid-cohort. This is how 1M logical requests run in well under a second without one object
  per request.
- **Arrivals.** Each scenario defines a rate curve r(t). Arrivals per tick are taken from the cumulative expected count, so the
  total is exact (the 1M challenge produces exactly 1,000,000). Request types are drawn with a seeded RNG in fixed proportions.
- **Request types (challenge mix):**

  | Type | Share | Path | DB work |
  |---|---|---|---|
  | Cacheable read | 60 % | Cache → (miss) LB → app → DB | 1 unit |
  | Non-cacheable read | 15 % | LB → app → DB | 1 unit |
  | Write | 15 % | LB → app → DB (never cached) | 2 units |
  | Async job | 10 % | LB → app → job queue → 202 ack; workers process later | 0 |

- **Cache.**
  - **Keys:** cacheable reads pick a key from a Zipf(s = 1.0) distribution over 50,000 keys, one seeded draw per request. Those
    draws are the only per-request work.
  - **Policy:** LRU with a size limit and a TTL, filled on miss. A new entry is "warming" for 50 ms, and hits on a warming entry
    count as misses.
  - **Accounting:** hits complete at the edge in 2 ms and never touch app or DB capacity.
- **App instances.**
  - **Capacity:** 2,500 req/s each, with a local queue of 4,000.
  - **States:** booting (startup delay, not routable), healthy, stressed (≥ 70 %), overloaded (≥ 95 % or queue > 50 %),
    degraded (a scenario fault at 30 % speed), and draining or terminated.
- **Load balancer.**
  - **Round robin:** rotates over routable instances, blind to load.
  - **Least connections:** sends each 1/16 chunk of the tick to the instance with the lowest (queue + active).
  - **Weighted:** splits by effective capacity.
  - **Health checks** (toggle) pull an instance whose queue wait exceeds 1 s.
- **Database.** Its capacity is independent of the app tier.
  - **Tiers:** S = 8,000 units/s (40 cr/hr), M = 14,000 (90), L = 24,000 (200), with a queue of 20,000.
  - **App replicas never change DB capacity.** A test enforces this.
- **Worker pool.** Each worker runs 400 jobs/s. The job queue capacity is configurable. Failed jobs retry up to the set limit,
  with a 1 s backoff.
- **Timeouts.** A synchronous request older than the timeout (default 2 s) in any queue fails as timed out. Async jobs time out
  only at the ack.
- **Autoscaler.**
  - **Inputs:** target utilization, min, max, a 3 s observation window, a 5 s cooldown and a 4 s startup delay.
  - **Scale-out** is proportional: `desired = ceil(n · util / target)`. Scale-in happens below half the target after cooldown.
  - **Cost** starts the moment an instance launches.
- **Metrics.**
  - **Per tick:** arrivals, completions, failures, in-flight, queue lengths, utilization, hit rate, replica count and cost.
  - **Latencies:** recorded in a 1 ms-bucket histogram from completed requests only. p50 and p95 are read from a 5 s sliding
    window of per-second histograms, plus the whole run. This bounded window is documented as the limitation.
- **Replay.** Checkpoints are kept every 5 s of sim time. Rewind restores the nearest checkpoint and re-simulates the recorded
  action timeline. Playback runs at 0.25×–4×, with pause, resume and restart.
- **Score.**

  ```
  score = round(1000 · (0.5 · reliability + 0.3 · latency + 0.2 · cost))
  reliability = success / target success   (capped at 1)
  latency     = p95 target / p95           (capped at 1)
  cost        = budget / spend             (capped at 1)
  ```

  The mission passes only if success ≥ target, p95 ≤ target and spend ≤ budget.

## 3. Levels
1. **First spike:** 1 app instance and rising traffic. Watch queues form, add capacity, and keep errors under 2 %.
2. **The load balancer:** 4 instances, one degraded. Round robin feeds the sick one, so switch to least connections or enable
   health checks.
3. **Database bottleneck:** app replicas are cheap here, but DB tier S saturates. Find the real bottleneck.
4. **Cache rescue:** 80 % repeated reads. Enable and size the cache until DB load falls below capacity.
5. **Autoscaling delay:** the surge arrives faster than a 4 s boot. Set baseline capacity plus a policy that leads the surge.
6. **The One Million Challenge:** 1,000,000 requests in 60 s; targets ≥ 99 % success, p95 ≤ 400 ms, and a budget of
   1,200 credits/hr at peak.

## 4. The world: Server City on a floating circuit board
The districts run front to back along the request path: Edge Gateway (cyan arch) → Cache Vault (glass tower, emerald blocks)
→ Load Balancer (rotating ring) → App District (instanced towers that rise mechanically) → Database Core (orange reactor) →
Job Conveyor.

- **Colour code:**
  - cyan: healthy
  - amber: stressed
  - coral red: overloaded
  - grey: unavailable
  - emerald: cache hit
  - violet: async job
- **Particles:** instanced, pooled packets along each link, with density proportional to the measured flow.
- **Queues:** stacked crates at the entrance of each building, with height set by the queue length (log scale).
- **Rendering:** PBR navy metal, fog, restrained bloom (only emissive levels above 1 bloom), and soft shadows.
- **Camera:** overview, follow request, bottleneck (auto-targets the most utilized tier), free orbit and cinematic modes.

## 5. Architect Console
- **Controls:**
  - traffic %
  - app replicas
  - LB strategy plus health checks
  - cache on/off, size and TTL
  - autoscale on/off, target, min and max
  - DB tier
  - workers
  - time (pause, speed, rewind, restart)
  - camera
  - debug log
  - scenario
- **Tooltips:** each control carries a one-line engineering explanation.
- **Disabled controls:** anything a level locks is greyed out with the reason.

## 6. The reel: 68 s, 1080×1920, 60 fps, film grammar EXPLAINER (host-led)
- **Host.** Bro (series cartoon, bottom-left, the bro-bhai pose PNGs) explains, voiced by ElevenLabs Liam (Turbo v2.5, hi) in
  Hinglish.
- **Picture.** The upper ~62 % is a **real capture** of the app's `?reel=1` mode: a fixed seed and a recorded action timeline
  seeked frame by frame. On top: word-level captions, a few kinetic words and real metric readouts.
- **Music.** Original, 120 BPM. Bar 1 lands at 3.0 s, so every section edge below sits on a bar line (2 s per bar).

| Time | Beat (sim action) | VO (verbatim from the user, may be trimmed to fit the window) |
|---|---|---|
| 0–3 | Request tsunami hits the city | "10 LAKH requests! Aur mera server… gaya!" |
| 3–9 | Fly-over reveal of the districts | "Toh maine banaya SERVER SIEGE — ek playable 3D system-design simulator!" |
| 9–17 | Traffic slider → app queues, p95 up, errors | "Traffic badhao… requests line mein lagti hain, latency badhti hai, aur errors start!" |
| 17–25 | +3 replicas rise; LB spreads load | "Easy fix? Aur servers add kar do! Load balancer sabko traffic distribute karega." |
| 25–33 | Dive under the towers: DB core red. "YOU SCALED THE WRONG LAYER." | "Lekin ruk… database hi overload ho gaya! Sirf servers badhane se problem solve nahi hui." |
| 33–41 | Cache ON → emerald hits; DB util falls | "Ab cache enable karo. Repeated reads ka load kam hota hai, aur database ko breathing room milta hai!" |
| 41–49 | Autoscale ON; booting towers visible | "Autoscaling bhi lagao—traffic badhe toh new instances automatically ready ho sakein." |
| 49–57 | Queues drain; SYSTEM RECOVERED (if met) | "Capacity, caching aur queue ko balance karo… aur system recover kar sakta hai!" |
| 57–63 | The real console being used | "Best part? Ye scripted animation nahi. Har control ke peeche actual simulation logic hai!" |
| 63–68 | Hero shot, CTA | "Tum apne server ko bacha paoge? Comment SERVER!" |

**Score.**
- 0–3: tense intro and impact.
- 3–25: driving pulse.
- 25–33: drop to low bass, with a ducked stop before "Lekin ruk".
- 33–49: rising recovery theme.
- 49–63: restrained triumphant groove.
- 63–68: signature hit.

**Sound effects** follow the real sim events: tower rise, cache hits, DB alarm, recovery.

**Labels:**
- "Simulated backend · fictional costs" stays small throughout.
- The hook says "simulated".

## 7. Deliverables
web app (`web/`), sim tests (bun test), docs/SIMULATION.md (assumptions and limits), the reel (Remotion `src/`), VO script and
SRT, cover, SEO caption, testing report.
