import { expect, test } from '@playwright/test';
import { inScope } from './scope';

// M3c task 9: the tape, the echo box and the badge, the same in every build.
for (const build of inScope([
  'isoloop',
  'native',
  'isoloop-preact',
  'native-preact',
  'mixed',
] as const)) {
  test(`${build}: the badge shows values and the tape records its frames`, async ({ page }) => {
    await page.goto(`/${build}/?size=lite&speed=1`);
    const badge = page.getByRole('status', { name: 'Main-thread responsiveness' });
    await expect(badge.locator('[data-badge="fps"]')).toHaveText(/^[1-9]\d* fps$/, {
      timeout: 2_000,
    });
    await page.locator('input[name="echo"]').pressSequentially('abc');
    await expect(page.locator('output[name="echoed"]')).toHaveText('abc');
    await expect(badge.locator('[data-badge="input"]')).toHaveText(/^input \d+ ms$/, {
      timeout: 2_000,
    });
    const tape = await page.evaluate(() => ({
      frames: window.tape.frames,
      gaps: window.tape.gaps.length,
    }));
    expect(tape.frames).toBeGreaterThan(10);
    expect(tape.gaps).toBeGreaterThan(10);
  });
}
