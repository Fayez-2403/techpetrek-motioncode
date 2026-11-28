# Review log: Paani Ka QA Fail: Bisleri x Obby Breaking News

After every check (stills, motion check, final), log (master studio §17, motion-studio follow-up format):
1. a score from 1 to 10 per category;
2. the three biggest problems, with timestamps;
3. the fix for each, with numbers.

Then re-render only those sections. Facts and rights pass or fail on their own, regardless of the scores.

## Round 1: 540x960 motion check with sound (2026-11-23)
| Category | Score |
|---|---|
| Opening hook clarity and strength | 8 (HELLOOO + record scratch; the news lands in line 2, 3.4 s) |
| Product/source accuracy | 9 (B1-B10 all sourced; Bisleri's numbers said as "Bisleri ke hi statement ke mutabik") |
| Mobile readability (360 px phone test) | 7 (captions 78 px read fine; receipt body text is small, but the highlight and the caption carry it) |
| Composition, camera continuity, depth | 7 (one camera rig the whole film; the avatar stays centre-low under the cards) |
| Motion quality, easing | 7 |
| Scene variety, retention | 8 (receipt → CI panel → meter → boss → reply → pipeline bottle → poll) |
| Music/voice/SFX sync | 8 (after the fixes below; every word right in the final-mix STT) |
| Actor/mascot/product consistency | 8 (one avatar, one obby, generic unbranded bottle) |
| Media rights and attribution | PASS (original code-built obby, no Roblox assets; no Bisleri logo; news captures credited) |
| Overall polish | 7.5 |

Three biggest problems:
1. `3.4-58 s` captions: the spoken word's 1.12x pop and -3° tilt covered the 20 px gap, so 9 cards read "FSSAIne",
   "Bislerike", "dedi!", "pipelinechalani"… → gap 34 px, pop 1.07x, tilt -2°; stills at frames 350/587/1777/3195/3436 show the spaces.
2. `4.7 s and 23 s` the two music stops were digital silence, and SFX masked words ("PAHs" heard as "VAH", the brand as
   "Techpit TRAC") → a rising whoosh fills each stop; buzz/roar moved to pahs +1.35/+1.4 s; the sting is trimmed to 0.5 s and
   ends before n16; music x0.45 under "ka hai" (45.75-46.45 s) and x0.15 under "Tech pe Trek". Final-mix STT now: "PAHs",
   "Goa sample ka hai", "TechPeTreck".
3. `62.8 s` silent tail (groove stopped at total -0.4 s, then a 0.4 s fade), and true peak -0.5 dBFS after AAC → a last kick
   + an Am chord ring to the final frame with a 0.08 s de-click fade; lowpass 15 kHz + loudnorm TP -2.5 → -1.8 dBFS true peak.

Numbers (final preview, out/bisleri-obby-news_v1_preview_540x960_60fps.mp4):
- reel_qa.py: 5/7. Codec, AAC, 0 silent windows, -14.4 LUFS and 0 flat frames pass. The two fails are expected: size
  (540 preview) and duration 63.18 s (the brief allows 55-65 s).
- look.py: G0 PASS (63.18 s, audio), G2 PASS, G3 PASS (end hold 0.00 s, final shot 8.50 s = 13 %), true peak -1.8 dBFS, LRA 1.7 LU.
  G1/G4 by eye on the sheet: the proof reads through the highlight and the caption; two panels share the frame only at 15-27 s
  (receipt + CI panel, the CI panel is the larger hero).
- measure.py strobe: 0 strobe frames.
- STT (Scribe, final mix): every line matches the script.

## Retro (at the end)
Every follow-up becomes a rule for the next reel. Also add them to motionmaxxing taste/verdicts.md.
