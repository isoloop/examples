import { Component, type ReactNode } from 'react';
import type { Placement } from '../sizes/sizes';
import { WIDGETS } from '../widgets';

/** The idiomatic defence a native app has: one error boundary per widget. */
class Boundary extends Component<{ name: string; children: ReactNode }, { error: string | null }> {
  override state = { error: null };
  static getDerivedStateFromError(e: unknown): { error: string } {
    return { error: e instanceof Error ? e.message : String(e) };
  }
  override render(): ReactNode {
    if (this.state.error !== null) {
      return (
        <div className="widget-error">
          {this.props.name} crashed: {this.state.error}
        </div>
      );
    }
    return this.props.children;
  }
}

/** A slot in the native build: the widget itself, in the page's tree. */
export function Slot({ placement }: { placement: Placement }) {
  const W = WIDGETS[placement.widget];
  return (
    <div className="slot widget" data-slot={placement.id} data-widget={placement.widget}>
      <Boundary name={placement.id}>
        <W config={placement.config} />
      </Boundary>
    </div>
  );
}
