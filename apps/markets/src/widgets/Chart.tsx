import { useCanvas } from '#env';
import { useEffect, useRef } from 'react';
import { drawChart, type ChartOptions, type Series } from '../charts/canvas-chart';
import { timed, useRecordTime } from '../metrics/timing';

/** A canvas chart: the context comes from the build (#env), the drawing is shared. */
export function Chart({ series, options }: { series: readonly Series[]; options: ChartOptions }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { ctx, width, height } = useCanvas(ref);
  const record = useRecordTime();
  useEffect(() => {
    if (ctx) {
      timed(record, () => {
        drawChart(ctx, width, height, series, options);
      });
    }
  }, [ctx, width, height, series, options, record]);
  return <canvas ref={ref} className="chart" />;
}
