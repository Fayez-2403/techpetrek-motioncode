# ASTRA.EXE reel: claims and their evidence

Every claim in the reel is about this project itself. Each one is checked against the code, the tests and the measured run (2026-10-23).

| Claim in the reel (voice or screen) | Evidence | Status |
|---|---|---|
| "Maine ek celestial bow banaya… jiska string tum khud kheench sakte ho" | `view/input.ts`: a raycast on the string and nock, then a drag onto the draw plane. `scripts/test_browser.ts` drags it with a real mouse, and with touch on a phone viewport, then checks that the release fires. | true |
| "GRAB • PULL • AIM • RELEASE" | Same as above; the aim comes from a background drag or the arrow keys. | true |
| "Power badhao, aim set karo… impact se pahaad kaise toot raha hai" | The DRAW POWER slider sets the maximum draw. The launch speed follows the draw-energy model (test_core: 82.95 m/s at 98% draw, matching the model). Pieces break off as Rapier rigid bodies. | true |
| "4 CELESTIAL MODES": lightning, fire, storm, cosmic | `core/modes.ts`: four different force and timing models, plus a visual identity for each (test_core: four different outcomes). The fire is a shader and the cosmic time-slow and gravity suspension are fiction; the reel labels both on screen ("heat front (shader)", "gravity suspended (fiction)"). | true, labelled |
| "Gravity, arrow power, aur target ka material — sab LIVE change kar sakte ho" | The reel's lab sequence uses the app's real Slider and Seg components on the same settings store. test_browser clicks every gravity, material, power and time-scale control and checks the simulation. | true |
| "INTERACTIVE 3D PHYSICS LAB", and the rigid-body readout ("480 attached pieces", "119 active rigid bodies") | The readout counts the simulation's own piece states at that frame (`reel/shots.ts` liveStats). | true (counted) |
| "CHALLENGE: THE IMPOSSIBLE SHOT": one arrow, three rings, one target; "PERFECT SHOT ✓" | `core/challenges.ts`: the rings sit on a real trajectory of this bow. The reel's shot is judged by the same rules: the challenge reports `won` (test_core, test_browser). | true |
| "Aur ye koi pre-rendered animation nahi!" | The project is an interactive app, not an animation: the frames come from a live physics simulation, not from keyframes or a video file. **To be precise:** the reel itself was captured offline, frame by frame, from the app's deterministic cinematic mode. A laptop GPU cannot record 1080×1920 at 60 fps live. The cursor input in the reel is scripted through the app's real controls. README and qa_report say so. | true of the app; the reel's capture method is disclosed |
| "Maine Claude Code se ek actual interactive 3D physics experience banaya" | Built in this session with Claude Code (Opus 5.5): React Three Fiber, Three.js and Rapier. The code panel shows real excerpts of this source (`reel/director.ts` imports the files themselves). | true |
| "LEGENDARY WEAPONS × REAL-TIME PHYSICS" | The physics runs in real time in the live app: one 1/120 s step takes 0.7–2.3 ms here at medium quality (test_browser frame rates are in qa_report). | true |
| "IN-ENGINE · REAL PHYSICS" tag | Every frame is rendered by the app's own engine from the simulation's state. | true |
| "Agar Mahabharat ke legendary weapons…" | A hypothetical hook. The bow is an original fantasy artifact; the reel never says it is a weapon from the Mahabharat. | no factual claim |

## Not claimed
- No thousands of simulated objects. The rigid pieces number 480 at the reel's quality; the rubble and sparks are decorative, and the README and overlay say so.
- Not a physically accurate historical bow, real combustion, or real gravity manipulation.
- No WebGPU (the renderer is WebGL2).
- No view counts, "viral" status or rankings.
