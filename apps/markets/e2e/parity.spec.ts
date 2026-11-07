import { expect, test, type Page } from '@playwright/test';

const ROW = 22;
/** Recording time to replay: at 10× it plays in 2 s, then the table stops growing. */
const FOR_MS = 20_000;

/** The trades table, once the replay has ended: row count, oldest and newest rows. */
async function settledTable(
  page: Page,
): Promise<{ total: number; oldest: string[]; newest: string[] }> {
  const table = page.locator('[data-slot="trades"] .trades');
  const height = async (): Promise<number> =>
    (await table.locator('.trades-inner').boundingBox())?.height ?? 0;
  // Settled: the same height twice, a second apart.
  let last = -1;
  await expect
    .poll(
      async () => {
        const h = await height();
        const same = h > 0 && h === last;
        last = h;
        return same;
      },
      { timeout: 20_000, intervals: [1_000] },
    )
    .toBe(true);
  const total = Math.round(last / ROW);
  // exchange, side, price, size: every cell but the wall-clock time
  const read = async (from: number, to: number): Promise<string[]> => {
    await table.evaluate((el, top) => {
      el.scrollTop = top;
    }, from * ROW);
    const cells = async (): Promise<string[]> =>
      table.evaluate(
        (el, [a, b]) =>
          [...el.querySelectorAll<HTMLElement>('.trade')]
            .map((r) => ({ row: Number(r.dataset['row']), r }))
            .filter((x) => x.row >= (a ?? 0) && x.row < (b ?? 0))
            .toSorted((x, y) => x.row - y.row)
            .map((x) =>
              [...x.r.children]
                .slice(1)
                .map((c) => c.textContent)
                .join(' '),
            ),
        [from, to],
      );
    // On Isoloop the scroll reaches the isolate first; wait for the window.
    await expect.poll(async () => (await cells()).length).toBe(to - from);
    return cells();
  };
  const newest = await read(0, 5);
  const oldest = await read(total - 5, total);
  return { total, oldest, newest };
}

// Every build renders what native React renders (M3b tasks 15 and 16b).
for (const build of ['isoloop', 'isoloop-preact', 'native-preact', 'mixed'] as const) {
  test(`${build} renders the same data as native from the replay source`, async ({ browser }) => {
    const [native, other] = await Promise.all([browser.newPage(), browser.newPage()]);
    const q = `?speed=10&seed=7&for=${FOR_MS}`;
    await Promise.all([native.goto(`/native/${q}`), other.goto(`/${build}/${q}`)]);
    const [a, b] = await Promise.all([settledTable(native), settledTable(other)]);
    expect(a.total).toBeGreaterThan(50);
    expect(b).toEqual(a);
  });
}
