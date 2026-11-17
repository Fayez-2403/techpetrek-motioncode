// The EditorBro highway: golden-hour road, a pickup towing a giant clapperboard, and the painted
// "WELCOME TO EditorBro" billboard on two poles behind the barrier. render(t) is a pure function of t.
//
// Shot (0 -> 4 s), after the road-sign welcome in the GTA VI trailer: ride behind the truck, it changes lane to the
// left, the camera pans right onto the billboard and pushes in until the sign fills ~80 % of the frame width.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { paintPoster, paintSign } from './sign';
import { asphalt, bark, concrete, foliage, frond, leafCard, ROAD_X0, ROAD_X1 } from './textures';
import { buildTruck, WHEEL_R } from './truck';
import { lerp, mulberry32, quint } from './rng';

const SUN = new THREE.Vector3(-0.8, 0.15, 0.12).normalize();
const lin = (r: number, g: number, b: number) => new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace);
const HAZE = lin(0.92, 0.68, 0.46);

// Billboard placement: right of the road, facing back toward where the camera ends up.
const BB = { x: 15, z: -66, base: 7.2, w: 9, h: 6.19, ry: -0.458 };
export const SIGN_CENTER = new THREE.Vector3(BB.x, BB.base + BB.h / 2, BB.z);

// v3: a vertical 9:16 LED screen instead of the painted sign, further down a faster road (user, 2026-10-31)
const SC = { x: 15, z: -168, base: 4.6, w: 6.0, h: 6.0 * 16 / 9, ry: -0.35 };
export const SCREEN_CENTER = new THREE.Vector3(SC.x, SC.base + SC.h / 2, SC.z);
const SC_N = new THREE.Vector3(Math.sin(SC.ry), 0, Math.cos(SC.ry));          // the screen's facing direction
const FILL_FOV = 40;                                                            // at the end of the dive the screen exactly fills a 9:16 frame
export const FILL_POS = SCREEN_CENTER.clone().addScaledVector(SC_N, (SC.h / 2) / Math.tan((FILL_FOV / 2) * Math.PI / 180) * 0.985);
// v3 timing (from the voice: S = first word, D1 = just after "code"), overridable per capture: ?S=&D0=&D1=
export const V3T = { S: 4.05, D0: 5.4, D1: 6.4 };   // a fast catch: 1.35 s swing-in, 1.0 s dive
// the chase: the pickup weaves past three slower cars (lane, car start z), all moving forward
// timed so the pickup AND the chase camera (13 m behind = 0.54 s on the same path) clear each slow car with margin
const LANES: [number, number, number][] = [[0.8, 1.4, -3.6], [2.5, 3.1, 0]];   // [t0, t1, to-lane]
export const SLOW_CARS: [number, number][] = [[0, -31.2], [-3.6, -55.2]];   // met by the pickup at 1.6 s and 3.6 s
const TRUCK_V = 24, SLOW_V = 12;
export function truck3(t: number) {
  let x = 0, from = 0;
  for (const [a, b, to] of LANES) { x = from + (to - from) * quint((t - a) / (b - a)); if (t < b) break; from = to; }
  const dx = (truck3x(t + 0.01) - truck3x(t - 0.01)) / 0.02;
  return { x, z: -12 - TRUCK_V * t, yaw: Math.atan2(dx, TRUCK_V) * 0.9, dist: TRUCK_V * t };
}
function truck3x(t: number) {
  let x = 0, from = 0;
  for (const [a, b, to] of LANES) { x = from + (to - from) * quint((t - a) / (b - a)); if (t < b) break; from = to; }
  return x;
}

// v3 camera before the dive: a chase cam 13 m behind the weaving pickup until he speaks (S); from S it keeps rolling
// forward, slowing, while it turns and pushes in on the screen (the main zoom-in) until D0.
export function cameraAt3(t: number, T = V3T) {
  const shake = new THREE.Vector3(0.05 * Math.sin(t * 13.1), 0.04 * Math.sin(t * 11.3) + 0.02 * Math.sin(t * 17.1 + 1), 0);
  const tc = Math.min(t, T.S), tr = truck3(tc), lag = truck3(Math.max(0, tc - 0.3));
  const chasePos = new THREE.Vector3(truck3x(tc - 0.54), 1.75, tr.z + 13);   // on the pickup's own path, 0.54 s behind
  const chaseAim = new THREE.Vector3(tr.x * 0.9, 1.3, tr.z - 30);
  if (t <= T.S) return { pos: chasePos.add(shake), aim: chaseAim, fov: 62, roll: 0.012 * Math.sin(t * 2.7) - 0.02 * (tr.x - lag.x) };
  const u = t - T.S, dur = T.D0 - T.S, e = quint(u / dur);
  const z = chasePos.z - (TRUCK_V * u - (TRUCK_V - 8) / (2 * dur) * u * u);
  const pos = new THREE.Vector3(lerp(chasePos.x, 0.5, e), lerp(1.75, 1.65, e), z).add(shake.multiplyScalar(1 - e));
  const aim = chaseAim.clone().setZ(z - 30).lerp(SCREEN_CENTER, e);
  return { pos, aim, fov: lerp(62, 30, e), roll: 0.01 * Math.sin(t * 2.7) * (1 - e) };
}

