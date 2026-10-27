// CASE BOARD scene (board builder): the dark incident-room evidence board rendered from a BoardState (CaseBoardChoreo).
// Cheap, deterministic look-dev (no post passes): fake depth of field = texture mip bias by distance from the focus
// plane; contact shadows = blurred dark planes projected from the lamp; glow = additive shells / sprites; strings are
// a cylinder bent in the vertex shader (sag, snap vibration, draw-on, running light pulse).
import React, { useLayoutEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CamRig, Env, type V3 } from './stage';
import { mulberry32 } from '../lib/rng';
import { C } from '../styles/theme';
import { BOARD_CARDS, BOARD_STRINGS, CH, CT, CW, FLAT_DZ, STAMP, TACKS, Z_CARD, Z_FRONT, px2local, type BoardCard, type PrintSpot } from './CaseBoardLayout';
import type { BoardAssets } from './CaseBoardTextures';
import type { BoardState, CardState, PinState, StringState } from './CaseBoardChoreo';

// ---------------------------------------------------------------- lamp geometry (shared by lights, beam, dust, strings)
const PIVOT: V3 = [-1.0, 9.6, 3.25];
const CORD = 7.05;
const REST: V3 = [PIVOT[0], PIVOT[1] - CORD, PIVOT[2]];
const AIM: V3 = [0.12, 0.05, 0];
const HOT_AIM: V3 = [BOARD_CARDS[0].x + 0.05, BOARD_CARDS[0].y + 0.26, 0];   // hard pool on the Railway headline + stamp
export const BEAM_HALF = 0.56;           // visible cone half-angle (rad)
export function lampAt(theta: number, sway: number) {
  const pos: V3 = [PIVOT[0] + Math.sin(theta) * CORD, PIVOT[1] - Math.cos(theta) * CORD, PIVOT[2] + Math.sin(sway) * CORD * 0.4];
  const dx = pos[0] - REST[0], dz = pos[2] - REST[2];
  const aim: V3 = [AIM[0] + dx * 0.55, AIM[1], 0];
  const hot: V3 = [HOT_AIM[0] + dx * 0.4, HOT_AIM[1] + dz * 0.1, 0];
  const d = new THREE.Vector3(aim[0] - pos[0], aim[1] - pos[1], aim[2] - pos[2]).normalize();
  return { pos, aim, hot, dir: d };
}

// ---------------------------------------------------------------- fake depth of field (mip bias) for standard materials
export const DOF = { uFocus: { value: 3 }, uDofK: { value: 0 }, uDofMax: { value: 4.5 } };
function dof<T extends THREE.MeshStandardMaterial>(m: T): T {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uFocus = DOF.uFocus; sh.uniforms.uDofK = DOF.uDofK; sh.uniforms.uDofMax = DOF.uDofMax;
    const fn = 'uniform float uFocus;\nuniform float uDofK;\nuniform float uDofMax;\nfloat dofBias() { return clamp( abs( length( vViewPosition ) - uFocus ) * uDofK, 0.0, uDofMax ); }\n';
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <bumpmap_pars_fragment>', fn + THREE.ShaderChunk.bumpmap_pars_fragment.replace(/texture2D\( bumpMap, (vBumpMapUv[^)]*)\)/g, 'texture2D( bumpMap, $1, dofBias() )'))
      .replace('#include <map_fragment>', THREE.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )', 'texture2D( map, vMapUv, dofBias() )'));
  };
  m.customProgramCacheKey = () => 'casedof1';
  return m;
}

// ---------------------------------------------------------------- shared geometry
const G = {
  card: new THREE.BoxGeometry(CW, CH, CT),
  plane: new THREE.PlaneGeometry(1, 1),
  cardPlane: new THREE.PlaneGeometry(CW, CH),
  string: new THREE.CylinderGeometry(1, 1, 1, 8, 96, true).translate(0, 0.5, 0),
  cone: new THREE.LatheGeometry([new THREE.Vector2(0.0001, 0), new THREE.Vector2(1, 1)], 64, 0, Math.PI * 2),
  pin: new THREE.LatheGeometry([[0.0001, 0], [0.026, 0], [0.027, 0.005], [0.024, 0.01], [0.0115, 0.016], [0.0105, 0.039], [0.016, 0.045], [0.031, 0.051],
    [0.0345, 0.059], [0.031, 0.067], [0.019, 0.0725], [0.0001, 0.075]].map(([x, y]) => new THREE.Vector2(x, y)), 28).rotateX(Math.PI / 2),
  needle: new THREE.CylinderGeometry(0.0032, 0.0018, 0.05, 10).rotateX(Math.PI / 2).translate(0, 0, -0.025),
  tackHead: new THREE.CylinderGeometry(0.0175, 0.019, 0.0055, 24).rotateX(Math.PI / 2).translate(0, 0, 0.0375),
  tackShaft: new THREE.CylinderGeometry(0.0034, 0.0034, 0.036, 10).rotateX(Math.PI / 2).translate(0, 0, 0.018),
  shade: new THREE.LatheGeometry([[0.3, 0], [0.284, 0.035], [0.25, 0.1], [0.19, 0.18], [0.12, 0.26], [0.076, 0.32], [0.06, 0.36], [0.03, 0.37]].map(([x, y]) => new THREE.Vector2(x * 0.78, y * 0.78)), 48),
  rim: new THREE.TorusGeometry(0.3 * 0.78, 0.008, 8, 64).rotateX(Math.PI / 2),
  bulb: new THREE.SphereGeometry(0.06, 24, 16),
  cord: new THREE.CylinderGeometry(0.008, 0.008, 1, 8).translate(0, 0.5, 0),
};
const ZERO_Q = new THREE.Quaternion();

