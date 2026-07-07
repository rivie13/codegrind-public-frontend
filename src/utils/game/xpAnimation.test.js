import { describe, expect, it } from 'vitest';
import {
  buildProgressTransition,
  getProgressTransitionDuration,
  getXpNumbersForPercent,
} from './xpAnimation';

describe('xpAnimation utilities', () => {
  it('returns the minimum duration when there is no progress delta', () => {
    expect(getProgressTransitionDuration({ fromPercent: 20, toPercent: 20 })).toBe(1200);
    expect(getProgressTransitionDuration({ fromPercent: 'x', toPercent: null })).toBe(1200);
  });

  it('scales transition duration by percent delta with clamping', () => {
    expect(
      getProgressTransitionDuration({
        fromPercent: 10,
        toPercent: 60,
        minMs: 1200,
        maxMs: 1800,
      })
    ).toBe(1500);

    expect(
      getProgressTransitionDuration({
        fromPercent: -100,
        toPercent: 300,
        minMs: 1000,
        maxMs: 2000,
      })
    ).toBe(1000);
  });

  it('builds CSS transition strings from a duration', () => {
    expect(buildProgressTransition(900)).toBe('width 900ms ease');
  });

  it('calculates into/remaining XP values with safety clamps', () => {
    expect(getXpNumbersForPercent({ percent: 50, toNext: 200 })).toEqual({
      into: 100,
      toNext: 200,
      remaining: 100,
    });

    expect(getXpNumbersForPercent({ percent: 125, toNext: 50, showRemaining: false })).toEqual({
      into: 50,
      toNext: 50,
      remaining: null,
    });

    expect(getXpNumbersForPercent({ percent: -10, toNext: -20 })).toEqual({
      into: 0,
      toNext: 0,
      remaining: 0,
    });
  });
});
