# Session resume: Grok Bot 58 s reel

Brief: GROK_BOT_58S_CLAUDE_MASTER_PROMPT.md, pasted by the user on 2026-10-19 (not saved in the repo).
Decisions (2026-10-19, user):
- Voice: Liam with Indian-English direction (ElevenLabs v3).
- Music: an original score synthesized in code.
- Branding: "GROK BOT" set in our own type, no logos (x.ai brand files can't be fetched automatically: HTTP 403).

## Where things are
| Piece | File |
|---|---|
| Facts + citations | FACTS.md, brand-assets/PROVENANCE.md |
| VO script + timing rules | analysis/script_grokbot.py (11 lines, chapter windows, VO_END / VO_LEAD) |
| VO builder | analysis/grokbot_vo.py; installed take = seed 3, stability 0.0 (audio/grokbot/voiceover.mp3, data/grokbot/lyrics.json) |
| Score (120 BPM, 29 bars) | analysis/grokbot_music.py -> audio/grokbot/stems/*.wav, data/grokbot/music.json |
| Storyboard as data | data/grokbot/cues.json (events + foley cues, on the 0.25 s grid) |
| Mix | analysis/grokbot_mix.py -> audio/grokbot/mix.mp3 (-14 LUFS), data/grokbot/audio.json |
| Characters (bible as code) | app/src/scenes/_grokbots.ts |
| The reel (11 chapters, camera, props, type, captions) | app/src/scenes/grokbot.ts; timeline variants `grokbot` and `grokbot_sheet` (vite.config maps grokbot_* data to grokbot) |
| Character sheet still | references/sheet/f_0002.00.png |
| Skills installed | .claude/skills/ (19 AKCodez + 8 official Higgsfield; see SOURCE-*.txt), Playwright MCP in .mcp.json |

## Commands
```
python analysis/grokbot_vo.py --seed 3 --reuse <dir with take.mp3 + align.json>   # re-cut the voice (no credits)
python analysis/grokbot_music.py && python analysis/grokbot_mix.py                  # rebuild the score + mix
cd app && bun scripts/render.ts stills --variant grokbot --t 0,6,12 --out ../out/wip/x
cd app && bun scripts/render.ts video --variant grokbot --scale 2 --workers 1 --fps 60 --samples 1 --out ...   # final (ask first)
```
On Windows use 10 s segments (scratchpad render_win.sh pattern): a long single render can run out of memory.

## Checkpoints
A inventory ✓ · B facts ✓ · C character sheet ✓ · D VO + beat map ✓ · E storyboard stills ✓ (out/wip/gb2_sheet*.png) ·
F animatic ✓ · G shots ✓ · H final ✓ (output/grok-bot-reel_master.mp4, _social.mp4, covers) · I QA ✓ (QA.md, QA-auto.json)

## Manifest
- Code: app/src/scenes/grokbot.ts, app/src/scenes/_grokbots.ts, app/src/timeline.ts (grokbot variants), app/vite.config.ts (grokbot_* data alias)
- Audio pipeline: analysis/script_grokbot.py, grokbot_vo.py, grokbot_music.py, grokbot_mix.py; QA: analysis/grokbot_qa.py
- Data: data/grokbot/{lyrics,cues,music,audio}.json; audio/grokbot/{voiceover,mix}.mp3, stems/*.wav
- Docs: FACTS.md, brand-assets/PROVENANCE.md, QA.md, QA-auto.json; references/sheet (character sheet), references/qa (QA frames)
