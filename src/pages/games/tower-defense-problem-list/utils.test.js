import { describe, expect, it } from 'vitest';
import { getDifficultyColor, getDifficultyShadow } from './utils';

describe('tower-defense problem-list utils', () => {
  it('maps known difficulties to theme colors and shadows', () => {
    expect(getDifficultyColor('easy')).toBe('#00FF8C');
    expect(getDifficultyColor('MEDIUM')).toBe('#FFCC00');
    expect(getDifficultyColor('Hard')).toBe('#FF0000');

    expect(getDifficultyShadow('easy')).toBe('0 0 5px rgba(0, 255, 140, 0.3)');
    expect(getDifficultyShadow('MEDIUM')).toBe('0 0 5px rgba(255, 204, 0, 0.3)');
    expect(getDifficultyShadow('Hard')).toBe('0 0 5px rgba(255, 0, 0, 0.3)');
  });

  it('returns fallback values for unknown difficulties', () => {
    expect(getDifficultyColor('legendary')).toBe('gray.400');
    expect(getDifficultyShadow('legendary')).toBe('none');
  });
});
