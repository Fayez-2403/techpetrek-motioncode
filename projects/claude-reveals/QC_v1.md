# QC report: "WHATTT?! 5 Claude project reveals"

Checked 2026-10-21 on `output/reveals_animatic_30fps.mp4` (same scene code and mix as the master). The 60 fps master is
pending approval. After it renders, rerun `python analysis/reveals_qa.py output/reveals_master.mp4` and
`python analysis/reel_qa.py output/reveals_master.mp4 --variant reveals --max-dur 94 --allow-silence 3.5-4.0`.

## Automated
- `analysis/reveals_qa.py`: **42/44.** The 2 fails are the 60 fps and 5640-frame checks, which only the 60 fps master can pass.
  It passes every source video used, each excerpt at 1.0x and covering its time on screen, the model labels (no model on
  AngioView), all six creators credited, the safety labels, no "community", Mixkit Free licence only, no voice overlaps,
  cuts on beats and events on the grid.
- `analysis/reel_qa.py`: **8/9.** The one fail was the intentional darkness at 59.0 s (a flat frame). That's fixed in code since
  this animatic: a faint electric haze and a spark, measured colour spread 13 (the threshold is 4). The master will carry it.
  1080x1920, H.264 yuv420p, AAC, 94.0 s, -14.1 LUFS, no unplanned silences (only the brief's hush at 3.5-4.0 s), 71 events on
  the 0.25 s grid, captions time-ordered.
- Speech-to-text (ElevenLabs scribe_v1) on the full mix heard the whole script, including the reactions ("What?" x3, "Wait ye
  playable hai", "No way"). Saved in `stt_mix.txt`. It wrote "एक 120" once, where the voice-only pass of the same audio heard "120".
- Contact sheet sampled from the rendered animatic: every clip advances (no stale frames), every chapter is in place.

## The brief's rules
| Rule | Result |
|---|---|
| Every source video included | PASS: A-F, plus all six in the 0-17 s collage |
| Original footage intact, 1.0x, no reverse or slow motion | PASS: frame sequences at their own rate, fitted whole. The only hold is AngioView's last frame during its 0.45 s collapse (the whole clip has played) |
| No AI lookalikes, no fabricated footage | PASS: only the creators' originals and X's own embed screenshots |
| Nothing large over the clips | PASS: type, chips and credits sit outside the frames; transitions only before or after a clip |
| Horizontal clips fitted, not cropped | PASS: full width in a fitted frame (the square haiku fitted square) |
| Accurate model labels | PASS: Opus 5.5 (01, 03, 04), Sonnet 5.5 (02), Haiku 5.5 (03B), none on 05 |
| Creator attribution | PASS: "ORIGINAL VIDEO BY Name · @handle" under every clip, plus the caption |
| Authorized sources / reuse permission | **OPEN: not yet requested from the five creators** (DM drafts in ASSETS-RIGHTS.md). Don't post before they say yes |
| Labels | PASS: "PROTOTYPE · not a verified emergency-response system", "EDUCATIONAL TOOL · not a clinically validated diagnostic system", "Projects featured by @claudeai. Original creators credited.", "Actor: stock footage (Mixkit)" |
| 94 s, 9:16, 1080x1920 | PASS (60 fps: master pending) |
| -14 LUFS, ducking under voice | PASS: -14.1 LUFS, true peak -1.4 dBTP, about 8 dB of ducking |

## Where it departs from the brief (and why)
- **Engine:** pdoom, not Remotion. The repo's rule (every reel in its own engine), and nothing was installed.
- **Actor:** real stock footage (Mixkit Free License), not a performer shot to the script, because the user asked for free tools.
  So there's no real chair leap (his arms-out celebration becomes a comic freeze-frame that launches), no glasses adjustment,
  no headphones flying off, and his lips don't form "WHAT" (the shout is Liam, cut on the expression).
- **Wording:** "community" removed (not in the thread). "Six real builds" instead.
- **Narration:** Hinglish (the user's choice), Turbo v2.5 for the narrator. The actor's lines use eleven_v3 tags.
- **Shortcuts:** the finger approaching the screen (Reveal 04) is left out. The "3D heart" is a glowing 2D heart over the ECG
  line. About 70 swirling pages stand in for "hundreds".
- **Excerpt windows:** Reveal 01 is 11.5 s (the brief allows about 13 s), and Reveal 05 plays the whole 12.45 s clip.

## Before posting
1. Permission from @DilumSanjaya, @kevin_t_ngo, @harshpreet931, @thebuggeddev and @AnnasRahmanMD. Ask Harshpreet for the original
   file (X only has 720p at 0.3 Mbps).
2. Read Mixkit's User Terms once (the page blocks headless browsers).
3. Render the 60 fps master, then rerun both QA scripts.
