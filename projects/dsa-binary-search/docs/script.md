# 140 CRORE, 31 SAAWAL: Binary Search, zero to hero (script v1)

**Format:** 9:16, 60 fps, about 90 s (280 spoken words), fully animated 2D in code (Remotion + SVG), two characters, Hinglish.
**Cast (fictional):**
- **Bro:** 2 years in a service company, preparing to switch, interview tomorrow. Voice: Liam.
- **Bhai:** the senior who has already made the switch. Calm, a little smug. Voice: a second, deeper Hindi male voice, auditioned after approval.

**The one object that carries the whole film:** a yellow school scale, the 30 cm ruler every Indian student has broken. The number line *is* the scale. Every "upar/neeche" *snaps* it, and the dead half falls away. It comes back in the code scene, the office and the exam, so there is one comparison, used everywhere.

**Captions:** Roman Hinglish, word-by-word. The spoken word lights up yellow.

---

## S0 · HOOK (0:00–0:06)
**BHAI:** 140 crore log, naam ke hisaab se sorted. Ek naam dhundhna hai. Kitni baar dekhoge?
**BRO:** 140 crore baar?
**BHAI:** Sirf 31.

*Animation:*
- **Frame 0:** a sea of tiny glowing people fills the screen. The counter `1,40,00,00,000` sits at the top, and one gold person is hidden in the crowd.
- **On "Sirf 31":** a stomp on every beat as the crowd halves 31 times in 1.6 s, the dead half sweeping off-screen. The counter rolls down (70 crore … 1) while a tally flips up `1 … 31`.
- **End:** the last gold person is alone under a spotlight. Hard cut.

## S1 · THE PROBLEM (0:06–0:12)
**BRO:** Bhai, kal interview hai. Binary search aata hai, par sawaal mein dikhta hi nahi.
**BHAI:** Toh aaj zero se hero. Pehle ek game.

*Animation:*
- **Setting:** Bro's PG room at night. Laptop glow, a half-drunk cutting chai, a notification on his phone: `HR: Interview kal 10:00 AM`.
- **On "dikhta hi nahi":** Bro's head drops onto the keyboard and the keys spray letters.
- **Bhai:** leans in the doorway, pulls a yellow school scale out of Bro's bag and *whacks it open* into a giant number line.

## S2 · ZERO: THE GAME (0:12–0:31)
**BHAI:** Maine 1 se 100 mein ek number socha. Main sirf bolunga: upar ya neeche.
**BRO:** 1… 2… 3…
**BHAI:** Aise toh 100 guess lagenge. Seedha beech se kaat.
**BRO:** 50?
**BHAI:** Upar.
**BRO:** 75?
**BHAI:** Neeche.
**BRO:** 62… 68… 71!
**BHAI:** Paanch guess. Har jawab pe aadha khatam, 100 mein kabhi 7 se zyada nahi. Yahi hai binary search.

*Animation:*
- **Setup:** the scale fills the width, marked 1–100. Bhai's thought bubble shows a blurred number.
- **"1… 2… 3…":** a tiny cursor crawls tile by tile and a guess counter ticks slowly. Bhai yawns, and the wall clock spins (time passing).
- **"beech se kaat":** Bhai karate-chops the scale's middle, and the 50 tile glows.
- **Each "upar" / "neeche":** the scale **SNAPS** with a crack and a spray of splinters, and the dead half falls off and bounces out of frame. The rest slides to centre and zooms so it fills the width again.
- **"71!":** the tile flips gold and the guess counter lands on **5**. Small tag: `max 7 for 1–100`.
- **"Yahi hai binary search":** the words assemble on top of the gold tile, the only big text in the scene.

## S3 · HOW IT WORKS (0:31–0:47)
**BHAI:** Code mein bas teen cheezein: low, high, aur beech ka mid.
**BRO:** Mid chhota nikla toh low aage, bada nikla toh high peeche?
**BHAI:** Bilkul. Bas list sorted honi chahiye.
**BRO:** mid = low plus high, by 2…
**BHAI:** Ruk! Bade numbers pe overflow. Low plus, high minus low, by 2.

*Animation:*
- **"low, high, mid":** the scale becomes a sorted array of cards. Three flags plant into it, `L` (left), `H` (right) and `M` (middle), each with a thud.
- **Bro's line:** M lands on a card that is too small, and L **hops** to M+1, then the other way round for H. On screen, real code appears line by line in a dark editor (Java, the language of the 2006 bug; Python ints never overflow):
  ```java
  while (low <= high) {
      int mid = low + (high - low) / 2;
      if (a[mid] == x) return mid;
      if (a[mid] < x) low = mid + 1;
      else high = mid - 1; }
  ```
