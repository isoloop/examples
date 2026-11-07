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
writeFileSync(`${DIR}/summary.md`, table);
console.log(table);

const [left, right] = [`${DIR}/native.webm`, `${DIR}/isoloop.webm`];
if (existsSync(left) && existsSync(right)) {
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
      `${DIR}/side-by-side.webm`,
    ]);
    console.log(`${DIR}/side-by-side.webm: native (left), Isoloop (right)`);
  } catch (e) {
    console.warn(`no side-by-side video: ${String(e)}`);
  }
}
