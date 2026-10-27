# OPUS 5.5: THE EDITOR'S AURA (manifest, 2026-10-22)

The reel is 90.0 s, 1080x1920, 9:16 (the master is 60 fps), with no narration. Music: the Dhurandhar title track (0-10.1 s),
then General Levy "Dubplate".

## Editable project (everything is code + data in this repo)
| Part | Files |
|---|---|
| The reel (one scene) | `app/src/scenes/aura.ts` (it dispatches the worlds, the export flashes and `worldAt(T)` for the editor's monitor); `app/src/timeline.ts` (variant `aura`) |
| The worlds | `app/src/scenes/aura/`:<br>• `orbit.ts`: the intro<br>• `ide.ts`: the IDE, prompts and BUILD CHECK<br>• `r1_type.ts`, `r2_ui.ts`, `r3_shader.ts`, `r4_chrome.ts`, `r5_volcano.ts`, `r6_pitstop.ts`<br>• `editor.ts`: the multitrack editor and the preview<br>• `end.ts`<br>• `common.ts` |
| The storyboard as data | `data/aura/cues.json`:<br>• 18 segments<br>• 70 Dubplate events on the eighth grid, plus 16 measured intro events<br>• 11 montage intercuts<br>• 6 flashes<br>• 121 foley cues |
| Song analysis | `data/aura/song_map.json` (Dubplate: 95.002 BPM, 36 bars, 9 phrases, anchors); `data/aura/intro.json` (Dhurandhar: words and hits); `data/aura/audio.json` (features at 100 fps + onsets of the composite track, which the renders react to) |
| Media | `data/aura/media.json`; frames in `app/public/aura/frames/{ph,rec}`; screenshots in `app/public/aura/screens`; render thumbnails in `app/public/aura/thumbs` |
| Pipeline scripts | `analysis/`:<br>• `aura_songmap.py`<br>• `aura_intro.py`<br>• `aura_audio.py`<br>• `aura_cues.py`<br>• `aura_media.py`<br>• `aura_thumbs.py`<br>• `aura_mix.py`<br>• `aura_cover.py`<br>• `aura_deliver.py` |

Rebuild, in order:
```
python analysis/aura_songmap.py; python analysis/aura_intro.py; python analysis/aura_audio.py; python analysis/aura_cues.py
python analysis/aura_mix.py; python analysis/aura_thumbs.py; python analysis/aura_cover.py
cd app && bun scripts/render.ts stills --variant aura --t 0,30,60 --out ../out/wip_aura/x          # check
bash <scratchpad>/aura_animatic.sh 30                                                          # 30 fps animatic, 10 s segments
python analysis/aura_deliver.py projects/editors-aura/output/aura_animatic_30fps.mp4 animatic   # deliverables
python analysis/reel_qa.py projects/editors-aura/output/aura_animatic_30fps.mp4 --max-dur 90
```
Preview live: `cd app && VITE_VARIANT=aura bunx vite --port 54179`.

## Assets, sources and rights
| Asset | Source | Use and rights |
|---|---|---|
| Dhurandhar title track, 11.90-22.0 s | Saregama Music, "Dhurandhar - Title Track Video", youtu.be/7IBDa53IsvI; `out/motion_references/dhurandhar/7IBDa53IsvI.wav` | Commercial song. The copy is **for building and syncing only**. See PLAN.md "Posting with two songs" |
| General Levy, "Dubplate", song 100.947-190.947 s | Little Lion Sound upload, youtu.be/e2kIhlfmOJw; `out/motion_references/dubplate/e2kIhlfmOJw.wav` | Commercial song. The copy is for building and syncing only. On Instagram, use the library track from 1:40.95 |
| Backshot (the creator, the room) | The user's clip `out/cinematics10seconds.mp4`, **first 10 s only** | AI-generated (the Gemini/Veo ✦ mark stays visible). On screen it is labelled "BACKSHOT · AI PLACEHOLDER". Use Instagram's AI label, or swap in real footage later |
| V2 opening: stock footage | Mixkit, one programmer (clips 41639, 41642, 41646, 41650, 41654, 41657; 17 checked); `references/stock/free720` + `SHA256SUMS.txt`, pages in `references/stock/pages/` | **Mixkit Stock Video Free License**, read from each clip's own page (`"copyrightNotice":"Free"`): commercial and social use, modification allowed, no attribution needed. Credited on screen: "STOCK FOOTAGE · MIXKIT" |
| V2 first-cut mask | MediaPipe Face Landmarker + its canonical face mesh, `out/models/` | Apache-2.0, local |
| VS Code + Claude Code | The user's screenshots `references/screens/user_5..11.png` and recording `out/screengrab for reel.mp4` | The user's own screen.<br>• Composited into it: the six prompts (in the real input box), Claude's to-do list, the terminal lines and the session title.<br>• Not altered: the toolbar, the model chip, the explorer and the picker |
| The six renders | Original code (this repo) | Original. The reference list in PLAN.md was inspiration only. No real logos, teams, liveries or F1 marks. The pit stop is a fictional team; the car carries the channel's own TECHPE TREK |
| The editor ("AURA EDIT") | Original code | An original design. Its timeline is this reel's real timeline |
| Logo | The user's TECHPE TREK logo, `app/public/aura/screens/logo.jpg` | The user's brand |
| Foley (121 cues) | Synthesized in `analysis/aura_mix.py` | Original, no samples |
| Fonts | Archivo (`app/public/fonts`), system Segoe UI and Cascadia Mono (in the IDE composite) | Archivo is SIL OFL |
| Speech-to-text | faster-whisper "base", local | Free, offline |

Facts on screen and their sources:
- **BUILD CHECK:** each line is a real capability of this repo (PLAN.md table).
- **"95.002 BPM · fit 31.2 ms":** `song_map.json`.
- **"70 events / 0 off the grid":** the Dubplate events, as `aura_cues.py` prints them; there are also 16 measured intro events.
- **"FRAMES CHECKED · 8/8":** the real Render 04 contact sheet.
- **"ARTIFACT · R04 v1":** a real frame of Render 04 from before its reflection fix.

## Deliverables (`projects/editors-aura/output/`)
| File | What |
|---|---|
| `aura_animatic_30fps.mp4` | The animatic: 30 fps, 1080x1920, song + foley mix (build/sync copy) |
| `aura_master_60fps.mp4` | The master. **Not rendered yet: waiting on the user's go-ahead** |
| `aura_post_<tag>.mp4` | The post version: picture + foley only. Add the song from Instagram's library |
| `renders/R01..R06_*_<tag>.mp4` | The six renders as individual files |
| `aura_timeline.json` / `.csv` | The layered timeline: V3 backshot, V2 IDE/editor, V1 renders, FX intercuts + flashes, A1 music, A2 foley |
| `aura_beatmap.json` | The beat map: grid, bars, phrases, anchors, every event, intercut, flash and foley cue |
| `stems/` | `music_BUILD-SYNC-ONLY_dhurandhar-intro+dubplate.wav`, `foley.wav`, `mix.wav` |
| `aura_contact_<tag>.jpg` | The QC contact sheet (every 1.5 s) |
| `aura_cover.jpg`, `aura_cover_4x5.jpg` | The thumbnail: the protagonist with the glowing timeline (9:16, plus a 4:5 grid crop) |
| `../CAPTION.md`, `../QC.md` | The caption with hashtags; the QC report |
