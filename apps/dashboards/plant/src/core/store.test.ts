import { describe, expect, it } from 'vitest';
import { scalarsAt, vibChunk } from './sensors/signals';
import { Store } from './store';
import type { Rec } from './streams';

class MemoryStorage implements Storage {
  readonly #data = new Map<string, string>();
  get length(): number {
    return this.#data.size;
  }
  clear(): void {
    this.#data.clear();
  }
  getItem(k: string): string | null {
    return this.#data.get(k) ?? null;
  }
  key(i: number): string | null {
    return [...this.#data.keys()][i] ?? null;
  }
  removeItem(k: string): void {
    this.#data.delete(k);
  }
  setItem(k: string, v: string): void {
    this.#data.set(k, v);
  }
}

const alarm = (i: number) => ({
  id: `a${i}`,
  machine: 'T1' as const,
  sensor: 'vib',
  level: 'warn' as const,
  state: 'active' as const,
  value: 8,
  limit: 7.1,
  ts: i,
});

describe('the store', () => {
  it('keeps the last 30 s of vibration for a new subscriber', () => {
    const s = new Store();
    for (let i = 0; i < 1_200; i++) s.publish('T1.vib', vibChunk(1, 'T1', 1, 36_000_000_000 + i));
    const replayed: Rec<unknown>[] = [];
    s.subscribe('T1.vib', (r) => replayed.push(r), 'earliest');
    expect(replayed).toHaveLength(601); // 30 s of 50 ms chunks, both ends
  });

  it('caps alarms at 10,000 and keeps them in storage', async () => {
    const storage = new MemoryStorage();
    const s = new Store(storage);
    for (let i = 0; i < 10_500; i++) s.publish('alarms', alarm(i));
    expect(s.records('alarms')).toHaveLength(10_000);
    expect(s.records('alarms')[0]?.value).toMatchObject({ id: 'a500' });
    await new Promise((r) => setTimeout(r, 1_100));
    const again = new Store(storage);
    expect(again.records('alarms')).toHaveLength(10_000);
    // Slow signals are memory only.
    s.publish('T1.scalars', scalarsAt(1, 'T1', 0));
    expect(new Store(storage).records('T1.scalars')).toHaveLength(0);
  });
});
