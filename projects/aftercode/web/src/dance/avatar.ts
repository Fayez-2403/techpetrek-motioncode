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
  { id: 'scifi', name: 'Sci-fi performance suit' }, { id: 'suit', name: 'Sharp suit + tie' }, { id: 'kurta', name: 'Kurta + Nehru vest' },
  { id: 'lehenga', name: 'Lehenga choli' }, { id: 'leather', name: 'Leather jacket' }, { id: 'sweater', name: 'Cosy knit sweater' },
] as const;
export const HAIR = ['short', 'buzz', 'side', 'quiff', 'curly', 'afro', 'bun', 'ponytail', 'long', 'none'] as const;
export const FACIAL_HAIR = ['none', 'stubble', 'mustache', 'goatee', 'beard'] as const;
export const ACCESSORIES = ['none', 'headphones', 'cap', 'shades', 'glasses', 'chain'] as const;
/** builder swatches: natural skin, hair and eye colours (custom pickers sit next to them) */
export const SKIN_TONES = ['#f6d7c0', '#eabf9c', '#dba57f', '#c98a64', '#ad7350', '#8e5b3d', '#6f4631', '#4e3226'];
export const HAIR_COLORS = ['#0e0c0b', '#2a1c14', '#4a2f1e', '#7a5232', '#b88a52', '#dcc28c', '#8e8e93', '#e9e6df'];
export const EYE_COLORS = ['#2b1d14', '#5a3a22', '#3f6d4e', '#3d5f8c', '#6b6f78'];
export type BodyStyle = (typeof BODY_STYLES)[number]['id'];
export type Outfit = (typeof OUTFITS)[number]['id'];
export interface Look {
  body: BodyStyle; outfit: Outfit; hair: (typeof HAIR)[number]; accessory: (typeof ACCESSORIES)[number]; skin: string; tint: string; hairColor: string; faceScale: number;
  facialHair: (typeof FACIAL_HAIR)[number]; eyes: string; build: number; height: number;
  color: string;   // outfit colour override ('' = the outfit's own): the vest, the suit, the lehenga, else the top
}
export const DEFAULT_LOOK: Look = { body: 'stylized', outfit: 'street', hair: 'short', accessory: 'none', skin: '#c99a7a', tint: '#ffffff', hairColor: '#1c1512', faceScale: 1,
  facialHair: 'none', eyes: '#2b1d14', build: 1, height: 1, color: '' };
export const OUTFIT_COLORS = ['#232a3a', '#59606e', '#8e1f2f', '#263451', '#1f5f4a', '#a3124a', '#e2701f', '#f2c14e', '#f1ece2', '#18181b'];

