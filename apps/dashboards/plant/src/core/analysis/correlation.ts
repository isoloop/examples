// Pearson correlation between series, and how far each value is from the rest.

export function pearson(a: readonly number[], b: readonly number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return 0;
  const xs = a.slice(-n);
  const ys = b.slice(-n);
  const mx = xs.reduce((s, x) => s + x, 0) / n;
  const my = ys.reduce((s, y) => s + y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = (xs[i] ?? 0) - mx;
    const dy = (ys[i] ?? 0) - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  return sxx === 0 || syy === 0 ? 0 : sxy / Math.sqrt(sxx * syy);
}

/** The correlation matrix of the series, row-major. */
export function correlationMatrix(series: readonly (readonly number[])[]): number[] {
  const n = series.length;
  const out = Array.from<number>({ length: n * n }).fill(0);
  for (let i = 0; i < n; i++) {
    out[i * n + i] = 1;
    for (let j = i + 1; j < n; j++) {
      const r = pearson(series[i] ?? [], series[j] ?? []);
      out[i * n + j] = r;
      out[j * n + i] = r;
    }
  }
  return out;
}

/** Each value's distance from the mean of the others, in their standard deviations. */
export function zScores(xs: readonly number[]): number[] {
  return xs.map((x, i) => {
    const rest = xs.filter((_, j) => j !== i);
    const n = rest.length;
    if (n < 2) return 0;
    const mean = rest.reduce((s, v) => s + v, 0) / n;
    const sd = Math.sqrt(rest.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1));
    return sd === 0 ? 0 : (x - mean) / sd;
  });
}
