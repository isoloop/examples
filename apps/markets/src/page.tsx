import { BUILD } from '#env';
import { Slot } from '#slot';
import { BUILDS, COUNTERPART, CURRENT } from './builds';
import { About } from './about/About';
import { MetricsPanel } from './metrics/Panel';
import { SIZES, SPECS, specFrom, sizeHref } from './sizes/sizes';
import { switchHref } from './url';

/** The page shell, the same in every build; only what a slot holds differs. */
export function Page() {
  const other = COUNTERPART[CURRENT];
  const spec = specFrom(new URLSearchParams(location.search));
  const filters = spec.widgets.find((p) => p.widget === 'filters');
  const grid = spec.widgets.filter((p) => p.widget !== 'filters');
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
        <nav className="sizes" aria-label="Dashboard size">
          {SIZES.map((size) =>
            size === spec.size ? (
              <span key={size} aria-current="page">
                {SPECS[size].label}
              </span>
            ) : (
              <a key={size} href={sizeHref(size, location.search)}>
                {SPECS[size].label}
              </a>
            ),
          )}
        </nav>
      </header>
      <MetricsPanel />
      <About />
      {filters && <Slot placement={filters} />}
      <main className="grid" data-size={spec.size}>
        {grid.map((p) => (
          <Slot key={p.id} placement={p} />
        ))}
      </main>
    </div>
  );
}
