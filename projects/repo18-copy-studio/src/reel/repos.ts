// The 18 repos in the order of @flxrnc's list, each tied to its scene id (= its spoken line), its real GitHub data
// (docs/repos.json: GitHub REST API, 2026-11-20) and the captured page (public/repos/<slug>.png).
import DATA from '../../docs/repos.json';

type Api = { repo: string; stars: number; license: string | null; desc: string; url: string };
const API = (DATA as unknown as { repos: Api[] }).repos;
export type Repo = { scene: string; full: string; name: string; job: string; page: string; stars: number; license: string | null };
const R = (scene: string, full: string, name: string, job: string): Repo => {
  const a = API.find((x) => x.repo === full)!;
  return { scene, full, name, job, page: `repos/${full.split('/')[1].toLowerCase().replace(/[^a-z0-9]/g, '')}.png`, stars: a.stars, license: a.license };
};
export const REPOS: Repo[] = [
  R('reanimate', 'NiazMorshed2007/reanimate', 'reanimate', 'copies any animation, frame by frame'),
  R('motiondesign', 'LottieFiles/motion-design-skill', 'motion-design-skill', 'timing + easing like an animator'),
  R('mgstyles', 'Vincentwei1021/mg-styles-15', 'mg-styles-15', '15 styles, one prompt each'),
  R('huashu', 'alchaincyf/huashu-art-motion', 'huashu-art-motion', 'paintings that move · 35 styles'),
  R('anidoodle', 'alexgreensh/anidoodle', 'anidoodle', 'doodles + loops, written as code'),
  R('manim', 'ManimCommunity/manim', 'Manim', 'formulas → smooth animation'),
  R('blender', 'EL4CTEO/blender-skills', 'blender-skills', 'pro Blender workflows for your agent'),
  R('quarks', 'Alchemist0823/three.quarks', 'three.quarks', 'particles + VFX for three.js'),
  R('postfx', 'pmndrs/react-postprocessing', 'react-postprocessing', 'bloom, depth of field, film look'),
  R('tweakpane', 'cocopon/tweakpane', 'Tweakpane', 'a slider for every detail'),
  R('effectcraft', 'storytold/effectcraft', 'EffectCraft', 'compositing, written in Rust'),
  R('cinetic', 'Leonxlnx/cinetic', 'cinetic', 'launch films from your coding agent'),
  R('motionmaxxing', 'Tejashmakwana/motionmaxxing', 'motionmaxxing', 'AI slop → designer-level motion'),
  R('openverse', 'WordPress/openverse', 'Openverse', 'openly licensed sounds + music'),
  R('librosa', 'librosa/librosa', 'librosa', 'finds the beat'),
  R('whisperx', 'm-bain/whisperX', 'WhisperX', 'word-level timing for captions'),
  R('remotion', 'remotion-dev/skills', 'Remotion Skills', 'official video skills for agents'),
  R('ffmpeg', 'FFmpeg/FFmpeg', 'FFmpeg', 'into a real video file'),
];
export const TOTAL_STARS = API.reduce((s, r) => s + r.stars, 0);
export const levelOf = (scene: string) => REPOS.findIndex((r) => r.scene === scene) + 1;   // 1..18, 0 = not a repo beat
export const fmtK = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 1 : 1)}k` : String(n));
