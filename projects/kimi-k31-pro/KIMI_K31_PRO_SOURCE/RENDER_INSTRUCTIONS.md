# RENDER INSTRUCTIONS

All commands run from `KIMI_K31_PRO_SOURCE/`. Requirements: Node 24, npm, ffmpeg/ffprobe on PATH, Python 3.12 with numpy,
scipy, soundfile (+ faster-whisper for QA), Chrome. `npm install` once.

## 1. Preview and stills
```bash
npx remotion studio src/index.ts                       # interactive preview (compositions KimiMasterFilm, KimiInstagramCut, S-<scene>-<variant>)
npx remotion bundle src/index.ts --out-dir out/bundle-main
npx remotion still out/bundle-main S-cad-master out/wip/cad.png --frame=200     # frame is local to the scene
```

## 2. Audio pipeline (narration → timing → music/SFX/mix → docs)
```bash
python audio-src/scratch_vo.py master && python audio-src/scratch_vo.py reel   # SCRATCH guide voice (current)
python audio-src/timing.py        # SCENE_TIMINGS.json + public/audio/vo_<variant>.wav
python audio-src/score.py         # public/audio/mix_<variant>.wav at -14 LUFS, stems + cue log in audio-src/out/<variant>/
python audio-src/docs.py          # VOICEOVER_HINGLISH.md + SOUND_CUE_SHEET.md
```

## 3. Swapping in the real voice (one WAV per cut)
Either
- **ElevenLabs Liam** (needs ~330 credits for the master, ~190 for the reel): `python audio-src/vo.py master --stt` and
  `python audio-src/vo.py reel --stt` (takes cached in `audio-src/takes/`; `--stt` prints a speech-to-text check of every line), or
- **a recorded take**: read VOICEOVER_HINGLISH.md top to bottom with ~1 s between lines, save as WAV, then
  `python audio-src/align.py path/to/master.wav --variant master` (same for the reel).

Then re-run `python audio-src/timing.py && python audio-src/score.py && python audio-src/docs.py`. Every scene length, cut
point, caption and music cue follows the new voice (scenes are duration-elastic). Re-check stills at the scene boundaries,
then render.

## 4. Tests
```bash
npm test                 # factual + asset checks (+ render checks once the MP4s exist)
npm test -- --live       # also re-verifies every quote against the live kimi.ai article and Kimi Code docs
node node_modules/typescript/bin/tsc --noEmit
```

## 5. Final render (1080p, 30 fps)
```bash
node scripts/render.mjs master     # -> ../KIMI_K31_PRO_MASTER_16x9.mp4
node scripts/render.mjs reel       # -> ../KIMI_K31_PRO_REEL_9x16.mp4
```
Renders in resumable chunks (`out/segments/<variant>/`, delete them to force a re-render after changes), H.264 CRF 16/17,
yuv420p, bt709, AAC 320 kb/s 48 kHz, faststart. 4K master: `node scripts/render.mjs master --scale 2` (writes a separate
`_2160p` file; slow on an integrated GPU).

## 6. QA
```bash
python ../../../analysis/reel_qa.py ../KIMI_K31_PRO_REEL_9x16.mp4     # repo reel QA (9:16 checks)
python scripts/qa.py                                                 # ffprobe, blackdetect, freezedetect, ebur128, contact sheets
```
