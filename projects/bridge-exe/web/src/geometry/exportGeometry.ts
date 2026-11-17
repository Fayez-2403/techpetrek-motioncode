// GLB export of the live bridge (visual geometry only, not a certified CAD model). Node and member IDs are kept in
// the scene's userData so a viewer can map pieces back to the solver records.
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { useStore } from '../store';
import { HALF_W } from '../world/viz';
import { chs } from '../engineering/educationalChecks';
import { download } from '../ui/kit';

export function bridgeGroup() {
  const s = useStore.getState(), m = s.model, span = Math.max(...m.nodes.map((n) => n.x));
  const g = new THREE.Group(); g.name = 'BRIDGE.EXE truss (visual geometry)';
  g.userData = { note: 'Visual geometry only; not a certified CAD model', inputsHash: s.modelHash, units: 'm' };
  const mat = new THREE.MeshStandardMaterial({ color: '#6d7b89', metalness: 0.7, roughness: 0.4 });
  const pos = new Map(m.nodes.map((n) => [n.id, new THREE.Vector2(n.x - span / 2, n.y)]));
  for (const e of m.members) for (const z of [HALF_W, -HALF_W]) {
    const a = pos.get(e.a)!, b = pos.get(e.b)!, len = a.distanceTo(b);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(chs(e.A).D / 2, chs(e.A).D / 2, len, 12), mat);
    mesh.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, z);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(b.x - a.x, b.y - a.y, 0).normalize());
    mesh.name = `${e.id}_${z > 0 ? 'front' : 'back'}`; mesh.userData = { memberId: e.id, a: e.a, b: e.b, group: e.group, A_m2: e.A };
    g.add(mesh);
  }
  return g;
}

export function exportGLB() {
  new GLTFExporter().parse(bridgeGroup(), (res) => download('bridge-exe_truss.glb', new Blob([res as ArrayBuffer], { type: 'model/gltf-binary' })), (e) => console.error(e), { binary: true });
}
