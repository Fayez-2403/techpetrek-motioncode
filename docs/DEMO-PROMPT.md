# Demo prompt — paste into Claude Code in this folder

I've added the "Motion as Code — Jev" project to this folder. Read README.md and CLAUDE.md first, then
app/src/timeline.ts, app/src/scenes/_vo.ts and app/src/engine/scene.ts so you understand how plates and
timing work.

Step 1 - verify:
  cd app, run bun install, start the preview with bunx vite, and confirm the video plays at
  localhost:5173 with no console errors. Tell me what you see.

Step 2 - one small change to prove it works:
  In the 'verdict' plate (app/src/scenes/verdict.ts), make "LLM writes. Jev decides. Code acts." hold
  0.3 s longer before the implode. Keep it a pure function of time and keep the loop back to frame 0 intact.
  Render a still just before the implode with
    bun scripts/render.ts stills --t 59.6 --only verdict --out ../out/wip
  and show it to me.

Step 3 - make it mine:
  Ask me for my voiceover (mp3) and whether I changed the script. Then update analysis/script_vo.py
  (SCRIPT and SPOKEN), re-run align_vo.py, audio_vo.py and sfx_mix.py, and tell me which cut(...) phrases in
  timeline.ts or wordOf(...) anchors in the plates need new words.

Rules: do not edit app/src/engine/. Do not run the full render or 4K without asking.
Explain each change in one or two sentences before you make it.

## Follow-up ideas
- "Change the accent colour from signal orange to electric blue everywhere." (palette lives in the engine:
  ask Claude to override it in _vo.ts instead)
- "Slow the policy plate's threshold slide down by 30%."
- "Add a plate between code and policy that shows the pricing: $0.042 per million input tokens, output free."
- "Render the whole video with render:draft as a fast draft."