type Part = 'torso' | 'arm' | 'leg' | 'foot' | 'hand' | 'neck';
interface Fit {
  top: string; bottom: string; shoe: string; accent: string; metal?: number; rough?: number; emissive?: string; bulk?: number; sleeves?: 'long' | 'short' | 'none'; tunic?: boolean; hood?: boolean; plates?: boolean;
  jacket?: 'suit' | 'leather'; shirt?: string;   // open jacket front: a shirt / tee V (+ a tie for the suit) and a jacket hem
  vest?: string; tunicLen?: number;              // Nehru vest over a long kurta
  skirt?: string; midriff?: boolean;             // lehenga: a long flared skirt with a gold hem, a bare midriff
  knit?: boolean;                                // ribbed hem, cuffs and collar
}
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
  suit: { top: '#232a3a', bottom: '#232a3a', shoe: '#2b1a12', accent: '#8e1f2f', sleeves: 'long', rough: 0.5, jacket: 'suit', shirt: '#f3f2ee' },
  kurta: { top: '#f0e9db', bottom: '#f0e9db', shoe: '#5b3a22', accent: '#c9a227', sleeves: 'long', rough: 0.85, vest: '#263451', tunic: true, tunicLen: 0.64 },
  lehenga: { top: '#a3124a', bottom: '#a3124a', shoe: '#d4a64a', accent: '#f2c14e', sleeves: 'short', rough: 0.45, skirt: '#a3124a', midriff: true },
  leather: { top: '#18181b', bottom: '#2b4a74', shoe: '#121214', accent: '#f1f0ec', sleeves: 'long', rough: 0.3, jacket: 'leather', shirt: '#f1f0ec' },
  sweater: { top: '#7d9070', bottom: '#c3ad92', shoe: '#5a3a22', accent: '#ece2d0', sleeves: 'long', rough: 0.95, bulk: 1.06, knit: true },
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
  faceSlot = new THREE.Group();                   // the photo face (face/faces.ts) goes here
  seed = 0;                                       // per-dancer phase for blinks
  private hasPhoto = false;
  private face: { group: THREE.Group; eyes: THREE.Object3D[]; brows: THREE.Object3D[]; smile: THREE.Object3D; open: THREE.Object3D } | null = null;
  private beard = new THREE.Group();
  private tmpV = new THREE.Vector3();

  constructor(skeleton: Clip, look: Look = DEFAULT_LOOK) {
    super();
    this.skeleton = skeleton; this.look = look;
    for (let j = 0; j < skeleton.joints.length; j++) {
      const b = new THREE.Bone(); b.name = skeleton.joints[j];
      const o = skeleton.offsets[j], n = skeleton.joints[j];
      const toy = look.body === 'stylized' || look.body === 'anime';   // designer-toy proportions: shorter legs + arms, same rotations
      const k = (toy ? (/Leg|Foot|Toe/.test(n) ? 0.88 : /Arm|Hand|Thumb|Finger/.test(n) ? 0.93 : 1) : 1) * (look.height ?? 1);   // height scales the skeleton, not the head
      b.position.set(o[0] * S * k, o[1] * S * k, o[2] * S * k);
      if (skeleton.parents[j] >= 0) this.bones[skeleton.parents[j]].add(b); else this.add(b);
      this.bones.push(b);
    }
    this.head = this.bones[skeleton.joints.indexOf('Head')];
    this.head.add(this.faceSlot);
    this.dressUp(look);
  }

  private mat(color: string, opt: { metal?: number; rough?: number; emissive?: string; ei?: number; side?: THREE.Side } = {}): THREE.Material {
    const m = this.matBase(color, opt); if (opt.side !== undefined) m.side = opt.side; return m;
  }
  private matBase(color: string, opt: { metal?: number; rough?: number; emissive?: string; ei?: number }): THREE.Material {
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
    const F0 = FITS[look.outfit], c = look.color, stylized = look.body === 'stylized' || look.body === 'anime';
    const F: Fit = !c ? F0 : F0.vest ? { ...F0, vest: c } : F0.skirt ? { ...F0, top: c, bottom: c, skirt: c } : { ...F0, top: c, bottom: F0.bottom === F0.top ? c : F0.bottom };
    const skin = this.mat(look.skin, { rough: 0.55 }), top = this.mat(F.top, { metal: F.metal, rough: F.rough }), bottom = this.mat(F.bottom, { metal: F.metal, rough: F.rough });
    const shoe = this.mat(F.shoe, { rough: 0.4 }), accent = this.mat(F.accent, { emissive: F.emissive, ei: F.emissive ? 1.4 : 0, metal: F.metal });
    const android = look.body === 'android', joint = this.mat(android ? '#2b2f36' : look.skin, { metal: android ? 0.9 : 0 });
    const add = (bone: THREE.Object3D, o: THREE.Object3D) => { o.userData.dress = true; bone.add(o); };
    const build = look.build ?? 1, bulk = (F.bulk ?? 1) * build;
    const lp = look.body === 'lowpoly', RS = lp ? 6 : 20;
    const along = (o: THREE.Object3D, dir: THREE.Vector3) => { o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()); };
    for (let j = 0; j < this.bones.length; j++) {
      const b = this.bones[j], name = b.name, part = PART[name];
      if (!part) continue;
      const kids = b.children.filter((c) => (c as THREE.Bone).isBone) as THREE.Bone[];
      const child = kids.find((c) => c.name === 'Neck') ?? kids[0];   // the chest follows the spine to the neck, not a shoulder
      if (part === 'hand') {   // mitten hand
        const sx = name.startsWith('Left') ? 1 : -1;
        const h = new THREE.Mesh(new THREE.SphereGeometry(stylized ? 0.052 : 0.046, RS, 12), skin); h.scale.set(0.82, 1.15, 0.62); h.position.set(sx * 0.035, -0.01, 0); add(b, h);
        const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.03, 4, 10), skin); th.position.set(sx * 0.02, 0.0, 0.03); th.rotation.set(0.9, 0, sx * 0.5); add(b, th);   // thumb
        continue;
      }
      if (part === 'foot') {   // rounded sneaker
        const f = new THREE.Mesh(new RoundedBoxGeometry(0.105, 0.085, 0.27, lp ? 1 : 4, 0.035), shoe); f.position.set(0, -0.04, 0.075);
        const sole = new THREE.Mesh(new RoundedBoxGeometry(0.112, 0.028, 0.28, 2, 0.012), this.mat(F.shoe === '#f4f4f2' || F.shoe === '#f2f2f0' || F.shoe === '#ffffff' ? '#d9d9de' : '#1a1a1e', { rough: 0.7 })); sole.position.set(0, -0.08, 0.077);
        if (look.outfit === 'hoodie' || look.outfit === 'street' || look.outfit === 'neon') { f.scale.set(1.12, 1.15, 1.06); sole.scale.set(1.12, 1.2, 1.06); }
        add(b, f); add(b, sole); continue;
      }
      if (!child || name === 'Neck') continue;   // CMU: Neck sits exactly on Spine1 (offset 0), so it is drawn as part of the chest
      const dir = child.position.clone();
      if (name === 'Spine1' && dir.length() < 1e-4) { const n1 = child.children.find((c) => (c as THREE.Bone).isBone); if (n1) dir.add(n1.position); }   // the chest runs from Spine1 up to Neck1
      const len = dir.length(); if (len < 1e-4) continue;
      const isArm = part === 'arm', isLeg = part === 'leg', upper = /UpLeg|Arm$/.test(name) && !/Fore/.test(name);
      if (part === 'torso') {
        // sculpted torso: abdomen (LowerBack), waist (Spine), chest (Spine1) as lathe profiles, flattened front-to-back
        const prof = name === 'Spine1' ? [[0.122, 0], [0.15, 0.35], [0.172, 0.7], [0.165, 0.92], [0.1, 1.08], [0.001, 1.13]]
          : name === 'Spine' ? [[0.112, -0.05], [0.108, 0.5], [0.12, 1.05]] : [[0.13, -0.1], [0.118, 0.5], [0.112, 1.05]];
        const pts = prof.map(([r, y]) => new THREE.Vector2(r * bulk * (stylized ? 0.96 : 1), y * len));
        const g = new THREE.LatheGeometry(pts, lp ? 7 : 28); const m = new THREE.Mesh(g, F.midriff && name === 'Spine' ? skin : top); along(m, dir); m.scale.set(1, 1, 1);
        const wrap = new THREE.Group(); wrap.add(m); wrap.scale.set(1.05, 1, 0.74); add(b, wrap); m.castShadow = true;
        if (F.vest && name !== 'LowerBack') {   // Nehru vest: a slightly larger sleeveless shell over the kurta
          const vg = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r * bulk * 1.05 * (stylized ? 0.96 : 1), y * len * (name === 'Spine1' ? 0.94 : 1))), lp ? 7 : 28);
          const v = new THREE.Mesh(vg, this.mat(F.vest, { rough: 0.7 })); along(v, dir); const vw = new THREE.Group(); vw.add(v); vw.scale.set(1.05, 1, 0.76); add(b, vw);
        }
        if (name === 'Spine1') {
          // chest front depth at a fraction of the bone length (the lathe profile, flattened like the torso wrap)
          const rAt = (yf: number) => { for (let k = 1; k < prof.length; k++) if (yf <= prof[k][1]) { const [r0, y0] = prof[k - 1], [r1, y1] = prof[k]; return r0 + ((r1 - r0) * (yf - y0)) / (y1 - y0); } return prof[prof.length - 1][0]; };
          const zAt = (yf: number, shell = 1) => rAt(yf) * bulk * (stylized ? 0.96 : 1) * shell * (shell > 1 ? 0.76 : 0.74);
          const onChest = (o: THREE.Object3D, yf: number, lift: number, shell = 1) => { o.position.copy(dir).multiplyScalar(yf).add(new THREE.Vector3(0, 0, zAt(yf, shell) + lift)); add(b, o); };
          if (F.jacket) {   // open jacket: the shirt / tee shows in a V from the collar, a tie for the suit
            const vh = 0.17, yTop = 0.97, yTip = yTop - vh / len;
            const v = new THREE.Shape(); v.moveTo(-0.055, 0); v.lineTo(0.055, 0); v.lineTo(0, -vh); v.closePath();
            const vm = new THREE.Mesh(new THREE.ShapeGeometry(v), this.mat(F.shirt ?? '#ffffff', { rough: 0.7 }));
            vm.rotation.x = -Math.asin(Math.max(-0.9, Math.min(0.9, (zAt(yTip) - zAt(yTop)) / vh))); onChest(vm, yTop, 0.004);
            if (F.jacket === 'suit') { const tie = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.16, 0.012, 2, 0.005), accent); tie.rotation.x = -0.1; onChest(tie, yTop - 0.09 / len, 0.008); }
          }
          if (F.vest) for (let k = 0; k < 3; k++) onChest(new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), accent), 0.8 - k * 0.22, 0.004, 1.05);
          if (F.vest || F.knit || F.jacket) {   // collar
            const col = new THREE.Mesh(new THREE.TorusGeometry(0.064, F.knit ? 0.016 : 0.013, 8, 26), F.vest ? this.mat(F.vest, { rough: 0.7 }) : F.knit ? accent : top);
            col.position.copy(dir).multiplyScalar(1.02); col.rotation.x = Math.PI / 2 - 0.25; add(b, col);
          }
          for (const side of [-1, 1]) {   // shoulder caps
            const sc = new THREE.Mesh(new THREE.SphereGeometry(0.062 * (bulk > 1 ? 1.2 : 1) * (F.jacket === 'suit' ? 1.12 : 1), RS, 12), F.sleeves === 'none' ? skin : top);
            sc.position.copy(dir).multiplyScalar(0.84).add(new THREE.Vector3(side * 0.16 * bulk, 0, 0)); add(b, sc);
          }
        }
        continue;
      }
      let r0 = (RADIUS[name] ?? 0.05) * (stylized ? 1.25 : 1.08) * (part === 'neck' ? 1 : build), m: THREE.Material = skin;
      const taper = isLeg ? (upper ? 0.72 : 0.7) : isArm ? (upper ? 0.8 : 0.78) : 0.95;
      if (isLeg) { m = bottom; r0 *= (look.outfit === 'contemporary' ? 0.9 : 1.12) * (stylized ? 1.05 : 1); }
      if (isArm) { const sl = F.sleeves; m = sl === 'long' || (sl === 'short' && upper) ? top : skin; if (m === top) r0 *= bulk > 1 ? 1.28 : 1.1; }
      const neck = part === 'neck', L = neck ? len * 0.8 : len;   // the neck stops under the chin, so a head tilted back never shows it in front of the face
      if (neck) { m = skin; r0 *= 0.86; }
      const g = new THREE.CylinderGeometry(r0 * taper, r0, L, RS, 1, false); g.translate(0, L / 2, 0);
      const seg = new THREE.Mesh(g, m); seg.castShadow = true; along(seg, dir); add(b, seg);
      // rounded joint at the far end (knee / elbow / ankle / wrist), sized to the narrower end so the silhouette is smooth
      if (!neck) { const k = new THREE.Mesh(new THREE.SphereGeometry(r0 * taper * 1.0, RS, 12), android ? joint : m); add(child, k); }
      if (upper) { const k0 = new THREE.Mesh(new THREE.SphereGeometry(r0 * 0.98, RS, 12), m); add(b, k0); }
      if (F.plates && upper) { const pl = new THREE.Mesh(new RoundedBoxGeometry(r0 * 2.2, len * 0.55, r0 * 0.7, 2, 0.01), accent); pl.position.copy(dir).multiplyScalar(0.5).add(new THREE.Vector3(0, 0, r0 * 0.75)); along(pl, dir); add(b, pl); }
      if (F.emissive && !upper && (isArm || isLeg)) { const ring = new THREE.Mesh(new THREE.TorusGeometry(r0 * taper * 1.12, 0.006, 6, 28), accent); ring.position.copy(dir).multiplyScalar(0.85); along(ring, dir); ring.rotateX(Math.PI / 2); add(b, ring); }
      if ((look.outfit === 'hoodie' || F.knit) && isArm && !upper) { const cuff = new THREE.Mesh(new THREE.TorusGeometry(r0 * taper * 1.18, 0.014, 8, 24), top); cuff.position.copy(dir).multiplyScalar(0.95); along(cuff, dir); cuff.rotateX(Math.PI / 2); add(b, cuff); }
    }
    // tunic (festive): a flared kurta hem from the hips; trim in gold
    const hips = this.bones[0];
    if (F.tunic) {
      const L = F.tunicLen ?? 0.42, r1 = 0.16 + (F.vest ? 0.11 : 0.24) * L;   // a kurta falls straighter than a festive flare
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * bulk, r1 * bulk, L, 22, 1, true), this.mat(F.top, { rough: F.rough, side: THREE.DoubleSide })); t.position.set(0, 0.09 - L / 2, 0); add(hips, t);
      const hem = new THREE.Mesh(new THREE.TorusGeometry(r1 * bulk, 0.012, 6, 30), accent); hem.rotation.x = Math.PI / 2; hem.position.set(0, 0.09 - L, 0); add(hips, hem);
    }
    if (F.skirt) {   // lehenga: a long flared skirt from the waist to the ankles, gold hem
      const L = 0.76 * (stylized ? 0.88 : 1) * (look.height ?? 1), top0 = 0.07, rb = 0.4;   // hem just above the ankles
      const sk = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * bulk, rb, L, 36, 3, true), this.mat(F.skirt, { rough: 0.45, side: THREE.DoubleSide })); sk.position.set(0, top0 - L / 2, 0); add(hips, sk);
      for (const f of [1, 0.8]) { const r = 0.15 * bulk + (rb - 0.15 * bulk) * f; const hem = new THREE.Mesh(new THREE.TorusGeometry(r, 0.011, 6, 40), accent); hem.rotation.x = Math.PI / 2; hem.position.set(0, top0 - L * f, 0); add(hips, hem); }
    }
    if (F.jacket === 'suit') {   // jacket skirt over the hips
      const j = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * bulk, 0.168 * bulk, 0.17, 24, 1, true), this.mat(F.top, { rough: F.rough, side: THREE.DoubleSide })); j.position.set(0, 0.0, 0); j.scale.z = 0.82; add(hips, j);
    }
    if (F.knit) { const rib = new THREE.Mesh(new THREE.TorusGeometry(0.15 * bulk, 0.02, 8, 30), accent); rib.rotation.x = Math.PI / 2; rib.position.set(0, 0.05, 0); rib.scale.y = 0.8; add(hips, rib); }
    if (F.emissive && !F.tunic) { const belt = new THREE.Mesh(new THREE.TorusGeometry(0.15 * bulk, 0.01, 6, 28), accent); belt.rotation.x = Math.PI / 2; belt.position.set(0, 0.02, 0); add(this.bones[0], belt); }
    // hips block
    const pelvis = this.seg(0.105 * Math.max(1, bulk * 0.9), 0.15, F.tunic ? top : bottom); pelvis.rotation.z = Math.PI / 2; pelvis.scale.set(1, 1.05, 0.78); pelvis.position.y = -0.03; add(this.bones[0], pelvis);
    // head: a slightly narrow egg, ears, and (unless a photo face is on) a drawn face sitting ON the head surface
    const hs = stylized ? 1.4 : 1.1;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.105 * hs, look.body === 'lowpoly' ? 8 : 32, look.body === 'lowpoly' ? 6 : 24), android ? this.mat('#cfd5de', { metal: 0.8, rough: 0.25 }) : skin);
    const hg = new THREE.Group(); hg.position.set(0, -0.045 * hs, 0.012 * hs); add(this.head, hg); const addH = (o: THREE.Object3D) => add(hg, o);   // head a touch forward + down: the chin covers the neck
    head.scale.set(0.92, 1.1, 1); head.position.set(0, 0.11 * hs, 0.0); head.castShadow = true; addH(head);
    this.faceSlot.position.set(0, 0.06 * hs, 0.1 * hs); this.faceSlot.scale.setScalar(hs * look.faceScale);
    const rx = 0.105 * hs * 0.92, ry = 0.105 * hs * 1.1, rz = 0.105 * hs, cy = 0.11 * hs;
    /** put o on the head's front surface at (x, y) (head-group units), lifted along the surface normal and facing out */
    const place = (o: THREE.Object3D, x: number, y: number, lift = 0, parent: THREE.Object3D = hg) => {
      const u = x / rx, v = (y - cy) / ry, w = Math.sqrt(Math.max(0.0004, 1 - u * u - v * v));
      const n = new THREE.Vector3(u / rx, v / ry, w / rz).normalize();
      o.position.set(x, y, rz * w).addScaledVector(n, lift); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n); o.userData.dress = true; parent.add(o);
    };
    if (!android) for (const sx of [-1, 1]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.026 * hs, 14, 10), skin); ear.scale.set(0.42, 1, 0.72); ear.position.set(sx * rx * 0.97, cy - 0.012 * hs, -0.006 * hs); addH(ear); }
    const f = hs * look.faceScale;
    const face = new THREE.Group(); face.userData.dress = true; hg.add(face);
    const eyes: THREE.Object3D[] = [], brows: THREE.Object3D[] = [];
    if (android) for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.012 * f, 10, 8), this.mat('#5cf6ff', { emissive: '#5cf6ff', ei: 3 })); place(e, sx * 0.035 * f, cy - 0.005 * hs, 0.002, face); eyes.push(e); }
    else {
      const white = new THREE.MeshStandardMaterial({ color: '#f7f4ef', roughness: 0.25 }), iris = new THREE.MeshStandardMaterial({ color: look.eyes ?? '#2b1d14', roughness: 0.3 });
      const pupil = new THREE.MeshStandardMaterial({ color: '#0a0807', roughness: 0.2 }), glint = new THREE.MeshBasicMaterial({ color: '#ffffff' });
      const browM = this.mat(look.hairColor, { rough: 0.8 });
      for (const sx of [-1, 1]) {
        const eye = new THREE.Group(); place(eye, sx * 0.036 * f, cy - 0.008 * hs, 0, face); eyes.push(eye);
        eye.quaternion.slerp(new THREE.Quaternion(), 0.7);   // eyes look forward, not along the head's curve
        const w = new THREE.Mesh(new THREE.SphereGeometry(0.0165 * f, 16, 12), white); w.scale.set(1, 1.12, 0.42); eye.add(w);
        const ir = new THREE.Mesh(new THREE.SphereGeometry(0.0102 * f, 14, 10), iris); ir.scale.set(1, 1, 0.38); ir.position.set(0, -0.0015 * f, 0.0052 * f); eye.add(ir);
        const pu = new THREE.Mesh(new THREE.SphereGeometry(0.0049 * f, 10, 8), pupil); pu.scale.set(1, 1, 0.35); pu.position.set(0, -0.0015 * f, 0.0082 * f); eye.add(pu);
        const gl = new THREE.Mesh(new THREE.SphereGeometry(0.0024 * f, 8, 6), glint); gl.position.set(0.0038 * f, 0.0032 * f, 0.0098 * f); eye.add(gl);
        const br = new THREE.Mesh(new RoundedBoxGeometry(0.034 * f, 0.0075 * f, 0.007 * f, 2, 0.003 * f), browM); place(br, sx * 0.037 * f, cy + 0.024 * hs, 0.003 * hs, face); br.userData.sx = sx; br.userData.q0 = br.quaternion.clone(); brows.push(br);
      }
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.0125 * f, 12, 10), this.mat('#' + new THREE.Color(look.skin).multiplyScalar(0.9).getHexString(), { rough: 0.55 })); nose.scale.set(0.85, 1, 0.9); place(nose, 0, cy - 0.036 * hs, 0.002 * hs, face);
    }
    const lip = new THREE.MeshStandardMaterial({ color: android ? '#5cf6ff' : '#6b2a26', roughness: 0.45, emissive: android ? '#5cf6ff' : '#000000', emissiveIntensity: android ? 1.5 : 0 });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.017 * f, 0.0032 * f, 6, 18, Math.PI), lip); place(smile, 0, cy - 0.064 * hs, 0.002 * hs, face); smile.rotateZ(Math.PI);
    const open = new THREE.Group(); place(open, 0, cy - 0.066 * hs, 0.0015 * hs, face);
    const cave = new THREE.Mesh(new THREE.SphereGeometry(0.016 * f, 14, 10), new THREE.MeshStandardMaterial({ color: '#2a0d0c', roughness: 0.6 })); cave.scale.set(1.15, 0.75, 0.3); open.add(cave);
    if (!android) { const teeth = new THREE.Mesh(new RoundedBoxGeometry(0.022 * f, 0.0045 * f, 0.004 * f, 1, 0.0015 * f), new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.3 })); teeth.position.set(0, 0.0072 * f, 0.004 * f); open.add(teeth); }
    open.visible = false;
    this.face = { group: face, eyes, brows, smile, open };
    // facial hair (drawn faces only: a photo face brings its own)
    this.beard = new THREE.Group(); this.beard.userData.dress = true; hg.add(this.beard);
    if (look.facialHair && look.facialHair !== 'none' && !android) {
      const fh = look.facialHair, opaque = fh !== 'stubble';
      const hm = new THREE.MeshStandardMaterial({ color: look.hairColor, roughness: 0.9, transparent: !opaque, opacity: opaque ? 1 : 0.26, depthWrite: opaque });
      const shell = (r: number, phi0: number, phiL: number, th0: number, thL: number) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.105 * hs * r, 30, 14, phi0, phiL, th0, thL), hm); s.position.set(0, cy, 0); s.scale.set(0.92, 1.1, 1); this.beard.add(s); };
      if (fh === 'beard' || fh === 'stubble') {
        const r = fh === 'beard' ? 1.05 : 1.012;
        shell(r, 0, Math.PI, Math.PI * 0.71, Math.PI * 0.25);                                                                              // jaw + chin, below the mouth
        if (fh === 'beard') { shell(r, Math.PI * 0.02, Math.PI * 0.1, Math.PI * 0.48, Math.PI * 0.24); shell(r, Math.PI * 0.88, Math.PI * 0.1, Math.PI * 0.48, Math.PI * 0.24); }   // narrow sideburns by the ears
        if (fh === 'beard') { const chin = new THREE.Mesh(new THREE.SphereGeometry(0.03 * hs, 14, 10), hm); chin.scale.set(1.25, 1, 0.75); place(chin, 0, cy - 0.1 * hs, -0.004 * hs, this.beard); }
      }
      if (fh === 'mustache' || fh === 'goatee' || fh === 'beard') for (const sx of [-1, 1]) {
        const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.0055 * hs, 0.018 * hs, 4, 10), hm); place(m, sx * 0.011 * hs, cy - 0.05 * hs, 0.004 * hs, this.beard); m.rotateZ(sx * (Math.PI / 2 - 0.28));
      }
      if (fh === 'goatee') { const g = new THREE.Mesh(new THREE.SphereGeometry(0.016 * hs, 12, 10), hm); g.scale.set(1, 1.25, 0.6); place(g, 0, cy - 0.092 * hs, 0.002 * hs, this.beard); }
    }
    this.setPhoto(this.hasPhoto);
    // hair
    const hairM = this.mat(look.hairColor, { rough: 0.8 });
    const hairY = 0.15 * hs;
    const capOf = (r: number, th: number, y: number, z: number, sx = 0.97, sy = 1.12, sz = 1.05) => { const c = new THREE.Mesh(new THREE.SphereGeometry(r * hs, 28, 16, 0, Math.PI * 2, 0, Math.PI * th), hairM); c.position.set(0, y * hs, z); c.scale.set(sx, sy, sz); c.castShadow = true; addH(c); return c; };
    if (['short', 'bun', 'long', 'side', 'ponytail'].includes(look.hair)) capOf(0.108, 0.42, 0.118, -0.008);
    if (look.hair === 'buzz' || look.hair === 'quiff') capOf(0.107, 0.36, 0.116, -0.004, 0.95, 1.1, 1.02);
    if (look.hair === 'side') { const sw = new THREE.Mesh(new THREE.SphereGeometry(0.06 * hs, 18, 12), hairM); sw.scale.set(1.55, 0.5, 1.15); sw.position.set(0.024 * hs, cy + 0.088 * hs, 0.03 * hs); sw.rotation.set(-0.25, 0, -0.32); addH(sw); }
    if (look.hair === 'quiff') { const q = new THREE.Mesh(new THREE.SphereGeometry(0.056 * hs, 18, 12), hairM); q.scale.set(1.3, 0.78, 1.05); q.position.set(0, cy + 0.098 * hs, 0.042 * hs); q.rotation.x = -0.55; addH(q); }
    if (look.hair === 'afro') {
      const a = new THREE.Mesh(new THREE.SphereGeometry(0.15 * hs, 30, 18, 0, Math.PI * 2, 0, Math.PI * 0.42), hairM); a.position.set(0, cy + 0.04 * hs, -0.03 * hs); a.scale.set(1.04, 1, 1); addH(a);
      const back = new THREE.Mesh(new THREE.SphereGeometry(0.15 * hs, 30, 10, Math.PI * 0.85, Math.PI * 1.3, Math.PI * 0.42, Math.PI * 0.2), hairM); back.position.copy(a.position); back.scale.copy(a.scale); addH(back);
    }
    if (look.hair === 'bun') { const bun = new THREE.Mesh(new THREE.SphereGeometry(0.045 * hs, 14, 10), hairM); bun.position.set(0, hairY + 0.07, -0.05); addH(bun); }
    if (look.hair === 'ponytail') {
      const tie = new THREE.Mesh(new THREE.SphereGeometry(0.024 * hs, 10, 8), hairM); tie.position.set(0, cy + 0.06 * hs, -0.105 * hs); addH(tie);
      const tail = this.seg(0.032 * hs, 0.2, hairM); tail.position.set(0, cy - 0.03 * hs, -0.13 * hs); tail.rotation.x = 0.3; tail.scale.set(1, 1, 0.8); addH(tail);
    }
    if (look.hair === 'long') {
      const back = this.seg(0.075 * hs, 0.26, hairM); back.position.set(0, 0.03, -0.07 * hs); back.scale.set(1.3, 1, 0.6); addH(back);
      for (const sx of [-1, 1]) { const c = this.seg(0.028 * hs, 0.17, hairM); c.position.set(sx * rx * 0.93, cy - 0.04 * hs, -0.004 * hs); c.scale.set(1, 1, 0.7); addH(c); }   // side curtains frame the face
    }
    if (look.hair === 'curly') {   // a base cap, then curls round the crown and over the top (no bare scalp)
      capOf(0.107, 0.4, 0.118, -0.008, 0.97, 1.1, 1.04);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.3, c = new THREE.Mesh(new THREE.SphereGeometry(0.034 * hs, 10, 8), hairM); c.position.set(Math.cos(a) * 0.042 * hs, hairY + 0.058 + 0.012 * Math.sin(a * 2), Math.sin(a) * 0.04 * hs - 0.012); addH(c); }
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.036 * hs, 10, 8), hairM); top.position.set(0, hairY + 0.075, -0.01); addH(top);
    }
    if (look.hair === 'curly') for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, c = new THREE.Mesh(new THREE.SphereGeometry(0.036 * hs, 10, 8), hairM); c.position.set(Math.cos(a) * 0.075 * hs, hairY + 0.02 + 0.02 * Math.sin(a * 3), Math.sin(a) * 0.07 * hs - 0.01); addH(c); }
    if (F.hood) { const hood = new THREE.Mesh(new THREE.SphereGeometry(0.135 * hs, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), top); hood.position.set(0, 0.09 * hs, -0.05); hood.rotation.x = -0.5; hood.scale.set(1, 0.85, 1); addH(hood); }
    // accessories
    const dark = this.mat('#15161a', { rough: 0.4 });
    if (look.accessory === 'headphones') { const band = new THREE.Mesh(new THREE.TorusGeometry(0.118 * hs, 0.012, 8, 26, Math.PI), dark); band.position.set(0, 0.11 * hs, 0); addH(band); for (const x of [-1, 1]) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 18), accent); cup.rotation.z = Math.PI / 2; cup.position.set(x * 0.112 * hs, 0.1 * hs, 0); addH(cup); } }
    if (look.accessory === 'cap') { const c = new THREE.Mesh(new THREE.SphereGeometry(0.112 * hs, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), accent); c.position.set(0, 0.125 * hs, 0); addH(c); const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.01, 20, 1, false, -Math.PI / 2, Math.PI), accent); brim.position.set(0, 0.17 * hs, 0.09 * hs); brim.rotation.x = 0.15; addH(brim); }
    if (look.accessory === 'shades' || look.accessory === 'glasses') {   // lenses on the eyes, a bridge, temples back to the ears
      const shades = look.accessory === 'shades', frame = this.mat(shades ? '#121316' : '#1d1d22', { metal: 0.6, rough: 0.3 });
      const lensM = shades ? new THREE.MeshStandardMaterial({ color: '#0b0c10', roughness: 0.08, metalness: 0.4 }) : new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.16, roughness: 0.05, depthWrite: false });
      for (const sx of [-1, 1]) {
        const g = new THREE.Group(); place(g, sx * 0.036 * f, cy - 0.006 * hs, 0.012 * hs);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.02 * f, 24), lensM); lens.scale.set(1.12, shades ? 0.86 : 0.92, 1); g.add(lens);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.0205 * f, 0.0022 * f, 6, 28), frame); rim.scale.copy(lens.scale); g.add(rim);
        const temple = new THREE.Mesh(new THREE.BoxGeometry(0.003 * f, 0.003 * f, 0.1 * hs), frame); temple.position.set(sx * rx * 0.99, cy - 0.003 * hs, -0.005 * hs); temple.rotation.y = sx * 0.12; addH(temple);
      }
      const bridge = new THREE.Mesh(new THREE.TorusGeometry(0.009 * f, 0.0018 * f, 5, 12, Math.PI), frame); place(bridge, 0, cy, 0.012 * hs);
    }
    if (look.accessory === 'chain') { const c = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.009, 8, 32), this.mat('#f2c14e', { metal: 1, rough: 0.2 })); c.rotation.x = Math.PI / 2 - 0.4; c.position.set(0, 0.0, 0.04); add(this.bones[this.skeleton.joints.indexOf('Neck')], c); }
  }

  /** a photo face replaces the drawn face and the facial hair */
  setPhoto(on: boolean) { this.hasPhoto = on; if (this.face) this.face.group.visible = !on; this.beard.visible = !on; }

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
  /** per frame, pure in (t, beat, rap): hologram scan, blinks, and the mouth rapping on eighth notes while this dancer has the floor */
  tick(t: number, b = 0, rap = 0) {
    for (const h of this.holo) h.uniforms.uTime.value = t;
    const F = this.face; if (!F) return;
    const ph = (((t + this.seed * 1.37) % 3.4) + 3.4) % 3.4, blink = ph < 0.13 ? 0.12 + 0.88 * Math.abs(ph / 0.065 - 1) : 1;
    for (const e of F.eyes) e.scale.y = blink;
    const open = rap > 0.05 ? rap * (0.3 + 0.7 * Math.abs(Math.sin(Math.PI * b * 2))) : 0;
    F.open.visible = open > 0.1; F.smile.visible = !F.open.visible; F.open.scale.set(1, Math.max(0.15, open), 1);
    for (const br of F.brows) { br.quaternion.copy(br.userData.q0 as THREE.Quaternion); br.rotateZ((br.userData.sx as number) * 0.32 * Math.min(1, rap)); }   // inner ends down: fierce
  }
}
