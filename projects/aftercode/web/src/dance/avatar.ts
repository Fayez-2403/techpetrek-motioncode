// The dancer: a THREE.Bone tree built from the CMU skeleton, dressed with rigid rounded segments per bone (a stylized
// articulated figure: no skinning, so elbows / knees can never tear), outfit geometry + materials, hair, accessories and an
// optional photo face (face/faceMesh.ts) on the head bone. Pure apply(pose): the same pose always gives the same body.
import * as THREE from 'three';
import type { Clip, Pose } from './clips';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export const S = 0.056;   // CMU BVH units -> metres

export const BODY_STYLES = [
  { id: 'realistic', name: 'Realistic-inspired' }, { id: 'stylized', name: 'Stylized cinematic' }, { id: 'lowpoly', name: 'Low-poly' },
  { id: 'android', name: 'Futuristic android' }, { id: 'anime', name: 'Anime-inspired' }, { id: 'hologram', name: 'Holographic' },
] as const;
export const OUTFITS = [
  { id: 'street', name: 'Urban streetwear' }, { id: 'hoodie', name: 'Oversized hoodie + sneakers' }, { id: 'cyberpunk', name: 'Futuristic cyberpunk' },
  { id: 'chrome', name: 'Metallic chrome suit' }, { id: 'festival', name: 'Festival fashion' }, { id: 'office', name: 'Casual office' },
  { id: 'neon', name: 'Neon dance costume' }, { id: 'contemporary', name: 'Contemporary dance' }, { id: 'festive', name: 'Indian festive-inspired' },
  { id: 'scifi', name: 'Sci-fi performance suit' },
] as const;
export const HAIR = ['short', 'buzz', 'bun', 'long', 'curly', 'none'] as const;
export const ACCESSORIES = ['none', 'headphones', 'cap', 'shades', 'chain'] as const;
export type BodyStyle = (typeof BODY_STYLES)[number]['id'];
export type Outfit = (typeof OUTFITS)[number]['id'];
export interface Look { body: BodyStyle; outfit: Outfit; hair: (typeof HAIR)[number]; accessory: (typeof ACCESSORIES)[number]; skin: string; tint: string; hairColor: string; faceScale: number }
export const DEFAULT_LOOK: Look = { body: 'stylized', outfit: 'street', hair: 'short', accessory: 'none', skin: '#c99a7a', tint: '#ffffff', hairColor: '#1c1512', faceScale: 1 };

type Part = 'torso' | 'arm' | 'leg' | 'foot' | 'hand' | 'neck';
interface Fit { top: string; bottom: string; shoe: string; accent: string; metal?: number; rough?: number; emissive?: string; bulk?: number; sleeves?: 'long' | 'short' | 'none'; tunic?: boolean; hood?: boolean; plates?: boolean }
const FITS: Record<Outfit, Fit> = {
  street: { top: '#e8e4dc', bottom: '#2d4f7c', shoe: '#f4f4f2', accent: '#ff5a36', sleeves: 'short' },
  hoodie: { top: '#3b3f4a', bottom: '#1d1f24', shoe: '#f2f2f0', accent: '#b6ff3b', bulk: 1.28, sleeves: 'long', hood: true },
  cyberpunk: { top: '#111318', bottom: '#15171c', shoe: '#0c0d10', accent: '#22e6ff', emissive: '#22e6ff', rough: 0.35, sleeves: 'long' },
  chrome: { top: '#d9dde4', bottom: '#d9dde4', shoe: '#e9ecf1', accent: '#ffffff', metal: 1, rough: 0.12, sleeves: 'long' },
  festival: { top: '#ff4fa3', bottom: '#ffd23f', shoe: '#ffffff', accent: '#36e2c4', sleeves: 'none' },
  office: { top: '#b9d2ea', bottom: '#b49a76', shoe: '#5a3a22', accent: '#22344f', sleeves: 'long' },
  neon: { top: '#ff2bd6', bottom: '#2b1bff', shoe: '#ffffff', accent: '#3bf0ff', emissive: '#ff2bd6', sleeves: 'short' },
  contemporary: { top: '#f3efe8', bottom: '#f3efe8', shoe: '#e9d9c9', accent: '#cbb7a3', bulk: 0.92, rough: 0.9, sleeves: 'none' },
  festive: { top: '#e2701f', bottom: '#f1e6d2', shoe: '#7a1f2b', accent: '#f2c14e', emissive: '#f2c14e', tunic: true, sleeves: 'long' },
  scifi: { top: '#f1f3f6', bottom: '#2a2f38', shoe: '#2a2f38', accent: '#ff7a1a', emissive: '#ff7a1a', plates: true, sleeves: 'long', rough: 0.3 },
};

