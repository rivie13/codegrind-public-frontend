/**
 * Utility functions for preventing prompt injection attacks
 */

/**
 * Sanitizes input to prevent prompt injection
 * @param {string} input - The input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeForPrompt = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove only the highest-risk prompt injection patterns while preserving code context
  return input
    .replace(/system:|user:|assistant:|role:|content:/gi, '') // Remove role markers
    .replace(/```/g, '') // Remove code fences but keep code content
    .replace(/`/g, '') // Remove inline backticks but keep content
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .trim();
};

/**
 * Demarcates user input to prevent prompt injection
 * @param {string} input - The input to demarcate
 * @returns {string} - Demarcated input
 */
export const demarcateUserInput = (input) => {
  return `[USER_INPUT_START]\n${input}\n[USER_INPUT_END]`;
};

/**
 * Prepares user input for AI prompts by both sanitizing and demarcating
 * @param {string} input - The input to prepare
 * @returns {string} - Prepared input safe for AI prompts
 */
export const prepareForPrompt = (input) => {
  const sanitized = sanitizeForPrompt(input);
  return demarcateUserInput(sanitized);
};

export default {
  sanitizeForPrompt,
  demarcateUserInput,
  prepareForPrompt
}; 