# Review log: Bro & Bhai

After every check (stills, motion check, final), log (master studio §17, motion-studio follow-up format):
1. a score from 1 to 10 per category;
2. the three biggest problems, with timestamps;
3. the fix for each, with numbers.

Then re-render only those sections. Facts and rights pass or fail on their own, regardless of the scores.

## Round 1: <what was checked> (<date>)
| Category | Score |
|---|---|
| Opening hook clarity and strength | |
| Product/source accuracy | |
| Mobile readability (360 px phone test) | |
| Composition, camera continuity, depth | |
| Motion quality, easing | |
| Scene variety, retention | |
| Music/voice/SFX sync | |
| Actor/mascot/product consistency | |
| Media rights and attribution | PASS / FAIL |
| Overall polish | |

Three biggest problems:
1. `t s`: what is wrong (measured) -> fix (numbers)
2.
3.

Numbers:
- reel_qa.py
- look.py G0-G4
- measure.py quarters / dip / colour / strobe
- STT (Scribe) result

## Retro (at the end)
Every follow-up becomes a rule for the next reel. Also add them to motionmaxxing taste/verdicts.md.

## Ep 01 round 1: v1 -> v2 previews, 540x960 (2026-11-01)
Built from the user's prompt TPT-20261030-1200-01 (VO verbatim, 18 x 3 s slots); speakers split Bro/Bhai; Bro = Liam,
Bhai = Pawan (ElevenLabs, picked by STT: Scribe word-perfect). Hosts are placeholder busts until the pose sheets exist.
v1 problems -> fixes:
1. Cuts too soft (look.py saw one 49 s shot, luma 0.7/255) -> camera punch per cut (6 % in, spring back, slow push-in),
   the light pool moves each cut, stronger flash, dark "myth mode" for slots 15-16. v2: G3 PASS (final shot 11 %), luma 1.0/255.
2. Music bed dropped below -50 dB between chiptune hits (8 windows) -> sustained pad + softer duck (-14 dB). v2: only the
   designed 0.25 s stop at 41.75 s remains.
