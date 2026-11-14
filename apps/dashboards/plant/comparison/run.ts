// The head-to-head comparison in one command: pairs of configurations (a
// native build against an Isoloop placement), run interleaved for N rounds,
// one page at a time, by e2e/comparison.spec.ts. Writes each run's JSON and
// <out>/summary.md with the paired gaps (Isoloop minus native, per round) and
// their spread. README.md in this folder has the command and the Docker line.
//
//   node comparison/run.ts \
//     --pair native=isoloop:one --pair native-workers=isoloop:matched \
//     --extra isoloop:split --rates 1,5 --rounds 5 --hold 600 \
//     --engines chromium,firefox --out comparison/matched/results
//
// Arguments (durations in seconds):
//   --pair A=B      a pair; repeat it. A is the baseline, B the Isoloop side.
//   --extra C       a configuration measured alongside, without a pair; repeatable.
//   --rates         vibration rates in kHz, comma-separated (default 1).
//   --rounds        rounds; each runs every configuration once (default 5).
//   --hold          seconds after navigation for the second memory reading
//                   (default 600; 0 skips it).
//   --warm, --window  warm-up and measuring window (defaults 6 and 10).
//   --engines       chromium, firefox, webkit (default chromium,firefox).
//   --out           results folder (default comparison/results).
//   --summary-only  rebuild summary.md from the JSON already in --out.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { cellOr, stoppedLabel } from '../src/comparison/stopped.ts';

const { values: args } = parseArgs({
  options: {
    pair: { type: 'string', multiple: true, default: [] },
    extra: { type: 'string', multiple: true, default: [] },
    rates: { type: 'string', default: '1' },
    rounds: { type: 'string', default: '5' },
    hold: { type: 'string', default: '600' },
    warm: { type: 'string', default: '6' },
    window: { type: 'string', default: '10' },
    engines: { type: 'string', default: 'chromium,firefox' },
    out: { type: 'string', default: 'comparison/results' },
    'summary-only': { type: 'boolean', default: false },
  },
});

const PLANT = resolve(import.meta.dirname, '..');
const OUT = resolve(PLANT, args.out);
const pairs = args.pair.map((p) => {
  const [a, b] = p.split('=');
  if (!a || !b) throw new Error(`--pair wants A=B, got ${p}`);
  return { a, b };
});
const configs = [...new Set([...pairs.flatMap((p) => [p.a, p.b]), ...args.extra])];
const rounds = Number(args.rounds);
const engines = args.engines.split(',');
const PROJECT: Record<string, string> = {
  chromium: 'comparison',
  firefox: 'comparison-firefox',
  webkit: 'comparison-webkit',
};

if (!args['summary-only']) {
  if (configs.length === 0) throw new Error('give at least one --pair or --extra');
  mkdirSync(OUT, { recursive: true });
  const env = {
    ...process.env,
    COMPARE_OUT: OUT,
    COMPARE_CONFIGS: configs.join(','),
    COMPARE_RATES: args.rates,
    COMPARE_RUNS: String(rounds),
    COMPARE_HOLD_MS: String(Number(args.hold) * 1000),
    COMPARE_WARM_MS: String(Number(args.warm) * 1000),
    COMPARE_WINDOW_MS: String(Number(args.window) * 1000),
  };
  writeFileSync(
    join(OUT, 'run.json'),
    `${JSON.stringify({ started: new Date().toISOString(), args, configs, cpus: cpus() }, null, 2)}\n`,
  );
  for (const engine of engines) {
    const project = PROJECT[engine];
    if (!project) throw new Error(`unknown engine ${engine}`);
    console.log(`\n== ${engine}: ${configs.length} configurations × ${rounds} rounds`);
    // A stopped page is written as a result, so the run goes on either way.
    spawnSync(
      'pnpm',
      ['exec', 'playwright', 'test', `--project=${project}`, '--workers=1', '--reporter=list'],
      { cwd: PLANT, env, stdio: 'inherit' },
    );
  }
}

