// The single source of truth for every number and claim the film shows or speaks.
// Each claim carries a verbatim quote from an official source snapshot in src/data/sources/; tests/factualChecks.ts
// fails if a quote is not found in its snapshot, if a benchmark lacks its qualifier, or if a scene file carries a
// number of its own. Verified 2026-10-24 against the live pages (see FACT_CHECK.md).

export const ARTICLE = 'https://www.kimi.ai/blog/kimi-k3-1-pro';
export const CODE_DOCS = 'https://www.kimi.com/code/docs/en/kimi-code/whats-new.html';
export const SNAPSHOT = { article: 'kimi-k3-1-pro_article_2026-10-24.txt', codeDocs: 'kimi-code-whats-new_2026-10-24.txt' } as const;
export const VERIFIED_ON = '2026-10-24';

export const NAMES = {
  model: 'Kimi K3.1 Pro',
  modelShort: 'K3.1 Pro',
  highspeed: 'Kimi K3.1 Pro Highspeed',
  highspeedShort: 'K3.1 Pro Highspeed',
  predecessor: 'Kimi K3',
  predecessorShort: 'K3',
  maker: 'Moonshot AI',
  brandWord: 'KIMI',
  versionWord: 'K3.1 PRO',
  opus: 'Claude Opus 5.5',
  astra: 'GPT-6 Astra',
} as const;

export type Source = 'article' | 'codeDocs';
export interface Claim {
  id: string;
  /** what the claim says, in the film's words */
  text: string;
  /** the shortest on-screen form */
  display: string;
  /** printed with the claim wherever it appears ('' only for plain identity facts) */
  qualifier: string;
  source: Source;
  /** verbatim from the snapshot (whitespace-normalised) */
  quote: string;
  kind: 'identity' | 'capability' | 'benchmark' | 'internal' | 'speed' | 'availability';
}

const c = (x: Claim) => x;

