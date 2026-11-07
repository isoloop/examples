import { useKeyed, usePublish, useRecent } from '#env';
import { useState } from 'react';
import { SYMBOLS, type AlertRule, type Metric, type Sym } from '../../core/schemas';

const METRICS: readonly Metric[] = ['price', 'vwap', 'spread'];
const OPS = ['above', 'below'] as const;
/** Alerts shown, newest first. */
const SHOWN = 50;

type Rule = Extract<AlertRule, { removed: false }>;

const time = (ts: number): string => new Date(ts).toISOString().slice(11, 19);

/** The rule editor (alert-rules.v1) and the alerts that fired (alerts.v1). */
export function AlertsPanel() {
  const rules = useKeyed('alertRules');
  const alerts = useRecent('alerts', SHOWN, 'earliest');
  const publish = usePublish('alertRules');
  const [symbol, setSymbol] = useState<Sym>('BTC-USD');
  const [metric, setMetric] = useState<Metric>('price');
  const [op, setOp] = useState<(typeof OPS)[number]>('above');
  const [threshold, setThreshold] = useState('');

  const live = [...rules.values()].filter((r): r is Rule => !r.removed);
  const value = Number(threshold);
  const valid = threshold.trim() !== '' && Number.isFinite(value);

  return (
    <div className="alerts">
      <form
        className="rule-editor"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          const id = crypto.randomUUID();
          publish({ removed: false, id, symbol, metric, op, threshold: value }, id);
          setThreshold('');
        }}
      >
        <select
          name="rule-symbol"
          aria-label="Symbol"
          value={symbol}
          onChange={(e) => {
            const s = SYMBOLS.find((x) => x === e.currentTarget.value);
            if (s) setSymbol(s);
          }}
        >
          {SYMBOLS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          name="rule-metric"
          aria-label="Metric"
          value={metric}
          onChange={(e) => {
            const m = METRICS.find((x) => x === e.currentTarget.value);
            if (m) setMetric(m);
          }}
        >
          {METRICS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          name="rule-op"
          aria-label="Condition"
          value={op}
          onChange={(e) => {
            const o = OPS.find((x) => x === e.currentTarget.value);
            if (o) setOp(o);
          }}
        >
          {OPS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <input
          name="rule-threshold"
          aria-label="Threshold"
          inputMode="decimal"
          placeholder="threshold"
          value={threshold}
          onChange={(e) => {
            setThreshold(e.currentTarget.value);
          }}
        />
        <button type="submit" disabled={!valid}>
          Add rule
        </button>
      </form>
      <ul className="rules">
        {live.map((r) => (
          <li key={r.id} data-rule={r.id}>
            {r.symbol} {r.metric} {r.op} {r.threshold}{' '}
            <button
              type="button"
              aria-label="Remove rule"
              onClick={() => {
                publish({ removed: true, id: r.id }, r.id);
              }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <ol className="fired">
        {alerts.toReversed().map((a) => (
          <li key={`${a.ruleId}-${a.ts}`} data-alert={a.ruleId}>
            {time(a.ts)} {a.symbol} {a.metric} {a.op} {a.threshold}: {a.value.toFixed(2)}
          </li>
        ))}
      </ol>
    </div>
  );
}
