"""Cut native-speed photographed Indian traffic into a 56-second portrait plate."""
import json
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import requests

ROOT=Path(__file__).resolve().parents[1]
TARGET=ROOT/'public/v3-road/traffic.mp4'
CACHE=Path(tempfile.gettempdir())/'traffic-v3'
SOURCES={
    9481662:'9481662-uhd_3840_2160_24fps.mp4',
    34759747:'14736147_2160_3840_30fps.mp4',
    34759745:'14736141_2160_3840_30fps.mp4',
    28002676:'12286390_1920_1080_30fps.mp4',
    30263317:'12974074_3840_2160_32fps.mp4',
    34430107:'14586488_3840_2160_60fps.mp4',
    34574490:'14650956_2160_3840_30fps.mp4',
    30207865:'12951541_1080_1920_30fps.mp4',
}
# Source ID, source in-point, output frames, horizontal crop anchor.
# No pans, scaling animation, retiming, interpolation, looping or moving cutouts.
SHOTS=[
    (9481662,.67,240,.48), (34759747,1.0,210,.50),
    (34759745,.55,240,.50), (28002676,.35,150,.50),
    (30263317,.95,90,.46), (34430107,1.0,240,.58),
    (34574490,.75,150,.50), (30207865,4.0,165,.50),
    (9481662,11.25,195,.56)
]

def get_source(key):
    path=CACHE/f'{key}.mp4'
    if not path.exists():
        url=f'https://videos.pexels.com/video-files/{key}/{SOURCES[key]}'
        with requests.get(url,stream=True,timeout=60) as response:
            response.raise_for_status()
            tmp=path.with_suffix('.download')
            with tmp.open('wb') as out:
                for chunk in response.iter_content(1<<20):out.write(chunk)
            tmp.replace(path)
    return path

def main():
    TARGET.parent.mkdir(parents=True,exist_ok=True);CACHE.mkdir(exist_ok=True)
    source={key:get_source(key) for key in SOURCES}
    with tempfile.TemporaryDirectory(dir=CACHE) as folder:
        folder=Path(folder)
        def shot(item):
            i,(key,start,frames,x)=item
            output=folder/f'{i:02}.mp4'
            crop=f"crop=w='trunc(min(iw,ih*9/16)/2)*2':h='trunc(min(ih,iw*16/9)/2)*2':x=(iw-ow)*{x}:y=(ih-oh)/2"
            filters=f'{crop},scale=720:1280:flags=lanczos,setsar=1,fps=30,format=yuv420p'
            subprocess.run(['ffmpeg','-hide_banner','-v','error','-y','-ss',str(start),'-threads','3','-i',str(source[key]),
                '-map','0:v:0','-an','-vf',filters,'-filter_threads','2','-frames:v',str(frames),'-c:v','libx264','-threads','3',
                '-preset','veryfast','-crf','16','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709',str(output)],check=True)
            count=int(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=nb_frames','-of','csv=p=0',str(output)]))
            if count!=frames:raise ValueError(f'Shot {i} produced {count}/{frames} frames')
            print('Shot',i+1,'source',key,'frames',count,flush=True)
            return output
        with ThreadPoolExecutor(max_workers=2) as pool:
            parts=list(pool.map(shot,enumerate(SHOTS)))
        concat=folder/'edit.ffconcat'
        concat.write_text('\n'.join("file '"+p.name+"'" for p in parts)+'\n',encoding='utf8')
        tmp=TARGET.with_suffix('.partial.mp4')
        subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','1','-i',str(concat),'-c','copy','-movflags','+faststart',str(tmp)],check=True)
        tmp.replace(TARGET)
    print(TARGET)

if __name__=='__main__':main()
