/* oxlint-disable typescript/no-unsafe-argument, typescript/no-unsafe-assignment, typescript/no-unsafe-call, typescript/no-unsafe-member-access, typescript/no-unsafe-return, eslint/no-await-in-loop, eslint/no-unmodified-loop-condition, unicorn/prefer-add-event-listener --
   A sequential device driver over untyped inspector JSON: pages are recorded one after another on purpose,
   and `target` changes in the socket's message handler, which the loop-condition rule can't see. */
// Records the plant dashboard's own "Record 10 s" panel in Safari on an iPhone,
// through Safari's remote Web Inspector, via ios-webkit-debug-proxy (README).
//
//   node record.mjs [--ws ws://localhost:9222/devtools/page/1] [--rounds 2]
//                   [--wait 25] [--out <dir>] [--only 1,6]
//
// It never closes or force-quits Safari: each page replaces the last by
// navigation. Typing during the recording is synthetic (see TYPE below).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .reduce((a, v, i, all) => (v.startsWith('--') ? [...a, [v.slice(2), all[i + 1]]] : a), []),
);
const WS = args.ws ?? 'ws://localhost:9222/devtools/page/1';
const ROUNDS = Number(args.rounds ?? 2);
const WAIT_S = Number(args.wait ?? 25);
const OUT = args.out ?? 'results';
const BASE = 'https://isoloop.dev/examples/dashboards/plant/';
const PAGES = [
  'native/?rate=1',
  'isoloop/?rate=1&placement=one',
  'native-workers/?rate=1',
  'isoloop/?rate=1&placement=matched',
  'isoloop/?rate=1&placement=split',
  'native/?rate=5',
  'isoloop/?rate=5&placement=one',
  'native-workers/?rate=5',
  'isoloop/?rate=5&placement=matched',
  'isoloop/?rate=5&placement=split',
  'isoloop/?rate=5&placement=own',
];
const only = args.only ? new Set(args.only.split(',').map(Number)) : null;

// Synthetic typing: one keydown + value change + input event on the echo box
// every 100 ms while the panel records. These events are isTrusted=false;
// the page measures each from its dispatch time to the next frame, so the
// figure includes main-thread queueing after dispatch but not the OS input path.
const TYPE = `(() => {
  const box = document.querySelector('input[name="echo"]');
  if (!box) return 'no-echo';
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  let n = 0;
  const id = setInterval(() => {
    const ch = 'plant'[n++ % 5];
    box.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true }));
    set.call(box, (box.value + ch).slice(-40));
    box.dispatchEvent(new Event('input', { bubbles: true }));
  }, 100);
  setTimeout(() => clearInterval(id), 10_500);
  return 'typing';
})()`;
const RECORD = `(() => {
  const d = document.querySelector('details.record');
  const b = document.querySelector('button[name="record"]');
  if (!d || !b) return 'no-panel';
  d.open = true; b.click();
  return 'recording';
})()`;
const RESULT = `(() => document.querySelector('pre[data-record]')?.textContent ?? null)()`;

const ws = new WebSocket(WS);
let target = null;
let seq = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.method === 'Target.targetCreated' && !m.params.targetInfo.isProvisional)
    target = m.params.targetInfo.targetId;
  else if (m.method === 'Target.didCommitProvisionalTarget') target = m.params.newTargetId;
  else if (m.method === 'Target.dispatchMessageFromTarget') {
    const inner = JSON.parse(m.params.message);
    const p = pending.get(inner.id);
    if (p) {
      pending.delete(inner.id);
      if (inner.error) p.reject(new Error(inner.error.message));
      else p.resolve(inner.result);
    }
  }
};
const opened = new Promise((r, j) => {
  ws.onopen = r;
  ws.onerror = () => j(new Error('proxy websocket failed'));
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function send(method, params = {}, timeoutMs = 15_000) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(
      JSON.stringify({
        id: 100000 + id,
        method: 'Target.sendMessageToTarget',
        params: { targetId: target, message: JSON.stringify({ id, method, params }) },
      }),
    );
    setTimeout(() => {
      if (pending.delete(id)) reject(new Error(`${method} timed out`));
    }, timeoutMs);
  });
}
const evaluate = async (expression, timeoutMs) =>
  (await send('Runtime.evaluate', { expression, returnByValue: true }, timeoutMs)).result.value;

await opened;
for (let i = 0; i < 50 && !target; i++) await sleep(100);
if (!target) throw new Error('no page target: unlock the phone and open Safari');
mkdirSync(OUT, { recursive: true });

for (let round = 1; round <= ROUNDS; round++) {
  for (const [i, path] of PAGES.entries()) {
    const n = i + 1;
    if (only && !only.has(n)) continue;
    if (round > 1 && path.endsWith('placement=own')) continue; // own once
    const label = `r${round}-${String(n).padStart(2, '0')}-${path.replace(/[/?&=]+/g, '-').replace(/-$/, '')}`;
    const t0 = Date.now();
    let outcome;
    try {
      const before = target;
      await evaluate(`location.href = ${JSON.stringify(BASE + path)}; 'go'`).catch(() => 'go');
      for (let k = 0; k < 100 && target === before; k++) await sleep(100);
      await sleep(WAIT_S * 1000);
      const started = await evaluate(RECORD);
      const typing = await evaluate(TYPE);
      if (started !== 'recording') throw new Error(`panel: ${started}`);
      await sleep(11_000);
      let text = null;
      for (let k = 0; k < 20 && !text; k++) {
        text = await evaluate(RESULT).catch(() => null);
        if (!text) await sleep(500);
      }
      if (!text) throw new Error('no result');
      outcome = { ...JSON.parse(text), page: path, round, typing, synthetic: true };
    } catch (e) {
      outcome = { page: path, round, error: String(e.message ?? e), afterMs: Date.now() - t0 };
    }
    writeFileSync(join(OUT, `${label}.json`), JSON.stringify(outcome, null, 2) + '\n');
    console.log(
      label,
      outcome.error ??
        `fps ${outcome.fps} late ${outcome.framesLate} long ${outcome.longTasks} in ${outcome.inputMedianMs}/${outcome.inputWorstMs} first ${outcome.firstDataMs}`,
    );
  }
}
ws.close();
