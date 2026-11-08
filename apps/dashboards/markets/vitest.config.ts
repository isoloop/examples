import { defineConfig } from 'vitest/config';

// Unit tests sit next to the code in src/; e2e/ is Playwright's.
export default defineConfig({
  test: { include: ['src/**/*.test.ts'] },
});
