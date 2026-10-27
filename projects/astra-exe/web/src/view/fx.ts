// Visual effects. All of them are decorative, and all are pure functions of time: each spark, dust puff,
// rubble stone, ring and bolt is stamped with the sim time of the event that made it and moves analytically
// (drag + gravity, or a swirl), so the same moment always looks the same. None of them is a rigid body: the
// rigid pieces are the target's chunks (see Destructible). The UI and the README say so.
import * as THREE from 'three';
import { hashi, mulberry32 } from '../core/noise';

type V3 = [number, number, number];

// ------------------------------------------------------------------ ribbons (trails, bolts, streaks)
const ribbonMat = () => new THREE.ShaderMaterial({
  vertexShader: /* glsl */ `
    attribute vec4 aCol; attribute float aSide; varying vec4 vCol; varying float vSide;
    void main() { vCol = aCol; vSide = aSide; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    varying vec4 vCol; varying float vSide;
    void main() { float e = 1.0 - vSide * vSide; e = e * e; gl_FragColor = vec4(vCol.rgb * vCol.a * e, 1.0); }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
});

export class Ribbon {
  mesh: THREE.Mesh; private pos: Float32Array; private col: Float32Array; private geo = new THREE.BufferGeometry();
  constructor(public max: number, mat?: THREE.Material) {
    this.pos = new Float32Array(max * 2 * 3); this.col = new Float32Array(max * 2 * 4);
    const side = new Float32Array(max * 2), idx: number[] = [];
    for (let i = 0; i < max; i++) { side[2 * i] = -1; side[2 * i + 1] = 1; if (i < max - 1) { const a = 2 * i; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aCol', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
    this.geo.setIndex(idx);
    this.mesh = new THREE.Mesh(this.geo, mat ?? ribbonMat());
    this.mesh.frustumCulled = false; this.mesh.visible = false; this.mesh.renderOrder = 5;
  }
  /** pts: xyz list (at most max points); width(s) and colour(s) -> [r, g, b, a] with s 0 (oldest) .. 1 (newest). */
  set(pts: ArrayLike<number>, cam: THREE.Vector3, width: (s: number) => number, color: (s: number) => [number, number, number, number]) {
    const n = Math.min(this.max, Math.floor(pts.length / 3));
    if (n < 2) { this.mesh.visible = false; return; }
    const o = (Math.floor(pts.length / 3) - n) * 3;
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
      const px = pts[o + 3 * i]!, py = pts[o + 3 * i + 1]!, pz = pts[o + 3 * i + 2]!;
      let tx = pts[o + 3 * b]! - pts[o + 3 * a]!, ty = pts[o + 3 * b + 1]! - pts[o + 3 * a + 1]!, tz = pts[o + 3 * b + 2]! - pts[o + 3 * a + 2]!;
      const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      let vx = cam.x - px, vy = cam.y - py, vz = cam.z - pz; const vl = Math.hypot(vx, vy, vz) || 1; vx /= vl; vy /= vl; vz /= vl;
      let sx = ty * vz - tz * vy, sy = tz * vx - tx * vz, sz = tx * vy - ty * vx; const sl = Math.hypot(sx, sy, sz) || 1;
      const s = n === 1 ? 1 : i / (n - 1), w = width(s) / 2;
      sx = (sx / sl) * w; sy = (sy / sl) * w; sz = (sz / sl) * w;
      this.pos.set([px - sx, py - sy, pz - sz, px + sx, py + sy, pz + sz], 6 * i);
      const c = color(s);
      this.col.set(c, 8 * i); this.col.set(c, 8 * i + 4);
    }
    this.geo.setDrawRange(0, (n - 1) * 6);
    this.geo.attributes.position!.needsUpdate = true; this.geo.attributes.aCol!.needsUpdate = true;
    this.mesh.visible = true;
  }
  hide() { this.mesh.visible = false; }
}

// ------------------------------------------------------------------ GPU particles (sparks, embers, dust)
const particleVS = /* glsl */ `
  uniform float uTime, uG, uScale, uGrow;
  attribute vec3 aP0, aV0; attribute vec2 aT; attribute float aSize; attribute vec3 aCol; attribute vec2 aPhys;
  varying vec3 vCol; varying float vA;
  void main() {
    float age = uTime - aT.x;
    if (age < 0.0 || age > aT.y) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
    float k = max(aPhys.x, 1e-3), e = (1.0 - exp(-k * age)) / k;
    // linear drag k with gravity g: x(t) = x0 + v0 e + g (t - e) / k  (e = (1 - exp(-k t)) / k)
    vec3 p = aP0 + aV0 * e + vec3(0.0, -uG * aPhys.y, 0.0) * (age - e) / k;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float life = age / aT.y;
    float sz = uGrow > 0.5 ? (0.35 + 1.65 * sqrt(life)) : (1.0 - life * life);
    gl_PointSize = aSize * sz * uScale / max(0.1, -mv.z);
    vCol = aCol; vA = uGrow > 0.5 ? (1.0 - life) * smoothstep(0.0, 0.08, life) : 1.0 - life;
  }`;
const particleFS = /* glsl */ `
  uniform float uGrow; varying vec3 vCol; varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    if (uGrow > 0.5) { float a = (1.0 - d * d) * vA * 0.42; gl_FragColor = vec4(vCol * a, a); }
    else { float a = pow(max(0.0, 1.0 - d), 1.6) * vA; gl_FragColor = vec4(vCol * a, a); }
  }`;

export class Particles {
  points: THREE.Points; geo = new THREE.BufferGeometry(); mat: THREE.ShaderMaterial;
  private p0: Float32Array; private v0: Float32Array; private tt: Float32Array; private size: Float32Array; private col: Float32Array; private phys: Float32Array;
  private head = 0; private lo = Infinity; private hi = -1;
  constructor(public cap: number, dust = false) {
    this.p0 = new Float32Array(cap * 3); this.v0 = new Float32Array(cap * 3); this.tt = new Float32Array(cap * 2).fill(-1e9);
    this.size = new Float32Array(cap); this.col = new Float32Array(cap * 3); this.phys = new Float32Array(cap * 2);
    for (let i = 0; i < cap; i++) this.tt[2 * i + 1] = 0;
    const add = (n: string, a: Float32Array, k: number) => this.geo.setAttribute(n, new THREE.BufferAttribute(a, k).setUsage(THREE.DynamicDrawUsage));
    add('position', this.p0, 3); add('aP0', this.p0, 3); add('aV0', this.v0, 3); add('aT', this.tt, 2); add('aSize', this.size, 1); add('aCol', this.col, 3); add('aPhys', this.phys, 2);
    this.mat = new THREE.ShaderMaterial({
      vertexShader: particleVS, fragmentShader: particleFS,
      uniforms: { uTime: { value: 0 }, uG: { value: 9.81 }, uScale: { value: 600 }, uGrow: { value: dust ? 1 : 0 } },
      transparent: true, depthWrite: false, blending: dust ? THREE.NormalBlending : THREE.AdditiveBlending, toneMapped: false,
    });
    if (dust) { this.mat.blending = THREE.CustomBlending; this.mat.blendSrc = THREE.OneFactor; this.mat.blendDst = THREE.OneMinusSrcAlphaFactor; }
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false; this.points.renderOrder = dust ? 3 : 6;
  }
  spawn(p: V3, v: V3, t0: number, life: number, size: number, col: V3, drag = 0.6, grav = 1) {
    const i = this.head; this.head = (this.head + 1) % this.cap;
    this.p0.set(p, 3 * i); this.v0.set(v, 3 * i); this.tt[2 * i] = t0; this.tt[2 * i + 1] = life; this.size[i] = size; this.col.set(col, 3 * i);
    this.phys[2 * i] = drag; this.phys[2 * i + 1] = grav;
    this.lo = Math.min(this.lo, i); this.hi = Math.max(this.hi, i);
  }
  /** Empty, and back to slot 0 (so a replay fills the same slots in the same order: identical blending). */
  clear() { this.tt.fill(-1e9); this.head = 0; this.lo = 0; this.hi = this.cap - 1; }
  update(t: number, g: number, scale: number) {
    this.mat.uniforms.uTime!.value = t; this.mat.uniforms.uG!.value = g; this.mat.uniforms.uScale!.value = scale;
    if (this.hi >= this.lo) {
      for (const name of ['aP0', 'aV0', 'aT', 'aSize', 'aCol', 'aPhys']) {
        const a = this.geo.attributes[name] as THREE.BufferAttribute;
        a.clearUpdateRanges(); a.addUpdateRange(this.lo * a.itemSize, (this.hi - this.lo + 1) * a.itemSize); a.needsUpdate = true;
      }
      this.lo = Infinity; this.hi = -1;
    }
  }
}

// ------------------------------------------------------------------ swirling dust (the Vayu vortex)
export class Swirl {
  points: THREE.Points; mat: THREE.ShaderMaterial; geo = new THREE.BufferGeometry();
  private a: Float32Array; private b: Float32Array; private c: Float32Array; private head = 0; private dirty = false;
  constructor(public cap: number) {
    this.a = new Float32Array(cap * 4); this.b = new Float32Array(cap * 4); this.c = new Float32Array(cap * 4);
    for (let i = 0; i < cap; i++) this.b[4 * i] = -1e9;
    this.geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cap * 3), 3));
    this.geo.setAttribute('aA', new THREE.BufferAttribute(this.a, 4)); this.geo.setAttribute('aB', new THREE.BufferAttribute(this.b, 4)); this.geo.setAttribute('aC', new THREE.BufferAttribute(this.c, 4));
    this.mat = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        uniform float uTime, uScale; attribute vec4 aA, aB, aC; varying float vA; varying vec3 vCol;
        // aA: centre xyz, r0; aB: t0, life, omega, rise; aC: angle0, size, tint, y0
        void main() {
          float age = uTime - aB.x;
          if (age < 0.0 || age > aB.y) { gl_Position = vec4(2.0); gl_PointSize = 0.0; return; }
          float life = age / aB.y, r = aA.w * (1.0 - 0.45 * life), a = aC.x + aB.z * age / (0.4 + r * 0.06);
          vec3 p = aA.xyz + vec3(cos(a) * r, aC.w + aB.w * age, sin(a) * r);
          vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
          gl_PointSize = aC.y * uScale / max(0.1, -mv.z) * (0.6 + life);
          vA = smoothstep(0.0, 0.15, life) * (1.0 - life);
          vCol = mix(vec3(0.55, 0.85, 1.0), vec3(0.9, 0.95, 1.0), aC.z) * 1.4;
        }`,
      fragmentShader: /* glsl */ `
        varying float vA; varying vec3 vCol;
        void main() { float d = length(gl_PointCoord - 0.5) * 2.0; if (d > 1.0) discard; float a = (1.0 - d) * vA * 0.5; gl_FragColor = vec4(vCol * a, a); }`,
      uniforms: { uTime: { value: 0 }, uScale: { value: 600 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    });
    this.points = new THREE.Points(this.geo, this.mat); this.points.frustumCulled = false; this.points.renderOrder = 6;
  }
  spawn(c: V3, r0: number, y0: number, t0: number, life: number, omega: number, rise: number, a0: number, size: number, tint: number) {
    const i = this.head; this.head = (this.head + 1) % this.cap;
    this.a.set([c[0], c[1], c[2], r0], 4 * i); this.b.set([t0, life, omega, rise], 4 * i); this.c.set([a0, size, tint, y0], 4 * i);
    this.dirty = true;
  }
  clear() { for (let i = 0; i < this.cap; i++) this.b[4 * i] = -1e9; this.head = 0; this.dirty = true; }
  update(t: number, scale: number) {
    this.mat.uniforms.uTime!.value = t; this.mat.uniforms.uScale!.value = scale;
    if (this.dirty) { for (const n of ['aA', 'aB', 'aC']) (this.geo.attributes[n] as THREE.BufferAttribute).needsUpdate = true; this.dirty = false; }
  }
}

