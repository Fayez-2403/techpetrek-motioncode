"""Editable mid-film overlays. Call paint_middle(global_seconds) over the moving city."""
from functools import lru_cache
import json
import math
from pathlib import Path
import re

from PIL import Image, ImageDraw, ImageFont, ImageOps


PROJECT = Path(__file__).resolve().parents[1]
FONTS = PROJECT / "public/fonts"
W, H = 720, 1280
CARD_W = 600
INK = "#141917"
PAPER = "#fff4df"
MUTED = "#bac3b8"
AMBER = "#ffb65c"
OLIVE = "#526055"
LINE = "#435047"
PALE = "#c1b8a4"
SHADE = "#29332d"


@lru_cache(maxsize=128)
def font(size, mono=False, weight=600):
    family = "JetBrainsMono-VF.ttf" if mono else "Archivo-VF.ttf"
    face = ImageFont.truetype(str(FONTS / family), size)
    values = [a["default"] for a in face.get_variation_axes()]
    values[0] = weight
    face.set_variation_by_axes(values)
    return face


def type_at(draw, pos, text, size, color=PAPER, *, mono=False, weight=600, width=544):
    """Keep source excerpts and file paths inside the compositor's title-safe width."""
    face = font(size, mono, weight)
    while size > 13 and face.getlength(text) > width:
        size -= 1
        face = font(size, mono, weight)
    draw.text(pos, text, font=face, fill=color, anchor="lt", stroke_width=0)
    return face.getlength(text)


def rule(draw, y, first=25, last=575, color=LINE):
    draw.line((first, y, last, y), fill=color)


def card(height, light=False):
    image = Image.new("RGBA", (CARD_W, height))
    draw = ImageDraw.Draw(image)
    base = (247, 238, 216, 252) if light else (20, 25, 23, 247)
    edge = "#acaa95" if light else "#72786b"
    draw.rounded_rectangle((0, 0, CARD_W - 1, height - 1), radius=8, fill=base, outline=edge)
    return image, draw


def header(draw, title, light=False):
    color = OLIVE if light else MUTED
    draw.line((25, 30, 38, 30), fill=OLIVE if light else AMBER, width=3)
    type_at(draw, (51, 20), title, 18, color, mono=True, weight=500, width=515)
    rule(draw, 56, color="#c8bfaa" if light else LINE)


@lru_cache(maxsize=1)
def script():
    data = json.loads((PROJECT / "src/config/voScript.json").read_text(encoding="utf8"))
    return {entry["scene"]: entry["cap"] for entry in data["reel"]}


@lru_cache(maxsize=1)
def timing():
    data = json.loads((PROJECT / "SCENE_TIMINGS.json").read_text(encoding="utf8"))
    chase = next(s for s in data["shots"] if s["id"] == "chase")
    raw = (PROJECT / "post/nightshift.srt").read_text(encoding="utf8")
    cue = next(s for s in re.split(r"\n\s*\n", raw) if script()["chase"] in s)
    def sec(token):
        h, m, s = token.replace(",", ".").split(":")
        return int(h) * 3600 + int(m) * 60 + float(s)
    start, end = map(sec, cue.splitlines()[1].split(" --> "))
    return chase["start"], chase["end"], start, end


def ease(u):
    x = min(1.0, max(0.0, u))
    return x*x*(3-2*x)


def file_glyph(draw, x, y, color):
    draw.line([(x,y),(x+12,y),(x+18,y+6),(x+18,y+22),(x,y+22),(x,y)], fill=color, width=2)
    draw.line([(x+11,y+1),(x+11,y+7),(x+17,y+7)], fill=color)


@lru_cache(maxsize=4)
def brief(active):
    image, d = card(395)
    header(d, "docs/astra-workflow.md")
    type_at(d,(25,86),"Read the brief.",55,weight=770)
    rows = [
        ("Audience","Techpetrek viewers"),
        ("Runtime","56 seconds"),
        ("Action","Comment “story” for the repo"),
    ]
    for index, (name,value) in enumerate(rows):
        y=169+56*index
        if index == active:
            d.rectangle((18,y-9,581,y+33),fill=SHADE)
            d.rectangle((18,y-9,21,y+33),fill=AMBER)
        type_at(d,(34,y),name,21,MUTED,weight=520,width=118)
        type_at(d,(164,y-2),value,28,AMBER if index==active else PAPER,weight=680,width=404)
    rule(d,333)
    file_glyph(d,27,349,MUTED)
    type_at(d,(59,350),"Project rules",19,MUTED,weight=500)
    type_at(d,(217,351),"CLAUDE.md",20,PAPER,mono=True)
    return image


@lru_cache(maxsize=3)
def screen_frame(centiseconds):
    location = PROJECT / f"out/preview/frame-{centiseconds:04d}.jpg"
    # The original source art remains available in checkouts without build outputs.
    alternate = PROJECT / "public/v2-road/rear.webp"
    with Image.open(location if location.exists() else alternate) as im:
        return ImageOps.fit(im.convert("RGB"), (146,75), centering=(.52,.56)).convert("RGBA")


