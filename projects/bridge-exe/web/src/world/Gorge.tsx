// ENVIRONMENT A: the cliffside gorge. A heightfield with stepped rock strata, a river far below, drifting mist,
// instanced pines and rocks, approach roads and abutments. All placement is seeded; mist drifts on vclock.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { axisSamples, canyonCenter, heightAt, PLATEAU_Y, RIM, RIVER_Y } from './terrain';
import { fbm, mulberry32 } from './noise';
import { vclock } from './clock';
import { useStore } from '../store';

function useTerrain() {
  return useMemo(() => {
    const xs = axisSamples(46, 0.7, 1300, 1.06), zs = axisSamples(90, 1.1, 1300, 1.05);
    const nx = xs.length, nz = zs.length;
    const pos = new Float32Array(nx * nz * 3), col = new Float32Array(nx * nz * 3);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const k = (j * nx + i) * 3; pos[k] = xs[i]; pos[k + 1] = heightAt(xs[i], zs[j]); pos[k + 2] = zs[j];
    }
    const idx: number[] = [];
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    const nrm = g.getAttribute('normal') as THREE.BufferAttribute;
    const rockA = new THREE.Color('#9a8470'), rockB = new THREE.Color('#5f5650'), rockC = new THREE.Color('#b59a7c');
    const grass = new THREE.Color('#5b7040'), dry = new THREE.Color('#8f8a52'), bed = new THREE.Color('#3a3934'), snow = new THREE.Color('#d9dde2');
    const c = new THREE.Color();
    for (let v = 0; v < nx * nz; v++) {
      const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2], ny = nrm.getY(v);
      const strata = 0.5 + 0.5 * Math.sin(y * 0.9 + fbm(x * 0.05, z * 0.05, 2) * 2.5);
      c.copy(rockA).lerp(rockB, strata * 0.7).lerp(rockC, Math.max(0, fbm(x * 0.08, z * 0.08, 3)) * 0.8);
      if (y < RIVER_Y + 3) c.lerp(bed, 0.6);
      const flat = THREE.MathUtils.smoothstep(ny, 0.78, 0.93);
      if (y > RIVER_Y + 8) c.lerp(new THREE.Color().copy(grass).lerp(dry, 0.5 + 0.5 * fbm(x * 0.02, z * 0.02, 3)), flat);
      if (y > 120) c.lerp(snow, THREE.MathUtils.smoothstep(y + 20 * fbm(x * 0.01, z * 0.01), 120, 175) * (0.4 + 0.6 * flat));
      const ao = 0.82 + 0.18 * (0.5 + 0.5 * fbm(x * 0.3, z * 0.3, 2));
      col[v * 3] = c.r * ao; col[v * 3 + 1] = c.g * ao; col[v * 3 + 2] = c.b * ao;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, []);
}

