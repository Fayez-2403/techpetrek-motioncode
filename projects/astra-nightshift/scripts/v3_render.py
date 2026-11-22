"""Render deterministic editorial layers and composite them over real-time road film."""
import argparse
import json
import subprocess
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from v3_middle import paint_middle
from v3_bookends import paint_bookend

ROOT=Path(__file__).resolve().parents[1]
FPS=30
SIZE=(720,1280)
GFX=ROOT/'public/v3-edit/graphics.webm'
ROAD=ROOT/'public/v3-road/traffic.mp4'
SOUND=ROOT/'public/audio/astra-workflow.m4a'
OUT=ROOT/'out/astra-workflow-preview'
EDIT=json.loads((ROOT/'src/astra-edit.json').read_text(encoding='utf8'))

logo=Image.open(ROOT/'public/brand/techpe-trek.jpg').convert('RGBA').resize((72,72),Image.Resampling.LANCZOS)
mask=Image.new('L',logo.size); ImageDraw.Draw(mask).rounded_rectangle((0,0,71,71),radius=7,fill=255);logo.putalpha(mask)
@lru_cache(maxsize=30)
def capfont(px):
    font=ImageFont.truetype(str(ROOT/'public/fonts/Archivo-VF.ttf'),px)
    for axis in font.get_variation_axes():
        if axis['name']==b'Weight':
            axes=font.get_variation_axes()
            font.set_variation_by_axes([650 if a['name']==b'Weight' else a['default'] for a in axes])
            break
    return font

@lru_cache(maxsize=450)
def subtitle(phrase,active):
    words=phrase.split();font=capfont(37)
    for px in range(37,24,-1):
        font=capfont(px)
        if font.getlength(phrase)<=591:break
    widths=[font.getlength(w) for w in words]
    gap=font.getlength(' ')
    w=round(sum(widths)+gap*(len(words)-1))+36
    img=Image.new('RGBA',(w,63))
    d=ImageDraw.Draw(img);d.rounded_rectangle((0,0,w-1,62),radius=10,fill=(12,19,18,226))
    x=18
    for i,word in enumerate(words):
        d.text((x,45),word,font=font,fill='#ffbc74' if i==active else '#fff7e9',anchor='ls')
        x+=gap+widths[i]
    return img

def graphic(t):
    if 8<=t<44:
        frame=paint_middle(t).copy()
    else:
        frame=paint_bookend(t).copy()
    for cap in EDIT['captions']:
        if cap['start']-.017<=t<=cap['end']+.025:
            active=next((i for i,w in enumerate(cap['words']) if w['start']-.015<=t<w['end']+.025),-1)
            block=subtitle(cap['text'],active)
            frame.alpha_composite(block,((720-block.width)//2,1005))
            break
    frame.alpha_composite(logo,(607,1108))
    return frame

def build_graphics():
    GFX.parent.mkdir(parents=True,exist_ok=True)
    temp=GFX.with_suffix('.partial.webm')
    cmd=['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgba','-s','720x1280','-framerate',str(FPS),'-i','pipe:0',
         '-c:v','libvpx-vp9','-pix_fmt','yuva420p','-crf','15','-b:v','0','-deadline','realtime','-cpu-used','8',
         '-row-mt','1','-threads','5','-auto-alt-ref','0','-g','60',str(temp)]
    with subprocess.Popen(cmd,stdin=subprocess.PIPE) as encoder:
        for n in range(round(EDIT['duration']*FPS)):
            encoder.stdin.write(graphic(n/FPS).tobytes())
            if n%300==0:print('Graphics frame',n,flush=True)
        encoder.stdin.close()
        if encoder.wait():raise RuntimeError('Graphics encoding failed')
    temp.replace(GFX)

def composite():
    OUT.mkdir(parents=True,exist_ok=True)
    target=OUT/'astra-workflow-preview.mp4'; temp=target.with_suffix('.partial.mp4')
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(ROAD),'-c:v','libvpx-vp9','-i',str(GFX),'-i',str(SOUND),
        '-filter_complex','[0:v][1:v]overlay=shortest=1:format=yuv420[picture]','-map','[picture]','-map','2:a',
        '-t',str(EDIT['duration']),'-r',str(FPS),'-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p',
        '-color_primaries','bt709','-colorspace','bt709','-color_trc','bt709','-c:a','copy','-movflags','+faststart',str(temp)],check=True)
    temp.replace(target)
    times=[.7,5.2,11.7,19.1,26.4,34.5,41.4,46.2,50.8,55.1]
    sheet=Image.new('RGB',(5*192,2*372),'#161b19')
    d=ImageDraw.Draw(sheet)
    for i,t in enumerate(times):
        rgb=subprocess.check_output(['ffmpeg','-v','error','-ss',str(t),'-i',str(target),'-frames:v','1','-vf','scale=192:342','-f','rawvideo','-pix_fmt','rgb24','-'])
        x,y=i%5*192,i//5*372
        sheet.paste(Image.frombytes('RGB',(192,342),rgb),(x,y));d.text((x+8,y+348),f'{t:.1f} s',fill='#fff4df')
    sheet.save(OUT/'contact-sheet.jpg',quality=94)
    print(target)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('stage',choices=['graphics','preview','all'],default='all',nargs='?')
    stage=p.parse_args().stage
    if stage in ('graphics','all'):build_graphics()
    if stage in ('preview','all'):composite()