@lru_cache(maxsize=2)
def shots(second):
    image,d=card(394)
    header(d,"src/config/voScript.json")
    type_at(d,(25,83),"Script or shot list?",49,weight=770)
    rule(d,151)
    lines=[("SHOT DIRECTION", script()["run"], 1260),
           ("VIEWER CUE", script()["chase"], 1750)]
    for i,(label,quote,frame) in enumerate(lines):
        y=167+i*103
        selected=(i==int(second))
        image.alpha_composite(screen_frame(frame),(25,y))
        if selected:
            d.rectangle((25,y,28,y+74),fill=AMBER)
        type_at(d,(188,y+4),label,17,AMBER if selected else MUTED,mono=True)
        type_at(d,(188,y+34),quote,28,PAPER,weight=680,width=383)
    return image


PROMPT = ["Keep the strongest opening.",
          "Cut repeated lines.",
          "Match each line to a shot.",
          "End with one clear action."]


@lru_cache(maxsize=1)
def request_base():
    image,d=card(393,light=True)
    header(d,"Rewrite request",light=True)
    type_at(d,(26,81),"Prompt for Astra",47,INK,weight=760)
    d.line((30,160,30,332),fill="#a2733b",width=3)
    return image


def rewrite(t):
    image=request_base().copy()
    d=ImageDraw.Draw(image)
    for n,line in enumerate(PROMPT):
        # Reveal in actual words; leave several seconds to reread the whole prompt.
        progress = max(0.0,(t-.14-n*.64)/.59)
        words=line.split()
        visible=math.ceil(min(1.0,progress)*len(words))
        if visible:
            type_at(d,(50,157+n*48)," ".join(words[:visible]),32,INK,weight=610,width=518)
    return image


@lru_cache(maxsize=1)
def timing_base():
    image,d=card(372)
    header(d,"post/nightshift.srt")
    type_at(d,(25,82),"Does the line fit?",49,weight=770)
    type_at(d,(25,151),script()["chase"],29,PAPER,weight=550)
    scene_start,scene_end,voice_start,voice_end=timing()
    scale=lambda s: round(26+550*(s-scene_start)/(scene_end-scene_start))
    type_at(d,(25,210),"SHOT",16,MUTED,mono=True)
    d.rectangle((26,239,576,251),fill=OLIVE)
    d.rectangle((scale(voice_start),237,scale(voice_end),254),fill=AMBER)
    type_at(d,(25,270),f"{scene_start:.1f}s",17,MUTED,mono=True)
    label=f"{scene_end:.1f}s"; face=font(17,True)
    type_at(d,(574-face.getlength(label),270),label,17,MUTED,mono=True)
    rule(d,305)
    type_at(d,(25,325),"Caption",21,MUTED)
    type_at(d,(137,325),f"{voice_start:.3f} – {voice_end:.3f} s",20,AMBER,mono=True)
    return image


def preview(t):
    image=timing_base().copy()
    d=ImageDraw.Draw(image)
    start,end,_,_=timing()
    x=26+round(550*min(1,max(0,(t-.2)/(end-start))))
    d.line((x,220,x,263),fill=PAPER,width=2)
    d.polygon([(x-5,215),(x+5,215),(x,222)],fill=PAPER)
    return image


TOOLS = [("Three.js","3D scene"),("GSAP","Motion"),("Remotion","Timeline"),
         ("faster-whisper","Captions"),("FFmpeg","Encoding")]


@lru_cache(maxsize=6)
def toolkit(rows):
    image,d=card(435)
    header(d,"projects/repo-studio")
    type_at(d,(25,80),"5 repos + skills",51,weight=770)
    for i,(name,role) in enumerate(TOOLS[:rows]):
        y=150+i*40
        rule(d,y)
        type_at(d,(28,y+8),name,25,weight=650,width=290)
        type_at(d,(355,y+10),role,18,AMBER,mono=True,weight=550,width=211)
    rule(d,357)
    type_at(d,(25,373),".claude/skills/reel-pipeline/",17,MUTED,mono=True)
    type_at(d,(25,397),".claude/skills/motion-studio/",17,MUTED,mono=True)
    return image


def paint_middle(t: float) -> Image.Image:
    """Return a transparent, title-safe 720x1280 layer for the supplied global time."""
    canvas=Image.new("RGBA",(W,H))
    if not 8<=t<44:
        return canvas
    if t<15:
        sec=t-8
        plate=brief(min(2,int(sec/1.7)))
        base_y=311
    elif t<23:
        sec=t-15
        plate=shots(sec>=2.80)
        base_y=325
    elif t<31:
        sec=t-23
        plate=rewrite(sec)
        base_y=305
    elif t<39:
        sec=t-31
        plate=preview(sec)
        base_y=338
    else:
        sec=t-39
        plate=toolkit(min(5,1+int(sec/.23)))
        base_y=287
    entry=ease(sec/.32)
    x=60
    y=base_y+round((1-entry)*22)
    # A shutter opening from the top edge echoes the cuts of the workstation edit.
    h=min(plate.height,max(1,round(plate.height*(.12+.88*entry))))
    if h<plate.height:
        plate=plate.crop((0,0,plate.width,h))
    canvas.alpha_composite(plate,(x,y))
    return canvas
