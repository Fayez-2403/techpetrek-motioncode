# Bro & Bhai: the series format

A recurring Tech पे Trek reel: two illustrated hosts, **Bro** (bottom-left) and **Bhai** (bottom-right), talk through one
tech topic in Hinglish. They cover news, launches, upgrades, a repo, an awareness warning, or a concept explained properly.
The user writes the hooks and the key dialogue lines. Claude researches the facts, writes the rest of the conversation,
and builds the reel in code. Every episode is finalised by the user before voice and before render.

## 1. What the reference does (@itsflxkzy, "REEL KIT", 52.6 s, ~3.2K likes)
- **The idea:** one cartoon replica of the creator explains a product in a calm, confident voice. The whole reel is built in code,
  not by an AI video model. The video is the proof of the claim.
- **Structure:** a promise ("one folder that makes every kind of reel"), then "let me show you how it works", then myths
  1-3 ("you might think…" → the counter-proof with numbers), then how it works, then "Comment KIT".
- **Look:** a printed-paper world.
  - Colour: cream paper (#ecebe6), ink black, one red-orange accent (#f04a23).
  - Shapes: thick-outlined cards with halftone drop shadows, and a mono chapter strip ("// 04 — myth 2 · hard to use") with a
    "MYTHS 2/3" counter top-right.
  - Contrast: dark scenes for the "myth" sections, cream for the answers.
- **Type:** a sans headline types itself in word by word at the top-left as it is spoken. One key word turns red, or into a
  serif italic ("go *Viral*", "even *3D*").
- **The host:**
  - Placement: bottom-right, cropped at the chest.
  - Poses: changes pose on the beat (point, wave, hand on chin, shocked, thumbs), with no lip-sync. The pose carries the emotion.
  - Small extras: "…" think bubbles and shock lines.
- **The centre:** one hero object per beat (folder, phone mock-ups, a timeline, a terminal). It builds as the line is spoken
  and gets replaced on the next line. No dead frames.
- **Proof:** real numbers on screen (72,000 · 42,000 · 36,000 views), with tiny crowd figures for scale.

## 2. Our version
Same clarity, two people, and a conversation instead of a monologue.

| | Bro (left) | Bhai (right) |
|---|---|---|
| Role (proposal, user finalises) | the viewer's stand-in: hyped, sceptical, asks the "aam aadmi" question, cracks the joke | the one who has read the docs: calm, big-picture, lands the fact |
| Voice | ElevenLabs Liam (turbo v2.5, hi), the channel's voice | a second, deeper and calmer male voice (to pick) |
| Colour | cyan nameplate | red-orange nameplate |
| Signature move | "Bro, seriously?!" double-take | "Bhai bataata hoon…" lean-in |

Rules for the conversation (writing for the ear):
1. **Hook in line 1:** the user's hook, said by whoever owns it. Value by line 2.
2. **Ping-pong:** no single line over ~2.5 s of speech, and no more than 2 lines in a row from the same host.
3. **The friction engine:** Bro doubts or misreads, Bhai corrects with a fact, Bro restates it in one simple line
   (the line the viewer remembers).
4. **The bigger picture:** every episode answers "why does this matter to me, in India, this week?", not just "what launched".
5. **Facts only from docs/factcheck.md**, each with a source. Opinions are marked as opinions, and demos are labelled
   illustrative.
6. **One callback joke** near the end, then the CTA ("Comment <WORD>").

## 3. Screen layout (1080x1920)
- **Top strip (y 70):** mono chapter label `// 02 — kya hai ye · ` and a counter `3/5`.
- **Caption (y 140-330, left):** the current line types in word by word. The speaker's colour marks whose line it is; one key
  word in red or italic serif.
- **Stage (y 360-1180):** one hero card per line: a repo card, a terminal, a chart, a news screenshot (real, credited), a
  diagram, a phone mock-up. It builds while the line is spoken.
- **Hosts (y 1180-1920):**
  - Placement: Bro at bottom-left, Bhai at bottom-right, each about 520 px wide, cropped at the chest.
  - Speaking: the active speaker scales 1.04 and is lit, the listener dims to 70 % and reacts (nod, side-eye, hand on chin).
  - Nameplates "BRO" / "BHAI" show for the first 2 s.
- **Look:**
  - Base: TechpeTrek's own paper-and-ink (cream, ink, one accent), plus a dark "myth" mode.
  - Shadows: halftone, hard offset. Motion: lands decelerate, exits accelerate; cuts on the line change.
- **Safe zones:** Instagram's UI (bottom 380 px) overlaps the hosts' chests only, never the caption or the stage.

## 4. Characters (the user uploads the replicas)
- **Input:** one clean front image of each host. Illustrated or photo; for this style a 2D cartoon replica like the
  reference works best.
- **Poses:**
  - Needed for each host: neutral, talk, point, think (hand on chin), shock, laugh, thumbs-up, shrug.
  - How they're made: from the upload with Open Higgsfield AI / kie.ai (Nano Banana 2 edit, ~8 credits a pose: about 128 credits
    for 2 × 8). Background removed, same framing, the face kept identical.
  - Approval: the user approves the pose sheet before any episode uses it.
- **Lip-sync:** none, like the reference: poses on the beat plus a small talk bounce. Optional later: lip sync on kie.ai
  (`lipsync`, paid).
- **Consent:** the replicas are the user and someone who agreed to it (or fictional). Never a real public figure.

## 5. The per-episode prompt (what the user sends)
```
EPISODE: <topic or link: news / repo / upgrade / concept / awareness>
HOOK (Bro/Bhai): "<the first line, exact>"
MUST-SAY LINES: "<line>" (Bro) · "<line>" (Bhai) …
ANGLE: <the bigger picture, the India angle, or what the viewer should do>
CTA WORD: <e.g. REPO>
LENGTH: <30-60 s>
```

## 6. Workflow and the user's approval gates
1. **Research.** Claude reads the primary sources and fills docs/factcheck.md.
2. **Script.** Claude writes the full Bro ↔ Bhai dialogue (with on-screen captions and the hero card for each line).
   - **GATE 1:** the user approves or edits the script.
3. **Voice.** Two ElevenLabs voices; every line is checked with speech-to-text (Scribe + whisper), and brand words are respelled until correct.
4. **Build.**
   - Look-dev stills of 4-6 key frames. **GATE 2:** the user approves the look (first episode only, then it is locked).
   - Then a 540x960 motion check with sound. **GATE 3:** the user approves.
5. **Final.** The 1080x1920 render (only on the user's "render"), reel_qa, the motionmaxxing gates, then the caption, cover and DM reply.
