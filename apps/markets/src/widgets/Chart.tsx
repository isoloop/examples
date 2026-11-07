import { useCanvas } from '#env';
import { useEffect, useRef } from 'react';
import { drawChart, type ChartOptions, type Series } from '../charts/canvas-chart';

/** A canvas chart: the context comes from the build (#env), the drawing is shared. */
export function Chart({ series, options }: { series: readonly Series[]; options: ChartOptions }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { ctx, width, height } = useCanvas(ref);
  useEffect(() => {
    if (ctx) drawChart(ctx, width, height, series, options);
  }, [ctx, width, height, series, options]);
  return <canvas ref={ref} className="chart" />;
}
