// The floating circuit board the city stands on, plus the dark space around it. The board's traces are a shader:
// a faint grid, procedural copper traces per cell, and data pulses running along them (driven by the visual clock).
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { BOARD, COLOR, hash } from './layout';
import { vclock } from './clock';

const vert = /* glsl */ `
varying vec3 vW;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

const frag = /* glsl */ `
uniform float uTime; uniform vec2 uSize;
varying vec3 vW;
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void main() {
  vec2 p = vW.xz;
  vec3 col = vec3(0.020, 0.035, 0.075);
  // fine grid
  vec2 g = abs(fract(p / 2.0 - 0.5) - 0.5) * 2.0;
  float grid = 1.0 - smoothstep(0.0, 0.05, min(g.x, g.y));
  col += vec3(0.03, 0.07, 0.12) * grid * 0.6;
  // traces: each 6x6 cell holds one horizontal or vertical trace at a random offset, with a via at its end
  vec2 cell = floor(p / 6.0); vec2 f = fract(p / 6.0);
  float r = h21(cell), o = 0.2 + 0.6 * h21(cell + 7.1);
  float d = r < 0.5 ? abs(f.y - o) : abs(f.x - o);
  float along = r < 0.5 ? f.x : f.y;
  float tr = 1.0 - smoothstep(0.006, 0.02, d);
  float pulse = pow(fract(along - uTime * (0.25 + 0.5 * h21(cell + 3.3)) + h21(cell + 9.7)), 18.0);
  col += vec3(0.06, 0.20, 0.30) * tr * 0.55 + vec3(0.2, 0.9, 1.4) * tr * pulse * 1.4;
  vec2 via = r < 0.5 ? vec2(0.92, o) : vec2(o, 0.92);
  col += vec3(0.15, 0.5, 0.7) * (1.0 - smoothstep(0.02, 0.035, length(f - via)));
  // the edge: a bright rim, and a soft fade toward it
  vec2 e = abs(p) / (uSize * 0.5);
  float edge = max(e.x, e.y);
  col *= 1.0 - 0.35 * smoothstep(0.7, 1.0, edge);
  col += vec3(0.1, 0.7, 1.0) * smoothstep(0.985, 1.0, edge) * 1.6;
  gl_FragColor = vec4(col, 1.0);
}`;

export function Board() {
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: { uTime: { value: 0 }, uSize: { value: new THREE.Vector2(BOARD.w, BOARD.d) } } }), []);
  useFrame(() => { mat.uniforms.uTime.value = vclock.t; });
  const stars = useMemo(() => {
    const n = 1400, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = hash(i, 1) * 2 - 1, a = hash(i, 2) * Math.PI * 2, r = 140 + hash(i, 3) * 60, s = Math.sqrt(1 - u * u);
      pos.set([Math.cos(a) * s * r, u * r * 0.7 - 10, Math.sin(a) * s * r], i * 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); return g;
  }, []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow material={mat}>
        <planeGeometry args={[BOARD.w, BOARD.d]} />
      </mesh>
      {/* the board's thickness and its underside */}
      <mesh position-y={-0.71}>
        <boxGeometry args={[BOARD.w, 1.4, BOARD.d]} />
        <meshStandardMaterial color={COLOR.metalDark} metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position-y={-1.45} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[BOARD.w * 0.96, BOARD.d * 0.96]} />
        <meshBasicMaterial color={'#0a4a7a'} transparent opacity={0.35} toneMapped={false} />
      </mesh>
      <points geometry={stars}>
        <pointsMaterial color={'#9fc8ff'} size={0.5} sizeAttenuation transparent opacity={0.7} depthWrite={false} />
      </points>
    </group>
  );
}
