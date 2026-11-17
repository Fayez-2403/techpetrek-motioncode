# ENGINE.EXE

**Every rotation tells a story.**

ENGINE.EXE is an interactive 3D simulator of a four-stroke motorcycle engine. Watch it run, slow it down, open the cutaway, explode it, look through it in X-ray, and isolate any of eight parts. Every moving part, gauge, chart and label reads from one mechanical model, `engineStateAt(crankAngle, rpm)`. Nothing is keyframed.

> Generic educational engine: single cylinder, four-stroke, air-cooled, SOHC, two valves, 148 cc. All dimensions are illustrative, not a replica of any real engine. See [docs/PARAMETERS.md](docs/PARAMETERS.md).

## Open it

Open **`engine-live.html`** in Chrome, Edge, Firefox or Safari. It is one 826 KB file and works offline from `file://`, with three.js and the fonts inlined.

Left alone, it plays a 50 s auto tour with an operator cursor:
- the full engine;
- the engine starting;
- into the cylinder;
- the piston and rod;
- slow motion on the crank;
- the transparent head;
- the camshaft and both valves;
- the four strokes;
- the dashboard and chart;
- back to the assembled engine.

Any click, drag, wheel or key takes control; 25 s of quiet hands it back to the tour.

| Control | What it does |
|---|---|
| ▶ PLAY / ❚❚ PAUSE (Space) | run or hold the crank |
| −5° / +5° (← / →, Shift for 1°) | single steps |
| RESET (R) | back to 0°, TDC at the start of intake |
| SLOW-MO | picture at 1/100 instead of 1/20 |
| ENGINE SPEED slider (↑ / ↓) | 300–9000 rpm |
| CRANK ANGLE slider, or drag on the 720° chart | scrub 0–720° (pauses) |
| ISO / FRONT / SIDE / TOP (1–4) | camera presets |
| Drag / wheel on the view | orbit / zoom |
| SOLID / CUTAWAY / EXPLODED / X-RAY | visualization modes |
| PISTON … FLYWHEEL | isolate a part: highlighted copper, the rest dimmed, the camera moves to it, an info card explains it |
| LEARN THE 4 STROKES | guided cycle: slow motion, cutaway, the parts doing the work glow, flow arrows. Click 01–04 on the stroke card to start a stroke. |
| LABELS | callouts on and off |
| H | hide the panels |

**On a phone.** The 3D view goes on top and the cards scroll below it, zoomed to stay readable. A phone held sideways or a narrow window puts the view on the left.

## Build from source

The simulator is built on the **teardown** skill's kit: its runtime, warm-up, capture and build tools. Install it once:

```
npx skills add elvarofficial/teardown -g -a claude-code
cd ~/.claude/skills/teardown && npm install && npx playwright install chromium
```

Then, from this folder:

```
node scripts/build.mjs          # → engine-live.html (+ teardown-out/dist/engine-film.html)
node tests/kin.test.mjs         # the model: 15 checks, 72,001 angles
node tests/sim.test.mjs         # the built pages on the GPU: 27 checks + screenshots/
node tests/report.mjs           # → docs/VALIDATION.md
```

Recorded tour, frame by frame, at 1920 × 1080 (60 fps, about 50 s). This is also the source for the reel:

```
node ~/.claude/skills/teardown/sims/capture.mjs engine-film --size 1600x900 --dpr 1.2 --stills beats --timeline sim/engine-film/timeline.json --cols 4 --out teardown-out/beats.png
node ~/.claude/skills/teardown/sims/capture.mjs engine-film --size 1600x900 --dpr 1.2 --out teardown-out/engine-tour.mp4
```

## Source

| File | Job |
|---|---|
| `sim/engine-shared/config.js` | every dimension, timing and speed (edit here) |
| `sim/engine-shared/kin.js` | **the one source of truth**: slider-crank, valve lift, `engineStateAt()`, the illustrative ignition and pressure; no three.js |
| `sim/engine-shared/engine.js` | the geometry from code, the generated cam lobes, the chain path; `update(state, ops)` poses every part from the state |
| `sim/engine-shared/stage.js` | the light studio, soft shadows, GTAO, the camera kept outside the engine |
| `sim/engine-shared/console.js` | the panels: stroke card, live state, transport, 720° chart, components, camera and mode |
| `sim/engine-shared/tour.js` | the tour script, the camera views, `director(t)` (a pure function of time), the callouts |
| `sim/engine-shared/page.js` | one frame: state → engine → panels, shared by the live page and the film |
| `sim/engine-shared/live.js` | the interactive page |
| `sim/engine-shared/film.js` | the recorded tour (`render(t)`), plus `window.ENGINE.renderAt()` for the tests |
| `tests/` | the model tests, the browser tests and the report writer |
| `docs/PARAMETERS.md` | parameters and assumptions |
| `docs/VALIDATION.md` | the validation report and known limitations |
| `screenshots/` | screenshots written by the browser test |

Credits: the teardown kit (MIT; whaleyxbt/claude-motion lineage). The fonts are Inter and JetBrains Mono (OFL).
