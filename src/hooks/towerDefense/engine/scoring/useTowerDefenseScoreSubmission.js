import { useCallback } from 'react';
import { api } from '../../../../services/api';

export default function useTowerDefenseScoreSubmission({
  getTowerDefenseProblemId,
  codeSubmissionSuccess,
  problemSource,
  shouldSubmitScores = true,
  scoreSubmittedRef,
  endlessScoreSubmittedRef,
  onScoreSyncError,
}) {
  const resolveProblemType = useCallback(() => {
    if (problemSource === 'AI') return 'AI';
    if (problemSource === 'LEARNING') return 'LEARNING';
    if (problemSource === 'LEETCODE') return 'LEETCODE';
    return 'CODEGRIND';
  }, [problemSource]);

  const submitTowerDefenseWin = useCallback(
    async (finalScore, finalTimeSeconds, extra = {}) => {
      if (!shouldSubmitScores) return null;
      if (scoreSubmittedRef.current) return;

      const userIdString = localStorage.getItem('user_id');
      const userId = userIdString ? parseInt(userIdString, 10) : null;
      const problemId = getTowerDefenseProblemId();

      if (!problemId) return;

      scoreSubmittedRef.current = true;

      try {
        const resolvedProblemType = resolveProblemType();

        const response = await api.towerDefense.submitScore(
          userId,
          problemId,
          codeSubmissionSuccess === true,
          true,
          finalScore,
          finalTimeSeconds,
          resolvedProblemType,
          extra
        );
        return response;
      } catch (error) {
        scoreSubmittedRef.current = false;
        console.error('[TowerDefenseV2] Failed to submit win score:', error);
        onScoreSyncError?.({ mode: 'win', error });
      }
      return null;
    },
    [
      codeSubmissionSuccess,
      getTowerDefenseProblemId,
      onScoreSyncError,
      resolveProblemType,
      shouldSubmitScores,
      scoreSubmittedRef,
    ]
  );

  const submitTowerDefenseEndless = useCallback(
    async (payload) => {
      if (!shouldSubmitScores) return null;
      if (endlessScoreSubmittedRef.current) return;

      const userIdString = localStorage.getItem('user_id');
      const userId = userIdString ? parseInt(userIdString, 10) : null;
      const problemId = getTowerDefenseProblemId();

      const {
        finalScore = 0,
        finalTimeSeconds = 0,
        endlessScore = 0,
        endlessWaves = 0,
        endlessSurvivalTime = 0,
      } = payload || {};

      if (!problemId) return;

      endlessScoreSubmittedRef.current = true;

      try {
        const resolvedProblemType = resolveProblemType();

        const response = await api.towerDefense.submitScore(
          userId,
          problemId,
          codeSubmissionSuccess === true,
          false,
          finalScore,
          finalTimeSeconds,
          resolvedProblemType,
          {
            endlessScore,
            endlessWaves,
            endlessSurvivalTime,
          }
        );
        return response;
      } catch (error) {
        endlessScoreSubmittedRef.current = false;
        console.error('[TowerDefenseV2] Failed to submit endless score:', error);
        onScoreSyncError?.({ mode: 'endless', error });
      }
      return null;
    },
    [
      codeSubmissionSuccess,
      endlessScoreSubmittedRef,
      getTowerDefenseProblemId,
      onScoreSyncError,
      resolveProblemType,
      shouldSubmitScores,
    ]
  );

  return {
    submitTowerDefenseWin,
    submitTowerDefenseEndless,
  };
}
