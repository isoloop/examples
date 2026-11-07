import { useRecent } from '#env';
import { useMemo } from 'react';
import { COLORS, type Series } from '../charts/canvas-chart';
import { Chart } from './Chart';
import { useFilters } from './useFilters';

/** The cross-market spread for the selected symbol; below zero, markets cross. */
export function SpreadChart() {
  const f = useFilters();
  const aggs = useRecent('aggregates', 900);
  const symbol = f.symbols[0];
  const series = useMemo(
    (): Series[] => [
      {
        label: 'spread',
        color: COLORS[3] ?? '#fff',
        points: aggs.filter((a) => a.symbol === symbol).map((a) => [a.ts, a.spread] as const),
      },
    ],
    [aggs, symbol],
  );
  const options = useMemo(
    () => ({ title: `${symbol ?? ''} cross-market spread`, baseline: 0 }),
    [symbol],
  );
  return <Chart series={series} options={options} />;
}
