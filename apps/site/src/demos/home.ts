// The landing page's live recording: basic starts when it comes into view.
import { recording } from '../copy.ts';
import { Channel, supported, whenNear } from './channel.ts';
import { Recording } from './recording.ts';

const root = document.querySelector<HTMLElement>('[data-demo="recording"]');
if (root) {
  if (!supported()) {
    const status = root.querySelector('.ui-status');
    if (status) status.textContent = recording.status.unsupported;
  } else {
    const channel = new Channel();
    void new Recording(root, channel);
    whenNear(root, () => channel.start());
  }
}
