// Responsiveness shown on the page (M3c decision 7), the same code in every
// build and on the main thread, the thread being compared: a ticker tape moved
// every frame, an input echo box, and a badge with the frame rate and input
// latency. When the main thread is busy, the tape stutters and the echo lags.
import { useEffect, useRef, useState } from 'react';
import { SYMBOLS } from '../core/schemas';
import { mainThreadMetrics } from '../metrics/main-thread';

/** Frame gaps the tape saw, for the E2E suite and the comparison. */
export interface TapeFrames {
  frames: number;
  /** Gaps between frames, ms, the last 600. */
  gaps: number[];
}

declare global {
  interface Window {
    tape: TapeFrames;
  }
}

const SPEED_PX_PER_S = 60;

function Tape() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const record: TapeFrames = { frames: 0, gaps: [] };
    window.tape = record;
    let id = 0;
    let start: number | undefined;
    let last: number | undefined;
    const step = (t: number): void => {
      start ??= t;
      if (last !== undefined) {
        record.gaps.push(t - last);
        if (record.gaps.length > 600) record.gaps.shift();
      }
      record.frames++;
      last = t;
      const width = el.scrollWidth / 2 || 1;
      el.style.transform = `translateX(${-(((t - start) / 1000) * SPEED_PX_PER_S) % width}px)`;
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(id);
    };
  }, []);
  const text = SYMBOLS.map((s) => s.replace('-USD', '')).join('  ·  ');
  return (
    <div className="tape-strip" aria-hidden="true">
      <div ref={ref} className="tape-track">
        <span>{text} · </span>
        <span>{text} · </span>
      </div>
    </div>
  );
}

const read = mainThreadMetrics();
const ms = (v: number | null): string => (v === null ? '—' : `${Math.round(v)} ms`);

function Badge() {
  const [m, setM] = useState(read);
  useEffect(() => {
    const id = setInterval(() => {
      setM(read());
    }, 500);
    return () => {
      clearInterval(id);
    };
  }, []);
  return (
    <span className="badge" role="status" aria-label="Main-thread responsiveness">
      <span data-badge="fps">{m.fps} fps</span>
      <span data-badge="input">input {ms(m.inputMedianMs)}</span>
    </span>
  );
}

function Echo() {
  const [text, setText] = useState('');
  return (
    <label className="echo">
      Type here{' '}
      <input
        name="echo"
        value={text}
        onChange={(e) => {
          setText(e.currentTarget.value);
        }}
        autoComplete="off"
      />
      <output name="echoed">{text}</output>
    </label>
  );
}

export function Responsiveness() {
  return (
    <div className="responsiveness">
      <Tape />
      <Echo />
      <Badge />
    </div>
  );
}
