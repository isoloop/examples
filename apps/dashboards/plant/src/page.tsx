import { Slot } from '#slot';
import { BUILDS, CURRENT } from './builds';
import { ClearHistory } from './ClearHistory';
import { CategoryPanel } from './metrics/Categories';
import { MetricsPanel } from './metrics/Panel';
import { Record } from './metrics/Record';
import { Notices } from './Notices';
import { Responsiveness } from './responsive/Responsiveness';
import { MACHINES } from './core/machines';
import { WIDGETS } from './widgets';
import { layout, type WidgetName } from './widgets/catalog';
import { PLACEMENTS, RATES, SETTINGS, buildHref, withParam } from './url';

/** The page shell, the same in every build; only what a slot holds differs. */
const SHOWN = Object.keys(WIDGETS).filter((w): w is WidgetName => w in WIDGETS);

export function Page() {
  const { fleet, machines } = layout(SHOWN);
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
        <ClearHistory />
      </header>
      <Notices />
      <Responsiveness />
      <MetricsPanel />
      <CategoryPanel widgets={SHOWN} />
      <Record />
      {fleet.length > 0 && (
        <section className="fleet" aria-label="Fleet">
          <h2>Fleet</h2>
          <div className="widgets">
            {fleet.map((p) => (
              <Slot key={p.id} placed={p} />
            ))}
          </div>
        </section>
      )}
      <main className="machines">
        {machines.map((ws, i) => (
          <section key={MACHINES[i]} className="machine" aria-label={MACHINES[i]}>
            <h2>{MACHINES[i]}</h2>
            <div className="widgets">
              {ws.map((p) => (
                <Slot key={p.id} placed={p} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
