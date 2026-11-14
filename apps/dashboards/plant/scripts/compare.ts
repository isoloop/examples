// The comparison's results (e2e/comparison.spec.ts) as Markdown tables, one
// per engine, and decision 10's hypothesis checked against them. Writes
// <dir>/summary.md (dir: COMPARE_OUT, default comparison-results).
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { stoppedLabel } from '../src/comparison/stopped.ts';

const DIR = process.env['COMPARE_OUT'] ?? 'comparison-results';
const Result = z.object({
  engine: z.string(),
  build: z.string(),
  placement: z.string().nullable(),
  rate: z.number(),
  stopped: z.boolean(),
  error: z.string().optional(),
  stage: z.string().optional(),
  workers: z.number().optional(),
  firstDataMs: z.number().optional(),
  allWidgetsMs: z.number().nullable().optional(),
  fps: z.number().optional(),
  frames: z.number().optional(),
  frameP95Ms: z.number().optional(),
  framesLate: z.number().optional(),
  longTasks: z.number().optional(),
  typingMedianMs: z.number().optional(),
  mainThreadCpuPct: z.number().nullable().optional(),
  rendererCpuPct: z.number().nullable().optional(),
  rendererPssMb: z.number().nullable().optional(),
  recoveryMs: z.number().nullable().optional(),
  dataGapT3S: z.number().nullable().optional(),
  dataGapOthersS: z.number().nullable().optional(),
});
type Result = z.infer<typeof Result>;

const ORDER = [
  'native',
  'native-workers',
  'isoloop:split',
  'isoloop:machine',
  'isoloop:shared-engines',
  'isoloop:own',
  'isoloop:matched',
  'isoloop:one',
];
const LABEL: Record<string, string> = {
  native: 'Native',
  'native-workers': 'Native + workers',
  'isoloop:split': 'Isoloop, split',
  'isoloop:machine': 'Isoloop, machine',
  'isoloop:shared-engines': 'Isoloop, shared-engines',
  'isoloop:own': 'Isoloop, own',
  'isoloop:matched': 'Isoloop, matched',
  'isoloop:one': 'Isoloop, one',
};
const keyOf = (r: Result): string => (r.placement ? `${r.build}:${r.placement}` : r.build);

const results: Result[] = [];
for (const engine of existsSync(DIR) ? readdirSync(DIR, { withFileTypes: true }) : []) {
  if (!engine.isDirectory()) continue;
  for (const f of readdirSync(join(DIR, engine.name))) {
    if (f.endsWith('.json'))
      results.push(Result.parse(JSON.parse(readFileSync(join(DIR, engine.name, f), 'utf8'))));
  }
}

const v = (x: number | null | undefined, unit = '', digits = 0): string =>
  x === null || x === undefined ? '–' : `${x.toFixed(digits)}${unit}`;
const s = (ms: number | null | undefined): string =>
  ms === null || ms === undefined ? '–' : `${(ms / 1000).toFixed(1)} s`;

const out: string[] = ['# Plant dashboard comparison', ''];
const engines = [...new Set(results.map((r) => r.engine))].toSorted();
for (const engine of engines) {
  out.push(`## ${engine}`, '');
  out.push(
    '| Rate | Build | Workers | fps | Late frames (of ~600) | Long tasks | Typing (median) | Main-thread CPU | Renderer CPU, all threads | Renderer memory | First data | All 72 widgets | Recovery after a 3 s block | Data gap, T3 | Data gap, other machines |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  );
  const rows = results
    .filter((r) => r.engine === engine)
    .toSorted((a, b) => a.rate - b.rate || ORDER.indexOf(keyOf(a)) - ORDER.indexOf(keyOf(b)));
  for (const r of rows) {
    const label = LABEL[keyOf(r)] ?? keyOf(r);
    if (r.stopped) {
      out.push(
        `| ${r.rate} kHz | ${label} | – | ${stoppedLabel(r)} | – | – | – | – | – | – | – | – | – | – | – |`,
      );
      continue;
    }
    out.push(
      `| ${r.rate} kHz | ${label} | ${v(r.workers)} | ${v(r.fps)} | ${v(r.framesLate)} | ${v(r.longTasks)} | ${v(r.typingMedianMs, ' ms')} | ${v(r.mainThreadCpuPct, '%')} | ${v(r.rendererCpuPct, '%')} | ${v(r.rendererPssMb, ' MB')} | ${v(r.firstDataMs, ' ms')} | ${s(r.allWidgetsMs)} | ${s(r.recoveryMs)} | ${v(r.dataGapT3S, ' s', 1)} | ${v(r.dataGapOthersS, ' s', 1)} |`,
    );
  }
  out.push('');
}

// Decision 10: native drops frames and typing passes 100 ms, while Isoloop in
// its default placement stays near 60 fps and under 100 ms. Falsified if
// native keeps headroom, or if Isoloop does no better than native + workers.
out.push('## Hypothesis (decision 10), against these runs', '');
const headroom = (r: Result | undefined): boolean =>
  !!r && !r.stopped && (r.framesLate ?? 0) <= 6 && (r.typingMedianMs ?? Infinity) < 100;
for (const engine of engines) {
  for (const rate of [...new Set(results.map((r) => r.rate))].toSorted((a, b) => a - b)) {
    const find = (k: string): Result | undefined =>
      results.find((r) => r.engine === engine && r.rate === rate && keyOf(r) === k);
    const native = find('native');
    const workers = find('native-workers');
    // The default placement, or split for results recorded before it changed.
    const isoKey = find('isoloop:matched') ? 'isoloop:matched' : 'isoloop:split';
    const iso = find(isoKey);
    const isoName = LABEL[isoKey] ?? isoKey;
    if (!native || !iso) continue;
    const parts: string[] = [];
    parts.push(
      headroom(native)
        ? `native keeps headroom (${v(native.framesLate)} late frames, typing ${v(native.typingMedianMs, ' ms')}): falsified on this machine`
        : `native loses headroom (${v(native.framesLate)} late frames, typing ${v(native.typingMedianMs, ' ms')})`,
    );
    if (iso.stopped) parts.push(`${isoName}: page stopped`);
    else {
      parts.push(
        `${isoName}: ${v(iso.framesLate)} late frames, typing ${v(iso.typingMedianMs, ' ms')}`,
      );
      if (workers && !workers.stopped) {
        const better =
          (iso.framesLate ?? 0) < (workers.framesLate ?? 0) &&
          (iso.typingMedianMs ?? 0) <= (workers.typingMedianMs ?? 0);
        parts.push(
          better
            ? 'better than native + workers on frames and typing'
            : `no better than native + workers (${v(workers.framesLate)} late frames, typing ${v(workers.typingMedianMs, ' ms')})`,
        );
      }
    }
    out.push(`- **${engine}, ${rate} kHz:** ${parts.join('; ')}.`);
  }
}
out.push('');
const md = `${out.join('\n')}\n`;
writeFileSync(join(DIR, 'summary.md'), md);
console.log(md);
