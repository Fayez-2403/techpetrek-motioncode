// Worlds 5-8: Fractal Bloom, Beat Dancer Stage, Dream Space, Developer Break (the office that becomes a dance floor).
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { AF } from '../scene/af';
import { Platform } from './WorldsA';
import { getState } from '../state';
import { deskSpot, standBeat } from '../scene/Performers';

const hash = (i: number, s = 0) => { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };

// ---------------------------------------------------------------- 5. Fractal Bloom
export const FractalBloom: React.FC = () => {
  const F = 70, P = 7;
  const petals = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.SphereGeometry(0.5, 12, 8).scale(0.32, 0.06, 1).translate(0, 0, 0.5), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.1, emissive: '#ff4fb0', emissiveIntensity: 0.35 }), []);
  const sky = useMemo(() => new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { uT: { value: 0 }, uMid: { value: 0 }, uDrop: { value: 0 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform float uT, uMid, uDrop; varying vec3 vD; void main(){ vec2 p = vD.xz/(1.2+vD.y); float a = atan(p.y,p.x), r = length(p);
      a = abs(mod(a, 6.2831/8.0) - 3.14159/8.0); vec2 q = vec2(cos(a),sin(a))*r; float f = 0.0; for(int i=0;i<5;i++){ q = abs(q)/dot(q,q) - 0.72 - 0.05*sin(uT*0.2); f += exp(-length(q)*1.6); }
      vec3 c = mix(vec3(0.05,0.02,0.09), mix(vec3(0.95,0.35,0.7), vec3(0.3,0.8,0.9), uDrop), f*0.18*(0.6+uMid)); gl_FragColor = vec4(c,1.); }` }), []);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  useFrame(() => {
    sky.uniforms.uT.value = AF.t; sky.uniforms.uMid.value = AF.mid; sky.uniforms.uDrop.value = AF.drop;
    let k = 0;
    for (let f = 0; f < F; f++) {
      const ring = f < 24 ? 3.6 : f < 48 ? 5.4 : 7.6, a = (f / (f < 24 ? 24 : f < 48 ? 24 : 22)) * Math.PI * 2 + ring;
      const cx = Math.cos(a) * ring, cz = Math.sin(a) * ring - 1, bloom = 0.35 + 0.65 * Math.max(0, Math.sin(AF.b * 0.25 + f * 0.4)) * (0.5 + AF.mid);
      const sz = (0.6 + hash(f) * 0.6) * (1 + AF.kick * 0.25 * (f % 3 === 0 ? 1 : 0));
      for (let p = 0; p < P; p++) {
        const pa = (p / P) * Math.PI * 2 + AF.t * 0.1;
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.25 - bloom * 1.0, pa, 0, 'YXZ'));
        m4.compose(new THREE.Vector3(cx, 0.15 + hash(f, 2) * 0.4, cz), q, new THREE.Vector3(sz, sz, sz)); petals.current!.setMatrixAt(k, m4);
        col.setHSL((0.86 + hash(f, 1) * 0.25 + AF.drop * 0.3) % 1, 0.75, 0.6); petals.current!.setColorAt(k, col); k++;
      }
    }
    petals.current!.instanceMatrix.needsUpdate = true; if (petals.current!.instanceColor) petals.current!.instanceColor.needsUpdate = true;
  });
  return (<group>
    <mesh material={sky}><sphereGeometry args={[60, 48, 24]} /></mesh>
    <instancedMesh ref={petals} args={[geo, mat, F * P]} castShadow />
    <Platform color="#ff8ad1" radius={2.7} />
    <ambientLight intensity={0.45} color="#ffd7f0" /><directionalLight position={[3, 6, 4]} intensity={1.8} castShadow /><pointLight position={[0, 3, -2]} intensity={20} color="#7cf2ff" distance={10} />
  </group>);
};

// ---------------------------------------------------------------- 6. Beat Dancer Stage (concert)
export const BeatStage: React.FC = () => {
  const lights = useRef<THREE.Group>(null);
  const wall = useMemo(() => new THREE.ShaderMaterial({ toneMapped: false, uniforms: { uT: { value: 0 }, uB: { value: 0 }, uM: { value: 0 }, uH: { value: 0 }, uK: { value: 0 }, uDrop: { value: 0 } },
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform float uT,uB,uM,uH,uK,uDrop; varying vec2 vU; float hh(float x){ return fract(sin(x*91.3)*437.5); }
      void main(){ float bars = 40.0; float i = floor(vU.x*bars); float x = i/bars; float band = mix(mix(uB,uM,smoothstep(0.15,0.5,x)),uH,smoothstep(0.5,0.95,x));
        float hgt = band*(0.55+0.45*hh(i+floor(uT*8.0))) ; float on = step(vU.y, hgt) * step(0.12, fract(vU.x*bars)) * step(0.2, fract(vU.y*28.0));
        vec3 c = mix(vec3(0.1,0.8,1.0), vec3(1.0,0.2,0.75), vU.y); c = mix(c, vec3(1.0,0.85,0.3), uDrop*step(0.5,hh(i)));
        gl_FragColor = vec4(c*on*1.6 + vec3(0.02,0.01,0.05) + uK*0.08, 1.0); }` }), []);
  const confetti = useRef<THREE.InstancedMesh>(null);
  const cgeo = useMemo(() => new THREE.PlaneGeometry(0.06, 0.03), []);
  const cmat = useMemo(() => new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), []);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  useFrame(() => {
    const u = wall.uniforms; u.uT.value = AF.t; u.uB.value = AF.bass; u.uM.value = AF.mid; u.uH.value = AF.high; u.uK.value = AF.kick; u.uDrop.value = AF.drop;
    lights.current!.children.forEach((g, i) => { const a = Math.sin(AF.b * Math.PI * 0.25 + i * 1.3) * 0.55, b2 = 0.35 + 0.25 * Math.sin(AF.b * 0.5 + i); g.rotation.set(b2, 0, a); });
    // confetti: only after a drop, each piece falls on a pure path from its launch beat
    const C = 260;
    for (let i = 0; i < C; i++) {
      const life = ((AF.t * 0.35 + hash(i)) % 1), x = (hash(i, 1) - 0.5) * 9, z = (hash(i, 2) - 0.5) * 6 - 1, y = 6.5 - life * 7;
      const s = AF.drop ? 1 : 0;
      m4.compose(new THREE.Vector3(x + Math.sin(life * 9 + i) * 0.3, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(life * 12 + i, life * 7, 0)), new THREE.Vector3(s, s, s));
      confetti.current!.setMatrixAt(i, m4); col.setHSL(hash(i, 3), 0.9, 0.6); confetti.current!.setColorAt(i, col);
    }
    confetti.current!.instanceMatrix.needsUpdate = true; if (confetti.current!.instanceColor) confetti.current!.instanceColor.needsUpdate = true;
  });
  const strobe = AF.drop && AF.kick > 0.6 ? 1 : 0; void strobe;
  return (<group>
    <color attach="background" args={['#030305']} /><fog attach="fog" args={['#030305', 12, 40]} />
    <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[30, 20]} /><MeshReflectorMaterial resolution={1024} blur={[300, 80]} mixBlur={0.9} mixStrength={2.2} roughness={0.85} depthScale={1} minDepthThreshold={0.4} maxDepthThreshold={1.4} color="#07070a" metalness={0.6} mirror={0.6} /></mesh>
    <mesh position={[0, 3.2, -4.2]} material={wall}><planeGeometry args={[11, 4.8]} /></mesh>
    {[-5.6, 5.6].map((x) => <mesh key={x} position={[x, 3, -3.6]}><boxGeometry args={[0.25, 6, 0.25]} /><meshStandardMaterial color="#2a2c33" metalness={0.9} roughness={0.35} /></mesh>)}
    <mesh position={[0, 6, -3.6]}><boxGeometry args={[11.5, 0.25, 0.25]} /><meshStandardMaterial color="#2a2c33" metalness={0.9} roughness={0.35} /></mesh>
    <group ref={lights}>
      {[-4.5, -2.5, -0.8, 0.8, 2.5, 4.5].map((x, i) => (
        <group key={x} position={[x, 5.8, -3.4]}>
          <mesh position={[0, -2.6, 0]}><coneGeometry args={[0.9, 5.2, 24, 1, true]} /><meshBasicMaterial color={i % 2 ? '#3bf0ff' : '#ff3bd0'} transparent opacity={0.07} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} side={THREE.DoubleSide} /></mesh>
          <spotLight position={[0, 0, 0]} angle={0.32} penumbra={0.6} intensity={60} distance={14} color={i % 2 ? '#3bf0ff' : '#ff3bd0'} />
        </group>
      ))}
    </group>
    <instancedMesh ref={confetti} args={[cgeo, cmat, 260]} />
    <Platform color="#3bf0ff" radius={3.0} />
    <ambientLight intensity={0.18} /><directionalLight position={[0, 6, 5]} intensity={1.6} castShadow />
  </group>);
};

