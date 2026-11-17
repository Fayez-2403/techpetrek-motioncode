# Review log: ONE BOT, 16 REPOS — the motion studio stack

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

## Round 1 — v2 preview 540x960 (out/preview/studio_v2_preview_540x960.mp4), 2026-11-03
Score **8/10**. look.py G0 PASS (52.54 s, audio), G2 PASS, G3 PASS (end hold 1.07 s, final shot 9 %); 34 cuts, 16 on a sound
onset; −14.1 LUFS, TP −1.4; strobe 0 (v1 had 14 one-frame stomp flashes → softened to 0.18 s at 12 %); reel_qa 5/7
(size = preview; the "silence" at 52.3 s is the end fade). Fixed from v1: the bot filled half the frame (camera ×1.6),
cameras sat behind gallery panels (arc moved to the back half), frame 0 now already falling, FASTER-WHISPER title overflow.
Still to improve: mean motion 2.3/255 (below the human band) → more camera travel inside long beats (ffmpeg 3.9 s, pyloudnorm 3 s).
