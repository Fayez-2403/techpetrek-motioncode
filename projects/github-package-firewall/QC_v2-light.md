# QC report: GitHub package firewall reel v2 (light)

Checked 2026-10-21 on `output/pkgfw_animatic_30fps.mp4` (same mix, same scene code as the master will use).
The 60 fps master is pending approval. After it renders, rerun `python analysis/pkgfw_qa.py` and
`python analysis/reel_qa.py output/pkgfw_master.mp4 --variant pkgfw` and update this file.

## The brief's QC list
| Check | Result |
|---|---|
| No unsupported claims | PASS. No PyPI, no "blocks all malware", no "automatic", no "free forever" in the voice, captions or on-screen copy. Every line maps to FACTS.md (F1–F14) |
| 60 fps | PENDING (master). The animatic is 30 fps by design |
| No clipping, peaks under −1 dBTP | PASS: −1.6 dBTP true peak, −14.0 LUFS integrated (stereo) |
| Readable captions | PASS. White Fluent card, Mona Sans 700 at 29 px on the 608 px layout (about 51 px on 1080). Every word comes from the voice's own timestamps (135 words, 36 SRT cues) |
| Zero blank frames | PASS: 220 frames sampled at 4/s, none flat |
| Source credit visible | PASS: "Source: GitHub Changelog • Oct 20, 2026" on every frame, inside the 200 px safe zone |
| 200 px safe top and bottom | PASS: measured on every frame sampled at 4/s, all content sits between y 248 and y 1692 of 1920 (limits 200 / 1720) |

## Voice and sound
- Speech-to-text on the full mix with music (ElevenLabs scribe_v1, hin) matches the script word for word
  (`stt_mix_v2.txt`). The only differences are spellings (npm for N.P.M., CI for C.I.).
- The music sits at 0.36 and ducks under the voice; the foley is quiet UI sound only. No booms or impacts.

## Sync
- Every chapter cut lands on a beat of the 122 BPM grid: 6.393, 14.262, 18.689, 25.082, 35.902, 41.803, 48.197.
- Every story event (33) is its word, snapped to the nearest eighth note; all 40 foley cues sit within half a beat of the grid.

## Rights and labels
- Real screenshots: labelled "REAL SCREENSHOT · github.blog" / "· GitHub Docs".
- Look-alike UI: labelled "ILLUSTRATION". The docs' npm notice: labelled "EXAMPLE OUTPUT FROM GITHUB DOCS".
- Logos: the official GitHub mark (Primer Octicons) and npm logo (Simple Icons), published paths, unmodified.
- The hook's package names are fictional. Each returned 404 on registry.npmjs.org on 2026-10-21; the real names that were
  there before (`react-dom`, `url-parse`, `debug-x`, `date-utils`, `ui-kit`, `color-name`, `fast-json`, `tiny-glob`) were replaced.
- No real malware, no real malicious package, no incident.

## Automated runs (animatic)
- `analysis/pkgfw_qa.py`: 21/23. The 2 fails are the 60 fps and 3,305-frame checks (the animatic is 30 fps, 1,652 frames).
- `analysis/reel_qa.py --variant pkgfw`: 9/9 (1080×1920, H.264 yuv420p, AAC, 55.07 s < 60 s, no silences, −14.0 LUFS,
  no flat frames, events on the 0.2459 s eighth-note grid, captions time-ordered).

## Known deviation from the brief
- Length 55.1 s, not 38 s: the v2 voice is more conversational and explanatory, as asked on 2026-10-21. To get back to
  about 38 s, drop one chapter ("where it sits" or "blocked by mistake").
