import { defineIsolate } from '@isoloop/runtime';
import { el, faults, reporter } from './dom';

// B · Ticker, on its own worker: a timer 20 times a second. It keeps time while
// any other isolate is blocked, and stops on screen (not in its loop) while
// the main thread is. Embedded, it reports every fourth tick.
export default defineIsolate<HTMLElement>({
  start(ctx) {
    const { root } = ctx;
    if (!root) return;
    const report = reporter(ctx);
    const start = Date.now();
    const big = el('div', { class: 'big mono', 'data-value': '' }, '0.0 s');
    let tick = 0;
    const show = (): void => {
      big.textContent = `${((Date.now() - start) / 1000).toFixed(1)} s`;
    };
    setInterval(() => {
      if (++tick % 4 === 0) report(show);
      else show();
    }, 50);
    root.append(
      el(
        'div',
        { class: 'stack' },
        big,
        el('p', { class: 'muted' }, 'Time since this loop started, updated 20 times a second.'),
        faults(ctx, 'B'),
      ),
    );
  },
});
