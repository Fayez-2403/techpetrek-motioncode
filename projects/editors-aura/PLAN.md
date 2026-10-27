# OPUS 5.5: THE EDITOR'S AURA (plan v1, 2026-10-22)

90.0 s · 1080x1920 · 60 fps · no narration · cut to the music. The user's decisions (2026-10-22):
- **Length:** 90 s, to fit Instagram's library-song clip.
- **End card:** "BUILT WITH CLAUDE OPUS 5.5 · TECHPE TREK". No "×", which would imply a partnership.
- **The protagonist and room:** for now, slots filled with placeholders (the user's clip, `out/cinematics10seconds.mp4`). The rest of the studio is built in code.
- **VS Code / Claude Code:** the user's real screenshots.
- **The six showcase renders:** real. Built and rendered in code in this repo, and each also exported on its own.

## Update (2026-10-22, the user): the Dhurandhar intro
- **The opening 10 s:** only the **first 10 s** of the cinematic clip. Its 10-20 s fake-UI shots are not used anywhere.
- **The intro music:** the **Dhurandhar title track**, "Ladies and gentlemen, you are not ready for this." It is at 0:12 of the Saregama
  Music "Dhurandhar - Title Track Video" (youtu.be/7IBDa53IsvI); the audio-only release does not have the line. This copy is only for building and syncing.
- **The cuts:** the intro is rubato, so there is no grid to fit. The cuts go on what was measured (`analysis/aura_intro.py` -> `data/aura/intro.json`):
  - The line's words come from local speech-to-text (faster-whisper): "Ladies" at 0.36 s, "this." at 4.02 s.
  - Five hits are snapped to their onset peaks, at 4.14, 4.71, 7.04, 7.99 and 9.48 s.
- **The transition** (`analysis/aura_audio.py`):
  - From the last hit, Dhurandhar sweeps down a low-pass and fades.
  - Dubplate rises through a high-pass from the beat before its phrase line, with a riser on top.
  - Its bass slams in on its own phrase line at **10.105 s**, where the IDE opens. Every cue after that is unchanged.
- **The rough-cut editor beat** that used to sit at 7.58-10.11 s is folded into the intro.
- **Posting with two songs:** Instagram's editor normally attaches **one** library song to a reel. Two options:
  1. Upload with the music baked in. Two commercial songs can get the reel muted, its reach limited, or the upload blocked in some regions.
  2. Post the picture with the foley-only audio (`output/aura_post_*.mp4`) and add one song from the library (Dubplate from 1:40.95). The Dhurandhar intro then won't be heard.
  
  Check in the app before posting.

## The song is the timeline
General Levy, "Dubplate", the Little Lion Sound upload (youtu.be/e2kIhlfmOJw). That copy is only for building and syncing. When
posting, add "Dubplate" from Instagram's library starting at **1:40.95**. The SoundCloud release is marked all-rights-reserved.

The window is song 100.947-190.947 s (the reel's 0-90 s). Measured, not assumed (`analysis/aura_songmap.py` -> `data/aura/song_map.json`):
- **Tempo:** 95.00 BPM. The grid unit is the eighth, 0.3158 s; one bar is 2.526 s. 95% of beats land within 31 ms.
- **The downbeat, measured:** the bass drops out on eighths 4-5 of every bar and slams back on eighth 6, so eighth 6 is beat 1. A
  first pass had started two eighths late; this is corrected.
- **Phrases:** every 4-bar phrase (10.105 s) ends with a pair of bass dropouts, then the bass slams back in on the bar line.
  The reel's phrase lines are 0, 10.11, 20.21, 30.32, 40.42, 50.53, 60.63, 70.74 and 80.84 s.
- **The viral "Nuclear Bomb" fast section:** the intro lands on the 60.63 s phrase line, then the fast run (about 8 words a second) to about 71.05 s.
- **The ending:** bass dropouts at 86.21 and 87.79 s, the final slam on the 88.42 s bar line, and the cut to black on beat 3 at 89.68 s.

## Structure (every boundary on a phrase or bar line; events on eighths)
| Time (s) | Scene | Built from |
|---|---|---|
| 0-10.11 | **01 The cinematic intro (Dhurandhar):** the line word by word over the eye macro; hit 1 "6 RENDERS.", hit 2 "ALL CODE." (desk); hit 3 CREATOR MODE, hit 4 ON (over the shoulder, the timeline in the window); hit 5 the dive into the screen, onto Dubplate's slam | Placeholder clip, first 10 s only (face 0-2, desk 2-5, side and rear 5-8, monitors 8.6-9.7) + code: kinetic type, light trails, a timeline reflection, the dive |
| 10.11-20.21 | **02 The workstation wakes:** the rough cut in the editor, then VS Code + Claude Code (Opus 5.5), the BUILD CHECK (10 ticks on eighths, every one a real capability), the first prompt, PLAN, BUILD, PREVIEW, CHECK, RENDER | The user's screenshots + the custom editor (code) |
| 20.21-28.8 | **Render 01** Kinetic type + music machine: "WORDS → MOTION" | Code, real render |
| 28.8-30.32 | Roundtrip 01: "Sharper timing…", golden hour starts | Screenshot + code |
| 30.32-38.9 | **Render 02** Premium SaaS UI film: "INTERFACES → CINEMA" | Code, real render |
| 38.9-40.42 | Roundtrip 02: **the first big timeline shot** (renders dropped onto V2, waveforms) | The custom editor |
| 40.42-49.0 | **Render 03** Audio-reactive shader world, driven by the song's own onset and energy data: "MUSIC → MATHEMATICS" | Code (WebGL), real render |
| 49.0-50.53 | Roundtrip 03: sunset to night, the lamp on, the chrome prompt | Screenshot + room slot |
| 50.53-58.5 | **Render 04** Chrome + glass 3D brand assembly (an original symbol): "MATTER → MOTION" | Three.js, real render |
| 58.5-60.63 | Roundtrip 04: an artifact found, then "Fix reflection clipping…", a contact sheet, PASS | Screenshot + a real contact sheet |
| 60.63-70.74 | **The fast section, the densest edit:** Render 05 volcano (eruption on the 67.58 slam: "CODE → WORLDS"), intercut on the vocal syllables with terminal lines, preview cuts and timeline snaps | Three.js volcano + editor + screenshots |
| 70.74-80.21 | **Render 06** procedural pit stop: the biggest reveal. The car launches on the 80.21 slam | Three.js, real render (an original car and crew; no real team, livery or F1 marks) |
| 80.21-85.58 | **Act III, the impossible timeline:** all six renders on the tracks, transitions and opacity tweaked, a track toggled, macro shots; the window goes from night to dawn | The custom editor + room slot |
| 85.58-88.42 | The bass drops out (86.21): one tiny timing nudge, *click*, everything locks. EXPORT, then six flashes on eighths | Editor |
| 88.42-89.68 | Final slam: "I DON'T JUST EDIT VIDEOS." / "I BUILD THEM." / "BUILT WITH CLAUDE OPUS 5.5 · TECHPE TREK" | Type + room slot |
| 89.68-90.0 | Cut to black on the bass dropout | |

## The BUILD CHECK on screen (each one real and checked before it is shown)
| Item | Real thing in this repo |
|---|---|
| Audio beat-grid analysis | librosa beat tracking + the measured fit (`data/aura/song_map.json`) |
| Frame-exact seek(t) | The pdoom engine (every frame is a pure function of t) |
| Spring motion system | `spring()` / `springTo()` in `app/src/scenes/_vo.ts` |
| HyperFrames / GSAP | **Only if Render 02 is actually rendered with HyperFrames** (not installed yet; it needs `npx hyperframes`). Otherwise this line says "Canvas UI choreography" |
| Three.js / WebGL | Installed (three 0.186) |
| SVG / Canvas animation | Layer2D |
| FFmpeg render pipeline | `app/scripts/render.ts` (ffmpeg 9.0.2) |
| Sound-effects library | Synthesized foley (`analysis/*_mix.py`) |
| Frame validation | `analysis/reel_qa.py` + stills and contact sheets |
| Export presets | render.ts (H.264 yuv420p bt709, 60 fps) |

## What's needed from the user (next message)
Real screenshots, full-resolution PNGs, dark theme, nothing private on screen:
1. VS Code with this repo open: the file explorer, an editor tab, and the Claude Code panel or terminal.
2. Claude Code showing the active model as **Opus 5.5** (the status line, or `/model`).
3. One screenshot per showcase prompt, typed before pressing Enter. If possible, a second screenshot of Claude working (a plan or to-do list, file edits, a render command):
   - "Build a beat-synced cinematic kinetic typography sequence. Frame-exact. 60 fps. Render and validate."
   - "Sharper timing. Stronger contrast. Next: premium product UI."
   - "Build a cinematic chrome-and-glass 3D brand reveal. Precise material animation. Multiple cameras. Frame-check the output."
   - "Fix reflection clipping. Reduce artifacts. Check frames again. Render final."
   - "Real-time cinematic volcano simulation, fluid-inspired smoke and dynamic lava."
   - "Cinematic procedural Formula 1 pit stop. Coordinated crew movement, physical camera motion, realistic timing, detailed materials, dynamic sound."
4. A terminal with a render running (`bun scripts/render.ts …`) and one with a QA pass (`python analysis/reel_qa.py …`).

## Rights and labels
- **The placeholder clip:** it carries a Gemini/Veo ✦ watermark, so it looks AI-generated. If a generated person appears in the post, use Instagram's AI label (or replace the clip with your own footage later).
- **The six renders:** original. The references are inspiration only (`awesome-opus5-5-videos` entries by @adrianduta96, @Screeendev, @BuildFastWithAI, @juancarlos17626, @pagustafsson and @rubenssoto_ai). No copying of their frames, logos or designs.
- **The pit stop:** no real team names, liveries or F1 trademarks.
- **The editor:** an original design (not a copy of Premiere, Resolve or the user's screenshot).
