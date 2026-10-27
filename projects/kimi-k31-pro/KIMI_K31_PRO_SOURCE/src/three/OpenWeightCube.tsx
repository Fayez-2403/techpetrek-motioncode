// 11 · OPEN-WEIGHT: a closed cube of frosted metal-glass panels with luminous edges. Its five upper faces unfold on
// hinges (front, right, left, back, then the top that rides on the back) into a flat net, revealing a procedural
// circuit-like network inside; light flows outward along every trace. Everything is a function of the props
// (t in seconds, unfold 0..1 per face), so any frame can be rendered on its own.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mulberry32 } from '../lib/rng';

// ---------------------------------------------------------------- flowing-trace material (instanced thin boxes)
const flowVert = /* glsl */ `
attribute vec2 aAlong; attribute float aSeed;
varying float vAlong; varying float vSeed;
void main(){
  vAlong = mix(aAlong.x, aAlong.y, position.x + 0.5);
  vSeed = aSeed;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}`;
const flowFrag = /* glsl */ `
uniform float uTime; uniform float uReveal; uniform float uOpacity; uniform float uPulse;
uniform vec3 uColor; uniform vec3 uHot;
varying float vAlong; varying float vSeed;
void main(){
  if (vAlong > uReveal) discard;
  float front = 1.0 - smoothstep(0.0, 0.22, uReveal - vAlong);          // bright draw-on front
  float x = fract(vAlong * 0.62 - uTime * 0.55 + vSeed);
  float pulse = pow(x, 12.0) * uPulse;                                    // comets travelling outward
  vec3 col = uColor * 0.5 + uHot * (pulse * 1.5 + front * 0.9);
  gl_FragColor = vec4(col, uOpacity);
}`;

const makeFlowMat = (color: string, hot: string) => new THREE.ShaderMaterial({
  vertexShader: flowVert, fragmentShader: flowFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uOpacity: { value: 1 }, uPulse: { value: 1 },
    uColor: { value: new THREE.Color(color) }, uHot: { value: new THREE.Color(hot) } },
});

interface Seg { a: THREE.Vector3; b: THREE.Vector3; s0: number; s1: number; seed: number }

const BOX = new THREE.BoxGeometry(1, 1, 1);
const X = new THREE.Vector3(1, 0, 0);

function tracesMesh(segs: Seg[], width: number, mat: THREE.ShaderMaterial) {
  const n = segs.length;
  const mesh = new THREE.InstancedMesh(BOX, mat, Math.max(1, n));
  const along = new Float32Array(n * 2), seeds = new Float32Array(n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), d = new THREE.Vector3();
  segs.forEach((g, i) => {
    d.subVectors(g.b, g.a);
    const len = d.length();
    q.setFromUnitVectors(X, d.clone().normalize());
    p.addVectors(g.a, g.b).multiplyScalar(0.5);
    s.set(len + width, width, width);
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
    along[i * 2] = g.s0; along[i * 2 + 1] = g.s1; seeds[i] = g.seed;
  });
  mesh.count = n;
  mesh.geometry = BOX.clone();
  mesh.geometry.setAttribute('aAlong', new THREE.InstancedBufferAttribute(along, 2));
  mesh.geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.frustumCulled = false;
  return mesh;
}

/** Manhattan walks on a 2-D grid of the canonical face (x in [-0.9,0.9], y in [0.1,1.9], z = inner side) */
function faceTraces(seed: number, n: number, z: number, alongOffset: number): Seg[] {
  const r = mulberry32(seed), out: Seg[] = [], st = 0.15;
  for (let k = 0; k < n; k++) {
    let x = Math.round(((r() * 1.6 - 0.8)) / st) * st, y = 0.15;
    let s = alongOffset + y + r() * 0.1, dir = 0; // 0 up, 1 left/right
    const steps = 3 + Math.floor(r() * 6), seedK = r();
    for (let i = 0; i < steps; i++) {
      const len = st * (1 + Math.floor(r() * (dir === 0 ? 4 : 3)));
      let nx = x, ny = y;
      if (dir === 0) ny = Math.min(1.85, y + len); else nx = Math.max(-0.85, Math.min(0.85, x + (r() < 0.5 ? -len : len)));
      if (Math.abs(nx - x) + Math.abs(ny - y) < 1e-3) break;
      const l = Math.abs(nx - x) + Math.abs(ny - y);
      out.push({ a: new THREE.Vector3(x, y, z), b: new THREE.Vector3(nx, ny, z), s0: s, s1: s + l, seed: seedK });
      s += l; x = nx; y = ny; dir = dir === 0 ? 1 : 0;
      if (y >= 1.84) break;
    }
  }
  return out;
}

/** 3-D Manhattan walks inside the cube, radiating from a core at the centre */
function innerNet(seed: number, n: number): Seg[] {
  const r = mulberry32(seed), out: Seg[] = [], st = 0.25, lim = 0.75;
  const snap = (v: number) => Math.round(v / st) * st;
  for (let k = 0; k < n; k++) {
    const p = new THREE.Vector3(snap((r() - 0.5) * 0.5), snap((r() - 0.5) * 0.5), snap((r() - 0.5) * 0.5));
    let s = p.length(), axis = Math.floor(r() * 3), sign = r() < 0.5 ? -1 : 1;
    const steps = 3 + Math.floor(r() * 6), seedK = r();
    for (let i = 0; i < steps; i++) {
      const q = p.clone();
      const len = st * (1 + Math.floor(r() * 3));
      q.setComponent(axis, Math.max(-lim, Math.min(lim, q.getComponent(axis) + sign * len)));
      const l = q.distanceTo(p);
      if (l > 1e-3) { out.push({ a: p.clone(), b: q.clone(), s0: s, s1: s + l, seed: seedK }); s += l; p.copy(q); }
      axis = (axis + 1 + Math.floor(r() * 2)) % 3;
      sign = Math.abs(p.getComponent(axis)) >= lim - 1e-3 ? -Math.sign(p.getComponent(axis)) : r() < 0.5 ? -1 : 1;
    }
  }
  return out;
}

function dotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d')!, gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------------------------------------------------------------- one canonical face: x in [-1,1], y in [0,2], z = 0, outward normal +z
const EDGE_W = 0.026, GLOW_W = 0.11;

const FaceEdges: React.FC<{ core: THREE.Material; glow: THREE.Material }> = ({ core, glow }) => (
  <>
    {([[0, 0, 2, 0], [0, 2, 2, 0], [-1, 1, 0, 2], [1, 1, 0, 2]] as const).map(([x, y, w, h], i) => (
      <React.Fragment key={i}>
        <mesh geometry={BOX} material={core} position={[x, y, 0]} scale={[w ? w + EDGE_W : EDGE_W, h ? h + EDGE_W : EDGE_W, EDGE_W]} />
        <mesh geometry={BOX} material={glow} position={[x, y, 0]} scale={[w ? w + GLOW_W : GLOW_W, h ? h + GLOW_W : GLOW_W, GLOW_W * 0.4]} />
      </React.Fragment>
    ))}
  </>
);

export interface CubeProps {
  t: number;
  /** unfold progress per face, 0 closed .. 1 flat */
  unfold: { front: number; right: number; left: number; back: number; top: number };
  /** reveal of the inner network and of the traces on the faces (0..1) */
  net: number; faceNet: number;
  /** edge brightness 0..1, panel opacity */
  edge: number; panel?: number;
  /** soft core glow at the centre */
  core?: number;
}

export const OpenWeightCube: React.FC<CubeProps> = ({ t, unfold, net, faceNet, edge, panel = 0.5, core = 0 }) => {
  const res = useMemo(() => {
    const panelMat = new THREE.MeshPhysicalMaterial({ color: '#122052', metalness: 0.45, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.22,
      transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 0.7 });
    const edgeMat = new THREE.MeshBasicMaterial({ color: '#7FE9FF', toneMapped: false, transparent: true });
    const glowMat = new THREE.MeshBasicMaterial({ color: '#5CE1FF', toneMapped: false, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false });
    const innerMat = makeFlowMat('#2A7FB0', '#BFF4FF');
    const faceMats = Array.from({ length: 6 }, () => makeFlowMat('#2B6E9E', '#9FEFFF'));
    const inner = tracesMesh(innerNet(11, 90), 0.014, innerMat);
    // faces: 0 front, 1 right, 2 back, 3 left, 4 top, 5 bottom
    const faces = Array.from({ length: 6 }, (_, i) => tracesMesh(faceTraces(100 + i * 17, 26, -0.03, i === 4 ? 2 : 0), 0.012, faceMats[i]));
    const panelGeo = new THREE.BoxGeometry(2, 2, 0.035);
    const dot = dotTexture();
    return { panelMat, edgeMat, glowMat, innerMat, faceMats, inner, faces, panelGeo, dot };
  }, []);

  // per-frame uniforms
  const maxInner = 3.4, maxFace = 4.2;
  res.innerMat.uniforms.uTime.value = t;
  res.innerMat.uniforms.uReveal.value = net * maxInner;
  res.innerMat.uniforms.uOpacity.value = Math.min(1, net * 3);
  res.faceMats.forEach((m) => { m.uniforms.uTime.value = t; m.uniforms.uReveal.value = faceNet * maxFace; m.uniforms.uOpacity.value = Math.min(1, faceNet * 4); });
  res.panelMat.opacity = panel;
  res.edgeMat.opacity = 0.35 + 0.65 * edge;
  res.glowMat.opacity = 0.05 + 0.13 * edge;

  const H = Math.PI / 2;
  const face = (i: number) => (
    <>
      <mesh geometry={res.panelGeo} material={res.panelMat} position={[0, 1, 0]} />
      <FaceEdges core={res.edgeMat} glow={res.glowMat} />
      <primitive object={res.faces[i]} />
    </>
  );
  // side faces: the front face yawed about the cube's vertical axis; hinge = bottom edge, unfolding outward
  const sides: [number, number, number][] = [[0, 0, unfold.front], [1, H, unfold.right], [3, -H, unfold.left]];

  return (
    <group>
      {/* base: fixed, inner side up */}
      <group position={[0, -1, 0]} rotation={[H, 0, 0]}>
        <group position={[0, -1, 0]}>
          <mesh geometry={res.panelGeo} material={res.panelMat} position={[0, 1, 0]} />
          <FaceEdges core={res.edgeMat} glow={res.glowMat} />
          <primitive object={res.faces[5]} />
        </group>
      </group>
      {sides.map(([i, yaw, u]) => (
        <group key={i} rotation={[0, yaw, 0]}>
          <group position={[0, -1, 1]} rotation={[u * H, 0, 0]}>{face(i)}</group>
        </group>
      ))}
      {/* back face carries the top face on its upper hinge */}
      <group rotation={[0, Math.PI, 0]}>
        <group position={[0, -1, 1]} rotation={[unfold.back * H, 0, 0]}>
          {face(2)}
          <group position={[0, 2, 0]} rotation={[-H + unfold.top * H, 0, 0]}>{face(4)}</group>
        </group>
      </group>
      {/* the network inside */}
      <primitive object={res.inner} />
      <sprite scale={[1.6, 1.6, 1]}>
        <spriteMaterial map={res.dot} color="#7FE9FF" transparent opacity={0.5 * core} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
    </group>
  );
};
