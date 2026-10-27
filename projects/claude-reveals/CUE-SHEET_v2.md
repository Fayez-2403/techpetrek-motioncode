# Music and sound cue sheet, v2 (exact frame timings)

v1 (the 94 s cut): `CUE-SHEET_v1.md`.

Original score, synthesized by `analysis/reveals_music.py` (no samples, no third-party audio): 120 BPM, beat 0.5 s,
bar 2.0 s, 38 bars, 76.0 s. Frames are at 60 fps (frame = round(t x 60)). Mixed by `analysis/reveals_mix.py`.
v2 level (user, 2026-10-21): music 0.26 (v1 0.62), ducking about 15 dB under the voice, foley 0.30. The voice sits about 12 dB
over everything else while it speaks. -14 LUFS, true peak under -1 dBTP.

## Sections
| Section | Start (s / frame) | End (s / frame) | Music |
|---|---|---|---|
| hook | 0.00 / 0 | 4.00 / 240 | a tense drone with clock ticks under the two WHATs (hits at 0.0 and 1.25 s), a rising whoop, the bass drop at 2.5 s, groove into the post |
| posted | 4.00 / 240 | 14.50 / 870 | ticking 16th hats, a pulse bass, the pad opening (curiosity), a soft riser into 01 |
| r1 | 14.50 / 870 | 26.00 / 1560 | electro-funk groove: kick on 1, the and-of-2 and 3; claps on 2 and 4; syncopated bass; off-beat chord stabs |
| r2 | 26.00 / 1560 | 33.50 / 2010 | the same groove |
| r3 | 33.50 / 2010 | 47.00 / 2820 | quirky pizzicato melody, lighter drums |
| r4 | 47.00 / 2820 | 57.00 / 3420 | futuristic: a saw bass pulsing on the beat, a 16th arpeggio, four-on-the-floor |
| r5 | 57.00 / 3420 | 69.00 / 4140 | two soft heartbeats (57.0, 58.0 s), then an orchestral-electronic build: string swells, toms, the beat doubling up |
| final | 69.00 / 4140 | 76.00 / 4560 | the victorious impact at 69.0 s, F - G - C major, the last hit at 75.0 s, the C chord rings out |

## Slides between the reveals (each starts as a line ends; a soft swish on each)
| Slide | Start (s / frame) | End (s / frame) |
|---|---|---|
| post -> 01 | 14.00 / 840 | 14.50 / 870 |
| 01 -> 02 | 25.50 / 1530 | 26.00 / 1560 |
| 02 -> 03 (font) | 33.00 / 1980 | 33.50 / 2010 |
| 03 font -> 03 haiku | 41.00 / 2460 | 41.50 / 2490 |
| 03 -> 04 | 46.50 / 2790 | 47.00 / 2820 |
| 04 -> 05 | 56.50 / 3390 | 57.00 / 3420 |

## Landing stings (soft; one identity, a little bigger from 01 to 05)
| Reveal | t (s) | Frame |
|---|---|---|
| 01 | 14.50 | 870 |
| 02 | 26.00 | 1560 |
| 03 | 33.50 | 2010 |
| 04 | 47.00 | 2820 |
| 05 | 57.00 | 3420 |

- Impacts (s): 2.50 (f150), 14.50 (f870), 26.00 (f1560), 33.50 (f2010), 47.00 (f2820), 57.00 (f3420), 69.00 (f4140), 75.00 (f4500)
- Planned silences: none

## Foley (synthesized, every cue on an event)
| t (s) | Frame | Sound | Gain |
|---|---|---|---|
| 0.00 | 0 | slap | 0.7 |
| 1.00 | 60 | whoosh | 0.7 |
| 1.25 | 75 | slap | 0.85 |
| 2.45 | 147 | chair | 0.6 |
| 2.75 | 165 | boing | 0.9 |
| 2.75 | 165 | confetti | 0.7 |
| 3.50 | 210 | thud | 0.6 |
| 3.60 | 216 | dive | 0.7 |
| 4.20 | 252 | pop | 0.35 |
| 4.25 | 255 | tick | 0.35 |
| 5.50 | 330 | tick | 0.4 |
| 8.75 | 525 | scroll | 0.3 |
| 9.50 | 570 | scroll | 0.3 |
| 10.25 | 615 | scroll | 0.3 |
| 11.00 | 660 | scroll | 0.3 |
| 11.75 | 705 | scroll | 0.3 |
| 12.25 | 735 | tick | 0.4 |
| 12.50 | 750 | scroll | 0.3 |
| 14.00 | 840 | swish | 0.55 |
| 16.25 | 975 | tick | 0.3 |
| 24.25 | 1455 | tick | 0.3 |
| 25.50 | 1530 | swish | 0.55 |
| 27.25 | 1635 | scribble | 0.4 |
| 31.50 | 1890 | scribble | 0.35 |
| 33.00 | 1980 | swish | 0.55 |
| 36.40 | 2184 | swish | 0.4 |
| 38.50 | 2310 | stamp | 0.45 |
| 41.00 | 2460 | swish | 0.55 |
| 43.00 | 2580 | tick | 0.3 |
| 46.50 | 2790 | swish | 0.55 |
| 53.00 | 3180 | zap | 0.35 |
| 54.65 | 3279 | peek | 0.45 |
| 56.50 | 3390 | swish | 0.55 |
| 57.00 | 3420 | beep | 0.35 |
| 58.00 | 3480 | beep | 0.35 |
| 69.75 | 4185 | clink | 0.45 |
| 70.50 | 4230 | slap | 0.55 |
| 70.75 | 4245 | slap | 0.55 |
| 72.00 | 4320 | whoosh | 0.5 |
| 72.75 | 4365 | pop | 0.45 |

Kicks: 90, claps: 42. The full grid, events and voice lines: `output/reveals_beatmap.json`.