// ---------------------------------------------------------------- strings
const STR_VERT = /* glsl */`
uniform vec3 uA; uniform vec3 uB; uniform float uDraw; uniform float uSag; uniform float uVib; uniform vec3 uVibDir; uniform float uRadius;
varying float vS; varying vec3 vN; varying vec3 vW; varying float vAng;
vec3 curve(float s) { return mix(uA, uB, s) + vec3(0.0, -1.0, 0.0) * uSag * 4.0 * s * (1.0 - s) + uVibDir * uVib * sin(3.14159265 * s); }
void main() {
  float s = position.y * uDraw;
  vec3 P = curve(s);
  vec3 T = normalize(curve(min(s + 0.004, 1.0)) - curve(max(s - 0.004, 0.0)) + vec3(1e-7));
  vec3 ref = abs(T.z) < 0.9 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
  vec3 Nn = normalize(cross(T, ref)); vec3 Bn = cross(T, Nn);
  vec2 c = normalize(position.xz + vec2(1e-7));
  vec3 n = c.x * Nn + c.y * Bn;
  vec3 W = P + n * uRadius;
  vS = s; vN = n; vW = W; vAng = atan(c.y, c.x);
  gl_Position = projectionMatrix * viewMatrix * vec4(W, 1.0);
}`;
const STR_FRAG = /* glsl */`
uniform vec3 uColor; uniform vec3 uLampPos; uniform vec3 uLampDir; uniform float uLampCos; uniform vec3 uLampCol;
uniform float uAmb; uniform float uGlow; uniform float uPulse; uniform float uPulseAmp; uniform float uLen;
varying float vS; varying vec3 vN; varying vec3 vW; varying float vAng;
void main() {
  vec3 N = normalize(vN); vec3 Lv = uLampPos - vW; float d = length(Lv); vec3 L = Lv / d; vec3 V = normalize(cameraPosition - vW);
  float spot = smoothstep(uLampCos, uLampCos + 0.22, dot(-L, uLampDir));
  float lit = (0.25 + 0.75 * spot) / (1.0 + 0.035 * d * d);
  float diff = max(dot(N, L), 0.0) * 0.75 + 0.25;
  vec3 H = normalize(L + V); float spec = pow(max(dot(N, H), 0.0), 28.0);
  float ph = vAng * 2.0 + vS * uLen * 340.0;
  float aa = clamp(1.6 - fwidth(ph) * 0.9, 0.0, 1.0);          // fade the twist where it would alias
  float tw = 0.5 + 0.5 * sin(ph) * aa;
  vec3 base = uColor * mix(0.52, 1.06, tw);
  float pulse = uPulseAmp * exp(-pow((vS - uPulse) * uLen / 0.12, 2.0));
  vec3 col = base * (uAmb + diff * lit * uLampCol) + spec * lit * uLampCol * 0.4 + uColor * uGlow * 0.85
           + mix(uColor, vec3(1.0, 0.82, 0.66), 0.55) * pulse * 3.2;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const GLOW_FRAG = /* glsl */`
