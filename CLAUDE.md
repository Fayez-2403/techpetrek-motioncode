# Motion as Code — rules for Claude

Read README.md, then app/src/timeline.ts, app/src/scenes/_vo.ts and app/src/engine/scene.ts before changing anything.

- Do not edit app/src/engine/ (the pdoom-video engine, MIT). Shared plate helpers go in app/src/scenes/_vo.ts.
- Every plate is a pure function of time. No Math.random(), Date.now() or performance.now(); use hash()/mulberry32 from engine/util.
- Spoken variants: find timings by words (wordOf, lineOf, cut). Music variants (`motion`, `possibilities`, `motion_full`): use their measured audio data and `data/possibilities/cues.json`; do not invent a beat grid or retime the song to match visual guesses.
- Check work with stills: `cd app && bun scripts/render.ts stills --t <times> --only <plate> --out ../out/wip`, then look at the PNGs.
- Do not run the full render or a 4K render without asking.
- Explain each change in one or two sentences before you make it.
- Every new reel or video (or a remake, restyle, re-voice or render of one) goes through the `reel-pipeline` skill
  (.claude/skills/reel-pipeline/SKILL.md). It names the installed skill for each stage. Load them, and run
  `python analysis/reel_qa.py <video>` before calling a reel done.
