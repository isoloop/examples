// A magnitude spectrum on a 2D context: bins as a filled line, the peak
// marked. Generic: any magnitudes and bin width.
import type { Ctx2D } from '../env/canvas';

const PAD = { top: 18, right: 8, bottom: 16, left: 8 };

export function drawSpectrum(
  ctx: Ctx2D,
  width: number,
  height: number,
  mags: ArrayLike<number>,
  binHz: number,
  o: { unit: string; color?: string; floor?: number; maxHz?: number },
): void {
  // Up to `maxHz`, where there's something to see; the peak over every bin.
  const shown = Math.min(mags.length, Math.ceil((o.maxHz ?? Infinity) / binHz) + 1);
  ctx.clearRect(0, 0, width, height);
  ctx.font = '11px system-ui, sans-serif';
  const w = width - PAD.left - PAD.right;
  const h = height - PAD.top - PAD.bottom;
  let peak = 0;
  let peakBin = 0;
  for (let k = 1; k < mags.length; k++) {
    const m = mags[k] ?? 0;
    if (m > peak) {
      peak = m;
      peakBin = k;
    }
  }
  const top = Math.max(o.floor ?? 1, peak * 1.1);
  const x = (k: number): number => PAD.left + (k / (shown - 1)) * w;
  const y = (m: number): number => PAD.top + h - (m / top) * h;
  ctx.beginPath();
  ctx.moveTo(x(0), y(0));
  for (let k = 0; k < shown; k++) ctx.lineTo(x(k), y(mags[k] ?? 0));
  ctx.lineTo(x(shown - 1), y(0));
  ctx.closePath();
  ctx.fillStyle = o.color ?? '#4e79a7';
  ctx.fill();
  // The peak, and the axis.
  ctx.fillStyle = '#ddd';
  ctx.textBaseline = 'top';
  ctx.fillText(
    `peak ${(peakBin * binHz).toFixed(1)} Hz · ${peak.toFixed(2)} ${o.unit}`,
    PAD.left,
    2,
  );
  ctx.fillStyle = '#888';
  ctx.textBaseline = 'bottom';
  ctx.fillText('0', PAD.left, height);
  const end = `${Math.round((shown - 1) * binHz)} Hz`;
  ctx.fillText(end, width - PAD.right - ctx.measureText(end).width, height);
}
