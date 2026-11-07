import { createRoot } from 'react-dom/client';
import { feeds } from './core/feeds';
import { runAggregator, runAlerts, runLiveFeed, runReplay } from './core/services';
import { store } from './native/store';
import { Page } from './page';
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
  runReplay(store, {
    speed: Number(params.get('speed')) || 1,
    seed: Number(params.get('seed')) || 1,
    tradesPerSecond: Number(params.get('tps')) || 2,
    ...(params.has('for') ? { durationMs: Number(params.get('for')) } : {}),
  });
}
runAggregator(store);
runAlerts(store);

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');
createRoot(root).render(<Page />);