// ---------- camera and truck paths (pure functions of t) ----------
export function cameraAt(t: number) {
  const tt = Math.min(t, 4.6);
  const z = -(14 * tt - 1.2 * tt * tt) - (t > 4.6 ? 3 * (t - 4.6) : 0);
  const x = 0.5 * quint((t - 0.6) / 2.4);
  const y = 1.62 + 0.02 * Math.sin(t * 9.1) + 0.012 * Math.sin(t * 13.7 + 1);
  const pos = new THREE.Vector3(x, y, z);
  const far = new THREE.Vector3(x + 1.2, 2.3, z - 80);
  const k = quint((t - 0.7) / 2.6);
  const aim = far.lerp(SIGN_CENTER, k);
  aim.x += 0.08 * Math.sin(t * 2.3) * (1 - k * 0.6);
  aim.y += 0.06 * Math.sin(t * 3.1 + 2);
  // after the flip: crane up and back through the wireframe world
  const c = quint((t - 4.2) / 4.0);
  pos.y += 14 * c; pos.z += 16 * c; pos.x -= 3 * c;
  aim.lerp(new THREE.Vector3(3, 0, -110), 0.28 * c);
  const fov = lerp(56, 33, quint((t - 1.2) / 2.6)) + 16 * c;
  const roll = 0.004 * Math.sin(t * 3.1) + 0.002 * Math.sin(t * 7.3);
  return { pos, aim, fov, roll };
}

function truckAt(t: number) {
  const z = -17 - 19 * t;
  const k = quint((t - 0.6) / 1.8);
  const x = -3.6 * k;
  // heading follows the lane change (derivative of the quintic, approximated)
  const dk = (quint((t + 0.01 - 0.6) / 1.8) - quint((t - 0.01 - 0.6) / 1.8)) / 0.02;
  const yaw = Math.atan2(3.6 * dk, 19) * 0.9;
  return { x, z, yaw, dist: 19 * t };
}

// ---------- geometry helpers ----------
function blob(seed: number, detail = 3) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const rnd = mulberry32(seed);
  const ph = Array.from({ length: 9 }, () => rnd() * 6.283);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = 1 + 0.16 * Math.sin(v.x * 3.1 + ph[0]) * Math.sin(v.y * 2.7 + ph[1]) + 0.1 * Math.sin(v.z * 4.3 + ph[2])
      + 0.07 * Math.sin((v.x + v.z) * 6.1 + ph[3]) + 0.05 * Math.sin(v.y * 9.0 + ph[4]);
    v.multiplyScalar(n);
    if (v.y < 0) v.y *= 0.35;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function frondGeo(len: number, elev: number, droop: number, az: number, halfW: number) {
  const seg = 10, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= seg; i++) {
    const s = i / seg, L = s * len;
    const cx = L * Math.cos(elev), cy = L * Math.sin(elev) - droop * s * s * len;
    for (const side of [-1, 1]) {
      // a shallow V fold along the rib
      pos.push(cx, cy + Math.abs(side) * halfW * 0.25 * s, side * halfW);
      uv.push(side < 0 ? 0 : 1, s);
    }
    if (i < seg) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.rotateY(az);
  g.computeVertexNormals();
  return g;
}

function palm(seed: number, height: number) {
  const rnd = mulberry32(seed);
  const lean = new THREE.Vector3((rnd() - 0.5) * 2.2, 0, (rnd() - 0.5) * 2.2);
  const pts = [0, 0.33, 0.66, 1].map((s) => new THREE.Vector3(lean.x * s * s, s * height, lean.z * s * s));
  const curve = new THREE.CatmullRomCurve3(pts);
  const trunk = new THREE.TubeGeometry(curve, 16, 0.19, 7, false);
  const top = pts[3];
  const fronds: THREE.BufferGeometry[] = [];
  const n = 15 + Math.floor(rnd() * 5);
  for (let i = 0; i < n; i++) {
    const az = (i / n) * Math.PI * 2 + rnd() * 0.4;
    const f = frondGeo(3.6 + rnd() * 1.6, 0.25 + rnd() * 0.65, 0.5 + rnd() * 0.4, az, 0.72);
    f.translate(top.x, top.y, top.z);
    fronds.push(f);
  }
  return { trunk, fronds: mergeGeometries(fronds) };
}

