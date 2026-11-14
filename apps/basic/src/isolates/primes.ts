import { defineIsolate } from '@isoloop/runtime';
import { count, primes as primesTopic } from '../topics';
import { el, faults } from './dom';

const N = 10_000_000;

// C · Primes, in the pool with D. Counting takes its loop for a moment, and
// D's with it: they share one worker.
export default defineIsolate<HTMLElement>({
  start(ctx) {
    const { root } = ctx;
    if (!root) return;
    const result = el('p', { class: 'mono', 'data-value': '' }, 'nothing counted yet');
    const last = el('p', { class: 'muted' }, 'Last count from A: -');
    const run = el('button', { class: 'primary' }, 'Count primes');
    run.addEventListener('click', () => {
      const t = performance.now();
      const sieve = new Uint8Array(N + 1);
      let found = 0;
      for (let i = 2; i <= N; i++) {
        if (sieve[i]) continue;
        found++;
        for (let j = i * i; j <= N; j += i) sieve[j] = 1;
      }
      const ms = Math.round(performance.now() - t);
      result.textContent = `${found.toLocaleString('en')} primes below 10 million, in ${ms} ms`;
      void ctx.bus.publish(primesTopic, { value: { count: found, ms } });
    });
    ctx.bus.subscribe(count, (r) => {
      last.textContent = `Last count from A: ${r.value}`;
    });
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
