// THE ASTRAL BOW: an original fantasy artifact, built procedurally. Recurve limbs are elliptical tubes along a
// centreline that bends with the draw (curvature is added along each limb, most in its working middle, while
// the recurved tip stays stiff), so the limbs, the string and the arrow move together from one number.
import * as THREE from 'three';
import { BOW } from '../core/config';
import { BRACE, ARROW_LEN, type BowRig } from '../core/bowrig';
import { limbMaps, woodMaps, haloMap } from './textures';
import { buildArrow, type ArrowMesh } from './arrowView';

const M = 64, K = 16;
// rest centreline of the top limb in the bow's (y, z) plane, archer at +z; the bottom limb mirrors y
const LIMB_CP: [number, number][] = [[0.29, 0], [0.42, 0.034], [0.6, 0.084], [0.8, 0.132], [0.97, 0.163], [1.085, 0.16], [1.165, 0.118], [1.215, 0.058]];
const ANCHOR_S = 0.86;
const NOCK_Y = 0.028, REST_X = -0.03;
const FWD = new THREE.Vector3(0, 0, -1);

export interface BowMats { gold: THREE.MeshPhysicalMaterial; limb: THREE.MeshPhysicalMaterial; wood: THREE.MeshPhysicalMaterial; gem: THREE.MeshStandardMaterial; glow: THREE.MeshBasicMaterial; halo: THREE.MeshBasicMaterial; string: THREE.MeshStandardMaterial; filament: THREE.MeshBasicMaterial }

