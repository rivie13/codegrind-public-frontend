/**
 * Utilities for handling data formatting in AI Problems components
 */

/**
 * Safely parse JSON string
 * @param {string} jsonString - String to parse as JSON
 * @returns {any} - Parsed object or the original string if parsing fails
 */
export const tryParseJSON = (jsonString) => {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    // If it's not valid JSON, return the raw string
    return jsonString;
  }
};

/**
 * Format an object or value as compact JSON
 * @param {any} value - Value to format
 * @returns {string} - Formatted string
 */
export const formatCompactJSON = (value) => {
  if (value === null || value === undefined) return "null";
  
  if (typeof value === 'object') {
    // Use a custom compact format for arrays and objects
    return JSON.stringify(value);
  }
  return String(value);
};

/**
 * Format an object or value as prettified JSON
 * @param {any} value - Value to format
 * @returns {string} - Prettified JSON string
 */
export const formatPrettyJSON = (value) => {
  try {
    if (typeof value === 'string') {
      // Try to parse the string as JSON first
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } else if (value === null || value === undefined) {
      return "null";
    } else if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  } catch (e) {
    // If parsing fails, return original string
    return String(value);
  }
};

/**
 * Format a value for display in test results
 * @param {any} value - Value to format for display
 * @returns {string} - Formatted string
 */
export const formatDisplayValue = (value) => {
  // Handle null/undefined but explicitly allow 0
  if (value === null || value === undefined) return "n/a";
  
  // Handle arrays
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  
  // Try to parse numeric strings and display them without quotes
  if (typeof value === 'string') {
    // If the string is a valid number, convert and display it as a number
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '') {
      return String(num);
    }
    // Otherwise keep it as a quoted string
    return `"${value}"`;
  }
  
  // Other values (numbers, booleans) just convert to string
  return String(value);
};

/**
 * Unwrap unnecessary array nesting
 * Detects if a value is an array with a single array element and unwraps it
 * Example: [[5,10,15]] becomes [5,10,15]
 * 
 * @param {any} value - Value that might have extra nesting
 * @returns {any} - Unwrapped value
 */
export const unwrapExtraNesting = (value) => {
  // Only process arrays
  if (!Array.isArray(value)) return value;
  
  // If it's an array with exactly one element that's also an array, unwrap it
  if (value.length === 1 && Array.isArray(value[0])) {
    return value[0];
  }
  
  return value;
};

/**
 * Unwrap nesting for all items in an array of test cases
 * Applies unwrapExtraNesting to each test case
 * 
 * @param {Array} testCases - Array of test cases that might have extra nesting
 * @returns {Array} - Array with unwrapped test cases
 */
export const unwrapTestCasesArray = (testCases) => {
  if (!Array.isArray(testCases)) return testCases;
  return testCases.map(tc => unwrapExtraNesting(tc));
};