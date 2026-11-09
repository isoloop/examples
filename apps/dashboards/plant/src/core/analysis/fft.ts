// The FFT (M3d decision 5): a 1024-sample Hann window, magnitudes scaled so a
// sine of amplitude A shows a peak of about A.

export const WINDOW = 1024;
export const HOP = 256;

const hann = new Float64Array(WINDOW);
for (let i = 0; i < WINDOW; i++) hann[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (WINDOW - 1));
const HANN_SUM = hann.reduce((a, b) => a + b, 0);

/** In-place radix-2 FFT of `re` + i·`im` (length a power of two). */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j] ?? 0, re[i] ?? 0];
      [im[i], im[j]] = [im[j] ?? 0, im[i] ?? 0];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = a + len / 2;
        const br = re[b] ?? 0;
        const bi = im[b] ?? 0;
        const tr = br * cr - bi * ci;
        const ti = br * ci + bi * cr;
        re[b] = (re[a] ?? 0) - tr;
        im[b] = (im[a] ?? 0) - ti;
        re[a] = (re[a] ?? 0) + tr;
        im[a] = (im[a] ?? 0) + ti;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

export interface SpectrumResult {
  /** Magnitude per bin, 0 to half the sampling rate (WINDOW / 2 bins). */
  mags: Float32Array<ArrayBuffer>;
  binHz: number;
  peakHz: number;
  peak: number;
  /** RMS of the samples, before the window. */
  rms: number;
}

/** The magnitude spectrum of the last WINDOW samples of `samples`, sampled at `rateHz`. */
export function spectrumOf(samples: ArrayLike<number>, rateHz: number): SpectrumResult {
  const re = new Float64Array(WINDOW);
  const im = new Float64Array(WINDOW);
  const off = samples.length - WINDOW;
  let sq = 0;
  for (let i = 0; i < WINDOW; i++) {
    const x = samples[off + i] ?? 0;
    sq += x * x;
    re[i] = x * (hann[i] ?? 0);
  }
  fft(re, im);
  const mags = new Float32Array(WINDOW / 2);
  let peak = 0;
  let peakBin = 0;
  for (let k = 0; k < WINDOW / 2; k++) {
    const m = (2 * Math.hypot(re[k] ?? 0, im[k] ?? 0)) / HANN_SUM;
    mags[k] = m;
    if (k > 0 && m > peak) {
      peak = m;
      peakBin = k;
    }
  }
  const binHz = rateHz / WINDOW;
  return { mags, binHz, peakHz: peakBin * binHz, peak, rms: Math.sqrt(sq / WINDOW) };
}

/** The largest magnitude within `spread` bins of `hz`. */
export function amplitudeAt(
  mags: ArrayLike<number>,
  binHz: number,
  hz: number,
  spread = 2,
): number {
  const k = Math.round(hz / binHz);
  let m = 0;
  for (let i = Math.max(1, k - spread); i <= Math.min(mags.length - 1, k + spread); i++) {
    m = Math.max(m, mags[i] ?? 0);
  }
  return m;
}
