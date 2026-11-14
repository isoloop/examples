// /features/: one basic for the page's three live demos, started when the
// first of them comes into view; and the framework tabs.
import { recording } from '../copy.ts';
import { startBus } from './bus.ts';
import { Channel, supported, whenNear } from './channel.ts';
import { Recording } from './recording.ts';
import { startReplay } from './replay.ts';
import { startTabs } from './tabs.ts';

const tabs = document.querySelector<HTMLElement>('[data-tabs]');
if (tabs) startTabs(tabs);

const demos = [...document.querySelectorAll<HTMLElement>('[data-demo]')];
if (!supported()) {
  for (const d of demos) {
    const status = d.querySelector('.ui-status');
    if (status) status.textContent = recording.status.unsupported;
  }
} else {
  const channel = new Channel();
  for (const d of demos) {
    if (d.dataset['demo'] === 'recording') void new Recording(d, channel);
    else if (d.dataset['demo'] === 'bus') startBus(d, channel);
    else if (d.dataset['demo'] === 'replay') startReplay(d, channel);
    whenNear(d, () => channel.start());
  }
}
