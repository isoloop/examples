import { defineIsolate } from '@isoloop/runtime';
import { AlertEngine } from '../core/alerts';
import { alertRules, alerts, aggregates, prices } from '../isoloop/topics';

// Headless: evaluates the rules in alert-rules.v1 against prices.v1 (`price`,
// each exchange's last) and aggregates.v1 (`vwap`, `spread`), and publishes
// what fires to alerts.v1. Both rule and alert topics are persistent; on a
// restart it reads alerts.v1 back, so a rule that already fired doesn't fire
// again until its condition has been false.
export default defineIsolate({
  start(ctx) {
    const engine = new AlertEngine();
    const fire = (list: ReturnType<AlertEngine['evaluate']>): void => {
      for (const value of list) void ctx.bus.publish(alerts, { value });
    };
    ctx.bus.subscribe(
      alertRules,
      (r) => {
        engine.setRule(r.value);
      },
      { from: 'earliest' },
    );
    ctx.bus.subscribe(
      alerts,
      (r) => {
        engine.markFired(r.value.ruleId);
      },
      { from: 'earliest' },
    );
    ctx.bus.subscribe(prices, (r) => {
      fire(engine.evaluate(r.value.symbol, 'price', r.value.last, r.value.ts));
    });
    ctx.bus.subscribe(aggregates, (r) => {
      const a = r.value;
      fire(engine.evaluate(a.symbol, 'vwap', a.vwap, a.ts));
      fire(engine.evaluate(a.symbol, 'spread', a.spread, a.ts));
    });
  },
});
