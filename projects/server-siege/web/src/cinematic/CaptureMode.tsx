// ?reel=1: the portrait capture mode the reel is recorded from. The page is driven only by window.seek(t) (reel seconds):
// it seeks the real sim (fixed seed + the recorded REEL_ACTIONS) to simTimeAt(t), poses the camera from the timeline
// and renders. Overlays show the run's live numbers; the alert and SYSTEM RECOVERED only appear when the sim says so.
import { useStore, useSim } from '../store';
import { Sim } from '../simulation/engine';
import { scenarioById } from '../simulation/scenarios';
import { vclock } from '../world/clock';
import { PER_PACKET } from '../world/RequestStreams';
import { ArchitectConsole } from '../ui/ArchitectConsole';
import { MetricsPanel } from '../ui/MetricsPanel';
import { REEL_ACTIONS, reelClock, simTimeAt } from './Timeline';
import './reel.css';

declare global { interface Window { seek?: (t: number) => Promise<void>; __ready?: boolean; __reelInfo?: () => unknown } }

const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

export function installReel() {
  const sim = new Sim(scenarioById('million'), {}, REEL_ACTIONS);
  useStore.setState({ reel: true, sim, picker: false, playing: false, cam: 'cinematic' });
  window.seek = async (t: number) => {
    reelClock.t = t; vclock.t = t;
    useStore.getState().seek(simTimeAt(t));
    await frame(); await frame();
  };
  window.__reelInfo = () => { const s = useStore.getState().sim; return { now: s.s.now, last: s.last(), totals: s.totals, recovered: s.recovered, report: s.done ? s.report() : null, log: s.logLines }; };
  window.__ready = true;
}

const fmt = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1)}k` : `${Math.round(n)}`);

export function ReelOverlay() {
  const sim = useSim(), t = reelClock.t, x = sim.last(), T = sim.totals;
  const dbHot = !!x && x.dbUtil >= 0.95, appCalm = !!x && x.appUtil < 0.9;
  const wrongLayer = t >= 26 && t < 33 && dbHot && appCalm && sim.insts.filter((i) => i.state === 'up').length >= 5;
  return (
    <div className="reel-ov">
      <div className="reel-strip">
        <div><b>{fmt(T.arrived)}</b><span>simulated requests</span></div>
        <div><b>{fmt(x?.arrRate ?? 0)}/s</b><span>arriving</span></div>
        <div className={x && x.errRate > 0.05 ? 'bad' : ''}><b>{((x?.errRate ?? 0) * 100).toFixed(1)}%</b><span>errors</span></div>
        <div className={x && x.p95 > 400 ? 'bad' : ''}><b>{x?.p95 ?? 0} ms</b><span>p95</span></div>
        <div className={dbHot ? 'bad' : ''}><b>{Math.round((x?.dbUtil ?? 0) * 100)}%</b><span>database</span></div>
      </div>
      {wrongLayer ? <div className="reel-alert"><small>APP 5 SERVERS · DATABASE {Math.round(x!.dbUtil * 100)}%</small>YOU SCALED THE<br />WRONG LAYER</div> : null}
      {sim.recovered && t >= 49 && t < 57 ? <div className="reel-ok">SYSTEM RECOVERED<small>errors {((x?.errRate ?? 0) * 100).toFixed(1)}% · p95 {x?.p95} ms · DB {Math.round((x?.dbUtil ?? 0) * 100)}%</small></div> : null}
      {t >= 57 && t < 63 ? <div className="reel-console"><ArchitectConsole compact /><MetricsPanel compact /></div> : null}
      <div className="reel-note">Simulated backend · fictional costs · 1 packet ≈ {PER_PACKET} requests</div>
    </div>
  );
}
