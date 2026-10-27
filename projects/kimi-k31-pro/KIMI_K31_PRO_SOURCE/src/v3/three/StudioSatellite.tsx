// "Atlas One": an original, fictional pocket observatory satellite for the V3 scroll-animation shot (v3studio).
// A gold-foil core with an optics barrel and sunshade on top, a power module and thruster below, two accordion
// solar wings (three hinged panels each) and a dish on a boom. States, all 0..1: unfold (wings + dish), explode
// (layers separate along Y, shell plates and wings slide out) and light (the lens wakes up). Built once; props drive it.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mulberry32 } from '../../lib/rng';
import { latheX, makeGlow } from './StudioRacer';

const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const WING = { n: 3, w: 0.7, h: 1.0, t: 0.03 };
const BUS = { w: 1.0, h: 1.2, d: 1.0 };

const tex = (w: number, h: number, draw: (x: CanvasRenderingContext2D) => void, srgb = true) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
};
/** crinkled gold multi-layer insulation */
const foilTex = () => tex(512, 512, (x) => {
  const r = mulberry32(77);
  x.fillStyle = '#C8932E'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) {
    const cx = r() * 512, cy = r() * 512, s = 10 + r() * 46, l = 0.55 + r() * 0.7;
    x.fillStyle = `rgb(${Math.min(255, 214 * l)},${Math.min(255, 160 * l)},${Math.min(255, 62 * l)})`;
    x.beginPath(); x.moveTo(cx, cy);
    for (let k = 0; k < 3; k++) x.lineTo(cx + (r() - 0.5) * s, cy + (r() - 0.5) * s);
    x.closePath(); x.fill();
  }
});
/** solar cells: deep blue tiles with silver bus lines */
const cellTex = () => tex(512, 640, (x) => {
  x.fillStyle = '#C9CED8'; x.fillRect(0, 0, 512, 640);
  const nx = 6, ny = 8, gw = 512 / nx, gh = 640 / ny, r = mulberry32(5);
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const g = x.createLinearGradient(i * gw, j * gh, (i + 1) * gw, (j + 1) * gh);
    const k = 0.85 + 0.3 * r();
    g.addColorStop(0, `rgb(${22 * k},${38 * k},${92 * k})`); g.addColorStop(1, `rgb(${12 * k},${20 * k},${58 * k})`);
    x.fillStyle = g; x.fillRect(i * gw + 3, j * gh + 3, gw - 6, gh - 6);
    x.strokeStyle = 'rgba(190,200,220,0.35)'; x.lineWidth = 1;
    for (let l = 1; l < 4; l++) { x.beginPath(); x.moveTo(i * gw + 3, j * gh + (l * gh) / 4); x.lineTo((i + 1) * gw - 3, j * gh + (l * gh) / 4); x.stroke(); }
  }
});

