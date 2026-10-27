# VOICEOVER — HINGLISH (recording-ready)

Narrator: energetic, intelligent creator who genuinely finds this exciting. Conversational, slightly cinematic; lift on the
hook and the numbers, never shouting the whole way. Read the **SAY** line (Hindi in Devanagari, English words in English,
numbers spelled out). The **CAPTION** line is what appears on screen. Pause about **1 second between lines** so
`audio-src/align.py` can split the take (it also handles short pauses at commas). Record 48 kHz or 44.1 kHz mono WAV.

Current status: the film is cut to a **SCRATCH guide voice** (Microsoft Edge TTS hi-IN-MadhurNeural, timing only).
The final voice is ElevenLabs Liam (`audio-src/vo.py`, needs credits) or a human recording (`audio-src/align.py`).

## Pronunciation

| Word | Say it |
|---|---|
| Kimi | KEE-mee (कीमी), two short syllables, stress on the first |
| Moonshot | MOON-shot (मूनशॉट) |
| K3.1 Pro | "K three point one Pro" (के थ्री पॉइंट वन प्रो) |
| Three.js | "Three J S" (थ्री जे एस), never "three-jus" |
| BenchCAD | "Bench cad" (बेंच कैड), CAD as one word |
| Terminal-Bench 4.0 | "Terminal Bench four point zero" |
| CAD | "cad" (कैड), not C-A-D |
| agentic / agents | AY-jen-tik / AY-jents |
| OfficeQA Pro v2 | "Office Q A Pro V two" |
| TechpeTrek | "Tech पे Trek" |

## 16:9 MASTER — 138.6 s at the current timing

| # | Scene (slot) | Words | Fits? |
|---|---|---|---|
| m01 | hook (7.2 s) | 16 | 6.4 s at 2.5 w/s → yes |
| m02 | reveal (6.6 s) | 10 | 4.0 s at 2.5 w/s → yes |
| m03 | engine (9.0 s) | 13 | 5.2 s at 2.5 w/s → yes |
| m04 | coding (12.6 s) | 23 | 9.2 s at 2.5 w/s → yes |
| m05 | cad (13.8 s) | 24 | 9.6 s at 2.5 w/s → yes |
| m06 | human (18.0 s) | 29 | 11.6 s at 2.5 w/s → yes |
| m07 | finance (13.8 s) | 22 | 8.8 s at 2.5 w/s → yes |
| m08 | agents (11.4 s) | 25 | 10.0 s at 2.5 w/s → yes |
| m09 | bench (15.6 s) | 21 | 8.4 s at 2.5 w/s → yes |
| m10 | highspeed (7.8 s) | 12 | 4.8 s at 2.5 w/s → yes |
| m11 | openweight (9.0 s) | 15 | 6.0 s at 2.5 w/s → yes |
| m12 | payoff (13.8 s) | 21 | 8.4 s at 2.5 w/s → yes |

Total 231 words.

### m01 · hook · 00:00.20–00:06.45

**SAY:** क्या हो, जब AI सिर्फ answers देना छोड़ के... पूरे systems build करना शुरू कर दे?

**CAPTION:** Kya ho, jab AI sirf answers dena chhod ke... poore systems build karna shuru kar de?

### m02 · reveal · 00:07.50–00:13.01

**SAY:** Meet Kimi K three point one Pro. Moonshot AI का नया open-weight model.

**CAPTION:** Meet Kimi K3.1 Pro. Moonshot AI ka naya open-weight model.

### m03 · engine · 00:14.10–00:22.02

**SAY:** Three trillion parameter class, और one million token context window. मतलब बड़े projects, ज़्यादा context के साथ.

**CAPTION:** 3-trillion-parameter class, aur 1-million-token context window. Matlab bade projects, zyada context ke saath.

### m04 · coding · 00:23.10–00:34.59

**SAY:** Coding में, quick fixes से full-project builds तक. Front-end, interactive Three J S scenes, और Unity, Unreal, Godot जैसे game engines के साथ पूरे experiences.

**CAPTION:** Coding mein, quick fixes se full-project builds tak. Front-end, interactive Three.js scenes, aur Unity, Unreal, Godot jaise game engines ke saath poore experiences.

### m05 · cad · 00:35.70–00:48.30

**SAY:** 3D में भी. Text brief, sketch या reference image से parametric, CAD-style models. BenchCAD पर, tools के साथ, ninety-two point seven percent. Top models के करीब.

**CAPTION:** 3D mein bhi. Text brief, sketch ya reference image se parametric, CAD-style models. BenchCAD par, tools ke saath, 92.7 percent. Top models ke kareeb.

### m06 · human · 00:49.50–01:06.49

**SAY:** एक internal test में, इसने human walking simulator बनाया. One hundred sixty-seven missions, four hundred twenty reviews, thirty-six shoulder-muscle errors fix... और simulated human, गिरने से लेकर eleven point two seconds की continuous walking तक.

**CAPTION:** Ek internal test mein, isne human walking simulator banaya. 167 missions, 420 reviews, 36 shoulder-muscle errors fix... aur simulated human, girne se lekar 11.2 seconds ki continuous walking tak.

### m07 · finance · 01:07.50–01:20.42

**SAY:** Finance में, documents cross-verify करना, financial models बनाना, source-backed research. OfficeQA Pro v2 पर sixty-four point four. ये सिर्फ एक summary chatbot नहीं है.

**CAPTION:** Finance mein, documents cross-verify karna, financial models banana, source-backed research. OfficeQA Pro v2 par 64.4. Ye sirf ek summary chatbot nahi hai.

