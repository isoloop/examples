import { defineIsolate } from '@isoloop/runtime';
import { count, note, primes } from '../topics';
import { el, faults, reporter, reporting } from './dom';

/** Embedded, D sends one of these every 2.4 s. */
const NOTES = ['restock T3', 'valve 7 ok', 'filter swapped', 'check pump 2', 'shift handover'];

// D · Messages, in the pool with C. Its log is built only from the bus, read
// from the start, so a restarted D shows the same history. Embedded, it also
// sends notes on its own, and every 11 s an empty one, which the bus rejects:
// the schema needs at least one character.
export default defineIsolate<HTMLElement>({
  start(ctx) {
    const { root } = ctx;
    if (!root) return;
    const report = reporter(ctx);
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
    ctx.bus.subscribe(
      count,
      (r) => {
        report(() => push(`${r.producer} count = ${r.value}`), {
          kind: 'read',
          topic: 'count.v1',
          offset: r.offset,
        });
      },
      from,
    );
    ctx.bus.subscribe(
      note,
      (r) => {
        report(() => push(`${r.producer} note: ${r.value}`), {
          kind: 'read',
          topic: 'note.v1',
          offset: r.offset,
        });
      },
      from,
    );
    ctx.bus.subscribe(
      primes,
      (r) => {
        report(() => push(`${r.producer} primes = ${r.value.count.toLocaleString('en')}`), {
          kind: 'read',
          topic: 'primes.v1',
          offset: r.offset,
        });
      },
      from,
    );

    const input = el('input', { placeholder: 'Write a note', 'aria-label': 'Note' });
    const sendButton = el('button', { class: 'primary' }, 'Send');
    const publishNote = async (text: string): Promise<void> => {
      try {
        await ctx.bus.publish(note, { value: text });
      } catch (e) {
        push(`note rejected: ${e instanceof Error ? e.message : String(e)}`);
        report(() => undefined, { kind: 'rejected', topic: 'note.v1' });
      }
    };
    const send = async (): Promise<void> => {
      const draft = input.value;
      if (!draft.trim()) return;
      ctx.setValue(input, '', { force: true });
      await publishNote(draft);
    };
    sendButton.addEventListener('click', () => void send());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') void send();
    });
    if (reporting(ctx)) {
      let i = 0;
      setInterval(() => {
        const text = NOTES[i++ % NOTES.length] ?? 'ok';
        void publishNote(text);
      }, 2_400);
      setInterval(() => void publishNote(''), 11_000);
    }
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
