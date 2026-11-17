// A hardcover book in 3D: our own typographic cover (canvas texture), a spine, a page block, a front cover on a hinge
// (open: 0 closed … 1 flat open) and pages that fan as it opens. Pure in its props.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { Book } from '../config/books';

const covers = new Map<string, { front: THREE.CanvasTexture; spine: THREE.CanvasTexture }>();
function coverTex(b: Book) {
  const hit = covers.get(b.id); if (hit) return hit;
  const [base, acc] = b.cover;
  const front = document.createElement('canvas'); front.width = 640; front.height = 880;
  const g = front.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 640, 880); grd.addColorStop(0, base); grd.addColorStop(1, shade(base, -0.35));
  g.fillStyle = grd; g.fillRect(0, 0, 640, 880);
  g.fillStyle = acc; g.fillRect(44, 60, 552, 10); g.fillRect(44, 810, 552, 6);
  // a geometric motif (ours): concentric arcs
  g.strokeStyle = acc; g.globalAlpha = 0.28; g.lineWidth = 6;
  for (let r = 60; r < 420; r += 44) { g.beginPath(); g.arc(560, 760, r, Math.PI, Math.PI * 1.5); g.stroke(); }
  g.globalAlpha = 1; g.fillStyle = acc === '#ffffff' || acc === '#d8f3dc' || acc === '#e0aaff' ? '#ffffff' : acc;
  const size = b.title.some((l) => l.length > 13) ? 54 : b.title.length > 2 ? 62 : 74;
  g.font = `900 ${size}px Archivo, Inter, sans-serif`; g.textBaseline = 'top';
  b.title.forEach((l, i) => g.fillText(l, 48, 120 + i * size * 1.08));
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.font = '600 30px Inter, sans-serif'; g.fillText(b.by, 48, 740);
  g.font = '700 22px "JetBrains Mono", monospace'; g.fillStyle = acc; g.fillText(b.free, 48, 784);
  const spine = document.createElement('canvas'); spine.width = 120; spine.height = 880;
  const s = spine.getContext('2d')!; s.fillStyle = shade(base, -0.15); s.fillRect(0, 0, 120, 880);
  s.save(); s.translate(78, 840); s.rotate(-Math.PI / 2); s.fillStyle = '#fff'; s.font = '800 40px Archivo, Inter, sans-serif'; s.fillText(b.title.join(' '), 0, 0); s.restore();
  const t = { front: new THREE.CanvasTexture(front), spine: new THREE.CanvasTexture(spine) };
  t.front.colorSpace = t.spine.colorSpace = THREE.SRGBColorSpace; t.front.anisotropy = 8;
  covers.set(b.id, t); return t;
}
function shade(hex: string, k: number) { const c = new THREE.Color(hex); return k < 0 ? `#${c.multiplyScalar(1 + k).getHexString()}` : `#${c.lerp(new THREE.Color('#fff'), k).getHexString()}`; }

export const W = 3.2, H = 4.4, D = 0.62;
export const Book3D: React.FC<{ book: Book; open?: number; glow?: number } & React.JSX.IntrinsicElements['group']> = ({ book, open = 0, glow = 0, ...g }) => {
  const tex = coverTex(book);
  const mats = useMemo(() => {
    const side = new THREE.MeshStandardMaterial({ color: book.cover[0], roughness: 0.55 });
    return { side, spine: new THREE.MeshStandardMaterial({ map: tex.spine, roughness: 0.5 }), front: new THREE.MeshStandardMaterial({ map: tex.front, roughness: 0.42, metalness: 0.05 }),
      paper: new THREE.MeshStandardMaterial({ color: '#f4efe3', roughness: 0.9, emissive: '#fff4d6', emissiveIntensity: 0 }) };
  }, [book.id]);
  mats.paper.emissiveIntensity = glow * 0.9;
  const ang = -Math.PI * 0.97 * open;
  return (
    <group {...g}>
      {/* back cover + spine */}
      <mesh position={[0, 0, -D / 2 + 0.03]} material={mats.side} castShadow><boxGeometry args={[W, H, 0.06]} /></mesh>
      <mesh position={[-W / 2 - 0.0, 0, 0]} rotation-y={-Math.PI / 2} material={mats.spine} castShadow><planeGeometry args={[D, H]} /></mesh>
      {/* page block */}
      <mesh position={[0.04, 0, 0]} material={mats.paper} castShadow><boxGeometry args={[W - 0.14, H - 0.16, D - 0.1]} /></mesh>
      {/* fanning pages */}
      {open > 0.05 ? Array.from({ length: 7 }, (_, i) => (
        <group key={i} position={[-W / 2 + 0.06, 0, D / 2 - 0.06]} rotation-y={ang * (0.25 + 0.75 * ((i + 1) / 8) ** 0.7)}>
          <mesh position={[(W - 0.16) / 2, 0, 0]} material={mats.paper}><planeGeometry args={[W - 0.18, H - 0.2]} /></mesh>
        </group>
      )) : null}
      {/* front cover on its hinge */}
      <group position={[-W / 2, 0, D / 2 - 0.03]} rotation-y={ang}>
        <mesh position={[W / 2, 0, 0]} castShadow material={[mats.side, mats.side, mats.side, mats.side, mats.front, mats.side]}><boxGeometry args={[W, H, 0.06]} /></mesh>
      </group>
      {glow > 0 ? <pointLight position={[0.6, 0.2, 1.6]} intensity={22 * glow} distance={9} color="#ffe6b0" /> : null}
    </group>
  );
};
