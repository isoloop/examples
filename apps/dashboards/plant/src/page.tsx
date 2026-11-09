import { BUILDS, CURRENT } from './builds';
import { PLACEMENTS, RATES, SETTINGS, buildHref, withParam } from './url';

/** The page shell, the same in every build; only what a slot holds differs. */
export function Page() {
  const build = BUILDS.find((b) => b.name === CURRENT);
  return (
    <div className="page">
      <header>
        <h1>Plant 1</h1>
        <span className="build" data-build={CURRENT}>
          {build?.summary}
        </span>
        <nav className="builds" aria-label="Builds">
          {BUILDS.map((b) =>
            b.name === CURRENT ? (
              <span key={b.name} aria-current="page">
                {b.label}
              </span>
            ) : (
              <a key={b.name} href={buildHref(b.name, location.search)}>
                {b.label}
              </a>
            ),
          )}
        </nav>
        <nav className="rates" aria-label="Vibration rate">
          {RATES.map((r) =>
            r === SETTINGS.rate ? (
              <span key={r} aria-current="page">
                {r} kHz
              </span>
            ) : (
              <a key={r} href={withParam(location.search, 'rate', String(r))}>
                {r} kHz
              </a>
            ),
          )}
        </nav>
        {CURRENT === 'isoloop' && (
          <nav className="placements" aria-label="Placement">
            {PLACEMENTS.map((p) =>
              p === SETTINGS.placement ? (
                <span key={p} aria-current="page">
                  {p}
                </span>
              ) : (
                <a key={p} href={withParam(location.search, 'placement', p)}>
                  {p}
                </a>
              ),
            )}
          </nav>
        )}
      </header>
    </div>
  );
}
