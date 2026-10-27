// Scene 08 sample content: an ILLUSTRATED agent workflow (labelled reconstruction). Nothing here is a Kimi run, a Kimi
// output, a latency or a result; the check marks belong to the illustration only.
import { CO, FY, V } from './fictionalFinance';

/** Background shared by the end of scene 07 (around the shrinking card) and scene 08. */
export const AGENT_BG = { inner: '#0C1433', outer: '#03050B' } as const;
/** The hand-off to scene 09: one mint bar across the centre (px, centred in the frame). */
export const BAR = { w: 960, h: 8, color: '#7EE3B6' } as const;

export const GOAL = { kicker: 'GOAL · SAMPLE', text: 'Build and ship a dashboard' } as const;

export type StepId = 'plan' | 'search' | 'build' | 'test' | 'debug' | 'review' | 'deliver';
export const STEPS: { id: StepId; name: string; word: RegExp }[] = [
  { id: 'plan', name: 'PLAN', word: /^plan/i },
  { id: 'search', name: 'SEARCH', word: /^search/i },
  { id: 'build', name: 'BUILD', word: /^build/i },
  { id: 'test', name: 'TEST', word: /^test/i },
  { id: 'debug', name: 'DEBUG', word: /^debug/i },
  { id: 'review', name: 'REVIEW', word: /^improve/i },
  { id: 'deliver', name: 'DELIVER', word: /^kare/i },
];
export const stepIndex = (i: number) => String(i + 1).padStart(2, '0');

export const PLAN_ITEMS = ['Define the KPIs', 'Collect the source data', 'Build the dashboard', 'Test, review, ship'] as const;

export const SEARCH = {
  query: 'accessible revenue dashboard',
  results: [
    { title: 'Bar charts that start at zero', meta: 'guide · data viz' },
    { title: 'Responsive KPI grid layouts', meta: 'docs · layout' },
    { title: 'Formatting currency in UI', meta: 'docs · i18n' },
  ],
} as const;

/** Code lines: [indent, tokens] where a token is [kind, text]. */
export type Tok = ['kw' | 'fn' | 'str' | 'num' | 'tx' | 'com' | 'type', string];
export const CODE: [number, Tok[]][] = [
  [0, [['kw', 'export function '], ['fn', 'Dashboard'], ['tx', '({ q }) {']]],
  [1, [['kw', 'const '], ['tx', 'total = '], ['fn', 'sum'], ['tx', '(q.revenue);']]],
  [1, [['kw', 'return '], ['tx', '(']]],
  [2, [['type', '<Grid '], ['tx', 'cols={'], ['num', '3'], ['tx', '}>']]],
  [3, [['type', '<Kpi '], ['tx', 'label='], ['str', '"Revenue"'], ['tx', ' value={total} />']]],
  [3, [['type', '<BarChart '], ['tx', 'data={q} zeroBased />']]],
  [2, [['type', '</Grid>']]],
  [1, [['tx', ');']]],
];

export const TESTS = [
  { name: 'renders KPI tiles', ok: true },
  { name: 'totals match the source', ok: true },
  { name: 'KPI grid alignment', ok: false },
] as const;
export const TEST_WORDS = { pass: 'PASS', fail: 'FAIL', rerun: 're-run' } as const;

export const CHECKS = [
  { name: 'Layout grid', fixes: false },
  { name: 'KPI tile alignment', fixes: true },
  { name: 'Totals match source', fixes: false },
  { name: 'Contrast & labels', fixes: false },
  { name: 'Unit tests', fixes: true },
] as const;
export const DIFF = { del: '- transform: translateX(14px);', add: '+ grid-column: 2;' } as const;
export const INSPECTOR = { title: 'DEBUG · dashboard preview', checks: 'CHECKS', running: 'running', fixed: 'aligned' } as const;

export const REVIEW = [
  { who: 'Reviewer', text: 'Add units to the chart axis', done: true },
  { who: 'Reviewer', text: 'Approved', done: true },
] as const;

/** The dashboard being built, filled with scene 07's fictional sample data. */
export const DASH = {
  title: `${CO.short} · revenue`,
  tag: 'sample',
  kpis: [
    { label: `Revenue ${FY.cur}`, value: V.revFY25 },
    { label: 'YoY', value: V.revGrowth },
    { label: 'Gross margin', value: V.gmFY25 },
  ],
  shipped: 'Shipped · sample',
} as const;

export const LOOP = { label: 'retest' } as const;
/** Two-bar evidence chart axis (percent). */
export const BENCH_AXIS = { max: 100, ticks: [0, 50, 100] } as const;
