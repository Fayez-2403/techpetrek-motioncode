# QC: The Editor's Aura (2026-10-22)

Checked on `output/aura_animatic_30fps.mp4`. It is 90.000 s, 2,700 frames, 1080x1920, H.264 yuv420p + AAC, and uses the same scene
code and mix as the master will.

## `python analysis/reel_qa.py output/aura_animatic_30fps.mp4 --max-dur 90 --frames 2700 --allow-silence 89.68-90.0`
| Check | Result |
|---|---|
| 1080 x 1920 (9:16) | PASS |
| H.264, yuv420p | PASS |
| AAC audio | PASS |
| Duration ≤ 90 s; 2,700 frames at 30 fps | PASS (90.000 s) |
| No unplanned silences (the cut to black at 89.68 s is planned) | PASS |
| Loudness −14 LUFS ±1 | PASS (−14.0 LUFS; true peak −1.7 dBTP, `aura_mix.py`) |
| No flat or error frames (2 a second) | **2 flagged, both planned**:<br>• 65.75 s, the 0.12 s eruption blast flash on `r5.erupt` (a warm near-white frame)<br>• 89.75 s, the cut to black on the bass dropout<br>The test exists to catch an engine error (a solid red frame); neither of these is one |

The raw result is in `output/aura_animatic_30fps_qa.json`.

## Sync
- **The intro (0-10.105 s, Dhurandhar).** Each event is on a measured word or hit (`data/aura/intro.json`):
  - The words "Ladies" (0.36 s) to "this." (4.02 s) are found with local speech-to-text.
  - The cuts land on the five hits at 4.14, 4.71, 7.04, 7.99 and 9.48 s.
- **The handover.** Dubplate's bass slams in on its own measured phrase line at 10.105 s, the frame the IDE opens.
- **From 10.105 s.** 70 events, 11 montage intercuts and 6 flashes are all on Dubplate's eighth grid. `aura_cues.py` reports **0 off the grid**.

## Stills reviewed
- Every world was checked from its stills, and the issues found were fixed:
  - R01: the overlap.
  - R02: the blank reveal, the slow chart, the flat wipe and the overlaps.
  - R03: the grade.
  - R04: the black chrome, the dark glass and the macro aim.
  - R05: the washed grade, the crack pattern, the smoke and the bomb.
  - R06: the exposure, the gantry, the crew-blocked swap and the tracking shot.
  - IDE: the model shot and the terminal wrap.
  - Editor: the labels.
  - Intro: the hook width, the toggle and the dark source frames.
- **The final contact sheet** is `output/aura_contact_animatic.jpg`: every 1.5 s, at exact times.

## Rights and labels (see MANIFEST.md, PLAN.md)
- **Music.** Two commercial songs; the copies are for building and syncing only.
  - Instagram normally attaches one library song.
  - Read PLAN.md "Posting with two songs" before posting.
- **The backshot.** It is AI placeholder footage, labelled on screen; turn on Instagram's AI label.
- **No third-party marks.** No real team, livery, F1 or product marks. The product UI and the pit stop are labelled fictional.

## Not done yet
- **The 60 fps master** (`output/aura_master_60fps.mp4`). It waits for the user's go-ahead. After it renders:
  - Re-run `aura_deliver.py` with the tag `master`.
  - Re-run `reel_qa.py` with `--frames 5400`.
