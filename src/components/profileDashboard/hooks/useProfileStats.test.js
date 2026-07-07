import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import useProfileStats from './useProfileStats';

describe('useProfileStats', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-03T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculates success rate and handles empty input', () => {
    const { result } = renderHook(() => useProfileStats());

    expect(result.current.calculateSuccessRate()).toBe(0);
    expect(result.current.calculateSuccessRate([])).toBe(0);

    const submissions = [
      { status: 'accepted' },
      { status: 'wrong_answer' },
      { status: 'accepted' },
    ];
    expect(result.current.calculateSuccessRate(submissions)).toBe(67);
  });

  it('calculates active streak based on consecutive accepted submission days', () => {
    const { result } = renderHook(() => useProfileStats());

    const submissions = [
      { status: 'accepted', submission_date: '2026-03-03T09:00:00.000Z' },
      { status: 'accepted', submission_date: '2026-03-03T10:00:00.000Z' },
      { status: 'accepted', submission_date: '2026-03-02T08:00:00.000Z' },
      { status: 'accepted', submission_date: '2026-03-01T08:00:00.000Z' },
      { status: 'runtime_error', submission_date: '2026-02-28T08:00:00.000Z' },
    ];

    expect(result.current.calculateStreak(submissions)).toBe(3);
  });

  it('returns zero streak when latest accepted submission is too old', () => {
    const { result } = renderHook(() => useProfileStats());

    const stale = [{ status: 'accepted', submission_date: '2026-03-01T08:00:00.000Z' }];
    const noneAccepted = [{ status: 'wrong_answer', submission_date: '2026-03-03T08:00:00.000Z' }];

    expect(result.current.calculateStreak(stale)).toBe(0);
    expect(result.current.calculateStreak(noneAccepted)).toBe(0);
    expect(result.current.calculateStreak([])).toBe(0);
  });
});
