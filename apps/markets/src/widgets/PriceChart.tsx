import { useRecent } from '#env';
import { useMemo } from 'react';
import { COLORS, type Series } from '../charts/canvas-chart';
import { EXCHANGES } from '../core/schemas';
import { Chart } from './Chart';
import { useFilters } from './useFilters';

/** Each selected exchange's last price for the selected symbol. */
export function PriceChart() {
  const f = useFilters();
  const quotes = useRecent('prices', 4_000);
  const symbol = f.symbols[0];
  const series = useMemo(
    (): Series[] =>
      EXCHANGES.filter((ex) => f.exchanges.includes(ex)).map((ex, i) => ({
        label: ex,
        color: COLORS[i % COLORS.length] ?? '#fff',
        points: quotes
          .filter((q) => q.exchange === ex && q.symbol === symbol)
          .slice(-300)
          .map((q) => [q.ts, q.last] as const),
      })),
    [quotes, f.exchanges, symbol],
  );
  const options = useMemo(() => ({ title: `${symbol ?? ''} price` }), [symbol]);
  return <Chart series={series} options={options} />;
}