function build() {
  const bus = new RoundedBoxGeometry(BUS.w, BUS.h, BUS.d, 4, 0.06);
  const plate = new RoundedBoxGeometry(0.58, 0.74, 0.04, 2, 0.015);
  const barrel = latheX([[0.0, 0.0], [0.0, 0.34], [0.05, 0.36], [0.4, 0.36], [0.42, 0.33], [0.45, 0.33], [0.47, 0.36], [0.55, 0.36], [0.56, 0.0]], 64).geo.rotateZ(Math.PI / 2);
  const rings = [0.12, 0.3].map((y) => new THREE.TorusGeometry(0.365, 0.012, 8, 64).rotateX(Math.PI / 2).translate(0, y, 0));
  const shade = new THREE.CylinderGeometry(0.4, 0.4, 0.52, 64, 1, true);
  const shadeIn = new THREE.CylinderGeometry(0.385, 0.385, 0.52, 64, 1, true);
  const lens = new THREE.CircleGeometry(0.3, 64).rotateX(-Math.PI / 2);
  const power = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 6, 1).rotateY(Math.PI / 6);
  const stripe = new THREE.CylinderGeometry(0.505, 0.505, 0.05, 6, 1, true).rotateY(Math.PI / 6);
  const bell = latheX([[0.0, 0.1], [0.06, 0.14], [0.2, 0.2], [0.34, 0.27], [0.36, 0.28], [0.36, 0.25]], 48).geo.rotateZ(-Math.PI / 2);
  const panel = new THREE.BoxGeometry(WING.w, WING.h, WING.t).translate(WING.w / 2, 0, 0);
  const frame = new THREE.EdgesGeometry(panel);
  const arm = new THREE.CylinderGeometry(0.035, 0.035, 1, 16).rotateZ(Math.PI / 2).translate(0.5, 0, 0);
  const dish = latheX(Array.from({ length: 13 }, (_, i) => { const r = (i / 12) * 0.46; return [0.5 * r * r, r] as [number, number]; }), 64).geo.rotateZ(Math.PI / 2);
  const feed = new THREE.CylinderGeometry(0.012, 0.012, 0.34, 8).translate(0, 0.17, 0);
  const boom = new THREE.CylinderGeometry(0.028, 0.028, 0.7, 12).translate(0, -0.35, 0);
  const tracker = new THREE.CylinderGeometry(0.07, 0.08, 0.16, 24);
  return { bus, plate, barrel, rings, shade, shadeIn, lens, power, stripe, bell, panel, frame, arm, dish, feed, boom, tracker };
}

export function useSatelliteAssets() {
  return useMemo(() => {
    const G = build(), foil = foilTex(), cells = cellTex(), glow = makeGlow();
    const white = new THREE.MeshPhysicalMaterial({ color: '#EEF0F3', roughness: 0.42, metalness: 0.05, clearcoat: 0.4 });
    return {
      G, glow,
      foil: new THREE.MeshPhysicalMaterial({ map: foil, bumpMap: foil, bumpScale: 2.2, metalness: 1, roughness: 0.32, envMapIntensity: 1.3 }),
      white, black: new THREE.MeshStandardMaterial({ color: '#0C0D10', roughness: 0.6, side: THREE.DoubleSide }),
      graphite: new THREE.MeshPhysicalMaterial({ color: '#2A2C33', metalness: 0.85, roughness: 0.3, clearcoat: 0.6 }),
      steel: new THREE.MeshPhysicalMaterial({ color: '#B9BEC8', metalness: 1, roughness: 0.22 }),
      amber: new THREE.MeshBasicMaterial({ color: '#FF9A4D', toneMapped: false }),
      cells: [white, white, white, white,
        new THREE.MeshPhysicalMaterial({ map: cells, metalness: 0.55, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.4 }), white],
      frameMat: new THREE.LineBasicMaterial({ color: '#D9DDE4', transparent: true, opacity: 0.8 }),
      lens: new THREE.MeshPhysicalMaterial({ color: '#0A0F1A', metalness: 0.4, roughness: 0.02, clearcoat: 1, emissive: new THREE.Color('#FF9A4D'), emissiveIntensity: 0 }),
      sprite: new THREE.SpriteMaterial({ map: glow, color: '#FFB070', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, depthTest: false, toneMapped: false }),
    };
  }, []);
}
export type SatelliteAssets = ReturnType<typeof useSatelliteAssets>;

/** world-space anchor (at explode e) for the callouts */
export const SAT_ANCHORS = (e: number) => ({
  optics: [0, 0.6 + 0.3 + 0.5 * e, 0.36] as [number, number, number],
  core: [0, 0, BUS.d / 2 + 0.05 + 0.4 * e] as [number, number, number],
  power: [0, -0.75 - 0.5 * e, 0.45] as [number, number, number],
  wings: [-(0.5 + 0.2 + 0.45 * e + WING.n * WING.w * 0.55), 0.2, 0] as [number, number, number],
});

