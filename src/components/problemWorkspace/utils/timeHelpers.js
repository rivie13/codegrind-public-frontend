/**
 * Utility functions for time-related operations in the problem workspace
 */

/**
 * Get the time limit in seconds based on problem difficulty
 * @param {string} difficulty - The problem difficulty (EASY, MEDIUM, HARD)
 * @returns {number} The time limit in seconds
 */
export const getTimeLimit = (difficulty) => {
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
 * Calculate the penalty for using the AI assistant
 * Progressive penalty: each use costs more than the last
 * First use: 50 points
 * Second use: 75 points
 * Third use: 100 points
 * and so on...
 * 
 * @param {number} usageCount - Number of times the AI has been used
 * @returns {number} The total penalty points
 */
export const calculateAiPenalty = (usageCount) => {
  let totalPenalty = 0;
  for (let i = 0; i < usageCount; i++) {
    totalPenalty += 50 + (i * 25);
  }
  return Math.min(totalPenalty, 400); // Cap at 400 points to prevent excessive penalties
}; 