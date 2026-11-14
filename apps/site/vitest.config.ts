import { defineConfig } from 'vitest/config';

// Unit tests for the build-time code (build/): the pages, hub and diagrams
// plugins. Pages are Preact, rendered at build time only (ADR 0003).
export default defineConfig({
  oxc: { jsx: { runtime: 'automatic', importSource: 'preact' } },
  test: { include: ['build/**/*.test.ts', 'build/**/*.test.tsx'] },
});
