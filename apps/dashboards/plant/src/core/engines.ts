// The engines (M3d task 3), written once against a `Source`: per machine the
// FFT, the rolling stats and the health score with its alarms and events;
// plant-wide the fleet engine, which reads only derived topics (spectrum,
// health), never raw vibration. On Isoloop each is a headless isolate; on
// native they run on the main thread; on native + workers, a machine's
// engines run in its data worker and the fleet engine in its own.
import { correlationMatrix, zScores } from './analysis/correlation';
import { HOP, WINDOW, amplitudeAt, spectrumOf } from './analysis/fft';
import {
  LIMITED,
  LIMITED_SENSORS,
  levelOf,
  score,
  statusOf,
  type Level,
  type Readings,
} from './analysis/health';
import { Window, summarize } from './analysis/stats';
import { MACHINES, SCALARS, SENSOR, type MachineId } from './machines';
import type { Health, Scalars, Spectrum, Summary } from './schemas';
import { BEARING_ORDER } from './sensors/signals';
import { of, type Source, type Stoppable } from './streams';
import { timingBatch } from './timing-batch';

/** Time an engine spends, published to `timings` once a second as `engine-<name>`. */
export function engineMeter(
  src: Source,
  name: string,
): { time: <T>(fn: () => T) => T; stop: () => void } {
  let ms = 0;
  const off = timingBatch().report(
    `engine-${name}`,
    () => {
      const t = { widget: 'engine', ms };
      ms = 0;
      return t;
    },
    (v) => {
      src.publish('timings', v);
    },
  );
  return {
    time: (fn) => {
      const t0 = performance.now();
      try {
        return fn();
      } finally {
        ms += performance.now() - t0;
      }
    },
    stop: off,
  };
}

const stopAll = (...xs: (() => void)[]): Stoppable => ({
  stop: () => {
    for (const x of xs) x();
  },
});

/**
 * Spectra of the machine's vibration: 1024 samples, Hann, every 256 samples.
 * The hop counts samples since the epoch, so every build (and a restarted
 * engine) computes its spectra on the same windows, with the same results.
 */
export function runFft(src: Source, machine: MachineId, rateKHz: number): Stoppable {
  const meter = engineMeter(src, `fft-${machine}`);
  const buf = new Float64Array(WINDOW);
  const ordered = new Float64Array(WINDOW);
  let at = 0;
  let filled = 0;
  let next: number | undefined;
  const off = src.subscribe(
    of(machine, 'vib'),
    (r) => {
      meter.time(() => {
        const c = r.value;
        // A gap in the data (a stalled feed) starts the window again.
        if (next !== undefined && Math.abs(c.t0 - next) > c.dtMs / 2) filled = 0;
        next = c.t0 + c.values.length * c.dtMs;
        for (let k = 0; k < c.values.length; k++) {
          buf[at] = c.values[k] ?? 0;
          at = (at + 1) % WINDOW;
          filled = Math.min(WINDOW, filled + 1);
          const n = Math.round((c.t0 + k * c.dtMs) / c.dtMs);
          if (n % HOP === HOP - 1 && filled === WINDOW) {
            ordered.set(buf.subarray(at), 0);
            ordered.set(buf.subarray(0, at), WINDOW - at);
            const s = spectrumOf(ordered, rateKHz * 1000);
            const value: Spectrum = { machine, ts: c.t0 + k * c.dtMs, ...s };
            src.publish(of(machine, 'spectrum'), value);
          }
        }
      });
    },
    'latest',
  );
  return stopAll(off, meter.stop);
}

export const STATS_WINDOW_MS = 60_000;

