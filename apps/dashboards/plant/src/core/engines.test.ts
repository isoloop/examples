import { afterEach, describe, expect, it, vi } from 'vitest';
import { runFleet, runMachineEngines } from './engines';
import { MACHINES } from './machines';
import { faultsBetween } from './sensors/faults';
import { runFeed } from './sensors/feed';
import { Store } from './store';
import type { Alarm, Fleet, Health, PlantEvent, Spectrum } from './schemas';

const T = 1_800_000_000_000;

afterEach(() => {
  vi.useRealTimers();
});

describe('the engines', () => {
  it('compute about 4 spectra a second per machine at 1 kHz, 20 at 5 kHz', () => {
    for (const [rate, perSec] of [
      [1, 1000 / 256],
      [5, 5000 / 256],
    ] as const) {
      vi.useFakeTimers({ now: T });
      const s = new Store();
      const spectra: Spectrum[] = [];
      s.subscribe('T1.spectrum', (r) => spectra.push(r.value), 'latest');
      const jobs = [
        runFeed(s, { machine: 'T1', seed: 1, rateKHz: rate }),
        runMachineEngines(s, 'T1', rate),
      ];
      vi.advanceTimersByTime(10_000);
      for (const j of jobs) j.stop();
      // The first window fills after 1024 samples.
      expect(spectra.length).toBeGreaterThan(perSec * 10 - perSec * (1024 / (rate * 1000)) - 2);
      expect(spectra.length).toBeLessThan(perSec * 10 + 1);
      expect(spectra[0]?.mags).toHaveLength(512);
    }
  });

  it('raise an alarm and an event during overheating, and clear it after', () => {
    const f = faultsBetween(1, T, T + 3_600_000).find((x) => x.kind === 'overheat');
    if (!f) throw new Error('no overheat in an hour');
    vi.useFakeTimers({ now: f.start - 5_000 });
    const s = new Store();
    const alarms: Alarm[] = [];
    const events: PlantEvent[] = [];
    const health: Health[] = [];
    s.subscribe('alarms', (r) => alarms.push(r.value), 'latest');
    s.subscribe('events', (r) => events.push(r.value), 'latest');
    s.subscribe(`${f.machine}.health`, (r) => health.push(r.value), 'latest');
    const jobs = [
      runFeed(s, { machine: f.machine, seed: 1, rateKHz: 1 }),
      runMachineEngines(s, f.machine, 1),
    ];
    vi.advanceTimersByTime(f.end - f.start + 30_000);
    for (const j of jobs) j.stop();
    const exhaust = alarms.filter((a) => a.sensor === 'exhaustTemp');
    expect(exhaust.map((a) => `${a.level}:${a.state}`)).toEqual([
      'warn:active',
      'alarm:active',
      'alarm:cleared',
    ]);
    expect(events.some((e) => e.kind === 'alarm' && e.text.includes('exhaust temp'))).toBe(true);
    expect(health.some((h) => h.status === 'alarm')).toBe(true);
    expect(health.at(-1)?.status).toBe('ok');
    expect(Math.min(...health.map((h) => h.score))).toBeLessThan(90);
  });

  it('a restarted health engine does not raise an active alarm again', () => {
    const f = faultsBetween(1, T, T + 3_600_000).find((x) => x.kind === 'overheat');
    if (!f) throw new Error('no overheat in an hour');
    vi.useFakeTimers({ now: f.start });
    const s = new Store();
    const alarms: Alarm[] = [];
    s.subscribe('alarms', (r) => alarms.push(r.value), 'latest');
    const feed = runFeed(s, { machine: f.machine, seed: 1, rateKHz: 1 });
    let engines = runMachineEngines(s, f.machine, 1);
    vi.advanceTimersByTime(30_000);
    const before = alarms.length;
    expect(before).toBeGreaterThan(0);
    engines.stop();
    engines = runMachineEngines(s, f.machine, 1);
    vi.advanceTimersByTime(3_000);
    engines.stop();
    feed.stop();
    expect(alarms.length).toBe(before);
  });

  it('the fleet engine reads health only, and ranks and correlates the machines', () => {
    vi.useFakeTimers({ now: T });
    const s = new Store();
    const fleet: Fleet[] = [];
    s.subscribe('fleet', (r) => fleet.push(r.value), 'latest');
    const read = vi.spyOn(s, 'subscribe');
    const jobs = MACHINES.flatMap((m) => [
      runFeed(s, { machine: m, seed: 1, rateKHz: 1 }),
      runMachineEngines(s, m, 1),
    ]);
    read.mockClear();
    jobs.push(runFleet(s));
    expect(read.mock.calls.map((c) => c[0]).every((name) => name.endsWith('.health'))).toBe(true);
    vi.advanceTimersByTime(30_000);
    for (const j of jobs) j.stop();
    const last = fleet.at(-1);
    expect(last?.machines).toHaveLength(8);
    expect(last?.correlation).toHaveLength(64);
    expect(last?.correlation[0]).toBe(1);
    const shares = last?.machines.reduce((n, m) => n + m.load, 0) ?? 0;
    expect(shares).toBeCloseTo(1);
    expect(last?.totalPower).toBeGreaterThan(1_000);
  });
});

const spectraFrom = (startOffsetMs: number): Map<number, Float32Array> => {
  vi.useFakeTimers({ now: T + startOffsetMs });
  const s = new Store();
  const out = new Map<number, Float32Array>();
  s.subscribe('T1.spectrum', (r) => out.set(r.value.ts, r.value.mags), 'latest');
  const jobs = [runFeed(s, { machine: 'T1', seed: 1, rateKHz: 2 }), runMachineEngines(s, 'T1', 2)];
  vi.advanceTimersByTime(5_000 - startOffsetMs);
  for (const j of jobs) j.stop();
  vi.useRealTimers();
  return out;
};

describe('the FFT engine', () => {
  it('computes the same spectra whenever it starts', () => {
    const a = spectraFrom(0);
    const b = spectraFrom(1_350);
    const common = [...b.keys()].filter((ts) => a.has(ts));
    expect(common.length).toBeGreaterThan(10);
    for (const ts of common) expect(b.get(ts)).toEqual(a.get(ts));
  });
});
