// 3D · FUTURE CITY world: a procedural megacity at dusk. Instanced towers (tiered boxes) with a window shader (lit
// office rows, warm/cool/pink rooms, neon corner strips, roof crowns), sky bridges over the avenue, abstract holographic
// billboards, red beacons, flying-traffic light streams on avenue / cross / bay lanes, and past the arcology at the city
// edge a bay, a distant skyline and a big moon. Everything is seeded and a pure function of the frame.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mulberry32 } from '../../lib/rng';
import { clamp, spline } from '../../lib/anim';
import { Moon } from '../../three/MoonScene';
import { doneInst, setInst, useGlowTex, useInstanced, worldHook, type Vec3 } from './WorldKit';

// ------------------------------------------------------------------------------------------------ camera path
// keyframes every 30 frames (uniform, so a Catmull-Rom through them is smooth in time)
const CAM_P: Vec3[] = [[9, 13, 40], [3, 28, -22], [-6, 62, -100], [4, 124, -200], [0, 210, -300], [-8, 246, -412], [-16, 260, -505]];
const CAM_T: Vec3[] = [[0, 38, -140], [-4, 62, -170], [3, 112, -250], [0, 236, -330], [36, 252, -820], [70, 262, -1300], [95, 270, -1700]];
export function cityCam(f: number, dur: number) {
  const u = clamp(f / dur);
  const pos = spline(CAM_P, u) as Vec3, target = spline(CAM_T, u) as Vec3;
  const roll = 0.05 * Math.sin(f / 26) - 0.03 * Math.sin(f / 11 + 1);
  const fov = 50 - 8 * clamp((f - 100) / 40);
  return { pos, target, fov, roll };
}
export const ARCO = { z0: -394, z1: -322, roof: 210, wing: 70 };
export const MOON = { p: [190, 540, -3500] as Vec3, r: 340 };
const MOON_SUN = new THREE.Vector3(-0.45, 0.3, 1);

// ------------------------------------------------------------------------------------------------ layout
interface Tower { p: Vec3; s: Vec3; accent: number }
function buildCity() {
  const r = mulberry32(9011);
  const towers: Tower[] = [], tops: Vec3[] = [], billboards: { p: Vec3; ry: number; w: number; h: number; kind: number; hue: number }[] = [];
  const add = (x: number, z: number, w: number, d: number, h: number, accent: number) => towers.push({ p: [x, h / 2, z], s: [w, h, d], accent });
  for (let side = -1; side <= 1; side += 2) for (let k = 0; k < 8; k++) for (let j = 0; j < 5; j++) {
    const bx = side * (24 + 28 + k * 74), bz = 20 - j * 74;
    const near = 1 - k / 8, mid = 1 - Math.abs(j - 2) / 4;
    const lots: [number, number, number][] = r() < 0.22 ? [[0, 0, 50]] : [[-14, -14, 24], [14, -14, 24], [-14, 14, 24], [14, 14, 24]];
    lots.forEach(([ox, oz, maxW]) => {
      if (r() < 0.08 && k > 2) return;
      const w = maxW * (0.72 + r() * 0.28), d = maxW * (0.72 + r() * 0.28);
      let h = 36 + 150 * Math.pow(r(), 1.5) * (0.55 + 0.45 * near) * (0.7 + 0.3 * mid);
      if (r() < 0.07 + 0.08 * near) h = 220 + r() * 120;
      const x = bx + ox, z = bz + oz, acc = r();
      // tiers: podium/body, setback, crown
      const t1 = r() < 0.55 ? h : h * (0.55 + r() * 0.15);
      add(x, z, w, d, t1, acc);
      if (t1 < h) {
        const t2 = h - t1, sw = w * (0.6 + r() * 0.2), sd = d * (0.6 + r() * 0.2);
        towers.push({ p: [x + (r() - 0.5) * (w - sw), t1 + t2 / 2, z + (r() - 0.5) * (d - sd)], s: [sw, t2, sd], accent: acc });
      }
      if (h > 200) tops.push([x, h + 2, z]);
      // billboards on the avenue-facing side of the first row
      if (k === 0 && (ox * side < 0 || lots.length === 1) && r() < 0.75) {
        const face = x - side * (w / 2 + 0.6), bw = 12 + r() * 8, bh = 16 + r() * 16, by = 18 + r() * Math.max(10, Math.min(h, t1) - bh - 30);
        if (by + bh / 2 < Math.min(h, t1) - 4) billboards.push({ p: [face, by + bh / 2, z + (r() - 0.5) * 6], ry: side < 0 ? Math.PI / 2 : -Math.PI / 2, w: bw, h: bh, kind: Math.floor(r() * 4), hue: r() });
      }
    });
  }
  // the arcology at the city edge: a lower central span (the camera crests it) between two taller wings
  const { z0, z1, roof, wing } = ARCO, zc = (z0 + z1) / 2, dz = z1 - z0;
  add(0, zc, 2 * wing, dz, roof, 0.9);
  add(-(wing + 70), zc, 140, dz, roof + 70, 0.95);
  add(wing + 70, zc, 140, dz, roof + 95, 0.95);
  add(-(wing + 40), zc - 10, 36, 30, roof + 150, 0.97); tops.push([-(wing + 40), roof + 152, zc - 10]);
  add(wing + 44, zc + 6, 30, 30, roof + 185, 0.97); tops.push([wing + 44, roof + 187, zc + 6]);
  // rooftop plant on the central span, kept off the camera's line (|x| > 14)
  for (let k = 0; k < 12; k++) { const sx = (k % 2 ? 1 : -1) * (30 + r() * 34), sz = z0 + 8 + r() * (dz - 16), sw = 4 + r() * 7, sh = 2 + r() * 4; add(sx, sz, sw, sw * (0.6 + r() * 0.8), sh, r()); towers[towers.length - 1].p[1] = roof + sh / 2; }
  for (let k = 1; k <= 5; k++) for (const sgn of [-1, 1]) add(sgn * (wing + 140 + k * 70), zc + (r() - 0.5) * 20, 50, dz * 0.8, 120 + r() * 140, r());
  billboards.push({ p: [0, 128, z1 + 0.8], ry: 0, w: 64, h: 84, kind: 0, hue: 0.55 });
  billboards.push({ p: [-(wing + 70), 170, z1 + 0.8], ry: 0, w: 40, h: 60, kind: 2, hue: 0.9 });
  billboards.push({ p: [wing + 70, 185, z1 + 0.8], ry: 0, w: 40, h: 60, kind: 1, hue: 0.15 });
  return { towers, tops, billboards };
}

