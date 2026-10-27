// 3D · TOWN world: a low-poly town diorama on a floating square of land (grass, soil and rock layers, the river cut
// through it with a glassy water edge), houses with gabled roofs, trees, a windmill on a hill, an arched bridge, roads
// with little cars, people on the paths and a boat on the river. `townTime(f)` drives a day-to-dusk cycle; windows
// switch on in groups on the beats and the street lamps all light at once on beat 6. Seeded, pure function of frame.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mulberry32 } from '../../lib/rng';
import { clamp, invLerp, lerp, smootherStep } from '../../lib/anim';
import { doneInst, mergeFlat, mixHex, ramp, setInst, tint, useGlowTex, useInstanced, type Vec3 } from './WorldKit';

export const HALF = 20;
const BEAT = 15;

// ------------------------------------------------------------------------------------------------ timeline
export function townTime(f: number, dur: number) {
  const d = smootherStep(clamp(f / dur)) * 0.85 + 0.15 * clamp(f / dur);   // 0 day .. 1 dusk
  const lampsOn = smootherStep(invLerp(90, 94, f));
  return { d, lampsOn, wow: f >= 90 ? Math.exp(-(f - 90) / 9) : 0 };
}
/** the beat (frame) a house's windows light: groups on beats 2..5, the rest on beat 6 with the lamps */
function houseOn(i: number, r: number) {
  const b = r < 0.12 ? 2 : r < 0.3 ? 3 : r < 0.5 ? 4 : r < 0.68 ? 5 : 6;
  return b * BEAT + (i % 3);
}

// ------------------------------------------------------------------------------------------------ terrain layout
const riverX = (z: number) => 3.4 * Math.sin(z * 0.16 + 0.6) + 1.6;
const riverW = (z: number) => 2.5 + 0.35 * Math.sin(z * 0.31 + 1.2);
const ROAD_PTS: [number, number][] = [[-HALF, 3.3], [-12, 3.1], [-5, 2.8], [0.2, 2.6], [8.8, 2.2], [13, 0.9], [HALF, -0.6]];
export const BRIDGE = { x0: 0.2, x1: 8.8, z: 2.4, w: 2.5 };
function bridgeY(x: number) { const u = (x - (BRIDGE.x0 + BRIDGE.x1) / 2) / ((BRIDGE.x1 - BRIDGE.x0) / 2); return Math.abs(u) <= 1 ? 0.05 + 0.6 * (1 - u * u) : 0; }

function curve2(pts: [number, number][], closed = false) {
  return new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), closed, 'centripetal');
}
const ROAD = curve2(ROAD_PTS);
const RING = curve2([[-15, -12], [-7, -13.5], [-4.5, -8], [-6.5, -3.5], [-14, -3.2], [-16.5, -7.5]], true);
const LANE = curve2([[13, 0.9], [12.6, 6], [10.5, 11], [12.5, 16.5], [15, HALF]]);
const PROM = curve2(Array.from({ length: 17 }, (_, k) => { const z = -18 + k * 2.25; return [riverX(z) - riverW(z) - 1.1, z] as [number, number]; }));
const MILLPATH = curve2([[-5, 2.8], [-6.5, 7], [-10.5, 10.5], [-13.5, 13.5]]);
const roadY = (c: THREE.CatmullRomCurve3, p: THREE.Vector3) => (c === ROAD ? bridgeY(p.x) : 0);

