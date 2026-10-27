# PROGRESS — Railway / AI-security reel (TechpeTrek)

Resume: read this, `MASTER_PROMPT_CLAUDE.md`, `SOURCE/docs/BUILD_RULES.md`, then `git -C SOURCE log --oneline -15`.

- Engine: Remotion 4 + Three.js (the user's original spec asked for Remotion; the kit is reused from projects/kimi-k31-pro), in
  `SOURCE/`, 1080×1920 @ 60 fps, 120 BPM. Concept: **THE AI SECURITY CASE BOARD** (3D evidence board, red-string travel, case
  cards that fly to camera and become 2D CASE FILE cards, 3D key-in-lock checklist, pull-back CTA).
- Voice: ElevenLabs has 8 credits (needs ~240) → SCRATCH Hinglish guide voice (edge-tts hi-IN-MadhurNeural) for timing;
  swap: `python audio-src/vo.py reel --stt` once credits exist, then timing.py → score.py reel → render.
- Status (2026-10-26): research gate running (FACTS.md, cases.json, receipts, SOURCES_CHECKLIST.md); builders running:
  board (BoardLayer + three/CaseBoard*), card (CardLayer + CaseCard + carousel), media (src/media/*). Lead: script, VO,
  timing, music/SFX/mix, overlays, assembly, QA.

## 2026-10-26 (lead) — build complete, ready to render
- Board (3D case board, src/three/CaseBoard*.tsx) + media (11 anims, src/media/) + cards (src/components/) all integrated; tsc clean.
- Fixes by lead: hook chip = two lines (Overlays.tsx); 3D headline wordSpacing matches the 2D card (no hand-off ghost);
  media cuts follow narration words (mediaPlan.json `word`, CardLayer cueFor, MediaWindow mediaSchedule cueAt);
  wide receipt strips: zoom limited so the pan reaches the quote's end, short strips centred (MediaWindow strip mode).
- Stills: scripts/stills.mjs <bundle> <out> <frames>  (one browser). Full-reel sheets in SOURCE/out/wip/full, cue checks in out/wip/cue*.
- Carousel PNGs: output/carousel/slide_1..8.png (5 cases; reuters only in the CTA index). SRT: output/railway_ai_security_reel.srt.
- STT (scratch voice): dry 45/48, mix 45/48 (misses: "builds", "LiteLLM", "Reuters" accent). Re-check after the Liam swap.
- Post kit: output/POST_KIT.md. Cover: output/cover_9x16_frame60.png.
- NEXT: full render `node scripts/render.mjs` (ask user first), then reel_qa.py + scripts/qa.py + stt_check.py reel.

## 2026-10-26 (lead) — RENDERED + QA'd
- output/railway_ai_security_reel_1080x1920_60fps.mp4 (62.25 s, 3735 f, 60 fps). reel_qa 8/8, no black/freeze, -14.0 LUFS,
  STT 45/48 on the MP4. Hook redone after the user's ask: power line (GPT hook #2) -> tease at f240; hook SFX re-timed
  (whoosh 0.95 s, 5 twangs 2.0-4.0 s; new `twang` in score.py). Only hook chunks c000/c001 re-rendered.
- QA record: output/QA.md. Voice still scratch.

## 2026-10-26 (lead) — V2 built, waiting for Liam credits
- V2 = user's long hook (kinetic IntroLayer: intro1-3, all cues = spoken words via src/lib/words.ts) + board hook "5 BADE CASES"
  + "Number one..five" slams (Overlays NumberSlam) + cut flashes + karaoke captions; cases renumbered 1,1,2,3,4,5 (cases.json n).
- Version switch: src/data/version.ts (VERSION 'v2'); SCENE_TIMINGS.v2.json; voScript.v2.json; cues.v2.json (word cues "w");
  mix public/audio/mix_reel_v2.wav; render.mjs/qa.py/stt_check.py follow the version (output railway_ai_security_reel_v2_...mp4).
- Current V2 timing = Edge GUIDE voice (+50%), 81.0 s — NOT for delivery. ElevenLabs: 7 credits left, 271 needed (quota 40,000/month used).
- After the user adds credits:  python audio-src/vo.py reel --version v2 --seed 5  →  python scripts/stt_check.py reel --version v2 --dry
  →  python audio-src/timing.py --version v2  →  python audio-src/score.py reel --version v2  →  stills  →  node scripts/render.mjs (ask)
  →  reel_qa.py + qa.py --version v2 + stt_check.py reel --version v2.
- V1 outputs renamed *_v1* in output/ (kept).
- 2026-10-26: V2 GUIDE-VOICE preview rendered (user asked; Liam still blocked): output/railway_ai_security_reel_v2_GUIDE-VOICE_preview_1080x1920_60fps.mp4
  (81.0 s, 4860 f; reel_qa 8/8, no black/freeze, -14.0 LUFS, -1.4 dBTP). Before the Liam render: delete out/segments/reel_v2 (timings change).
