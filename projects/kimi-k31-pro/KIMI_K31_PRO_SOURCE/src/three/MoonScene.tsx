// The hero sphere: a procedural moon (maria, rayed craters, sun-facing rims) lit by a moving sun so a terminator sweeps
// across it, with orbiting points on inclined rings and luminous lunar arcs. Everything is a function of `t` (seconds)
// and the props, so it can be scrubbed.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mulberry32 } from '../lib/rng';

const CRATERS = 70;

const vert = /* glsl */ `
varying vec3 vObj; varying vec3 vN; varying vec3 vV;
void main(){
  vObj = normalize(position);
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const frag = /* glsl */ `
uniform vec3 uSun; uniform float uRim; uniform float uBloom; uniform vec4 uCr[${CRATERS}]; uniform mat3 uRot;
varying vec3 vObj; varying vec3 vN; varying vec3 vV;
float h3(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x), mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x), mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y), f.z); }
float fbm(vec3 p){ float a = 0.5, s = 0.0; for(int i=0;i<5;i++){ s += a*vnoise(p); p = p*2.03 + 1.7; a *= 0.5; } return s; }
void main(){
  vec3 p = vObj;
  float maria = smoothstep(0.47, 0.64, fbm(p*1.35 + vec3(3.1,1.7,0.4)));
  float alb = mix(0.88, 0.46, maria) * (0.86 + 0.26*fbm(p*11.0)) * (0.94 + 0.12*vnoise(p*40.0));
  // relief: bump the normal with the gradient of a height field (gives the terminator its rough edge)
  float e = 0.004;
  float h0 = fbm(p*5.0)*0.6 + vnoise(p*30.0)*0.10;
  vec3 g = vec3(fbm((p+vec3(e,0,0))*5.0)*0.6 + vnoise((p+vec3(e,0,0))*30.0)*0.10,
                fbm((p+vec3(0,e,0))*5.0)*0.6 + vnoise((p+vec3(0,e,0))*30.0)*0.10,
                fbm((p+vec3(0,0,e))*5.0)*0.6 + vnoise((p+vec3(0,0,e))*30.0)*0.10) - h0;
  g /= e; g -= p * dot(g, p);
  vec3 nObj = normalize(p - 0.032 * g);
  vec3 N = normalize(uRot * nObj);
  vec3 sunObj = normalize(transpose(uRot) * uSun);       // sun in the sphere's own frame (for crater rims)
  float shade = 0.0;
  for (int i = 0; i < ${CRATERS}; i++) {
    vec3 c = uCr[i].xyz; float r = uCr[i].w;
    float d = acos(clamp(dot(p, c), -1.0, 1.0));
    if (d < r * 2.2) {
      float x = d / r;
      vec3 tang = normalize(p - c * dot(p, c) + 1e-5);
      float facing = dot(tang, sunObj);
      float bowl = smoothstep(1.0, 0.55, x);
      float rim = smoothstep(0.75, 1.0, x) * smoothstep(1.35, 1.0, x);
      shade += bowl * (-0.22 + 0.30 * facing) - rim * 0.28 * facing;   // sun-side wall bright, far wall in shadow
      alb += rim * 0.10 + smoothstep(2.2, 1.2, x) * 0.025;             // bright rim + faint ejecta
    }
  }
  float ndl = dot(N, normalize(uSun));
  float ndv = max(dot(N, vV), 0.0);
  float lit = smoothstep(-0.06, 0.22, ndl) * (0.30 + 0.70 * max(ndl, 0.0) / (max(ndl, 0.0) + ndv * 0.6 + 0.08));
  vec3 col = vec3(1.0, 0.985, 0.96) * alb * lit * (1.0 + shade * smoothstep(0.0, 0.3, ndl)) * 1.25;
  col += vec3(0.016, 0.022, 0.04) * alb * (1.0 - smoothstep(-0.2, 0.1, ndl));            // faint earthshine
  float fr = pow(1.0 - ndv, 3.0);
  col += vec3(0.36, 0.88, 1.0) * fr * uRim * (0.12 + 0.88 * smoothstep(-0.25, 0.45, ndl));  // cyan atmosphere rim, mostly on the lit limb
  col += vec3(0.75, 0.95, 1.0) * uBloom;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function dotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d')!, gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export const useDotTexture = () => useMemo(dotTexture, []);

/** points riding three inclined rings; returns positions for time t */
function ringPoints(t: number, n: number, seed: number) {
  const r = mulberry32(seed), out = new Float32Array(n * 3);
  const tilts = [new THREE.Euler(1.18, 0.2, 0.32), new THREE.Euler(1.42, -0.6, -0.18), new THREE.Euler(1.0, 1.1, 0.5)];
  const q = tilts.map((e) => new THREE.Quaternion().setFromEuler(e)), v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const ring = i % 3, R = 1.42 + ring * 0.24 + (r() - 0.5) * 0.09, w = (0.10 + ring * 0.035) * (r() < 0.5 ? 1 : 1.12);
    const a = r() * Math.PI * 2 + t * w, y = (r() - 0.5) * 0.035;
    v.set(Math.cos(a) * R, y, Math.sin(a) * R).applyQuaternion(q[ring]);
    out[i * 3] = v.x; out[i * 3 + 1] = v.y; out[i * 3 + 2] = v.z;
  }
  return out;
}

