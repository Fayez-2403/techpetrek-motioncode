// The whole 3D world: lights, reflections, fog, the board, the districts, the request streams, the district labels,
// the camera director and a restrained bloom. It only displays sim state; it never decides an outcome.
import { Environment, Html, Lightformer } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { CameraDirector } from '../cinematic/CameraDirector';
import { reelClock, reelLabels } from '../cinematic/Timeline';
import { DB_TIERS } from '../simulation/engine';
import { useSim, useStore } from '../store';
import { Board } from './Board';
import { vclock } from './clock';
import { CacheVault, DatabaseCore, EdgeGateway, LoadBalancer, QueueFacility } from './Districts';
import { COLOR, POS } from './layout';
import { RequestStreams } from './RequestStreams';
import { ServerDistrict } from './ServerDistrict';
import './world.css';

function Clock() {
  useFrame(({ clock }) => { vclock.t = useStore.getState().reel ? reelClock.t : clock.elapsedTime; });
  return null;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
function L({ at, y, title, value, tone }: { at: typeof POS.db; y: number; title: string; value: string; tone?: string }) {
  return (
    <Html position={[at.x, y, at.z]} center zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
      <div className={`wlabel ${tone ?? ''}`}><span>{title}</span><b>{value}</b></div>
    </Html>
  );
}
function Labels() {
  const sim = useSim(), x = sim.last(), p = sim.p;
  const up = sim.insts.filter((i) => i.state === 'up').length, boot = sim.insts.filter((i) => i.state === 'boot').length;
  const dbU = x?.dbUtil ?? 0, appU = x?.appUtil ?? 0;
  const tone = (u: number) => (u >= 0.95 ? 'bad' : u >= 0.7 ? 'warn' : '');
  const reel = useStore((s) => s.reel), allow = reel ? reelLabels(reelClock.t) : null;
  const show = (k: string) => !allow || allow.includes(k);
  return (
    <>
      {show('gateway') && <L at={POS.gateway} y={16} title="EDGE GATEWAY" value={`${Math.round(x?.arrRate ?? 0).toLocaleString()} req/s`} />}
      {show('cache') && <L at={POS.cache} y={13.6} title="CACHE VAULT" value={p.cacheOn ? `${pct(x?.hitRate ?? 0)} hits` : 'OFF'} tone={p.cacheOn ? 'cache' : 'off'} />}
      {show('lb') && <L at={POS.lb} y={7} title="LOAD BALANCER" value={{ rr: 'round robin', least: 'least conn.', weighted: 'weighted' }[p.lb]} />}
      {show('app') && <L at={POS.district.clone().setZ(-9.5)} y={11} title={`APP SERVERS · ${up}${boot ? ` +${boot} booting` : ''}`} value={pct(appU)} tone={tone(appU)} />}
      {show('db') && <L at={POS.db} y={14.5} title={`DATABASE · TIER ${p.dbTier}`} value={pct(dbU)} tone={tone(dbU)} />}
      {show('jobs') && <L at={POS.workers} y={5} title={`JOB QUEUE · ${p.workers} WORKERS`} value={`${sim.jobsQueued.toLocaleString()} queued`} tone="job" />}
      {/* always mounted (drei Html must not unmount mid-render); shown only while the DB is actually maxed */}
      <Html position={[POS.db.x, 18.5, POS.db.z]} center zIndexRange={[4, 0]} style={{ pointerEvents: 'none', display: dbU >= 0.95 && show('db') ? 'block' : 'none' }}><div className="wlabel alarm">BOTTLENECK · {DB_TIERS[p.dbTier].units.toLocaleString()} units/s maxed</div></Html>
    </>
  );
}

export function ServerCity() {
  return (
    <>
      <Clock />
      <color attach="background" args={[COLOR.base]} />
      <fog attach="fog" args={['#060b18', 70, 190]} />
      <ambientLight intensity={0.25} />
      <hemisphereLight args={['#7fb4ff', '#0a0f1f', 0.5]} />
      <directionalLight position={[-30, 50, 30]} intensity={1.6} color={'#cfe3ff'} castShadow shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-50} shadow-camera-right={50} shadow-camera-top={35} shadow-camera-bottom={-35} shadow-camera-far={150} shadow-bias={-0.0004} />
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={2} color={'#2ee6ff'} position={[-20, 10, 10]} scale={[20, 4, 1]} />
        <Lightformer intensity={3} color={'#ff7a1a'} position={[25, 8, -10]} scale={[10, 10, 1]} />
        <Lightformer intensity={1.5} color={'#ffffff'} position={[0, 30, 0]} rotation-x={Math.PI / 2} scale={[60, 40, 1]} />
      </Environment>
      <Board />
      <EdgeGateway />
      <CacheVault />
      <LoadBalancer />
      <ServerDistrict />
      <DatabaseCore />
      <QueueFacility />
      <RequestStreams />
      <Labels />
      <CameraDirector />
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={0.85} luminanceThreshold={1} luminanceSmoothing={0.2} radius={0.7} />
        <Vignette offset={0.25} darkness={0.7} />
      </EffectComposer>
    </>
  );
}
