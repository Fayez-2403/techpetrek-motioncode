"""Score, performance cues and subtitles for the 24.8 s Nightshift edit."""
import json
import re
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

ROOT = Path(__file__).resolve().parents[1]
SR = 48000
DURATION = 24.8
CUTS = [0, 3, 7.5, 11.5, 15.5, 20]
SPEECH = [0.32, 3.50, 8.06, 12.05, 16.02, 20.40]
rng = np.random.default_rng(271)
total = round(SR * DURATION)
mix = np.zeros((total, 2))
voice = np.zeros(total)


def local(duration):
    return np.arange(round(duration * SR)) / SR


def put(start, audio, level=1, pan=0):
    offset = round(start * SR)
    n = min(len(audio), total - offset)
    if n > 0:
        stereo = np.array([np.sqrt(1 - pan), np.sqrt(1 + pan)])
        mix[offset:offset+n] += audio[:n, None] * level * stereo


def sine(phase):
    return np.sin(2 * np.pi * phase)


def envelope(t, attack, decay):
    return np.minimum(1, t / attack) * np.exp(-t / decay) * np.minimum(1, (t[-1] - t) / .018)


def note(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def noise(t, band):
    sos = signal.butter(2, band, 'bandpass', fs=SR, output='sos')
    return signal.sosfilt(sos, rng.normal(size=len(t)))


# A half-time electronic motif. The upper register enters with the road reveal.
for beat in range(50):
    at = beat * .5
    root = [38, 34, 41, 36][(beat // 8) % 4]
    quiet = .66 if 3 <= at < 7.5 or at >= 20 else 1
    t = local(.42)
    put(at, sine(44*t + 3.1*(1-np.exp(-t/.033))) * envelope(t,.003,.11), .5*quiet)
    if beat % 2:
        t = local(.27)
        snare = noise(t,[800,6500]) + .3*sine(176*t)*np.exp(-t/.046)
        put(at, snare * envelope(t,.0015,.065), .22*quiet)
    for eighth in range(2):
        t = local(.11 if eighth else .07)
        put(at + eighth*.25, noise(t,[6100,13200])*envelope(t,.001,.025), .075*quiet, (-1)**beat*.34)
    for off, semitones in [(0,0),(.26,0 if beat%4 != 3 else 7)]:
        t = local(.232)
        f = note(root+semitones)
        tone = sine(f*t) + .27*sine(2*f*t) + .13*sine(3*f*t)
        put(at+off,tone*envelope(t,.012,.14),.25*quiet)
    if beat % 2 == 0:
        t = local(1.82)
        for i, interval in enumerate([12,15,19,26]):
            f = note(root+interval)
            pad = (sine(f*t)+.53*sine(f*1.002*t))
            swell = np.sin(np.pi*t/(t[-1]+1/SR))**1.4
            put(at,pad*swell,.024,[-.64,.42,-.27,.56][i])
    if at >= 7.5 and at < 20:
        for j, interval in enumerate([24,31]):
            t = local(.41)
            f = note(root+interval+(3 if beat%4==2 else 0))
            pluck = (sine(f*t+.28*sine(f*1.5*t)*np.exp(-t/.08))+.2*sine(2*f*t))*envelope(t,.006,.079)
            put(at + j*.25,pluck,.095,(-1)**j*.53)
            put(at + j*.25 + .1875,pluck,.035,(-1)**(j+1)*.64)

# Per-shot diegetic sound. Rain opens up at the hood camera and recedes on the CTA.
for i, at in enumerate([0,3.,7.5,11.5,15.5,20.]):
    t = local(.72)
    air = noise(t,[170,2600]) * envelope(t,.015,.13)
    put(at, air + .5*sine((45+7*i)*t)*np.exp(-t/.17), .19)
for at,pitch in [(3.12,690),(3.29,1035),(6.3,520),(6.42,782)]:
    t = local(.17)
    put(at,sine(pitch*t)*envelope(t,.008,.053),.085,.27)
t = local(DURATION)
rain = noise(t,[1200,8500])
rain_gain = np.interp(t,[0,3,7.4,7.6,11.4,12,20,24.8],[.02,.01,.01,.1,.1,.036,.031,.014])
put(0,rain*rain_gain,1,-.29)
t = local(12.8)
rev = np.interp(t,[0,2.8,3.1,6.1,6.35,9.2,12.8],[38,71,48,84,58,90,52])
phase = np.cumsum(rev)/SR
put(8.0,(sine(phase)+.48*sine(2*phase)+.38*sine(4*phase))*np.minimum(1,t/2)*np.minimum(1,(t[-1]-t)/1.2),.067,.15)
for at in np.arange(20.50,21.49,.084):
    t=local(.04)
    put(at,noise(t,[900,4800])*envelope(t,.002,.009),.095,rng.uniform(-.45,.45))

# Display groups are aligned to the TTS provider's actual character boundaries.
config = json.loads((ROOT/'src/config/voScript.json').read_text(encoding='utf-8'))
meta = json.loads((ROOT/'audio/out/lines_reel.json').read_text(encoding='utf-8'))
align = json.loads((ROOT/'audio/takes'/Path(meta['take']).with_suffix('.json')).read_text())
full = '\n\n'.join(l['tts'] for l in config['reel'])
assert ''.join(align['characters']) == full
caption_lines = []
cursor = 0
for start, line in zip(SPEECH, config['reel']):
    raw, original_sr = sf.read(ROOT/f"audio/out/reel/{line['id']}.wav")
    raw = signal.resample_poly(raw, SR, original_sr)
    s = round(start*SR)
    voice[s:s+len(raw)] += raw
    spoken = list(re.finditer(r'\S+',line['tts']))
    display = line['cap'].split()
    groups = [(i,i) for i in range(len(spoken))]
    if line['id']=='cta':
        groups = [(0,5)]+[(i,i) for i in range(6,len(spoken))]
        display = ['GPT-6.2','Astra','mein','yeh','prompt','try','karo.']
    assert len(groups)==len(display)
    origin = max(0,align['character_start_times_seconds'][cursor]-.05)
    words = []
    for word,(a,b) in zip(display,groups):
        begin = align['character_start_times_seconds'][cursor+spoken[a].start()]-origin+start
        end = align['character_end_times_seconds'][cursor+spoken[b].end()-1]-origin+start
        words.append(dict(text=word,start=round(begin,3),end=round(end,3)))
    caption_lines.append(dict(words=words,start=words[0]['start'],end=words[-1]['end']))
    cursor += len(line['tts'])+2

def srt_clock(sec):
    ms = round(sec*1000)
    return f"00:00:{ms//1000:02},{ms%1000:03}"

(ROOT/'post/nightshift.srt').write_text('\n\n'.join(
    f"{i+1}\n{srt_clock(c['start'])} --> {srt_clock(c['end'])}\n"+' '.join(w['text'] for w in c['words'])
    for i,c in enumerate(caption_lines))+'\n',encoding='utf-8')
edit = dict(duration=DURATION,fps=60,bpm=120,width=1080,height=1920,
            shots=[dict(id=l['id'],start=cut,end=end) for l,cut,end in zip(config['reel'],CUTS,CUTS[1:]+[DURATION])],
            captions=caption_lines)
(ROOT/'SCENE_TIMINGS.json').write_text(json.dumps(edit,indent=2),encoding='utf-8')
(ROOT/'src/edit.js').write_text('// Generated by scripts/mix_nightshift.py\nwindow.nightshiftEdit = '+json.dumps(edit,indent=2)+';\n',encoding='utf-8')

duck = np.ones(total)
for at,line in zip(SPEECH, meta['lines']):
    t = np.arange(total)/SR
    duck = np.minimum(duck,np.interp(t,[at-.12,at+.01,at+line['dur'],at+line['dur']+.22],[1,.31,.31,1]))
mix *= duck[:,None]
mix += 1.06*voice[:,None]
mix[-int(.23*SR):] *= np.linspace(1,0,int(.23*SR))[:,None]
premaster = ROOT/'audio/out/premaster.wav'
sf.write(premaster,mix,SR,subtype='FLOAT')
target = ROOT/'public/audio/mix_nightshift.wav'
subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(premaster),'-af',
    'loudnorm=I=-14:TP=-2:LRA=7','-ar',str(SR),'-c:a','pcm_s16le',str(target)],check=True)
print(target)
