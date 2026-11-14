// Every text on the site, in one place (plan task 9).
//
// Rules for anyone editing it (ADR 0002, decision 10): Isoloop is a complete
// toolchain, not a speed fix; never "faster than native"; performance as
// measurements, with the device, the build and the tag; the cost stated
// plainly next to what it gives. Every figure names its source in the comment
// above it.

/** A table row: its heading, then one cell per column. */
type Row = [string, ...string[]];

export const site = {
  description:
    'Isoloop runs each part of a web app in its own worker and connects them through a message bus with replay. A part that blocks or crashes is stopped, restarted and caught up while the rest of the page keeps running.',
};

export const home = {
  title: 'Isoloop: code that shares data shouldn’t share an event loop',
  hero: {
    // Headline candidates are in the copy PR; this is candidate 1.
    heading: 'Code that shares data shouldn’t share an event loop',
    points: [
      'Containment and restart. Each isolate runs in a worker. One that blocks or crashes is stopped, restarted and caught up from the bus, and the rest of the page keeps running.',
      'A message bus in its own worker. Typed topics with retention and replay, and durable history in OPFS that survives a reload.',
      'Placement is a switch. Give an isolate its own worker or share a pool, and write it with React, Preact or plain DOM.',
    ],
    primary: 'Open the plant dashboard live',
    secondary: 'How it works',
  },
  demo: {
    heading: 'Try it',
    text: 'Four isolates on three event loops. A and B have a worker each; C and D share a pool. Block or crash any of them, or block the main thread, and see what keeps running. Blocking C also stalls D, because a pool is a unit of failure.',
    frameTitle: 'Basic: four isolates, two of them in a pool',
    open: 'Open basic on its own page',
  },
  gives: {
    heading: 'What it gives',
    // Source: apps/dashboards/plant/README.md, "What each build does when
    // something goes wrong" (comparison/final/, Chromium, 1 kHz).
    caption:
      'The plant dashboard: 72 widgets on 8 machines, built three ways from the same code and data. One widget blocks for 3 s. Chromium at 1 kHz on the desktop machine, measured at plant-v0.1.0, November 2026.',
    head: ['', 'Native', 'Native + workers', 'Isoloop (matched, the default)'],
    rows: <Row[]>[
      [
        'What stalls while the widget blocks',
        'The whole page',
        'The whole page',
        'The 72 widgets in its pool; the data pools keep running',
      ],
      ['Data lost during the block', '3.8 s on every machine', 'None', 'None'],
      ['Until every widget updates again', '3.2 s', '3.1 s', '2.9 s'],
      [
        'After the block',
        'The page carries on; nothing restarts',
        'The page carries on; nothing restarts',
        'The pool restarts and catches up from the retained topics',
      ],
      [
        'A widget throws while rendering',
        'It shows “crashed” until a reload',
        'The same; a data worker that errors restarts with an empty store',
        'The isolate is restarted',
      ],
      [
        'Alarms and events across a reload',
        'localStorage, written at most once a second',
        'The same',
        'Persistent topics in OPFS: every acknowledged record',
      ],
    ],
    more: 'Every build and placement, with sources',
  },
  costs: {
    heading: 'What it costs, and where it helps',
    // Sources: apps/dashboards/plant/README.md ("Responsiveness" and "What it
    // costs"); comparison/final/ (desktop, at plant-v0.1.0);
    // comparison/phone/ikko-mindone-focus156/ and galaxy-fold6-chrome157/
    // (at plant-v0.1.0-rc.3); comparison/phone/iphone-x-safari16/ (at
    // plant-v0.1.0-rc.5). All on @isoloop/*@0.0.0-next.b8ffdcf.
    caption:
      'The plant dashboard, Isoloop (one and matched) against native (alone and with workers). Measured at plant-v0.1.0, November 2026; the phones on its release candidates, with the same Isoloop packages.',
    head: ['Device', 'What was measured', 'What it costs'],
    rows: <Row[]>[
      [
        'Desktop machine, 4 cores fixed at 2.0 GHz',
        'At 1 kHz every build keeps up in Chromium. At 5 kHz the main thread is 23–27% busy against 79–84%, and the median keystroke takes 21–41 ms against 62–82 ms. Firefox drops 0–1 frames of about 600 against 89–126.',
        '+7 to +19 points of CPU across all threads, +36 to +51 MB after garbage collection, and +0.2 to +0.3 s to first data.',
      ],
      [
        'Mid-range Android phone (MediaTek MT8781V, Firefox Focus 156)',
        'One and matched draw 68–84 frames/s against 45–56, with a median keystroke of 15–23 ms against 32–64 ms. Split, with 18 workers on 8 cores, is the slowest build here.',
        'First data after 1.2–2.0 s, against 0.4–0.9 s.',
      ],
      [
        'Flagship Android phone (Snapdragon 8 Gen 3, Chrome 157)',
        'No difference. Every build holds 60 frames/s, with a median keystroke of 9–13 ms.',
        'The extra CPU and memory, for no difference in responsiveness.',
      ],
      [
        'Older iPhone (iPhone X, Safari 16.6)',
        'Native does as well or better. At 5 kHz native holds 60 frames/s, one 59.5, matched 51.9 and split 11.1: the more workers, the lower.',
        'A known limitation. The cause isn’t established yet.',
      ],
    ],
    more: 'Every recorded run, with the method',
  },
  limits: {
    heading: 'What Isoloop can’t hide',
    // Source: isoloop/isoloop RFC 0001, "What no adapter can hide".
    items: [
      'Synchronous layout reads (getBoundingClientRect, offsetWidth) and synchronous focus and scroll. An isolate asks the host and gets a promise back.',
      'Third-party code that reaches for window, document.body or localStorage. An isolate gets a DOM subset sized to what Preact and React use.',
      'Drag and drop, text selection and canvas drawing tied to pointer timing. Canvas isolates can draw to an OffscreenCanvas instead.',
      'The cost. Every worker, the bus and the kernel take CPU, memory and start-up time, as the table above shows.',
    ],
  },
  topology: {
    heading: 'How it works',
    text: 'The host runs on the main thread, each isolate on its own worker or in a pool, and the bus in a worker between them. Seven diagrams are drawn from the code and checked against it.',
    link: 'All seven diagrams',
    frameTitle: 'Diagram: the Isoloop runtime topology',
  },
  examples: {
    heading: 'Examples',
    all: 'All examples',
  },
  install: {
    heading: 'Install',
    label:
      'Isoloop isn’t at 0.1 yet, and the API may change. These are prereleases from the main branch, published under the next tag.',
    command:
      'pnpm add @isoloop/host@next @isoloop/runtime@next @isoloop/bus@next\npnpm add -D @isoloop/vite@next\n# for React or Preact isolates:\npnpm add @isoloop/react@next   # or @isoloop/preact@next',
    guide: 'The hosting guide',
  },
};

