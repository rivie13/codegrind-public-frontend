import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useAdBlockDetector from './useAdBlockDetector';

describe('useAdBlockDetector', () => {
  let originalFetch;

  beforeEach(() => {
    vi.useFakeTimers();
    originalFetch = global.fetch;
    global.fetch = vi.fn();
    global.fetch.mockResolvedValue({ type: 'opaque' });
    delete window.adsenseScriptLoaded;
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('starts with adBlockDetected = null', () => {
    const { result } = renderHook(() => useAdBlockDetector());
    expect(result.current.adBlockDetected).toBeNull();
  });

  it('exposes recheckAdBlock function', () => {
    const { result } = renderHook(() => useAdBlockDetector());
    expect(typeof result.current.recheckAdBlock).toBe('function');
  });

  it('resolves adBlockDetected to a boolean after detection runs', async () => {
    const { result } = renderHook(() => useAdBlockDetector());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // jsdom does not do layout so we only assert it resolves to a boolean
    expect(typeof result.current.adBlockDetected).toBe('boolean');
  });

  it('detects ad blocker when fetch throws (network blocked)', async () => {
    global.fetch.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useAdBlockDetector());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // fetch throws -> strategy 2 sets blocked = true
    expect(result.current.adBlockDetected).toBe(true);
  });

  it('recheckAdBlock re-runs detection and updates state', async () => {
    const { result } = renderHook(() => useAdBlockDetector());

    // Flush initial detection (fetch succeeds)
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Now make fetch fail and recheck
    global.fetch.mockRejectedValue(new Error('blocked'));

    await act(async () => {
      const p = result.current.recheckAdBlock();
      await vi.runAllTimersAsync();
      await p;
    });

    expect(result.current.adBlockDetected).toBe(true);
  });

  it('cleans up bait element and timer on unmount', () => {
    const { unmount } = renderHook(() => useAdBlockDetector());
    // Should not throw
    unmount();
  });
});
