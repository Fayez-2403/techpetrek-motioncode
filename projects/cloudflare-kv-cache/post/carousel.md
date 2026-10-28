# Carousel (7 slides, 1080x1350, Roman Hinglish). Every claim per ../FACTS.md.

1. **Hook:** AI reply mein DOOSRE USER ka text?! 😳
   Sub: Cloudflare ka real incident, aur ye ab fixed hai.
2. **Source:** Cloudflare blog, 26 Oct 2026 (coordinated disclosure).
   "Cross-request KV cache exposure in the GLM-5.3 Workers AI model, and our remediation with SGLang"
3. **Evidence:** 155 responses (users nahi, responses) · 27 Aug → 9 Sep 2026 · sirf 681,280+ token prompts · sirf GLM-5.3.
4. **Mechanism (diagram):**
   - KV-cache pool = 681,280 tokens, context window = 1,048,576.
   - Lambi request "rejected" mark hui, phir bhi decode tak gayi.
   - Decode ne stale cache pages padhe, jinme doosre users ka data tha.
   Label: Diagram / illustrative.
5. **Caveat:** "We found no evidence of deliberate exploitation." (Cloudflare). Baaki Workers AI models affected nahi the. Fix: pool ~2.04M tokens, SGLang patched, 9 Sep ko model wapas live.
6. **Developer takeaway (3 steps):**
   1. Disaggregated SGLang? v0.5.22+ par update karo.
   2. Context limit ≤ KV-cache pool. Is incident ka root cause yahi tha.
   3. Cross-tenant isolation test CI mein rakho (TechpeTrek suggestion).
7. **CTA:** Comment CACHE, main source link share karunga. SAVE karo. 🔖
