// More drawing for M3c's canvas widgets (task 6): a grid of sparklines, bars,
// and heatmaps. Like canvas-chart.ts, the same code draws on an OffscreenCanvas
// in an isolate and on a <canvas> on the native page.
import type { Ctx2D } from '../env/canvas';

const BG = '#1d2024';
const FG = '#ddd';
const DIM = '#888';

function frame(ctx: Ctx2D, width: number, height: number, title: string): void {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = FG;
  ctx.font = '12px system-ui, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(title, 8, 4);
}

function waiting(ctx: Ctx2D, height: number): void {
  ctx.fillStyle = DIM;
  ctx.fillText('waiting for data…', 8, height / 2);
}

export interface Spark {
  label: string;
  values: readonly number[];
}

/** Small multiples: one sparkline per entry, in a grid, each scaled to itself. */
export function drawSparkGrid(
  ctx: Ctx2D,
  width: number,
  height: number,
  title: string,
  sparks: readonly Spark[],
): string | null {
  frame(ctx, width, height, title);
  const shown = sparks.filter((s) => s.values.length > 1);
  if (shown.length === 0) {
    waiting(ctx, height);
    return null;
  }
  const cols = Math.max(1, Math.ceil(Math.sqrt((shown.length * width) / Math.max(1, height - 20))));
  const rows = Math.ceil(shown.length / cols);
  const cw = width / cols;
  const ch = (height - 20) / rows;
  ctx.font = '10px system-ui, sans-serif';
  shown.forEach((s, i) => {
    const x0 = (i % cols) * cw;
    const y0 = 20 + Math.floor(i / cols) * ch;
    let lo = Number.POSITIVE_INFINITY;
    let hi = Number.NEGATIVE_INFINITY;
    for (const v of s.values) {
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
    const span = hi - lo || 1;
    const first = s.values[0] ?? 0;
    const last = s.values[s.values.length - 1] ?? 0;
    ctx.fillStyle = DIM;
    ctx.fillText(s.label.replace('-USD', ''), x0 + 4, y0 + 2);
    ctx.strokeStyle = last >= first ? '#59a14f' : '#e15759';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const n = s.values.length;
    s.values.forEach((v, j) => {
      const x = x0 + 4 + ((cw - 8) * j) / (n - 1);
      const y = y0 + ch - 4 - ((ch - 18) * (v - lo)) / span;
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });
  return `${shown.length} sparklines`;
}

export interface Bar {
  label: string;
  value: number;
}

/** Bars, vertical (`horizontal: false`) or horizontal, scaled to the largest. */
export function drawBars(
  ctx: Ctx2D,
  width: number,
  height: number,
  title: string,
  bars: readonly Bar[],
  o: { horizontal?: boolean; color?: string } = {},
): string | null {
  frame(ctx, width, height, title);
  if (bars.length === 0) {
    waiting(ctx, height);
    return null;
  }
  let max = 0;
  for (const b of bars) max = Math.max(max, Math.abs(b.value));
  max ||= 1;
  ctx.fillStyle = o.color ?? '#4e79a7';
  ctx.font = '10px system-ui, sans-serif';
  const top = 22;
  if (o.horizontal) {
    const bh = (height - top - 4) / bars.length;
    bars.forEach((b, i) => {
      const w = ((width - 60) * Math.abs(b.value)) / max;
      ctx.fillStyle = o.color ?? '#4e79a7';
      ctx.fillRect(56, top + i * bh, w, Math.max(1, bh - 1));
      if (bh >= 9) {
        ctx.fillStyle = DIM;
        ctx.fillText(b.label, 4, top + i * bh);
      }
    });
    return `${bars.length} bars`;
  }
  const bw = (width - 16) / bars.length;
  const base = height - 16;
  bars.forEach((b, i) => {
    const h = ((base - top) * Math.abs(b.value)) / max;
    ctx.fillStyle = o.color ?? '#4e79a7';
    ctx.fillRect(8 + i * bw, base - h, Math.max(1, bw - 2), h);
    ctx.fillStyle = DIM;
    ctx.save();
    ctx.translate(8 + i * bw + 2, height - 2);
    ctx.fillText(b.label.replace('-USD', ''), 0, -12);
    ctx.restore();
  });
  return `${bars.length} bars`;
}

/** A heatmap of `rows × cols` cells, `cell(r, c)` in [0, 1] (or [-1, 1] when `diverging`). */
export function drawHeatmap(
  ctx: Ctx2D,
  width: number,
  height: number,
  title: string,
  rows: number,
  cols: number,
  cell: (r: number, c: number) => number,
  o: { diverging?: boolean } = {},
): string | null {
  frame(ctx, width, height, title);
  if (rows === 0 || cols === 0) {
    waiting(ctx, height);
    return null;
  }
  const top = 20;
  const cw = width / cols;
  const ch = (height - top) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = color(cell(r, c), o.diverging ?? false);
      ctx.fillRect(c * cw, top + r * ch, Math.ceil(cw), Math.ceil(ch));
    }
  }
  return `${rows}×${cols}`;
}

/** Blue for low (or negative), orange for high (or positive). */
export function color(v: number, diverging: boolean): string {
  const x = Number.isFinite(v) ? Math.max(diverging ? -1 : 0, Math.min(1, v)) : 0;
  if (diverging) {
    const a = Math.abs(x);
    return x >= 0
      ? `rgb(${Math.round(29 + a * 213)}, ${Math.round(32 + a * 110)}, ${Math.round(36 + a * 7)})`
      : `rgb(${Math.round(29 + a * 49)}, ${Math.round(32 + a * 89)}, ${Math.round(36 + a * 131)})`;
  }
  return `rgb(${Math.round(29 + x * 213)}, ${Math.round(32 + x * 110)}, ${Math.round(36 + x * 7)})`;
}
