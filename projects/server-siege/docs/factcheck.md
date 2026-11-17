# Fact check: SERVER SIEGE — Can your backend survive?

Every on-screen and spoken claim traces to a row here (master studio §2).

- **Status:** verified / uncertain / removed.
- **Kinds:**
  - official announcement
  - community demo
  - marketing claim
  - research finding
  - unverified viral claim
  - our illustrative animation
- **Blocked sources:** if a source is blocked (X often is), say so here. Never describe unseen footage.

| # | Claim | Kind | Source URL | Supporting excerpt / location | Status | Approved on-screen / spoken wording |
|---|---|---|---|---|---|---|
| F1 | 10 LAKH (1,000,000) simulated requests | our simulation | audio/out/reel_run.json (seed 20261101, REEL_ACTIONS) | Reel run: arrived = 1000000 (exactTotal 1M, test 3+4) | verified | "10 LAKH SIMULATED REQUESTS" |
| F2 | Errors rise when traffic surges on 2 app servers | our simulation | audio/out/reel_run.json (seed 20261101, REEL_ACTIONS) | reel 13 s (sim 10 s): err 45.1 %, app util 100 % | verified | VO v03 + live strip |
| F3 | Adding servers helps the app tier but the DB overloads | our simulation | audio/out/reel_run.json (seed 20261101, REEL_ACTIONS) | reel 27 s (sim 24 s): app 79 %, DB 100 %, 5 servers | verified | "YOU SCALED THE WRONG LAYER" (overlay gated on DB >= 95 %, app < 90 %, >= 5 servers) |
| F4 | Cache cuts DB load | our simulation | audio/out/reel_run.json (seed 20261101, REEL_ACTIONS) | reel 39 s (sim 36 s): hit 85 %, DB 52 % | verified | VO v06 + labels |
| F5 | Autoscaler launches instances with a 4 s boot | our simulation | audio/out/reel_run.json (seed 20261101, REEL_ACTIONS) | log: launches at reel 45 s and 48 s, healthy 49 s / 52 s | verified | VO v07, rising towers |
| F6 | SYSTEM RECOVERED | our simulation | audio/out/reel_run.json (seed 20261101, REEL_ACTIONS) | sim.recovered true from reel 42.9 s (2 s of < 1 % errors, p95 within target, tiers < 90 %); shown 49-57 s | verified | overlay gated on sim.recovered |
| F7 | This run's result | our simulation | audio/out/reel_run.json (seed 20261101, REEL_ACTIONS) | success 88.2 %, p95 1635 ms, score 716, FAIL | verified | CTA line (read from reel_run.json) |
| F8 | Not scripted: every control drives the simulation | our app | audio/out/reel_run.json (seed 20261101, REEL_ACTIONS) | web/src/store.ts -> Sim.dispatch; web/tests/simulation.test.ts 12/12 pass | verified | VO v09 |

## Benchmarks (each needs baseline, attribution and an honest scale)
| Metric | Value | Baseline | Who measured | Source | Chart scale note |
|---|---|---|---|---|---|

## Disclaimers needed on screen
For each, note where it goes and why:
- illustrative reconstruction
- not official UI
- prototype
- estimated
- not clinically validated

## Not used (and why)
- ...


## Honesty notes
- Everything is a **simulated** backend on the viewer's machine: no real website was load-tested, no network calls are made.
- Costs are fictional credits/hr. Particles are aggregates (1 packet ≈ 250 requests), labelled on screen.
- The hook (0-3 s) is a flash-forward to the same run at sim 22-25 s; 3-63 s plays sim 0-60 s in real time.
- Assumptions and limits of the model: docs/SIMULATION.md.
