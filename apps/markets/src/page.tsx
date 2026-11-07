import { BUILD } from '#env';
import { Slot } from '#slot';

/** The page shell, the same in both builds; only what a slot holds differs. */
export function Page() {
  const other = BUILD === 'native' ? 'isoloop' : 'native';
  return (
    <div className="page">
      <header>
        <h1>Markets</h1>
        <span className="build" data-build={BUILD}>
          {BUILD === 'native' ? 'Native: one main thread' : 'Isoloop: an event loop per widget'}
        </span>
        <a className="toggle" href={`../${other}/${location.search}`}>
          Switch to {other}
        </a>
      </header>
      <Slot name="filters" />
      <main className="grid">
        <Slot name="price" />
        <Slot name="spread" />
        <Slot name="volume" />
        <Slot name="trades" />
        <Slot name="alerts-panel" />
      </main>
    </div>
  );
}
