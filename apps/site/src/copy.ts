// Every text on the site, in one place.
//
// DRAFT COPY, to be rewritten in plan task 9 (the maintainer reviews it and
// picks the headline). The figures are real; the wording around them is a
// placeholder. Pages carry data-copy="draft" until then.
//
// Rules for whoever writes it (ADR 0002, decision 10): Isoloop is a complete
// toolchain, not a speed fix; never "faster than native"; performance as
// measurements, with the device, the build and the tag; the cost stated
// plainly next to what it gives.

export const COPY_STATUS = 'draft' as const;

/** A table row: its heading, then one cell per column. */
type Row = [string, ...string[]];

export const site = {
  description:
    'Isoloop runs each part of a web app in its own worker, with a message bus between them: a part that blocks or crashes is contained, restarted and caught up.',
};

export const home = {
  title: 'Isoloop: contained, restartable parts for browser apps',
  hero: {
    heading: 'Each part of your app on its own event loop, with a bus between them',
    points: [
      'Containment and restart: a part that blocks or crashes is stopped, restarted and caught up, and the rest keeps running.',
      'A message bus with retention, replay and durable history, in a worker of its own.',
      'Placement as a switch: own workers or shared pools, with the libraries you already use: React, Preact or plain DOM.',
    ],
    primary: 'Open the plant dashboard live',
    secondary: 'How it works',
  },
  demo: {
    heading: 'Try it',
    text: 'Four isolates on three event loops: A and B on their own workers, C and D sharing a pool. Block or crash any of them and watch what keeps running.',
    frameTitle: 'Basic: four isolates, two of them in a pool',
    open: 'Open basic on its own page',
  },
  gives: {
    heading: 'What it gives',
    caption:
      'The plant dashboard, three builds of the same widgets. A widget blocks for 3 s; Chromium at 1 kHz on the desktop machine. Measured at plant-v0.1.0, November 2026.',
    head: ['What happens', 'native', 'native + workers', 'Isoloop (matched, the default)'],
    rows: <Row[]>[
      [
        'A widget blocks for 3 s: what stalls',
        'the whole page',
        'the whole page',
        'the 72 widgets in its pool; data keeps flowing',
      ],
      ['Data lost during the block', '3.8 s on every machine', 'none', 'none'],
      [
        'After the block',
        'carries on; nothing restarts',
        'carries on; nothing restarts',
        'the pool restarts and catches up from the retained topics',
      ],
      [
        'A widget throws while rendering',
        'stays down until a reload',
        'stays down until a reload',
        'the isolate is restarted',
      ],
      [
        'Alarms and events across a reload',
        'localStorage, written once a second',
        'the same',
        'persistent topics in OPFS: every acknowledged record',
      ],
    ],
    more: 'Every build and placement, with sources',
  },
  costs: {
    heading: 'What it costs, and where it helps',
    caption:
      'The plant dashboard, Isoloop against its matched native build. Measured at plant-v0.1.0, November 2026.',
    head: ['Device', 'Isoloop against native', 'What it costs'],
    rows: <Row[]>[
      [
        'Desktop machine (4 cores fixed at 2.0 GHz)',
        'Main thread 23–27% against 79–84% of a core at 5 kHz; typing median 21–41 ms against 62–82 ms in Chromium; 0–1 late frames against 89–126 in Firefox',
        '+7 to +19 points of CPU across all threads; +36 to +51 MB after GC; +0.2 to +0.3 s to first data',
      ],
      [
        'Mid-range Android phone (MediaTek MT8781V, Firefox 156)',
        '68–84 frames/s against 45–56; typing median 15–23 ms against 32–64 ms (placements one and matched; split is the slowest build here)',
        'First data at 1.2–2.0 s against 0.4–0.9 s',
      ],
      [
        'Flagship Android phone (Snapdragon 8 Gen 3, Chrome 157)',
        'No difference: every build at 60 frames/s, typing 9–13 ms',
        'The desktop costs apply; nothing is gained',
      ],
      [
        'Older iPhone (iPhone X, Safari 16.6)',
        'Native as good or better: 60 frames/s at 5 kHz against 51.9 for matched and 11.1 for split; the more workers, the further it drops',
        'A known limitation; the cause is not established',
      ],
    ],
    more: 'Every recorded run',
  },
  limits: {
    heading: 'What Isoloop can’t hide',
    items: [
      'Synchronous layout: code in a worker can’t read the page’s layout in the same tick; measurements are asked for and answered asynchronously.',
      'The window and document globals: an isolate gets a DOM subset sized to what Preact and React use, not the whole browser API.',
      'Drag and drop between isolates and the page, which needs the main thread’s events.',
    ],
  },
  topology: {
    heading: 'How it works',
    text: 'The host on the main thread, isolates on their own workers or in pools, and a bus worker between them. Seven diagrams, drawn from the code.',
    link: 'All seven diagrams',
    frameTitle: 'Diagram: Isoloop runtime topology',
  },
  examples: {
    heading: 'Examples',
    all: 'All examples',
  },
  install: {
    heading: 'Install',
    label: 'Before 0.1, the API may change. These are prereleases from the main branch.',
    command:
      'pnpm add @isoloop/host@next @isoloop/runtime@next @isoloop/bus@next\npnpm add -D @isoloop/vite@next',
    guide: 'The hosting guide',
  },
};

