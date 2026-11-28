# Ek Film, Hazaar Copies: NOTE (preview v1, 2026-11-28)

**The idea.** CDN + caching as a bioscope-wala chant ("Dekho dekho…").
- The user pointed at a qawwali-format reel and left the special format to me. I picked the mela bioscope-wala: a showman who cranks a peep-box and chants "dekho dekho". The chant rides a 104 BPM dholak/taali/chimta groove, and every un-joined line starts on a beat.
- **Hook (real):** JioHotstar's IPL 2025 final peak of 55 million (5.5 crore) at once, then Blinkit's 2,700+ stores in 400+ cities. The question: how does it reach everyone at once, near everyone?
- **The fable (fiction, labelled):**
  - 1936, Kamal Studio, Bombay has one master reel (the origin), and the crowd mobs the studio gate.
  - Seth-ji prints copies for every town's cinema hall: CDN edges.
  - The censor cuts a romance scene after release, but small towns keep showing the old reel (stale cache).
  - The fix: a return-by date on every can (TTL) and a telegram ("purana hatao, naya lagao") = purge.
- **Usool:** "asli ek, copies hazaar, aur har copy pe expiry ki tareekh". CTA: comment CDN.

**Style.** The Berth 42 / money-order hand-inked cel engine.
- **New cast:** Bioscope Baba (lip-flap from word times), Seth Kamal, Censor Babu, Munni.
- **New sets:** mela at dusk, Kamal Studio, an inked India map with release routes, Lakshmi Talkies in Patna.
- **New palette:** cobalt, saffron skin, cream, gold, red.
- **New film grammar inside the engine:**
  - a brass porthole iris: the bioscope peephole that every real grab is seen through;
  - film-leader countdown cards between the four "reels" (acts);
  - an animated route map with delivery vans;
  - a split-screen BOMBAY / PATNA stale-cache gag.

**What is real** (docs/factcheck.md F1-F7). Each page was captured on 2026-11-28 at 412x880 mobile and is shown unedited inside the porthole, ringed in red:
- afaqs (JioStar's 55 million peak concurrency);
- Eternal's Blinkit page (2,700+ stores / 400+ cities);
- Business Today (dark stores);
- Cloudflare Learning ("What is a CDN?");
- MDN Cache-Control (`max-age=180`).

The 1936 story, studio and cast are invented. No claim about how JioHotstar or Blinkit build their systems.

**Voice.** One Liam take (turbo v2.5, hi, speed 1.2, seed 5), cut by character times, joined lines read as one sentence. `scripts/audio/fix_vo.py` patches three take artefacts found by Scribe; the raw take is kept as vo_raw.wav:
- b01: an extra syllable after "dekho";
- b14: "tareekh hai, [mumble] hai TTL";
- b17: a false start, "interest… interesting", and an "aur" heard as "on". The clean "interesting" is moved up, and b14's clean "aur" (58.06 s) is spliced in.

**Numbers (`out/film-prints_v1_preview_540x960_60fps.mp4`, 74.8 s, 540x960, 60 fps).**
- reel_qa: 5/7 (0 silences, -14.7 LUFS, 0 flat frames; the size and duration fails are expected for a 75 s preview).
- look.py: G0, G2 and G3 pass. Final shot 4.93 s = 7 %, ends mid-motion. 36 cuts, mean shot 2.02 s.
- Cut sync: 67 % (24 of 36; chance is about 36 %), up from 38 % on money-order, because the chant lines snap to the beat grid.
- Strobe: 0. True peak -2.7 dBTP after AAC.
- Final-mix STT: all 17 lines right.
- G1 by eye: every grab is ringed and punched to 2.0-2.2x before its line lands. G4 by eye: one hero per frame. The BOMBAY / PATNA split is the one two-panel frame, and the stamps lead the eye from one panel to the other.

**Retro rules.**
1. STT the clean vo.wav and 2-3 s windows, not only the full mix: Scribe smooths over false starts and mumbles in a long mix.
2. A take artefact can be fixed by word surgery (mute, move, splice the same word from elsewhere in the take) without moving a single word time.
3. Labels on the side the camera pushes away from get cropped: put them on the side that stays in frame.
4. AAC adds about 1 dB of true peak; loudnorm TP -3.5 lands at -2.7 dBTP and -14.7 LUFS.

**Still to improve.**
- About 75 s, longer than the channel's usual 60 s.
- The motion level is below the human band (ink cels on twos, held sets).
- Town names on the map are small on a phone.
