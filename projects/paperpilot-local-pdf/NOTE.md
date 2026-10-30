# PaperPilot reel: notes

- **Master:** `out/paperpilot-local-pdf_v1_reel_1080x1920_60fps.mp4`. 55.00 s, 3300 frames, 1080x1920, 60 fps, H.264 yuv420p bt709, AAC 48 kHz stereo.
- **Cover:** `out/cover.png`. **Post kit:** `post/`.

## Gates
- **reel_qa:** 7/7 PASS.
- **motionmaxxing look.py:**
  - G0 PASS (55.00 s, audio present);
  - G2 PASS (no run of more than 3 flat frames);
  - G3 PASS (end hold 0.00 s, ends mid-motion as briefed: "immediate cut"; final shot 5.97 s = 11 %).
- **Eye checks on `out/qa/look/sheet.jpg`:**
  - G1, proof readable: network receipt, OCR words, tool names, repo header.
  - G4, one hero per frame: PASS by eye.
- **No frozen stretch.** Longest static-ish stretch 1.07 s.
- **Cut sync:** 9/10 cuts within ±80 ms of a sound onset.
- **Loudness:** -14.2 LUFS integrated, true peak -1.9 dBFS, LRA 2.9 LU.
- **measure.py strobe:** 0 frames.
- **STT:** Scribe on the master hears 8/8 lines word for word. faster-whisper (second opinion) confirms "PDFs" is said as a plural.
- **Mean luma change:** 1.2/255, below the human band: a dark world, accepted, with camera push and drift everywhere.

## Receipts
See `docs/factcheck.md` T1-T4: the real MCP, Claude Code, browser and OCR runs on 2026-10-29.
