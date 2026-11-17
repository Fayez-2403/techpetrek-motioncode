// ENGINE.EXE stage: a pale studio (screen-space gradient, four soft boxes for the metal to catch), a soft shadow on an
// invisible floor, GTAO kept off the floor and off see-through states. frame(state, cam, ops) poses the engine for one
// engine state and draws a frame. Adapted from the teardown kit's V8 stage.
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {Pass} from 'three/addons/postprocessing/Pass.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {buildEngine} from './engine.js';

const V3 = THREE.Vector3;
export const BG = {top: '#f4f4f2', mid: '#ebebe8', low: '#e2e2de'};
// the engine's box in metres (assembled), used to keep the camera outside it
export const BOX = new THREE.Box3(new V3(-0.13, -0.075, -0.082), new V3(0.13, 0.325, 0.062));

export function createStage({canvas}) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.localClippingEnabled = true;
  const scene = new THREE.Scene();
  {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 512;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, BG.top);
    gr.addColorStop(0.55, BG.mid);
    gr.addColorStop(1, BG.low);
    g.fillStyle = gr;
    g.fillRect(0, 0, 4, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    scene.background = tex;
  }
  const camera = new THREE.PerspectiveCamera(26, 16 / 9, 0.02, 30);
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, {type: THREE.HalfFloatType, samples: 8}));
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, 4, 4);
  gtao.output = GTAOPass.OUTPUT.Default;
  gtao.blendIntensity = 0.7;
  gtao.updateGtaoMaterial({radius: 0.025, distanceExponent: 1.4, thickness: 0.4, scale: 1.0, samples: 16, distanceFallOff: 1.0, screenSpaceRadius: false});
  gtao.updatePdMaterial({lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16});
  class Toggle extends Pass {
    constructor(fn) {
      super();
      this.needsSwap = false;
      this.fn = fn;
    }
    render() {
      this.fn();
    }
  }
  const eng = buildEngine();
  // the shadow catcher and the gas/fire effects stay out of the AO pass
  const fxHidden = [];
  const aoSkip = (on) => {
    shade.visible = on;
    for (const o of fxHidden) o.visible = on && o.userData.wasVisible;
  };
  composer.addPass(
    new Toggle(() => {
      fxHidden.length = 0;
      eng.root.traverse((o) => {
        if (o.isMesh && !o.userData.part && o.material && o.material.transparent) {
          o.userData.wasVisible = o.visible;
          fxHidden.push(o);
        }
      });
      aoSkip(false);
    }),
  );
  composer.addPass(gtao);
  composer.addPass(new Toggle(() => aoSkip(true)));
  composer.addPass(new OutputPass());
  // the GTAO normal pass must see the same cut as the scene, or the cut half returns as a pale ghost
  gtao.normalMaterial.clippingPlanes = [eng.CLIP];

  {
    const env = new THREE.Scene();
    env.background = new THREE.Color('#d9d9d6');
    const box = (w, h, pos, k) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: new THREE.Color(1, 1, 1).multiplyScalar(k), side: THREE.DoubleSide}));
      m.position.copy(pos);
      m.lookAt(0, 0, 0);
      env.add(m);
    };
    box(12, 12, new V3(0, 14, 2), 2.4);
    box(3, 14, new V3(-12, 4, 6), 3.2);
    box(3, 14, new V3(12, 4, -4), 2.0);
    box(18, 2, new V3(0, 2, 14), 1.5);
    // a warm strip low on one side: the copper-tinted kick the brief asks for, kept faint
    const warm = new THREE.Mesh(new THREE.PlaneGeometry(2, 10), new THREE.MeshBasicMaterial({color: new THREE.Color('#ffb27a').multiplyScalar(0.9), side: THREE.DoubleSide}));
    warm.position.set(10, -1, 8);
    warm.lookAt(0, 0, 0);
    env.add(warm);
    const g = new THREE.Mesh(new THREE.CircleGeometry(40, 32), new THREE.MeshBasicMaterial({color: '#c8c8c4', side: THREE.DoubleSide}));
    g.rotation.x = -Math.PI / 2;
    g.position.y = -2;
    env.add(g);
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(env, 0.02).texture;
    scene.environmentIntensity = 0.95;
    pm.dispose();
  }
  const sun = new THREE.DirectionalLight('#ffffff', 2.1);
  sun.position.set(-1.0, 3.2, 1.8);
  sun.castShadow = true;
  Object.assign(sun.shadow.camera, {left: -0.45, right: 0.45, top: 0.45, bottom: -0.45, near: 0.5, far: 8});
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.radius = 10;
  sun.shadow.blurSamples = 20;
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.0015;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight('#ffffff', '#cfcfca', 0.7));

  const FLOOR_Y = -0.0705;
  const shade = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.ShadowMaterial({color: '#5f6268', opacity: 0.26, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8}),
  );
  shade.rotation.x = -Math.PI / 2;
  shade.position.y = FLOOR_Y;
  shade.receiveShadow = true;
  scene.add(shade);
  scene.add(eng.root);

  const size = {w: 1600, h: 900};
  const resize = (w, h, pr) => {
    size.w = w;
    size.h = h;
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  let aoWanted = true;
  // cam: target (tx, ty, tz) in metres, azimuth from +z toward +x, elevation, distance (radians, metres), sx/sy screen
  // shift in px. The camera is pushed back out if a view would put it inside the engine.
  const box = BOX.clone();
  const pos = new V3();
  const tgt = new V3();
  const frame = (state, cam, ops = {}) => {
    eng.update(state, ops);
    const {tx, ty, tz, az, el} = cam;
    // narrow screens need more distance to keep the engine's width in frame
    const fit = cam.fit ?? Math.max(1, 1.05 / Math.max(0.3, camera.aspect)); // a reel frames its own shots (fit 1)
    let d = cam.d * fit;
    tgt.set(tx, ty, tz);
    const dir = new V3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
    pos.copy(tgt).addScaledVector(dir, d);
    box.copy(BOX).expandByScalar(0.035);
    for (let i = 0; i < 40 && box.containsPoint(pos); i++) {
      d += 0.02;
      pos.copy(tgt).addScaledVector(dir, d);
    }
    camera.position.copy(pos);
    camera.lookAt(tgt);
    camera.setViewOffset(size.w, size.h, -(cam.sx ?? 0), -(cam.sy ?? 0), size.w, size.h);
    camera.updateMatrixWorld();
    // AO only on opaque states: see-through parts would otherwise darken what is behind them
    gtao.enabled = aoWanted && (ops.xray ?? 0) < 0.02 && (ops.cut ?? 0) < 0.02 && !(ops.solo && (ops.fade ?? 0) > 0.02);
    if (!ops.noDraw) composer.render(); // the tests pose without drawing
  };
  const pv = new V3();
  const project = (x, y, z) => {
    pv.set(x, y, z).project(camera);
    if (pv.z > 1) return null;
    return [(pv.x * 0.5 + 0.5) * size.w, (-pv.y * 0.5 + 0.5) * size.h];
  };
  const setQuality = ({samples, ao, shadow}) => {
    if (samples !== undefined) {
      for (const t of [composer.renderTarget1, composer.renderTarget2]) {
        t.samples = samples;
        t.dispose();
      }
    }
    if (ao !== undefined) aoWanted = ao;
    if (shadow !== undefined) {
      sun.shadow.mapSize.set(shadow, shadow);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
    }
  };
  return {renderer, scene, camera, eng, composer, gtao, sun, resize, frame, project, size, FLOOR_Y, setQuality};
}