function ribbon(c: THREE.CatmullRomCurve3, w: number, n: number, y = 0.03, withBridge = false) {
  const pos: number[] = [], idx: number[] = [];
  for (let k = 0; k <= n; k++) {
    const u = k / n, p = c.getPointAt(u), t = c.getTangentAt(u), nx = -t.z, nz = t.x, l = Math.hypot(nx, nz) || 1;
    const yy = y + (withBridge ? bridgeY(p.x) : 0);
    pos.push(p.x + (nx / l) * w / 2, yy, p.z + (nz / l) * w / 2, p.x - (nx / l) * w / 2, yy, p.z - (nz / l) * w / 2);
    if (k < n) { const a = k * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  // keep normals up (winding may flip on curves)
  const nrm = g.attributes.normal as THREE.BufferAttribute; for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, 0, 1, 0);
  return g;
}
const distTo = (c: THREE.CatmullRomCurve3, x: number, z: number, n = 120) => {
  let m = 1e9; for (let k = 0; k <= n; k++) { const p = c.getPointAt(k / n); m = Math.min(m, Math.hypot(p.x - x, p.z - z)); } return m;
};

function terrain() {
  const N = 48, L: THREE.Vector2[] = [], R: THREE.Vector2[] = [];
  for (let k = 0; k <= N; k++) { const z = -HALF + (k / N) * 2 * HALF; L.push(new THREE.Vector2(riverX(z) - riverW(z), z)); R.push(new THREE.Vector2(riverX(z) + riverW(z), z)); }
  const left = [new THREE.Vector2(-HALF, -HALF), ...L, new THREE.Vector2(-HALF, HALF)];
  const right = [new THREE.Vector2(HALF, -HALF), new THREE.Vector2(HALF, HALF), ...[...R].reverse()];
  const river = [...L, ...[...R].reverse()];
  const ext = (pts: THREE.Vector2[], top: number, depth: number, col: string) => {
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth, bevelEnabled: false, curveSegments: 1 });
    g.rotateX(Math.PI / 2); g.translate(0, top, 0);
    return tint(g, col);
  };
  const parts = [
    ext(left, 0, 0.42, '#7DBA4F'), ext(right, 0, 0.42, '#7DBA4F'),
    ext(left, -0.42, 3.0, '#8E5C3B'), ext(right, -0.42, 3.0, '#8E5C3B'),
    ext(left, -3.42, 1.9, '#6C5B55'), ext(right, -3.42, 1.9, '#6C5B55'),
    ext(river, -1.05, 0.3, '#D8BE86'), ext(river, -1.35, 2.07, '#8E5C3B'), ext(river, -3.42, 1.9, '#6C5B55'),
  ];
  const water = new THREE.ShapeGeometry(new THREE.Shape(river.map((v) => new THREE.Vector2(v.x, -v.y)))); water.rotateX(-Math.PI / 2); water.translate(0, -0.36, 0);
  // the glassy cut faces of the water at the tile's front and back edges
  const cut = (z: number) => {
    const xl = riverX(z) - riverW(z), xr = riverX(z) + riverW(z), g = new THREE.PlaneGeometry(xr - xl, 0.69);
    g.translate((xl + xr) / 2, -0.705, z + (z > 0 ? 0.002 : -0.002)); if (z < 0) g.rotateY(0);
    return g;
  };
  return { ground: mergeFlat(parts), water, cuts: [cut(HALF), cut(-HALF)] };
}

