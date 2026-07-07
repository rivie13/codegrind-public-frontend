import { describe, it, expect, vi } from 'vitest';
import {
  calculateScore,
  calculateEndlessWaveBonus,
  addEndlessScore,
  getEndlessSurvivalTime,
  applyEndlessSurvivalBonus,
} from './scoring.js';

const GAME_CONSTANTS = {
  SCORE_PER_LIFE: 100,
  SCORE_PER_10_CREDITS: 5,
  TIME_BONUS_BASE: 2000,
  TIME_PENALTY_PER_SECOND: 10,
  SOLUTION_BONUS: 500,
};

const ENDLESS_SCORING = {
  WAVE_CLEAR_BONUS: 200,
  WAVE_MULTIPLIER: 50,
  SURVIVAL_BONUS_PER_MINUTE: 100,
};

function makeEngine(overrides = {}) {
  return {
    GAME_CONSTANTS,
    ENDLESS_SCORING,
    state: { lives: 5, credits: 200, score: 0, endlessScore: 0 },
    totalGameTime: 10000, // 10 seconds
    endlessStartTime: null,
    endlessSurvivalBonusApplied: false,
    ...overrides,
  };
}

describe('calculateScore', () => {
  it('sums lives score, credits score, time bonus, and no solution bonus by default', () => {
    const engine = makeEngine();
    // lives: 5 * 100 = 500
    // credits: floor(200 / 10) * 5 = 100
    // time: max(0, 2000 - 10*10) = 1900
    // solution: 0
    const score = calculateScore(engine);
    expect(score).toBe(500 + 100 + 1900);
  });

  it('adds SOLUTION_BONUS when solutionSuccess is true', () => {
    const engine = makeEngine();
    const baseScore = calculateScore(engine, false);
    const solutionScore = calculateScore(engine, true);
    expect(solutionScore - baseScore).toBe(GAME_CONSTANTS.SOLUTION_BONUS);
  });

  it('clamps time bonus to 0 when game time is very long', () => {
    const engine = makeEngine({ totalGameTime: 999999000 }); // very long game
    const score = calculateScore(engine);
    // time bonus should be 0
    const livesScore = 5 * 100;
    const creditsScore = Math.floor(200 / 10) * 5;
    expect(score).toBe(livesScore + creditsScore);
  });

  it('calculates zero score for engine with no lives or credits', () => {
    const engine = makeEngine({
      state: { lives: 0, credits: 0, score: 0, endlessScore: 0 },
      totalGameTime: 999999000,
    });
    const score = calculateScore(engine);
    expect(score).toBe(0);
  });

  it('rounds credit division to nearest floor', () => {
    const engine = makeEngine({
      state: { lives: 0, credits: 15, score: 0, endlessScore: 0 },
      totalGameTime: 999999000,
    });
    // floor(15/10) * 5 = 5
    const score = calculateScore(engine);
    expect(score).toBe(5);
  });
});

describe('calculateEndlessWaveBonus', () => {
  it('returns correct bonus for wave 1', () => {
    const engine = makeEngine();
    const bonus = calculateEndlessWaveBonus(engine, 1);
    // waveClearBonus = 1 * 200 = 200
    // waveMultiplierBonus = (1 * 0 / 2) * 50 = 0
    expect(bonus).toBe(200);
  });

  it('returns increasing bonus for higher waves', () => {
    const engine = makeEngine();
    const bonus1 = calculateEndlessWaveBonus(engine, 1);
    const bonus5 = calculateEndlessWaveBonus(engine, 5);
    expect(bonus5).toBeGreaterThan(bonus1);
  });

  it('calculates correct bonus for wave 3', () => {
    const engine = makeEngine();
    const bonus = calculateEndlessWaveBonus(engine, 3);
    // waveClearBonus = 3 * 200 = 600
    // waveMultiplierBonus = (3 * 2 / 2) * 50 = 150
    expect(bonus).toBe(750);
  });
});

describe('addEndlessScore', () => {
  it('increments both score and endlessScore', () => {
    const engine = makeEngine();
    addEndlessScore(engine, 300);
    expect(engine.state.score).toBe(300);
    expect(engine.state.endlessScore).toBe(300);
  });

  it('does nothing for zero or negative points', () => {
    const engine = makeEngine();
    addEndlessScore(engine, 0);
    addEndlessScore(engine, -50);
    expect(engine.state.score).toBe(0);
  });

  it('does nothing for falsy points', () => {
    const engine = makeEngine();
    addEndlessScore(engine, null);
    expect(engine.state.score).toBe(0);
  });

  it('accumulates multiple calls', () => {
    const engine = makeEngine();
    addEndlessScore(engine, 100);
    addEndlessScore(engine, 250);
    expect(engine.state.score).toBe(350);
    expect(engine.state.endlessScore).toBe(350);
  });
});

describe('getEndlessSurvivalTime', () => {
  it('returns 0 when endlessStartTime is not set', () => {
    const engine = makeEngine({ endlessStartTime: null });
    expect(getEndlessSurvivalTime(engine)).toBe(0);
  });

  it('returns elapsed time since endlessStartTime', () => {
    const now = Date.now();
    const engine = makeEngine({ endlessStartTime: now - 5000 });
    const elapsed = getEndlessSurvivalTime(engine);
    expect(elapsed).toBeGreaterThanOrEqual(4900);
    expect(elapsed).toBeLessThanOrEqual(6000);
  });
});

describe('applyEndlessSurvivalBonus', () => {
  it('does nothing if already applied', () => {
    const engine = makeEngine({
      endlessSurvivalBonusApplied: true,
      endlessStartTime: Date.now() - 120000,
    });
    applyEndlessSurvivalBonus(engine);
    expect(engine.state.endlessScore).toBe(0);
  });

  it('marks bonus as applied after calling', () => {
    const engine = makeEngine({ endlessStartTime: Date.now() });
    applyEndlessSurvivalBonus(engine);
    expect(engine.endlessSurvivalBonusApplied).toBe(true);
  });

  it('awards survival bonus proportional to minutes survived', () => {
    const engine = makeEngine({ endlessStartTime: Date.now() - 120000 }); // 2 minutes
    applyEndlessSurvivalBonus(engine);
    // 2 minutes * 100/min = 200
    expect(engine.state.endlessScore).toBe(200);
    expect(engine.state.score).toBe(200);
  });

  it('stores the endlessSurvivalTime on the engine state', () => {
    const engine = makeEngine({ endlessStartTime: Date.now() - 60000 });
    applyEndlessSurvivalBonus(engine);
    expect(engine.state.endlessSurvivalTime).toBeGreaterThanOrEqual(59000);
  });
});
