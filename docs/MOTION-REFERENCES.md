# Motion reel: reference and music evidence

Reviewed 2026-10-13. This document separates directly inspected material from production choices. Repository names belong in the research/DM pack, not in the reel.

## Access and reproducibility

The public web fetcher was throttled on all three supplied links. Public, unauthenticated `yt-dlp` access succeeded; no cookies, account, private endpoint, or access-control bypass was used. Metadata and local study copies are in `out/motion_references/` (review assets, not footage to insert into the new reel).

```powershell
yt-dlp --no-playlist --write-info-json -f 'bestaudio/best' -o 'out/motion_references/%(id)s.%(ext)s' 'https://www.youtube.com/shorts/wm8wIdmbVRo'
yt-dlp --no-playlist --write-info-json -o 'out/motion_references/%(id)s.%(ext)s' 'https://www.instagram.com/reel/Dd_ukOdCp0v/' 'https://www.instagram.com/reel/DeEmzj3z0Wb/'
```

Visual review used actual decoded video frames: 20 evenly spaced frames per reel, plus a 20-frame sequence at 0.2-second spacing for the first reel's central transition. These observations are frame-sequence analysis, not a claim of having listened to or transcribed the full references.

## Reference 1: visual energy and connected motion

[User's first Instagram reference](https://www.instagram.com/reel/Dd_ukOdCp0v/) is by **nikoaed / Nihat Mustafayev**. Its public description credits Wuthering Waves footage, the song `trndsttr`, After Effects, and the fonts Go Long and Twilight New Moon. The retrieved file is 720 × 1280, 30 fps, 18.132 seconds.

Observed frame sequence:

| Approximate source time | Visible behavior | Transferable idea |
| --- | --- | --- |
| 0–4 s | Rotated character footage; warm red light; a close-up opens into a wider body/arm composition. | Establish one dominant direction and change the scale continuously. |
| 4.0–5.4 s | Large hand and glowing wrist ring recede toward a centered circular portal. | Carry a shared circular anchor through a push/pull transition. |
| 5.6–7.2 s | Narrow vertical strips appear progressively, combining cropped red footage and very condensed lyric type. | Typography can be a moving mask for the same visual world. |
| 7.4–7.8 s | Nested black-and-white cards rotate and expand into a tunnel. | Use repeated geometry to make a spatial transition, with a clear center. |
| Roughly 8–13 s | White/black character compositions give way to deep red, cyan/blue geometry, then bright warm imagery. | Reserve contrasting color changes for large musical events. |
| Roughly 13–18 s | Strip typography returns, followed by card/character imagery. | Reuse a motif so a fast montage still has visual identity. |

The narrow strips, dominant subject, strong center, and repeated motifs are the useful reference vocabulary. The source is an edited game clip; its footage, lyric copy, sideways text, and exact compositions are not needed for the new original motion scene.

Review sheets:

- `out/motion_references/Dd_ukOdCp0v_contact.jpg`
- `out/motion_references/Dd_ukOdCp0v_detail_contact.jpg`

## Reference 2: premise, visible process, and CTA

[User's second Instagram reference](https://www.instagram.com/reel/DeEmzj3z0Wb/) is by **siddhantt.ai / Siddhant Agrawal**. Its caption offers a guide in response to the comment keyword **motion**. The retrieved file is 720 × 1280, 30 fps, 92.645 seconds.

Observed frames show a phone recording of a laptop playing a motion explainer. Above the laptop, a persistent motion-graphics question and crossed-out After Effects / Claude icons establish the premise. The on-screen explainer uses dark graph paper, orange/white type, curves, a written animation prompt, code, an embedded preview, and examples of procedural changes. Later frames show a particle field and a return to the idea-to-result theme.

For the requested short reel, the useful idea is to **show the result first, then show enough actual process to make it believable, then give one clear keyword CTA**. The reference demonstrates a CTA format; it does not establish an engagement forecast. The proposed shorter duration and full-screen artwork are editorial choices for this brief, not attributes of this reference.

Review sheet: `out/motion_references/DeEmzj3z0Wb_contact.jpg`.

## Exact music reference

[The supplied YouTube Short](https://www.youtube.com/shorts/wm8wIdmbVRo) is titled **MATUSHKA ULTRAFUNK [ ULTRA SLOWED** (followed by emoji), uploaded by **phonk_music / @phonk_music_B.D**. Metadata reports 15 seconds; decoded mono audio measures 15.000136 seconds at 22,050 Hz. The exact retrieved audio is `out/motion_references/wm8wIdmbVRo.webm`; the download used YouTube audio format 251.

The upload title identifies the user's reference as an ultra-slowed edit. It does **not** verify that its playback speed or crop is identical to a commercially released version. The official artist-channel listing names **satirin, FUNK DEMON, EVO** for [MATUSHKA ULTRAFUNK](https://www.youtube.com/watch?v=Ian0Ts-HYYI). The [Spotify release listing](https://open.spotify.com/embed/album/3rqBLadhpdulTQK47p60bj) distinguishes normal, sped-up, and slowed recordings. Use the supplied 15-second source for timing rather than substituting another recording with the same title.

### Measurements, including uncertainty

Analysis used the decoded source, not a catalog BPM or the project's existing nominal voiceover grid. `analysis/audio_vo.py` explicitly uses a nominal 120 BPM for speech; that is not evidence about this song.

- `librosa.onset.onset_strength`, 22,050 Hz, 256-sample hop: strong onset autocorrelation peaks at **0.3019, 0.6037, 0.9056, 1.2074, 1.5209 s**.
- A fine periodic fit to spectral flux over 0.4–14.7 s finds a subdivision period near **0.30315 s**. Interpreting two subdivisions as one beat gives **98.96 BPM**. This is a measured timing interpretation, not verified original-song metadata.
- Automatic beat tracking varies with its prior: approximately **66.256**, **99.384**, or **132.512 BPM**. Their common subdivision explains the ambiguity. Do not present the automatic output as an unambiguous musical meter.
- The best flux phase is near **0.170 s** modulo 0.30315 s. Flux analysis has window latency; actual attacks are approximately 20–30 ms earlier in this analysis. This alone does not identify bar one or choose between the two possible quarter-note phases.
- Strong detected flux onsets include **0.7663, 1.0681, 1.9853, 2.8909, 3.4946, 4.4002, 5.0271, 5.3290, 5.6192, 5.9211, 6.3739, 6.8383, 7.4536, 7.7439, 9.4273, 10.1820, 11.6912 s**. These are analysis-window event times, not a hand-confirmed beat sheet.
- The initial approximately 0.1045 s event includes the start-of-clip attack; using it blindly as musical beat zero would be unreliable.

Intermediate numerical data are retained in `out/motion_references/music_analysis.npz`. The production pipeline should keep the final source hash, trim, measured events, timing method, and review status in its own generated manifest. A 15-second edit should preserve this exact crop unless deliberately retimed and reanalyzed.

## Production direction supported by these references

1. Open immediately on a strong, readable motion result. Use a single persistent hero form and move the camera through related compositions.
2. Carry that form through a circular portal, type mask, repeated-card tunnel, and final typographic lockup. Keep transition centers and directional momentum coherent.
3. Couple the largest reveals to measured attacks. Continuous drift, orbit, and deformation can run between them; every element need not bounce on every subdivision.
4. Make process visible with a brief prompt-to-shape or code-to-geometry transformation. Any claim about which model created the final output must match its real provenance.
5. End with one readable comment keyword, **MOTION**, and the promised guide/repo pack via DM. Keep repository names, URLs, and star counts out of the picture.
6. Return the central form toward its opening composition to support a visual loop. Review the audio end/start junction separately; the supplied crop is not proven to be a seamless musical loop.

Final checks should include a real-time motion preview, text readability on a phone-sized frame, transient alignment at the beginning/middle/end, and whether the final CTA has enough time to read. A still contact sheet alone cannot prove smooth animation or tight audio sync.
