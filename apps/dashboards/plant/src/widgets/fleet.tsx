// The fleet widgets (M3d task 6): status grid, total power, anomaly ranking,
// load correlation heatmap, combined alarm feed, fleet trend, hottest
// bearings and load distribution. They read the fleet engine's records and
// the alarms, never a machine's raw data.
import { useLatest, useRecent } from '#env';
import { useMemo } from 'react';
import { MACHINES, SENSOR } from '../core/machines';
import { drawChart } from '../charts/canvas-chart';
import { drawHeatmap } from '../charts/heatmap';
import type { Ctx2D } from '../env/canvas';
import { useClearedAt } from './history';
import { Plot } from './Plot';

const time = (ts: number): string => new Date(ts).toLocaleTimeString('en-GB', { hour12: false });
const waiting = <div className="waiting">waiting for data…</div>;

export function FleetStatus() {
  const f = useLatest('fleet');
  if (!f) return waiting;
  return (
    <div className="fleet-status">
      {f.machines.map((m) => (
        <div
          key={m.machine}
          className={`tile ${m.status}`}
          data-machine={m.machine}
          data-status={m.status}
        >
          <span className="name">{m.machine}</span>
          <span className="score">{m.score}</span>
          <span className="status">{m.status}</span>
        </div>
      ))}
    </div>
  );
}

export function FleetPower() {
  const f = useLatest('fleet');
  if (!f) return waiting;
  const running = f.machines.filter((m) => m.status !== 'stopped').length;
  return (
    <div className="fleet-power">
      <div className="big" data-total={f.totalPower.toFixed(1)}>
        {(f.totalPower / 1000).toFixed(2)} <span className="unit">MW</span>
      </div>
      <div>
        {running} of {f.machines.length} running · mean health {f.meanHealth.toFixed(0)}
      </div>
    </div>
  );
}

export function AnomalyRanking() {
  const f = useLatest('fleet');
  if (!f) return waiting;
  const ranked = f.machines.toSorted((a, b) => b.anomaly - a.anomaly);
  return (
    <table className="ranking">
      <tbody>
        {ranked.map((m, i) => (
          <tr key={m.machine} data-machine={m.machine} data-anomaly={m.anomaly.toFixed(3)}>
            <td>{i + 1}</td>
            <th>{m.machine}</th>
            <td>{m.anomaly.toFixed(1)} σ</td>
            <td className={m.status}>{m.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function LoadCorrelation() {
  const f = useLatest('fleet');
  const draw = (ctx: Ctx2D, w: number, h: number): string | null => {
    if (!f) return null;
    drawHeatmap(ctx, w, h, MACHINES, f.correlation);
    return `${MACHINES.length}×${MACHINES.length}`;
  };
  return <Plot draw={draw} />;
}

/** Every machine's alarms, newest first. */
export function AlarmFeed() {
  const alarms = useRecent('alarms', 200, 'earliest');
  const clearedAt = useClearedAt('alarms');
  const shown = useMemo(
    () =>
      alarms
        .filter((a) => a.ts > clearedAt)
        .slice(-50)
        .toReversed(),
    [alarms, clearedAt],
  );
  return (
    <div className="alarm-feed">
      {shown.length === 0 && <div className="none">No alarms</div>}
      {shown.map((a) => (
        <div
          key={a.id}
          className={`feed-alarm ${a.state === 'active' ? a.level : 'cleared'}`}
          data-machine={a.machine}
          data-sensor={a.sensor}
        >
          <span className="ts">{time(a.ts)}</span> <b>{a.machine}</b> {a.sensor}{' '}
          {a.state === 'active' ? a.level : 'cleared'} {a.value.toFixed(1)}
        </div>
      ))}
    </div>
  );
}

/** Five minutes of total power and mean health. */
export function FleetTrend() {
  const rows = useRecent('fleet', 300, 'earliest');
  const draw = (ctx: Ctx2D, w: number, h: number): string | null => {
    if (rows.length === 0) return null;
    const half = Math.floor(h / 2);
    drawChart(
      ctx,
      w,
      half,
      [
        {
          label: 'power MW',
          color: '#4e79a7',
          points: rows.map((r) => [r.ts, r.totalPower / 1000] as const),
        },
      ],
      { title: '', format: (v) => v.toFixed(2) },
    );
    ctx.save();
    ctx.translate(0, half);
    drawChart(
      ctx,
      w,
      h - half,
      [
        {
          label: 'mean health',
          color: '#59a14f',
          points: rows.map((r) => [r.ts, r.meanHealth] as const),
        },
      ],
      { title: '', format: (v) => v.toFixed(0) },
    );
    ctx.restore();
    return `${rows.length} points`;
  };
  return <Plot draw={draw} />;
}

export function HottestBearings() {
  const f = useLatest('fleet');
  if (!f) return waiting;
  const { warn = Infinity, alarm = Infinity } = SENSOR.bearingTemp;
  const hottest = f.machines.toSorted((a, b) => b.bearingTemp - a.bearingTemp);
  return (
    <table className="bearings">
      <tbody>
        {hottest.map((m) => (
          <tr key={m.machine} data-machine={m.machine} data-temp={m.bearingTemp.toFixed(2)}>
            <th>{m.machine}</th>
            <td className={m.bearingTemp >= alarm ? 'alarm' : m.bearingTemp >= warn ? 'warn' : ''}>
              {m.bearingTemp.toFixed(1)} °C
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function LoadDistribution() {
  const f = useLatest('fleet');
  if (!f) return waiting;
  return (
    <div className="load">
      {f.machines.map((m) => (
        <div
          key={m.machine}
          className="load-row"
          data-machine={m.machine}
          data-share={m.load.toFixed(4)}
        >
          <span className="name">{m.machine}</span>
          <span className="bar" style={{ width: `${(m.load * 100 * 4).toFixed(1)}%` }} />
          <span className="pct">{(m.load * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}