// ---------- the sky ----------
function sky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uSun: { value: SUN }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      varying vec3 vDir; uniform vec3 uSun; uniform float uTime;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 6; i++){ s += a * vn(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
      void main(){
        vec3 d = normalize(vDir); float h = d.y;
        vec3 hor = vec3(1.0, 0.70, 0.45), mid = vec3(0.46, 0.58, 0.78), zen = vec3(0.13, 0.29, 0.58);
        vec3 col = mix(hor, mid, smoothstep(0.0, 0.2, h));
        col = mix(col, zen, smoothstep(0.2, 0.7, h));
        float sd = max(dot(d, uSun), 0.0);
        col += vec3(1.0, 0.55, 0.25) * pow(sd, 5.0) * 0.7 + vec3(1.0, 0.85, 0.6) * pow(sd, 90.0) * 2.0;
        vec2 p = d.xz / max(h + 0.06, 0.03);
        float c = fbm(p * 0.45 + vec2(uTime * 0.006, 0.0));
        float lit = fbm(p * 0.45 + uSun.xz * 0.1 + vec2(uTime * 0.006, 0.0));
        float cov = smoothstep(0.47, 0.7, c) * smoothstep(0.015, 0.1, h);
        vec3 cl = mix(vec3(0.5, 0.48, 0.55), vec3(1.15, 0.86, 0.62), clamp((c - lit) * 5.0 + 0.55 + sd * 0.5, 0.0, 1.0));
        col = mix(col, cl, cov * 0.92);
        col = mix(col, hor * 0.92, smoothstep(0.02, -0.06, h));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), mat);
}

// ---------- the world ----------
// The reel's timeline (SCENE_TIMINGS.json): the push-in ends and the scan starts at FLIP_AT, as "ye poora scene code hai"
// begins. The path was designed to end at 3.9 s, so hook time is stretched onto it.
export const FLIP_AT = 4.35;
const pathTime = (t: number) => (t < FLIP_AT ? t * (3.9 / FLIP_AT) : 3.9 + (t - FLIP_AT));

