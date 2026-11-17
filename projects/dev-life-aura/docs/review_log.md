# Review log: SOFTWARE ENGINEER, THE LIFE BEHIND THE SCREEN

## Round 1: the 100 s animatic (out/preview/devlife_v1_preview_540x960.mp4), 2026-11-07
Built from the spec (`docs/spec/`), the corrected beat grid, 41 stock clips, 5 identity-locked start frames and one Veo shot (V5).

**Three worst problems, fixed:**
1. **One-frame black gaps at 9.20, 23.88, 30.48 and 63.47 s.**
   - **Cause:** Sequence durations were rounded from (t1 − t0).
   - **Fix:** the duration is now round(t1·60) − from, so shots tile exactly. After the fix, look.py reports no dips.
2. **Held screens: the standup (2.25 s), the call grid, and the tests.**
   - **Fix:** the camera drift was doubled (zoom 1.0 → 1.13, ±5–7° perspective) and a moving light sweep added.
   - **Fix:** the tests now print twice as fast, the call tile grows from 12 % instead of 35 %, and the standup avatars pulse as speakers.
   - Now the longest near-still run is 1.28 s.
3. **Screens were top-heavy and the type cards sat on UI text.**
   - **Fix:** all screen content moved toward the middle of the frame, and the cards moved from y 1270 to 1440.

**Also fixed:**
- the Apple logo was cropped out of `s03_laptop_case` (reframed);
- the travel chapter was shortened to airport, luggage and wing. That removes the 7-Eleven sign and gives the log-off its real-time 5.4 s.

**Numbers (after the fixes):**
- **look.py:** G0 PASS (100.00 s, 6000 frames, audio), G2 PASS, G3 PASS (ends in motion; final shot 5.45 s = 5 %).
- **Strobe:** 1, the planned 3-frame flash on the 67.49 bass drop.
- **reel_qa:** fails 1080 (preview), "< 60 s" (the spec's 100 s is intentional) and silent windows (the song's own silent first frame, plus the spec's gated silence at 73.42–73.69).
- **Loudness:** −13.9 LUFS.
- **Motion:** mean luma change 1.6/255, below the human band. Many dark screens; the live-action share will rise when V1–V4 arrive.

**Scores (1–10):**

| Category | Score | Note |
|---|---|---|
| Hook | 7 | the eye is a still with a push until V1 exists |
| Accuracy | 9 | |
| Mobile readability | 7 | |
| Composition | 8 | |
| Motion | 6 | |
| Variety | 8 | |
| Sync | 8 | every cut on a measured beat; the drop on the incident |
| Consistency | 9 | one face across all shots |
| Rights | PASS | Pexels / Mixkit-Free logged; AI shots labelled; commercial song flagged |
| Polish | 7 | |

**Open:**
- V1 (eye), V2 (platform), V3 (deep-work orbit) and V4 (incident) are still stills with a push. They need 4 × 30 kie credits; the current key has 2 left.
- The hand-only shots are stock people, never presented as him.

## Round 2: all five protagonist shots are real video (same preview path), 2026-11-07
- **Added:** V1 eye (from 0.5 s: the blink), V3 deep work (from 0.6 s: typing as the lamp slides in), V2 platform (from 2.8 s: he turns to the train), and V4 incident (from 2.0 s: the headphones go on before the drop; from 5.0 s: the decisive typing replaces the F4 still). All are Veo 3.1 Lite, 720p, image-to-video from the identity-locked start frames, audio stripped, upscaled to 1080×1920 at 60 fps (frame-duplicated, real action speed).
- **look.py:** G0, G2 and G3 PASS. Strobe: 1 (the planned drop flash). Motion 1.7/255.
- **Credits:** 198 of the 240 cap. 48 on images (character sheet + F1–F5), 150 on Veo (V1–V5).
- **Scores now:** hook 8, motion 7, consistency 9, polish 8.
