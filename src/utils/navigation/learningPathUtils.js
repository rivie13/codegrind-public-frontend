/**
 * Shared learning-path identifier normalization.
 *
 * Consolidates the `normalizeLearningPathId` function that was previously
 * duplicated in App.jsx, CityMap.jsx, useGuestProgress.js, and cityStoryState.js.
 */

const LEARNING_PATH_IDS = new Set(['python-path', 'javascript-path', 'java-path']);

/**
 * Normalizes a learning-path value to a canonical path ID.
 *
 * Accepts full path IDs ("python-path"), short names ("python", "js"),
 * and returns the canonical ID or null for unrecognized values.
 *
 * @param {*} value - A learning-path identifier to normalize
 * @returns {string|null} The canonical path ID (e.g. "python-path") or null
 */
export const normalizeLearningPathId = (value) => {
  if (!value) return null;

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return null;

  if (LEARNING_PATH_IDS.has(normalized)) return normalized;
  if (normalized === 'python') return 'python-path';
  if (normalized === 'javascript' || normalized === 'js') return 'javascript-path';
  if (normalized === 'java') return 'java-path';

  return null;
};
