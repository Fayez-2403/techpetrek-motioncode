# Review log: PaperPilot: your PDFs, your device

## Round 1: look-dev stills, 22 frames (2026-10-29)
| Category | Score |
|---|---|
| Opening hook clarity and strength | 8 |
| Product/source accuracy | 9 (every on-screen claim maps to F1-F11; real receipts from T1-T4) |
| Mobile readability (360 px phone test) | 6 (OCR words, GitHub header and engine cards too small) |
| Composition, camera continuity, depth | 7 |
| Motion quality, easing | n/a (stills) |
| Scene variety, retention | 8 |
| Music/voice/SFX sync | n/a (no mix yet) |
| Actor/mascot/product consistency | 8 (one paper-sheet object class throughout; official icon) |
| Media rights and attribution | PASS (verify_assets 16/16) |
| Overall polish | 7 |

Three biggest problems:
1. **Scan text at 19.7 s (f1180) was too small.** The receipt words filled only the top-left of a full A4 scan, at about 22 px on a 1080 frame.
   - **Fix:** crop to the text block (source 60..760 × 140..700) and draw it 720 px wide, about 2.7× larger.
   - The OCR boxes and the beam were recomputed for the crop.
2. **The GitHub header was unreadable at 49.8 s (f2990) and the final card was small (f3250).**
   - The 2.3× zoom pivoted at 12 % and cut "KrushnaVardhanReddy" off the left edge.
   - The card ended at 0.66 scale.
   - **Fix:** a 2.6× zoom pivoting on the left edge (0 % 11 %), and the final card at 0.8 scale.
3. **Collisions.**
   - The hook PDF landed on the "Ye dekho!" caption (5.7 s): the window moved up 80 px and the PDF target moved up 145 px.
   - The demo core label hit the report.pdf tag (38.3 s): the core moved to y 1235.
   - The MCP tracer line struck through the ghost terminal text (30.5 s): the terminal now fades fully while the letters are up.
   - The pause label was a broken glyph ("⏸"): it now reads "UPLOAD PAUSED".
   - The engine node cards grew from 300×196 to 340×222.

## Round 2: same stills after the fixes
The OCR words read on a phone, and the hook, demo and MCP are clear. Readability 8, composition 8.

## Round 3: 540x960 motion check with sound
| Category | Score |
|---|---|
| Opening hook clarity and strength | 9 |
| Product/source accuracy | 9 |
| Mobile readability (360 px phone test) | 8 |
| Composition, camera continuity, depth | 8 |
| Motion quality, easing | 8 |
| Scene variety, retention | 9 |
| Music/voice/SFX sync | 7 (RUKO masked; PDFs mispronounced) |
| Actor/mascot/product consistency | 9 |
| Media rights and attribution | PASS |
| Overall polish | 8 |

Problems found and fixed:
1. **User note: "PDFs" was said as four letters, P-D-F-S** ("pronounciztion pof PDFs is wronf").
   - Scribe had normalised the word to "PDFs" and hidden the error. Whisper showed "पी .डी .एफ .एस".
   - **Fix:** the TTS text now says पीडीएफ्स in h01 and l06. Whisper now hears "pdf's" and "private PDFs", and Scribe on the master hears all 8 lines word for word.
2. **RUKO! (0.6 s) was masked in the mix** (Whisper missed it). The subImpact and scratch sat on the word.
   - **Fix:** the impact and glass now land 0.3 s after the word, and the scratch was cut to 0.45 gain. Scribe on the mixed hook hears "रुको!".
3. **41.3-43.0 s, the success hero shot, was static-ish for 1.68 s.**
   - **Fix:** the sheet floats ±10 px with a 2.2° sway and a 4 % creep, a sheen sweeps across it, and the check pulses.
   - The camera push went back from 3 % to 4.5 %.
   - After the fix, the longest static-ish stretch is 1.07 s (an OCR beam hold), with no frozen stretch.

## Round 4: 1080x1920 final
1. **The re-voice made the hook 0.25 s shorter, so every cut moved off the 120 BPM grid** (cut sync fell to 1/10, hits 127-243 ms late). The audio mux was exact (cross-correlation lag 0 ms).
   - **Fix:** hook min set to 6.5 s, which puts every cut back on the beat and the length back to 55.00 s. Cut sync is 9/10 again.
   - The superseded master is kept as `out/*_v1-offbeat_*`.
2. **The cover credit ran under the Tech Pe Trek logo, and the icon's grey backdrop square showed under the glow.**
   - **Fix:** `Logo` crops the icon to its rounded tile (source px 70..442), and the credit is shortened.
   - Only 4 of 17 chunks were re-rendered.

**Final numbers:**
- reel_qa: 7/7.
- look.py: G0 / G2 / G3 PASS; no frozen stretch; end hold 0.00 s; final shot 11 %.
- Cut sync: 9/10.
- Loudness: -14.2 LUFS, true peak -1.9 dBFS.
- Strobe: 0.
- Mean luma change: 1.2/255. This is the dark world again (as on M6), accepted.
- Scribe on the master: 8/8 lines.

## Retro (rules for the next reel)
- Write plural acronyms phonetically (पीडीएफ्स) and check them with a literal STT (faster-whisper on a clip around the word). Scribe normalises spellings.
- After any re-voice, check that scene starts are still on the beat grid. Pin the hook `min` to a whole beat so later cuts can't drift to off-eighths.
- Never stack a sub impact on top of the hook word. Let the voice be the interruption and hit just after it.
- Crop third-party app icons to their tile: icon files often carry a backdrop that shows under a glow.
