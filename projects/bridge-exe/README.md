# BRIDGE.EXE — Can your design survive?

An educational 3D bridge-design lab (web/) and its 70 s Tech पे Trek reel, made 2026-11-02 from the user's master prompt
(docs/brief.md). The rules: `docs/TECHPETREK_MASTER_REEL_STUDIO.md` (repo root) and the `reel-pipeline`, `motion-studio`
and `motionmaxxing` skills.

**Not a substitute for a licensed structural engineer, design-code checks or construction documents.**

## The app (web/, Vite + React + R3F, port 54250)
- **Gorge truss (primary):** Pratt / Howe / Warren, span 32–72 m, panels, height, area per member group, material presets
  (steel E250, Al 6061-T6, a fictional soft material) with editable E and density, draggable top joints (snap 0.25 m),
  add / remove members, deck + self-weight + truck + point loads, moving-load sweep (one static solve per position).
- **Solver:** web/src/engineering/truss.ts, direct stiffness, run IDs + input hashes, equilibrium and residual, readable
  errors for mechanisms / invalid models. Lenses: deformation (×N, ghost), axial, utilisation proxy, load path + reactions.
- **City beam:** Euler–Bernoulli beam FE with moment / shear ribbons. **Skyline cable-stayed:** concept visual, analysis unavailable.
- **A vs B** split screen of two saved runs, **five challenges** checked on solver results, **arcade mode** (Rapier,
  STYLIZED FAILURE — NOT AN ENGINEERING PREDICTION), exports (CSV, model JSON, replay JSON, GLB, screenshot), undo/redo,
  day/night, quality presets, reduced motion, mobile layout.

```sh
cd web && bun run dev                      # http://localhost:54250  (node_modules is a junction to aftercode/web)
bun test                                   # 14 solver tests
bun tests/e2e.ts                           # 18 interaction tests (dev server running)
bun scripts/export_fixtures.ts && python ../solver/crosscheck.py   # numpy + PyNite cross-check
bun scripts/export_run.ts && python ../solver/export_ifc.py ../output/BRIDGE_EXE_SAMPLE_MODEL.json ../output/BRIDGE_EXE_MODEL.ifc
```

## The reel
| Step | Command |
|---|---|
| voice (Liam, Turbo v2.5, STT-checked) | `python scripts/audio/vo_bridge.py` |
| one timeline | `python scripts/audio/timing_bridge.py` → SCENE_TIMINGS.json |
| sound events from the app | `cd web && bun scripts/export_events.ts` |
| score + mix (−14 LUFS) | `python scripts/audio/mix_bridge.py` |
| artifact cards (real files) | `python scripts/artifacts.py` |
| capture (dev server with `BX_NO_HMR=1`!) | `cd web && bun scripts/capture.ts --scale 0.5 --every 2 --name bridge_capture_preview` (full: `--scale 1 --every 1 --name bridge_capture`) |
| cover plates | `cd web && bun scripts/cover_shots.ts` |
| Remotion | `npx remotion render src/index.ts Bridge out/…` (`REMOTION_BRIDGE_CLIP=clips/bridge_capture.mp4` for the full) |

Folders: docs/ (brief, factcheck, SOURCES, ENGINEERING_ASSUMPTIONS, ANALYSIS_VALIDATION, CAD_BIM_INTEGRATION, SHARE_WITH_COMMENT_CIVIL,
SOUND_CUES, shotlist, voiceover, review_log, QA_REPORT), solver/ (Python cross-check + IFC), src/ (Remotion), audio/, public/, post/, output/, out/.
