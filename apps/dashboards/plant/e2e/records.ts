import type { Page } from '@playwright/test';

/**
 * Waits for `n` records on each stream (`T3.spectrum`, `fleet`, …) and returns
 * them: on the bus in the Isoloop build, from the page's store in the native
 * builds.
 */
export async function records(
  page: Page,
  build: string,
  streams: string[],
  n = 1,
  from: 'earliest' | 'latest' = 'latest',
): Promise<Record<string, unknown[]>> {
  return page.evaluate(
    async ({ which, names, count, start }) => {
      const schema = { '~standard': {} };
      const out: Record<string, unknown[]> = Object.fromEntries(names.map((s) => [s, []]));
      const offs = names.map((s) => {
        const fn = (r: { value: unknown }): void => {
          out[s]?.push(r.value);
        };
        if (which === 'isoloop') {
          return window.kernel.subscribe({ name: `plant.${s.toLowerCase()}`, schema }, fn, {
            from: start,
          });
        }
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the test names real streams
        return window.store.subscribe(s as 'fleet', fn, start);
      });
      await new Promise<void>((resolve) => {
        const id = setInterval(() => {
          if (Object.values(out).every((xs) => xs.length >= count)) {
            clearInterval(id);
            resolve();
          }
        }, 50);
      });
      for (const off of offs) off();
      return out;
    },
    { which: build, names: streams, count: n, start: from },
  );
}