// ------------------------------------------------------------------ rubble (instanced, decorative)
export function rockGeometry(seed: number, detail = 1) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 0.72 + 0.5 * hashi(Math.round(x * 97), Math.round(y * 97), Math.round(z * 97), seed);
    p.setXYZ(i, x * k, y * k * 0.8, z * k);
  }
  g.computeVertexNormals();
  return g;
}

export class Rubble {
  mesh: THREE.InstancedMesh;
  private d: Float32Array; private head = 0; private m = new THREE.Matrix4(); private q = new THREE.Quaternion(); private s = new THREE.Vector3(); private p = new THREE.Vector3(); private ax = new THREE.Vector3();
  // per slot: p0 xyz, v0 xyz, t0, life, size, axis xyz, spin
  private static W = 13;
  constructor(public cap: number, mat: THREE.Material) {
    this.mesh = new THREE.InstancedMesh(rockGeometry(3), mat, cap);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.castShadow = true; this.mesh.frustumCulled = false;
    this.d = new Float32Array(cap * Rubble.W);
    for (let i = 0; i < cap; i++) this.d[i * Rubble.W + 6] = -1e9;
    this.mesh.setColorAt(0, new THREE.Color(1, 1, 1));
  }
  spawn(p: V3, v: V3, t0: number, life: number, size: number, salt: number, tint?: THREE.Color) {
    const i = this.head, o = i * Rubble.W;
    this.head = (this.head + 1) % this.cap;
    const ax = [hashi(salt, 1) - 0.5, hashi(salt, 2) - 0.5, hashi(salt, 3) - 0.5], al = Math.hypot(ax[0]!, ax[1]!, ax[2]!) || 1;
    this.d.set([p[0], p[1], p[2], v[0], v[1], v[2], t0, life, size, ax[0]! / al, ax[1]! / al, ax[2]! / al, (2 + 9 * hashi(salt, 4)) * (hashi(salt, 5) < 0.5 ? -1 : 1)], o);
    this.mesh.setColorAt(i, tint ?? new THREE.Color(1, 1, 1));
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
  clear() { for (let i = 0; i < this.cap; i++) this.d[i * Rubble.W + 6] = -1e9; this.head = 0; }
  update(t: number, g: number) {
    const W = Rubble.W, d = this.d;
    let live = 0;
    for (let i = 0; i < this.cap; i++) {
      const o = i * W, age = t - d[o + 6]!;
      if (age < 0 || age > d[o + 7]!) { this.m.makeScale(0, 0, 0); this.mesh.setMatrixAt(i, this.m); continue; }
      live++;
      const k = 0.15, e = (1 - Math.exp(-k * age)) / k;
      this.p.set(d[o]! + d[o + 3]! * e, d[o + 1]! + d[o + 4]! * e - (g * (age - e)) / k, d[o + 2]! + d[o + 5]! * e);
      this.q.setFromAxisAngle(this.ax.set(d[o + 9]!, d[o + 10]!, d[o + 11]!), d[o + 12]! * age);
      const fade = Math.min(1, (d[o + 7]! - age) / 0.6);
      this.s.setScalar(d[o + 8]! * fade);
      this.m.compose(this.p, this.q, this.s);
      this.mesh.setMatrixAt(i, this.m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    return live;
  }
}

// ------------------------------------------------------------------ rings, spheres, shards, bolts, lights
export interface Burst { t0: number; dur: number; p: V3; n: V3; r0: number; r1: number; col: THREE.Color; kind: 'ring' | 'sphere' | 'shard'; seed: number }

const ringMat = () => new THREE.ShaderMaterial({
  uniforms: { uCol: { value: new THREE.Color() }, uK: { value: 0 }, uA: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uCol; uniform float uK, uA; varying vec2 vUv;
    void main(){
      vec2 q = vUv * 2.0 - 1.0; float r = length(q);
      float band = smoothstep(0.78, 0.97, r) * (1.0 - smoothstep(0.97, 1.0, r));
      float inner = smoothstep(0.6, 0.95, r) * 0.05;
      float a = (band + inner) * uA;
      gl_FragColor = vec4(uCol * a, a);
    }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
});
const sphereMat = () => new THREE.ShaderMaterial({
  uniforms: { uCol: { value: new THREE.Color() }, uA: { value: 1 } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vV;
    void main(){ float f = pow(max(0.0, 1.0 - abs(dot(vN, vV))), 2.5); float a = f * uA; gl_FragColor = vec4(uCol * a, a); }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
});
const shardMat = () => new THREE.ShaderMaterial({
  uniforms: { uA: { value: 1 }, uHue: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform float uA, uHue; varying vec2 vUv;
    vec3 hue(float h){ return clamp(abs(fract(h + vec3(0.0, 0.333, 0.667)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
    void main(){
      float edge = 1.0 - smoothstep(0.0, 0.08, min(min(vUv.x, vUv.y), 1.0 - vUv.x - vUv.y));
      vec3 c = mix(vec3(0.7, 0.6, 1.0), hue(uHue + vUv.x * 0.6), 0.6) * (0.25 + 2.5 * edge);
      gl_FragColor = vec4(c * uA, uA);
    }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
});
const shardGeo = (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0.3, 1, 0], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1], 2)); return g; })();

export class Bursts {
  group = new THREE.Group();
  private rings: THREE.Mesh[] = []; private spheres: THREE.Mesh[] = []; private shards: THREE.Mesh[] = [];
  list: Burst[] = [];
  constructor() {
    const rg = new THREE.PlaneGeometry(2, 2), sg = new THREE.IcosahedronGeometry(1, 4);
    for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(rg, ringMat()); m.visible = false; m.frustumCulled = false; this.rings.push(m); this.group.add(m); }
    for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(sg, sphereMat()); m.visible = false; m.frustumCulled = false; this.spheres.push(m); this.group.add(m); }
    for (let i = 0; i < 24; i++) { const m = new THREE.Mesh(shardGeo, shardMat()); m.visible = false; m.frustumCulled = false; this.shards.push(m); this.group.add(m); }
  }
  add(b: Burst) { this.list.push(b); if (this.list.length > 40) this.list.shift(); }
  clear() { this.list = []; }
  update(t: number) {
    let ri = 0, si = 0, hi = 0;
    for (const m of [...this.rings, ...this.spheres, ...this.shards]) m.visible = false;
    for (const b of this.list) {
      const u = (t - b.t0) / b.dur;
      if (u < 0 || u > 1) continue;
      const e = 1 - Math.pow(1 - u, 3), r = b.r0 + (b.r1 - b.r0) * e, a = Math.pow(1 - u, 1.6);
      if (b.kind === 'ring' && ri < this.rings.length) {
        const m = this.rings[ri++]!; m.visible = true; m.position.set(...b.p); m.scale.setScalar(r);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...b.n));
        const mm = m.material as THREE.ShaderMaterial; mm.uniforms.uCol!.value.copy(b.col); mm.uniforms.uA!.value = a;
      } else if (b.kind === 'sphere' && si < this.spheres.length) {
        const m = this.spheres[si++]!; m.visible = true; m.position.set(...b.p); m.scale.setScalar(r);
        const mm = m.material as THREE.ShaderMaterial; mm.uniforms.uCol!.value.copy(b.col); mm.uniforms.uA!.value = a;
      } else if (b.kind === 'shard') {
        // a fan of prismatic "dimensional fracture" shards around the point, slowly turning (fiction)
        const r = mulberry32(b.seed);
        for (let k = 0; k < 8 && hi < this.shards.length; k++) {
          const m = this.shards[hi++]!; m.visible = true;
          const az = r() * Math.PI * 2, el = (r() - 0.5) * 1.6, dist = b.r0 + r() * (b.r1 - b.r0) * (0.4 + 0.6 * e);
          m.position.set(b.p[0] + Math.cos(az) * Math.cos(el) * dist, b.p[1] + Math.sin(el) * dist, b.p[2] + Math.sin(az) * Math.cos(el) * dist);
          m.rotation.set(r() * 6 + u * 0.6, r() * 6 + u * 0.9, r() * 6);
          m.scale.setScalar((2 + r() * 6) * (0.4 + 0.6 * e));
          const mm = m.material as THREE.ShaderMaterial; mm.uniforms.uA!.value = a * Math.min(1, u * 8) * 0.8; mm.uniforms.uHue!.value = r() + u * 0.3;
        }
      }
    }
  }
}

/** Branching lightning (Vajra), flickering by re-seeding 30 times a second: a pure function of time. */
export class Bolts {
  group = new THREE.Group(); private ribbons: Ribbon[] = [];
  list: { t0: number; dur: number; p: V3; dir: V3; len: number; seed: number; col: THREE.Color; width: number }[] = [];
  constructor() { for (let i = 0; i < 26; i++) { const r = new Ribbon(18); this.ribbons.push(r); this.group.add(r.mesh); } }
  add(b: Bolts['list'][number]) { this.list.push(b); if (this.list.length > 12) this.list.shift(); }
  clear() { this.list = []; }
  update(t: number, cam: THREE.Vector3) {
    let k = 0;
    for (const r of this.ribbons) r.hide();
    for (const b of this.list) {
      const age = t - b.t0;
      if (age < 0 || age > b.dur) continue;
      const fr = Math.floor(age * 30), rnd = mulberry32(b.seed * 131 + fr), fade = 1 - age / b.dur;
      if (rnd() < 0.18) continue; // flicker off now and then
      const branch = (p: V3, dir: V3, len: number, depth: number, w: number) => {
        if (k >= this.ribbons.length) return;
        const rib = this.ribbons[k++]!; // claimed before the children recurse
        const pts: number[] = [], n = 14;
        let x = p[0], y = p[1], z = p[2];
        for (let i = 0; i < n; i++) {
          pts.push(x, y, z);
          const s = len / n;
          x += dir[0] * s + (rnd() - 0.5) * s * 1.3; y += dir[1] * s + (rnd() - 0.5) * s * 1.3; z += dir[2] * s + (rnd() - 0.5) * s * 1.3;
          if (depth < 2 && rnd() < 0.18) {
            const nd: V3 = [dir[0] + (rnd() - 0.5) * 1.6, dir[1] + (rnd() - 0.5) * 1.6, dir[2] + (rnd() - 0.5) * 1.6];
            const l = Math.hypot(...nd); branch([x, y, z], [nd[0] / l, nd[1] / l, nd[2] / l], len * 0.45, depth + 1, w * 0.55);
          }
        }
        const c = b.col;
        rib.set(pts, cam, (s) => w * (1 - 0.6 * s), (s) => [c.r * 4, c.g * 4, c.b * 4, fade * (1 - 0.5 * s)]);
      };
      branch(b.p, b.dir, b.len, 0, b.width);
    }
  }
}

/** Short point-light flashes at impacts. */
export class Flashes {
  lights: THREE.PointLight[] = []; list: { t0: number; p: V3; col: THREE.Color; peak: number; tau: number }[] = [];
  constructor(parent: THREE.Object3D) { for (let i = 0; i < 2; i++) { const l = new THREE.PointLight(0xffffff, 0, 160, 1.6); parent.add(l); this.lights.push(l); } }
  add(f: Flashes['list'][number]) { this.list.push(f); if (this.list.length > 2) this.list.shift(); }
  clear() { this.list = []; }
  update(t: number) {
    this.lights.forEach((l, i) => {
      const f = this.list[i];
      if (!f || t < f.t0) { l.intensity = 0; return; }
      l.position.set(...f.p); l.color.copy(f.col); l.intensity = f.peak * Math.exp(-(t - f.t0) / f.tau);
    });
  }
}
