export const TD_ACTION_COST_KEYS = Object.freeze({
  PATH_SHORTEN: 'pathShorten',
  PATH_LENGTHEN: 'pathLengthen',
  RUN_TESTS: 'runTests',
  STDOUT: 'stdout',
  STDERR: 'stderr',
  OUTPUT: 'output',
});

export const TD_ACTION_COST_CONFIG = Object.freeze({
  [TD_ACTION_COST_KEYS.PATH_SHORTEN]: { baseCost: 50, growth: 1.7 },
  [TD_ACTION_COST_KEYS.PATH_LENGTHEN]: { baseCost: 50, growth: 1.7 },
  [TD_ACTION_COST_KEYS.RUN_TESTS]: { baseCost: 140, growth: 1.75 },
  [TD_ACTION_COST_KEYS.STDOUT]: { baseCost: 100, growth: 1.65 },
  [TD_ACTION_COST_KEYS.STDERR]: { baseCost: 100, growth: 1.65 },
  [TD_ACTION_COST_KEYS.OUTPUT]: { baseCost: 120, growth: 1.7 },
});

export function createInitialActionUsageCounts() {
  return {
    [TD_ACTION_COST_KEYS.PATH_SHORTEN]: 0,
    [TD_ACTION_COST_KEYS.PATH_LENGTHEN]: 0,
    [TD_ACTION_COST_KEYS.RUN_TESTS]: 0,
    [TD_ACTION_COST_KEYS.STDOUT]: 0,
    [TD_ACTION_COST_KEYS.STDERR]: 0,
    [TD_ACTION_COST_KEYS.OUTPUT]: 0,
  };
}

export function getTowerDefenseActionCost(actionKey, usageCounts = {}) {
  const config = TD_ACTION_COST_CONFIG[actionKey];
  if (!config) return 0;
  const uses = Math.max(0, Number(usageCounts?.[actionKey] || 0));
  return Math.max(1, Math.round(config.baseCost * Math.pow(config.growth, uses)));
}

export function getTowerDefenseActionCosts(usageCounts = {}) {
  return {
    [TD_ACTION_COST_KEYS.PATH_SHORTEN]: getTowerDefenseActionCost(
      TD_ACTION_COST_KEYS.PATH_SHORTEN,
      usageCounts
    ),
    [TD_ACTION_COST_KEYS.PATH_LENGTHEN]: getTowerDefenseActionCost(
      TD_ACTION_COST_KEYS.PATH_LENGTHEN,
      usageCounts
    ),
    [TD_ACTION_COST_KEYS.RUN_TESTS]: getTowerDefenseActionCost(
      TD_ACTION_COST_KEYS.RUN_TESTS,
      usageCounts
    ),
    [TD_ACTION_COST_KEYS.STDOUT]: getTowerDefenseActionCost(
      TD_ACTION_COST_KEYS.STDOUT,
      usageCounts
    ),
    [TD_ACTION_COST_KEYS.STDERR]: getTowerDefenseActionCost(
      TD_ACTION_COST_KEYS.STDERR,
      usageCounts
    ),
    [TD_ACTION_COST_KEYS.OUTPUT]: getTowerDefenseActionCost(
      TD_ACTION_COST_KEYS.OUTPUT,
      usageCounts
    ),
  };
}
