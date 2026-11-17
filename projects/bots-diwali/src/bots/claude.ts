// The Claude bot: Claude Code's pixel creature (assets/claude bot face.png: a 12 x 8 body, two white eye slots, side arms,
// four legs, Claude orange) built as 3D voxels. Rig: body (bob), two arm groups (pivot at the body side), four legs.
// Claude Code's mark is Anthropic's; used here as the subject. Pure function of the pose.
import * as THREE from 'three';

export const CLAUDE_ORANGE = '#D97757';
export interface ClaudeRig { root: THREE.Group; body: THREE.Group; armL: THREE.Group; armR: THREE.Group; legs: THREE.Group[]; hand: THREE.Group; eyes: THREE.Mesh[] }
const U = 0.075;                                   // one voxel (m): body 12 x 8 x 6 = 0.9 x 0.6 x 0.45 m
export function buildClaude(): ClaudeRig {
  const orange = new THREE.MeshStandardMaterial({ color: CLAUDE_ORANGE, roughness: 0.85, metalness: 0, emissive: CLAUDE_ORANGE, emissiveIntensity: 0.12 });   // matte: keeps its orange under the sparklers
  const white = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffffff').multiplyScalar(1.6), toneMapped: false });
  const box = new THREE.BoxGeometry(U * 0.98, U * 0.98, U * 0.98);
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); body.position.y = 2 * U;
  const D = 6;
  const add = (parent: THREE.Object3D, x: number, y: number, z: number, m: THREE.Material) => { const o = new THREE.Mesh(box, m); o.position.set(x * U, y * U, z * U); o.castShadow = true; parent.add(o); return o; };
  // body: 12 wide (x -5.5..5.5), 8 tall (y 0.5..7.5), 6 deep; the two eye slots (1 x 2) on the front face are white
  const eyes: THREE.Mesh[] = [];
  for (let ix = 0; ix < 12; ix++) for (let iy = 0; iy < 8; iy++) for (let iz = 0; iz < D; iz++) {
    const shell = ix === 0 || ix === 11 || iy === 0 || iy === 7 || iz === 0 || iz === D - 1;
    if (!shell) continue;
    const eye = iz === D - 1 && (ix === 2 || ix === 9) && (iy === 4 || iy === 5);
    const o = add(body, ix - 5.5, iy + 0.5, iz - (D - 1) / 2, eye ? white : orange); if (eye) eyes.push(o as THREE.Mesh);
  }
  // arms: 2 x 2 bars on each side at rows 2-3, pivoting at the body side
  const arm = (sx: number) => { const g = new THREE.Group(); g.position.set(sx * 6 * U, 3 * U, 0); body.add(g);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) add(g, sx * (i + 0.5), j - 0.5, k - 0.5, orange);
    return g; };
  const armL = arm(-1), armR = arm(1);
  const hand = new THREE.Group(); hand.position.set(2.2 * U, 0, 0); armR.add(hand);
  // four legs (1 x 2) under the body at columns 1, 3, 8, 10
  const legs = [1, 3, 8, 10].map((c) => { const g = new THREE.Group(); g.position.set((c - 5.5) * U, 0, 0); body.add(g); for (let j = 0; j < 2; j++) add(g, 0, -j - 0.5, 0, orange); return g; });
  return { root, body, armL, armR, legs, hand, eyes };
}
export interface ClaudePose { x: number; z: number; rotY: number; bob: number; walkPh: number; walkK: number; armR: number; armL: number; squash: number; blink: number }
export function applyClaude(r: ClaudeRig, p: ClaudePose) {
  r.root.position.set(p.x, 0, p.z); r.root.rotation.y = p.rotY;
  r.body.position.y = 2 * U + p.bob; r.body.scale.set(1 + p.squash * 0.4, 1 - p.squash, 1 + p.squash * 0.4);
  r.armR.rotation.z = p.armR; r.armL.rotation.z = -p.armL;
  r.legs.forEach((g, i) => { const ph = p.walkPh * Math.PI * 2 + ((i === 0 || i === 3) ? 0 : Math.PI); g.position.y = Math.max(0, Math.sin(ph)) * 0.05 * p.walkK; g.rotation.x = Math.sin(ph) * 0.4 * p.walkK; });
  r.eyes.forEach((e) => { e.scale.y = Math.max(0.15, 1 - p.blink); });
}
