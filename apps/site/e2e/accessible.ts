// expectAccessible (ADR 0002, decision 9): the only place that knows about axe.
// Fails on serious and critical findings against WCAG 2.2 A and AA. Swapping
// the checker means changing this file only.
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export interface AccessibleOptions {
  /** Selectors axe leaves out, each with the reason in a comment at the call. */
  exclude?: string[];
}

export async function expectAccessible(page: Page, opts: AccessibleOptions = {}): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
    'wcag22aa',
  ]);
  for (const sel of opts.exclude ?? []) builder = builder.exclude(sel);
  const { violations } = await builder.analyze();
  const serious = violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map(
      (v) =>
        `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.map((n) => n.target.join(' ')).join('\n    ')}`,
    );
  expect(serious, `accessibility on ${page.url()}`).toEqual([]);
}
