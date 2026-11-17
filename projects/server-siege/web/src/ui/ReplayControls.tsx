// Time controls: play/pause, restart, playback speed and a scrubber. Scrubbing back restores the nearest 5 s checkpoint
// and re-simulates the recorded actions, so the replay is exact. Action markers show what was changed, and when.
import { useEffect, type CSSProperties } from 'react';
import { useStore, useSim } from '../store';
import { sfx } from '../audio/ui';

const SPEEDS = [0.25, 0.5, 1, 2, 4];

export function ReplayControls() {
  const sim = useSim();
  const playing = useStore((s) => s.playing), speed = useStore((s) => s.speed);
  const { toggle, restart, setSpeed, seek } = useStore.getState();
  const dur = sim.sc.duration * 1000, now = sim.s.now;

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); useStore.getState().toggle(); }
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey) useStore.getState().restart();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  return (
    <div className="panel replay" aria-label="Replay controls">
      <button type="button" className="play" title={playing ? 'Pause (space)' : 'Play (space)'} onClick={() => { sfx.click(); toggle(); }}>
        {playing ? '❚❚' : sim.done ? '↻' : '▶'}
      </button>
      <button type="button" className="ghost" title="Restart the scenario (R)" onClick={() => { sfx.click(); restart(); }}>⟲</button>
      <div className="scrub">
        <input type="range" min={0} max={dur} step={100} value={now} aria-label="Simulation time"
          style={{ '--fill': `${(now / dur) * 100}%` } as CSSProperties}
          onChange={(e) => { if (playing) useStore.setState({ playing: false }); seek(Number(e.target.value)); }} />
        <div className="marks">
          {sim.actions.map((a, i) => (
            <i key={i} style={{ left: `${(a.at / dur) * 100}%` }} title={`${(a.at / 1000).toFixed(1)} s · ${a.label ?? Object.keys(a.set).join(', ')}`} />
          ))}
        </div>
      </div>
      <span className="mono time">{(now / 1000).toFixed(1)}s</span>
      <div className="speeds">
        {SPEEDS.map((x) => <button key={x} type="button" className={x === speed ? 'on' : ''} onClick={() => { sfx.click(); setSpeed(x); }}>{x}×</button>)}
      </div>
    </div>
  );
}
