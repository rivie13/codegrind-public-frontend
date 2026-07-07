import { describe, expect, it } from 'vitest';

import {
  TD_ACTION_COST_KEYS,
  createInitialActionUsageCounts,
  getTowerDefenseActionCost,
  getTowerDefenseActionCosts,
} from './actionEconomy';

describe('tower defense action economy', () => {
  it('starts all tracked action usage counts at zero', () => {
    expect(createInitialActionUsageCounts()).toEqual({
      [TD_ACTION_COST_KEYS.PATH_SHORTEN]: 0,
      [TD_ACTION_COST_KEYS.PATH_LENGTHEN]: 0,
      [TD_ACTION_COST_KEYS.RUN_TESTS]: 0,
      [TD_ACTION_COST_KEYS.STDOUT]: 0,
      [TD_ACTION_COST_KEYS.STDERR]: 0,
      [TD_ACTION_COST_KEYS.OUTPUT]: 0,
    });
  });

  it('escalates only the selected action cost', () => {
    const usageCounts = createInitialActionUsageCounts();
    const baseRunTestsCost = getTowerDefenseActionCost(TD_ACTION_COST_KEYS.RUN_TESTS, usageCounts);
    const baseStdoutCost = getTowerDefenseActionCost(TD_ACTION_COST_KEYS.STDOUT, usageCounts);

    usageCounts[TD_ACTION_COST_KEYS.RUN_TESTS] = 2;

    const boostedRunTestsCost = getTowerDefenseActionCost(
      TD_ACTION_COST_KEYS.RUN_TESTS,
      usageCounts
    );
    const unchangedStdoutCost = getTowerDefenseActionCost(TD_ACTION_COST_KEYS.STDOUT, usageCounts);

    expect(boostedRunTestsCost).toBeGreaterThan(baseRunTestsCost);
    expect(unchangedStdoutCost).toBe(baseStdoutCost);
  });

  it('returns all action costs in a single object', () => {
    const usageCounts = createInitialActionUsageCounts();
    usageCounts[TD_ACTION_COST_KEYS.PATH_SHORTEN] = 1;
    usageCounts[TD_ACTION_COST_KEYS.STDERR] = 3;

    const costs = getTowerDefenseActionCosts(usageCounts);

    expect(Object.keys(costs)).toEqual([
      TD_ACTION_COST_KEYS.PATH_SHORTEN,
      TD_ACTION_COST_KEYS.PATH_LENGTHEN,
      TD_ACTION_COST_KEYS.RUN_TESTS,
      TD_ACTION_COST_KEYS.STDOUT,
      TD_ACTION_COST_KEYS.STDERR,
      TD_ACTION_COST_KEYS.OUTPUT,
    ]);
    expect(costs[TD_ACTION_COST_KEYS.PATH_SHORTEN]).toBeGreaterThan(50);
    expect(costs[TD_ACTION_COST_KEYS.STDERR]).toBeGreaterThan(costs[TD_ACTION_COST_KEYS.STDOUT]);
  });
});
