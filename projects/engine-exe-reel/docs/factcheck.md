# Fact check: ENGINE.EXE reel

Every spoken or shown claim comes from the simulator's own model, `projects/engine-exe/sim/engine-shared/kin.js` and `config.js`. That model passes 42/42 checks: see `projects/engine-exe/docs/VALIDATION.md`.

The engine is a **generic educational engine**: a 148 cc single with illustrative dimensions, not any real model. That is labelled on screen ("GENERIC 148 CC SINGLE · ILLUSTRATIVE MODEL").

| Line | Claim | Source / check |
|---|---|---|
| v01 (v2) | "Is engine ka ek bhi part haath se animate nahi hua. Poora simulator Claude ne code se banaya." (Not one part of this engine was animated by hand; Claude built the whole simulator in code.) | True. Every part is posed each frame from `engineStateAt(θ)`; no part has keyframes. Only the crank angle's timeline and the camera are scripted (on the voice), and the reel does not claim otherwise. ENGINE.EXE was written by Claude (Claude Code, Opus 5.5) in this session with the teardown skill's kit. "MADE BY CLAUDE" is plain text, with no Anthropic logo. |
| v11 (v2) | "Kisi machine ka aisa simulator … Gearbox, pump, ya landing gear?" (A simulator like this for any machine: a gearbox, a pump, a landing gear?) | The teardown skill is built to make simulators of machines and mechanisms; its own description names "an engine, a landing gear, a walking linkage, a pump, a gearbox". Its shipped examples include a V8, a Cessna 337 landing gear and a Strandbeest. The on-screen credit reads "Built with Claude Code + the teardown skill". |
| v02 (v2; v01 in v1) | "Ek second mein 23 chakkar" / "Ye engine ek second mein 23 baar ghoomta hai." (23 turns a second) (This engine turns 23 times a second.) | The model runs at 1400 rpm (`CONFIG.rpm.default`), and 1400 / 60 = 23.3 rev/s. "Ye engine" means this simulated engine at this speed. The counter shows 23.3, with "1400 RPM ÷ 60" under it. |
| v02 | "Isko 20 guna slow karte hain." (We slow it down 20 times.) | The picture speed eases from 1/4 to 1/20 (`CONFIG.playback.normal`), and the chip reads "PICTURE 1/20 SPEED". The picture runs at 1/4 before that, which is also labelled on the chip. |
| v03 | "Sab kuch sirf ek cheez chalaati hai: crank ka angle." (One thing drives everything: the crank angle.) | Every part is posed from `engineStateAt(θ)`. The test confirms the rod on both pins, the cam at exactly θ/2, and the valves at the model lift. |
| v04 | "Piston seedha upar neeche, rod usko ghumaav mein badal deti hai." (The piston goes straight up and down; the rod turns that into rotation.) | Exact slider-crank, `x = r·cosθ + √(l² − r²·sin²θ)`, r = 28 mm, l = 100 mm. Shown live: piston mm, rod angle. |
| v05 | "Camshaft aadhi speed pe … crank ke do chakkar, cam ka ek." (The camshaft runs at half speed: two crank turns, one cam turn.) | camAngle = θ / 2 through a 14 : 28 chain. The dials show crank θ / 720 and cam θ/2 / 360. |
| v06–v09 | The four strokes and what each does | The cycle convention of the brief: 0–180 intake, 180–360 compression, 360–540 power, 540–720 exhaust. The valve windows are IO 710, IC 220, EO 500, EC 10. θ is 0, 180 and 540 on the spoken "Ek", "Do" and "Chaar". |
| v07 | "Dono valve band." (Both valves are closed.) | Both lifts are 0 from 220° to 360°. From 180° to 220° the intake is still closing (the late intake close). The picture keeps the spoken "Do" at 180°, and the strip shows the IC point honestly. |
| v08 | "Spark" | Ignition at 350° (10° before TDC) is **illustrative**. θ = 350° exactly on the spoken "Spark". The burn glow and pressure are labelled illustrative in the simulator. |
| v08 | "hawa aur petrol" (air and petrol) | A spark-ignition four-stroke runs on an air–fuel mixture, petrol on a motorcycle. This is a general fact. |
| v10 | "Har number live hai, isi ek angle se calculate hota hai." (Every number is live, calculated from this one angle.) | The live-state card on screen is `engineStateAt()` at that frame. The test confirms the dashboard matches the model at every angle sampled. |
| v11 | "Comment karo ENGINE" (Comment ENGINE) | A CTA with a comment keyword. The simulator file exists: `projects/engine-exe/engine-live.html`. |

**Picture speed honesty.** The engine always reads 1400 rpm. The picture slows (1/4, 1/20, then about 1/250 during the lesson), and the top chip shows the picture speed live.
