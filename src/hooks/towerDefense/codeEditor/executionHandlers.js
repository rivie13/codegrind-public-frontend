import { api, VmStartingError } from '../../../services/api';
import { recordClientIssue } from '../../../utils/feedback/clientIssueReporter';
import {
  getUserFacingErrorMessage,
  sanitizeExecutionDisplayText,
} from '../../../utils/ui/userFacingErrors';
import { executeCodeWithTestCasesClient } from '@rivie13/premium-core/compiler';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const fetchExecutionRateLimit = async () => {
  try {
    const status = await api.codeExecution.getRateLimitStatus();
    return status?.rateLimit || null;
  } catch {
    return null;
  }
};

const isExecutionLimitExhausted = (rateLimit) => {
  if (!rateLimit || rateLimit.unlimited) return false;
  const remaining = rateLimit.totalRemaining ?? rateLimit.remaining ?? 0;
  return remaining <= 0;
};

const buildExecutionLimitPayload = (rateLimit) => {
  const cooldownRemaining = rateLimit?.adCooldownRemaining || 0;
  const message =
    cooldownRemaining > 0
      ? `Execution ad cooldown active. Please wait ${Math.ceil(cooldownRemaining / 60)}m before watching another ad.`
      : 'Rate limit reached. Watch an ad to unlock more executions.';
  return {
    error_code: 'CODE_EXECUTION_RATE_LIMIT',
    showAd: false,
    message,
    rateLimit,
  };
};

const startWaitTimers = (addTerminalMessage) => {
  const waitTimers = [];
  let elapsedTime = 0;
  const waitInterval = setInterval(() => {
    if (!addTerminalMessage) return;
    elapsedTime += 10;
    if (elapsedTime === 10) {
      addTerminalMessage(
        '⏳ Request is taking longer than expected. Environment may be starting up... (10s)'
      );
    } else {
      addTerminalMessage(
        `⏳ Still waiting for environment to respond... (${elapsedTime}s elapsed)`
      );
    }
  }, 10000);
  waitTimers.push(waitInterval);
  return waitTimers;
};

const clearWaitTimers = (waitTimers) => {
  waitTimers.forEach((timer) => {
    clearTimeout(timer);
    clearInterval(timer);
  });
};

const fetchAndFormatTestCases = async (problem, titleSlug) => {
  const isLearningProblem =
    problem.isLearningProblem ||
    problem.problemType === 'LEARNING' ||
    problem.source === 'LEARNING';
  const isAIProblem = !isLearningProblem && (problem.isAIProblem || problem.source === 'AI');

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

  return testCases.map((tc, index) => {
    return {
      input: tc,
      expected: expectedOutputs ? expectedOutputs[index] : (tc.expected ?? tc.expectedOutput ?? null),
      metadata,
    };
  });
};

export const submitSolutionRequest = async ({
  code,
  language,
  problem,
  userId,
  timerValue,
  addTerminalMessage,
  onExecutionRateLimit,
}) => {
  const preflightRateLimit = await fetchExecutionRateLimit();
  if (isExecutionLimitExhausted(preflightRateLimit)) {
    const payload = buildExecutionLimitPayload(preflightRateLimit);
    if (addTerminalMessage) {
      addTerminalMessage(`[LIMIT] ${payload.message}`);
    }
    if (typeof onExecutionRateLimit === 'function') {
      onExecutionRateLimit(payload);
    }
    return { status: 'rate_limited', success: false, response: null, apiError: null };
  }

  try {
    const isLearningProblem =
      problem.isLearningProblem ||
      problem.problemType === 'LEARNING' ||
      problem.source === 'LEARNING';
    const isAIProblem = !isLearningProblem && (problem.isAIProblem || problem.source === 'AI');

    if (addTerminalMessage) {
      const label = isLearningProblem ? 'Learning' : isAIProblem ? 'AI' : 'Interview';
      addTerminalMessage(`[VERIFICATION] Processing ${label} problem client-side...`);
    }

    const formattedTestCases = await fetchAndFormatTestCases(problem, problem.titleSlug);
    
    if (addTerminalMessage) {
      addTerminalMessage('[SYSTEM] Executing code in browser sandbox...');
    }

    const evalResult = await executeCodeWithTestCasesClient(
      code,
      formattedTestCases,
      language
    );

    const payload = {
      problemId: isAIProblem || isLearningProblem ? problem.titleSlug : (problem.id || problem.questionId),
      code,
      language: language.toLowerCase(),
      status: evalResult.success ? 'accepted' : 'failed',
      executionTime: evalResult.executionTime,
      memoryUsed: evalResult.memoryUsed || 0,
      difficulty: problem?.difficulty || 'easy',
      mode: 'freeplay',
      newTime: timerValue || 0,
      aiUsageCount: 0,
    };

    if (addTerminalMessage) {
      addTerminalMessage('[SYSTEM] Syncing results and scores with backend...');
    }

    const submitResponse = userId
      ? await api.problems.submitSolution(payload)
      : await api.problems.submitGuestSolution(payload);

    const response = {
      ...submitResponse,
      testResults: evalResult.results,
      formatted: {
        testCases: evalResult.results.map((result) => ({
          input: result.input,
          expectedOutput: result.expectedOutput,
          actualOutput: result.actualOutput,
          passed: result.passed,
          error: result.error,
          stdout: result.stdout,
          stderr: result.stderr,
        })),
      },
    };

    return { status: 'ok', success: evalResult.success, response, apiError: null };
  } catch (error) {
    const message = getUserFacingErrorMessage(
      error,
      'We could not verify your code right now. Please try again.'
    );
    recordClientIssue({
      title: 'Tower defense verification failed',
      description: message,
      source: 'tower-defense.verify-code',
      error,
    });
    if (addTerminalMessage) {
      addTerminalMessage(`[ERROR] Verification error: ${message}`);
    }
    const response = {
      success: false,
      message,
      formatted: { testCases: [{ passed: false, error: message }] },
    };
    return { status: 'error', success: false, response, apiError: error };
  }
};