function cpus(): string {
  try {
    return (
      readFileSync('/proc/self/status', 'utf8').match(/^Cpus_allowed_list:\s*(.+)$/m)?.[1] ?? ''
    );
  } catch {
    return '';
  }
}

// The summary.
const N = z.number().nullable().optional();
const Result = z.object({
  engine: z.string(),
  build: z.string(),
  placement: z.string().nullable(),
  rate: z.number(),
  stopped: z.boolean(),
  stage: z.string().optional(),
  error: z.string().optional(),
  workers: N,
  framesLate: N,
  fps: N,
  typingMedianMs: N,
  mainThreadCpuPct: N,
  rendererCpuPct: N,
  rendererPssMb: N,
  rendererPssGcMb: N,
  memAtMs: N,
  holdMs: N,
  rendererPssHoldMb: N,
  rendererPssHoldGcMb: N,
  firstDataMs: N,
  allWidgetsMs: N,
  recoveryMs: N,
  dataGapT3S: N,
  dataGapOthersS: N,
});
type Result = z.infer<typeof Result> & { run: number; key: string };

const results: Result[] = [];
for (const dir of existsSync(OUT) ? readdirSync(OUT, { withFileTypes: true }) : []) {
  if (!dir.isDirectory()) continue;
  for (const f of readdirSync(join(OUT, dir.name))) {
    if (!f.endsWith('.json')) continue;
    const r = Result.parse(JSON.parse(readFileSync(join(OUT, dir.name, f), 'utf8')));
    const run = Number(/-run(\d+)\.json$/.exec(f)?.[1] ?? 1);
    results.push({ ...r, run, key: r.placement ? `${r.build}:${r.placement}` : r.build });
  }
}

type Metric = { key: keyof z.infer<typeof Result>; label: string; unit: string; digits?: number };
const METRICS: Metric[] = [
  { key: 'workers', label: 'Workers (Isoloop also runs the bus worker, not counted)', unit: '' },
  { key: 'framesLate', label: 'Late frames (of ~60/s × window)', unit: '' },
  { key: 'typingMedianMs', label: 'Typing (median of 5)', unit: ' ms' },
  { key: 'mainThreadCpuPct', label: 'Main-thread CPU', unit: '%' },
  { key: 'rendererCpuPct', label: 'CPU, all threads', unit: '%' },
  { key: 'rendererPssMb', label: 'Memory, first reading', unit: ' MB' },
  { key: 'rendererPssGcMb', label: 'Memory, first reading, after GC', unit: ' MB' },
  { key: 'rendererPssHoldMb', label: 'Memory at hold', unit: ' MB' },
  { key: 'rendererPssHoldGcMb', label: 'Memory at hold, after GC', unit: ' MB' },
  { key: 'firstDataMs', label: 'First data', unit: ' ms' },
  { key: 'allWidgetsMs', label: 'All 72 widgets with data', unit: ' ms' },
  { key: 'recoveryMs', label: 'Recovery after a 3 s block', unit: ' ms' },
  { key: 'dataGapT3S', label: 'Data gap, T3', unit: ' s', digits: 1 },
  { key: 'dataGapOthersS', label: 'Data gap, other machines', unit: ' s', digits: 1 },
];

