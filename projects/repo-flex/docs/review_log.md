# Review log: Flexing My Repos

After every check (stills, motion check, final), log (master studio §17, motion-studio follow-up format):
1. a score from 1 to 10 per category;
2. the three biggest problems, with timestamps;
3. the fix for each, with numbers.

Then re-render only those sections. Facts and rights pass or fail on their own, regardless of the scores.

## Round 1: v1 preview, 540x960 motion check with sound (2026-10-31)
| Category | Score |
|---|---|
| Opening hook clarity and strength | 7 |
| Product/source accuracy | 9 |
| Mobile readability (360 px phone test) | 8 |
| Composition, camera continuity, depth | 7 |
| Motion quality, easing | 6 |
| Scene variety, retention | 8 |
| Music/voice/SFX sync | 7 |
| Actor/mascot/product consistency | 9 |
| Media rights and attribution | PASS (picture: own repo clips; the song is the user's file, so an IG copy without it ships too) |
| Overall polish | 7 |

Three biggest problems:
1. `0.00-0.78, 3.95-4.72, 6.87-7.65 … (every bar)`: the typing phase is near-still for 0.78 s -> 4.5 % push-in over the
   typing plus a 1.2 % bounce on every beat (exp decay 12/s).
2. `1.86, 4.78, 7.71 … (every send)`: the result card bursts 120-135 ms after the snare onset -> the burst starts on the
   send itself (offset 0 instead of +0.12 s).
3. Mean frame-to-frame luma change is 3.2/255 (human band 4.4-9.8): the chat phase is a dark UI on purpose, to match the
   reference. Kept, and noted.

Numbers: reel_qa 6/7 (size fails only because it's a preview); look.py G0/G2/G3 PASS, final shot 13 %; -14.0 LUFS,
-4.1 dBTP; bars/sends/punches land 1-21 ms after the measured song onsets (115 onset peaks; chance within 40 ms is 39 %).

## Round 2: v2 (push-in) and v3 (burst on the snare) previews (2026-10-31)
| Category | Score |
|---|---|
| Opening hook clarity and strength | 7 |
| Product/source accuracy | 9 |
| Mobile readability (360 px phone test) | 8 |
| Composition, camera continuity, depth | 8 |
| Motion quality, easing | 8 |
| Scene variety, retention | 8 |
| Music/voice/SFX sync | 9 |
| Actor/mascot/product consistency | 9 |
| Media rights and attribution | PASS (same as round 1) |
| Overall polish | 8 |

Results: no frozen stretch >= 0.6 s (longest near-static 0.43 s, at 23.27 s in the outro grid); the bursts now start on
the snare (1.75, 4.67, 7.58 …); reel_qa 6/7 (size only, preview); G0/G2/G3 PASS; -14.0 LUFS, -3.9 dBTP.
Left: the luma change is 3.4/255, still below the human band (by design, dark chat UI).

## Round 3: v4 preview, user edit (2026-11-01)
User asked: no repo name in the outro, no "Evening, Fayez" at the start.
- Opening chat: the greeting note is gone (the chat opens on the typed /flex command only).
- Outro: "EditorBro" + github.com/Fayez-2403/EditorBro replaced by "7 builds / all from one repo" (count from flex.json).
- Still showing the name: the /highway tile's own footage (clapperboard + billboard in the 3D world), the chat header
  "EditorBro · studio" and the path tags during the commands. Left as is; the user asked only about the outro text.
Numbers: reel_qa 6/7 (size only, preview); G0/G2/G3 PASS, final shot 13 %; -14.0 LUFS; luma change 3.4/255 (unchanged).

## Retro (at the end)
Every follow-up becomes a rule for the next reel. Also add them to motionmaxxing taste/verdicts.md.
