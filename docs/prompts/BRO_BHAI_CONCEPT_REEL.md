# Bro & Bhai concept reel: the copy-paste prompt

The format the user approved ("this one is goood", 2026-11-22): `projects/dsa-binary-search`, the v2 "Pehchaan" cut.
Paste everything inside the box, then change only the three lines under `FILL IN`.

```
Make a new Bro & Bhai concept reel.

FILL IN
TOPIC   = <e.g. Sliding Window | Recursion | HashMap | Two Pointers | Dynamic Programming | How UPI works>
KEYWORD = <one word people comment, e.g. WINDOW>
SLUG    = <kebab-case folder name, e.g. dsa-sliding-window>

REFERENCE (copy it exactly, only the topic changes)
projects/dsa-binary-search, the v2 "Pehchaan" cut: out/dsa-binary-search_v2_preview_540x960_60fps.mp4,
code in src/v2/ (Simple, Quiz, Rule, Hosts, Bubble, ReelV2), scripts/audio/vo_duo.py, timing_v2.py, mix_v2.py.
Same world (PG room at night), same two hosts, same speech-bubble captions, same voices, same sound kit.
Start the folder with: python .claude/skills/motion-studio/scripts/new_reel.py <SLUG> --title "<TOPIC>: Pehchaan"

STORY (60-66 s, exactly these 5 parts, in this order)
1. PROBLEM (<= 7 s). Bro opens with the viewer's real pain, in their own words:
   "Arre yaar, kal interview hai... aur <TOPIC> ka sawaal pehchaan hi nahi paata."
   Bhai: "Tension mat le. Pehle 20 second mein <TOPIC> samajh."
   Frame 0 already shows the problem (HR "Interview kal 10 AM" notification on Bro's desk) and is already moving.
2. SIMPLE (<= 20 s). Explain <TOPIC> with ONE hero object that does the explaining (binary search used a school
   scale that snaps in half on every answer). Pick an object only this topic could own: everyday, Indian, physical.
   3-5 short lines, one action per line, one worked example with exact numbers (computed, not guessed).
   End: Bro "Bas? Itna simple?" -> Bhai "Simple hai. Asli game hai pehchaanna. Main interviewer, tu bata."
   (Bhai puts on an interviewer tie.)
3. QUIZ (~30 s, the core). Bhai plays the interviewer and asks 4-5 REAL interview question types for <TOPIC>,
   in English, phrased the way they appear in real problem statements. For each:
   - a question card slides in; the giveaway words get a yellow highlighter exactly when they are spoken;
   - a small live diagram on the card shows WHY it is <TOPIC>;
   - Bro answers in Hinglish and names the clue; a green "<TOPIC> ✓" stamp and an "ishaara: <CLUE>" chip land
     on his keyword.
   Order them easy to tricky, and include one twist where the structure is hidden (like sqrt(x) with no array).
4. RULE (<= 6 s). Bhai: "Bas teen ishaare: <clue 1>, <clue 2>, <clue 3>." Three numbered cards land as they are
   spoken. Bro: "Ab kal toh phod dunga!" (confetti).
5. CTA (<= 4 s). Bro: "Aise 10 interview favourite sawaal chahiye? Comment karo <KEYWORD>."
   A comment box types the keyword. End hold 0.6-1.4 s.

WRITING RULES
- Hinglish, ping-pong, at most 2 lines in a row per host, 5-12 words per line, about 170-200 spoken words in total.
- No filler, no slogans, no "did you know" lists. One story, one concept, then recognition.
- Bro talks like a real nervous candidate; Bhai talks like a calm senior. Interviewer questions are in English.
- Every number is computed in Python or sourced. Write docs/factcheck.md BEFORE any voice.
- LeetCode numbers and titles are verbatim. Never claim "most asked" (no public data); say "interview favourite".

VOICE
- Bro = Liam (TX3LPaxmHKxFdv7VOQHJ). Bhai = Amogh M (FuNEroZdMQWScvkSu4Xt). Both on eleven_turbo_v2_5, hi,
  speed 1.2, seed 5. One take per speaker via vo_duo.py, with pauses tightened.
- tts = Devanagari Hindi with English words in English. Bro says numbers in English, Bhai in Hindi.
- STT every line with Scribe, plus faster-whisper on any doubtful word. Fix a misheard word by re-spelling or
  rewording it (e.g. Build -> बिल्ड; drop LeetCode from Bhai's lines). Never ship a misheard line.
  Use the per-line "trim" for a stray syllable.

PICTURE
- Remotion + SVG, 1080x1920, 60 fps.
- Reuse from dsa-binary-search:
  - src/chars (Character with tie, Hosts);
  - the Bubble captions (Roman Hinglish, the spoken word highlighted, tail pointing at the speaker);
  - the ScaleBar-style hero object pattern;
  - the v2 Quiz card.
- Every visual beat is tied to a WORD through the timing script's ev table; picture and SFX read the same beats.
- One hero per frame. No HUD or counters. No flat run longer than 3 frames. No static hold over 1.5 s without
  a living thing.
- Numbers never hang off the edge.

SOUND
- Original lo-fi bed plus synth SFX (the mix_v2.py pattern): crack, stamp, bell and highlighter per beat.
- A dead stop before the quiz's first hit; ducked under the voices; -14 LUFS.

QA AND DELIVERY
- Look-dev stills, fix them, then the 540x960 preview with sound. Build straight through to the preview
  without stopping.
- Run analysis/reel_qa.py, motionmaxxing look.py (G0/G2/G3), measure.py strobe, and Scribe on the final mix.
  Fix the three worst issues before showing me.
- Post kit:
  - post/caption.txt: Hinglish, with the quiz question types as a list;
  - post/dm_<keyword>.txt: 2 DMs under 1000 characters each, with 10 problems grouped by clue plus a template.
    Test any code in the DM.
- Report: the preview path, the full dialogue, the QA numbers and anything you could not verify.
- Do NOT run the full 1080x1920 render until I say "render".
```
