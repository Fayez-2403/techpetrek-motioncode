# PROGRESS

Resume: read this file, then `git log --oneline -20`. Lead + parallel scene builders (rules: docs/SCENE_BUILD_RULES.md).
The user asked to build everything in one pass rather than gate by gate.

## Gates
| Gate | Status |
|---|---|
| 1 Research | ✅ ENVIRONMENT.md, REFERENCE_ANALYSIS.md (reference downloaded + inspected), FACT_CHECK.md, verifiedClaims.ts locked (2026-10-24) |
| 2 Storyboard | ✅ STORYBOARD.md, VOICEOVER_HINGLISH.md (generated), SCENE_TIMINGS.json (from narration), word budget fits every scene |
| 3 Style frames | ✅ hero reveal, CAD lab, intelligence engine (stills in out/wip/lead/) |
| 4 Animatic | ✅ all 12 scenes registered; stubs replaced as scenes land |
| 5 Full animation | ✅ all 12 scenes built to style-frame quality, both formats (lead: 02, 03, 05, 12; builders: 01+04 codeworld, 06 humanlab, 07+08 analytics, 09–11 evidence) |
| 6 Sound | ✅ procedural score + SFX + mix at -14 LUFS (audio-src/score.py); narration = SCRATCH guide voice |
| 7 Full render | ✅ 1080p30 master (138.6 s) + reel (69.3 s), chunked + resumable (scripts/render.mjs) |
| 8 Final audit | ✅ live fact re-check 192/192, QA_REPORT.md (format, black/freeze, loudness, reel_qa 8/8, STT recall, A/V sync, determinism, string read-through) |

## Versions
- **v1** Hinglish (scratch voice): `KIMI_K31_PRO_MASTER_16x9_v1.mp4` (138.6 s), `KIMI_K31_PRO_REEL_9x16_v1.mp4` (69.3 s) — git tag v1.
- **v2** English (edge-tts en-US-BrianNeural): `KIMI_K31_PRO_MASTER_16x9_v2.mp4` (130.2 s), `KIMI_K31_PRO_REEL_9x16_v2.mp4` (67.2 s).
  Pipeline: every audio script takes `--version v2`; `node scripts/render.mjs <cut> --version v2`.
- **v3** music-only 90.0 s rotate-your-phone showcase: `KIMI_K31_PRO_SHOWCASE_ROTATE_9x16_v3.mp4` (src/v3, docs/V3_BUILD_RULES.md,
  `python audio-src/score_v3.py`, `node scripts/render_v3.mjs reel`; a 16:9 cut renders with `node scripts/render_v3.mjs landscape`).

## Known issues / compromises so far
- **Voice is SCRATCH.** ElevenLabs key has 8 credits left (needs ~330 master + ~190 reel). Scratch guide = Microsoft Edge TTS
  hi-IN-MadhurNeural (free online service, used for timing only). Swap path: audio-src/vo.py (ElevenLabs) or audio-src/align.py
  (recorded WAV) → timing.py → score.py. align.py tested on the scratch track: line split exact, phrase timing median error 0.02 s,
  worst 1.9 s.
- Master runs 138.6 s (brief target ~110 s): the Hinglish narration's natural length at an energetic pace; scenes were lengthened
  rather than lines crammed (as the brief directs). The reel is 69.3 s.
- No category A footage (no Kimi account/API). All demos are B (illustrative reconstruction) or C (concept visualization), labelled.
- Official Moonshot demo videos and logos not used (third-party rights) — see ASSET_SOURCES.md.
- Remotion licence: free for individuals / companies ≤ 3 employees (flagged in ENVIRONMENT.md).

- Not rendered: 4K / 60 fps master (CLAUDE.md asks before 4K renders; the 1080p pass took ~20 min, a 4K pass would take
  roughly 4x on this GPU). Command ready: `node scripts/render.mjs master --scale 2`.

## Next (when the user is ready)
1. Final voice: add ElevenLabs credits (~520) → `python audio-src/vo.py master --stt` / `reel --stt`, or record VOICEOVER_HINGLISH.md
   and run `python audio-src/align.py <wav> --variant <cut>`; then timing.py → score.py → docs.py → delete out/segments → render.
2. Re-check the weights status after 2026-11-04 (tests will fail until updated).
3. Optional: 4K master.