/** A tube with an elliptical section that can be re-bent in place. */
class Tube {
  geo = new THREE.BufferGeometry(); pos: Float32Array; nrm: Float32Array;
  constructor(public n: number, public k: number, public halfW: (s: number) => number, public halfT: (s: number) => number, cap = false) {
    const nv = (n + 1) * (k + 1) + (cap ? 2 : 0);
    this.pos = new Float32Array(nv * 3); this.nrm = new Float32Array(nv * 3);
    const uv = new Float32Array(nv * 2), idx: number[] = [];
    for (let i = 0; i <= n; i++) for (let j = 0; j <= k; j++) { uv[2 * (i * (k + 1) + j)] = i / n; uv[2 * (i * (k + 1) + j) + 1] = j / k; }
    for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) {
      const a = i * (k + 1) + j, b = a + k + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
    if (cap) { const c0 = (n + 1) * (k + 1), c1 = c0 + 1; for (let j = 0; j < k; j++) { idx.push(c0, j + 1, j); const e = n * (k + 1); idx.push(c1, e + j, e + j + 1); } }
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('normal', new THREE.BufferAttribute(this.nrm, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    this.geo.setIndex(idx);
  }
  /** cy, cz: centreline (n+1 points, x = 0); ny, nz: in-plane normal per point. */
  update(cy: Float32Array, cz: Float32Array, ny: Float32Array, nz: Float32Array, x0 = 0) {
    const { n, k, pos, nrm } = this;
    for (let i = 0; i <= n; i++) {
      const s = i / n, w = this.halfW(s), th = this.halfT(s);
      for (let j = 0; j <= k; j++) {
        const a = (j / k) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a), o = 3 * (i * (k + 1) + j);
        pos[o] = x0 + c * w; pos[o + 1] = cy[i]! + sn * th * ny[i]!; pos[o + 2] = cz[i]! + sn * th * nz[i]!;
        let nx_ = c / w, nyy = (sn / th) * ny[i]!, nzz = (sn / th) * nz[i]!;
        const l = Math.hypot(nx_, nyy, nzz); nx_ /= l; nyy /= l; nzz /= l;
        nrm[o] = nx_; nrm[o + 1] = nyy; nrm[o + 2] = nzz;
      }
    }
    const base = (n + 1) * (k + 1);
    if (pos.length / 3 > base) {
      pos.set([x0, cy[0]!, cz[0]!], 3 * base); pos.set([x0, cy[n]!, cz[n]!], 3 * (base + 1));
      const ty = cy[1]! - cy[0]!, tz = cz[1]! - cz[0]!, l0 = Math.hypot(ty, tz) || 1;
      nrm.set([0, -ty / l0, -tz / l0], 3 * base);
      const ey = cy[n]! - cy[n - 1]!, ez = cz[n]! - cz[n - 1]!, l1 = Math.hypot(ey, ez) || 1;
      nrm.set([0, ey / l1, ez / l1], 3 * (base + 1));
    }
    this.geo.attributes.position!.needsUpdate = true; this.geo.attributes.normal!.needsUpdate = true;
    this.geo.computeBoundingSphere();
  }
}

/** A thin round strand between two points with a sideways bow (string, filaments). */
class Strand {
  mesh: THREE.Mesh; geo: THREE.BufferGeometry; pos: Float32Array;
  constructor(public seg: number, public r: number, mat: THREE.Material, public sides = 6) {
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array((seg + 1) * sides * 3);
    const idx: number[] = [];
    for (let i = 0; i < seg; i++) for (let j = 0; j < sides; j++) { const a = i * sides + j, b = i * sides + ((j + 1) % sides), c = a + sides, d = b + sides; idx.push(a, c, b, b, c, d); }
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setIndex(idx);
    this.mesh = new THREE.Mesh(this.geo, mat);
    this.mesh.frustumCulled = false;
  }
  /** From a to b, displaced by off * sin(pi s) (+ wave: amplitude, cycles, phase). */
  set(a: THREE.Vector3, b: THREE.Vector3, off: THREE.Vector3, wave = 0, cycles = 0, phase = 0, wdir?: THREE.Vector3) {
    const d = new THREE.Vector3().subVectors(b, a), L = d.length() || 1; d.divideScalar(L);
    const u = new THREE.Vector3(1, 0, 0); if (Math.abs(d.x) > 0.9) u.set(0, 1, 0);
    const v1 = new THREE.Vector3().crossVectors(d, u).normalize(), v2 = new THREE.Vector3().crossVectors(d, v1);
    const p = new THREE.Vector3();
    for (let i = 0; i <= this.seg; i++) {
      const s = i / this.seg, bow = Math.sin(Math.PI * s);
      p.copy(a).addScaledVector(d, s * L).addScaledVector(off, bow);
      if (wave && wdir) p.addScaledVector(wdir, wave * bow * Math.sin(s * Math.PI * 2 * cycles + phase));
      for (let j = 0; j < this.sides; j++) {
        const t = (j / this.sides) * Math.PI * 2, o = 3 * (i * this.sides + j);
        this.pos[o] = p.x + (Math.cos(t) * v1.x + Math.sin(t) * v2.x) * this.r;
        this.pos[o + 1] = p.y + (Math.cos(t) * v1.y + Math.sin(t) * v2.y) * this.r;
        this.pos[o + 2] = p.z + (Math.cos(t) * v1.z + Math.sin(t) * v2.z) * this.r;
      }
    }
    this.geo.attributes.position!.needsUpdate = true;
    this.geo.computeVertexNormals();
  }
}

/** The finial's curl: a flat spiral rising from the lotus bud and curling toward the target. */
class Spiral extends THREE.Curve<THREE.Vector3> {
  constructor() { super(); }
  override getPoint(t: number, out = new THREE.Vector3()) { const a = t * Math.PI * 2.4, r = 0.028 * (1 - t * 0.75); return out.set(0, 0.035 + t * 0.015 + Math.sin(a) * r, -(1 - Math.cos(a)) * r * 0.9); }
}

function polarRing(rIn: number, rOut: number, seg: number) {
  const g = new THREE.BufferGeometry(), pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    for (const [r, v] of [[rIn, 0], [rOut, 1]] as const) { pos.push(Math.cos(a) * r, Math.sin(a) * r, 0); uv.push((i / seg) * 6, v); }
    if (i < seg) { const k = 2 * i; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}

export class BowView {
  group = new THREE.Group();   // world placement (position + aim)
  mats: BowMats;
  private limbs: { tube: Tube; sign: 1 | -1; tip: THREE.Group }[] = [];
  private restA: Float32Array; private restL: Float32Array; private restS: Float32Array;
  private cy = new Float32Array(M + 1); private cz = new Float32Array(M + 1); private ny = new Float32Array(M + 1); private nz = new Float32Array(M + 1);
  private strings: Strand[] = []; private glows: Strand[] = []; private wraps: Strand[] = []; private filaments: Strand[] = [];
  halo = new THREE.Group();
  nocked: ArrowMesh;
  light: THREE.PointLight;
  anchors = [new THREE.Vector3(), new THREE.Vector3()];

  constructor() {
    const lm = limbMaps();
    const gold = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: lm.map, metalness: 1, roughness: 0.36, roughnessMap: lm.rough, bumpMap: lm.bump, bumpScale: 1.2,
      emissive: 0xffc46a, emissiveMap: lm.emissive, emissiveIntensity: 0.7, clearcoat: 0.35, clearcoatRoughness: 0.18, envMapIntensity: 1.9 });
    const plainGold = new THREE.MeshPhysicalMaterial({ color: 0xf0bd5a, metalness: 1, roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.15, envMapIntensity: 1.9 });
    const wood = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: woodMaps(), roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.8 });
    const gem = new THREE.MeshStandardMaterial({ color: 0x331a00, emissive: 0xffb347, emissiveIntensity: 3.5, roughness: 0.1, metalness: 0.2 });
    const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.2, 1), transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const halo = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.6, 0.6), alphaMap: haloMap(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const string = new THREE.MeshStandardMaterial({ color: 0xfff1d0, emissive: 0xffd590, emissiveIntensity: 0.6, roughness: 0.4 });
    const filament = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3, 1.4), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    this.mats = { gold: plainGold, limb: gold, wood, gem, glow, halo, string, filament };

    // limb rest geometry: resample the control curve by arc length, keep segment angles and lengths
    const curve = new THREE.CatmullRomCurve3(LIMB_CP.map(([y, z]) => new THREE.Vector3(0, y, z)), false, 'centripetal');
    const pts = curve.getSpacedPoints(M);
    this.restA = new Float32Array(M); this.restL = new Float32Array(M); this.restS = new Float32Array(M + 1);
    let acc = 0;
    for (let i = 0; i < M; i++) {
      const dy = pts[i + 1]!.y - pts[i]!.y, dz = pts[i + 1]!.z - pts[i]!.z;
      this.restA[i] = Math.atan2(dz, dy); this.restL[i] = Math.hypot(dy, dz); acc += this.restL[i]!; this.restS[i + 1] = acc;
    }
    for (let i = 0; i <= M; i++) this.restS[i]! /= acc;
    const halfW = (s: number) => 0.033 - 0.017 * Math.pow(s, 0.9) + 0.004 * Math.exp(-(((s - 0.48) / 0.06) ** 2));
    const halfT = (s: number) => 0.0165 - 0.0085 * s;
    for (const sign of [1, -1] as const) {
      const tube = new Tube(M, K, halfW, halfT, true);
      const mesh = new THREE.Mesh(tube.geo, gold); mesh.castShadow = true; mesh.receiveShadow = true;
      if (sign < 0) { mesh.scale.y = -1; }
      this.group.add(mesh);
      const tip = this.finial(plainGold, gem); this.group.add(tip);
      this.limbs.push({ tube, sign, tip });
    }
    // flip the bottom limb's winding (scale.y = -1 mirrors it)
    this.limbs[1]!.tube.geo.index!.array.reverse();

    this.buildRiser(plainGold, wood, gem);
    this.buildHalo(plainGold, halo);
    // string: two strands (anchor -> nock), a glow sleeve, the short wraps along the recurves, tension filaments
    for (let k = 0; k < 2; k++) {
      const s = new Strand(18, 0.0026, string); s.mesh.castShadow = true; this.strings.push(s); this.group.add(s.mesh);
      const g = new Strand(18, 0.0055, glow, 8); this.glows.push(g); this.group.add(g.mesh);
      const w = new Strand(6, 0.0026, string); this.wraps.push(w); this.group.add(w.mesh);
      for (let f = 0; f < 3; f++) { const fl = new Strand(24, 0.0012, filament, 4); this.filaments.push(fl); this.group.add(fl.mesh); }
    }
    this.nocked = buildArrow();
    this.group.add(this.nocked.group);
    this.light = new THREE.PointLight(0xffb85a, 0, 4, 2);
    this.group.add(this.light);
  }

  private finial(gold: THREE.Material, gem: THREE.Material) {
    const g = new THREE.Group();
    const bud = new THREE.LatheGeometry([[0, 0], [0.012, 0.004], [0.019, 0.017], [0.017, 0.028], [0.009, 0.04], [0, 0.052]].map(([x, y]) => new THREE.Vector2(x, y)), 18);
    const b = new THREE.Mesh(bud, gold); b.castShadow = true; g.add(b);
    for (let k = 0; k < 4; k++) {
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 8), gold);
      petal.scale.set(0.55, 1.5, 0.3); const a = (k / 4) * Math.PI * 2;
      petal.position.set(Math.cos(a) * 0.014, 0.014, Math.sin(a) * 0.014); petal.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
      g.add(petal);
    }
    // a spiral curl springing from the bud
    const curl = new THREE.Mesh(new THREE.TubeGeometry(new Spiral(), 48, 0.0035, 6, false), gold); curl.position.z = -0.006; g.add(curl);
    const tipGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.008), gem); tipGem.position.y = 0.058; g.add(tipGem);
    return g;
  }

  private buildRiser(gold: THREE.Material, wood: THREE.Material, gem: THREE.Material) {
    const n = 40;
    const cy = new Float32Array(n + 1), cz = new Float32Array(n + 1), ny = new Float32Array(n + 1), nz = new Float32Array(n + 1);
    for (let i = 0; i <= n; i++) { const y = -0.31 + (0.62 * i) / n; cy[i] = y; cz[i] = -0.012 - 0.02 * (1 - (y / 0.31) ** 2); }
    for (let i = 0; i <= n; i++) { const a = Math.max(0, i - 1), b = Math.min(n, i + 1), ty = cy[b]! - cy[a]!, tz = cz[b]! - cz[a]!, l = Math.hypot(ty, tz); ny[i] = -tz / l; nz[i] = ty / l; }
    const grip = (s: number) => { const y = -0.31 + 0.62 * s; return y > -0.15 && y < 0.02 ? 0.86 : 1; };
    const riser = new Tube(n, 20, (s) => 0.024 * grip(s), (s) => 0.034 * grip(s));
    riser.update(cy, cz, ny, nz);
    const rm = new THREE.Mesh(riser.geo, wood); rm.castShadow = true; rm.receiveShadow = true; this.group.add(rm);
    // grip wrap: gold thread rings
    for (let k = 0; k < 9; k++) {
      // a unit torus around y, scaled to the grip's elliptical section; local z (after the turn) is the thread's thickness in y
      const y = -0.14 + k * 0.018, tor = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 28), gold);
      tor.rotation.x = Math.PI / 2; tor.scale.set(0.0222, 0.0302, 0.03); tor.position.set(0, y, -0.012 - 0.02 * (1 - (y / 0.31) ** 2));
      this.group.add(tor);
    }
    // limb pockets: gold collars where the limbs join
    const collar = new THREE.LatheGeometry([[0.0, -0.05], [0.03, -0.048], [0.043, -0.03], [0.047, -0.01], [0.044, 0.012], [0.036, 0.028], [0.03, 0.04]].map(([x, y]) => new THREE.Vector2(x, y)), 28);
    for (const s of [1, -1]) {
      const c = new THREE.Mesh(collar, gold); c.scale.set(0.78, s * 1, 1.0); c.position.set(0, s * 0.29, -0.006); c.castShadow = true; this.group.add(c);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.041, 0.004, 8, 32), gold); ring.rotation.x = Math.PI / 2; ring.scale.set(0.8, 1, 1); ring.position.set(0, s * 0.255, -0.008); this.group.add(ring);
    }
    // medallions on both faces above the grip: lotus disc with a gem
    for (const sx of [1, -1]) {
      const m = new THREE.Group(); m.position.set(sx * 0.026, 0.13, -0.025); m.rotation.y = sx * Math.PI / 2; this.group.add(m);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.034, 0.007, 32), gold); disc.rotation.x = Math.PI / 2; m.add(disc);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2, p = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), gold);
        p.scale.set(0.42, 1, 0.3); p.position.set(Math.cos(a) * 0.021, Math.sin(a) * 0.021, 0.005); p.rotation.z = a - Math.PI / 2; m.add(p);
      }
      const gm = new THREE.Mesh(new THREE.IcosahedronGeometry(0.0105, 1), gem); gm.position.z = 0.008; m.add(gm);
    }
    // arrow rest (left side, the arrow passes there)
    const rest = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.006, 0.03), gold); rest.position.set(REST_X + 0.004, NOCK_Y - 0.006, -0.02); this.group.add(rest);
  }

  private buildHalo(gold: THREE.Material, haloMat: THREE.Material) {
    const h = this.halo; h.position.set(0, 0.06, -0.11);
    h.add(new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.0048, 8, 180), gold));
    h.add(new THREE.Mesh(new THREE.TorusGeometry(0.355, 0.0032, 8, 160), gold));
    const band = new THREE.Mesh(polarRing(0.372, 0.438, 240), haloMat); h.add(band);
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2, sp = new THREE.Mesh(new THREE.ConeGeometry(0.008, k % 2 ? 0.035 : 0.06, 6), gold);
      sp.position.set(Math.cos(a) * (0.47 + (k % 2 ? 0.017 : 0.03)), Math.sin(a) * (0.47 + (k % 2 ? 0.017 : 0.03)), 0); sp.rotation.z = a - Math.PI / 2; h.add(sp);
    }
    this.group.add(h);
  }

  /** Bend the limbs for draw d (m), place string, arrow and glow. tBow: sim time (vibration), t: clock time (halo). */
  update(rig: BowRig, alpha: number, tBow: number, t: number, modeCore: THREE.Color, hasNocked: boolean) {
    const d = rig.prevDraw + (rig.draw - rig.prevDraw) * alpha;
    const yaw = rig.prevYaw + (rig.yaw - rig.prevYaw) * alpha, pitch = rig.prevPitch + (rig.pitch - rig.prevPitch) * alpha;
    const p = rig.pos(tBow), F = rig.frame(yaw, pitch);
    this.group.position.set(p[0], p[1], p[2]);
    const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(...F.x), new THREE.Vector3(...F.y), new THREE.Vector3(...F.z));
    this.group.quaternion.setFromRotationMatrix(m);
    const u = d / BOW.MAX_DRAW, phi = 0.56 * u;
    const off = rig.stringOffset(tBow);
    for (const L of this.limbs) {
      // integrate the bent centreline from the limb root
      let y = LIMB_CP[0]![0], z = LIMB_CP[0]![1];
      this.cy[0] = y; this.cz[0] = z;
      for (let i = 0; i < M; i++) {
        const s = (this.restS[i]! + this.restS[i + 1]!) / 2, w = s < 0.84 ? (s / 0.84) ** 1.15 : 1;
        const a = this.restA[i]! + phi * w;
        y += Math.cos(a) * this.restL[i]!; z += Math.sin(a) * this.restL[i]!;
        this.cy[i + 1] = y; this.cz[i + 1] = z;
      }
      for (let i = 0; i <= M; i++) {
        const a = Math.max(0, i - 1), b = Math.min(M, i + 1), ty = this.cy[b]! - this.cy[a]!, tz = this.cz[b]! - this.cz[a]!, l = Math.hypot(ty, tz);
        this.ny[i] = -tz / l; this.nz[i] = ty / l;
      }
      L.tube.update(this.cy, this.cz, this.ny, this.nz);
      // tip finial along the tip tangent; string anchor at the string groove, on the belly side
      const tipY = this.cy[M]!, tipZ = this.cz[M]!, ty = this.cy[M]! - this.cy[M - 2]!, tz = this.cz[M]! - this.cz[M - 2]!;
      L.tip.position.set(0, tipY * L.sign, tipZ);
      L.tip.rotation.set(L.sign > 0 ? Math.atan2(tz, ty) : Math.PI - Math.atan2(tz, ty), 0, 0);
      const ka = Math.round(ANCHOR_S * M);
      const k = L.sign > 0 ? 0 : 1;
      this.anchors[k]!.set(0, this.cy[ka]! * L.sign, this.cz[ka]! + 0.012 * this.nz[ka]! + 0.004);
      // wrap: anchor -> tip along the belly
      this.wraps[k]!.set(this.anchors[k]!, new THREE.Vector3(0, (tipY - 0.004) * L.sign, tipZ + 0.006), new THREE.Vector3(0, 0, 0.004));
    }
    // the nocking point sits a little above the string's centre, level with the arrow rest
    const nock = new THREE.Vector3(off[0], NOCK_Y + off[1], BRACE + d);
    const strain = rig.held ? Math.max(0, (u - 0.55) / 0.45) : 0;
    const glowK = 0.3 + 2.0 * u * u + (tBow - rig.releasedAt < 0.25 ? 2.5 * (1 - (tBow - rig.releasedAt) / 0.25) : 0);
    for (let k = 0; k < 2; k++) {
      const a = this.anchors[k]!;
      this.strings[k]!.set(a, nock, new THREE.Vector3());
      this.glows[k]!.set(a, nock, new THREE.Vector3());
      for (let f = 0; f < 3; f++) {
        const fl = this.filaments[k * 3 + f]!;
        fl.set(a, nock, new THREE.Vector3(0.006 * (f - 1), 0.004 * (f - 1), -0.012 - 0.01 * f), 0.006 * strain, 3 + f, t * (9 + f * 3) + f, new THREE.Vector3(1, 0, 0));
      }
    }
    this.mats.glow.color.setRGB(3 * glowK * 0.16, 2.2 * glowK * 0.16, 1 * glowK * 0.16);
    this.mats.filament.opacity = strain * 0.85;
    this.mats.limb.emissiveIntensity = 0.22 + 2.6 * u * u;
    this.mats.halo.color.setRGB(0.8 + 1.6 * u, 0.55 + 1.1 * u, 0.2 + 0.35 * u);
    this.mats.gem.emissive.copy(modeCore).multiplyScalar(0.32);
    this.mats.gem.emissiveIntensity = 1.6 + 3 * u;
    this.halo.rotation.z = t * 0.12;
    this.halo.scale.setScalar(1 + 0.03 * u);
    this.light.position.set(0, 0, BRACE + d * 0.6);
    this.light.intensity = 0.25 + 1.6 * u * u;
    this.light.color.copy(modeCore).multiplyScalar(0.2).lerp(new THREE.Color(0xffc070), 0.6);
    // the nocked arrow rides the string (its nock at the string's centre, pointing along -z)
    // (angled from the nock toward the arrow rest so it clears the riser; the flying arrow takes the true aim)
    this.nocked.group.visible = hasNocked;
    this.nocked.group.position.copy(nock);
    this.nocked.group.quaternion.setFromUnitVectors(FWD, new THREE.Vector3(REST_X, NOCK_Y, -0.02).sub(nock).normalize());
    this.nocked.setMode(modeCore, 0.6 + 2.8 * u);
  }
}

export { ARROW_LEN };
