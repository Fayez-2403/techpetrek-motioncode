// Sky dome: a gradient with a low golden sun (day) or a cold moonlit night, plus the matching fog colour.
import { useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '../store';

export const SUN_DIR = new THREE.Vector3(-0.62, 0.2, -0.76).normalize();
export const SKY = {
  day: { zenith: '#1f4f86', horizon: '#f0c79d', ground: '#4d5d6b', sun: '#ffd9a0', fog: '#b9c3cc' },
  night: { zenith: '#050b18', horizon: '#1d3554', ground: '#0a1424', sun: '#cfe4ff', fog: '#14243a' },
};

export function Sky() {
  const night = useStore((s) => s.night), k = night ? SKY.night : SKY.day;
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { zen: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, gnd: { value: new THREE.Color() }, sunC: { value: new THREE.Color() }, sunD: { value: SUN_DIR }, glow: { value: 1 } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `uniform vec3 zen, hor, gnd, sunC, sunD; uniform float glow; varying vec3 vDir;
      void main(){ float h = vDir.y; vec3 c = mix(hor, zen, pow(clamp(h,0.,1.), 0.55));
        c = mix(c, gnd, smoothstep(0.0, -0.25, h));
        float sd = max(dot(normalize(vDir), sunD), 0.);
        c += sunC * (pow(sd, 900.) * 6. + pow(sd, 18.) * 0.35 * glow + pow(sd, 3.) * 0.12 * glow);
        gl_FragColor = vec4(c, 1.); }`,
  }), []);
  mat.uniforms.zen.value.set(k.zenith); mat.uniforms.hor.value.set(k.horizon); mat.uniforms.gnd.value.set(k.ground); mat.uniforms.sunC.value.set(k.sun);
  mat.uniforms.sunD.value = night ? new THREE.Vector3(0.4, 0.45, -0.8).normalize() : SUN_DIR;
  mat.uniforms.glow.value = night ? 0.25 : 1;
  return (
    <>
      <mesh material={mat} renderOrder={-10}><sphereGeometry args={[2400, 32, 16]} /></mesh>
      <fogExp2 attach="fog" args={[k.fog, night ? 0.0014 : 0.0009]} />
      <color attach="background" args={[k.horizon]} />
    </>
  );
}