export async function createHighway(canvas: HTMLCanvasElement, W: number, H: number, opts: { sign?: 'welcome' | 'cta'; v3?: boolean; pull?: boolean; times?: Partial<typeof V3T> } = {}) {
  const T3 = { ...V3T, ...opts.times };
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(HAZE, 80, 620);
  const camera = new THREE.PerspectiveCamera(56, W / H, 0.1, 2000);

  const skyMesh = sky();
  scene.add(skyMesh);

  const sun = new THREE.DirectionalLight(lin(1.0, 0.7, 0.42), 4.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 400 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight(lin(0.42, 0.56, 0.85), lin(0.26, 0.18, 0.1), 0.75));

  // ground, road, opposite carriageway
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600, 160, 160), new THREE.MeshStandardMaterial({ color: lin(0.16, 0.15, 0.08), roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.02, -500); ground.receiveShadow = true;
  scene.add(ground);
  const roadTex = asphalt();
  roadTex.repeat.set(1, 900 / 12);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_X1 - ROAD_X0, 900, 9, 225), new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.92 }));
  road.rotation.x = -Math.PI / 2; road.position.set((ROAD_X0 + ROAD_X1) / 2, 0.005, -400); road.receiveShadow = true;
  scene.add(road);
  const road2 = new THREE.Mesh(new THREE.PlaneGeometry(15, 900), new THREE.MeshStandardMaterial({ color: lin(0.09, 0.09, 0.095), roughness: 0.95 }));
  road2.rotation.x = -Math.PI / 2; road2.position.set(-19, 0.004, -400); road2.receiveShadow = true;
  scene.add(road2);

  // jersey barriers (right edge and median)
  const prof = new THREE.Shape([[-0.3, 0], [0.3, 0], [0.3, 0.08], [0.16, 0.33], [0.1, 0.84], [-0.1, 0.84], [-0.16, 0.33], [-0.3, 0.08]].map(([x, y]) => new THREE.Vector2(x, y)));
  const bGeo = new THREE.ExtrudeGeometry(prof, { depth: 900, bevelEnabled: false, steps: 1 });
  bGeo.translate(0, 0, -900);
  const cTex = concrete(); cTex.repeat.set(1, 0.25);
  const bMat = new THREE.MeshStandardMaterial({ map: cTex, roughness: 0.95 });
  for (const x of [5.1, -10.7]) {
    const b = new THREE.Mesh(bGeo, bMat);
    b.position.set(x, 0, 60); b.castShadow = b.receiveShadow = true;
    scene.add(b);
  }

  // billboard
  const signCanvas = await paintSign(opts.sign ?? 'welcome');
  const signTex = new THREE.CanvasTexture(signCanvas);
  signTex.colorSpace = THREE.SRGBColorSpace; signTex.anisotropy = 16;
  const bb = new THREE.Group();
  bb.position.set(BB.x, 0, BB.z); bb.rotation.y = BB.ry;
  const metal = new THREE.MeshStandardMaterial({ color: lin(0.32, 0.33, 0.34), roughness: 0.55, metalness: 0.6 });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(BB.w, BB.h), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.8 }));
  face.position.set(0, BB.base + BB.h / 2, 0.01);
  const back = new THREE.Mesh(new THREE.BoxGeometry(BB.w + 0.3, BB.h + 0.3, 0.24), metal);
  back.position.set(0, BB.base + BB.h / 2, -0.13);
  bb.add(face, back);
  for (const x of [-2.7, 2.7]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, BB.base + 1.5, 14), metal);
    pole.position.set(x, (BB.base + 1.5) / 2, -0.45); bb.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.3), metal);
    arm.position.set(x * 1.25, BB.base + BB.h + 0.35, 0.45); bb.add(arm);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.34), new THREE.MeshStandardMaterial({ color: lin(0.12, 0.12, 0.13), roughness: 0.6 }));
    lamp.position.set(x * 1.25, BB.base + BB.h + 0.3, 1.1); lamp.rotation.x = 0.5; bb.add(lamp);
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.08), metal);
    stem.position.set(x * 1.25, BB.base + BB.h + 0.05, -0.1); bb.add(stem);
  }
  const brace = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.12, 0.12), metal);
  brace.position.set(0, BB.base * 0.55, -0.45); brace.rotation.z = 0.5; bb.add(brace);
  const brace2 = brace.clone(); brace2.rotation.z = -0.5; bb.add(brace2);
  const walk = new THREE.Mesh(new THREE.BoxGeometry(BB.w + 0.2, 0.07, 0.9), metal);
  walk.position.set(0, BB.base - 0.12, 0.42); bb.add(walk);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(BB.w + 0.2, 0.05, 0.05), metal);
  rail.position.set(0, BB.base + 0.9, 0.85); bb.add(rail);
  for (let i = 0; i <= 6; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.0, 0.05), metal);
    p.position.set(-BB.w / 2 + (i * BB.w) / 6, BB.base + 0.4, 0.85); bb.add(p);
  }
  bb.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  if (!opts.v3) scene.add(bb);

  // v3: the vertical LED screen on two legs (its picture is composited later, mapped onto `screen` corners)
  const scr = new THREE.Group();
  scr.position.set(SC.x, 0, SC.z); scr.rotation.y = SC.ry;
  const ledCv = document.createElement('canvas'); ledCv.width = 256; ledCv.height = 456;
  const lg = ledCv.getContext('2d')!; lg.fillStyle = '#05080a'; lg.fillRect(0, 0, 256, 456);
  lg.fillStyle = 'rgba(40,90,100,0.35)';
  for (let yy = 0; yy < 456; yy += 4) for (let xx = 0; xx < 256; xx += 4) lg.fillRect(xx, yy, 2, 2);
  const ledTex = new THREE.CanvasTexture(opts.v3 ? await paintPoster() : ledCv); ledTex.colorSpace = THREE.SRGBColorSpace; ledTex.anisotropy = 16;
  const screenFace = new THREE.Mesh(new THREE.PlaneGeometry(SC.w, SC.h), new THREE.MeshStandardMaterial({ map: ledTex, emissiveMap: ledTex, emissive: new THREE.Color(1, 1, 1), emissiveIntensity: 0.85, roughness: 0.3, metalness: 0.1 }));
  screenFace.position.set(0, SC.base + SC.h / 2, 0.2);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(SC.w + 0.36, SC.h + 0.36, 0.34), new THREE.MeshStandardMaterial({ color: lin(0.03, 0.032, 0.036), roughness: 0.4, metalness: 0.8 }));
  frame.position.set(0, SC.base + SC.h / 2, 0);
  scr.add(screenFace, frame);
  for (const x of [-1.9, 1.9]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.42, SC.base + 0.6, 0.42), metal);
    leg.position.set(x, (SC.base + 0.6) / 2, -0.1); scr.add(leg);
  }
  const topBar = new THREE.Mesh(new THREE.BoxGeometry(SC.w + 0.4, 0.06, 0.06), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: new THREE.Color(0.1, 0.9, 0.8), emissiveIntensity: 3 }));
  topBar.position.set(0, SC.base + SC.h + 0.24, 0.12); scr.add(topBar);
  scr.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  if (opts.v3) scene.add(scr);

  // vegetation: bushes and canopy masses (instanced), palms
  const rnd = mulberry32(77);
  const foliageTex = foliage(); foliageTex.repeat.set(3, 3);
  const leafMat = new THREE.MeshStandardMaterial({ map: foliageTex, bumpMap: foliageTex, bumpScale: 2.5, roughness: 0.95 });
  const blobs = [blob(1), blob(2), blob(3)];
  const green = (l: number) => new THREE.Color().setHSL(0.2 + rnd() * 0.08, 0.25 + rnd() * 0.2, l, THREE.SRGBColorSpace);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3();
  const cardSpots: [number, number, number, number][] = [];
  const place = (count: number, gen: () => [number, number, number, number, number], cards = false) => {
    const per = Math.ceil(count / 3);
    blobs.forEach((geo, gi) => {
      const im = new THREE.InstancedMesh(geo, leafMat, per);
      for (let i = 0; i < per; i++) {
        const [x, y, z, sxz, sy] = gen();
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * 6.28);
        m4.compose(p3.set(x, y, z), q, s3.set(sxz * (0.8 + rnd() * 0.4), sy, sxz));
        im.setMatrixAt(i, m4);
        im.setColorAt(i, green(0.42 + rnd() * 0.3 + gi * 0.03));
        if (cards) for (let k = 0; k < 3; k++) cardSpots.push([x + (rnd() - 0.5) * sxz * 1.4, y + sy * (0.55 + rnd() * 0.4), z + (rnd() - 0.5) * sxz * 1.4, sxz * (0.7 + rnd() * 0.5)]);
      }
      im.castShadow = im.receiveShadow = true;
      scene.add(im);
    });
  };
  // hedge right behind the right barrier, then scrub, then the canopy line; the same beyond the median
  place(1100, () => [5.9 + rnd() * 5, 0, 40 - rnd() * 420, 0.9 + rnd() * 1.2, 1.2 + rnd() * 1.6], true);
  place(1400, () => [10 + rnd() * 60, 0, 30 - rnd() * 500, 1.3 + rnd() * 2.0, 1.4 + rnd() * 2.3], true);
  place(420, () => [30 + rnd() * 120, 3 + rnd() * 3, -20 - rnd() * 600, 5 + rnd() * 6, 4 + rnd() * 5]);
  place(700, () => [-27 - rnd() * 60, 0, 30 - rnd() * 520, 1.5 + rnd() * 2.6, 1.6 + rnd() * 2.6]);
  place(260, () => [-45 - rnd() * 140, 3 + rnd() * 3, -40 - rnd() * 600, 5 + rnd() * 7, 4 + rnd() * 6]);

  // leaf-clump cards: two crossed alpha quads per spot
  const cardGeo = mergeGeometries([new THREE.PlaneGeometry(1, 1), new THREE.PlaneGeometry(1, 1).rotateY(Math.PI / 2)]);
  const cards = new THREE.InstancedMesh(cardGeo, new THREE.MeshStandardMaterial({ map: leafCard(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 }), cardSpots.length);
  cardSpots.forEach(([x, y, z, s], i) => {
    q.setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.6, rnd() * 6.28, (rnd() - 0.5) * 0.6));
    m4.compose(p3.set(x, y, z), q, s3.set(s * 1.6, s * 1.3, s * 1.6));
    cards.setMatrixAt(i, m4);
    cards.setColorAt(i, new THREE.Color().setHSL(0, 0, 0.75 + rnd() * 0.35));
  });
  cards.castShadow = cards.receiveShadow = true;
  scene.add(cards);

  const frondTex = frond();
  const frondMat = new THREE.MeshStandardMaterial({ map: frondTex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.85 });
  const barkTex = bark(); barkTex.repeat.set(1, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ map: barkTex, roughness: 0.95 });
  const palmSpots: [number, number][] = [];
  for (let i = 0; i < 34; i++) palmSpots.push([8 + rnd() * 40, 10 - rnd() * 260]);
  for (let i = 0; i < 18; i++) palmSpots.push([-14 - rnd() * 40, -10 - rnd() * 260]);
  palmSpots.push([20.5, -63], [10.5, -71], [24, -80]);
  palmSpots.forEach(([x, z], i) => {
    if (opts.v3 && x > 4 && x < 34 && z < -110 && z > -200) return;   // v3: keep the screen's sight line clear
    const { trunk, fronds } = palm(500 + i, 8 + rnd() * 7);
    const g = new THREE.Group();
    const tm = new THREE.Mesh(trunk, trunkMat), fm = new THREE.Mesh(fronds, frondMat);
    tm.castShadow = fm.castShadow = true; fm.receiveShadow = true;
    g.add(tm, fm); g.position.set(x, 0, z); g.rotation.y = rnd() * 6.28;
    scene.add(g);
  });

  // power poles and wires on the right
  const poleMat = new THREE.MeshStandardMaterial({ color: lin(0.38, 0.36, 0.33), roughness: 0.8 });
  const wirePts: number[] = [];
  const tops: THREE.Vector3[][] = [];
  for (let z = 50; z > -620; z -= 42) {
    if (opts.v3 && z < -60 && z > -195) continue;   // v3: no poles in the screen's sight line (the wires span to the next pole)
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 13, 8), poleMat);
    pole.position.set(7.4, 6.5, z); pole.castShadow = true; scene.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, 0.14), poleMat);
    arm.position.set(7.4, 12.5, z); scene.add(arm);
    tops.push([-1.2, 0, 1.2].map((dx) => new THREE.Vector3(7.4 + dx, 12.6, z)));
  }
  for (let i = 0; i < tops.length - 1; i++) {
    for (let w = 0; w < 3; w++) {
      const a = tops[i][w], b = tops[i + 1][w];
      for (let k = 0; k < 12; k++) {
        const s0 = k / 12, s1 = (k + 1) / 12;
        const sag = (s: number) => -1.1 * 4 * s * (1 - s);
        wirePts.push(lerp(a.x, b.x, s0), a.y + sag(s0), lerp(a.z, b.z, s0), lerp(a.x, b.x, s1), a.y + sag(s1), lerp(a.z, b.z, s1));
      }
    }
  }
  const wires = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(wirePts, 3)), new THREE.LineBasicMaterial({ color: 0x222222 }));
  scene.add(wires);

  // overhead gantry far ahead, with blank green panels
  const gantry = new THREE.Group();
  for (const x of [-10.6, 4.9]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7.4, 0.5), metal);
    post.position.set(x, 3.7, 0); gantry.add(post);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(16.2, 0.7, 0.7), metal);
  beam.position.set(-2.85, 7.2, 0); gantry.add(beam);
  for (const x of [-8, -3.2, 1.6]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.0, 0.12), new THREE.MeshStandardMaterial({ color: lin(0.02, 0.2, 0.09), roughness: 0.5 }));
    panel.position.set(x, 8.6, 0.3); gantry.add(panel);
  }
  gantry.position.z = -230;
  scene.add(gantry);

  // low-rise buildings on the far left horizon
  for (let i = 0; i < 26; i++) {
    const h = 6 + rnd() * 22;
    const b = new THREE.Mesh(new THREE.BoxGeometry(10 + rnd() * 25, h, 10 + rnd() * 20), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.08, 0.15, 0.55 + rnd() * 0.25, THREE.SRGBColorSpace), roughness: 0.9 }));
    b.position.set(-70 - rnd() * 180, h / 2, -280 - rnd() * 350);
    scene.add(b);
  }

  // the truck: pickup + trailer + a giant clapperboard facing the camera
  const { group: truck, wheels, hinge } = buildTruck();
  scene.add(truck);

  // a few cars ahead and oncoming, and birds
  const cars: { m: THREE.Group; x: number; z0: number; v: number }[] = [];
  const carColors = [lin(0.5, 0.5, 0.52), lin(0.25, 0.02, 0.02), lin(0.6, 0.58, 0.55), lin(0.02, 0.06, 0.18), lin(0.03, 0.03, 0.03)];
  [[-3.6, -70, 21], [-7.2, -120, 18], [0, -160, 17], [-3.6, -210, 20], [-16, -90, -24], [-21, -200, -26], [-16, -300, -22]].forEach(([x, z0, v], i) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.7, 4.4), new THREE.MeshStandardMaterial({ color: carColors[i % 5], roughness: 0.35, metalness: 0.6 }));
    body.position.y = 0.7; g.add(body);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 2.2), new THREE.MeshStandardMaterial({ color: lin(0.03, 0.04, 0.05), roughness: 0.1, metalness: 0.8 }));
    cab.position.set(0, 1.28, 0.2); g.add(cab);
    g.traverse((o) => { o.castShadow = true; });
    scene.add(g);
    cars.push({ m: g, x, z0, v });
  });
  const slow: THREE.Group[] = [];
  if (opts.v3) SLOW_CARS.forEach(([x], i) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.7, 4.4), new THREE.MeshStandardMaterial({ color: carColors[(i + 2) % 5], roughness: 0.35, metalness: 0.6 }));
    body.position.y = 0.7; g.add(body);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 2.2), new THREE.MeshStandardMaterial({ color: lin(0.03, 0.04, 0.05), roughness: 0.1, metalness: 0.8 }));
    cab.position.set(0, 1.28, 0.2); g.add(cab);
    for (const sx of [-0.8, 0.8]) {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.05), new THREE.MeshStandardMaterial({ color: 0x220000, emissive: new THREE.Color(1, 0.05, 0.02), emissiveIntensity: 2.5 }));
      tl.position.set(sx, 0.85, 2.21); g.add(tl);
    }
    g.traverse((o) => { o.castShadow = true; }); g.position.x = x; scene.add(g); slow.push(g);
  });
  const birdGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0, -0.06, 0.1, 0, 0, -0.1, 0.5, 0, 0, 0, -0.06, 0.1, 0, 0, -0.1], 3));
  const birds: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Mesh(birdGeo, new THREE.MeshBasicMaterial({ color: 0x2a2a30, side: THREE.DoubleSide }));
    scene.add(b); birds.push(b);
  }

  // post: bloom, tone map, then grade + vignette + grain + edge fringe
  const rt = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(1);
  composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.32, 0.65, 0.9));
  composer.addPass(new OutputPass());
  // the "it's code" flip: the same scene drawn as teal wireframe into its own target, revealed by a scan line
  const wireRT = new THREE.WebGLRenderTarget(W, H, { samples: 4 });
  const wireMat = new THREE.MeshBasicMaterial({ color: lin(0.12, 1.0, 0.85), wireframe: true });
  // the sign keeps its art as a teal hologram, so the brand survives the flip; leaf cards and birds sit it out
  const holoMat = new THREE.MeshBasicMaterial({ map: signTex, color: lin(0.35, 1.0, 0.9) });
  const wireDim = new THREE.MeshBasicMaterial({ color: lin(0.02, 0.28, 0.24), wireframe: true });
  const swap: { m: THREE.Mesh | THREE.LineSegments; orig: THREE.Material | THREE.Material[] }[] = [];
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if ((m.isMesh || (o as THREE.LineSegments).isLineSegments) && o !== skyMesh && o !== cards && !birds.includes(m)) swap.push({ m, orig: m.material });
  });
  const hideInWire: THREE.Object3D[] = [skyMesh, cards, ...birds];
  const wireFog = new THREE.Fog(0x000000, 30, 300);
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, tWire: { value: wireRT.texture }, uScan: { value: -1 }, uSeed: { value: 0 }, uRes: { value: new THREE.Vector2(W, H) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform sampler2D tWire; uniform float uScan; uniform float uSeed; uniform vec2 uRes; varying vec2 vUv;
      void main(){
        vec2 d = vUv - 0.5;
        float r2 = dot(d, d);
        vec3 c;
        c.r = texture2D(tDiffuse, vUv - d * 0.004 * r2 * 4.0).r;
        c.g = texture2D(tDiffuse, vUv).g;
        c.b = texture2D(tDiffuse, vUv + d * 0.004 * r2 * 4.0).b;
        float l = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(c, c * vec3(0.9, 1.0, 1.06), (1.0 - l) * 0.35);
        c = mix(c, c * vec3(1.06, 1.0, 0.9), l * 0.25);
        c = mix(vec3(l), c, 1.06);
        c += vec3(1.0, 0.55, 0.2) * smoothstep(0.55, -0.05, vUv.x) * smoothstep(0.1, 0.7, vUv.y) * 0.09;
        float yt = 1.0 - vUv.y;
        float mask = step(yt, uScan);
        vec3 w = pow(texture2D(tWire, vUv).rgb, vec3(0.4545));
        vec3 code = vec3(0.008, 0.016, 0.02) + w * 1.1;
        c = mix(c, code, mask);
        c += vec3(0.55, 1.0, 0.95) * exp(-abs(yt - uScan) * 140.0) * step(-0.5, uScan) * 0.9;
        float v = smoothstep(0.85, 0.2, length(d * vec2(1.0, 0.75)));
        c *= mix(0.7, 1.0, v);
        float g = fract(sin(dot(floor(vUv * uRes) + uSeed, vec2(12.9898, 78.233))) * 43758.5453);
        c += (g - 0.5) * 0.04;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  grade.uniforms.tWire.value = wireRT.texture; // ShaderPass clones uniform textures; point it back at the live target
  composer.addPass(grade);

  // v3 camera: the fast push-in, then a dive along the screen's axis until it fills the frame; or (pull) the reverse
  function camera3(t: number) {
    if (opts.pull) {
      const e = quint(t / 2.6), wide = cameraAt3(T3.S + 0.6 * (T3.D0 - T3.S), T3);
      const pos = FILL_POS.clone().lerp(wide.pos.clone().add(new THREE.Vector3(0, 2.2, 0)), e);
      const aim = SCREEN_CENTER.clone().lerp(SCREEN_CENTER.clone().add(new THREE.Vector3(-4, -3, 0)), e);
      return { pos, aim, fov: lerp(FILL_FOV, 56, e), roll: 0.004 * Math.sin(t * 3.1) * e };
    }
    if (t < T3.D0) return cameraAt3(t, T3);
    const push = cameraAt3(T3.D0, T3);
    const e = quint((t - T3.D0) / (T3.D1 - T3.D0));
    return { pos: push.pos.clone().lerp(FILL_POS, e), aim: push.aim.clone().lerp(SCREEN_CENTER, e), fov: lerp(push.fov, FILL_FOV, e), roll: push.roll * (1 - e) };
  }
  const corner = new THREE.Vector3();
  function corners() {
    return [[-1, 1], [1, 1], [1, -1], [-1, -1]].map(([sx, sy]) => {
      corner.set((sx * SC.w) / 2, (sy * SC.h) / 2, 0.21);
      screenFace.localToWorld(corner).project(camera);
      return [Math.round(((corner.x + 1) / 2) * W * 10) / 10, Math.round(((1 - corner.y) / 2) * H * 10) / 10];
    });
  }

  function render(t: number) {
    const tp = pathTime(t);
    const cam = opts.v3 ? camera3(t) : cameraAt(tp);
    camera.position.copy(cam.pos);
    camera.fov = cam.fov;
    camera.updateProjectionMatrix();
    camera.lookAt(cam.aim);
    camera.rotateZ(cam.roll);
    skyMesh.position.copy(camera.position);
    (skyMesh.material as THREE.ShaderMaterial).uniforms.uTime.value = t;

    sun.target.position.set(8, 0, cam.pos.z - 40);
    sun.position.copy(sun.target.position).addScaledVector(SUN, 150);

    const tr = truckAt(tp);
    if (opts.v3) {
      // the pickup weaving through the slow cars; in the pull-out it drives on past the screen in the left lane
      const r = opts.pull ? { x: -3.6, z: 400, yaw: 0, dist: 0 } : truck3(t);   // the pull-out has nothing in front of the screen
      truck.position.set(r.x, 0, r.z); truck.rotation.y = r.yaw;
      wheels.forEach((w) => { w.rotation.x = -r.dist / (WHEEL_R * w.scale.x); });
      hinge.rotation.z = 0.32 + 0.04 * Math.sin(t * 6.0);
    } else {
      truck.position.set(tr.x, 0.0, tr.z);
      truck.rotation.y = tr.yaw;
      wheels.forEach((w) => { w.rotation.x = -tr.dist / (WHEEL_R * w.scale.x); });
      hinge.rotation.z = 0.32 + 0.04 * Math.sin(t * 6.0);
    }

    slow.forEach((g, i) => { g.position.z = SLOW_CARS[i][1] - SLOW_V * t; });
    for (const c of cars) {
      c.m.position.set(c.x, 0, c.z0 - c.v * t);
      c.m.rotation.y = c.v < 0 ? Math.PI : 0;
    }

    birds.forEach((b, i) => {
      const r = mulberry32(900 + i);
      const bx = -20 + r() * 50 + t * (2 + r() * 2), by = 26 + r() * 18, bz = -110 - r() * 80;
      b.position.set(bx, by, bz);
      b.scale.set(1, 1 + 0.9 * Math.sin(t * (9 + r() * 4) + i), 1);
      b.lookAt(camera.position);
    });

    // scan line sweeps top to bottom over 3.9-4.6 s; the wire pass only renders once it has started
    const scan = t < FLIP_AT || opts.sign === 'cta' || opts.v3 ? -1 : -0.02 + 1.06 * quint((t - FLIP_AT) / 0.7);
    grade.uniforms.uScan.value = scan;
    if (scan > -0.5) {
      const fog = scene.fog;
      for (const s of swap) s.m.material = s.m === face ? holoMat : s.orig === leafMat ? wireDim : wireMat;
      hideInWire.forEach((o) => { o.visible = false; });
      scene.fog = wireFog;
      renderer.setRenderTarget(wireRT);
      renderer.setClearColor(0x000000, 1);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      for (const s of swap) s.m.material = s.orig;
      hideInWire.forEach((o) => { o.visible = true; });
      scene.fog = fog;
    }
    grade.uniforms.uSeed.value = Math.floor(t * 60) % 997;
    composer.render();
  }

  return { render, renderer, scene, camera, corners };
}
