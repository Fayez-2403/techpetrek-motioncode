# Fact check (before any VO)

Every number on screen or in the voice, with its source. Math items were computed with Python on 2026-11-22
(`ceil(log2(n+1))` for worst-case binary-search steps).

| # | Claim | Source | Status |
|---|---|---|---|
| F1 | 140 crore sorted names → at most 31 looks | log2(1.40e9) = 30.4 → 31 (2^31 = 2,14,74,83,648 ≥ 140 crore). Also holds for 146 crore. A thought experiment; we do NOT claim any government database works this way | ✅ math |
| F2 | 1–100 guessing game: target 71 found in 5 guesses: 50, 75, 62, 68, 71 | mid = (low+high)//2, computed | ✅ math |
| F3 | 1–100: never more than 7 guesses | ceil(log2(101)) = 7 | ✅ math |
| F4 | Linear guessing can take up to 100 guesses | worst case of 1, 2, 3 … | ✅ math |
| F5 | Binary search needs sorted (monotonic) data | standard definition | ✅ |
| F6 | `(low + high) / 2` can overflow on large values; `low + (high - low) / 2` is the fix | Joshua Bloch, "Extra, Extra - Read All About It: Nearly All Binary Searches and Mergesorts are Broken", Google Research blog, 2 Jun 2006: https://research.google/blog/extra-extra-read-all-about-it-nearly-all-binary-searches-and-mergesorts-are-broken/ | ✅ The often-quoted "bug sat in Java for 9 years" is **not used** (not confirmed by a primary source) |
| F7 | 1000 commits → `git bisect` finds the bad one in about 10 builds | ceil(log2(1000)) = 10; `git bisect` is a real git command (git-scm.com/docs/git-bisect) | ✅ |
| F8 | Exam puzzle: chapters 30, 11, 23, 4, 20 pages, 6 days, one chapter per day at most → minimum 23 pages/day | This is LeetCode 875 "Koko Eating Bananas", example piles = [30,11,23,4,20], h = 6 → 23. Recomputed: 23 → 2+1+1+1+1 = 6 days ✅, 22 → 7 days ❌ | ✅ |
| F9 | 10 pages/day → 11 days | 3+2+3+1+2 = 11 | ✅ math |
| F10 | The border search checks 15 ✗(8 days), 23 ✓(6), 19 ✗(8), 21 ✗(7), 22 ✗(7) → 23: 5 checks instead of 30 | lo=1, hi=30, `if ok(mid): hi=mid else lo=mid+1`, computed | ✅ math |
| F11 | Same pattern: LeetCode 1011 "Capacity To Ship Packages Within D Days", 410 "Split Array Largest Sum" | LeetCode problem titles | ✅ |
| F12 | DM list (post/dm_binary.txt): 1283, 875, 1011, 1482, 2187, 1870, 2226, 1552, 2064, 410 as "binary search on the answer" practice | LeetCode titles; grouped as binary-search-on-answer in LeetCode discuss study guides (e.g. leetcode.com/discuss/study-guide/3266833) | ✅ titles; difficulty order is our judgement |
| F13 | DM template (lo/hi/ok, `mid = lo + (hi - lo) / 2`) | run on the reel's puzzle: checks 15, 23, 19, 21, 22 -> 23, identical to the animation | ✅ computed |
| F14 | Overflow numbers on screen: 1,500,000,000 + 2,000,000,000 = -794,967,296 in 32-bit int; INT_MAX 2,147,483,647; high - low = 500,000,000 | computed (3.5e9 - 2^32) | ✅ math |

## v2 (Pehchaan cut) additions
| # | Claim | Source | Status |
|---|---|---|---|
| V1 | 1-1000, target 737: 10 steps (500, 750, 625, 687, 718, 734, 742, 738, 736, 737); first step throws the left half, second the right | computed, mid = (lo+hi)//2 | ✅ math |
| V2 | 1000 numbers need at most 10 steps | ceil(log2(1001)) = 10 | ✅ math |
| V3 | Rotated sorted array: one half around mid is always sorted (LeetCode 33) | standard property of the rotated-array search | ✅ |
| V4 | sqrt(50): answer in 1..10, 7² = 49 ≤ 50 < 64 = 8² → 7 (LeetCode 69 style) | computed | ✅ math |
| V5 | Minimum speed in 6 days → NA..NA HAAN..HAAN border (the 875 example numbers) | as F8 | ✅ |
| V6 | "O(log n)" is written in the problem statements of LeetCode 704, 35, 34, 33, 153, 162 | the statements say "You must write an algorithm with O(log n) runtime complexity" (or "...runs in O(log n) time") | ✅ |
| V7 | DM list v2 (post/dm_binary_v2.txt): 704, 35, 34, 74, 33, 153, 162, 69, 875, 1011 | LeetCode titles. "Interview favourite" is our wording: we do NOT claim a measured "most asked" ranking, because no public frequency data exists | ✅ titles |

**Our illustration:** Bro, Bhai, the interviewer, the PG room and the office are fictional, drawn in code. No real company,
logo or person appears. The LeetCode problem names are cited as text only (no LeetCode logo or UI).

**References studied (not copied):**
- @techtapri.ai reel Df6NVkRgC4X (2026-11-19): two-character Hinglish DSA story format, ~2.8 words/s, elimination visual.
- @jesserurka reel De5dsuzDx6X (2026-10-25) and his MIT skill github.com/jdrurka/explainer-skill (commit 56f95a6):
  script shape (problem in the viewer's words → why it matters → answer in one plain sentence → 2-3 concrete steps →
  takeaway + CTA), one picture per line, one comparison, word captions, stills check before render.