/** CMU joint -> body part; bones not listed get no segment (finger stubs, the zero-length hip joints) */
const PART: Record<string, Part> = {
  LeftUpLeg: 'leg', LeftLeg: 'leg', RightUpLeg: 'leg', RightLeg: 'leg', LeftFoot: 'foot', RightFoot: 'foot',
  LowerBack: 'torso', Spine: 'torso', Spine1: 'torso', Neck: 'neck', Neck1: 'neck',
  LeftArm: 'arm', LeftForeArm: 'arm', RightArm: 'arm', RightForeArm: 'arm', LeftHand: 'hand', RightHand: 'hand',
};
const RADIUS: Record<string, number> = {
  LeftUpLeg: 0.072, RightUpLeg: 0.072, LeftLeg: 0.055, RightLeg: 0.055, LowerBack: 0.13, Spine: 0.135, Spine1: 0.13,
  Neck: 0.045, Neck1: 0.042, LeftArm: 0.046, RightArm: 0.046, LeftForeArm: 0.038, RightForeArm: 0.038,
};

const holoMat = (color: string) => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 } },
  vertexShader: `varying vec3 vN; varying vec3 vV; varying float vY; void main(){ vec4 wp = modelMatrix * vec4(position,1.); vY = wp.y; vN = normalize(normalMatrix*normal); vV = normalize(-(modelViewMatrix*vec4(position,1.)).xyz); gl_Position = projectionMatrix*viewMatrix*wp; }`,
  fragmentShader: `uniform vec3 uColor; uniform float uTime; varying vec3 vN; varying vec3 vV; varying float vY; void main(){ float f = pow(1. - abs(dot(vN, vV)), 2.2); float scan = 0.55 + 0.45*sin(vY*90. - uTime*6.); gl_FragColor = vec4(uColor*(0.25 + 1.6*f)*scan, 0.25 + 0.75*f); }`,
});

export class Avatar extends THREE.Group {
  bones: THREE.Bone[] = [];
  head!: THREE.Bone;
  skeleton: Clip;
  look: Look;
  private dress = new THREE.Group();
  private maps = new Map<string, number[]>();     // clip id -> our bone index per clip joint
  private ground = new Map<string, number>();     // clip id -> root height correction (m)
  private holo: THREE.ShaderMaterial[] = [];
  faceSlot = new THREE.Group();
  private tmpV = new THREE.Vector3();

  constructor(skeleton: Clip, look: Look = DEFAULT_LOOK) {
    super();
    this.skeleton = skeleton; this.look = look;
    for (let j = 0; j < skeleton.joints.length; j++) {
      const b = new THREE.Bone(); b.name = skeleton.joints[j];
      const o = skeleton.offsets[j], n = skeleton.joints[j];
      const toy = look.body === 'stylized' || look.body === 'anime';   // designer-toy proportions: shorter legs + arms, same rotations
      const k = toy ? (/Leg|Foot|Toe/.test(n) ? 0.88 : /Arm|Hand|Thumb|Finger/.test(n) ? 0.93 : 1) : 1;
      b.position.set(o[0] * S * k, o[1] * S * k, o[2] * S * k);
      if (skeleton.parents[j] >= 0) this.bones[skeleton.parents[j]].add(b); else this.add(b);
      this.bones.push(b);
    }
    this.head = this.bones[skeleton.joints.indexOf('Head')];
    this.head.add(this.faceSlot);
    this.dressUp(look);
  }

