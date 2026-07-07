/**
 * Custom hook to manage challenge state
 */

import { useEffect, useState } from 'react';
import logger from '../../../utils/core/logger';
import { getTimeLimit } from '../utils/timeHelpers';

/**
 * Custom hook for managing challenge state
 * 
 * @param {Object} options
 * @param {Object} options.location - React Router location object
 * @param {Object} options.problemData - Current problem data
 * @param {Function} options.setMatrixBombActive - Function to set matrix bomb state
 * @param {Function} options.setShouldAddRandomChars - Function to set random chars state
 * @param {Function} options.setFreshTimer - Function to reset the timer
 * @param {Function} options.startTimer - Function to start the timer
 * @param {Function} options.stopTimer - Function to stop the timer
 * @param {number} options.timer - Current timer value
 * @param {Function} options.setExecutionResult - Function to set execution result
 * @returns {Object} Challenge state and functions
 */
const useChallengeState = ({
  challenges = [],
  mode = 'practice',
  problemData,
  setMatrixBombActive,
  setShouldAddRandomChars,
  setFreshTimer,
  startTimer,
  stopTimer,
  timer,
  setExecutionResult
}) => {
  // Initialize with default state
  const [challengeState, setChallengeState] = useState({
    isTimerRunning: false,
    isAIDisabled: false,
    hasRandomChars: false,
    hasMatrixBomb: false,
    isTimeAttack: false,
    isAutoTimer: false
  });

  // Create a stable dependency key for challenges array
  const challengesKey = challenges.join(',');

  // Initialize challenge state based on challenges array and mode
  useEffect(() => {
    // logger.info('Mode:');
    // logger.debug(mode);
    // logger.info('Challenges:');
    // logger.debug(challenges);
    
    // Initialize challenge state if in challenge mode
    if (mode === 'challenge') {
      // Set challenge state
      setChallengeState({
        isTimerRunning: challenges.includes('autoTimer'),
        isAIDisabled: challenges.includes('noAI'),
        hasRandomChars: challenges.includes('randomChars'),
        hasMatrixBomb: challenges.includes('matrixBomb'),
        isTimeAttack: challenges.includes('timeAttack'),
        isAutoTimer: challenges.includes('autoTimer')
      });

      // Explicitly set matrix bomb state
      if (challenges.includes('matrixBomb')) {
        setMatrixBombActive?.(true);
      } else {
        setMatrixBombActive?.(false);
      }

      // Only start timer if autoTimer challenge is enabled
      if (challenges.includes('autoTimer')) {
        logger.info('Auto-starting timer for challenge mode');
        startTimer?.();
      }
    }
  }, [challengesKey, mode, setMatrixBombActive, startTimer]);

  // Handle time attack initialization
  useEffect(() => {
    if (challenges.includes('timeAttack') && problemData && setFreshTimer && startTimer) {
      const timeLimit = getTimeLimit(problemData?.difficulty);
      setChallengeState(prev => ({ ...prev, isTimeAttack: true }));
      // Set the timer limit with countdown mode
      setFreshTimer(timeLimit, true);
      // Auto start the timer
      startTimer();
    }
  }, [challengesKey, problemData, setFreshTimer, startTimer]);

  // Handle time attack failure check
  useEffect(() => {
    if (challengeState.isTimeAttack && timer <= 0 && stopTimer && setFreshTimer) {
      // Time's up - stop the timer
      stopTimer();
      
      // Only set execution result if the function is available
      setExecutionResult?.('Time Attack: Time\'s up! Try again.');
      
      // Reset timer to initial time limit
      const timeLimit = getTimeLimit(problemData?.difficulty);
      setFreshTimer(timeLimit, true);
    }
  }, [timer, challengeState.isTimeAttack, problemData, stopTimer, setExecutionResult, setFreshTimer]);

  // Handle random characters
  useEffect(() => {
    if (!setShouldAddRandomChars) return;
    
    if (challengeState.hasRandomChars) {
      setShouldAddRandomChars(true);
    }
    return () => setShouldAddRandomChars(false);
  }, [challengeState.hasRandomChars, setShouldAddRandomChars]);

  return {
    challengeState,
    setChallengeState
  };
};

export default useChallengeState; 