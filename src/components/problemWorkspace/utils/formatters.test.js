import { describe, expect, it } from 'vitest';
import { formatTime, formatTimeFromSeconds } from './formatters';

describe('problemWorkspace formatters', () => {
  it('formats time values as mm:ss', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(600)).toBe('10:00');
  });

  it('formats seconds using the alternate formatter', () => {
    expect(formatTimeFromSeconds(9)).toBe('00:09');
    expect(formatTimeFromSeconds(3599)).toBe('59:59');
  });
});
