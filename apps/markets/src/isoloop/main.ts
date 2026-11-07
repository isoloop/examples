import { createKernel, type Kernel } from '@isoloop/host';
import workers from 'virtual:isoloop/workers';
import hello from '../isolates/hello?isolate';

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');

const kernel = createKernel({ workers });
kernel.spawn({ id: 'hello', src: hello, surface: root, grants: { publish: [], subscribe: [] } });

declare global {
  interface Window {
    /** For the E2E suite. */
    kernel: Kernel;
  }
}
window.kernel = kernel;