uniform vec3 uColor; uniform float uGlow; uniform float uPulse; uniform float uPulseAmp; uniform float uLen;
varying float vS; varying vec3 vN; varying vec3 vW; varying float vAng;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  float f = pow(abs(dot(normalize(vN), V)), 2.4);
  float pulse = uPulseAmp * exp(-pow((vS - uPulse) * uLen / 0.24, 2.0));
  float a = (uGlow * 0.16 + pulse * 1.1) * f;
  gl_FragColor = vec4(mix(uColor, vec3(1.0, 0.72, 0.55), 0.4) * a, 1.0);
}`;

function stringUniforms(a: V3, b: V3, radius: number) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  const vib = new THREE.Vector3(-dy / L * 0.8, dx / L * 0.8, 0.6).normalize();
  return {
    uA: { value: new THREE.Vector3(...a) }, uB: { value: new THREE.Vector3(...b) }, uDraw: { value: 1 }, uSag: { value: 0 }, uVib: { value: 0 },
    uVibDir: { value: vib }, uRadius: { value: radius }, uColor: { value: new THREE.Color(C.string) }, uLampPos: { value: new THREE.Vector3() },
    uLampDir: { value: new THREE.Vector3(0, -1, 0) }, uLampCos: { value: Math.cos(0.8) }, uLampCol: { value: new THREE.Color('#FFD7A6').multiplyScalar(3.2) },
    uAmb: { value: 0.16 }, uGlow: { value: 0 }, uPulse: { value: -1 }, uPulseAmp: { value: 0 }, uLen: { value: L },
  };
}

const StringLine: React.FC<{ a: V3; b: V3; s: StringState; lamp: ReturnType<typeof lampAt> }> = ({ a, b, s, lamp }) => {
  const [core, glow] = useMemo(() => {
    const uc = stringUniforms(a, b, 0.0062), ug = stringUniforms(a, b, 0.022);
    return [
      new THREE.ShaderMaterial({ uniforms: uc, vertexShader: STR_VERT, fragmentShader: STR_FRAG }),
      new THREE.ShaderMaterial({ uniforms: ug, vertexShader: STR_VERT, fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    ];
  }, [a, b]);
  useLayoutEffect(() => {
    for (const m of [core, glow]) {
      const u = m.uniforms;
      u.uDraw.value = Math.max(0.0001, s.draw); u.uSag.value = s.sag; u.uVib.value = s.vib; u.uGlow.value = s.glow;
      u.uPulse.value = s.pulse; u.uPulseAmp.value = s.pulseAmp;
      (u.uLampPos.value as THREE.Vector3).set(...lamp.pos); (u.uLampDir.value as THREE.Vector3).copy(lamp.dir);
    }
  });
  if (s.draw <= 0.0005) return null;
  return (
    <>
      <mesh geometry={G.string} material={core} frustumCulled={false} />
      <mesh geometry={G.string} material={glow} frustumCulled={false} renderOrder={5} />
    </>
  );
};

// ---------------------------------------------------------------- beam + dust
const BEAM_VERT = /* glsl */`
varying float vY; varying vec3 vN; varying vec3 vW; varying float vAng;
void main() {
  vY = position.y; vAng = atan(position.z, position.x);
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const BEAM_FRAG = /* glsl */`
uniform float uI; uniform vec3 uColor; uniform float uTime;
varying float vY; varying vec3 vN; varying vec3 vW; varying float vAng;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  float edge = pow(abs(dot(normalize(vN), V)), 2.2);
  float along = smoothstep(0.0, 0.06, vY) * (1.0 - smoothstep(0.62, 0.98, vY)) * mix(1.0, 0.3, vY);
  float streak = 0.74 + 0.26 * sin(vAng * 7.0 + vY * 3.0 + uTime * 0.25) * sin(vAng * 3.0 - uTime * 0.17 + 1.3);
  float near = smoothstep(0.5, 2.6, length(cameraPosition - vW));
  float a = uI * edge * along * streak * near;
  gl_FragColor = vec4(uColor * a, 1.0);
}`;
const DUST_VERT = /* glsl */`
uniform float uTime; uniform vec3 uLampPos; uniform vec3 uLampDir; uniform float uTanA; uniform float uPx; uniform float uFocus; uniform float uCoc; uniform float uFade;
attribute vec4 aRnd;
varying float vA;
void main() {
  vec3 p = position + vec3(sin(uTime * (0.11 + 0.2 * aRnd.x) + aRnd.y * 6.283), sin(uTime * (0.09 + 0.17 * aRnd.y) + aRnd.z * 6.283),
                           sin(uTime * (0.07 + 0.13 * aRnd.z) + aRnd.x * 6.283)) * 0.09;
  vec3 rel = p - uLampPos; float al = dot(rel, uLampDir); float r = length(rel - uLampDir * al); float R = max(al, 0.0) * uTanA;
  float inBeam = step(0.35, al) * (1.0 - smoothstep(R * 0.5, R * 1.0, r));
  vec4 mv = viewMatrix * vec4(p, 1.0); float dist = max(-mv.z, 0.02);
  float sz = (0.0026 + 0.004 * aRnd.w) * uPx / dist;
  float coc = uCoc * abs(dist - uFocus) / dist * uPx * 0.012;
  float S = clamp(sz + coc, 1.3, 80.0);
  float energy = clamp((sz * sz + 1.2) / (S * S), 0.015, 1.0);
  float tw = 0.6 + 0.4 * sin(uTime * (1.3 + aRnd.x * 2.0) + aRnd.y * 40.0);
  vA = inBeam * tw * energy * uFade * (0.35 + 0.65 * aRnd.z) / (1.0 + 0.03 * al * al) * step(0.0, -mv.z);
  gl_PointSize = S;
  gl_Position = projectionMatrix * mv;
}`;
const DUST_FRAG = /* glsl */`
uniform vec3 uColor; varying float vA;
void main() { float d = length(gl_PointCoord - 0.5) * 2.0; float a = 1.0 - smoothstep(0.45, 1.0, d); gl_FragColor = vec4(uColor * a * vA, 1.0); }`;

const Beam: React.FC<{ st: BoardState; lamp: ReturnType<typeof lampAt> }> = ({ st, lamp }) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uI: { value: 0.3 }, uColor: { value: new THREE.Color('#FFCF9A') }, uTime: { value: 0 } }, vertexShader: BEAM_VERT, fragmentShader: BEAM_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }), []);
  const L = lamp.pos[2] / -lamp.dir.z * 1.02, R = L * Math.tan(BEAM_HALF);
  const q = useMemo(() => new THREE.Quaternion(), []);
  q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), lamp.dir);
  useLayoutEffect(() => { mat.uniforms.uTime.value = st.t; mat.uniforms.uI.value = 0.3 * st.beam * st.dust; });
  return <mesh geometry={G.cone} material={mat} position={lamp.pos} quaternion={q} scale={[R, L, R]} renderOrder={8} frustumCulled={false} />;
};

