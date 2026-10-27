# Voiceover script, v2 (as placed in the reel)

v2 (user, 2026-10-21): the same recorded takes, re-placed (no new credits): "WHATTT?!" and "Wait… ye playable hai?!" cut,
every line moved up so each reveal follows the last one directly. v1: `VOICEOVER_v1.md`.

Narrator: ElevenLabs **Liam** (TX3LPaxmHKxFdv7VOQHJ), `eleven_turbo_v2_5`, language `hi`, seed 5, speed 1.12, stability 0.45: the
channel's Hinglish setup (the user chose Hinglish over the brief's English, 2026-10-21). The actor's reactions are Liam on
`eleven_v3` (stability 0, Creative) with v3 audio tags, so they are ElevenLabs v3 scripts as the brief asks. The narrator's
lines are plain text with no tags and also run on v3 as written (v3 drifted the accent on Hindi in earlier reels, so
Turbo is used).

- Spoken = the exact text sent to the voice (Devanagari Hindi, English words in English; model numbers written
  "five-point-five" so they are read in English; 120 written एक सौ बीस).
- Display = the captions and the SRT, word for word.
- Times = where each line sits in the reel (from the voice's own character timestamps).
- Speech-to-text (ElevenLabs scribe_v1) heard every narrator line as written: "120", "Opus 5.5", "Sonnet 5.5", "Haiku 5.5",
  "20 haiku", "3D tool", "Six real builds". The reactions came back as "What?" x3, "Wait ye playable hai", "No way".

| # | Time (s) | Who | Spoken (to the voice) | Display (captions) |
|---|---|---|---|---|
| 1 | 0.00-0.72 | actor | [shocked] What?! | WHAT?! |
| 2 | 1.25-2.46 | actor | [screaming] WHAAAAAAAAT?! | WHAAAAAATTTTT?! |
| 3 | 4.25-14.20 | narrator | Claude ने अभी share किए six projects, जो लोगों ने Claude से बनाए। कुछ wild experiments, कुछ सच में काम के tools. और trust me, last दो तो next level हैं। | Claude ne abhi share kiye six projects, jo logon ne Claude se banaye. Kuch wild experiments, kuch sach mein kaam ke tools. Aur trust me, last do toh next level hain. |
| 4 | 14.56-25.65 | narrator | Number one. एक wildfire analysis prototype: आग time के साथ कैसे फैलती है, वो map करता है, और hot spots track करता है। बना है Opus five-point-five से। | Number one. Ek wildfire analysis prototype: aag time ke saath kaise failti hai, wo map karta hai, aur hot spots track karta hai. Bana hai Opus 5.5 se. |
| 5 | 26.06-33.00 | narrator | Number two. Chess, जो लगता है जैसे किसी ने school notebook में doodle किया हो। Sonnet five-point-five से बना। | Number two. Chess, jo lagta hai jaise kisi ne school notebook mein doodle kiya ho. Sonnet 5.5 se bana. |
| 6 | 33.56-41.02 | narrator | Number three. एक creator ने अपने एक सौ बीस handwritten pages को एक working font बना दिया, Opus five-point-five के साथ। | Number three. Ek creator ne apne 120 handwritten pages ko ek working font bana diya, Opus 5.5 ke saath. |
| 7 | 41.56-46.25 | narrator | और Haiku five-point-five ने बीस haiku लिखे, फिर हर frame JavaScript में draw किया। | Aur Haiku 5.5 ne bees haiku likhe, phir har frame JavaScript mein draw kiya. |
| 8 | 47.06-54.42 | narrator | Number four. एक electromagnetic field, जिसे आप देख भी सकते हो, और push भी कर सकते हो। Claude Opus five-point-five से बना। | Number four. Ek electromagnetic field, jise aap dekh bhi sakte ho, aur push bhi kar sakte ho. Claude Opus 5.5 se bana. |
| 9 | 54.75-56.70 | actor | [whispering] No. Way. | No. Way. |
| 10 | 57.06-63.10 | narrator | और number five... एक cardiology fellow ने three-D tool बनाया, जो trainees को coronary angiograms पढ़ना सिखाता है। | Aur number five... ek cardiology fellow ne 3D tool banaya, jo trainees ko coronary angiograms padhna sikhata hai. |
| 11 | 63.56-67.40 | narrator | Notebook games से... medical education तक। ये है range. | Notebook games se... medical education tak. Ye hai range. |
| 12 | 69.56-74.25 | narrator | Six real builds. Five reveals. एक सवाल: आप Claude से क्या बनाओगे? | Six real builds. Five reveals. Ek sawaal: aap Claude se kya banaoge? |

Re-cut with no new credits (the takes are cached in `audio/reveals/takes/`): `python analysis/reveals_vo.py --seed 5`.
Files: `audio/reveals/voiceover.wav` (+ .mp3), `output/reveals_captions.srt`, `data/reveals/lyrics.json`.