const median = (xs: number[]): number | null => {
  if (xs.length === 0) return null;
  const s = xs.toSorted((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? (s[m] ?? null) : ((s[m - 1] ?? 0) + (s[m] ?? 0)) / 2;
};
// Gaps in a % figure are percentage points, so they don't read as the Gap % column.
const fmt = (x: number | null, m: Metric, sign = false): string =>
  x === null
    ? '–'
    : `${sign && x > 0 ? '+' : ''}${x.toFixed(m.digits ?? 0)}${sign && m.unit === '%' ? ' pp' : m.unit}`;
const num = (r: Result, k: Metric['key']): number | null => {
  const x = r[k];
  return typeof x === 'number' ? x : null;
};

const out: string[] = ['# Plant dashboard, head-to-head', ''];
let meta: unknown = null;
try {
  meta = JSON.parse(readFileSync(join(OUT, 'run.json'), 'utf8'));
} catch {
  // a summary of results copied in from elsewhere
}
if (meta) out.push('Run settings:', '', '```json', JSON.stringify(meta, null, 2), '```', '');
out.push(
  'Each pair ran interleaved (A, B, A, B…), one page at a time. **Gap** is B minus A within each round; the table gives its median over the rounds, as a share of A’s median, and its spread (lowest to highest round). Medians of A and B are over the rounds too. Stopped runs are left out and counted.',
  '',
);

for (const engine of [...new Set(results.map((r) => r.engine))].toSorted()) {
  for (const rate of [...new Set(results.map((r) => r.rate))].toSorted((a, b) => a - b)) {
    const here = results.filter((r) => r.engine === engine && r.rate === rate);
    if (here.length === 0) continue;
    out.push(`## ${engine}, ${rate} kHz`, '');
    for (const { a, b } of pairs) {
      const A = here.filter((r) => r.key === a);
      const B = here.filter((r) => r.key === b);
      if (A.length === 0 && B.length === 0) continue;
      const okA = A.filter((r) => !r.stopped);
      const okB = B.filter((r) => !r.stopped);
      out.push(
        `### ${a} (A) vs ${b} (B)`,
        '',
        `Rounds: A ${okA.length}/${A.length} ran, B ${okB.length}/${B.length} ran.`,
        '',
        ...[...A, ...B]
          .filter((r) => r.stopped)
          .map((r) => `- Round ${r.run}, ${r.key}: ${stoppedLabel(r)}.`),
        ...([...A, ...B].some((r) => r.stopped) ? [''] : []),
        '| Figure | A | B | Gap (B − A) | Gap % | Gap spread |',
        '| --- | --- | --- | --- | --- | --- |',
      );
      for (const m of METRICS) {
        const ma = median(okA.flatMap((r) => num(r, m.key) ?? []));
        const mb = median(okB.flatMap((r) => num(r, m.key) ?? []));
        if (ma === null && mb === null && okA.length + okB.length > 0) continue;
        const gaps: number[] = [];
        for (const ra of okA) {
          const rb = okB.find((r) => r.run === ra.run);
          const x = num(ra, m.key);
          const y = rb ? num(rb, m.key) : null;
          if (x !== null && y !== null) gaps.push(y - x);
        }
        const g = median(gaps);
        const pct = g !== null && ma ? `${g > 0 ? '+' : ''}${Math.round((g / ma) * 100)}%` : '–';
        const spread =
          gaps.length > 1
            ? `${fmt(Math.min(...gaps), m, true)} to ${fmt(Math.max(...gaps), m, true)}`
            : '–';
        out.push(
          `| ${m.label} | ${cellOr(fmt(ma, m), A)} | ${cellOr(fmt(mb, m), B)} | ${fmt(g, m, true)} | ${pct} | ${spread} |`,
        );
      }
      out.push('');
    }
    const extras = args.extra.filter((c) => here.some((r) => r.key === c));
    if (extras.length > 0) {
      out.push(
        '### Measured alongside',
        '',
        `| Figure | ${extras.join(' | ')} |`,
        `| --- |${extras.map(() => ' --- |').join('')}`,
      );
      for (const m of METRICS) {
        const cells = extras.map((c) =>
          cellOr(
            fmt(
              median(
                here.filter((r) => r.key === c && !r.stopped).flatMap((r) => num(r, m.key) ?? []),
              ),
              m,
            ),
            here.filter((r) => r.key === c),
          ),
        );
        if (cells.every((c) => c === '–')) continue;
        out.push(`| ${m.label} | ${cells.join(' | ')} |`);
      }
      out.push('');
    }
  }
}
const md = `${out.join('\n')}\n`;
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'summary.md'), md);
console.log(md);
