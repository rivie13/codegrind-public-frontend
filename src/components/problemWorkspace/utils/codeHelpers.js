/**
 * Utility functions for code-related operations
 */

import { api } from '../../../services/api';
import logger from '../../../utils/core/logger';

/**
 * Get the full code for execution or submission
 *
 * @param {string} code - The current code in the editor
 * @param {object|null} editor - Monaco editor instance when available
 * @returns {string} The code to be executed or submitted
 */
export const getFullCode = (code, editor = null) => {
  const editorInstance = editor || (typeof window !== 'undefined' ? window.__tdMonacoEditor : null);

  const liveEditorValue = editorInstance?.getModel?.()?.getValue?.();
  if (typeof liveEditorValue === 'string') {
    return liveEditorValue;
  }

  return typeof code === 'string' ? code : '';
};

/**
 * Check if test cases exist for a problem
 *
 * @param {string} problemId - The problem ID
 * @param {string} titleSlug - The title slug of the problem
 * @returns {Promise<boolean>} Whether test cases exist for the problem
 */
export const checkTestCases = async (problemId, titleSlug) => {
  // logger.info('Checking test cases for:');
  // logger.debug({ problemId, titleSlug });

  // Determine if we're looking at an AI problem or learning problem
  const isAIProblem = window.location.pathname.includes('/ai-problems/');
  const isLearningProblem =
    window.location.pathname.includes('/learning/') &&
    window.location.pathname.includes('/problems/');

  try {
    // Use the appropriate API endpoint based on problem type
    const data = isLearningProblem
      ? await api.learningProblems.getById(titleSlug)
      : isAIProblem
        ? await api.aiProblems.getById(titleSlug) // For AI problems, just check if the problem exists
        : await api.problems.checkTestCases(titleSlug);

    // logger.info('Test cases response:');
    //logger.debug(data);

    // For AI problems, we assume they always have test cases if they exist
    const hasTestCases =
      isAIProblem || isLearningProblem ? !!data : data.testCases && data.testCases.length > 0;

    // logger.info('Has test cases:');
    // logger.debug(hasTestCases);
    return hasTestCases;
  } catch (error) {
    logger.error('Error checking test cases:');
    logger.debug(error);
    return false;
  }
};

/**
 * Format arrays properly for display, handling nested arrays and special cases
 *
 * @param {any} arr - The array or value to format
 * @returns {string} Formatted string representation
 */
const formatArray = (arr) => {
  if (arr === null || arr === undefined) return 'null';
  if (!Array.isArray(arr)) return JSON.stringify(arr);

  // Handle empty arrays
  if (arr.length === 0) return '[]';

  // Handle nested arrays
  if (Array.isArray(arr[0])) {
    return `[${arr
      .map((subArr) => (Array.isArray(subArr) ? `[${subArr.join(',')}]` : subArr))
      .join(',')}]`;
  }

  // Handle flat arrays
  return `[${arr.join(',')}]`;
};

export const getUserStdout = (stdout) => {
  if (!stdout) return '';
  const lines = String(stdout).split(/\r?\n/);
  while (lines.length > 0 && !lines[lines.length - 1].trim()) {
    lines.pop();
  }
  if (lines.length === 0) return '';
  const lastLine = lines[lines.length - 1].trim();
  try {
    JSON.parse(lastLine);
    lines.pop();
  } catch (e) {
    // Keep it if not valid JSON
  }
  return lines.join('\n').trim();
};

/**
 * Format test case results into readable output
 *
 * @param {Object} response - The API response from running the code
 * @returns {string} Formatted output for display
 */
export const formatTestCaseResults = (response) => {
  let output = '';

  // Determine which structure to use - support both LeetCode and AI problems formats
  const testCases = response.formatted?.testCases || response.testResults;

  if (testCases) {
    testCases.forEach((testCase, index) => {
      output += `Test case details:\n`;
      output += testCase.passed ? '✅ Test Case Passed ✅\n' : '❌ Test Case Failed ❌\n';
      output += `Input: ${formatArray(testCase.input)}\n`;
      output += `Expected Output: ${formatArray(testCase.expectedOutput)}\n`;
      output += `Actual Output: ${formatArray(testCase.actualOutput)}\n`;
      output += `Runtime: ${parseFloat(testCase.runtime).toFixed(2)}s\n`;
      output += `Memory Used: ${(testCase.memory / 1024).toFixed(2)}MB\n`;

      const userStdout = getUserStdout(testCase.stdout);
      if (userStdout) {
        output += `Stdout:\n${userStdout}\n`;
      }

      // If test case failed, show error information
      if (!testCase.passed) {
        if (testCase.compile_output) {
          output += `Compilation Error:\n${testCase.compile_output}\n`;
        }
        if (testCase.stderr) {
          output += `Runtime Error:\n${testCase.stderr}\n`;
        }
        if (testCase.message) {
          output += `Message:\n${testCase.message}\n`;
        }
        if (testCase.error) {
          output += `Error:\n${testCase.error}\n`;
        }
      }
      output += `------------------\n`;
    });

    // Check if all test cases passed
    const allTestsPassed = testCases.every((testCase) => testCase.passed);

    if (allTestsPassed) {
      // Calculate and show performance metrics only if all tests passed
      const totalRuntime = testCases
        .reduce((sum, testCase) => sum + parseFloat(testCase.runtime || 0), 0)
        .toFixed(3);

      const maxMemory = Math.max(...testCases.map((testCase) => testCase.memory || 0));

      output += '\nAll test cases passed! 🎉\n';
      output += '\nPerformance Details:\n';
      output += '===================\n';
      output += `Total Runtime: ${totalRuntime}s\n`;
      output += `Peak Memory Usage: ${(maxMemory / 1024).toFixed(2)}MB\n`;

      // Add a new line to the output
      output += '\n\n\n';
    } else {
      output += '\nSome test cases failed. Please fix the errors and try again.\n\n\n';
    }
  }

  return output;
};
