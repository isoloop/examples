import { defineConfig } from 'vitest/config';

// Unit tests sit next to the code in src/. Components are Preact (ADR 0003).
export default defineConfig({
  oxc: { jsx: { runtime: 'automatic', importSource: 'preact' } },
  test: { include: ['src/**/*.test.ts', 'src/**/*.test.tsx'] },
});