export const CLAIMS = {
  identity: c({
    id: 'identity', kind: 'identity', source: 'article',
    text: 'Kimi K3.1 Pro: Moonshot AI\'s most capable 3T-class open-weight model to date',
    display: '3T-CLASS OPEN-WEIGHT MODEL', qualifier: '3T-class = 3-trillion-parameter class (total, not active)',
    quote: 'our most capable 3T-class open-weight model to date, with a 1-million-token context window',
  }),
  postTrained: c({
    id: 'postTrained', kind: 'identity', source: 'article',
    text: 'A post-trained version of Kimi K3, with substantially larger post-training compute',
    display: 'POST-TRAINED FROM KIMI K3', qualifier: '',
    quote: 'Kimi K3.1 Pro is a post-trained version of Kimi K3, with substantially larger post-training compute.',
  }),
  context: c({
    id: 'context', kind: 'identity', source: 'article',
    text: '1-million-token context window', display: 'UP TO 1M TOKENS',
    qualifier: 'Context available varies by product and plan',
    quote: 'with a 1-million-token context window',
  }),
  contextTier: c({
    id: 'contextTier', kind: 'availability', source: 'codeDocs',
    text: 'In Kimi Code, K3.1 Pro is on Plus / Moderato and above; Pro / Allegretto and above unlock up to 1M context',
    display: 'Kimi Code: up to 1M context on Pro / Allegretto plans and above', qualifier: 'Kimi Code docs',
    quote: 'available on Plus / Moderato and above; Pro / Allegretto and above unlock up to 1M context.',
  }),
  highspeed: c({
    id: 'highspeed', kind: 'speed', source: 'article',
    text: 'K3.1 Pro Highspeed delivers 2-3x the speed of K3.1 Pro', display: '2–3× FASTER',
    qualifier: 'Vendor-reported speed comparison',
    quote: 'which delivers 2-3× the speed of K3.1 Pro for more responsive interactions',
  }),
  // ---- coding
  codingRange: c({
    id: 'codingRange', kind: 'capability', source: 'article',
    text: 'From quick fixes in real codebases to full-project builds', display: 'QUICK FIXES → FULL-PROJECT BUILDS', qualifier: '',
    quote: 'from quick fixes in real codebases to full-project builds',
  }),
  engines: c({
    id: 'engines', kind: 'capability', source: 'article',
    text: 'Works across game engines such as Unity, Unreal Engine and Godot', display: 'UNITY · UNREAL ENGINE · GODOT', qualifier: 'Moonshot',
    quote: 'game engines such as Unity, Unreal Engine, and Godot',
  }),
  threejs: c({
    id: 'threejs', kind: 'capability', source: 'article',
    text: 'Front-end pages, interactive Three.js scenes and 3D assets', display: 'FRONT-END · THREE.JS · 3D ASSETS', qualifier: 'Moonshot',
    quote: 'Its front-end pages, interactive Three.js scenes, and 3D assets show stronger composition',
  }),
  terminalBench: c({
    id: 'terminalBench', kind: 'benchmark', source: 'article',
    text: 'Terminal-Bench 4.0: K3.1 Pro 65.7%, GPT-6 Astra 58.2%, Claude Opus 5.5 66.4%', display: 'TERMINAL-BENCH 4.0',
    qualifier: 'Moonshot-reported results; harnesses and reporting methods may differ.',
    quote: 'K3.1 Pro scores 65.7%, ahead of GPT-6 Astra (58.2%) and narrowly behind Claude Opus 5.5 (66.4%)',
  }),
  terminalBenchHarness: c({
    id: 'terminalBenchHarness', kind: 'benchmark', source: 'article',
    text: 'Kimi was run with the Claude-Code harness; other scores are the maximum each vendor or the leaderboard reported',
    display: 'Kimi run with the Claude-Code harness; other scores as reported by their makers or the official leaderboard',
    qualifier: 'Moonshot footnote',
    quote: 'Terminal-Bench 4.0. Kimi K3.1 Pro is evaluated with the Claude-Code harness.',
  }),
  codeBench: c({
    id: 'codeBench', kind: 'benchmark', source: 'article',
    text: 'Kimi Code Bench 3.0 Long-horizon (internal): K3.1 Pro 61.2% vs K3 55.95%', display: 'KIMI CODE BENCH 3.0 LONG-HORIZON',
    qualifier: 'Moonshot internal benchmark · compared with its predecessor K3',
    quote: 'K3.1 Pro scores 61.2%, above K3\'s 55.95%',
  }),
  // ---- 3D / CAD
  cadInputs: c({
    id: 'cadInputs', kind: 'capability', source: 'article',
    text: 'From a text brief, sketch or reference image it infers shape, proportions and spatial relationships',
    display: 'TEXT BRIEF · SKETCH · REFERENCE IMAGE', qualifier: 'Moonshot',
    quote: 'From a text brief, sketch, or reference image, it can infer shape, proportions, and spatial relationships to create usable 3D models.',
  }),
  parametric: c({
    id: 'parametric', kind: 'capability', source: 'article',
    text: 'Parametric modeling: mechanical parts, architectural models, configurable products',
    display: 'MECHANICAL PARTS · ARCHITECTURE · CONFIGURABLE PRODUCTS', qualifier: 'Moonshot',
    quote: 'from mechanical parts and architectural models to configurable products and custom furniture',
  }),
  scripting: c({
    id: 'scripting', kind: 'capability', source: 'article',
    text: 'Writes and runs scripts for tools like Blender and CAD software', display: 'SCRIPTS FOR BLENDER & CAD TOOLS', qualifier: 'Moonshot',
    quote: 'it can write and run scripts for tools like Blender and CAD software',
  }),
  make3d: c({
    id: 'make3d', kind: 'availability', source: 'article',
    text: '3D Make is live on kimi.ai and the Kimi app', display: '3D MAKE · LIVE ON KIMI.AI', qualifier: '',
    quote: 'is now live on kimi.ai and the Kimi app',
  }),
  benchCad: c({
    id: 'benchCad', kind: 'benchmark', source: 'article',
    text: 'BenchCAD with tools: K3.1 Pro 92.7%, Claude Opus 5.5 96.2%, GPT-6 Astra 95.9%', display: 'BENCHCAD WITH TOOLS',
    qualifier: 'Moonshot-reported · Kimi scored on a 1,000-case subset · Claude and GPT scores from their makers\' reports',
    quote: 'K3.1 Pro scores 92.7% with tools , approaching the performance of Claude Opus 5.5 (96.2%) and GPT-6 Astra (95.9%)',
  }),
  benchCadSubset: c({
    id: 'benchCadSubset', kind: 'benchmark', source: 'article',
    text: 'Open models evaluated by Moonshot on 1,000-case subsets of the 17,900-case Vision2Code dataset', display: '1,000-CASE SUBSET',
    qualifier: 'Moonshot footnote',
    quote: 'Open models are evaluated by us on 1,000-case subsets randomly sampled from the full 17,900-case Vision2Code dataset',
  }),
  // ---- human walking simulation (Moonshot internal example)
  atlas: c({
    id: 'atlas', kind: 'internal', source: 'article',
    text: 'human-atlas: open-source anatomical model with 296 skeletal components (incl. cartilage) and 402 muscle components',
    display: '296 SKELETAL · 402 MUSCLE COMPONENTS', qualifier: 'Moonshot internal example — not independent scientific validation',
    quote: 'an open-source anatomical model of the human body comprising 296 skeletal components, including cartilage, and 402 muscle components',
  }),
  missions: c({
    id: 'missions', kind: 'internal', source: 'article',
    text: '167 missions and 420 independent reviews', display: '167 MISSIONS · 420 REVIEWS',
    qualifier: 'Moonshot internal example — not independent scientific validation',
    quote: 'Across 167 missions and 420 independent reviews',
  }),
  walking: c({
    id: 'walking', kind: 'internal', source: 'article',
    text: 'From collapsing within seconds to 11.2 seconds of continuous alternating-stride walking', display: '11.2 SEC CONTINUOUS WALKING',
    qualifier: 'Moonshot internal example — not independent scientific validation',
    quote: 'go from collapsing within seconds to walking continuously with alternating strides for 11.2 seconds',
  }),
  shoulder: c({
    id: 'shoulder', kind: 'internal', source: 'article',
    text: 'Identified and corrected 36 errors in shoulder-muscle moment-arm calculations', display: '36 MOMENT-ARM ERRORS CORRECTED',
    qualifier: 'Moonshot internal example — not independent scientific validation',
    quote: 'identified and corrected 36 errors in shoulder-muscle moment-arm calculations',
  }),
  // ---- finance
  financeTasks: c({
    id: 'financeTasks', kind: 'capability', source: 'article',
    text: 'Retrieval, cross-document verification and multi-step numerical reasoning over real financial documents',
    display: 'RETRIEVAL · CROSS-DOCUMENT VERIFICATION · MULTI-STEP REASONING', qualifier: 'Moonshot',
    quote: 'through retrieval, cross-document verification, and multi-step numerical reasoning',
  }),
  financeCases: c({
    id: 'financeCases', kind: 'capability', source: 'article',
    text: 'Financial modeling, investment analysis and source-grounded research', display: 'MODELING · INVESTMENT ANALYSIS · SOURCE-GROUNDED RESEARCH',
    qualifier: 'Moonshot',
    quote: 'how K3.1 Pro handles financial modeling, investment analysis, and source-grounded research in practice',
  }),
  officeQa: c({
    id: 'officeQa', kind: 'benchmark', source: 'article',
    text: 'OfficeQA Pro v2: 64.4', display: 'OFFICEQA PRO V2', qualifier: 'Moonshot-reported',
    quote: 'K3.1 Pro achieves state-of-the-art results on OfficeQA Pro v2 (64.4)',
  }),
  // ---- availability
  channels: c({
    id: 'channels', kind: 'availability', source: 'article',
    text: 'Rolling out on Kimi.ai and the Kimi mobile apps, Kimi Work, Kimi Code and the Kimi API',
    display: 'KIMI.AI · KIMI APP · KIMI WORK · KIMI CODE · KIMI API', qualifier: '',
    quote: 'on Kimi.ai and the Kimi mobile apps, Kimi Work and Kimi Code, and through the Kimi API',
  }),
  enterprise: c({
    id: 'enterprise', kind: 'availability', source: 'article',
    text: 'Kimi Enterprise: off by default at launch; administrators can enable it', display: 'ENTERPRISE: OFF BY DEFAULT, ADMINS CAN ENABLE', qualifier: '',
    quote: 'can enable K3.1 Pro for their organization; access is off by default at launch.',
  }),
  weights: c({
    id: 'weights', kind: 'availability', source: 'article',
    text: 'Full model weights will be released by Nov 4, 2026', display: 'FULL WEIGHTS PLANNED BY NOV 4, 2026',
    qualifier: 'Announced plan · check before posting',
    quote: 'Full model weights will be released by Nov 4, 2026.',
  }),
} as const;

