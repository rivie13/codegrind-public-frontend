import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockApi = vi.hoisted(() => ({
  scores: {
    get: vi.fn(),
    update: vi.fn(),
  },
  aiProblems: {
    updateScore: vi.fn(),
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

import useSubmissions from './useSubmissions';

const lcProblem = {
  questionId: '1',
  titleSlug: 'twosum',
};

const codegrindProblem = {
  id: '501',
  source: 'CODEGRIND',
  questionId: '1',
  titleSlug: 'decrypt-neural-frequency-pair',
};

const codegrindFunctionProblem = {
  id: '2948',
  source: 'CODEGRIND',
  functionName: 'decryptNeuralFrequencyPair',
  questionFrontendId: 2,
  displayNumber: 2,
  titleSlug: 'decrypt-neural-frequency-pair',
};

const legacyLeetcodeProblem = {
  source: 'LEETCODE',
  questionId: '217',
  id: '999',
  titleSlug: 'contains-duplicate',
};

const aiProblem = {
  id: 'ai-7',
  questionId: '99',
  titleSlug: 'my-ai-problem',
};

const renderSubmissionsHook = (overrides = {}) => {
  const onLoadError = overrides.onLoadError ?? vi.fn();
  const onScoreSyncError = overrides.onScoreSyncError ?? vi.fn();

  const hook = renderHook(() =>
    useSubmissions({
      user: overrides.user ?? { id: 'user-1' },
      problemData: overrides.problemData ?? lcProblem,
      mode: overrides.mode ?? 'ranked',
      onLoadError,
      onScoreSyncError,
    })
  );

  return { ...hook, onLoadError, onScoreSyncError };
};

describe('useSubmissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.scores.get.mockResolvedValue({ highScore: 120, bestTime: 35 });
    mockApi.scores.update.mockResolvedValue({ highScore: 180, bestTime: 28 });
    mockApi.aiProblems.updateScore.mockResolvedValue({ highScore: 95, bestTime: 41 });
  });

  it('fetches leaderboard history for standard problems via scores.get', async () => {
    const { result } = renderSubmissionsHook();

    await waitFor(() => {
      expect(mockApi.scores.get).toHaveBeenCalledWith('user-1', '1', 'CODEGRIND');
      expect(result.current.highScore).toBe(120);
      expect(result.current.bestTime).toBe(35);
    });
  });

  it('fetches AI score history using AI problem identifiers', async () => {
    renderSubmissionsHook({ user: { id: 'user-2' }, problemData: aiProblem, mode: 'challenge' });

    await waitFor(() => {
      expect(mockApi.scores.get).toHaveBeenCalledWith('user-2', 'ai-7', 'AI');
    });
  });

  it('updates ranked scores and computes achievement flags for standard problems', async () => {
    const { result } = renderSubmissionsHook();

    await waitFor(() => {
      expect(result.current.highScore).toBe(120);
    });

    await act(async () => {
      await result.current.updateScore(180, 28);
    });

    expect(mockApi.scores.update).toHaveBeenCalledWith('user-1', '1', 180, 28, 'CODEGRIND');
    expect(result.current.finalScore).toBe(180);
    expect(result.current.timeSpent).toBe(28);
    expect(result.current.hasNewHighScore).toBe(true);
    expect(result.current.hasNewBestTime).toBe(true);
  });

  it('prefers CODEGRIND record id for interview score lookups', async () => {
    renderSubmissionsHook({ user: { id: 'user-4' }, problemData: codegrindProblem });

    await waitFor(() => {
      expect(mockApi.scores.get).toHaveBeenCalledWith('user-4', '501', 'CODEGRIND');
    });
  });

  it('does not classify CODEGRIND function problems as AI score lookups', async () => {
    renderSubmissionsHook({ user: { id: 'user-6' }, problemData: codegrindFunctionProblem });

    await waitFor(() => {
      expect(mockApi.scores.get).toHaveBeenCalledWith('user-6', '2948', 'CODEGRIND');
    });
  });

  it('keeps LEETCODE problemType for legacy interview rows', async () => {
    const { result } = renderSubmissionsHook({
      user: { id: 'user-5' },
      problemData: legacyLeetcodeProblem,
    });

    await waitFor(() => {
      expect(mockApi.scores.get).toHaveBeenCalledWith('user-5', '217', 'LEETCODE');
    });

    await act(async () => {
      await result.current.updateScore(190, 25);
    });

    expect(mockApi.scores.update).toHaveBeenCalledWith('user-5', '217', 190, 25, 'LEETCODE');
  });

  it('updates AI scores through aiProblems.updateScore', async () => {
    const { result } = renderSubmissionsHook({
      user: { id: 'user-3' },
      problemData: aiProblem,
      mode: 'challenge',
    });

    await waitFor(() => {
      expect(mockApi.scores.get).toHaveBeenCalledWith('user-3', 'ai-7', 'AI');
    });

    await act(async () => {
      await result.current.updateScore(95, 41);
    });

    expect(mockApi.aiProblems.updateScore).toHaveBeenCalledWith('user-3', 'ai-7', 95, 41);
    expect(mockApi.scores.update).not.toHaveBeenCalledWith('user-3', 'ai-7', 95, 41);
  });

  it('does not submit score updates outside ranked/challenge modes', async () => {
    const { result } = renderSubmissionsHook({ mode: 'practice' });

    await waitFor(() => {
      expect(mockApi.scores.get).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.updateScore(200, 20);
    });

    expect(mockApi.scores.update).not.toHaveBeenCalled();
    expect(mockApi.aiProblems.updateScore).not.toHaveBeenCalled();
  });

  it('resets per-session submission count when the problem changes', async () => {
    const { result, rerender } = renderHook(
      ({ problemData }) =>
        useSubmissions({
          user: { id: 'user-1' },
          problemData,
          mode: 'ranked',
          onLoadError: vi.fn(),
          onScoreSyncError: vi.fn(),
        }),
      {
        initialProps: { problemData: lcProblem },
      }
    );

    await act(async () => {
      result.current.setSessionSubmissions(3);
    });
    expect(result.current.sessionSubmissions).toBe(3);

    rerender({ problemData: { ...lcProblem, questionId: '2' } });

    await waitFor(() => {
      expect(result.current.sessionSubmissions).toBe(0);
    });
  });

  it('notifies the UI when score history lookup fails', async () => {
    mockApi.scores.get.mockRejectedValue(new Error('history unavailable'));

    const { onLoadError } = renderSubmissionsHook();

    await waitFor(() => {
      expect(onLoadError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it('notifies the UI when score update fails', async () => {
    mockApi.scores.update.mockRejectedValue(new Error('save failed'));

    const { result, onScoreSyncError } = renderSubmissionsHook();

    await waitFor(() => {
      expect(result.current.highScore).toBe(120);
    });

    await act(async () => {
      await result.current.updateScore(180, 28);
    });

    expect(onScoreSyncError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('does not refetch score history when error callbacks change identity on rerender', async () => {
    const { rerender } = renderHook(
      ({ onLoadError, onScoreSyncError }) =>
        useSubmissions({
          user: { id: 'user-1' },
          problemData: codegrindProblem,
          mode: 'ranked',
          onLoadError,
          onScoreSyncError,
        }),
      {
        initialProps: {
          onLoadError: vi.fn(),
          onScoreSyncError: vi.fn(),
        },
      }
    );

    await waitFor(() => {
      expect(mockApi.scores.get).toHaveBeenCalledTimes(1);
    });

    rerender({
      onLoadError: vi.fn(),
      onScoreSyncError: vi.fn(),
    });

    await waitFor(() => {
      expect(mockApi.scores.get).toHaveBeenCalledTimes(1);
    });
  });
});
