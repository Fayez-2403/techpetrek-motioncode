# QA REPORT (2026-10-24)

Files inspected: `projects/kimi-k31-pro/KIMI_K31_PRO_MASTER_16x9.mp4` and `projects/kimi-k31-pro/KIMI_K31_PRO_REEL_9x16.mp4`
(final renders after the last audio re-mux). Raw data: `out/qa/qa_<variant>.json`, `out/qa/stt_*.json`, contact sheets
`out/qa/<variant>/contact_1fps.jpg`, close-ups `out/qa/<variant>/*.jpg`.

## Format (ffprobe)
| | Master | Reel |
|---|---|---|
| Duration | 138.60 s (4158 frames) | 69.30 s (2079 frames) |
| Size / fps | 1920×1080, 30 fps | 1080×1920, 30 fps |
| Video | H.264, yuv420p, bt709, ~6.2 Mb/s (CRF 16) | H.264, yuv420p, bt709, ~4.9 Mb/s (CRF 17) |
| Audio | AAC 320 kb/s, 48 kHz stereo | AAC 320 kb/s, 48 kHz stereo |
| File size | 108 MB | 43 MB |

## Picture
- **blackdetect** (d ≥ 0.2 s, pix_th 0.06): master 66.93–67.43 s and 133.17–133.43 s; reel 65.90–66.17 s. All intentional and inspected:
  66.9 s is the human-lab → finance hand-off (a single mint knee-angle line on the dark lab, not a black frame); 133.2 s / 65.9 s
  is the dip into the end card. No unintended black.
- **freezedetect** (≥ 1.2 s): master 135.9–138.6 s = the end-card hold (intentional). Reel: none.
- **Contact sheets** (1 fps, both cuts) reviewed in full; **close-ups** reviewed: first frame, 0.5–3.0 s, every scene midpoint,
  every cut ±2 frames, last frame. Every cut lands on its designed hand-off (point → sphere, tile rows → code rows, gear → fan disk,
  dimension arc → hip joint, knee line → revenue line, mint bar → chart axis, two rails → timelines, square → cube).
- **Frame 0** is the finished turbine (no black, no fade); the first line of narration starts at 0.2 s.
- **Safe zones (reel):** all scene content inside y 260–1360; captions above the bottom 420 px; the independent-production note
  moved above the captions. Fixed during QA: reveal lockup under the captions, BenchCAD panel attribution under the captions,
  engine overlapping the CAD header.
- **Montage:** fixed during QA — two shots originally caught numbers mid-count (OfficeQA "0.0", BenchCAD "81.8"); offsets now land
  only on finished values (checked frame by frame).
- **Determinism:** the same frame rendered twice is byte-identical (master f1250 3D CAD frame, reel f150 hook), and each scene
  builder verified the same for their scenes.
- **On-screen strings:** read through (dump of every visible string in scenes, components and data): model names consistent
  (Kimi K3.1 Pro, K3.1 Pro Highspeed, Claude Opus 5.5, GPT-6 Astra, Kimi K3), every number carries its qualifier, labels present.

## Sound
| | Master | Reel |
|---|---|---|
| Integrated loudness | −14.0 LUFS | −14.0 LUFS |
| True peak | −1.5 dBFS | −2.6 dBFS |
| Loudness range | 3.2 LU | 3.2 LU |
- `analysis/reel_qa.py` (repo reel QA) on the reel: **8/8 pass** with the planned "digital silence" beat before the reveal hit declared
  (`--allow-silence 5.05-5.45`; without it the only failure is that one deliberate 0.3 s silence).
- **Intelligibility** (local faster-whisper, key numbers and names recovered per line): master dry voice 29/30, final mix **30/30**;
  reel dry voice 20/21, final mix **20/21** (after lowering the open-weight "unfold" effect and ducking effects −6 dB under the voice;
  before that fix the reel mix lost "4 November").
