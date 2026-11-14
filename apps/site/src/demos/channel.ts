// The site's end of isoloop-demo@1 (apps/basic/README.md; ADR 0002, as
// amended): basic runs in an iframe kept rendered but out of view, and reports
// what really happens; the demos draw it. Nothing here is simulated.
//
// Messages are taken only from that iframe's window, from this origin, in the
// expected shape; commands go only to it, with this origin as the target.

export const PROTOCOL = 'isoloop-demo@1';
const SRC = '/examples/basic/?embed=1';

export type Act = 'block-c' | 'crash-a' | 'crash-d' | 'block-main';

/** A message from basic, its fields as sent; `t` is `at` on this page's clock. */
export type Message = { type: string; t: number } & Record<string, unknown>;

type Listener = (m: Message) => void;

/** `at` (absolute ms) on this page's performance clock. */
const local = (at: number): number => at - performance.timeOrigin;

export function parse(data: unknown): Message | null {
  if (typeof data !== 'object' || data === null) return null;
  if (Reflect.get(data, 'v') !== PROTOCOL) return null;
  const type: unknown = Reflect.get(data, 'type');
  if (typeof type !== 'string') return null;
  const at: unknown = Reflect.get(data, 'at');
  const t = typeof at === 'number' ? local(at) : performance.now();
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) fields[k] = v;
  return { ...fields, type, t };
}

export const num = (m: Message, key: string): number | undefined => {
  const v = m[key];
  return typeof v === 'number' ? v : undefined;
};
export const str = (m: Message, key: string): string | undefined => {
  const v = m[key];
  return typeof v === 'string' ? v : undefined;
};

/** One basic for the whole page, shared by its demos. */
export class Channel {
  #frame: HTMLIFrameElement | undefined;
  #listeners = new Set<Listener>();
  /** Isolates seen reporting: commands reach them once they run. */
  readonly reporting = new Set<string>();

  on(fn: Listener): () => void {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  /** Starts basic, once. Its frame is inert and hidden from assistive tech: the demos speak for it. */
  start(): void {
    if (this.#frame) return;
    const frame = document.createElement('iframe');
    frame.className = 'ui-offstage';
    frame.title = 'basic, running the live demos';
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('tabindex', '-1');
    frame.inert = true;
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    window.addEventListener('message', (e) => {
      if (e.origin !== location.origin || e.source !== frame.contentWindow) return;
      const m = parse(e.data);
      if (!m) return;
      if (m.type === 'activity') {
        const id = str(m, 'id');
        if (id) this.reporting.add(id);
      }
      for (const fn of this.#listeners) fn(m);
    });
    frame.src = SRC;
    document.body.append(frame);
    this.#frame = frame;
  }

  send(act: Act): void {
    this.#frame?.contentWindow?.postMessage({ v: PROTOCOL, type: 'command', act }, location.origin);
  }
}

/** Runs `fn` once `el` first comes near the viewport. */
export function whenNear(el: Element, fn: () => void): void {
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        fn();
      }
    },
    { rootMargin: '200px' },
  );
  io.observe(el);
}

/** Calls `fn(true|false)` as `el` enters and leaves the viewport. */
export function whileVisible(el: Element, fn: (visible: boolean) => void): void {
  new IntersectionObserver((entries) => {
    for (const e of entries) fn(e.isIntersecting);
  }).observe(el);
}

export const reducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Whether this browser can run basic (the same floor as the examples). */
export function supported(): boolean {
  try {
    return (
      typeof OffscreenCanvas === 'function' &&
      typeof ShadowRoot !== 'undefined' &&
      'adoptedStyleSheets' in ShadowRoot.prototype &&
      typeof MessageChannel === 'function'
    );
  } catch {
    return false;
  }
}
