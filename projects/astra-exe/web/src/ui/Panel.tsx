// The physics laboratory's control panel. Every control here changes the running simulation.
import { GRAVITY, MATERIALS, MODES, MODE_ORDER, QUALITY, launchSpeed, BOW, CELESTIAL_GAIN, type CameraMode, type GravityPreset, type MaterialId, type QualityId } from '../core/config';
import { CHALLENGES, type ChallengeId } from '../core/challenges';
import { settings, ui, useStore, toast } from './store';
import { audio, stageRef, startChallenge } from './App';

const CAMS: [CameraMode, string][] = [['cinematic', 'Cinematic'], ['orbit', 'Free orbit'], ['follow', 'Arrow follow'], ['impact', 'Impact close-up']];

export function Slider({ label, value, min, max, step, fmt, onChange, note, id }: { label: string; value: number; min: number; max: number; step: number; fmt: (v: number) => string; onChange: (v: number) => void; note?: string; id: string }) {
  return (
    <label className="slider" htmlFor={id} data-slider={id}>
      <div className="row"><span className="lab">{label}</span><span className="val">{fmt(value)}</span></div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} data-min={min} data-max={max} onChange={(e) => { onChange(+e.target.value); audio.ui('tick', (+e.target.value - min) / (max - min)); }} />
      {note && <div className="note">{note}</div>}
    </label>
  );
}

export function Seg<T extends string>({ items, value, onPick, disabled, pressed, name }: { items: [T, string, string?][]; value: T; onPick: (v: T) => void; disabled?: boolean; pressed?: string; name?: string }) {
  return (
    <div className={`seg${disabled ? ' disabled' : ''}`}>
      {items.map(([v, l, sub]) => (
        <button key={v} data-key={name ? `${name}:${v}` : undefined} className={`${v === value ? 'on' : ''}${pressed === `${name}:${v}` ? ' pressed' : ''}`} disabled={disabled} onClick={() => { onPick(v); audio.ui('click'); }}>
          {l}{sub && <small>{sub}</small>}
        </button>
      ))}
    </div>
  );
}

