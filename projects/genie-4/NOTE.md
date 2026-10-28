# NOTE (motionmaxxing): Genie 4 reel, "Mere paas… ek prompt hai!"

**The idea.**
- A world model is cinema you can walk into, so the reel is a Bollywood film poster come alive.
- Deewar's standoff ("Aaj mere paas… tumhare paas kya hai?") sets up the old way, game engines, against one prompt.
- The prompt opens into DeepMind's real dragon world.
- The gold marquee screen is the carried object. It plays every real demo and moves, resizes or bleeds full frame each scene.
- It closes on "Picture abhi baaki hai, mere dost!" (Om Shanti Om), which matches the "trusted testers only" truth.

**Real vs ours.**
- **Real (FACTS.md G1–G12):** every claim, and all footage and sound, from Google DeepMind's 27 Oct 2026 post: 15 clips, credited on screen, with their own "Results for illustrative purposes. Sequences shortened." line kept in frame.
- **Real UI and text inside the clips:** WASD and arrow keys, typed prompts, the "REASONING STEPS" panel.
- **Genie's own dialogue:** "Mind the platform edge, please" plays alone in a 1.3 s gap.
- **Ours, tagged:**
  - the world-model film strip (its frames come from DeepMind's stained-glass demo);
  - the collision overlay;
  - the audio lanes (waveforms drawn from the clips' real audio);
  - the Gemini director loop;
  - the drift timeline (illustrative);
  - the Now Showing / Coming Soon poster;
  - the game engine vs world model table (a TechpeTrek comparison).

**Gates, on the 540×960 preview** (`output/genie4_v1_preview_540x960_60fps.mp4`, look.py):
- G0 PASS: 59.12 s matches `--expect`; audio present; -14.3 LUFS, LRA 2.4, true peak -2.0 dBFS.
- G2 PASS: no run of more than 3 flat frames, and no frozen stretch ≥ 0.6 s. The longest static-ish stretch is 0.72 s (the "physics: perfect nahi" stamp being read).
- G3 PASS: end hold 0.00 s (the CTA keeps pushing). The final detected shot is 6.82 s (12 %).
- G1 (by eye): the real UI reads because the camera pushes into it (WASD 3.2×, the reasoning panel 1.5×). Proof text is 26–58 px; credits are 21 px (quiet by design).
- G4 (by eye): one hero per frame. The audio scene's three lanes form one diagram, and the train lane becomes the hero for the dialogue.
- G5: lint.mjs targets HTML films, so it doesn't apply to this Remotion build. By hand: no corner HUD, counters or progress bar.
- Motion: 2.6/255 mean luma change, below the human band (median 6.8) but well above the last reel's 0.8. It's a light ground with frequent cuts on words.
- Cut sync: 5 of 11 detected cuts land on an onset (45 %).

**reel_qa.py:** 5/7.
- The size "fail" is the preview scale.
- The "silence" is a 0.1 s planned dip before "ek prompt hai!", now led in by a reverse whoosh.

**Voice (Scribe on the final mix):** all 11 lines are recovered verbatim (Hindi-script transcription). The gap transcribes as "Mind the platform edge, please".

**Still to improve:**
- The hook2 dramatic pause (about 1 s on "MERE PAAS…" before "ek") is a deliberate breath, but it's the emptiest frame.
- The audio lanes' mini screens are small (300 px).
