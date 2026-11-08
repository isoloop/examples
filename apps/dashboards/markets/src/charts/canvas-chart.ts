// Small chart drawing on a 2D context: the same code runs on an
// OffscreenCanvas in a chart isolate and on a <canvas> in the native build.
import type { Ctx2D } from '../env/canvas';

export interface Series {
  label: string;
  color: string;
  /** [time ms, value], oldest first. */
  points: readonly (readonly [number, number])[];
}

export interface ChartOptions {
  title: string;
  format?: (v: number) => string;
  /** Draw bars instead of lines (the first series only). */
  bars?: boolean;
  /** A horizontal line, e.g. zero for a spread. */
  baseline?: number;
}

const PAD = { top: 22, right: 64, bottom: 18, left: 8 };
export const COLORS = ['#4e79a7', '#f28e2b', '#59a14f', '#e15759', '#b07aa1'];

export function drawChart(
  ctx: Ctx2D,
  width: number,
  height: number,
  series: readonly Series[],
  o: ChartOptions,
): void {
  const fmt = o.format ?? ((v: number) => v.toFixed(2));
  ctx.clearRect(0, 0, width, height);
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = '#ddd';
  ctx.textBaseline = 'top';
  ctx.fillText(o.title, PAD.left, 4);

  const all = series.flatMap((s) => s.points);
  if (all.length === 0) {
    ctx.fillStyle = '#888';
    ctx.fillText('waiting for data…', PAD.left, height / 2);
    return;
  }
  let t0 = Number.POSITIVE_INFINITY;
  let t1 = Number.NEGATIVE_INFINITY;
  let lo = o.baseline ?? Number.POSITIVE_INFINITY;
  let hi = o.baseline ?? Number.NEGATIVE_INFINITY;
  for (const [t, v] of all) {
    t0 = Math.min(t0, t);
    t1 = Math.max(t1, t);
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  if (o.bars) lo = Math.min(lo, 0);
  if (hi === lo) {
    hi += 1;
    lo -= 1;
  }
  const w = width - PAD.left - PAD.right;
  const h = height - PAD.top - PAD.bottom;
  const x = (t: number): number => PAD.left + (t1 === t0 ? w : ((t - t0) / (t1 - t0)) * w);
  const y = (v: number): number => PAD.top + h - ((v - lo) / (hi - lo)) * h;

  // Axis labels: high, low, and the baseline.
  ctx.fillStyle = '#888';
  ctx.textBaseline = 'middle';
  ctx.fillText(fmt(hi), width - PAD.right + 4, y(hi));
  ctx.fillText(fmt(lo), width - PAD.right + 4, y(lo));
  if (o.baseline !== undefined) {
    ctx.strokeStyle = '#555';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(PAD.left, y(o.baseline));
    ctx.lineTo(PAD.left + w, y(o.baseline));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (o.bars) {
    const s = series[0];
    if (!s) return;
    const bw = Math.max(1, w / Math.max(1, s.points.length) - 1);
    ctx.fillStyle = s.color;
    for (const [t, v] of s.points) ctx.fillRect(x(t) - bw / 2, y(v), bw, y(0) - y(v));
    return;
  }
  ctx.lineWidth = 1.5;
  series.forEach((s, i) => {
    ctx.strokeStyle = s.color;
    ctx.beginPath();
    s.points.forEach(([t, v], j) => {
      if (j === 0) ctx.moveTo(x(t), y(v));
      else ctx.lineTo(x(t), y(v));
    });
    ctx.stroke();
    const lastPoint = s.points.at(-1);
    ctx.fillStyle = s.color;
    ctx.textBaseline = 'top';
    ctx.fillText(
      `${s.label}${lastPoint ? ` ${fmt(lastPoint[1])}` : ''}`,
      PAD.left + 120 + i * 130,
      4,
    );
  });
}
