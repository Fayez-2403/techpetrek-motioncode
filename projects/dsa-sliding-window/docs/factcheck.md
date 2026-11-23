# Fact check (before any VO): Sliding Window, Pehchaan

The numbers are computed in `src/config/demo.json` (Python, 2026-11-23). The problem pages were opened in a real browser by
`scripts/grab_problems.mjs`; their page titles and statement text are saved in `docs/problems.json`, and the LeetCode
screenshots are in `public/receipts/`.

| # | Claim | Proof | Status |
|---|---|---|---|
| S1 | Overs 4, 9, 2, 7, 12, 3, 8, 6; best 3 consecutive overs: sums 15, 18, 21, 22, 23, 17 → best 23 (overs 5–7) | demo.json overs (each step = +new −old: +7−4, +12−9, +3−2, +8−7, +6−12) | ✅ computed |
| S2 | Each slide is one plus and one minus; it never re-adds the whole window | same | ✅ |
| S3 | Q1 wording "Return the maximum sum of a subarray of size k." | GFG "Max Sum Subarray of Size K" statement (problems.json gfg_maxsumk) | ✅ verbatim |
| S4 | Q1 mini demo [2, 1, 5, 1, 3, 2], k = 3 → 8, 7, 9, 6 → 9 | demo.json q1 | ✅ computed |
| S5 | Q2 "longest substring without duplicate characters", "abcabcbb" → 3 ("abc") | LeetCode 3 statement + Example 1 (problems.json lc3) | ✅ |
| S6 | Q3 minimal-length subarray with sum ≥ target: target 7, [2, 3, 1, 2, 4, 3] → 2 ([4, 3]) | LeetCode 209 Example 1 | ✅ |
| S7 | Q4 anagrams of "abc" in "cbaebabacd" start at 0 and 6 | LeetCode 438 Example 1 | ✅ |
| S8 | "contiguous" is the word problem statements use for subarrays | LeetCode 643 ("Find a contiguous subarray whose length is equal to k"), GFG ("A subarray is a contiguous part of any given array") | ✅ |
| S9 | On-screen chip: n = 1,00,000, k = 1,000 → brute force 9,90,01,000 additions vs sliding 1,98,999 | demo.json work: (n−k+1)·k vs (k−1) + 2(n−k) | ✅ computed |
| S10 | DM list: 10 problems across LeetCode, GeeksforGeeks and Codeforces (post/dm_window.txt) | all opened in a browser: LC 643, 3, 209, 438, 1004, 239; GFG "Max Sum Subarray of Size K", "First Negative in Windows of Size K", "Count Occurences of Anagrams" (GFG's spelling); Codeforces 279B "Books", 1354B "Ternary String" (both tagged two pointers) | ✅ LC 76 left out (the page was behind a bot check, so not verified) |

**Wording:** we say "interview favourite", never "most asked" (no public frequency data). Bro, Bhai and the PG room are fictional.
