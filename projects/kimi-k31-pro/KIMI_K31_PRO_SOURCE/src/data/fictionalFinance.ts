// Scene 07 sample data: a VISIBLY FICTIONAL company. Every figure below is invented for this film (no real company,
// no ticker, no investment view). Only the source figures are typed; every derived value (growth, margins, the model
// line, the cross-check) is computed from them here, so the whole chain can be audited in one file.

export const CO = {
  name: 'Quillmere Orbital Systems Ltd.',
  caps: 'QUILLMERE ORBITAL SYSTEMS LTD.',
  short: 'QUILLMERE ORBITAL',
  tag: 'FICTIONAL SAMPLE',
  unit: '$M',
  analyst: 'Fernhollow Research (fictional)',
  workbook: 'quillmere_model.sheet',
  workbookNote: 'sample workbook',
} as const;

export const FY = { prev: 'FY24', cur: 'FY25', next: 'FY26E' } as const;
export const QTRS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

/** The three source documents (citation numbers are the [n] markers in the finding). */
export const SRC = {
  ar: { cite: '[1]', doc: 'Annual Report FY25', page: 'p. 14', section: 'Consolidated statement of income', kind: 'ANNUAL REPORT' },
  qf: { cite: '[2]', doc: 'Quarterly filing · Q4 FY25', page: 'p. 3', section: 'Revenue by quarter (unaudited)', kind: 'QUARTERLY FILING' },
  an: { cite: '[3]', doc: 'Analyst note', page: 'p. 2', section: 'Model assumptions', kind: 'ANALYST NOTE' },
  /** the chart page the scene opens on */
  fig: { doc: 'Annual Report FY25', page: 'p. 6', section: 'Revenue by quarter' },
} as const;

// ---------------------------------------------------------------- source figures ($M, as printed in the documents)
/** [1] Annual report, consolidated statement of income */
export const AR = {
  revenue: { FY24: 1047.2, FY25: 1284.6 },
  grossProfit: { FY24: 429.4, FY25: 552.4 },
  operatingIncome: { FY24: 146.6, FY25: 205.5 },
} as const;
/** [2] Quarterly filing, revenue by quarter (the filing prints no annual total) */
export const QF = {
  FY24: [248.1, 256.9, 263.4, 278.8],
  FY25: [296.8, 312.4, 327.9, 347.5],
} as const;
/** [3] Analyst note: the one assumption the model line uses */
export const AN = { growth: 0.12 } as const;

// ---------------------------------------------------------------- derived values (computed, never typed)
const sum = (a: readonly number[]) => a.reduce((s, x) => s + x, 0);
const qSum = { FY24: sum(QF.FY24), FY25: sum(QF.FY25) };

export const DER = {
  costOfRevenue: { FY24: AR.revenue.FY24 - AR.grossProfit.FY24, FY25: AR.revenue.FY25 - AR.grossProfit.FY25 },
  opex: { FY24: AR.grossProfit.FY24 - AR.operatingIncome.FY24, FY25: AR.grossProfit.FY25 - AR.operatingIncome.FY25 },
  revGrowth: AR.revenue.FY25 / AR.revenue.FY24 - 1,
  gpGrowth: AR.grossProfit.FY25 / AR.grossProfit.FY24 - 1,
  oiGrowth: AR.operatingIncome.FY25 / AR.operatingIncome.FY24 - 1,
  gm: { FY24: AR.grossProfit.FY24 / AR.revenue.FY24, FY25: AR.grossProfit.FY25 / AR.revenue.FY25 },
  om: { FY24: AR.operatingIncome.FY24 / AR.revenue.FY24, FY25: AR.operatingIncome.FY25 / AR.revenue.FY25 },
  qSum,
  qYoY: QF.FY25.map((v, i) => v / QF.FY24[i] - 1),
  /** cross-document check: the filing's quarters must add up to the annual report's revenue */
  check: { FY24: Math.abs(qSum.FY24 - AR.revenue.FY24) < 0.05, FY25: Math.abs(qSum.FY25 - AR.revenue.FY25) < 0.05 },
  /** the simple model line: FY26E revenue = FY25 revenue x (1 + analyst growth assumption) */
  fy26e: AR.revenue.FY25 * (1 + AN.growth),
};
export const gmDelta = DER.gm.FY25 - DER.gm.FY24;
export const omDelta = DER.om.FY25 - DER.om.FY24;

