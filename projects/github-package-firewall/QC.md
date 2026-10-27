# QC report: GitHub package firewall reel v3 (light + caution hook)

Checked 2026-10-21 on `output/pkgfw_animatic_30fps.mp4` (same mix, same scene code as the master will use). v2's report:
`QC_v2-light.md`. The 60 fps master is pending approval. After it renders, rerun `python analysis/pkgfw_qa.py` and
`python analysis/reel_qa.py output/pkgfw_master.mp4 --variant pkgfw` and update this file.

## The brief's QC list
| Check | Result |
|---|---|
| No unsupported claims | PASS. No PyPI, no "blocks all malware", no "automatic", no "free forever" in the voice, captions or on-screen copy. Every line maps to FACTS.md (F1–F14); the caution hook is a question and claims no incident |
| 60 fps | PENDING (master). The animatic is 30 fps by design |
| No clipping, peaks under −1 dBTP | PASS: −1.6 dBTP true peak, −14.0 LUFS integrated (stereo; the file measures −14.1) |
| Readable captions | PASS. White Fluent card, Mona Sans 700 at 29 px on the 608 px layout (about 51 px on 1080). Every word comes from the voice's own timestamps (150 words, 40 SRT cues). In the caution hook the sign is the caption (38–56 px, word by word) |
| Zero blank frames | PASS: 236 frames sampled at 4/s, none flat (frame 0 shows the caution sign, the beacon and the tapes) |
| Source credit visible | PASS: "Source: GitHub Changelog • Oct 20, 2026" on every frame, inside the safe zone |
| 200 px safe top and bottom | PASS. Measured at 4/s: all copy and UI sit between y 247 and y 1692 of 1920 (limits 200 / 1720). Only the caution beacon's light beams and the amber edge pulse reach the edges (decorative light, no copy) |

## Voice and sound
- Speech-to-text on the full mix with the buzzer and music (ElevenLabs scribe_v1, hin) matches the script word for word
  (`stt_mix_v3.txt`), including the first words right after the buzzer ("NPM I"), "according" and "time".
- The buzzer (two 0.17 s pulses at 0 s and 0.25 s) is about 4 dB under the voice. The music sits at 0.36 and ducks under the
  voice; under the caution intro it is a dark pad only. The other foley is quiet UI sound. No booms or impacts.

## Sync
- Every chapter cut lands on a beat of the 122 BPM grid: 5.410, 11.803, 19.180, 23.607, 30.000, 41.311, 46.721, 53.607.
- Every story event (39) is its word, snapped to the nearest eighth note; all 44 foley cues sit within half a beat of the grid.

## Rights and labels
- Real screenshots: labelled "REAL SCREENSHOT · github.blog" / "· GitHub Docs".
- Look-alike UI: labelled "ILLUSTRATION". The docs' npm notice: labelled "EXAMPLE OUTPUT FROM GITHUB DOCS".
- Logos: the official GitHub mark (Primer Octicons) and npm logo (Simple Icons), published paths, unmodified.
- The hook's package names are fictional (each 404 on registry.npmjs.org, 2026-10-21). No real malware, package or incident.

## Automated runs (animatic)
- `analysis/pkgfw_qa.py`: 21/23. The 2 fails are the 60 fps and 3,541-frame checks (the animatic is 30 fps, 1,770 frames).
- `analysis/reel_qa.py --variant pkgfw`: 9/9 (1080×1920, H.264 yuv420p, AAC, 59.0 s < 60 s, no silences, −14.1 LUFS,
  no flat frames, events on the 0.2459 s eighth-note grid, captions time-ordered).

## Known deviation from the brief
- Length 59.0 s, not 38 s: v2's conversational voice (asked 2026-10-21) plus v3's caution hook (asked 2026-10-21).
  Still under the 60 s cap.
