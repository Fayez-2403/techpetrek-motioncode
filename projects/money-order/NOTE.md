# Ek Baar Bheja, Do Baar Kata: NOTE (preview v1, 2026-11-27)

**The idea.** Payment idempotency as a fable.
- A 1930s money order: the telegraph wire snaps, the clerk resends, the city pays twice (a duplicate request).
- The fix: a receipt number plus a PAID register.
- The twist: Hariram fills in a new form with a new number, and it's paid twice again.
- The rule: the key is made once and reused on every retry, which is Stripe's `Idempotency-Key`.

**Style.** The same hand-inked cel engine as Berth 42, with a new cast (Hariram, Munshi-ji, Tara, Mohan), new sets (village post office, storm line, city counter) and a new locked palette (periwinkle, hot pink, cream, khaki, post-box red).

**What is real.** Stripe's idempotency docs (F1 and F2 in docs/factcheck.md). Everything else is fiction and labelled as such.

**Numbers (`out/money-order_v1_preview_540x960_60fps.mp4`, 77.9 s).**
- reel_qa: 5/7 (0 silences, -14.5 LUFS, 0 flat frames; size and duration are the expected fails).
- look.py: G0, G2 and G3 pass (final shot 3.83 s = 5 %). True peak -1.9 dBFS.
- Cut sync: 38 % (9 of 24).
- Strobe: 0.
- Final-mix STT: all 20 lines right; the brand is heard as "TechPe Trek".

**Still to improve.**
- About 78 s, longer than the channel's usual 60 s.
- The register rows are small on a phone.
- Arms still read as stiff cut-outs.
- No mouth flaps.