- **A/V sync spot check** (heard word time vs caption word time for 65.7, 11.2, 92.7, 64.4, 167, 420 in both cuts): median offset
  0.17 s, max 1.18 s (master "64.4": the caption card is on screen for the whole phrase; the word highlight inside a long phrase
  is spread by length, so it trails the spoken number). Scene cuts and caption cards follow the narration timing exactly
  (they are generated from it).

## Facts
- `npm test -- --live` (2026-10-24): **192/192 factual checks** (every quote found in the saved snapshot *and* on the live
  kimi.ai article / Kimi Code docs; qualifiers present; N values match quotes; honest axes; no hard-coded claim values in any
  scene, component or 3D file; narration numbers all verified; no forbidden framing), **23/23 asset checks**, **12/12 render checks**.
- Weights: "by Nov 4, 2026" is still in the future on 2026-10-24 → wording "planned". The test suite will fail after that date
  until the status is re-checked.

## Open items (not defects of the files, but limits of this delivery)
- **Narration is a SCRATCH guide voice** (Microsoft Edge TTS hi-IN-MadhurNeural). It is intelligible and correctly timed, but it is
  not the channel's voice and is not cleared for publishing. ElevenLabs had 8 credits left. Speech-to-text of the scratch voice
  shows some English words in a Hindi accent (e.g. "build" heard as "belt" in Hindi-mode transcription; English-mode recovers it).
  The final voice must be re-checked with `python audio-src/vo.py <cut> --stt` or `scripts/stt_check.py` after the swap.
- 4K / 60 fps master not rendered (see PROGRESS.md).

---

# V2 (English) — QA, 2026-10-24
| | Master `KIMI_K31_PRO_MASTER_16x9_v2.mp4` | Reel `KIMI_K31_PRO_REEL_9x16_v2.mp4` |
|---|---|---|
| Duration / size / fps | 130.20 s, 1920×1080, 30 fps | 67.20 s (2016 frames), 1080×1920, 30 fps |
| Codecs | H.264 yuv420p bt709 + AAC | H.264 yuv420p bt709 + AAC |
| Loudness | −14.0 LUFS, −1.5 dBTP, LRA 3.0 | −14.0 LUFS, −1.4 dBTP, LRA 3.1 |
- Narration: en-US-BrianNeural (edge-tts), English captions; every scene's word cues re-checked (English alternates added for
  "Bas"/"thoda"/"Abhi"; montage cuts found by word, not index). End card CTA in English.
- blackdetect: master 61.9–62.6 s (human → finance knee-line hand-off) and 125.2 s (end-card dip); reel 34.1 s (same hand-off) and
  64.7 s. freezedetect: master 98.0–99.7 s = the Terminal-Bench chart holding still while the numbers are read (deliberately restrained
  data shot) and the end-card hold. All intentional.
- `analysis/reel_qa.py` on the V2 reel: **8/8**.
- Intelligibility (key numbers + names heard, English-mode faster-whisper): master **27/30**, reel **19/21**; the remaining misses are
  spelling only ("Kimi" transcribed "Kimmy" — the right KEE-mee sound — and "2" written "two"). Fixed during QA: "420 reviews" was
  heard as "for 120 reviews" (dry voice too) → that line now says "four hundred and twenty".
- Tests: 212/212 factual (now covering both scripts; also caught and fixed stray backspace characters that had weakened four regex
  checks), 23/23 assets, render checks pass for v1 + v2.

# V3 (rotate-your-phone showcase) — QA, 2026-10-24
`KIMI_K31_PRO_SHOWCASE_ROTATE_9x16_v3.mp4`: **90.000 s exactly** (2700 frames), 1080×1920, 30 fps, H.264 yuv420p + AAC, −13.9 LUFS,
−2.8 dBTP. No black or frozen stretches detected. Bars 0–1 upright "rotate your phone" card; from 4.0 s the 16:9 film runs rotated
90° clockwise (turn the phone left to watch full screen). Every shot starts on a downbeat of the 120 BPM score; cut-to-onset
alignment measured 10–55 ms. Contact sheet + upright checks reviewed (out/qa/v3/). Text kept inside the rotated-reel safe band.
