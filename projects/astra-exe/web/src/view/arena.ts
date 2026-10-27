// The celestial battlefield: a storm sky with a nebula and stars, a sea of clouds over the abyss, mist round the
// mountain's root, shafts of light, distant floating rocks, the floating lotus altar under the bow, and the
// lights (warm key, cool rim, sky fill) with an environment map so the gold has something to reflect.
// Everything moves as a function of the clock t; distant lightning comes from a hashed schedule.
import * as THREE from 'three';
import { hashi, mulberry32 } from '../core/noise';
import { altarMaps } from './textures';
import { rockGeometry } from './fx';

// low and to the right, slightly behind the mountain as seen from the bow: golden rims, a shadowed face
export const SUN_DIR = new THREE.Vector3(0.82, 0.36, -0.34).normalize();

// value noise and fbm; octaves come from the quality preset (5 at high and ultra, 3 below: the sky is the costliest pass)
const skyNoise = (oct: number) => /* glsl */ `
  float h31(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vnoise(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
  float fbm(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < ${oct}; i++) { s += a * vnoise(p); p = p * 2.02 + 7.3; a *= 0.5; } return s; }
`;

/** Lightning flash strength at time t (0..1) and the flash's direction seed. */
export function lightningAt(t: number): { k: number; slot: number; age: number } {
  const slot = Math.floor(t / 5.5);
  let best = { k: 0, slot, age: 99 };
  for (const s of [slot, slot - 1]) {
    if (hashi(s, 1, 0, 61) > 0.72) continue;
    const t0 = s * 5.5 + hashi(s, 2, 0, 61) * 4.5, age = t - t0;
    if (age < 0 || age > 0.7) continue;
    // a double flicker: two quick pulses
    const k = Math.exp(-age / 0.05) + 0.7 * (age > 0.11 ? Math.exp(-(age - 0.11) / 0.07) : 0) + 0.25 * Math.exp(-age / 0.35);
    if (k > best.k) best = { k: Math.min(1.5, k), slot: s, age };
  }
  return best;
}

export class Arena {
  group = new THREE.Group();
  sky: THREE.ShaderMaterial; clouds: THREE.ShaderMaterial[] = []; mist: THREE.ShaderMaterial; rays: THREE.ShaderMaterial;
  key: THREE.DirectionalLight; rim: THREE.DirectionalLight; fill: THREE.HemisphereLight;
  altar = new THREE.Group(); altarGlow: THREE.MeshStandardMaterial;
  decor: THREE.InstancedMesh; private decorData: { p: THREE.Vector3; s: number; r: THREE.Euler; ph: number }[] = [];
  runes: THREE.Mesh[] = [];
  bolt: THREE.Mesh;
  env: THREE.Texture | null = null;

