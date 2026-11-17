# BRIDGE.EXE web app

Vite + React 19 + React Three Fiber 9 + three r186 + zustand + Rapier (compat 0.12, arcade only). `bun run dev` → :54250.

| Folder | What |
|---|---|
| `src/engineering/` | units, types, validation, `truss.ts` (direct stiffness), `beam.ts` (Euler–Bernoulli FE), `loadDistribution.ts` (tributary + lever rule), `educationalChecks.ts` (proxy), `hash.ts`, `reports.ts` (CSV/JSON/replay), `materials.ts` |
| `src/geometry/` | `trussPresets.ts` (Pratt/Howe/Warren with stable IDs, drags, add/remove), `exportGeometry.ts` (GLB) |
| `src/world/` | Sky, Gorge (terrain, water, mist, props), TrussBridge (members by ID, joints, deck, bearings, truck, loads, reactions, dims, handles, tags), City (beam FE + cable-stayed concept), ArcadeFailure (Rapier, precomputed), CameraDirector, Scene (lights, env, post, A/B split renderer) |
| `src/ui/` | App shell, Panels (design, loads, solver, lenses, sweep), kit, styles |
| `src/challenges/` | five challenges checked on fresh solver results |
| `src/reel/` | `?reel=1` capture mode: timeline (from ../SCENE_TIMINGS.json), ReelMode (seek, runs, overlay), reel.css |
| `tests/` | `solver.test.ts` (bun test, 14), `e2e.ts` (Playwright, 18) |
| `scripts/` | shots (look-dev), reel_stills, capture (frame-exact MP4), cover_shots, export_events, export_fixtures, export_run |

Rules kept: results belong to one run of one exact input (inputsHash) and go stale on any edit; the reel never edits a
number, it replays store actions and reads run objects; frames in `?reel=1` are pure functions of t (no clock, seeded noise,
Rapier precomputed). Run captures against a dev server started with `BX_NO_HMR=1` (an HMR reload mid-capture loses `seek`).

Known warning: drei `<Html>` labels log "removeChild … not a child" under React 19 when a label unmounts; harmless.
