// The reel director: window.astra.seek(t) renders reel time t (0..65 s) as a pure function of t.
// For the shot that owns t it runs the real simulation from a fresh physics world (replaying the shot's scripted
// input on the live controls) up to the shot's sim time for t, then sets the camera, the reel UI and the overlay.
// Sequential seeks reuse the running world; a backward seek or a new shot starts that shot again from scratch, so
// the order of seeks can never change a frame.
import * as THREE from 'three';
import type { Stage } from '../view/stage';
import { PHYS_DT } from '../core/config';
import { shakeAt } from '../view/camera';
import { lightningAt } from '../view/arena';
import { reelUI, type ReelUI } from './ReelLayer';
import { Overlay, type VOLine } from './overlay';
import { buildShots, VO, type Shot, type Ctx, type Dry } from './shots';
import { loadTarget } from '../ui/App';
import { sat, smooth, span } from './util';
import appSrc from '../ui/App.tsx?raw';
import simSrc from '../core/simcore.ts?raw';
import projSrc from '../core/projectile.ts?raw';
import fracSrc from '../core/fracture.ts?raw';
import modeSrc from '../core/modes.ts?raw';

const W = 1080, H = 1920, DURATION = 65;

/** A real excerpt of a source file: from the first line containing `from`, n lines. */
function excerpt(src: string, from: string, n: number) {
  const lines = src.split('\n'), i = Math.max(0, lines.findIndex((l) => l.includes(from)));
  return { first: i + 1, lines: lines.slice(i, i + n).map((l) => l.replace(/\t/g, '  ')) };
}
const CODE = [
  { file: 'src/ui/App.tsx  ·  React Three Fiber', ...excerpt(appSrc, '<Canvas', 13), hi: 1 },
  { file: 'src/core/simcore.ts  ·  fixed 1/120 s step', ...excerpt(simSrc, 'fixedStep() {', 13), hi: 6 },
  { file: 'src/core/projectile.ts  ·  swept ray, no tunnelling', ...excerpt(projSrc, 'const h = phys.ray(', 12), hi: 0 },
  { file: 'src/core/modes.ts  ·  energy model', ...excerpt(modeSrc, 'const E = ke * CELESTIAL_GAIN', 9), hi: 0 },
  { file: 'src/core/fracture.ts  ·  Voronoi pieces', ...excerpt(fracSrc, '// ---- mesh each cell', 12), hi: 0 },
];

