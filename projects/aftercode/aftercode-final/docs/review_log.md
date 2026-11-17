# Review log: AFTERCODE Final: Build Your Cast

After every check (stills, motion check, final), log (master studio §17, motion-studio follow-up format):
1. a score from 1 to 10 per category;
2. the three biggest problems, with timestamps;
3. the fix for each, with numbers.

Then re-render only those sections. Facts and rights pass or fail on their own, regardless of the scores.

## Round 1: look-dev stills of every shot (sheets s1-s3) + the v1/v2 540x960 previews (2026-11-01)
| Category | Score |
|---|---|
| Opening hook clarity and strength | 8 |
| Product/source accuracy | 9 |
| Mobile readability (360 px phone test) | 8 |
| Composition, camera continuity, depth | 8 |
| Motion quality, easing | 8 |
| Scene variety, retention | 9 |
| Music/voice/SFX sync | 9 |
| Actor/mascot/product consistency | 9 |
| Media rights and attribution | PASS (own captures, CC BY music credited in the caption, generated VO; no real faces) |
| Overall polish | 8 |

Three biggest problems (all fixed):
1. `0.96 s and every battle close-up`: two-shots in 9:16 cut both dancers off, and close-ups showed the backs of heads
   (the mocap turns the dancers) -> the hook became a split screen (two close-up captures of the same bar); a face-front
   mode cancels the hips' heading and pins the travel; two-shots moved out to 4.1-4.5 m.
2. `23.28-29.53 s (neta round)`: Disco Medusae's transients sat 52 ms BEFORE the app's grid (the music led the dancers and
   the cut by 3 frames) -> sync_check.py measures every segment against the grid, calibrated on the mix's own slams;
   mix.py slides a segment > 30 ms off. Now -2 ms; every segment within +20 ms (audio never ahead of the picture).
3. `the MC`: "diss" was heard as "this"/"desk" and "neta" as "nita" (Scribe + faster-whisper) -> diss not spoken (the
   cards carry it), neta spelled नैता, h01 synthesized alone (its last O was cut by the next line). All 10 lines pass both STTs.

Numbers (v2 preview):
- reel_qa.py 6/7 (size fails only because it is a preview): 46.18 s, 2771 frames, -14.0 LUFS, 0 silences, 0 flat frames.
- look.py G0/G2/G3 PASS: no frozen stretch >= 0.6 s (longest static 0.30 s), final shot 3.83 s = 8 %, mean luma change
  4.6/255 (inside the human band 4.4-9.8).
- measure.py: 0 strobe frames; median RGB (2,1,0), p99 luma 233, 0.44 % clipped; no quarter-second dips.
- STT: Scribe + faster-whisper on every line (see voScript.json _doc).

## Round 2: v2 = the app ad (user: "advertise the application like v1's script, the dances as examples") (2026-11-01)
Scores as round 1, plus Opening hook 9 (the reveal line "ye battle kisi studio mein nahi bana" lands on frame 0).
- Script: 11 lines in the first reel's voice (what AFTERCODE is, the builder, your own photo, songs on the beat, battles,
  duo, squad, worlds, CTA); every dance is labelled EXAMPLE n/5; an AFTERCODE chip stays on through the examples.
- STT: l3 "chuno" heard "suno" -> "gaana lagao"; l7 "aath worlds" heard "@world's" -> "aath alag worlds"; l9 babbled at the end
  of the joint take -> l3, l7, l9 re-voiced alone (vo_solo.py). All 11 lines pass Scribe + faster-whisper.
- Finale lengthened to 3 bars (48.11 s) for the CTA line; the cast shot recaptured.
- Real faces (Amitabh Bachchan, Rekha, the rest) NOT used in the ad: Amitabh Bachchan holds a Delhi HC John Doe order (Nov 2022)
  on his name / image / voice; the PM's picture in ads needs the Centre's permission (Emblems and Names Act, 1950); a real
  face selling an app implies an endorsement nobody gave.
Numbers (v3 ad preview): reel_qa 6/7 (size only: preview); 48.11 s, 2886 frames, -14.0 LUFS, 0 silences, 0 flat frames;
look.py G0/G2/G3 PASS, longest static 0.32 s, final shot 12 %, luma change 4.5/255 (human band).

## Retro (at the end)
Every follow-up becomes a rule for the next reel. Also add them to motionmaxxing taste/verdicts.md.

## Round 3: v4 ad preview, photo faces on the battle cast (2026-11-01)
- Six fictional AI faces (Nano Banana 2 via Open Higgsfield AI / kie.ai, 48 credits) on founder, boss, president,
  chancellor, neta1, neta2; loaded by the app's own face pipeline in final.ts prepare(); the morph shot keeps the drawn face.
- App fix found on the way: makeFace() read the sampled skin as linear and brightened it (every face ~#e9cbb6, pale
  necks/hands); now sRGB (src/face/faces.ts). Neta skins now match their photos.
- End card: "All characters are fictional · photo faces AI-generated · made in AFTERCODE". Old clips in out/clips_v3/.
Numbers: reel_qa 6/7 (size only, preview); 48.11 s, 2886 frames; -14.0 LUFS; G0/G2/G3 PASS, final shot 12 %; luma 4.6/255.
Left: when a dancer turns side-on (hook lower half ~0.9 s), the photo face reads in profile on the round head.
