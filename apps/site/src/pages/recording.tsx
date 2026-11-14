/** @jsxImportSource preact */
import type { VNode } from 'preact';
import { recording } from '../copy.ts';

/**
 * The recording's markup (ADR 0002, as amended): track names in the gutter, a
 * canvas that src/demos/recording.ts draws from what basic reports, the legend
 * and the controls. Without JS, or before basic reports, the panel stays empty
 * and the status says so.
 */
export function Recording({
  id,
  tracks,
  controls,
  caption,
}: {
  id: string;
  tracks: ('main' | 'bus' | 'A' | 'B' | 'pool')[];
  controls: ('block-c' | 'crash-a' | 'block-main')[];
  caption?: VNode;
}): VNode {
  const part = { main: 'host', bus: 'bus', A: 'isolate', B: 'accent', pool: 'pool' } as const;
  const label = {
    'block-c': recording.controls.blockC,
    'crash-a': recording.controls.crashA,
    'block-main': recording.controls.blockMain,
  } as const;
  return (
    <figure class="ui-recording" data-demo="recording" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} class="visually-hidden">
        {recording.heading}
      </h2>
      <div class="ui-panel">
        <ol class="ui-tracks" aria-hidden="true">
          {tracks.map((t) => {
            const [name, where] = recording.tracks[t] ?? [t, ''];
            return (
              <li
                key={t}
                class="ui-track"
                data-track={t}
                data-part={part[t]}
                data-rows={t === 'pool' ? '2' : undefined}
              >
                <b>{name}</b> <span>{where}</span>
              </li>
            );
          })}
        </ol>
        <div class="ui-trace-cell">
          <canvas class="ui-trace" role="img" aria-label={recording.label} />
        </div>
      </div>
      <ul class="ui-legend" aria-label="How to read the recording">
        <li data-mark="task">{recording.legend.task}</li>
        <li data-mark="stuck">{recording.legend.stuck}</li>
        <li data-mark="restart">{recording.legend.restart}</li>
      </ul>
      <div class="ui-controls" role="group" aria-label={recording.controls.group}>
        {controls.map((c, i) => (
          <button
            key={c}
            type="button"
            class="ui-button"
            data-act={c}
            data-strong={i === 0 ? '' : undefined}
            disabled
          >
            {label[c]}
          </button>
        ))}
        <p class="ui-status" role="status" aria-live="polite">
          {recording.status.waiting}
        </p>
      </div>
      {caption ? <figcaption>{caption}</figcaption> : null}
      <p class="ui-open">
        <a href="/examples/basic/">{recording.open}</a>
      </p>
    </figure>
  );
}