  private mat(color: string, opt: { metal?: number; rough?: number; emissive?: string; ei?: number } = {}): THREE.Material {
    const L = this.look;
    if (L.body === 'hologram') { const m = holoMat('#5cf6ff'); this.holo.push(m); return m; }
    const c = new THREE.Color(color).multiply(new THREE.Color(L.tint));
    if (L.body === 'anime') return new THREE.MeshToonMaterial({ color: c, emissive: opt.emissive ? new THREE.Color(opt.emissive) : undefined, emissiveIntensity: opt.ei ?? 0.6 });
    const android = L.body === 'android';
    if (!android && L.body !== 'lowpoly' && !(opt.metal && opt.metal > 0.5)) return new THREE.MeshPhysicalMaterial({
      color: c, roughness: opt.rough ?? 0.62, metalness: opt.metal ?? 0, clearcoat: (opt.rough ?? 0.62) < 0.6 ? 0.55 : 0.12, clearcoatRoughness: 0.35,
      sheen: (opt.rough ?? 0.62) >= 0.6 ? 0.6 : 0, sheenRoughness: 0.6, sheenColor: c.clone().lerp(new THREE.Color(1, 1, 1), 0.4),
      emissive: opt.emissive ? new THREE.Color(opt.emissive) : new THREE.Color(0), emissiveIntensity: opt.ei ?? (opt.emissive ? 0.9 : 0),
    });
    return new THREE.MeshStandardMaterial({
      color: c, metalness: android ? Math.max(0.6, opt.metal ?? 0) : opt.metal ?? 0.05, roughness: android ? 0.28 : opt.rough ?? 0.62,
      emissive: opt.emissive ? new THREE.Color(opt.emissive) : new THREE.Color(0), emissiveIntensity: opt.ei ?? (opt.emissive ? 0.9 : 0),
      flatShading: L.body === 'lowpoly',
    });
  }
  private seg(radius: number, len: number, m: THREE.Material) {
    const lp = this.look.body === 'lowpoly';
    const g = new THREE.CapsuleGeometry(radius, Math.max(0.001, len - radius * 1.2), lp ? 2 : 6, lp ? 6 : 16);
    const mesh = new THREE.Mesh(g, m); mesh.castShadow = true; return mesh;
  }

