import { useUpdatesPerSec } from '../metrics/updates';

/**
 * A widget's header (M3c task 9b), drawn by the page on the main thread: the
 * widget, where it runs and its updates/s. The widget's stress controls sit at
 * the right of this row but are the widget's own, so on Isoloop they run on
 * its thread.
 */
export function Head({ slot, where }: { slot: string; where: string }) {
  const n = useUpdatesPerSec(slot);
  return (
    <div className="widget-head" aria-label={`${slot} header`}>
      <span className="widget-name">{slot}</span>
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
