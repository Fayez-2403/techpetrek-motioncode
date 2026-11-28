# Review log: Ek Film, Hazaar Copies

After every check (stills, motion check, final), log (master studio §17, motion-studio follow-up format):
1. a score from 1 to 10 per category;
2. the three biggest problems, with timestamps;
3. the fix for each, with numbers.

Then re-render only those sections. Facts and rights pass or fail on their own, regardless of the scores.

## Round 1: the 540x960 motion check with sound (2026-11-28)
**Built start to finish in one session on the money-order engine.** New format (bioscope-wala chant on a 104 BPM groove, lines snapped to beats), cast, four sets, palette, script, voice, score, porthole grab shots, film-leader act cards and 26 shots.

| Category | Score |
|---|---|
| Opening hook clarity and strength | 8 (two real Indian-scale numbers in 11 s, then "ye jaadu nahi") |
| Product/source accuracy | 9 (five real pages, unedited, ringed; fiction labelled) |
| Mobile readability (360 px phone test) | 7 (grabs read after the 2x punch; map town names are small) |
| Composition, camera continuity, depth | 8 |
| Motion quality, easing | 7 (on-twos ink cels; mean luma change 1.3/255, below the human band) |
| Scene variety, retention | 8 (mela, studio, map, cinema hall, censor, split screen, telegram, scroll) |
| Music/voice/SFX sync | 9 (cut sync 67 %) |
| Actor/mascot/product consistency | 8 |

**Three worst, fixed before showing:**
1. **58.4 s** the PURGE stamp sat behind the caption → moved to y 360 above the porthole, cream with an ink outline, landing on the word "purge" (Wd b14 2 5, -0.03 s).
2. **28.5 s** the origin label "Bombay" (and "Ahmedabad") was cut at the left edge, and the seven vans stacked into one red blob → Bombay's label under its dot, Ahmedabad's to the right; the camera push ends at x 500 (not 560) and sh_towns starts there; routes draw in 1.1 s with a 0.1 s stagger, so all land before the cut; vans show after 6 % of the route.
3. **Voice take artefacts found by Scribe** (clean vo.wav plus 2-3 s windows): b01 "dekho [naya]", b14 "tareekh hai, [mumble] hai TTL", b17 "aur interest… interesting" with an "aur" heard as "on" → `scripts/audio/fix_vo.py` (fade, mute, move the clean word, and splice b14's clean "aur"); raw take kept as vo_raw.wav.

Also: the STALE CACHE stamp moved up 25 px; the grab punch-ins went up to 2.0-2.2x; true peak after AAC was -1.5 dBFS → loudnorm TP -3.5 gives -2.7 dBTP at -14.7 LUFS.

**Numbers (`out/film-prints_v1_preview_540x960_60fps.mp4`, 74.8 s):**
- reel_qa 5/7: 0 silences, -14.7 LUFS, 0 flat frames. The size (preview) and duration (75 s) fails are expected.
- look.py: G0, G2 and G3 pass (final shot 4.93 s = 7 %, ends mid-motion); 36 cuts, mean shot 2.02 s.
- Cut sync: 24 of 36 cuts within 80 ms of an onset (67 %; chance level is about 36 %).
- Strobe: 0. True peak -2.7 dBTP.
- Final-mix STT (Scribe): all 17 lines right; the brand reads "tech पे Trek … simple और interesting". "phool" comes back as फूल or "full" depending on the run.

**Benchmark gate (docs/BENCHMARK_REPO_STUDIO.md):**
- [x] **Original concept, performed:** Baba cranks the bioscope, prints really travel the map, the censor really cuts the strip, Patna's screen keeps the old scene.
- [x] **Real evidence in-world:** five real pages (afaqs, Eternal, Business Today, Cloudflare, MDN) seen through the bioscope's own porthole.
- [x] **5+ layers per beat, no back-to-back repeat:** set, actor, prop, camera, caption and SFX on every shot.
- [x] **Voice/music is the timeline:** the chant snaps to the 104 BPM grid; cuts at line starts land on beats.
- [x] **Sound from picture events:** 91 events from `film.shots.events()` (leader beeps, projector, snip, chimta, van, ooh, iris).
- [x] **Numbers:** G0/G2/G3 pass, 0 strobe, -14.7 LUFS, cut sync 67 % (≥ 40 %).
- [x] **New capability vs ONE BOT, 16 REPOS:** a musical chant format with beat-snapped VO timing; the porthole-iris grab grammar; surgical take repair (word splice) instead of a re-take.

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
