// A square matrix of values in [-1, 1] as coloured cells, with row labels.
// Generic: any labels and matrix.
import type { Ctx2D } from '../env/canvas';

/** Blue for -1, dark for 0, orange for 1. */
export function divergingColor(v: number): string {
  const x = Math.max(-1, Math.min(1, v));
  const a = Math.abs(x);
  const [r, g, b] = x >= 0 ? [242, 142, 43] : [78, 121, 167];
  const mix = (c: number): number => Math.round(30 + (c - 30) * a);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

export function drawHeatmap(
  ctx: Ctx2D,
  width: number,
  height: number,
  labels: readonly string[],
  matrix: readonly number[],
): void {
  ctx.clearRect(0, 0, width, height);
  const n = labels.length;
  const pad = 22;
  const size = Math.max(1, Math.min((width - pad) / n, (height - pad) / n));
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillStyle = '#9aa0a6';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  for (let i = 0; i < n; i++) {
    const label = labels[i] ?? '';
    ctx.fillText(label, pad + i * size + size / 2, pad / 2);
    ctx.textAlign = 'right';
    ctx.fillText(label, pad - 3, pad + i * size + size / 2);
    ctx.textAlign = 'center';
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      ctx.fillStyle = divergingColor(matrix[i * n + j] ?? 0);
      ctx.fillRect(pad + j * size, pad + i * size, size - 1, size - 1);
    }
  }
}
