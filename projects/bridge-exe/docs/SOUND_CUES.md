# Sound cues (scripts/audio/mix_bridge.py)

Original score, synthesized in numpy/scipy (no samples, no songs). 120 BPM, A minor (Am F C G), bar 1 at 0.0 s, so every
section edge is a downbeat. Beat grid: audio/out/beats_bridge.json. Every SFX time comes from audio/out/reel_events.json,
which web/scripts/export_events.ts reads from the running ?reel=1 page (the frames' own events).

| Time | Cue |
|---|---|
| 0.0 | sub impact + struck-steel ring (inharmonic partials) + A drone; membrane toms quicken to 4.0 |
| 4.0 | the lift: strings + wind only while the camera cranes out of the gorge |
| 12.0–13.5 | a magnetic click + mechanical click on each span step (one per beat) |
| 14.45 | mag-lock as the cursor grabs T4; 14.75–16.25 a rising click per 0.25 m snap (eighths) |
| 18–21.9 | drive groove: kick + dhol-like dha/tin membranes (original synthesis); truck rumble under the drive-in |
| 22.7–24.0 | **the drop**: music silent; RUN press click at 22.9; solver tones + impact at 23.03 (run R001) |
| 24.0 | groove returns on the downbeat |
| 26–35 | analysis pulse (16th plucks in the chord) + snare on 2 and 4; a whoosh + tick on each lens switch (26.0, 27.5, 28.9, 32.4) |
| 36.9–39.6 | snare accents as the A/B delta rows land |
| 44–48 | metallic code-to-CAD hits as each artifact card arrives; typing |
| 51.3 | arcade: sub hit at the release, whoosh; struck-metal on Rapier break events, thuds on impacts, splashes on river entries |
| 57–63 | proof: no kick, softer pulse, typing under the evidence card |
| 63.0 | heroic resolve (A major strings, bells A-C#-E-A); CTA chime on "comment" (≈64.6) |

Mix: voice 1.0; music × 0.42 ducked 70 % under the voice envelope; SFX × 0.7. Master: ffmpeg loudnorm two-pass to −14 LUFS,
−1.5 dBTP (measured −14.1 LUFS, peak −1.5 dBFS). A music-only master (no VO) is public/audio/music_only_bridge.wav.
