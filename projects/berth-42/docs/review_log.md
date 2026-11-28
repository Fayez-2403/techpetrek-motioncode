# Review log: Berth 42: Ek Seat, Do Ticket

After every check (stills, motion check, final), log (master studio §17, motion-studio follow-up format):
1. a score from 1 to 10 per category;
2. the three biggest problems, with timestamps;
3. the fix for each, with numbers.

Then re-render only those sections. Facts and rights pass or fail on their own, regardless of the scores.

## Round 2: script v2, the conversational rewrite (2026-11-27)
**The user's note:** "smoothen it to end in sentences, not break one by one... completely refine it, conversational impact".

**What changed:**
- **The script:** 253 words of flowing sentences instead of one-beat fragments.
- **The voice:** three run-on pairs are read as one sentence; pauses cut to 0.10 s (comma) and 0.20 s (stop).
- **The picture:** shots re-anchored to the exact words (do / dono / asli, ek taraf, berth, Chhotu / Bhimsen, race, seat busy, taala / chai).
- **v1 is kept untouched:** `berth42_v1_preview_540x960_60fps.mp4`.

**Numbers (`out/berth42_v2_preview_540x960_60fps.mp4`, 74.41 s):**
- reel_qa 5/7 (0 silences, -14.8 LUFS, 0 flat; size and duration are the expected fails).
- look.py: G0, G2 and G3 pass (final shot 4.08 s = 5 %). True peak -2.3 dBFS. Cut sync 28 % (v1: 24 %).
- Strobe: 0.
- Final-mix STT: all 22 lines right. Scribe transcribes the joined pairs as single sentences.

## Round 1: the 540x960 motion check with sound (2026-11-27)
**Preview:** `out/berth42_v1_preview_540x960_60fps.mp4`, 75.33 s, 60 fps master, drawings at 30 fps. It has 33 shots on word times and 86 sound events.

**Scores:**
- Hook: 8
- Accuracy: 9
- Mobile readability: 7
- Composition, camera, depth: 7
- Motion: 7
- Variety: 8
- Sync: 8
- Consistency: 8
- Rights: PASS (all code-drawn; fonts are OFL)
- Polish: 7.5

**Three worst problems, all fixed:**
1. `0-3 s` hook: the tickets overlapped and the hands were lost → separated, bigger, both hands, stamps moved off the 42; frame 0 starts mid-slide.
2. `42.7 s` and `72.2 s` silent windows → a reed pad under the twist, plus a high glock ting in the brand pause.
3. The final-mix STT heard "TechPeck" → a high-only sting, the music x0.15 under the brand, the final chord after it. Final STT: "Tech pe Trek, complex tech, simple aur interesting".

**Also fixed:**
- The register inserts were reframed so the row numbers show.
- The hook board moved so Bade Babu no longer hides hook 42.
- The closing shot was restaged.
- The telegram code is now two lines at 74 px.

**Numbers:**
- **reel_qa 5/7:** 0 silences, -14.8 LUFS and 0 flat frames pass; size and duration are the expected fails.
- **look.py:** G0, G2 and G3 pass. True peak -1.7 dBFS. Cut sync measured 24 %, but 31 of the 32 real shot starts have a hit within 70 ms (the detector also counts spinning-watch, whip and punch-in frames).
- **Strobe:** 0.
- **STT on the final mix:** all 22 lines right.

**Benchmark gate:**
- [x] Original concept, performed physically.
- [~] Real evidence, re-lettered in-world (the Redis line + docs quote, the Tatkal 10 AM sign); there is no screenshot because the ink-cel style bans photos.
- [x] 5+ parallel layers per beat.
- [x] Voice is the timeline.
- [x] Sound from the picture's events.
- [~] Numbers: everything passes except cut sync, measured at 24 %.
- [x] New capability: a code-drawn hand-inked cel engine (pen-polygon ink, 5 rigged caricatures with two-bone IK, an old-cartoon finish, depth-of-field compositing, whips, caption timing).

## Round 0: design sheet v1 (2026-11-27), the prompt's gate 2 (cast + sets + palette)
**Files:**
- `out/design/DESIGN_SHEET_berth42_v1.png` (full)
- `DESIGN_SHEET_berth42_v1_small.jpg`
- the parts: `sheet_cast_lineup.png`, `sheet_heads.png`, `sheet_sets.png`, `sheet_palette.png`
- `key_still_line01.png`

**Reference check (the prompt asks for an honest %, not rounded up):**
- The close-up, against the example's ink close-up, is **about 43%** (40% before the line and texture pass).
- The look as a whole, against the example video, is **30-35%**. Some example shots have painted light and depth of field that this flat code kit doesn't produce.

**What still gives it away:**
1. Far fewer marks inside forms (freckles, creases, hair strands, lash ticks).
2. Light patches still read a little like vector gloss.
3. Frontal, symmetric faces.
4. Flat set planes with no atmospheric depth.
5. Stiff cut-out arms in neutral poses.

**Fixed this round:**
- Bhimsen's jar head became a pear.
- Bhimsen's crotch knot moved to the hip.
- Rectangles were smoothed into blobs → `boxy()`.
- Bade Babu's cap hid his eyes → raised.
- Shamu's pear head matched Bhimsen's → lantern jaw.
- Ramu's visor covered his glasses → lifted.
- The TATKAL font axes were swapped (it rendered Thin).
- The register highlight was on row 43 → row 42.
- The key-still hands were placed by eye → two-bone IK.

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