  constructor(q: { fbm: number; clouds: number } = { fbm: 5, clouds: 3 }) {
    const SKY_NOISE = skyNoise(q.fbm);
    // ---- sky dome
    this.sky = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uFlash: { value: 0 }, uSun: { value: SUN_DIR.clone() }, uBoltDir: { value: new THREE.Vector3(0, 0.2, -1) } },
      vertexShader: `varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */ `
        uniform float uTime, uFlash; uniform vec3 uSun, uBoltDir; varying vec3 vDir;
        ${SKY_NOISE}
        void main() {
          vec3 d = normalize(vDir); float h = d.y;
          vec3 zen = vec3(0.003, 0.005, 0.022), mid = vec3(0.018, 0.016, 0.06), hor = vec3(0.05, 0.036, 0.09), abyss = vec3(0.004, 0.006, 0.02);
          vec3 col = h > 0.0 ? mix(hor, mid, smoothstep(0.0, 0.25, h)) : mix(hor, abyss, (1.0 - smoothstep(-0.35, 0.0, h)));
          col = mix(col, zen, smoothstep(0.3, 0.95, h));
          // nebula (above the horizon only: below it both of its terms are weighted by exactly zero)
          float n = 0.0, n2 = 0.0;
          if (h > 0.0) { n = fbm(d * 2.2 + vec3(0.0, 0.0, uTime * 0.002)); n2 = fbm(d * 4.6 - 3.0); }
          vec3 neb = mix(vec3(0.32, 0.08, 0.5), vec3(0.04, 0.22, 0.6), n2) * smoothstep(0.48, 0.86, n) * smoothstep(0.0, 0.45, h);
          col += neb * 0.6 + vec3(0.6, 0.3, 0.9) * pow(smoothstep(0.62, 0.9, n), 3.0) * 0.25 * smoothstep(0.1, 0.5, h);
          // stars
          vec3 sp = d * 380.0, cell = floor(sp); float st = h31(cell);
          float star = step(0.9963, st) * (1.0 - smoothstep(0.0, 0.55, length(fract(sp) - 0.5))) * smoothstep(0.02, 0.3, h);
          col += vec3(0.85, 0.92, 1.0) * star * (1.4 + 3.0 * h31(cell + 7.0)) * (0.65 + 0.35 * sin(uTime * 2.6 + st * 90.0));
          // the low sun and its glow
          float s = max(dot(d, uSun), 0.0);
          col += vec3(1.0, 0.6, 0.26) * (pow(s, 6.0) * 0.32 + pow(s, 48.0) * 1.1 + pow(s, 900.0) * 24.0);
          // storm clouds banked round the horizon, rim-lit by the sun and the lightning
          float c = 0.0;   // (the band is zero outside |h - 0.07| < 0.34, so the noise is only needed inside it)
          if (abs(h - 0.07) < 0.34) c = fbm(vec3(d.x * 2.6 + uTime * 0.004, d.y * 8.0, d.z * 2.6));
          float band = (1.0 - smoothstep(0.0, 0.34, abs(h - 0.07))) * smoothstep(0.42, 0.72, c);
          vec3 cc = mix(vec3(0.018, 0.016, 0.04), vec3(0.42, 0.24, 0.28), pow(s, 3.0)) + uFlash * vec3(0.55, 0.6, 1.0) * c;
          col = mix(col, cc, band * 0.88);
          col += uFlash * vec3(0.1, 0.11, 0.24) * smoothstep(-0.2, 0.6, h);
          // the bolt itself: a bright crooked line near its direction
          vec3 bd = normalize(uBoltDir);
          vec3 side = normalize(cross(bd, vec3(0.0, 1.0, 0.0)));
          float along = dot(d - bd, vec3(0.0, 1.0, 0.0)), across = dot(d - bd, side) + (vnoise(vec3(along * 40.0, 3.0, uTime)) - 0.5) * 0.02;
          float bolt = (1.0 - smoothstep(0.0, 0.0025, abs(across))) * (1.0 - smoothstep(0.0, 0.12, abs(along + 0.05))) * step(along, 0.06);
          col += vec3(2.5, 2.6, 4.0) * bolt * smoothstep(0.2, 0.6, uFlash);
          gl_FragColor = vec4(col, 1.0);
        }`,
      side: THREE.BackSide, depthWrite: false, depthTest: false,
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1500, 64, 32), this.sky); dome.renderOrder = -10; dome.frustumCulled = false;
    this.group.add(dome);

    // ---- the cloud sea: three layers over the abyss
    const layers = ([[-92, 0.006, 0.55, 1, 1], [-58, 0.011, 0.38, 0.62, 1.6], [-30, 0.018, 0.22, 0.32, 2.4]] as const).slice(0, q.clouds);
    for (const [y, scale, dens, alpha, speed] of layers) {
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uFlash: { value: 0 }, uSun: { value: SUN_DIR.clone() }, uScale: { value: scale }, uDens: { value: dens }, uAlpha: { value: alpha }, uSpeed: { value: speed }, uCam: { value: new THREE.Vector3() } },
        vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */ `
          uniform float uTime, uFlash, uScale, uDens, uAlpha, uSpeed; uniform vec3 uSun, uCam; varying vec3 vW;
          ${SKY_NOISE}
          void main() {
            vec2 q = vW.xz * uScale + vec2(uTime * 0.004 * uSpeed, uTime * 0.0025 * uSpeed);
            float n = fbm(vec3(q, uTime * 0.003));
            float dens = smoothstep(uDens, uDens + 0.24, n);
            float top = smoothstep(0.0, 0.5, n - uDens);
            vec3 base = vec3(0.01, 0.012, 0.03), lit = vec3(0.95, 0.62, 0.36) * 0.32, cool = vec3(0.12, 0.14, 0.32) * 0.45;
            float sunk = pow(max(dot(normalize(vec3(-(vW.x - uCam.x), 0.0, -(vW.z - uCam.z))), normalize(vec3(uSun.x, 0.0, uSun.z))), 0.0), 2.0);
            vec3 col = mix(base, mix(cool, lit, 0.35 + 0.65 * sunk), top) + uFlash * vec3(0.3, 0.32, 0.6) * top;
            float dist = length(vW.xz - uCam.xz);
            float fade = 1.0 - smoothstep(500.0, 1400.0, dist);
            vec3 hor = vec3(0.04, 0.03, 0.075);
            col = mix(hor, col, exp(-dist * 0.0012));
            gl_FragColor = vec4(col * dens, dens * uAlpha * fade);
          }`,
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
      });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(3200, 3200), mat);
      plane.rotation.x = -Math.PI / 2; plane.position.y = y; plane.renderOrder = -5; this.group.add(plane);
      this.clouds.push(mat);
    }

    // ---- mist round the mountain's root: soft billboards
    const mistN = 70, mistGeo = new THREE.BufferGeometry(), mp = new Float32Array(mistN * 3), ms = new Float32Array(mistN);
    const r = mulberry32(12);
    for (let i = 0; i < mistN; i++) {
      const a = r() * Math.PI * 2, rr = 14 + r() * 46;
      mp.set([Math.cos(a) * rr, -12 - r() * 50, -118 + Math.sin(a) * rr * 0.8], 3 * i); ms[i] = 28 + r() * 38;
    }
    mistGeo.setAttribute('position', new THREE.BufferAttribute(mp, 3)); mistGeo.setAttribute('aS', new THREE.BufferAttribute(ms, 1));
    this.mist = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uScale: { value: 600 } },
      vertexShader: `uniform float uTime, uScale; attribute float aS; varying float vA;
        void main(){ vec3 p = position + vec3(sin(uTime * 0.05 + position.z) * 4.0, sin(uTime * 0.07 + position.x) * 1.5, cos(uTime * 0.04 + position.y) * 4.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aS * uScale / max(1.0, -mv.z); vA = 1.0; }`,
      fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; if (d > 1.0) discard; float a = (1.0 - d * d) * 0.035; gl_FragColor = vec4(vec3(0.2, 0.22, 0.36) * a, a); }`,
      transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    const mist = new THREE.Points(mistGeo, this.mist); mist.frustumCulled = false; mist.renderOrder = 2; this.group.add(mist);

    // ---- shafts of light from the sun's side, slanting down past the mountain
    this.rays = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `uniform float uTime; varying vec2 vUv; ${SKY_NOISE}
        void main(){ float x = vUv.x; float streak = smoothstep(0.0, 0.3, x) * (1.0 - smoothstep(0.7, 1.0, x));
          float n = vnoise(vec3(x * 14.0, uTime * 0.08, 1.0)); float a = streak * (0.35 + 0.65 * n) * smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y)) * 0.075;
          gl_FragColor = vec4(vec3(1.0, 0.72, 0.38) * a, a); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    for (let k = 0; k < 5; k++) {
      const w = 18 + k * 6, h = 260;
      for (const rot of [0, Math.PI / 2]) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.rays);
        m.position.set(28 + k * 16 - 40, 40, -118 - 20 + k * 9);
        m.rotation.set(0, rot + 0.4, 0.42 + k * 0.03, 'YXZ');
        m.renderOrder = 4; this.group.add(m);
      }
    }

    // ---- lights
    this.key = new THREE.DirectionalLight(0xffcf8f, 4.6);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048); this.key.shadow.bias = -0.0004; this.key.shadow.normalBias = 0.04;
    this.group.add(this.key, this.key.target);
    this.rim = new THREE.DirectionalLight(0x7f88ff, 1.5);
    this.rim.position.set(-120, 90, -320); this.rim.target.position.set(0, 0, -118);
    this.group.add(this.rim, this.rim.target);
    this.fill = new THREE.HemisphereLight(0x3a4a9a, 0x120a18, 0.55);
    this.group.add(this.fill);

    // ---- the floating lotus altar under the bow
    const am = altarMaps();
    this.altarGlow = new THREE.MeshStandardMaterial({ map: am.map, emissiveMap: am.emissive, emissive: 0xffc070, emissiveIntensity: 1.4, roughness: 0.72, metalness: 0.15 });
    const top = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.25, 0.28, 72), [new THREE.MeshStandardMaterial({ color: 0x2a2830, roughness: 0.8 }), this.altarGlow, new THREE.MeshStandardMaterial({ color: 0x2a2830, roughness: 0.8 })]);
    top.receiveShadow = true; top.castShadow = true; this.altar.add(top);
    const rimRing = new THREE.Mesh(new THREE.TorusGeometry(2.24, 0.05, 8, 96), new THREE.MeshPhysicalMaterial({ color: 0xf0bd5a, metalness: 1, roughness: 0.25 }));
    rimRing.rotation.x = Math.PI / 2; rimRing.position.y = 0.14; this.altar.add(rimRing);
    const root = new THREE.Mesh(new THREE.ConeGeometry(2.1, 3.8, 9, 6), new THREE.MeshStandardMaterial({ color: 0x24222a, roughness: 0.95, flatShading: true }));
    const rp = root.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < rp.count; i++) { const k = 0.82 + 0.3 * hashi(Math.round(rp.getX(i) * 50), Math.round(rp.getY(i) * 50), Math.round(rp.getZ(i) * 50), 4); rp.setXYZ(i, rp.getX(i) * k, rp.getY(i), rp.getZ(i) * k); }
    root.geometry.computeVertexNormals();
    root.rotation.x = Math.PI; root.position.y = -2.0; root.castShadow = true; root.receiveShadow = true; this.altar.add(root);
    const runeMat = new THREE.MeshStandardMaterial({ color: 0x1f1d24, emissive: 0xffb050, emissiveIntensity: 0.8, roughness: 0.6, flatShading: true });
    for (let k = 0; k < 7; k++) { const m = new THREE.Mesh(rockGeometry(20 + k, 0), runeMat); m.scale.setScalar(0.16 + 0.06 * (k % 3)); m.castShadow = true; this.altar.add(m); this.runes.push(m); }
    this.altar.position.set(0, 1.42, 0);
    this.group.add(this.altar);

    // ---- distant floating rocks for depth and scale
    const decorMat = new THREE.MeshStandardMaterial({ color: 0x1c1b22, roughness: 0.95 });
    this.decor = new THREE.InstancedMesh(rockGeometry(33, 3), decorMat, 30);
    this.decor.castShadow = false; this.decor.receiveShadow = true;
    const rd = mulberry32(31);
    for (let i = 0; i < 30; i++) {
      let p: THREE.Vector3;
      do { const a = rd() * Math.PI * 2, d = 150 + rd() * 480; p = new THREE.Vector3(Math.cos(a) * d, -30 + rd() * 120, Math.sin(a) * d - 120); }
      while (Math.abs(p.x) < 90 && p.z < 60 && p.z > -260); // keep the firing lane and the near view clear
      this.decorData.push({ p, s: 2 + rd() * 8, r: new THREE.Euler(rd() * 6, rd() * 6, rd() * 6), ph: rd() * 6 });
    }
    this.group.add(this.decor);

    this.bolt = new THREE.Mesh();
  }

  /** Environment map for reflections: the sky plus a warm card at the sun and a cool one opposite. */
  buildEnv(renderer: THREE.WebGLRenderer) {
    const s = new THREE.Scene();
    const skyMat = this.sky.clone(); skyMat.uniforms.uTime!.value = 7;
    s.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat));
    const card = (col: THREE.Color, dir: THREE.Vector3, size: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }));
      m.position.copy(dir).multiplyScalar(60); m.lookAt(0, 0, 0); s.add(m);
    };
    card(new THREE.Color(9, 5.6, 2.6), SUN_DIR, 44);
    card(new THREE.Color(2.4, 1.5, 0.8), new THREE.Vector3(0.2, 0.15, 1).normalize(), 70);
    card(new THREE.Color(1.2, 1.4, 3.4), new THREE.Vector3(-0.6, 0.5, -0.6).normalize(), 50);
    card(new THREE.Color(0.9, 0.5, 0.3), new THREE.Vector3(0, -1, 0), 120);
    const pm = new THREE.PMREMGenerator(renderer);
    this.env = pm.fromScene(s, 0.02).texture;
    pm.dispose();
    return this.env;
  }

  /** Keep the shadow frustum on what the camera is looking at (tight on the bow, wide on the mountain). */
  focusShadow(target: THREE.Vector3, radius: number, res: number) {
    const k = this.key;
    k.position.copy(target).addScaledVector(SUN_DIR, 400); k.target.position.copy(target);
    const c = k.shadow.camera as THREE.OrthographicCamera;
    const r = Math.max(3, radius);
    if (c.right !== r || k.shadow.mapSize.x !== res) {
      c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 300; c.far = 520; c.updateProjectionMatrix();
      if (k.shadow.mapSize.x !== res) { k.shadow.mapSize.set(res, res); k.shadow.map?.dispose(); k.shadow.map = null as unknown as THREE.WebGLRenderTarget; }
    }
    // snap to shadow texels so the shadow doesn't swim as the camera moves
    const texel = (2 * r) / res;
    k.target.position.x = Math.round(k.target.position.x / texel) * texel; k.target.position.z = Math.round(k.target.position.z / texel) * texel;
    k.position.copy(k.target.position).addScaledVector(SUN_DIR, 400);
  }

  update(t: number, cam: THREE.Camera) {
    const L = lightningAt(t);
    this.sky.uniforms.uTime!.value = t; this.sky.uniforms.uFlash!.value = L.k;
    if (L.k > 0) { const a = hashi(L.slot, 3, 0, 61) * Math.PI * 2; this.sky.uniforms.uBoltDir!.value.set(Math.cos(a), 0.08 + hashi(L.slot, 4) * 0.12, Math.sin(a)).normalize(); }
    for (const c of this.clouds) { c.uniforms.uTime!.value = t; c.uniforms.uFlash!.value = L.k; c.uniforms.uCam!.value.copy(cam.position); }
    this.mist.uniforms.uTime!.value = t; this.rays.uniforms.uTime!.value = t;
    this.fill.intensity = 0.55 + L.k * 0.9;
    this.altar.rotation.y = t * 0.05;
    this.altar.position.y = 1.42 + 0.04 * Math.sin(t * 0.7);
    this.runes.forEach((m, k) => { const a = t * 0.35 + (k / this.runes.length) * Math.PI * 2; m.position.set(Math.cos(a) * 2.9, -0.4 + 0.25 * Math.sin(t * 0.8 + k), Math.sin(a) * 2.9); m.rotation.set(t * 0.4 + k, t * 0.3, 0); });
    this.altarGlow.emissiveIntensity = 1.2 + 0.3 * Math.sin(t * 1.4);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion();
    this.decorData.forEach((d, i) => {
      q.setFromEuler(new THREE.Euler(d.r.x + t * 0.01, d.r.y + t * 0.015, d.r.z));
      m.compose(new THREE.Vector3(d.p.x, d.p.y + Math.sin(t * 0.2 + d.ph) * 1.5, d.p.z), q, new THREE.Vector3(d.s, d.s * 0.8, d.s));
      this.decor.setMatrixAt(i, m);
    });
    this.decor.instanceMatrix.needsUpdate = true;
  }
}
