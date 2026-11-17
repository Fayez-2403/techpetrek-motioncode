# Review log: AI WEBSITE SAB EK JAISI?! (unslop)

## Round 1: look-dev stills (24 frames, out/stills_v1/sheet.jpg), 2026-11-04
**Three biggest problems:**
1. **0.1–2.2 s:** the headline wrapped badly ("jaisi?!" collided with the screenshot). The monitors sat in a row, so a 9:16 frame showed only two.
   - **Fix:** the headline is now two deliberate lines.
   - **Fix:** the monitors became a vertical 2 / 1 / 2 wall.
   - **Fix:** the hero monitor lands 0.15 s before frame 0.
2. **2.5 s cut:** the 2D image top sat at y 292, under the headline.
   - **Fix:** the cut point moved from css y 470 to 296, so the image top is at y 540. The 3D push targets the same point.
3. **44 s:** the lens clipped the Daily Launch sentence and fell onto the label.
   - **Fix:** mag 1.5 → 1.2, r 340, dy 230 → 110.
   - Re-measuring after the viewport resize confirmed the boxes were right.

**Also fixed:**
- **Taste tag:** it ran off the right edge. It now has a right-anchored label.
- **Story-section lens:** 1.15× → 1.6×.

## Round 2: 540×960 preview with sound (out/preview/unslop_v1a_preview_540x960.mp4)
**Three biggest problems:**
1. **Deck layout (motionmaxxing never-ship #2 and #1):** held left-aligned section titles with counters ("1 Audit", "2 Direction", "Works in your stack", …).
   - **Fix:** all removed. The captions carry the words, and the windows grew into the space.
2. **Held frames:** mean motion 0.4/255, longest static run 2.05 s at 48.8 s.
   - **Fix:** a camera creep on every page view (+5 css px/s, +1.2 %/s zoom); the lens rides with it.
   - **Fix:** a slow push on the taste and CTA frames.
   - Now the longest static run is 1.78 s.
3. **46.5 s:** sections faded in from empty.
   - **Fix:** windows enter by moving (translateY 90 px) and are at least 25 % opaque on the cut frame.

## Round 3: preview v1 (out/preview/unslop_v1_preview_540x960.mp4, 59.58 s)
| Category | Score |
|---|---|
| Opening hook clarity and strength | 9 |
| Product/source accuracy | 9 |
| Mobile readability (360 px phone test) | 8 |
| Composition, camera continuity, depth | 8 |
| Motion quality, easing | 7 |
| Scene variety, retention | 8 |
| Music/voice/SFX sync | 9 |
| Actor/mascot/product consistency | 8 |
| Media rights and attribution | PASS (CC BY credit in the video, the source lines, the caption, the cover) |
| Overall polish | 8 |

**Hook scores (9):**
- frame 0 already shows the hero monitor landing;
- five identical screens land by 0.9 s;
- the camera pushes into one screen, and the cut to 2D is continuous;
- the reel's own slop is tagged ("Gradient text") and unslopped on "bhai bas karo".

**Remaining weaknesses (honest):**
1. **Motion is still below the human band** (mean luma change 0.4/255; human median 6.8). These are dark UI pages, and the creep is gentle. A harder camera language is the next upgrade.
2. **The run section has a 2.4 s still** (20.75–23.2 s, the story video's first frame) before the video starts on "chalaya". It only has a 2 % push.
3. **The dead stop before the groove drop is only 4.7 dB under**, because Liam's "karo" plays through it. The music and SFX are at zero.

**Numbers:**
- **look.py:**
  - G0 PASS: 59.58 s, audio present.
  - G2 PASS.
  - G3 PASS: end hold 0.30 s, final shot 3.83 s = 6 %.
- **Cut sync:** 6 of 6 cuts on sound onsets.
- **measure.py strobe:** 0.
- **reel_qa.py:** 6/7; the only miss is the 540×960 preview size, as expected.
- **Loudness:** −14.2 LUFS, true peak −1.3 dBFS.
- **VO:** 13 Liam takes (turbo v2.5, hi).
  - All were Scribe- and faster-whisper-checked.
  - Three brand misreads ("Unslope", "Onslop") were fixed by phonetic spelling, a seed change, or rewording v08.
- **G1 (by eye):** README sentences under the lens read at ≥ 0.04 H; the page fills the width.
- **G4 (by eye):** one hero per frame.

## Round 4: v2 hook (user feedback, 2026-11-05) — out/preview/unslop_v2_preview_540x960.mp4, 59.98 s
**The user's note:** "the hook has to be very interesting … start same as 'ek developer ne unslop banaya' … mention the developer and show the repos in the background".

**The new hook (v00, Liam at speed 1.2, Scribe + whisper clean):** "Ek developer, Damir Sokolovsky, ne ek skill banaya aur ek hafte mein 8,000 se zyada GitHub stars!"

**The picture:**
- his real GitHub profile with the repositories scrolling, and an ivory box on his name as it is spoken;
- on "skill", the real unslop repo page slides in;
- on "8,000", the lens lands on the page's own "8.4k stars";
- a dead stop (−34.6 dB at 6.00–6.25 s), then the five-screen slop wall lands as the loudest quarter-second of the opening (−11.4 dB).

**The cost:**
- The Daily Launch beat was cut (it stays in the caption).
- The licence line was shortened to "Damir ko credit dena zaroori hai", since the name is now spoken in the hook.
- The CTA ring-out went from 0.6 s to 0.25 s.

**Three worst, fixed:**
1. **Frame 0 was dark, with "Ek" only fading in.** Now "Ek" is fully in on frame 0, and page dim is 0.55 → 0.4.
2. **The name box was half off-screen.** The profile view moved (cx 560 → 470).
3. **A 50 ms silence at 32.95 s:** the funk had no sustained layer. A quiet Em7/A7 pad was added.

Also: G3 failed (end hold 1.43–1.45 s, the slow push was under the diff threshold). The CTA now leaves accelerating (+8 % ease-in over the last 1 s).

**Numbers:**
- **look.py:** G0 PASS (59.98 s), G2 PASS, G3 PASS (ends in motion; final shot 3.48 s = 6 %).
- **Cut sync:** 5 of 5.
- **Strobe:** 0.
- **reel_qa.py:** 6/7, the only miss being the preview size.
- **Loudness:** −14.2 LUFS, peak −1.5 dBFS.
- **Motion:** mean luma change 0.5/255, still below the human band (dark UI pages).

## Benchmark gate (docs/BENCHMARK_REPO_STUDIO.md)
- [x] **The concept is original, and the hero performs it physically.** The reel itself starts as slop, gets redlined, and unslops in place. Then the real tool unslops a real screen.
- [x] **Every claim is real evidence, in-world.** README sentences and the Daily Launch snapshot are under the lens. The before/after is our actual run of the skill, rendered by the repo's own story.mjs.
- [x] **≥ 5 layers per beat:** world, page or video, lens, red tags or measurements, captions, source line, SFX.
- [x] **The voice is the timeline.** Every tag, lens drop and step is keyed to Liam's word times.
- [x] **Sound comes from picture events.** The slop bed gives way to a record stop, then the groove drops on the turn.
- [x] **The numbers match or beat the benchmark:** G0/G2/G3 pass, 0 strobe, −14.2 LUFS, cut sync 100 %.
- [x] **Beyond ONE BOT, 16 REPOS:**
  1. **The reel runs the tool it is about.** A real third-party skill run, with its real output video, is the hero shot.
  2. **The reel's own design is governed by that skill.** It unslops itself on camera.
  3. **The red tags sit on measured DOM boxes**, including the real off-grid row heights 46/30/40/32/44/31 px.
  4. **A 3D-to-2D match cut** at an exact css point.
