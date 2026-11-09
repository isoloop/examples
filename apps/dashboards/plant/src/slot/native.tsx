import { Component, type ReactNode } from 'react';
import { CATEGORY, type Placed } from '../widgets/catalog';
import { WIDGETS } from '../widgets';
import { Head } from './Head';

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

/** A slot in the native builds: the widget itself, in the page's tree, on the main thread. */
export function Slot({ placed }: { placed: Placed }) {
  const W = WIDGETS[placed.widget];
  const config = { slot: placed.id, ...(placed.machine ? { machine: placed.machine } : {}) };
  return (
    <div className="slot widget" data-slot={placed.id} data-widget={placed.widget}>
      <Head slot={placed.id} title={CATEGORY[placed.widget].title} where="main thread" />
      <div className="widget-body">
        <Boundary name={placed.id}>{W && <W config={config} />}</Boundary>
      </div>
    </div>
  );
}