3. s18 CTA overflowed, s04/s05/s11/s12 too small, stray speaking dot -> resized / removed.
Numbers (v2): 54.016 s, 3240 frames, 60 fps; -16.0 LUFS (the prompt's target; channel QA expects -14), peak -1.7 dBFS;
G0/G2/G3 PASS. Left: luma 1.0/255 is still below the human band (light, calm UI look); the real host poses (talk/point/
shock swaps on the beat) are the next big source of motion.

## Ep 01 round 2: v3 preview with the real host poses (2026-11-01)
- Hosts: two pose sheets from the user's own photos (Nano Banana 2 edit via kie.ai, 2K, 12 credits each; 8 left),
  cut into 16 transparent poses (scripts/cut_poses.py, chest-anchored 900x780 canvas). Speaker pose per line + listener reaction; pop on each cut.
- Tool fix: kie.ai uploads live on kieai.redpandaai.co/api/file-stream-upload (the studio's /api/v1 path 404s); tools/open_higgsfield.py updated.
Numbers: 54.016 s / 3240 frames / 60 fps; -16.0 LUFS (prompt target); G0/G2/G3 PASS, final shot 6 %; luma 1.1/255 (calm light UI, below the human band).

## Ep 01 round 3: v4 preview, the user's notes (2026-11-01)
User: game-level hook for the first 3 s (hero dives into water, jumps, fireballs, radiation), loud Bhai voice, no Bro/Bhai
names on screen, more energy, a launch-style song with a ringtone tone.
- Hook: original pixel platformer (src/ep01/hook.tsx); the hero is a pixel Bro (no existing game's character, music or level).
- Bhai re-voiced: stability 0.3, style 0.55, speaker boost, speed 1.1; +3 dB in the mix; s10/s14 calmed per line (babble / "QA").
- Names off: nameplates removed, SRT speaker labels stripped.
- Energy: launch track (120 BPM four-on-the-floor, pumping bass, supersaw stabs, ringtone bell motif), 8-bit hook loop + game SFX,
  riser and drop at 3.0 s; beat bump on the stage, host hop on the beat, sparkle field, hit-shake on cuts. Master -14 LUFS.
Numbers: reel_qa 5/7 (size: preview; silence: the designed 0.25 s stop); -14.0 LUFS; G0/G2/G3 PASS, final shot 6 %; luma 1.2/255.

## Round 4 — v5 preview (2026-11-02, the user's notes after v4)
Score: 8/10.

Notes applied:
- **New intro hook VO**, the user's words verbatim, said loud and clear:
  - Pawan at 1.2× TTS, plus a pitch-preserving 1.1× tempo (about +20 % over the series' 1.1×).
  - A "thud" chain: 120 Hz +5 dB, 3.2 kHz +3 dB, a fast 5:1 compressor, a limiter; +4 dB in the mix.
  - Scribe heard it word-for-word.
- **Faster game:**
  - The level now scrolls and accelerates, with 160 BPM chiptune.
  - Every beat comes from the intro's word times (src/ep01/hook_events.json):
    - dive on "solo"
    - block bump on "games"
    - fireballs pop bugs
    - repo chest on "GitHub repo"
    - radiation
    - a pipe hop each on Unity / Unreal / Godot
    - 49 agents join on "lead… 49 AI agents"
    - flag + fireworks on "mazedaar games"
  - The world is zoomed 1.35×.

Structure:
- The hook is 11.0 s, then 17 × 3 s slots: 62.0 s in total (was 54 s).
- The old s01 line was replaced by the intro.
- v4 files are kept: voScript_v4.json, lines_duo_v4.json, hook_v4.tsx, mix_ep01_v4.py.

Gates:
- reel_qa 4/7. The fails are the preview size, 62 s > 60 s (from the longer intro), and the designed 0.25 s stop (now at 49.75 s).
- Loudness -14.0 LUFS; 0 flat frames.

Pending:
- Host redesign ("20 % resemblance": curly hair on the forehead, and a tika). Needs the reference pictures as files, plus kie.ai credits.

## Round 5 — v6 preview (2026-11-02): new hosts at about 20 % resemblance
- **The sheet:** one combined kie.ai sheet: Nano Banana 2, 1K, 8 credits, the last ones (assets/generated/hosts/duo_sheet_v2.jpg).
  - Row 1 Bro, row 2 Bhai. 4 poses each: neutral, talk, point, shock.
  - Cut by scripts/cut_poses_v2.py: 2× Lanczos upscale; think/laugh/thumbs/shrug reuse the closest pose.
- **User's note on v2 Bro:** "remove tika and give him long hair". kie.ai had 0 credits left, so scripts/bro_hair_v3.py edits the cut poses in code:
  - the tika is painted out with the forehead's own skin tone;
  - shoulder-length cartoon hair is drawn behind the figure.
- **Bhai:** curly forehead hair from the v2 sheet, unchanged.
- **Hook sprite:** the pixel hero got long hair to match.
- **Kept:** public/hosts_v1/ (v1 replicas) and public/hosts_v2/ (v2 cut, with the tika).

## Round 6 — v7 preview (2026-11-02): full-quality hosts, more poses, lip sync
- **New sheets:** kie.ai Nano Banana 2 at 4K, 18 credits each, from the v3 designs as references.
  - **Bro:** bro_sheet_v4.jpg (long hair, no tika).
  - **Bhai:** bhai_sheet_v4b.jpg (curly hair). The first Bhai try (bhai_sheet_v4.jpg) ignored the brief (full body, white background, text labels) and is not used; 18 credits lost.
  - **Spent:** 54. **Credits left: 26.**
- **12 poses per host** (scripts/cut_poses_v4.py):
  - gestures: neutral, point, think, shock, laugh, thumbs, shrug, hype;
  - lip sync: talk_m/e/a/o, the same pose (registration offset 0 px).
- **Lip sync** (scripts/audio/visemes.py → audio/out/visemes_ep01.json): the mouth follows each line's own audio at 15 per second; the slot gesture shows on the line's first 0.4 s and on its key word. The POSE table now uses hype 3 times.
- **Kept:** public/hosts_v1/, public/hosts_v2/ (tika) and public/hosts_v3/ (code-drawn hair).
- **Gates:** reel_qa 4/7 (preview size, 62 s, the designed 0.25 s stop); -14.0 LUFS; 0 flat frames.

## Round 7 — ep 01 video carousel v1 (2026-11-02)
- **Ask:** a video carousel. Slide 1 mixes gameplay (Mario-style platformer, arcade gun game, team battle, puzzle) under the hook "You don't need a full team to develop a game now"; then 5-6 info slides.
- **Built:** 7 slides at 1080 x 1350, 60 fps (Remotion `CarS1`..`CarS7`).
  - Slide 1 (12 s): four original mini-games in a 2 x 2 grid. Each punches in full-frame on the beat for 1.5 s. Then FULL TEAM is struck out and "1 DEV + 49 AI AGENTS" lands. The last 0.4 s fades back to frame 0, so the loop is seamless.
  - Slides 2-7 (6 s each): the repo; the hierarchy; the engines; getting started; the honest part; the CTA. Hosts on each slide.
- **One timeline:** `src/carousel/events.json` + `sim.ts` → `scripts/carousel_events.ts` → `scripts/audio/mix_carousel.py`. Each game's sounds play only while that game is full-frame.
- **Follow-ups fixed from stills:**
  1. The shooter drones read like a famous arcade game's invaders, so they were redrawn as original saucers.
  2. The answer's rays showed box edges, so a radial mask was added. The subline sat on the HUD, so it now has a navy pill.
  3. Layout overlaps fixed: the illustration label vs the capture bar, Bro's bubble vs the 14 RULES tile, slide 6's third bullet vs Bhai. Slide 2's source line was cut to one line.
- **Gates (slide 1 preview):** look.py G0/G2/G3 PASS; -14.4 LUFS, true peak -1.2 dBTP; motion 1.9/255 (the hook band is held on purpose). Slides 2-7 are at -14.0 to -14.6 LUFS.
- **Score:** 8/10. Open: the full 1080 x 1350 render (waiting for "render"); the final encode needs a limited-range flag (the previews are yuvj420p).

- **v2 (2026-11-02, user note):** the Tech pe Trek logo (public/brand/techpe-trek.jpg) is now on every slide: an 80 px square, bottom-right, 24 px margin, 40 % opacity, above everything (src/carousel/Logo.tsx). Slide 1 SWIPE pill moved left of it; slide 7 top-right logo became "7/7". Previews: out/carousel_v2_preview/ (v1 kept).
