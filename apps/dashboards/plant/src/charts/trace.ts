// A scrolling trace of chunks of samples, drawn as one min-max column per
// pixel, so any sampling rate costs the same to draw. Generic: any chunks of
// evenly spaced samples.
import type { Ctx2D } from '../env/canvas';

export interface Chunk {
  t0: number;
  dtMs: number;
  values: ArrayLike<number>;
}

/** Draws [from, to) ms of `chunks` (oldest first); returns the samples drawn. */
export function drawTrace(
  ctx: Ctx2D,
  width: number,
  height: number,
  chunks: readonly Chunk[],
  from: number,
  to: number,
  o: { scale: number; color?: string; limits?: readonly number[] },
): number {
  ctx.clearRect(0, 0, width, height);
  const cols = Math.max(1, Math.floor(width));
  const lo = new Float32Array(cols).fill(Infinity);
  const hi = new Float32Array(cols).fill(-Infinity);
  const msPerCol = (to - from) / cols;
  let n = 0;
  for (const c of chunks) {
    const end = c.t0 + c.values.length * c.dtMs;
    if (end < from || c.t0 >= to) continue;
    for (let k = 0; k < c.values.length; k++) {
      const t = c.t0 + k * c.dtMs;
      if (t < from || t >= to) continue;
      const col = Math.floor((t - from) / msPerCol);
      const v = c.values[k] ?? 0;
      if (v < (lo[col] ?? 0)) lo[col] = v;
      if (v > (hi[col] ?? 0)) hi[col] = v;
      n++;
    }
  }
  const mid = height / 2;
  const y = (v: number): number => mid - (v / o.scale) * (height / 2 - 2);
  ctx.strokeStyle = '#444';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  for (const l of o.limits ?? []) {
    for (const s of [l, -l]) {
      ctx.moveTo(0, y(s));
      ctx.lineTo(width, y(s));
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = o.color ?? '#59a14f';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let col = 0; col < cols; col++) {
    const a = lo[col] ?? Infinity;
    const b = hi[col] ?? -Infinity;
    if (a === Infinity) continue;
    ctx.moveTo(col + 0.5, y(b));
    ctx.lineTo(col + 0.5, y(a) + 0.5);
  }
  ctx.stroke();
  return n;
}
