import { describe, expect, it } from 'vitest';
import { cellOr, stoppedLabel } from './stopped';

describe('stopped runs in the comparison summaries', () => {
  it('names the phase and the reason, without terminal colours', () => {
    expect(
      stoppedLabel({
        stopped: true,
        stage: 'typing',
        error: '\u001b[31mpage stopped answering (no reply in 10 s)\u001b[39m',
      }),
    ).toBe('page stopped during typing (page stopped answering (no reply in 10 s))');
    expect(stoppedLabel({ stopped: true })).toBe('page stopped');
  });

  it('shows "stopped" for a figure when every run of it stopped', () => {
    const stopped = { stopped: true, stage: 'load' };
    const ran = { stopped: false };
    expect(cellOr('–', [stopped, stopped])).toBe('stopped');
    // One run gave a value: the value stands, and the round count says one stopped.
    expect(cellOr('42 ms', [stopped, ran])).toBe('42 ms');
    // No value because the figure doesn't apply (Firefox has no CPU): not "stopped".
    expect(cellOr('–', [ran])).toBe('–');
    expect(cellOr('–', [])).toBe('–');
  });
});
