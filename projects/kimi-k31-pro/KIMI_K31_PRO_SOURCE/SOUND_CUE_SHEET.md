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
| 00:01.58 | hook:disassembly |
| 00:03.02 | hook:whoosh |
| 00:04.46 | hook:typing |
| 00:06.75 | hook:suck |
| 00:07.20 | reveal:riseTone |
| 00:07.20 | reveal:subImpact |
| 00:09.88 | reveal:glass |
| 00:09.88 | reveal:mechClick |
| 00:10.63 | reveal:dataPulse |
| 00:12.90 | reveal:riser |
| 00:13.80 | engine:impact |
| 00:14.00 | engine:whoosh |
| 00:17.04 | engine:flashHit |
| 00:17.31 | engine:paper |
| 00:17.58 | engine:dataBurst |
| 00:21.90 | engine:suck |
| 00:22.80 | coding:mechClick |
| 00:23.81 | coding:typing |
| 00:25.32 | coding:dataBurst |
| 00:28.20 | coding:magLock |
| 00:29.10 | coding:gearRatchet |
| 00:34.80 | coding:whoosh |
| 00:35.40 | cad:glass |
| 00:36.37 | cad:servo |
| 00:38.16 | cad:shimmer |
| 00:41.47 | cad:magLock |
| 00:41.61 | cad:servo |
| 00:42.58 | cad:dataPulse |
| 00:44.51 | cad:magLock |
| 00:45.06 | cad:magLock |
| 00:45.54 | cad:mechClick |
| 00:47.82 | cad:glass |
| 00:49.20 | human:glass |
| 00:50.10 | human:heartbeat |
| 00:51.90 | human:servoRhythm |
| 00:58.20 | human:errorBlip |
| 00:59.28 | human:fixChime |
| 01:07.20 | finance:paper |
| 01:09.27 | finance:paper |
| 01:11.34 | finance:ticks |
| 01:14.79 | finance:dataBurst |
| 01:17.55 | finance:chartSwell |
| 01:20.50 | finance:suck |
| 01:21.00 | agents:impact |
| 01:22.37 | agents:nodeChain |
| 01:27.27 | agents:errorBlip |
| 01:28.07 | agents:fixChime |
| 01:31.70 | agents:riser |
| 01:32.40 | bench:impact |
| 01:35.52 | bench:riseTone |
| 01:37.08 | bench:ticks |
| 01:47.20 | bench:whoosh |
| 01:48.10 | highspeed:accelSweep |
| 01:51.51 | highspeed:ticks |
| 01:53.46 | highspeed:impact |
| 01:55.80 | openweight:glass |
| 01:56.70 | openweight:unfold |
| 02:00.30 | openweight:dataPulse |
| 02:04.20 | openweight:riser |
| 02:04.80 | payoff:impact |
| 02:05.57 | montage hit |
| 02:06.30 | montage hit |
| 02:07.00 | montage hit |
| 02:07.53 | montage hit |
| 02:08.00 | montage hit |
| 02:13.17 | resolve |

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
| 00:08.29 | reveal:glass |
| 00:08.29 | reveal:mechClick |
| 00:09.14 | reveal:dataPulse |
| 00:11.70 | reveal:riser |
| 00:12.60 | coding:mechClick |
| 00:13.03 | coding:typing |
| 00:13.68 | coding:dataBurst |
| 00:15.00 | coding:magLock |
| 00:15.30 | coding:gearRatchet |
| 00:17.40 | coding:whoosh |
| 00:18.00 | cad:glass |
| 00:18.57 | cad:servo |
| 00:19.62 | cad:shimmer |
| 00:21.56 | cad:magLock |
| 00:21.64 | cad:servo |
| 00:22.21 | cad:dataPulse |
| 00:23.35 | cad:magLock |
| 00:23.67 | cad:magLock |
| 00:23.95 | cad:mechClick |
| 00:25.29 | cad:glass |
| 00:26.10 | human:glass |
| 00:26.55 | human:heartbeat |
| 00:27.45 | human:servoRhythm |
| 00:30.60 | human:errorBlip |
| 00:31.14 | human:fixChime |
| 00:35.10 | finance:paper |
| 00:36.36 | finance:paper |
| 00:37.62 | finance:ticks |
| 00:39.72 | finance:dataBurst |
| 00:41.40 | finance:chartSwell |
| 00:43.00 | finance:suck |
| 00:43.50 | bench:impact |
| 00:44.88 | bench:riseTone |
| 00:45.57 | bench:ticks |
| 00:49.60 | bench:whoosh |
| 00:50.50 | highspeed:accelSweep |
| 00:52.56 | highspeed:ticks |
| 00:53.76 | highspeed:impact |
| 00:55.20 | openweight:glass |
| 00:56.01 | openweight:unfold |
| 00:59.25 | openweight:dataPulse |
| 01:02.70 | openweight:riser |
| 01:03.30 | payoff:impact |
| 01:03.63 | montage hit |
| 01:03.97 | montage hit |
| 01:04.30 | montage hit |
| 01:04.63 | montage hit |
| 01:05.90 | resolve |
