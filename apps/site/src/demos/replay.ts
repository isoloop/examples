// Retention and replay, live (/features/#replay; ADR 0002, as amended): note.v1
// as D really reads it. D subscribes from `earliest`; crash it and the kernel
// starts it again, and it reads every note the topic still retains. The cells
// it reads a second time are shaded.
import { featuresPage } from '../copy.ts';
import { type Channel, type Message, num, str } from './channel.ts';

const KEEP = 14;

export function startReplay(root: HTMLElement, channel: Channel): void {
  const cells = root.querySelector('.tape-cells');
  const status = root.querySelector<HTMLElement>('.ui-status');
  const button = root.querySelector<HTMLButtonElement>('button[data-act="crash-d"]');
  if (!cells || !status || !button) return;
  const s = featuresPage.replay.status;

  const notes = new Map<number, string>(); // offset → text
  const read = new Set<number>();
  const again = new Set<number>();
  let before: number | null = null; // the highest offset D read before its crash
  let settle: ReturnType<typeof setTimeout> | undefined;
  let holding = false;

  const render = (): void => {
    const offsets = [...notes.keys()].toSorted((a, b) => a - b).slice(-KEEP);
    cells.replaceChildren(
      ...offsets.map((o) => {
        const li = document.createElement('li');
        li.className = again.has(o) ? 'again' : read.has(o) ? 'read' : '';
        const off = document.createElement('small');
        off.textContent = String(o);
        const val = document.createElement('span');
        val.textContent = notes.get(o) ?? '';
        li.append(off, val);
        return li;
      }),
    );
  };

  button.addEventListener('click', () => {
    holding = true;
    button.disabled = true;
    before = read.size > 0 ? Math.max(...read) : null;
    again.clear();
    channel.send('crash-d');
    setTimeout(() => {
      holding = false;
      if (channel.reporting.has('D')) button.disabled = false;
    }, 5000);
  });

  channel.on((m: Message) => {
    const topic = str(m, 'topic');
    if (m.type === 'record' && topic === 'note.v1') {
      const offset = num(m, 'offset');
      if (offset !== undefined) notes.set(offset, `“${String(m['value'])}”`);
      render();
    } else if (m.type === 'activity' && str(m, 'id') === 'D') {
      if (!holding) button.disabled = false;
      if (str(m, 'kind') !== 'read' || topic !== 'note.v1') return;
      const offset = num(m, 'offset');
      if (offset === undefined) return;
      if (before !== null && offset <= before && read.has(offset)) {
        again.add(offset);
        clearTimeout(settle);
        settle = setTimeout(() => {
          status.textContent = s.again(again.size);
        }, 800);
      }
      read.add(offset);
      render();
    } else if (m.type === 'crash' && str(m, 'id') === 'D') {
      status.textContent = s.crashed;
    }
  });
}
