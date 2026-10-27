# Music and sound cue sheet (exact frame timings)

Original score, synthesized by `analysis/reveals_music.py` (no samples, no third-party audio): 120 BPM, beat 0.5 s,
bar 2.0 s, 47 bars, 94.0 s. Frames are at 60 fps (frame = round(t x 60)). Mixed by `analysis/reveals_mix.py`:
the music ducks about 8 dB under the voice (sidechain from the voice envelope); -14 LUFS, true peak under -1 dBTP.

## Sections
| Section | Start (s / frame) | End (s / frame) | Music |
|---|---|---|---|
| hook | 0.00 / 0 | 7.00 / 420 | three hits on the three WHATs, a one-beat hush at 3.5 s, a rising whoop, the bass drop at 5.0 s, a bar of groove |
| posted | 7.00 / 420 | 17.00 / 1020 | ticking 16th hats, a pulse bass, the pad opening (curiosity), a riser into the countdown |
| r1 | 17.00 / 1020 | 30.00 / 1800 | electro-funk groove: kick on 1, the and-of-2 and 3; claps on 2 and 4; syncopated slap-style bass; off-beat chord stabs |
| r2 | 30.00 / 1800 | 41.00 / 2460 | the same groove (playful) |
| r3 | 41.00 / 2460 | 59.00 / 3540 | quirky pizzicato melody, lighter drums; everything stops on the paper rip (58.75 s) |
| r4 | 59.00 / 3540 | 73.00 / 4380 | electromagnetic hum in the dark, then from 61.75 s a saw bass pulsing on the beat, a 16th arpeggio, four-on-the-floor |
| r5 | 73.00 / 4380 | 88.00 / 5280 | heartbeats (73.0, 74.0, 74.75 s), the 05 sting, then an orchestral-electronic build: string swells, toms, the beat doubling |
| final | 88.00 / 5280 | 94.00 / 5640 | the victorious impact at 88.0 s, F - G - C major lift, the last hit at 93.0 s, the C chord rings out |

## Numbered-card stings (one sonic identity, bigger from 01 to 05)
| Card | t (s) | Frame | Sting |
|---|---|---|---|
| 01 | 18.50 | 1110 | chord stab (2 notes, 6 saw voices) + sub hit 0.62 |
| 02 | 30.50 | 1830 | chord stab (2 notes, 7 saw voices) + sub hit 0.74 |
| 03 | 42.50 | 2550 | chord stab (3 notes, 8 saw voices) + sub hit 0.86 |
| 04 | 61.75 | 3705 | chord stab (4 notes, 9 saw voices) + sub hit 0.98 |
| 05 | 75.00 | 4500 | chord stab (4 notes, 10 saw voices) + sub hit 1.10 + riser before it |

## Impacts and silences
- Impacts (s): 5.00 (f300), 18.50 (f1110), 30.50 (f1830), 42.50 (f2550), 61.75 (f3705), 75.00 (f4500), 88.00 (f5280), 93.00 (f5580)
- Planned silence (the black after the paper rip): 59.00-59.50 s (frames 3540-3570)

## Foley (synthesized, every cue on an event)
| t (s) | Frame | Sound | Gain |
|---|---|---|---|
| 0.25 | 15 | slap | 0.7 |
| 1.75 | 105 | whoosh | 0.8 |
| 2.00 | 120 | slap | 0.8 |
| 4.00 | 240 | slap | 0.9 |
| 4.95 | 297 | chair | 0.7 |
| 5.50 | 330 | boing | 1.0 |
| 5.50 | 330 | confetti | 0.8 |
| 6.50 | 390 | thud | 0.7 |
| 6.60 | 396 | dive | 0.8 |
| 7.20 | 432 | pop | 0.4 |
| 7.25 | 435 | tick | 0.4 |
| 8.50 | 510 | scroll | 0.35 |
| 8.50 | 510 | tick | 0.45 |
| 10.00 | 600 | scroll | 0.35 |
| 11.50 | 690 | scroll | 0.35 |
| 13.00 | 780 | scroll | 0.35 |
| 14.25 | 855 | scroll | 0.35 |
| 15.25 | 915 | tick | 0.5 |
| 15.50 | 930 | suck | 0.6 |
| 16.50 | 990 | whoosh | 0.8 |
| 17.00 | 1020 | fizz | 0.6 |
| 18.00 | 1080 | whoosh | 0.6 |
| 20.25 | 1215 | tick | 0.35 |
| 28.25 | 1695 | tick | 0.35 |
| 29.00 | 1740 | suck | 0.6 |
| 30.00 | 1800 | paper | 0.7 |
| 30.55 | 1833 | scribble | 0.6 |
| 32.25 | 1935 | scribble | 0.4 |
| 38.40 | 2304 | peek | 0.6 |
| 40.50 | 2430 | knock | 0.9 |
| 41.00 | 2460 | flutter | 0.6 |
| 42.50 | 2550 | stamp | 0.8 |
| 46.50 | 2790 | swish | 0.5 |
| 51.75 | 3105 | flap | 0.6 |
| 52.30 | 3138 | zap | 0.5 |
| 58.75 | 3525 | rip | 1.0 |
| 59.50 | 3570 | zap | 0.6 |
| 60.00 | 3600 | crackle | 0.45 |
| 60.75 | 3645 | crackle | 0.4 |
| 62.00 | 3720 | zap | 0.5 |
| 70.15 | 4209 | peek | 0.5 |
| 72.25 | 4335 | suck | 0.8 |
| 73.00 | 4380 | beep | 0.45 |
| 74.00 | 4440 | beep | 0.45 |
| 74.75 | 4485 | beep | 0.45 |
| 88.75 | 5325 | clink | 0.5 |
| 89.50 | 5370 | slap | 0.6 |
| 89.75 | 5385 | slap | 0.6 |
| 90.00 | 5400 | slap | 0.6 |
| 90.50 | 5430 | whoosh | 0.6 |
| 92.00 | 5520 | pop | 0.5 |

Kicks: 107, claps: 50. The full grid, events and voice lines: `output/reveals_beatmap.json`.
