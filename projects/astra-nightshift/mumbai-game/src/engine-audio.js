export function makeEngineSound() {
  const audio=new AudioContext();
  const exhaust=audio.createOscillator(), filter=audio.createBiquadFilter(), gain=audio.createGain();
  exhaust.type='sawtooth'; exhaust.frequency.value=37;
  filter.type='lowpass';filter.frequency.value=180;filter.Q.value=.55;
  gain.gain.value=0;
  exhaust.connect(filter).connect(gain).connect(audio.destination);
  exhaust.start();
  return {
    start(){audio.resume().catch(()=>{});},
    quiet(){gain.gain.setTargetAtTime(0,audio.currentTime,.04);},
    update(speed,throttle){
      const gear=speed<22?0:speed<43?1:speed<65?2:3;
      const now=audio.currentTime;
      exhaust.frequency.setTargetAtTime(30+speed*1.7-gear*19,now,.1);
      filter.frequency.setTargetAtTime((throttle?205:108)+speed*1.6,now,.12);
      gain.gain.setTargetAtTime(throttle?.052:.025,now,.15);
    }
  };
}
