import { useUpdatesPerSec } from '../metrics/updates';

/**
 * A widget's header, drawn by the page on the main thread: the widget, where
 * it runs (M3d decision 8: `pool T3`, `pool fleet`, `worker 41` or `main
 * thread`) and its updates/s. The widget's stress controls sit at the right
 * of this row but are the widget's own, so on Isoloop they run on its thread.
 */
export function Head({ slot, title, where }: { slot: string; title: string; where: string }) {
  const n = useUpdatesPerSec(slot);
  return (
    <div className="widget-head" aria-label={`${slot} header`}>
      <span className="widget-name" title={slot}>
        {title}
      </span>
      <span data-head="where">{where}</span>
      <span
        data-head="updates"
        title="How often this widget's output changed in the last second: frames in which the page applied a change to its DOM, or its canvas draws (at most one a frame)"
      >
        {n === null ? '—' : n} updates/s
      </span>
    </div>
  );
}
