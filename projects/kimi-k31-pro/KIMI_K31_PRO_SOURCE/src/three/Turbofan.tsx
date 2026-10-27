// A procedural turbofan for the CAD lab (illustrative reconstruction, not an engineering model). Axis = Z, intake
// facing +Z. Every part can be shown as CAD wireframe, as a surface "growing" around the axis (lathe sweep), or solid,
// and can be exploded along the axis. All parameters are numbers in [0,1] driven by the scene's frame.
import React, { useMemo } from 'react';
import * as THREE from 'three';

const V2 = (x: number, y: number) => new THREE.Vector2(x, y);
const SEG = 96;

/** lathe around Z from (radius, z) profile points (LatheGeometry revolves around Y, so rotate it onto Z) */
function lathe(profile: [number, number][]) {
  const g = new THREE.LatheGeometry(profile.map(([r, z]) => V2(r, z)), SEG);
  g.rotateX(Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

/** a twisted, tapered blade sheet from r0 to r1 */
function blade(r0: number, r1: number, c0: number, c1: number, tw0: number, tw1: number, camber = 0.05) {
  const nu = 10, nv = 6, pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    const u = i / nu, v = j / nv - 0.5, r = r0 + (r1 - r0) * u, ch = c0 + (c1 - c0) * u, tw = tw0 + (tw1 - tw0) * u;
    const along = v * ch, bow = camber * ch * (1 - 4 * v * v);
    // chord direction rotated by the twist around the radial (Y) axis
    pos.push(Math.cos(tw) * along - Math.sin(tw) * bow, r, Math.sin(tw) * along + Math.cos(tw) * bow);
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = i * (nv + 1) + j, b = a + nv + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

/** n blades merged around the axis, at depth z */
function bladeRing(n: number, b: THREE.BufferGeometry, z: number, phase = 0) {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) { const g = b.clone(); g.rotateZ((i / n) * Math.PI * 2 + phase); g.translate(0, 0, z); parts.push(g); }
  return merge(parts);
}

function merge(gs: THREE.BufferGeometry[]) {
  let nv = 0; const pos: number[] = [], nor: number[] = [], idx: number[] = [];
  for (const g of gs) {
    const p = g.attributes.position.array, n = g.attributes.normal.array, ix = g.index!.array;
    for (let i = 0; i < p.length; i++) { pos.push(p[i]); nor.push(n[i]); }
    for (let i = 0; i < ix.length; i++) idx.push(ix[i] + nv);
    nv += p.length / 3;
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); m.setIndex(idx);
  return m;
}

/** side-profile outlines (radius, z) used for the reference sketch */
export const SKETCH: [number, number][][] = [
  [[0.001, 2.02], [0.08, 1.98], [0.18, 1.86], [0.26, 1.7], [0.31, 1.55], [0.33, 1.42]],
  [[1.05, 2.0], [1.13, 2.06], [1.2, 2.0], [1.24, 1.6], [1.26, 0.8], [1.22, 0.0], [1.12, -0.7], [1.06, -0.9], [1.04, -0.6], [1.04, 0.6], [1.02, 1.6], [1.03, 1.9], [1.05, 2.0]],
  [[0.66, 1.08], [0.68, 0.6], [0.62, 0.0], [0.58, -0.6], [0.62, -1.3], [0.66, -1.75], [0.6, -2.2], [0.52, -2.6]],
  [[0.36, -1.75], [0.32, -2.2], [0.2, -2.6], [0.06, -2.9], [0.001, -2.95]],
  [[0.3, 1.36], [1.0, 1.36]],
  [[0.2, 0.95], [0.62, 0.95]], [[0.2, 0.55], [0.56, 0.55]], [[0.2, 0.06], [0.47, 0.06]],
  [[0.16, -1.0], [0.5, -1.0]], [[0.16, -1.36], [0.56, -1.36]],
];

export interface Part { key: string; label: string; geo: THREE.BufferGeometry; edges: THREE.BufferGeometry; mat: 'shell' | 'blade' | 'dark' | 'steel' | 'copper'; z: number; explode: number; lift?: number; spin: boolean; lathe: boolean }

export function buildTurbofan(): Part[] {
  const P: Omit<Part, 'edges'>[] = [];
  const add = (key: string, label: string, geo: THREE.BufferGeometry, mat: Part['mat'], z: number, explode: number, spin = false, isLathe = false) => P.push({ key, label, geo, mat, z, explode, spin, lathe: isLathe });
  add('spinner', 'SPINNER', lathe([[0.001, 2.02], [0.08, 1.98], [0.18, 1.86], [0.26, 1.7], [0.31, 1.55], [0.33, 1.42]]), 'dark', 1.7, 2.2, true, true);
  add('fan', 'FAN', bladeRing(22, blade(0.3, 1.0, 0.34, 0.22, 0.95, 0.42, 0.06), 1.36), 'blade', 1.36, 1.7, true);
  add('fanhub', 'FAN DISK', lathe([[0.33, 1.42], [0.36, 1.3], [0.36, 1.2], [0.33, 1.12]]), 'steel', 1.3, 1.7, true, true);
  add('nacelle', 'NACELLE', lathe([[1.05, 2.0], [1.13, 2.06], [1.2, 2.0], [1.24, 1.6], [1.26, 0.8], [1.22, 0.0], [1.12, -0.7], [1.06, -0.9], [1.04, -0.6], [1.04, 0.6], [1.02, 1.6], [1.03, 1.9], [1.05, 2.0]]), 'shell', 0.6, 0.5, false, true);
  P[P.length - 1].lift = 1.9;   // the cowl lifts off upward instead of flying at the camera
  const stages = [0.95, 0.75, 0.55, 0.38, 0.22, 0.06];
  stages.forEach((z, i) => {
    const r = 0.62 - i * 0.03;
    add(`comp${i}`, i === 0 ? 'COMPRESSOR' : '', merge([lathe([[0.2, z + 0.05], [r - 0.12, z + 0.05], [r - 0.12, z - 0.05], [0.2, z - 0.05]]), bladeRing(34, blade(r - 0.12, r, 0.09, 0.07, 0.7, 0.45, 0.03), z, i * 0.1)]), 'steel', z, 0.9 + i * 0.32, true);
  });
  add('core', 'CORE CASING', lathe([[0.66, 1.08], [0.68, 0.6], [0.62, 0.0], [0.58, -0.6], [0.62, -1.3], [0.66, -1.75], [0.64, -1.75], [0.6, -1.3], [0.56, -0.6], [0.6, 0.0], [0.66, 0.6], [0.64, 1.08]]), 'shell', -0.3, -0.2, false, true);
  add('combustor', 'COMBUSTOR', merge([new THREE.TorusGeometry(0.44, 0.075, 24, SEG).translate(0, 0, -0.55)]), 'copper', -0.55, -0.9);
  [-1.0, -1.18, -1.36].forEach((z, i) => {
    const r = 0.5 + i * 0.03;
    add(`turb${i}`, i === 0 ? 'TURBINE' : '', merge([lathe([[0.16, z + 0.05], [r - 0.14, z + 0.05], [r - 0.14, z - 0.05], [0.16, z - 0.05]]), bladeRing(40, blade(r - 0.14, r, 0.08, 0.06, -0.6, -0.4, 0.04), z, i * 0.2)]), 'copper', z, -1.5 - i * 0.35, true);
  });
  add('shaft', 'SHAFT', lathe([[0.1, 1.2], [0.1, -1.9], [0.08, -1.9], [0.08, 1.2]]), 'dark', -0.3, 0, true, true);
  add('nozzle', 'EXHAUST NOZZLE', lathe([[0.66, -1.75], [0.6, -2.2], [0.52, -2.6], [0.5, -2.6], [0.58, -2.2], [0.64, -1.75]]), 'shell', -2.2, -3.0, false, true);
  add('plug', 'TAIL CONE', lathe([[0.36, -1.75], [0.32, -2.2], [0.2, -2.6], [0.06, -2.9], [0.001, -2.95]]), 'dark', -2.4, -3.6, false, true);
  return P.map((p) => ({ ...p, edges: new THREE.EdgesGeometry(p.geo, p.lathe ? 30 : 50) }));
}

export const MATS = () => ({
  shell: new THREE.MeshPhysicalMaterial({ color: '#DDE2EA', metalness: 0.85, roughness: 0.26, clearcoat: 0.6, clearcoatRoughness: 0.2, side: THREE.DoubleSide, transparent: true }),
  blade: new THREE.MeshPhysicalMaterial({ color: '#A3ACBB', metalness: 1, roughness: 0.3, side: THREE.DoubleSide, transparent: true }),
  dark: new THREE.MeshPhysicalMaterial({ color: '#2B313C', metalness: 0.9, roughness: 0.22, clearcoat: 1, side: THREE.DoubleSide, transparent: true }),
  steel: new THREE.MeshPhysicalMaterial({ color: '#8B95A6', metalness: 1, roughness: 0.38, side: THREE.DoubleSide, transparent: true }),
  copper: new THREE.MeshPhysicalMaterial({ color: '#B98A62', metalness: 1, roughness: 0.34, side: THREE.DoubleSide, transparent: true }),
});

/** state: wire (0..1 visibility of CAD edges), grow (0..1 surface sweep), solid (0..1 opacity), explode (0..1), spin (radians) */
export const Turbofan: React.FC<{ wire: number; grow: number; solid: number; explode: number; spin: number; edgeColor?: string }> = ({ wire, grow, solid, explode, spin, edgeColor = '#5CE1FF' }) => {
  const parts = useMemo(buildTurbofan, []);
  const mats = useMemo(MATS, []);
  const edgeMat = useMemo(() => new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, depthWrite: false }), [edgeColor]);
  const growMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#5CE1FF', transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }), []);
  edgeMat.opacity = wire;
  Object.values(mats).forEach((m) => { m.opacity = solid; m.depthWrite = solid > 0.98; });
  return (
    <group>
      {parts.map((p) => {
        const dz = p.explode * explode;
        const rot = p.spin ? spin : 0;
        const count = p.geo.index ? p.geo.index.count : 0;
        const growCount = p.lathe ? Math.floor((count * Math.min(1, grow)) / 3) * 3 : grow > 0.5 ? count : 0;
        p.geo.setDrawRange(0, grow < 1 && solid < 0.99 ? growCount : Infinity);
        return (
          <group key={p.key} position={[0, (p.lift ?? 0) * explode, dz]} rotation={[0, 0, rot]}>
            {wire > 0.01 && <lineSegments geometry={p.edges} material={edgeMat} />}
            {grow > 0 && grow < 1 && solid < 0.99 && <mesh geometry={p.geo} material={growMat} />}
            {solid > 0.01 && <mesh geometry={p.geo} material={mats[p.mat]} />}
          </group>
        );
      })}
    </group>
  );
};

/** world-space anchor (axis point + radius) for a part's callout label */
export const PART_ANCHORS: { key: string; label: string; z: number; r: number; explode: number }[] = [
  { key: 'fan', label: 'FAN', z: 1.36, r: 1.0, explode: 1.7 },
  { key: 'comp0', label: 'COMPRESSOR', z: 0.55, r: 0.6, explode: 1.6 },
  { key: 'combustor', label: 'COMBUSTOR', z: -0.55, r: 0.52, explode: -0.9 },
  { key: 'turb0', label: 'TURBINE', z: -1.18, r: 0.53, explode: -1.85 },
  { key: 'nozzle', label: 'EXHAUST NOZZLE', z: -2.3, r: 0.6, explode: -3.0 },
];
