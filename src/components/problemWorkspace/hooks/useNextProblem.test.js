import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockApi = vi.hoisted(() => ({
  aiProblems: {
    getNextProblem: vi.fn(),
  },
  problems: {
    getNextProblem: vi.fn(),
    lookupBySlugs: vi.fn(),
  },
}));

vi.mock('../../../services/api', () => ({
  api: mockApi,
}));

vi.mock('../../../utils/core/logger', () => ({
  default: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

import useNextProblem from './useNextProblem';

describe('useNextProblem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches next AI problem when AI problem identifiers are present', async () => {
    const next = { id: 'ai-2', title: 'Next AI Problem' };
    mockApi.aiProblems.getNextProblem.mockResolvedValue(next);

    const { result } = renderHook(() =>
      useNextProblem({
        problemData: { id: 'ai-1', displayNumber: 7 },
        isAIProblem: true,
      })
    );

    await waitFor(() => {
      expect(mockApi.aiProblems.getNextProblem).toHaveBeenCalledWith('ai-1', 7);
      expect(result.current.nextProblem).toEqual(next);
    });
  });

  it('sets nextProblem to null when AI problem id is missing', async () => {
    const { result } = renderHook(() =>
      useNextProblem({
        problemData: { displayNumber: 4 },
        isAIProblem: true,
      })
    );

    await waitFor(() => {
      expect(mockApi.aiProblems.getNextProblem).not.toHaveBeenCalled();
      expect(result.current.nextProblem).toBeNull();
    });
  });

  it('handles AI endpoint errors by resetting nextProblem to null', async () => {
    mockApi.aiProblems.getNextProblem.mockResolvedValue({ error: 'No next problem' });

    const { result } = renderHook(() =>
      useNextProblem({
        problemData: { id: 'ai-1', displayNumber: 1 },
        isAIProblem: true,
      })
    );

    await waitFor(() => {
      expect(mockApi.aiProblems.getNextProblem).toHaveBeenCalled();
      expect(result.current.nextProblem).toBeNull();
    });
  });

  it('fetches next standard problem when questionId is present', async () => {
    const next = { questionId: '2', title: 'Add Two Numbers' };
    mockApi.problems.getNextProblem.mockResolvedValue(next);

    const { result } = renderHook(() =>
      useNextProblem({
        problemData: { questionId: '1' },
        isAIProblem: false,
      })
    );

    await waitFor(() => {
      expect(mockApi.problems.getNextProblem).toHaveBeenCalledWith('1');
      expect(result.current.nextProblem).toEqual(next);
    });
  });

  it('falls back to questionFrontendId when questionId is missing', async () => {
    const next = { questionId: '218', title: 'Contains Duplicate' };
    mockApi.problems.getNextProblem.mockResolvedValue(next);

    const { result } = renderHook(() =>
      useNextProblem({
        problemData: { questionFrontendId: '217' },
        isAIProblem: false,
      })
    );

    await waitFor(() => {
      expect(mockApi.problems.getNextProblem).toHaveBeenCalledWith('217');
      expect(result.current.nextProblem).toEqual(next);
    });
  });

  it('falls back to titleSlug when numeric identifiers are missing', async () => {
    const next = {
      titleSlug: 'trace-rogue-daemon-instances',
      title: 'Trace Rogue Daemon Instances',
    };
    mockApi.problems.getNextProblem.mockResolvedValue(next);

    const { result } = renderHook(() =>
      useNextProblem({
        problemData: { titleSlug: 'decrypt-neural-frequency-pair' },
        isAIProblem: false,
      })
    );

    await waitFor(() => {
      expect(mockApi.problems.getNextProblem).toHaveBeenCalledWith('decrypt-neural-frequency-pair');
      expect(result.current.nextProblem).toEqual(next);
    });
  });

  it('sets nextProblem to null when no standard cursor is available', async () => {
    const { result } = renderHook(() =>
      useNextProblem({
        problemData: {},
        isAIProblem: false,
      })
    );

    await waitFor(() => {
      expect(mockApi.problems.getNextProblem).not.toHaveBeenCalled();
      expect(result.current.nextProblem).toBeNull();
    });
  });

  it('uses cluster-ordered navigation when cluster context is present', async () => {
    const next = {
      titleSlug: 'add-two-numbers',
      title: 'Add Two Numbers',
      difficulty: 'Medium',
    };
    mockApi.problems.lookupBySlugs.mockResolvedValue({ problems: [next] });

    const { result } = renderHook(() =>
      useNextProblem({
        problemData: { questionId: '1', titleSlug: 'two-sum' },
        isAIProblem: false,
        currentTitleSlug: 'two-sum',
        clusterNavigation: {
          clusterId: 'beginner-track',
          orderedSlugs: ['two-sum', 'add-two-numbers', 'valid-parentheses'],
        },
      })
    );

    await waitFor(() => {
      expect(mockApi.problems.lookupBySlugs).toHaveBeenCalledWith(['add-two-numbers']);
      expect(mockApi.problems.getNextProblem).not.toHaveBeenCalled();
      expect(result.current.nextProblem).toEqual(next);
    });
  });

  it('returns null when cluster context has no next slug', async () => {
    const { result } = renderHook(() =>
      useNextProblem({
        problemData: { questionId: '2', titleSlug: 'add-two-numbers' },
        isAIProblem: false,
        currentTitleSlug: 'add-two-numbers',
        clusterNavigation: {
          clusterId: 'beginner-track',
          orderedSlugs: ['two-sum', 'add-two-numbers'],
        },
      })
    );

    await waitFor(() => {
      expect(mockApi.problems.lookupBySlugs).not.toHaveBeenCalled();
      expect(mockApi.problems.getNextProblem).not.toHaveBeenCalled();
      expect(result.current.nextProblem).toBeNull();
    });
  });
});
