import { defineIsolate } from '@isoloop/runtime';
import { count } from '../topics';
import { el, faults, reporter, reporting } from './dom';

// A · Counter, on its own worker. Its count is on the bus, read from the
// start, so after a restart A picks up where it was. Embedded in the site's
// demo, it also counts on its own every 0.6 s and reports each task.
export default defineIsolate<HTMLElement>({
  start(ctx) {
    const { root } = ctx;
    if (!root) return;
    const report = reporter(ctx);
    let n = 0;
    const big = el('div', { class: 'big', 'data-value': '' }, '0');
    const inc = el('button', { class: 'primary' }, 'Increment');
    const increment = (): void => {
      report(() => {
        n++;
        big.textContent = String(n);
        void ctx.bus.publish(count, { value: n });
      });
    };
    inc.addEventListener('click', increment);
    ctx.bus.subscribe(
      count,
      (r) => {
        if (r.value <= n) return;
        n = r.value;
        big.textContent = String(n);
      },
      { from: 'earliest' },
    );
    if (reporting(ctx)) setInterval(increment, 600);
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
