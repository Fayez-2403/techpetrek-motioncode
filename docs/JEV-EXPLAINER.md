# Motion as Code — Jev explainer

**Newest work (13 October 2026): Motion Flex, the Claude cut.** `flex` is the 29-second "What can you build?" reel,
`flex_full` adds a 6-bar "how it's made" intro, and a 16:9 director's cut renders from the same scene. Run `cd app` then
`bun run dev:flex`. See [the production notes](docs/MOTION-FLEX-CLAUDE.md) and [the resource pack](docs/MOTION-FLEX-RESOURCES.md).
Every timing lives in `data/flex/score.json` (bars and eighth notes) and is resolved by `analysis/build_flex_audio.py`.

**Earlier the same day: Motion Flex (first build).** The music-led `possibilities` variant is a 30-second showcase;
`motion_full` integrates it with the preserved opening, and `motion` remains the earlier 15-second study.
Run `cd app` then `bun run dev:motion`. See [the production notes](docs/MOTION-POSSIBILITIES.md),
[repository research](docs/MOTION-RESEARCH.md), and [the dedicated Colab notebook](colab/render_motion_flex.ipynb).
The GitHub-series notebook and earlier variants are preserved.

A 1920×1080, 60 fps explainer about TypeSafe's Jev, driven entirely by a voiceover. Every frame is a pure
function of time; word-level timings of the voiceover tell each plate when to animate. Change the code,
re-render. Change the voiceover, re-align, and the whole video re-times itself.

Built on the **pdoom-video** engine by mexicat (Giacomo Magnanini), MIT licence, kept as `LICENSE.pdoom-engine`.
The six plates, the analysis scripts and the sound effects are new.

```
voiceover.mp3 → align_vo.py → lyrics.json ─┐
               audio_vo.py → audio.json  ─┼→ scenes/*.ts + timeline.ts → vite preview → render.ts → mp4
               sfx_mix.py  → out/mix.wav ─┘                                           ffmpeg mux ↵
```

## What's in it

| Path | Role |
| --- | --- |
| `audio/voiceover.mp3` | **Scratch voice** (espeak-ng) reading the script. Replace it with your own recording. |
| `audio/sfx/` | 7 synthesised effects (whoosh, tick, slam, type, strike, pop, implode). Drop in your own WAVs with the same names to replace them. |
| `data/lyrics.json` | Word timings (from `align_vo.py`). |
| `data/audio.json` | Voice envelopes, word onsets, nominal beat grid (from `audio_vo.py`). |
| `analysis/script_vo.py` | **The script**: `SCRIPT` (what is shown) and `SPOKEN` (how numbers and acronyms are said). |
| `analysis/align_vo.py` | Forced alignment. Default: torchaudio MMS_FA (multilingual, handles Hinglish). Fallback: `--engine energy`. |
| `analysis/audio_vo.py` | Audio analysis. |
| `analysis/sfx_mix.py` | Cue sheet (~56 cues from the word timings), ducking up to 7 dB, −14 LUFS. |
| `analysis/make_scratch_vo.py` | Regenerates the scratch voice from the script. |
| `app/src/engine/` | The pdoom-video engine. Leave it alone. |
| `app/src/scenes/_vo.ts` | Shared toolkit: `wordOf`/`lineOf`, graph paper, plotter pen, karaoke captions. |
| `app/src/scenes/*.ts` | The six plates. |
| `app/src/timeline.ts` | When each plate plays. Cuts sit 0.18 s before each plate's first line. |
| `app/scripts/render.ts` | Offline renderer: headless Chrome → raw frames → ffmpeg. |

## The six plates

| Plate | Lines (≈ seconds with the scratch voice) |
| --- | --- |
| hook | 0.0–9.3 · ChatGPT likhta hai… Messy text do, typed answer lo. |
| answers | 9.3–17.3 · Sirf teen answers… Noul, haan ya na ki probability. |
| code | 17.3–31.1 · Ek support ticket diya… Sab typed, koi parsing nahi. |
| policy | 31.1–42.3 · Jev sirf judgment deta hai… Action aapka code leta hai. |
| tradeoffs | 42.3–52.0 · Classify aur route… sahi answer nahi. |
| verdict | 52.0–end · LLM likhta hai… Comment karo. (implodes, loops to frame 0) |

## Requirements