const Dust: React.FC<{ st: BoardState; lamp: ReturnType<typeof lampAt> }> = ({ st, lamp }) => {
  const { size } = useThree();
  const [geo, mat] = useMemo(() => {
    const n = 1500, r = mulberry32(2026), pos = new Float32Array(n * 3), rnd = new Float32Array(n * 4);
    const rest = lampAt(0, 0), d = rest.dir, L = rest.pos[2] / -d.z;
    const a = new THREE.Vector3(1, 0, 0).cross(d).normalize(), b = d.clone().cross(a).normalize();
    for (let i = 0; i < n; i++) {
      const al = 0.4 + Math.pow(r(), 0.8) * (L - 0.4), rr = al * Math.tan(BEAM_HALF + 0.12) * Math.sqrt(r()), ang = r() * Math.PI * 2;
      const p = new THREE.Vector3(...rest.pos).addScaledVector(d, al).addScaledVector(a, Math.cos(ang) * rr).addScaledVector(b, Math.sin(ang) * rr);
      pos.set([p.x, p.y, Math.max(0.03, p.z)], i * 3);
      rnd.set([r(), r(), r(), r()], i * 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4));
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uLampPos: { value: new THREE.Vector3() }, uLampDir: { value: new THREE.Vector3() }, uTanA: { value: Math.tan(BEAM_HALF) },
        uPx: { value: 1000 }, uFocus: { value: 3 }, uCoc: { value: 1 }, uFade: { value: 1 }, uColor: { value: new THREE.Color('#FFE3BD').multiplyScalar(1.6) } },
      vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    return [g, m];
  }, []);
  useLayoutEffect(() => {
    const u = mat.uniforms;
    u.uTime.value = st.t; (u.uLampPos.value as THREE.Vector3).set(...lamp.pos); (u.uLampDir.value as THREE.Vector3).copy(lamp.dir);
    u.uPx.value = size.height / (2 * Math.tan((st.cam.fov * Math.PI) / 360));
    u.uFocus.value = st.focus; u.uCoc.value = Math.min(4, 0.6 + st.dofK); u.uFade.value = st.dust;
  });
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={9} />;
};

