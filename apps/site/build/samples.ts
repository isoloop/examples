// The code on /features/ (ADR 0002, as amended): read at build time from
// apps/samples, where `tsc` checks every file against the published @isoloop
// packages, so a sample can't drift from the API. The site imports nothing
// from Isoloop; it only reads the text.
import { readFileSync } from 'node:fs';

/** The samples the features page shows, by name, as files under apps/samples/src. */
export const SAMPLE_FILES = {
  contracts: 'contracts.ts',
  durable: 'durable.ts',
  placement: 'placement.ts',
  grants: 'grants.ts',
  react: 'counter-react.tsx',
  preact: 'counter-preact.tsx',
  vanilla: 'counter-vanilla.ts',
} as const;

export type SampleName = keyof typeof SAMPLE_FILES;
export type Samples = Record<SampleName, string>;

/**
 * The part of a file to show: the lines between `// #region show` and
 * `// #endregion`, or the whole file without a leading JSX pragma. Trailing
 * blank lines go; indentation is kept.
 */
export function shown(source: string): string {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((l) => l.trim() === '// #region show');
  let body: string[];
  if (start >= 0) {
    const end = lines.findIndex((l, i) => i > start && l.trim() === '// #endregion');
    if (end < 0) throw new Error('a `// #region show` without its `// #endregion`');
    body = lines.slice(start + 1, end);
  } else {
    body = lines.filter((l) => !/^\/\*\* @jsxImportSource \w+ \*\/$/.test(l.trim()));
  }
  while (body.length > 0 && (body.at(-1) ?? '').trim() === '') body.pop();
  while (body.length > 0 && (body[0] ?? '').trim() === '') body.shift();
  return body.join('\n');
}

/** Every sample, read from `dir` (apps/samples/src). */
export function loadSamples(dir: string): Samples {
  const read = (name: SampleName): string =>
    shown(readFileSync(`${dir}/${SAMPLE_FILES[name]}`, 'utf8'));
  return {
    contracts: read('contracts'),
    durable: read('durable'),
    placement: read('placement'),
    grants: read('grants'),
    react: read('react'),
    preact: read('preact'),
    vanilla: read('vanilla'),
  };
}
