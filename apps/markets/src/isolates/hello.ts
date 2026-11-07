import { defineIsolate } from '@isoloop/runtime';

// The smallest isolate: it proves the packages from npm install, build and run
// (M3b task 1). The dashboard's isolates replace it.
export default defineIsolate<HTMLElement>({
  start(ctx) {
    const p = document.createElement('p');
    p.id = 'hello';
    p.textContent = 'Hello from an isolate';
    ctx.root?.append(p);
  },
});
