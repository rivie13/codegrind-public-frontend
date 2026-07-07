import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCheckTestCases = vi.hoisted(() => vi.fn());
const mockExecuteCodeWithTestCasesClient = vi.hoisted(() => vi.fn());
const mockFormatTestCaseResults = vi.hoisted(() => vi.fn());

const loadHook = async ({
  path = '/problems/two-sum',
  testCasesData = {
    testCases: [{ input: '1,2', expected: '[0,1]' }],
    metaData: { name: 'twoSum', params: [{ name: 'nums' }, { name: 'target' }] },
  },
} = {}) => {
  vi.resetModules();
  window.history.pushState({}, '', path);

  const getRateLimitStatus = vi.fn().mockResolvedValue({
    rateLimit: { unlimited: true },
  });

  mockCheckTestCases.mockResolvedValue(testCasesData);
  mockExecuteCodeWithTestCasesClient.mockResolvedValue({
    success: true,
    executionTime: 12,
    memoryUsed: 1024,
    results: [{ passed: true, stdout: 'ok' }],
  });
  mockFormatTestCaseResults.mockReturnValue('formatted-output');

  vi.doMock('../../../services/api', () => ({
    api: {
      codeExecution: { getRateLimitStatus },
      problems: { checkTestCases: mockCheckTestCases },
      aiProblems: { getById: vi.fn() },
      learningProblems: { getById: vi.fn() },
    },
    VmStartingError: class VmStartingError extends Error {},
  }));

  vi.doMock('../../../utils/core/logger', () => ({
    default: {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  }));

  vi.doMock('../../../utils/feedback/clientIssueReporter', () => ({
    recordClientIssue: vi.fn(),
  }));

  vi.doMock('../../../utils/ui/userFacingErrors', () => ({
    getUserFacingErrorMessage: vi.fn((e) => e?.message || 'Unknown error'),
    sanitizeExecutionDisplayText: vi.fn((t) => t),
  }));

  vi.doMock('../utils/codeHelpers', () => ({
    checkTestCases: vi.fn().mockResolvedValue(true),
    formatTestCaseResults: mockFormatTestCaseResults,
  }));

  vi.doMock('@rivie13/premium-core/compiler', () => ({
    executeCodeWithTestCasesClient: mockExecuteCodeWithTestCasesClient,
  }));

  const mod = await import('./useCodeExecution');
  const onRateLimit = vi.fn();
  const onRateLimitUpdate = vi.fn();
  const onExecutionError = vi.fn();

  const hook = renderHook(() =>
    mod.default({
      getFullCode: () => 'print(1)',
      problemData: {
        questionId: 'q1',
        title: 'Two Sum',
        metaData: { source: 'leetcode' },
        difficulty: 'EASY',
      },
      titleSlug: 'two-sum',
      language: 'Python',
      mode: 'practice',
      user: { id: 42 },
      onRateLimit,
      onRateLimitUpdate,
      onExecutionError,
    })
  );

  return {
    hook,
    onRateLimit,
    onRateLimitUpdate,
    onExecutionError,
    getRateLimitStatus,
  };
};

describe('useCodeExecution', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('runs standard problem code via client-side evaluator and formats results', async () => {
    const { hook } = await loadHook();

    await act(async () => {
      await hook.result.current.handleRunCode();
    });

    expect(mockCheckTestCases).toHaveBeenCalledWith('two-sum');
    expect(mockExecuteCodeWithTestCasesClient).toHaveBeenCalledWith(
      'print(1)',
      expect.any(Array),
      'Python'
    );
    expect(mockFormatTestCaseResults).toHaveBeenCalled();
    expect(hook.result.current.executionResult).toBe('formatted-output');
    expect(hook.result.current.isExecuting).toBe(false);
  });

  it('shows error when no test cases are found', async () => {
    mockCheckTestCases.mockResolvedValue({ testCases: null, metaData: null });

    const { hook } = await loadHook({
      testCasesData: { testCases: null, metaData: null },
    });

    await act(async () => {
      await hook.result.current.handleRunCode();
    });

    expect(hook.result.current.executionResult).toContain('No test cases found');
    expect(hook.result.current.isExecuting).toBe(false);
  });

  it('notifies the UI when client-side execution fails', async () => {
    const { hook, onExecutionError } = await loadHook();

    // Set rejection AFTER loadHook so it isn't overridden by loadHook's default
    mockExecuteCodeWithTestCasesClient.mockRejectedValue(new Error('sandbox crashed'));

    await act(async () => {
      await hook.result.current.handleRunCode();
    });

    expect(hook.result.current.executionResult).toContain('sandbox crashed');
    expect(onExecutionError).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'run', error: expect.any(Error) })
    );
  });

  it('captures stderr-only output for AI problems', async () => {
    const mockGetById = vi.fn().mockResolvedValue({
      testCases: [{ input: '1', expected: '2' }],
      expectedOutputs: ['2'],
      functionName: 'solve',
      functionParams: [{ name: 'x' }],
    });

    const { hook } = await loadHook({
      path: '/ai-problems/two-sum',
    });

    // Override the AI problems mock for this test
    const apiMod = await import('../../../services/api');
    apiMod.api.aiProblems.getById = mockGetById;

    mockExecuteCodeWithTestCasesClient.mockResolvedValue({
      success: false,
      results: [
        {
          stdout: 'hello',
          stderr: 'runtime blew up',
          compile_output: 'compile warning',
        },
      ],
    });

    await act(async () => {
      await hook.result.current.handleRunOutput('stderr');
    });

    expect(hook.result.current.executionResult).toContain('STDERR 1:');
    expect(hook.result.current.executionResult).toContain('runtime blew up');
  });

  it('notifies the UI when output capture fails', async () => {
    const { hook, onExecutionError } = await loadHook();

    // Set rejection AFTER loadHook so it isn't overridden by loadHook's default
    mockExecuteCodeWithTestCasesClient.mockRejectedValue(new Error('stdout unavailable'));

    await act(async () => {
      await hook.result.current.handleRunOutput('stdout');
    });

    expect(hook.result.current.executionResult).toContain('stdout unavailable');
    expect(onExecutionError).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'output', error: expect.any(Error) })
    );
  });
});