// ---------------------------------------------------------------- formatting
export const fM = (x: number) => x.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const fPct = (x: number, sign = false) => `${sign && x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}%`;
export const fPt = (x: number) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)} pt`;

/** Every value string the scene prints, by name. */
export const V = {
  revFY24: fM(AR.revenue.FY24), revFY25: fM(AR.revenue.FY25),
  gpFY24: fM(AR.grossProfit.FY24), gpFY25: fM(AR.grossProfit.FY25),
  oiFY24: fM(AR.operatingIncome.FY24), oiFY25: fM(AR.operatingIncome.FY25),
  corFY24: fM(DER.costOfRevenue.FY24), corFY25: fM(DER.costOfRevenue.FY25),
  opxFY24: fM(DER.opex.FY24), opxFY25: fM(DER.opex.FY25),
  revGrowth: fPct(DER.revGrowth, true), gpGrowth: fPct(DER.gpGrowth, true), oiGrowth: fPct(DER.oiGrowth, true),
  gmFY24: fPct(DER.gm.FY24), gmFY25: fPct(DER.gm.FY25), gmDelta: fPt(gmDelta),
  omFY24: fPct(DER.om.FY24), omFY25: fPct(DER.om.FY25), omDelta: fPt(omDelta),
  q: { FY24: QF.FY24.map(fM), FY25: QF.FY25.map(fM) },
  qSum: { FY24: fM(DER.qSum.FY24), FY25: fM(DER.qSum.FY25) },
  qYoY: DER.qYoY.map((x) => fPct(x, true)),
  growth: fPct(AN.growth),
  fy26e: fM(DER.fy26e),
} as const;

/** Document line items as printed (label, current year, prior year). Annual reports print the current year first. */
export const AR_LINES = [
  { key: 'rev', label: 'Revenue', cur: V.revFY25, prev: V.revFY24, hi: true },
  { key: 'cor', label: 'Cost of revenue', cur: `(${V.corFY25})`, prev: `(${V.corFY24})`, hi: false },
  { key: 'gp', label: 'Gross profit', cur: V.gpFY25, prev: V.gpFY24, hi: true },
  { key: 'opx', label: 'Operating expenses', cur: `(${V.opxFY25})`, prev: `(${V.opxFY24})`, hi: false },
  { key: 'oi', label: 'Operating income', cur: V.oiFY25, prev: V.oiFY24, hi: true },
] as const;

/** Formula-bar text for each modelled cell; the A1 references come from the scene's sheet layout. */
export const FORMULA = {
  growth: (cur: string, prev: string) => `=${cur}/${prev}-1`,
  ratio: (num: string, den: string) => `=${num}/${den}`,
  sum: (a: string, b: string) => `=SUM(${a}:${b})`,
  check: (a: string, b: string) => `=${a}=${b}`,
  model: (base: string, g: string) => `=${base}*(1+${g})`,
} as const;

/** Text of the sample documents. */
export const DOC_TEXT = {
  analyst: { lead: 'Base case assumes FY26 revenue growth of', tail: 'on FY25, driven by the existing backlog.',
    note: 'Sample note · not a recommendation' },
  filingNote: 'Quarterly revenue, $M (unaudited). The filing does not print an annual total.',
  arNote: 'Year ended 31 March · $M',
} as const;

/** Spreadsheet labels. */
export const SHEET = {
  headIS: `Income statement · ${CO.unit}`,
  headQ: `Revenue by quarter · ${CO.unit}`,
  rows: { rev: 'Revenue', gp: 'Gross profit', gm: 'Gross margin', oi: 'Operating income', om: 'Operating margin',
    model: `${FY.next} revenue (model)`, qPrev: FY.prev, qCur: FY.cur, qYoY: 'YoY' },
  yoy: 'YoY', sigma: 'Σ', growthLabel: 'g',
  tabs: ['Model', 'Sources'],
} as const;

/** Chart: quarterly revenue, FY24 vs FY25 pairs, axis from zero. */
export const CHART = { title: `Quarterly revenue · ${CO.unit}`, max: 400, ticks: [0, 100, 200, 300, 400] } as const;
/** Opening chart page (annual report figure): the eight quarters as one line. */
export const FIG = { title: `Revenue by quarter, ${FY.prev}–${FY.cur} · ${CO.unit}`, max: 400, ticks: [0, 200, 400],
  series: [...QF.FY24, ...QF.FY25], labels: [...QTRS.map((q) => `${q} ${FY.prev}`), ...QTRS.map((q) => `${q} ${FY.cur}`)] } as const;

/** The cited, factual statement about the sample data (no investment view). */
export const FINDING = {
  questionLabel: 'RESEARCH QUESTION · SAMPLE',
  question: `How did ${FY.cur} revenue change vs ${FY.prev}, and do the sources agree?`,
  label: 'FINDING · SAMPLE DATA',
  pre: `${FY.cur} revenue up `,
  value: V.revGrowth.replace('+', ''),
  post: ` vs ${FY.prev}`,
  cites: [SRC.ar.cite, SRC.qf.cite],
  check: `Σ ${QTRS[0]}–${QTRS[3]} ${FY.cur} ${SRC.qf.cite} = ${V.qSum.FY25} = revenue ${SRC.ar.cite}`,
  checkWord: 'CROSS-CHECKED',
  sources: [`${SRC.ar.cite} ${SRC.ar.doc} · ${SRC.ar.page}`, `${SRC.qf.cite} ${SRC.qf.doc} · ${SRC.qf.page}`],
} as const;

/** Kinds of page on the document wall (generic, all of the same fictional company). */
export const WALL_DOCS = [
  'ANNUAL REPORT FY25', 'QUARTERLY FILING Q4 FY25', 'ANALYST NOTE', 'ANNUAL REPORT FY24', 'QUARTERLY FILING Q3 FY25',
  'INVESTOR PRESENTATION', 'NOTES TO THE ACCOUNTS', 'SEGMENT REVIEW', 'QUARTERLY FILING Q2 FY25', 'RISK FACTORS',
] as const;
