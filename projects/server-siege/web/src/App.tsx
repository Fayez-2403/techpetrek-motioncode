// App shell: the 3D Server City fills the screen; the Architect Console, metrics, mission status, event log and replay
// controls float over it. ?reel=1 switches to the portrait capture mode the reel is recorded from.
import { Canvas } from '@react-three/fiber';
import { useEffect } from 'react';
import { useStore } from './store';
import { ServerCity } from './world/ServerCity';
import { ArchitectConsole } from './ui/ArchitectConsole';
import { MetricsPanel } from './ui/MetricsPanel';
import { MissionStatus } from './ui/MissionStatus';
import { EventLog } from './ui/EventLog';
import { ReplayControls } from './ui/ReplayControls';
import { ScenarioSelector } from './ui/ScenarioSelector';
import { ReelOverlay, installReel } from './cinematic/CaptureMode';
import './ui/styles.css';

const REEL = new URLSearchParams(location.search).has('reel');

/** advances the sim in real time while playing (the reel never uses this: it seeks) */
function SimDriver() {
  useEffect(() => {
    let raf = 0, last = performance.now();
    const loop = (t: number) => { useStore.getState().advance(t - last); last = t; raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return null;
}

export function App() {
  useEffect(() => { if (REEL) installReel(); }, []);
  return (
    <div className={REEL ? 'app reel' : 'app'}>
      <Canvas style={{ position: 'absolute', inset: 0, zIndex: 0 }} shadows dpr={REEL ? 1 : [1, 2]} gl={{ antialias: true, preserveDrawingBuffer: REEL }} camera={{ fov: 42, near: 0.5, far: 400, position: [0, 40, 60] }}>
        <ServerCity />
      </Canvas>
      {REEL ? <ReelOverlay /> : (
        <>
          <SimDriver />
          <MissionStatus />
          <ArchitectConsole />
          <MetricsPanel />
          <EventLog />
          <ReplayControls />
          <ScenarioSelector />
        </>
      )}
    </div>
  );
}