export const Moon: React.FC<{ t: number; sun: THREE.Vector3; scale?: number; rim?: number; bloom?: number; spin?: number }> = ({ t, sun, scale = 1, rim = 0.8, bloom = 0, spin = 0.03 }) => {
  const mat = useMemo(() => {
    const r = mulberry32(31), cr: THREE.Vector4[] = [];
    for (let i = 0; i < CRATERS; i++) {
      const z = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - z * z);
      const size = i < 5 ? 0.15 + r() * 0.1 : 0.018 + r() ** 2.4 * 0.09;
      cr.push(new THREE.Vector4(s * Math.cos(a), z, s * Math.sin(a), size));
    }
    return new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag,
      uniforms: { uSun: { value: new THREE.Vector3(1, 0, 0) }, uRim: { value: 0.8 }, uBloom: { value: 0 }, uCr: { value: cr }, uRot: { value: new THREE.Matrix3() } } });
  }, []);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 160, 120), []);
  const rotY = t * spin + 0.6;
  const m4 = new THREE.Matrix4().makeRotationY(rotY);
  mat.uniforms.uSun.value.copy(sun).normalize();
  mat.uniforms.uRim.value = rim;
  mat.uniforms.uBloom.value = bloom;
  mat.uniforms.uRot.value.setFromMatrix4(m4);
  return <mesh geometry={geo} material={mat} rotation={[0, rotY, 0]} scale={scale} />;
};

export const OrbitPoints: React.FC<{ t: number; n?: number; opacity?: number; scale?: number; color?: string }> = ({ t, n = 2400, opacity = 1, scale = 1, color = '#9FE9FF' }) => {
  const tex = useDotTexture();
  const geo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); return g; }, [n]);
  (geo.attributes.position as THREE.BufferAttribute).set(ringPoints(t, n, 7));
  geo.attributes.position.needsUpdate = true;
  geo.computeBoundingSphere();
  return (
    <points geometry={geo} scale={scale}>
      <pointsMaterial map={tex} size={0.034} sizeAttenuation transparent opacity={opacity} color={color} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

/** a luminous arc of a great circle around the sphere, drawn from 0 to `draw` (0..1) of `sweep` radians */
export const LunarArc: React.FC<{ radius: number; tilt: [number, number, number]; sweep: number; draw: number; start?: number; color?: string; opacity?: number; thick?: number }> = ({ radius, tilt, sweep, draw, start = 0, color = '#5CE1FF', opacity = 1, thick = 0.0045 }) => {
  const geo = useMemo(() => {
    const pts = Array.from({ length: 220 }, (_, i) => { const a = start + (i / 219) * sweep; return new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius); });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 440, thick, 6, false);
  }, [radius, sweep, start, thick]);
  const count = geo.index ? geo.index.count : 0;
  geo.setDrawRange(0, Math.floor((count * Math.max(0, Math.min(1, draw))) / 6) * 6);
  return (
    <mesh geometry={geo} rotation={tilt}>
      <meshBasicMaterial color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

/** sparse, faint, seeded star field on a large sphere */
export const Stars: React.FC<{ n?: number; opacity?: number }> = ({ n = 900, opacity = 0.7 }) => {
  const tex = useDotTexture();
  const geo = useMemo(() => {
    const r = mulberry32(99), a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const z = r() * 2 - 1, th = r() * Math.PI * 2, s = Math.sqrt(1 - z * z), R = 60 + r() * 30; a.set([s * Math.cos(th) * R, z * R, s * Math.sin(th) * R], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3)); return g;
  }, [n]);
  return <points geometry={geo}><pointsMaterial map={tex} size={0.22} sizeAttenuation transparent opacity={opacity} color="#C9D6F0" depthWrite={false} /></points>;
};

/** additive glow sprite */
export const Halo: React.FC<{ scale: number; opacity: number; color?: string; position?: [number, number, number] }> = ({ scale, opacity, color = '#5CE1FF', position = [0, 0, 0] }) => {
  const tex = useDotTexture();
  return (
    <sprite scale={[scale, scale, 1]} position={position}>
      <spriteMaterial map={tex} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  );
};
