import { defineIsolate } from '@isoloop/runtime';
import { count, primes as primesTopic } from '../topics';
import { el, faults, reporter, reporting } from './dom';

const N = 10_000_000;
/** Embedded, C counts below this every 2.5 s: a short task, real work. */
const SMALL = 200_000;

function sieve(n: number): number {
  const marks = new Uint8Array(n + 1);
  let found = 0;
  for (let i = 2; i <= n; i++) {
    if (marks[i]) continue;
    found++;
    for (let j = i * i; j <= n; j += i) marks[j] = 1;
  }
  return found;
}

// C · Primes, in the pool with D. Counting takes its loop for a moment, and
// D's with it: they share one worker.
export default defineIsolate<HTMLElement>({
  start(ctx) {
    const { root } = ctx;
    if (!root) return;
    const report = reporter(ctx);
    const result = el('p', { class: 'mono', 'data-value': '' }, 'nothing counted yet');
    const last = el('p', { class: 'muted' }, 'Last count from A: -');
    const run = el('button', { class: 'primary' }, 'Count primes');
    const count10m = (limit: number): void => {
      report(() => {
        const t = performance.now();
        const found = sieve(limit);
        const ms = Math.round(performance.now() - t);
        const below = limit === N ? '10 million' : limit.toLocaleString('en');
        result.textContent = `${found.toLocaleString('en')} primes below ${below}, in ${ms} ms`;
        void ctx.bus.publish(primesTopic, { value: { count: found, ms } });
      });
    };
    run.addEventListener('click', () => count10m(N));
    ctx.bus.subscribe(count, (r) => {
      report(
        () => {
          last.textContent = `Last count from A: ${r.value}`;
        },
        { kind: 'read', topic: 'count.v1', offset: r.offset },
      );
    });
    if (reporting(ctx)) setInterval(() => count10m(SMALL), 2_500);
    root.append(
      el(
        'div',
        { class: 'stack' },
        result,
        el('div', { class: 'row' }, run),
        last,
        faults(ctx, 'C'),
      ),
    );
  },
});
