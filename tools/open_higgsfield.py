"""Open Higgsfield AI from the command line: the same kie.ai endpoints and model slugs as the studio in
tools/open-higgsfield-ai (packages/studio/src/kie.js), so reels can generate images, video and lip sync from scripts.
The studio keeps its key in the browser; this reads KIE_API_KEY from the environment (setx KIE_API_KEY "<key>").
Every result is saved with a .json sidecar (model, prompt, inputs, task id, date) for docs/asset_manifest.csv.

    python tools/open_higgsfield.py credits
    python tools/open_higgsfield.py image --model nano-banana-2 --prompt "..." --aspect 9:16 --resolution 2K --out assets/generated
    python tools/open_higgsfield.py image --model nano-banana-edit --prompt "..." --ref photo.jpg --out ...
    python tools/open_higgsfield.py video --model seedance-2 --prompt "..." --aspect 9:16 --duration 5 --resolution 720p [--image first.jpg] --out ...
    python tools/open_higgsfield.py lipsync --image face.jpg --audio line.wav --out ...
    add --dry to print the request without sending it (no credits spent)

Rules (docs/OPEN-HIGGSFIELD.md): say the cost and get the user's OK before spending; no real people's faces; label AI shots.
"""
import argparse, datetime, json, os, pathlib, sys, time, urllib.request

BASE = "https://api.kie.ai"
UPLOAD = "https://kieai.redpandaai.co"   # file uploads live on their own host (docs.kie.ai/file-upload-api)
IMAGE = {"nano-banana": "nano-banana", "nano-banana-2": "nano-banana-2", "nano-banana-pro": "nano-banana-pro",
         "grok": "grok-imagine/text-to-image"}
EDIT = {"nano-banana-edit": "nano-banana-edit", "nano-banana-2": "nano-banana-2", "nano-banana-pro": "nano-banana-pro",
        "qwen": "qwen/image-to-image", "gpt-image-2": "gpt-image-2-image-to-image"}
VIDEO = {"seedance-2": "bytedance/seedance-2", "seedance-2-fast": "bytedance/seedance-2-fast",
         "seedance-1.5-pro": "bytedance/seedance-1.5-pro", "kling-2.1-pro": "kling/v2-1-pro",
         "kling-2.1-standard": "kling/v2-1-standard", "wan-3": "wan/3-0-video",
         "sora-2": "sora-2-text-to-video", "sora-2-pro": "sora-2-pro-text-to-video",
         "veo3": "veo3", "veo3_fast": "veo3_fast", "veo3_lite": "veo3_lite"}


def key():
    k = os.environ.get("KIE_API_KEY")
    if not k and sys.platform == "win32":                    # a setx from another shell isn't in this process yet
        import winreg
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as h:
                k = winreg.QueryValueEx(h, "KIE_API_KEY")[0]
        except OSError:
            pass
    if not k:
        sys.exit('KIE_API_KEY is not set. Get a key at https://kie.ai/api-key, then: setx KIE_API_KEY "<key>"')
    return k


def call(method, path, body=None, raw=None, ctype="application/json", base=BASE):
    req = urllib.request.Request(base + path, method=method, data=raw if raw is not None else (json.dumps(body).encode() if body else None),
                                 headers={"Authorization": f"Bearer {key()}", "Content-Type": ctype})
    with urllib.request.urlopen(req, timeout=120) as r:
        j = json.loads(r.read())
    if j.get("code") not in (None, 200):
        sys.exit(f"kie.ai error {j.get('code')}: {j.get('msg')}")
    return j.get("data") or {}


