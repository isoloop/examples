import { createRoot } from 'react-dom/client';
import { MACHINES } from './core/machines';
import feed from './isolates/feed?isolate';
import { kernel } from './isoloop/kernel';
import { machineTopics } from './isoloop/names';
import { Page } from './page';
import { SETTINGS } from './url';
import './page.css';

declare global {
  interface Window {
    /** For the E2E suite. */
    kernel: typeof kernel;
  }
}
window.kernel = kernel;

// A feed isolate per machine (M3d task 2).
for (const m of MACHINES) {
  kernel.spawn({
    id: `feed-${m}`,
    src: feed,
    config: { machine: m, seed: SETTINGS.seed, rateKHz: SETTINGS.rate },
    grants: { publish: [machineTopics(m)], subscribe: [] },
  });
}

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');
createRoot(root).render(<Page />);
