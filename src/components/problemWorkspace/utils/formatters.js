/**
 * Utility functions for formatting time and other values
 */

/**
 * Format seconds to mm:ss format
 * @param {number} seconds - The number of seconds to format
 * @returns {string} The formatted time string in mm:ss format
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format seconds to mm:ss format (alternative implementation)
 * @param {number} seconds - The number of seconds to format
 * @returns {string} The formatted time string in mm:ss format
 */
export const formatTimeFromSeconds = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}; 