/** sky bridges across the avenue, placed just above the camera at three moments (near misses) */
export function bridgeSpots(dur: number): { p: Vec3; s: Vec3 }[] {
  return [30, 75, 105].map((fr, i) => { const c = cityCam(fr, dur).pos; return { p: [0, c[1] + (i === 1 ? 12 : 9), c[2] - 2] as Vec3, s: [52, 5, 8] as Vec3 }; });
}

/** traffic lanes: start, direction, length, count, speed, colour */
interface Lane { o: Vec3; d: Vec3; L: number; n: number; v: number; c: string; off: number }
function buildLanes() {
  const r = mulberry32(4401), lanes: Lane[] = [];
  const avY = [11, 30, 52, 78, 110, 150];
  avY.forEach((y, i) => [-15, -7, 7, 15].forEach((x) => {
    const toCam = x < 0; // left lanes come toward the start (headlights), right lanes go away (tail lights)
    const L = 500;
    lanes.push({ o: [x, y + (r() - 0.5) * 4, toCam ? -290 : 210], d: [0, 0, toCam ? 1 : -1], L, n: 24 + Math.floor(r() * 8), v: 1.4 + r() * 1.0 + i * 0.08, c: toCam ? '#FFF2DA' : '#FF3B4E', off: r() }); }));
  // cross lanes over the side streets
  [-17, -91, -165, -239].forEach((z, i) => [40 + i * 18, 95 + i * 12].forEach((y, k) => {
    const dir = (i + k) % 2 ? 1 : -1;
    lanes.push({ o: [-dir * 650, y, z + (k ? 4 : -4)], d: [dir, 0, 0], L: 1300, n: 36, v: 2.2 + r(), c: k ? '#7FE8FF' : '#FFB347', off: r() });
  }));
  // high lanes out over the bay toward the far skyline (seen in the reveal)
  [[-56, 216], [-34, 238], [-16, 252], [16, 222], [34, 246], [56, 230]].forEach(([x, y], i) => {
    const away = i % 2 === 0;
    lanes.push({ o: [x, y, away ? -240 : -2340], d: [0.03 * (x > 0 ? 1 : -1), 0, away ? -1 : 1], L: 2100, n: 170, v: 2.6 + r() * 0.8, c: away ? '#FF4D6A' : '#FFF0D8', off: r() });
  });
  return lanes;
}

