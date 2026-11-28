# Berth 42: NOTE (preview v1, 2026-11-27)

**The idea.** System design as a fable. One berth gets sold twice (a race condition). The fix is a per-seat padlock. The fix becomes the bug: a stuck lock when Ramu goes for chai. The real fix is a padlock with a sand timer, a lock with a TTL: `SET seat:42 chhotu NX EX 600`. The film ends on the payment countdown everyone has seen.

**Style.** @treyscalez's hand-inked cartoon cel, drawn fully in code (KT: docs/KT_ink_cel_style.md). There are no generated images.

**What is real.**
- AC Tatkal opens at 10 AM.
- The Redis SET NX EX lock line and its docs quote (docs/factcheck.md).

Everything else is invented and labelled as fiction in the caption.

**Gates (quoted from the scripts, final preview).**
- look.py: G0 PASS (75.33 s, audio), G2 PASS, G3 PASS (end hold 0.02 s; final shot 4.37 s = 6 %).
- `measure.py strobe`: 0 strobe frames.
- Loudness -14.8 LUFS, true peak -1.7 dBFS, LRA 1.8 LU.
- reel_qa: 5/7 (size and duration are the expected fails on a 75 s 540 preview).
- **Cut sync:** 24 % by look.py. Its detector also counts the spinning rewind watch, the whip blur frames and the telegram punch-ins as cuts. 31 of the 32 real shot starts have a placed hit within 70 ms.
- **STT (Scribe) on the final mix:** all 22 lines match the script, brand included.
- G1 and G4, judged by eye on out/look/sheet.jpg: the proof props are lit and large, and there is one hero per frame.

**What I'd still improve.**
- More interior ink marks (the reference is denser).
- Arms bend at the elbow but read stiff; add drawn poses for the flex and the sleep.
- Mouth flaps on the character being described.
- A trim towards 60 s.
- A lighter encode for the full render (the grain makes CRF 17 big: 131 MB at 540x960).
