// A destructible target on screen: all its pieces in one BatchedMesh (one draw call), with a rock shader that
// reads each piece's state (crack glow, heat, freshness, loose) from a small float texture. Attached pieces sit at
// the placement; loose ones at their rigid body's pose, interpolated between physics steps.
import * as THREE from 'three';
import { MATERIALS, type MaterialId } from '../core/config';
import { PieceState, type Destructible } from '../core/destructible';

// fbm octaves from the quality preset (4 at high and ultra, 3 below)
const rockNoise = (oct: number) => /* glsl */ `
  float h31(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vnoise(vec3 x) {
    vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float fbm3(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < ${oct}; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
`;

export interface ImpactGlow { p: [number, number, number]; t0: number; col: THREE.Color; r: number }

export function rockMaterial(mat: MaterialId, oct = 4) {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, envMapIntensity: 0.35 });
  const u = {
    uChunk: { value: null as THREE.DataTexture | null },
    uSkin: { value: new THREE.Color() }, uFace: { value: new THREE.Color() }, uGlowCol: { value: new THREE.Color() }, uModeCol: { value: new THREE.Color(1.3, 1.0, 0.3) },
    uGlassy: { value: 0 }, uTime: { value: 0 }, uMarkCol: { value: new THREE.Color(2.2, 1.6, 0.6) },
    uImpP: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 0, -1e9)) }, uImpC: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 0, 1)) },
  };
  const setPalette = (id: MaterialId) => {
    const P = MATERIALS[id];
    u.uSkin.value.setRGB(...P.skin); u.uFace.value.setRGB(...P.face); u.uGlowCol.value.setRGB(...P.glow); u.uGlassy.value = P.glassy;
    m.roughness = P.glassy ? 0.16 : 0.9; m.metalness = P.glassy ? 0.25 : 0; m.envMapIntensity = P.glassy ? 1.6 : 0.14;
  };
  setPalette(mat);
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, u);
    s.vertexShader = s.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec3 rock; uniform highp sampler2D uChunk;
        varying vec3 vRest; varying vec3 vRock; varying vec4 vChunk; varying vec3 vObjN; varying vec3 vWPos;`)
      .replace('#include <batching_vertex>', `#include <batching_vertex>
        vRest = position; vRock = rock; vObjN = normal;
        #ifdef USE_BATCHING
          int cid = int(getIndirectIndex(gl_DrawID)), csz = textureSize(uChunk, 0).x;
          vChunk = texelFetch(uChunk, ivec2(cid % csz, cid / csz), 0);
        #else
          vChunk = vec4(0.0);
        #endif`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vec4 wp4 = vec4(transformed, 1.0);
        #ifdef USE_BATCHING
          wp4 = batchingMatrix * wp4;
        #endif
        vWPos = (modelMatrix * wp4).xyz;`);
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform vec3 uSkin, uFace, uGlowCol, uModeCol, uMarkCol; uniform float uGlassy, uTime;
        uniform vec4 uImpP[4]; uniform vec4 uImpC[4];
        varying vec3 vRest; varying vec3 vRock; varying vec4 vChunk; varying vec3 vObjN; varying vec3 vWPos;
        ${rockNoise(oct)}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float frac = clamp(vRock.x, 0.0, 1.0), edge = vRock.y, depth = vRock.z;
        float loose = mod(vChunk.w, 10.0), marked = step(5.0, vChunk.w);
        // metres per pixel: fine noise fades out before it can alias into sparkle
        float lod = length(fwidth(vRest));
        float f2 = 1.0 - smoothstep(0.2, 0.7, lod * 2.3), f4 = 1.0 - smoothstep(0.2, 0.7, lod * 3.7), f9 = 1.0 - smoothstep(0.2, 0.7, lod * 9.0);
        float n1 = fbm3(vRest * 0.11), n2 = fbm3(vRest * 0.55), n3 = mix(0.5, vnoise(vRest * 2.3), f2);
        // the outer skin: weathered strata, darker in the cavities, lighter on ledges
        float strata = 0.5 + 0.5 * sin(vRest.y * 0.8 + n1 * 6.0);
        vec3 skin = uSkin * (0.62 + 0.42 * strata) * (0.7 + 0.6 * n2) * (0.9 + 0.2 * n3);
        skin = mix(skin, skin * vec3(0.85, 1.05, 0.95), smoothstep(0.55, 0.9, vObjN.y) * 0.5 * (1.0 - uGlassy));
        // a fresh fracture face: lighter, grainy, darker and redder deep inside
        vec3 face = uFace * (0.62 + 0.55 * n2) * (0.85 + 0.3 * n3);
        face = mix(face, face * vec3(0.78, 0.6, 0.52), smoothstep(5.0, 18.0, depth) * (1.0 - uGlassy));
        // inner faces show as fresh rock only on pieces that broke off; while attached, any that peeks through a
        // seam reads as a dark crack
        vec3 alb = mix(skin, face, frac * loose);
        alb *= mix(1.0, 0.3, frac * (1.0 - loose));
        // faint seams where the pieces meet (the crack glow lights them up on impact)
        float seam = (1.0 - smoothstep(0.04, 0.42, edge)) * (1.0 - frac);
        alb *= mix(1.0, 0.9, seam * (1.0 - uGlassy * 0.5));
        float heat = vChunk.y;
        alb *= 1.0 - 0.55 * heat;
        diffuseColor.rgb = alb;`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(mix(0.92, 0.72, frac) - 0.15 * n3, 0.12 + 0.1 * n2, uGlassy);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          // bump from a rock height field (Mikkelsen's surface-gradient bump with screen-space derivatives)
          float hgt = fbm3(vRest * 0.9) * 0.7 + (vnoise(vRest * 3.7) - 0.5) * 0.22 * f4 + (vnoise(vRest * 9.0) - 0.5) * 0.06 * f9;
          vec3 dpx = dFdx(-vViewPosition), dpy = dFdy(-vViewPosition);
          float dhx = dFdx(hgt), dhy = dFdy(hgt);
          vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx);
          float det = dot(dpx, r1);
          vec3 grad = sign(det) * (dhx * r1 + dhy * r2);
          normal = normalize(abs(det) * normal - grad * mix(1.0, 0.25, uGlassy) * 0.9);
        }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          vec3 em = vec3(0.0);
          // mineral specks on the skin, faintly breathing (only where they are bigger than a pixel)
          // small golden glints, mostly in the darker hollows of the rock
          float mn = vnoise(vRest * 1.9 + 13.0) * vnoise(vRest * 0.31 + 4.0);
          float hollow = 1.0 - smoothstep(0.35, 0.6, n2);
          em += uGlowCol * smoothstep(0.5, 0.62, mn) * hollow * (1.0 - frac) * (0.6 + 0.4 * sin(uTime * 1.3 + vRest.x * 0.4)) * 0.9 * (1.0 - smoothstep(0.2, 0.6, lod * 3.0));
          // veins inside, brightest on freshly broken faces (vChunk.z: 1 when it breaks, fading)
          float vein = 1.0 - smoothstep(0.0, 0.045, abs(vnoise(vRest * 0.45 + 3.0) - 0.5));
          em += uGlowCol * vein * frac * (0.12 + 0.9 * vChunk.z);
          em += uGlowCol * frac * vChunk.z * 0.3;
          // the crack network (vChunk.x): along the seams and the broken faces
          em += uModeCol * vChunk.x * (seam * 2.0 + frac * 0.5);
          // heat: a blackbody-like ramp, flickering
          // (only where there is heat: the term is zero elsewhere, and its noise is one of the costliest in the shader)
          if (heat > 0.0) em += mix(vec3(0.5, 0.04, 0.0), vec3(3.0, 1.1, 0.25), heat) * heat * (0.4 + 0.9 * fbm3(vRest * 1.2 + vec3(0.0, uTime * 0.7, 0.0))) * 0.75;
          // impact glow: a bright core and a front running out along the seams at 60 m/s
          for (int i = 0; i < 4; i++) {
            float age = uTime - uImpP[i].w;
            if (age > 0.0 && age < 1.8) {
              float d = distance(vWPos, uImpP[i].xyz), front = age * 60.0;
              float q = (d - front) / 3.0, ring = exp(-q * q) * (1.0 - age / 1.8);  // (no pow() of a negative base: NaN on GPUs)
              float core = exp(-d / max(1.0, uImpC[i].w * 0.5)) * exp(-age * 2.2);
              em += uImpC[i].rgb * (ring * (seam * 2.2 + 0.12) + core * 0.55);
            }
          }
          // crystal: inner light and a rim
          if (uGlassy > 0.5) {
            vec3 V = normalize(vViewPosition);
            float fr = pow(max(0.0, 1.0 - abs(dot(normalize(normal), V))), 3.0);
            em += uFace * (0.06 + 0.35 * fr + 0.18 * fbm3(vRest * 0.8 + uTime * 0.05));
          }
          // the marked target pulses
          em += uMarkCol * marked * (0.35 + 0.35 * sin(uTime * 4.0)) * (0.4 + seam);
          totalEmissiveRadiance += em;
        }`);
  };
  m.customProgramCacheKey = () => `astra-rock-v1-${oct}`;
  return { m, u, setPalette };
}

export class TargetView {
  mesh: THREE.BatchedMesh;
  private tex: THREE.DataTexture; private data: Float32Array; private size: number;
  private mat: ReturnType<typeof rockMaterial>;
  private M = new THREE.Matrix4(); private T = new THREE.Matrix4(); private P = new THREE.Vector3(); private Q = new THREE.Quaternion(); private Q2 = new THREE.Quaternion(); private S = new THREE.Vector3(1, 1, 1);
  private placeM: THREE.Matrix4;
  private visible: Uint8Array;
  marked: Uint8Array;

  constructor(public d: Destructible, oct = 4) {
    const ch = d.fr.chunks;
    const nv = ch.reduce((a, c) => a + c.pos.length / 3, 0), ni = ch.reduce((a, c) => a + c.idx.length, 0);
    this.mat = rockMaterial(d.matId, oct);
    this.mesh = new THREE.BatchedMesh(ch.length, nv, ni, this.mat.m);
    this.mesh.castShadow = true; this.mesh.receiveShadow = true;
    this.mesh.perObjectFrustumCulled = true;
    this.size = Math.ceil(Math.sqrt(ch.length));
    this.data = new Float32Array(this.size * this.size * 4);
    this.tex = new THREE.DataTexture(this.data, this.size, this.size, THREE.RGBAFormat, THREE.FloatType);
    this.tex.minFilter = this.tex.magFilter = THREE.NearestFilter; this.tex.needsUpdate = true;
    this.mat.u.uChunk.value = this.tex;
    for (const c of ch) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(c.pos, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(c.nrm, 3));
      g.setAttribute('rock', new THREE.BufferAttribute(c.rock, 3));
      g.setIndex(new THREE.BufferAttribute(c.idx, 1));
      const gid = this.mesh.addGeometry(g);
      this.mesh.addInstance(gid);
    }
    this.placeM = new THREE.Matrix4().compose(new THREE.Vector3(...d.place.p), new THREE.Quaternion(...d.place.q), new THREE.Vector3(1, 1, 1));
    this.visible = new Uint8Array(ch.length).fill(1);
    this.marked = new Uint8Array(ch.length);
    for (let i = 0; i < ch.length; i++) this.mesh.setMatrixAt(i, this.placeM);
  }

  setMaterial(id: MaterialId) { this.mat.setPalette(id); }
  setModeColor(c: THREE.Color) { this.mat.u.uModeCol.value.copy(c).multiplyScalar(0.22); }
  setVisible(v: boolean) { this.mesh.visible = v; }

  update(alpha: number, t: number, impacts: ImpactGlow[]) {
    const d = this.d, ch = d.fr.chunks;
    if (this.mat.m.userData.mat !== d.matId) { this.mat.setPalette(d.matId); this.mat.m.userData.mat = d.matId; }
    for (let i = 0; i < d.n; i++) {
      const st = d.state[i]!;
      if (st === PieceState.Gone) { if (this.visible[i]) { this.mesh.setVisibleAt(i, false); this.visible[i] = 0; } continue; }
      if (!this.visible[i]) { this.mesh.setVisibleAt(i, true); this.visible[i] = 1; }
      if (st === PieceState.Attached) this.mesh.setMatrixAt(i, this.placeM);
      else {
        const o = 3 * i, q = 4 * i;
        this.P.set(d.prevP[o]! + (d.curP[o]! - d.prevP[o]!) * alpha, d.prevP[o + 1]! + (d.curP[o + 1]! - d.prevP[o + 1]!) * alpha, d.prevP[o + 2]! + (d.curP[o + 2]! - d.prevP[o + 2]!) * alpha);
        this.Q.set(d.prevQ[q]!, d.prevQ[q + 1]!, d.prevQ[q + 2]!, d.prevQ[q + 3]!);
        this.Q2.set(d.curQ[q]!, d.curQ[q + 1]!, d.curQ[q + 2]!, d.curQ[q + 3]!);
        this.Q.slerp(this.Q2, alpha);
        const c = ch[i]!.c;
        this.M.compose(this.P, this.Q, this.S).multiply(this.T.makeTranslation(-c[0], -c[1], -c[2]));
        this.mesh.setMatrixAt(i, this.M);
      }
      // per-piece shader data
      const glow = t >= d.glowT0[i]! ? d.glowAmp[i]! * Math.exp(-(t - d.glowT0[i]!) / 1.2) : 0;
      let heat = 0;
      if (t >= d.heatT0[i]!) { heat = d.heatPeak[i]! * Math.min(1, (t - d.heatT0[i]!) / Math.max(0.05, d.heatDur[i]!)); if (t > d.coolT0[i]!) heat *= Math.exp(-(t - d.coolT0[i]!) / 2.6); }
      const fresh = st === PieceState.Loose && t >= d.detachT[i]! ? Math.exp(-(t - d.detachT[i]!) / 2.4) : 0;
      this.data.set([glow, heat, fresh, (st === PieceState.Loose ? 1 : 0) + (this.marked[i] ? 10 : 0)], 4 * i);
    }
    this.tex.needsUpdate = true;
    const u = this.mat.u;
    u.uTime.value = t;
    for (let k = 0; k < 4; k++) {
      const im = impacts[impacts.length - 1 - k];
      if (im) { u.uImpP.value[k]!.set(im.p[0], im.p[1], im.p[2], im.t0); u.uImpC.value[k]!.set(im.col.r, im.col.g, im.col.b, im.r); }
      else u.uImpP.value[k]!.w = -1e9;
    }
  }
}
