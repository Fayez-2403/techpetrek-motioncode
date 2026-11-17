# Style guide: the reel's own unslop direction

The reel's look after "bhai bas karo", set with the unslop skill's Direction (tools/unslop/skills/unslop/SKILL.md):
- **Product:** a 60 s reel that shows one tool honestly.
- **Character:** dry, exact, a little cheeky.
- **World:** a designer's redline review. Dark graphite surfaces, real pages in quiet windows, a magnifier.
- **Moments:** the real story video of our run, and the lens on the README's own sentences.
- **Signature:** unslop's red redline (#ff4d6a), meaning "slop found". It turns ivory once fixed: the headline tag, and DESIGN in the CTA.

**Tokens** (src/reel/style.ts):

| Role | Value |
|---|---|
| Page | #141415 |
| Raised | #19191b |
| Deep | #0f0f10 |
| Hairline | ivory at 9 % |
| Text | ivory #f4ebdd |
| Secondary text | #aaa398 |
| Muted text | #8a847a |
| Accent | red #ff4d6a, the one accent with one meaning |

Ember orange appears only inside EmberAI's own screen.

**Type:**
- Instrument Sans 500 for captions (60 px) and labels.
- IBM Plex Mono 400/500 for meta, sources, commands and measurements.
- No 700–900 weights, no tracked caps, no gradient text, no emoji.
- The exception is the hook (Inter 800, gradient, emoji), which exists to be unslopped.

**Motion:**
- One curve family: quint out to land, cubic in to leave.
- A slow camera creep on held pages.
- No springs, no pulsing.
