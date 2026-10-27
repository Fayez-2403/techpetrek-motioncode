// Factual checks: every claim's quote exists in its source snapshot (and, with --live, in the live page); qualifiers are
// present; numbers in N match their quotes; charts are honest; no scene or component types a claim value itself; the
// narration only uses verified numbers and no forbidden framing; the weights date is re-checked once it passes.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { ARTICLE, CLAIMS, CODE_DOCS, N, SNAPSHOT, WEIGHTS_DUE, WEIGHTS_STATUS } from '../src/data/verifiedClaims';
import { BENCHCAD, TERMINAL_BENCH } from '../src/data/benchmarkData';
import type { Check } from './run';

const ROOT = path.resolve(__dirname, '..');
const norm = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').replace(/ ([,.;:)])/g, '$1').trim();
const snap = (f: string) => norm(readFileSync(path.join(ROOT, 'src/data/sources', f), 'utf8'));

async function liveText(url: string) {
  const html = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
  return norm(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, '\n').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"'));
}

function stripComments(src: string) { return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1'); }
/** string literals and JSX text of a TS/TSX source */
function visibleStrings(src: string) {
  const s = stripComments(src), out: string[] = [];
  for (const m of s.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) out.push(m[1] ?? m[2] ?? m[3] ?? '');
  for (const m of s.matchAll(/>([^<>{}]+)</g)) out.push(m[1]);
  return out.filter((x) => !/^[MmLlHhVvCcSsQqTtAaZz0-9.,\s-]+$/.test(x) || !/[MmLlCcZz]/.test(x));
}

export async function factualChecks(live: boolean): Promise<Check[]> {
  const checks: Check[] = [];
  const add = (name: string, ok: boolean, detail = '') => checks.push({ name, ok, detail });
  const texts = { article: snap(SNAPSHOT.article), codeDocs: snap(SNAPSHOT.codeDocs) };
  const liveTexts = live ? { article: await liveText(ARTICLE), codeDocs: await liveText(CODE_DOCS) } : null;

  for (const c of Object.values(CLAIMS)) {
    add(`quote in snapshot: ${c.id}`, texts[c.source].includes(norm(c.quote)), c.quote);
    if (liveTexts) add(`quote on the live page: ${c.id}`, liveTexts[c.source].includes(norm(c.quote)), c.quote);
    if (c.kind === 'benchmark') add(`benchmark carries a Moonshot qualifier: ${c.id}`, /moonshot/i.test(c.qualifier), c.qualifier);
    if (c.kind === 'internal') add(`internal example says so: ${c.id}`, /internal/i.test(c.qualifier) && /not independent/i.test(c.qualifier), c.qualifier);
    if (c.kind === 'speed') add(`speed claim is vendor-reported: ${c.id}`, /vendor-reported/i.test(c.qualifier), c.qualifier);
  }

  // numbers in N match the quotes they come from
  const inQuote = (id: keyof typeof CLAIMS, v: number | string) => CLAIMS[id].quote.includes(String(v));
  add('N.tb matches the Terminal-Bench quote', inQuote('terminalBench', N.tb.kimi) && inQuote('terminalBench', N.tb.opus) && inQuote('terminalBench', N.tb.astra));
  add('N.cad matches the BenchCAD quote', inQuote('benchCad', N.cad.kimi) && inQuote('benchCad', N.cad.opus) && inQuote('benchCad', N.cad.astra));
  add('N.codeBench matches its quote', inQuote('codeBench', N.codeBench.kimi) && inQuote('codeBench', N.codeBench.k3));
  add('N.officeQa matches its quote', inQuote('officeQa', N.officeQa));
  add('N.atlas matches its quote', inQuote('atlas', N.atlas.skeletal) && inQuote('atlas', N.atlas.muscle));
  add('N.missions / N.reviews match their quote', inQuote('missions', N.missions) && inQuote('missions', N.reviews));
  add('N.walkSeconds matches its quote', inQuote('walking', N.walkSeconds));
  add('N.shoulderErrors matches its quote', inQuote('shoulder', N.shoulderErrors));
  add('N.speed matches the Highspeed quote', CLAIMS.highspeed.quote.includes(`${N.speed.lo}-${N.speed.hi}×`));
  add('N.cadSubset matches the BenchCAD footnote', CLAIMS.benchCadSubset.quote.includes('1,000-case'));
  add('identity says 3T-class (never "3T active")', inQuote('identity', '3T-class') && !/active parameters?/i.test(CLAIMS.identity.text) && /not active/i.test(CLAIMS.identity.qualifier));

  // honest charts
  for (const ch of [TERMINAL_BENCH, BENCHCAD]) {
    add(`${ch.id}: axis starts at 0`, ch.axisMin === 0 && ch.axisMax === 100);
    add(`${ch.id}: carries its qualifier`, /moonshot-reported/i.test(ch.qualifier));
  }
  const tb = Object.fromEntries(TERMINAL_BENCH.bars.map((b) => [b.model, b.value]));
  add('Terminal-Bench bars equal the verified values', tb['Kimi K3.1 Pro'] === N.tb.kimi && tb['Claude Opus 5.5'] === N.tb.opus && tb['GPT-6 Astra'] === N.tb.astra);
  add('Terminal-Bench: Kimi bar does not pass Opus', tb['Kimi K3.1 Pro'] < tb['Claude Opus 5.5']);

  // no claim values typed into scenes / components / three
  const forbidden = ['65.7', '66.4', '58.2', '92.7', '96.2', '95.9', '61.2', '55.95', '64.4', '296', '402', '167', '420', '11.2', '1,000,000', '1M ', '1M-', '3T', '2–3', '2-3', 'Nov 4', 'NOV 4', '1,000-case'];
  for (const dir of ['src/scenes', 'src/components', 'src/three']) {
    for (const f of readdirSync(path.join(ROOT, dir)).filter((x) => /\.tsx?$/.test(x))) {
      const strs = visibleStrings(readFileSync(path.join(ROOT, dir, f), 'utf8'));
      const hits = strs.filter((s) => forbidden.some((x) => s.includes(x)));
      add(`no hard-coded claim values: ${dir}/${f}`, hits.length === 0, hits.slice(0, 3).join(' | '));
      const bad = strs.filter((s) => /\bsame quality\b|\bguarantee[ds]?\b|\bwinner\b|\bfree\b|\bfastest\b|\bunrestricted\b/i.test(s));
      add(`no forbidden framing: ${dir}/${f}`, bad.length === 0, bad.slice(0, 3).join(' | '));
    }
  }

  // narration (every version) uses verified numbers only, and no forbidden framing
  const allowed = new Set(['3D', 'K3.1', '3T-class', '1M-token', '3-trillion-parameter', '1-million-token', String(N.tb.kimi), String(N.tb.opus), String(N.cad.kimi),
    String(N.officeQa), String(N.missions), String(N.reviews), String(N.shoulderErrors), String(N.walkSeconds), String(N.speed.lo), String(N.speed.hi), N.benchVersion.tb, '5.5', '4', 'v2']);
  for (const file of readdirSync(path.join(ROOT, 'src/data')).filter((f) => /^voScript(\.v\d+)?\.json$/.test(f))) {
    const vo = JSON.parse(readFileSync(path.join(ROOT, 'src/data', file), 'utf8')) as Record<string, { id: string; cap: string }[]>;
    const tag = file.replace('voScript', '').replace('.json', '') || '.v1';
    for (const v of ['master', 'reel']) for (const l of vo[v]) {
      const nums = l.cap.split(/\s+/).map((w) => w.replace(/[,.?!:…]+$/, '').replace(/^Kimi\./, '')).filter((w) => /\d/.test(w));
      const odd = nums.filter((w) => !allowed.has(w));
      add(`narration numbers verified${tag}: ${l.id}`, odd.length === 0, odd.join(', '));
      add(`narration framing${tag}: ${l.id}`, !/\bsame quality\b|\bguarantee|\bfree\b|\bwinner\b|\bsabse fast\b|\bbeats?\b|\bfastest\b/i.test(l.cap), l.cap);
    }
    const all = vo.master.concat(vo.reel);
    const m09 = vo.master.find((l) => l.id === 'm09')!.cap;
    add(`benchmark line says Moonshot-reported${tag}`, /Moonshot ke reported|Moonshot's reported/i.test(m09));
    add(`Highspeed lines are vendor-attributed${tag}`, all.filter((l) => /Highspeed/.test(l.cap)).every((l) => /Moonshot ke mutabik|According to Moonshot|according to Moonshot/.test(l.cap)));
    add(`weights lines say planned / plan${tag}`, all.filter((l) => /weights/i.test(l.cap)).every((l) => /\bplan/i.test(l.cap)));
    add(`walking line says internal${tag}`, all.filter((l) => /walk/i.test(l.cap)).every((l) => /internal/i.test(l.cap)));
  }

  // the weights date
  const today = new Date().toISOString().slice(0, 10);
  add(`weights wording current (today ${today}, due ${WEIGHTS_DUE}, status ${WEIGHTS_STATUS})`, !(today > WEIGHTS_DUE && WEIGHTS_STATUS === 'planned'),
    'the due date has passed: confirm whether the weights shipped and update WEIGHTS_STATUS and the wording');
  return checks;
}