def upload(path):
    """a local file -> a kie.ai URL (file-stream-upload on the upload host; the studio's /api/v1 path 404s); URLs pass through"""
    if str(path).startswith("http"):
        return path
    p = pathlib.Path(path); b = "----oh" + str(int(time.time() * 1000))
    parts = [(f'--{b}\r\nContent-Disposition: form-data; name="{n}"\r\n\r\n{v}\r\n').encode() for n, v in (("uploadPath", "open-higgsfield"), ("fileName", p.name))]
    parts.append(f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="{p.name}"\r\nContent-Type: application/octet-stream\r\n\r\n'.encode() + p.read_bytes() + b"\r\n")
    d = call("POST", "/api/file-stream-upload", raw=b"".join(parts) + f"--{b}--\r\n".encode(), ctype=f"multipart/form-data; boundary={b}", base=UPLOAD)
    return d.get("downloadUrl") or d.get("fileUrl") or d.get("url")


def urls_of(d):
    for c in (d.get("resultUrls"), (d.get("response") or {}).get("resultUrls")):
        if c:
            return c
    rj = d.get("resultJson")
    if isinstance(rj, str) and rj:
        return json.loads(rj).get("resultUrls") or []
    return []


def poll(task, veo=False, every=3, limit=1800):
    t0 = time.time()
    while time.time() - t0 < limit:
        time.sleep(every)
        d = call("GET", f"/api/v1/{'veo/record-info' if veo else 'jobs/recordInfo'}?taskId={task}")
        if veo:
            if d.get("successFlag") == 1: return urls_of(d)
            if d.get("successFlag") in (2, 3): sys.exit(f"failed: {d.get('errorMessage')}")
        else:
            s = (d.get("state") or "").lower()
            if s == "success": return urls_of(d)
            if s in ("fail", "error"): sys.exit(f"failed: {d.get('failMsg')}")
        print(f"  … {int(time.time() - t0)} s", flush=True)
    sys.exit("timed out")


def save(urls, out, stem, meta):
    out = pathlib.Path(out); out.mkdir(parents=True, exist_ok=True); files = []
    for i, u in enumerate(urls):
        ext = pathlib.Path(u.split("?")[0]).suffix or ".bin"
        f = out / f"{stem}{'' if len(urls) == 1 else f'_{i}'}{ext}"
        urllib.request.urlretrieve(u, f); files.append(str(f))
    side = out / f"{stem}.json"
    side.write_text(json.dumps({**meta, "files": files, "urls": urls, "date": datetime.datetime.now().isoformat(timespec="seconds"),
                                "via": "Open Higgsfield AI (kie.ai)", "label": "AI-generated"}, indent=1, ensure_ascii=False), encoding="utf-8")
    for f in files: print("->", f)
    print("->", side)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("credits")
    for name in ("image", "video", "lipsync"):
        s = sub.add_parser(name)
        s.add_argument("--prompt", default=""); s.add_argument("--out", default="assets/generated")
        s.add_argument("--name", help="file stem (default: model + time)"); s.add_argument("--dry", action="store_true")
        if name == "image":
            s.add_argument("--model", default="nano-banana-2", choices=sorted(set(IMAGE) | set(EDIT)))
            s.add_argument("--aspect", default="9:16"); s.add_argument("--resolution", default="2K")
            s.add_argument("--ref", nargs="*", default=[], help="reference images (switches to the edit model)")
            s.add_argument("--seed", type=int)
        if name == "video":
            s.add_argument("--model", default="seedance-2", choices=sorted(VIDEO))
            s.add_argument("--aspect", default="9:16"); s.add_argument("--duration", default="5"); s.add_argument("--resolution", default="720p")
            s.add_argument("--image", help="first frame (image-to-video)")
        if name == "lipsync":
            s.add_argument("--image"); s.add_argument("--video"); s.add_argument("--audio", required=True)
    a = ap.parse_args()

    if a.cmd == "credits":
        print("credits:", call("GET", "/api/v1/chat/credit")); return

    stem = a.name or f"{getattr(a, 'model', 'lipsync')}_{datetime.datetime.now():%Y%m%d_%H%M%S}".replace("/", "-")
    veo = False
    if a.cmd == "image":
        edit = bool(a.ref)
        model = (EDIT if edit else IMAGE).get(a.model) or sys.exit(f"{a.model} has no {'edit' if edit else 'text-to-image'} slug")
        inp = {"output_format": "jpg", "prompt": a.prompt, "aspect_ratio": a.aspect, "resolution": a.resolution.upper()}
        if a.seed is not None: inp["seed"] = a.seed
        if edit:
            refs = a.ref if a.dry else [upload(r) for r in a.ref]
            if "qwen" in model: inp["image_url"] = refs[0]
            elif "gpt" in model: inp["input_urls"] = refs
            else: inp["image_input"] = refs
        body, path = {"model": model, "input": inp}, "/api/v1/jobs/createTask"
    elif a.cmd == "video":
        model = VIDEO[a.model]; img = (a.image if a.dry else upload(a.image)) if a.image else None
        if model.startswith("veo3"):
            veo = True
            body = {"prompt": a.prompt, "model": model, "generationType": "FIRST_AND_LAST_FRAMES_2_VIDEO" if img else "TEXT_2_VIDEO",
                    "aspect_ratio": a.aspect, "resolution": a.resolution, "enableFallback": False}
            if img: body["imageUrls"] = [img]
            path = "/api/v1/veo/generate"
        else:
            if img and model.startswith("sora-2"): model = model.replace("text-to-video", "image-to-video")
            inp = {"prompt": a.prompt, "aspect_ratio": a.aspect, "duration": a.duration, "resolution": a.resolution}
            if img:
                if model == "wan/3-0-video": inp["first_frame_url"] = img; inp["resolution"] = a.resolution.upper()
                else: inp["image_urls"] = [img]
            body, path = {"model": model, "input": inp}, "/api/v1/jobs/createTask"
    else:
        aud = a.audio if a.dry else upload(a.audio)
        if a.video:
            body = {"model": "volcengine/video-to-video-lip-sync", "input": {"mode": "basic", "video_url": a.video if a.dry else upload(a.video), "audio_url": aud}}
        elif a.image:
            body = {"model": "omnihuman-1-5", "input": {"image_url": a.image if a.dry else upload(a.image), "audio_url": aud, "output_resolution": "1080"}}
            if a.prompt: body["input"]["prompt"] = a.prompt
        else:
            sys.exit("lipsync needs --image or --video")
        path = "/api/v1/jobs/createTask"

    print(json.dumps({"POST": path, **body}, indent=1, ensure_ascii=False))
    if a.dry:
        print("(dry run: nothing sent, no credits spent)"); return
    task = call("POST", path, body).get("taskId") or sys.exit("no taskId returned")
    print("task", task)
    urls = poll(task, veo=veo)
    save(urls, a.out, stem, {"cmd": a.cmd, "request": body, "task": task})


if __name__ == "__main__":
    main()
