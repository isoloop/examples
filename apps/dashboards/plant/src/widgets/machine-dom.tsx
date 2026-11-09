// A machine's DOM widgets (M3d task 5): gauges (SVG), the health score, active
// alarms, the event log with its filter, and the sensor table. The same
// components render on the main thread (native) or in the widget's worker
// (Isoloop), where the page applies their DOM changes.
import { useLatest, useRecent } from '#env';
import { useMemo, useState } from 'react';
import { SCALARS, SENSOR, type ScalarName } from '../core/machines';
import type { Alarm, PlantEvent } from '../core/schemas';
import { of } from '../core/streams';
import { useClearedAt } from './history';
import { machineOf } from './props';

const sensorInfo = (s: string): { label: string; unit: string } | undefined =>
  Object.entries(SENSOR).find(([k]) => k === s)?.[1];

const time = (ts: number): string => new Date(ts).toLocaleTimeString('en-GB', { hour12: false });

/** A semicircle gauge from `min` to `max`, its arc coloured past `warn`. */
function Gauge({
  name,
  value,
  min,
  max,
  warn,
}: {
  name: ScalarName;
  value: number;
  min: number;
  max: number;
  warn?: number | undefined;
}) {
  const { label, unit } = SENSOR[name];
  const f = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const a = Math.PI * (1 - f);
  const x = 50 + 40 * Math.cos(a);
  const y = 50 - 40 * Math.sin(a);
  const over = warn !== undefined && value >= warn;
  return (
    <figure className="gauge" data-gauge={name} data-value={value.toFixed(2)}>
      <svg viewBox="0 0 100 58" role="img" aria-label={`${label} ${value.toFixed(1)} ${unit}`}>
        <path d="M10 50 A40 40 0 0 1 90 50" className="track" />
        <path
          d={`M10 50 A40 40 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`}
          className={over ? 'arc over' : 'arc'}
        />
        <text x="50" y="48" textAnchor="middle">
          {value.toFixed(name === 'pressure' ? 1 : 0)}
        </text>
      </svg>
      <figcaption>
        {label} <span className="unit">{unit}</span>
      </figcaption>
    </figure>
  );
}

export function Gauges({ config }: { config?: unknown }) {
  const m = machineOf(config);
  const row = useLatest(of(m, 'scalars'));
  if (!row) return <div className="waiting">waiting for data…</div>;
  return (
    <div className="gauges" data-ts={row.ts}>
      <Gauge name="speed" value={row.speed} min={0} max={3_500} />
      <Gauge name="power" value={row.power} min={0} max={1_000} />
      <Gauge name="pressure" value={row.pressure} min={0} max={12} warn={SENSOR.pressure.warn} />
    </div>
  );
}

export function HealthScore({ config }: { config?: unknown }) {
  const m = machineOf(config);
  const h = useLatest(of(m, 'health'));
  if (!h) return <div className="waiting">waiting for data…</div>;
  return (
    <div className="health" data-status={h.status}>
      <div className="score">{h.score}</div>
      <div className={`status ${h.status}`}>{h.status}</div>
      <ul className="reasons">
        {h.reasons.length === 0 ? <li>no issues</li> : h.reasons.map((r) => <li key={r}>{r}</li>)}
      </ul>
    </div>
  );
}

/**
 * The machine's alarms that are active now: the levels in its latest health
 * record, each with the alarm record that raised it (when, and the value).
 */
export function ActiveAlarms({ config }: { config?: unknown }) {
  const m = machineOf(config);
  const h = useLatest(of(m, 'health'));
  const recent = useRecent('alarms', 500, 'earliest');
  const clearedAt = useClearedAt('alarms');
  const raised = useMemo(() => {
    const by = new Map<string, Alarm>();
    for (const a of recent) if (a.machine === m && a.state === 'active') by.set(a.sensor, a);
    return by;
  }, [recent, m]);
  const active = Object.entries(h?.levels ?? {}).filter(([, level]) => level !== 'ok');
  return (
    <div className="alarms" data-count={active.length}>
      {active.length === 0 && <div className="none">No active alarms</div>}
      {active.map(([sensor, level]) => {
        const a = raised.get(sensor);
        const info = sensorInfo(sensor);
        return (
          <div key={sensor} className={`alarm ${level}`} data-sensor={sensor}>
            <span className="level">{level}</span>
            <span className="sensor">{info?.label ?? sensor}</span>
            {a && a.ts > clearedAt && (
              <span className="since">
                {a.value.toFixed(1)} {info?.unit} since {time(a.ts)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

const KINDS = ['all', 'alarm', 'clear', 'start', 'stop'] as const;

/** The machine's events, newest first, filtered by kind and by text. */
export function EventLog({ config }: { config?: unknown }) {
  const m = machineOf(config);
  const events = useRecent('events', 2_000, 'earliest');
  const clearedAt = useClearedAt('events');
  const [kind, setKind] = useState<(typeof KINDS)[number]>('all');
  const [text, setText] = useState('');
  const shown = useMemo(() => {
    const needle = text.trim().toLowerCase();
    const out: PlantEvent[] = [];
    for (let i = events.length - 1; i >= 0 && out.length < 100; i--) {
      const e = events[i];
      if (!e || e.machine !== m || e.ts <= clearedAt) continue;
      if (kind !== 'all' && e.kind !== kind) continue;
      if (needle && !e.text.toLowerCase().includes(needle)) continue;
      out.push(e);
    }
    return out;
  }, [events, m, clearedAt, kind, text]);
  return (
    <div className="events">
      <div className="event-filter">
        <select
          name="event-kind"
          aria-label="Event kind"
          value={kind}
          onChange={(e) => {
            const v = KINDS.find((k) => k === e.currentTarget.value);
            if (v) setKind(v);
          }}
        >
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <input
          name="event-text"
          aria-label="Filter events"
          placeholder="filter"
          value={text}
          onChange={(e) => {
            setText(e.currentTarget.value);
          }}
          autoComplete="off"
        />
      </div>
      <table>
        <tbody>
          {shown.map((e) => (
            <tr key={e.id} className={`event ${e.kind}`} data-kind={e.kind}>
              <td className="ts">{time(e.ts)}</td>
              <td>{e.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {shown.length === 0 && <div className="none">No events</div>}
    </div>
  );
}

const ROWS: (ScalarName | 'vib')[] = ['vib', ...SCALARS];

const n = (v: number, k: ScalarName | 'vib'): string =>
  v.toFixed(k === 'vib' || k === 'pressure' ? 2 : 0);

/** Each sensor over the last minute: last, min, max and percentiles. */
export function SensorTable({ config }: { config?: unknown }) {
  const m = machineOf(config);
  const s = useLatest(of(m, 'stats'));
  if (!s) return <div className="waiting">waiting for data…</div>;
  return (
    <div className="sensors-wrap">
      <table className="sensors" data-ts={s.ts}>
        <thead>
          <tr>
            <th>sensor</th>
            <th>last</th>
            <th>min</th>
            <th>p50</th>
            <th>p95</th>
            <th>p99</th>
            <th>max</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((k) => {
            const v = s.sensors[k];
            if (!v) return null;
            return (
              <tr key={k} data-sensor={k}>
                <th>{SENSOR[k].label}</th>
                <td>{n(v.last, k)}</td>
                <td>{n(v.min, k)}</td>
                <td>{n(v.p50, k)}</td>
                <td>{n(v.p95, k)}</td>
                <td>{n(v.p99, k)}</td>
                <td>{n(v.max, k)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
