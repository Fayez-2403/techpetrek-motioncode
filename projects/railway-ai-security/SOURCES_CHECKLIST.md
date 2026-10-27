# SECURITY — verified sources + AI-agent safety checklist

This is the DM pack the "Comment SECURITY" CTA promises. Every link was opened on 2026-10-26 (IST); re-check before sending. Note:
**Railway here means Railway.com, the developer cloud / hosting platform. It is not Indian Railways.**

## Verified sources (October 2026)

**Railway.com incident (developer cloud)**
- Railway, "Preliminary Report: Oct 21st Security Incident" (Oct 22, 2026), the main report: what happened, scale, what to do.
  https://blog.railway.com/p/preliminary-report-october-security-incident
- Railway, "Security Disclosure: Wednesday October 21st", the first disclosure and the "roll all environment variables" advice.
  https://blog.railway.com/p/security-disclosure-wednesday-october-21st
- Railway status page: current service status and notices. https://status.railway.com/
- Railway's step-by-step recovery guides (rotate database credentials; check AWS, GCP and GitHub access; check OpenAI, Anthropic
  and OpenRouter usage; fix failing deploys). Index: https://blog.railway.com/ ; for example
  https://blog.railway.com/p/security-disclosure-recommendation-check-for-unexpected-openai-usage and
  https://blog.railway.com/p/security-disclosure-recommendation-recover-failing-deploys

**India: CERT-In**
- CERT-In CIAD-2026-0049, "AI Agents as Attack Vectors…" (Oct 15, 2026, Critical): AI agents that accessed Indian systems, plus
  CERT-In's recommendations. https://www.cert-in.org.in/s2cMainServlet?pageid=PUBVLNOTES02&VLCODE=CIAD-2026-0049
- CERT-In CIAD-2026-0053, "Compromise of LiteLLM PyPI Package and Docker Images" (Oct 23, 2026): who should check and what to
  rotate. https://www.cert-in.org.in/s2cMainServlet?pageid=PUBVLNOTES02&VLCODE=CIAD-2026-0053
- CERT-In, "Blueprint for Reducing Exposure and Defending against AI-Assisted Vulnerabilities Exploitation in Digital
  Infrastructure" (PDF, baseline controls). https://cert-in.org.in/PDF/Blueprint_for_Defending_against_AI_Assisted_Exploitation.pdf
- CERT-In CIAD-2026-0046 (Oct 9, 2026), for fintech / BFSI teams: payment and disbursement API attacks.
  https://www.cert-in.org.in/s2cMainServlet?pageid=PUBVLNOTES02&VLCODE=CIAD-2026-0046

**LiteLLM (AI gateway library)**
- LiteLLM incident post (Oct 21, 2026): affected versions, how to check, what to do.
  https://docs.litellm.ai/blog/security-incident-oct-21-2026
- LiteLLM root-cause post (Oct 23, 2026): how a never-revoked leaked key led to the release compromise.
  https://docs.litellm.ai/blog/security-incident-oct-21-2026-attack-chain

**Copilot / coding assistants (security research, patched)**
- Embrace The Red, "Visual Studio Copilot and SSMS Remote Code Execution (CVE-2026-103572)" (Oct 13, 2026).
  https://embracethered.com/blog/posts/2026/visual-studio-copilot-remote-code-execution/
- Microsoft MSRC entry for CVE-2026-103572 (lists fixed Visual Studio 2022 / 2026 builds; the entry's title also names SQL Server
  Management Studio, so update SSMS too).
  https://msrc.microsoft.com/update-guide/vulnerability/CVE-2026-103572
- VS Code users: Microsoft advisory GHSA-fq62-m6f5-c7h9 / CVE-2026-102232 (Oct 13, 2026). Copilot-agent hook edits were
  auto-approved; fixed in VS Code 1.141.1. https://github.com/microsoft/vscode/security/advisories/GHSA-fq62-m6f5-c7h9

**AI agents used for intrusions (reported)**
- Reuters, "How one hacker used AI agents and a few thousand dollars to break into scores of sites" (Oct 19, 2026).
  https://www.reuters.com/legal/government/how-one-hacker-used-ai-agents-few-thousand-dollars-break-into-scores-sites-2026-10-19/
- NorForge, "Inside Cairn" (Oct 19, 2026), the researcher's own write-up. https://norforge.com/blog/inside_cairn

**Further reading (older or global)**
- Anthropic, "Detecting and countering misuse of AI: September 2026" (Sep 10, 2026), including the section on stolen AI API keys.
  https://www.anthropic.com/threat-intelligence-report-september-2026

## 10-point defensive checklist (cloud platforms + AI agents)

1. **Rotate now if you're on Railway.** Railway recommends that customers who signed up before Oct 21 rotate the keys stored on
   Railway. Revoke the old value at the provider, then set the new one; don't just edit the variable. Check provider dashboards
   (OpenAI, Anthropic, Stripe, AWS and others) for usage you don't recognise.
2. **Check for LiteLLM 1.107.0.** Search lockfiles, images and CI caches. If any environment ran it, treat that environment as
   compromised: rebuild from a clean image and rotate every credential it could reach, from a clean machine. Follow the CERT-In
   and LiteLLM posts above.
3. **Treat AI API keys like production secrets.** They are now a prime target. Use one key per app and environment, set spend
   limits and usage alerts, and never ship a privileged key in client-side or mobile code.
4. **Keep secrets in a secrets manager, not in code.** Use a vault or your platform's secret store, scan every commit and build for
   secrets, and when a key leaks, purge it from history **and revoke it**. LiteLLM's breach began with a leaked key that was never
   revoked.
5. **Least privilege, scoped tokens.** Use fine-grained, short-lived tokens tied to a service account, not to a person's or an
   owner's account. Give the read-only scope where read is enough, and remove access you no longer use.
6. **Give every AI agent its own identity.** Use a separate, short-lived, least-privilege identity per agent or run, with
   default-deny network egress allowing only the destinations it needs (CERT-In's advice). Never give an agent your personal or
   admin credentials.
7. **Require human approval for consequential agent actions.** Deploys, deletes, database writes, payments, permission changes
   and edits to the agent's own config, hooks or MCP settings should all need a person's sign-off. Avoid "auto-approve all" or
   autopilot modes in repos that hold secrets.
8. **Prompt-injection hygiene for coding assistants.** Treat READMEs, issues, web pages, docs and MCP tool output as untrusted
   input. Don't point an agent with shell or file access at untrusted content. Keep Workspace Trust on, and keep IDEs and
   extensions patched (VS Code 1.141.1+; the October 13 Visual Studio / SSMS update).
9. **Turn on audit logs and actually read them.** Check GitHub organization and app audit logs, container registry logs (for
   example Docker Hub) and cloud audit trails. Keep logs for at least 180 days (CERT-In) and alert on bulk reads, new tokens and
   unusual API bursts.
10. **Shrink the attack surface, then expect a repeat.** Take databases and admin panels off the public internet, enforce MFA on
    every admin login, and retire old and test APIs. After any exposure, assume compromise until it is checked, retest your
    fixes, and expect another attempt within days (CERT-In).

*Defensive guidance only. No exploit steps, payloads or "exact prompts" are shared.*
