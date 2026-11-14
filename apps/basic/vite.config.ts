import { isoloop } from '@isoloop/vite';
import { ui } from 'ui/vite';
import { defineConfig } from 'vite';
import { browserCheck } from '../../shared/browser-check.ts';

// basic: four vanilla isolates (website plan task 4b). `ui` gives it the
// site's header, footer, tokens and theme script (ADR 0003); `isoloop` the
// worker URLs and `?isolate` imports; the browser check the plain-HTML notice.
export default defineConfig({
  plugins: [
    browserCheck('isoloop'),
    isoloop(),
    ui({ header: { current: 'examples' }, footer: true }),
  ],
  base: './',
  worker: { format: 'es' },
});
