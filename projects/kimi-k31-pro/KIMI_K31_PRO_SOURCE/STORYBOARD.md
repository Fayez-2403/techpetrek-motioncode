# STORYBOARD — KIMI K3.1 PRO · FROM THINKING TO BUILDING

Spine: **PROMPT → REASON → BUILD → TEST → IMPROVE → DELIVER**. One continuous transformation: prompt → code → 3D world →
CAD studio → biomechanics lab → finance workspace → agent system → evidence → open weights → payoff.

Durations come from `SCENE_TIMINGS.json` (built from the narration). The table shows the current master/reel lengths. Every scene
is **duration-elastic**: phases are timed as fractions of the scene's `dur`, so they work at both lengths and after the
real voice replaces the scratch one. Provenance: **B** = illustrative reconstruction, **C** = concept visualization,
**data** = chart of Moonshot-reported numbers. No shot is category A (no authentic Kimi footage was captured).

Frame rules: master 1920×1080, key text above y = 900 (captions sit at the bottom). Reel 1080×1920, all content between
y = 260 and y = 1360 (Instagram top UI / captions + bottom UI), side margin 64 px.

| # | Scene | Master | Reel | Class | VO line |
|---|---|---|---|---|---|
| 01 | ImpossibleHook | 7.2 s | 5.4 s | C | m01 / r01 |
| 02 | ModelReveal | 6.6 s | 7.2 s | title | m02 / r02 |
| 03 | IntelligenceEngine | 9.0 s | — | C | m03 |
| 04 | CodingWorld | 12.6 s | 5.4 s | B | m04 / r03 |
| 05 | CADLaboratory | 13.8 s | 8.1 s | B | m05 / r04 |
| 06 | HumanSimulation | 18.0 s | 9.0 s | B | m06 / r05 |
| 07 | FinanceResearch | 13.8 s | 8.4 s | B | m07 / r06 |
| 08 | AgentWorkflow | 11.4 s | — | B | m08 |
| 09 | BenchmarkReveal | 15.6 s | 6.9 s | data | m09 / r07a |
| 10 | Highspeed | 7.8 s | 4.8 s | C | m10 / r07b |
| 11 | OpenWeight | 9.0 s | 8.1 s | C | m11 / r08 |
| 12 | FinalMontage | 13.8 s | 6.0 s | B (montage) + end card | m12 / r09 |

(Lengths as rendered, from SCENE_TIMINGS.json; they change with the voice.)

---

## 01 · THE IMPOSSIBLE HOOK — C
- **Entry:** frame 0 is already a finished image: a luminous mechanical turbine (24-blade fan, hub, casing rings) floating
  in a black void, 3/4 view, slow spin. No logo, no fade from black.
- **Camera:** MacroOrbit on the blade tips (fov 30) for 0–20 %, then HeroPullback: camera races backward (ease-in-expo) as the
  turbine disassembles.
- **Focal target:** the hub, then the stream of vertices.
- **Subject motion:** MechanicalExplode → ParticleReconstruction in reverse: every mesh dissolves into its vertices (Points);
  the vertices stream into horizontal rows that become lines of code (glyph-sized dashes → monospace text).
- **Lighting:** cool rim light from top-left, cyan emissive edges; drops to near black as the camera pulls back.
- **Type:** "ONE PROMPT." (decode) → "AN ENTIRE WORLD." (build). A terminal pane resolves around the code: a single prompt line
  `> build an interactive 3D mechanical world` with a blinking cursor.
- **Exit / handoff →02:** all code characters collapse toward screen centre into one bright cyan-white point (r ≈ 6 px)
  on near-black in the last 12 frames.
- **Sound:** sub impact on frame 0, fine metallic disassembly ticks, spatial whoosh on the pull-back, 0.3 s digital silence.

## 02 · MODEL REVEAL — title
- **Entry:** the point from 01 at centre blooms into a lunar sphere (procedural maria + craters, lunar white on navy).
- **Camera:** gentle push-in (dolly 8 → 6.2 units) with a 6° yaw drift; ends ModelTurntable-still.
- **Subject motion:** a moonlight terminator sweeps across the sphere (light direction rotates 110°); controlled orbiting points
  on three inclined rings behind it; thin lunar arcs draw around the sphere.
- **Lighting:** a single hard key (sunlight) from the right that rotates in; faint violet fill; cyan atmospheric rim.
- **Type:** lockup "KIMI" (display, heavy, wide tracking) over "K3.1 PRO" (lighter), mechanical click on lock; then the
  line "NEW FRONTIER OF OPEN INTELLIGENCE"; small "by Moonshot AI · open-weight".
- **Exit →03:** camera pushes toward the sphere's limb; the orbit rings straighten into the lattice lines of 03 (cut on hit).
- **Sound:** tonal rise, glass harmonics, mechanical click on the lockup.

## 03 · INTELLIGENCE ENGINE — C (labelled "Concept visualization")
- **Entry:** inside a lattice of interconnected compute modules (instanced bevelled boxes on a 3D grid, links between them).
- **Camera:** PushThroughGeometry along a spline through the lattice (DataTunnel), light pulses streaming along the links.
- **Focal target:** "3T-CLASS" lockup held in a clear corridor of the lattice; a second beat: a document stack.
- **Subject motion:** a stack of document sheets fans open and expands into a giant context grid (tiles fill in a spiral);
  the counter "1,000,000" expands into the field of context tiles (each digit splits into tiles).
