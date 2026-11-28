# Review log: Ek Baar Bheja, Do Baar Kata

After every check (stills, motion check, final), log (master studio §17, motion-studio follow-up format):
1. a score from 1 to 10 per category;
2. the three biggest problems, with timestamps;
3. the fix for each, with numbers.

Then re-render only those sections. Facts and rights pass or fail on their own, regardless of the scores.

## Round 2: v2, a real-platform cold open (2026-11-27). The user: "begin with something more amazing... real screen grabs from viral and famous Indian platforms"
**The new opening (0-16 s), real screen grabs inside the inked phone** (`film/engine.py` now places screenshots through the camera, clipped to the phone screen):
- **Paytm's own support page:** the headline is ringed in red, then a punch-in on "Do not rebook immediately."
- **Google Pay Help:** "in progress, wait for five working days" is ringed, with PhonePe's headline sliding in behind.
- **The why:** an inked PAY/PAY moment.
- **The bridge:** a zoom-whip into the 1937 calendar.

**Other changes:**
- The facts are F5-F8 in factcheck.md, with the boxes from `scripts/grab_focus.mjs`.
- The body lines were trimmed so the length stays at 84.4 s.

**Numbers (`out/money-order_v2_preview_540x960_60fps.mp4`):**
- reel_qa 5/7 (0 silences, -14.4 LUFS, 0 flat; size and duration are the expected fails).
- G0, G2 and G3 pass.
- 0 strobe frames.
- True peak -1.9 dBFS.
- STT: all 22 lines right.

**Benchmark "real evidence in-world":** now [x]. These are real captured pages, not re-lettered.

## Round 1: the 540x960 motion check with sound (2026-11-27)
**Built start to finish in one session on the Berth 42 engine:** a new cast, sets, palette, script, voice, score and 24 shots.

**Fixed before showing:**
- The CTA tag text floated off the rotated key → pinned to the tag.
- The DUPLICATE stamp was too close to the caption → moved up.
- The phone status overflowed the screen → smaller.
- The hook's "-Rs 50" ran past the passbook edge → moved in.
- The calendar overlapped the DAK GHAR board → moved.
- The CTA keyword KEY was heard as "kee" → changed to RETRY.

**Numbers:**
- reel_qa 5/7.
- G0, G2 and G3 pass.
- 0 strobe frames.
- -14.5 LUFS, true peak -1.9 dBFS.
- Cut sync 38 %.
- STT: every line right.

**Benchmark gate:**
- [x] Concept performed physically.
- [~] Real evidence re-lettered in-world (the Stripe header + docs quote).
- [x] 5+ layers per beat.
- [x] Voice is the timeline.
- [x] Sound from the picture's events.
- [~] Cut sync 38 % (target 40 %).
- [x] New vs the benchmark: the ink-cel engine re-cast and re-dressed for a second story with zero reused characters or sets.

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