// ---------------------------------------------------------------- lamp
const Lamp: React.FC<{ lamp: ReturnType<typeof lampAt>; assets: BoardAssets }> = ({ lamp, assets }) => {
  const mats = useMemo(() => ({
    outer: new THREE.MeshStandardMaterial({ color: '#25302C', metalness: 0.8, roughness: 0.28, side: THREE.FrontSide }),
    inner: new THREE.MeshStandardMaterial({ color: '#2A2620', emissive: new THREE.Color('#FFC98E'), emissiveIntensity: 1.6, side: THREE.BackSide, roughness: 0.6 }),
    rim: new THREE.MeshStandardMaterial({ color: '#C9A66B', metalness: 1, roughness: 0.25, emissive: new THREE.Color('#FFB066'), emissiveIntensity: 0.35 }),
    bulb: new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFF1D6').multiplyScalar(3) }),
    cord: new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.6 }),
    halo: new THREE.SpriteMaterial({ map: assets.glow, color: new THREE.Color('#FFC58A').multiplyScalar(0.9), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  }), [assets]);
  const q = useMemo(() => new THREE.Quaternion(), []);
  q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), lamp.dir.clone().negate());
  const top = new THREE.Vector3(...lamp.pos).addScaledVector(lamp.dir, -0.29);
  const cordDir = new THREE.Vector3(...PIVOT).sub(top);
  const cq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), cordDir.clone().normalize());
  return (
    <>
      <group position={lamp.pos} quaternion={q}>
        <mesh geometry={G.shade} material={mats.outer} />
        <mesh geometry={G.shade} material={mats.inner} />
        <mesh geometry={G.rim} material={mats.rim} />
        <mesh geometry={G.bulb} material={mats.bulb} position={[0, 0.07, 0]} />
        <sprite material={mats.halo} position={[0, -0.02, 0]} scale={[0.85, 0.85, 1]} renderOrder={11} />
      </group>
      <mesh geometry={G.cord} material={mats.cord} position={[top.x, top.y, top.z]} quaternion={cq} scale={[1, cordDir.length(), 1]} />
    </>
  );
};

// ---------------------------------------------------------------- board, cards, prints, pins
const Board: React.FC<{ assets: BoardAssets }> = ({ assets }) => {
  const mat = useMemo(() => {
    const t = assets.felt.clone(); t.repeat.set(16, 17.5); t.needsUpdate = true;
    return dof(new THREE.MeshStandardMaterial({ map: t, bumpMap: t, bumpScale: 2.2, roughness: 0.94, metalness: 0, color: '#FFFFFF' }));
  }, [assets]);
  return <mesh geometry={G.plane} material={mat} position={[0, -3, 0]} scale={[44, 48, 1]} />;
};

/** blurred contact shadow under a flat object at height h, pushed away from the lamp */
function shadowSpot(x: number, y: number, h: number, lamp: ReturnType<typeof lampAt>): [number, number] {
  const k = h / Math.max(0.3, lamp.pos[2] - h);
  return [x + (x - lamp.pos[0]) * k, y + (y - lamp.pos[1]) * k];
}

const Pin: React.FC<{ s: PinState; color: string; mats: PinMats; scale?: number; lamp: ReturnType<typeof lampAt> }> = ({ s, color, mats, scale = 1, lamp }) => {
  if (!s.visible) return null;
  // the head's shadow, thrown away from the lamp onto whatever the pin sits on (fades as the pin pops out)
  const h = 0.06 * scale, k = h / Math.max(0.3, lamp.pos[2] - s.p[2]);
  const dx = (s.p[0] - lamp.pos[0]) * k, dy = (s.p[1] - lamp.pos[1]) * k, out = Math.max(0, s.p[2] - Z_FRONT);
  const sh = Math.max(0, 1 - out * 12) * Math.min(1, s.s);
  return (
    <>
      {sh > 0.01 && <mesh geometry={G.plane} material={mats.shadow} position={[s.p[0] + dx * 0.6, s.p[1] + dy * 0.6, s.p[2] + 0.0004]}
        rotation={[0, 0, Math.atan2(dy, dx)]} scale={[(0.07 + Math.hypot(dx, dy) * 1.1) * scale, 0.07 * scale, 1]} renderOrder={1} />}
      <group position={s.p} quaternion={s.q} scale={scale * s.s}>
        <mesh geometry={G.pin} material={mats.head(color)} />
        <mesh geometry={G.needle} material={mats.metal} />
      </group>
    </>
  );
};
interface PinMats { head: (c: string) => THREE.Material; metal: THREE.Material; brass: THREE.Material; shadow: THREE.Material }
function usePinMats(assets: BoardAssets): PinMats {
  return useMemo(() => {
    const cache = new Map<string, THREE.Material>();
    return {
      head: (c: string) => {
        let m = cache.get(c);
        if (!m) { m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08, metalness: 0 }); cache.set(c, m); }
        return m;
      },
      metal: new THREE.MeshStandardMaterial({ color: '#C9CDD2', metalness: 1, roughness: 0.25 }),
      brass: new THREE.MeshStandardMaterial({ color: '#8C6A2E', metalness: 1, roughness: 0.48 }),
      shadow: new THREE.MeshBasicMaterial({ map: assets.dot, color: '#000', transparent: true, opacity: 0.55, depthWrite: false }),
    };
  }, [assets]);
}

const STAMP_L = px2local(STAMP.cx, STAMP.cy);
const STAMP_W = (STAMP.w / 1080) * CW, STAMP_H = (STAMP.h / 1920) * CH;

