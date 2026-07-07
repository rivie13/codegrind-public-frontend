import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../../services/api';
import logger from '../../../utils/core/logger';

const resolveInterviewProblemId = (problemData = {}) => {
  const normalizedSource = String(problemData?.source || '').toUpperCase();

  const candidates =
    normalizedSource === 'LEETCODE'
      ? [
          problemData?.questionId,
          problemData?.metadata?.frontendQuestionId,
          problemData?.questionFrontendId,
          problemData?.displayNumber,
          problemData?.id,
        ]
      : [
          problemData?.id,
          problemData?.questionId,
          problemData?.metadata?.frontendQuestionId,
          problemData?.questionFrontendId,
          problemData?.displayNumber,
        ];

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined) continue;
    const normalized = String(candidate).trim();
    if (normalized) return normalized;
  }

  return null;
};

const resolveScoreProblem = (problemData = {}) => {
  const normalizedSource = String(problemData?.source || '').toUpperCase();
  const normalizedProblemId =
    problemData?.id === null || problemData?.id === undefined
      ? ''
      : String(problemData.id).trim().toLowerCase();
  const isAIProblem =
    normalizedSource === 'AI' ||
    Boolean(problemData?.isAIProblem) ||
    normalizedProblemId.startsWith('ai-') ||
    (typeof problemData?.questionFrontendId === 'string' &&
      problemData.questionFrontendId.startsWith('AI-'));

  if (isAIProblem) {
    const aiProblemId =
      problemData?.id === null || problemData?.id === undefined
        ? null
        : String(problemData.id).trim();

    return {
      isAIProblem: true,
      problemType: 'AI',
      problemId: aiProblemId || null,
    };
  }

  return {
    isAIProblem: false,
    problemType: normalizedSource === 'LEETCODE' ? 'LEETCODE' : 'CODEGRIND',
    problemId: resolveInterviewProblemId(problemData),
  };
};

/**
 * Custom hook to track submission history and high scores
 *
 * @param {Object} options
 * @param {Object} options.user - The current user
 * @param {Object} options.problemData - The current problem data
 * @param {string} options.mode - The current mode (practice, ranked, challenge)
 * @returns {Object} Submission related state and functions
 */
const useSubmissions = ({ user, problemData, mode, onLoadError, onScoreSyncError }) => {
  const [sessionSubmissions, setSessionSubmissions] = useState(0);
  const [highScore, setHighScore] = useState(null);
  const [bestTime, setBestTime] = useState(0);
  const [hasNewHighScore, setHasNewHighScore] = useState(false);
  const [hasNewBestTime, setHasNewBestTime] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const onLoadErrorRef = useRef(onLoadError);
  const onScoreSyncErrorRef = useRef(onScoreSyncError);
  const scoreProblem = useMemo(() => resolveScoreProblem(problemData), [problemData]);

  useEffect(() => {
    onLoadErrorRef.current = onLoadError;
  }, [onLoadError]);

  useEffect(() => {
    onScoreSyncErrorRef.current = onScoreSyncError;
  }, [onScoreSyncError]);

  // Reset session submissions when the problem changes
  useEffect(() => {
    setSessionSubmissions(0);
  }, [
    problemData?.id,
    problemData?.questionId,
    problemData?.questionFrontendId,
    problemData?.titleSlug,
  ]);

  // Fetch high score when user or problem changes
  useEffect(() => {
    const fetchHighScore = async () => {
      try {
        if (!user?.id || !problemData) return;

        if (!scoreProblem.problemId) {
          logger.error('Missing problem ID for score lookup');
          setHighScore(0);
          setBestTime(0);
          return;
        }

        // logger.info('Fetching high score for:');
        // logger.debug({
        //   userId: user.id,
        //   problemId: scoreProblem.problemId,
        //   problemType: scoreProblem.problemType,
        // });

        const scoreData = await api.scores.get(
          user.id,
          scoreProblem.problemId,
          scoreProblem.problemType
        );

        // logger.info('Received score data:');
        // logger.debug(scoreData);
        setHighScore(scoreData.highScore);
        setBestTime(scoreData.bestTime);
      } catch (error) {
        logger.error('Error fetching high score:');
        logger.debug(error);
        onLoadErrorRef.current?.(error);
      }
    };

    fetchHighScore();
  }, [problemData, scoreProblem.problemId, scoreProblem.problemType, user?.id]);

  /**
   * Update score after successful submission
   * @param {number} score - The score to update
   * @param {number} time - Time spent in seconds
   */
  const updateScore = async (score, time) => {
    if (!user?.id || !problemData || (mode !== 'ranked' && mode !== 'challenge')) return;

    try {
      if (!scoreProblem.problemId) {
        logger.error('Missing problem ID for score update');
        return;
      }

      // Call the appropriate API endpoint based on problem type
      const updateData = scoreProblem.isAIProblem
        ? await api.aiProblems.updateScore(user.id, scoreProblem.problemId, score, time)
        : await api.scores.update(
            user.id,
            scoreProblem.problemId,
            score,
            time,
            scoreProblem.problemType
          );

      // Store previous values before updating
      const previousHighScore = highScore;
      const previousBestTime = bestTime;

      // Update state with new values
      setHighScore(updateData.highScore);
      setBestTime(updateData.bestTime);
      setFinalScore(score);
      setTimeSpent(time);

      // Set achievement flags
      setHasNewHighScore(updateData.highScore > previousHighScore || !previousHighScore);
      setHasNewBestTime(time < previousBestTime || !previousBestTime);
    } catch (error) {
      logger.error('Score update error:');
      logger.debug(error.stack);
      onScoreSyncErrorRef.current?.(error);
    }
  };

  return {
    sessionSubmissions,
    setSessionSubmissions,
    highScore,
    bestTime,
    hasNewHighScore,
    hasNewBestTime,
    finalScore,
    setFinalScore,
    timeSpent,
    setTimeSpent,
    updateScore,
  };
};

export default useSubmissions;
