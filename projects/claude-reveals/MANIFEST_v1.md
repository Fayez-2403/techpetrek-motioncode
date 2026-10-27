# "WHATTT?! 5 Claude project reveals": source, asset and code manifest

94 s · 1080x1920 · 60 fps · 120 BPM · Hinglish narration. Built 2026-10-21 in this repo's pdoom engine (variant `reveals`),
not Remotion: the repo's rule is that every reel is built in its own engine, and the brief's requirements (seek(t), frame-exact
timing, springs, easing, a beat grid) are how pdoom works. Facts: `FACTS.md`. Rights: `ASSETS-RIGHTS.md`.

## Source-video mapping (deliverable 5)
Every project clip is the creator's original video, downloaded from the public post's own media file (video.twimg.com, the best
quality X serves; SHA-256 in `references/source/SHA256SUMS.txt`). Each excerpt plays once, uninterrupted, at 1.0x, fitted whole
inside its frame (never cropped, stretched or covered by type), with the creator credited under it.

| Reveal | Project | Creator (original post) | Thread post | Source file | Source in-out | On screen |
|---|---|---|---|---|---|---|
| 01 | Wildfire analysis ("FireTrace") | Dilum Sanjaya, [@DilumSanjaya](https://x.com/DilumSanjaya/status/2108241054298415258) | [T1](https://x.com/claudeai/status/2111177834127601902) | `A_wildfire_dilumsanjaya.mp4` (3456x1990) | 1.0-12.5 s | 18.0-29.5 s |
| 02 | Doodle chess | Kevin Ngo, [@kevin_t_ngo](https://x.com/kevin_t_ngo/status/2105428751115071642) | [T2](https://x.com/claudeai/status/2111177836723920962) | `B_chess_kevin_t_ngo.mp4` (1920x1080) | 7.5-17.6 s | 31.0-41.0 s |
| 03A | Handwriting to font | Harshpreet Singh, [@harshpreet931](https://x.com/harshpreet931/status/2102767445400490132) | [T3](https://x.com/claudeai/status/2111177838208377213) | `C_font_harshpreet931.mp4` (1280x720) | 5.5-9.0 s, then 41.5-47.0 s | 43.0-46.5 s, 46.5-51.9 s |
| 03B | Animated haiku | Kevin Ngo, [@kevin_t_ngo](https://x.com/kevin_t_ngo/status/2107939123818574231) | [T6](https://x.com/claudeai/status/2111177845846495646) | `F_haiku_kevin_t_ngo.mp4` (1080x1080) | 20.0-26.6 s | 52.5-59.0 s |
| 04 | Electromagnetic field | The Bugged Dev, [@thebuggeddev](https://x.com/thebuggeddev/status/2104402407358919124) | [T4](https://x.com/claudeai/status/2111177840326832573) | `D_emfield_thebuggeddev.mp4` (2824x1754) | 5.0-16.0 s | 62.0-72.95 s |
| 05 | AngioView (3D cardiology) | Annas Rahman, MD, [@AnnasRahmanMD](https://x.com/AnnasRahmanMD/status/2107153860271706177) | [T5](https://x.com/claudeai/status/2111177843413807120) | `E_angioview_annasrahmanmd.mp4` (3336x2160) | 0.0-12.45 s (all of it) | 75.5-88.4 s |

Notes:
- The clip ends at 87.95 s; its last frame holds for the 0.45 s collapse into the five cards (the whole clip has played).
- 0-17 s: all six play together as small looping tiles in the background collage, and on the actor's monitor (6 s loops:
  A 3-9 s, B 8-14 s, C 41.5-47.5 s, D 62-68 s, E 2-8 s, F 20-26 s), fitted whole, dimmed.
- The final cards (88-94 s) show each excerpt's last frame as a small thumbnail.
- Variable-rate sources (A, D) are put on a constant 60 fps grid by timestamp, and 30 fps sources (C, F) are stored at
  30 fps. Frame n shows at clip time n / fps, so the speed is always 1.0x (`analysis/reveals_media.py`).

## The actor (Mixkit, Stock Video Free License; one actor, the 516xx series)
| Shot | Mixkit clip | Clip time used | On screen |
|---|---|---|---|
| At his monitor (the green screen keyed; the collage and the post mapped onto it) | 51602 | 4.6-6.4 s, 6.2-6.7 s | 0-1.9 s (WHAT?!), 6.5-7.0 s (the dive), 89.5 s (match cut) |
| Hand over his mouth / grins at camera | 51611 | 6.0-7.75 s, 2.0-3.5 s, 7.5-9.5 s | 1.75-3.5 s (WHATTT?!), 3.5-5.0 s (WHAAAAAATTTTT?!), 70.25-72.2 s (No. Way.), match cuts |
| Arms flung out (the jump, frozen at its peak) | 51612 | 4.9-5.4 s | 5.0-6.75 s |
| Talking to the screen | 51610 | 7.0-9.2 s | 38.4-40.7 s (Wait… ye playable hai?!) |
| Frozen stare | 51607 | 2.5-4.0 s | 88.0-89.5 s |
| The smile | 51606 | 10.1-13.85 s | 90.25-94 s |
Files: `references/stock/free720/mixkit_<id>.mp4` (720p: the free download size), SHA-256 alongside.

## Other assets
| Asset | Origin | Use |
|---|---|---|
| Thread screenshots t1-t7 | X's own embed (platform.twitter.com/embed), captured 2026-10-21 by `app/scripts/shoot_pages.ts` (430 css px at 2.5x, dark) | The "Claude just posted this" scroll, unedited, labelled "SOURCE: @claudeai ON X · OCT 16, 2026 · X EMBED" |
| Music | Original, synthesized (`analysis/reveals_music.py`) | Score; cue sheet: `CUE-SHEET.md` |
| Foley | Original, synthesized (`analysis/reveals_mix.py`) | Comedy and transition sounds |
| Voice | ElevenLabs Liam (the user's account) | `VOICEOVER.md` |
| Type | Archivo (widths 62-125 %, weight 900), IBM Plex Mono: SIL OFL, in `app/public/fonts/` | All on-screen text, drawn in code |
| TechpeTrek logo | `app/public/brand/techpe-trek.jpg` (the user's own) | End card |

## Code (the editable project, deliverable 2)
| File | Role |
|---|---|
| `analysis/script_reveals.py` | The plan as data: chapters, narrator lines (spoken + display), actor lines, excerpts, actor shots, fixed marks, credits |
| `analysis/reveals_media.py` | Frame sequences of every excerpt, loop and actor shot; the green-screen key and the screen's corners; trimmed screenshots |
| `analysis/reveals_vo.py` | The voice: one narrator take cut by its timestamps, five actor takes, placed at fixed times; lyrics, SRT, layout |
| `analysis/reveals_music.py` | The score (stems + `data/reveals/music.json`) |
| `analysis/reveals_cues.py` | The storyboard as data: marks and word-triggered events on the eighth-note grid, the foley list |
| `analysis/reveals_mix.py` | The mix: ducking, foley, -14 LUFS, the beat map |
| `app/src/scenes/reveals.ts` | The reel (pure functions of t): the reusable motion system (slam, maskUp reveals, springs, extruded numerals, chips, credits, clip frames, the keyed-monitor map, tilt cards, field lines, ECG, confetti) and one function per chapter |
| `app/src/scenes/_vo.ts` | `SeqCache`: the shared frame-sequence player (exact frames, LRU-bounded) |
| `app/src/main.ts` | The optional export barrier `window.__pdoomPrepare(t)`: renders wait for a scene's frames; no change for other reels |

Rebuild (no new credits; the voice takes are cached):
```
python analysis/reveals_media.py
python analysis/reveals_vo.py --seed 5
python analysis/reveals_music.py
python analysis/reveals_cues.py
python analysis/reveals_mix.py
cd app; $env:VITE_VARIANT='reveals'; bunx vite --port 54179          # live preview
bun scripts/render.ts stills --variant reveals --t 5.9,22 --out ../out/wip_reveals
```

## Deliverables (output/)
| File | What |
|---|---|
| `reveals_master.mp4` | Final H.264 1080x1920 60 fps (after approval) |
| `reveals_animatic_30fps.mp4` | Preview animatic (30 fps) |
| `../../../audio/reveals/voiceover.wav` | The voice |
| `reveals_captions.srt` | Captions from the voice's own timestamps |
| `reveals_thumbnail.png` | The cover: the actor's WHAAAT, five project previews |
| `reveals_beatmap.json` | Beat grid, cuts, events, foley, voice lines |
| `../VOICEOVER.md`, `../CUE-SHEET.md`, `../ASSETS-RIGHTS.md`, `../FACTS.md`, `../QC.md`, `../CAPTION.md` | Script, cue sheet, rights checklist, facts, QC, post caption |
