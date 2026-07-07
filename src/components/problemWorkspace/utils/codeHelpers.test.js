import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../services/api', () => ({
  api: {
    learningProblems: { getById: vi.fn() },
    aiProblems: { getById: vi.fn() },
    problems: { checkTestCases: vi.fn() },
  },
}));

vi.mock('../../../utils/core/logger', () => ({
  default: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

import { api } from '../../../services/api';
import { checkTestCases, formatTestCaseResults, getFullCode } from './codeHelpers';

describe('codeHelpers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    window.history.pushState({}, '', '/');
    delete window.__tdMonacoEditor;
  });

  it('returns code unchanged from getFullCode', () => {
    expect(getFullCode('print("hello")')).toBe('print("hello")');
  });

  it('prefers the live Monaco editor value over stale React state', () => {
    window.__tdMonacoEditor = {
      getModel: () => ({
        getValue: () =>
          'class Solution {\n    public int[] solve() {\n        return new int[] {};\n    }\n}',
      }),
    };

    expect(getFullCode('stale-state')).toContain('return new int[] {}');
    expect(getFullCode('stale-state')).not.toBe('stale-state');
  });

  it('uses an explicitly provided editor instance when present', () => {
    const editor = {
      getModel: () => ({
        getValue: () => 'fresh-editor-value',
      }),
    };

    expect(getFullCode('fallback', editor)).toBe('fresh-editor-value');
  });

  it('checks regular problem test cases through the standard endpoint', async () => {
    window.history.pushState({}, '', '/problems/two-sum');
    api.problems.checkTestCases.mockResolvedValue({ testCases: [{ input: '[1,2]' }] });

    const hasTestCases = await checkTestCases('123', 'two-sum');

    expect(api.problems.checkTestCases).toHaveBeenCalledWith('two-sum');
    expect(hasTestCases).toBe(true);
  });

  it('returns false for regular problems without test cases', async () => {
    window.history.pushState({}, '', '/problems/two-sum');
    api.problems.checkTestCases.mockResolvedValue({ testCases: [] });

    const hasTestCases = await checkTestCases('123', 'two-sum');

    expect(hasTestCases).toBe(false);
  });

  it('checks AI problems through the AI endpoint', async () => {
    window.history.pushState({}, '', '/ai-problems/my-generated-problem');
    api.aiProblems.getById.mockResolvedValue({ id: 'ai-problem' });

    const hasTestCases = await checkTestCases('ignored', 'my-generated-problem');

    expect(api.aiProblems.getById).toHaveBeenCalledWith('my-generated-problem');
    expect(hasTestCases).toBe(true);
  });

  it('checks learning problems through the learning endpoint', async () => {
    window.history.pushState({}, '', '/learning/python/problems/intro-arrays');
    api.learningProblems.getById.mockResolvedValue({ id: 'lp-node' });

    const hasTestCases = await checkTestCases('ignored', 'intro-arrays');

    expect(api.learningProblems.getById).toHaveBeenCalledWith('intro-arrays');
    expect(hasTestCases).toBe(true);
  });

  it('returns false when checking test cases throws', async () => {
    window.history.pushState({}, '', '/problems/two-sum');
    api.problems.checkTestCases.mockRejectedValue(new Error('network'));

    const hasTestCases = await checkTestCases('123', 'two-sum');

    expect(hasTestCases).toBe(false);
  });

  it('formats passing test results with performance metrics', () => {
    const output = formatTestCaseResults({
      formatted: {
        testCases: [
          {
            passed: true,
            input: [1, 2],
            expectedOutput: [3],
            actualOutput: [3],
            runtime: '0.5',
            memory: 1024,
          },
          {
            passed: true,
            input: [
              [1, 2],
              [3, 4],
            ],
            expectedOutput: [10],
            actualOutput: [10],
            runtime: '1.0',
            memory: 2048,
          },
        ],
      },
    });

    expect(output).toContain('Test case details:');
    expect(output).toContain('Input: [[1,2],[3,4]]');
    expect(output).toContain('All test cases passed!');
    expect(output).toContain('Total Runtime: 1.500s');
    expect(output).toContain('Peak Memory Usage: 2.00MB');
  });

  it('formats failed test results with compile/runtime/message details', () => {
    const output = formatTestCaseResults({
      testResults: [
        {
          passed: false,
          input: null,
          expectedOutput: 'ok',
          actualOutput: 'bad',
          runtime: '0.2',
          memory: 512,
          compile_output: 'compile failed',
          stderr: 'runtime failed',
          message: 'bad output',
          error: 'AssertionError',
        },
      ],
    });

    expect(output).toContain('Compilation Error:');
    expect(output).toContain('Runtime Error:');
    expect(output).toContain('Message:');
    expect(output).toContain('Error:');
    expect(output).toContain('Some test cases failed.');
  });

  it('returns empty output when no test result payload is present', () => {
    expect(formatTestCaseResults({})).toBe('');
  });
});
