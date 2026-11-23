# NOTE: 140 Crore, 31 Sawaal (Binary Search, zero to hero), preview v1

**Idea:** one object teaches the whole film. The yellow school scale is the search space, and every answer SNAPS it in half. It carries the hook (140 crore → 31), the 1–100 game, the cards and code, git bisect (an upright scale of commits) and the exam (a scale of answers).

**Real vs illustration:**
- **Fictional:** Bro, Bhai, the interviewer, the PG room and the office (drawn in code).
- **Computed and listed in docs/factcheck.md (F1–F14):** every number, the Java code, the overflow values, the bisect steps (good 0, bad 1000, first bad 613) and the exam puzzle (LeetCode 875's own example).

**Measured on out/dsa-binary-search_v1_preview_540x960_60fps.mp4 (94.93 s, 60 fps):**
- **reel_qa:** 5/7. The 2 fails are expected: the size (540 preview) and "under 60 s" (95 s by design).
- **Loudness:** −14.7 LUFS, true peak −1.0 dBFS, 0 silent windows.
- **look.py:**
  - G0 PASS (94.93 vs 94.90 s, audio present).
  - G2 PASS (no run of more than 3 flat frames).
  - G3 PASS (end hold 1.02 s; final shot 9.4 s = 10 %).
  - 9 cuts, 4 of 9 within 80 ms of a sound onset.
- **measure.py strobe:** 0 frames.
- **G1 / G4, judged by eye on look/sheet.jpg:** UI text is at least 0.04 H; one hero per frame (the scale, the cards plus editor, the commit column plus terminal).
- **STT on the final mix (Scribe):** all 31 lines heard as written over the music.

**Follow-ups fixed after look-dev v1:**
1. The guess pin lingered after its snap; it now hides at the snap.
2. The BINARY SEARCH title collided with the 71 label and the thought bubble; both now clear when the title lands.
3. The overflow meter was cramped; it now sits on one line, the bar shrinks to high − low, and the cards hide underneath.
4. The office terminal text overflowed; it is now 23 px and fits.
5. The Koko title ran wider than its card; it is now 62 px.
6. The office opened on an empty column for 1.7 s; the fill now starts at the cut.

**Still to improve:** the mix is mono; caption word timing is proportional within a phrase, so two short words sometimes light together.

# v2: "Pehchaan" cut (the user's brief, 2026-11-22)
**The brief:** start on "Arre yaar, kal interview hai", explain binary search simply, then show what interviewers ask so you RECOGNISE a binary search question, and end on a CTA for 10 more.

**Structure:**
- **0–7 s:** the kal-interview problem.
- **7–23 s:** binary search on one scale (1–1000, target 737, 10 steps), then "ASLI GAME: PEHCHAAN".
- **23–55 s:** Bhai (in a tie) plays the interviewer and asks 5 question types:
  - sorted;
  - rotated (one half still sorted);
  - sqrt with no built-in (the answer range);
  - minimum speed in 6 days (min that satisfies a condition);
  - O(log n).
  Each card highlights its giveaway words and gets a stamp plus its clue.
- **55–62 s:** the 3 clues.
- **62–66 s:** the "BINARY" CTA.

**Measured on out/dsa-binary-search_v2_preview_540x960_60fps.mp4 (65.94 s):**
- **reel_qa:** 5/7. The fails are the size (preview) and 65.9 s against the 60 s check.
- **Loudness:** −14.8 LUFS.
- **look.py:** G0, G2 and G3 PASS (end hold 1.05 s, final shot 13 %).
- **Strobe:** 0 frames.
- **Scribe on the final mix:** all 23 lines heard as written.

**Fixed in look-dev:**
1. The 1–1000 labels collided; they are now spaced by digit count and never hang off the end.
2. The header overlapped 737.
3. Pieces lingered over the hosts.
4. The bubble repeated the question that is already on the card.
5. The rule header was too wide.
6. A 5 s static hold after 737; it is now the PEHCHAAN beat.

**Files:**
- **Code:** `src/v2/*`, `scripts/audio/timing_v2.py`, `scripts/audio/mix_v2.py`.
- **Post kit:** `post/caption_v2.txt`, `post/dm_binary_v2.txt`.
