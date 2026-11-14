import { defineIsolate } from '@isoloop/runtime';
import { count, note, primes } from '../topics';
import { el, faults } from './dom';

// D · Messages, in the pool with C. Its log is built only from the bus, read
// from the start, so a restarted D shows the same history.
export default defineIsolate<HTMLElement>({
  start(ctx) {
    const { root } = ctx;
    if (!root) return;
    const lines: string[] = [];
    let read = 0;
    const log = el('ul', { class: 'log' }, el('li', {}, 'Waiting for records…'));
    const stats = el('p', { class: 'muted mono', 'data-value': '' }, '0 records read');
    const push = (line: string): void => {
      read++;
      stats.textContent = `${read} records read`;
      lines.unshift(line);
      lines.length = Math.min(lines.length, 5);
      log.replaceChildren(...lines.map((l) => el('li', {}, l)));
    };
    const from = { from: 'earliest' as const };
    ctx.bus.subscribe(count, (r) => push(`${r.producer} count = ${r.value}`), from);
    ctx.bus.subscribe(note, (r) => push(`${r.producer} note: ${r.value}`), from);
    ctx.bus.subscribe(
      primes,
      (r) => push(`${r.producer} primes = ${r.value.count.toLocaleString('en')}`),
      from,
    );

    const input = el('input', { placeholder: 'Write a note', 'aria-label': 'Note' });
    const sendButton = el('button', { class: 'primary' }, 'Send');
    const send = async (): Promise<void> => {
      const draft = input.value;
      if (!draft.trim()) return;
      ctx.setValue(input, '', { force: true });
      try {
        await ctx.bus.publish(note, { value: draft });
      } catch (e) {
        push(`note rejected: ${e instanceof Error ? e.message : String(e)}`);
      }
    };
    sendButton.addEventListener('click', () => void send());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') void send();
    });
    root.append(
      el(
        'div',
        { class: 'stack' },
        el('div', { class: 'row' }, input, sendButton),
        log,
        stats,
        faults(ctx, 'D'),
      ),
    );
  },
});
