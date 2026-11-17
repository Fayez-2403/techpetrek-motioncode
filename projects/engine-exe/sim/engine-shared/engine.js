// ENGINE.EXE geometry: a generic single-cylinder, air-cooled, SOHC two-valve motorcycle engine built from code in
// millimetres (engine space: crank axis z, cylinder +y, exhaust side +x). Nothing here moves by itself:
// update(state, ops) poses every part from engineStateAt() (kin.js), so the parts, the dashboard and the charts read
// one model. The cam lobes are not drawn by eye: each profile is generated from the valve-lift curve through the
// rocker geometry (the roller's path, then its envelope), so the roller rides the lobe at every angle.
import * as THREE from 'three';
import {rng} from 'teardown-kit/util.js';
import {CONFIG} from './config.js';
import {DECK, R, mod, valveLift} from './kin.js';

const V3 = THREE.Vector3;
const D2R = Math.PI / 180;
const smoother = (x) => {
  const u = Math.min(1, Math.max(0, x));
  return u * u * u * (u * (u * 6 - 15) + 10);
};

// ------------------------------------------------------------ layout constants (mm)
export const CAM_Y = 262; // camshaft centre above the crank axis
export const CHAIN_Z = -38; // plane of the timing chain and sprockets (left side, with the flywheel)
export const DOME = {cy: 131, r: 40}; // combustion-chamber roof: a sphere cap over the bore
export const PLUG = {at: [0, 166, 16], dir: [0, 0.5, 0.866]}; // spark-plug electrode and axis (right side)
const HEAD_TOP = 236; // top of the head casting; the cover sits on it and holds the cam and rockers
const SEAT_Y = 168;
const SEAT_X = 12;
const VALVE_Z = 7;
const STEM = 92; // seat face to stem tip
const ROLLER = 4;
const ARM_B = 20; // rocker: pivot to valve end
const sprR = (teeth) => CONFIG.sprocket.pitch / (2 * Math.sin(Math.PI / teeth));
export const R_CRANK_SPR = sprR(CONFIG.sprocket.crankTeeth);
export const R_CAM_SPR = sprR(CONFIG.sprocket.camTeeth);

/** The fixed geometry of one valve's train: seat, tip, rocker pivot, roller, ratio. kind: 'intake' | 'exhaust'. */
export function valveGeom(kind) {
  const s = kind === 'intake' ? -1 : 1; // intake on the -x side
  const v = CONFIG.valves[kind];
  const t = v.tilt * D2R;
  const a = [s * Math.sin(t), Math.cos(t)]; // stem axis, seat → tip
  const S = [s * SEAT_X, SEAT_Y];
  const T = [S[0] + STEM * a[0], S[1] + STEM * a[1]];
  // the pivot sits on the line through the tip square to the stem, toward the cam: the rocker's valve end then
  // moves along the stem, and lift = ARM_B · sin β exactly
  const n = [-s * a[1], s * a[0]];
  const P = [T[0] + ARM_B * n[0], T[1] + ARM_B * n[1]];
  // the roller sits where the rocker arm is tangent to the base circle (+ roller), on the upper side
  const K = [0, CAM_Y];
  const rho = CONFIG.camBaseRadius + ROLLER;
  const dx = P[0] - K[0];
  const dy = P[1] - K[1];
  const d = Math.hypot(dx, dy);
  const b0 = Math.atan2(dy, dx);
  const al = Math.acos(rho / d);
  const c1 = b0 + al;
  const c2 = b0 - al;
  const cA = Math.sin(c1) > Math.sin(c2) ? c1 : c2;
  const C0 = [K[0] + rho * Math.cos(cA), K[1] + rho * Math.sin(cA)];
  const armA = Math.hypot(C0[0] - P[0], C0[1] - P[1]);
  return {kind, s, v, a, S, T, P, K, C0, armA, armB: ARM_B, ratio: ARM_B / armA, z: s * VALVE_Z, sign: -s, headR: v.headDia / 2};
}
/** rocker rotation (radians, about z through the pivot) for a valve lift in mm */
export const rockerBeta = (g, lift) => g.sign * Math.asin(Math.min(1, lift / g.armB));
const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
/** roller centre in engine space at crank angle th */
export function rollerAt(g, th) {
  const b = rockerBeta(g, valveLift(mod(th, 720), g.v));
  const r0 = [g.C0[0] - g.P[0], g.C0[1] - g.P[1]];
  const r1 = rot(r0, b);
  return [g.P[0] + r1[0], g.P[1] + r1[1]];
}
/** the lobe profile in the cam's own frame (the cam turns by -θ/2): the inner envelope of the roller */
export function lobeProfile(g, n = 720) {
  const pitch = [];
  for (let i = 0; i < n; i++) {
    const th = (i / n) * 720;
    const c = rollerAt(g, th);
    pitch.push(rot([c[0] - g.K[0], c[1] - g.K[1]], (th / 2) * D2R));
  }
  const out = [];
  for (let i = 0; i < n; i++) {
    const p0 = pitch[(i - 1 + n) % n];
    const p1 = pitch[(i + 1) % n];
    let tx = p1[0] - p0[0];
    let ty = p1[1] - p0[1];
    const l = Math.hypot(tx, ty) || 1;
    tx /= l;
    ty /= l;
    // outward normal: perpendicular to the tangent, away from the cam centre
    let nx = ty;
    let ny = -tx;
    const q = pitch[i];
    if (nx * q[0] + ny * q[1] < 0) {
      nx = -nx;
      ny = -ny;
    }
    out.push([q[0] - ROLLER * nx, q[1] - ROLLER * ny]);
  }
  return out;
}

