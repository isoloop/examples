import { isoloop } from '@isoloop/vite';
import { defineConfig } from 'vite';

// `@isoloop/vite` gives the worker URLs (`virtual:isoloop/workers`), the dev
// headers, and `?isolate` imports, each emitted as its own chunk.
export default defineConfig({
  oxc: { jsx: { runtime: 'automatic', importSource: 'react' } },
  // No contracts yet, so no bus worker; the dashboard's topics (task 6) add both.
  plugins: [isoloop({ bus: false })],
  base: './',
});
