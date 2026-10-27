"""Regenerate VOICEOVER_HINGLISH.md and SOUND_CUE_SHEET.md from voScript.json, SCENE_TIMINGS.json, cues.json and the
cue log of the last mix (so the documents always match the film).   python audio-src/docs.py"""
import json, pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
import sys
sys.path.insert(0, str(HERE))
from version import V, SCRIPT_PATH, TIMINGS, OUT as VOUT  # noqa: E402
S = json.loads(SCRIPT_PATH.read_text(encoding="utf-8"))
TM = json.loads(TIMINGS.read_text(encoding="utf-8"))
CU = json.loads((ROOT / "src/audio/cues.json").read_text(encoding="utf-8"))
mmss = lambda t: f"{int(t // 60):02d}:{t % 60:05.2f}"

PRON = [
    ("Kimi", "KEE-mee (कीमी), two short syllables, stress on the first"),
    ("Moonshot", "MOON-shot (मूनशॉट)"),
    ("K3.1 Pro", "\"K three point one Pro\" (के थ्री पॉइंट वन प्रो)"),
    ("Three.js", "\"Three J S\" (थ्री जे एस), never \"three-jus\""),
    ("BenchCAD", "\"Bench cad\" (बेंच कैड), CAD as one word"),
    ("Terminal-Bench 4.0", "\"Terminal Bench four point zero\""),
    ("CAD", "\"cad\" (कैड), not C-A-D"),
    ("agentic / agents", "AY-jen-tik / AY-jents"),
    ("OfficeQA Pro v2", "\"Office Q A Pro V two\""),
    ("TechpeTrek", "\"Tech पे Trek\""),
]


def vo_doc():
    if V != "v1":
        out = [f"# VOICEOVER — ENGLISH ({V}, recording-ready)", "", "Narrator: energetic, clear, conversational creator voice; lift the hook and the numbers. Read the **SAY** line;",
               "the **CAPTION** line is on screen. ~1 s between lines so `audio-src/align.py` can split a recorded take.", "",
               f"Current voice: {S['voice']['name']} ({S['voice']['voiceId']}, rate {S['voice']['rate']}) via edge-tts. For a licensed final voice: ElevenLabs",
               "(`audio-src/vo.py`) or a human recording (`audio-src/align.py`).", ""]
    else:
        out = ["# VOICEOVER — HINGLISH (recording-ready)", "",
           "Narrator: energetic, intelligent creator who genuinely finds this exciting. Conversational, slightly cinematic; lift on the",
           "hook and the numbers, never shouting the whole way. Read the **SAY** line (Hindi in Devanagari, English words in English,",
           "numbers spelled out). The **CAPTION** line is what appears on screen. Pause about **1 second between lines** so",
           "`audio-src/align.py` can split the take (it also handles short pauses at commas). Record 48 kHz or 44.1 kHz mono WAV.", "",
           "Current status: the film is cut to a **SCRATCH guide voice** (Microsoft Edge TTS hi-IN-MadhurNeural, timing only).",
           "The final voice is ElevenLabs Liam (`audio-src/vo.py`, needs credits) or a human recording (`audio-src/align.py`).", ""]
    out += ["## Pronunciation", "", "| Word | Say it |", "|---|---|"] + [f"| {a} | {b} |" for a, b in PRON] + [""]
    for v, title in (("master", "16:9 MASTER"), ("reel", "9:16 REEL")):
        tm = TM["variants"][v]; vo = {x["id"]: x for x in tm["vo"]}; sc = {s["id"]: s for s in tm["scenes"]}
        words = 0
        out += [f"## {title} — {tm['seconds']:.1f} s at the current timing", "", "| # | Scene (slot) | Words | Fits? |", "|---|---|---|---|"]
        rows = []
        for l in S[v]:
            n = len(l["cap"].split()); words += n
            s = sc[l["scene"]]; slot = s["end"] - s["start"]
            if l.get("cut"):
                cut = next(x for x in tm["scenes"] if x["id"] == l["cut"]["scene"]); slot = cut["end"] - s["start"]
            need = n / 2.5
            rows.append(f"| {l['id']} | {l['scene']} ({slot:.1f} s) | {n} | {need:.1f} s at 2.5 w/s → {'yes' if need <= slot - 0.6 else 'tight'} |")
        out += rows + ["", f"Total {words} words.", ""]
        for l in S[v]:
            t = vo[l["id"]]
            out += [f"### {l['id']} · {l['scene']} · {mmss(t['start'])}–{mmss(t['end'])}", "", f"**SAY:** {l['tts']}", "", f"**CAPTION:** {l['cap']}", ""]
    return "\n".join(out)


def cue_doc():
    out = ["# SOUND CUE SHEET", "", "All music and effects are synthesized in `audio-src/score.py` (original; no samples). Tempo 100 BPM (beat 0.6 s),",
           "D minor (Dm–B♭–F–C per bar). Narration on top; the music ducks about 8 dB under the voice; mix normalised to",
           "−14 LUFS integrated, −1.5 dBTP (two-pass ffmpeg loudnorm). Cue definitions: `src/audio/cues.json`; absolute times below",
           "come from the last mix (`audio-src/out/<variant>/cue_log.json`).", "",
           "## Signature cues", "", "| Moment | Sound |", "|---|---|",
           "| Reveal | sub impact + glass harmonic (inharmonic partials 1 : 2.76 : 5.40 : 8.93) |",
           "| Code | high-frequency typing clicks + data pulses |", "| Assembly | magnetic locks (thump + click + ring) |",
           "| Walking | servo rhythm on the beat + heartbeat pulse (lub-dub every 2 beats) |", "| Finance | paper swishes + analytical ticks |",
           "| Benchmarks | short rising tone + 16th-note ticks |", "| Highspeed | acceleration sweep → impact |",
           "| Ending | resolve: sub + glass + Dm add9 pad swell |", "",
           "## Energy per scene (music layers 0–1)", "", "| Scene | pad | bass | arp | kick | hat | clap | drone |", "|---|---|---|---|---|---|---|---|"]
    for k, e in CU["energy"].items():
        out.append(f"| {k} | {e['pad']} | {e['bass']} | {e['arp']} | {e['kick']} | {e['hat']} | {e['clap']} | {e['drone']} |")
    for v in ("master", "reel"):
        p = VOUT / v / "cue_log.json"
        if not p.exists(): continue
        out += ["", f"## {v} cue list", "", "| Time | Cue |", "|---|---|"] + [f"| {mmss(c['t'])} | {c['cue']} |" for c in json.loads(p.read_text())]
    return "\n".join(out) + "\n"


if __name__ == "__main__":
    vo_name = "VOICEOVER_HINGLISH.md" if V == "v1" else f"VOICEOVER_ENGLISH_{V}.md"
    cue_name = "SOUND_CUE_SHEET.md" if V == "v1" else f"SOUND_CUE_SHEET_{V}.md"
    (ROOT / vo_name).write_text(vo_doc(), encoding="utf-8")
    (ROOT / cue_name).write_text(cue_doc(), encoding="utf-8")
    print("wrote", vo_name, cue_name)
