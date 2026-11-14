import { defineIsolate } from '@isoloop/runtime';
import { count } from '../topics';
import { el, faults } from './dom';

// A · Counter, on its own worker. Its count is on the bus, read from the
// start, so after a restart A picks up where it was.
export default defineIsolate<HTMLElement>({
  start(ctx) {
    const { root } = ctx;
    if (!root) return;
    let n = 0;
    const big = el('div', { class: 'big', 'data-value': '' }, '0');
    const inc = el('button', { class: 'primary' }, 'Increment');
    inc.addEventListener('click', () => {
      n++;
      big.textContent = String(n);
      void ctx.bus.publish(count, { value: n });
    });
    ctx.bus.subscribe(
      count,
      (r) => {
        if (r.value <= n) return;
        n = r.value;
        big.textContent = String(n);
      },
      { from: 'earliest' },
    );
    root.append(
      el(
        'div',
        { class: 'stack' },
        big,
        el('div', { class: 'row' }, inc),
        el(
          'p',
          { class: 'muted' },
          'Publishes count.v1. Restarted, it reads its count back from the bus.',
        ),
        faults(ctx, 'A'),
      ),
    );
  },
});