/** vertex colours + procedural detail: noise breakup, rock strata and grass speckle in world space (no textures) */
function makeTerrainMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
varying vec3 vW; varying vec3 vN;`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
vW = (modelMatrix * vec4(transformed, 1.0)).xyz; vN = normalize(mat3(modelMatrix) * objectNormal);`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vW; varying vec3 vN;
      float h3(vec3 p){ p = fract(p * 0.3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.-2.*f);
        return mix(mix(mix(h3(i), h3(i+vec3(1,0,0)), f.x), mix(h3(i+vec3(0,1,0)), h3(i+vec3(1,1,0)), f.x), f.y),
                   mix(mix(h3(i+vec3(0,0,1)), h3(i+vec3(1,0,1)), f.x), mix(h3(i+vec3(0,1,1)), h3(i+vec3(1,1,1)), f.x), f.y), f.z); }
      float fb(vec3 p){ return .5*n3(p) + .25*n3(p*2.03) + .125*n3(p*4.1) + .0625*n3(p*8.3); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      float flt = smoothstep(.72, .92, vN.y);
      float big = fb(vW * .05), fine = fb(vW * .9), strata = .5 + .5 * sin(vW.y * 2.2 + big * 6.);
      vec3 rock = diffuseColor.rgb * (.78 + .38 * big) * (.88 + .2 * strata) * (.86 + .26 * fine);
      vec3 grass = diffuseColor.rgb * (.8 + .35 * fb(vW * .35)) * (.9 + .2 * fine);
      diffuseColor.rgb = mix(rock, grass, flt);
      diffuseColor.rgb *= mix(.82, 1.0, smoothstep(-64., -30., vW.y));`);
  };
  return m;
}

function mistTexture() {
  const s = 128, cv = document.createElement('canvas'); cv.width = cv.height = s;
  const ctx = cv.getContext('2d')!, img = ctx.createImageData(s, s);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const dx = (x - s / 2) / (s / 2), dy = (y - s / 2) / (s / 2), r = Math.hypot(dx, dy);
    const a = Math.max(0, 1 - r) ** 1.6 * (0.55 + 0.45 * (0.5 + 0.5 * fbm(x * 0.06, y * 0.06, 4, 9)));
    const k = (y * s + x) * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = 255; img.data[k + 3] = a * 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function Mist({ count }: { count: number }) {
  const group = useRef<THREE.Group>(null!);
  const night = useStore((s) => s.night);
  const items = useMemo(() => {
    const r = mulberry32(77);
    return Array.from({ length: count }, () => ({ z: (r() - 0.5) * 520, y: RIVER_Y + 8 + r() * 46, s: 50 + r() * 70, ph: r() * 6.28, sp: 0.6 + r() * 1.2, o: 0.18 + r() * 0.22 }));
  }, [count]);
  const tex = useMemo(mistTexture, []);
  useFrame(() => {
    group.current.children.forEach((sp, i) => {
      const it = items[i], z = it.z + ((vclock.t * it.sp * 3 + 260) % 520) - 260;
      sp.position.set(canyonCenter(z) + Math.sin(vclock.t * 0.05 + it.ph) * 5, it.y + Math.sin(vclock.t * 0.1 + it.ph) * 1.5, z);
    });
  });
  return (
    <group ref={group}>
      {items.map((it, i) => (
        <sprite key={i} scale={[it.s * 1.6, it.s * 0.55, 1]}>
          <spriteMaterial map={tex} color={night ? '#7d93b5' : '#f3e6d6'} transparent opacity={it.o} depthWrite={false} fog />
        </sprite>
      ))}
    </group>
  );
}

function Props({ trees, rocks }: { trees: number; rocks: number }) {
  const { treeM, rockM } = useMemo(() => {
    const r = mulberry32(2026), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    const treeM: THREE.Matrix4[] = [], rockM: THREE.Matrix4[] = [];
    let guard = 0;
    while (treeM.length < trees && guard++ < trees * 20) {
      const x = (r() - 0.5) * 520, z = (r() - 0.5) * 520, d = Math.abs(x - canyonCenter(z));
      if (d < RIM + 5 || (Math.abs(z) < 14 && Math.abs(x) < 230)) continue;
      const y = heightAt(x, z), dy = heightAt(x + 1, z) - y;
      if (Math.abs(dy) > 0.6 || y > 90) continue;
      const s = 0.8 + r() * 0.9;
      treeM.push(m.clone().compose(new THREE.Vector3(x, y, z), q.setFromEuler(e.set(0, r() * 6, 0)), new THREE.Vector3(s, s * (0.9 + r() * 0.5), s)));
    }
    guard = 0;
    while (rockM.length < rocks && guard++ < rocks * 20) {
      const z = (r() - 0.5) * 420, side = r() < 0.5 ? -1 : 1, onFloor = r() < 0.35;
      const x = canyonCenter(z) + side * (onFloor ? 3 + r() * 6 : RIM + 1 + r() * 60);
      if (Math.abs(z) < 10 && Math.abs(x) < 120 && !onFloor) continue;
      const s = onFloor ? 1 + r() * 3 : 0.4 + r() * 1.6;
      rockM.push(m.clone().compose(new THREE.Vector3(x, heightAt(x, z) + s * 0.2, z), q.setFromEuler(e.set(r() * 3, r() * 3, r() * 3)), new THREE.Vector3(s, s * 0.7, s * 1.1)));
    }
    return { treeM, rockM };
  }, [trees, rocks]);
  const set = (mesh: THREE.InstancedMesh | null, ms: THREE.Matrix4[]) => { if (!mesh) return; ms.forEach((x, i) => mesh.setMatrixAt(i, x)); mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); };
  return (
    <>
      <instancedMesh ref={(m) => set(m, treeM)} args={[undefined, undefined, treeM.length]} castShadow receiveShadow>
        <coneGeometry args={[1.6, 7, 7]} /><meshStandardMaterial color="#2a4630" roughness={0.9} flatShading />
      </instancedMesh>
      <instancedMesh ref={(m) => set(m, treeM.map((x) => x.clone().multiply(new THREE.Matrix4().makeTranslation(0, -3.6, 0)).multiply(new THREE.Matrix4().makeScale(0.18, 0.4, 0.18))))} args={[undefined, undefined, treeM.length]}>
        <cylinderGeometry args={[1, 1, 3, 5]} /><meshStandardMaterial color="#4a3a2c" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={(m) => set(m, rockM)} args={[undefined, undefined, rockM.length]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#7d7064" roughness={0.95} flatShading />
      </instancedMesh>
    </>
  );
}

function Water() {
  const ref = useRef<THREE.MeshStandardMaterial>(null!);
  const night = useStore((s) => s.night);
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={RIVER_Y} receiveShadow>
      <planeGeometry args={[2600, 2600]} />
      <meshStandardMaterial ref={ref} color={night ? '#0a2230' : '#1e4d58'} roughness={0.12} metalness={0.15} envMapIntensity={0.6} />
    </mesh>
  );
}

/** approach roads and concrete abutments at both ends, sized by the current span */
export function Abutments({ span }: { span: number }) {
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * (span / 2 + 2.2), -3.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[6.8, 5.3, 12.4]} /><meshStandardMaterial color="#9c9a94" roughness={0.85} />
          </mesh>
          <mesh position={[s * (span / 2 + 3.5), -0.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[4.2, 1.0, 12.4]} /><meshStandardMaterial color="#a3a19a" roughness={0.85} />
          </mesh>
          <mesh position={[s * (span / 2 + 5.6 + 75), PLATEAU_Y / 2 + 0.05, 0]} receiveShadow>
            <boxGeometry args={[150, -PLATEAU_Y + 0.5, 10.6]} /><meshStandardMaterial color="#8c8a84" roughness={0.9} />
          </mesh>
          <mesh position={[s * (span / 2 + 5.6 + 75), 0.32, 0]} receiveShadow>
            <boxGeometry args={[150, 0.06, 8.2]} /><meshStandardMaterial color="#2b2e33" roughness={0.75} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Gorge() {
  const q = useStore((s) => s.quality), terrain = useTerrain(), terrainMat = useMemo(makeTerrainMaterial, []);
  return (
    <group>
      <mesh geometry={terrain} receiveShadow castShadow material={terrainMat} />
      <Water />
      <Props trees={q === 'low' ? 250 : 900} rocks={q === 'low' ? 120 : 420} />
      {q !== 'low' ? <Mist count={q === 'high' ? 34 : 18} /> : null}
    </group>
  );
}
