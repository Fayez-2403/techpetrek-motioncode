# Review log: JOB INTERVIEW SE $6 BILLION HACK?!

After every check (stills, motion check, final), this log records (master studio §17, motion-studio follow-up format):
1. a score from 1 to 10 per category;
2. the three biggest problems, with timestamps;
3. the fix for each, with numbers.

## Round 1: look-dev stills (17 frames, out/stills_v1/sheet.jpg), 2026-11-04
**Three biggest problems:**
1. **7.6 s:** the report panel is cropped too tight to read.
   - **Fix:** the camera moved back from 3.4 m to 6.4 m.
   - **Fix:** lens radius 0.6 → 0.5.
2. **44.2 s:** the "absorb" lens fills the frame.
   - **Fix:** radius 0.45 → 0.38, with the same camera pull-back.
3. **Top-right:** the "illustrative reconstruction" label collides with the date chips.
   - **Fix:** the label moved to the top-left, at y 205.

**Also found:**
- **0.15 s:** the camera sat inside the seated person, so the phone was hidden.
  - **Fix:** the phone shot is now POV, with the person not drawn for 0–1.3 s.
- **Fact error, from re-reading the report:**
  - The phone said "video call with the CEO · today 7:30 pm". The CEO round was "conducted in a popular social chat app", and the time was made up.
  - **Fix:** the phone now reads "interview with the 'CEO' · on a chat app", and the window is "FAKE CEO · CHAT".

## Round 2: 540×960 motion check with sound (out/preview/heist_v1a_preview_540x960.mp4, 61.09 s)
**Three biggest problems:**
1. **29–34 s (myth):** the camera was 1.5 m from the AI node, so a flat lavender disc filled the frame.
   - **Fix:** the camera now moves from 4.6 m to 3.6 m. The node reads as an object, with its red links around it.
2. **45–50 s (attribution):** two small cards sat at the top over a black frame.
   - **Fix:** the pillars got an emissive tint (amber for FBI, lavender for North Korea, intensity 0.1).
   - **Fix:** the cards were enlarged (heading 64 → 92 px, body 30 → 42 px, min height 470 px) and placed over the pillars.
   - **Fix:** a big header, "ATTRIBUTION · DISPUTED".
3. **42.6–45.25 s:** the frozen meter overlapped the report page and the lens.
   - **Fix:** the meter is hidden once the report cut happens. Only the green "BINANCE WILL ABSORB THE LOSS" chip stays.

**Also fixed:**
- **39.0 s:** the counter read "~$0.00B FROZEN" before the word.
  - **Fix:** the header now enters on the "$2.85B" word (frz − 0.15 s), scaling down from 1.25×.
- **Cut sync:** only 7 of 15 cuts landed within ±80 ms of a sound onset (47 %).
  - **Fix:** a low thud (0.35) on every section cut. Now 12 of 15 (80 %).
- **reel_qa:** the reel ran 61.09 s, over 60 s.
  - **Fix:** the CTA ring-out went from 1.4 s to 0.3 s. Now 59.99 s.

## Round 3: preview v1 (out/preview/heist_v1_preview_540x960.mp4, 59.99 s)
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
| Media rights and attribution | PASS |
| Overall polish | 8 |

**Hook scores (9):** there are four events in 3 s:
- the phone buzzes with the invite;
- it glitches;
- a 150 ms dead stop;
- the vault blows open with shake as "SE $6 BILLION HACK?!" slams in.

"$6.34B impacted · Binance says" lands at 2.4 s.

**Remaining weaknesses (honest):**
1. **Motion between beats is low:** mean frame-to-frame luma change is 1.7/255, below the human band (IQR 4.4–9.8). The camera pushes are slow, and the sections lean on the overlays for change.
2. **16.75–17.5 s:** the start of the Sept section is dark until the first call window lands at 0.2 s.
3. **The dead stop measures only 9.2 dB under the reference** (pack target ~18 dB). Liam is still speaking "interview…" through it. The music and SFX are at zero.

**Numbers:**
- **look.py:**
  - G0 PASS: 59.99 s, audio present.
  - G2 PASS: no run of more than 3 flat frames.
  - G3 PASS: the end hold is 0.25 s, ending mid-motion; the final shot is 3.24 s, 5 % of the film.
- **G1 (by eye):** the report sentences under the lens are above 0.04 H; the page fills the width.
- **G4 (by eye):** one hero per frame.
- **Cut sync:** 12 of 15 cuts within ±80 ms of an onset (80 %).
- **measure.py strobe:** 0 strobe frames.
- **Loudness:** −14.3 LUFS integrated, true peak −1.0 dBFS, LRA 2.0 LU.
  - The hook's loudest quarter-second is 1.25–1.50 s (the vault hit), at −12.3 dB RMS.
- **reel_qa.py:** 5/7.
  - The 540×960 size is expected for a preview.
  - Two "silences", both planned: 1.25 s is the dead stop before the hit, and 59.65 s on is the final fade.
- **VO:** 11 Liam takes (turbo v2.5, hi), each checked with Scribe at generation.

## Benchmark gate (docs/BENCHMARK_REPO_STUDIO.md)
- [x] **The concept is original, and the hero performs it physically.** The engineer types, recoils from the alert, and reacts to the call windows. The zip physically drops onto the desk and is later sealed in the sandbox. The coins pour out of the vault, then freeze.
- [x] **Every claim is real evidence, shown in-world.** The lens magnifies Binance's own captured report sentences: "USD 6.34 billion … impacted" and "Binance will absorb … not our users". Each figure traces to docs/factcheck.md.
- [x] **Every beat has at least 5 parallel layers.**
  - For example, the report beat has a 3D page panel, the lens, two date chips, the counter, the source line, captions, a camera push and SFX.
  - No action repeats back to back.
- [x] **The voice is the timeline.** Sections come from Liam's word times on a 0.25 s grid. The counters, the stamp, the columns and the CTA trigger on their spoken words (wordT).
- [x] **Sound is placed from the picture's own events** (mix_heist.py reads the same SCENE_TIMINGS and word times).
- [x] **The measured numbers match the benchmark:** G0/G2/G3 pass, 0 strobe, −14.3 LUFS, cuts on onsets 80 % (≥ 40 %).
- [x] **What this reel does that ONE BOT, 16 REPOS did not:**
  1. **Procedural human characters** (the vendored zach-d-films rig), posed per frame: typing, recoil, POV.
  2. **A primary-source magnifier.** It finds the exact sentence boxes in a live-captured page via DOM text ranges, at true optical magnification.
  3. **Live canvas device screens** (laptop and phone) that change state per frame.
  4. **A physical data model:** 520 instanced coins with exactly 45 % iced (2.85 / 6.34).
  5. **A synthesized tabla layer** in the score.