- [bun](https://bun.sh), Google Chrome, ffmpeg with libx264.
- Python 3.10+ with [uv](https://docs.astral.sh/uv/) (`pip install uv`) for the analysis scripts.

## First run

```sh
cd app
bun install
bunx vite
```

Open http://localhost:54173 and press space (the voiceover plays with it). The dev server shows the 9:16 reel by
default; `VITE_VARIANT=wide bunx vite` (PowerShell: `$env:VITE_VARIANT='wide'; bunx vite`) shows the 16:9 video.

| Key | Action |
| --- | --- |
| space | play / pause |
| ← / → | seek 1 s (5 s with shift) |
| , and . | step one frame |
| [ and ] | previous / next plate |
| l | loop the current plate |
| h | hide the UI |

`?t=35` in the URL starts at 35 s.

## Stills, render, sound

```sh
cd app
bun scripts/render.ts stills --t 12.5,40.2 --only answers,policy --out ../out/wip   # check single frames
bun run render:draft    # 4 sub-frames, fast preset → out/motion-as-code_draft.mp4
bun run render          # adaptive motion blur, CRF 17 → out/motion-as-code.mp4
```

Add `--scale 2` to any render for 4K. If the renderer can't find Chrome: `BROWSER_CHANNEL=msedge` (or
`chromium`), or `BROWSER_PATH=/path/to/chrome`.

Sound effects (no re-render needed):

```sh
python -m uv run --no-project --with numpy python analysis/sfx_mix.py
cd out
ffmpeg -i motion-as-code.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -shortest motion-as-code_sfx.mp4
```

## Swap in your own voiceover

1. Record the script in `analysis/script_vo.py` (pause briefly between lines). Save it as `audio/voiceover.mp3`.
2. If you changed any words, edit `SCRIPT` (and `SPOKEN` for numbers and acronyms).
3. Re-align and re-analyse:

```sh
python -m uv run --no-project --with torch --with torchaudio --with numpy python analysis/align_vo.py
python -m uv run --no-project --with numpy python analysis/audio_vo.py
python -m uv run --no-project --with numpy python analysis/sfx_mix.py
```

The first `align_vo.py` run downloads the MMS_FA model (about 1.2 GB). No torch? Add `--engine energy`
for the offline aligner (fine for a clean read with clear pauses between lines).

Plates find their words by content (`wordOf`, `lineOf`). If you keep the same script, every animation
re-times itself. If you reword a line, update the anchor phrases in `timeline.ts` and the plate that uses it.

## 9:16 Hindi reel

A second cut of the same video: Hindi voiceover (the voice reads the Devanagari `SCRIPT`), the original theme
(ink, graph paper, bone, signal) with the original English headlines, no captions and no Hindi or Hinglish text on
screen (`DISPLAY` holds Roman words for the lyrics data only), every word inside the Reels safe zone (y 360..1420
and out of the right 120 px of the 1080×1920 frame; `SAFE` in `_vo.ts`), six vertical plates (`scenes/reel_*.ts`). The engine canvas is fixed at 1920×1080, so the
reel plates draw in a centred 608×1080 column (`COL` in `_vo.ts`) and `render.ts --variant reel` crops it and
scales it to 1080×1920. The 16:9 files are untouched: the reel lives in `audio/reel/` and `data/reel/`.

```sh
pip install edge-tts numpy                       # Microsoft neural voices, needs internet
python analysis/make_reel_vo.py                  # script_reel.py -> audio/reel/voiceover.mp3 + data/reel/lyrics.json
VARIANT=reel python analysis/audio_vo.py         # PowerShell: $env:VARIANT='reel'; python analysis/audio_vo.py
cd app
bunx vite                                        # preview the reel at http://localhost:54173
bun scripts/render.ts stills --variant reel --t 12,40 --out ../out/wip_reel
bun scripts/render.ts video --variant reel --fps 30 --samples 4 --preset veryfast --crf 20 --out ../out/motion-as-code_reel.mp4
```

Sound effects and a smaller copy for uploading (the reel's mix is `out/mix_reel.wav`; it never touches the 16:9 `mix.wav`):

```sh
VARIANT=reel python analysis/sfx_mix.py          # PowerShell: $env:VARIANT='reel'; python analysis/sfx_mix.py
cd out
ffmpeg -i motion-as-code_reel.mp4 -i mix_reel.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -shortest -movflags +faststart motion-as-code_reel_sfx.mp4
ffmpeg -i motion-as-code_reel_sfx.mp4 -c:v libx264 -preset medium -crf 23 -maxrate 10M -bufsize 20M -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart motion-as-code_reel_share.mp4
```

The reel currently has **no voiceover**: `audio/reel/voiceover.mp3` is a silent track of the same length, so the
preview and renders keep their timing (it comes from `data/reel/`). The Hindi voice is kept as
`audio/reel/voiceover_hindi.mp3`; copy it over `voiceover.mp3` to bring it back. Re-running `make_reel_vo.py`
also writes a voice again.

Change the voice with `--voice hi-IN-MadhurNeural` (male) or `--rate -10%` on `make_reel_vo.py`. Word timings come
from the voice's own word boundaries, so there is no aligner step. Edit the Hindi in `analysis/script_reel.py`
(`SPOKEN` spells numbers and acronyms out in English), keep `DISPLAY` word-for-word in step with it, and keep the
anchor words that `timeline.ts`, the plates and `sfx_mix.py` look up. Font: Noto Sans Devanagari (SIL OFL) in `app/public/fonts/`.

## Vox template: the Microsoft-Decision-1 explainer

A 9:16 documentary explainer in the style of the `vox-explainer` skill: paper and grain, halftone, torn-edge cards,
bold condensed type, motion on twos, a torn navy wipe at each cut, a low score with a hit on every shot. Hindi
voice (numbers and names in English), English text on screen, every number typed as the source gives it
(Microsoft Command Line, 2026.10.09, and its accuracy / latency / calibration chart). It is the default variant:
`bunx vite` opens it at http://localhost:54173 (`$env:VITE_VARIANT='reel'` for the Jev reel).

**As a template:** one shot per spoken line. Write the lines in `analysis/script_<name>.py`, then list the shots in
`timeline.ts` (see the `decision` branch): each is a shot module plus its content.

| Shot module | Shows |
| --- | --- |
| `vox_logo` | the brand's own logo file popping in fast on its dark tile (`src` under `app/public/`, `sub`, `subWord`) |
| `vox_kinetic` | big condensed lines on torn strips (`lines`, `hi`, `chip`, `sub`, `open` for the first shot) |
| `vox_cards` | equal torn cards dropping in (`title`, `cards[{head, body, hi, lines}]`, `foot`) |
| `vox_counter` | a number counting up to an exact value (`value`, `decimals`, `prefix`, `suffix`, `subs`, `land`) |
| `vox_bars` | a bar race (`rows[{name, value, label, hi, ref}]`, `max`, `stamp`, `note`) |
| `vox_grid` | identical tiles filling in, then a total (`n`, `cols`, `tile`, `total`) |
| `vox_shuffle` | options reorder, the pick holds (`options`, `picked`, `stamp`, `note`) |
| `vox_lollipop` | dots on a scale (`rows`, `min`, `max`, `note`) |

Stamps and notes land on a spoken word (`stampWord`, `noteWord`, `land`: the word's text or index in the line).
Palette, safe zone and helpers: `VOX`, `VOX_BOX`, `VoxPlate` in `_vo.ts`.

```sh
$env:VARIANT='decision'; python analysis/make_reel_vo.py --voice hi-IN-MadhurNeural --rate +55% --pitch +8Hz   # young, excited male voice + word timings
$env:VARIANT='decision'; python analysis/audio_vo.py
$env:VARIANT='decision'; python analysis/sfx_mix.py             # score -> out/mix_decision.wav
ffmpeg -i out/mix_decision.wav -ac 2 -b:a 192k audio/decision/mix.mp3   # preview and renders play the mix
cd app; bun scripts/render.ts stills --variant decision --t 5,30 --out ../out/wip_decision
```

## Writing or changing a plate

A plate extends `VoPlate` (`app/src/scenes/_vo.ts`) and implements `draw(c, f)` on a Canvas2D layer over
ink and graph paper. Everything must be a deterministic function of time: `f.t` (time), `f.lt` (time in
the plate), `f.p` (0–1 through the plate), `f.a` (voice envelope and pulses). Never `Math.random()` or
`Date.now()`. To add a plate: create `app/src/scenes/yourplate.ts`, then add an `E('yourplate', 'yourplate',
start, end)` line to `timeline.ts` with `cut('<first words of its line>')`.

## Troubleshooting

| Problem | Try this |
| --- | --- |
| Blank page | `bun install` inside `app/`; read the vite terminal for errors. |
| No sound in preview | Press space (browsers block audio until you interact); check the tab isn't muted. |
| Render can't find Chrome | Install Chrome, or set `BROWSER_CHANNEL` / `BROWSER_PATH`. |
| `found N speech runs for M lines` | The energy aligner needs a clear pause between lines; use the MMS engine. |
| Animation drifted after a new voiceover | Re-run both analysis scripts; update `cut(...)` phrases if wording changed. |
| `lyric not found` / `word … not in line` | A plate or the timeline asks for a word your new script no longer has. |
| Render very slow | `render:draft`, or stills for single plates. |

## Credits

Engine, palette (ink, bone, signal orange), fonts (Archivo, IBM Plex Mono, Cormorant Garamond, plotter
fonts), the spark motif and post-processing: pdoom-video by mexicat, MIT (`LICENSE.pdoom-engine`).
Jev facts on screen come from TypeSafe's published quickstart example.
