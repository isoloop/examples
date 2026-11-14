/** @jsxImportSource preact */
import { defineIsolate, usePublish, useTopic } from '@isoloop/preact';
import { count } from './topics';

function Counter() {
  const n = useTopic(count, { from: 'earliest' }) ?? 0;
  const publish = usePublish(count);
  return <button onClick={() => void publish(n + 1)}>Count: {n}</button>;
}

export default defineIsolate(Counter);
