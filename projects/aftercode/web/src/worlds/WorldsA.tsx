// Worlds 1-4: Neon Pulse Tunnel, Particle Galaxy, Liquid Chrome Waves, Audio City Skyline. Every effect is a pure function
// of AF (the song clock + its analysis); each system listens to a different part of the signal.
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AF } from '../scene/af';

const hash = (i: number, s = 0) => { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };

/** glowing stage disc with a beat-driven grid (shared by several worlds) */
export const Platform: React.FC<{ color: string; radius?: number; y?: number }> = ({ color, radius = 3.4, y = 0 }) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, uniforms: { uC: { value: new THREE.Color(color) }, uK: { value: 0 }, uT: { value: 0 }, uB: { value: 0 } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 uC; uniform float uK, uT, uB; varying vec2 vP;
      void main(){ float r = length(vP); vec2 g = abs(fract(vP*2.0)-0.5); float grid = smoothstep(0.47,0.5,max(g.x,g.y));
        float ring = smoothstep(0.06,0.0,abs(r - mod(uT*1.6, ${radius.toFixed(1)}))) * (0.4+uK);
        float edge = smoothstep(${radius.toFixed(2)},${(radius - 0.12).toFixed(2)},r) * smoothstep(${(radius - 0.35).toFixed(2)},${radius.toFixed(2)},r);
        float a = (grid*0.35*(0.5+uB) + ring + edge*1.4) * smoothstep(${radius.toFixed(2)},${(radius - 0.5).toFixed(2)},r - 0.0) + edge;
        gl_FragColor = vec4(uC*(0.6+1.8*uK), a*0.85 + 0.12*smoothstep(${radius.toFixed(2)},0.0,r)); }`,
  }), [color, radius]);
  useFrame(() => { mat.uniforms.uK.value = AF.kick; mat.uniforms.uT.value = AF.b * AF.beatLen; mat.uniforms.uB.value = AF.bass; });
  return (<group position={[0, y, 0]}>
    <mesh rotation-x={-Math.PI / 2} receiveShadow><circleGeometry args={[radius, 64]} /><meshStandardMaterial color="#07070b" roughness={0.25} metalness={0.6} /></mesh>
    <mesh rotation-x={-Math.PI / 2} position-y={0.006}><circleGeometry args={[radius, 64]} /><primitive object={mat} attach="material" /></mesh>
  </group>);
};

// ---------------------------------------------------------------- 1. Neon Pulse Tunnel
export const NeonTunnel: React.FC = () => {
  const N = 46, L = 92;
  const rings = useRef<THREE.InstancedMesh>(null);
  const sparks = useRef<THREE.Points>(null);
  const geo = useMemo(() => new THREE.TorusGeometry(6.2, 0.06, 6, 4), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  const sparkGeo = useMemo(() => { const g = new THREE.BufferGeometry(), p = new Float32Array(1800 * 3); for (let i = 0; i < 1800; i++) { const a = hash(i) * Math.PI * 2, r = 5.2 + hash(i, 1) * 0.8; p.set([Math.cos(a) * r, Math.sin(a) * r + 2.2, -hash(i, 2) * L], i * 3); } g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return g; }, []);
  const m4 = new THREE.Matrix4(), col = new THREE.Color(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 4));
  useFrame(() => {
    const t = AF.t, travel = t * (7 + AF.drop * 5);
    for (let i = 0; i < N; i++) {
      const z = -(((i * (L / N) - travel) % L) + L) % L + 6;
      const near = 1 - Math.min(1, Math.abs(z + 8) / 30);
      const s = 1 + AF.bass * 0.12 * Math.sin(i * 0.7 + t * 2);
      m4.compose(new THREE.Vector3(0, 2.2, z), q, new THREE.Vector3(s, s, 1)); rings.current!.setMatrixAt(i, m4);
      const hue = (0.83 + 0.18 * Math.sin(i * 0.31 + AF.b * 0.25) + AF.drop * 0.15) % 1;
      col.setHSL(hue, 1, 0.35 + 0.35 * AF.kick * near + (i % 4 === Math.floor(AF.b) % 4 ? AF.snare * 0.4 : 0)); rings.current!.setColorAt(i, col);
    }
    rings.current!.instanceMatrix.needsUpdate = true; if (rings.current!.instanceColor) rings.current!.instanceColor.needsUpdate = true;
    sparks.current!.position.z = (travel % L);
    (sparks.current!.material as THREE.PointsMaterial).opacity = 0.25 + AF.high * 0.75;
  });
  return (<group>
    <color attach="background" args={['#030208']} /><fog attach="fog" args={['#030208', 8, 60]} />
    <instancedMesh ref={rings} args={[geo, mat, N]} />
    <points ref={sparks} geometry={sparkGeo}><pointsMaterial size={0.05} color="#9ff6ff" transparent toneMapped={false} /></points>
    <Platform color="#ff2bd6" />
    <ambientLight intensity={0.25} /><directionalLight position={[2, 6, 4]} intensity={1.4} color="#ffd6f6" castShadow /><pointLight position={[0, 3, -4]} color="#3bf0ff" intensity={30} distance={14} />
  </group>);
};

// ---------------------------------------------------------------- 2. Particle Galaxy
export const ParticleGalaxy: React.FC = () => {
  const COUNT = 26000;
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uBass: { value: 0 }, uKick: { value: 0 }, uHigh: { value: 0 } },
    vertexShader: `attribute float aR; attribute float aA; attribute float aS; uniform float uT, uBass, uKick; varying float vC; varying float vS;
      void main(){ float a = aA + uT * (0.6 / (0.6 + aR*0.25)); float r = aR * (1.0 + uBass*0.06*sin(aA*7.0 + uT));
        vec3 p = vec3(cos(a)*r, (aS-0.5)*0.6*(1.0 + aR*0.08) + 4.0, sin(a)*r - 12.0);
        vC = aR; vS = aS; vec4 mv = modelViewMatrix*vec4(p,1.); gl_PointSize = (1.6 + aS*2.2 + uKick*(aR<2.5?5.0:0.0)) * (32.0 / -mv.z); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uHigh; varying float vC; varying float vS; void main(){ float d = length(gl_PointCoord-0.5); if (d>0.5) discard;
      vec3 core = vec3(1.0,0.82,0.55), arm = vec3(0.45,0.55,1.0), pink = vec3(1.0,0.35,0.85); vec3 c = mix(core, mix(arm,pink,step(0.7,vS)), smoothstep(0.5,6.0,vC));
      gl_FragColor = vec4(c*(0.6 + uHigh*0.8*step(0.92,vS)), (1.0-d*2.0)*0.85); }`,
  }), []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry(), r = new Float32Array(COUNT), a = new Float32Array(COUNT), s = new Float32Array(COUNT), pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) { const rr = Math.pow(hash(i), 1.6) * 11; r[i] = rr; a[i] = (Math.floor(hash(i, 3) * 3) / 3) * Math.PI * 2 + rr * 0.55 + (hash(i, 4) - 0.5) * 0.6; s[i] = hash(i, 5); }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aR', new THREE.BufferAttribute(r, 1)); g.setAttribute('aA', new THREE.BufferAttribute(a, 1)); g.setAttribute('aS', new THREE.BufferAttribute(s, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 4, -12), 30); return g;
  }, []);
  const island = useRef<THREE.Group>(null);
  useFrame(() => {
    mat.uniforms.uT.value = AF.t * 0.15; mat.uniforms.uBass.value = AF.bass; mat.uniforms.uKick.value = AF.kick; mat.uniforms.uHigh.value = AF.high;
    island.current!.position.y = Math.sin(AF.t * 0.6) * 0.04;
  });
  return (<group>
    <color attach="background" args={['#04030c']} />
    <points geometry={geo} material={mat} />
    <group ref={island}>
      <mesh position={[0, -1.25, 0]} castShadow receiveShadow><cylinderGeometry args={[3.4, 1.6, 2.5, 9, 1]} /><meshStandardMaterial color="#2a2338" roughness={0.9} flatShading /></mesh>
      <Platform color="#9b8cff" radius={3.3} />
    </group>
    <ambientLight intensity={0.35} color="#b9b0ff" /><directionalLight position={[-3, 5, 3]} intensity={1.6} color="#ffe2c4" castShadow /><pointLight position={[0, 4, -10]} intensity={60} color="#ffd38a" distance={30} />
  </group>);
};

// ---------------------------------------------------------------- 3. Liquid Chrome Waves
export const LiquidChrome: React.FC = () => {
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#8f98a8', metalness: 1, roughness: 0.12, envMapIntensity: 0.55 });
    m.userData.u = { uT: { value: 0 }, uBass: { value: 0 }, uKick: { value: 0 } };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, m.userData.u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\nuniform float uT, uBass, uKick;\nfloat wave(vec2 p){ float r = length(p); float flat0 = smoothstep(2.8, 5.0, r);
        return flat0 * (0.45*sin(p.x*0.35 + uT*1.1) * cos(p.y*0.3 - uT*0.8) * (0.6 + uBass) + 0.18*sin(r*1.4 - uT*3.0)) + uKick*0.35*exp(-r*0.18)*sin(r*2.2 - uT*9.0)*smoothstep(2.4,4.0,r); }`)
        .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>\nvec2 pp = position.xy; float e = 0.05; float h0 = wave(pp); objectNormal = normalize(vec3(-(wave(pp+vec2(e,0.))-h0)/e, -(wave(pp+vec2(0.,e))-h0)/e, 1.0));`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>\ntransformed.z += wave(position.xy);`);
    };
    return m;
  }, []);
  useFrame(() => { const u = mat.userData.u; u.uT.value = AF.t; u.uBass.value = AF.bass; u.uKick.value = AF.kick; });
  return (<group>
    <color attach="background" args={['#0b0d12']} /><fog attach="fog" args={['#0b0d12', 10, 55]} />
    <mesh rotation-x={-Math.PI / 2} position-y={-0.01} material={mat} receiveShadow><planeGeometry args={[90, 90, 220, 220]} /></mesh>
    <Platform color="#e9f0ff" radius={2.6} y={0.005} />
    <ambientLight intensity={0.12} /><directionalLight position={[4, 7, 3]} intensity={1.4} castShadow /><pointLight position={[-5, 3, -3]} intensity={90} color="#ff3bd0" distance={22} /><pointLight position={[5, 2.5, -5]} intensity={90} color="#3bf0ff" distance={22} /><pointLight position={[0, 4, 4]} intensity={30} color="#ffb347" distance={14} />
  </group>);
};

