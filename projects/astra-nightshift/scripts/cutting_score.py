"""Original stereo music and location sound for Aakhri Cutting, on its picture clock."""
import json
import re
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

root=Path(__file__).resolve().parents[1]
sample_rate=48000
duration=24.8
rng=np.random.default_rng(1979)
size=round(duration*sample_rate)
music=np.zeros((size,2))
world=np.zeros_like(music)

def seconds(d):
    return np.arange(round(d*sample_rate))/sample_rate

def osc(cycles):
    return np.sin(2*np.pi*cycles)

def fade(t,attack,release):
    return np.minimum(1,t/attack)*np.minimum(1,np.maximum(0,t[-1]-t)/release)

def noise(t,lo,hi):
    return signal.sosfilt(signal.butter(2,[lo,hi],btype='bandpass',fs=sample_rate,output='sos'),rng.standard_normal(len(t)))

def place(bus,at,wave,vol,pan=0):
    start=round(at*sample_rate);n=min(len(wave),size-start)
    if n<=0: return
    p=np.broadcast_to(pan,(len(wave),))[:n]
    bus[start:start+n] += wave[:n,None]*vol*np.column_stack((np.sqrt(1-p),np.sqrt(1+p)))

def pitched(midi):
    return 440*2**((midi-69)/12)

# Four-bar cycle, with a dry plucked string answered by a tuned hand drum.
for beat in range(50):
    at=beat/2
    root_note=[38,36,41,43][beat//8%4]
    subdued=.55 if 15.5<=at<19.5 else 1
    if beat%2==0 or beat%8==7:
        t=seconds(.46); f=pitched(root_note-1)
        pad=(osc(f*t+2.7*(1-np.exp(-t/.038)))+.16*osc(f*2*t))*fade(t,.003,.07)*np.exp(-t/.105)
        place(music,at,pad,.45*subdued)
    if beat%2:
        for late,v in [(0,.27),(.355,.10)]:
            t=seconds(.19); f=pitched(root_note+18)
            stroke=(osc(f*t+.23*(1-np.exp(-t/.018)))+.42*osc(1.53*f*t)+.2*noise(t,800,4700))*np.exp(-t/.055)*fade(t,.002,.012)
            place(music,at+late,stroke,v*subdued,.29)
    if beat%8 in (0,3,5,6):
        t=seconds(1.1); f=pitched(root_note+[24,29,31,34][beat%4])
        bend=f*t+.07*osc(4.3*t)*(1-np.exp(-t/.21))
        pluck=(osc(bend)+.34*osc(2*bend)+.19*osc(3*bend)+.13*osc(5*bend))*fade(t,.009,.09)*np.exp(-t/.25)
        place(music,at+.04,pluck,.105,-.36)
        place(music,at+.24,pluck,.037,.52)
    if beat%4==0:
        t=seconds(2.1);swell=np.sin(np.pi*t/2.1)**1.2; f=pitched(root_note+12)
        for ratio,p in [(1,-.46),(1.5,.43),(1.19,.1)]:
            phase=ratio*f*t
            reed=osc(phase)+.34*osc(2*phase)+.11*osc(3*phase)
            place(music,at,reed*swell*(.85+.15*osc(2.1*t)),.033,p)

t=seconds(duration)
rain_env=np.interp(t,[0,3.45,3.64,7,11.5,15.4,15.7,19.4,19.6,24.8],[.10,.10,.041,.055,.08,.1,.055,.05,.045,.02])
for pan in [-.8,.8]:
    rain=noise(t,1150,9200)*(.77+.23*osc(.38*t+pan))
    place(world,0,rain*rain_env,1,pan)

# Low engine, one gear engagement, then carriage wheels crossing the bridge.
t=seconds(15.75)
rev=np.interp(t,[0,2.3,3.6,4.5,6.3,6.5,9.3,11.4,13.7,15.75],[47,60,39,38,73,47,58,67,53,27])
phase=np.cumsum(rev)/sample_rate
place(world,0,(osc(phase)+.4*osc(2*phase)+.17*osc(5*phase))*fade(t,.08,.6),.076,-.13)
for at in [4.64,4.72]:
    t=seconds(.09);place(world,at,(noise(t,250,2600)+osc(188*t)) *np.exp(-t/.017)*fade(t,.001,.006),.20,.15)
t=seconds(3.8)
place(world,7.24,(noise(t,100,980)+.18*osc(69*t))*fade(t,.72,.81),.17,np.linspace(-.8,.85,len(t)))
for i in range(20):
    t=seconds(.12);s=.4+.6*np.sin(i*np.pi/20)
    place(world,7.38+i*.178,(.55*noise(t,290,1850)+osc(133*t))*np.exp(-t/.028)*fade(t,.004,.012),.11*s,-.72+i*.074)
for at,d,pitch in [(9.68,.39,240),(10.18,.69,213)]:
    t=seconds(d); phase=pitch*t+.24*osc(2.5*t)
    place(world,at,(osc(phase)+.40*osc(1.32*phase)+.2*osc(2*phase))*fade(t,.12,.16),.087,.30)
# Distant auto honk recedes into the market; a gentle metal rattle marks the stop.
for at,length in [(13.02,.14),(13.25,.28)]:
    t=seconds(length);place(world,at,(osc(427*t)+.45*osc(526*t))*fade(t,.023,.055),.055,-.72)
t=seconds(2.8)
pour=(noise(t,2100,9000)*.8 + noise(t,550,1750)*.8)*(1+.19*osc(16*t))
place(world,15.98,pour*fade(t,.32,.47),.155,.2)
for at,pitch in [(15.7,1470),(18.87,1695),(19.07,1240)]:
    t=seconds(.48);clink=(osc(pitch*t)+.4*osc(2.72*pitch*t))*np.exp(-t/.084)*fade(t,.002,.08)
    place(world,at,clink,.135,-.25)
t=seconds(.42)
place(world,19.6,noise(t,1300,7200)*fade(t,.11,.21)*(.6+.4*osc(28*t)),.13,.20)

audio_dir=root/'audio/out/cutting'
dry,sr=sf.read(audio_dir/'dialogue.wav')
assert sr==sample_rate and len(dry)==size
env=signal.sosfilt(signal.butter(1,4,fs=sample_rate,output='sos'),np.abs(dry))
duck=1-.68*np.clip(env/.035,0,1)
mix=music*duck[:,None]+world*(.65+.35*duck[:,None])+dry[:,None]*1.20
mix*=fade(seconds(duration),.017,.24)[:,None]
source=audio_dir/'premaster.wav';sf.write(source,mix,sample_rate,subtype='FLOAT')
opts='loudnorm=I=-14:TP=-1.8:LRA=8'
first=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(source),'-af',opts+':print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
values=json.loads(re.findall(r'\{[^{}]+\}',first.stderr)[-1])
second=opts+':linear=true'+''.join(f':{k}={values[v]}' for k,v in [('measured_I','input_i'),('measured_TP','input_tp'),('measured_LRA','input_lra'),('measured_thresh','input_thresh'),('offset','target_offset')])
target=root/'public/audio/aakhri-cutting.wav'
subprocess.run(['ffmpeg','-v','error','-y','-i',str(source),'-af',second,'-ar',str(sample_rate),'-c:a','pcm_s16le',str(target)],check=True)
print(target)