// ------------------------------------------------------------------------------------------------ materials
function towerMaterial() {
  const u = { uWin: { value: 1 }, uPulse: { value: 0 } };
  const m = worldHook(new THREE.MeshStandardMaterial({ color: '#141424', roughness: 0.38, metalness: 0.6, envMapIntensity: 1 }), 'city-tower-v4', u, (s) => s
    .replace('#include <common>', '#include <common>\nuniform float uWin, uPulse;')
    .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.9, step(0.5, vWn.y));')
    .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, 0.1, step(0.5, vWn.y));')
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      {
        vec3 n = normalize(vWn);
        float side = 1.0 - step(0.5, abs(n.y));
        bool fx = abs(n.x) > 0.5;
        vec2 c = fx ? vec2(vWp.z, vWp.y) : vec2(vWp.x, vWp.y);
        vec2 g = c / vec2(1.9, 3.3);
        vec2 id = floor(g); vec2 fr = fract(g);
        float seed = fract(dot(vIo, vec3(0.0131, 0.0071, 0.0173)) * 13.7);
        float style = floor(fract(seed * 3.71) * 3.0);
        float win = step(0.16, fr.x) * step(fr.x, 0.84) * step(0.24, fr.y) * step(fr.y, 0.82);
        if (style > 1.5) win = step(0.3, fr.y) * step(fr.y, 0.74);                       // ribbon-window offices
        else if (style > 0.5) win *= step(0.5, fract((id.x + floor(seed * 7.0)) * 0.5));  // sparse, paired bays
        float rowR = wh21(vec2(floor(id.x / 5.0) + seed * 91.0, id.y + seed * 17.0));
        float rnd = wh21(id + seed * 57.0);
        float lit = step(0.6, rowR * 0.62 + rnd * 0.38);
        float hc = wh21(id * 1.37 + seed * 11.0);
        vec3 wc = hc < 0.6 ? vec3(1.0, 0.6, 0.3) : (hc < 0.88 ? vec3(0.45, 0.72, 1.0) : vec3(1.0, 0.36, 0.7));
        float aa = smoothstep(0.3, 0.85, max(fwidth(g.x), fwidth(g.y)));
        float val = mix(win * lit * (0.35 + 0.9 * wh21(id + 3.1) * wh21(id + 7.7)), 0.12, aa);
        wc = mix(wc, vec3(0.95, 0.6, 0.5), aa);
        // undersides (sky bridges seen from below): a grid of panel lights
        float under = step(0.5, -n.y);
        vec2 ug = fract(vWp.xz / vec2(4.0, 2.6));
        totalEmissiveRadiance += under * vec3(0.55, 0.85, 1.0) * step(0.8, ug.x) * step(0.55, ug.y) * 1.4;
        float floorBand = smoothstep(0.92, 1.0, fract(c.y / 3.7)) * 0.0;
        totalEmissiveRadiance += side * val * wc * uWin * 1.15 + floorBand;
        // neon corner strips + roof crown on some towers
        float acc = fract(seed * 7.31);
        float hl = fx ? (0.5 - abs(vLp.z)) * vIs.z : (0.5 - abs(vLp.x)) * vIs.x;
        vec3 neon = acc > 0.86 ? vec3(0.25, 0.9, 1.0) : vec3(1.0, 0.25, 0.75);
        float strip = side * step(0.72, acc) * (1.0 - smoothstep(0.25, 0.55, hl));
        float crown = side * step(0.6, acc) * (1.0 - smoothstep(0.6, 1.4, (0.5 - vLp.y) * vIs.y));
        totalEmissiveRadiance += neon * (strip * 2.6 + crown * 1.6) * (1.0 + 0.6 * uPulse);
        // facade sheen bands (mullions) keep the dark glass from looking flat
        float mul = smoothstep(0.43, 0.49, abs(fr.x - 0.5));
        totalEmissiveRadiance += side * vec3(0.02, 0.02, 0.04) * mul * (1.0 - aa);
      }`));
  return { m, u };
}

const holoMaterial = () => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, toneMapped: false,
  uniforms: { uT: { value: 0 }, uBeat: { value: 0 }, uKind: { value: 0 }, uHue: { value: 0 }, uFade: { value: 1 }, uFlash: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform float uT, uBeat, uKind, uHue, uFade, uFlash; varying vec2 vUv;
    vec3 hue(float h){ return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
    void main(){
      vec2 p = vUv * 2.0 - 1.0; float a = 0.0;
      float frame = max(step(0.94, abs(p.x)), step(0.95, abs(p.y)));
      if (uKind < 0.5) {            // pulsing rings
        float r = length(p * vec2(1.0, 1.3));
        a = smoothstep(0.08, 0.0, abs(fract(r * 3.0 - uT * 0.6) - 0.5) - 0.38) * smoothstep(1.0, 0.2, r);
        a += smoothstep(0.32 + 0.1 * uBeat, 0.28, r) * 0.9;
      } else if (uKind < 1.5) {     // rotating triangle + bars
        float an = atan(p.y, p.x) + uT * 0.8; float rr = length(p);
        float tri = cos(3.14159 / 3.0) / cos(mod(an, 2.0944) - 1.0472);
        a = smoothstep(0.05, 0.0, abs(rr - 0.55 * tri)) + smoothstep(0.02, 0.0, abs(rr - 0.3 * tri)) * 0.6;
        a += step(abs(p.y + 0.8), 0.04) * step(p.x, -1.0 + 2.0 * fract(uT * 0.3));
      } else if (uKind < 2.5) {     // scrolling glyph bars (no text)
        vec2 g = vec2(floor(vUv.x * 6.0), floor(vUv.y * 18.0 + uT * 3.0));
        float w = fract(sin(dot(g, vec2(12.9, 78.2))) * 43758.5);
        a = step(fract(vUv.x * 6.0), 0.2 + 0.7 * w) * step(0.15, fract(vUv.y * 18.0 + uT * 3.0)) * 0.7;
      } else {                      // waveform
        float y = 0.45 * sin(p.x * 6.0 + uT * 3.0) * sin(p.x * 2.1 - uT) * (0.6 + 0.6 * uBeat);
        a = smoothstep(0.06, 0.0, abs(p.y - y)) + smoothstep(0.03, 0.0, abs(p.y + y * 0.6)) * 0.5;
      }
      float scan = 0.75 + 0.25 * sin(vUv.y * 220.0 + uT * 8.0);
      vec3 col = mix(hue(uHue), vec3(1.0), 0.25);
      float alpha = (a * scan + frame * 0.8 + 0.06) * (0.7 + 0.6 * uBeat + uFlash) * uFade;
      gl_FragColor = vec4(col * alpha * 1.6, 1.0);
    }`,
});

