# QC report: "WHATTT?! 5 Claude project reveals", v3

Checked 2026-10-21 on `output/reveals_animatic_30fps.mp4` (v3, 73.5 s; same scene code and mix as the master). Earlier reports:
`QC_v2.md` (76 s, two WHATs), `QC_v1.md` (94 s). The 60 fps master is pending approval. After it renders, rerun `python analysis/reveals_qa.py output/reveals_master.mp4`
and `python analysis/reel_qa.py output/reveals_master.mp4 --variant reveals --max-dur 73.5`.

## The user's v3 asks (2026-10-21)
| Ask | Result |
|---|---|
| Remove the freeze-frame jump (arms out, curved text, confetti) | DONE: cut, and its code removed |
| Remove the 2nd WHAT | DONE: one "WHAT?!" (0 s, from the first frame) over his monitor; the post comes up on it and we dive in. The hook is 1.5 s and everything after is 2.5 s earlier. The ending's callback is that one WHAT |

## The user's v2 asks (2026-10-21)
| Ask | Result |
|---|---|
| Keep only two "WHAT"s | DONE in v2. v3 goes further: one WHAT |
| Background music lower, narration clear | DONE: music 0.26 (v1 0.62), ducking about 15 dB under the voice (v1 8 dB), foley lower. Measured: the voice sits about 11.7 dB over everything else while it speaks. Speech-to-text on the full mix heard every line |
| Smooth transitions: as one reveal finishes, go straight to the next | DONE: the post and the five reveals are one strip of panels, each slide (0.5 s, edge to edge) starting as a line ends: 11.5, 23.0, 30.5, 38.5, 44.0, 54.0 s |
| No extra frames before 04 and 05 | DONE: the paper rip, darkness, field-line intro, heartbeat intro and "05" impact are gone. 04 and 05 slide in with their clips playing |
| No numbered insert frames | DONE: no "01" launch, ember, chessboard or stamp-first moments. Each number sits in its reveal's own header, arriving with the clip |
| Remove "ye playable" | DONE: the line and the actor's peek-in are cut |
| Keep the scroll un-blurry | DONE: no motion ghosts; the card lies flat and sharp once settled, and moves one post at a time (0.45 s glide, then a hold), each reply shown once from its own avatar down |

## Automated
- `analysis/reveals_qa.py`: **48/50.** The 2 fails are the 60 fps and 4410-frame checks, which only the 60 fps master can pass.
  It passes every source video used, at 1.0x, covering its time on screen, the model labels (no model on AngioView), all six
  creators credited, the labels, no "community", Mixkit Free licence only, no voice overlaps, one WHAT only, no freeze-frame jump,
  no "playable", no scroll ghosts, no intro or insert sequences, every slide on a line's end, cuts on beats and events on the grid.
- `analysis/reel_qa.py --max-dur 73.5`: **9/9.** 1080x1920, H.264 yuv420p, AAC, 73.5 s, no silences, -14.1 LUFS, no flat
  frames, 53 events on the 0.25 s grid, captions time-ordered.
- Speech-to-text (scribe_v1) on the full v3 mix: one "What?", then the whole script as written, "No way", the closing question.
- Contact sheet from the rendered animatic: the single-WHAT hook and the dive, every slide clean, every clip advancing.

## The brief's rules (unchanged from v1)
Every source video included, the creators' originals only, 1.0x, fitted whole, nothing over the clips, the right model labels,
every creator credited, the labels as in FACTS.md. AngioView's last frame holds for its 0.5 s collapse into the cards, after the
whole clip has played. **Still open: permission from the five creators** (DM drafts in ASSETS-RIGHTS.md).

## Before posting
1. Permission from @DilumSanjaya, @kevin_t_ngo, @harshpreet931, @thebuggeddev and @AnnasRahmanMD (and Harshpreet's original file).
2. Read Mixkit's User Terms once.
3. Render the 60 fps master, then rerun both QA scripts.
