// A manual recording (M3d task 11's phone run): 10 s of the page's own
// measurements, as JSON to copy into the results. Type into the echo box
// while it records, so input latency has keystrokes to measure.
import { buildMetrics } from '#metrics';
import { useState } from 'react';
import { CURRENT } from '../builds';
import { SETTINGS } from '../url';
import { mainThreadMetrics } from './main-thread';

const RECORD_MS = 10_000;
const read = mainThreadMetrics();

const quantile = (xs: number[], q: number): number =>
  xs.toSorted((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(xs.length * q))] ?? 0;

export function Record() {
  // 'idle', 'recording', or the result as JSON.
  const [state, setState] = useState('idle');
  const start = (): void => {
    setState('recording');
    const frames0 = window.tape.frames;
    setTimeout(() => {
      const n = window.tape.frames - frames0;
      const gaps = window.tape.gaps.slice(-n);
      const m = read();
      const nav = navigator as Navigator & { deviceMemory?: number };
      const result = {
        build: CURRENT,
        placement: CURRENT === 'isoloop' ? SETTINGS.placement : null,
        rate: SETTINGS.rate,
        fps: Math.round((n / RECORD_MS) * 10_000) / 10,
        frameP95Ms: Math.round(quantile(gaps, 0.95) * 10) / 10,
        framesLate: gaps.filter((g) => g > 25).length,
        longTasks: m.longTasks,
        inputMedianMs: m.inputMedianMs,
        inputWorstMs: m.inputLatencyMs,
        firstDataMs: m.firstDataMs === null ? null : Math.round(m.firstDataMs),
        workers: buildMetrics.read().workers,
        cores: navigator.hardwareConcurrency,
        deviceMemoryGb: nav.deviceMemory ?? null,
        userAgent: navigator.userAgent,
        at: new Date().toISOString(),
      };
      setState(JSON.stringify(result, null, 2));
    }, RECORD_MS);
  };
  return (
    <details className="record">
      <summary>Record 10 s (for a manual run, e.g. on a phone)</summary>
      <p>
        Press record, then type into the box above until it finishes. Copy the result into the
        comparison's results.
      </p>
      <button type="button" name="record" disabled={state === 'recording'} onClick={start}>
        {state === 'recording' ? 'Recording…' : 'Record'}
      </button>
      {state !== 'idle' && state !== 'recording' && <pre data-record>{state}</pre>}
    </details>
  );
}