- **"sorted honi chahiye":** the cards shuffle, the flags jump to the wrong place, and a red ❌ stamp slams down.
- **Overflow beat:** Bro types `(low + high) / 2`. A sum bar grows past an `INT MAX` line, the editor glass cracks and the number flips negative. Bhai's hand corrects the line to `low + (high - low) / 2`, which glows green.
- **Small receipt chip:** `bug noted by Joshua Bloch · Google Research blog · 2006`.

## S4 · REAL USE (0:47–0:54)
**BRO:** Yeh sirf interview ke kaam ka hai?
**BHAI:** Office mein build toota, 1000 commits mein? Git bisect: sirf 10 build.

*Animation:*
- **Setting:** an office laptop. 1000 commit dots are stacked like the same scale, standing upright: green ✅ at the bottom, red ❌ at the top.
- **On "git bisect":** the scale snaps 10 times, each snap tested by a tiny build bar (green or red). The bad commit is caught in a spotlight, and a counter shows `builds: 10`.

## S5 · THE HERO MOVE (0:54–1:20)
**BRO:** Par interview mein toh array sorted hota hi nahi!
**BHAI:** Toh answer pe binary search. Yahi hero move hai.
**BHAI:** Exam mein 6 din, 5 chapter: 30, 11, 23, 4 aur 20 pages. Roz ek hi chapter. Kam se kam kitne page roz?
**BRO:** Roz 10?
**BHAI:** 11 din. Fail. Ab har speed se ek sawaal: 6 din mein hoga, haan ya na?
**BRO:** Kam speed pe na, zyada pe haan… yeh bhi toh sorted hai!
**BHAI:** Exactly. Border dhundho: 15 na, 23 haan, 19, 21, 22 na…
**BRO:** 23! 30 options, sirf 5 check.
**BHAI:** LeetCode pe iska naam: Koko Eating Bananas.

*Animation:*
- **The exam setup:** Bro's desk again. Five textbooks drop in with page counts on their spines (30, 11, 23, 4, 20), plus a desk calendar with 6 days.
- **"Roz 10?":** a day-by-day simulation. Each book splits into daily blocks, and the calendar overflows to **11** days. A red `FAIL` stamp lands.
- **"haan ya na?":** the yellow scale returns, now marked 1–30 *pages per day*. It fills left to right with red `NA` tiles that turn into green `HAAN` tiles from 23 on. Only the colour border matters.
- **"Border dhundho":** the L, M and H flags jump 15 → 23 → 19 → 21 → 22, and each check flashes its day count (8, 6, 8, 7, 7). The scale snaps toward the border.
- **"23!":** the border tile turns gold, with the tally `30 options → 5 checks`.
- **"Koko Eating Bananas":** a card flips over, *LeetCode 875 · Koko Eating Bananas*, and the books morph into banana bunches for one beat (the joke lands, then they turn back into books). Two chips slide in under it: `1011 · Ship Packages in D Days`, `410 · Split Array Largest Sum`.

## S6 · PAYOFF + CTA (1:20–1:28)
**BHAI:** Jab sawaal bole, minimum ya maximum jo shart poori kare, samajh jao: answer pe binary search.
**BRO:** Comment karo "BINARY". Aise 10 sawaal ki list bhejta hoon.

*Animation:*
- **The next morning:** an interview video call. The interviewer's problem types in (*"minimum capacity to ship within D days"*).
- **The payoff:** Bro taps the pen and a small yellow scale *snaps* in his hand, and he smiles. No big text, only his face and the scale.
- **CTA:** a tiny comment box types `BINARY` (held 1.2 s).

---

## Numbers check
All numbers are in `docs/factcheck.md` (F1–F11), and every one was recomputed.

## Voice notes (for the Devanagari TTS pass, after approval)
- **Numbers:** spoken in English digits ("thirty one", "seventy one", "one thousand"). Liam mispronounces Hindi numerals.
- **Names:** LeetCode is said as "Leet Code"; git bisect as "गिट बाइसेक्ट"; Koko Eating Bananas in English.
- **Code:** said as words, never symbols: "low plus, high minus low, by two".
- **Check:** every line goes through Scribe STT, plus a whisper second opinion.
