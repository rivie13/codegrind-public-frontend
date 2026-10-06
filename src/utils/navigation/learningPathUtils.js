/**
 * Shared learning-path identifier normalization.
 *
 * Consolidates the `normalizeLearningPathId` function that was previously
 * duplicated in App.jsx, CityMap.jsx, useGuestProgress.js, and cityStoryState.js.
 */

const LEARNING_PATH_IDS = new Set([
  'python-beginner',
  'javascript-beginner',
  'java-beginner',
  'cpp-beginner',
]);

const LEGACY_PATH_IDS = {
  'python-path': 'python-beginner',
  'javascript-path': 'javascript-beginner',
  'java-path': 'java-beginner',
  'cpp-path': 'cpp-beginner',
};

/**
 * Normalizes a learning-path value to a canonical path ID.
 *
 * Accepts full path IDs ("python-beginner"), short names ("python", "js"),
 * and legacy umbrella IDs ("python-path", kept so in-flight guest progress
 * keeps resolving), and returns the canonical ID or null for unrecognized values.
 *
 * @param {*} value - A learning-path identifier to normalize
 * @returns {string|null} The canonical path ID (e.g. "python-beginner") or null
 */
export const normalizeLearningPathId = (value) => {
  if (!value) return null;

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return null;

  if (LEARNING_PATH_IDS.has(normalized)) return normalized;
  if (LEGACY_PATH_IDS[normalized]) return LEGACY_PATH_IDS[normalized];
  if (normalized === 'python') return 'python-beginner';
  if (normalized === 'javascript' || normalized === 'js') return 'javascript-beginner';
  if (normalized === 'java') return 'java-beginner';
  if (normalized === 'cpp' || normalized === 'c++') return 'cpp-beginner';

  return null;
};