export const Director = {
  async attach(stage: Stage, gl: THREE.WebGLRenderer) {
    const vo: VOLine[] = (await (await fetch('/reel/vo.json')).json()).lines;
    await Promise.all(['900 80px "Archivo X"', '700 60px "Archivo X"', '700 60px "Archivo"', '400 24px "Plex Mono"', '600 24px "Plex Mono"'].map((f) => document.fonts.load(f)));
    if (!stage.hasTarget('crystal')) stage.addTarget('crystal', await loadTarget('crystal'));
    const host = document.getElementById('reel-overlay')!;
    const o = new Overlay(host, vo);
    const V = new VO(vo);
    const shots = buildShots(V);
    const built = new Map<string, Dry>();
    let cur: { id: string; simT: number } | null = null;
    const cam = stage.camRig.cam;
    gl.setSize(W, H, false);
    stage.setSize(W, H);

    const find = (t: number) => shots.find((s) => t >= s.t0 && t < s.t1) ?? shots[shots.length - 1]!;
    const step = (shot: Shot, toSim: number) => {
      const sim = stage.sim, N = Math.ceil(toSim / PHYS_DT - 1e-9);
      while (sim.step < N) { shot.drive?.(sim.step * PHYS_DT, stage); sim.fixedStep(); stage.consume(); }
    };
    // every start runs the same operations whatever ran before: the shot's settings reach the store first (its setup's
    // other actions land on the old world, which is thrown away), then a fresh world is built with exactly those settings
    const start = (shot: Shot) => { shot.setup(stage); stage.freshSim(); shot.setup(stage); };
    const dryRun = (shot: Shot) => {
      const d: Dry = { impact: null, rings: [], launch: null, breaks: 0 };
      start(shot);
      const off = stage.listeners.length;
      stage.listeners.push((e) => {
        if (e.type === 'impact' && !d.impact) d.impact = { t: e.t, p: e.p, n: e.n, r: e.info.fx.radius };
        if (e.type === 'ring') d.rings.push(e.t - (d.launch ?? 0));
        if (e.type === 'launch' && d.launch === null) d.launch = e.t;
        if (e.type === 'break') d.breaks++;
      });
      step(shot, shot.dryFor);
      stage.listeners.splice(off, 1);
      if (d.launch !== null) d.rings = d.rings.map((r) => r + d.launch!);
      shot.build(d); built.set(shot.id, d);
      cur = null;
      return d;
    };

    const ctx = (shot: Shot, t: number, simT: number): Ctx => ({
      stage, t, simT, dry: built.get(shot.id)!, o, vo: V, ui: {}, cursor: { x: 0, y: 0, a: 0, press: 0, hold: false },
      project: (p) => { const v = p instanceof THREE.Vector3 ? p.clone() : new THREE.Vector3(p[0], p[1], p[2]); v.project(cam); return [(v.x * 0.5 + 0.5) * W, (0.5 - v.y * 0.5) * H, v.z < 1]; },
      rect: (sel) => document.querySelector(sel)?.getBoundingClientRect() ?? null,
    });

    const applyCamera = (p: ReturnType<Shot['camera']>, tSim: number) => {
      const sh = shakeAt(stage.camRig.shakes, tSim, p.pos);
      const pos = p.pos.clone().add(sh), look = p.look.clone().add(sh.multiplyScalar(0.6));
      const s = p.shift ?? 0;
      // the subject raised above the centre: render the lower part of a taller image (the optical axis sits at
      // H/2 - s H); the vertical field of view then refers to that taller image
      const fov = s ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(p.fov) / 2) * (1 + 2 * s))) : p.fov;
      stage.camRig.apply(pos, look, fov, p.roll ?? 0);
      // (setViewOffset sets the camera's aspect to the taller image's and clearViewOffset does not restore it)
      if (s) cam.setViewOffset(W, H * (1 + 2 * s), 0, 2 * s * H, W, H); else { cam.clearViewOffset(); cam.aspect = W / H; }
      cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      stage.camRig.pos.copy(pos); stage.camRig.look.copy(look);
    };

    async function seek(t: number) {
      t = Math.max(0, Math.min(DURATION - 1e-6, t));
      const shot = find(t);
      if (!built.has(shot.id)) dryRun(shot);
      const simT = Math.max(0, shot.map(t));
      if (!cur || cur.id !== shot.id || simT < cur.simT - 1e-9) { start(shot); cur = { id: shot.id, simT: 0 }; }
      step(shot, simT);
      cur.simT = simT;
      const N = stage.sim.step;
      stage.alpha = N === 0 ? 1 : Math.min(1, Math.max(0, (simT - (N - 1) * PHYS_DT) / PHYS_DT));
      const c = ctx(shot, t, stage.tSim);
      // the reel UI first (React commits it before the overlay reads the controls' positions)
      shot.ui?.(c);
      reelUI.set({ sections: [], slide: 0, pressed: '', title: '', stats: null, statsK: 0, statsAt: shot.id === 'code' ? [96, 400] : [560, 380], ...c.ui } as ReelUI);
      await new Promise<void>((r) => setTimeout(r, 0));
      applyCamera(shot.camera(c), stage.tSim);
      stage.updateViews(0, { camera: false, clock: t });
      stage.render();
      o.clear();
      if (shot.id === 'code') drawCode(o, t, built.get('code'));
      shot.frame?.(c);
      o.captions(t);
      o.cursor(c.cursor.x, c.cursor.y, c.cursor.a, c.cursor.press, c.cursor.hold, t);
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      return { shot: shot.id, simT, step: N };
    }

    /** Every simulation event of the reel in reel time (for the sound mix), and the UI cues. */
    async function cues() {
      const out: { t: number; type: string; [k: string]: unknown }[] = [];
      for (const shot of shots) {
        if (!built.has(shot.id)) dryRun(shot);
        start(shot);
        const inv = (s: number) => { let a = shot.t0, b = shot.t1; for (let k = 0; k < 50; k++) { const m = (a + b) / 2; if (shot.map(m) < s) a = m; else b = m; } return (a + b) / 2; };
        const off = stage.listeners.length;
        stage.listeners.push((e) => {
          if (e.t < shot.map(shot.t0) - 1e-6) return;   // pre-roll before the shot's first frame
          const rt = inv(e.t);
          if (rt < shot.t0 - 1e-3 || rt > shot.t1) return;
          if (e.type === 'launch') out.push({ t: rt, type: 'launch', shot: shot.id, power: e.power, mode: e.mode });
          else if (e.type === 'impact') out.push({ t: rt, type: 'impact', shot: shot.id, mode: e.mode, target: e.target, E: e.info.E, broken: e.info.broken });
          else if (e.type === 'ring') out.push({ t: rt, type: 'ring', shot: shot.id, idx: e.idx });
          else if (e.type === 'break') out.push({ t: rt, type: 'break', shot: shot.id, cause: e.cause });
          else if (e.type === 'contact') out.push({ t: rt, type: 'contact', shot: shot.id, force: e.force });
          else if (e.type === 'grab') out.push({ t: rt, type: 'grab', shot: shot.id });
          else if (e.type === 'challenge' && e.state.status === 'won') out.push({ t: rt, type: 'won', shot: shot.id });
        });
        step(shot, shot.map(shot.t1 - 1e-4));
        stage.listeners.splice(off, 1);
        cur = null;
        for (const [t, kind] of shot.audio ?? []) if (t >= shot.t0 - 1e-6 && t < shot.t1) out.push({ t, type: 'sfx', shot: shot.id, kind });
        // the time map itself (slow motion and freezes, for the score)
        for (let t = shot.t0; t < shot.t1; t += 0.05) { const r = (shot.map(t + 0.05) - shot.map(t)) / 0.05; out.push({ t, type: 'rate', shot: shot.id, rate: Math.round(r * 1000) / 1000 }); }
      }
      // distant lightning in the sky (a function of the clock = reel time): thunder follows each flash
      let last = -1;
      for (let t = 0; t < DURATION; t += 1 / 120) { const L = lightningAt(t); if (L.k > 0.5 && L.slot !== last && L.age < 0.02) { last = L.slot; out.push({ t, type: 'lightning', slot: L.slot }); } }
      return out.sort((a, b) => a.t - b.t);
    }

    const storyboard = () => shots.map((s) => ({ id: s.id, t0: s.t0, t1: s.t1, dry: built.get(s.id) ?? null }));
    const A = (window as unknown as { astra: Record<string, unknown> }).astra;
    Object.assign(A, { ready: true, duration: DURATION, fps: 60, width: W, height: H, seek, cues, storyboard, shots: shots.map((s) => [s.id, s.t0, s.t1]) });
  },
};