const Wing: React.FC<{ A: SatelliteAssets; u: number; e: number }> = ({ A, u, e }) => {
  const u0 = sm(0, 0.55, u), u1 = sm(0.2, 0.8, u), u2 = sm(0.42, 1, u);
  const gap = 0.045 * (1 - u) + 0.004;
  const arm = 0.04 + 0.18 * sm(0, 0.4, u);
  const P = () => (
    <>
      <mesh geometry={A.G.panel} material={A.cells} />
      <lineSegments geometry={A.G.frame} material={A.frameMat} />
    </>
  );
  return (
    <group position={[BUS.w / 2 + 0.45 * e, 0, 0]}>
      <mesh geometry={A.G.arm} material={A.steel} scale={[arm, 1, 1]} position={[-0.5 * arm + arm / 2, 0, 0]} />
      <group position={[arm, 0, 0.47 * (1 - u0)]} rotation={[0, (Math.PI / 2) * (1 - u0), 0]}>
        <P />
        <group position={[WING.w, 0, gap]} rotation={[0, -Math.PI * (1 - u1), 0]}>
          <P />
          <group position={[WING.w, 0, -gap]} rotation={[0, Math.PI * (1 - u2), 0]}><P /></group>
        </group>
      </group>
    </group>
  );
};

export const Satellite: React.FC<{ A: SatelliteAssets; unfold: number; explode: number; light: number; pulse: number }> = ({ A, unfold, explode: e, light, pulse }) => {
  const G = A.G, dishU = sm(0.45, 1, unfold);
  A.lens.emissiveIntensity = 2.2 * light * (0.85 + 0.3 * pulse);
  A.sprite.opacity = light * (0.75 + 0.25 * pulse);
  return (
    <group>
      {/* core + shell plates */}
      <mesh geometry={G.bus} material={A.foil} />
      {[1, -1].map((s) => (
        <mesh key={s} geometry={G.plate} material={A.white} position={[0, 0, s * (BUS.d / 2 + 0.03 + 0.4 * e)]} />
      ))}
      <mesh geometry={G.tracker} material={A.graphite} position={[0.3, 0.64 + 0.2 * e, -0.3]} />
      {/* optics + sunshade */}
      <group position={[0, BUS.h / 2 + 0.5 * e, 0]}>
        <mesh geometry={G.barrel} material={A.white} />
        {G.rings.map((g, i) => <mesh key={i} geometry={g} material={A.graphite} />)}
        <group position={[0, 0.56 + 0.26 + 0.35 * e, 0]}>
          <mesh geometry={G.shade} material={A.white} />
          <mesh geometry={G.shadeIn} material={A.black} />
        </group>
        <mesh geometry={G.lens} material={A.lens} position={[0, 0.565, 0]} />
        <sprite material={A.sprite} position={[0, 1.12 + 0.35 * e, 0]} scale={[2.2 * light + 0.01, 2.2 * light + 0.01, 1]} renderOrder={10} />
      </group>
      {/* power module + thruster */}
      <group position={[0, -BUS.h / 2 - 0.15 - 0.5 * e, 0]}>
        <mesh geometry={G.power} material={A.graphite} />
        <mesh geometry={G.stripe} material={A.amber} />
        <mesh geometry={G.bell} material={A.steel} position={[0, -0.15 - 0.25 * e, 0]} />
      </group>
      {/* wings */}
      <Wing A={A} u={unfold} e={e} />
      <group scale={[-1, 1, 1]}><Wing A={A} u={unfold} e={e} /></group>
      {/* dish on a boom from the back face */}
      <group position={[0, 0.3, -BUS.d / 2 - 0.06 - 0.5 * e]} rotation={[dishU * (Math.PI / 2 + 0.6), 0, 0]}>
        <mesh geometry={G.boom} material={A.steel} />
        <group position={[0, -0.7, 0]} rotation={[Math.PI, 0, 0]}>
          <mesh geometry={G.dish} material={A.white} />
          <mesh geometry={G.feed} material={A.steel} />
        </group>
      </group>
    </group>
  );
};