- **Type:** "3T-CLASS" (+ qualifier "3-trillion-parameter class · total, not active"), "UP TO 1M TOKENS" (qualifier
  "context available varies by product and plan"), "MORE CONTEXT. MORE COMPLEX WORKFLOWS."
- **Exit →04:** the context grid flattens into 18 horizontal rows of thin rounded bars that become the code rows of 04.
- **Sound:** data pulses, orbital motion, low drone.

## 04 · CODING BECOMES CREATION — B ("Illustrative reconstruction")
- **Entry:** the rows from 03 resolve into a dark developer workspace: file tree, editor tabs, a prompt panel.
- **Camera (2D + 3D):** editor full frame → panel resize (snap-to-grid) splits the screen: code left, live viewport right →
  camera moves into the viewport.
- **Subject motion:** the prompt "Build an interactive 3D mechanical world." types (no endless typing: ~1 s); real TypeScript /
  Three.js code (the actual source of the gear scene, shown as an excerpt) streams in by lines; characters extrude into edges,
  edges fly into place and assemble into a working Three.js gear world (meshing spur gears, a crank and a piston). A cursor
  drags a gear, the mechanism responds (all gears follow gear ratios).
- **Type:** "CODING → INTERACTIVE WORLDS"; small capability line from verifiedClaims (Front-end · Three.js · 3D assets;
  Unity · Unreal Engine · Godot).
- **Label:** "Illustrative reconstruction" + note "Code and scene written for this film — not Kimi output".
- **Exit →05:** dolly onto one gear face-on, centred, radius ≈ 0.28 × frame height, cyan wireframe, still rotating.
- **Sound:** high-frequency typing + data pulse; gear clicks.

## 05 · 3D ENGINEERING LAB — B
- **Entry:** match cut: the gear becomes the fan disk of a turbofan, front-on, in wireframe, same size and spin.
- **Camera:** OrthographicToPerspective (fov 4° → 32° dolly zoom), then a technical orbit (MacroOrbit), then a side view.
- **Subject motion:** reference sketch (orthographic line drawing with dimension lines) → wireframe (WireframeReveal) →
  parametric surfaces grow (lathe sweep 0 → 360°) → solid metal → exploded view along the axis (MechanicalExplode) →
  final assembly. Then three quick parametric beats in small viewports: mechanical assembly, architectural tower (twist
  parameter), configurable object (a lamp whose parameter slider moves).
- **Lighting:** neutral studio (grey gradient, soft key, controlled reflections from the studio environment).
- **Type:** "SKETCH → CAD → 3D"; "BENCHCAD WITH TOOLS 92.7%" with Opus 5.5 96.2 / GPT-6 Astra 95.9 for context and
  attribution "Moonshot-reported · Kimi scored on a 1,000-case subset · Claude and GPT scores from their makers' reports".
- **Label:** "Illustrative reconstruction" — not a production-ready CAD model.
- **Exit →06:** a cyan dimension arc (270°, radius 0.18 H) around the fan hub at screen centre, with an angle readout.
- **Sound:** locking clicks, wireframe shimmer, metallic assembly, soft servo.

## 06 · HUMAN SIMULATION — B ("Illustrative reconstruction" + "Moonshot internal example")
- **Entry:** the dimension arc from 05 becomes the hip-joint rotation arc of a stylized musculoskeletal figure in a dim lab.
- **Camera:** orthographic side view (lab instrument look), slow push; split screen.
- **Subject motion:** bones (lunar white) and muscle groups (warm red lines between attachment points) illuminate.
  Split: **INITIAL ATTEMPT** (unstable gait, collapses within seconds) vs **IMPROVED CONTROLLER** (alternating stride).
  Diagnostic loop Analyze → Identify errors → Correct → Test → Repeat cycles; the shoulder moment-arms flash red and turn
  mint (the 36 corrected errors); a mission timeline advances (missions and reviews count up); a stride timer reaches 11.2 s.
- **Type:** "167 MISSIONS" · "420 REVIEWS" · "11.2 SEC CONTINUOUS WALKING" · atlas note "296 skeletal · 402 muscle
  components (human-atlas)"; attribution "Moonshot internal example — not independent scientific validation".
- **Exit →07:** the knee-angle plot (a mint line across the frame) holds as the lab darkens.
- **Sound:** rhythmic servo, subtle heartbeat-like pulse.

## 07 · FINANCIAL RESEARCH — B (fictional company)
- **Entry:** the plot line from 06 becomes a revenue line on a light analytical panel.
- **Camera:** ParallaxDocumentWall (CSS 3D, gentle orbit ±6°), then push into the model.
- **Subject motion:** a wall of reports (annual report, quarterly filing, analyst notes of a visibly fictional company)
  separates into readable panels; highlighted figures fly into a spreadsheet; connector lines trace from source cells to
  formulas; period comparison; a chart builds; a conclusion with citation markers back to the source pages.
