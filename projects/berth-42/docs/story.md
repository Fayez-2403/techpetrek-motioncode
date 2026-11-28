# Berth 42: the story (director's treatment, v1, 2026-11-27)

**Style:** the hand-inked cartoon cel from `docs/KT_ink_cel_style.md`, drawn fully in code.
**Gate:** this is gate 1 of the prompt (script + 3 titles). The next gates are the design sheet, then the shot list with one still per shot, then the render.

## The pick
- **System:** a ticket booking system (Tatkal, movie tickets, concert drops).
- **Function:** selling the last seat to exactly one person when thousands click at the same second.
- **Concept:** the race condition → a per-seat lock → a lock with a timer (TTL).
- **Why this one:**
  - Every Indian viewer has fought for a Tatkal berth.
  - "Design BookMyShow / IRCTC" is an interview favourite.
  - One concept carries the whole film, with its own twist built in: the fix itself becomes the next bug.

## Logline
Two strangers board the night train holding the same ticket for berth 42. To find out why, we rewind to a 10 AM booking office where two clerks share one register. We watch the "fix" create a worse bug. The ending is a sand timer on a padlock, and it explains the countdown on every payment page.

## Theme (what the viewer keeps)
> Seat ussi ki, jiska taala pehle laga. Aur sirf tab tak, jab tak ret-ghadi chale.

The seat goes to whoever locked it first, and only while the sand timer runs.

**What is real and what is a fable:** this is a "what if": what if Tatkal ran on clerks and a paper register in a 1930s booking office? The characters and the office are invented. The only real-world facts are:
- AC Tatkal opens at 10 AM.
- The Redis lock line.
- The general seat-hold pattern.

All three are listed in `factcheck.md`.

## Script (Roman Hinglish = the captions; the Devanagari TTS version is written at the voice gate)
233 words. At about 3.3 words/s (Liam, 1.2) that is **about 70 s**.

| # | Act | Line (VO) | What we see (who / face / action / camera) |
|---|---|---|---|
| 1 | Raat | Raat ke do baje. Chalti train. Berth 42 pe do aadmi, aur dono ke haath mein ek hi ticket. | Swaying compartment, cobalt night, the moon in the window. Push in as two hands shove two identical tickets "B-42" into frame from opposite sides. |
| 2 | Raat | Ek hai Chhotu. Kal subah uski shaadi hai. | Chhotu, tall and thin under a giant red safa, hugs a sehra box. Dreamy joy, then panic. |
| 3 | Raat | Doosra, Pehelwan Bhimsen. Kal uska dangal hai. | Bhimsen from a low angle, huge. He flexes; his gold tooth glints. Smug. Chhotu reacts at the edge of frame. |
| 4 | Raat | Bade Babu register kholte hain. Register kehta hai: dono sahi. | Bade Babu (the TT) raises his lantern and the register thuds open. Insert: row 42 holds two names. Both men: shock discs. |
| 5 | Rewind | Rewind. Subah ke dus baje. Tatkal khulta hai. | Bade Babu's pocket watch spins backwards. Zoom-whip into the booking office wall clock at 10:00. The crowd surges at the barred TATKAL window. |
| 6 | Rewind | Andar do clerk, Ramu aur Shamu. Register ek. | Wide, symmetrical: short round Ramu and lanky big-jawed Shamu on either side of one giant register in a light shaft. |
| 7 | Rewind | Ramu dekhta hai: berth 42 khaali. Usi second, Shamu bhi dekhta hai: khaali. | Mirror close-ups: Ramu peers over his spectacles, Shamu squints. Insert: row 42 is blank. |
| 8 | Rewind | Ramu likhta hai: Chhotu. Shamu likhta hai: Bhimsen. | **HERO SHOT:** both nibs hit row 42 on the same frame. Ink splashes. Silence, then one hit. |
| 9 | Rewind | Dono ne padha, dono ne likha. Kisi ne roka nahi. | The two names sit stacked in one row. Both clerks are smug, and the crowd cheers behind the bars. |
| 10 | Rewind | Isi ko kehte hain race condition. | Visual pun: the two pens gallop down the register row like racehorses, neck and neck. |
| 11 | Taala | Bade Babu ka naya rule: har seat ka apna taala. Likhne se pehle, taala. | Bade Babu slams a brass padlock on hook 42. Pull out: a wall of small padlocks, one per seat, so the other seats stay free to book. |
| 12 | Taala | Jiska taala pehle, seat uski. Doosre ko jawab: seat busy. | Ramu clicks the lock first. Shamu's pen bounces off a tag that says BUSY; his anger face, nostrils flared. |
| 13 | Twist | Agle din Ramu taala lagata hai, aur chai peene chala jaata hai. | Ramu locks 42, then strolls to the chai stall, smug, slurping. |
| 14 | Twist | Aur wapas aata hi nahi. | His chair sits empty. The wall clock races forward and dust drifts in the light shaft. |
| 15 | Twist | Train chali gayi. Berth 42 raat bhar khaali, taala laga hi raha. | Platform, steam: the train leaves with one dark window. Push in on the padlock still hanging on hook 42. An extra on the platform is crestfallen. |
| 16 | Ret-ghadi | Isliye ab har taale ke saath ek ret-ghadi. | Bade Babu screws a small hourglass onto the padlock. The sand starts. |
| 17 | Ret-ghadi | Das minute mein payment nahi hua, toh taala khud khul jaata hai. | The sand runs out and the shackle springs open (the one spring overshoot in the film). A new hand takes the seat. |
| 18 | Ret-ghadi | Code mein yeh ek line hai. NX: taala laga hai toh mat lagao. EX 600: das minute mein khud khul jao. | A telegram strip unrolls, inked: `SET seat:42 chhotu NX EX 600`. The camera punches in on NX, then on EX 600. |
| 19 | Aaj | Ticket app pe payment ka countdown dekha hai? Wahi ret-ghadi hai. | Match-cut: the hourglass becomes an inked phone showing a 09:59 countdown. The one time-jump in the film. |
| 20 | Aaj | Seat ussi ki jiska taala pehle laga, aur sirf tab tak jab tak ret-ghadi chale. | Back on the night train (the closing button): Chhotu asleep, curled up on the snoring Bhimsen's huge belly. They shared berth 42 after all. |
| 21 | CTA | Ticket booking ka pura design chahiye? Comment karo SEAT. | The padlock tag turns to show "SEAT". |
| 22 | Brand | Tech पे Trek: complex tech, simple aur interesting. | Logo sting over the moonlit window. |

