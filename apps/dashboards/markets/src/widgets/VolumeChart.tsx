import { useRecent } from '#env';
import { useMemo } from 'react';
import { COLORS, type Series } from '../charts/canvas-chart';
import { Chart } from './Chart';
import { useFilters } from './useFilters';

/** Traded volume in the window, for the selected symbol, once a second. */
export function VolumeChart() {
  const f = useFilters();
  const aggs = useRecent('aggregates', 900);
  const symbol = f.symbols[0];
  const series = useMemo(
    (): Series[] => [
      {
        label: 'volume',
        color: COLORS[2] ?? '#fff',
        points: aggs
          .filter((a) => a.symbol === symbol)
          .slice(-60)
          .map((a) => [a.ts, a.volume] as const),
      },
    ],
    [aggs, symbol],
  );
  const options = useMemo(
    () => ({ title: `${symbol ?? ''} volume`, bars: true, format: (v: number) => v.toFixed(3) }),
    [symbol],
  );
  return <Chart series={series} options={options} />;
}
