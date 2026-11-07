import { BUILD } from '#env';
import { Slot } from '#slot';
import { BUILDS, COUNTERPART, CURRENT } from './builds';
import { About } from './about/About';
import { MetricsPanel } from './metrics/Panel';
import { switchHref } from './url';

/** The page shell, the same in every build; only what a slot holds differs. */
export function Page() {
  const other = COUNTERPART[CURRENT];
  return (
    <div className="page">
      <header>
        <h1>Markets</h1>
        <span className="build" data-build={BUILD}>
          {BUILD === 'native' ? 'Native: one main thread' : 'Isoloop: an event loop per widget'}
        </span>
        <a
          className="toggle"
          href={`../${other}/${location.search}`}
          onClick={(e) => {
            // Built at click time: the replay's position moves on.
            e.currentTarget.href = switchHref(other);
          }}
        >
          Switch to {other}
        </a>
        <nav className="builds" aria-label="Builds">
          {BUILDS.map((b) =>
            b.name === CURRENT ? (
              <span key={b.name} aria-current="page">
                {b.label}
              </span>
            ) : (
              <a
                key={b.name}
                href={`../${b.name}/${location.search}`}
                onClick={(e) => {
                  e.currentTarget.href = switchHref(b.name);
                }}
              >
                {b.label}
              </a>
            ),
          )}
        </nav>
      </header>
      <MetricsPanel />
      <About />
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