export type ClaimId = keyof typeof CLAIMS;

/** The date the weights are due; tests fail after it until WEIGHTS_STATUS is re-checked and updated. */
export const WEIGHTS_DUE = '2026-11-04';
export const WEIGHTS_STATUS: 'planned' | 'released' = 'planned';

/** Numbers as the film prints them (one place, so scenes never type a number themselves). */
export const N = {
  tb: { kimi: 65.7, opus: 66.4, astra: 58.2 },
  cad: { kimi: 92.7, opus: 96.2, astra: 95.9 },
  codeBench: { kimi: 61.2, k3: 55.95 },
  officeQa: 64.4,
  atlas: { skeletal: 296, muscle: 402 },
  missions: 167,
  reviews: 420,
  walkSeconds: 11.2,
  shoulderErrors: 36,
  speed: { lo: 2, hi: 3 },
  contextTokens: 1_000_000,
  paramClass: '3T',
  version: 'K3.1',
  benchVersion: { tb: '4.0', codeBench: '3.0', officeQa: 'v2' },
  cadSubset: 1000,
  weightsDate: 'NOV 4, 2026',
} as const;

/** Label every demo shot carries (see PROVENANCE in sceneManifest.ts). */
export const LABELS = {
  B: 'Illustrative reconstruction',
  C: 'Concept visualization',
  independent: 'Independent explainer by TechpeTrek · Not affiliated with or endorsed by Moonshot AI',
  fictional: 'Fictional sample company · sample numbers · not investment advice',
  source: 'Source: kimi.ai/blog/kimi-k3-1-pro',
} as const;
