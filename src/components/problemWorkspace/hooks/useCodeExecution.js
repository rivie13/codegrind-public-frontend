/**
 * Custom hook to handle code execution
 */

import { useState } from 'react';
import { api, VmStartingError } from '../../../services/api';
import logger from '../../../utils/core/logger';
import { recordClientIssue } from '../../../utils/feedback/clientIssueReporter';
import {
  getUserFacingErrorMessage,
  sanitizeExecutionDisplayText,
} from '../../../utils/ui/userFacingErrors';
import { checkTestCases, formatTestCaseResults } from '../utils/codeHelpers';
import { executeCodeWithTestCasesClient } from '@rivie13/premium-core/compiler';

/**
 * Custom hook for code execution functionality
 *
 * @param {Object} options
 * @param {Function} options.getFullCode - Function to get the current code
 * @param {Object} options.problemData - The current problem data
 * @param {string} options.titleSlug - The problem title slug
 * @param {string} options.language - The programming language
 * @param {string} options.mode - The current mode (practice/challenge)
 * @param {Object} options.user - The current user
 * @returns {Object} Code execution state and functions
 */
const useCodeExecution = ({
  getFullCode,
  problemData,
  titleSlug,
  language,
  mode,
  user,
  onRateLimit,
  onRateLimitUpdate,
  onExecutionError,
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState('');

  const refreshRateLimitStatus = async () => {
    try {
      const response = await api.codeExecution.getRateLimitStatus();
      if (response?.rateLimit && typeof onRateLimitUpdate === 'function') {
        onRateLimitUpdate(response.rateLimit);
      }
      return response?.rateLimit || null;
    } catch {
      return null;
    }
  };

  const formatOutputResults = (testCases, filter = 'stdout') => {
    if (!Array.isArray(testCases) || testCases.length === 0) {
      return 'No output returned from execution.\n';
    }

    let output = '';
    testCases.forEach((testCase, index) => {
      const stdout = (testCase.stdout ?? '').toString();
      const stderr = (testCase.stderr ?? '').toString();
      const compileOutput = (testCase.compile_output ?? '').toString();

      if (filter === 'stdout' || filter === 'both') {
        output += `STDOUT ${index + 1}:\n`;
        output += stdout ? `${stdout}\n` : '(no stdout)\n';
      }

      if (filter === 'stderr' || filter === 'both') {
        const combinedError = [stderr, compileOutput].filter(Boolean).join('\n');
        output += `STDERR ${index + 1}:\n`;
        output += combinedError ? `${combinedError}\n` : '(no stderr)\n';
      }

      output += '------------------\n';
    });

    return sanitizeExecutionDisplayText(output);
  };

  /**
   * Run the code and check against test cases
   */
  const handleRunCode = async () => {
    setIsExecuting(true);
    setExecutionResult('Running test cases...\n');
    try {
      const isAIProblem = window.location.pathname.includes('/ai-problems/');
      const isLearningProblem =
        window.location.pathname.includes('/learning/') &&
        window.location.pathname.includes('/problems/');

      // Fetch test cases and expected outputs
      let testCases = [];
      let metadata = null;
      let expectedOutputs = null;

      if (isLearningProblem) {
        const data = await api.learningProblems.getById(titleSlug);
        testCases = data?.testCases;
        expectedOutputs = data?.expectedOutputs;
        metadata = {
          name: data?.functionName,
          params: data?.functionParams,
          returnType: data?.evaluationMode === 'output' ? 'void' : null,
        };
      } else if (isAIProblem) {
        const data = await api.aiProblems.getById(titleSlug);
        testCases = data?.testCases;
        expectedOutputs = data?.expectedOutputs;
        metadata = {
          name: data?.functionName,
          params: data?.functionParams,
          returnType: null,
        };
      } else {
        const data = await api.problems.checkTestCases(titleSlug);
        testCases = data?.testCases;
        expectedOutputs = data?.expectedOutputs || data?.metaData?.expectedOutputs;
        metadata = {
          name: data?.metaData?.functionName || data?.metaData?.name || 'solution',
          params: data?.metaData?.functionParams || data?.metaData?.params,
          returnType: data?.metaData?.returnType || null,
        };
      }

      if (!testCases || !Array.isArray(testCases)) {
        throw new Error('No test cases found for this problem');
      }

      const formattedTestCases = testCases.map((tc, index) => {
        return {
          input: tc,
          expected: expectedOutputs ? expectedOutputs[index] : (tc.expected ?? tc.expectedOutput ?? null),
          metadata,
        };
      });

      setExecutionResult((prev) => prev + 'Executing code...\n');

      const evalResult = await executeCodeWithTestCasesClient(
        getFullCode(),
        formattedTestCases,
        language
      );

      const response = {
        success: evalResult.success,
        executionTime: evalResult.executionTime,
        memoryUsed: evalResult.memoryUsed,
        testResults: evalResult.results,
        formatted: {
          testCases: evalResult.results,
        },
      };

      const output = formatTestCaseResults(response);
      setExecutionResult(sanitizeExecutionDisplayText(output));
      setIsExecuting(false);
    } catch (error) {
      logger.error('Run code error:', error);
      const message = error?.message || 'We could not run your code right now. Please try again.';
      setExecutionResult(`❌ ${message}\n`);
      onExecutionError?.({ type: 'run', error });
      setIsExecuting(false);
    }
  };

  /**
   * Run code and capture stdout/stderr only
   */
  const handleRunOutput = async (filter = 'stdout') => {
    setIsExecuting(true);
    setExecutionResult('Capturing program output...\n');
    try {
      const isAIProblem = window.location.pathname.includes('/ai-problems/');
      const isLearningProblem =
        window.location.pathname.includes('/learning/') &&
        window.location.pathname.includes('/problems/');

      // Fetch test cases and expected outputs
      let testCases = [];
      let metadata = null;
      let expectedOutputs = null;

      if (isLearningProblem) {
        const data = await api.learningProblems.getById(titleSlug);
        testCases = data?.testCases;
        expectedOutputs = data?.expectedOutputs;
        metadata = {
          name: data?.functionName,
          params: data?.functionParams,
          returnType: data?.evaluationMode === 'output' ? 'void' : null,
        };
      } else if (isAIProblem) {
        const data = await api.aiProblems.getById(titleSlug);
        testCases = data?.testCases;
        expectedOutputs = data?.expectedOutputs;
        metadata = {
          name: data?.functionName,
          params: data?.functionParams,
          returnType: null,
        };
      } else {
        const data = await api.problems.checkTestCases(titleSlug);
        testCases = data?.testCases;
        expectedOutputs = data?.expectedOutputs || data?.metaData?.expectedOutputs;
        metadata = {
          name: data?.metaData?.functionName || data?.metaData?.name || 'solution',
          params: data?.metaData?.functionParams || data?.metaData?.params,
          returnType: data?.metaData?.returnType || null,
        };
      }

      if (!testCases || !Array.isArray(testCases)) {
        throw new Error('No test cases found for this problem');
      }

      const formattedTestCases = testCases.map((tc, index) => {
        return {
          input: tc,
          expected: expectedOutputs ? expectedOutputs[index] : (tc.expected ?? tc.expectedOutput ?? null),
          metadata,
        };
      });

      setExecutionResult((prev) => prev + 'Executing code...\n');

      const evalResult = await executeCodeWithTestCasesClient(
        getFullCode(),
        formattedTestCases,
        language
      );

      const testResults = evalResult.results || [];
      const output = formatOutputResults(testResults, filter);
      setExecutionResult(sanitizeExecutionDisplayText(output));
    } catch (error) {
      logger.error('Run output error:', error);
      const message = error?.message || 'We could not capture program output right now. Please try again.';
      setExecutionResult(`❌ ${message}\n`);
      onExecutionError?.({ type: 'output', error });
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    isExecuting,
    executionResult,
    setExecutionResult,
    handleRunCode,
    handleRunOutput,
    setIsExecuting,
  };
};

export default useCodeExecution;

