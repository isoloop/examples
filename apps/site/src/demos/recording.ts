// The recording (ADR 0002, as amended): a profiler-style timeline of basic,
// drawn from what it really reports over isoloop-demo@1.
//
// - A, B and the pool's C and D: a bar for each task an isolate reports
//   (activity.v1), as long as the task took. A blocked isolate reports
//   nothing: that's the gap.
// - The bus: a tick for each record that passed through it.
// - The main thread: a tick per frame. The page shares this thread with basic,
//   so when it's blocked nothing draws, and the gap is hatched afterwards.
// - Hatching while the kernel says an isolate is `blocked`; a line where it
//   crashed and was started again (isolate:crash).
import { recording as copy } from '../copy.ts';
import { type Channel, type Message, num, reducedMotion, str, whileVisible } from './channel.ts';

const TRACKS = ['main', 'bus', 'A', 'B', 'pool'] as const;
type Track = (typeof TRACKS)[number];
type Kind = 'task' | 'stuck' | 'stalled';
type Bar = { track: Track; row: number; start: number; end: number; kind: Kind; label?: string };
type Mark = { t: number; track: Track; text: string };

/** Where each isolate draws: its track and row. */
const PLACE: Record<string, [Track, number]> = {
  A: ['A', 0],
  B: ['B', 0],
  C: ['pool', 0],
  D: ['pool', 1],
};
/** A gap between frames this long is a stuck main thread. */
const MAIN_STUCK_MS = 250;

export class Recording {
  readonly #root: HTMLElement;
  readonly #canvas: HTMLCanvasElement;
  readonly #ctx: CanvasRenderingContext2D;
  readonly #status: HTMLElement;
  readonly #channel: Channel;
  #rows = new Map<Track, [number, number]>();
  #bars: Bar[] = [];
  #marks: Mark[] = [];
  #open = new Map<string, Bar>();
  #lastFrame: number | undefined;
  #colors: Record<string, string> = {};
  #patterns = new Map<string, CanvasPattern | null>();
  #window = 4000;
  #visible = false;
  #running = false;
  #w = 0;
  #h = 0;
  #blockMainAt: number | undefined;

  constructor(root: HTMLElement, channel: Channel) {
    this.#root = root;
    const canvas = root.querySelector('canvas');
    const status = root.querySelector<HTMLElement>('.ui-status');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !status || !ctx) throw new Error('recording: markup missing');
    this.#canvas = canvas;
    this.#ctx = ctx;
    this.#status = status;
    this.#channel = channel;
    this.#readColors();
    this.#measure();
    new MutationObserver(() => {
      this.#readColors();
      this.#draw();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      this.#readColors();
    });
    window.addEventListener('resize', () => {
      this.#measure();
      this.#draw();
    });
    for (const button of root.querySelectorAll<HTMLButtonElement>('button[data-act]')) {
      button.addEventListener('click', () => this.#act(button));
    }
    channel.on((m) => this.#receive(m));
    whileVisible(root, (v) => {
      this.#visible = v;
      if (v) this.#loop();
    });
    if (reducedMotion()) {
      // Updates without animating: one still frame a second.
      setInterval(() => {
        if (this.#visible) this.#draw();
      }, 1000);
    }
  }

  #say(text: string): void {
    this.#status.textContent = text;
  }

  #readColors(): void {
    const cs = getComputedStyle(this.#root);
    for (const [k, v] of Object.entries({
      main: '--ui-part-host',
      bus: '--ui-part-bus',
      A: '--ui-part-isolate',
      B: '--ui-accent',
      pool: '--ui-part-pool',
      ink: '--ui-text',
      muted: '--ui-text-muted',
      rule: '--ui-rule',
      panel: '--ui-surface',
    }))
      this.#colors[k] = cs.getPropertyValue(v).trim();
    this.#patterns.clear();
  }

  #measure(): void {
    const top = this.#canvas.getBoundingClientRect().top;
    for (const li of this.#root.querySelectorAll<HTMLElement>('.ui-track')) {
      const r = li.getBoundingClientRect();
      const track = TRACKS.find((t) => t === li.dataset['track']);
      if (track) this.#rows.set(track, [r.top - top, r.height]);
    }
    const dpr = window.devicePixelRatio || 1;
    this.#w = this.#canvas.clientWidth;
    this.#h = this.#canvas.clientHeight;
    this.#window = this.#w < 500 ? 2000 : 4000;
    this.#canvas.width = Math.round(this.#w * dpr);
    this.#canvas.height = Math.round(this.#h * dpr);
    this.#ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  #enable(): void {
    const ready = this.#channel.reporting;
    for (const b of this.#root.querySelectorAll<HTMLButtonElement>('button[data-act]')) {
      const act = b.dataset['act'];
      const needs = act === 'block-c' ? 'C' : act === 'crash-a' ? 'A' : null;
      if (b.dataset['hold'] === undefined && (needs === null || ready.has(needs)))
        b.disabled = false;
    }
  }

