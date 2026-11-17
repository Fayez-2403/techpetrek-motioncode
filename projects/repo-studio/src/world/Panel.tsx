// A repo screen as a physical panel in the 3D world: the real screenshot (public/repos/<slug>.png, captured from the
// public GitHub page) on a thin slab with a lit edge. Magnifier: a lens disc that samples the SAME texture around a
// point, zoomed, so what the bot magnifies is the real page.
import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { continueRender, delayRender, staticFile } from 'remotion';

const cache = new Map<string, THREE.Texture>();
const loader = new THREE.TextureLoader();
function load(file: string): Promise<THREE.Texture> {
  return new Promise((res) => {
    const hit = cache.get(file); if (hit) return res(hit);
    loader.load(staticFile(file), (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; cache.set(file, t); res(t); }, undefined, () => res(new THREE.Texture()));
  });
}
/** call OUTSIDE the canvas: holds the render (delayRender) until every texture is decoded, then returns true */
export function usePreload(files: string[]): boolean {
  const [ready, setReady] = useState(() => files.every((f) => cache.has(f)));
  useEffect(() => {
    if (ready) return;
    const h = delayRender('textures');
    Promise.all(files.map(load)).then(() => { setReady(true); continueRender(h); });
  }, []);
  return ready;
}
export const ALL_TEXTURES = (slugs: string[]) => slugs.flatMap((s) => [`repos/${s}.png`, `repos/${s}_top.png`]);
/** inside the canvas: the preloaded texture (synchronous) */
export function useTex(file: string) {
  const t = cache.get(file);
  if (!t) throw new Error(`texture not preloaded: ${file}`);
  return t;
}

export const PANEL_ASPECT = 2400 / 1920;   // height / width of the captured pages

export const Panel: React.FC<{ slug: string; width?: number; top?: boolean; edge?: string; glow?: number } & React.JSX.IntrinsicElements['group']> = ({ slug, width = 8, top = false, edge = '#63E5FA', glow = 0.6, ...g }) => {
  const tex = useTex(`repos/${slug}${top ? '_top' : ''}.png`);
  const h = width * (top ? 720 / 1280 : PANEL_ASPECT);
  return (
    <group {...g}>
      <mesh position={[0, 0, -0.09]} castShadow receiveShadow><boxGeometry args={[width + 0.18, h + 0.18, 0.16]} /><meshStandardMaterial color="#0d1117" roughness={0.4} metalness={0.6} emissive={edge} emissiveIntensity={glow * 0.25} /></mesh>
      <mesh><planeGeometry args={[width, h]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
    </group>
  );
};

/** lens disc showing the panel texture around uv (u, v) at `zoom` ×, with a rim */
export const Lens: React.FC<{ slug: string; uv: [number, number]; zoom: number; radius: number; aspect?: number } & React.JSX.IntrinsicElements['group']> = ({ slug, uv, zoom, radius, aspect = PANEL_ASPECT, ...g }) => {
  const tex = useTex(`repos/${slug}.png`);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, c: { value: new THREE.Vector2() }, r: { value: 0.05 }, asp: { value: aspect } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `uniform sampler2D map; uniform vec2 c; uniform float r; uniform float asp; varying vec2 vUv;
      void main(){ vec2 d = vUv - .5; float rr = length(d) * 2.;
        vec2 uv = c + vec2(d.x, d.y / asp) * 2. * r * (1. + .18 * rr * rr);   // slight barrel, like real glass
        vec3 col = texture2D(map, uv).rgb;
        col *= 1. - .35 * smoothstep(.75, 1., rr); col += .08 * smoothstep(.2, .0, length(d - vec2(-.18, .2)));
        gl_FragColor = vec4(col, 1.);
        #include <colorspace_fragment>
      }`,
  }), [tex, aspect]);
  mat.uniforms.c.value.set(uv[0], uv[1]); mat.uniforms.r.value = 0.5 / zoom;
  return (
    <group {...g}>
      <mesh material={mat}><circleGeometry args={[radius, 64]} /></mesh>
      <mesh><torusGeometry args={[radius, radius * 0.08, 16, 64]} /><meshStandardMaterial color="#caa45a" metalness={0.9} roughness={0.28} /></mesh>
      <mesh position={[radius * 0.82, -radius * 1.35, 0]} rotation-z={0.6}><cylinderGeometry args={[radius * 0.07, radius * 0.09, radius * 1.4, 12]} /><meshStandardMaterial color="#3b2a1d" roughness={0.6} /></mesh>
    </group>
  );
};
