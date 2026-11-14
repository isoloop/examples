// The message bus, live (/features/#bus; ADR 0002, as amended): basic's real
// records on count.v1, primes.v1 and note.v1 with their offsets, where each
// reader has got (D's and C's reads, reported on activity.v1), and the empty
// note D sends every 11 s, which the bus really rejects for its schema.
import { featuresPage } from '../copy.ts';
import { type Channel, type Message, num, str } from './channel.ts';

type Entry = { offset: number | null; text: string; rejected?: boolean };

const KEEP = 7;

function show(topic: string, value: unknown): string {
  if (topic === 'primes.v1' && typeof value === 'object' && value !== null) {
    const c: unknown = Reflect.get(value, 'count');
    return typeof c === 'number' ? `${c.toLocaleString('en')} primes` : '';
  }
  if (topic === 'note.v1') return `“${String(value)}”`;
  return String(value);
}

export function startBus(root: HTMLElement, channel: Channel): void {
  const entries = new Map<string, Entry[]>();
  const reads = new Map<string, Map<string, number>>(); // topic → reader → offset
  let dirty = false;

  const render = (): void => {
    dirty = false;
    for (const box of root.querySelectorAll<HTMLElement>('.topic')) {
      const topic = box.dataset['topic'] ?? '';
      const list = box.querySelector('.recs');
      const readers = box.querySelector('.readers');
      if (!list || !readers) continue;
      const at = reads.get(topic) ?? new Map<string, number>();
      list.replaceChildren(
        ...(entries.get(topic) ?? []).map((e) => {
          const li = document.createElement('li');
          li.className = e.rejected ? 'rec rejected' : 'rec';
          const off = document.createElement('small');
          off.textContent = e.rejected ? featuresPage.bus.rejected : String(e.offset);
          const val = document.createElement('span');
          val.textContent = e.text;
          li.append(off, val);
          const who = [...at]
            .filter(([, o]) => o === e.offset)
            .map(([r]) => r)
            .toSorted();
          if (who.length > 0 && !e.rejected) {
            const tags = document.createElement('span');
            tags.className = 'tags';
            for (const r of who) {
              const b = document.createElement('b');
              b.textContent = r;
              b.dataset['reader'] = r;
              tags.append(b);
            }
            li.append(tags);
          }
          return li;
        }),
      );
      readers.textContent = '';
    }
  };
  const later = (): void => {
    if (dirty) return;
    dirty = true;
    setTimeout(render, 120);
  };

  const push = (topic: string, e: Entry): void => {
    const list = entries.get(topic) ?? [];
    list.push(e);
    while (list.length > KEEP) list.shift();
    entries.set(topic, list);
    later();
  };

  channel.on((m: Message) => {
    const topic = str(m, 'topic');
    if (!topic) return;
    if (m.type === 'record') {
      const offset = num(m, 'offset');
      if (offset !== undefined) push(topic, { offset, text: show(topic, m['value']) });
    } else if (m.type === 'activity') {
      const kind = str(m, 'kind');
      const id = str(m, 'id');
      if (kind === 'read' && id) {
        const offset = num(m, 'offset');
        if (offset === undefined) return;
        const at = reads.get(topic) ?? new Map<string, number>();
        at.set(id, offset);
        reads.set(topic, at);
        later();
      } else if (kind === 'rejected') {
        push(topic, { offset: null, text: '“” (empty)', rejected: true });
      }
    }
  });
}
