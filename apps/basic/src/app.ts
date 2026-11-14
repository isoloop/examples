// basic (website plan task 4b): four vanilla isolates on three event loops.
// A and B each have their own worker; C and D share the pool "shared".
import { createKernel, type Kernel } from '@isoloop/host';
import workers from 'virtual:isoloop/workers';
import list from './contracts';
import contractsUrl from './contracts?isolate';
import counter from './isolates/counter?isolate';
import messages from './isolates/messages?isolate';
import primes from './isolates/primes?isolate';
import ticker from './isolates/ticker?isolate';
import { blockMain, createPane, startFps } from './panes';
import surfaceCss from './surface.css?inline';

const $ = (id: string): HTMLElement => {
  const e = document.getElementById(id);
  if (!e) throw new Error(`#${id} missing`);
  return e;
};

/** A loop busy this long is killed and restarted: under Block's 3 s. */
export const KILL_AFTER_MS = 2_000;

const sheet = new CSSStyleSheet();
sheet.replaceSync(surfaceCss);

const kernel = createKernel({
  contracts: { url: contractsUrl, list },
  workers,
  styles: [sheet],
  heartbeat: { killAfterMs: KILL_AFTER_MS },
  // The page's links (the site's header) are ordinary links.
  routing: false,
});

declare global {
  interface Window {
    /** For the E2E tests and the curious: the page's kernel. */
    kernel: Kernel;
  }
}
window.kernel = kernel;

const POOL = 'shared';
const isolates = [
  {
    id: 'A',
    name: 'A · Counter',
    where: 'own worker',
    parent: 'own',
    src: counter,
    grants: { publish: ['count.v1'], subscribe: ['count.v1'] },
  },
  {
    id: 'B',
    name: 'B · Ticker',
    where: 'own worker',
    parent: 'own',
    src: ticker,
    grants: { publish: [], subscribe: [] },
  },
  {
    id: 'C',
    name: 'C · Primes',
    where: `pool "${POOL}"`,
    parent: 'pooled',
    pool: POOL,
    src: primes,
    grants: { publish: ['primes.v1'], subscribe: ['count.v1'] },
  },
  {
    id: 'D',
    name: 'D · Messages',
    where: `pool "${POOL}"`,
    parent: 'pooled',
    pool: POOL,
    src: messages,
    grants: { publish: ['note.v1'], subscribe: ['count.v1', 'note.v1', 'primes.v1'] },
  },
];

const panes = isolates.map(({ id, name, where, parent, pool, src, grants }) => {
  const pane = createPane($(parent), { id, name, where }, kernel);
  kernel.spawn({ id, src, surface: pane.body, grants, ...(pool ? { pool } : {}) });
  return pane;
});

setInterval(() => {
  const byId = new Map(kernel.isolates().map((s) => [s.id, s]));
  for (const pane of panes) pane.paint(byId.get(pane.id));
}, 100);

startFps($('fps'));
$('block-main').addEventListener('click', () => {
  blockMain(1_000);
});
