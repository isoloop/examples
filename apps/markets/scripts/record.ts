// Records the live feeds as ticks (src/core/replay/tick.ts), one JSON line
// each, for local replays. Recordings stay out of git (fixtures/ticks/ is
// ignored): exchanges' terms rarely allow publishing their market data, so the
// committed replay source is synthesized.
//
//   node scripts/record.ts [seconds=30] [exchange…]
import { createWriteStream, mkdirSync } from 'node:fs';
import { runnerImport } from 'vite';
import type * as Feeds from '../src/core/feeds/index.ts';

// The app's modules import without extensions, as Vite resolves them; Vite's
// module runner loads them here the same way.
const { module: m } = await runnerImport<typeof Feeds>('./src/core/feeds/index.ts');
const { feeds, runFeed, SYMBOLS } = m;
const [secondsArg, ...names] = process.argv.slice(2);
const seconds = Number(secondsArg) || 30;
const chosen = names.length > 0 ? feeds.filter((f) => names.includes(f.exchange)) : feeds;

mkdirSync('fixtures/ticks', { recursive: true });
const file = `fixtures/ticks/${new Date().toISOString().replaceAll(':', '-')}.jsonl`;
const out = createWriteStream(file);
const start = Date.now();
const counts = new Map<string, number>();
const count = (k: string): void => {
  counts.set(k, (counts.get(k) ?? 0) + 1);
};

const running = chosen.map((feed) =>
  runFeed(feed, SYMBOLS, {
    trade: (rec) => {
      count(`${feed.exchange} trades`);
      out.write(`${JSON.stringify({ t: Date.now() - start, kind: 'trade', rec })}\n`);
    },
    book: (rec) => {
      count(`${feed.exchange} books`);
      out.write(`${JSON.stringify({ t: Date.now() - start, kind: 'book', rec })}\n`);
    },
    quote: () => {
      count(`${feed.exchange} quotes`);
    },
    status: (s, d) => {
      console.log(`${feed.exchange}: ${s}${d ? ` (${d})` : ''}`);
    },
  }),
);

setTimeout(() => {
  for (const r of running) r.stop();
  out.end();
  console.log(`${file}:`, Object.fromEntries(counts));
}, seconds * 1000);
