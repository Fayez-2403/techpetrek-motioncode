# Fact check (before any VO): DID YOU KNOW #01

Every demo was run ONCE on our machine by `scripts/receipts.py` (Python 3.12.10, Windows 11, tiktoken 0.14.0, 2026-11-22).
Its verbatim output is in `docs/receipts.json`, and the reel shows those strings exactly. Each source page was captured by
`scripts/grab_sources.mjs` into `public/receipts/*.png`, with its page text kept in `docs/sources.json`.

| # | Claim (spoken / on screen) | Receipt (our run) | Source page (captured) | Status |
|---|---|---|---|---|
| D1 | Python: `0.1 + 0.2` gives `0.30000000000000004`; `0.1 + 0.2 == 0.3` is `False` | receipts.json float.sum / float.eq | docs.python.org/3/tutorial/floatingpoint.html ("15. Floating-Point Arithmetic: Issues and Limitations") | ✅ |
| D2 | 0.1 never ends in binary (0.000110011001100…); like 1/3 = 0.333… in decimal, so it is rounded | float.bin01 (first 40 bits), float.exact01 = 0.1000000000000000055511151231257827021181583404541015625 | Python docs: "Consider the fraction 1/3…", "most decimal fractions cannot be represented exactly as binary fractions" | ✅ |
| D3 | Money math: do not use float (use Decimal / integer paise); Decimal gives 0.3 | float.decimal = "0.3" | Python docs (decimal module mentioned on the same page) | ✅ (on-screen tip only) |
| D4 | Gmail ignores dots: johnsmith = john.smith = j.o.h.n.smith, one inbox | – | support.google.com/mail/answer/7436150: "if your email is johnsmith@gmail.com, you own all dotted versions of your address" | ✅ (Google's own example address) |
| D5 | "johnsmith" has 256 dotted versions | 9 letters → 8 gaps → 2^8 = 256 (one dot per gap at most) | – | ✅ math |
| D6 | Good websites store a hash, not your password; hashing is one-way | – | OWASP Password Storage Cheat Sheet: "Passwords should be securely hashed … rather than encrypted or stored in plaintext"; "Hashing is a one-way function" | ✅ |
| D7 | SHA-256 of password123 vs password124: completely different, 64 hex characters, only 6 positions match | hash.h1, hash.h2, hash.same_pos = 6 | – | ✅ (labelled "demo: SHA-256"; real sites use slow salted hashes such as Argon2id or bcrypt, per OWASP) |
| D8 | AI reads tokens, not words. The same sentence: English 10 tokens; Hindi 52 tokens on the GPT-4 tokenizer (cl100k_base), 15 on the GPT-4o tokenizer (o200k_base) | tokens.cl100k_base.en.n = 10, .hi.n = 52; tokens.o200k_base.en.n = 10, .hi.n = 15; `tiktoken.encoding_for_model('gpt-4o') = o200k_base`, `('gpt-4') = cl100k_base` | github.com/openai/tiktoken README ("Visualise how the GPT-4 encoder encodes text … cl100k_base", `encoding_for_model("gpt-4o")`) | ✅ One sentence measured; we say "ek line", not "always 5x" |
| D9 | Unix time = seconds since 00:00:00 UTC, 1 January 1970 | – | Wikipedia, Year 2038 problem | ✅ |
| D10 | A signed 32-bit counter maxes at 2,147,483,647 s (~214 crore); the last second is 2038-01-19 03:14:07 UTC; the next wraps to 1901-12-13 20:45:52 UTC | y2038.max / .last / .wrap (computed) | Wikipedia: "unable to represent times after 03:14:07 UTC on 19 January 2038" … "20:45:52 UTC on 13 December 1901" | ✅ |
| D11 | Fix: 64-bit time, good for ~292 billion years | 2^63 s / 31,556,952 s/yr = 2.92e11 | Wikipedia: "…64-bit integers, which will take 292 billion years to overflow" | ✅ |

**Wording rules:**
- **Websites:** "achhi websites" (the OWASP practice), not "every website".
- **Tokens and cost:** "mehenga padta tha". APIs bill per token, but we never quote a price.
- **"Kuch computers":** only old 32-bit systems are affected, so we say "kuch computers" for 2038.
- **Labels:** the demos are labelled as our run ("hamare laptop pe run kiya").
- **Fiction:** Bro & Bhai are fictional.
