// A machine's canvas widgets (M3d task 4): its vibration spectrum, its
// vibration waveform scrolling every frame, and its temperature trends. The
// same code draws on a <canvas> on the main thread (native) or on an
// OffscreenCanvas in the widget's worker (Isoloop).
import { useCanvas, useLatest, useRecent, useRecords } from '#env';
import { useEffect, useRef, useState } from 'react';
import { SENSOR } from '../core/machines';
import { TREND_MS } from '../core/retention';
import { SCALARS_MS } from '../core/sensors/signals';
import { drawChart } from '../charts/canvas-chart';
import { drawSpectrum } from '../charts/spectrum';
import { drawTrace, type Chunk } from '../charts/trace';
import type { Ctx2D } from '../env/canvas';
import { perFrame } from '../env/hooks';
import { timed, useCountDraw, useRecordTime } from '../metrics/timing';
import { of } from '../core/streams';
import { Plot } from './Plot';
import { machineOf } from './props';

export function Spectrum({ config }: { config?: unknown }) {
  const m = machineOf(config);
  const s = useLatest(of(m, 'spectrum'));
  const draw = (ctx: Ctx2D, w: number, h: number): string | null => {
    if (!s) return null;
    drawSpectrum(ctx, w, h, s.mags, s.binHz, { unit: SENSOR.vib.unit, floor: 3, maxHz: 400 });
    return `peak ${s.peakHz.toFixed(1)} Hz`;
  };
  return <Plot draw={draw} />;
}

/** How far behind real time the waveform draws, so the next chunk has arrived (decision 4). */
export const TRACE_DELAY_MS = 50;
const TRACE_SPAN_MS = 1_000;

export function Waveform({ config }: { config?: unknown }) {
  const m = machineOf(config);
  const ref = useRef<HTMLCanvasElement>(null);
  const { ctx, width, height } = useCanvas(ref);
  const record = useRecordTime();
  const counted = useCountDraw();
  const chunks = useRef<Chunk[]>([]);
  const [rate, setRate] = useState<number | null>(null);
  useRecords(of(m, 'vib'), (c) => {
    chunks.current.push(c);
    const cut = c.t0 - TRACE_SPAN_MS - 200;
    while ((chunks.current[0]?.t0 ?? Infinity) < cut) chunks.current.shift();
    setRate(Math.round(1000 / c.dtMs));
  });
  // Scrolls every frame, whether or not a chunk arrived.
  useEffect(() => {
    if (!ctx) return undefined;
    const frame = perFrame(() => {
      const to = Date.now() - TRACE_DELAY_MS;
      counted();
      timed(record, () =>
        drawTrace(ctx, width, height, chunks.current, to - TRACE_SPAN_MS, to, {
          scale: 14,
          limits: [SENSOR.vib.warn ?? 0, SENSOR.vib.alarm ?? 0],
        }),
      );
      frame.request();
    });
    frame.request();
    return () => {
      frame.cancel();
    };
  }, [ctx, width, height, record, counted]);
  return (
    <canvas
      ref={ref}
      className="chart"
      data-drawn={rate === null ? undefined : `${rate} samples/s`}
    />
  );
}

/** Two minutes of rows, one every SCALARS_MS. */
const TREND_ROWS = TREND_MS / SCALARS_MS;

export function Temps({ config }: { config?: unknown }) {
  const m = machineOf(config);
  const rows = useRecent(of(m, 'scalars'), TREND_ROWS, 'earliest');
  const draw = (ctx: Ctx2D, w: number, h: number): string | null => {
    const last = rows.at(-1);
    if (!last) return null;
    const half = Math.floor(h / 2);
    drawChart(
      ctx,
      w,
      half,
      [
        {
          label: 'bearing',
          color: '#f28e2b',
          points: rows.map((r) => [r.ts, r.bearingTemp] as const),
        },
      ],
      { title: '', format: (v) => `${v.toFixed(0)} °C`, baseline: SENSOR.bearingTemp.warn ?? 0 },
    );
    ctx.save();
    ctx.translate(0, half);
    drawChart(
      ctx,
      w,
      h - half,
      [
        {
          label: 'exhaust',
          color: '#e15759',
          points: rows.map((r) => [r.ts, r.exhaustTemp] as const),
        },
      ],
      { title: '', format: (v) => `${v.toFixed(0)} °C`, baseline: SENSOR.exhaustTemp.warn ?? 0 },
    );
    ctx.restore();
    // The row count and the first row's time show how much history it holds
    // (a restart reads it back from the topic); the last row's time ends it.
    return `bearing ${last.bearingTemp.toFixed(2)} exhaust ${last.exhaustTemp.toFixed(2)} rows ${rows.length} from ${rows[0]?.ts ?? last.ts} at ${last.ts}`;
  };
  return <Plot draw={draw} />;
}