export const runCodeTestsRequest = async ({
  code,
  language,
  problem,
  userId,
  addTerminalMessage,
  onExecutionRateLimit,
}) => {
  const preflightRateLimit = await fetchExecutionRateLimit();
  if (isExecutionLimitExhausted(preflightRateLimit)) {
    const payload = buildExecutionLimitPayload(preflightRateLimit);
    if (addTerminalMessage) {
      addTerminalMessage(`[LIMIT] ${payload.message}`);
    }
    if (typeof onExecutionRateLimit === 'function') {
      onExecutionRateLimit(payload);
    }
    return { status: 'rate_limited', success: false, response: null, apiError: null };
  }

  try {
    const formattedTestCases = await fetchAndFormatTestCases(problem, problem.titleSlug);

    if (addTerminalMessage) {
      addTerminalMessage('[SYSTEM] Executing code in browser sandbox...');
    }

    const evalResult = await executeCodeWithTestCasesClient(
      code,
      formattedTestCases,
      language
    );

    const response = {
      success: evalResult.success,
      testResults: evalResult.results,
      formatted: {
        testCases: evalResult.results.map((result) => ({
          input: result.input,
          expectedOutput: result.expectedOutput,
          actualOutput: result.actualOutput,
          passed: result.passed,
          error: result.error,
          stdout: result.stdout,
          stderr: result.stderr,
        })),
      },
    };

    return { status: 'ok', success: evalResult.success, response, apiError: null };
  } catch (error) {
    const message = getUserFacingErrorMessage(
      error,
      'We could not execute tests right now. Please try again.'
    );
    if (addTerminalMessage) {
      addTerminalMessage(`[ERROR] Test runner error: ${message}`);
    }
    const response = {
      success: false,
      message,
      formatted: { testCases: [{ passed: false, error: message }] },
    };
    return { status: 'error', success: false, response, apiError: error };
  }
};

export const runCodeOutputRequest = async ({
  code,
  language,
  problem,
  userId,
  addTerminalMessage,
  onExecutionRateLimit,
}) => {
  const preflightRateLimit = await fetchExecutionRateLimit();
  if (isExecutionLimitExhausted(preflightRateLimit)) {
    const payload = buildExecutionLimitPayload(preflightRateLimit);
    if (addTerminalMessage) {
      addTerminalMessage(`[LIMIT] ${payload.message}`);
    }
    if (typeof onExecutionRateLimit === 'function') {
      onExecutionRateLimit(payload);
    }
    return { status: 'rate_limited', success: false, response: null, apiError: null };
  }

  try {
    const formattedTestCases = await fetchAndFormatTestCases(problem, problem.titleSlug);

    if (addTerminalMessage) {
      addTerminalMessage('[SYSTEM] Capturing stdout/stderr client-side...');
    }

    const evalResult = await executeCodeWithTestCasesClient(
      code,
      formattedTestCases,
      language
    );

    const response = {
      success: evalResult.success,
      testResults: evalResult.results,
      formatted: {
        testCases: evalResult.results.map((result) => ({
          input: result.input,
          expectedOutput: result.expectedOutput,
          actualOutput: result.actualOutput,
          passed: result.passed,
          error: result.error,
          stdout: result.stdout,
          stderr: result.stderr,
        })),
      },
    };

    return { status: 'ok', success: true, response, apiError: null };
  } catch (error) {
    const message = getUserFacingErrorMessage(
      error,
      'We could not capture output right now. Please try again.'
    );
    if (addTerminalMessage) {
      addTerminalMessage(`[ERROR] Output capture error: ${message}`);
    }
    const response = {
      success: false,
      message,
      formatted: { testCases: [] },
    };
    return { status: 'error', success: false, response, apiError: error };
  }
};

