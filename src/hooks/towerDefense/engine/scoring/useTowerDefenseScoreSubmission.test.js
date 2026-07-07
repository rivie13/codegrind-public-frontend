import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadHook = async ({ submitScoreImpl } = {}) => {
  vi.resetModules();

  const submitScore = vi.fn(submitScoreImpl || (async () => ({ success: true, score: 1000 })));

  vi.doMock('../../../../services/api', () => ({
    api: {
      towerDefense: {
        submitScore,
      },
    },
  }));

  const mod = await import('./useTowerDefenseScoreSubmission');
  const scoreSubmittedRef = { current: false };
  const endlessScoreSubmittedRef = { current: false };
  const onScoreSyncError = vi.fn();

  const hook = renderHook(() =>
    mod.default({
      getTowerDefenseProblemId: () => 'problem-1',
      codeSubmissionSuccess: true,
      problemSource: 'CODEGRIND',
      scoreSubmittedRef,
      endlessScoreSubmittedRef,
      onScoreSyncError,
    })
  );

  return {
    hook,
    submitScore,
    scoreSubmittedRef,
    endlessScoreSubmittedRef,
    onScoreSyncError,
  };
};

describe('useTowerDefenseScoreSubmission', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('user_id', '42');
  });

  it('notifies the UI and resets the win submission ref when score submission fails', async () => {
    const failure = new Error('network down');
    const { hook, onScoreSyncError, scoreSubmittedRef } = await loadHook({
      submitScoreImpl: async () => {
        throw failure;
      },
    });

    await act(async () => {
      await hook.result.current.submitTowerDefenseWin(1200, 95);
    });

    expect(scoreSubmittedRef.current).toBe(false);
    expect(onScoreSyncError).toHaveBeenCalledWith({ mode: 'win', error: failure });
  });

  it('notifies the UI and resets the endless submission ref when endless score submission fails', async () => {
    const failure = new Error('server error');
    const { hook, onScoreSyncError, endlessScoreSubmittedRef } = await loadHook({
      submitScoreImpl: async () => {
        throw failure;
      },
    });

    await act(async () => {
      await hook.result.current.submitTowerDefenseEndless({
        finalScore: 900,
        finalTimeSeconds: 80,
        endlessScore: 900,
        endlessWaves: 12,
        endlessSurvivalTime: 80,
      });
    });

    expect(endlessScoreSubmittedRef.current).toBe(false);
    expect(onScoreSyncError).toHaveBeenCalledWith({ mode: 'endless', error: failure });
  });
});
