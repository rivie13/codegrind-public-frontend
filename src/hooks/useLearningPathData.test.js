import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const loadHook = async ({ getPathImpl }) => {
  vi.resetModules();

  const getPath = vi.fn(getPathImpl);
  const normalizeLearningPath = vi.fn((raw) => ({
    ...raw,
    normalized: true,
  }));
  const logger = {
    warn: vi.fn(),
    debug: vi.fn(),
  };

  vi.doMock('../services/api', () => ({
    api: {
      learningPath: {
        getPath,
      },
    },
  }));

  vi.doMock('../utils/core/logger', () => ({
    default: logger,
  }));

  vi.doMock('../data/learningPathRegistry', () => ({
    normalizeLearningPath,
  }));

  const mod = await import('./useLearningPathData');
  return {
    useLearningPathData: mod.default,
    getPath,
    normalizeLearningPath,
    logger,
  };
};

describe('useLearningPathData', () => {
  it('normalizes slugs and loads/caches path data', async () => {
    const { useLearningPathData, getPath } = await loadHook({
      getPathImpl: async (pathId) => ({ pathId, title: 'Python' }),
    });

    const first = renderHook(() => useLearningPathData('python'));

    await waitFor(() => expect(first.result.current.loading).toBe(false));
    expect(first.result.current.pathId).toBe('python-path');
    expect(first.result.current.pathData).toEqual({
      pathId: 'python-path',
      title: 'Python',
      normalized: true,
    });
    expect(getPath).toHaveBeenCalledTimes(1);
    expect(getPath).toHaveBeenCalledWith('python-path');

    const second = renderHook(() => useLearningPathData('python-path'));
    expect(second.result.current.loading).toBe(false);
    expect(second.result.current.pathData?.pathId).toBe('python-path');
    expect(getPath).toHaveBeenCalledTimes(1);
  });

  it('returns safe state for empty slugs and handles refresh failures', async () => {
    const { useLearningPathData, getPath, logger } = await loadHook({
      getPathImpl: vi
        .fn()
        .mockResolvedValueOnce({ pathId: 'js-path', title: 'JS' })
        .mockRejectedValueOnce(new Error('refresh failed')),
    });

    const empty = renderHook(() => useLearningPathData('   '));
    expect(empty.result.current.pathId).toBeNull();
    expect(empty.result.current.loading).toBe(false);
    expect(empty.result.current.pathData).toBeNull();
    expect(getPath).not.toHaveBeenCalled();

    const active = renderHook(() => useLearningPathData('js'));
    await waitFor(() => expect(active.result.current.loading).toBe(false));
    expect(active.result.current.pathData?.pathId).toBe('js-path');

    await act(async () => {
      const refreshed = await active.result.current.refresh();
      expect(refreshed).toBeNull();
    });

    expect(active.result.current.error).toBeInstanceOf(Error);
    expect(active.result.current.loading).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith('Failed to refresh learning path data');
  });
});
