// The Diwali street: four bots walk up to camera holding lit phuljhari while every kind of cracker goes off around
// them, stop in a row, and each wishes "Happy Diwali!". Built in code (Three.js through @remotion/three): the
// Claude voxel bot, two bots on the Grok Bot crew's rig (GROK charcoal, MUSE Meta-blue) and one felt Dots mascot.
import React, { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { buildBot, applyPose, restPose, walk, blinkAt, SPECS, type Rig } from '../bots/grokbots';
import { buildDot, applyDot, restDot, idleDot, type DotRig } from '../bots/dots';
import { buildClaude, applyClaude, type ClaudeRig } from '../bots/claude';
import { FxBuf, sparkler, rocket, anaar, chakri, ladi, hash, type V3 } from './fx';
import { BOMBS, CHORUS, COLOR, FOUNTAINS, IGNITE, LADIS, SAY, SHELLS, STOP, WALK0, WHEELS, XPOS, Z0, Z1, DURATION, type BotKey } from './plan';

const cl = (x: number) => Math.min(1, Math.max(0, x)), io = (x: number) => { x = cl(x); return x * x * (3 - 2 * x); };
const out3 = (x: number) => 1 - (1 - cl(x)) ** 3;

// ---------- the street ----------
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function Street() {
  const { rangoli, ground, houses } = useMemo(() => {
    const ground = canvasTex(512, 512, (g) => { g.fillStyle = '#2a2530'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 9000; i++) { const v = 30 + hash(i) * 40; g.fillStyle = `rgb(${v},${v - 4},${v + 6})`; g.fillRect(hash(i + 1) * 512, hash(i + 2) * 512, 2, 2); } });
    ground.wrapS = ground.wrapT = THREE.RepeatWrapping; ground.repeat.set(8, 30);
    const rangoli = canvasTex(1024, 1024, (g) => {
      g.translate(512, 512); const cols = ['#ff3d6e', '#ffb300', '#1ec8a5', '#7a5cff', '#ff7a1a', '#ffffff'];
      for (let ring = 7; ring >= 0; ring--) { const r = 60 + ring * 60, n = 8 + ring * 4; g.fillStyle = cols[ring % cols.length];
        for (let k = 0; k < n; k++) { g.save(); g.rotate((k / n) * Math.PI * 2); g.beginPath(); g.ellipse(r, 0, 34, 16 + ring * 2, 0, 0, Math.PI * 2); g.fill(); g.restore(); } }
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 40, 0, Math.PI * 2); g.fill();
    });
    // a row of houses on each side: dark walls with warm windows and strings of coloured bulbs
    const houses: { x: number; z: number; w: number; h: number; d: number; c: string }[] = [];
    for (let i = 0; i < 9; i++) for (const sx of [-1, 1]) houses.push({ x: sx * (3.6 + hash(i * 3 + sx) * 0.6), z: -2 - i * 3.1, w: 2.2, h: 3.2 + hash(i + sx * 7) * 2.6, d: 2.9, c: ['#3b2a3e', '#2c3346', '#3e3027', '#2a3a35'][i % 4] });
    return { rangoli, ground, houses };
  }, []);
  const bulbs = useMemo(() => {
    const pts: { p: V3; c: THREE.Color }[] = []; const pal = ['#ff4d6d', '#ffd23f', '#3bceac', '#a06cff', '#ff8c42'];
    for (let s = 0; s < 6; s++) { const z = -1.5 - s * 4.2; for (let i = 0; i <= 26; i++) { const u = i / 26, x = -3.3 + 6.6 * u, y = 3.6 - Math.sin(u * Math.PI) * 0.9; pts.push({ p: [x, y, z], c: new THREE.Color(pal[(i + s) % 5]) }); } }
    return pts;
  }, []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -12]} receiveShadow><planeGeometry args={[14, 60]} /><meshStandardMaterial map={ground} roughness={0.55} metalness={0.15} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0.55]}><circleGeometry args={[0.8, 64]} /><meshStandardMaterial map={rangoli} roughness={0.8} /></mesh>
      {houses.map((h, i) => (
        <group key={i} position={[h.x, h.h / 2, h.z]}>
          <mesh><boxGeometry args={[h.w, h.h, h.d]} /><meshStandardMaterial color={h.c} roughness={0.9} /></mesh>
          {Array.from({ length: Math.floor(h.h / 1.1) }, (_, j) => (
            <mesh key={j} position={[-Math.sign(h.x) * (h.w / 2 + 0.01), -h.h / 2 + 0.9 + j * 1.1, (j % 2 ? 0.5 : -0.5)]} rotation={[0, -Math.sign(h.x) * Math.PI / 2, 0]}>
              <planeGeometry args={[0.55, 0.7]} /><meshBasicMaterial color={new THREE.Color(hash(i * 5 + j) > 0.3 ? '#ffb45a' : '#3a2a20').multiplyScalar(0.85)} toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}
      {bulbs.map((b, i) => <mesh key={i} position={b.p}><sphereGeometry args={[0.045, 10, 8]} /><meshBasicMaterial color={b.c.clone().multiplyScalar(1.15)} toneMapped={false} /></mesh>)}
    </>
  );
}

// ---------- the particle layer: one Points draw for every spark in the frame ----------
const VS = /* glsl */ `attribute float size; varying vec3 vC; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * 1150.0 / -mv.z; gl_Position = projectionMatrix * mv; }`;
const FS = /* glsl */ `varying vec3 vC; void main(){ vec2 q = gl_PointCoord - 0.5; float d = length(q); float a = smoothstep(0.5, 0.0, d); a = a * a; gl_FragColor = vec4(vC * a * 1.15, 1.0); }`;

function Fx({ t, tips }: { t: number; tips: { tip: V3; on: number; seed: number }[] }) {
  const { buf, geo, mat } = useMemo(() => {
    const buf = new FxBuf(60000), geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(buf.pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(buf.col, 3)); geo.setAttribute('size', new THREE.BufferAttribute(buf.size, 1));
    const mat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    return { buf, geo, mat };
  }, []);
  buf.reset();
  tips.forEach((s) => sparkler(buf, t, s.tip, s.on, s.seed));
  SHELLS.forEach((s, i) => rocket(buf, t, s, i + 1));
  FOUNTAINS.forEach((f, i) => anaar(buf, t, f, 50 + i));
  WHEELS.forEach((w, i) => chakri(buf, t, w, 70 + i));
  LADIS.forEach((l, i) => ladi(buf, t, l, 90 + i));
  geo.setDrawRange(0, buf.n);
  (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true; (geo.attributes.color as THREE.BufferAttribute).needsUpdate = true; (geo.attributes.size as THREE.BufferAttribute).needsUpdate = true;
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

// smoke from the bombs: soft grey puffs (normal blending)
function Smoke({ t }: { t: number }) {
  return (<>{BOMBS.flatMap((b, bi) => Array.from({ length: 10 }, (_, i) => {
    const age = t - b.t; if (age < 0 || age > 3) return null;
    const a = (i / 10) * Math.PI * 2, r = 0.3 + age * (0.6 + hash(bi * 9 + i) * 0.5), s = 0.5 + age * 0.8;
    return <mesh key={`${bi}-${i}`} position={[b.x + Math.cos(a) * r, 0.4 + age * 0.5 + hash(i) * 0.3, b.z + Math.sin(a) * r * 0.5]}>
      <sphereGeometry args={[s, 12, 10]} /><meshStandardMaterial color="#8a8590" transparent opacity={0.22 * (1 - age / 3)} depthWrite={false} roughness={1} />
    </mesh>;
  }))}</>);
}

function Post() {
  const { gl, scene, camera, size } = useThree();
  const composer = useMemo(() => {
    const pr = gl.getPixelRatio(), rt = new THREE.WebGLRenderTarget(size.width * pr, size.height * pr, { type: THREE.HalfFloatType, samples: 4 });
    const c = new EffectComposer(gl, rt); c.setPixelRatio(pr); c.setSize(size.width, size.height);
    c.addPass(new RenderPass(scene, camera)); c.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), 0.55, 0.35, 0.92)); c.addPass(new OutputPass());
    return c;
  }, [gl, scene, camera, size]);
  useFrame(() => { composer.render(); }, 1);
  return null;
}

// ---------- the bots ----------
function botZ(t: number) { return Z0 + (Z1 - Z0) * io((t - WALK0) / (STOP - WALK0)); }
const wp = new THREE.Vector3();

export const Scene: React.FC = () => {
  const fr = useCurrentFrame(), t = fr / 60;
  const { camera, scene, gl } = useThree();
  const rigs = useMemo(() => {
    const grok = buildBot('grok'), muse = buildBot('muse'), dots = buildDot('blue'), claude = buildClaude();
    // sparklers: a thin wire stick in each hand, the burning tip is a child we read the world position of
    const stick = (parent: THREE.Object3D, len: number, rot: [number, number, number], pos: V3 = [0, 0, 0]) => {
      const g = new THREE.Group(); g.position.set(...pos); g.rotation.set(...rot); parent.add(g);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, len, 6), new THREE.MeshStandardMaterial({ color: '#8d8f96', metalness: 0.7, roughness: 0.35 })); m.position.y = len / 2; g.add(m);
      const tip = new THREE.Group(); tip.position.y = len; g.add(tip); return tip;
    };
    const tips: Record<BotKey, THREE.Group> = {
      grok: stick(grok.handR, 0.42, [Math.PI, 0, 0.3]),
      muse: stick(muse.handR, 0.42, [Math.PI, 0, 0.3]),
      claude: stick(claude.hand, 0.42, [0, 0, -0.5]),
      dots: (() => { const nub = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), new THREE.MeshStandardMaterial({ color: '#3B74E6', roughness: 0.9 })); nub.position.set(0.24, 0.2, 0.06); dots.body.add(nub); return stick(nub, 0.4, [0, 0, -0.55]); })(),
    };
    [grok.root, muse.root, dots.root, claude.root].forEach((r) => scene.add(r));
    const lights = (['grok', 'claude', 'muse', 'dots'] as BotKey[]).map(() => { const l = new THREE.PointLight('#ffb36b', 0, 3.5, 2); scene.add(l); return l; });
    return { grok, muse, dots, claude, tips, lights };
  }, [scene]);
  useMemo(() => {
    scene.background = new THREE.Color('#0b0a1e'); scene.fog = new THREE.FogExp2('#120e2a', 0.035);
    gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.0;
  }, [scene, gl]);

  // camera: low, looking up the street; dollies back as they approach, settles for the wishes, lifts for the finale
  // starts close on their faces (the sparklers ignite right there), then retreats faster than they walk
  const cz = -2.7 + 7.6 * io((t - 0.9) / (STOP - 0.6)), cy = 0.62 + 0.18 * io((t - 0.5) / 8) + 0.3 * io((t - 11.6) / 3.5);
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(0.05 * Math.sin(t * 0.4), cy, cz); cam.fov = 46; cam.aspect = 1080 / 1920; cam.near = 0.05; cam.far = 120;
  cam.lookAt(0, 0.72 + 1.5 * io((t - 11.8) / 3.5), cz - 6); cam.updateProjectionMatrix();

  // poses: walk until STOP, then face camera; raise the sparkler at the wish, wave it through the finale
  const walking = t > WALK0 && t < STOP + 0.2, wk = cl(Math.min((t - WALK0) / 0.4, (STOP - t) / 0.5 + 0.4)), z = botZ(t);
  const wish = (k: BotKey) => { const a = t - SAY[k]; return a < -0.2 ? 0 : Math.exp(-Math.max(0, a - 0.35) / 0.5) * cl((a + 0.2) / 0.2); };
  const wave = io((t - CHORUS + 0.6) / 0.5);
  const armUp = (k: BotKey) => Math.max(wish(k), io((t - (STOP - 0.1)) / 0.5) * 0.55, wave);
  const rig = (r: Rig, k: BotKey, seed: number) => {
    const p = restPose(); p.x = XPOS[k]; p.z = z; p.rotY = 0;
    if (walking) walk(p, (t - WALK0) * (1.6 + seed * 0.04), wk * 0.25, r.spec);
    const up = Math.max(armUp(k), 0.42), w = Math.sin((t - CHORUS) * 7 + seed) * wave;      // sparklers held up at chest height from the start
    p.armR = [0.6 + 2.0 * up, 0.25 + 0.4 * w, 0.3]; p.headPitch = -0.15 * up; p.ex.happy = Math.max(wish(k), wave); p.y += 0.12 * wish(k) * Math.abs(Math.sin((t - SAY[k]) * 9));
    p.blink = blinkAt(t, seed);
    applyPose(r, p);
  };
  rig(rigs.grok, 'grok', 3); rig(rigs.muse, 'muse', 5);
  { // Dots: hops instead of steps
    const p = restDot(); p.x = XPOS.dots; p.z = z; idleDot(p, t, 2);
    if (walking) { const ph = ((t - WALK0) * 2.0) % 1; p.y += 0.09 * Math.sin(ph * Math.PI) * wk; p.sq += -0.12 * Math.cos(ph * Math.PI * 2) * wk; }
    const w = wish('dots'); p.y += 0.25 * w * Math.abs(Math.sin((t - SAY.dots) * 8)); p.happy = Math.max(w, wave); p.mouth = w * Math.abs(Math.sin((t - SAY.dots) * 14));
    applyDot(rigs.dots, p);
  }
  { // Claude: legs step in diagonal pairs, the right arm lifts the sparkler
    const w = wish('claude'), up = Math.max(armUp('claude'), 0.42);
    applyClaude(rigs.claude, { x: XPOS.claude, z, rotY: 0, bob: (walking ? 0.03 * Math.abs(Math.sin((t - WALK0) * 1.9 * Math.PI)) * wk : 0) + 0.12 * w * Math.abs(Math.sin((t - SAY.claude) * 9)),
      walkPh: walking ? (t - WALK0) * 1.9 : 0, walkK: walking ? wk : 0, armR: -0.3 + 1.6 * up + 0.4 * Math.sin((t - CHORUS) * 7) * wave, armL: 0.2 * w, squash: -0.08 * w, blink: blinkAt(t, 9) });
  }
  scene.updateMatrixWorld(true);
  const keys: BotKey[] = ['grok', 'claude', 'muse', 'dots'];
  const tips = keys.map((k, i) => {
    rigs.tips[k].getWorldPosition(wp); const on = cl((t - IGNITE[k]) / 0.12);
    const l = rigs.lights[i]; l.position.copy(wp); l.intensity = on * (0.45 + 0.12 * Math.sin(t * 37 + i * 2) + 0.08 * Math.sin(t * 61 + i));
    return { tip: [wp.x, wp.y, wp.z] as V3, on, seed: 10 + i };
  });
  // the burst flashes light the street in the shell's colour
  const flash = SHELLS.reduce((m, s) => { const a = t - (s.t + 1.05); return a >= 0 && a < 0.6 ? Math.max(m, 1 - a / 0.6) : m; }, 0);
  const bomb = BOMBS.reduce((m, b) => { const a = t - b.t; return a >= 0 && a < 0.35 ? Math.max(m, 1 - a / 0.35) : m; }, 0);
  return (
    <>
      <hemisphereLight args={['#5a4d8a', '#140f22', 0.55 + 0.3 * flash]} />
      <directionalLight position={[2, 6, 4]} intensity={0.25} color="#8f9cff" />
      <pointLight position={[0, 9, -14]} intensity={25 * flash} distance={40} color="#ffd6a8" />
      <pointLight position={[2.7, 1, -8.3]} intensity={35 * bomb} distance={20} color="#fff2d0" />
      <Street />
      <Smoke t={t} />
      <Fx t={t} tips={tips} />
      <Post />
      {/* keep DURATION referenced so the plan stays the single source */}
      {t > DURATION ? null : null}
    </>
  );
};
export { COLOR };