// ---------------------------------------------------------------- 7. Dream Space
export const DreamSpace: React.FC = () => {
  const isles = useRef<THREE.Group>(null);
  const sky = useMemo(() => new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { uT: { value: 0 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform float uT; varying vec3 vD; void main(){ float y = vD.y*0.5+0.5; vec3 c = mix(vec3(0.99,0.78,0.86), vec3(0.55,0.62,0.98), y); c += 0.04*sin(vD.x*6.0+uT*0.2); gl_FragColor = vec4(c,1.); }' }), []);
  const dust = useMemo(() => { const g = new THREE.BufferGeometry(), p = new Float32Array(1400 * 3); for (let i = 0; i < 1400; i++) p.set([(hash(i) - 0.5) * 30, hash(i, 1) * 10, (hash(i, 2) - 0.5) * 30 - 5], i * 3); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return g; }, []);
  const dustRef = useRef<THREE.Points>(null);
  useFrame(() => {
    sky.uniforms.uT.value = AF.t;
    isles.current!.children.forEach((c, i) => { c.position.y = c.userData.y + Math.sin(AF.t * 0.5 + i) * 0.3 + AF.bass * 0.25 * (i % 2 ? 1 : -1); c.rotation.y = AF.t * 0.05 * (i % 2 ? 1 : -1); });
    dustRef.current!.rotation.y = AF.t * 0.02; (dustRef.current!.material as THREE.PointsMaterial).size = 0.05 + AF.high * 0.06;
  });
  const isleDefs = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ x: (hash(i) - 0.5) * 22, y: 1 + hash(i, 1) * 6, z: -6 - hash(i, 2) * 14, s: 0.6 + hash(i, 3) * 1.4 })), []);
  return (<group>
    <mesh material={sky}><sphereGeometry args={[70, 32, 16]} /></mesh><fog attach="fog" args={['#e9c9e6', 14, 60]} />
    <group ref={isles}>{isleDefs.map((d, i) => (
      <group key={i} position={[d.x, d.y, d.z]} userData={{ y: d.y }} scale={d.s}>
        <mesh><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#d9cfe6" roughness={0.9} flatShading /></mesh>
        <mesh position={[0, 0.75, 0]}><sphereGeometry args={[0.85, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#b9e6cf" roughness={1} /></mesh>
      </group>))}</group>
    <points ref={dustRef} geometry={dust}><pointsMaterial size={0.06} color="#ffffff" transparent opacity={0.8} /></points>
    <mesh position={[0, -0.63, 0]} receiveShadow><cylinderGeometry args={[3.3, 2.2, 1.2, 40]} /><meshStandardMaterial color="#f4ede4" roughness={0.85} /></mesh>
    <Platform color="#b9a6ff" radius={3.1} />
    <ambientLight intensity={0.42} color="#ffe6f2" /><directionalLight position={[-3, 7, 4]} intensity={1.35} color="#fff2e0" castShadow /><hemisphereLight args={['#c9d3ff', '#ffd9e6', 0.45]} />
  </group>);
};

// ---------------------------------------------------------------- 8. Developer Break (office -> LED dance floor)
function useMonitorTexture(seed: number) {
  return useMemo(() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 160;
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    return { c, g: c.getContext('2d')!, tex, seed };
  }, [seed]);
}
const Monitor: React.FC<{ x: number; z: number; seed: number }> = ({ x, z, seed }) => {
  const m = useMonitorTexture(seed);
  useFrame(() => {
    const { g, c } = m, b = AF.b, live = b > standBeat(0) + getState().introAt;
    g.fillStyle = live ? '#05030c' : '#1b1f2a'; g.fillRect(0, 0, c.width, c.height);
    if (!live) {   // code editor lines before the music takes over
      for (let i = 0; i < 12; i++) { g.fillStyle = ['#7aa2f7', '#9ece6a', '#bb9af7', '#e0af68'][(i + seed) % 4]; g.fillRect(14 + ((i * 7 + seed) % 5) * 10, 12 + i * 12, 40 + hash(i, seed) * 150, 5); }
    } else {
      for (let i = 0; i < 24; i++) { const v = i < 8 ? AF.bass : i < 16 ? AF.mid : AF.high; const hh = (0.25 + 0.75 * v * (0.6 + 0.4 * hash(i + Math.floor(AF.t * 10), seed))) * c.height; g.fillStyle = `hsl(${(300 + i * 6 + seed * 20) % 360} 100% 60%)`; g.fillRect(6 + i * 10.4, c.height - hh, 7, hh); }
    }
    m.tex.needsUpdate = true;
  });
  return (<group position={[x, 0.76, z]}>
    <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.62, 0.38, 0.03]} /><meshStandardMaterial color="#111216" roughness={0.4} /></mesh>
    <mesh position={[0, 0.3, 0.017]}><planeGeometry args={[0.58, 0.34]} /><meshBasicMaterial map={m.tex} toneMapped={false} /></mesh>
    <mesh position={[0, 0.06, -0.03]}><boxGeometry args={[0.05, 0.14, 0.05]} /><meshStandardMaterial color="#2a2c32" /></mesh>
    <pointLight position={[0, 0.3, 0.35]} color="#7fb2ff" intensity={1.6} distance={2.2} decay={1.6} />
  </group>);
};
export const OfficeBreak: React.FC = () => {
  const n = getState().performers.length;
  const tiles = useRef<THREE.InstancedMesh>(null);
  const TX = 14, TZ = 9;
  const tgeo = useMemo(() => new THREE.PlaneGeometry(0.58, 0.58).rotateX(-Math.PI / 2), []);
  const tmat = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  const lamp = useRef<THREE.PointLight>(null), room = useRef<THREE.AmbientLight>(null);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  useFrame(() => {
    const on = Math.max(0, Math.min(1, (AF.b - standBeat(0) - getState().introAt - 1) / 4));   // the floor wakes up once the lead stands
    for (let i = 0; i < TX * TZ; i++) {
      const gx = (i % TX) - TX / 2 + 0.5, gz = Math.floor(i / TX) - TZ / 2 + 0.5;
      m4.makeTranslation(gx * 0.6, 0.004, gz * 0.6 + 0.6); tiles.current!.setMatrixAt(i, m4);
      const pulse = Math.max(0, Math.sin(AF.b * Math.PI * 0.5 + (gx + gz) * 0.6)) * (0.4 + AF.kick);
      col.setHSL((0.8 + (gx * 0.03) + AF.b * 0.01) % 1, 1, (0.08 + 0.45 * pulse) * on); tiles.current!.setColorAt(i, col);
    }
    tiles.current!.instanceMatrix.needsUpdate = true; if (tiles.current!.instanceColor) tiles.current!.instanceColor.needsUpdate = true;
    if (room.current) room.current.intensity = 0.95 - 0.7 * on;
    if (lamp.current) lamp.current.intensity = 22 * on * (0.6 + AF.kick);
  });
  return (<group>
    <color attach="background" args={['#0d0f14']} />
    <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[14, 10]} /><meshStandardMaterial color="#3a3d44" roughness={0.85} /></mesh>
    <instancedMesh ref={tiles} args={[tgeo, tmat, TX * TZ]} />
    <mesh position={[0, 2, -3.2]}><planeGeometry args={[14, 4]} /><meshStandardMaterial color="#353a46" roughness={0.9} /></mesh>
    {[-7, 7].map((x) => <mesh key={x} position={[x, 2, 1.8]} rotation-y={x < 0 ? Math.PI / 2 : -Math.PI / 2}><planeGeometry args={[10, 4]} /><meshStandardMaterial color="#2d313b" roughness={0.9} /></mesh>)}
    {/* night-city window, ceiling and light panels, plants */}
    <mesh position={[3.4, 2.05, -3.18]}><planeGeometry args={[3.0, 1.5]} /><meshBasicMaterial color="#0b1730" /></mesh>
    {Array.from({ length: 22 }, (_, i) => <mesh key={i} position={[2.05 + (i % 11) * 0.27, 1.45 + Math.floor(i / 11) * 0.35 + hash(i) * 0.5, -3.17]}><planeGeometry args={[0.16, 0.5 + hash(i, 2) * 0.6]} /><meshBasicMaterial color={hash(i, 3) > 0.5 ? '#ffb347' : '#3bf0ff'} transparent opacity={0.35 + hash(i, 4) * 0.4} /></mesh>)}
    <mesh position={[0, 4, 0]} rotation-x={Math.PI / 2}><planeGeometry args={[14, 10]} /><meshStandardMaterial color="#1c1f26" side={THREE.DoubleSide} /></mesh>
    {[-3, 0, 3].map((x) => <mesh key={x} position={[x, 3.98, -0.6]} rotation-x={Math.PI / 2}><planeGeometry args={[1.6, 0.25]} /><meshBasicMaterial color="#f4f6ff" side={THREE.DoubleSide} /></mesh>)}
    {[-5.2, 5.2].map((x) => <group key={x} position={[x, 0, -2.4]}><mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.22, 0.17, 0.6, 16]} /><meshStandardMaterial color="#e9e4da" roughness={0.7} /></mesh>{[0, 1, 2, 3, 4].map((k) => <mesh key={k} position={[Math.sin(k * 1.3) * 0.15, 0.85 + k * 0.08, Math.cos(k * 1.3) * 0.15]} rotation-z={Math.sin(k) * 0.5}><sphereGeometry args={[0.2, 10, 8]} /><meshStandardMaterial color="#2f6b45" roughness={0.8} /></mesh>)}</group>)}
    {Array.from({ length: Math.max(n, 1) }, (_, i) => { const [x, z] = deskSpot(i, Math.max(n, 1)); return (
      <group key={i}>
        <mesh position={[x, 0.74, z - 0.45]} castShadow receiveShadow><boxGeometry args={[1.3, 0.04, 0.7]} /><meshStandardMaterial color="#c9b79c" roughness={0.6} /></mesh>
        {[-0.6, 0.6].map((dx) => <mesh key={dx} position={[x + dx, 0.37, z - 0.45]}><boxGeometry args={[0.04, 0.74, 0.62]} /><meshStandardMaterial color="#2b2d33" /></mesh>)}
        <Monitor x={x} z={z - 0.65} seed={i} />
        <mesh position={[x, 0.45, z + 0.05]}><boxGeometry args={[0.46, 0.06, 0.44]} /><meshStandardMaterial color="#202228" /></mesh>
        <mesh position={[x, 0.75, z + 0.27]}><boxGeometry args={[0.44, 0.56, 0.05]} /><meshStandardMaterial color="#202228" /></mesh>
      </group>); })}
    <ambientLight ref={room} intensity={0.95} color="#e8ecf5" />
    <directionalLight position={[2, 6, 4]} intensity={1.3} castShadow />
    <pointLight ref={lamp} position={[0, 3, 1]} color="#ff3bd0" distance={12} intensity={0} />
    <pointLight position={[-3, 2.5, 0]} color="#3bf0ff" distance={10} intensity={8} />
    <pointLight position={[3, 2.5, 0]} color="#ffb347" distance={10} intensity={6} />
  </group>);
};