/** houses, trees, lamps, people paths: seeded placement that avoids the river, roads and each other */
function layout() {
  const r = mulberry32(3307);
  const houses: { p: Vec3; s: Vec3; ry: number; wall: string; roof: string; on: number; chimney: boolean }[] = [];
  const trees: { p: Vec3; s: number; kind: number; col: string; ph: number }[] = [];
  const occupied: [number, number, number][] = [];
  const free = (x: number, z: number, rad: number) => occupied.every(([ox, oz, or]) => Math.hypot(ox - x, oz - z) > or + rad);
  const nearRiver = (x: number, z: number, m: number) => Math.abs(x - riverX(z)) < riverW(z) + m;
  const walls = ['#F4E9D6', '#F1DCC2', '#F7F2E8', '#EBCBA9', '#D9E6EC', '#F3D6D0'];
  const roofs = ['#C8553D', '#B2472F', '#4F5D75', '#3F8F8A', '#D9A441', '#9C4A3A'];
  // the windmill hill
  occupied.push([-13.5, 13.5, 3.6]);
  // keep the roads clear
  const roadClear = (x: number, z: number, m: number) => distTo(ROAD, x, z, 60) > m && distTo(RING, x, z, 60) > m && distTo(LANE, x, z, 40) > m && distTo(PROM, x, z, 40) > m - 0.6 && distTo(MILLPATH, x, z, 30) > m - 0.5;
  // houses along the roads: sample spots on both sides of each road
  const along = (c: THREE.CatmullRomCurve3, n: number, off: number) => {
    for (let k = 0; k < n; k++) {
      const u = (k + 0.5) / n, p = c.getPointAt(u), t = c.getTangentAt(u);
      for (const side of [-1, 1]) {
        if (r() < 0.25) continue;
        const nx = -t.z * side, nz = t.x * side, w = 1.7 + r() * 0.9, dd = 1.5 + r() * 0.7;
        const x = p.x + nx * (off + dd / 2), z = p.z + nz * (off + dd / 2);
        if (Math.abs(x) > HALF - 1.6 || Math.abs(z) > HALF - 1.6 || nearRiver(x, z, 2.2) || !free(x, z, Math.max(w, dd) * 0.62) || !roadClear(x, z, 1.7)) continue;
        occupied.push([x, z, Math.max(w, dd) * 0.62]);
        const h = 1.1 + r() * 0.9;
        houses.push({ p: [x, 0, z], s: [w, h, dd], ry: Math.atan2(t.x, t.z) + Math.PI / 2, wall: walls[Math.floor(r() * walls.length)], roof: roofs[Math.floor(r() * roofs.length)], on: 0, chimney: r() < 0.6 });
      }
    }
  };
  along(ROAD, 14, 1.5); along(RING, 14, 1.5); along(LANE, 7, 1.5);
  // a small square tower (town hall) by the ring road
  houses.push({ p: [-10.6, 0, -8.2], s: [2.2, 3.6, 2.2], ry: 0.1, wall: '#F2E4CC', roof: '#4F5D75', on: 0, chimney: false });
  occupied.push([-10.6, -8.2, 1.8]);
  houses.forEach((h, i) => { h.on = houseOn(i, r()); });
  // trees: a forest corner, scattered trees, river bank trees
  const greens = ['#4E8F3A', '#5E9E42', '#3F7D46', '#6DAA48', '#82B54A'];
  const tryTree = (x: number, z: number, s: number, kind: number) => {
    if (Math.abs(x) > HALF - 0.7 || Math.abs(z) > HALF - 0.7 || nearRiver(x, z, 0.9) || !free(x, z, 0.55 * s) || !roadClear(x, z, 1.1)) return;
    occupied.push([x, z, 0.55 * s]);
    trees.push({ p: [x, 0, z], s, kind, col: r() < 0.1 ? '#E0A23B' : greens[Math.floor(r() * greens.length)], ph: r() * 6.28 });
  };
  for (let k = 0; k < 70; k++) tryTree(9 + r() * 10.5, -19 + r() * 13, 0.8 + r() * 0.6, r() < 0.7 ? 0 : 1);   // forest (pines)
  for (let k = 0; k < 160; k++) tryTree((r() - 0.5) * 2 * HALF, (r() - 0.5) * 2 * HALF, 0.7 + r() * 0.5, r() < 0.35 ? 0 : 1);
  // street lamps along the main road + on the bridge + along the promenade
  const lamps: Vec3[] = [];
  for (let k = 0; k < 9; k++) { const u = 0.05 + k * 0.11, p = ROAD.getPointAt(u), t = ROAD.getTangentAt(u), sd = k % 2 ? 1 : -1; lamps.push([p.x - t.z * sd * 1.45, bridgeY(p.x), p.z + t.x * sd * 1.45]); }
  for (let k = 0; k < 6; k++) { const p = PROM.getPointAt(0.08 + k * 0.17); lamps.push([p.x - 0.7, 0, p.z]); }
  return { houses, trees, lamps };
}

