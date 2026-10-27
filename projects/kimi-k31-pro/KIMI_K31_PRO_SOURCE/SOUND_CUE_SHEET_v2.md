# SOUND CUE SHEET

All music and effects are synthesized in `audio-src/score.py` (original; no samples). Tempo 100 BPM (beat 0.6 s),
D minor (Dm–B♭–F–C per bar). Narration on top; the music ducks about 8 dB under the voice; mix normalised to
−14 LUFS integrated, −1.5 dBTP (two-pass ffmpeg loudnorm). Cue definitions: `src/audio/cues.json`; absolute times below
come from the last mix (`audio-src/out/<variant>/cue_log.json`).

## Signature cues

| Moment | Sound |
|---|---|
| Reveal | sub impact + glass harmonic (inharmonic partials 1 : 2.76 : 5.40 : 8.93) |
| Code | high-frequency typing clicks + data pulses |
| Assembly | magnetic locks (thump + click + ring) |
| Walking | servo rhythm on the beat + heartbeat pulse (lub-dub every 2 beats) |
| Finance | paper swishes + analytical ticks |
| Benchmarks | short rising tone + 16th-note ticks |
| Highspeed | acceleration sweep → impact |
| Ending | resolve: sub + glass + Dm add9 pad swell |

## Energy per scene (music layers 0–1)

| Scene | pad | bass | arp | kick | hat | clap | drone |
|---|---|---|---|---|---|---|---|
| hook | 0.5 | 0.0 | 0.0 | 0 | 0 | 0 | 1.0 |
| reveal | 0.9 | 0.5 | 0.0 | 0 | 0 | 0 | 0.6 |
| engine | 0.7 | 0.8 | 0.4 | 1 | 0 | 0 | 0.8 |
| coding | 0.6 | 0.9 | 0.9 | 1 | 1 | 0 | 0.0 |
| cad | 0.7 | 0.9 | 0.6 | 1 | 1 | 0 | 0.0 |
| human | 0.8 | 0.7 | 0.0 | 0 | 1 | 0 | 0.4 |
| finance | 0.6 | 0.8 | 0.5 | 1 | 1 | 0 | 0.0 |
| agents | 0.7 | 1.0 | 1.0 | 1 | 1 | 1 | 0.0 |
| bench | 0.8 | 0.4 | 0.0 | 0 | 0 | 0 | 0.5 |
| highspeed | 0.5 | 1.0 | 1.0 | 1 | 1 | 1 | 0.0 |
| openweight | 1.0 | 0.6 | 0.3 | 0 | 0 | 0 | 0.5 |
| payoff | 0.8 | 1.0 | 1.0 | 1 | 1 | 1 | 0.0 |

## master cue list