/** The code reveal: the live app in a browser frame over real excerpts of its own source. */
function drawCode(o: Overlay, t: number, _dry: Dry | undefined) {
  const tOpen = 53.05, tMagic = 59.55;
  const grow = smooth(span(t, tMagic - 0.1, tMagic + 0.55));
  const rect: [number, number, number, number] = [60 - 60 * grow, 300 - 300 * grow, 960 + 120 * grow, 640 + 1280 * grow];
  const a = smooth(span(t, tOpen, tOpen + 0.35));
  o.frameMask(rect, a * (1 - grow));
  o.browser(rect, a * (1 - grow), 'localhost:54200  ·  ASTRA.EXE  ·  live simulation');
  const k = Math.min(CODE.length - 1, Math.floor((t - tOpen) / 1.3));
  const ex = CODE[Math.max(0, k)]!, local = (t - tOpen) - k * 1.3;
  o.code([60, 1060, 960, 330], a * (1 - smooth(span(t, tMagic - 0.1, tMagic + 0.3))), ex.file, ex.lines, ex.first, ex.hi + Math.floor(sat(local / 1.3) * 3), Math.max(0, local * 1.2 - 0.6));
  o.sequence([['CODE', 55.62], ['PHYSICS', 57.35], ['MAGIC', tMagic]], 1010, t, 60.85, 66, '  →  ');
}