// ------------------------------------------------------------------------------------------------ world
export const CityWorld: React.FC<{ f: number; dur: number; cam: Vec3 }> = ({ f, dur, cam }) => {
  const glow = useGlowTex();
  const city = useMemo(buildCity, []);
  const lanes = useMemo(buildLanes, []);
  const bridges = useMemo(() => bridgeSpots(dur), [dur]);
  const beat = Math.exp(-((f % 15) / 15) * 6);
  const reveal = clamp((f - 112) / 14);

  const geo = useMemo(() => ({ box: new THREE.BoxGeometry(1, 1, 1), plane: new THREE.PlaneGeometry(1, 1) }), []);
  const tm = useMemo(towerMaterial, []);
  tm.u.uPulse.value = beat;
  const towers = useInstanced(geo.box, tm.m, city.towers.length + bridges.length + 1, {});
  useMemo(() => {
    city.towers.forEach((t, i) => setInst(towers, i, t.p, t.s));
    bridges.forEach((b, i) => setInst(towers, city.towers.length + i, b.p, b.s));
    // a waterfront promenade slab at the edge
    setInst(towers, city.towers.length + bridges.length, [0, 1.5, ARCO.z0 - 10], [1400, 3, 20]);
    doneInst(towers);
  }, [city, bridges, towers]);

  // bridge underside light strips + street light lines (additive)
  const stripMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), []);
  const strips = useInstanced(geo.box, stripMat, bridges.length * 2 + 60, { colors: true });
  useMemo(() => {
    let k = 0; const c = new THREE.Color();
    bridges.forEach((b) => {
      setInst(strips, k, [b.p[0], b.p[1] - 2.6, b.p[2] - 2.2], [b.s[0], 0.35, 0.5]); strips.setColorAt(k++, c.set('#6FE6FF'));
      setInst(strips, k, [b.p[0], b.p[1] - 2.6, b.p[2] + 2.2], [b.s[0], 0.35, 0.5]); strips.setColorAt(k++, c.set('#FF5FD2'));
    });
    // street glow lines: avenue edges, side streets (along z) and cross streets (along x)
    for (const x of [-22.5, 22.5]) { setInst(strips, k, [x, 0.3, -130], [0.8, 0.3, 360]); strips.setColorAt(k++, c.set('#FF9A3C').multiplyScalar(0.8)); }
    for (let kk = 0; kk < 8; kk++) for (const sgn of [-1, 1]) { setInst(strips, k, [sgn * (24 + 56 + 9 + kk * 74), 0.3, -130], [1.2, 0.3, 360]); strips.setColorAt(k++, c.set('#FFB25A').multiplyScalar(0.55)); }
    for (const z of [-17, -91, -165, -239]) { setInst(strips, k, [0, 0.3, z], [1300, 0.3, 1.2]); strips.setColorAt(k++, c.set('#FFB25A').multiplyScalar(0.55)); }
    for (; k < strips.count; k++) setInst(strips, k, [0, -50, 0], [0, 0, 0]);
    doneInst(strips, true);
  }, [bridges, strips]);

  // traffic: instanced light streaks
  const carCount = lanes.reduce((a, l) => a + l.n, 0);
  const carMat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false,
    vertexShader: `varying float vZ; varying vec3 vC;
      void main(){
        vZ = position.z;
        #ifdef USE_INSTANCING_COLOR
          vC = instanceColor;
        #else
          vC = vec3(1.0);
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: 'varying float vZ; varying vec3 vC; void main(){ float a = pow(clamp(vZ + 0.5, 0.0, 1.0), 2.0); gl_FragColor = vec4(vC * (0.15 + 1.6 * a * a), 1.0); }',
  }), []);
  const cars = useInstanced(geo.box, carMat, carCount, { colors: true });
  const tmpC = useMemo(() => new THREE.Color(), []), laneC = useMemo(() => lanes.map((l) => new THREE.Color(l.c)), [lanes]);
  {
    let k = 0;
    lanes.forEach((l, li) => {
      const rr = mulberry32(li * 31 + 7);
      for (let i = 0; i < l.n; i++) {
        const jitter = rr();
        const s = (((l.off + i / l.n + jitter * 0.35 / l.n) * l.L + l.v * f) % l.L + l.L) % l.L;
        const p: Vec3 = [l.o[0] + l.d[0] * s, l.o[1] + l.d[1] * s + Math.sin(f / 20 + i) * 0.3, l.o[2] + l.d[2] * s];
        const len = 3 + l.v * 4.5;
        const ry = Math.atan2(l.d[0], l.d[2]);
        setInst(cars, k, p, [0.26, 0.2, len], ry);
        const dist = Math.hypot(p[0] - cam[0], p[1] - cam[1], p[2] - cam[2]);
        const fade = Math.exp(-dist / 900) * (0.6 + 0.4 * rr()) * (0.25 + 0.75 * clamp((dist - 6) / 30));
        cars.setColorAt(k, tmpC.copy(laneC[li]).multiplyScalar(2.2 * fade));
        k++;
      }
    });
    doneInst(cars, true);
  }

  // holographic billboards
  const holos = useMemo(() => city.billboards.map((b) => { const m = holoMaterial(); m.uniforms.uKind.value = b.kind; m.uniforms.uHue.value = b.hue; return m; }), [city]);
  holos.forEach((m, i) => { m.uniforms.uT.value = f / 30 + i * 1.7; m.uniforms.uBeat.value = Math.exp(-(((f + (i % 2) * 15) % 30) / 30) * 5); m.uniforms.uFlash.value = 0; });

  // beacons on the tallest roofs: blink on every beat, alternating sets
  const beaconGeo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(city.tops.flat(), 3)); return g; }, [city]);

  // far skyline across the bay (silhouettes + lights), stars
  const far = useMemo(() => {
    const r = mulberry32(5150), boxes: { p: Vec3; s: Vec3 }[] = [], lp: number[] = [], lc: number[] = [];
    for (let i = 0; i < 260; i++) {
      const x = (r() - 0.5) * 5600, z = -2350 - r() * 600, w = 36 + r() * 70, d = 30 + r() * 50;
      const h = (24 + 330 * Math.pow(r(), 2.6)) * (1 - Math.min(0.75, Math.abs(x) / 3600));
      boxes.push({ p: [x, h / 2, z], s: [w, h, d] });
      if (r() < 0.18) boxes.push({ p: [x, h + 20, z], s: [3, 40 + r() * 40, 3] });
      const cols = Math.floor(w / 7), rows = Math.floor(h / 9);
      for (let k = 0; k < cols * rows; k++) {
        if (r() > 0.22) continue;
        lp.push(x - w / 2 + ((k % cols) + 0.5) * (w / cols), (Math.floor(k / cols) + 0.5) * 9, z + d / 2 + 0.5);
        const warm = r() < 0.7; lc.push(warm ? 1 : 0.6, warm ? 0.7 : 0.8, warm ? 0.45 : 1);
      }
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    lg.setAttribute('aCol', new THREE.Float32BufferAttribute(lc, 3));
    const sp: number[] = [];
    for (let i = 0; i < 900; i++) { const az = r() * Math.PI * 2, el = 0.08 + Math.pow(r(), 0.7) * 1.3, R = 3000; sp.push(Math.cos(az) * Math.cos(el) * R, Math.sin(el) * R, Math.sin(az) * Math.cos(el) * R); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    // waterfront lights along the edge
    const wp: number[] = [];
    for (let i = 0; i < 400; i++) wp.push(-700 + i * 3.5, 3.5, ARCO.z0 - 19.5);
    const rp: number[] = [];
    for (let i = 0; i < 90; i++) { const a = (i / 90) * Math.PI * 2; rp.push(30 + Math.cos(a) * 16, ARCO.roof + 0.6, (ARCO.z0 + ARCO.z1) / 2 + Math.sin(a) * 16); }
    for (let i = 0; i < 90; i++) rp.push(-ARCO.wing + i * (2 * ARCO.wing / 89), ARCO.roof + 0.8, ARCO.z1 - 0.5);
    for (let i = 0; i < 90; i++) rp.push(-ARCO.wing + i * (2 * ARCO.wing / 89), ARCO.roof + 0.8, ARCO.z0 + 0.5);
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3));
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3));
    return { boxes, lg, sg, wg, rg };
  }, []);
  const farMat = useMemo(() => new THREE.ShaderMaterial({
    fog: false,
    vertexShader: `varying float vY;
      void main(){ vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vY = w.y; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `varying float vY;
      void main(){ vec3 top = vec3(0.03, 0.02, 0.075), haze = vec3(0.3, 0.11, 0.24);
        vec3 c = mix(haze, top, smoothstep(0.0, 140.0, vY));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  }), []);
  const farM = useInstanced(geo.box, farMat, far.boxes.length, {});
  useMemo(() => { far.boxes.forEach((b, i) => setInst(farM, i, b.p, b.s)); doneInst(farM); }, [far, farM]);

  // far skyline window lights: on every beat of the last bar a wave of light ripples out from the centre of the skyline
  const farLights = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uWave: { value: 0 }, uAmp: { value: 0 }, uScale: { value: 540 } },
    vertexShader: `attribute vec3 aCol; uniform float uWave, uAmp, uScale; varying vec3 vC;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float w = exp(-pow((abs(position.x - ${MOON.p[0].toFixed(1)}) - uWave) / 160.0, 2.0)) * uAmp;
        vC = aCol * (0.75 + 3.0 * w);
        gl_PointSize = 10.0 * uScale / -mv.z * (1.0 + 0.8 * w);
      }`,
    fragmentShader: 'varying vec3 vC; void main(){ vec2 d = gl_PointCoord - 0.5; float a = exp(-dot(d, d) * 14.0); gl_FragColor = vec4(vC * a, 1.0); }',
  }), []);
  {
    const ph = ((f - 120) % 15 + 15) % 15;
    farLights.uniforms.uWave.value = (ph / 15) * 2600;
    farLights.uniforms.uAmp.value = f >= 120 ? Math.exp(-(ph / 15) * 1.6) : 0;
  }

  // water with a moon glitter path
  const waterMat = useMemo(() => new THREE.ShaderMaterial({
    fog: false, uniforms: { uT: { value: 0 }, uMoonX: { value: MOON.p[0] } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uT, uMoonX; varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        float d = clamp((-vW.z - 380.0) / 2900.0, 0.0, 1.0);
        vec3 c = mix(vec3(0.01, 0.008, 0.03), vec3(0.11, 0.04, 0.1), pow(d, 3.0));
        c += vec3(0.25, 0.08, 0.18) * smoothstep(0.82, 1.0, d);
        float lane = exp(-pow((vW.x - uMoonX * (0.35 + 0.65 * d)) / (18.0 + 110.0 * d), 2.0));
        vec2 q = vec2(vW.x / (2.4 + 9.0 * d), vW.z / (0.45 + 1.6 * d) + uT * 0.8);
        vec2 g = floor(q); vec2 fq = fract(q);
        float dash = step(abs(fq.x - h(g + 1.3)), 0.25 + 0.2 * h(g + 2.1)) * step(abs(fq.y - 0.5), 0.22);
        float sp = step(0.7, h(g)) * dash * (0.5 + 0.5 * sin(uT * 5.0 + h(g + 3.0) * 6.28));
        c += vec3(1.0, 0.86, 0.76) * lane * (0.07 + 1.5 * sp) * smoothstep(0.0, 0.3, d);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  }), []);
  waterMat.uniforms.uT.value = f / 30;

  return (
    <group>
      <hemisphereLight color="#5B4A9A" groundColor="#1A0E22" intensity={0.4} />
      <directionalLight position={MOON.p} intensity={0.9} color="#C9D4FF" />
      <directionalLight position={[-300, 120, 400]} intensity={0.35} color="#FF7AA8" />
      <primitive object={towers} />
      <primitive object={strips} />
      <primitive object={cars} />
      {city.billboards.map((b, i) => (
        <mesh key={i} geometry={geo.plane} material={holos[i]} position={b.p} rotation={[0, b.ry, 0]} scale={[b.w, b.h, 1]} />
      ))}
      <points geometry={beaconGeo}>
        <pointsMaterial map={glow} color="#FF3040" size={9} sizeAttenuation transparent opacity={0.35 + 0.65 * beat} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} fog={false} />
      </points>
      {/* ground (dark, fogged) */}
      <mesh geometry={geo.plane} position={[0, 0, -100]} rotation={[-Math.PI / 2, 0, 0]} scale={[1600, 560, 1]}>
        <meshStandardMaterial color="#07060D" roughness={0.7} metalness={0} />
      </mesh>
      {/* bay, far skyline, moon */}
      <mesh geometry={geo.plane} material={waterMat} position={[0, -0.5, -1900]} rotation={[-Math.PI / 2, 0, 0]} scale={[9000, 3060, 1]} />
      <primitive object={farM} />
      <points geometry={far.lg} material={farLights} />
      <points geometry={far.rg}>
        <pointsMaterial map={glow} color="#9FE9FF" size={0.9} sizeAttenuation transparent opacity={0.95} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} fog={false} />
      </points>
      <points geometry={far.wg}>
        <pointsMaterial map={glow} color="#FFC07A" size={4} sizeAttenuation transparent opacity={0.9} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} fog={false} />
      </points>
      <points geometry={far.sg}>
        <pointsMaterial map={glow} color="#E6E2FF" size={9} sizeAttenuation transparent opacity={0.8} depthWrite={false} toneMapped={false} fog={false} />
      </points>
      <group position={MOON.p}><Moon t={f / 30} sun={MOON_SUN} scale={MOON.r} rim={0.25} spin={0.01} /></group>
      <group visible={reveal >= 0}>
        <sprite position={[MOON.p[0], MOON.p[1], MOON.p[2] + 10]} scale={[MOON.r * 7 + 300 * reveal, MOON.r * 7 + 300 * reveal, 1]}>
          <spriteMaterial map={glow} color="#C8B8FF" transparent opacity={0.5} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} fog={false} />
        </sprite>
      </group>
    </group>
  );
};
