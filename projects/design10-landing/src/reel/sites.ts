// The 10 resources in @Dionisselamii's order, each tied to its scene (= its spoken line), the line shown under its name,
// a real figure or tagline from its OWN homepage (docs/sites_text.json, captured 2026-11-21), and its captured page +
// scroll recording (public/sites/<id>.png / .mp4).
export type Site = { scene: string; name: string; url: string; job: string; chip: string; page: string; video: string };
const S = (scene: string, name: string, url: string, job: string, chip: string): Site => ({ scene, name, url, job, chip, page: `sites/${scene}.png`, video: `sites/${scene}.mp4` });
export const SITES: Site[] = [
  S('uizze', 'Uizze', 'uizze.com', 'real app references for your coding agent', '800,000 screens'),
  S('thinkui', 'ThinkUI', 'thinkui.xyz', 'UI references over MCP', 'screens · components · icons'),
  S('mobbin', 'Mobbin', 'mobbin.com', 'real app screens + flows, searchable', '600,000+ screens'),
  S('landbook', 'Land-book', 'land-book.com', 'hand-picked landing pages', 'updated daily'),
  S('godly', 'Godly', 'godly.website', 'award-level websites', '“the best design inspiration on the Internet”'),
  S('fps60', '60fps', '60fps.design', 'mobile UI animations', '2,140 shots'),
  S('shadcn', 'shadcn/ui', 'ui.shadcn.com', 'components your agent already knows', '★ 129k on GitHub'),
  S('reactbits', 'React Bits', 'reactbits.dev', 'animated React components', '217 components'),
  S('magicui', 'Magic UI', 'magicui.design', 'polished landing sections', '150+ free components'),
  S('fontshare', 'Fontshare', 'fontshare.com', 'premium fonts, actually free', 'Indian Type Foundry · Ahmedabad'),
];
export const levelOf = (scene: string) => SITES.findIndex((s) => s.scene === scene) + 1;