/** gabled roof prism (unit: width 1 along x, depth 1 along z, height 1), ridge along x */
function roofGeo() {
  const v = [
    [-0.5, 0, -0.5], [0.5, 0, -0.5], [0.5, 1, 0], [-0.5, 1, 0],   // back slope
    [-0.5, 0, 0.5], [0.5, 0, 0.5], [0.5, 1, 0], [-0.5, 1, 0],     // front slope
  ];
  const pos: number[] = [];
  const tri = (a: number[], b: number[], c: number[]) => pos.push(...a, ...b, ...c);
  tri(v[0], v[3], v[2]); tri(v[0], v[2], v[1]);
  tri(v[4], v[5], v[6]); tri(v[4], v[6], v[7]);
  tri([-0.5, 0, -0.5], [-0.5, 0, 0.5], [-0.5, 1, 0]); tri([0.5, 0, -0.5], [0.5, 1, 0], [0.5, 0, 0.5]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------------------------------------------ world
export const TownWorld: React.FC<{ f: number; dur: number }> = ({ f, dur }) => {
  const T = townTime(f, dur);
  const glow = useGlowTex();
  const terr = useMemo(terrain, []);
  const L = useMemo(layout, []);
  const roads = useMemo(() => ({
    road: ribbon(ROAD, 2.0, 160, 0.035, true), ring: ribbon(RING, 1.7, 140, 0.03), lane: ribbon(LANE, 1.5, 80, 0.03),
    prom: ribbon(PROM, 0.9, 120, 0.025), mill: ribbon(MILLPATH, 0.8, 60, 0.025),
  }), []);

  const M = useMemo(() => ({
    ground: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0 }),
    asphalt: new THREE.MeshStandardMaterial({ color: '#8F8C88', roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 }),
    path: new THREE.MeshStandardMaterial({ color: '#E8D3A2', roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }),
    wall: new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.85, flatShading: true }),
    roof: new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.75, flatShading: true }),
    stone: new THREE.MeshStandardMaterial({ color: '#DCD2C2', roughness: 0.9, flatShading: true }),
    leaf: new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.9, flatShading: true }),
    trunk: new THREE.MeshStandardMaterial({ color: '#7A5638', roughness: 1, flatShading: true }),
    dark: new THREE.MeshStandardMaterial({ color: '#3B3F48', roughness: 0.6 }),
    paint: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, flatShading: true }),
    win: new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false }),
    lampHead: new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false }),
    water: new THREE.MeshStandardMaterial({ color: '#4FA3C7', roughness: 0.12, metalness: 0.3, transparent: true, opacity: 0.88, envMapIntensity: 1.2 }),
    waterCut: new THREE.MeshStandardMaterial({ color: '#3D8FB8', roughness: 0.2, transparent: true, opacity: 0.62, side: THREE.DoubleSide }),
  }), []);

  const geo = useMemo(() => {
    const box = new THREE.BoxGeometry(1, 1, 1);
    const pine = mergeFlat([tint(new THREE.ConeGeometry(0.75, 1.3, 7).translate(0, 1.25, 0), '#FFFFFF'), tint(new THREE.ConeGeometry(0.58, 1.05, 7).translate(0, 1.95, 0), '#FFFFFF')]);
    const round = new THREE.IcosahedronGeometry(0.72, 0).translate(0, 1.45, 0);
    const trunk = new THREE.CylinderGeometry(0.09, 0.13, 0.9, 6).translate(0, 0.45, 0);
    const car = mergeFlat([tint(new THREE.BoxGeometry(0.95, 0.36, 0.5).translate(0, 0.28, 0), '#FFFFFF'), tint(new THREE.BoxGeometry(0.52, 0.28, 0.46).translate(-0.06, 0.6, 0), '#2E3644'),
      tint(new THREE.CylinderGeometry(0.11, 0.11, 0.54, 8).rotateX(Math.PI / 2).translate(0.3, 0.11, 0), '#22252B'), tint(new THREE.CylinderGeometry(0.11, 0.11, 0.54, 8).rotateX(Math.PI / 2).translate(-0.3, 0.11, 0), '#22252B')]);
    const person = mergeFlat([tint(new THREE.CylinderGeometry(0.1, 0.13, 0.42, 6).translate(0, 0.25, 0), '#FFFFFF'), tint(new THREE.SphereGeometry(0.1, 8, 6).translate(0, 0.56, 0), '#F2C9A4')]);
    const boat = mergeFlat([tint(new THREE.BoxGeometry(1.5, 0.3, 0.62).translate(0, 0.08, 0), '#F4EEE2'), tint(new THREE.BoxGeometry(0.6, 0.34, 0.46).translate(-0.15, 0.4, 0), '#C8553D')]);
    // bridge: an arched stone span with a humped deck, extruded across its width
    const L2 = (BRIDGE.x1 - BRIDGE.x0) / 2, a = 2.85, sh = new THREE.Shape();
    sh.moveTo(-L2, -1.4); sh.lineTo(-a, -1.4);
    for (let k = 0; k <= 16; k++) { const t = Math.PI - (k / 16) * Math.PI; sh.lineTo(a * Math.cos(t), -1.4 + 1.35 * Math.sin(t)); }
    sh.lineTo(L2, -1.4);
    for (let k = 0; k <= 16; k++) { const x = L2 - (k / 16) * 2 * L2; sh.lineTo(x, bridgeY(x + (BRIDGE.x0 + BRIDGE.x1) / 2) - 0.02); }
    const bridge = new THREE.ExtrudeGeometry(sh, { depth: BRIDGE.w, bevelEnabled: false, curveSegments: 1 }).translate(0, 0, -BRIDGE.w / 2);
    const ps = new THREE.Shape(); ps.moveTo(-L2, 0);
    for (let k = 0; k <= 16; k++) { const x = -L2 + (k / 16) * 2 * L2; ps.lineTo(x, bridgeY(x + (BRIDGE.x0 + BRIDGE.x1) / 2) + 0.32); }
    for (let k = 16; k >= 0; k--) { const x = -L2 + (k / 16) * 2 * L2; ps.lineTo(x, bridgeY(x + (BRIDGE.x0 + BRIDGE.x1) / 2)); }
    const parapet = new THREE.ExtrudeGeometry(ps, { depth: 0.16, bevelEnabled: false, curveSegments: 1 });
    // windmill
    const millTower = new THREE.CylinderGeometry(0.75, 1.15, 3.6, 8).translate(0, 1.8, 0);
    const millCap = new THREE.ConeGeometry(0.95, 1.0, 8).translate(0, 4.1, 0);
    const blade = mergeFlat([tint(new THREE.BoxGeometry(0.12, 2.3, 0.04).translate(0, 1.15, 0), '#6B4A33'), tint(new THREE.BoxGeometry(0.7, 1.9, 0.03).translate(0.38, 1.3, 0), '#F3EBDD')]);
    const hill = new THREE.IcosahedronGeometry(1, 1).scale(4.2, 1.3, 4.2);
    const lampPost = new THREE.CylinderGeometry(0.04, 0.05, 1.3, 6).translate(0, 0.65, 0);
    const lampBall = new THREE.SphereGeometry(0.12, 10, 8).translate(0, 1.36, 0);
    const disc = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    return { box, pine, round, trunk, car, person, boat, bridge, parapet, millTower, millCap, blade, hill, lampPost, lampBall, disc, roof: roofGeo() };
  }, []);

  // ---- houses (walls, roofs, chimneys, windows)
  const H = L.houses;
  const walls = useInstanced(geo.box, M.wall, H.length, { cast: true, receive: true, colors: true });
  const roofs = useInstanced(geo.roof, M.roof, H.length, { cast: true, receive: true, colors: true });
  const chims = useInstanced(geo.box, M.stone, H.length, { cast: true });
  const winSpots = useMemo(() => {
    const out: { p: THREE.Vector3; ry: number; house: number; s: Vec3 }[] = [];
    const e = new THREE.Euler();
    H.forEach((h, i) => {
      const q = new THREE.Quaternion().setFromEuler(e.set(0, h.ry, 0));
      const nx = Math.max(1, Math.floor(h.s[0] / 0.75)), floors = h.s[1] > 2.4 ? 3 : 1;
      for (const side of [-1, 1]) for (let fl = 0; fl < floors; fl++) for (let k = 0; k < nx; k++) {
        const lx = (k + 0.5) / nx * h.s[0] - h.s[0] / 2, ly = floors > 1 ? 0.8 + fl * 1.0 : h.s[1] * 0.55;
        const lp = new THREE.Vector3(lx, ly, side * (h.s[2] / 2 + 0.012)).applyQuaternion(q).add(new THREE.Vector3(h.p[0], 0, h.p[2]));
        out.push({ p: lp, ry: h.ry, house: i, s: [0.28, 0.34, 0.03] });
      }
    });
    return out;
  }, [H]);
  const wins = useInstanced(geo.box, M.win, winSpots.length, { colors: true });
  const winGlowGeo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(winSpots.length * 3), 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(winSpots.length * 3), 3)); return g; }, [winSpots]);
  useMemo(() => {
    const c = new THREE.Color();
    H.forEach((h, i) => {
      setInst(walls, i, [h.p[0], h.s[1] / 2, h.p[2]], h.s, h.ry); walls.setColorAt(i, c.set(h.wall));
      const rh = Math.min(1.3, h.s[2] * 0.62);
      setInst(roofs, i, [h.p[0], h.s[1], h.p[2]], [h.s[0] + 0.26, rh, h.s[2] + 0.3], h.ry); roofs.setColorAt(i, c.set(h.roof));
      const cx = h.p[0] + Math.cos(h.ry) * h.s[0] * 0.28, cz = h.p[2] - Math.sin(h.ry) * h.s[0] * 0.28;
      setInst(chims, i, [cx, h.s[1] + rh * 0.62, cz], h.chimney ? [0.26, 0.8, 0.26] : [0, 0, 0], h.ry);
    });
    [walls, roofs, chims].forEach((m) => doneInst(m, true));
  }, [H, walls, roofs, chims]);
  {
    const c = new THREE.Color(), off = new THREE.Color('#3E4A5C'), on = new THREE.Color('#FFC266'), pa = winGlowGeo.attributes.position as THREE.BufferAttribute, ca = winGlowGeo.attributes.color as THREE.BufferAttribute;
    const dayGlass = new THREE.Color(mixHex('#5E7FA0', '#2E3850', T.d));
    winSpots.forEach((w, i) => {
      const h = H[w.house], lit = clamp((f - h.on) / 3) * (0.75 + 0.25 * ((i * 7) % 5) / 4);
      setInst(wins, i, [w.p.x, w.p.y, w.p.z], w.s, w.ry);
      c.copy(dayGlass).lerp(off, 0).lerp(on, lit).multiplyScalar(1 + 1.4 * lit);
      wins.setColorAt(i, c);
      pa.setXYZ(i, w.p.x, w.p.y, w.p.z); ca.setXYZ(i, 1 * lit, 0.7 * lit, 0.35 * lit);
    });
    pa.needsUpdate = true; ca.needsUpdate = true; winGlowGeo.computeBoundingSphere();
    doneInst(wins, true);
  }

  // ---- trees (sway gently)
  const TR = L.trees;
  const pines = useInstanced(geo.pine, M.leaf, TR.length, { cast: true, receive: true, colors: true });
  const rounds = useInstanced(geo.round, M.leaf, TR.length, { cast: true, receive: true, colors: true });
  const trunks = useInstanced(geo.trunk, M.trunk, TR.length, { cast: true });
  {
    const c = new THREE.Color();
    TR.forEach((t, i) => {
      const sway = 0.035 * Math.sin(f / 14 + t.ph);
      setInst(pines, i, t.p, t.kind === 0 ? [t.s, t.s * 1.1, t.s] : [0, 0, 0], t.ph, sway, sway * 0.6);
      setInst(rounds, i, t.p, t.kind === 1 ? [t.s, t.s, t.s] : [0, 0, 0], t.ph, sway, sway * 0.6);
      setInst(trunks, i, t.p, [t.s, t.s, t.s], t.ph);
      pines.setColorAt(i, c.set(t.col)); rounds.setColorAt(i, c.set(t.col));
    });
    [pines, rounds, trunks].forEach((m) => doneInst(m, true));
  }

  // ---- traffic: cars on the roads, people on the paths, a boat on the river
  const CARS = useMemo(() => [
    { c: ROAD, u0: 0.05, v: 0.0021, col: '#E0463C', lane: 0.45 }, { c: ROAD, u0: 0.55, v: -0.0018, col: '#3C7DD9', lane: -0.45 },
    { c: ROAD, u0: 0.82, v: 0.002, col: '#F2C230', lane: 0.45 }, { c: RING, u0: 0.1, v: 0.0024, col: '#F7F4EC', lane: 0 },
    { c: RING, u0: 0.6, v: 0.0024, col: '#47A36B', lane: 0 }, { c: LANE, u0: 0.2, v: 0.0026, col: '#E07B2C', lane: 0 },
  ], []);
  const cars = useInstanced(geo.car, M.paint, CARS.length, { cast: true, colors: true });
  const carLights: number[] = [];
  {
    const c = new THREE.Color();
    CARS.forEach((k, i) => {
      const closed = k.c === RING;
      let u = k.u0 + k.v * f; u = closed ? ((u % 1) + 1) % 1 : ((u % 1) + 1) % 1;
      const p = k.c.getPointAt(u), t = k.c.getTangentAt(u).multiplyScalar(Math.sign(k.v));
      const nx = -t.z, nz = t.x, y = roadY(k.c, p) + 0.035;
      const px = p.x + nx * k.lane, pz = p.z + nz * k.lane;
      setInst(cars, i, [px, y + (k.c === ROAD ? bridgeY(px) - bridgeY(p.x) : 0), pz], [1, 1, 1], Math.atan2(-t.z, t.x));
      cars.setColorAt(i, c.set(k.col));
      carLights.push(px + t.x * 0.52, y + 0.3, pz + t.z * 0.52);
    });
    doneInst(cars, true);
  }
  const PEOPLE = useMemo(() => {
    const r = mulberry32(808), cols = ['#E2574C', '#3A6FB0', '#F2B33D', '#5BAA6A', '#8B5FBF', '#EDEDED', '#2F3A4A'];
    return Array.from({ length: 22 }, (_, i) => ({ c: [PROM, RING, MILLPATH, ROAD, LANE][i % 5], u0: r(), v: (r() < 0.5 ? -1 : 1) * (0.0006 + r() * 0.0006), side: (r() < 0.5 ? -1 : 1) * (i % 5 === 3 ? 1.15 : i % 5 === 1 ? 1.0 : 0.25), col: cols[Math.floor(r() * cols.length)], ph: r() * 6 }));
  }, []);
  const people = useInstanced(geo.person, M.paint, PEOPLE.length, { cast: true, colors: true });
  {
    const c = new THREE.Color();
    PEOPLE.forEach((pp, i) => {
      const u = (((pp.u0 + pp.v * f) % 1) + 1) % 1, p = pp.c.getPointAt(u), t = pp.c.getTangentAt(u).multiplyScalar(Math.sign(pp.v));
      const x = p.x - t.z * pp.side, z = p.z + t.x * pp.side, bob = Math.abs(Math.sin(f * 0.55 + pp.ph)) * 0.05;
      setInst(people, i, [x, (pp.c === ROAD ? bridgeY(x) : 0) + 0.03 + bob, z], [1, 1, 1], Math.atan2(t.x, t.z));
      people.setColorAt(i, c.set(pp.col));
    });
    doneInst(people, true);
  }
  const boatZ = lerp(-15, -3.5, f / dur), boatX = riverX(boatZ), boatAng = Math.atan2(-1, 3.4 * 0.16 * Math.cos(boatZ * 0.16 + 0.6));

  // ---- lamps (+ glow, ground pools) — all ignite on beat 6, cascading out from the bridge
  const lampOn = L.lamps.map((l) => smootherStep(invLerp(90 + Math.min(4, Math.hypot(l[0] - 4.5, l[2] - 2.4) * 0.25), 93 + Math.min(4, Math.hypot(l[0] - 4.5, l[2] - 2.4) * 0.25), f)));
  const lampGlowGeo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(L.lamps.flatMap((l) => [l[0], l[1] + 1.36, l[2]]), 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(L.lamps.length * 3), 3)); return g; }, [L]);
  {
    const ca = lampGlowGeo.attributes.color as THREE.BufferAttribute;
    lampOn.forEach((o, i) => ca.setXYZ(i, 1.5 * o, 1.12 * o, 0.62 * o));
    ca.needsUpdate = true;
  }
  // string lights along both bridge parapets (+ their glints on the water), lit from the middle out on beat 6
  const strings = useMemo(() => {
    const cx = (BRIDGE.x0 + BRIDGE.x1) / 2, L2 = (BRIDGE.x1 - BRIDGE.x0) / 2, p: number[] = [], w: number[] = [], k: number[] = [];
    for (const zs of [-1, 1]) for (let i = 0; i <= 18; i++) {
      const x = cx - L2 + (i / 18) * 2 * L2, y = bridgeY(x) + 0.4, z = BRIDGE.z + zs * (BRIDGE.w / 2 - 0.08);
      p.push(x, y, z); k.push(Math.abs(i - 9) / 9);
      if (Math.abs(x - riverX(z)) < riverW(z)) w.push(x, -0.33, z + zs * 0.9);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(p.length), 3));
    const gw = new THREE.BufferGeometry(); gw.setAttribute('position', new THREE.Float32BufferAttribute(w, 3));
    return { g, gw, k };
  }, []);
  {
    const ca = strings.g.attributes.color as THREE.BufferAttribute;
    strings.k.forEach((kk, i) => { const o = smootherStep(invLerp(90 + kk * 4, 92 + kk * 4, f)) * (0.85 + 0.15 * Math.sin(f * 0.9 + i)); ca.setXYZ(i, 1.4 * o, 1.0 * o, 0.55 * o); });
    ca.needsUpdate = true;
  }
  const carGlowGeo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(CARS.length * 3), 3)); return g; }, [CARS]);
  (carGlowGeo.attributes.position as THREE.BufferAttribute).set(carLights); carGlowGeo.attributes.position.needsUpdate = true; carGlowGeo.computeBoundingSphere();

  // water: colour follows the sky; little moving glints
  M.water.color.set(ramp(['#58B3D6', '#5FA8CC', '#7690B6', '#283E6E'], T.d));
  M.water.emissive.set(ramp(['#000000', '#08121E', '#141A30', '#0A1A40'], T.d));

  const millRot = f * 0.05;
  return (
    <group>
      <mesh geometry={terr.ground} material={M.ground} receiveShadow castShadow />
      <mesh geometry={terr.water} material={M.water} receiveShadow />
      {terr.cuts.map((g, i) => <mesh key={i} geometry={g} material={M.waterCut} />)}
      <mesh geometry={roads.road} material={M.asphalt} receiveShadow />
      <mesh geometry={roads.ring} material={M.asphalt} receiveShadow />
      <mesh geometry={roads.lane} material={M.path} receiveShadow />
      <mesh geometry={roads.prom} material={M.path} receiveShadow />
      <mesh geometry={roads.mill} material={M.path} receiveShadow />
      {/* bridge */}
      <group position={[(BRIDGE.x0 + BRIDGE.x1) / 2, 0, BRIDGE.z]}>
        <mesh geometry={geo.bridge} material={M.stone} castShadow receiveShadow />
        <mesh geometry={geo.parapet} material={M.stone} position={[0, 0, BRIDGE.w / 2 - 0.16]} castShadow />
        <mesh geometry={geo.parapet} material={M.stone} position={[0, 0, -BRIDGE.w / 2]} castShadow />
      </group>
      {/* windmill hill */}
      <mesh geometry={geo.hill} position={[-13.5, -0.25, 13.5]} castShadow receiveShadow>
        <meshStandardMaterial attach="material" color="#6CAB45" flatShading roughness={0.95} />
      </mesh>
      <group position={[-13.5, 1.0, 13.5]} rotation={[0, 0.12, 0]}>
        <mesh geometry={geo.millTower} material={M.wall} castShadow receiveShadow />
        <mesh geometry={geo.millCap} castShadow><meshStandardMaterial attach="material" color="#9C4A3A" flatShading /></mesh>
        <group position={[0, 3.75, 0.95]} rotation={[0, 0, millRot]}>
          {[0, 1, 2, 3].map((k) => <mesh key={k} geometry={geo.blade} material={M.paint} rotation={[0, 0, (k * Math.PI) / 2]} castShadow />)}
        </group>
      </group>
      <primitive object={walls} />
      <primitive object={roofs} />
      <primitive object={chims} />
      <primitive object={wins} />
      <primitive object={pines} />
      <primitive object={rounds} />
      <primitive object={trunks} />
      <primitive object={cars} />
      <primitive object={people} />
      <group position={[boatX, -0.36, boatZ]} rotation={[0, boatAng, 0]}>
        <mesh geometry={geo.boat} material={M.paint} castShadow />
      </group>
      {L.lamps.map((l, i) => (
        <group key={i} position={l}>
          <mesh geometry={geo.lampPost} material={M.dark} castShadow />
          <mesh geometry={geo.lampBall}><meshBasicMaterial attach="material" color={mixHex('#C9C2B0', '#FFE2A8', lampOn[i])} toneMapped={false} /></mesh>
          <mesh geometry={geo.disc} position={[0, 0.05, 0]} scale={[5.6, 1, 5.6]} visible={lampOn[i] > 0.01}>
            <meshBasicMaterial attach="material" map={glow} color="#FFB45E" transparent opacity={0.9 * lampOn[i]} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <points geometry={lampGlowGeo}>
        <pointsMaterial map={glow} vertexColors size={5.2 + 3.2 * T.wow} sizeAttenuation transparent depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </points>
      <points geometry={strings.g}>
        <pointsMaterial map={glow} vertexColors size={0.95} sizeAttenuation transparent depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </points>
      <points geometry={strings.gw} visible={T.lampsOn > 0}>
        <pointsMaterial map={glow} color="#FFB066" size={1.8} sizeAttenuation transparent opacity={0.55 * T.lampsOn} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </points>
      <points geometry={winGlowGeo}>
        <pointsMaterial map={glow} vertexColors size={1.3} sizeAttenuation transparent depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </points>
      <points geometry={carGlowGeo} visible={T.d > 0.55}>
        <pointsMaterial map={glow} color="#FFF1C9" size={0.7} sizeAttenuation transparent opacity={clamp((T.d - 0.55) * 3)} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
};
