import { describe, expect, it } from 'vitest';
import { correlationMatrix, pearson, zScores } from './correlation';
import { HOP, WINDOW, amplitudeAt, spectrumOf } from './fft';
import { levelOf, score, statusOf } from './health';
import { Window, percentile, summarize } from './stats';

const tone = (hz: number, amp: number, rate: number, n = WINDOW): Float64Array =>
  Float64Array.from({ length: n }, (_, i) => amp * Math.sin((2 * Math.PI * hz * i) / rate));

describe('the FFT', () => {
  it('uses the plan window and hop', () => {
    expect([WINDOW, HOP]).toEqual([1024, 256]);
  });

  it("puts a pure tone's peak at its frequency, with its amplitude", () => {
    // 125 Hz at 1 kHz is exactly bin 128.
    const s = spectrumOf(tone(125, 3, 1000), 1000);
    expect(s.binHz).toBeCloseTo(1000 / 1024);
    expect(s.mags).toHaveLength(512);
    expect(Math.abs(s.peakHz - 125)).toBeLessThan(s.binHz);
    expect(s.peak).toBeCloseTo(3, 1);
    expect(s.rms).toBeCloseTo(3 / Math.SQRT2, 2);
    expect(amplitudeAt(s.mags, s.binHz, 125)).toBeCloseTo(3, 1);
    expect(amplitudeAt(s.mags, s.binHz, 300)).toBeLessThan(0.01);
  });

  it('resolves two tones at 5 kHz', () => {
    const x = tone(400, 2, 5000).map((v, i) => v + 0.5 * Math.sin((2 * Math.PI * 1500 * i) / 5000));
    const s = spectrumOf(x, 5000);
    expect(Math.abs(s.peakHz - 400)).toBeLessThan(s.binHz);
    expect(amplitudeAt(s.mags, s.binHz, 1500)).toBeGreaterThan(0.4);
  });
});

describe('the stats', () => {
  it('gives the percentiles of a fixed series', () => {
    const xs = Array.from({ length: 101 }, (_, i) => i); // 0..100
    expect(percentile(xs, 50)).toBe(50);
    expect(percentile(xs, 95)).toBe(95);
    expect(percentile([1, 2, 3, 4], 50)).toBe(2.5);
    expect(summarize([5, 1, 4, 2, 3])).toEqual({
      last: 3,
      min: 1,
      max: 5,
      p50: 3,
      p95: 4.8,
      p99: 4.96,
    });
    expect(summarize([])).toBeNull();
  });

  it('keeps only the window', () => {
    const w = new Window(1_000);
    for (let t = 0; t <= 3_000; t += 100) w.push(t, t);
    expect(w.values()[0]).toBe(2_000);
    expect(w.values()).toHaveLength(11);
  });
});

describe('the correlation', () => {
  it('gives a known matrix', () => {
    const a = [1, 2, 3, 4, 5];
    const b = [2, 4, 6, 8, 10];
    const c = [5, 4, 3, 2, 1];
    const d = [1, 0, 1, 0, 1];
    expect(pearson(a, b)).toBeCloseTo(1);
    expect(pearson(a, c)).toBeCloseTo(-1);
    expect(pearson(a, d)).toBeCloseTo(0);
    const m = correlationMatrix([a, b, c]);
    expect(m.map((x) => Math.round(x))).toEqual([1, 1, -1, 1, 1, -1, -1, -1, 1]);
  });

  it('scores the outlier', () => {
    const z = zScores([1, 1.1, 0.9, 1, 5]);
    expect(Math.abs(z[4] ?? 0)).toBeGreaterThan(10);
    expect(Math.abs(z[0] ?? 0)).toBeLessThan(2);
  });
});

describe('the health', () => {
  const normal = {
    running: true,
    vibRms: 2,
    bearing: 0.3,
    bearingTemp: 70,
    exhaustTemp: 430,
    pressure: 6,
  };

  it('scores a normal machine 100 and a failing one low, worst reason first', () => {
    expect(score(normal)).toEqual({ score: 100, reasons: [] });
    const bad = score({ ...normal, vibRms: 9, bearing: 6, bearingTemp: 92 });
    expect(bad.score).toBeLessThan(50);
    expect(bad.reasons[0]).toBe('vibration');
  });

  it('raises levels at the limits and clears them a little below', () => {
    expect(levelOf('bearingTemp', 84)).toBe('ok');
    expect(levelOf('bearingTemp', 85)).toBe('warn');
    expect(levelOf('bearingTemp', 96)).toBe('alarm');
    expect(levelOf('bearingTemp', 94, 'alarm')).toBe('alarm');
    expect(levelOf('bearingTemp', 91, 'alarm')).toBe('warn');
    expect(levelOf('bearingTemp', 83, 'warn')).toBe('warn');
    expect(levelOf('bearingTemp', 82, 'warn')).toBe('ok');
  });

  it('a stopped machine is stopped, whatever its levels', () => {
    expect(statusOf(false, ['alarm'])).toBe('stopped');
    expect(statusOf(true, ['ok', 'warn'])).toBe('warn');
    expect(statusOf(true, ['ok'])).toBe('ok');
  });
});
