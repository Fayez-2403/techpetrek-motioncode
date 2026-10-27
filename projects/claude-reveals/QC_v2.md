# QC report: "WHATTT?! 5 Claude project reveals", v2

Checked 2026-10-21 on `output/reveals_animatic_30fps.mp4` (v2, 76 s; same scene code and mix as the master). v1's report:
`QC_v1.md`. The 60 fps master is pending approval. After it renders, rerun `python analysis/reveals_qa.py output/reveals_master.mp4`
and `python analysis/reel_qa.py output/reveals_master.mp4 --variant reveals --max-dur 76`.

## The user's v2 asks (2026-10-21)
| Ask | Result |
|---|---|
| Keep only two "WHAT"s | DONE: "WHAT?!" (0 s, on screen from the first frame) and "WHAAAAAATTTTT?!" (1.25 s). The hook is 4 s, not 7 |
| Background music lower, narration clear | DONE: music 0.26 (v1 0.62), ducking about 15 dB under the voice (v1 8 dB), foley lower. Measured: the voice sits about 11.7 dB over everything else while it speaks. Speech-to-text on the full mix heard every line |
| Smooth transitions: as one reveal finishes, go straight to the next | DONE: the post and the five reveals are one strip of panels, each slide (0.5 s, edge to edge) starting as a line ends: 14.0, 25.5, 33.0, 41.0, 46.5, 56.5 s |
| No extra frames before 04 and 05 | DONE: the paper rip, darkness, field-line intro, heartbeat intro and "05" impact are gone. 04 and 05 slide in with their clips playing |
| No numbered insert frames | DONE: no "01" launch, ember, chessboard or stamp-first moments. Each number sits in its reveal's own header, arriving with the clip |
| Remove "ye playable" | DONE: the line and the actor's peek-in are cut |
| Keep the scroll un-blurry | DONE: no motion ghosts; the card lies flat and sharp once settled, and moves one post at a time (0.45 s glide, then a hold), each reply shown once from its own avatar down |

## Automated
- `analysis/reveals_qa.py`: **47/49.** The 2 fails are the 60 fps and 4560-frame checks, which only the 60 fps master can pass.
  It passes every source video used, at 1.0x, covering its time on screen, the model labels (no model on AngioView), all six
  creators credited, the labels, no "community", Mixkit Free licence only, no voice overlaps, two WHATs only, no "playable", no
  scroll ghosts, no intro or insert sequences, every slide on a line's end, cuts on beats and events on the grid.
- `analysis/reel_qa.py --max-dur 76`: **9/9.** 1080x1920, H.264 yuv420p, AAC, 76.0 s, no silences, -14.0 LUFS, no flat frames,
  58 events on the 0.25 s grid, captions time-ordered.
- Speech-to-text (scribe_v1) on the full v2 mix: the whole script as written (`stt_mix.txt`). "What?" twice, the reveals,
  "No way", the closing question.
- Contact sheet from the rendered animatic and stills at 9.4, 10.0 and 10.6 s: every clip advances, every slide is clean, and
  each reply in the scroll is sharp.

## The brief's rules (unchanged from v1)
Every source video included, the creators' originals only, 1.0x, fitted whole, nothing over the clips, the right model labels,
every creator credited, the labels as in FACTS.md. AngioView's last frame holds for its 0.5 s collapse into the cards, after the
whole clip has played. **Still open: permission from the five creators** (DM drafts in ASSETS-RIGHTS.md).

## Known since the animatic
- The closing smile shot now starts 0.6 s earlier in its clip, so it plays to the end instead of holding its last 0.6 s. That's in
  the code; this animatic predates it, and the master will have it.

## Before posting
1. Permission from @DilumSanjaya, @kevin_t_ngo, @harshpreet931, @thebuggeddev and @AnnasRahmanMD (and Harshpreet's original file).
2. Read Mixkit's User Terms once.
3. Render the 60 fps master, then rerun both QA scripts.
