# Carbon-X reel: facts (TechpeTrek, brief "CARBON-X", 2026-10-23)

## Sources
| # | Source | Status |
|---|---|---|
| S1 | Model card: https://huggingface.co/HuggingFaceBio/Carbon-X | **Opened 2026-10-23**. Every number in the reel comes from here |
| S2 | Wired, 22 Oct 2026: https://www.wired.com/story/hugging-face-new-ai-biology-model-chat-with-dna | **Could not be opened** from this machine (fetch blocked). Nothing in the reel depends on it; it is listed as the brief's reporting source only |
| S3 | r/LocalLLaMA thread (the brief: "~70 votes at snapshot") | **Could not be opened** (fetch blocked). Not used. No vote count and no "viral" or "trending" claim anywhere |

## Facts (S1 unless noted)
| ID | Fact | S1 wording |
|---|---|---|
| F1 | 14.8B parameters, decoder-only, trained on DNA and English together | "Carbon-X is a 14.8B-parameter decoder-only language model trained jointly on DNA sequences and natural-language text." (The Safetensors panel rounds it to "15B params"; the reel uses the card's 14.8B.) |
| F2 | Open weights, Apache 2.0 | License: apache-2.0 |
| F3 | Made by Hugging Face with partners | "a joint collaboration between the research teams at Hugging Face, Zhongguancun Academy, and the Telethon Institute of Genetics and Medicine/University of Naples 'Federico II'". Published under HuggingFaceBio |
| F4 | DNA and text share one token stream; text uses BPE, DNA uses non-overlapping 6-mers (1 token = 6 bases); `<dna>` ... `</dna>` markers | Tokenizer section |
| F5 | 66.7% average over five DNA benchmarks, thinking disabled, **reported by the team** | "Carbon-X averages 66.7% with thinking disabled". The five scores: BioReason Coding 74.9, BioReason Non-SNV 85.1, GenomeQA 63.6, NextBase 39.4, FrontierVEP 70.4 (their mean is 66.68). BioReason and GenomeQA come from the literature; FrontierVEP and NextBase were built by the authors. **Not an independent or clinical benchmark** |
| F6 | Not clinically validated; not for medical decisions | "It has not been clinically validated, and it should not be used to make medical decisions." |
| F7 | Genetic data is sensitive; handling depends on how the model is accessed | "Genetic data is highly sensitive." |
| F8 | Hardware: one 80 GB GPU in bf16, so sensitive data can stay on your own infrastructure; llama.cpp / GGUF not supported | "The weights fit on a single 80 GB GPU in bfloat16, so researchers can keep sensitive or unpublished sequences on their own infrastructure." "llama.cpp and other GGUF runtimes are not supported" |
| F9 | Uses: variant-effect prediction, sequence classification, next-base prediction, explaining sequences | Intended use |
| F10 | It reads and explains sequences; it does not design new ones; it can miscount bases | "Carbon-X reads and explains existing sequences. It was not trained to design new ones." "can miscount bases, confuse coordinates or make incorrect edits" |
| F11 | The tokenizer is custom code (`trust_remote_code=True`) | How-to section |

## Voice lines → facts
| Line (word for word, the brief) | Fact |
|---|---|
| AI ab DNA se baat karega?! Haan, lekin ek important twist hai. | hook (F1, F6 follow) |
| Hugging Face ne Carbon-X release kiya hai, 14.8 billion parameter ka open AI model, | F1, F2, F3 (on screen: "Hugging Face + partners") |
| jo DNA ke A, C, G, T letters aur normal English questions ko saath process karta hai. | F1, F4 |
| Socho researcher sequence paste karke pooche: is mutation ka possible effect kya ho sakta hai? | F9. **Hypothetical**: the sequence and the A→G change are fictional, labelled on screen |
| Model research prediction aur explanation de sakta hai. | F9, F10. The answer card is an **illustrative reconstruction**, not real model output |
| Team ke apne five-benchmark tests mein average 66.7 percent score report hua. | F5 (on screen: "TEAM-REPORTED · not independent") |
| Lekin ye clinical proof ya medical diagnosis nahi hai. | F6 |
| Open weights ka fayda? Researchers apne infrastructure par sensitive data analyze kar sakte hain, hardware permitting. | F2, F7, F8 |
| Aur ek detail: normal laptop par smoothly chalega, aisa guarantee nahi. | F8 (on screen: "~80 GB GPU · bf16") |
| Science aur AI ka ye crossover crazy hai. Model card save karo aur comment DNA! | opinion + CTA |

## Claims we do not make
- No diagnosis, no health advice, no "consumer-ready", no "check your own DNA".
- No "best", no "viral", no "trending", no vote counts, no posting-time claims.
- No release date on screen (the card gives none, and Wired could not be opened). The on-screen source line reads "model card, checked 23 Oct 2026".
- No faked Hugging Face UI. Real text passages from the card appear as labelled screenshots. The official Hugging Face logo appears on the **cover** only, unaltered, as a labelled reference (user request, 2026-10-23); TechpeTrek is not affiliated.

## Receipts (real screenshots of S1, captured 2026-10-23 with app/scripts/shoot_text.ts -> app/public/carbonx/screens/)
r_params (F1), r_avg (F5; its last lines are F8), r_clinical (F6), r_sensitive (F7), r_collab (F3), r_6mer (F4), r_reads (F10).
