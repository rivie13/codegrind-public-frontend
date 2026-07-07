import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from './useTimer';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('useTimer initial state', () => {
  it('starts with timer=0, not running, not started', () => {
    const { result } = renderHook(() => useTimer('practice'));
    expect(result.current.timer).toBe(0);
    expect(result.current.isTimerRunning).toBe(false);
    expect(result.current.hasStarted).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// startTimer
// ---------------------------------------------------------------------------

describe('useTimer.startTimer', () => {
  it('does nothing in practice mode', () => {
    const { result } = renderHook(() => useTimer('practice'));

    act(() => result.current.startTimer());

    expect(result.current.isTimerRunning).toBe(false);
    expect(result.current.hasStarted).toBe(false);
  });

  it('starts the timer in ranked mode', () => {
    const { result } = renderHook(() => useTimer('ranked'));

    act(() => result.current.startTimer());

    expect(result.current.isTimerRunning).toBe(true);
    expect(result.current.hasStarted).toBe(true);
  });

  it('starts the timer in challenge mode', () => {
    const { result } = renderHook(() => useTimer('challenge'));

    act(() => result.current.startTimer());

    expect(result.current.isTimerRunning).toBe(true);
    expect(result.current.hasStarted).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Timer counting
// ---------------------------------------------------------------------------

describe('useTimer counting', () => {
  it('increments timer every second when running (no timeLimit)', () => {
    const { result } = renderHook(() => useTimer('ranked'));

    act(() => result.current.startTimer());
    act(() => vi.advanceTimersByTime(3000));

    expect(result.current.timer).toBe(3);
  });

  it('decrements timer every second in countdown mode', () => {
    const { result } = renderHook(() => useTimer('ranked'));

    act(() => result.current.setFreshTimer(10, true)); // countdown from 10
    act(() => result.current.startTimer());
    act(() => vi.advanceTimersByTime(3000));

    expect(result.current.timer).toBe(7);
  });

  it('does not tick in practice mode', () => {
    const { result } = renderHook(() => useTimer('practice'));

    // startTimer is a no-op for practice, but let's simulate manually setting running
    act(() => vi.advanceTimersByTime(5000));

    expect(result.current.timer).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// stopTimer
// ---------------------------------------------------------------------------

describe('useTimer.stopTimer', () => {
  it('stops the timer', () => {
    const { result } = renderHook(() => useTimer('ranked'));

    act(() => result.current.startTimer());
    act(() => vi.advanceTimersByTime(2000));
    act(() => result.current.stopTimer());
    act(() => vi.advanceTimersByTime(3000));

    expect(result.current.timer).toBe(2); // frozen at 2
    expect(result.current.isTimerRunning).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// restartTimer
// ---------------------------------------------------------------------------

describe('useTimer.restartTimer', () => {
  it('resumes the timer in ranked mode', () => {
    const { result } = renderHook(() => useTimer('ranked'));

    act(() => result.current.startTimer());
    act(() => vi.advanceTimersByTime(2000));
    act(() => result.current.stopTimer());
    act(() => result.current.restartTimer());
    act(() => vi.advanceTimersByTime(1000));

    expect(result.current.isTimerRunning).toBe(true);
    expect(result.current.timer).toBe(3);
  });

  it('does nothing in practice mode', () => {
    const { result } = renderHook(() => useTimer('practice'));

    act(() => result.current.restartTimer());

    expect(result.current.isTimerRunning).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// setFreshTimer
// ---------------------------------------------------------------------------

describe('useTimer.setFreshTimer', () => {
  it('resets timer, stops running, clears hasStarted', () => {
    const { result } = renderHook(() => useTimer('ranked'));

    act(() => result.current.startTimer());
    act(() => vi.advanceTimersByTime(5000));
    act(() => result.current.setFreshTimer(0, false));

    expect(result.current.timer).toBe(0);
    expect(result.current.isTimerRunning).toBe(false);
    expect(result.current.hasStarted).toBe(false);
  });

  it('sets a non-zero starting value', () => {
    const { result } = renderHook(() => useTimer('ranked'));

    act(() => result.current.setFreshTimer(60, true));

    expect(result.current.timer).toBe(60);
  });
});
