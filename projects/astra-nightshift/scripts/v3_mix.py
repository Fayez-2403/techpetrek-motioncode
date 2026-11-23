"""Mix the recorded Astra narration with a commissioned-in-code instrumental."""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

ROOT = Path(__file__).resolve().parents[1]
SR = 48000
version='mumbai-drive' if '--mumbai-drive' in sys.argv else 'astra-workflow'
voice, sample_rate = sf.read(ROOT/'audio/out'/version/'dialogue.wav')
assert sample_rate == SR and len(voice) == 56*SR
score = np.zeros((len(voice), 2), dtype=np.float32)
rng=np.random.default_rng(56)

def times(duration):
    return np.arange(round(duration*SR))/SR

def sine(phase):
    return np.sin(2*np.pi*phase)

def note(midi):
    return 440*2**((midi-69)/12)

def put(at,wave,gain,pan=0):
    start=round(at*SR);n=min(len(wave),len(voice)-start)
    if n>0:
        score[start:start+n]+=wave[:n,None]*gain*np.sqrt([1-pan,1+pan])

def envelope(t,attack,decay):
    return np.minimum(1,t/attack)*np.exp(-t/decay)*np.minimum(1,(t[-1]-t)/.028)

# Warm, restrained two-bar pulse. Chord inversions keep space around a speaking voice.
for beat in range(112):
    at=beat*.5
    root=[38,34,41,36][(beat//8)%4]
    energy=np.interp(at,[0,1.5,8,23,31,39,44,49,54,56],[.62,1,.83,1,.81,.96,.63,.62,.88,.5])
    if beat%2==0:
        t=times(.41)
        put(at,sine(44*t+2.6*(1-np.exp(-t/.037)))*envelope(t,.003,.095),.28*energy)
    if beat%4 in (1,3):
        t=times(.15)
        tick=signal.sosfilt(signal.butter(2,[850,4900],btype='bandpass',fs=SR,output='sos'),rng.normal(size=len(t)))
        put(at,tick*envelope(t,.002,.035),.1*energy,.20)
    if beat%2==0 or beat%8==7:
        t=times(.41);f=note(root);phase=f*t
        put(at,(sine(phase)+.26*sine(phase*2))*envelope(t,.012,.155),.22*energy)
    if beat%4==0:
        t=times(2.0)
        swell=np.sin(np.pi*t/2)**.83
        for interval,pan in [(12,-.48),(19,.49),(22,.1)]:
            f=note(root+interval)
            put(at,(sine(f*t)+.34*sine(f*1.002*t))*swell,.037*energy,pan)
    if beat%8 in (0,3,6):
        t=times(.72);f=note(root+[26,31,34][(beat%8)//3])
        pluck=(sine(f*t+.17*sine(f*1.5*t)*np.exp(-t/.1))+.15*sine(2*f*t))*envelope(t,.006,.13)
        put(at+.03,pluck,.076*energy,-.35)
        put(at+.21,pluck,.033*energy,.52)
for at in [8,15,23,31,39,44,47.4,53.9]:
    t=times(.21);f=150 if at<47 else 280
    put(at,sine(f*t+.45*(1-np.exp(-t/.013)))*envelope(t,.004,.065),.1)

if version=='mumbai-drive':
    # Tyres on wet asphalt and a four-cylinder exhaust, following the replay speed.
    world_t=times(56)
    drive_t=np.where(world_t<4,world_t,world_t-4.5)
    velocity=8.75+1.536*np.cos(.32*drive_t)-1.407*np.cos(.67*drive_t)
    road=np.interp(world_t,[0,3.96,4.1,8.38,8.63,55,56],[1,1,.09,.09,1,1,0])
    hood=np.interp(world_t,[0,19.7,20.3,28.6,29.1,49,55.99],[.72,.72,1.2,1.2,.76,.76,.25])
    phase=np.cumsum(41+velocity*2.9)/SR
    engine=(sine(phase)+.54*sine(2*phase+.07)+.19*sine(3*phase))*.042*road*hood
    for ch in range(2):
        spray=signal.sosfilt(signal.butter(2,[680,5200],btype='bandpass',fs=SR,output='sos'),rng.normal(size=len(voice)))
        score[:,ch]+=engine+spray*.017*road*hood

# Smooth speech ducking; preserve transients and level-match the entire stereo program.
speech_env=signal.sosfilt(signal.butter(1,3.5,fs=SR,output='sos'),np.abs(voice))
duck=1-.69*np.clip(speech_env/.042,0,1)
mix=score*duck[:,None]+voice[:,None]*1.12
mix[:720]*=np.linspace(0,1,720)[:,None];mix[-24000:]*=np.linspace(1,0,24000)[:,None]
tmp=ROOT/'audio/out'/version/'premaster.wav'
sf.write(tmp,mix,SR,subtype='FLOAT')
target=ROOT/'public/audio'/(version+'.m4a')
base='loudnorm=I=-14:TP=-1.9:LRA=8'
r=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(tmp),'-af',base+':print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
v=json.loads(re.findall(r'\{[^{}]+\}',r.stderr)[-1])
params=base+':linear=true'+''.join(f':{k}={v[a]}' for k,a in [('measured_I','input_i'),('measured_TP','input_tp'),('measured_LRA','input_lra'),('measured_thresh','input_thresh'),('offset','target_offset')])
subprocess.run(['ffmpeg','-v','error','-y','-i',str(tmp),'-af',params,'-ar',str(SR),'-c:a','aac','-b:a','224k',str(target)],check=True)
print(target)