export function Panel() {
  const s = useStore(settings, (x) => x);
  const open = useStore(ui, (x) => x.panel);
  const ch = useStore(ui, (x) => x.challenge);
  const sound = useStore(ui, (x) => x.sound);
  const locked = !!ch && !!CHALLENGES[ch.id].material;
  const st = stageRef.current;
  const set = settings.set;
  if (!open) return <button className="panel-toggle" onClick={() => ui.set({ panel: true })} aria-label="Open controls">CONTROLS</button>;
  return (
    <aside className="panel">
      <div className="panel-head"><span>PHYSICS LAB</span><button onClick={() => ui.set({ panel: false })} aria-label="Close controls">×</button></div>

      <section>
        <h3>Arrow mode</h3>
        <div className="modes">
          {MODE_ORDER.map((m, i) => {
            const M = MODES[m];
            return (
              <button key={m} className={`mode ${m}${s.mode === m ? ' on' : ''}`} title={M.blurb} onClick={() => { set({ mode: m }); audio.ui('select', i / 3); }}>
                <span className="emoji">{M.emoji}</span><span className="name"><span className="hi">{M.hi}</span><span className="en">{M.label}</span></span><kbd>{i + 1}</kbd>
              </button>
            );
          })}
        </div>
        <p className="blurb">{MODES[s.mode].blurb}</p>
      </section>

      <section>
        <Slider id="draw" label="Draw power" value={s.drawPower} min={0.05} max={1} step={0.01} fmt={(v) => `${Math.round(v * 100)}%`} onChange={(v) => set({ drawPower: v })}
          note={`max draw ${(BOW.MAX_DRAW * s.drawPower * 100).toFixed(0)} cm, launch up to ${launchSpeed(BOW.MAX_DRAW * s.drawPower).toFixed(0)} m/s`} />
        <h3>Gravity</h3>
        <Seg<GravityPreset> items={(Object.keys(GRAVITY) as GravityPreset[]).map((g) => [g, GRAVITY[g].label.replace('-like', ''), `${GRAVITY[g].g} m/s²`])} value={s.gravity} onPick={(g) => set({ gravity: g })} />
        <h3>Target material {locked && <em>(set by the challenge)</em>}</h3>
        <Seg<MaterialId> items={(Object.keys(MATERIALS) as MaterialId[]).map((m) => [m, MATERIALS[m].label.replace(' fantasy material', ' fantasy'), `${(MATERIALS[m].toughness / 1e6).toFixed(1)} MJ/m²`])} value={s.material} onPick={(m) => set({ material: m })} disabled={locked} />
        <Slider id="mult" label="Impact multiplier (fantasy)" value={s.impactMult} min={0.5} max={5} step={0.1} fmt={(v) => `${v.toFixed(1)}×`} onChange={(v) => set({ impactMult: v })}
          note={`Not physical: impact energy = the arrow's real kinetic energy × ${CELESTIAL_GAIN.toExponential(1)} celestial gain × this.`} />
        <Slider id="time" label="Time scale" value={s.timeScale} min={0.1} max={2} step={0.05} fmt={(v) => `${v.toFixed(2)}×`} onChange={(v) => set({ timeScale: v })} note="Fixed 1/120 s physics steps; only how fast they play changes." />
        <div className="toggles">
          {([['slowmo', 'Impact slow-mo'], ['drag', 'Air drag'], ['trajectory', 'Aim preview'], ['autoCut', 'Auto camera cuts']] as const).map(([k, l]) => (
            <label key={k}><input type="checkbox" checked={s[k]} onChange={(e) => { set({ [k]: e.target.checked }); audio.ui('click'); }} />{l}</label>
          ))}
        </div>
      </section>

      <section>
        <h3>Camera</h3>
        <Seg<CameraMode> items={CAMS.map(([c, l]) => [c, l])} value={s.camera} onPick={(c) => set({ camera: c })} />
        <button className="wide" onClick={() => { if (st?.startReplay()) toast('Slow-motion replay of the last shot'); else toast('Fire a shot first'); }}>Slow-motion replay <kbd>B</kbd></button>
      </section>

      <section className="actions">
        <button className="fire" onClick={() => { audio.start(); st?.fire(); }}>FIRE <kbd>Space</kbd></button>
        <button onClick={() => { st?.sim.resetTarget(); toast('Target restored'); audio.ui('click'); }}>Reset mountain <kbd>R</kbd></button>
        <button onClick={() => { st?.sim.resetScene(); toast('Scene reset'); audio.ui('click'); }}>Reset scene <kbd>⇧R</kbd></button>
        <button className={s.paused ? 'on' : ''} onClick={() => set({ paused: !s.paused })}>{s.paused ? 'Resume' : 'Pause'} <kbd>P</kbd></button>
        <button onClick={() => ui.set({ ui: false })}>Hide UI <kbd>H</kbd></button>
        <button onClick={() => ui.set({ capture: true, ui: true })}>Capture mode</button>
        <button onClick={() => { const on = !ui.get().sound; ui.set({ sound: on }); audio.start(); audio.setEnabled(on); }}>{sound ? 'Sound on' : 'Sound off'} <kbd>M</kbd></button>
        <button onClick={() => ui.set({ debug: !ui.get().debug })}>Performance overlay <kbd>`</kbd></button>
      </section>

      <section>
        <h3>Challenges</h3>
        <div className="challenges">
          {(Object.keys(CHALLENGES) as ChallengeId[]).map((id) => {
            const C = CHALLENGES[id], on = ch?.id === id;
            return (
              <div key={id} className={`ch${on ? ' on' : ''}${on && ch?.status === 'won' ? ' won' : ''}`}>
                <div className="t">{C.title}{on && ch?.status === 'won' ? ' ✓' : ''}</div>
                <div className="g">{C.goal}</div>
                <button onClick={() => { audio.start(); void startChallenge(id); }}>{on ? 'Restart' : 'Start'}</button>
              </div>
            );
          })}
          {ch && <button className="wide" onClick={() => void startChallenge(null)}>Back to free play</button>}
        </div>
      </section>

      <section>
        <h3>Quality <em>(reloads the lab)</em></h3>
        <Seg<QualityId> items={(Object.keys(QUALITY) as QualityId[]).map((q) => [q, q[0]!.toUpperCase() + q.slice(1), `${QUALITY[q].chunks} pieces`])} value={s.quality}
          onPick={(q) => { if (q !== s.quality) { const u = new URL(location.href); u.searchParams.set('q', q); location.href = u.toString(); } }} />
      </section>
    </aside>
  );
}
