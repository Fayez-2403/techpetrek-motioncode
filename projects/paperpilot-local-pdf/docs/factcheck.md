# Fact check: PaperPilot: your PDFs, your device

Every on-screen and spoken claim traces to a row here (master studio §2).

- **Checked on:** 2026-10-29, against the repo `main` branch and release v0.6.1 (2026-10-26).
- **Status:** verified / uncertain / removed.

**Sources**
- **S1:** README, https://github.com/KrushnaVardhanReddy/PaperPilot
- **S2:** Release v0.6.1, https://github.com/KrushnaVardhanReddy/PaperPilot/releases/tag/v0.6.1. It ships CLI, MCP, gateway and all-in-one builds for Windows, macOS and Linux, plus WASM and an Android APK.
- **S3:** docs/coding-agents.md
- **S4:** https://usepaperpilot.com, captured 2026-10-29
- **S5:** LICENSE (Apache 2.0)
- **S6:** GitHub profile, `api.github.com/users/KrushnaVardhanReddy`: name "Krushna Vardhan Reddy Pakkiragari", location empty.

**Our own test runs (T)**
- These ran on 2026-10-29 on this Windows PC with the v0.6.1 binaries. Both SHA-256 checksums matched the release.
- Every file was synthetic, made by `scripts/demo/make_samples.py`.
- Transcripts are in `assets/recordings/`.

| # | Claim | Kind | Source | Supporting excerpt / location | Status | Approved wording |
|---|---|---|---|---|---|---|
| F1 | PaperPilot is an open-source PDF toolkit written in Rust | official | S1, S5 | "PaperPilot is a PDF and document toolkit written in Rust"; Apache 2.0 | verified | "Rust mein bana open-source PDF toolkit" / OPEN-SOURCE PDF TOOLKIT |
| F2 | Works in the browser locally (WASM); files are not uploaded | official + T | S1, S4, T3 | "files are processed in browser memory, nothing is uploaded". In T3, our browser merge of 3 PDFs made only one request, `GET …/paperpilot_wasm_bg-….wasm` (the engine download), with no POST or PUT. | verified | "browser mein locally kaam karta hai" / "0 uploads in our test" |
| F3 | Merge, split, compress | official + T | S1, T1, T2 | README "What it can do today (v0.6)". In T1, `pdf_merge`, `pdf_split` and `pdf_compress` all returned success. | verified | MERGE / SPLIT / COMPRESS |
| F4 | OCR extracts text from scanned documents | official + T | S1, T4 | "pure-Rust OCR (PaddleOCR via rten)". In T4, `paperpilot ocr` on our JPEG receipt scan returned every word ("SCANNED RECEIPT", "Chai x2", "Total Rs 85"…), with the word order inside each line reversed. It needs the OCR model pack (`models/ocr`). | verified | OCR, words highlighted on the scan |
| F5 | The same Rust engine runs in the browser, desktop and command line (plus REST and MCP) | official | S1 | "The same engine runs as: MCP server, CLI, Browser (WASM), Desktop app, Local REST API". Architecture diagram: "Rust core workspace". | verified | "Same Rust engine browser, desktop aur command line" / BROWSER·WASM, DESKTOP, CLI, LOCAL REST, MCP → RUST CORE |
| F6 | Native MCP server; agents such as Claude Code can use its PDF tools | official + T | S1, S3, T1, T2 | "Give Codex, Claude Code, Kimi Code, Pi, Claude Desktop, Cursor, or any MCP client the ability to merge, split, OCR, and compress PDFs". In T1, `tools/list` returned 76 tools. | verified | "native MCP server", "Claude Code jaise AI agents" |
| F7 | Example prompt "Merge these … PDFs and compress the result" | official | S1 | README: Restart Claude and try: "Merge these two PDFs and compress the result." | verified | terminal prompt "Merge these three sample PDFs and compress the result." |
| F8 | Claude Code + PaperPilot MCP merged and compressed our three sample PDFs | T | T2 | `claude -p` (Claude Code 2.1.312) with `--mcp-config` reported paperpilot `connected`. `mcp__paperpilot__pdf_merge` returned success, then `mcp__paperpilot__pdf_compress` returned success, writing `merged_compressed.pdf`. Run time 31.7 s. | verified | the green check plus merged_compressed.pdf, labelled "our test run · sample files" |
| F9 | Sizes 26.9 MB → 1.66 MB | T | T1, T2 | Our synthetic files only; not a general claim | verified, **not shown** as a percentage | (not shown; at most "our sample files" next to the real file names) |
| F10 | Local processing ≠ offline AI: a cloud AI agent can receive document data | analysis + T | S3, T2 | S3: "No model-provider API key is needed by PaperPilot; each agent keeps its own model authentication". The agent's own model runs wherever the agent runs. In T2 every tool call and result (paths, messages) went to the agent's model, and text tools such as `pdf_extract_text` return document text to the model. | verified (as "can / mil sakta hai") | "LOCAL PROCESSING ≠ OFFLINE AI", "cloud AI ko document data mil sakta hai" |
| F11 | Creator: Krushna Vardhan Reddy; repo KrushnaVardhanReddy/PaperPilot | official | S1, S6 | repo owner; profile name | verified | "Krushna Vardhan Reddy ka open-source project" |
| F12 | "Indian developer" | unverified | S6 + web search | Profile location empty; the articles found (zeli.app, sesamedisk) don't state it; a name is not a source | **removed** | (not said) |
| F13 | Signing / form filling | n/a | S2 | MCP lists `pdf_sign` and `pdf_fill_form`, but we didn't test them and the brief excludes them | not claimed | (not shown) |
| F14 | Benchmarks / stars / speeds | marketing | S4 | The site's "~30-95ms" and the star counts aren't used. The GitHub screenshot shows its live header as captured, with no callouts. | not claimed | (not shown) |