/** Min, max and percentiles of each sensor over the last 60 s, once a second. */
export function runStats(src: Source, machine: MachineId): Stoppable {
  const meter = engineMeter(src, `stats-${machine}`);
  const windows = new Map<string, Window>();
  const push = (name: string, ts: number, v: number): void => {
    let w = windows.get(name);
    if (!w) {
      w = new Window(STATS_WINDOW_MS);
      windows.set(name, w);
    }
    w.push(ts, v);
  };
  const subs = [
    src.subscribe(
      of(machine, 'scalars'),
      (r) => {
        for (const k of SCALARS) push(k, r.value.ts, r.value[k]);
      },
      // A restarted engine picks the last minute back up from the topic.
      'earliest',
    ),
    src.subscribe(
      of(machine, 'spectrum'),
      (r) => {
        push('vib', r.value.ts, r.value.rms);
      },
      'earliest',
    ),
  ];
  const id = setInterval(() => {
    meter.time(() => {
      const sensors: Record<string, Summary> = {};
      for (const [k, w] of windows) {
        const s = summarize(w.values());
        if (s) sensors[k] = s;
      }
      if (Object.keys(sensors).length === 0) return;
      src.publish(of(machine, 'stats'), {
        machine,
        ts: Date.now(),
        windowMs: STATS_WINDOW_MS,
        sensors,
      });
    });
  }, 1_000);
  return stopAll(...subs, meter.stop, () => {
    clearInterval(id);
  });
}

const fmt = (sensor: keyof typeof SENSOR, v: number): string =>
  `${v.toFixed(sensor === 'vib' || sensor === 'pressure' ? 1 : 0)} ${SENSOR[sensor].unit}`;

/**
 * The health score once a second, and the alarms and events it implies: a
 * limit crossed raises an alarm, falling back below clears it, and a stop or
 * start is an event. A restarted engine reads its last health record back
 * first, so it doesn't raise an alarm twice.
 */
export function runHealth(src: Source, machine: MachineId): Stoppable {
  const meter = engineMeter(src, `health-${machine}`);
  let row: Scalars | undefined;
  let spec: Spectrum | undefined;
  let levels: Record<string, Level> = {};
  let running: boolean | undefined;
  let started = false;
  // Its own last record, read back once on start (a restart), then no more:
  // left subscribed it would get every record it publishes and ignore it.
  let ownHealth: (() => void) | undefined = src.subscribe(
    of(machine, 'health'),
    (r) => {
      if (started) return;
      levels = { ...r.value.levels };
      running = r.value.running;
    },
    'earliest',
  );
  const stopOwnHealth = (): void => {
    ownHealth?.();
    ownHealth = undefined;
  };
  const subs = [
    src.subscribe(
      of(machine, 'scalars'),
      (r) => {
        row = r.value;
      },
      'latest',
    ),
    src.subscribe(
      of(machine, 'spectrum'),
      (r) => {
        spec = r.value;
      },
      'latest',
    ),
  ];
  const id = setInterval(() => {
    if (!row) return;
    const s = row;
    meter.time(() => {
      started = true;
      stopOwnHealth();
      const ts = Date.now();
      const f0 = s.speed / 60;
      const r: Readings = {
        running: s.running,
        vibRms: spec?.rms ?? 0,
        bearing: spec && f0 > 1 ? amplitudeAt(spec.mags, spec.binHz, f0 * BEARING_ORDER) : 0,
        bearingTemp: s.bearingTemp,
        exhaustTemp: s.exhaustTemp,
        pressure: s.pressure,
      };
      if (running !== undefined && running !== r.running) {
        src.publish('events', {
          id: `${machine}-${r.running ? 'start' : 'stop'}-${ts}`,
          machine,
          kind: r.running ? 'start' : 'stop',
          text: r.running ? `${machine} started` : `${machine} stopped`,
          ts,
        });
      }
      running = r.running;
      for (const sensor of LIMITED_SENSORS) {
        const value = LIMITED[sensor](r);
        const prev = levels[sensor] ?? 'ok';
        const next = r.running ? levelOf(sensor, value, prev) : 'ok';
        if (next === prev) continue;
        levels[sensor] = next;
        const { label } = SENSOR[sensor];
        if (next === 'ok') {
          if (prev === 'ok') continue;
          const limit = (prev === 'alarm' ? SENSOR[sensor].alarm : SENSOR[sensor].warn) ?? 0;
          src.publish('alarms', {
            id: `${machine}-${sensor}-${ts}`,
            machine,
            sensor,
            level: prev,
            state: 'cleared',
            value,
            limit,
            ts,
          });
          src.publish('events', {
            id: `${machine}-${sensor}-clear-${ts}`,
            machine,
            kind: 'clear',
            text: `${machine} ${label.toLowerCase()} back to normal at ${fmt(sensor, value)}`,
            ts,
          });
          continue;
        }
        const limit = SENSOR[sensor][next] ?? 0;
        src.publish('alarms', {
          id: `${machine}-${sensor}-${ts}`,
          machine,
          sensor,
          level: next,
          state: 'active',
          value,
          limit,
          ts,
        });
        src.publish('events', {
          id: `${machine}-${sensor}-${next}-${ts}`,
          machine,
          kind: 'alarm',
          text: `${machine} ${label.toLowerCase()} ${fmt(sensor, value)}, over its ${next} limit of ${fmt(sensor, limit)}`,
          ts,
        });
      }
      const { score: sc, reasons } = score(r);
      const value: Health = {
        machine,
        ts,
        score: sc,
        status: statusOf(
          r.running,
          LIMITED_SENSORS.map((k) => levels[k] ?? 'ok'),
        ),
        vibRms: r.vibRms,
        bearing: r.bearing,
        bearingTemp: r.bearingTemp,
        exhaustTemp: r.exhaustTemp,
        power: s.power,
        speed: s.speed,
        reasons,
        running: r.running,
        levels: { ...levels },
      };
      src.publish(of(machine, 'health'), value);
    });
  }, 1_000);
  return stopAll(...subs, stopOwnHealth, meter.stop, () => {
    clearInterval(id);
  });
}

