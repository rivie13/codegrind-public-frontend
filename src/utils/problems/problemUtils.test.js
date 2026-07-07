import { describe, expect, it } from 'vitest';
import { DIFFICULTY, getDifficultyString } from './problemUtils';

describe('problemUtils', () => {
  it('exports expected difficulty constants', () => {
    expect(DIFFICULTY).toEqual({
      EASY: 'EASY',
      MEDIUM: 'MEDIUM',
      HARD: 'HARD',
    });
  });

  it('maps difficulty values to lowercase strings', () => {
    expect(getDifficultyString('easy')).toBe('easy');
    expect(getDifficultyString('MEDIUM')).toBe('medium');
    expect(getDifficultyString('Hard')).toBe('hard');
  });

  it('returns null for unsupported or empty values', () => {
    expect(getDifficultyString('impossible')).toBeNull();
    expect(getDifficultyString('')).toBeNull();
    expect(getDifficultyString(null)).toBeNull();
    expect(getDifficultyString(undefined)).toBeNull();
  });
});
