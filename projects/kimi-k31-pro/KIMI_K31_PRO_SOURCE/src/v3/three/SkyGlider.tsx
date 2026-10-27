// SkyGlider: an original procedural jet-glider for the SKY FLIGHT shot (no real aircraft). Local frame: nose -Z, up +Y,
// right +X, about 3.3 units long and 3.8 wide. Pearl-white clear-coated body with an orange livery, a tinted canopy,
// swept wings with winglets, canted twin tails and two blended engines whose cyan exhaust swells with `boost`.
// Geometry is built once; only the exhaust and the beat strobe change per frame.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { P3 } from './SkyKit';

/** wingtip and nozzle positions in the craft frame (for contrails) */
export const GLIDER = {
  tipR: [1.9, 0.2, 0.62] as P3, tipL: [-1.9, 0.2, 0.62] as P3,
  nozR: [0.36, -0.06, 1.5] as P3, nozL: [-0.36, -0.06, 1.5] as P3,
};

const ORANGE = new THREE.Color('#FF6A1A'), WHITE = new THREE.Color('#F3F5F8'), GRAPH = new THREE.Color('#2A2F38'), BELLY = new THREE.Color('#C9D0DA');

/** dense lathe along +Z from (r, z) keys, flattened vertically, with livery vertex colours */
function fuselageGeo() {
  const keys: [number, number][] = [[0.001, -1.75], [0.05, -1.68], [0.11, -1.5], [0.17, -1.25], [0.22, -0.95], [0.26, -0.6], [0.28, -0.2], [0.28, 0.3], [0.25, 0.8], [0.2, 1.2], [0.14, 1.45], [0.08, 1.55], [0.001, 1.57]];
  const curve = new THREE.SplineCurve(keys.map(([r, z]) => new THREE.Vector2(r, z)));
  const pts = curve.getPoints(70).map((p) => new THREE.Vector2(Math.max(0.001, p.x), p.y));
  const g = new THREE.LatheGeometry(pts, 56);
  g.rotateX(Math.PI / 2);
  g.scale(1, 0.72, 1);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const col: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const ang = Math.atan2(x, y); // 0 = top
    let c = WHITE;
    if (z < -1.42) c = GRAPH;
    else if (z > -0.12 && z < 0.02) c = ORANGE;
    else if (Math.abs(ang) < 0.16 && z > 0.05 && z < 1.3) c = ORANGE;
    else if (y < -0.12) c = BELLY;
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

/** flat planform (x, z) extruded downwards with a rounded bevel, top face at y = 0 */
function plate(pts: [number, number][], thick: number, bevel: number) {
  const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, z)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 8 });
  g.rotateX(Math.PI / 2); // shape y -> world z, extrusion -> world -y
  g.translate(0, -bevel, 0);
  g.computeVertexNormals();
  return g;
}
/** vertical fin from (z, y) points, extruded along x and centred */
function fin(pts: [number, number][], thick: number) {
  const sh = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 6 });
  g.translate(0, 0, -thick / 2);
  g.rotateY(-Math.PI / 2); // shape x -> world z
  g.computeVertexNormals();
  return g;
}

