import { describe, expect, it } from 'vitest';
import { calculateAiPenalty, getTimeLimit } from './timeHelpers';

describe('timeHelpers', () => {
  it('returns time limit by difficulty with fallback', () => {
    expect(getTimeLimit('EASY')).toBe(15 * 60);
    expect(getTimeLimit('medium')).toBe(30 * 60);
    expect(getTimeLimit('Hard')).toBe(45 * 60);
    expect(getTimeLimit('unknown')).toBe(15 * 60);
    expect(getTimeLimit(undefined)).toBe(15 * 60);
  });

  it('calculates progressive AI penalties with a hard cap', () => {
    expect(calculateAiPenalty(0)).toBe(0);
    expect(calculateAiPenalty(1)).toBe(50);
    expect(calculateAiPenalty(3)).toBe(225);
    expect(calculateAiPenalty(20)).toBe(400);
  });
});
