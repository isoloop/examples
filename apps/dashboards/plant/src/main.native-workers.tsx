import { createRoot } from 'react-dom/client';
import { startWorkers } from './native/workers';
import { Page } from './page';
import { SETTINGS } from './url';
import './page.css';

// The fair native baseline (M3d decision 7): a data worker per machine for its
// feed and engines, widgets on the main thread.
startWorkers(SETTINGS);

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');
createRoot(root).render(<Page />);
