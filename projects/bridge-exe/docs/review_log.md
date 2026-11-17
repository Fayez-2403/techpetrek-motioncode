# Review log: BRIDGE.EXE — Can your design survive?

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

## Round 1 — v1 preview 540x960 (out/preview/bridge_v1_preview_540x960.mp4), 2026-11-02
Score: **7.5 / 10**. Numbers: look.py G0 PASS (70.02 s, audio), G2 PASS, G3 PASS (end hold 0.82 s, final shot 10 %);
loudness −14.1 LUFS, TP −1.3 dBFS; 7/13 cuts on a sound onset; reel_qa 4/7 (size = preview, 70 s = planned length,
"silence" at 22.75 s = the planned RUN drop). Mean motion 0.9/255 (below the human band).
Three worst:
1. 50–57 s arcade: the follow camera ends inside a dark fragment (55 s frame is mostly one blurred piece) → pull the follow
   camera back (offset −16/+7/+20 → −24/+10/+30) and stop following when the piece is below the river surface.
2. Held stretches 24.3–25.8 s, 40.2–43.3 s, 48.2–49.8 s → add a slow push (≥ 3 % scale) on held cards / the compare shot.
3. Lower-third disclaimers are too small at phone size (22 px at 1080) → 26 px and lighter ink.
Kept: hook frame 0 (red/cyan sag + title), RUN drop, A/B card with the honest "check", evidence card.