// ------------------------------------------------------------ the timing chain's path round both sprockets
export function chainPath(camY) {
  const r1 = R_CRANK_SPR;
  const r2 = R_CAM_SPR;
  const D = camY;
  const al = Math.asin((r2 - r1) / D);
  const straight = Math.sqrt(D * D - (r2 - r1) ** 2);
  const a1 = r1 * (Math.PI - 2 * al);
  const a2 = r2 * (Math.PI + 2 * al);
  const total = 2 * straight + a1 + a2;
  const nR = [Math.cos(al), -Math.sin(al)];
  const nL = [-Math.cos(al), -Math.sin(al)];
  const A = [r2 * nR[0], D + r2 * nR[1]];
  const B = [r1 * nR[0], r1 * nR[1]];
  const Cc = [r1 * nL[0], r1 * nL[1]];
  const Dd = [r2 * nL[0], D + r2 * nL[1]];
  const dR = [(B[0] - A[0]) / straight, (B[1] - A[1]) / straight];
  const dL = [(Dd[0] - Cc[0]) / straight, (Dd[1] - Cc[1]) / straight];
  /** point and tangent angle at distance s along the chain (s grows the way the chain runs: down the +x strand) */
  const at = (s) => {
    s = mod(s, total);
    if (s < straight) return [A[0] + dR[0] * s, A[1] + dR[1] * s, Math.atan2(dR[1], dR[0])];
    s -= straight;
    if (s < a1) {
      const g = -al - s / r1;
      return [r1 * Math.cos(g), r1 * Math.sin(g), g - Math.PI / 2];
    }
    s -= a1;
    if (s < straight) return [Cc[0] + dL[0] * s, Cc[1] + dL[1] * s, Math.atan2(dL[1], dL[0])];
    s -= straight;
    const g = Math.PI + al - s / r2;
    return [r2 * Math.cos(g), D + r2 * Math.sin(g), g - Math.PI / 2];
  };
  return {total, at};
}

// ------------------------------------------------------------ geometry helpers
function gearGeo(teeth, rPitch, width, holeR = 0) {
  const rOut = rPitch + 2.6;
  const rRoot = rPitch - 2.6;
  const sh = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const da = (Math.PI * 2) / teeth;
    const pts = [
      [rRoot, a0],
      [rRoot, a0 + da * 0.22],
      [rOut, a0 + da * 0.38],
      [rOut, a0 + da * 0.58],
      [rRoot, a0 + da * 0.74],
    ];
    pts.forEach(([r, a], k) => (i === 0 && k === 0 ? sh.moveTo(r * Math.cos(a), r * Math.sin(a)) : sh.lineTo(r * Math.cos(a), r * Math.sin(a))));
  }
  sh.closePath();
  if (holeR) {
    const h = new THREE.Path();
    h.absarc(0, 0, holeR, 0, Math.PI * 2, true);
    sh.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(sh, {depth: width, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.5, bevelSegments: 1, curveSegments: 4});
  g.translate(0, 0, -width / 2);
  g.computeVertexNormals();
  return g;
}
function roundRect(path, x0, y0, x1, y1, r) {
  path.moveTo(x0 + r, y0);
  path.lineTo(x1 - r, y0);
  path.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
  path.lineTo(x1, y1 - r);
  path.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  path.lineTo(x0 + r, y1);
  path.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  path.lineTo(x0, y0 + r);
  path.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  return path;
}
// a horizontal plate (normal +y) of a rounded rectangle in x and z, thickness t, with the bore + chain-tunnel hole.
// Shape coordinates are (x, -z) because the plate is laid down with rotateX(-90°).
function plateGeo(w, d, r, t, hole = 'keyhole', zOff = 0) {
  const sh = roundRect(new THREE.Shape(), -w / 2, -d / 2 - zOff, w / 2, d / 2 - zOff, r);
  if (hole) {
    const H = new THREE.Path();
    const hr = 35;
    if (hole === 'bore') H.absarc(0, 0, hr, 0, Math.PI * 2, true);
    else {
      // the bore and the cam-chain tunnel on the -z side, as one outline (shape y = -z, so +z_pt lands at -z)
      const z0 = 28;
      const z1 = 47;
      const tw = 42;
      const t0 = Math.asin(z0 / hr);
      const t1 = Math.PI - t0;
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const a = t1 + ((t0 + Math.PI * 2 - t1) * i) / 40;
        pts.push([hr * Math.cos(a), hr * Math.sin(a)]);
      }
      pts.push([tw, z0], [tw, z1], [-tw, z1], [-tw, z0]);
      pts.forEach(([x, z], i) => (i ? H.lineTo(x, z) : H.moveTo(x, z)));
      H.closePath();
    }
    sh.holes.push(H);
  }
  const g = new THREE.ExtrudeGeometry(sh, {depth: t, bevelEnabled: true, bevelThickness: Math.min(0.6, t / 4), bevelSize: 0.6, bevelSegments: 1, curveSegments: 6});
  g.rotateX(-Math.PI / 2);
  return g;
}
function helixGeo(r, wire, turns, len, seg = 200) {
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const u = i / seg;
    const a = u * turns * Math.PI * 2;
    pts.push(new V3(Math.cos(a) * r, u * len, Math.sin(a) * r));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, wire, 6, false);
}
const lathe = (pts, seg = 64) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
// a cylinder whose axis runs along z
const zCyl = (r, len, seg = 32, z = 0) => new THREE.CylinderGeometry(r, r, len, seg).rotateX(Math.PI / 2).translate(0, 0, z);
// a box between two points in the xy plane, width w (in-plane), depth dz
function barGeo(p0, p1, w, dz) {
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const len = Math.hypot(dx, dy);
  const g = new THREE.BoxGeometry(len, w, dz);
  g.rotateZ(Math.atan2(dy, dx));
  g.translate((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, 0);
  return g;
}
function brushed() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  const r = rng(4021);
  g.fillStyle = '#8c8c8c';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1600; i++) {
    const v = Math.round(100 + r() * 90);
    g.fillStyle = `rgba(${v},${v},${v},${(0.2 + r() * 0.4).toFixed(2)})`;
    const x = r() * 256;
    const y = r() * 256;
    const w = 40 + r() * 180;
    const h = 0.5 + r() * 0.9;
    g.fillRect(x, y, w, h);
    g.fillRect(x - 256, y, w, h);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / 48, 1 / 48);
  return t;
}

