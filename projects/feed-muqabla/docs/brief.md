# Brief: Feed ka Muqabla

Created 2026-11-28 from the motion-studio reel template.
- **The contract:** `docs/TECHPETREK_MASTER_REEL_STUDIO.md` (repo root).
- **The block brief method:** `.claude/skills/motion-studio/guide/brief.md`.

## NEW REEL BRIEF
```yaml
project_title: "Feed ka Muqabla"
subject_and_angle: "System design: how a social feed is built. Fan-out on write (push) vs fan-out on read (pull), each one's trade-off, and the hybrid Twitter described for celebrities. Told as a qawwali muqabla (two parties battle with verse and counter-verse)."
primary_source_urls:
  - https://highscalability.com/the-architecture-twitter-uses-to-deal-with-150m-active-users/
  - https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/twitter/README.md
secondary_reference_urls:
  - https://www.infoq.com/presentations/Twitter-Timeline-Scalability/
  - "https://www.instagram.com/reel/DgH9dDaR1CM/ (the user's qawwali reference; Instagram is not readable from here, so the format is built from the qawwali muqabla tradition, not copied from that reel)"
mode: EXPLAINER
idea: "fable + battle format (guide/ideas.md: the 'two sides argue' explainer), the 4th ink-cel system-design fable"
runtime_seconds: 60
runtime_max_seconds: 64
format: "9:16"
resolution: "1080x1920"
fps: 60
language: "Hinglish"  # Devanagari TTS, Roman captions
voiceover: "Two voices = two qawwal parties. Party Bhejo (push) = Liam TX3LPaxmHKxFdv7VOQHJ; Party Maango (pull) = Amogh M FuNEroZdMQWScvkSu4Xt. Both eleven_turbo_v2_5, hi, speed 1.2, seed 5."
soundtrack: "ORIGINAL"   # synthesized qawwali: harmonium (Kafi), dholak keherwa, taali, a chorus layered from the leads' own refrain lines
hook: "Real page: 'up to 5 minutes for a tweet to flow from Lady Gaga's fingers to her 31 million followers' + a storm of paper slips."
core_reveal: "Push = fast read, costly write. Pull = cheap write, slow read. The hybrid: push for normal users, pull for superstars, merge when the feed opens. Pick the trade-off, not a camp."
scene_count: AUTO
featured_source_videos: []
visual_style: "Hand-inked cel (the fable engine) in a NEW world: a night mehfil in a haveli courtyard, cusped Mughal arches, lanterns, a patterned dari, two qawwal parties facing each other; real pages seen through a jharokha (arched window)."
logo_file: "public/brand/techpe-trek.jpg"
preferred_cta: "Comment FEED"
post_caption: true
cover_image: true
budget: "FREE-FIRST (no generated images; ElevenLabs voice only)"
licensing_requirements: "Real pages are captured live and shown unedited, credited in the caption; everything else is drawn in code."
critical_constraints:
  - "Exact sourced facts only (docs/factcheck.md). The Twitter hybrid was a stated PLAN in 2013: say 'plan', not 'does'."
  - "No real person drawn: the superstar is a fictional character; Lady Gaga / Taylor Swift appear only as words on the real page."
  - "Captions Roman Hinglish; no Hindi script on screen; no brand logos outside real page captures."
  - "Ask before the full 1080 render."
```

## Logline
At a midnight mehfil, two qawwal parties fight over how a feed should be built. One sends every post to every follower's inbox; the other fetches only when the feed opens. A superstar's post breaks the first, and a user who follows 500 accounts breaks the second. They end the night singing one verse together: the hybrid.

## Block brief (motion-studio)
- **FILM:** a qawwali muqabla, verse vs counter-verse, about 60 s, 9:16. The comparison IS the battle, and the trade-off is a brass taraazu (balance scale).
- **BRAND:** HERO = the two qawwal leads (Bhejo left, Maango right). APP = a social feed (generic, no real app UI). RESULT = the feed opens instantly for everyone. SET = the haveli courtyard mehfil.
- **FACTS:** factcheck F1-F6. Every number on screen comes from Twitter's own talk (via High Scalability) or the System Design Primer.
- **FORMAT + RENDERER:** the Python/Pillow ink-cel engine (copied from film-prints), with drawings at 30 fps on twos inside a 60 fps master; preview 540x960.
- **TIMELINE:** SCENE_TIMINGS.json from the two voice takes. Each new line snaps to the 100 BPM keherwa grid; joined lines run on.
- **BEATS:** hook (real page) → the stage → Bhejo verse + real QPS page → Bhejo refrain → Maango verse + refrain → Maango's taunt (superstar) → Bhejo's taunt (500 follows) → both admit their weakness (taraazu) → milan (hybrid) + real pages → usool sung together → CTA.
- **LOOP:** the last frame is the two parties clapping on the beat (the same clap as the first stage shot).
- **CAMERA:** the stage wide is the anchor. Each push-in lands on the singing party, whip pans are the muqabla "jawab" (reply), and the camera holds on the taraazu.
- **LOOK:** palette = indigo night, ivory marble, saffron (Bhejo), emerald (Maango), gold lantern/brass, and ink. Ink lines and cel shading as in the fables.
- **SOUND:** original qawwali. Harmonium in Kafi, dholak keherwa at 100 BPM, taali on 2 and 4, and the chorus built from each lead's own refrain line (stacked, detuned copies). A stop-time before the superstar hit, and "wah!" stings on the jawab.
- **CHECKS:** reel_qa.py, look.py G0/G2/G3, measure.py strobe, Scribe STT on every line, final-mix STT, and the benchmark gate.

## Assumptions made
- "Any topic" → feed fan-out, because a comparison needs two real camps and a real trade-off, and Twitter published its own numbers.
- "Learn from the qawwali style" → a qawwali *muqabla* (party vs party), the format made for comparison. The reference reel can't be watched from here.
- "Unique style" → a new world, palette, cast and film grammar (two facing parties, whip-pan replies, a jharokha for receipts, a taraazu for the trade-off), built on the proven ink engine.