export const FLEET_WINDOW_MS = 120_000;

/** The fleet's figures once a second, from each machine's health records. */
export function runFleet(src: Source): Stoppable {
  const meter = engineMeter(src, 'fleet');
  const latest = new Map<MachineId, Health>();
  const power = new Map<MachineId, Window>(MACHINES.map((m) => [m, new Window(FLEET_WINDOW_MS)]));
  const subs = MACHINES.map((m) =>
    src.subscribe(
      of(m, 'health'),
      (r) => {
        latest.set(m, r.value);
        power.get(m)?.push(r.value.ts, r.value.power);
      },
      // The last 2 minutes, from the topic, after a restart.
      'earliest',
    ),
  );
  const id = setInterval(() => {
    if (latest.size === 0) return;
    meter.time(() => {
      const hs = MACHINES.map((m) => latest.get(m));
      const total = hs.reduce((n, h) => n + (h?.power ?? 0), 0);
      // Anomaly: the largest distance from the fleet over vibration and temperatures.
      const z = (k: 'vibRms' | 'bearingTemp' | 'exhaustTemp'): number[] =>
        zScores(hs.map((h) => h?.[k] ?? 0));
      const zs = [z('vibRms'), z('bearingTemp'), z('exhaustTemp')];
      const machines = MACHINES.map((machine, i) => {
        const h = hs[i];
        return {
          machine,
          status: h?.status ?? ('stopped' as const),
          score: h?.score ?? 0,
          power: h?.power ?? 0,
          bearingTemp: h?.bearingTemp ?? 0,
          anomaly: Math.max(...zs.map((zk) => Math.abs(zk[i] ?? 0))),
          load: total > 0 ? (h?.power ?? 0) / total : 0,
        };
      });
      src.publish('fleet', {
        ts: Date.now(),
        totalPower: total,
        meanHealth: machines.reduce((n, m) => n + m.score, 0) / machines.length,
        machines,
        correlation: correlationMatrix(MACHINES.map((m) => power.get(m)?.values() ?? [])),
      });
    });
  }, 1_000);
  return stopAll(...subs, meter.stop, () => {
    clearInterval(id);
  });
}

/** A machine's engines together, as its data pool or data worker runs them. */
export function runMachineEngines(src: Source, machine: MachineId, rateKHz: number): Stoppable {
  const all = [runFft(src, machine, rateKHz), runStats(src, machine), runHealth(src, machine)];
  return { stop: () => all.forEach((e) => e.stop()) };
}
