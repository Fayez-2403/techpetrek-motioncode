# Bro & Bhai explainer series: context file (DSA, system design, more)

Read this file instead of the old chats. It has everything needed to make the next episode.

## 0. How to start the next episode (paste this)

```
Continue the Bro & Bhai explainer series. Read docs/series/BRO_BHAI_EXPLAINER_SERIES.md first and follow it.
Next episode: TOPIC = <Two Pointers>, KEYWORD = <POINTER>, SLUG = <dsa-two-pointers>.
Build straight to the 540x960 preview. Don't full render until I say "render".
```

The full spec of the format is `docs/prompts/BRO_BHAI_CONCEPT_REEL.md`. Section 3 below is the short version.

## 1. Episode log

| # | Episode | Folder | Preview (out/) | CTA keyword | Post kit | Status |
|---|---|---|---|---|---|---|
| 1 | Binary Search v1 (zero to hero, 95 s) | projects/dsa-binary-search | dsa-binary-search_v1_preview_540x960_60fps.mp4 | BINARY | post/caption.txt, dm_binary.txt | kept as a preview only |
| 1b | **Binary Search v2 "Pehchaan" (66 s)** | same (`src/v2/`, composition ReelV2) | dsa-binary-search_v2_preview_540x960_60fps.mp4 | BINARY | post/caption_v2.txt, dm_binary_v2.txt | ✅ **APPROVED** ("this one is goood"); this is THE format |
| – | Did you know #01 (4 trivia facts) | projects/did-you-know-01 | did-you-know-01_v1_preview… | DYK | post/… | ❌ rejected as "bogus": a fact list with no story. Never again |
| 2 | Sliding Window "Pehchaan" (75 s) | projects/dsa-sliding-window (`src/sw/`) | dsa-sliding-window_v1_preview_540x960_60fps.mp4 | WINDOW | post/caption.txt, dm_window.txt | ✅ preview done, the newest kit |

Rendering: `node scripts/render.mjs --scale 0.5` gives the preview (v2 of binary search adds `--ver v2`). Run the full render only when the user says "render".

## 2. The kit: copy it from the NEWEST episode (projects/dsa-sliding-window)

1. `python .claude/skills/motion-studio/scripts/new_reel.py <slug> --title "<Topic>: Pehchaan"`
2. Copy these into the new folder:
   - **Reuse as they are:**
     - `src/chars/Character.tsx` (Bro & Bhai SVG busts: moods, blink, lip flap, `tie` prop)
     - `src/themes/tokens.ts`, `src/animation/anim.ts`, `src/tl.ts`
     - `src/sw/Bubble.tsx`: speech-bubble captions. Change the hidden-line ids to the 4 English question lines.
     - `src/sw/Problem.tsx` (the PG desk + HR notification)
     - `src/sw/ScaleBar.tsx` (has `land()`)
     - `src/sw/Khidki.tsx` (`Tiles` + a hero-object example)
     - `scripts/audio/vo.py` and `scripts/audio/vo_duo.py` (2 voices, pause tightening, per-line `trim`)
     - `scripts/render.mjs` (patched for the dialogue timeline, `--ver`)
   - **Adapt per episode:**
     - `src/sw/Hosts.tsx` (the mood rules use event names)
     - `src/sw/Simple.tsx` (the hero-object explanation: rewrite it)
     - `src/sw/Quiz.tsx` (question cards: rewrite the data + `Ill` mini demos)
     - `src/sw/Rule.tsx` (3 clues + the CTA with platform chips)
     - `src/sw/Reel.tsx` (scene groups)
     - `scripts/audio/timing_sw.py` (rewrite only the `ev = {…}` table)
     - `scripts/audio/mix_sw.py` (rewrite only the SFX schedule + stops)
3. Delete the template placeholders: `src/scenes/index.tsx`, `src/components/Captions.tsx`, `Transition.tsx` (move them to out/template_unused).
4. Point `src/compositions/Reel.tsx` at the new reel: `export { Reel, TOTAL } from '../sw/Reel';`.
5. Link node_modules: `powershell -NoProfile -Command "New-Item -ItemType Junction -Path node_modules -Target ..\gta6-clipper\node_modules"`.

## 3. The format (5 parts, about 60-75 s)

1. **PROBLEM (≤7 s):**
   - Bro: "Arre yaar, kal interview hai… aur <topic> ka sawaal pehchaan hi nahi paata."
   - Bhai: "Tension mat le. Pehle 20 second mein <topic> samajh."
   - Frame 0 is the HR notification on Bro's desk.