// ---------------------------------------------------------------- 4. Audio City Skyline (crew on a rooftop above the city)
export const AudioCity: React.FC = () => {
  const G = 26, N = G * G;
  const blocks = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), []);
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#141824', roughness: 0.5, metalness: 0.3, emissive: '#ffb347', emissiveIntensity: 1 });
    m.userData.u = { uHigh: { value: 0 }, uT: { value: 0 } };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, m.userData.u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW; varying vec3 vLocal;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position; vW = (modelMatrix * instanceMatrix * vec4(position,1.)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uHigh, uT; varying vec3 vW; varying vec3 vLocal; float hh(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          vec2 cell = floor(vec2(vW.x + vW.z, vW.y) * vec2(2.2, 2.6)); float lit = step(0.62, hh(cell)) * step(0.15, fract(vW.y*2.6));
          float tw = 0.65 + 0.35*sin(uT*6.0 + hh(cell)*30.0) * uHigh; totalEmissiveRadiance *= lit * tw * step(abs(vLocal.y-0.5), 0.49);`);
    };
    return m;
  }, []);
  const m4 = new THREE.Matrix4();
  useFrame(() => {
    const u = mat.userData.u; u.uHigh.value = AF.high; u.uT.value = AF.t;
    for (let i = 0; i < N; i++) {
      const gx = (i % G) - G / 2, gz = Math.floor(i / G) - G / 2, r = Math.hypot(gx, gz);
      const base = 3 + hash(i) * 16 * (r > 3 ? 1 : 0.1);
      const band = r < 6 ? AF.bass : r < 11 ? AF.mid : AF.high;
      const hgt = base * (0.82 + 0.28 * band) + AF.kick * 1.2 * (r < 8 ? 1 : 0);
      m4.makeScale(1.4, hgt, 1.4).setPosition(gx * 2.6, -26, gz * 2.6 - 8); blocks.current!.setMatrixAt(i, m4);
    }
    blocks.current!.instanceMatrix.needsUpdate = true;
  });
  return (<group>
    <color attach="background" args={['#070914']} /><fog attach="fog" args={['#0a0c1c', 20, 90]} />
    <instancedMesh ref={blocks} args={[geo, mat, N]} />
    {/* rooftop */}
    <mesh position={[0, -0.25, 0]} receiveShadow><boxGeometry args={[9, 0.5, 6]} /><meshStandardMaterial color="#1b1e28" roughness={0.8} /></mesh>
    {[-4.4, 4.4].map((x) => <mesh key={x} position={[x, 0.45, 0]}><boxGeometry args={[0.05, 0.9, 6]} /><meshStandardMaterial color="#9aa3b5" metalness={0.8} roughness={0.3} /></mesh>)}
    <Platform color="#ffb347" radius={2.8} />
    <ambientLight intensity={0.3} color="#8fa0ff" /><directionalLight position={[3, 6, 5]} intensity={1.5} color="#ffd8b0" castShadow /><pointLight position={[0, 4, 3]} intensity={25} color="#ff7a3b" distance={12} />
  </group>);
};