export const howItWorks = {
  title: 'How Isoloop works',
  description:
    'Seven diagrams of the Isoloop runtime, drawn from the code: the topology, placement, a publish through the bus, the isolate lifecycle, restarts, and a bus crash.',
  heading: 'How Isoloop works',
  intro:
    'Each diagram is drawn from the library’s code, and a test in the library checks its states, timings and counts against that code. Each one opens full size, with the source files it cites.',
  pinned: 'Drawn from isoloop/isoloop at',
  open: 'Open full size',
  /** One paragraph per diagram, in reading order. */
  diagrams: {
    'runtime-topology':
      'The host runs on the main thread: the supervisor, the compositor that applies each isolate’s DOM changes, and the bus controller. Each isolate runs on its own worker or in a pool, and the bus has a worker of its own. Isolates and the bus talk over direct message channels, not through the main thread.',
    placement:
      'The same isolates, each on its own worker or together in one pool. A pool saves memory and start-up time. Its members share an event loop, so they also share a fate.',
    'bus-publish':
      'One record through the bus. It passes the publisher’s grants and a size limit, its topic’s schema and a duplicate check, then goes into the log. A persistent record is acknowledged once it’s flushed to OPFS. Subscribers get it within their credit and commit their offsets, every 100 ms by default.',
    'isolate-lifecycle':
      'The supervisor’s states, with the default timings. An isolate with no heartbeat for 400 ms counts as blocked, and after 10 s it’s stopped and restarted. Restarts back off, up to 3 within 60 s; a crash after that leaves it failed.',
    'restart-own-worker':
      'An isolate on its own worker crashes. A new worker starts, and the isolate reads on from its committed offsets, so it sees again what it had read but not committed.',
    'restart-pool':
      'In a pool, a member’s own error restarts that member alone. A pool worker that stops responding, or throws from a timer, takes every member down, and the pool restarts in a new worker.',
    'bus-crash-reattach':
      'The bus worker crashes. A new one starts, every isolate reattaches, and persistent topics come back from OPFS.',
  } as Record<string, string>,
  policy: {
    heading: 'These pages and their security policy',
    text: "Every page on this site, the diagrams included, runs under the Content-Security-Policy default-src 'self'. GitHub Pages can’t send headers, so here the policy is a meta tag, and a meta tag doesn’t reach workers: basic’s workers run without a policy on this host. In a real deployment the policy goes in the response headers, which cover the workers too.",
    link: 'The hosting guide',
  },
};

export const examplesPage = {
  title: 'Examples',
  description:
    'Isoloop examples: basic, and the plant and markets dashboards. Each one runs live, with its measured results.',
  heading: 'Examples',
  intro:
    'Each example runs live in your browser on the published @isoloop packages. The dashboards come as a native build and an Isoloop build of the same code, so you can compare them side by side.',
  measuredAt: 'measured at',
  links: { live: 'Open live', source: 'Source', results: 'Results', architecture: 'Architecture' },
  support: 'They need Safari 16.4 or later, or a recent Chrome, Edge or Firefox.',
};

export const notFound = {
  title: 'Not found',
  description: 'This page doesn’t exist.',
  heading: 'This page doesn’t exist',
  text: 'It may have moved. Try one of these:',
};
