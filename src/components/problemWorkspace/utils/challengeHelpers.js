/**
 * Utility functions for challenge mode operations
 */

/**
 * Navigate to a new problem with a forced refresh to ensure proper state reset
 *
 * @param {string} titleSlug - The title slug of the problem to navigate to
 * @param {Object} state - The navigation state to be passed
 * @param {Function} navigate - React Router's navigate function
 */
export const handleNavigateWithRefresh = (titleSlug, state, navigate) => {
  // Store the navigation state in sessionStorage
  sessionStorage.setItem('navigationState', JSON.stringify(state));

  // Navigate to the new problem
  navigate(`/problems/${titleSlug}`, { state });
};

/**
 * Handle clicking on a challenge problem
 *
 * @param {Object} problem - The problem object
 * @param {Function} onClose - Function to close the current modal
 * @param {Function} setSelectedProblem - Function to set the selected problem
 * @param {Function} setIsChallengeModalOpen - Function to open the challenge modal
 */
export const handleChallengeClick = (
  problem,
  onClose,
  setSelectedProblem,
  setIsChallengeModalOpen
) => {
  onClose();
  setSelectedProblem(problem);
  setIsChallengeModalOpen(true);
};
