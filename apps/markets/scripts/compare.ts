// The comparison's results (e2e/comparison.spec.ts) as a Markdown table, and
// the React pair's two recordings side by side, native on the left (M3b
// task 18). The video needs ffmpeg on the PATH; without it, only the table.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { z } from 'zod';

const DIR = 'comparison-results';
const Result = z.object({
  build: z.string(),
  calm: z.array(z.number()),
  stressed: z.array(z.number()),
  fps: z.string(),
  longTasks: z.string(),
  firstData: z.string(),
  bundle: z.string(),
});
type Result = z.infer<typeof Result>;

const median = (xs: number[]): number => {
  const s = xs.toSorted((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? 0;
};
const max = (xs: number[]): number => Math.max(...xs);
const read = (build: string): Result | undefined => {
  const f = `${DIR}/${build}.json`;
  return existsSync(f) ? Result.parse(JSON.parse(readFileSync(f, 'utf8'))) : undefined;
};

const row = (label: string, r: Result): string =>
  `| ${label} | ${median(r.calm)} ms | ${median(r.stressed)} ms | ${max(r.stressed)} ms | ${r.fps} | ${r.longTasks} | ${r.firstData} | ${r.bundle} |`;

const lines = [
  '| Build | Typing, calm (median) | Typing, one chart blocked (median) | (worst) | fps after | Long tasks (10 s) | First data | JS, gzipped |',
  '| --- | --- | --- | --- | --- | --- | --- | --- |',
];
for (const [build, label] of [
  ['native', 'Native · React'],
  ['isoloop', 'Isoloop · React'],
  ['native-preact', 'Native · Preact'],
  ['isoloop-preact', 'Isoloop · Preact'],
] as const) {
  const r = read(build);
  if (r) lines.push(row(label, r));
}
const table = `${lines.join('\n')}\n`;

// The comparison matrix (M3c task 12, e2e/sizes-comparison.spec.ts): each size
// on each build. What each column covers is in that spec's header.
const SIZES_DIR = `${DIR}/sizes`;
const Category = z.object({
  category: z.string(),
  slots: z.number(),
  workMsPerSec: z.number(),
  applyMsPerSec: z.number().nullable(),
  updatesPerSec: z.number(),
});
const SizeResult = z.object({
  size: z.string(),
  build: z.string(),
  mainThreadCpuPct: z.number(),
  layoutsPerSec: z.number(),
  styleRecalcsPerSec: z.number(),
  rendererCpuPct: z.number(),
  gpuCpuPct: z.number(),
  rendererPssMb: z.number().nullable(),
  frames: z.number(),
  frameP95Ms: z.number(),
  framesOver25Ms: z.number(),
  typingMedianMs: z.number(),
  categories: z.array(Category),
  firstData: z.string(),
  bundle: z.string(),
});
type SizeResult = z.infer<typeof SizeResult>;
const readSize = (size: string, build: string): SizeResult | undefined => {
  const f = `${SIZES_DIR}/${size}-${build}.json`;
  return existsSync(f) ? SizeResult.parse(JSON.parse(readFileSync(f, 'utf8'))) : undefined;
};
const SIZE_LABEL = { lite: 'Lite', normal: 'Normal', heavy: 'Heavy' } as const;
const BUILD_LABEL = {
  native: 'Native · React',
  isoloop: 'Isoloop · React',
  'native-preact': 'Native · Preact',
  'isoloop-preact': 'Isoloop · Preact',
} as const;
const f1 = (v: number): string => v.toFixed(1);
const ratio = (a: number | null | undefined, b: number | null | undefined): string =>
  a != null && b != null && b > 0 ? `${(a / b).toFixed(2)}×` : '—';

const matrix = [
  '| Size | Build | Main-thread CPU | Renderer CPU, all threads | GPU process CPU | Renderer memory (PSS) | Layouts/s | Style recalcs/s | Frames over 25 ms | Frame p95 | Typing (median) |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
];
const ratios = [
  '| Size | Pair | Renderer CPU, Isoloop ÷ native | Memory, Isoloop ÷ native | Main-thread CPU, Isoloop ÷ native | Typing, Isoloop ÷ native |',
  '| --- | --- | --- | --- | --- | --- |',
];
for (const size of ['lite', 'normal', 'heavy'] as const) {
  for (const build of ['native', 'isoloop', 'native-preact', 'isoloop-preact'] as const) {
    const r = readSize(size, build);
    if (!r) continue;
    matrix.push(
      `| ${SIZE_LABEL[size]} | ${BUILD_LABEL[build]} | ${f1(r.mainThreadCpuPct)}% | ${f1(r.rendererCpuPct)}% | ${f1(r.gpuCpuPct)}% | ${r.rendererPssMb ?? '—'} MB | ${f1(r.layoutsPerSec)} | ${f1(r.styleRecalcsPerSec)} | ${r.framesOver25Ms} of ${r.frames} | ${r.frameP95Ms} ms | ${r.typingMedianMs} ms |`,
    );
  }
  for (const [nat, iso, pair] of [
    ['native', 'isoloop', 'React'],
    ['native-preact', 'isoloop-preact', 'Preact'],
  ] as const) {
    const n = readSize(size, nat);
    const i = readSize(size, iso);
    if (!n || !i) continue;
    ratios.push(
      `| ${SIZE_LABEL[size]} | ${pair} | ${ratio(i.rendererCpuPct, n.rendererCpuPct)} | ${ratio(i.rendererPssMb, n.rendererPssMb)} | ${ratio(i.mainThreadCpuPct, n.mainThreadCpuPct)} | ${ratio(i.typingMedianMs, n.typingMedianMs)} |`,
    );
  }
}

const perCategory: string[] = [];
for (const size of ['normal', 'heavy'] as const) {
  const n = readSize(size, 'native');
  const i = readSize(size, 'isoloop');
  if (!n || !i) continue;
  perCategory.push(
    '',
    `**${SIZE_LABEL[size]}, React pair: time per category, ms per second, and updates/s**`,
    '',
    '| Category | Native: render and draw (main thread) | Isoloop: render and draw (own threads) | Isoloop: DOM apply (main thread) | Updates/s, native | Updates/s, Isoloop |',
    '| --- | --- | --- | --- | --- | --- |',
  );
  for (const c of n.categories) {
    const ic = i.categories.find((x) => x.category === c.category);
    perCategory.push(
      `| ${c.category} | ${f1(c.workMsPerSec)} | ${ic ? f1(ic.workMsPerSec) : '—'} | ${ic?.applyMsPerSec == null ? '—' : f1(ic.applyMsPerSec)} | ${c.updatesPerSec} | ${ic?.updatesPerSec ?? '—'} |`,
    );
  }
}

const summary = [
  '## Sizes',
  '',
  matrix.join('\n'),
  '',
  ratios.join('\n'),
  ...perCategory,
  '',
  '## One chart blocked (Lite, replay at 10×)',
  '',
  table,
].join('\n');
writeFileSync(`${DIR}/summary.md`, summary);
console.log(summary);

/** Two recordings side by side, native on the left. */
function sideBySide(left: string, right: string, out: string): void {
  if (!existsSync(left) || !existsSync(right)) return;
  try {
    execFileSync('ffmpeg', [
      '-y',
      '-loglevel',
      'error',
      '-i',
      left,
      '-i',
      right,
      '-filter_complex',
      '[0:v][1:v]hstack=inputs=2:shortest=1[v]',
      '-map',
      '[v]',
      '-c:v',
      'libvpx-vp9',
      '-b:v',
      '1M',
      out,
    ]);
    console.log(`${out}: native (left), Isoloop (right)`);
  } catch (e) {
    console.warn(`no side-by-side video: ${String(e)}`);
  }
}
sideBySide(`${DIR}/native.webm`, `${DIR}/isoloop.webm`, `${DIR}/side-by-side.webm`);
sideBySide(
  `${SIZES_DIR}/normal-native.webm`,
  `${SIZES_DIR}/normal-isoloop.webm`,
  `${DIR}/side-by-side-normal.webm`,
);
