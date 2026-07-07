import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import useXpNumberAnimation from './useXpNumberAnimation';

describe('useXpNumberAnimation', () => {
  let now;
  let rafCallbacks;
  let cancelSpy;

  beforeEach(() => {
    now = 0;
    rafCallbacks = [];

    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.stubGlobal('requestAnimationFrame', (cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    cancelSpy = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancelSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('normalizes invalid target values in initial state', () => {
    const { result } = renderHook(() =>
      useXpNumberAnimation({
        isOpen: false,
        target: { into: Number.NaN, toNext: undefined, remaining: 'x' },
      })
    );

    expect(result.current).toEqual({
      into: 0,
      toNext: 0,
      remaining: 0,
    });
  });

  it('sets final values immediately when durationMs is zero', () => {
    const { result } = renderHook(() =>
      useXpNumberAnimation({
        isOpen: true,
        target: { into: 30, toNext: 120, remaining: null },
        durationMs: 0,
      })
    );

    expect(result.current).toEqual({
      into: 30,
      toNext: 120,
      remaining: null,
    });
  });

  it('animates values toward target using requestAnimationFrame', () => {
    const { result, rerender } = renderHook(
      ({ target }) =>
        useXpNumberAnimation({
          isOpen: true,
          target,
          durationMs: 100,
        }),
      {
        initialProps: {
          target: { into: 0, toNext: 0, remaining: 0 },
        },
      }
    );

    rerender({
      target: { into: 100, toNext: 200, remaining: 300 },
    });

    expect(rafCallbacks.length).toBeGreaterThan(0);
    const firstTick = rafCallbacks[rafCallbacks.length - 1];

    act(() => {
      now = 50;
      firstTick(50);
    });
    expect(result.current.into).toBeGreaterThan(0);
    expect(result.current.into).toBeLessThan(100);

    const finalTick = rafCallbacks[rafCallbacks.length - 1];
    act(() => {
      now = 100;
      finalTick(100);
    });

    expect(result.current).toEqual({
      into: 100,
      toNext: 200,
      remaining: 300,
    });
  });

  it('cancels a scheduled animation frame when dependencies change', () => {
    const { rerender } = renderHook(
      ({ isOpen, target }) =>
        useXpNumberAnimation({
          isOpen,
          target,
          durationMs: 100,
        }),
      {
        initialProps: {
          isOpen: true,
          target: { into: 10, toNext: 20, remaining: 30 },
        },
      }
    );

    expect(rafCallbacks.length).toBe(1);

    rerender({
      isOpen: true,
      target: { into: 40, toNext: 60, remaining: 80 },
    });

    expect(cancelSpy).toHaveBeenCalled();
  });

  it('animates to null remaining and supports null-to-number fallback lerp', () => {
    const { result, rerender } = renderHook(
      ({ target }) =>
        useXpNumberAnimation({
          isOpen: true,
          target,
          durationMs: 100,
        }),
      {
        initialProps: {
          target: { into: 5, toNext: 10, remaining: null },
        },
      }
    );

    rerender({
      target: { into: 20, toNext: 40, remaining: 50 },
    });

    let tick = rafCallbacks[rafCallbacks.length - 1];
    act(() => {
      now = 100;
      tick(100);
    });
    expect(result.current.remaining).toBe(50);

    rerender({
      target: { into: 30, toNext: 60, remaining: null },
    });

    tick = rafCallbacks[rafCallbacks.length - 1];
    act(() => {
      now = 200;
      tick(200);
    });

    expect(result.current.remaining).toBeNull();
  });

  it('does not attempt cancellation when unmounting with no active animation', () => {
    const { unmount } = renderHook(() =>
      useXpNumberAnimation({
        isOpen: false,
        target: { into: 1, toNext: 2, remaining: 3 },
      })
    );

    unmount();
    expect(cancelSpy).not.toHaveBeenCalled();
  });
});