function useGliderParts() {
  return useMemo(() => {
    const wingR: [number, number][] = [[0.2, -0.38], [0.9, -0.05], [1.86, 0.4], [1.93, 0.56], [1.9, 0.74], [1.2, 0.8], [0.2, 0.9]];
    const tipPanel: [number, number][] = [[1.28, 0.14], [1.86, 0.41], [1.92, 0.56], [1.89, 0.73], [1.3, 0.77]];
    const mirror = (p: [number, number][]) => p.map(([x, z]) => [-x, z] as [number, number]).reverse();
    const nacelle = new THREE.LatheGeometry([[0.08, 0.1], [0.14, 0.28], [0.165, 0.6], [0.16, 1.1], [0.135, 1.42], [0.12, 1.47]].map(([r, z]) => new THREE.Vector2(r, z)), 32);
    nacelle.rotateX(Math.PI / 2);
    const lip = new THREE.TorusGeometry(0.115, 0.022, 10, 32);
    lip.translate(0, 0, 1.47);
    const mats = {
      paint: new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', vertexColors: true, metalness: 0.15, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.07, envMapIntensity: 1.1 }),
      white: new THREE.MeshPhysicalMaterial({ color: WHITE, metalness: 0.15, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.07, envMapIntensity: 1.1 }),
      orange: new THREE.MeshPhysicalMaterial({ color: ORANGE, metalness: 0.2, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
      graphite: new THREE.MeshPhysicalMaterial({ color: GRAPH, metalness: 0.75, roughness: 0.3, clearcoat: 0.6 }),
      glass: new THREE.MeshPhysicalMaterial({ color: '#0D1A30', metalness: 0.2, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.2 }),
      glow: new THREE.MeshBasicMaterial({ color: '#BFF6FF', toneMapped: false }),
    };
    return {
      fuselage: fuselageGeo(),
      canopy: new THREE.SphereGeometry(1, 32, 16),
      wingR: plate(wingR, 0.045, 0.022), wingL: plate(mirror(wingR), 0.045, 0.022),
      panelR: plate(tipPanel, 0.004, 0.004), panelL: plate(mirror(tipPanel), 0.004, 0.004),
      winglet: fin([[0.42, 0], [0.74, 0], [0.84, 0.36], [0.68, 0.39]], 0.025),
      tail: fin([[0.72, 0], [1.45, 0], [1.62, 0.6], [1.34, 0.64]], 0.03),
      nacelle, lip,
      disc: new THREE.CircleGeometry(0.1, 24),
      light: new THREE.SphereGeometry(0.045, 12, 8),
      plume: plumeGeo(),
      glowTex: glowTexture(),
      mats,
    };
  }, []);
}

function plumeGeo() {
  const g = new THREE.CylinderGeometry(0.1, 0.02, 1, 20, 6, true);
  g.translate(0, -0.5, 0);
  g.rotateX(-Math.PI / 2); // along +z
  return g;
}
const plumeMat = () => new THREE.ShaderMaterial({
  uniforms: { uK: { value: 1 }, uCol: { value: new THREE.Color('#6FE8FF') } },
  vertexShader: `varying float vZ; varying vec3 vN; varying vec3 vV; void main(){ vZ = position.z; vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `uniform float uK; uniform vec3 uCol; varying float vZ; varying vec3 vN; varying vec3 vV;
    void main(){ float f = pow(abs(dot(normalize(vN), vV)), 1.6); float a = uK * f * pow(1.0 - clamp(vZ, 0.0, 1.0), 1.8);
      vec3 c = mix(uCol, vec3(1.0), f * (1.0 - vZ)); gl_FragColor = vec4(c * a, a); }`,
  transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false,
});

let GLOW: THREE.Texture | null = null;
export function glowTexture() {
  if (GLOW) return GLOW;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,255,255,0.55)'); g.addColorStop(0.45, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  GLOW = new THREE.CanvasTexture(c);
  return GLOW;
}

/** additive camera-facing glow sprite */
export const Glow: React.FC<{ p: P3; s: number; color: string; a: number }> = ({ p, s, color, a }) => {
  if (a <= 0.003) return null;
  return (
    <sprite position={p} scale={[s, s, s]} renderOrder={30}>
      <spriteMaterial map={glowTexture()} color={color} transparent opacity={Math.min(1, a)} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  );
};

/** the craft. boost 0..1.5 swells the exhaust; strobe 0..1 flashes the wingtip strobes (beat-locked by the scene) */
export const SkyGlider: React.FC<{ boost: number; strobe?: number }> = ({ boost, strobe = 0 }) => {
  const G = useGliderParts();
  const pm = useMemo(() => [plumeMat(), plumeMat()], []);
  pm.forEach((m) => { m.uniforms.uK.value = 0.45 + 0.45 * boost; });
  const M = G.mats;
  const plumeLen = 0.55 + 0.75 * boost;
  return (
    <group>
      <mesh geometry={G.fuselage} material={M.paint} />
      <mesh geometry={G.canopy} material={M.glass} position={[0, 0.13, -0.72]} scale={[0.165, 0.15, 0.56]} />
      <mesh geometry={G.canopy} material={M.graphite} position={[0, 0.07, -0.66]} scale={[0.185, 0.1, 0.62]} />
      {/* wings with a little dihedral */}
      <group position={[0, -0.02, 0]} rotation={[0, 0, 0.07]}>
        <mesh geometry={G.wingR} material={M.white} />
        <mesh geometry={G.panelR} material={M.orange} position={[0, 0.006, 0]} />
        <mesh geometry={G.winglet} material={M.orange} position={[1.9, 0.0, 0]} rotation={[0, 0, -0.32]} />
        <mesh geometry={G.light} material={M.glow} position={[1.93, 0.02, 0.5]} />
      </group>
      <group position={[0, -0.02, 0]} rotation={[0, 0, -0.07]}>
        <mesh geometry={G.wingL} material={M.white} />
        <mesh geometry={G.panelL} material={M.orange} position={[0, 0.006, 0]} />
        <mesh geometry={G.winglet} material={M.orange} position={[-1.9, 0.0, 0]} rotation={[0, 0, 0.32]} />
        <mesh geometry={G.light} material={M.glow} position={[-1.93, 0.02, 0.5]} />
      </group>
      {/* canted twin tails */}
      <mesh geometry={G.tail} material={M.white} position={[0.16, 0.1, 0]} rotation={[0, 0, -0.42]} />
      <mesh geometry={G.tail} material={M.white} position={[-0.16, 0.1, 0]} rotation={[0, 0, 0.42]} />
      {/* engines */}
      {[0.36, -0.36].map((x) => (
        <group key={x} position={[x, -0.06, 0]}>
          <mesh geometry={G.nacelle} material={M.graphite} />
          <mesh geometry={G.lip} material={M.orange} />
          <mesh geometry={G.disc} material={M.glow} position={[0, 0, 1.465]} />
          <mesh geometry={G.plume} material={pm[x > 0 ? 0 : 1]} position={[0, 0, 1.47]} scale={[1, 1, plumeLen]} renderOrder={31} />
        </group>
      ))}
      <Glow p={[0.36, -0.06, 1.56]} s={0.55 + 0.5 * boost} color="#7FEBFF" a={0.55 + 0.3 * boost} />
      <Glow p={[-0.36, -0.06, 1.56]} s={0.55 + 0.5 * boost} color="#7FEBFF" a={0.55 + 0.3 * boost} />
      <Glow p={[1.93, 0.04, 0.5]} s={0.3 + 0.7 * strobe} color="#9EF2FF" a={0.4 + 0.5 * strobe} />
      <Glow p={[-1.93, 0.04, 0.5]} s={0.3 + 0.7 * strobe} color="#FFB36B" a={0.4 + 0.5 * strobe} />
    </group>
  );
};
