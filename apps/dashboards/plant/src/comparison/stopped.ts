// How the comparison summaries (scripts/compare.ts, comparison/run.ts) show a
// run whose page stopped: WebKit under Playwright on Linux can stop the
// Isoloop page outright (engine constraint 2). A stopped run is a result, so
// the tables say "stopped" instead of leaving the cell empty.

/** The part of a result file that says whether, and where, its page stopped. */
export type StoppedRun = {
  stopped: boolean;
  /** The phase the run had reached: load, warm-up, window, typing, hold, fault. */
  stage?: string | undefined;
  error?: string | undefined;
};

// oxlint-disable-next-line no-control-regex -- Playwright's terminal colours
const COLOURS = /\u001b\[[0-9;]*m/g;

/** "page stopped during typing (no reply in 10 s)", for a row or a note. */
export function stoppedLabel(r: StoppedRun): string {
  const why = (r.error ?? '').replace(COLOURS, '').trim();
  return `page stopped${r.stage ? ` during ${r.stage}` : ''}${why ? ` (${why})` : ''}`;
}

/** A figure's cell: its value, or "stopped" when it has none because every run of it stopped. */
export function cellOr(value: string, runs: readonly StoppedRun[]): string {
  return value === '–' && runs.length > 0 && runs.every((r) => r.stopped) ? 'stopped' : value;
}