### m08 · agents · 01:21.30–01:30.80

**SAY:** असली power तब दिखती है, जब AI एक goal को steps में तोड़ दे. Plan, search, build, test, debug. और अपना काम खुद improve करे.

**CAPTION:** Asli power tab dikhti hai, jab AI ek goal ko steps mein tod de. Plan, search, build, test, debug. Aur apna kaam khud improve kare.

### m09 · bench · 01:32.70–01:46.96

**SAY:** Terminal-Bench four point zero पर, Moonshot के reported results में, Kimi K three point one Pro, sixty-five point seven percent. Claude Opus five point five, sixty-six point four. बस थोड़ा सा पीछे.

**CAPTION:** Terminal-Bench 4.0 par, Moonshot ke reported results mein, Kimi K3.1 Pro: 65.7 percent. Claude Opus 5.5: 66.4. Bas thoda sa peeche.

### m10 · highspeed · 01:48.30–01:53.81

**SAY:** और Highspeed version. Moonshot के मुताबिक, लगभग दो से तीन गुना faster.

**CAPTION:** Aur Highspeed version. Moonshot ke mutabik, lagbhag 2 se 3 guna faster.

### m11 · openweight · 01:56.10–02:03.75

**SAY:** सबसे interesting? ये open-weight है. Full weights चार November तक release करने का plan है.

**CAPTION:** Sabse interesting? Ye open-weight hai. Full weights 4 November tak release karne ka plan hai.

### m12 · payoff · 02:05.10–02:15.43

**SAY:** Coding, 3D, research, agents. Focus अब सिर्फ answers पर नहीं, काम deliver करने पर है. आप सबसे पहले क्या build करोगे?

**CAPTION:** Coding, 3D, research, agents. Focus ab sirf answers par nahi, kaam deliver karne par hai. Aap sabse pehle kya build karoge?

## 9:16 REEL — 69.3 s at the current timing

| # | Scene (slot) | Words | Fits? |
|---|---|---|---|
| r01 | hook (5.4 s) | 11 | 4.4 s at 2.5 w/s → yes |
| r02 | reveal (7.2 s) | 11 | 4.4 s at 2.5 w/s → yes |
| r03 | coding (5.4 s) | 8 | 3.2 s at 2.5 w/s → yes |
| r04 | cad (8.1 s) | 14 | 5.6 s at 2.5 w/s → yes |
| r05 | human (9.0 s) | 14 | 5.6 s at 2.5 w/s → yes |
| r06 | finance (8.4 s) | 12 | 4.8 s at 2.5 w/s → yes |
| r07 | bench (11.7 s) | 20 | 8.0 s at 2.5 w/s → yes |
| r08 | openweight (8.1 s) | 14 | 5.6 s at 2.5 w/s → yes |
| r09 | payoff (6.0 s) | 10 | 4.0 s at 2.5 w/s → yes |

Total 114 words.

### r01 · hook · 00:00.10–00:05.14

**SAY:** क्या हो, जब AI सिर्फ answers नहीं... पूरे systems build करे?

**CAPTION:** Kya ho, jab AI sirf answers nahi... poore systems build kare?

### r02 · reveal · 00:05.55–00:12.06

**SAY:** Meet Kimi K three point one Pro. Moonshot AI का नया three-T class, open-weight model.

**CAPTION:** Meet Kimi K3.1 Pro. Moonshot AI ka naya 3T-class, open-weight model.

### r03 · coding · 00:12.75–00:17.29

**SAY:** Coding में, interactive Three J S scenes, games, full-project builds.

**CAPTION:** Coding mein, interactive Three.js scenes, games, full-project builds.

### r04 · cad · 00:18.15–00:25.48

**SAY:** Text या sketch से parametric 3D models. BenchCAD पर tools के साथ ninety-two point seven percent.

**CAPTION:** Text ya sketch se parametric 3D models. BenchCAD par tools ke saath 92.7 percent.

### r05 · human · 00:26.25–00:34.74

**SAY:** Internal test. One hundred sixty-seven missions के बाद, simulated human ने eleven point two seconds continuous walking की.

**CAPTION:** Internal test: 167 missions ke baad, simulated human ne 11.2 seconds continuous walking ki.

### r06 · finance · 00:35.25–00:43.11

**SAY:** Finance में documents cross-verify, models, source-backed research. OfficeQA Pro v2 पर sixty-four point four.

**CAPTION:** Finance mein documents cross-verify, models, source-backed research. OfficeQA Pro v2 par 64.4.

### r07 · bench · 00:43.65–00:54.89

**SAY:** Terminal-Bench four point zero पर sixty-five point seven percent, Opus five point five से थोड़ा पीछे. Highspeed version, दो से तीन गुना faster, Moonshot के मुताबिक.

**CAPTION:** Terminal-Bench 4.0 par 65.7 percent, Opus 5.5 se thoda peeche. Highspeed version, 2 se 3 guna faster, Moonshot ke mutabik.

### r08 · openweight · 00:55.35–01:03.01

**SAY:** Open-weight. Full weights चार November तक planned. अभी Kimi dot A I, Kimi Code और API पर.

**CAPTION:** Open-weight. Full weights 4 November tak planned. Abhi Kimi.ai, Kimi Code aur API par.

### r09 · payoff · 01:03.45–01:07.78

**SAY:** AI से सबसे पहले क्या build करोगे? Comment में बताओ.

**CAPTION:** AI se sabse pehle kya build karoge? Comment mein batao.
