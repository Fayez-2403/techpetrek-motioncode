# Music and sound cue sheet, v3 (exact frame timings)

v2 (76 s, two WHATs): `CUE-SHEET_v2.md`; v1 (94 s): `CUE-SHEET_v1.md`.

Original score, synthesized by `analysis/reveals_music.py` (no samples, no third-party audio): 120 BPM, beat 0.5 s,
bar 2.0 s, 73.5 s. Frames are at 60 fps (frame = round(t x 60)). Mixed by `analysis/reveals_mix.py`:
music 0.26 (v1 0.62), ducking about 15 dB under the voice, foley 0.30. The voice sits about 12 dB over everything else while it
speaks. -14 LUFS, true peak under -1 dBTP.

## Sections
| Section | Start (s / frame) | End (s / frame) | Music |
|---|---|---|---|
| hook | 0.00 / 0 | 1.50 / 90 | a tense drone with clock ticks under the one WHAT (a hit at 0 s), a whoosh into the dive, an impact as the post lands (1.5 s) |
| posted | 1.50 / 90 | 12.00 / 720 | ticking 16th hats, a pulse bass, the pad opening (curiosity), a soft riser into 01 |
| r1 | 12.00 / 720 | 23.50 / 1410 | electro-funk groove: kick on 1, the and-of-2 and 3; claps on 2 and 4; syncopated bass; off-beat chord stabs |
| r2 | 23.50 / 1410 | 31.00 / 1860 | the same groove |
| r3 | 31.00 / 1860 | 44.50 / 2670 | quirky pizzicato melody, lighter drums |
| r4 | 44.50 / 2670 | 54.50 / 3270 | futuristic: a saw bass pulsing on the beat, a 16th arpeggio, four-on-the-floor |
| r5 | 54.50 / 3270 | 66.50 / 3990 | two soft heartbeats (54.5, 55.5 s), then an orchestral-electronic build: string swells, toms, the beat doubling up |
| final | 66.50 / 3990 | 73.50 / 4410 | the victorious impact at 66.5 s, F - G - C major, the last hit at 72.5 s, the C chord rings out |

## Slides between the reveals (each starts as a line ends; a soft swish on each)
| Slide | Start (s / frame) | End (s / frame) |
|---|---|---|
| post -> 01 | 11.50 / 690 | 12.00 / 720 |
| 01 -> 02 | 23.00 / 1380 | 23.50 / 1410 |
| 02 -> 03 (font) | 30.50 / 1830 | 31.00 / 1860 |
| 03 font -> 03 haiku | 38.50 / 2310 | 39.00 / 2340 |
| 03 -> 04 | 44.00 / 2640 | 44.50 / 2670 |
| 04 -> 05 | 54.00 / 3240 | 54.50 / 3270 |

## Landing stings (soft; one identity, a little bigger from 01 to 05)
| Reveal | t (s) | Frame |
|---|---|---|
| 01 | 12.00 | 720 |
| 02 | 23.50 | 1410 |
| 03 | 31.00 | 1860 |
| 04 | 44.50 | 2670 |
| 05 | 54.50 | 3270 |

- Impacts (s): 1.50 (f90), 12.00 (f720), 23.50 (f1410), 31.00 (f1860), 44.50 (f2670), 54.50 (f3270), 66.50 (f3990), 72.50 (f4350)
- Planned silences: none

## Foley (synthesized, every cue on an event)
| t (s) | Frame | Sound | Gain |
|---|---|---|---|
| 0.00 | 0 | slap | 0.7 |
| 1.00 | 60 | dive | 0.7 |
| 1.70 | 102 | pop | 0.35 |
| 1.75 | 105 | tick | 0.35 |
| 3.00 | 180 | tick | 0.4 |
| 6.25 | 375 | scroll | 0.3 |
| 7.00 | 420 | scroll | 0.3 |
| 7.75 | 465 | scroll | 0.3 |
| 8.50 | 510 | scroll | 0.3 |
| 9.25 | 555 | scroll | 0.3 |
| 9.75 | 585 | tick | 0.4 |
| 10.00 | 600 | scroll | 0.3 |
| 11.50 | 690 | swish | 0.55 |
| 13.75 | 825 | tick | 0.3 |
| 21.75 | 1305 | tick | 0.3 |
| 23.00 | 1380 | swish | 0.55 |
| 24.75 | 1485 | scribble | 0.4 |
| 29.00 | 1740 | scribble | 0.35 |
| 30.50 | 1830 | swish | 0.55 |
| 33.90 | 2034 | swish | 0.4 |
| 36.00 | 2160 | stamp | 0.45 |
| 38.50 | 2310 | swish | 0.55 |
| 40.50 | 2430 | tick | 0.3 |
| 44.00 | 2640 | swish | 0.55 |
| 50.50 | 3030 | zap | 0.35 |
| 52.15 | 3129 | peek | 0.45 |
| 54.00 | 3240 | swish | 0.55 |
| 54.50 | 3270 | beep | 0.35 |
| 55.50 | 3330 | beep | 0.35 |
| 67.25 | 4035 | clink | 0.45 |
| 68.00 | 4080 | slap | 0.55 |
| 69.50 | 4170 | whoosh | 0.5 |
| 70.25 | 4215 | pop | 0.45 |

Kicks: 88, claps: 41. The full grid, events and voice lines: `output/reveals_beatmap.json`.
