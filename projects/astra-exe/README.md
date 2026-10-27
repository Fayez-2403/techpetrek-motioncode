# ASTRA.EXE — The Celestial Weapon Physics Laboratory

An interactive 3D fantasy physics lab in the browser. You pull the string of **THE ASTRAL BOW**, aim it and release. The arrow flies on a real ballistic path and fractures a floating mountain made of rigid-body pieces. You can change gravity, power, the target's material, the time scale and the arrow's celestial mode, then try three challenges. The same app has a deterministic cinematic mode, and the 65-second 9:16 reel was captured from it.

*ASTRA.EXE — Ancient Legends, Modern Physics.* Made for TechpeTrek.

## Run it

```sh
cd projects/astra-exe/web
bun install
bun run dev          # http://localhost:54200   (?q=low|medium|high|ultra picks the quality; ?debug opens the overlay)
```

You need Bun and a desktop browser with WebGL2: recent Chrome, Edge, Firefox or Safari. It also runs on phones at `?q=low`. The first load splits the mountain into pieces in a Web Worker, which takes about 3–5 s. The result is cached in IndexedDB, so reloads start at once.

## Play

| Action | How |
|---|---|
| Draw the bow | Press on the glowing string or nock and drag back toward you. The bow bends and the string strains. Release to fire. |
| Aim | Drag anywhere else, or use the arrow keys (hold Shift for fine steps). While drawing, holding the nock low tips the arrow up, like a slingshot. |
| Fire automatically | **FIRE** or Space draws to the DRAW POWER limit and releases. |
| Modes | 1 Vajra Pulse, 2 Agni Wave, 3 Vayu Storm, 4 Cosmic Fracture. |
| Reset | R resets the mountain; Shift+R resets the whole scene. |
| Other | P pause · H hide UI · C cycle camera · B slow-motion replay · M sound · \` performance overlay · Esc leave capture mode |

The panel holds draw power (0–100%), four gravity presets (zero, moon 1.62, earth 9.81, extreme 29.4 m/s²), four materials, the impact multiplier (0.5–5×), the time scale (0.1–2×) and four toggles (impact slow-mo, air drag, aim preview, auto camera cuts). It also holds the camera modes (cinematic, free orbit, arrow follow, impact close-up), the replay, three challenges, the quality presets, capture mode, sound and the performance overlay. Every control changes the running simulation; `scripts/test_browser.ts` clicks each one and checks the effect.

**Capture mode** shows a 9:16 frame guide with the Reels safe zones. It can save the frame as a PNG at 2× resolution, record WebM video straight from the canvas, and store three camera bookmarks.

## What is real simulation and what is art

| Real (the simulation) | Art (drawn on top, labelled in the UI) |
|---|---|
| **The bow.** A linear draw-force model, F = k·d with 311 N at 72 cm; stored energy ½kd²; 80% efficiency; a 25 g arrow. The launch speed is v = √(2ηE/m), 85 m/s at full draw. The string is a damped spring when held and a 9 Hz oscillator after release. | The gold, the glow, the halo, the tension filaments and the vibration's look. |
| **Flight.** Gravity from the preset, optional quadratic drag, and semi-implicit Euler at a fixed 1/120 s step. A ray is swept along each step, so a fast arrow cannot tunnel through rock. The rings are segment and plane tests. | Trails, lightning filaments, helix ribbons and embers. |
| **Fracture.** The arrow's real kinetic energy × a **celestial gain of 2.2×10⁷** (openly fantasy) × the mode gain × the impact multiplier gives the impact energy. The energy flux E/4πr² at each piece is compared with the material's toughness (J/m²). Pieces above it break off with energy η·flux·area. | The crack glow along the piece seams, the heat colour, the shockwave rings and spheres, the flash and the Cosmic ripple. |
| **Debris.** Every broken piece is a **Rapier rigid body** with a convex-hull collider, mass, restitution and friction from the material. Pieces collide with each other and with the mountain. Pieces cut off from the anchored core lose support and collapse, staggered. | Small rubble, sparks and dust: thousands of **decorative** instanced particles moving analytically. They are not rigid bodies, and the overlay counts them separately. |
| **Modes.** Vajra breaks instantly with a hard push. Agni sends a heat front at 7 m/s, and pieces break when it reaches them. Vayu applies a decaying vortex of impulses on loose pieces and tears loose surface rock off over seconds. Cosmic breaks over 1.6× the radius, sets the pieces' gravity scale to 0 for about 2.3 s, then ramps gravity back, and the support collapse follows. | Agni's "fire" is a shader, not combustion. Cosmic's slowed time and dimensional shards are fiction, labelled as such. |
| **Time.** The physics always steps 1/120 s. The time scale and slow motion change only how fast those steps play, with rendering interpolated between them. | Camera shake and auto cuts. |

## How it is built

React + React Three Fiber host the canvas and the frame loop, drei provides OrbitControls and PerformanceMonitor, the meshes and shaders are Three.js r186, and the physics is Rapier 0.21. Its compat build inlines the WebAssembly, so the app makes no runtime network requests. The simulation core in `src/core/` is plain TypeScript with no DOM and no WebGL, so the same code runs live, in the headless tests and in the reel.

| Module | Role |
|---|---|
| `core/shapes.ts` · `core/fracture.ts` | Original procedural targets as signed-distance fields: the floating mountain, a crystal slab, a medium mountain and a crystal cluster. They are cut into Voronoi cells, and each cell is meshed with surface nets on max(field, cell distance), so the pieces tile the intact shape. Adjacency feeds the support graph. |
| `core/destructible.ts` | Rapier bodies (fixed → dynamic), breaking off, scheduled breaks, floating, support collapse, reset. |
| `core/bowrig.ts` · `core/projectile.ts` | The draw spring and launch model; ballistic flight, the swept ray, the rings. |
| `core/modes.ts` · `core/challenges.ts` · `core/simcore.ts` | The energy model and the four modes; the three challenges; the fixed-step orchestrator, its events and snapshots (used by the replay). |
| `view/*` | The bow (recurve limbs bent per frame), the arrow and its trails, the target BatchedMesh and rock shader, the effects, the arena (sky, cloud sea, lights, altar), the camera director and the bloom/grade pipeline. |
| `audio/engine.ts` | All sound synthesized live with the Web Audio API: creak, string, twang, impacts, collisions, rings, drone and thunder. |
| `ui/*` | The panel, the HUD, the honest energy readout, challenges, overlay, capture mode. |
| `reel/*` | The cinematic mode: shots, overlay and director. |

**Quality presets.** Low has about 90 rigid pieces, medium about 220 (the default), high about 480 (used by the reel) and ultra about 1000. They also scale the decorative rubble and sparks, the shadow map, MSAA and resolution. PerformanceMonitor lowers the resolution when the frame rate drops. The renderer is WebGL2; WebGPU is not used.

## The reel (65 s, 1080×1920, 60 fps)

`/?reel=1` turns the app into a seekable film. `window.astra.seek(t)` renders reel time t as a pure function of t:

- **Physics.** The shot that owns t re-runs the real simulation from a fresh physics world with scripted input, up to that shot's sim time.
- **Camera.** A function of t.
- **The real controls.** The lab's real Slider and Seg components, bound to the same store, drawn large.
- **Overlay.** Titles, captions, the cursor, and the code reveal showing real excerpts of this source.

Impact and ring times come from a dry run of the same simulation, so cuts land on what the physics actually does. Frames are identical in any seek order (`bun scripts/capture.ts det`).

```sh
# voice (ElevenLabs Liam, your own key in the user environment; never printed), score, mix
python analysis/astra_vo.py --seed 11 --stt
cd projects/astra-exe/web && bun scripts/capture.ts cues --out ../output/cues.json && cd ../../..
python analysis/astra_music.py
python analysis/astra_mix.py
# frames (in shot-aligned segments) -> H.264, then the mix
cd projects/astra-exe/web && bun scripts/capture.ts video --from 0 --to 65 --out ../out/reel.mp4
```

The reel's input is scripted: the cursor drags the string and clicks the panel through the same calls the pointer and the panel make. The frames were captured offline, one at a time, because a laptop GPU cannot record 1080×1920 at 60 fps live. The physics in every frame is the app's real simulation.

## Tests

```sh
bun scripts/test_core.ts       # headless physics: launch model, hits, breaks, determinism, gravity, modes, materials, replay, the impossible shot
bun scripts/test_browser.ts    # the live app in Chrome: real mouse and touch drags, every control, challenges, overlay, frame rate
```

The results are in `test-results/` and summarized in `output/qa_report.md`.

## Assets and licences

Everything visual and audible is original and procedural: the shapes, textures, ornament, sky, sounds and score. There are no image, model or sound files. The fonts (Archivo, Cormorant, IBM Plex Mono) are under the SIL Open Font License. Code dependencies are React (MIT), Three.js (MIT), React Three Fiber and drei (MIT), Rapier (Apache-2.0) and Vite (MIT). See `ATTRIBUTION.md`.

**Culture.** The Astral Bow is an original fantasy artifact, not a depiction of a specific mythological weapon. It shows no deities and uses no sacred text. The script-like ornament is abstract strokes under a headline bar and spells nothing. Vajra, Agni and Vayu are the Sanskrit words for thunderbolt, fire and wind, used here as element names.

## Limits

- On an integrated laptop GPU, medium quality runs at a playable rate. High and ultra are meant for capable GPUs (see `output/qa_report.md` for measured numbers).
- The fracture pattern is precomputed per target: Voronoi pieces, then rigid bodies. The mesh is not cut arbitrarily in real time.
- The air drag is game-style. The bow model is stylized, not a historical bow.
- WebGPU is not used. The renderer is WebGL2, which runs in all current browsers.
- The live app's sound is synthesized in the browser. The reel's sound is synthesized offline with the same recipes and lined up with the reel's own events.
