import { defineConfig, devices } from '@playwright/test';

// The site's smoke test (ADR 0002, decision 11): Chromium, against the
// assembled site (`SITE=1 scripts/assemble-site.sh site` from the repo root,
// after every app and ui's specimens are built), served as GitHub Pages would.
const PORT = 4799;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: process.env['CI'] ? 2 : 2,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: `http://localhost:${PORT}/` },
  webServer: {
    command: `node scripts/serve.ts ../../site ${PORT} --mount /__specimens/=../../packages/ui/dist/specimens`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env['CI'],
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
