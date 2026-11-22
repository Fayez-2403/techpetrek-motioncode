"""Second STT opinion with ElevenLabs Scribe (the channel's main check). Key from HKCU, never printed.
    python scripts/audio/scribe_check.py v00 v09 ...   (no ids = every line)"""
import json, pathlib, sys, uuid, urllib.request, winreg
ROOT = pathlib.Path(__file__).resolve().parents[2]
with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as h: KEY = winreg.QueryValueEx(h, "ELEVENLABS_API_KEY")[0].strip()
ids = sys.argv[1:] or [l["id"] for l in json.loads((ROOT / "audio/out/lines.json").read_text(encoding="utf-8"))["lines"]]
for i in ids:
    data = (ROOT / "audio/out" / f"{i}.wav").read_bytes(); b = uuid.uuid4().hex
    body = (f"--{b}\r\nContent-Disposition: form-data; name=\"model_id\"\r\n\r\nscribe_v1\r\n--{b}\r\nContent-Disposition: form-data; name=\"language_code\"\r\n\r\nhin\r\n"
            f"--{b}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{i}.wav\"\r\nContent-Type: audio/wav\r\n\r\n").encode() + data + f"\r\n--{b}--\r\n".encode()
    req = urllib.request.Request("https://api.elevenlabs.io/v1/speech-to-text", data=body, headers={"xi-api-key": KEY, "Content-Type": f"multipart/form-data; boundary={b}"})
    with urllib.request.urlopen(req, timeout=120) as r: print(f"{i}: {json.loads(r.read())['text']}")