**Why the structure works:**
- **Line 1 opens in the worst moment:** two men, one berth, one ticket.
- **Lines 2-3, the want:** a wedding against a wrestling bout, so both have a reason they can't give up.
- **Line 4 is the absurd hook:** "the register says both are right".
- **Lines 5-10 show the cause** without a lecture.
- **Lines 11-12, the turn:** the fix.
- **Lines 13-15, the twist:** the fix becomes the bug, a stuck lock.
- **Lines 16-19, the resolution:** the lock gets a timer, plus the real code line and the thing the viewer sees every day.
- **Line 20 is the closing line:** it lands the point over a warm comic image.

## Three titles (the prompt's format)
1. **How One Train Berth Got Sold Twice** ← recommended for the cover
2. He Blocked a Whole Berth for One Cup of Chai
3. How a Sand Timer Fixed Double Booking

## Cast (caricature; one silhouette and one feature readable across a room each)
| Character | Build | Signature | Heads needed |
|---|---|---|---|
| **Chhotu** (the dulha) | tall and thin (the joke is in the name) | an oversized red safa with a gold brooch, a long hooked nose, a pencil moustache, the sehra box | neutral, blink, dreamy joy, shock, anger, asleep |
| **Bhimsen** (the pehelwan) | huge | a bald dome with a tiny choti, a barbed handlebar moustache, one gold tooth, jowls, dash-row chest hair, a striped vest | neutral, blink, smug flex, anger, shock, snore |
| **Ramu** (clerk 1) | short and round | round wire spectacles, a cobalt eyeshade, sleeve garters, a pen behind the ear | neutral, blink, smug, shock, sheepish |
| **Shamu** (clerk 2) | lanky, stooped | a huge lumpy jaw, a unibrow, centre-parted slick hair | neutral, blink, anger, shock |
| **Bade Babu** (TT and station master) | stout | a walrus moustache (drawn wide enough to clear a grin), a peaked cap with a brass badge, a pocket watch on a chain | neutral, blink, stern, shock, smug |

**Extras:** the Tatkal crowd (single drawings with a breathing bob, varied hats), a chaiwala and a platform passenger.

## Sets (lit by the prompt's two-tone rules)
- **A. The night compartment:** salmon lamp light, cobalt shadow, a pale moon with a halo. Telegraph poles stream past (the background life). A swinging lantern carries the sparkle. A "42" plate sits on the berth.
- **B. The 10 AM booking office:** a barred TATKAL window with the crowd bobbing outside, and a high window throwing one warm shaft onto the register. A brass wall clock carries the sparkle; a ceiling fan turns; there is an ink pot.
- **C. The platform by day:** the train leaving in steam, one dark window, and a chai stall with steam.
- **D. Inserts:** the twin tickets, row 42, the padlock wall, the hourglass on the lock, the telegram strip, the phone countdown.

