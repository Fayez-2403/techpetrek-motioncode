// The laboratory: a React Three Fiber canvas hosting the Stage (plain Three.js + Rapier modules), drei's
// OrbitControls for free orbit and PerformanceMonitor for adaptive resolution, and the React control panel.
import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { Stage } from '../view/stage';
import { PointerInput } from '../view/input';
import { loadFracture } from '../view/fractureLoader';
import { initRapier } from '../core/physics';
import { QUALITY, MODE_ORDER, type CameraMode } from '../core/config';
import { CHALLENGES, type ChallengeId, type TargetId } from '../core/challenges';
import { AudioEngine } from '../audio/engine';
import { settings, ui, telemetry, useStore, toast } from './store';
import { Panel } from './Panel';
import { Hud, TopBar, ChallengeBar, Debug, Loading, Toast, CaptureFrame } from './Hud';
import { Director } from '../reel/director';
import { ReelLayer } from '../reel/ReelLayer';

const params = new URLSearchParams(location.search);
export const REEL = params.has('reel');
/** Keep the drawing buffer (needed for screenshots in headless tests and for capture). */
const PDB = REEL || params.has('pdb');
export const audio = new AudioEngine();
export const stageRef: { current: Stage | null } = { current: null };

const CHUNKS: Record<TargetId, (q: keyof typeof QUALITY) => number> = {
  mountain: (q) => QUALITY[q].chunks, mini: (q) => (q === 'low' ? 70 : 120), slab: () => 26, crystal: () => 70,
};
export const loadTarget = (k: TargetId) => loadFracture(k, 7, CHUNKS[k](settings.get().quality), (s) => ui.set({ status: [...ui.get().status.slice(-5), s] }));

function Host() {
  const { gl, size } = useThree();
  const [ready, setReady] = useState(false);
  const fps = useRef({ acc: 0, n: 0, v: 60 });
  useEffect(() => {
    let input: PointerInput | null = null, unsub = () => {};
    (async () => {
      ui.set({ status: ['initialising Rapier physics (WebAssembly)...'] });
      await initRapier();
      const s = settings.get();
      const stage = new Stage(gl, size.width, size.height, s.quality, { reel: REEL });
      stage.addTarget('mountain', await loadTarget('mountain'));
      stageRef.current = stage;
      (window as unknown as { astra: unknown }).astra = { stage, settings, ui };
      stage.applyLive(s);
      unsub = settings.subscribe(() => stage.applyLive(settings.get()));
      stage.listeners.push((e) => {
        audio.onEvent(e);
        if (e.type === 'challenge') {
          ui.set({ challenge: e.state });
          if (e.state.status === 'won') toast(`CHALLENGE COMPLETE: ${CHALLENGES[e.state.id].title}`);
        }
      });
      if (REEL) await Director.attach(stage, gl);
      else {
        input = new PointerInput(gl.domElement, stage);
        input.onChange = (st) => ui.set(st);
      }
      ui.set({ loaded: true, status: [...ui.get().status, 'ready'] });
      setReady(true);
    })().catch((err) => { console.error(err); ui.set({ status: [...ui.get().status, `error: ${String(err)}`] }); });
    return () => { input?.dispose(); unsub(); };
  }, [gl]);
  // (dpr: the performance monitor lowers the resolution at run time; the post-processing has to follow it)
  const dpr = useThree((s) => s.viewport.dpr);
  useEffect(() => { stageRef.current?.setSize(size.width, size.height); }, [size.width, size.height, dpr]);
  useFrame((_, dt) => {
    const st = stageRef.current;
    if (!st || REEL) return;
    st.advance(dt);
    const orbit = settings.get().camera === 'orbit';
    st.updateViews(dt, { camera: !orbit });
    st.render();
    audio.update({ held: st.sim.rig.held, draw: st.sim.rig.power, drawSpeed: st.sim.rig.drawVel, clock: st.clock });
    const f = fps.current; f.acc += dt; f.n++;
    if (f.acc > 0.5) { f.v = f.n / f.acc; f.acc = 0; f.n = 0; telemetry.set({ ...st.telemetry, fps: f.v }); }
  }, 1);
  return ready && !REEL ? <Orbit /> : null;
}