export const howItWorks = {
  title: 'How it works',
  description:
    'Seven diagrams of the Isoloop runtime, drawn from the code: topology, placement, the bus, the lifecycle and restarts.',
  heading: 'How Isoloop works',
  intro:
    'Each diagram is drawn from the library’s code and checked against it by a test. They open full size, with the sources they cite.',
  pinned: 'Drawn from isoloop/isoloop at',
  open: 'Open full size',
  /** One paragraph per diagram, in reading order. */
  diagrams: {
    'runtime-topology':
      'The main thread holds the host: the supervisor, the compositor and the bus controller. Isolates run on their own workers or in pools; the bus runs in a worker of its own.',
    placement:
      'The same three isolates in three own workers, or in one pool. A pool saves memory and start-up time, and shares an event loop and a fate.',
    'bus-publish':
      'A record through the bus: grants and size, the schema, duplicates, the log, delivery to each subscriber, and commits.',
    'isolate-lifecycle':
      'The supervisor’s states and transitions, with the default timings: when an isolate counts as blocked, when it is stopped, and how restarts back off.',
    'restart-own-worker':
      'An isolate on its own worker crashes, is restarted, and replays from its committed offsets.',
    'restart-pool':
      'In a pool, a member’s own error restarts it alone; a worker that fails restarts the whole pool.',
    'bus-crash-reattach':
      'The bus worker crashes, a new one starts, and every isolate reattaches; persistent topics come back from OPFS.',
  } as Record<string, string>,
  policy: {
    heading: 'About these pages and their policy',
    text: "Every page on this site, the diagrams included, runs under the Content-Security-Policy default-src 'self'. GitHub Pages can’t send headers, so the policy is a meta tag here, and a worker gets no policy from it: basic’s workers run without one on this host. In a real deployment the policy goes in the response headers, which cover workers too.",
    link: 'The hosting guide',
  },
};

export const examplesPage = {
  title: 'Examples',
  description:
    'Isoloop examples: basic, and the plant and markets dashboards, each live and with its measured results.',
  heading: 'Examples',
  intro:
    'Each example runs live in your browser, from the published @isoloop packages. The dashboards come as a native build and as an Isoloop build of the same code.',
  measuredAt: 'measured at',
  links: { live: 'Open live', source: 'Source', results: 'Results', architecture: 'Architecture' },
  support: 'They run in Safari 16.4 or later, or a recent Chrome, Edge or Firefox.',
};

export const notFound = {
  title: 'Not found',
  description: 'This page doesn’t exist.',
  heading: 'This page doesn’t exist',
  text: 'It may have moved. These do:',
};
