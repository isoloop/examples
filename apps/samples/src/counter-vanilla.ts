import { defineIsolate } from '@isoloop/runtime';
import { count } from './topics';

export default defineIsolate<HTMLElement>({
  start(ctx) {
    let n = 0;
    const button = document.createElement('button');
    const show = () => {
      button.textContent = `Count: ${n}`;
    };
    button.addEventListener('click', () => void ctx.bus.publish(count, { value: n + 1 }));
    ctx.bus.subscribe(
      count,
      (r) => {
        n = r.value;
        show();
      },
      { from: 'earliest' },
    );
    show();
    ctx.root?.append(button);
  },
});