// the parts a visitor can isolate, in panel order, with what they do
export const PARTS = {
  piston: {name: 'Piston', sub: 'ALUMINIUM · 3 RINGS', text: 'Seals the cylinder and turns gas pressure into force on the wrist pin. Two compression rings and an oil ring keep the gas above it and the oil below.'},
  rod: {name: 'Connecting rod', sub: `L = ${CONFIG.rod} MM`, text: 'Links the wrist pin to the crank pin, so the straight stroke of the piston becomes rotation. Its angle swings either side of the bore axis.'},
  crank: {name: 'Crankshaft', sub: `r = ${CONFIG.stroke / 2} MM`, text: `Two flywheel webs carry the crank pin ${CONFIG.stroke / 2} mm off the axis: the crank radius r. The rod pushes on the pin, the crank turns, and the stroke is 2r = ${CONFIG.stroke} mm.`},
  cam: {name: 'Camshaft', sub: 'HALF CRANK SPEED', text: `Driven by the chain through ${CONFIG.sprocket.crankTeeth} : ${CONFIG.sprocket.camTeeth} sprockets, it turns once every two crank turns. Each lobe's shape is the valve's timing: it opens one valve per cycle through a rocker.`},
  intake: {name: 'Intake valve', sub: `OPENS ${CONFIG.valves.intake.open}° · CLOSES ${CONFIG.valves.intake.close}°`, text: 'Lets the air-fuel charge in. It opens 10° before TDC and closes 40° after BDC, so the incoming charge keeps filling the cylinder as the piston starts back up.'},
  exhaust: {name: 'Exhaust valve', sub: `OPENS ${CONFIG.valves.exhaust.open}° · CLOSES ${CONFIG.valves.exhaust.close}°`, text: 'Lets the burned gas out. It opens 40° before BDC, near the end of the power stroke, and closes 10° after TDC, overlapping the intake valve.'},
  head: {name: 'Cylinder head', sub: 'CHAMBER · PORTS · FINS', text: 'Holds the combustion chamber, the intake and exhaust ports, both valves and the overhead camshaft. Its fins shed the heat of combustion into the passing air.'},
  flywheel: {name: 'Flywheel', sub: 'STORES THE PULSE', text: 'Stores energy from the one power stroke in every two turns and carries the crank through intake, compression and exhaust. On a motorcycle it is usually the magneto rotor as well.'},
};
export const PART_KEYS = Object.keys(PARTS);

