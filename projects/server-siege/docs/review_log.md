# Review log: SERVER SIEGE — Can your backend survive?

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

## Round 1 — v1→v3 previews (540x960, 2026-11-01)
Score: 8/10. Grammar: EXPLAINER (host-led: Bro bottom-left, real app capture above).

Gates:
- reel_qa 4/7. The three fails are expected: 540x960 preview size, 68 s per the user's spec, and the designed 0.25 s stop at 24.75 s.
- Loudness -14.1 LUFS; 0 flat frames.
- look.py G2/G3 PASS; final shot 5.0 s = 7 %. Mean luma change 1.5/255 (dark night city; below the human band).

Fixed the three worst:
1. 13/35/53 s: the Edge Gateway's pillars blocked path shots. Cameras moved above the beam; the cache shot is now taken from the city side.
2. 1 s: the "SIMULATED REQUESTS" subline was unreadable over the gateway rings. It now sits on a dark pill.
3. 65.8 s: the run-result line wrapped and was lost on the hero shot. Shortened, single line, on a dark pill, with FAIL in coral.

Open:
- 60 s: the compact console reads small at preview size. Check at 1080 in the full render.
- The hero shot is calm. A slow orbit could add life.
