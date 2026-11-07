import { fileURLToPath } from 'node:url';
import { isoloop } from '@isoloop/vite';
import { defineConfig } from 'vite';

const src = (p: string): string => fileURLToPath(new URL(`./src/${p}`, import.meta.url));

// One code base, two builds (M3b task 15). `vite build` makes the Isoloop
// build; `vite build --mode native` the native one. Each points three
// aliases at its own files: `#main` (the entry), `#slot` (what a slot holds)
// and `#env` (the widgets' data and canvas hooks). Everything else is shared,
// and the native build has no @isoloop/vite, so no Isoloop code at all.
export default defineConfig(({ mode }) => {
  const build = mode === 'native' ? 'native' : 'isoloop';
  return {
    oxc: { jsx: { runtime: 'automatic', importSource: 'react' } },
    resolve: {
      alias: {
        '#main': src(`main.${build}.tsx`),
        '#slot': src(`slot/${build}.tsx`),
        '#env': src(`env/${build}.ts`),
      },
    },
    plugins: build === 'isoloop' ? [isoloop()] : [],
    base: './',
    build: { outDir: `dist/${build}`, emptyOutDir: true },
  };
});