function Orbit() {
  const cam = useStore(settings, (s) => s.camera);
  const st = stageRef.current!;
  if (cam !== 'orbit') return null;
  return <OrbitControls camera={st.camRig.cam} target={new THREE.Vector3(0, 10, -100)} enableDamping makeDefault={false} maxDistance={600} minDistance={2} />;
}

export function App() {
  const loaded = useStore(ui, (s) => s.loaded);
  const showUI = useStore(ui, (s) => s.ui && !s.capture);
  const capture = useStore(ui, (s) => s.capture);
  const q = settings.get().quality;
  const [dpr, setDpr] = useState(REEL ? 1 : Math.min(window.devicePixelRatio, QUALITY[q].dpr));

  useEffect(() => {
    if (REEL) return;
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      const st = stageRef.current, s = settings.get();
      audio.start();
      const k = e.key.toLowerCase();
      if (k === ' ') { e.preventDefault(); st?.fire(); }
      else if (k >= '1' && k <= '4') settings.set({ mode: MODE_ORDER[+k - 1]! });
      else if (k === 'r' && e.shiftKey) { st?.sim.resetScene(); toast('Scene reset'); }
      else if (k === 'r') { st?.sim.resetTarget(); toast('Target restored'); }
      else if (k === 'p') settings.set({ paused: !s.paused });
      else if (k === 'h') ui.set({ ui: !ui.get().ui });
      else if (k === 'c') { const cams: CameraMode[] = ['cinematic', 'orbit', 'follow', 'impact']; settings.set({ camera: cams[(cams.indexOf(s.camera) + 1) % cams.length]! }); }
      else if (k === 'm') { ui.set({ sound: !ui.get().sound }); audio.setEnabled(ui.get().sound); }
      else if (k === 'b') { if (st?.startReplay()) toast('Slow-motion replay'); }
      else if (k === '`' || k === 'f3') { e.preventDefault(); ui.set({ debug: !ui.get().debug }); }
      else if (k === '[') settings.set({ timeScale: Math.max(0.1, +(s.timeScale - 0.1).toFixed(2)) });
      else if (k === ']') settings.set({ timeScale: Math.min(2, +(s.timeScale + 0.1).toFixed(2)) });
      else if (k === 'escape') ui.set({ capture: false });
      else if (st && e.key.startsWith('Arrow')) {
        e.preventDefault();
        const r = st.sim.rig, d = e.shiftKey ? 0.002 : 0.01;
        st.aim(r.aimYaw + (k === 'arrowleft' ? d : k === 'arrowright' ? -d : 0), r.aimPitch + (k === 'arrowup' ? d : k === 'arrowdown' ? -d : 0));
      }
    };
    window.addEventListener('keydown', key);
    const first = () => audio.start();
    window.addEventListener('pointerdown', first, { once: true });
    return () => window.removeEventListener('keydown', key);
  }, []);

  return (
    <div className={`app${capture ? ' capture' : ''}${REEL ? ' reel' : ''}`}>
      <Canvas
        className="gl"
        frameloop={REEL ? 'never' : 'always'}
        dpr={dpr}
        flat
        gl={{ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: PDB || capture, alpha: false, stencil: false }}
        style={REEL ? { width: 1080, height: 1920 } : undefined}
      >
        {!REEL && <PerformanceMonitor onDecline={() => setDpr((d) => Math.max(0.6, d * 0.85))} onIncline={() => setDpr((d) => Math.min(window.devicePixelRatio, QUALITY[q].dpr, d * 1.08))} />}
        <Host />
      </Canvas>
      {!loaded && <Loading />}
      {loaded && !REEL && showUI && (<><TopBar /><Panel /><ChallengeBar /><Hud /></>)}
      {loaded && !REEL && <Debug />}
      {capture && <CaptureFrame />}
      {!REEL && <Toast />}
      {REEL && loaded && <ReelLayer />}
      {REEL && <div id="reel-overlay" />}
    </div>
  );
}

export async function startChallenge(id: ChallengeId | null) {
  const st = stageRef.current; if (!st) return;
  await st.startChallenge(id, loadTarget);
  ui.set({ challenge: st.sim.challenge ? { ...st.sim.challenge } : null });
  if (id) { toast(CHALLENGES[id].title); settings.set({ gravity: 'earth', drag: true }); }
}