2. **SIMPLE (≤20 s):**
   - One Indian, physical hero object that does the explaining: binary search = a school scale that snaps; sliding window = a Mumbai local train window over cricket overs.
   - One worked example with exact computed numbers.
   - Ends with Bro "Bas? Itna simple?", then Bhai "Asli game hai pehchaanna. Main interviewer, tu bata." (tie on).
3. **QUIZ (~30 s):**
   - 4-5 real interview question types, in English, worded like the real problem statements.
   - Each card: the giveaway words get a yellow highlighter as they are spoken, a live mini demo, then Bro's Hinglish answer and a "<TOPIC> ✓" stamp with an "ishaara: <CLUE>" chip.
   - Include one twist where the structure is hidden.
4. **RULE (≤7 s):** "Teen ishaare: …", three cards, then Bro "Ab kal toh phod dunga!" with confetti.
5. **CTA (≤5 s):**
   - "<Topic> ke 10 sawaal, saare platforms se chahiye? Comment karo <KEYWORD>."
   - Platform chips on screen (text only, no logos).
   - The comment box types the keyword.

**Writing:**
- Hinglish, ping-pong, at most 2 lines in a row per host, 5-12 words per line, about 170-200 words.
- Bro = a nervous candidate; Bhai = a calm senior.
- Say "interview favourite", never "most asked".

## 4. Build order (exact steps)

1. **Fact check first:**
   - Compute every number in Python and save it to `src/config/demo.json`.
   - Verify every problem title by opening the real page with Playwright (`scripts/grab_problems.mjs` pattern → `docs/problems.json`).
   - Write `docs/factcheck.md`. A page behind a bot check (e.g. LeetCode 76) stays OUT of the DM.
2. **Script:** `src/config/voScript.json` (the `cap` Roman + `tts` Devanagari/English phrase counts must match).
3. **Voice:**
   - `PYTHONIOENCODING=utf-8 python scripts/audio/vo_duo.py --stt` checks every line with Scribe.
   - After ANY text change, re-STT ALL lines, because the whole speaker take is re-made.
4. **Timeline:** `python scripts/audio/timing_sw.py` writes SCENE_TIMINGS.json (the `ev` beats tied to words), `public/audio/vo.wav` and `src/config/mouth.json`.
5. **Build the scenes**, then `npx tsc --noEmit`.
6. **Look-dev stills:**
   - `npx remotion bundle src/index.ts --out-dir=out/bundle`
   - `node scripts/stills.mjs out/bundle out/wip/v1 <frames>`
   - Make a PIL contact sheet and LOOK at it. Fix overlaps, text overflow, numbers off the edges, and static holds over 1.5 s.
7. **Mix:** `python scripts/audio/mix_sw.py` (−14 LUFS; sets audioManifest "reel").
8. **Preview:** `node scripts/render.mjs --scale 0.5` (about 5-6 min, run it in the background). To fix one part, delete only those chunk files in out/segments and re-run (about 0.6 min).
9. **QA:**
   - `python analysis/reel_qa.py <mp4>` (the size + >60 s fails are expected on a preview)
   - `python .claude/skills/motionmaxxing/scripts/look.py <mp4> --out out/look --expect <s> --expect-audio` (G0/G2/G3)
   - `python .claude/skills/motion-studio/scripts/measure.py strobe <mp4>`
   - Scribe on the final mix
10. **Post kit:**
    - `post/caption.txt`
    - `post/dm_<keyword>.txt`: 2 DMs, each under 1000 characters; 10 problems grouped by clue across LeetCode/GFG/Codeforces + a tested template
11. **Memory:** add the episode to the table in §1 of this file.

## 5. Voices + pronunciation rules (learned)

- **Voices:**
  - Bro = Liam `TX3LPaxmHKxFdv7VOQHJ`; Bhai = Amogh M `FuNEroZdMQWScvkSu4Xt`.
  - Both on eleven_turbo_v2_5, hi, speed 1.2, seed 5; Bhai stability 0.45.
  - The ElevenLabs key is read from HKCU; never print it.
- **Numbers:** Bro says them in English ("fifty", "ten"), Bhai in Hindi (एक हज़ार, तेईस).
- **Words that come out wrong, and what to say instead:**
  - "LeetCode" → "Lead code" (both voices): don't speak it; show it on screen.
  - "Build" (Bhai) → "bill": write बिल्ड.
  - "size k" → "size के": say "size fixed" / "fixed size".
  - "sum hi" (Liam) → "samajh hi": rephrase.
  - "ten sliding" → "then": put "ten" before सवाल.
  - "twenty thirty eight" (Liam) → "solace": "two thousand thirty eight".
  - "रोज़" → "rows" (Liam): say "daily".
