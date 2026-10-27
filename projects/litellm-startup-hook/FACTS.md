# FACTS — LiteLLM 1.107.0 poisoned release (TechpeTrek reel, 2026-10-26)

Checked on 2026-10-26. Every spoken and on-screen claim traces to one of these sources.

| # | Source | Date | Read |
|---|---|---|---|
| S1 | Microsoft Security Blog, "Inside the LiteLLM 1.107.0 supply chain compromise: Credential theft through Python startup hooks" — https://www.microsoft.com/en-us/security/blog/2026/10/23/inside-the-litellm-1-107-0-supply-chain-compromise-credential-theft-through-python-startup-hooks/ | Oct 23, 2026 | yes |
| S2 | LiteLLM, "The attack chain behind the v1.107.0 LiteLLM release" (Oliver Jensen, Mateo Wang) — https://docs.litellm.ai/blog/security-incident-oct-21-2026-attack-chain | Oct 23, 2026 | yes |
| S3 | LiteLLM incident post — https://docs.litellm.ai/blog/security-incident-oct-21-2026 | Oct 21, 2026 (update Oct 23) | yes (see ../railway-ai-security/FACTS.md S7) |
| — | The Register link in the brief (theregister.com/security/2026/10/21/...) | — | **404, not used** |
| — | The brief's litellm.vercel.app URL | — | not used; the canonical post is S2 on docs.litellm.ai |

## Claims used
- **Oct 21, 2026:** seven `litellm==1.107.0` wheels were pushed to PyPI between 11:39 and 11:46 UTC, followed by the Docker Hub and GHCR images (S2). PyPI quarantined them by 13:23, and the Docker tags were pulled by 14:20 (S2). The incident post says the package was "live for approximately 2 hours" (S3).
- **"Hacked release workflow":** the attacker pushed a change to the release workflow and approved the production gate with a stolen maintainer token (S2).
- **No import needed:** "An application did not need to import LiteLLM for the payload to run." The code ran during Python site initialization (.pth / sitecustomize) (S1). We do not show the mechanism's file names on screen (safety).
- **Targets:** "authentication material across developer tools, AI applications, cloud environments", plus SSH keys, environment variables and browsers (S1). The reel says cloud credentials, AI API keys and developer secrets.
- **Not confirmed:** "A target appearing in the code does not establish successful access" (S1). Defender matches indicate "potential exposure, not confirmed exploitation" (S1).
- **Root cause (maintainers):** on May 27, 2026, a config file holding the LiteLLM Agent Platform master key was committed to a public repo, and "key revocation did not occur". On Oct 10, that key returned a GitHub CLI OAuth token belonging to an org owner. Workflows then exfiltrated maintainers' GitHub CLI tokens. On Oct 21, the release was hijacked (S2). Microsoft "has not independently determined how the attacker first accessed the upstream environment" (S1).
- **Response:** "Investigators should not start Python or pip inside a suspect environment". Use "trusted tools from a known-clean system". "Removing the package or a release tag is not sufficient recovery." Prefer a rebuild, and "Rotate reachable credentials from a known-clean machine" (S1).

## Not claimed
- Victim counts, Indian victims, or any confirmed theft from a specific user.
- That AI carried out the attack.
- Any viral or trending status. The coverage is official plus tech press only.
- **Hook joke** ("maan lo... aapki website AI ne chura li"): the hypothetical is stated as hypothetical, then corrected on screen ("nahi, abhi itna toh nahi hua"). It is not a claim.

## Safe-guard on screen
"Sirf LiteLLM 1.107.0 installs" qualifies the hook. Demo visuals are labelled ILLUSTRATIVE. Typography is used instead of real logos.