## Palette (locked, 5 colours + ink)
- cobalt `#2c4bb0`
- salmon skin `#f08470` (shade `#c95e52`, light `#f9a68e`)
- cream `#f3e5c4`
- gold `#e2a72e` (brass, the gold tooth, the sand)
- railway red `#c2392b` (the safa, the train, the ticket stamp)

Ink is `#170b08`, and the finest strokes are `#4d140a`.

## Carriers and handoffs (one object hands each act to the next)
- **The number 42:** the berth plate → row 42 → the padlock tag → `seat:42`.
- **The rewind:** Bade Babu's pocket watch spins backwards → the office wall clock at 10:00.
- **The ending:** padlock → hourglass → phone countdown.

## Sound
- **Score:** an original 1930s-cartoon score: pizzicato and a tuba "oompah" under a harmonium/shehnai-like synth lead.
  - A dholak-style groove drives the 10 AM rush; a train "chugga" rhythm runs under the night scenes.
- **SFX (numpy synth):** whip whooshes, a nib scratch, an ink splat, a padlock clunk, sand hiss, a spring boing on the unlock, a chai slurp, a train whistle and crowd murmur.
- **Silence before the two hero hits:** the nibs hitting the row, and the shackle springing open.

## CTA and DM
- **Keyword:** SEAT.
- **The DM (written at the post stage, saved in `DM/`)** covers:
  - a per-seat lock with a TTL;
  - why the lock value is the user id (release only your own lock);
  - what happens if the timer runs out mid-payment (re-check on confirm, plus an idempotency key);
  - the optimistic alternative (`UPDATE … WHERE seat=42 AND status='free'`).


## Script v2: conversational rewrite (2026-11-27, the user: "smoothen it... end in sentences, not break one by one")
- **Why it changed:** v1 was choppy, one-beat fragments ("Ek berth. Do ticket.", "Register ek.", "Rewind.").
- **How v2 reads:** it tells the story in flowing sentences, like a friend narrating, with connectors (aur, toh, jab tak, kyunki, matlab).
- **Joined lines:** three pairs run on and are read as one sentence in the take: n02→n03, n13→n14, n16→n17.
- **Pauses:** cut to 0.10 s after a comma and 0.20 s after a full stop (v1: 0.16 / 0.24).
- **Length:** 253 words, 69.6 s of speech, 74.4 s in total. Every line is STT-correct.

| # | Scene | Line (VO = captions) |
|---|---|---|
| n01 | hook | Ek hi berth ke do ticket, aur dono ke dono asli! |
| n02 | raat | Raat ke do baje, train mein ek taraf dulha Chhotu, jiski kal shaadi hai, |
| n03 | raat | aur doosri taraf Pehelwan Bhimsen, jiska kal dangal hai. |
| n04 | raat | Bade Babu register kholte hain, aur register bhi kehta hai: dono sahi! |
| n05 | rewind | Chalo thoda peeche, subah dus baje, jab Tatkal khulta hai. |
| n06 | rewind | Office mein do clerk, Ramu aur Shyamu, par register sirf ek. |
| n07 | rewind | Ramu dekhta hai berth 42 khaali hai, aur usi second Shyamu bhi. |
| n08 | rewind | Ramu likhta hai Chhotu, aur Shyamu likhta hai Bhimsen. |
| n09 | rewind | Dono ne saath padha, saath likha, aur kisi ne roka hi nahi. |
| n10 | rewind | Isi ko kehte hain race condition. |
| n11 | taala | Toh Bade Babu ka naya rule: har seat ka apna taala, aur likhne se pehle taala lagao. |
| n12 | taala | Jiska taala pehle laga, seat uski, baaki sabko jawab: seat busy. |
| n13 | twist | Sab badhiya tha, jab tak ek din Ramu taala lagakar chai peene nikal gaya, |
| n14 | twist | aur wapas aaya hi nahi. |
| n15 | twist | Train chali gayi, aur berth 42 raat bhar khaali rahi, kyunki taala laga hi raha. |
| n16 | ghadi | Isliye ab har taale ke saath ek ret-ghadi: |
| n17 | ghadi | das minute mein payment nahi, toh taala apne aap khul jaata hai. |
| n18 | ghadi | Code mein bas ek line: NX, yaani taala laga ho toh mat lagao, aur EX 600, das minute mein khud khul jao. |
| n19 | aaj | Ticket app pe payment ka countdown dekha hai na? Wahi toh ret-ghadi hai. |
| n20 | aaj | Matlab seat ussi ki jiska taala pehle laga, par tabhi tak, jab tak ret-ghadi chale. |
| n21 | cta | Ticket booking ka pura design chahiye? Comment karo SEAT. |
| n22 | cta | Tech pe Trek: complex tech, simple, aur interesting! |
