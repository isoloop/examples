// Alert rules, evaluated against prices and aggregates. A rule fires once per
// crossing: when its condition becomes true, and not again until it has been
// false. A rule's first value counts as a crossing if the condition holds.
import type { Alert, AlertRule, Metric, Sym } from './schemas';

type Rule = Extract<AlertRule, { removed: false }>;

export class AlertEngine {
  readonly #rules = new Map<string, Rule>();
  /** Rules whose condition held on their last value. */
  readonly #holding = new Set<string>();

  /** Adds, replaces or removes a rule. A changed rule re-arms. */
  setRule(r: AlertRule): void {
    this.#holding.delete(r.id);
    if (r.removed) this.#rules.delete(r.id);
    else this.#rules.set(r.id, r);
  }

  /** After a restart: the rule already fired and hasn't been reset since. */
  markFired(ruleId: string): void {
    this.#holding.add(ruleId);
  }

  rules(): Rule[] {
    return [...this.#rules.values()];
  }

  /** Evaluates every rule on `symbol` and `metric`; returns the alerts that fire. */
  evaluate(symbol: Sym, metric: Metric, value: number, ts: number): Alert[] {
    const fired: Alert[] = [];
    for (const r of this.#rules.values()) {
      if (r.symbol !== symbol || r.metric !== metric) continue;
      const holds = r.op === 'above' ? value > r.threshold : value < r.threshold;
      if (!holds) {
        this.#holding.delete(r.id);
        continue;
      }
      if (this.#holding.has(r.id)) continue;
      this.#holding.add(r.id);
      fired.push({ ruleId: r.id, symbol, metric, op: r.op, threshold: r.threshold, value, ts });
    }
    return fired;
  }
}
