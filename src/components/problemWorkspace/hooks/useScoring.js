import { useState } from 'react';

/**
 * Custom hook to calculate and manage score for problem submissions
 * 
 * @param {Object} options
 * @param {string} options.difficulty - Problem difficulty (easy, medium, hard)
 * @param {number} options.timer - Time spent in seconds
 * @param {number} options.aiUsageCount - Number of times AI was used
 * @param {number} options.sessionSubmissions - Number of submissions made
 * @param {Array} options.challenges - Array of active challenges
 * @returns {Object} Score calculation state and functions
 */
const useScoring = ({ 
  difficulty, 
  timer, 
  aiUsageCount = 0, 
  sessionSubmissions = 0,
  challenges = []
}) => {
  const [finalScore, setFinalScore] = useState(0);

  /**
   * Calculate AI penalty based on usage count
   * @param {number} count - Number of times AI was used
   * @returns {number} Total penalty
   */
  const calculateAiPenalty = (count) => {
    // Progressive penalty: each use costs more than the last
    // First use: 50 points
    // Second use: 75 points
    // Third use: 100 points
    // and so on...
    let totalPenalty = 0;
    for (let i = 0; i < count; i++) {
      totalPenalty += 50 + (i * 25);
    }
    return Math.min(totalPenalty, 400); // Cap at 400 points to prevent excessive penalties
  };

  /**
   * Get time limit based on problem difficulty
   * @param {string} difficulty - Problem difficulty
   * @returns {number} Time limit in seconds
   */
  const getTimeLimit = (difficulty) => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY':
        return 15 * 60; // 15 minutes in seconds
      case 'MEDIUM':
        return 30 * 60; // 30 minutes in seconds
      case 'HARD':
        return 45 * 60; // 45 minutes in seconds
      default:
        return 15 * 60;
    }
  };

  /**
   * Calculate final score based on all factors
   * @param {Object} params
   * @param {number} params.totalRuntime - Total runtime in seconds
   * @param {number} params.maxMemory - Maximum memory usage in KB
   * @param {boolean} params.isTimeAttack - Whether time attack mode is active
   * @returns {number} The calculated score
   */
  const calculateScore = ({ totalRuntime, maxMemory, isTimeAttack = false }) => {
    const baseScore = 1000;
    
    // Calculate time deduction
    let timeDeduction;
    if (isTimeAttack) {
      // For time attack, deduct based on time spent compared to time limit
      timeDeduction = Math.floor((getTimeLimit(difficulty) - timer) / 60 * 30); // -30 points per minute
    } else {
      // Regular mode, deduct based on total time spent
      timeDeduction = Math.floor(timer / 60 * 30); // -30 points per minute
    }
    
    // Performance deductions
    const runtimeDeduction = Math.floor(parseFloat(totalRuntime) * 100); // -100 points per second
    const memoryDeduction = Math.floor(maxMemory / 1024 * 15); // -15 point per MB
    
    // Submission and AI penalties
    const submissionDeduction = Math.max(0, sessionSubmissions * 50);
    const aiDeduction = calculateAiPenalty(aiUsageCount);
    
    // Challenge bonuses
    const challengeBonuses = {
      autoTimer: 30,
      noAI: 75,
      randomChars: 50,
      matrixBomb: 75,
      timeAttack: 100 // Higher bonus for completing under time pressure
    };
    
    // Sum up the bonuses from active challenges
    const totalChallengeBonus = challenges.reduce((sum, challenge) => 
      sum + (challengeBonuses[challenge] || 0), 0);
    
    // Calculate raw score before bonuses
    const rawScore = Math.max(0,
      baseScore -
      timeDeduction -
      runtimeDeduction -
      memoryDeduction -
      submissionDeduction -
      aiDeduction
    );
    
    // Apply challenge bonus but cap at 1000
    const finalScore = Math.min(1000, Math.floor(rawScore * (1 + totalChallengeBonus / 1000)));
    
    // Update state
    setFinalScore(finalScore);
    
    return {
      finalScore,
      breakdown: {
        baseScore,
        timeDeduction,
        runtimeDeduction,
        memoryDeduction,
        submissionDeduction,
        aiDeduction,
        rawScore,
        totalChallengeBonus
      }
    };
  };
  
  return {
    finalScore,
    setFinalScore,
    calculateScore,
    calculateAiPenalty,
    getTimeLimit
  };
};

export default useScoring; 