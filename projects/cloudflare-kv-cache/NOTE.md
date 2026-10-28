# NOTE (motionmaxxing): Cloudflare GLM-5.3 KV-cache reel

**The idea.** The reel takes place inside the GPU's KV-cache pool: a lit floor of memory pages.
- The coral "exposed page" is the carried object. It lands in User A's reply, gets traced back to stale pages in the pool, and is swept mint by the fix.
- I chose this because it shows *why* the leak happened (pool < context window, rejected request still decoded), which a chat-only or lock/shield film cannot.

**Real vs illustrative.**
- **Real (FACTS.md):** every number, date, model id, quote, the root cause and the fix.
- **Illustrative, labelled on screen:** both chats and their text (fake gibberish), the KV-pool floor ("Diagram · 1 tile = 1 KV page") and the prefill → decode diagram.
- No Cloudflare logo, no screenshots and no generated images.

**Gates, measured on the 540×960 preview** (`output/cloudflare_kv_cache_preview_540x960_60fps.mp4`, look.py, run 2):
- **G0 PASS:** 55.00 s, matches `--expect 55`; audio present; -14.1 LUFS, LRA 3.5, true peak -1.5 dBFS.
- **G2 PASS:** no run of more than 3 flat frames. No frozen stretch ≥ 0.6 s. The longest static-ish stretch is 0.80 s (35.33–36.13, the patch row settling).
- **G3 PASS:** end hold 0.00 s (it ends mid-motion: CTA push-in plus floor drift).
  - Run 1 failed G3 at 1.63 s and had 1.0–1.8 s frozen floors in pool/patch. Fixed with camera drift, per-scene push-in and a near→far patch camera.
  - look.py's "final shot 11.13 s" counts from the last *detected* cut. The devs → CTA change is a same-world handoff it doesn't detect. The CTA itself is 3.86 s (7 %).
- **G1 (by eye, sheet + stills):** the proof text reads at phone size. Smallest UI text is the 22 px labels and source lines (quiet by design). Proof text is 34–76 px.
- **G4 (by eye):** one hero per frame. The hook's User B card is cropped by the frame edge and is less than half of A's area.
- **G5:** lint.mjs targets HTML films, so it doesn't apply to this Remotion build.
  - By hand: no corner labels, counters, timecodes or progress bar. The IT-hiring kit's app frame and progress bar were removed.
  - The on-screen labels are the brief's storyboard labels, set as the spoken punch line, not kickers.
- **Cut sync:** 4 of 6 detected cuts land within ±80 ms of a sound onset (67 %).
- **Motion:** mean luma change 0.8/255 is below the human band (median 6.8).
  - The question: on a light ground with slow drift, does it feel alive? Every scene has a push-in plus floor drift, and cuts land every 2–5 s on spoken words.
  - I judge it alive but calm. The user should say whether they want more energy.

**reel_qa.py (preview):** 5/7.
- The size "fail" is the preview scale.
- The "silence" is the brief's planned pause before "Important" (31.43–31.85 s, after a heartbeat). It's the only one.

**Voice check (ElevenLabs Scribe, final mix, per line):** every line is recovered.
- Transcription quirks:
  - "SGLang" → "SD lang / SG Lang"
  - "cache" → "cash"
  - "ya naya" → "ko naya" (the dry voice gives the same, so the mix isn't masking it)
- Mix fixes made after STT: SFX moved off "patch" and "ya naya karo"; music bed lowered to about 10 dB under the voice.

**Frame descriptions (look2/sheet.jpg):**
- Hook: chat card, coral chip flying in.
- Source: quoted title card + stamp.
- GLM-5.3: hero type + lanes.
- Calendar fill.
- 155 grid.
- Token counter over the blue floor fill.
- Top-down pool with the dashed context window.
- Prefill/decode with the REJECTED card.
- Stale sweep (hero).
- Recon chat.
- Close coral pages under "Important:".
- Pool grows, mint rows.
- FIXED stamp.
- Crossed warning + quote + ticked lanes.
- 3-step checklist.
- Comment field types CACHE.

**Still to improve:**
- The expanded pool after the fix is a tall pale column; it could carry a faint mint fill.
- The motion energy question above.

---

## V2: the user's Sheetal/Munni hook (60.00 s, 3600 frames). Preview: `output/cloudflare_kv_cache_v2_preview_540x960_60fps.mp4`

**Hook.**
- Lines:
  1. "Sheetal… ne AI se poocha: market growth kaisi rahegi?"
  2. "Aur AI ne market growth ka jawab bata diya… Munni ko!"
  3. "Ab Munni iska kya kare? Where is the confusion, me lord?!"
- Bridge: "Kuch aisa hi hua recently: Cloudflare ne ek real bug disclose kiya…"
- The three hook scenes are one continuous shot:
  - SHEETAL lands huge; her question bubble arrives and her reply stays on typing dots.
  - On "jawab", Munni's card rises.
  - On "Munni ko!", the chip with Sheetal's text lands in Munni's reply (silence before the hit, then a hit).
  - Munni's card becomes the hero for "where is the confusion".
- Who is who follows the incident (F2/F5/F7): Munni sent the 7-lakh-token request, and her reply carries Sheetal's earlier prompt. The names are fictional and labelled "Illustrative · names fictional". The recon scene pays it off with Munni's reply holding "Sheetal ka text".

**Gates (look.py on the V2 preview, final pass):**
- G0 PASS: 60.00 s matches `--expect 60`; audio present; -14.2 LUFS, true peak -1.9 dBFS (the limiter target is now -2 dBTP; the first V2 pass measured -0.9).
- G2 PASS: no frozen stretch ≥ 0.6 s. The longest static-ish stretch is 0.90 s (source card before its stamp). The hook's first second was 1.05 s static on the first pass; fixed with staggered entries and a faster hook camera.
- G3 PASS: end hold 0.00 s.
- Cut sync: 5 of 7 cuts land on a sound onset (71 %).

**reel_qa.py:** 5/7.
- The size "fail" is the preview scale.
- The "silence" is a 0.15 s planned dip right before "Munni ko!".

**Scribe on the V2 mix:** every line is recovered, including both names ("my lord" is how Scribe spells "me lord").

**Fixes during V2:**
- the interim "AI NE JAWAB DIYA…" line was cut to one row;
- the checklist rows arrive with the scene, not after 1.6 s of title only;
- the digital silences before "Munni" and "Important" were replaced with a reverse whoosh and a low tone.