const CardMesh: React.FC<{ card: BoardCard; s: CardState; assets: BoardAssets; st: BoardState; lamp: ReturnType<typeof lampAt> }> = ({ card, s, assets, st, lamp }) => {
  const m = useMemo(() => {
    const front = assets.fronts[card.k], back = assets.backs[card.k];
    const fib = assets.fibre.clone(); fib.repeat.set(2.2, 3.9); fib.needsUpdate = true;
    const fm = dof(new THREE.MeshStandardMaterial({ map: front, bumpMap: fib, bumpScale: 0.55, roughness: card.dark ? 0.55 : 0.78, metalness: 0,
      emissive: new THREE.Color('#FFFFFF'), emissiveMap: front, emissiveIntensity: 0 }));
    const bm = dof(new THREE.MeshStandardMaterial({ map: back, bumpMap: fib, bumpScale: 0.6, roughness: 0.85 }));
    const em = new THREE.MeshStandardMaterial({ color: card.dark ? '#2B2E35' : '#D6CCB8', roughness: 0.9 });
    const detail = dof(new THREE.MeshStandardMaterial({ map: card.dark ? assets.detail.dark : assets.detail.paper, transparent: true, depthWrite: false, roughness: 0.8,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
    const flat = new THREE.MeshBasicMaterial({ map: front, toneMapped: false, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    const shadow = new THREE.MeshBasicMaterial({ map: assets.shadow, color: '#000', transparent: true, depthWrite: false, opacity: 0.6 });
    const stamp = dof(new THREE.MeshStandardMaterial({ map: assets.stamp, transparent: true, depthWrite: false, roughness: 0.62, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 }));
    const stampShadow = new THREE.MeshBasicMaterial({ map: assets.shadow, color: '#000', transparent: true, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 });
    return { box: [em, em, em, em, fm, bm], fm, detail, flat, shadow, stamp, stampShadow };
  }, [assets, card]);
  const hasStamp = card.k === 0;
  useLayoutEffect(() => {
    m.detail.opacity = s.detail; m.flat.opacity = s.flat; m.fm.emissiveIntensity = 0.82 * s.glow;
    const lift = Math.max(0, s.p[2] - Z_CARD);
    m.shadow.opacity = 0.62 * Math.max(0, 1 - lift * 2.2) * (1 - s.flat);
    if (hasStamp) { m.stamp.opacity = st.stamp.ink; m.stampShadow.opacity = 0.6 * st.stamp.shadow; }
  });
  const lift = Math.max(0, s.p[2] - Z_CARD);
  const [sx, sy] = shadowSpot(s.p[0], s.p[1], 0.05 + lift, lamp);
  const spread = 1 + lift * 1.6;
  const rotZ = new THREE.Euler().setFromQuaternion(s.q, 'ZYX').z;
  const ss = 1 + 0.06 * st.stamp.slam;
  return (
    <>
      {m.shadow.opacity > 0.003 && <mesh geometry={G.plane} material={m.shadow} position={[sx + 0.012, sy - 0.02, 0.0048]} rotation={[0, 0, rotZ]} scale={[CW * 1.2 * spread, CH * 1.12 * spread, 1]} />}
      <group position={s.p} quaternion={s.q}>
        <mesh geometry={G.card} material={m.box} />
        {s.detail > 0.003 && <mesh geometry={G.cardPlane} material={m.detail} position={[0, 0, CT / 2 + 0.0002]} renderOrder={2} />}
        {s.flat > 0.003 && <mesh geometry={G.cardPlane} material={m.flat} position={[0, 0, CT / 2 + FLAT_DZ]} renderOrder={3} />}
        {hasStamp && st.stamp.shadow > 0.003 && (
          <mesh geometry={G.plane} material={m.stampShadow} renderOrder={4}
            position={[STAMP_L[0] + 0.05 * (1 - st.stamp.shadow), STAMP_L[1] - 0.06 * (1 - st.stamp.shadow), CT / 2 + FLAT_DZ + 0.0003]}
            rotation={[0, 0, (STAMP.rotDeg * Math.PI) / 180]} scale={[STAMP_W * (1.9 - 0.8 * st.stamp.shadow), STAMP_H * (2.4 - 1.2 * st.stamp.shadow), 1]} />
        )}
        {hasStamp && st.stamp.ink > 0 && (
          <mesh geometry={G.plane} material={m.stamp} position={[STAMP_L[0], STAMP_L[1], CT / 2 + FLAT_DZ + 0.0004]} renderOrder={4}
            rotation={[0, 0, (STAMP.rotDeg * Math.PI) / 180]} scale={[STAMP_W * ss, STAMP_H * ss, 1]} />
        )}
        {hasStamp && st.puff >= 0 && st.puff < 90 && <Puff f={st.puff} />}
      </group>
    </>
  );
};

/** dust kicked up by the stamp: card-local particles flying out of the stamp's edges, drifting up in the beam */
const PUFF_N = 90;
const PUFF = (() => {
  const r = mulberry32(555);
  return Array.from({ length: PUFF_N }, () => {
    const side = Math.floor(r() * 4), u = r() * 2 - 1;
    const lx = side < 2 ? u * STAMP_W / 2 : (side === 2 ? -1 : 1) * STAMP_W / 2;
    const ly = side < 2 ? (side === 0 ? -1 : 1) * STAMP_H / 2 : u * STAMP_H / 2;
    const a = (STAMP.rotDeg * Math.PI) / 180, x = lx * Math.cos(a) - ly * Math.sin(a), y = lx * Math.sin(a) + ly * Math.cos(a);
    const out = Math.hypot(x, y) || 1;
    const sp = 0.25 + r() * 0.75;
    return { x: STAMP_L[0] + x, y: STAMP_L[1] + y, vx: (x / out) * sp * 0.6, vy: (y / out) * sp + 0.04, vz: 0.08 + r() * 0.35, s: 0.0025 + r() * 0.0045, life: 0.5 + r() * 0.8 };
  });
})();
const PUFF_VERT = /* glsl */`
attribute float aA; attribute float aS; uniform float uPx; varying float vA;
void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); float d = max(-mv.z, 0.02); gl_PointSize = clamp(aS * uPx / d, 1.5, 70.0); vA = aA; gl_Position = projectionMatrix * mv; }`;
const Puff: React.FC<{ f: number }> = ({ f }) => {
  const { size, camera } = useThree();
  const [geo, mat] = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PUFF_N * 3), 3));
    g.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(PUFF_N), 1));
    g.setAttribute('aS', new THREE.BufferAttribute(new Float32Array(PUFF_N), 1));
    const m = new THREE.ShaderMaterial({ uniforms: { uPx: { value: 1000 }, uColor: { value: new THREE.Color('#FFE6C8').multiplyScalar(0.9) } },
      vertexShader: PUFF_VERT, fragmentShader: DUST_FRAG.replace('varying float vA;', 'varying float vA;'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    return [g, m];
  }, []);
  useLayoutEffect(() => {
    const t = f / 60, k = 4.5, e = (1 - Math.exp(-k * t)) / k;
    const P = geo.attributes.position as THREE.BufferAttribute, A = geo.attributes.aA as THREE.BufferAttribute, S = geo.attributes.aS as THREE.BufferAttribute;
    PUFF.forEach((p, i) => {
      P.setXYZ(i, p.x + p.vx * e, p.y + p.vy * e + 0.03 * t, CT / 2 + 0.003 + p.vz * e);
      A.setX(i, (1 - Math.exp(-t * 30)) * Math.exp(-t / p.life) * 0.42);
      S.setX(i, p.s * (1 + 2.5 * t));
    });
    P.needsUpdate = A.needsUpdate = S.needsUpdate = true;
    mat.uniforms.uPx.value = size.height / (2 * Math.tan(((camera as THREE.PerspectiveCamera).fov * Math.PI) / 360));
  });
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={9} />;
};

const PrintMesh: React.FC<{ spot: PrintSpot; assets: BoardAssets; mats: PinMats; lamp: ReturnType<typeof lampAt> }> = ({ spot, assets, mats, lamp }) => {
  const pt = assets.prints[spot.key];
  const m = useMemo(() => {
    const fib = assets.fibre.clone(); fib.repeat.set(1.5, 1.5); fib.needsUpdate = true;
    return {
      face: dof(new THREE.MeshStandardMaterial({ map: pt.tex, bumpMap: fib, bumpScale: 0.25, roughness: 0.42, metalness: 0 })),
      shadow: new THREE.MeshBasicMaterial({ map: assets.shadow, color: '#000', transparent: true, depthWrite: false, opacity: 0.5 }),
    };
  }, [assets, pt]);
  const w = Math.min(spot.maxW, spot.maxH * pt.aspect), h = w / pt.aspect;
  const [sx, sy] = shadowSpot(spot.x, spot.y, 0.035, lamp);
  const c = Math.cos(spot.rot), s = Math.sin(spot.rot);
  const pinPos: V3 = [spot.x - s * (h / 2 - 0.035), spot.y + c * (h / 2 - 0.035), spot.z + 0.0004];
  return (
    <>
      <mesh geometry={G.plane} material={m.shadow} position={[sx + 0.008, sy - 0.014, spot.z - 0.0012]} rotation={[0, 0, spot.rot]} scale={[w + 0.09, h + 0.08, 1]} />
      <mesh geometry={G.plane} material={m.face} position={[spot.x, spot.y, spot.z]} rotation={[0, 0, spot.rot]} scale={[w, h, 1]} />
      <Pin s={{ p: pinPos, q: ZERO_Q, visible: true, s: 1 }} color={spot.pin} mats={mats} scale={0.8} lamp={lamp} />
    </>
  );
};

const Tack: React.FC<{ p: V3; mats: PinMats }> = ({ p, mats }) => (
  <group position={p}>
    <mesh geometry={G.tackHead} material={mats.brass} />
    <mesh geometry={G.tackShaft} material={mats.metal} />
  </group>
);

const Flashes: React.FC<{ st: BoardState; assets: BoardAssets }> = ({ st, assets }) => {
  const mat = useMemo(() => new THREE.SpriteMaterial({ map: assets.glow, color: new THREE.Color('#FF7A52').multiplyScalar(1.6), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), [assets]);
  const mats = useMemo(() => Array.from({ length: 16 }, () => mat.clone()), [mat]);
  useLayoutEffect(() => { st.flashes.slice(0, 16).forEach((f, i) => { mats[i].opacity = f.a; }); });
  return <>{st.flashes.slice(0, 16).map((f, i) => <sprite key={i} material={mats[i]} position={f.p} scale={[f.s, f.s, 1]} renderOrder={10} />)}</>;
};

/** camera near/far per frame (depth precision from the macro close-up to the 30-unit CTA wide) */
const NearFar: React.FC<{ near: number }> = ({ near }) => {
  const { camera } = useThree();
  useLayoutEffect(() => {
    const c = camera as THREE.PerspectiveCamera;
    c.near = near; c.far = 120; c.updateProjectionMatrix();
  });
  return null;
};
const DofUniforms: React.FC<{ st: BoardState }> = ({ st }) => {
  useLayoutEffect(() => { DOF.uFocus.value = st.focus; DOF.uDofK.value = st.dofK; });
  return null;
};

const Lights: React.FC<{ lamp: ReturnType<typeof lampAt>; k: BoardState['light'] }> = ({ lamp, k }) => {
  const tw = useMemo(() => new THREE.Object3D(), []), th = useMemo(() => new THREE.Object3D(), []);
  const src: V3 = [lamp.pos[0] + lamp.dir.x * 0.05, lamp.pos[1] + lamp.dir.y * 0.05, lamp.pos[2] + lamp.dir.z * 0.05];
  return (
    <>
      <primitive object={tw} position={lamp.aim} />
      <primitive object={th} position={lamp.hot} />
      <spotLight position={src} target={tw} angle={0.8} penumbra={0.95} intensity={10 * k.wide} decay={1.5} color="#FFD0A0" />
      <spotLight position={src} target={th} angle={0.13} penumbra={0.5} intensity={44 * k.hot} decay={1.5} color="#FFE4C4" />
      <hemisphereLight args={['#39425A', '#0B0B0E', 0.3 * k.amb]} />
    </>
  );
};

// ---------------------------------------------------------------- the scene
export const CaseBoardScene: React.FC<{ st: BoardState; assets: BoardAssets }> = ({ st, assets }) => {
  const lamp = lampAt(st.lamp.theta, st.lamp.sway);
  const pinMats = usePinMats(assets);
  const tacks = TACKS;
  return (
    <>
      <CamRig pos={st.cam.pos} target={st.cam.target} up={st.cam.up} fov={st.cam.fov} />
      <NearFar near={st.near} />
      <DofUniforms st={st} />
      <Env intensity={Math.round(22 * st.light.amb) / 100} />
      <Lights lamp={lamp} k={st.light} />
      <Board assets={assets} />
      {BOARD_CARDS.flatMap((c) => c.prints).map((p) => <PrintMesh key={p.key} spot={p} assets={assets} mats={pinMats} lamp={lamp} />)}
      {BOARD_CARDS.map((c, i) => <CardMesh key={c.id} card={c} s={st.cards[i]} assets={assets} st={st} lamp={lamp} />)}
      {BOARD_CARDS.map((c, i) => <Pin key={c.id} s={st.pins[i]} color={c.dark ? C.alert : '#C8231D'} mats={pinMats} lamp={lamp} />)}
      {tacks.map((p, i) => <Tack key={i} p={p} mats={pinMats} />)}
      {BOARD_STRINGS.map((s, i) => <StringLine key={s.id} a={s.pa} b={s.pb} s={st.strings[i]} lamp={lamp} />)}
      <Lamp lamp={lamp} assets={assets} />
      <Beam st={st} lamp={lamp} />
      <Dust st={st} lamp={lamp} />
      <Flashes st={st} assets={assets} />
    </>
  );
};

export { Z_FRONT };
