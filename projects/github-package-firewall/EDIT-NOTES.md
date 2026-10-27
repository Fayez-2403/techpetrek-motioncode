# Edit notes (v3: light, caution hook)

v3 (2026-10-21) = v2 + a caution-buzzer hook first, "mutabik" → "according", "waqt" → "time", and the end card's
tagline removed. v2 is kept: `EDIT-NOTES_v2-light.md`, variant `pkgfw_v2`. v1: `EDIT-NOTES_v1-dark.md`.

## Source slate (1 s, silent; for the edit only, NOT in the final video)
```
TECHPE TREK · GITHUB PACKAGE FIREWALL · v3 light + caution hook · 2026-10-21
Source: GitHub Changelog • Oct 20, 2026 (public preview) + GitHub Docs
59.016 s · 1080×1920 · 60 fps · 122 BPM · −14 LUFS
Voice: ElevenLabs Liam (Turbo v2.5, hi, seed 5) · Music: original score (synthesized)
Real screenshots labelled · official GitHub / npm logos · look-alike UI labelled ILLUSTRATION
```
To add it for review copies only: prepend 1 s of white with this text and silence; never in the posted file.

## Edit decision list (every cut on a beat; every event on its word, snapped to an eighth note)
| # | In | Out | Chapter | What happens (event time = the word that triggers it) |
|---|---|---|---|---|
| 0 | 0.000 | 5.410 | Caution hook | Buzzer 0.000 + 0.246 (beacon flash, amber edges, the sign jolts), tapes slide in; voice from 0.42; `$ npm i` pops 1.230 ("npm"); the sign turns to "Agar haan?" 3.689; the down arrow 4.426 ("dekhen") |
| 1 | 5.410 | 11.803 | Hook: one command | `npm install` types from the cut, Enter 6.885 ("install"), packages pour 7.623 ("aa jaate"), `unknown-pkg` turns red 10.082 ("kharab"), push-in 10.820 ("toh?") |
| 2 | 11.803 | 19.180 | The risk: install time | Actions look-alike; install step 13.525, secrets lift out 15.984 ("credentials"), "without running code" 17.459; GitHub's quote, attributed |
| 3 | 19.180 | 23.607 | The news | Real changelog screenshot; title 20.656 ("package firewall"), PUBLIC PREVIEW 22.377 ("preview") |
| 4 | 23.607 | 30.000 | Where it sits | Runner 24.098, coding agent 24.590, registry 26.311, request + download checked 28.770 ("check") |
| 5 | 30.000 | 41.311 | Policies admins set | Real docs screenshot, then the settings look-alike: minimum age 33.934 ("din"), malware 36.639, attestation 38.607 |
| 6 | 41.311 | 46.721 | Blocked by mistake? | The docs' own npm notice 42.049 ("block"), override link 45.492 ("link"), the request form 45.738 |
| 7 | 46.721 | 53.607 | The limits | `.npmrc` setup 48.689 ("setup"), npm only 51.148, Enterprise Cloud 52.131, the real "Availability" screenshot |
| 8 | 53.607 | 59.016 | CTA | Toggle 54.836 ("on"), Comment FIREWALL 56.066, TechpeTrek card 57.049 (name only, no tagline) |

Chapter changes are a 0.25 s fade-through (Fluent "top-level fade"). The caution chapter is the only one with motion
on a loop (the beacon turns, the tape text and the sign's stripes scroll); everything else enters with Fluent's decelerate
curves at 200–500 ms. In the caution chapter the sign is the caption (the caption card is hidden there).

## Notes
- 59.0 s, under the 60 s cap (the brief asked for 38 s; v2's conversational voice and v3's caution hook made it longer).
- The buzzer is the one louder effect (asked for with the caution hook): two 0.17 s square-wave pulses at 185 Hz, about
  4 dB under the voice. Everything else stays quiet UI foley; the music under the caution intro is a dark pad only.
- One take (seed 5), 801 characters; speech-to-text heard every word ("NPM I", "according", "time").
- At the cut into the hook the terminal briefly shows `npm i▌` before `npm install` types out: a carry-over from the sign.
