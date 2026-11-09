import { hostSource } from '#host';

/**
 * "Clear history" (M3d decision 5): marks the alarms and the event log as
 * cleared now; their widgets hide what came before. It runs on the page, on
 * the main thread, in every build.
 */
export function ClearHistory() {
  return (
    <button
      type="button"
      name="clear-history"
      onClick={() => {
        const ts = Date.now();
        hostSource.publish('cleared', { ts }, 'alarms');
        hostSource.publish('cleared', { ts }, 'events');
      }}
    >
      Clear history
    </button>
  );
}
