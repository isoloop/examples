import { fileURLToPath } from 'node:url';
import { isoloop } from '@isoloop/vite';
import { defineConfig } from 'vite';
import { browserCheck } from '../../../shared/browser-check.ts';

const src = (p: string): string => fileURLToPath(new URL(`./src/${p}`, import.meta.url));

// One code base, three React builds (M3d decision 7), picked by `--mode`:
//
// | mode             | output               | data and engines            | widgets     |
// | ---------------- | -------------------- | --------------------------- | ----------- |
// | (default)        | dist/isoloop         | headless isolates           | isolates    |
// | `native`         | dist/native          | main thread                 | main thread |
// | `native-workers` | dist/native-workers  | a worker per machine, fleet | main thread |
//
// Each points aliases at its own files: `#main` (the entry), `#slot` (what a
// slot holds), `#env` (the widgets' data and canvas hooks), `#metrics` (the
// panel's build-specific figures) and `#host` (the page's own source). The native builds have no
// @isoloop/vite, so no Isoloop code at all; both use the main-thread store,
// and differ only in where the feeds and engines run.
type Build = 'isoloop' | 'native' | 'native-workers';

const BUILDS: readonly Build[] = ['isoloop', 'native', 'native-workers'];

export default defineConfig(({ mode }) => {
  const build: Build = BUILDS.find((b) => b === mode) ?? 'isoloop';
  const kind = build === 'isoloop' ? 'isoloop' : 'native';
  return {
    oxc: { jsx: { runtime: 'automatic', importSource: 'react' } },
    define: { 'import.meta.env.PLANT_BUILD': JSON.stringify(build) },
    resolve: {
      alias: [
        { find: '#main', replacement: src(`main.${build}.tsx`) },
        { find: '#slot', replacement: src(`slot/${kind}.tsx`) },
        { find: '#env', replacement: src(`env/${kind}.ts`) },
        { find: '#metrics', replacement: src(`metrics/${kind}.ts`) },
        { find: '#host', replacement: src(`host/${kind}.ts`) },
      ],
    },
    plugins: [
      browserCheck(build === 'isoloop' ? 'isoloop' : build),
      ...(kind === 'isoloop' ? [isoloop()] : []),
    ],
    base: './',
    worker: { format: 'es' },
    build: { outDir: `dist/${build}`, emptyOutDir: true },
  };
});