- **Stray syllable at the end of a line:** set `"trim": <seconds>` on that line (find the cut from the energy dip).
- **Second opinion:** faster-whisper (feed a numpy array; `av.open` fails here); Scribe stays the main check.

## 6. Visual rules

- **Layout (1080×1920, 60 fps):**
  - safe top 250, hero zone 250-1110, caption bubble 1128-1310, hosts from y about 1290 down;
  - Bro bottom-left, Bhai bottom-right.
- **Colours:**
  - one world: night-indigo PG room, warm lamp;
  - yellow = the search space / highlighter, green = HAAN / ok, red = NA / dead, gold = the answer.
- **Motion and text:**
  - every beat is tied to a WORD through the `ev` table;
  - things land from oversize (`land()`), and pieces fall and fade within about 0.85 s;
  - no HUD, no counters as chrome, no logos, no flat run over 3 frames, no static hold over 1.5 s;
  - text must wrap; adjacent spans need `display: inline-block` or spaces.
- **Fonts:** Devanagari renders with the system font Nirmala UI; the 🌌 emoji renders as tiles, so draw an SVG instead.

## 7. Sound kit (mix_v2 / mix_sw)

- **Bed:** an original lo-fi bed at 92 BPM (Dm9-Bbmaj7-Gm7-A7sus4).
- **Effects:** crack (snap), stamp, bell (the answer), marker (highlighter), whoosh, flip (card), pop, boing, shimmer, horn + clack (train).
- **Rules:** a dead stop before the quiz's first hit; music ducked under the voice; −14 LUFS two-pass loudnorm.

## 8. Gotchas (Windows)

- **Python:**
  - use `PYTHONIOENCODING=utf-8`, but `python -I` ignores it: use `sys.stdout.reconfigure(encoding='utf-8')`;
  - negative Unix timestamps fail; use `datetime(1970,1,1) + timedelta`.
- **Stills:** a frame past the composition length errors (frames = total − 1).
- **render.mjs:** chunks by frames for dialogue timelines; `--ver v2` renders `ReelV2` with audioManifest `reel_v2`.
- **Disk:** check free space on C: before long renders.

## 9. Next episodes (ideas, each with a hero object and its clues)

**DSA:**

| Topic | Hero object (Indian, physical) | Clues (ishaare) | Real question types |
|---|---|---|---|
| Two Pointers | two auto-rickshaws from both ends of a lane | sorted + pair/triplet, "in-place", palindrome | Two Sum II (167), 3Sum (15), Container With Most Water (11), Valid Palindrome (125) |
| Prefix Sum | a kirana khata (running ledger) | "sum of range", many queries, subarray sum = k | Range Sum Query (303), Subarray Sum Equals K (560) |
| Recursion / Backtracking | Russian-doll matka stack / dabba tiffin layers | "all combinations / subsets / permutations", n ≤ 20 | Subsets (78), Permutations (46), N-Queens (51) |
| BFS / DFS | Mumbai local route map | grid, islands, shortest steps, connected | Number of Islands (200), Rotting Oranges (994) |
| Dynamic Programming | stairs of a chawl (memo chalk marks) | "kitne tareeke", min/max cost, overlapping choices | Climbing Stairs (70), Coin Change (322), House Robber (198) |
| Heap / Top-K | IPL points table | "k largest / k-th", stream | Kth Largest (215), Top K Frequent (347) |
| Monotonic Stack | stacked chai glasses | "next greater / smaller", span | Daily Temperatures (739), Next Greater Element (496) |

**System design:** adapt the quiz so "interviewer says X → which component". For example:
- "read-heavy, same data again and again" → CACHE
- "traffic 10x" → LOAD BALANCER
- "abuse / too many requests" → RATE LIMITER

| Topic | Hero object | Clues |
|---|---|---|
| Caching | a chai tapri that keeps hot chai ready | read-heavy, repeat reads, latency |
| Load balancer | the railway ticket-counter queue manager | traffic spike, many servers, uptime |
| Rate limiter | a society watchman with a register | "too many requests", abuse, fairness |
| Sharding / partitioning | the post office pin-code sorting | data too big for one DB, hot keys |
| Message queue | the dabbawala relay | async, spikes, retry |

Verify all facts and problem titles per §4. System design has no single "correct answer" source, so cite official docs (e.g. the AWS/Redis docs pages) in the factcheck.

## 10. Never

- Trivia lists ("did you know"): the user rejected them.
- "Most asked" claims.
- Brand logos.
- Commercial songs.
- Printing keys.
- A full render before "render".
- Overwriting old previews: keep `_v1a` copies before re-rendering.
