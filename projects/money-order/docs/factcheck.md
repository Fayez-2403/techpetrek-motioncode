# Fact check (before any VO): Ek Baar Bheja, Do Baar Kata (2026-11-27)

The film is a "what if" fable: a 1930s village post office, a telegraph line and a city counter. Hariram, Munshi-ji, Tara and Mohan are invented, and no real person is drawn. Only the rows below are presented as real.

| # | Claim | Source + exact words | Status |
|---|---|---|---|
| F1 | Payment APIs such as Stripe take an `Idempotency-Key` header so a retry doesn't run the same operation twice (n16) | Stripe API docs: "Stripe supports idempotency for safely retrying requests without accidentally performing the same operation twice." Keys are sent "in the Idempotency-Key header" ([docs.stripe.com/api/idempotent_requests](https://docs.stripe.com/api/idempotent_requests)) | ✅ |
| F2 | The same key must be reused on every retry, and a new key is a new request (the twist, n12-n14, n17) | Stripe docs: "persist the key and reuse it on every attempt"; reusing a key returns the saved result of the first request ([docs.stripe.com/api/idempotent_requests](https://docs.stripe.com/api/idempotent_requests)) | ✅ |
| F3 | Duplicate requests happen when a sender retries after a timeout because it can't tell whether the first one landed (n04-n08) | The standard distributed-systems "at-least-once delivery" problem; the concept, illustrated | ✅ concept |
| F4 | "Achhe payment systems bhi yahi karte hain" (n17) | Phrased as the general pattern from F1/F2, **not a claim about any one Indian app or bank (UPI, etc.)** | ✅ worded generically |

## Wording rules
- **Fiction is labelled:** the money order story is a fable, and the caption says so.
- **No internals claims:** never say UPI, any bank or any named app "uses this key".
- **"Interview favourite",** never "most asked".

## v2 cold open: real screen grabs (captured 2026-11-27, mobile viewport 412x880; `scripts/grab_focus.mjs`, boxes in `docs/grab_boxes.json`)
| # | Claim (VO / screen) | Source + exact words | Status |
|---|---|---|---|
| F5 | Paytm itself writes that money gets debited while the train booking fails, and says don't rebook immediately (h1) | Paytm Travel support article "Money Deducted But No Train Ticket on Paytm: Here's the Solution" (published Oct 31, 2025): "It's a common issue: you book a train ticket, your money is debited, but the booking fails." ... "Paytm syncs with IRCTC for about 15 minutes to confirm the final status. Do not rebook immediately." ([paytm.com](https://paytm.com/support/paytm-travel/paytm-money-deducted-train-booking-failed)) | ✅ screenshots `paytm_head/common/rebook.png` |
| F6 | Google Pay India says to wait when a payment is in progress (h2) | Google Pay Help, "Fix issues with orders or payments to merchants": "If the payment is in progress, wait for five working days. If the payment fails, the money will be credited back to your account in five working days." ([support.google.com](https://support.google.com/pay/india/answer/9494510?hl=en-GB)) | ✅ screenshot `gpay_progress.png` |
| F7 | PhonePe's guide headline (shown on screen only) | PhonePe Payment Gateway article: "UPI Transaction Failed but Money Deducted: Complete Resolution Guide" ([business.phonepe.com](https://business.phonepe.com/articles/upi-transaction-failed-but-money-deducted-complete-resolution-guide)) | ✅ screenshot `phonepe_head.png` |
| F8 | "Dobara pay matlab naya payment, aur paisa do baar kat sakta hai" (h2) | **Our explanation**, said as ours after "Kyun?", not attributed to Paytm or Google Pay. A fresh attempt is a new payment; if the pending one also succeeds, you pay twice. That's the concept F1/F2 solve | ✅ worded as explanation |

**Wording rule:** the platforms are quoted only for what their pages say. The double-charge reasoning is ours, and the voice marks it with "Kyun? Kyunki...".
