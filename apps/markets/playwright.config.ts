import { defineConfig, devices } from '@playwright/test';

// Both builds, served by `vite preview` from dist/ (/isoloop/ and /native/), in
// all three engines.
const ENGINES = [
  ['chromium', 'Desktop Chrome'],
  ['firefox', 'Desktop Firefox'],
  ['webkit', 'Desktop Safari'],
] as const;
const LOAD = /(stress|table)\.spec\.ts$/;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:4791' },
  webServer: {
    command: 'pnpm build && pnpm preview --port 4791 --strictPort',
    timeout: 120_000,
    url: 'http://localhost:4791',
    reuseExistingServer: !process.env['CI'],
  },
  // Each engine has two projects. `<engine>-load` holds the tests that measure
  // timing under load (input latency within the 200 ms budget, the table at
  // 3,000 trades/s). CI runs it alone with --workers=1 after the rest, so those
  // tests don't share the runner's cores with other pages.
  projects: ENGINES.flatMap(([name, device]) => [
    { name, use: { ...devices[device] }, testIgnore: LOAD },
    { name: `${name}-load`, use: { ...devices[device] }, testMatch: LOAD },
  ]),
});