  /** (re)build clothes, hair and accessories for a look; bones and their pose are untouched */
  dressUp(look: Look) {
    this.look = look; this.holo = [];
    this.dress.traverse((o) => { if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose(); });
    this.dress.removeFromParent(); this.dress = new THREE.Group();
    for (const b of this.bones) for (const c of [...b.children]) if (c.userData.dress) b.remove(c);
    const F = FITS[look.outfit], stylized = look.body === 'stylized' || look.body === 'anime';
    const skin = this.mat(look.skin, { rough: 0.55 }), top = this.mat(F.top, { metal: F.metal, rough: F.rough }), bottom = this.mat(F.bottom, { metal: F.metal, rough: F.rough });
    const shoe = this.mat(F.shoe, { rough: 0.4 }), accent = this.mat(F.accent, { emissive: F.emissive, ei: F.emissive ? 1.4 : 0, metal: F.metal });
    const android = look.body === 'android', joint = this.mat(android ? '#2b2f36' : look.skin, { metal: android ? 0.9 : 0 });
    const add = (bone: THREE.Object3D, o: THREE.Object3D) => { o.userData.dress = true; bone.add(o); };
    const bulk = F.bulk ?? 1;
    const lp = look.body === 'lowpoly', RS = lp ? 6 : 20;
    const along = (o: THREE.Object3D, dir: THREE.Vector3) => { o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()); };
    for (let j = 0; j < this.bones.length; j++) {
      const b = this.bones[j], name = b.name, part = PART[name];
      if (!part) continue;
      const kids = b.children.filter((c) => (c as THREE.Bone).isBone) as THREE.Bone[];
      const child = kids.find((c) => c.name === 'Neck') ?? kids[0];   // the chest follows the spine to the neck, not a shoulder
      if (part === 'hand') {   // mitten hand
        const h = new THREE.Mesh(new THREE.SphereGeometry(stylized ? 0.052 : 0.046, RS, 12), skin); h.scale.set(0.82, 1.15, 0.62); h.position.set(name.startsWith('Left') ? 0.035 : -0.035, -0.01, 0); add(b, h); continue;
      }
      if (part === 'foot') {   // rounded sneaker
        const f = new THREE.Mesh(new RoundedBoxGeometry(0.105, 0.085, 0.27, lp ? 1 : 4, 0.035), shoe); f.position.set(0, -0.04, 0.075);
        const sole = new THREE.Mesh(new RoundedBoxGeometry(0.112, 0.028, 0.28, 2, 0.012), this.mat(F.shoe === '#f4f4f2' || F.shoe === '#f2f2f0' || F.shoe === '#ffffff' ? '#d9d9de' : '#1a1a1e', { rough: 0.7 })); sole.position.set(0, -0.08, 0.077);
        if (look.outfit === 'hoodie' || look.outfit === 'street' || look.outfit === 'neon') { f.scale.set(1.12, 1.15, 1.06); sole.scale.set(1.12, 1.2, 1.06); }
        add(b, f); add(b, sole); continue;
      }
      if (!child) continue;
      const dir = child.position.clone(), len = dir.length(); if (len < 1e-4) continue;
      const isArm = part === 'arm', isLeg = part === 'leg', upper = /UpLeg|Arm$/.test(name) && !/Fore/.test(name);
      if (part === 'torso') {
        // sculpted torso: abdomen (LowerBack), waist (Spine), chest (Spine1) as lathe profiles, flattened front-to-back
        const prof = name === 'Spine1' ? [[0.122, 0], [0.15, 0.35], [0.172, 0.7], [0.165, 0.92], [0.1, 1.08], [0.001, 1.13]]
          : name === 'Spine' ? [[0.112, -0.05], [0.108, 0.5], [0.12, 1.05]] : [[0.13, -0.1], [0.118, 0.5], [0.112, 1.05]];
        const pts = prof.map(([r, y]) => new THREE.Vector2(r * bulk * (stylized ? 0.96 : 1), y * len));
        const g = new THREE.LatheGeometry(pts, lp ? 7 : 28); const m = new THREE.Mesh(g, top); along(m, dir); m.scale.set(1, 1, 1);
        const wrap = new THREE.Group(); wrap.add(m); wrap.scale.set(1.05, 1, 0.74); add(b, wrap); m.castShadow = true;
        if (name === 'Spine1') for (const side of [-1, 1]) {   // shoulder caps
          const sc = new THREE.Mesh(new THREE.SphereGeometry(0.062 * (bulk > 1 ? 1.2 : 1), RS, 12), F.sleeves === 'none' ? skin : top);
          sc.position.copy(dir).multiplyScalar(0.84).add(new THREE.Vector3(side * 0.16 * bulk, 0, 0)); add(b, sc);
        }
        continue;
      }
      let r0 = (RADIUS[name] ?? 0.05) * (stylized ? 1.25 : 1.08), m: THREE.Material = skin;
      const taper = isLeg ? (upper ? 0.72 : 0.7) : isArm ? (upper ? 0.8 : 0.78) : 0.95;
      if (isLeg) { m = bottom; r0 *= (look.outfit === 'contemporary' ? 0.9 : 1.12) * (stylized ? 1.05 : 1); }
      if (isArm) { const sl = F.sleeves; m = sl === 'long' || (sl === 'short' && upper) ? top : skin; if (m === top) r0 *= bulk > 1 ? 1.28 : 1.1; }
      if (part === 'neck') { m = skin; r0 *= 1.05; }
      const g = new THREE.CylinderGeometry(r0 * taper, r0, len, RS, 1, false); g.translate(0, len / 2, 0);
      const seg = new THREE.Mesh(g, m); seg.castShadow = true; along(seg, dir); add(b, seg);
      // rounded joint at the far end (knee / elbow / ankle / wrist), sized to the narrower end so the silhouette is smooth
      const k = new THREE.Mesh(new THREE.SphereGeometry(r0 * taper * 1.0, RS, 12), android ? joint : m); add(child, k);
      if (upper) { const k0 = new THREE.Mesh(new THREE.SphereGeometry(r0 * 0.98, RS, 12), m); add(b, k0); }
      if (F.plates && upper) { const pl = new THREE.Mesh(new RoundedBoxGeometry(r0 * 2.2, len * 0.55, r0 * 0.7, 2, 0.01), accent); pl.position.copy(dir).multiplyScalar(0.5).add(new THREE.Vector3(0, 0, r0 * 0.75)); along(pl, dir); add(b, pl); }
      if (F.emissive && !upper && (isArm || isLeg)) { const ring = new THREE.Mesh(new THREE.TorusGeometry(r0 * taper * 1.12, 0.006, 6, 28), accent); ring.position.copy(dir).multiplyScalar(0.85); along(ring, dir); ring.rotateX(Math.PI / 2); add(b, ring); }
      if (look.outfit === 'hoodie' && isArm && !upper) { const cuff = new THREE.Mesh(new THREE.TorusGeometry(r0 * taper * 1.18, 0.014, 8, 24), top); cuff.position.copy(dir).multiplyScalar(0.95); along(cuff, dir); cuff.rotateX(Math.PI / 2); add(b, cuff); }
    }
    // tunic (festive): a flared kurta hem from the hips; trim in gold
    if (F.tunic) {
      const hips = this.bones[0];
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 0.42, 22, 1, true), top); t.position.set(0, -0.12, 0); (t.material as THREE.Material).side = THREE.DoubleSide; add(hips, t);
      const hem = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.012, 6, 30), accent); hem.rotation.x = Math.PI / 2; hem.position.set(0, -0.33, 0); add(hips, hem);
    }
    if (F.emissive && !F.tunic) { const belt = new THREE.Mesh(new THREE.TorusGeometry(0.15 * bulk, 0.01, 6, 28), accent); belt.rotation.x = Math.PI / 2; belt.position.set(0, 0.02, 0); add(this.bones[0], belt); }
    // hips block
    const pelvis = this.seg(0.105 * Math.max(1, bulk * 0.9), 0.15, F.tunic ? top : bottom); pelvis.rotation.z = Math.PI / 2; pelvis.scale.set(1, 1.05, 0.78); pelvis.position.y = -0.03; add(this.bones[0], pelvis);
    // head
    const hs = stylized ? 1.4 : 1.1;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.105 * hs, look.body === 'lowpoly' ? 8 : 28, look.body === 'lowpoly' ? 6 : 20), android ? this.mat('#cfd5de', { metal: 0.8, rough: 0.25 }) : skin);
    const hg = new THREE.Group(); hg.position.y = -0.035 * hs; add(this.head, hg); const addH = (o: THREE.Object3D) => add(hg, o);
    head.scale.set(0.92, 1.1, 1); head.position.set(0, 0.11 * hs, 0.0); addH(head);
    this.faceSlot.position.set(0, 0.07 * hs, 0.088 * hs); this.faceSlot.scale.setScalar(hs * look.faceScale);
    if (android) for (const x of [-0.035, 0.035]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), this.mat('#5cf6ff', { emissive: '#5cf6ff', ei: 3 })); e.position.set(x, 0.12 * hs, 0.1 * hs); e.userData.defaultFace = true; addH(e); }
    // hair
    const hairM = this.mat(look.hairColor, { rough: 0.8 });
    const hairY = 0.15 * hs;
    if (look.hair === 'short' || look.hair === 'bun' || look.hair === 'long') { const cap = new THREE.Mesh(new THREE.SphereGeometry(0.108 * hs, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.42), hairM); cap.position.set(0, 0.118 * hs, -0.008); cap.scale.set(0.97, 1.12, 1.05); addH(cap); }
    if (look.hair === 'buzz') { const cap = new THREE.Mesh(new THREE.SphereGeometry(0.107 * hs, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.36), hairM); cap.position.set(0, 0.116 * hs, -0.004); cap.scale.set(0.95, 1.1, 1.02); addH(cap); }
    if (look.hair === 'bun') { const bun = new THREE.Mesh(new THREE.SphereGeometry(0.045 * hs, 14, 10), hairM); bun.position.set(0, hairY + 0.07, -0.05); addH(bun); }
    if (look.hair === 'long') { const back = this.seg(0.075 * hs, 0.26, hairM); back.position.set(0, 0.03, -0.07 * hs); back.scale.set(1.3, 1, 0.6); addH(back); }
    if (look.hair === 'curly') for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, c = new THREE.Mesh(new THREE.SphereGeometry(0.036 * hs, 10, 8), hairM); c.position.set(Math.cos(a) * 0.075 * hs, hairY + 0.02 + 0.02 * Math.sin(a * 3), Math.sin(a) * 0.07 * hs - 0.01); addH(c); }
    if (F.hood) { const hood = new THREE.Mesh(new THREE.SphereGeometry(0.135 * hs, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), top); hood.position.set(0, 0.09 * hs, -0.05); hood.rotation.x = -0.5; hood.scale.set(1, 0.85, 1); addH(hood); }
    // accessories
    const metal = this.mat('#c8ccd2', { metal: 0.9, rough: 0.25 }), dark = this.mat('#15161a', { rough: 0.4 });
    if (look.accessory === 'headphones') { const band = new THREE.Mesh(new THREE.TorusGeometry(0.118 * hs, 0.012, 8, 26, Math.PI), dark); band.position.set(0, 0.11 * hs, 0); addH(band); for (const x of [-1, 1]) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 18), accent); cup.rotation.z = Math.PI / 2; cup.position.set(x * 0.112 * hs, 0.1 * hs, 0); addH(cup); } }
    if (look.accessory === 'cap') { const c = new THREE.Mesh(new THREE.SphereGeometry(0.112 * hs, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), accent); c.position.set(0, 0.125 * hs, 0); addH(c); const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.01, 20, 1, false, -Math.PI / 2, Math.PI), accent); brim.position.set(0, 0.17 * hs, 0.09 * hs); brim.rotation.x = 0.15; addH(brim); }
    if (look.accessory === 'shades') { const g = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.03, 0.02), dark); g.position.set(0, 0.125 * hs, 0.103 * hs); addH(g); }
    if (look.accessory === 'chain') { const c = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.009, 8, 32), this.mat('#f2c14e', { metal: 1, rough: 0.2 })); c.rotation.x = Math.PI / 2 - 0.4; c.position.set(0, 0.0, 0.04); add(this.bones[this.skeleton.joints.indexOf('Neck')], c); }
    void metal;
  }

  /** map a clip's joints onto our bones (clips from different CMU subjects share joint names, not always order) */
  private mapFor(c: Clip) {
    let m = this.maps.get(c.id);
    if (!m) { m = c.joints.map((n) => this.skeleton.joints.indexOf(n)); this.maps.set(c.id, m); }
    return m;
  }
  /** ground calibration for a clip on this skeleton: lift / sink the root so the feet meet the floor */
  calibrate(c: Clip, samplePose: (t: number) => Pose) {
    if (this.ground.has(c.id)) return;
    const mins: number[] = [];
    for (let k = 0; k < 40; k++) {
      const p = samplePose((k / 40) * ((c.frames - 1) / c.fps));
      this.apply(c, p, false); this.updateMatrixWorld(true);
      let lo = 1e9; for (const n of ['LeftToeBase', 'RightToeBase', 'LeftFoot', 'RightFoot']) { const b = this.bones[this.skeleton.joints.indexOf(n)]; b.getWorldPosition(this.tmpV); lo = Math.min(lo, this.tmpV.y - this.position.y); }
      mins.push(lo);
    }
    mins.sort((a, b) => a - b);
    this.ground.set(c.id, 0.045 - mins[Math.floor(mins.length * 0.25)]);
  }
  apply(c: Clip, p: Pose, grounded = true) {
    const m = this.mapFor(c);
    for (let j = 0; j < m.length; j++) { const b = this.bones[m[j]]; if (b) b.quaternion.set(p.q[j * 4], p.q[j * 4 + 1], p.q[j * 4 + 2], p.q[j * 4 + 3]); }
    this.bones[0].position.set(p.root[0] * S, p.root[1] * S + (grounded ? this.ground.get(c.id) ?? 0 : 0), p.root[2] * S);
  }
  tick(t: number) { for (const h of this.holo) h.uniforms.uTime.value = t; }
}