## Test log
- **T1: MCP over stdio** (`scripts/demo/mcp_test.py`).
  - Server info: rmcp 3.5.1; 76 tools.
  - `pdf_merge` (invoice, report, notes → merged.pdf): success.
  - `pdf_compress` (quality "medium"): success.
  - `pdf_split` (report.pdf, 3 pages): success.
  - `pdf_ocr` without models: an error asking for the model pack.
- **T2: Claude Code headless.**
  - Prompt: "Merge these three sample PDFs and compress the result."
  - Only `mcp__paperpilot__pdf_merge` and `mcp__paperpilot__pdf_compress` were allowed.
  - Result: `merged_compressed.pdf`, success. Transcript: `assets/recordings/claude_run.jsonl`.
- **T3: Browser.**
  - At https://usepaperpilot.com → Merge PDFs, we added the 3 files and clicked Merge & Download.
  - The only request was the WASM GET; merged.pdf (26.9 MB) downloaded in about 4 s.
  - Screenshots are in `assets/screenshots/web_*`.
- **T4: CLI OCR.**
  - `PAPERPILOT_OCR_MODELS_DIR=<tier dir with det.onnx, rec.onnx, dict.txt>` `paperpilot ocr --format txt` on `scanned_jpg.pdf`.
  - Output (verbatim): "RECEIPT SCANNED / 40 Rs ..... x2 Chai / 45 Rs .... x3 Samosa / 85 Rs ...... Total / you! Thank".
  - A Flate-image scan returned empty text.

## Benchmarks
None shown. The repo's README benchmark table is still a TODO.

## Not used
- **docs/assets/demo.gif (repo):** a staged animation. Its tool names (`paperpilot_merge`) don't match the real server (`pdf_merge`), and its "75% reduction" is unverified.
- **logo_design.jpg:** it carries an AI-generator watermark. We use the official app icon `apps/web/public/logo.png` instead.