  #hold(button: HTMLButtonElement, ms: number): void {
    button.disabled = true;
    button.dataset['hold'] = '';
    setTimeout(() => {
      delete button.dataset['hold'];
      this.#enable();
    }, ms);
  }

  #act(button: HTMLButtonElement): void {
    const act = button.dataset['act'];
    if (act === 'block-c') {
      this.#channel.send('block-c');
      this.#hold(button, 4500);
    } else if (act === 'crash-a') {
      this.#channel.send('crash-a');
      this.#hold(button, 1500);
    } else if (act === 'block-main') {
      // Say it first and let it paint: once the command lands, this page can't.
      this.#say(copy.status.mainStuck);
      this.#hold(button, 4000);
      this.#blockMainAt = performance.now();
      requestAnimationFrame(() => setTimeout(() => this.#channel.send('block-main'), 50));
    }
  }

  #receive(m: Message): void {
    const id = str(m, 'id');
    switch (m.type) {
      case 'ready':
        this.#say(copy.status.running);
        break;
      case 'activity': {
        const place = id ? PLACE[id] : undefined;
        const ms = num(m, 'ms') ?? 0;
        if (place)
          this.#bars.push({
            track: place[0],
            row: place[1],
            start: m.t - ms,
            end: m.t,
            kind: 'task',
          });
        this.#tick('bus', m.t);
        this.#enable();
        break;
      }
      case 'record':
        this.#tick('bus', m.t);
        break;
      case 'frames': {
        const times = Array.isArray(m['times']) ? (m['times'] as unknown[]) : [];
        for (const at of times) {
          if (typeof at !== 'number') continue;
          const t = at - performance.timeOrigin;
          if (this.#lastFrame !== undefined && t - this.#lastFrame > MAIN_STUCK_MS) {
            this.#bars.push({
              track: 'main',
              row: 0,
              start: this.#lastFrame,
              end: t,
              kind: 'stuck',
              label: 'Main thread stuck: nothing could paint',
            });
            if (this.#blockMainAt !== undefined && t > this.#blockMainAt) {
              this.#blockMainAt = undefined;
              this.#say(copy.status.mainFree);
            }
          }
          this.#lastFrame = t;
          this.#bars.push({ track: 'main', row: 0, start: t, end: t + 2, kind: 'task' });
        }
        break;
      }
      case 'state': {
        const place = id ? PLACE[id] : undefined;
        if (!id || !place) break;
        const state = str(m, 'state');
        if (state === 'blocked' && !this.#open.has(id)) {
          const sharedWithC = id === 'D' && this.#open.has('C');
          const bar: Bar = {
            track: place[0],
            row: place[1],
            start: m.t,
            end: m.t,
            kind: sharedWithC || id === 'C' ? (id === 'C' ? 'stuck' : 'stalled') : 'stuck',
            label:
              id === 'C' ? 'C is stuck' : sharedWithC ? 'D waits: same loop' : `${id} is stuck`,
          };
          this.#open.set(id, bar);
          this.#bars.push(bar);
          if (id === 'C') this.#say(copy.status.cStuck);
        } else if (state !== 'blocked') {
          const bar = this.#open.get(id);
          if (bar) {
            bar.end = m.t;
            this.#open.delete(id);
          }
        }
        break;
      }
      case 'crash': {
        const place = id ? PLACE[id] : undefined;
        if (!id || !place) break;
        const pool = str(m, 'pool');
        const recent = this.#marks.some((k) => k.track === place[0] && m.t - k.t < 500);
        if (pool && !recent) {
          this.#marks.push({ t: m.t, track: place[0], text: 'pool stopped and started again' });
          if (str(m, 'reason') === 'unresponsive') this.#say(copy.status.poolRestarted);
        } else if (!pool) {
          this.#marks.push({ t: m.t, track: place[0], text: `${id} crashed, restarted` });
          if (id === 'A') this.#say(copy.status.aCrashed);
        }
        break;
      }
      default:
        break;
    }
  }

  #tick(track: Track, t: number): void {
    this.#bars.push({ track, row: 0, start: t, end: t + 1.5, kind: 'task' });
  }

  #loop(): void {
    if (this.#running || reducedMotion()) {
      this.#draw();
      return;
    }
    this.#running = true;
    const frame = (): void => {
      if (!this.#visible) {
        this.#running = false;
        return;
      }
      this.#draw();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  #hatch(color: string, dense: boolean): CanvasPattern | null {
    const key = color + String(dense);
    if (this.#patterns.has(key)) return this.#patterns.get(key) ?? null;
    const dpr = window.devicePixelRatio || 1;
    const c = document.createElement('canvas');
    c.width = c.height = 8 * dpr;
    const x = c.getContext('2d');
    if (!x) return null;
    x.scale(dpr, dpr);
    x.strokeStyle = color;
    x.lineWidth = dense ? 2.2 : 1.4;
    x.globalAlpha = dense ? 1 : 0.7;
    x.beginPath();
    x.moveTo(-2, 10);
    x.lineTo(10, -2);
    x.moveTo(-2, 2);
    x.lineTo(2, -2);
    x.moveTo(6, 10);
    x.lineTo(10, 6);
    x.stroke();
    const p = this.#ctx.createPattern(c, 'repeat');
    this.#patterns.set(key, p);
    return p;
  }

  #draw(): void {
    const now = performance.now();
    const { w: W, h: H } = { w: this.#w, h: this.#h };
    const ctx = this.#ctx;
    const colors = this.#colors;
    const px = W / this.#window;
    const x = (t: number): number => W - (now - t) * px;
    // Open spans grow until the kernel says otherwise.
    for (const bar of this.#open.values()) bar.end = now;
    this.#bars = this.#bars.filter((b) => b.end > now - this.#window - 200);
    this.#marks = this.#marks.filter((m) => m.t > now - this.#window - 200);
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = colors['rule'] ?? '#ccc';
    ctx.lineWidth = 1;
    for (const [, [top, h]] of this.#rows) {
      ctx.beginPath();
      ctx.moveTo(0, top + h - 0.5);
      ctx.lineTo(W, top + h - 0.5);
      ctx.stroke();
    }
    const pool = this.#rows.get('pool');
    if (pool) {
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(0, pool[0] + pool[1] / 2);
      ctx.lineTo(W, pool[0] + pool[1] / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '600 11px Archivo, system-ui';
      ctx.fillStyle = colors['muted'] ?? '#555';
      ctx.fillText('C', 6, pool[0] + 16);
      ctx.fillText('D', 6, pool[0] + pool[1] / 2 + 16);
    }

    for (const b of this.#bars) {
      const r = this.#rows.get(b.track);
      if (!r) continue;
      const split = b.track === 'pool';
      const sub = split ? r[1] / 2 : r[1];
      const y = r[0] + (split ? b.row * sub : 0) + 9;
      const h = sub - 18;
      const x0 = x(b.start);
      const x1 = Math.min(x(b.end), W);
      if (x1 < 0) continue;
      const width = Math.max(b.track === 'main' || b.track === 'bus' ? 1.2 : 2.5, x1 - x0);
      const c = colors[b.track] ?? '#888';
      if (b.kind === 'task') {
        ctx.fillStyle = c;
        ctx.fillRect(x0, y, width, h);
        continue;
      }
      const pattern = this.#hatch(c, b.kind === 'stuck');
      if (pattern) ctx.fillStyle = pattern;
      ctx.fillRect(x0, y, width, h);
      ctx.strokeStyle = c;
      ctx.lineWidth = b.kind === 'stuck' ? 2 : 1;
      ctx.strokeRect(x0 + 0.5, y + 0.5, width - 1, h - 1);
      if (b.label && width > 120) {
        ctx.font = '650 12px Archivo, system-ui';
        const tx = Math.max(x0 + 8, 8);
        const tw = ctx.measureText(b.label).width;
        ctx.fillStyle = colors['panel'] ?? '#fff';
        ctx.fillRect(tx - 4, y + h / 2 - 9, tw + 8, 18);
        ctx.fillStyle = colors['ink'] ?? '#000';
        ctx.fillText(b.label, tx, y + h / 2 + 4);
      }
    }

    for (const m of this.#marks) {
      const r = this.#rows.get(m.track);
      const mx = Math.round(x(m.t)) + 0.5;
      if (!r || mx < 0) continue;
      ctx.strokeStyle = colors['ink'] ?? '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mx, r[0] + 3);
      ctx.lineTo(mx, r[0] + r[1] - 3);
      ctx.stroke();
      ctx.font = '650 12px Archivo, system-ui';
      const tw = ctx.measureText(m.text).width;
      let tx = mx + 6;
      if (tx + tw > W - 4) tx = mx - tw - 6;
      ctx.fillStyle = colors['panel'] ?? '#fff';
      ctx.fillRect(tx - 3, r[0] + 4, tw + 6, 16);
      ctx.fillStyle = colors['ink'] ?? '#000';
      ctx.fillText(m.text, tx, r[0] + 16);
    }

    const ry = H - 28;
    ctx.fillStyle = colors['muted'] ?? '#555';
    ctx.font = '500 11.5px Archivo, system-ui';
    for (let s = 0; s <= this.#window / 1000; s++) {
      const tx = W - s * 1000 * px;
      ctx.fillRect(tx - 0.5, ry, 1, 6);
      const label = s === 0 ? 'now' : `${s} s ago`;
      const lw = ctx.measureText(label).width;
      ctx.fillText(label, Math.min(Math.max(tx - lw / 2, 4), W - lw - 4), ry + 20);
    }
  }
}
