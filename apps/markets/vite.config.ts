import { fileURLToPath } from 'node:url';
import { isoloop } from '@isoloop/vite';
import { defineConfig, type Alias } from 'vite';

const src = (p: string): string => fileURLToPath(new URL(`./src/${p}`, import.meta.url));

// One code base, five builds (M3b tasks 15 and 16b), picked by `--mode`:
//
// | mode             | output                | framework | kernel            |
// | ---------------- | --------------------- | --------- | ----------------- |
// | (default)        | dist/isoloop          | React     | Isoloop           |
// | `native`         | dist/native           | React     | none, main thread |
// | `isoloop-preact` | dist/isoloop-preact   | Preact    | Isoloop           |
// | `native-preact`  | dist/native-preact    | Preact    | none, main thread |
// | `mixed`          | dist/mixed            | both      | Isoloop           |
// | `mixed-preact`   | dist/mixed/preact     | Preact    | (isolates only)   |
//
// Each points three aliases at its own files: `#main` (the entry), `#slot`
// (what a slot holds) and `#env` (the widgets' data and canvas hooks), plus
// `#widgets` (which module each Isoloop slot runs). Native builds have no
// @isoloop/vite, so no Isoloop code at all. Widgets are written once against
// React's API; the Preact builds alias React to preact/compat, and
// @isoloop/react to @isoloop/preact. `/mixed` runs the React build's host and
// React widgets, plus the filters and the alerts panel as Preact isolates,
// built apart by `mixed-preact` (ADR 0012) and loaded by URL.
type Build = 'isoloop' | 'native' | 'isoloop-preact' | 'native-preact' | 'mixed' | 'mixed-preact';

const BUILDS: readonly Build[] = [
  'isoloop',
  'native',
  'isoloop-preact',
  'native-preact',
  'mixed',
  'mixed-preact',
];

/** The widgets `/mixed` runs on Preact; the rest stay on React. */
export const MIXED_PREACT = {
  filters: 'src/isolates/widgets/filters.tsx',
  'alerts-panel': 'src/isolates/widgets/alerts.tsx',
} as const;

const PREACT: Alias[] = [
  { find: /^react-dom\/client$/, replacement: 'preact/compat/client' },
  { find: /^react-dom$/, replacement: 'preact/compat' },
  { find: /^react\/jsx-runtime$/, replacement: 'preact/jsx-runtime' },
  { find: /^react\/jsx-dev-runtime$/, replacement: 'preact/jsx-dev-runtime' },
  { find: /^react$/, replacement: 'preact/compat' },
  { find: /^@isoloop\/react$/, replacement: '@isoloop/preact' },
];

export default defineConfig(({ mode }) => {
  const build: Build = BUILDS.find((b) => b === mode) ?? 'isoloop';
  const native = build === 'native' || build === 'native-preact';
  const preact =
    build === 'isoloop-preact' || build === 'native-preact' || build === 'mixed-preact';
  const kind = native ? 'native' : 'isoloop';
  const plugins =
    build === 'mixed-preact'
      ? [isoloop({ isolates: MIXED_PREACT, library: true })]
      : native
        ? []
        : [isoloop()];
  return {
    oxc: { jsx: { runtime: 'automatic', importSource: 'react' } },
    define: {
      'import.meta.env.MARKETS_BUILD': JSON.stringify(build === 'mixed-preact' ? 'mixed' : build),
    },
    resolve: {
      alias: [
        { find: '#main', replacement: src(`main.${kind}.tsx`) },
        { find: '#slot', replacement: src(`slot/${kind}.tsx`) },
        { find: '#env', replacement: src(`env/${kind}.ts`) },
        {
          find: '#widgets',
          replacement: src(build === 'mixed' ? 'isoloop/widgets.mixed.ts' : 'isoloop/widgets.ts'),
        },
        ...(preact ? PREACT : []),
      ],
    },
    plugins,
    base: './',
    build: {
      outDir: build === 'mixed-preact' ? 'dist/mixed/preact' : `dist/${build}`,
      emptyOutDir: true,
    },
  };
});
