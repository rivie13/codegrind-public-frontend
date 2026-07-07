import { describe, expect, it, vi } from 'vitest';

vi.mock('../../hooks/guest/useGuestProgress', () => ({
  getGuestXpSummaryFromTotalXp: vi.fn((totalXp) => {
    // Simple stub: level = floor(totalXp / 100), xpIntoLevel = totalXp % 100
    const level = Math.floor(totalXp / 100) + 1;
    const xpIntoLevel = totalXp % 100;
    const xpToNextLevel = 100;
    return {
      xp: totalXp,
      level,
      roleName: level <= 2 ? 'Script Kiddie' : 'Hacker',
      xpIntoLevel,
      xpToNextLevel,
      progressPercent: (xpIntoLevel / xpToNextLevel) * 100,
      xpRemainingToNextLevel: xpToNextLevel - xpIntoLevel,
    };
  }),
}));

import { buildGuestXpPayload } from './guestXpPayload';

describe('buildGuestXpPayload', () => {
  it('returns summary, awards, and levelUp keys', () => {
    const result = buildGuestXpPayload({ previousTotalXp: 0, currentTotalXp: 50 });
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('awards');
    expect(result).toHaveProperty('levelUp');
  });

  it('summary reflects current XP state', () => {
    const result = buildGuestXpPayload({ previousTotalXp: 0, currentTotalXp: 50 });
    expect(result.summary.xp).toBe(50);
    expect(result.summary.level).toBe(1);
  });

  it('awards array contains entry when xp was gained', () => {
    const result = buildGuestXpPayload({
      previousTotalXp: 0,
      currentTotalXp: 75,
      reason: 'problem_solve',
    });
    expect(result.awards).toHaveLength(1);
    expect(result.awards[0].amount).toBe(75);
    expect(result.awards[0].reason).toBe('problem_solve');
  });

  it('awards array is empty when no xp was gained', () => {
    const result = buildGuestXpPayload({ previousTotalXp: 50, currentTotalXp: 50 });
    expect(result.awards).toHaveLength(0);
  });

  it('awards array is empty when currentTotalXp < previousTotalXp', () => {
    const result = buildGuestXpPayload({ previousTotalXp: 100, currentTotalXp: 50 });
    expect(result.awards).toHaveLength(0);
  });

  it('detects level up when level increases', () => {
    // previous: 99 xp (level 1), current: 150 xp (level 2)
    const result = buildGuestXpPayload({ previousTotalXp: 99, currentTotalXp: 150 });
    expect(result.levelUp).not.toBeNull();
    expect(result.levelUp.previousLevel).toBe(1);
    expect(result.levelUp.newLevel).toBe(2);
  });

  it('levelUp is null when no level change', () => {
    const result = buildGuestXpPayload({ previousTotalXp: 10, currentTotalXp: 50 });
    expect(result.levelUp).toBeNull();
  });

  it('uses default reason of problem_solve', () => {
    const result = buildGuestXpPayload({ previousTotalXp: 0, currentTotalXp: 10 });
    expect(result.awards[0].reason).toBe('problem_solve');
  });

  it('clamps negative xp values to 0', () => {
    const result = buildGuestXpPayload({ previousTotalXp: -10, currentTotalXp: -5 });
    expect(result.summary.xp).toBe(0);
    expect(result.awards).toHaveLength(0);
  });

  it('handles non-numeric inputs gracefully', () => {
    const result = buildGuestXpPayload({ previousTotalXp: 'abc', currentTotalXp: null });
    expect(result.summary.xp).toBe(0);
    expect(result.awards).toHaveLength(0);
  });

  it('levelUp includes roleChanged flag', () => {
    // level 1 = 'Script Kiddie', level 3 = 'Hacker' in our stub
    const result = buildGuestXpPayload({ previousTotalXp: 99, currentTotalXp: 200 });
    expect(result.levelUp).toHaveProperty('roleChanged');
  });
});
