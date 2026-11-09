import { createRoot } from 'react-dom/client';
import { headlessJobs } from './isoloop/headless';
import { kernel } from './isoloop/kernel';
import { poolOf } from './isoloop/placement';
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

// The feeds and engines as headless isolates (M3d tasks 2 and 3), in the
// placement's pools (decision 6).
for (const j of headlessJobs(SETTINGS.seed, SETTINGS.rate)) {
  const pool = poolOf(SETTINGS.placement, {
    kind: j.kind,
    ...(j.machine ? { machine: j.machine } : {}),
  });
  kernel.spawn({
    id: j.id,
    src: j.src,
    grants: j.grants,
    ...(j.config === undefined ? {} : { config: j.config }),
    ...(pool === undefined ? {} : { pool }),
  });
}

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');
createRoot(root).render(<Page />);
