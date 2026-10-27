// Post-processing: HDR scene -> selective bloom (only what is brighter than the threshold: energy, sparks, glow)
// -> grade (chromatic aberration at the edges, the Cosmic ripple, flash, saturation, vignette, a fine grain)
// -> tone mapping (ACES) and sRGB output.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uVig: { value: 0.55 }, uAberr: { value: 0.006 }, uGrain: { value: 0.035 }, uAspect: { value: 1 },
    uSat: { value: 1.08 }, uRipple: { value: new THREE.Vector4(0.5, 0.5, 0, 0) }, uFlash: { value: new THREE.Color(0, 0, 0) },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime, uVig, uAberr, uGrain, uAspect, uSat; uniform vec4 uRipple; uniform vec3 uFlash; varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      if (uRipple.w > 0.0) {
        vec2 d = uv - uRipple.xy; d.x *= uAspect;
        float r = length(d), q = (r - uRipple.z) / 0.035, k = exp(-q * q) * uRipple.w;
        uv -= (d / max(r, 1e-4)) * k * vec2(1.0 / uAspect, 1.0) * 0.035;
      }
      vec2 c = uv - 0.5; float e = dot(c, c);
      vec3 col = vec3(texture2D(tDiffuse, uv - c * uAberr * e * 1.2).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv + c * uAberr * e * 1.2).b);
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722)); col = mix(vec3(l), col, uSat);
      col += uFlash;
      vec2 vc = c * (uAspect > 1.0 ? vec2(1.0, 1.0 / uAspect * 1.4) : vec2(1.25, 0.9));
      col *= mix(1.0, (1.0 - smoothstep(0.2, 0.95, length(vc))), uVig);
      float g = fract(sin(dot(vUv * 1000.0 + fract(uTime * 7.31), vec2(12.9898, 78.233))) * 43758.5453);
      col *= 1.0 + (g - 0.5) * uGrain;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

/** RenderPass into its own multisampled target, then one copy of the resolved image into the composer's buffer. */
class MsaaRenderPass extends RenderPass {
  private ms: THREE.WebGLRenderTarget | null;
  private quad = new FullScreenQuad(new THREE.ShaderMaterial({ ...CopyShader, uniforms: THREE.UniformsUtils.clone(CopyShader.uniforms), blending: THREE.NoBlending, depthTest: false, depthWrite: false }));
  constructor(scene: THREE.Scene, camera: THREE.Camera, samples: number) {
    super(scene, camera);
    this.ms = samples > 0 ? new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples }) : null;
  }
  setSize(w: number, h: number) { this.ms?.setSize(w, h); }
  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget, dt = 0, mask = false) {
    if (!this.ms || this.renderToScreen) { super.render(renderer, writeBuffer, readBuffer, dt, mask); return; }
    super.render(renderer, writeBuffer, this.ms, dt, mask);
    (this.quad.material as THREE.ShaderMaterial).uniforms.tDiffuse!.value = this.ms.texture;
    renderer.setRenderTarget(readBuffer); this.quad.render(renderer);
  }
}

export class Pipeline {
  composer: EffectComposer; render: MsaaRenderPass; bloom: UnrealBloomPass; grade: ShaderPass; output: OutputPass;
  constructor(public renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, w: number, h: number, msaa: number, bloomDiv = 2) {
    // only the scene render is multisampled; the composer's ping-pong buffers are plain (an MSAA chain made every
    // full-screen pass write and resolve multisampled half-float buffers: about a third of the frame on an iGPU)
    const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType });
    this.composer = new EffectComposer(renderer, rt);
    this.render = new MsaaRenderPass(scene, camera, msaa);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w / 2, h / 2), 0.5, 0.55, 1.35);
    // the pass halves whatever size it is given; low and medium run its blur chain at a quarter of the frame instead
    const bloomSize = this.bloom.setSize.bind(this.bloom);
    this.bloom.setSize = (bw: number, bh: number) => bloomSize(Math.round(bw * 2 / bloomDiv), Math.round(bh * 2 / bloomDiv));
    this.grade = new ShaderPass(GradeShader);
    this.output = new OutputPass();
    for (const p of [this.render, this.bloom, this.grade, this.output]) this.composer.addPass(p);
    this.setSize(w, h);
  }
  setSize(w: number, h: number) {
    // follow the renderer's pixel ratio (the adaptive resolution changes it at run time)
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(w, h);
    this.grade.uniforms.uAspect!.value = w / h;
  }
  draw() { this.composer.render(); }
}