export function buildEngine() {
  const root = new THREE.Group();
  const tex = brushed();
  // mechanism (M) and housing (H) materials are separate so cutaway, x-ray and isolation can treat them apart
  const M = {
    steel: new THREE.MeshStandardMaterial({color: '#c4c8cd', roughness: 0.32, metalness: 1}),
    rod: new THREE.MeshStandardMaterial({color: '#6c7178', roughness: 0.36, metalness: 0.95}),
    piston: new THREE.MeshStandardMaterial({color: '#d8dade', roughness: 0.3, metalness: 0.85, clippingPlanes: [], side: THREE.DoubleSide}),
    ring: new THREE.MeshStandardMaterial({color: '#2b2d31', roughness: 0.45, metalness: 0.7}),
    dark: new THREE.MeshStandardMaterial({color: '#34373c', roughness: 0.42, metalness: 0.6}),
    spring: new THREE.MeshStandardMaterial({color: '#4a4e55', roughness: 0.38, metalness: 0.85}),
    copper: new THREE.MeshStandardMaterial({color: '#c46a32', roughness: 0.34, metalness: 1}),
    ceramic: new THREE.MeshPhysicalMaterial({color: '#f1eee8', roughness: 0.32, metalness: 0, clearcoat: 0.5}),
    rubber: new THREE.MeshStandardMaterial({color: '#232427', roughness: 0.78, metalness: 0}),
    chain: new THREE.MeshStandardMaterial({color: '#80858d', roughness: 0.34, metalness: 1}),
  };
  const H = {
    alu: new THREE.MeshStandardMaterial({color: '#c3c6cb', roughness: 0.46, metalness: 0.88, roughnessMap: tex, side: THREE.DoubleSide}),
    graphite: new THREE.MeshPhysicalMaterial({color: '#30333a', roughness: 0.48, metalness: 0.45, clearcoat: 0.35, clearcoatRoughness: 0.4, side: THREE.DoubleSide}),
    liner: new THREE.MeshStandardMaterial({color: '#62666d', roughness: 0.4, metalness: 0.8, side: THREE.DoubleSide}),
    chamber: new THREE.MeshStandardMaterial({color: '#8d9096', roughness: 0.5, metalness: 0.7, side: THREE.DoubleSide}),
    pipe: new THREE.MeshStandardMaterial({color: '#5f636a', roughness: 0.3, metalness: 0.92, side: THREE.DoubleSide}),
    rubber: new THREE.MeshStandardMaterial({color: '#26272a', roughness: 0.8, metalness: 0, side: THREE.DoubleSide}),
    steel: new THREE.MeshStandardMaterial({color: '#b9bdc3', roughness: 0.34, metalness: 1, side: THREE.DoubleSide}),
  };
  // the cutaway plane: keeps z <= constant. Always attached (pushed far away when off) so no shader recompiles.
  const CLIP = new THREE.Plane(new V3(0, 0, -1), 10);
  for (const m of Object.values(H)) m.clippingPlanes = [CLIP];
  // double-sided shells cast from their back faces only (no shadow acne on the lit face)
  for (const m of [...Object.values(H), M.piston]) m.shadowSide = THREE.BackSide;
  M.piston.clippingPlanes = [CLIP];

  const meshes = [];
  const add = (parent, geo, mat, part, opts = {}) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = opts.cast ?? true;
    m.receiveShadow = true;
    m.userData.part = part;
    m.userData.housing = Object.values(H).includes(mat);
    m.userData.mat0 = mat;
    parent.add(m);
    meshes.push(m);
    return m;
  };
  const group = (parent = root) => {
    const g = new THREE.Group();
    parent.add(g);
    return g;
  };
  const anchor = (parent, x, y, z) => {
    const o = new THREE.Object3D();
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };
  const A = {}; // callout anchors

  // ------------------------------------------------------------ crankcase: two vertical halves, side plates, generator cover
  const caseHalves = [-1, 1].map((side) => {
    const g = group();
    const ring = new THREE.Shape();
    const a0 = 125 * D2R;
    const a1 = (55 + 360) * D2R;
    ring.absarc(0, 0, 68, a0, a1, false);
    ring.absarc(0, 0, 62, a1, a0, true);
    ring.closePath();
    const rg = new THREE.ExtrudeGeometry(ring, {depth: 44, bevelEnabled: false, curveSegments: 40});
    if (side < 0) rg.translate(0, 0, -44);
    add(g, rg, H.graphite, 'case');
    const plate = new THREE.Shape();
    const c0 = Math.asin(52 / 68);
    plate.absarc(0, 0, 68, Math.PI - c0, Math.PI * 2 + c0, false);
    plate.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 0, 14, 0, Math.PI * 2, true);
    plate.holes.push(hole);
    const pg = new THREE.ExtrudeGeometry(plate, {depth: 4, bevelEnabled: true, bevelThickness: 1, bevelSize: 1.2, bevelSegments: 2, curveSegments: 40});
    pg.translate(0, 0, side > 0 ? 44 : -48);
    add(g, pg, H.graphite, 'case');
    // cover bolts round the side plate
    for (let k = 0; k < 9; k++) {
      const a = Math.PI + (k / 8) * Math.PI - Math.PI * 0.02;
      const b = add(g, new THREE.CylinderGeometry(3.6, 3.6, 3, 6).rotateX(Math.PI / 2), H.steel, 'case');
      b.position.set(Math.cos(a) * 60, Math.sin(a) * 60 - 2, side * 50);
    }
    return g;
  });
  const genCover = group();
  {
    const gc = lathe([[15, -76], [44, -76], [57, -73], [64, -66], [67, -56], [67, -48]], 56).rotateX(Math.PI / 2);
    // lathe y became z: the profile above is (radius, z)
    add(genCover, gc, H.graphite, 'case');
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + 0.3;
      const b = add(genCover, new THREE.CylinderGeometry(3.4, 3.4, 4, 6).rotateX(Math.PI / 2), H.steel, 'case');
      b.position.set(Math.cos(a) * 52, Math.sin(a) * 52, -76);
    }
  }
  A.case = anchor(caseHalves[1], 30, -55, 46);

  // ------------------------------------------------------------ crankshaft: two webs, crank pin, journals, sprocket
  const crank = group();
  const web = (() => {
    const sh = new THREE.Shape();
    sh.absarc(0, 0, 46, 0, Math.PI * 2, false);
    for (const a of [40, 140]) {
      const h = new THREE.Path();
      h.absarc(Math.cos(a * D2R) * 32, Math.sin(a * D2R) * 32 + 2, 6.5, 0, Math.PI * 2, true);
      sh.holes.push(h);
    }
    const g = new THREE.ExtrudeGeometry(sh, {depth: 13, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 1.2, bevelSegments: 2, curveSegments: 40});
    g.translate(0, 0, -6.5);
    return g;
  })();
  for (const z of [-17, 17]) add(crank, web, M.steel, 'crank').position.z = z;
  add(crank, zCyl(12, 21, 28), M.steel, 'crank').position.y = R; // crank pin
  add(crank, zCyl(12, 26, 28, 36), M.steel, 'crank'); // drive-side journal
  add(crank, zCyl(12, 50, 28, -48), M.steel, 'crank'); // generator-side journal
  add(crank, zCyl(9, 10, 20, -76), M.steel, 'crank');
  add(crank, gearGeo(CONFIG.sprocket.crankTeeth, R_CRANK_SPR, 6, 12), M.dark, 'crank').position.z = CHAIN_Z;
  A.crank = anchor(crank, 0, -30, 25);
  A.crankPin = anchor(crank, 0, R, 0);
  // main bearings: outer race, inner race and balls (stationary)
  for (const z of [-30, 30]) {
    add(root, new THREE.TorusGeometry(21, 3, 10, 40).translate(0, 0, z), M.steel, 'bearing');
    add(root, new THREE.TorusGeometry(14, 2, 8, 32).translate(0, 0, z), M.steel, 'bearing');
    const balls = new THREE.InstancedMesh(new THREE.SphereGeometry(3.3, 12, 8), M.steel, 10);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      balls.setMatrixAt(k, new THREE.Matrix4().makeTranslation(Math.cos(a) * 17.5, Math.sin(a) * 17.5, z));
    }
    balls.castShadow = true;
    balls.userData = {part: 'bearing', housing: false, mat0: M.steel};
    root.add(balls);
    meshes.push(balls);
  }

  // ------------------------------------------------------------ connecting rod
  const rod = group();
  {
    add(rod, zCyl(19, 16, 36), M.rod, 'rod');
    add(rod, zCyl(12.6, 16.6, 28), M.dark, 'rod'); // big-end bearing face
    const tr = new THREE.Shape();
    tr.moveTo(-8, 10);
    tr.lineTo(8, 10);
    tr.lineTo(5, CONFIG.rod - 6);
    tr.lineTo(-5, CONFIG.rod - 6);
    tr.closePath();
    const beam = new THREE.ExtrudeGeometry(tr, {depth: 10, bevelEnabled: true, bevelThickness: 1, bevelSize: 1, bevelSegments: 1});
    beam.translate(0, 0, -5);
    add(rod, beam, M.rod, 'rod');
    add(rod, zCyl(11, 14, 28, 0).translate(0, CONFIG.rod, 0), M.rod, 'rod');
    // bolts of the big-end cap
    for (const x of [-13, 13]) add(rod, new THREE.CylinderGeometry(2.6, 2.6, 30, 10).translate(x, 0, 0), M.steel, 'rod');
  }
  A.rod = anchor(rod, 0, CONFIG.rod * 0.45, 6);
  A.rodBig = anchor(rod, 0, 0, 0); // big-end centre
  A.rodSmall = anchor(rod, 0, CONFIG.rod, 0); // small-end centre

  // ------------------------------------------------------------ piston (its body is sectioned with the cutaway)
  const piston = group();
  {
    const ch = CONFIG.pistonCompressionHeight;
    const pr = CONFIG.bore / 2 - 0.2;
    add(piston, lathe([[0, ch + 0.8], [16, ch + 0.6], [pr, ch], [pr, -24], [pr - 3, -24], [pr - 3, ch - 6], [0, ch - 6]], 64), M.piston, 'piston');
    for (const y of [ch - 3.5, ch - 7, ch - 11]) {
      const r = add(piston, new THREE.TorusGeometry(pr + 0.05, 0.9, 6, 64), M.ring, 'piston');
      r.rotation.x = Math.PI / 2;
      r.position.y = y;
    }
    add(piston, zCyl(7.5, 46, 24), M.steel, 'piston'); // wrist pin
    for (const z of [-15, 15]) add(piston, zCyl(10.5, 10, 24, z), M.piston, 'piston'); // pin bosses
  }
  A.piston = anchor(piston, 0, CONFIG.pistonCompressionHeight - 4, CONFIG.bore / 2);
  A.pistonPin = anchor(piston, 0, 0, 0); // wrist-pin centre

  // ------------------------------------------------------------ cylinder barrel: liner, fins, base flange, studs
  const barrel = group();
  {
    add(barrel, lathe([[29, 56], [35, 56], [35, DECK], [29, DECK], [29, 56]], 64), H.alu, 'barrel');
    add(barrel, lathe([[28.95, 56], [29.05, 56], [29.05, DECK], [28.95, DECK], [28.95, 56]], 64), H.liner, 'barrel', {cast: false});
    add(barrel, plateGeo(100, 100, 10, 6).translate(0, 52, 0), H.alu, 'barrel');
    const fin = plateGeo(126, 124, 12, 2.4);
    for (let y = 66; y <= DECK - 6; y += 8.5) add(barrel, fin, H.alu, 'barrel').position.y = y;
    // the cam-chain tunnel's outer wall on -z
    add(barrel, new THREE.BoxGeometry(92, DECK - 54, 4).translate(0, (DECK + 54) / 2, -48), H.graphite, 'barrel');
  }
  A.fins = anchor(barrel, -62, 112, 40);

  // ------------------------------------------------------------ cylinder head: chamber, fins, ports, guides, plug
  const head = group();
  const vg = {intake: valveGeom('intake'), exhaust: valveGeom('exhaust')};
  {
    add(head, plateGeo(110, 104, 10, 3, 'keyhole').translate(0, DECK, 0), H.steel, 'head'); // gasket
    // the casting: a hull round the valve train, over the chamber
    const core = roundRect(new THREE.Shape(), -46, -41, 46, 41, 12);
    const cg = new THREE.ExtrudeGeometry(core, {depth: HEAD_TOP - DECK - 3, bevelEnabled: true, bevelThickness: 2, bevelSize: 2, bevelSegments: 2, curveSegments: 8});
    cg.rotateX(-Math.PI / 2);
    cg.translate(0, DECK + 3, 0);
    add(head, cg, H.alu, 'head');
    const fin = plateGeo(126, 124, 12, 2.4);
    for (let y = DECK + 8; y <= DECK + 52; y += 8.5) add(head, fin, H.alu, 'head').position.y = y;
    // the chamber roof
    const cap = Math.acos((DECK - DOME.cy) / DOME.r);
    add(head, new THREE.SphereGeometry(DOME.r, 48, 16, 0, Math.PI * 2, 0, cap).translate(0, DOME.cy, 0), H.chamber, 'head', {cast: false});
    add(head, new THREE.BoxGeometry(92, HEAD_TOP + 2 - 150, 4).translate(0, (HEAD_TOP + 2 + 150) / 2, -48), H.graphite, 'head');
    // ports: intake on -x (to the rear), exhaust on +x (to the front)
    const tube = (pts, r, mat, part = 'head') => add(head, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new V3(...p))), 48, r, 20, false), mat, part);
    tube([[-13, 173, -7], [-26, 186, -7], [-44, 195, -7], [-64, 198, -7]], 11, H.alu);
    tube([[13, 173, 7], [28, 185, 7], [46, 191, 7], [64, 191, 7]], 10, H.alu);
    // the exhaust header and the intake boot, both cut short (the rest of the bike is not modelled)
    tube([[62, 191, 7], [92, 186, 7], [114, 162, 7], [124, 110, 7], [126, 40, 7], [124, -8, 7]], 11.5, H.pipe, 'pipe');
    add(head, new THREE.TorusGeometry(13, 2.2, 8, 32).rotateY(Math.PI / 2).translate(66, 191, 7), H.steel, 'pipe');
    tube([[-62, 198, -7], [-88, 202, -7], [-112, 204, -7]], 15, H.rubber, 'boot');
    add(head, new THREE.TorusGeometry(15.6, 1.8, 8, 32).rotateY(Math.PI / 2).translate(-100, 203.4, -7), H.steel, 'boot');
    // valve guides and seats
    for (const g of Object.values(vg)) {
      const tilt = Math.atan2(g.a[0], g.a[1]);
      const guide = add(head, new THREE.CylinderGeometry(4.6, 4.6, 26, 16).translate(0, 34, 0), H.steel, 'head');
      guide.position.set(g.S[0], g.S[1], g.z);
      guide.rotation.z = -tilt;
      const seat = add(head, new THREE.TorusGeometry(g.headR - 0.4, 1.1, 8, 40).rotateX(Math.PI / 2), H.steel, 'head');
      seat.position.set(g.S[0], g.S[1] + 0.6, g.z);
      seat.rotation.z = -tilt;
    }
  }
  // head studs and nuts
  for (const [x, z] of [[-52, -54], [52, -54], [-52, 52], [52, 52]]) {
    add(barrel, new THREE.CylinderGeometry(3.6, 3.6, HEAD_TOP - 52, 10).translate(x, (52 + HEAD_TOP) / 2, z), H.steel, 'barrel');
    add(head, new THREE.CylinderGeometry(6.4, 6.4, 6, 6).translate(x, HEAD_TOP + 3, z), H.steel, 'head');
  }
  A.head = anchor(head, 58, DECK + 30, -48);
  A.exhaustPort = anchor(head, 60, 196, 7);
  A.intakePort = anchor(head, -60, 205, -7);

  // the spark plug: electrode in the chamber, body leaning out of the head on the -z side
  const plug = group(head);
  const PM = {steel: M.steel.clone(), copper: M.copper.clone(), ceramic: M.ceramic.clone(), rubber: M.rubber.clone()};
  for (const m of Object.values(PM)) m.clippingPlanes = [CLIP];
  {
    plug.position.set(...PLUG.at);
    plug.rotation.x = Math.atan2(PLUG.dir[2], PLUG.dir[1]);
    add(plug, new THREE.CylinderGeometry(0.9, 0.9, 3, 8).translate(0, -1, 0), PM.steel, 'plug');
    add(plug, new THREE.CylinderGeometry(5.6, 5.6, 19, 20).translate(0, 11.5, 0), PM.steel, 'plug');
    add(plug, new THREE.TorusGeometry(6.6, 1.2, 8, 24).rotateX(Math.PI / 2).translate(0, 21.5, 0), PM.copper, 'plug');
    add(plug, new THREE.CylinderGeometry(8.4, 8.4, 8, 6).translate(0, 26.5, 0), PM.steel, 'plug');
    add(plug, new THREE.CylinderGeometry(4.2, 5.4, 24, 20).translate(0, 42.5, 0), PM.ceramic, 'plug');
    add(plug, new THREE.CylinderGeometry(7.6, 7.6, 20, 20).translate(0, 60, 0), PM.rubber, 'plug');
  }
  A.plug = anchor(plug, 0, 62, 0);
  A.plugTip = anchor(plug, 0, 0, 0);

  // valves (move along their stems), retainers and springs
  const valves = {};
  for (const [kind, g] of Object.entries(vg)) {
    const tilt = Math.atan2(g.a[0], g.a[1]);
    const v = group(head);
    v.rotation.z = -tilt;
    const hr = g.headR;
    add(v, lathe([[0, -1.4], [hr, -1.4], [hr, 0.2], [hr - 1.8, 1.4], [4.2, 6.5], [2.75, 11], [2.75, STEM - 0.5], [2.2, STEM], [0, STEM]], 40), M.steel, kind);
    add(v, new THREE.CylinderGeometry(9.5, 7.5, 3.2, 24).translate(0, STEM - 9, 0), M.steel, kind); // retainer
    add(v, new THREE.CylinderGeometry(3.6, 3.0, 5, 12).translate(0, STEM - 6.5, 0), M.dark, kind); // collets
    const spring = group(head);
    spring.position.set(g.S[0] + 48 * g.a[0], g.S[1] + 48 * g.a[1], g.z);
    spring.rotation.z = -tilt;
    // built at its free length and squeezed along its axis by the lift
    add(spring, helixGeo(9.6, 1.35, 5.5, STEM - 9 - 1.6 - 48), M.spring, kind);
    const seat = add(head, new THREE.CylinderGeometry(10.5, 10.5, 1.6, 24), M.steel, kind);
    seat.position.copy(spring.position);
    seat.rotation.z = -tilt;
    valves[kind] = {g, v, spring, springLen0: STEM - 9 - 1.6 - 48};
    A[kind] = anchor(v, 0, 3, 0);
  }

  // ------------------------------------------------------------ camshaft assembly: cam, lobes, sprocket, rockers
  const camAsm = group();
  const cam = group(camAsm);
  cam.position.set(0, CAM_Y, 0);
  {
    add(cam, zCyl(8.5, 76, 24, -9), M.steel, 'cam');
    for (const g of Object.values(vg)) {
      const prof = lobeProfile(g);
      const sh = new THREE.Shape(prof.map(([x, y]) => new THREE.Vector2(x, y)));
      const lg = new THREE.ExtrudeGeometry(sh, {depth: 7.4, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.4, bevelSegments: 1, curveSegments: 4});
      lg.translate(0, 0, g.z - 3.7);
      add(cam, lg, M.steel, 'cam');
    }
    add(cam, gearGeo(CONFIG.sprocket.camTeeth, R_CAM_SPR, 6, 9), M.dark, 'chain').position.z = CHAIN_Z;
    // a copper timing dot on the sprocket, so its half-speed turn reads
    add(cam, new THREE.CylinderGeometry(2.6, 2.6, 1, 16).rotateX(Math.PI / 2).translate(0, R_CAM_SPR - 7, CHAIN_Z + 3.7), M.copper, 'chain', {cast: false});
    // cam bearings in the head
    for (const z of [-24, 24]) add(camAsm, zCyl(14, 7, 28, z).translate(0, CAM_Y, 0), M.dark, 'cambearing');
  }
  A.cam = anchor(cam, 0, 0, -30);
  const rockers = {};
  for (const [kind, g] of Object.entries(vg)) {
    add(camAsm, zCyl(4.6, 44, 16, 0).translate(g.P[0], g.P[1], 0), M.steel, 'rocker'); // rocker shaft
    const rk = group(camAsm);
    rk.position.set(g.P[0], g.P[1], g.z);
    const c = [g.C0[0] - g.P[0], g.C0[1] - g.P[1]];
    const t = [g.T[0] - g.P[0], g.T[1] - g.P[1]];
    // the pivot boss (thin enough for the lobe nose to pass), the roller held in a fork either side of the lobe
    add(rk, zCyl(5, 15, 24), M.dark, 'rocker');
    for (const dz of [-6, 6]) add(rk, barGeo([0, 0], c, 7, 3).translate(0, 0, dz), M.dark, 'rocker');
    add(rk, barGeo([0, 0], [t[0] * 0.86, t[1] * 0.86], 8, 9), M.dark, 'rocker');
    add(rk, zCyl(ROLLER, 9, 20).translate(c[0], c[1], 0), M.steel, 'rocker');
    // the adjuster screw over the valve tip, its foot exactly on the tip at rest
    const scr = add(rk, new THREE.CylinderGeometry(2.6, 2.6, 7, 12).translate(0, 3.5, 0), M.steel, 'rocker');
    scr.position.set(t[0], t[1], 0);
    scr.rotation.z = -Math.atan2(g.a[0], g.a[1]);
    rockers[kind] = {g, rk};
  }

  // ------------------------------------------------------------ head cover with the round tappet caps
  const cover = group();
  {
    const sh = roundRect(new THREE.Shape(), -56, -44, 56, 52, 14);
    const g = new THREE.ExtrudeGeometry(sh, {depth: 316 - HEAD_TOP - 6, bevelEnabled: true, bevelThickness: 4, bevelSize: 4, bevelSegments: 3, curveSegments: 10});
    g.rotateX(-Math.PI / 2);
    g.translate(0, HEAD_TOP + 6, 0);
    add(cover, g, H.graphite, 'cover');
    for (const s of [-1, 1]) {
      const c = add(cover, new THREE.CylinderGeometry(15, 15, 8, 32).rotateZ(Math.PI / 2), H.alu, 'cover');
      c.position.set(s * 62, 262, s * 7);
      const hx = add(cover, new THREE.CylinderGeometry(6, 6, 6, 6).rotateZ(Math.PI / 2), H.steel, 'cover');
      hx.position.set(s * 68, 262, s * 7);
    }
    for (const [x, z] of [[-40, -30], [40, -30], [-40, 36], [40, 36]]) add(cover, new THREE.CylinderGeometry(4.2, 4.2, 5, 6).translate(x, 322, z), H.steel, 'cover');
  }
  A.cover = anchor(cover, 30, 316, 30);

  // ------------------------------------------------------------ flywheel (magneto rotor) on the -z end
  const flywheel = group();
  flywheel.position.z = -60;
  {
    add(flywheel, lathe([[12, -7], [56, -7], [56, 7], [51, 7], [51, -3], [12, -3]], 64).rotateX(Math.PI / 2), M.steel, 'flywheel');
    add(flywheel, zCyl(16, 18, 32), M.dark, 'flywheel');
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const mg = add(flywheel, new THREE.BoxGeometry(16, 5, 9), M.dark, 'flywheel');
      mg.position.set(Math.cos(a) * 47, Math.sin(a) * 47, 2);
      mg.rotation.z = a + Math.PI / 2;
    }
    add(flywheel, new THREE.BoxGeometry(4, 9, 2).translate(0, 50, -8), M.copper, 'flywheel', {cast: false}); // timing mark
  }
  A.flywheel = anchor(flywheel, -40, -36, -8);

  // ------------------------------------------------------------ timing chain: link plates and rollers, instanced
  const path0 = chainPath(CAM_Y);
  const NL = Math.round(path0.total / CONFIG.sprocket.pitch);
  const plates = new THREE.InstancedMesh(new THREE.BoxGeometry(CONFIG.sprocket.pitch * 1.05, 4.2, 6.4), M.chain, NL);
  const rollers = new THREE.InstancedMesh(zCyl(2.3, 8, 10), M.dark, NL);
  for (const im of [plates, rollers]) {
    im.castShadow = true;
    im.userData = {part: 'chain', housing: false, mat0: im.material};
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    root.add(im);
    meshes.push(im);
  }
  A.chain = anchor(root, R_CAM_SPR * 0.62, 130, CHAIN_Z);

  // ------------------------------------------------------------ gas, fire, spark and flow arrows (never clipped)
  const fx = group();
  const chargeMat = new THREE.MeshBasicMaterial({color: '#4f8fd6', transparent: true, opacity: 0.35, depthWrite: false});
  const charge = new THREE.Mesh(new THREE.CylinderGeometry(28.4, 28.4, 1, 48), chargeMat);
  charge.renderOrder = 2;
  fx.add(charge);
  const capR = DOME.r - 0.6;
  const chargeCap = new THREE.Mesh(new THREE.SphereGeometry(capR, 40, 12, 0, Math.PI * 2, 0, Math.acos((DECK - DOME.cy) / capR)).translate(0, DOME.cy, 0), chargeMat);
  chargeCap.renderOrder = 2;
  fx.add(chargeCap);
  const fireMat = new THREE.MeshBasicMaterial({color: '#ff7a24', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending});
  const fire = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), fireMat);
  fire.renderOrder = 4;
  fx.add(fire);
  const sparkMat = new THREE.MeshBasicMaterial({color: '#cfe6ff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending});
  const spark = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), sparkMat);
  spark.renderOrder = 5;
  fx.add(spark);
  const fireLight = new THREE.PointLight('#ff8a3a', 0, 0.09, 2);
  fx.add(fireLight);
  const arrowGeo = new THREE.ConeGeometry(4.2, 11, 16).rotateZ(-Math.PI / 2); // points +x
  const flowPath = (pts) => new THREE.CatmullRomCurve3(pts.map((p) => new V3(...p)));
  const flows = {
    intake: {curve: flowPath([[-124, 204, -7], [-92, 202, -7], [-62, 197, -7], [-40, 191, -7], [-22, 181, -7], [-13, 169, -7], [-8, 148, -7]]), mat: new THREE.MeshBasicMaterial({color: '#3f86da', transparent: true, opacity: 0.95, depthWrite: false}), list: []},
    exhaust: {curve: flowPath([[8, 148, 7], [13, 169, 7], [28, 183, 7], [48, 191, 7], [70, 190, 7], [100, 182, 7], [118, 150, 7], [124, 100, 7]]), mat: new THREE.MeshBasicMaterial({color: '#8a817a', transparent: true, opacity: 0.95, depthWrite: false}), list: []},
  };
  for (const f of Object.values(flows)) {
    for (let k = 0; k < 7; k++) {
      const m = new THREE.Mesh(arrowGeo, f.mat);
      m.renderOrder = 6;
      head.add(m); // ride with the head when exploded
      f.list.push(m);
    }
  }

  // ------------------------------------------------------------ material twins for isolation
  const ACCENT = new THREE.Color('#c8692e');
  const GHOST = new Map();
  const HI = new Map();
  for (const m of [...Object.values(M), ...Object.values(H), ...Object.values(PM)]) {
    // clone() copies clip planes by value: point the twins back at the one live plane
    const g = m.clone();
    g.transparent = true;
    g.depthWrite = false;
    g.clippingPlanes = m.clippingPlanes;
    GHOST.set(m, g);
    const h = m.clone();
    h.clippingPlanes = m.clippingPlanes;
    // highlighted parts turn copper: the base colour pulled toward the accent, plus a faint glow
    if (h.color) h.color.lerp(ACCENT, 0.6);
    h.emissive = ACCENT.clone();
    h.emissiveIntensity = 0.0;
    HI.set(m, h);
  }
  const twins = [...GHOST.values(), ...HI.values()];

  const tmp = new V3();
  const mat4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const ZAX = new V3(0, 0, 1);
  const one = new V3(1, 1, 1);
  const CHARGE = {intake: new THREE.Color('#4f8fd6'), comp: new THREE.Color('#6a7a90'), fire: new THREE.Color('#ff7a24'), exhaust: new THREE.Color('#8a817a')};
  const col = new THREE.Color();

  /**
   * Pose everything for one engine state. ops (all optional): cut 0..1 (the section plane sweeps in to z = 0),
   * xray 0..1 (housing goes see-through), explode 0..1, solo (a PARTS key or null) with fade 0..1, hl (part keys to
   * glow, for the teaching stages) with hlK 0..1, arrows 0..1, charge 0..1.
   */
  const update = (st, ops = {}) => {
    const th = st.crankAngle;
    const cut = ops.cut ?? 0;
    const xray = ops.xray ?? 0;
    const ex = ops.explode ?? 0;
    const lay = (a) => smoother((ex - a) / 0.5);
    const dCover = 200 * lay(0);
    const dCam = 120 * lay(0.08);
    const dHead = 80 * lay(0.16);
    const dBarrel = 40 * lay(0.26);
    const dCase = 62 * lay(0.34);
    const dFly = 40 * lay(0.42);
    cover.position.y = dCover;
    camAsm.position.y = dCam;
    head.position.y = dHead;
    barrel.position.y = dBarrel;
    caseHalves[0].position.z = -dCase;
    caseHalves[1].position.z = dCase;
    genCover.position.z = -dCase - 60 * lay(0.42);
    flywheel.position.z = -60 - dFly;

    // the bottom end: crank, rod, piston from the exact slider-crank
    crank.rotation.z = -th * D2R;
    flywheel.rotation.z = -th * D2R;
    const px = st.crankPin.x;
    const py = st.crankPin.y;
    piston.position.set(0, st.pistonPinY, 0);
    rod.position.set(px, py, 0);
    rod.rotation.z = Math.atan2(st.pistonPinY - py, -px) - Math.PI / 2;

    // the top end: cam at half speed, rockers and valves from the same lift
    cam.rotation.z = -st.camAngle * D2R;
    for (const kind of ['intake', 'exhaust']) {
      const lift = kind === 'intake' ? st.intakeLift : st.exhaustLift;
      const V = valves[kind];
      const g = V.g;
      V.v.position.set(g.S[0] - lift * g.a[0], g.S[1] - lift * g.a[1], g.z);
      V.spring.scale.y = (V.springLen0 - lift) / V.springLen0;
      rockers[kind].rk.rotation.z = rockerBeta(g, lift);
    }

    // the chain round the sprockets (the cam sprocket rises with the cam when exploded)
    const path = chainPath(CAM_Y + dCam);
    const run = th * D2R * R_CRANK_SPR;
    for (let k = 0; k < NL; k++) {
      const s = (k / NL) * path.total + run;
      const [x, y, a] = path.at(s);
      q.setFromAxisAngle(ZAX, a);
      mat4.compose(tmp.set(x, y, CHAIN_Z), q, one);
      plates.setMatrixAt(k, mat4);
      const [x2, y2] = path.at(s + (0.5 * path.total) / NL);
      mat4.makeTranslation(x2, y2, CHAIN_Z);
      rollers.setMatrixAt(k, mat4);
    }
    plates.instanceMatrix.needsUpdate = true;
    rollers.instanceMatrix.needsUpdate = true;

    // the gas column between the crown and the chamber roof, coloured by the stroke (illustrative)
    const crown = st.pistonPinY + CONFIG.pistonCompressionHeight;
    charge.position.y = (crown + DECK) / 2 + dBarrel * 0;
    charge.scale.y = Math.max(0.5, DECK - crown);
    const chargeOn = (ops.charge ?? 1) * (1 - ex);
    const burn = st.ignition.burn;
    const spk = st.ignition.sparkAngle;
    if (th < 180) col.copy(CHARGE.intake);
    else if (th < spk) col.copy(CHARGE.intake).lerp(CHARGE.comp, (th - 180) / (spk - 180));
    else if (th < 420) col.copy(CHARGE.comp).lerp(CHARGE.fire, Math.min(1, burn * 1.6));
    else if (th < 520) col.copy(CHARGE.fire).lerp(CHARGE.exhaust, (th - 420) / 100);
    else col.copy(CHARGE.exhaust);
    chargeMat.color.copy(col);
    const hot = th >= spk && th < 520 ? Math.max(0, 1 - (th - spk) / 170) : 0;
    chargeMat.opacity = chargeOn * (0.13 + 0.32 * hot);
    charge.visible = chargeCap.visible = chargeOn > 0.01;
    chargeCap.position.y = dHead;
    // the illustrative combustion pulse: a glow that swells with the burn rate, a spark at the electrode
    const pulse = Math.min(1, st.ignition.burnRate * 40);
    fire.position.set(0, 160 + dHead * 0.5, 0);
    fire.scale.setScalar(8 + 22 * Math.min(1, burn * 1.4));
    fireMat.opacity = chargeOn * 0.55 * pulse;
    fire.visible = fireMat.opacity > 0.01;
    fireLight.position.copy(fire.position);
    // the glow lights the chamber only when you can see into it (no light through solid walls)
    fireLight.intensity = chargeOn * pulse * 0.006 * Math.max(smoother(cut), smoother(xray));
    spark.position.set(PLUG.at[0], PLUG.at[1] + dHead, PLUG.at[2]);
    spark.scale.setScalar(2 + 5 * st.ignition.sparkK);
    sparkMat.opacity = st.ignition.sparkK;
    spark.visible = st.ignition.sparkK > 0.01;

    // flow arrows: in through the intake port while it is open, out through the exhaust
    const arrowsOn = ops.arrows ?? 1;
    for (const [kind, f] of Object.entries(flows)) {
      const lift = kind === 'intake' ? st.intakeLift : st.exhaustLift;
      const k0 = (lift / CONFIG.valves[kind].lift) * arrowsOn;
      f.list.forEach((m, i) => {
        const u = mod(i / f.list.length + th / 200, 1);
        const p = f.curve.getPointAt(u);
        const tg = f.curve.getTangentAt(u);
        m.position.copy(p);
        m.quaternion.setFromUnitVectors(new V3(1, 0, 0), tg);
        // fade at both ends of the path
        const edge = Math.min(1, u / 0.12, (1 - u) / 0.12);
        m.scale.setScalar(Math.max(0.001, k0 * edge));
        m.visible = k0 * edge > 0.02;
      });
    }

    // ------------------------------------------------------------ cutaway, x-ray, isolation, highlight
    // the plane stops 0.5 mm short of z = 0, so the case half's flat face (exactly at z = 0) is not on it
    CLIP.constant = cut > 0.001 ? 0.09 * (1 - smoother(cut)) - 0.0005 * smoother(cut) : 10;
    const xo = 1 - 0.88 * smoother(xray);
    for (const m of Object.values(H)) {
      m.transparent = xo < 0.999;
      m.opacity = xo;
      m.depthWrite = !m.transparent;
    }
    const solo = ops.solo || null;
    const fade = solo ? smoother(ops.fade ?? 1) : 0;
    const hl = ops.hl || [];
    const hlK = ops.hlK ?? 0;
    for (const [m, g] of GHOST) {
      g.opacity = (m.transparent ? m.opacity : 1) * (1 - 0.93 * fade);
    }
    for (const [m, h] of HI) {
      h.opacity = m.opacity;
      h.transparent = m.transparent;
      h.depthWrite = m.depthWrite;
      h.emissiveIntensity = 0.16 * Math.max(fade, hl.length ? hlK : 0);
    }
    for (const mesh of meshes) {
      const p = mesh.userData.part;
      const base = mesh.userData.mat0;
      let mat = base;
      if (solo && p !== solo && fade > 0.001) mat = GHOST.get(base);
      else if ((solo && p === solo && fade > 0.001) || (hlK > 0.001 && hl.includes(p))) mat = HI.get(base);
      mesh.material = mat;
      mesh.castShadow = !(mesh.userData.housing && xray > 0.3) && !(solo && p !== solo && fade > 0.5);
    }
  };

  // the engine is modelled in mm; one world unit is a metre
  root.scale.setScalar(0.001);
  // world position of an anchor, in metres
  const anchorAt = (key, out = new V3()) => (A[key] ? A[key].getWorldPosition(out) : null);
  return {root, update, M, H, CLIP, meshes, twins, anchorAt, A, groups: {crank, cam, rod, piston, flywheel, head, camAsm, barrel, cover, caseHalves}, valves, rockers, vg, NL};
}
