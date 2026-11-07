import { expect, test } from '@playwright/test';

const any = { '~standard': {} };

test('the aggregator publishes VWAP and spread per symbol from the replay source', async ({
  page,
}) => {
  await page.goto('/isoloop/?speed=10');
  const symbols = await page.evaluate(
    (schema) =>
      new Promise<string[]>((resolve) => {
        const seen = new Set<string>();
        window.kernel.subscribe({ name: 'aggregates.v1', schema }, (r) => {
          const v = r.value;
          if (
            typeof v === 'object' &&
            v !== null &&
            'symbol' in v &&
            typeof v.symbol === 'string'
          ) {
            seen.add(v.symbol);
          }
          if (seen.size === 3) resolve([...seen].toSorted());
        });
      }),
    any,
  );
  expect(symbols).toEqual(['BTC-USD', 'ETH-USD', 'SOL-USD']);
});

test('a rule published to alert-rules.v1 fires into alerts.v1', async ({ page }) => {
  await page.goto('/isoloop/?speed=10');
  const alert = await page.evaluate(async (schema) => {
    const fired = new Promise<unknown>((resolve) => {
      window.kernel.subscribe({ name: 'alerts.v1', schema }, (r) => {
        resolve(r.value);
      });
    });
    await window.kernel.publish(
      { name: 'alert-rules.v1', schema },
      {
        key: 'e2e',
        value: {
          removed: false,
          id: 'e2e',
          symbol: 'ETH-USD',
          metric: 'price',
          op: 'above',
          threshold: 1,
        },
      },
    );
    return fired;
  }, any);
  expect(alert).toMatchObject({ ruleId: 'e2e', symbol: 'ETH-USD', metric: 'price', op: 'above' });
});