| Time | Cue |
|---|---|
| 00:00.00 | hook:subImpact |
| 00:00.05 | hook:glass |
| 00:01.45 | hook:disassembly |
| 00:02.77 | hook:whoosh |
| 00:04.09 | hook:typing |
| 00:06.15 | hook:suck |
| 00:06.60 | reveal:riseTone |
| 00:06.60 | reveal:subImpact |
| 00:09.06 | reveal:glass |
| 00:09.06 | reveal:mechClick |
| 00:09.72 | reveal:dataPulse |
| 00:11.70 | reveal:riser |
| 00:12.60 | engine:impact |
| 00:12.80 | engine:whoosh |
| 00:15.62 | engine:flashHit |
| 00:15.88 | engine:paper |
| 00:16.13 | engine:dataBurst |
| 00:20.16 | engine:suck |
| 00:21.00 | coding:mechClick |
| 00:21.96 | coding:typing |
| 00:23.40 | coding:dataBurst |
| 00:25.80 | coding:magLock |
| 00:27.00 | coding:gearRatchet |
| 00:32.40 | coding:whoosh |
| 00:33.00 | cad:glass |
| 00:33.97 | cad:servo |
| 00:35.76 | cad:shimmer |
| 00:39.07 | cad:magLock |
| 00:39.21 | cad:servo |
| 00:40.18 | cad:dataPulse |
| 00:42.11 | cad:magLock |
| 00:42.66 | cad:magLock |
| 00:43.14 | cad:mechClick |
| 00:45.42 | cad:glass |
| 00:46.80 | human:glass |
| 00:47.58 | human:heartbeat |
| 00:49.14 | human:servoRhythm |
| 00:54.60 | human:errorBlip |
| 00:55.54 | human:fixChime |
| 01:02.40 | finance:paper |
| 01:04.38 | finance:paper |
| 01:06.36 | finance:ticks |
| 01:09.66 | finance:dataBurst |
| 01:12.30 | finance:chartSwell |
| 01:15.10 | finance:suck |
| 01:15.60 | agents:impact |
| 01:16.97 | agents:nodeChain |
| 01:21.87 | agents:errorBlip |
| 01:22.67 | agents:fixChime |
| 01:26.30 | agents:riser |
| 01:27.00 | bench:impact |
| 01:30.00 | bench:riseTone |
| 01:31.50 | bench:ticks |
| 01:41.20 | bench:whoosh |
| 01:42.10 | highspeed:accelSweep |
| 01:45.51 | highspeed:ticks |
| 01:47.46 | highspeed:impact |
| 01:49.80 | openweight:glass |
| 01:50.64 | openweight:unfold |
| 01:54.00 | openweight:dataPulse |
| 01:57.60 | openweight:riser |
| 01:58.20 | payoff:impact |
| 01:59.00 | montage hit |
| 01:59.57 | montage hit |
| 02:00.33 | montage hit |
| 02:00.87 | montage hit |
| 02:01.33 | montage hit |
| 02:05.20 | resolve |

## reel cue list

| Time | Cue |
|---|---|
| 00:00.00 | hook:subImpact |
| 00:00.05 | hook:glass |
| 00:01.19 | hook:disassembly |
| 00:02.27 | hook:whoosh |
| 00:03.35 | hook:typing |
| 00:04.95 | hook:suck |
| 00:05.40 | reveal:riseTone |
| 00:05.40 | reveal:subImpact |
| 00:07.97 | reveal:glass |
| 00:07.97 | reveal:mechClick |
| 00:08.68 | reveal:dataPulse |
| 00:10.80 | reveal:riser |
| 00:11.70 | coding:mechClick |
| 00:12.16 | coding:typing |
| 00:12.84 | coding:dataBurst |
| 00:13.80 | coding:magLock |
| 00:14.55 | coding:gearRatchet |
| 00:16.80 | coding:whoosh |
| 00:17.40 | cad:glass |
| 00:17.97 | cad:servo |
| 00:19.02 | cad:shimmer |
| 00:20.96 | cad:magLock |
| 00:21.05 | cad:servo |
| 00:21.61 | cad:dataPulse |
| 00:22.75 | cad:magLock |
| 00:23.07 | cad:magLock |
| 00:23.35 | cad:mechClick |
| 00:24.69 | cad:glass |
| 00:25.50 | human:glass |
| 00:25.95 | human:heartbeat |
| 00:26.85 | human:servoRhythm |
| 00:30.00 | human:errorBlip |
| 00:30.54 | human:fixChime |
| 00:34.50 | finance:paper |
| 00:35.76 | finance:paper |
| 00:37.02 | finance:ticks |
| 00:39.12 | finance:dataBurst |
| 00:40.80 | finance:chartSwell |
| 00:42.40 | finance:suck |
| 00:42.90 | bench:impact |
| 00:44.28 | bench:riseTone |
| 00:44.97 | bench:ticks |
| 00:49.00 | bench:whoosh |
| 00:49.90 | highspeed:accelSweep |
| 00:51.69 | highspeed:ticks |
| 00:52.74 | highspeed:impact |
| 00:54.00 | openweight:glass |
| 00:54.81 | openweight:unfold |
| 00:58.05 | openweight:dataPulse |
| 01:01.50 | openweight:riser |
| 01:02.10 | payoff:impact |
| 01:02.43 | montage hit |
| 01:02.77 | montage hit |
| 01:03.10 | montage hit |
| 01:03.43 | montage hit |
| 01:04.70 | resolve |
