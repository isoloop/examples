import { fileURLToPath } from 'node:url';
import { ui } from 'ui/vite';
import { defineConfig } from 'vite';
import { readDiagrams } from './build/diagrams.ts';
import { loadExamples } from './build/examples.ts';
import { ensureLibrary, readPin } from './build/library.ts';
import { loadSamples } from './build/samples.ts';
import { site } from './build/plugin.ts';
import { PAGES } from './src/pages/index.ts';

// isoloop.dev's own pages (ADR 0002, as amended): the landing page, the
// features, how it works, the examples hub and the 404. Each index.html is a one-line stub that the `site`
// plugin renders from a Preact page; `ui` adds the header, footer, tokens and
// theme script (ADR 0003). The dashboards and basic are built on their own and
// put next to this build by scripts/assemble-site.sh.
const here = (p: string): string => fileURLToPath(new URL(p, import.meta.url));
const siteDir = here('.');
const diagramsDir = ensureLibrary(siteDir);

export default defineConfig({
  plugins: [
    site({
      pages: PAGES,
      pagesModule: '/src/pages/index.ts',
      diagramsDir,
      data: {
        examples: loadExamples(here('../..')),
        diagrams: readDiagrams(diagramsDir),
        pin: readPin(siteDir),
        samples: loadSamples(here('../samples/src')),
      },
    }),
    ui({ header: true, footer: true }),
  ],
  base: '/',
  build: {
    // No data: URLs: every asset is a same-origin file (ADR 0002, decision 8).
    assetsInlineLimit: 0,
    rolldownOptions: {
      input: {
        home: here('index.html'),
        features: here('features/index.html'),
        'how-it-works': here('how-it-works/index.html'),
        examples: here('examples/index.html'),
        'not-found': here('404.html'),
      },
    },
  },
});
