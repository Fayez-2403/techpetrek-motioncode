# The benchmark: ONE BOT, 16 REPOS (projects/repo-studio, 2026-11-03)

**User's standing rule (2026-11-04):** this reel is the minimum level for every reel from now on: "I will only love to go
beyond this level, not below that." Every new reel is built to beat it and is scored against it before it is shown.
Preview: `projects/repo-studio/out/preview/studio_v2_preview_540x960.mp4`. Source: `projects/repo-studio/src/`.

## What makes it the benchmark (keep every one, then add more)
1. **One original concept with a hero character performing it.**
   - A rigged 3D mascot (`src/bot/`) has squash and stretch, blinks, about 8 eye states, 5 mouths, goggles, props and per-limb poses.
   - It *acts out* each subject with a physical metaphor; the subject is never just captioned. Examples: puppet strings for Puppeteer, stomping pedals for Pedalboard, landing on the −14 LUFS ledge for pyloudnorm, an encoder conveyor for FFmpeg.
   - Never the same action twice in a row.
2. **Real evidence inside the world.**
   - The real pages are captured with Playwright (`web/scripts/grab_*.mjs`) and stand as 3D panels.
   - A magnifier shader zooms into the real on-page element. Its box comes from the DOM (`repoBoxes.json`), never guessed.
   - Every number comes from an API or the page itself: stars from the GitHub API, the exact total ★ 615,035.
   - The fact check is done before any voice.
3. **Many layers in parallel in every beat.** A single beat runs all of these at once:
   - the cut lands on a stomp impact, with a shockwave and a soft flash;
   - the panel slams in;
   - the lens sweeps onto the real element;
   - a title card shows the real number;
   - the hero acts;
   - the props animate;
   - the camera moves;
   - word-level captions run.

   Depth comes from a gallery of all the pages behind, plus fog, dust, key, rim and fill lights, and a floor.
4. **The voice is the timeline.**
   - The news-anchor VO is Liam, Turbo v2.5, hi, with every line checked by Scribe and faster-whisper.
   - Beats start on the spoken name: SCENE_TIMINGS.json comes from the measured takes.
   - Pacing is 16 beats in 52 s, 1.5–4 s each.
   - Frame 0 is already in motion, the title lands at 0.8 s, a total counter rolls to the real exact number, and the CTA uses a comment keyword.
5. **Sound from the same events.**
   - The score is original (numpy, 120 BPM).
   - SFX are placed from the director's own event times: stomps, key hits, pedal stomps, the counter.
   - Music ducks under the VO, mastered to −14 LUFS / −1.5 dBTP.
6. **Measured, not claimed.** These are the numbers on the v2 preview:
   - **Gates:** look.py G0, G2 and G3 pass. The end hold is 1.07 s and the final shot is 9 % of the film.
   - **Cuts:** 34 cuts, 16 of them on a sound onset.
   - **Strobe:** 0 strobe frames.
   - **Loudness:** −14.1 LUFS, true peak −1.4 dBTP.

## Lessons that are now rules
- The hero takes about 40 % of the frame width in portrait (the camera sits about 1.6× further back than first instinct). The props and pages must stay readable.
- A camera never sits behind a panel. Background panels stand only on the back arc.
- There are no one-frame white flashes. An impact flash is ≥ 0.18 s and ≤ 12 % opacity, and `measure.py strobe` must read 0.
- Frame 0 is never empty or static. The hero is already moving and a title lands by 1 s.
- Long names fit the frame width: check every title card at its slam-in scale.
- Textures and fonts are preloaded before a canvas mounts (`usePreload`), or panels render black.

## The bar for the next reel (the pipeline's Benchmark gate)
Before showing any preview, write down in its `docs/review_log.md`, against this list:
- [ ] Is the concept at least as original, and does the hero perform it physically, not just illustrate it?
- [ ] Is every claim real evidence (captured page or API number), shown in-world?
- [ ] Does every beat have at least 5 parallel layers, and is no action repeated back to back?
- [ ] Is the voice or music the timeline, with cuts landing on impacts or beats?
- [ ] Is sound placed from the picture's own events?
- [ ] Do the measured numbers match or beat it: G0/G2/G3 pass, 0 strobe, about −14 LUFS, cuts on onsets ≥ 40 %?
- [ ] **What does this reel do that ONE BOT, 16 REPOS did not?** Name at least one new capability (a new renderer, a new character skill, a new evidence type, a new transition grammar). Below the bar = not shown; fix first.
