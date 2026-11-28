# Ek Baar Bheja, Do Baar Kata: story (v1, 2026-11-27)

**The system:** a payments API. **The function:** charging exactly once when the network drops and the client retries. **The concept:** duplicate requests → an idempotency key → the twist: a new key per retry makes it duplicate again.

**The fable:** a 1930s money order.
- Hariram, a village farmer, sends ₹50 for his son Mohan's college fees.
- Munshi-ji telegraphs it to the city, but a storm snaps the wire mid-message.
- Munshi-ji resends, and Tara at the city counter pays twice.
- **The fix:** a receipt number (417) plus Tara's "paid" register.
- **The twist:** a worried Hariram fills in a new form with a new number, and it's paid twice again.
- **The rule:** the key is made once per payment and reused on every retry, which is Stripe's `Idempotency-Key`.

**Closing line:** "Paisa ek hi baar katna chahiye, chahe sandesh kitni bhi baar jaaye." **CTA:** RETRY.

**Cast** (new for this story; nothing is reused from Berth 42):

| Character | Build | Signature |
|---|---|---|
| Hariram | short, hunched old farmer | cream pagdi, bushy white brows and moustache, gap tooth, walking stick |
| Munshi-ji | huge, round, small head | black round cap, pince-nez on a chain, jowls, ink-stained fingers |
| Tara | tall, thin | huge hair bun with a pencil through it, big telegraph headphones, sharp nose |
| Mohan | lanky student | a tall pompadour, a college blazer, a crooked grin |

**Palette** (new, locked): periwinkle `#5a67c8`, hot-pink skin `#ec7a92`, pale cream `#f1e4cf`, khaki `#c8a24c`, post-box red `#cf3b2f`, plus ink.

**Sets:**
- **A.** The village post office by day: mud-brick wall, counter, brass scale, a red post box at the door, the telegraph key.
- **B.** The line: poles across the fields in a storm, with message dots travelling the wire.
- **C.** The city counter at night: lamp light, a ticker sounder, the "paid" register, a cash drawer.
