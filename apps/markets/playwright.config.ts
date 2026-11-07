import { defineConfig, devices } from '@playwright/test';

// Both builds, served by `vite preview` from dist/ (/isoloop/ and /native/), in
// all three engines.
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
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
