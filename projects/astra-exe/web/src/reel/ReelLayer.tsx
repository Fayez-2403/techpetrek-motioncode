// The reel's DOM layer: the laboratory's real controls (the same Slider and Seg components as the live panel,
// bound to the same settings store), laid out large for 9:16, plus a readout of the real telemetry. The director
// sets which sections show and which button the cursor is pressing.
import { GRAVITY, MATERIALS, MODES, MODE_ORDER, launchSpeed, BOW, type GravityPreset, type MaterialId } from '../core/config';
import { settings, useStore } from '../ui/store';
import { Slider, Seg } from '../ui/Panel';
import { createStore } from '../ui/store';

export interface ReelUI {
  sections: ('mode' | 'power' | 'gravity' | 'material' | 'time')[];
  /** 0 hidden (below the frame) .. 1 fully in. */
  slide: number;
  pressed: string;
  title: string;
  stats: null | { loose: number; fixed: number; rubble: number; stepMs: number; g: number; scale: number; draw: number; speed: number };
  statsK: number;
  /** Where the readout sits (px). */
  statsAt: [number, number];
}
export const reelUI = createStore<ReelUI>({ sections: [], slide: 0, pressed: '', title: '', stats: null, statsK: 0, statsAt: [70, 470] });

export function ReelLayer() {
  const R = useStore(reelUI, (r) => r);
  const s = useStore(settings, (x) => x);
  const noop = () => {};
  return (
    <>
      {R.slide > 0.001 && (
        <div className="reel-controls" style={{ transform: `translateY(${(1 - R.slide) * 105}%)`, opacity: Math.min(1, R.slide * 1.6) }}>
          <div className="rc-head"><span>PHYSICS LAB</span><em>{R.title}</em></div>
          {R.sections.includes('mode') && (
            <div className="modes">
              {MODE_ORDER.map((m, i) => (
                <button key={m} data-key={`mode:${m}`} className={`mode ${m}${s.mode === m ? ' on' : ''}${R.pressed === `mode:${m}` ? ' pressed' : ''}`}>
                  <span className="emoji">{MODES[m].emoji}</span><span className="name">{MODES[m].label}</span><kbd>{i + 1}</kbd>
                </button>
              ))}
            </div>
          )}
          {R.sections.includes('power') && (
            <Slider id="draw" label="Draw power" value={s.drawPower} min={0.05} max={1} step={0.01} fmt={(v) => `${Math.round(v * 100)}%`} onChange={noop}
              note={`launch up to ${launchSpeed(BOW.MAX_DRAW * s.drawPower).toFixed(0)} m/s`} />
          )}
          {R.sections.includes('gravity') && (<><h3>Gravity</h3>
            <Seg<GravityPreset> name="gravity" pressed={R.pressed} items={(Object.keys(GRAVITY) as GravityPreset[]).map((g) => [g, GRAVITY[g].label.replace('-like', ''), `${GRAVITY[g].g} m/s²`])} value={s.gravity} onPick={noop} /></>)}
          {R.sections.includes('material') && (<><h3>Target material</h3>
            <Seg<MaterialId> name="material" pressed={R.pressed} items={(Object.keys(MATERIALS) as MaterialId[]).map((m) => [m, MATERIALS[m].label.replace(' fantasy material', ' fantasy'), `${(MATERIALS[m].toughness / 1e6).toFixed(1)} MJ/m²`])} value={s.material} onPick={noop} /></>)}
          {R.sections.includes('time') && (
            <Slider id="time" label="Time scale" value={s.timeScale} min={0.1} max={2} step={0.05} fmt={(v) => `${v.toFixed(2)}×`} onChange={noop} />
          )}
        </div>
      )}
      {R.stats && R.statsK > 0.001 && (
        <div className="reel-stats" style={{ opacity: R.statsK, left: R.statsAt[0], top: R.statsAt[1] }}>
          <div><b>{R.stats.loose}</b> active rigid bodies</div>
          <div><b>{R.stats.fixed}</b> attached pieces</div>
          <div>gravity <b>{R.stats.g.toFixed(2)}</b> m/s² · time <b>{R.stats.scale.toFixed(2)}×</b></div>
          <div>draw <b>{Math.round(R.stats.draw * 100)}%</b> · <b>{R.stats.speed.toFixed(0)}</b> m/s</div>
          <div>physics step <b>1/120 s</b> · Rapier</div>
        </div>
      )}
    </>
  );
}