- **Type:** "FINANCIAL RESEARCH" · "MODELING" · "CROSS-DOCUMENT ANALYSIS" · "OFFICEQA PRO V2: 64.4" (Moonshot-reported).
- **Label:** "Illustrative reconstruction" + "Fictional sample company · sample numbers · not investment advice".
- **Exit →08:** the workspace shrinks into one card at screen centre (scale ≈ 0.18) that becomes a node of 08's graph.
- **Sound:** precise data ticks, paper swooshes, chart transitions, low confident rhythm.

## 08 · LONG-HORIZON AGENTS — B
- **Entry:** the card from 07 is the first node; the graph grows from it.
- **Camera:** HeroPullback across a node graph; node-to-node pans.
- **Subject motion:** one goal splits into PLAN → SEARCH → BUILD → TEST → DEBUG → REVIEW → DELIVER; each node lights with a
  visible output thumbnail; a broken UI card (misaligned, red outline) gets fixed while a side panel runs checks; outputs
  converge into a finished app card.
- **Type:** "LONG-HORIZON AGENTIC WORK"; "REASON" acted out by linked logic paths; evidence: "KIMI CODE BENCH 3.0
  LONG-HORIZON: 61.2% vs K3 55.95%" (Moonshot internal benchmark, compared with its predecessor).
- **Label:** "Illustrative reconstruction" (all check marks live inside the labelled reconstruction).
- **Exit →09:** the finished app card collapses into a single horizontal bar.

## 09 · BENCHMARK REVEAL — data
- **Entry:** the bar from 08 drops into the chart as an axis line.
- **Camera:** almost still (slight 1.5 % push).
- **Subject motion:** honest bar chart, axis 0–100 %; bars grow to exact values with count-ups: Claude Opus 5.5 66.4 %,
  Kimi K3.1 Pro 65.7 % (hero colour), GPT-6 Astra 58.2 %. The Kimi bar approaches but does not pass Opus.
- **Type:** "TERMINAL-BENCH 4.0"; subtitle "Moonshot-reported results; harnesses and reporting methods may differ."; footnote
  "Kimi run with the Claude-Code harness; other scores as reported by their makers or the official leaderboard".
- **Tone:** scientific, no victory framing.
- **Exit →10:** bars slide into two horizontal tracks.
- **Sound:** short rising tone, numeric ticks.

## 10 · HIGHSPEED — C ("Concept visualization — not a live timing")
- Dual panels "K3.1 PRO" and "K3.1 PRO HIGHSPEED" run identical abstract workflow timelines; Highspeed finishes the same
  sequence sooner (2.5× shorter, a representative midpoint). The timelines merge into "2–3× FASTER" ("FASTER" accelerates in).
  Qualifier: "Vendor-reported speed comparison." No latency or tokens/s numbers; no quality claim.
- **Exit →11:** the merged line folds into the edge of a cube.
- **Sound:** acceleration sweep, rapid clicks, impact.

## 11 · OPEN-WEIGHT — C
- A glowing closed cube unfolds (six hinged faces) to reveal intricate pathways inside; camera moves into a repository-style
  view (abstract file tree: weights / config / tokenizer — no real repository names), then a clean dev environment.
- **Type:** "OPEN-WEIGHT MODEL" · "FULL WEIGHTS PLANNED BY NOV 4, 2026" · availability line (Kimi.ai · Kimi app · Kimi Work ·
  Kimi Code · Kimi API) · "Enterprise: off by default, admins can enable". No licence terms, no "free" claim.
- **Sound:** unfolding mechanics, a warm pad.

## 12 · CREATOR PAYOFF — montage + end card
- Fast montage only from shots already in the film: Three.js gear world, CAD engine assembling, walking figure, finance
  dashboard, agent graph resolving, the hero sphere in lunar light. Cuts on the music's hits.
- Title: "KIMI K3.1 PRO" → "FROM THINKING TO BUILDING."
- End card: TechpeTrek · "WHAT WOULD YOU BUILD?" · "Independent explainer by TechpeTrek · Not affiliated with or endorsed by
  Moonshot AI" · "Illustrative reconstructions and concept visualizations; numbers Moonshot-reported" · source line.
- **Sound:** one memorable resolve (the film's signature: sub + glass harmonic + a rising fifth).

---

## Vertical reel (9:16, 69 s): its own edit
0–5 hook (turbine → code, recomposed tall: turbine fills the upper two thirds) · 5–13 reveal (sphere high, lockup below) ·
13–18 coding (editor top, viewport bottom, stacked rather than side by side) · 18–26 CAD (engine vertical, sketch → solid
→ exploded along the vertical axis) · 26–35 walking (split stacked: initial attempt above, improved below) · 35–44 finance
(single column of panels, spreadsheet then chart) · 44–50 benchmark (bars horizontal, full width) · 50–55 Highspeed (stacked
tracks) · 55–63 open-weight + availability · 63–69 montage + CTA "AI se sabse pehle kya build karoge?". Scene 03 and 08 are not
in the reel (their facts are carried by 02's lockup line and the benchmark). Attribution text ≥ 24 px.
