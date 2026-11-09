import { createRoot } from 'react-dom/client';
import { headlessJobs } from './isoloop/headless';
import { kernel } from './isoloop/kernel';
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

// The feeds and engines as headless isolates (M3d tasks 2 and 3).
for (const j of headlessJobs(SETTINGS.seed, SETTINGS.rate)) {
  kernel.spawn({
    id: j.id,
    src: j.src,
    grants: j.grants,
    ...(j.config === undefined ? {} : { config: j.config }),
  });
}

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');
createRoot(root).render(<Page />);
