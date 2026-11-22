"""Cache timestamped Hindi performances and align Roman-script phrases to the takes."""
from __future__ import annotations
import base64
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import requests
import soundfile as sf
from scipy import signal

ROOT = Path(__file__).resolve().parents[1]
VERSION = "astra-workflow" if "--astra-workflow" in sys.argv else "cutting"
CFG = json.loads((ROOT / "src/config" / (VERSION+".json")).read_text(encoding="utf8"))
CACHE = ROOT / "audio/takes" / VERSION
CACHE.mkdir(exist_ok=True)
SR = 48000


def take(scene, prev, following):
    actor = CFG["voices"][scene["who"]]
    payload = dict(text=scene["tts"], model_id="eleven_multilingual_v2", language_code="hi",
                   previous_text=prev, next_text=following, seed=43,
                   voice_settings=dict(stability=.36, similarity_boost=.80, speed=1.045))
    for voice_id in [actor["id"], actor["fallback"]]:
        identity = hashlib.sha256((voice_id+json.dumps(payload,sort_keys=True)).encode()).hexdigest()[:12]
        prefix = CACHE / (scene["id"]+"-"+identity)
        audio, align = prefix.with_suffix(".mp3"), prefix.with_suffix(".json")
        if not (audio.exists() and align.exists()):
            response = requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps",
                headers={"xi-api-key":os.environ["ELEVENLABS_API_KEY"]},json=payload,timeout=80)
            if response.status_code in (400,401,402,403,404) and voice_id==actor["id"]:
                print(scene["id"],"alternate casting",response.status_code,flush=True)
                continue
            response.raise_for_status()
            body=response.json()
            audio.write_bytes(base64.b64decode(body["audio_base64"]))
            align.write_text(json.dumps(body["alignment"],ensure_ascii=False),encoding="utf8")
        raw=subprocess.check_output(["ffmpeg","-v","error","-i",str(audio),"-ac","1","-ar",str(SR),"-f","f32le","-"])
        return np.frombuffer(raw,np.float32),json.loads(align.read_text(encoding="utf8")),voice_id
    raise RuntimeError("Voice unavailable")


def timestamp(sec):
    ms=round(sec*1000)
    return f"00:00:{ms//1000:02},{ms%1000:03}"


def main():
    scenes=CFG["scenes"]
    duration=CFG["duration"]
    dry=np.zeros(round(duration*SR))
    captions=[]
    for i,s in enumerate(scenes):
        audio,al,used=take(s, scenes[i-1]["tts"] if i else "", scenes[i+1]["tts"] if i+1<len(scenes) else "")
        spoken="".join(al["characters"])
        spans=list(re.finditer(r"\S+",spoken))
        flat=[w for phrase in s["groups"] for w in phrase.split()]
        counts=s.get("counts",[1]*len(flat))
        assert len(flat)==len(counts) and sum(counts)==len(spans),(s["id"],spoken,flat)
        start=max(0,al["character_start_times_seconds"][spans[0].start()]-.045)
        end=min(len(audio)/SR,al["character_end_times_seconds"][spans[-1].end()-1]+.04)
        clip=audio[int(start*SR):int(end*SR)]
        limit=(scenes[i+1]["start"] if i+1<len(scenes) else duration)-s["at"]-.10
        # Use pitch-preserving time compression only if a performance exceeds its picture window.
        rate=max(1,len(clip)/SR/limit)
        if rate>1:
            raw=subprocess.run(["ffmpeg","-v","error","-f","f32le","-ar",str(SR),"-ac","1","-i","-","-af",f"atempo={rate}", "-f","f32le","-"],input=clip.astype('f4').tobytes(),capture_output=True,check=True).stdout
            clip=np.frombuffer(raw,'f4')
        pos=round(s["at"]*SR)
        dry[pos:pos+len(clip)]+=clip
        k=0; j=0
        for phrase in s["groups"]:
            marks=[]
            for word in phrase.split():
                a=spans[k].start(); k+=counts[j]; b=spans[k-1].end()-1; j+=1
                marks.append(dict(text=word,start=round(s["at"]+(al["character_start_times_seconds"][a]-start)/rate,3),
                                  end=round(s["at"]+(al["character_end_times_seconds"][b]-start)/rate,3)))
            captions.append(dict(text=phrase,who=s["who"],start=marks[0]["start"],end=marks[-1]["end"],words=marks))
        print(s["id"],used,round(len(clip)/SR,2),"s; tempo",round(rate,3),flush=True)
    out=ROOT/"audio/out"/VERSION;out.mkdir(exist_ok=True)
    sf.write(out/"dialogue.wav",dry,SR,subtype="PCM_16")
    edit=dict(scenes=[{k:v for k,v in s.items() if k in ("start","id")} for s in scenes],captions=captions,duration=duration)
    if VERSION=="cutting":
        (ROOT/"src/cutting-edit.js").write_text("window.cuttingEdit="+json.dumps(edit,ensure_ascii=False,indent=1)+";\n",encoding="utf8")
    else:
        (ROOT/"src/astra-edit.json").write_text(json.dumps(edit,ensure_ascii=False,indent=1)+"\n",encoding="utf8")
    stem="aakhri-cutting" if VERSION=="cutting" else VERSION
    (ROOT/"post"/(stem+".srt")).write_text("\n\n".join(f"{i+1}\n{timestamp(c['start'])} --> {timestamp(c['end'])}\n{c['text']}" for i,c in enumerate(captions))+"\n",encoding="utf8")

if __name__=="__main__":
    main()
