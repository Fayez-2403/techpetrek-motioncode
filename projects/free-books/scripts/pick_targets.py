"""Pick the review targets on each captured official page (src/config/full.json) by exact text, so the cursor and
highlight boxes land on real words, and count real chapters where the page lists them. -> src/config/targets.json
Every box is in page css px (the screenshot is 1280 css wide, dpr 1.5)."""
import json, re, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
P = json.loads((ROOT / "src/config/full.json").read_text(encoding="utf8"))["pages"]

def find(pid, rx, tag=None, own=False, nth=0, maxy=99999):
    hits = [e for e in P[pid]["els"] if (not tag or e["tag"] in tag) and e["y"] < maxy and re.search(rx, e["own"] if own else e["text"], re.I)]
    hits.sort(key=lambda e: e["w"] * e["h"])           # the tightest element that contains the text
    if not hits: raise SystemExit(f"{pid}: nothing matches {rx}")
    hits = sorted(hits[: max(1, nth + 1)], key=lambda e: e["y"]) if nth else hits
    e = hits[nth] if nth else hits[0]
    return {k: e[k] for k in ("x", "y", "w", "h", "text")}

def rows(pid, rx, tag=("li", "h2", "td", "a")):
    seen, out = set(), []
    for e in sorted(P[pid]["els"], key=lambda e: e["y"]):
        t = e["text"]
        if e["tag"] in tag and re.match(rx, t) and t not in seen: seen.add(t); out.append({k: e[k] for k in ("x", "y", "w", "h", "text")})
    return out

T = {}
def put(pid, **k): T[pid] = {"url": P[pid]["url"], "H": P[pid]["H"], **k}

put("lbdl", title=find("lbdl", r"^The Little Book of Deep Learning$", ("h1",)), stat=find("lbdl", r"^more than 1'000'000 times$", ("a",)),
    free=find("lbdl", r"non-commercial Creative Commons", ("p",)), action=find("lbdl", r"^Download the phone-formatted pdf$", ("a",)), toc=[])
put("udl", title=find("udl", r"^Understanding Deep Learning$", ("h1",)), stat=find("udl", r"^Python notebooks covering the whole text$", ("h1",)),
    free=find("udl", r"^Download full PDF", ("a",)), action=find("udl", r"^Download full PDF", ("a",)), toc=[])
put("dlbook", title=find("dlbook", r"^Deep Learning$", ("h1",)), stat=find("dlbook", r"^Ian Goodfellow and Yoshua Bengio and Aaron Courville$", ("h3",)),
    free=find("dlbook", r"^The Deep Learning textbook is a resource", ("p",)), action=find("dlbook", r"^Table of Contents$", ("li", "a")), toc=rows("dlbook", r"^\d+ [A-Z]", ("li",)), chapters=len(rows("dlbook", r"^\d+ [A-Z]", ("li",))))
put("d2l", title=find("d2l", r"^Dive into Deep Learning$", ("h2",)), stat=find("d2l", r"500 universities", ("p", "span", "strong", "b")),
    free=find("d2l", r"run this book for free", ("li",)), action=find("d2l", r"500 universities", ("p", "span", "strong", "b")), toc=[])
put("mml", title=find("mml", r"^Mathematics for Machine Learning$", ("h1",)), stat=find("mml", r"^published by Cambridge University Press$", ("a",)),
    free=find("mml", r"^We will keep PDFs of this book freely available\.$", ("p",)), action=find("mml", r"^PDF of the book$", ("a",)),
    toc=rows("mml", r"^(Part I|Part II|Introduction and Motivation|Linear Algebra|Analytic Geometry|Matrix Decompositions|Vector Calculus|Probability and Distributions|Continuous Optimization)", ("li",)))
put("rl", title=find("rl", r"^Reinforcement Learning: An Introduction$", ("h1",)), stat=find("rl", r"^Richard S\. Sutton and Andrew G\. Barto$", ("h2",)),
    free=find("rl", r"^Full Pdf$", ("a",)), action=find("rl", r"^Full Pdf$", ("a",)), toc=[])
for pid in ("sre", "srw"):
    ch = rows(pid, r"^Chapter \d+ - ", ("li",))
    put(pid, title=find(pid, r"^Table of Contents$", ("h2",)), stat=ch[0], free=ch[3], action=ch[1], toc=ch, chapters=len(ch))
bs = rows("bsrs", r"^\d+\.\s", ("li", "a", "h2", "h3"))
put("bsrs", title=find("bsrs", r"^Table of Contents$", ("h1",)), stat=bs[0] if bs else None, free=bs[2] if len(bs) > 2 else None, action=bs[1] if len(bs) > 1 else None, toc=bs, chapters=len(bs))
pg = rows("progit", r"^(\d+|A\d)\. ", ("h2",))
put("progit", title=find("progit", r"^Book$", ("h1",)), stat=pg[0], free=find("progit", r"^Creative Commons Attribution Non Commercial Share Alike 3\.0 license$", ("a",)),
    action=find("progit", r"^Download Ebook$", ("h2",)), toc=pg, chapters=len([x for x in pg if re.match(r"^\d+\.", x["text"])]), appendices=len([x for x in pg if x["text"].startswith("A")]))
ej = [e for e in rows("ejs", r"^[A-Z].{3,60}$", ("li",)) if e["y"] < 900 and e["x"] > 640]
put("ejs", title=find("ejs", r"^Eloquent JavaScript4th edition \(2024\)$", ("h1",)), stat=find("ejs", r"^Contents$", ("h2",)),
    free=find("ejs", r"^Creative Commons attribution-noncommercial license$", ("a",)), action=find("ejs", r"^This book as a single PDF file$", ("a",)), toc=ej, chapters=len(ej))
put("ostep", title=find("ostep", r"^Operating Systems: Three Easy Pieces$", ("h2",)), stat=find("ostep", r"^Free Book Chapters$", ("a",)),
    free=find("ostep", r"^is and will always be free$", ("b",)), action=find("ostep", r"^Downloadable PDF \(v1\.10\):$", ("a",)), toc=[])
(ROOT / "src/config/targets.json").write_text(json.dumps(T, indent=1, ensure_ascii=False), encoding="utf8")
for k, v in T.items():
    print(f"{k:7s} toc {len(v['toc']):3d} chapters {v.get('chapters','-')!s:4s} | free: {v['free']['text'][:60] if v['free'] else None} | action: {v['action']['text'][:40] if v['action'] else None}")
