"""Runs every demo in the reel ONCE on this machine and saves the exact output to docs/receipts.json (the reel shows
these strings verbatim; nothing typed by hand). python scripts/receipts.py"""
import datetime as dt, hashlib, json, pathlib, platform, sys, time
from decimal import Decimal
import tiktoken
ROOT = pathlib.Path(__file__).resolve().parents[1]
R = {"captured": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"), "python": sys.version.split()[0], "os": platform.platform()}
# 1 floating point
R["float"] = {"sum": repr(0.1 + 0.2), "eq": repr(0.1 + 0.2 == 0.3), "exact01": str(Decimal(0.1)), "decimal": str(Decimal("0.1") + Decimal("0.2"))}
x, bits = 0.1, ""
f = Decimal(1) / Decimal(10)
for _ in range(40):
    f *= 2; b = int(f); bits += str(b); f -= b
R["float"]["bin01"] = "0." + bits
# 3 hashes
a, b = hashlib.sha256(b"password123").hexdigest(), hashlib.sha256(b"password124").hexdigest()
R["hash"] = {"in1": "password123", "in2": "password124", "h1": a, "h2": b, "same_pos": sum(1 for p, q in zip(a, b) if p == q), "len": len(a)}
# 4 tokens
S = {"en": "Tomorrow is my interview and I am very nervous.",
     "hi": "कल मेरा इंटरव्यू है और मैं बहुत घबराया हुआ हूँ।",
     "hinglish": "Kal mera interview hai aur main bahut ghabraya hua hoon."}
R["tokens"] = {}
for enc_name in ("o200k_base", "cl100k_base"):
    enc = tiktoken.get_encoding(enc_name); R["tokens"][enc_name] = {}
    for k, s in S.items():
        ids = enc.encode(s)
        R["tokens"][enc_name][k] = {"text": s, "n": len(ids), "pieces": [enc.decode_single_token_bytes(i).decode("utf-8", "replace") for i in ids]}
# 5 2038
U = dt.timezone.utc
E0 = dt.datetime(1970, 1, 1, tzinfo=U)   # Unix time = seconds since this moment (Windows can't convert negatives directly)
R["y2038"] = {"max": 2**31 - 1, "last": (E0 + dt.timedelta(seconds=2**31 - 1)).strftime("%Y-%m-%d %H:%M:%S UTC"),
              "wrap": (E0 + dt.timedelta(seconds=-2**31)).strftime("%Y-%m-%d %H:%M:%S UTC"), "now": int(time.time())}
(ROOT / "docs/receipts.json").write_text(json.dumps(R, ensure_ascii=False, indent=1), encoding="utf-8")
print(json.dumps({k: R[k] for k in ("float", "hash", "y2038")}, ensure_ascii=False, indent=1))
for e in R["tokens"]:
    print(e, {k: v["n"] for k, v in R["tokens"][e].items()})
print("o200k hi pieces:", R["tokens"]["o200k_base"]["hi"]["pieces"])
print("o200k en pieces:", R["tokens"]["o200k_base"]["en"]["pieces"])
