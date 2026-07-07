import { describe, it, expect } from 'vitest';
import { formatSeconds } from './leaderboardUtils.js';

describe('formatSeconds', () => {
  it('formats zero seconds as 0:00', () => {
    expect(formatSeconds(0)).toBe('0:00');
  });

  it('formats seconds-only values', () => {
    expect(formatSeconds(45)).toBe('0:45');
    expect(formatSeconds(9)).toBe('0:09');
  });

  it('formats one minute exactly', () => {
    expect(formatSeconds(60)).toBe('1:00');
  });

  it('formats minutes and seconds', () => {
    expect(formatSeconds(90)).toBe('1:30');
    expect(formatSeconds(125)).toBe('2:05');
  });

  it('pads single-digit seconds with a leading zero', () => {
    expect(formatSeconds(61)).toBe('1:01');
  });

  it('handles large values', () => {
    expect(formatSeconds(3600)).toBe('60:00');
    expect(formatSeconds(3661)).toBe('61:01');
  });

  it('clamps negative numbers to 0:00', () => {
    expect(formatSeconds(-5)).toBe('0:00');
  });

  it('coerces non-numeric inputs to 0:00', () => {
    expect(formatSeconds(null)).toBe('0:00');
    expect(formatSeconds(undefined)).toBe('0:00');
    expect(formatSeconds('abc')).toBe('0:00');
  });

  it('coerces numeric strings', () => {
    expect(formatSeconds('90')).toBe('1:30');
  });
});
