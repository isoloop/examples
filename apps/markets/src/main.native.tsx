import { createRoot } from 'react-dom/client';
import { feeds } from './core/feeds';
import { runAggregator, runAlerts, runLiveFeed, runReplay } from './core/services';
import { store } from './native/store';
import { Page } from './page';
import { filtersFrom, replayConfig, startReplayClock, writeFilters } from './url';
import './page.css';
import './widgets/widgets.css';

declare global {
  interface Window {
    /** For the E2E suite: the native build's store. */
    store: typeof store;
  }
}
window.store = store;

// The same jobs as the Isoloop build's headless isolates, on the main thread.
const params = new URLSearchParams(location.search);
if (params.get('source') === 'live') {
  for (const feed of feeds) runLiveFeed(store, feed);
} else {
  const config = replayConfig(params);
  runReplay(store, config);
  startReplayClock(config);
}
// Filters from the URL (after a switch), and back into it as they change.
const initial = filtersFrom(params);
if (initial) store.publish('filters', initial, 'current');
store.subscribe(
  'filters',
  (r) => {
    writeFilters(r.value);
  },
  'latest',
);
runAggregator(store);
runAlerts(store);

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');
createRoot(root).render(<Page />);
