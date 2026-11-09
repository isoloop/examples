import { createRoot } from 'react-dom/client';
import { runFleet, runMachineEngines } from './core/engines';
import { MACHINES } from './core/machines';
import { runFeed } from './core/sensors/feed';
import { store } from './native/store';
import { Page } from './page';
import { SETTINGS } from './url';
import './page.css';
import './widgets/widgets.css';

// The same jobs as the Isoloop build's headless isolates, on the main thread.
for (const machine of MACHINES) {
  runFeed(store, { machine, seed: SETTINGS.seed, rateKHz: SETTINGS.rate });
  runMachineEngines(store, machine, SETTINGS.rate);
}
runFleet(store);

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');
createRoot(root).render(<Page />);
